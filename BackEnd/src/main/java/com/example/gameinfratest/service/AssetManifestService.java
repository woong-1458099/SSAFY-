package com.example.gameinfratest.service;

import com.example.gameinfratest.api.dto.assets.AssetManifestResponse;
import java.util.Collections;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AssetManifestService {
    private final String assetBaseUrl;
    private final String manifestVersion;

    public AssetManifestService(
            @Value("${app.assets.base-url}") String assetBaseUrl,
            @Value("${app.assets.manifest-version}") String manifestVersion
    ) {
        this.assetBaseUrl = trimTrailingSlash(assetBaseUrl);
        this.manifestVersion = manifestVersion;
    }

    public AssetManifestResponse getManifest() {
        Map<String, Object> assets = Collections.emptyMap();
        return new AssetManifestResponse(manifestVersion, assetBaseUrl, assets);
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
