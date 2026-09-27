package com.xupay.user.entity.enums;

/**
 * KYC tier levels with transaction limits
 * Maps to database constraint: chk_kyc_tier
 * 
 * Daily send limits (transaction_limits, VND; see migration V3):
 * - TIER_0:     2,500,000 VND (unverified)
 * - TIER_1:    25,000,000 VND (basic KYC)
 * - TIER_2:   250,000,000 VND (enhanced KYC)
 * - TIER_3: 2,500,000,000 VND (full KYC)
 */
public enum KycTier {
    /** Unverified user */
    TIER_0,
    
    /** Basic KYC */
    TIER_1,
    
    /** Enhanced KYC */
    TIER_2,
    
    /** Full KYC */
    TIER_3;
    
    /**
     * Convert database value to enum
     */
    public static KycTier fromString(String value) {
        if (value == null) {
            return TIER_0;
        }
        return valueOf(value.toUpperCase());
    }
    
    /**
     * Get tier from integer value (0-3)
     */
    public static KycTier fromInt(int value) {
        return switch (value) {
            case 0 -> TIER_0;
            case 1 -> TIER_1;
            case 2 -> TIER_2;
            case 3 -> TIER_3;
            default -> throw new IllegalArgumentException("Invalid tier: " + value);
        };
    }
}
