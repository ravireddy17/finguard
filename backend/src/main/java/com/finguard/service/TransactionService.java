package com.finguard.service;

import com.finguard.ml.FraudScoringEngine;
import com.finguard.model.Transaction;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class TransactionService {

    private final FraudScoringEngine scoringEngine;
    private final CopyOnWriteArrayList<Transaction> history = new CopyOnWriteArrayList<>();
    private final AtomicInteger counter = new AtomicInteger(1000);

    private static final String[] MERCHANTS = {
        "Amazon", "Walmart", "Apple Store", "Shell Gas", "Starbucks", "Target",
        "Netflix", "Uber", "DoorDash", "Best Buy", "Crypto Exchange", "FX Trading",
        "Casino Online", "Wire Transfer", "ATM Withdrawal", "Luxury Goods",
        "Airline Tickets", "Hotel", "CVS Pharmacy", "Home Depot"
    };
    private static final String[] CATEGORIES = {
        "E-Commerce", "Retail", "Electronics", "Fuel", "Food & Bev", "Streaming",
        "Transport", "E-Commerce", "Food & Bev", "Electronics", "Crypto", "Finance",
        "Finance", "Finance", "ATM", "Luxury", "Travel", "Travel", "Pharmacy", "Home"
    };
    private static final String[] COUNTRIES = {"US", "UK", "DE", "CN", "RU", "NG", "BR", "MX", "AU", "CA", "IN", "JP"};
    private static final Map<String, String[]> CITIES = Map.of(
        "US", new String[]{"New York", "Los Angeles", "Chicago"},
        "UK", new String[]{"London", "Manchester"},
        "DE", new String[]{"Berlin", "Frankfurt"},
        "CN", new String[]{"Shanghai", "Beijing"},
        "RU", new String[]{"Moscow"},
        "NG", new String[]{"Lagos"},
        "BR", new String[]{"São Paulo"},
        "AU", new String[]{"Sydney"}
    );
    private static final Map<String, double[]> GEO = Map.of(
        "US", new double[]{37.0, -95.7}, "UK", new double[]{51.5, -0.12},
        "DE", new double[]{52.5, 13.4}, "CN", new double[]{35.86, 104.2},
        "RU", new double[]{55.75, 37.6}, "NG", new double[]{6.45, 3.4},
        "BR", new double[]{-15.8, -47.9}, "AU", new double[]{-33.9, 151.2},
        "MX", new double[]{19.4, -99.1}, "CA", new double[]{43.7, -79.4}
    );

    public TransactionService(FraudScoringEngine scoringEngine) {
        this.scoringEngine = scoringEngine;
    }

    public Transaction generateAndScore() {
        Random r = new Random();
        int merchantIdx = r.nextInt(MERCHANTS.length);
        String country = COUNTRIES[r.nextInt(COUNTRIES.length)];
        String[] cityArr = CITIES.getOrDefault(country, new String[]{"Unknown"});
        String city = cityArr[r.nextInt(cityArr.length)];
        double[] geo = GEO.getOrDefault(country, new double[]{0.0, 0.0});

        String merchant = MERCHANTS[merchantIdx];
        boolean highRisk = List.of("Crypto Exchange", "FX Trading", "Casino Online", "Wire Transfer").contains(merchant);
        double amount = highRisk ? 1000 + r.nextDouble() * 8000 : 5 + r.nextDouble() * 800;

        String ip = generateIp(r);

        Transaction tx = Transaction.builder()
            .id("TXN-" + counter.incrementAndGet())
            .amount(Math.round(amount * 100.0) / 100.0)
            .merchant(merchant)
            .merchantCategory(CATEGORIES[merchantIdx])
            .cardLast4(String.format("%04d", r.nextInt(10000)))
            .country(country)
            .city(city)
            .timestamp(Instant.now())
            .ipAddress(ip)
            .deviceFingerprint(UUID.randomUUID().toString().substring(0, 10).toUpperCase())
            .lat(geo[0] + (r.nextDouble() - 0.5) * 8)
            .lng(geo[1] + (r.nextDouble() - 0.5) * 8)
            .riskFactors(new ArrayList<>())
            .build();

        // Score it — engine mutates tx (sets riskFactors, status, vpn, velocity)
        int score = scoringEngine.score(tx);
        tx.setRiskScore(score);

        history.add(0, tx);
        if (history.size() > 1000) history.subList(900, history.size()).clear();

        return tx;
    }

    public Transaction scoreIncoming(Transaction tx) {
        int score = scoringEngine.score(tx);
        tx.setRiskScore(score);
        history.add(0, tx);
        return tx;
    }

    public List<Transaction> getHistory(int limit) {
        return history.subList(0, Math.min(limit, history.size()));
    }

    public Map<String, Object> getStats() {
        long flagged = history.stream().filter(t -> t.getRiskScore() > 70).count();
        long blocked = history.stream().filter(t -> t.getRiskScore() > 85).count();
        double saved = history.stream().filter(t -> t.getRiskScore() > 85).mapToDouble(Transaction::getAmount).sum();
        return Map.of(
            "total", history.size(),
            "flagged", flagged,
            "blocked", blocked,
            "savedAmount", Math.round(saved * 100.0) / 100.0
        );
    }

    private String generateIp(Random r) {
        // 15% chance of VPN-like IP
        if (r.nextDouble() < 0.15) {
            String[] vpnPrefixes = {"45.142.", "185.220.", "10.", "172.16."};
            return vpnPrefixes[r.nextInt(vpnPrefixes.length)] + r.nextInt(255) + "." + r.nextInt(255);
        }
        return r.nextInt(223) + "." + r.nextInt(255) + "." + r.nextInt(255) + "." + r.nextInt(255);
    }
}
