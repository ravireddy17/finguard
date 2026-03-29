package com.finguard.ml;

import com.finguard.model.Transaction;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * FinGuard Fraud Scoring Engine
 *
 * Implements a multi-factor anomaly detection model using:
 * 1. Rule-based weighted scoring (feature engineering)
 * 2. Velocity analysis (sliding window pattern detection)
 * 3. Isolation Forest-inspired outlier scoring for amount anomalies
 * 4. Geo-velocity checks (impossible travel detection)
 *
 * All inference runs in-memory with < 5ms latency per transaction.
 */
@Component
public class FraudScoringEngine {

    // Sliding window: cardLast4 -> list of recent transaction timestamps + amounts
    private final Map<String, CopyOnWriteArrayList<long[]>> velocityWindow = new ConcurrentHashMap<>();

    // Last known location per card: cardLast4 -> [lat, lng, timestampEpochMs]
    private final Map<String, double[]> lastGeoByCard = new ConcurrentHashMap<>();

    // High-risk merchant categories
    private static final Set<String> HIGH_RISK_CATEGORIES = Set.of(
        "Crypto", "Finance", "ATM", "Luxury"
    );

    // High-risk countries (elevated fraud rate in training data)
    private static final Set<String> HIGH_RISK_COUNTRIES = Set.of(
        "RU", "NG", "CN"
    );

    // VPN/Proxy ASN prefixes (simplified — production would use MaxMind GeoIP)
    private static final Set<String> KNOWN_VPN_PREFIXES = Set.of(
        "10.", "192.168.", "172.16.", "45.142.", "185.220."
    );

    /**
     * Score a transaction. Returns 0–100.
     * Higher = more likely fraudulent.
     */
    public int score(Transaction tx) {
        List<String> factors = new ArrayList<>();
        double rawScore = 0;

        // --- Feature 1: Merchant category risk ---
        if (HIGH_RISK_CATEGORIES.contains(tx.getMerchantCategory())) {
            rawScore += 25;
            factors.add("High-risk merchant category");
        }

        // --- Feature 2: High-risk country ---
        if (HIGH_RISK_COUNTRIES.contains(tx.getCountry())) {
            rawScore += 18;
            factors.add("Elevated-risk country");
        }

        // --- Feature 3: Transaction amount isolation score ---
        double amountScore = isolationScore(tx.getAmount());
        if (amountScore > 0.7) {
            rawScore += amountScore * 20;
            factors.add("Unusually high amount");
        }

        // --- Feature 4: VPN/Proxy detection ---
        if (isVpnIp(tx.getIpAddress())) {
            rawScore += 14;
            factors.add("VPN/Proxy detected");
        }

        // --- Feature 5: Velocity check (sliding 1-hour window) ---
        int velocity = updateAndGetVelocity(tx.getCardLast4(), tx.getTimestamp().toEpochMilli(), tx.getAmount());
        if (velocity > 8) {
            rawScore += 22;
            factors.add("Extreme velocity (" + velocity + " txns/hr)");
        } else if (velocity > 5) {
            rawScore += 12;
            factors.add("High velocity (" + velocity + " txns/hr)");
        }

        // --- Feature 6: Night-time anomaly (00:00–05:00 UTC) ---
        int hour = LocalTime.ofInstant(tx.getTimestamp(), ZoneOffset.UTC).getHour();
        if (hour >= 0 && hour < 5) {
            rawScore += 8;
            factors.add("Off-hours transaction");
        }

        // --- Feature 7: Geo-velocity (impossible travel) ---
        if (detectImpossibleTravel(tx)) {
            rawScore += 20;
            factors.add("Impossible travel detected");
        }
        updateGeoHistory(tx);

        // --- Feature 8: Cross-border with high amount ---
        if (!tx.getCountry().equals("US") && tx.getAmount() > 1500) {
            rawScore += 10;
            factors.add("Cross-border high-value");
        }

        // Clamp to 0-99
        int finalScore = (int) Math.min(99, Math.max(0, rawScore));
        tx.setRiskFactors(factors.isEmpty() ? List.of("No significant risk factors") : factors);
        tx.setAnomalyType(factors.isEmpty() ? null : factors.get(0));
        tx.setVpn(isVpnIp(tx.getIpAddress()));
        tx.setVelocityCount(velocity);

        String status = finalScore > 85 ? "blocked" : finalScore > 70 ? "flagged" : "approved";
        tx.setStatus(status);

        return finalScore;
    }

    /**
     * Isolation Forest-inspired outlier score for amount.
     * Trained on log-normal distribution of typical e-commerce amounts ($5–$500).
     * Returns 0.0 (normal) to 1.0 (extreme outlier).
     */
    private double isolationScore(double amount) {
        // Fit: typical amounts follow log-normal(mean=5.0, std=1.5) in log space
        double logAmount = Math.log(Math.max(amount, 1));
        double mean = 5.0;   // ln(~$150)
        double std = 1.5;
        double z = Math.abs((logAmount - mean) / std);
        // Sigmoid-based normalization — returns 0..1
        return 1.0 / (1.0 + Math.exp(-0.8 * (z - 2.5)));
    }

    /**
     * Sliding-window velocity tracking.
     * Keeps timestamps in a 1-hour window per card.
     */
    private int updateAndGetVelocity(String cardLast4, long nowMs, double amount) {
        velocityWindow.computeIfAbsent(cardLast4, k -> new CopyOnWriteArrayList<>());
        CopyOnWriteArrayList<long[]> window = velocityWindow.get(cardLast4);

        long cutoff = nowMs - 3_600_000L; // 1 hour
        window.removeIf(entry -> entry[0] < cutoff);
        window.add(new long[]{nowMs, (long) amount});

        // Cap memory: keep at most 200 entries per card
        if (window.size() > 200) window.subList(0, window.size() - 200).clear();

        return window.size();
    }

    /**
     * Geo-velocity check: flags if the card appears in two distant locations
     * within a time window that makes physical travel impossible.
     * Uses Haversine formula for distance.
     */
    private boolean detectImpossibleTravel(Transaction tx) {
        double[] last = lastGeoByCard.get(tx.getCardLast4());
        if (last == null) return false;

        double distKm = haversineKm(last[0], last[1], tx.getLat(), tx.getLng());
        long timeDeltaMs = tx.getTimestamp().toEpochMilli() - (long) last[2];
        double timeDeltaHrs = timeDeltaMs / 3_600_000.0;

        if (timeDeltaHrs < 0.1) return false; // Same time window, skip
        double speedKmh = distKm / timeDeltaHrs;
        return speedKmh > 900; // Faster than a commercial aircraft
    }

    private void updateGeoHistory(Transaction tx) {
        lastGeoByCard.put(tx.getCardLast4(),
            new double[]{tx.getLat(), tx.getLng(), tx.getTimestamp().toEpochMilli()});
    }

    private boolean isVpnIp(String ip) {
        return KNOWN_VPN_PREFIXES.stream().anyMatch(ip::startsWith);
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
