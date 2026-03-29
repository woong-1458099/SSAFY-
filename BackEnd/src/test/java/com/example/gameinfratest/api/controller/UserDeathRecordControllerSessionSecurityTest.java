package com.example.gameinfratest.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.gameinfratest.api.dto.auth.DeathRecordTokenResponse;
import com.example.gameinfratest.api.dto.auth.UserResponse;
import com.example.gameinfratest.auth.BffSessionAuthenticationFilter;
import com.example.gameinfratest.auth.BffSessionState;
import com.example.gameinfratest.config.SecurityConfig;
import com.example.gameinfratest.service.AuthorizationService;
import com.example.gameinfratest.service.DeathRecordService;
import com.example.gameinfratest.service.DeathRecordVerificationService;
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
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserDeathRecordController.class)
@Import({
        SecurityConfig.class,
        AuthorizationService.class,
        UserDeathRecordControllerSessionSecurityTest.MockBeans.class
})
@TestPropertySource(properties = {
        "app.security.jwt.enabled=true",
        "app.security.cors.allowed-origins=http://localhost:5173",
        "app.keycloak.client-id=test-client"
})
class UserDeathRecordControllerSessionSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private DeathRecordVerificationService deathRecordVerificationService;

    @Autowired
    private DeathRecordService deathRecordService;

    @Test
    void issueDeathRecordTokenRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/users/me/deaths/token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void issueDeathRecordTokenAllowsCurrentSession() throws Exception {
        UserResponse signedInUser = user("signed-in@example.com");
        when(userService.getCurrentUser(eq(signedInUser.id()))).thenReturn(signedInUser);
        when(deathRecordVerificationService.issueToken(any(), eq(signedInUser.id())))
                .thenReturn(new DeathRecordTokenResponse("token", Instant.parse("2026-03-29T00:00:30Z")));

        mockMvc.perform(post("/api/users/me/deaths/token").session(authenticatedSession(signedInUser)))
                .andExpect(status().isOk());
    }

    @Test
    void recordDeathRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/users/me/deaths")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"areaId\":\"world\",\"sceneId\":\"scene\",\"cause\":\"HP_ZERO\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void recordDeathAllowsVerifiedCurrentSession() throws Exception {
        UserResponse signedInUser = user("signed-in@example.com");
        when(userService.getCurrentUser(eq(signedInUser.id()))).thenReturn(signedInUser);
        doNothing().when(deathRecordVerificationService).verifyAndConsume(any(), eq(signedInUser.id()), eq("verified-token"));
        when(deathRecordService.recordDeath(eq(signedInUser.id()), any())).thenReturn(signedInUser);

        mockMvc.perform(post("/api/users/me/deaths")
                        .session(authenticatedSession(signedInUser))
                        .header("X-Death-Record-Token", "verified-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"areaId\":\"world\",\"sceneId\":\"scene-1\",\"cause\":\"HP_ZERO\"}"))
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
        UserService userService() {
            return Mockito.mock(UserService.class);
        }

        @Bean
        @Primary
        DeathRecordVerificationService deathRecordVerificationService() {
            return Mockito.mock(DeathRecordVerificationService.class);
        }

        @Bean
        @Primary
        DeathRecordService deathRecordService() {
            return Mockito.mock(DeathRecordService.class);
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
