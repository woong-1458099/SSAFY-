#!/usr/bin/env bash
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/public/assets/game"

: "${R2_ACCOUNT_ID:?R2_ACCOUNT_ID is required}"
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is required}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is required}"
: "${R2_BUCKET:?R2_BUCKET is required}"
: "${ASSET_VERSION:?ASSET_VERSION is required}"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Source directory not found: $SOURCE_DIR" >&2
  exit 1
fi

export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="auto"

ENDPOINT_URL="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
TARGET_PREFIX="s3://${R2_BUCKET}/game/releases/${ASSET_VERSION}"

echo "Uploading assets from: $SOURCE_DIR"
echo "Uploading to: $TARGET_PREFIX"

aws s3 sync "$SOURCE_DIR/" "$TARGET_PREFIX/" \
  --endpoint-url "$ENDPOINT_URL" \
  --delete \
  --cache-control "public, max-age=31536000, immutable"

echo "Upload completed."
echo "Suggested ASSET_BASE_URL=https://assets.ssafymaker.cloud/game/releases/${ASSET_VERSION}"
