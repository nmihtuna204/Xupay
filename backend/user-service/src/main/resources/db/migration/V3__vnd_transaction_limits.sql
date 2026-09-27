-- Flyway migration: transaction limits in VND
--
-- The seed in V1 was written in USD cents ("$100/day" = 10000), but every
-- wallet is VND and the whole stack reads *_cents as VND x 100. A new user's
-- TIER_0 send limit therefore came out as 100 VND per day.
--
-- Converted at 25,000 VND per USD, keeping the seed's intended ratios:
--
--   tier    daily send       daily receive    single txn       monthly volume
--   TIER_0      2,500,000        2,500,000        1,250,000         25,000,000
--   TIER_1     25,000,000       50,000,000       12,500,000        500,000,000
--   TIER_2    250,000,000      500,000,000      125,000,000      5,000,000,000
--   TIER_3  2,500,000,000    5,000,000,000    1,250,000,000     25,000,000,000
--
-- Values below are cents (VND x 100), the unit every *_cents column uses.
-- Transaction-count limits are units, not money, so they are unchanged.

UPDATE transaction_limits SET
    daily_send_limit_cents       =     250000000,
    daily_receive_limit_cents    =     250000000,
    single_transaction_max_cents =     125000000,
    monthly_volume_limit_cents   =    2500000000
WHERE tier_name = 'TIER_0';

UPDATE transaction_limits SET
    daily_send_limit_cents       =    2500000000,
    daily_receive_limit_cents    =    5000000000,
    single_transaction_max_cents =    1250000000,
    monthly_volume_limit_cents   =   50000000000
WHERE tier_name = 'TIER_1';

UPDATE transaction_limits SET
    daily_send_limit_cents       =   25000000000,
    daily_receive_limit_cents    =   50000000000,
    single_transaction_max_cents =   12500000000,
    monthly_volume_limit_cents   =  500000000000
WHERE tier_name = 'TIER_2';

UPDATE transaction_limits SET
    daily_send_limit_cents       =  250000000000,
    daily_receive_limit_cents    =  500000000000,
    single_transaction_max_cents =  125000000000,
    monthly_volume_limit_cents   = 2500000000000
WHERE tier_name = 'TIER_3';
