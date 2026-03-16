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
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
