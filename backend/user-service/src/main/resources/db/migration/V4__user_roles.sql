-- Flyway migration: user roles
--
-- The KYC review endpoints require ROLE_ADMIN, but nothing ever granted a
-- role, so no one could approve a document and no user could move up a tier.
-- Everyone starts as USER; an ADMIN is created or promoted at startup from
-- XUPAY_ADMIN_EMAIL / XUPAY_ADMIN_PASSWORD (see AdminBootstrap).

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_role') THEN
        ALTER TABLE users ADD CONSTRAINT chk_user_role CHECK (role IN ('USER', 'ADMIN'));
    END IF;
END $$;
