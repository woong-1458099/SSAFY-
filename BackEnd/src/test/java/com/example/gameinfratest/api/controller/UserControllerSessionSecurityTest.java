package com.example.gameinfratest.api.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.gameinfratest.api.dto.auth.UserResponse;
import com.example.gameinfratest.auth.BffSessionAuthenticationFilter;
import com.example.gameinfratest.auth.BffSessionState;
import com.example.gameinfratest.config.SecurityConfig;
import com.example.gameinfratest.service.AuthorizationService;
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

@WebMvcTest(UserController.class)
@Import({
        SecurityConfig.class,
        AuthorizationService.class,
        UserControllerSessionSecurityTest.MockBeans.class
})
@TestPropertySource(properties = {
        "app.security.jwt.enabled=true",
        "app.security.cors.allowed-origins=http://localhost:5173",
        "app.keycloak.client-id=test-client"
})
class UserControllerSessionSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Test
    void meRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void recordDeathRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/users/me/deaths"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void recordDeathUpdatesCurrentUserCount() throws Exception {
        UserResponse signedInUser = user("signed-in@example.com", 3);
        UserResponse updatedUser = new UserResponse(
                signedInUser.id(),
                signedInUser.email(),
                signedInUser.username(),
                signedInUser.emailVerified(),
                signedInUser.phone(),
                signedInUser.birthday(),
                signedInUser.provider(),
                signedInUser.lastLoginAt(),
                4,
                Instant.parse("2026-03-25T03:00:00Z"),
                signedInUser.createdAt(),
                signedInUser.updatedAt()
        );

        when(userService.getCurrentUser(eq(signedInUser.id()))).thenReturn(signedInUser);
        when(userService.recordDeath(eq(signedInUser.id()))).thenReturn(updatedUser);

        mockMvc.perform(post("/api/users/me/deaths").session(authenticatedSession(signedInUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(signedInUser.id().toString()))
                .andExpect(jsonPath("$.data.email").value(signedInUser.email()))
                .andExpect(jsonPath("$.data.deathCount").value(4))
                .andExpect(jsonPath("$.data.lastDeathAt").value("2026-03-25T03:00:00Z"));

        verify(userService, times(1)).recordDeath(eq(signedInUser.id()));
        verifyNoMoreInteractions(userService);
    }

    @Test
    void meReturnsDeathStats() throws Exception {
        UserResponse signedInUser = user("signed-in@example.com", 2);
        when(userService.getCurrentUser(eq(signedInUser.id()))).thenReturn(signedInUser);

        mockMvc.perform(get("/api/users/me").session(authenticatedSession(signedInUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deathCount").value(2));

        verify(userService, never()).recordDeath(Mockito.any());
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

    private UserResponse user(String email, int deathCount) {
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
                deathCount,
                null,
                now,
                now
        );
    }

    @TestConfiguration
    static class MockBeans {
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
