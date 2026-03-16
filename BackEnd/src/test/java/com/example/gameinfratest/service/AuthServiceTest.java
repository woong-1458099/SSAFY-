package com.example.gameinfratest.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import com.example.gameinfratest.auth.AuthAction;
import com.example.gameinfratest.config.AppUrlProperties;
import com.example.gameinfratest.config.KeycloakAuthProperties;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;

class AuthServiceTest {

    @Test
    void validateRequiredUrlsFailsWhenClientSecretMissing() {
        AuthService authService = new AuthService(
                new AppUrlProperties("https://api.example.com", "https://app.example.com"),
                new KeycloakAuthProperties(
                        true,
                        true,
                        "https://auth.example.com",
                        "https://auth.example.com",
                        "https://auth.example.com",
                        "app",
                        "ssafy-maker-bff",
                        "",
                        null,
                        null
                ),
                mock(UserService.class),
                mock(JwtDecoder.class)
        );

        assertThatThrownBy(authService::validateRequiredUrls)
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("app.keycloak.client-secret must not be blank when app.keycloak.require-client-secret is enabled");
    }

    @Test
    void validateRequiredUrlsAllowsMissingClientSecretWhenDisabledByConfig() {
        AuthService authService = new AuthService(
                new AppUrlProperties("https://api.example.com", "https://app.example.com"),
                new KeycloakAuthProperties(
                        true,
                        false,
                        "https://auth.example.com",
                        "https://auth.example.com",
                        "https://auth.example.com",
                        "app",
                        "ssafy-maker-bff",
                        "",
                        null,
                        null
                ),
                mock(UserService.class),
                mock(JwtDecoder.class)
        );

        authService.validateRequiredUrls();
    }

    @Test
    void buildAuthorizationUrlEncodesScopeAndKeepsRedirectUriAsSingleQueryParamValue() {
        AuthService authService = new AuthService(
                new AppUrlProperties("https://api.example.com", "https://app.example.com"),
                new KeycloakAuthProperties(
                        true,
                        true,
                        "https://auth.example.com",
                        "https://auth.example.com",
                        "https://auth.example.com",
                        "app",
                        "ssafy-maker-bff",
                        "secret",
                        null,
                        null
                ),
                mock(UserService.class),
                mock(JwtDecoder.class)
        );

        String authorizationUrl = authService.buildAuthorizationUrl(
                new MockHttpSession(),
                new MockHttpServletRequest(),
                AuthAction.LOGIN
        );
        MultiValueMap<String, String> queryParams = queryParams(authorizationUrl);

        assertThat(queryParams.getFirst("scope")).isEqualTo("openid profile email");
        assertThat(queryParams.get("redirect_uri")).containsExactly("https://api.example.com/api/auth/callback");
        assertThat(queryParams.getFirst("state")).isNotBlank();
        assertThat(queryParams.getFirst("code_challenge")).isNotBlank();
        assertThat(authorizationUrl).doesNotContain("scope=openid profile email");
    }

    @Test
    void logoutUrlKeepsPostLogoutRedirectUriAsSingleQueryParamValue() {
        AuthService authService = new AuthService(
                new AppUrlProperties("https://api.example.com", "https://app.example.com/app"),
                new KeycloakAuthProperties(
                        true,
                        true,
                        "https://auth.example.com",
                        "https://auth.example.com",
                        "https://auth.example.com",
                        "app",
                        "ssafy-maker-bff",
                        "secret",
                        null,
                        null
                ),
                mock(UserService.class),
                mock(JwtDecoder.class)
        );

        String logoutUrl = authService.logout(new MockHttpServletRequest(), new MockHttpSession(), null).logoutUrl();
        MultiValueMap<String, String> queryParams = queryParams(logoutUrl);

        assertThat(queryParams.get("post_logout_redirect_uri")).containsExactly("https://app.example.com/app/");
        assertThat(queryParams.getFirst("client_id")).isEqualTo("ssafy-maker-bff");
    }

    @Test
    void uriComponentEncodingKeepsNestedRedirectUriQueryStringInsideSingleParam() {
        String encodedUrl = UriComponentsBuilder.fromUriString("https://auth.example.com/realms/app/protocol/openid-connect/auth")
                // AppUrlProperties validates base URLs as absolute roots, so redirect targets are supplied as raw URI values here.
                .queryParam("redirect_uri", "https://api.example.com/api/auth/callback?next=/lobby&lang=ko")
                .build()
                .encode()
                .toUriString();

        MultiValueMap<String, String> queryParams = queryParams(encodedUrl);

        assertThat(queryParams.get("redirect_uri"))
                .containsExactly("https://api.example.com/api/auth/callback?next=/lobby&lang=ko");
        assertThat(queryParams.get("lang")).isNull();
        assertThat(queryParams.get("next")).isNull();
    }

    @Test
    void uriComponentEncodingKeepsNestedPostLogoutRedirectUriQueryAndFragmentInsideSingleParam() {
        String encodedUrl = UriComponentsBuilder.fromUriString("https://auth.example.com/realms/app/protocol/openid-connect/logout")
                .queryParam("post_logout_redirect_uri", "https://app.example.com/app/?next=/lobby#signed-out")
                .build()
                .encode()
                .toUriString();

        MultiValueMap<String, String> queryParams = queryParams(encodedUrl);

        assertThat(queryParams.get("post_logout_redirect_uri"))
                .containsExactly("https://app.example.com/app/?next=/lobby#signed-out");
        assertThat(queryParams.get("next")).isNull();
    }

    private MultiValueMap<String, String> queryParams(String url) {
        LinkedMultiValueMap<String, String> queryParams = new LinkedMultiValueMap<>();
        String rawQuery = URI.create(url).getRawQuery();
        if (rawQuery == null || rawQuery.isBlank()) {
            return queryParams;
        }

        for (String pair : rawQuery.split("&")) {
            String[] parts = pair.split("=", 2);
            String key = decode(parts[0]);
            String value = parts.length > 1 ? decode(parts[1]) : "";
            queryParams.add(key, value);
        }
        return queryParams;
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
