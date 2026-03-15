$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SourceDir = Join-Path $RootDir "public/assets/game"

if (-not (Test-Path $SourceDir)) {
    throw "Source directory not found: $SourceDir"
}

$required = @(
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
    "ASSET_VERSION"
)

foreach ($name in $required) {
    $value = [Environment]::GetEnvironmentVariable($name)
    if ([string]::IsNullOrWhiteSpace($value)) {
        throw "$name is required"
    }
}

$env:AWS_ACCESS_KEY_ID = $env:R2_ACCESS_KEY_ID
$env:AWS_SECRET_ACCESS_KEY = $env:R2_SECRET_ACCESS_KEY
$env:AWS_DEFAULT_REGION = "auto"

$endpointUrl = "https://$($env:R2_ACCOUNT_ID).r2.cloudflarestorage.com"
$targetPrefix = "s3://$($env:R2_BUCKET)/game/releases/$($env:ASSET_VERSION)"

Write-Host "Uploading assets from: $SourceDir"
Write-Host "Uploading to: $targetPrefix"

aws s3 sync "$SourceDir/" "$targetPrefix/" `
    --endpoint-url "$endpointUrl" `
    --delete `
    --cache-control "public, max-age=31536000, immutable"

Write-Host "Upload completed."
Write-Host "Suggested ASSET_BASE_URL=https://assets.ssafymaker.cloud/game/releases/$($env:ASSET_VERSION)"
