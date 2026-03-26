package com.example.gameinfratest.api.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.gameinfratest.api.dto.auth.UserResponse;
import com.example.gameinfratest.auth.BffSessionAuthenticationFilter;
import com.example.gameinfratest.auth.BffSessionState;
import com.example.gameinfratest.config.SecurityConfig;
import com.example.gameinfratest.service.AuthorizationService;
import com.example.gameinfratest.service.ChallengeService;
import com.example.gameinfratest.service.UserService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ChallengeController.class)
@Import({
        SecurityConfig.class,
        AuthorizationService.class,
        ChallengeControllerSessionSecurityTest.MockBeans.class
})
@TestPropertySource(properties = {
        "app.security.jwt.enabled=true",
        "app.security.cors.allowed-origins=http://localhost:5173",
        "app.keycloak.client-id=test-client"
})
class ChallengeControllerSessionSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ChallengeService challengeService;

    @Autowired
    private UserService userService;

    @Test
    void userChallengesRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/users/{userId}/challenges", UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userChallengesRejectsOtherUserSession() throws Exception {
        UserResponse signedInUser = user("signed-in@example.com");
        when(userService.getCurrentUser(eq(signedInUser.id()))).thenReturn(signedInUser);

        mockMvc.perform(get("/api/users/{userId}/challenges", UUID.randomUUID()).session(authenticatedSession(signedInUser)))
                .andExpect(status().isForbidden());
    }

    @Test
    void userChallengesAllowsCurrentUserSession() throws Exception {
        UserResponse signedInUser = user("signed-in@example.com");
        when(userService.getCurrentUser(eq(signedInUser.id()))).thenReturn(signedInUser);
        when(challengeService.getUserChallenges(eq(signedInUser.id()))).thenReturn(List.of());

        mockMvc.perform(get("/api/users/{userId}/challenges", signedInUser.id()).session(authenticatedSession(signedInUser)))
                .andExpect(status().isOk());
    }

    private MockHttpSession authenticatedSession(UserResponse user) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(
                BffSessionState.SESSION_KEY,
                new BffSessionState(
                        user,
                        "subject-" + user.id(),
                        List.of("ROLE_PLAYER"),
                        "access-token",
                        "refresh-token",
                        "id-token",
                        Instant.now().plusSeconds(600).toEpochMilli()
                )
        );
        return session;
    }

    private UserResponse user(String email) {
        Instant now = Instant.parse("2026-03-16T00:00:00Z");
        return new UserResponse(
                UUID.randomUUID(),
                email,
                "player",
                true,
                null,
                null,
                "keycloak",
                now,
                now,
                now
        );
    }

    @TestConfiguration
    static class MockBeans {
        @Bean
        @Primary
        ChallengeService challengeService() {
            return Mockito.mock(ChallengeService.class);
        }

        @Bean
        @Primary
        UserService userService() {
            return Mockito.mock(UserService.class);
        }

        @Bean
        @Primary
        JwtDecoder jwtDecoder() {
            return Mockito.mock(JwtDecoder.class);
        }

        @Bean
        @Primary
        BffSessionAuthenticationFilter bffSessionAuthenticationFilter() {
            return new BffSessionAuthenticationFilter();
        }
    }
}
