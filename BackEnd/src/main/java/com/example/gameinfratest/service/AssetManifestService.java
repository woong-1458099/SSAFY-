package com.example.gameinfratest.service;

import com.example.gameinfratest.api.dto.assets.AssetManifestResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
public class AssetManifestService {
    private static final String MANIFEST_RESOURCE = "assets/asset-manifest.json";

    private final ObjectMapper objectMapper;
    private final String assetBaseUrl;
    private final String manifestVersion;

    public AssetManifestService(
            ObjectMapper objectMapper,
            @Value("${app.assets.base-url}") String assetBaseUrl,
            @Value("${app.assets.manifest-version}") String manifestVersion
    ) {
        this.objectMapper = objectMapper;
        this.assetBaseUrl = trimTrailingSlash(assetBaseUrl);
        this.manifestVersion = manifestVersion;
    }

    public AssetManifestResponse getManifest() {
        try (InputStream inputStream = new ClassPathResource(MANIFEST_RESOURCE).getInputStream()) {
            Map<String, Object> assets = objectMapper.readValue(inputStream, new TypeReference<>() {
            });
            return new AssetManifestResponse(manifestVersion, assetBaseUrl, assets);
        } catch (IOException exception) {
            throw new IllegalStateException("failed to load asset manifest", exception);
        }
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
