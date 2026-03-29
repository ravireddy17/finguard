package com.finguard.model;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.List;

@Data
@Builder
public class Transaction {
    private String id;
    private double amount;
    private String merchant;
    private String merchantCategory;
    private String cardLast4;
    private String country;
    private String city;
    private Instant timestamp;
    private int riskScore;
    private List<String> riskFactors;
    private String status; // approved | flagged | blocked
    private String ipAddress;
    private String deviceFingerprint;
    private boolean isVpn;
    private int velocityCount;
    private String anomalyType;
    private double lat;
    private double lng;
}
