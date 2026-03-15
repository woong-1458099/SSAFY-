CREATE TABLE challenges (
    id uuid PRIMARY KEY,
    code varchar(100) NOT NULL UNIQUE,
    name varchar(255) NOT NULL,
    description text,
    target_progress integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_challenges (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id),
    challenge_id uuid NOT NULL REFERENCES challenges(id),
    progress integer NOT NULL DEFAULT 0,
    target_progress integer NOT NULL,
    status varchar(30) NOT NULL,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    achieved_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_challenges_user_challenge UNIQUE (user_id, challenge_id)
);

CREATE TABLE save_files (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id),
    slot_number integer NOT NULL,
    name varchar(255) NOT NULL,
    game_state text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_save_files_user_slot UNIQUE (user_id, slot_number)
);

CREATE TABLE inventory_items (
    id uuid PRIMARY KEY,
    save_file_id uuid NOT NULL REFERENCES save_files(id) ON DELETE CASCADE,
    item_code varchar(100) NOT NULL,
    item_name varchar(255) NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    metadata text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE asset_bundle_files (
    id uuid PRIMARY KEY,
    asset_bundle_id uuid NOT NULL,
    path varchar(500) NOT NULL,
    url varchar(1000) NOT NULL,
    checksum varchar(255),
    size_bytes bigint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_save_files_user_id ON save_files(user_id);
CREATE INDEX idx_inventory_items_save_file_id ON inventory_items(save_file_id);
CREATE INDEX idx_asset_bundle_files_bundle_id ON asset_bundle_files(asset_bundle_id);
