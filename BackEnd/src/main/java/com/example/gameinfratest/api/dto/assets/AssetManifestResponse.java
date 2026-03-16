package com.example.gameinfratest.api.dto.assets;

import java.util.Map;

public record AssetManifestResponse(
        String version,
        String baseUrl,
        Map<String, Object> assets
) {
}
