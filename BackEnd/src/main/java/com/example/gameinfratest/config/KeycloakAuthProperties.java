package com.example.gameinfratest.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.keycloak")
public record KeycloakAuthProperties(
        boolean enabled,
        boolean requireClientSecret,
        String baseUrl,
        String publicBaseUrl,
        String internalBaseUrl,
        String realm,
        String clientId,
        String clientSecret,
        String adminClientId,
        String adminClientSecret
) {
    public String browserRealmUrl() {
        return trimTrailingSlash(resolvePublicBaseUrl()) + "/realms/" + realm;
    }

    public String serverRealmUrl() {
        return trimTrailingSlash(resolveInternalBaseUrl()) + "/realms/" + realm;
    }

    public String adminRealmUrl() {
        return trimTrailingSlash(resolveInternalBaseUrl()) + "/admin/realms/" + realm;
    }

    private String resolvePublicBaseUrl() {
        if (publicBaseUrl != null && !publicBaseUrl.isBlank()) {
            return publicBaseUrl;
        }
        return baseUrl;
    }

    private String resolveInternalBaseUrl() {
        if (internalBaseUrl != null && !internalBaseUrl.isBlank()) {
            return internalBaseUrl;
        }
        return resolvePublicBaseUrl();
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
