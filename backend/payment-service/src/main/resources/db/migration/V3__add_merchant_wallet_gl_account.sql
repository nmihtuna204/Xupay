-- =====================================================
-- V3: Add missing GL account for MERCHANT wallets
-- =====================================================
-- WalletServiceImpl maps wallet types to GL accounts:
--   PERSONAL -> 1110, BUSINESS -> 1120, MERCHANT -> 1130
-- The V1 seed data never created account 1130, so creating
-- a MERCHANT wallet failed with "GL account not found".
-- =====================================================

INSERT INTO chart_of_accounts (account_code, account_name, account_type, normal_balance, parent_account_code, description)
VALUES ('1130', 'Merchant Wallets Cash', 'ASSET', 'DEBIT', '1100', 'Cash held in merchant wallets')
ON CONFLICT (account_code) DO NOTHING;
