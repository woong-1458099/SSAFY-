CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    birthday DATE,
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE save_files (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    slot_no INT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    current_area VARCHAR(50) NOT NULL,
    current_place VARCHAR(50) NOT NULL,
    time_label VARCHAR(50) NOT NULL,
    week INT NOT NULL DEFAULT 1,
    day_label VARCHAR(50) NOT NULL,
    hp INT NOT NULL DEFAULT 100,
    hp_max INT NOT NULL DEFAULT 100,
    money INT NOT NULL DEFAULT 0,
    stress INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_save_files_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uq_save_files_user_slot
        UNIQUE (user_id, slot_no),
    CONSTRAINT chk_save_files_slot_no
        CHECK (slot_no >= 1),
    CONSTRAINT chk_save_files_version
        CHECK (version >= 1),
    CONSTRAINT chk_save_files_week
        CHECK (week >= 1),
    CONSTRAINT chk_save_files_hp
        CHECK (hp >= 0),
    CONSTRAINT chk_save_files_hp_max
        CHECK (hp_max >= 1),
    CONSTRAINT chk_save_files_money
        CHECK (money >= 0),
    CONSTRAINT chk_save_files_stress
        CHECK (stress BETWEEN 0 AND 100)
);

CREATE TABLE user_progress (
    id UUID PRIMARY KEY,
    save_file_id UUID NOT NULL,
    day INT NOT NULL DEFAULT 1,
    week INT NOT NULL DEFAULT 1,
    ending_flag VARCHAR(100),
    coding INT NOT NULL DEFAULT 0,
    presentation INT NOT NULL DEFAULT 0,
    teamwork INT NOT NULL DEFAULT 0,
    luck INT NOT NULL DEFAULT 0,
    stress INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_progress_save_file
        FOREIGN KEY (save_file_id) REFERENCES save_files(id),
    CONSTRAINT uq_user_progress_save_file
        UNIQUE (save_file_id),
    CONSTRAINT chk_user_progress_day
        CHECK (day >= 1),
    CONSTRAINT chk_user_progress_week
        CHECK (week >= 1),
    CONSTRAINT chk_user_progress_coding
        CHECK (coding BETWEEN 0 AND 100),
    CONSTRAINT chk_user_progress_presentation
        CHECK (presentation BETWEEN 0 AND 100),
    CONSTRAINT chk_user_progress_teamwork
        CHECK (teamwork BETWEEN 0 AND 100),
    CONSTRAINT chk_user_progress_luck
        CHECK (luck BETWEEN 0 AND 100),
    CONSTRAINT chk_user_progress_stress
        CHECK (stress BETWEEN 0 AND 100)
);

CREATE TABLE item_templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    short_label VARCHAR(20) NOT NULL,
    kind VARCHAR(30) NOT NULL,
    equip_slot VARCHAR(30),
    price INT NOT NULL DEFAULT 0,
    sell_price INT NOT NULL DEFAULT 0,
    effect_text VARCHAR(255),
    stackable BOOLEAN NOT NULL DEFAULT FALSE,
    color_hex VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_item_templates_kind
        CHECK (kind IN ('equipment', 'consumable')),
    CONSTRAINT chk_item_templates_equip_slot
        CHECK (equip_slot IS NULL OR equip_slot IN ('keyboard', 'mouse')),
    CONSTRAINT chk_item_templates_price
        CHECK (price >= 0),
    CONSTRAINT chk_item_templates_sell_price
        CHECK (sell_price >= 0)
);

CREATE TABLE save_inventory_items (
    id UUID PRIMARY KEY,
    save_file_id UUID NOT NULL,
    item_template_id VARCHAR(100) NOT NULL,
    slot_index INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_save_inventory_items_save_file
        FOREIGN KEY (save_file_id) REFERENCES save_files(id),
    CONSTRAINT fk_save_inventory_items_template
        FOREIGN KEY (item_template_id) REFERENCES item_templates(id),
    CONSTRAINT uq_save_inventory_items_slot
        UNIQUE (save_file_id, slot_index),
    CONSTRAINT chk_save_inventory_items_slot_index
        CHECK (slot_index >= 0),
    CONSTRAINT chk_save_inventory_items_quantity
        CHECK (quantity >= 1)
);

CREATE TABLE challenge_definitions (
    id UUID PRIMARY KEY,
    challenge_code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    challenge_type VARCHAR(50) NOT NULL,
    description TEXT,
    reward_money INT NOT NULL DEFAULT 0,
    reward_exp INT NOT NULL DEFAULT 0,
    reward_payload JSONB,
    is_repeatable BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_challenge_definitions_reward_money
        CHECK (reward_money >= 0),
    CONSTRAINT chk_challenge_definitions_reward_exp
        CHECK (reward_exp >= 0)
);

CREATE TABLE user_challenges (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    save_file_id UUID,
    challenge_definition_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL,
    progress_value INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_challenges_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_challenges_save_file
        FOREIGN KEY (save_file_id) REFERENCES save_files(id),
    CONSTRAINT fk_user_challenges_definition
        FOREIGN KEY (challenge_definition_id) REFERENCES challenge_definitions(id),
    CONSTRAINT chk_user_challenges_status
        CHECK (status IN ('locked', 'available', 'in_progress', 'completed', 'claimed')),
    CONSTRAINT chk_user_challenges_progress_value
        CHECK (progress_value >= 0)
);

CREATE TABLE asset_bundles (
    id UUID PRIMARY KEY,
    bundle_key VARCHAR(100) NOT NULL UNIQUE,
    version VARCHAR(50) NOT NULL,
    base_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE asset_files (
    id UUID PRIMARY KEY,
    asset_bundle_id UUID NOT NULL,
    category VARCHAR(50) NOT NULL,
    asset_key VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    checksum VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_asset_files_bundle
        FOREIGN KEY (asset_bundle_id) REFERENCES asset_bundles(id),
    CONSTRAINT uq_asset_files_bundle_asset_key
        UNIQUE (asset_bundle_id, asset_key),
    CONSTRAINT chk_asset_files_file_size
        CHECK (file_size IS NULL OR file_size >= 0)
);

CREATE INDEX idx_save_files_user_id ON save_files(user_id);
CREATE INDEX idx_user_progress_save_file_id ON user_progress(save_file_id);
CREATE INDEX idx_save_inventory_items_save_file_id ON save_inventory_items(save_file_id);
CREATE INDEX idx_save_inventory_items_item_template_id ON save_inventory_items(item_template_id);
CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_save_file_id ON user_challenges(save_file_id);
CREATE INDEX idx_user_challenges_definition_id ON user_challenges(challenge_definition_id);
CREATE INDEX idx_asset_files_asset_bundle_id ON asset_files(asset_bundle_id);

