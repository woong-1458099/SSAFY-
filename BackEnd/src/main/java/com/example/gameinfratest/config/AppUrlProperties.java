package com.example.gameinfratest.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.urls")
public record AppUrlProperties(
        String publicBaseUrl,
        String frontendBaseUrl
) {
    public String normalizedPublicBaseUrl() {
        return trimTrailingSlash(publicBaseUrl);
    }

    public String normalizedFrontendBaseUrl() {
        return trimTrailingSlash(frontendBaseUrl);
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String normalized = value;
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }
}
