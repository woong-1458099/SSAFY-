ALTER TABLE users
    ADD COLUMN IF NOT EXISTS death_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_death_at timestamptz;
