package com.example.gameinfratest.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.example.gameinfratest.auth.AuthAction;
import com.example.gameinfratest.config.AppUrlProperties;
import com.example.gameinfratest.config.KeycloakAuthProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.oauth2.jwt.JwtDecoder;

class AuthServiceTest {

    @Test
    void buildAuthorizationUrlEncodesScopeAndRedirectUri() {
        AuthService authService = new AuthService(
                new AppUrlProperties("https://api.example.com", "https://app.example.com"),
                new KeycloakAuthProperties(
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
}
