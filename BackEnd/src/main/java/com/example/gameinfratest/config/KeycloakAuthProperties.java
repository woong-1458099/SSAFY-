package com.example.gameinfratest.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.keycloak")
public class KeycloakAuthProperties {
    private boolean enabled;
    private boolean requireClientSecret;
    private String baseUrl;
    private String publicBaseUrl;
    private String internalBaseUrl;
    private String realm;
    private String clientId;
    private String clientSecret;
    private String adminClientId;
    private String adminClientSecret;

    public KeycloakAuthProperties() {
    }

    public KeycloakAuthProperties(
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
        this.enabled = enabled;
        this.requireClientSecret = requireClientSecret;
        this.baseUrl = baseUrl;
        this.publicBaseUrl = publicBaseUrl;
        this.internalBaseUrl = internalBaseUrl;
        this.realm = realm;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.adminClientId = adminClientId;
        this.adminClientSecret = adminClientSecret;
    }

    public boolean enabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean requireClientSecret() {
        return requireClientSecret;
    }

    public void setRequireClientSecret(boolean requireClientSecret) {
        this.requireClientSecret = requireClientSecret;
    }

    public String baseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String publicBaseUrl() {
        return publicBaseUrl;
    }

    public void setPublicBaseUrl(String publicBaseUrl) {
        this.publicBaseUrl = publicBaseUrl;
    }

    public String internalBaseUrl() {
        return internalBaseUrl;
    }

    public void setInternalBaseUrl(String internalBaseUrl) {
        this.internalBaseUrl = internalBaseUrl;
    }

    public String realm() {
        return realm;
    }

    public void setRealm(String realm) {
        this.realm = realm;
    }

    public String clientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String clientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public String adminClientId() {
        return adminClientId;
    }

    public void setAdminClientId(String adminClientId) {
        this.adminClientId = adminClientId;
    }

    public String adminClientSecret() {
        return adminClientSecret;
    }

    public void setAdminClientSecret(String adminClientSecret) {
        this.adminClientSecret = adminClientSecret;
    }

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
