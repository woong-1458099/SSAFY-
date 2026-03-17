package com.example.gameinfratest.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import com.example.gameinfratest.auth.AuthAction;
import com.example.gameinfratest.config.AppUrlProperties;
import com.example.gameinfratest.config.KeycloakAuthProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.junit.jupiter.api.Disabled;

@Disabled
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
    void buildAuthorizationUrlEncodesScopeAndRedirectUri() {
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

        assertThat(authorizationUrl).contains("scope=openid%20profile%20email");
        assertThat(authorizationUrl).contains("redirect_uri=https%3A%2F%2Fapi.example.com%2Fapi%2Fauth%2Fcallback");
    }

    @Test
    void logoutUrlEncodesPostLogoutRedirectUri() {
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

        assertThat(logoutUrl).contains("post_logout_redirect_uri=https%3A%2F%2Fapp.example.com%2Fapp%2F");
    }
}
