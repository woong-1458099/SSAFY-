package com.example.gameinfratest.service;

import com.example.gameinfratest.api.dto.auth.UserResponse;
import com.example.gameinfratest.auth.BffSessionState;
import com.example.gameinfratest.config.KeycloakAuthProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceSessionRefreshTest {

    private static final String KEYCLOAK_URL = "http://keycloak:8081/realms/app";
    private static final String TOKEN_ENDPOINT = KEYCLOAK_URL + "/protocol/openid-connect/token";

    @Mock
    private KeycloakAuthProperties keycloakAuthProperties;
    @Mock
    private UserService userService;
    @Mock
    private JwtDecoder jwtDecoder;

    private AuthService authService;
    private MockRestServiceServer mockServer;
    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        when(keycloakAuthProperties.serverRealmUrl()).thenReturn(KEYCLOAK_URL);
        when(keycloakAuthProperties.clientId()).thenReturn("test-client");
        when(keycloakAuthProperties.clientSecret()).thenReturn("");

        RestClient.Builder restClientBuilder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();
        RestClient restClient = restClientBuilder.build();

        authService = new AuthService(
                "http://localhost:8080",
                "http://localhost:5173",
                keycloakAuthProperties,
                userService,
                jwtDecoder
        );
        ReflectionTestUtils.setField(authService, "restClient", restClient);
    }

    // ─────────────────────────────────────────────
    // 1. 유효한 세션 → 그대로 반환 (리프레시 호출 없음)
    // ─────────────────────────────────────────────
    @Test
    void getSessionState_validSession_returnsExisting() {
        MockHttpSession session = new MockHttpSession();
        BffSessionState state = validSession();
        session.setAttribute(BffSessionState.SESSION_KEY, state);

        BffSessionState result = authService.getSessionState(session);

        assertThat(result).isSameAs(state);
        mockServer.verify(); // 서버 호출 없어야 함
    }

    // ─────────────────────────────────────────────
    // 2. 만료된 세션 → 리프레시 성공 → 갱신된 세션 반환
    // ─────────────────────────────────────────────
    @Test
    void getSessionState_expiredSession_refreshSucceeds_returnsNewState() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(BffSessionState.SESSION_KEY, expiredSession());

        String tokenJson = objectMapper.writeValueAsString(Map.of(
                "access_token", "new-access-token",
                "refresh_token", "new-refresh-token",
                "id_token", "new-id-token",
                "expires_in", 300
        ));
        mockServer.expect(requestTo(TOKEN_ENDPOINT))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(tokenJson, MediaType.APPLICATION_JSON));

        Jwt jwt = mockJwt("new-access-token");
        when(jwtDecoder.decode("new-access-token")).thenReturn(jwt);
        when(userService.upsertFromJwt(jwt)).thenReturn(testUser());

        BffSessionState result = authService.getSessionState(session);

        assertThat(result).isNotNull();
        assertThat(result.accessToken()).isEqualTo("new-access-token");
        assertThat(result.isExpired()).isFalse();
        // 세션이 새 상태로 업데이트됐는지 확인 (원자적 업데이트)
        assertThat(session.getAttribute(BffSessionState.SESSION_KEY)).isSameAs(result);
        mockServer.verify();
    }

    // ─────────────────────────────────────────────
    // 3. 만료 + Keycloak 4xx → 세션 제거 + null 반환
    // ─────────────────────────────────────────────
    @Test
    void getSessionState_expiredSession_refreshFails4xx_clearsSessionAndReturnsNull() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(BffSessionState.SESSION_KEY, expiredSession());

        mockServer.expect(requestTo(TOKEN_ENDPOINT))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withUnauthorizedRequest());

        BffSessionState result = authService.getSessionState(session);

        assertThat(result).isNull();
        // 실패 시 클린업: 세션에서 인증 정보 제거
        assertThat(session.getAttribute(BffSessionState.SESSION_KEY)).isNull();
        mockServer.verify();
    }

    // ─────────────────────────────────────────────
    // 4. 만료 + 네트워크 오류 → 세션 유지 + null 반환
    //    (Keycloak 복구 시 재시도 가능하도록 세션 보존)
    // ─────────────────────────────────────────────
    @Test
    void getSessionState_expiredSession_keycloakUnreachable_keepsSessionAndReturnsNull() {
        MockHttpSession session = new MockHttpSession();
        BffSessionState expired = expiredSession();
        session.setAttribute(BffSessionState.SESSION_KEY, expired);

        mockServer.expect(requestTo(TOKEN_ENDPOINT))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError()); // 5xx

        BffSessionState result = authService.getSessionState(session);

        assertThat(result).isNull();
        // 일시적 장애이므로 세션은 그대로 남아있어야 함
        assertThat(session.getAttribute(BffSessionState.SESSION_KEY)).isSameAs(expired);
        mockServer.verify();
    }

    // ─────────────────────────────────────────────
    // 5. double-check: 이미 유효한 세션이면 리프레시 없이 반환
    //    (동시 요청 중 한 스레드가 먼저 갱신 완료한 케이스)
    // ─────────────────────────────────────────────
    @Test
    void getSessionState_sessionAlreadyValidAtDoubleCheck_returnsFreshWithoutRefresh() {
        MockHttpSession session = new MockHttpSession();
        BffSessionState alreadyFresh = validSession();
        session.setAttribute(BffSessionState.SESSION_KEY, alreadyFresh);

        BffSessionState result = authService.getSessionState(session);

        assertThat(result).isSameAs(alreadyFresh);
        mockServer.verify(); // 서버 호출 없어야 함
    }

    // ─────────────────────────────────────────────
    // 6. null 세션 → null 반환
    // ─────────────────────────────────────────────
    @Test
    void getSessionState_nullSession_returnsNull() {
        assertThat(authService.getSessionState(null)).isNull();
        mockServer.verify();
    }

    // ─────────────────────────────────────────────
    // helpers
    // ─────────────────────────────────────────────

    private BffSessionState validSession() {
        return new BffSessionState(
                testUser(), "subject-123", List.of("ROLE_PLAYER"),
                "access-token", "refresh-token", "id-token",
                Instant.now().plusSeconds(600).toEpochMilli()
        );
    }

    private BffSessionState expiredSession() {
        return new BffSessionState(
                testUser(), "subject-123", List.of("ROLE_PLAYER"),
                "old-access-token", "old-refresh-token", "id-token",
                Instant.now().minusSeconds(60).toEpochMilli()
        );
    }

    private UserResponse testUser() {
        Instant now = Instant.now();
        return new UserResponse(
                UUID.randomUUID(), "test@example.com", "player",
                true, null, null, "keycloak", now, now, now
        );
    }

    private Jwt mockJwt(String token) {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn("subject-123");
        when(jwt.getClaim("realm_access")).thenReturn(null);
        when(jwt.getClaim("resource_access")).thenReturn(null);
        return jwt;
    }
}
