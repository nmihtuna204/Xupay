-- =====================================================
-- V4: Large amounts are flagged for review, not blocked
-- =====================================================
-- V2 seeded "Very High Amount Block: > 5M VND" with action BLOCK. It refused
-- every transfer above 5,000,000 VND, so the per-transaction limits the KYC
-- tiers grant above that (12,500,000 VND for TIER_1 up to 1,250,000,000 VND
-- for TIER_3, see user-service V3__vnd_transaction_limits.sql) could never be
-- used.
--
-- The tier limits decide whether a payment may go through; this rule now
-- marks large ones for review. Its penalty (80) is over the flag threshold
-- (70), so every such transfer is still flagged with the rule as its reason.
-- =====================================================

UPDATE fraud_rules
SET action = 'FLAG',
    rule_name = 'Very High Amount Alert: > 5M VND'
WHERE rule_name = 'Very High Amount Block: > 5M VND'
  AND action = 'BLOCK';
