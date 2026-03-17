package com.example.gameinfratest.service;

import static org.junit.jupiter.api.Assertions.assertTrue;

import com.example.gameinfratest.api.dto.auth.LogoutResponse;
import com.example.gameinfratest.auth.AuthAction;
import com.example.gameinfratest.config.KeycloakAuthProperties;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.oauth2.jwt.JwtDecoder;

class AuthServiceTest {

    @Test
    void buildAuthorizationUrlEncodesScopeQueryParam() {
        AuthService authService = new AuthService(
                "https://api.example.com",
                "https://app.example.com",
                new KeycloakAuthProperties(
                        true,
                        "https://kc.example.com",
                        "https://kc.example.com",
                        "https://kc-internal.example.com",
                        "app",
                        "test-client",
                        "",
                        "admin-cli",
                        ""
                ),
                Mockito.mock(UserService.class),
                Mockito.mock(JwtDecoder.class)
        );

        String authorizationUrl = authService.buildAuthorizationUrl(
                new MockHttpSession(),
                Mockito.mock(jakarta.servlet.http.HttpServletRequest.class),
                AuthAction.LOGIN
        );

        assertTrue(authorizationUrl.contains("scope=openid%20profile%20email"));
        assertTrue(authorizationUrl.contains("redirect_uri=https%3A%2F%2Fapi.example.com%2Fapi%2Fauth%2Fcallback"));
    }

    @Test
    void logoutEncodesPostLogoutRedirectUri() {
        AuthService authService = new AuthService(
                "https://api.example.com",
                "https://app.example.com",
                new KeycloakAuthProperties(
                        true,
                        "https://kc.example.com",
                        "https://kc.example.com",
                        "https://kc-internal.example.com",
                        "app",
                        "test-client",
                        "",
                        "admin-cli",
                        ""
                ),
                Mockito.mock(UserService.class),
                Mockito.mock(JwtDecoder.class)
        );

        LogoutResponse logoutResponse = authService.logout(
                Mockito.mock(jakarta.servlet.http.HttpServletRequest.class),
                null,
                null
        );

        assertTrue(logoutResponse.logoutUrl().contains(
                "post_logout_redirect_uri=https%3A%2F%2Fapp.example.com%2F"
        ));
    }
}
