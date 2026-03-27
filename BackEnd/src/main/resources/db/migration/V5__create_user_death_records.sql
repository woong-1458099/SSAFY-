CREATE TABLE user_death_records (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    area_id varchar(100),
    scene_id varchar(100),
    cause varchar(120),
    death_count_snapshot integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_death_records_user_id_created_at ON user_death_records(user_id, created_at DESC);
CREATE INDEX idx_user_death_records_created_at ON user_death_records(created_at DESC);
