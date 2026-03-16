package com.example.gameinfratest.config;

import java.net.URI;
import java.net.URISyntaxException;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.urls")
public class AppUrlProperties {
    private String publicBaseUrl;
    private String frontendBaseUrl;

    public AppUrlProperties() {
    }

    public AppUrlProperties(String publicBaseUrl, String frontendBaseUrl) {
        this.publicBaseUrl = publicBaseUrl;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    public String publicBaseUrl() {
        return publicBaseUrl;
    }

    public String getPublicBaseUrl() {
        return publicBaseUrl;
    }

    public void setPublicBaseUrl(String publicBaseUrl) {
        this.publicBaseUrl = publicBaseUrl;
    }

    public String frontendBaseUrl() {
        return frontendBaseUrl;
    }

    public String getFrontendBaseUrl() {
        return frontendBaseUrl;
    }

    public void setFrontendBaseUrl(String frontendBaseUrl) {
        this.frontendBaseUrl = frontendBaseUrl;
    }

    public String normalizedPublicBaseUrl() {
        return trimTrailingSlash(publicBaseUrl);
    }

    public String normalizedFrontendBaseUrl() {
        return trimTrailingSlash(frontendBaseUrl);
    }

    public URI validatedPublicBaseUri() {
        return toValidatedUri(normalizedPublicBaseUrl(), "app.urls.public-base-url");
    }

    public URI validatedFrontendBaseUri() {
        return toValidatedUri(normalizedFrontendBaseUrl(), "app.urls.frontend-base-url");
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

    private URI toValidatedUri(String value, String propertyName) {
        if (value.isBlank()) {
            throw new IllegalStateException(propertyName + " must not be blank");
        }
        try {
            URI uri = new URI(value);
            if (uri.getScheme() == null || uri.getHost() == null) {
                throw new IllegalStateException(propertyName + " must be an absolute URL");
            }
            return uri;
        } catch (URISyntaxException exception) {
            throw new IllegalStateException(propertyName + " must be a valid URL", exception);
        }
    }
}
