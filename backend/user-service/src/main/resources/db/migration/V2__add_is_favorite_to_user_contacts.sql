-- Flyway migration: add is_favorite column to user_contacts
ALTER TABLE user_contacts
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Optional: backfill logic or index (none required for MVP)
