ALTER TABLE users
    ADD COLUMN IF NOT EXISTS username varchar(255),
    ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
