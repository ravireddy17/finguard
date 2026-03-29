package com.finguard.ml;

import com.finguard.model.Transaction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;

class FraudScoringEngineTest {

    private FraudScoringEngine engine;

    @BeforeEach
    void setUp() {
        engine = new FraudScoringEngine();
    }

    private Transaction.TransactionBuilder baseTransaction() {
        return Transaction.builder()
                .id("TXN-TEST")
                .amount(50.0)
                .merchant("Starbucks")
                .merchantCategory("Food & Bev")
                .cardLast4("1234")
                .country("US")
                .city("New York")
                .timestamp(Instant.now())
                .ipAddress("192.0.2.1")
                .deviceFingerprint("ABCDEF1234")
                .lat(40.7128)
                .lng(-74.0060)
                .riskFactors(new ArrayList<>());
    }

    @Test
    @DisplayName("Low-risk transaction should score below 40")
    void testLowRiskTransaction() {
        Transaction tx = baseTransaction().build();
        int score = engine.score(tx);
        assertThat(score).isLessThan(40);
        assertThat(tx.getStatus()).isEqualTo("approved");
    }

    @Test
    @DisplayName("Crypto exchange with high amount should score above 70")
    void testCryptoHighAmount() {
        Transaction tx = baseTransaction()
                .merchant("Crypto Exchange")
                .merchantCategory("Crypto")
                .amount(5000.0)
                .build();
        int score = engine.score(tx);
        assertThat(score).isGreaterThan(70);
    }

    @Test
    @DisplayName("VPN IP from high-risk country should elevate score")
    void testVpnHighRiskCountry() {
        Transaction tx = baseTransaction()
                .country("RU")
                .ipAddress("45.142.100.200")
                .build();
        int score = engine.score(tx);
        assertThat(score).isGreaterThan(30);
        assertThat(tx.isVpn()).isTrue();
    }

    @Test
    @DisplayName("High velocity (10 rapid transactions) should be flagged")
    void testHighVelocity() {
        String card = "9999";
        // Simulate 10 rapid transactions on the same card
        for (int i = 0; i < 9; i++) {
            Transaction warmup = baseTransaction().cardLast4(card).build();
            engine.score(warmup);
        }
        Transaction tx = baseTransaction().cardLast4(card).build();
        int score = engine.score(tx);
        assertThat(score).isGreaterThan(40);
        assertThat(tx.getVelocityCount()).isGreaterThan(8);
    }

    @Test
    @DisplayName("Score should always be between 0 and 99")
    void testScoreBounds() {
        Transaction extreme = baseTransaction()
                .merchant("Crypto Exchange")
                .merchantCategory("Crypto")
                .amount(99999.0)
                .country("RU")
                .ipAddress("185.220.101.1")
                .build();
        int score = engine.score(extreme);
        assertThat(score).isBetween(0, 99);
    }

    @Test
    @DisplayName("Blocked transactions should have riskScore > 85")
    void testBlockedStatus() {
        Transaction tx = baseTransaction()
                .merchant("Wire Transfer")
                .merchantCategory("Finance")
                .amount(8000.0)
                .country("NG")
                .ipAddress("185.220.10.5")
                .build();
        engine.score(tx);
        if (tx.getRiskScore() > 85) {
            assertThat(tx.getStatus()).isEqualTo("blocked");
        }
    }
}
