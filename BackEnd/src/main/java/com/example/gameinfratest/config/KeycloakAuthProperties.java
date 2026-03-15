package com.example.gameinfratest.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.keycloak")
public record KeycloakAuthProperties(
        boolean enabled,
        String baseUrl,
        String realm,
        String clientId,
        String clientSecret,
        String adminClientId,
        String adminClientSecret
) {
    public String realmUrl() {
        return trimTrailingSlash(baseUrl) + "/realms/" + realm;
    }

    public String adminRealmUrl() {
        return trimTrailingSlash(baseUrl) + "/admin/realms/" + realm;
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
