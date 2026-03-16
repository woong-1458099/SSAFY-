package com.example.gameinfratest.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.gameinfratest.auth.AuthAction;
import com.example.gameinfratest.auth.AuthSessionTicketStore;
import com.example.gameinfratest.config.KeycloakAuthProperties;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.oauth2.jwt.JwtDecoder;

class AuthServiceAuthorizationUrlTest {

    @Test
    void signupAuthorizationUrlIncludesPromptCreate() {
        AuthService authService = authService();

        String authorizationUrl = authService.buildAuthorizationUrl(session(), request("/api/auth/signup"), AuthAction.SIGNUP);

        assertThat(authorizationUrl).contains("/protocol/openid-connect/auth");
        assertThat(authorizationUrl).contains("prompt=create");
    }

    @Test
    void loginAuthorizationUrlDoesNotIncludePromptCreate() {
        AuthService authService = authService();

        String authorizationUrl = authService.buildAuthorizationUrl(session(), request("/api/auth/login"), AuthAction.LOGIN);

        assertThat(authorizationUrl).contains("/protocol/openid-connect/auth");
        assertThat(authorizationUrl).doesNotContain("prompt=create");
    }

    private AuthService authService() {
        return new AuthService(
                new KeycloakAuthProperties(
                        true,
                        "https://auth.example",
                        "https://auth.example",
                        "http://keycloak:8080",
                        "app",
                        "ssafy-maker-public",
                        "",
                        "admin-cli",
                        ""
                ),
                Mockito.mock(AuthSessionTicketStore.class),
                Mockito.mock(UserService.class),
                Mockito.mock(JwtDecoder.class)
        );
    }

    private MockHttpServletRequest request(String path) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
        request.setScheme("https");
        request.setServerName("stg.ssafymaker.cloud");
        request.setServerPort(443);
        return request;
    }

    private MockHttpSession session() {
        return new MockHttpSession();
    }
}
