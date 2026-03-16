package com.example.gameinfratest.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.gameinfratest.auth.AuthAction;
import com.example.gameinfratest.config.SecurityConfig;
import com.example.gameinfratest.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, AuthControllerSecurityTest.MockBeans.class})
@TestPropertySource(properties = {
        "app.security.jwt.enabled=true",
        "app.security.cors.allowed-origins=http://localhost:5173",
        "app.keycloak.client-id=test-client"
})
class AuthControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    @Test
    void loginEndpointIsAccessibleWithoutBearerToken() throws Exception {
        when(authService.buildAuthorizationUrl(any(HttpSession.class), any(HttpServletRequest.class), eq(AuthAction.LOGIN)))
                .thenReturn("https://auth.example/authorize");

        mockMvc.perform(get("/api/auth/login"))
                .andExpect(status().isFound())
                .andExpect(header().string(HttpHeaders.LOCATION, "https://auth.example/authorize"));
    }

    @TestConfiguration
    static class MockBeans {
        @Bean
        @Primary
        AuthService authService() {
            return Mockito.mock(AuthService.class);
        }

        @Bean
        @Primary
        JwtDecoder jwtDecoder() {
            return Mockito.mock(JwtDecoder.class);
        }
    }
}
