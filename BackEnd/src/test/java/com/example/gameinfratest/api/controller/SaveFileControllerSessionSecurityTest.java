package com.example.gameinfratest.api.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.gameinfratest.api.dto.auth.UserResponse;
import com.example.gameinfratest.auth.BffSessionAuthenticationFilter;
import com.example.gameinfratest.auth.BffSessionState;
import com.example.gameinfratest.config.SecurityConfig;
import com.example.gameinfratest.save.SaveFile;
import com.example.gameinfratest.service.AuthorizationService;
import com.example.gameinfratest.service.SaveFileService;
import com.example.gameinfratest.service.UserService;
import com.example.gameinfratest.user.User;
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

@WebMvcTest(SaveFileController.class)
@Import({
        SecurityConfig.class,
        AuthorizationService.class,
        SaveFileControllerSessionSecurityTest.MockBeans.class
})
@TestPropertySource(properties = {
        "app.security.jwt.enabled=true",
        "app.security.cors.allowed-origins=http://localhost:5173",
        "app.keycloak.client-id=test-client"
})
class SaveFileControllerSessionSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SaveFileService saveFileService;

    @Autowired
    private UserService userService;

    @Test
    void userSaveFilesRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/users/{userId}/save-files", UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userSaveFilesRejectsOtherUserSession() throws Exception {
        UserResponse signedInUser = user("signed-in@example.com");
        when(userService.getCurrentUser(eq(signedInUser.id()))).thenReturn(signedInUser);

        mockMvc.perform(get("/users/{userId}/save-files", UUID.randomUUID()).session(authenticatedSession(signedInUser)))
                .andExpect(status().isForbidden());
    }

    @Test
    void userSaveFilesAllowsCurrentUserSession() throws Exception {
        UserResponse signedInUser = user("signed-in@example.com");
        when(userService.getCurrentUser(eq(signedInUser.id()))).thenReturn(signedInUser);
        when(saveFileService.getUserSaveFiles(eq(signedInUser.id()))).thenReturn(List.of());

        mockMvc.perform(get("/users/{userId}/save-files", signedInUser.id()).session(authenticatedSession(signedInUser)))
                .andExpect(status().isOk());
    }

    @Test
    void saveFileRejectsOtherOwnerResource() throws Exception {
        UserResponse signedInUser = user("signed-in@example.com");
        when(userService.getCurrentUser(eq(signedInUser.id()))).thenReturn(signedInUser);

        UUID ownerId = UUID.randomUUID();
        SaveFile saveFile = saveFile(ownerId);
        when(saveFileService.getSaveFileEntity(eq(saveFile.getId()))).thenReturn(saveFile);

        mockMvc.perform(get("/save-files/{saveFileId}", saveFile.getId()).session(authenticatedSession(signedInUser)))
                .andExpect(status().isForbidden());
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

    private SaveFile saveFile(UUID ownerId) {
        User owner = new User();
        owner.setId(ownerId);

        SaveFile saveFile = new SaveFile();
        saveFile.setId(UUID.randomUUID());
        saveFile.setUser(owner);
        saveFile.setSlotNumber(1);
        saveFile.setName("slot-1");
        saveFile.setGameState("{}");
        return saveFile;
    }

    @TestConfiguration
    static class MockBeans {
        @Bean
        @Primary
        SaveFileService saveFileService() {
            return Mockito.mock(SaveFileService.class);
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
