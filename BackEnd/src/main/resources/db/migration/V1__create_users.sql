CREATE TABLE users (
    id uuid PRIMARY KEY,
    email varchar(255) NOT NULL UNIQUE,
    username varchar(255),
    email_verified boolean NOT NULL DEFAULT false,
    phone varchar(50),
    birthday date,
    provider varchar(50) NOT NULL,
    provider_id varchar(255) NOT NULL UNIQUE,
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL
);
