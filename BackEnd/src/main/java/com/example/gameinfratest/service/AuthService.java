package com.example.gameinfratest.service;

import com.example.gameinfratest.api.dto.auth.LogoutResponse;
import com.example.gameinfratest.api.dto.auth.UserResponse;
import com.example.gameinfratest.auth.AuthAction;
import com.example.gameinfratest.auth.BffSessionState;
import com.example.gameinfratest.auth.KeycloakTokenResponse;
import com.example.gameinfratest.config.AppUrlProperties;
import com.example.gameinfratest.config.KeycloakAuthProperties;
import com.example.gameinfratest.support.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String SESSION_STATE_KEY = "auth.bff.state";
    private static final String SESSION_VERIFIER_KEY = "auth.bff.verifier";
    private static final String SESSION_ACTION_KEY = "auth.bff.action";
    private static final String OIDC_SCOPE = "openid profile email";

    private final AppUrlProperties appUrlProperties;
    private final KeycloakAuthProperties keycloakAuthProperties;
    private final UserService userService;
    private final JwtDecoder jwtDecoder;
    private final RestClient restClient;

    public AuthService(
            AppUrlProperties appUrlProperties,
            KeycloakAuthProperties keycloakAuthProperties,
            UserService userService,
            JwtDecoder jwtDecoder
    ) {
        this.appUrlProperties = appUrlProperties;
        this.keycloakAuthProperties = keycloakAuthProperties;
        this.userService = userService;
        this.jwtDecoder = jwtDecoder;
        this.restClient = RestClient.builder().build();
    }

    @PostConstruct
    void validateRequiredUrls() {
        if (!keycloakAuthProperties.isEnabled()) {
            return;
        }
        if (keycloakAuthProperties.getRequireClientSecret()
                && (keycloakAuthProperties.getClientSecret() == null || keycloakAuthProperties.getClientSecret().isBlank())) {
            throw new IllegalStateException("app.keycloak.client-secret must not be blank when app.keycloak.require-client-secret is enabled");
        }
        appUrlProperties.validatedPublicBaseUri();
        appUrlProperties.validatedFrontendBaseUri();
    }

    public String buildAuthorizationUrl(HttpSession session, HttpServletRequest request, AuthAction action) {
        ensureAuthEnabled();

        String state = UUID.randomUUID().toString().replace("-", "");
        String verifier = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        String challenge = createCodeChallenge(verifier);
        String callbackUri = callbackUri();

        session.setAttribute(SESSION_STATE_KEY, state);
        session.setAttribute(SESSION_VERIFIER_KEY, verifier);
        session.setAttribute(SESSION_ACTION_KEY, action.name());

        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(keycloakAuthProperties.browserRealmUrl() + "/protocol/openid-connect/auth")
                .queryParam("client_id", keycloakAuthProperties.getClientId())
                .queryParam("redirect_uri", callbackUri)
                .queryParam("response_type", "code")
                .queryParam("scope", OIDC_SCOPE)
                .queryParam("state", state)
                .queryParam("code_challenge", challenge)
                .queryParam("code_challenge_method", "S256");

        // Query param values must be raw values here; UriComponentsBuilder performs the percent-encoding.
        String authorizationUrl = builder.build().encode().toUriString();
        log.info("auth start action={} sessionId={} callbackUri={} authHost={}",
                action, session.getId(), callbackUri, keycloakAuthProperties.browserRealmUrl());
        return authorizationUrl;
    }

    public void handleCallback(HttpSession session, HttpServletRequest request, String code, String state) {
        ensureAuthEnabled();

        String expectedState = (String) session.getAttribute(SESSION_STATE_KEY);
        String verifier = (String) session.getAttribute(SESSION_VERIFIER_KEY);

        clearPendingAuth(session);

        if (code == null || code.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "AUTH_CODE_REQUIRED", "authorization code is required");
        }
        if (state == null || state.isBlank() || expectedState == null || !state.equals(expectedState) || verifier == null) {
            log.warn("auth callback state mismatch sessionId={} expectedStatePresent={} verifierPresent={}",
                    session.getId(), expectedState != null, verifier != null);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_STATE_INVALID", "authentication state is invalid");
        }

        log.info("auth callback received sessionId={} codePresent={} callbackUri={} keycloakServer={}",
                session.getId(), true, callbackUri(), keycloakAuthProperties.serverRealmUrl());
        KeycloakTokenResponse tokenResponse = exchangeCode(code, verifier, callbackUri());
        Jwt jwt = jwtDecoder.decode(tokenResponse.accessToken());
        UserResponse user = userService.upsertFromJwt(jwt);

        BffSessionState sessionState = new BffSessionState(
                user,
                jwt.getSubject(),
                extractAuthorities(jwt),
                tokenResponse.accessToken(),
                tokenResponse.refreshToken(),
                tokenResponse.idToken(),
                Instant.now().plusSeconds(tokenResponse.expiresIn()).toEpochMilli()
        );

        request.changeSessionId();
        session.setAttribute(BffSessionState.SESSION_KEY, sessionState);
        log.info("auth callback success sessionId={} userId={} email={}",
                session.getId(), user.id(), user.email());
    }

    public BffSessionState getSessionState(HttpSession session) {
        if (session == null) {
            return null;
        }
        Object sessionAttribute = session.getAttribute(BffSessionState.SESSION_KEY);
        if (!(sessionAttribute instanceof BffSessionState sessionState)) {
            return null;
        }
        if (sessionState.isExpired()) {
            session.removeAttribute(BffSessionState.SESSION_KEY);
            return null;
        }
        return sessionState;
    }

    public LogoutResponse logout(HttpServletRequest request, HttpSession session, String idTokenHint) {
        ensureAuthEnabled();
        BffSessionState sessionState = getSessionState(session);
        String resolvedIdTokenHint = resolveIdTokenHint(idTokenHint, sessionState);

        if (session != null) {
            clearPendingAuth(session);
            session.removeAttribute(BffSessionState.SESSION_KEY);
            session.invalidate();
        }

        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(keycloakAuthProperties.browserRealmUrl() + "/protocol/openid-connect/logout")
                .queryParam("post_logout_redirect_uri", frontendRootUri())
                .queryParam("client_id", keycloakAuthProperties.getClientId());

        if (resolvedIdTokenHint != null && !resolvedIdTokenHint.isBlank()) {
            builder.queryParam("id_token_hint", resolvedIdTokenHint);
        }

        // Query param values must be raw values here; UriComponentsBuilder performs the percent-encoding.
        String logoutUrl = builder.build().encode().toUriString();
        log.info("auth logout prepared redirect={} idTokenHintPresent={}", frontendRootUri(), resolvedIdTokenHint != null && !resolvedIdTokenHint.isBlank());
        return new LogoutResponse(logoutUrl);
    }

    public String frontendRootUri() {
        return appUrlProperties.normalizedFrontendBaseUrl() + "/";
    }

    private KeycloakTokenResponse exchangeCode(String code, String verifier, String callbackUri) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("client_id", keycloakAuthProperties.getClientId());
        body.add("code", code);
        body.add("redirect_uri", callbackUri);
        body.add("code_verifier", verifier);
        if (keycloakAuthProperties.getClientSecret() != null && !keycloakAuthProperties.getClientSecret().isBlank()) {
            body.add("client_secret", keycloakAuthProperties.getClientSecret());
        }

        try {
            log.info("keycloak token exchange start serverRealmUrl={} clientId={} redirectUri={} clientSecretPresent={}",
                    keycloakAuthProperties.serverRealmUrl(),
                    keycloakAuthProperties.getClientId(),
                    callbackUri,
                    keycloakAuthProperties.getClientSecret() != null && !keycloakAuthProperties.getClientSecret().isBlank());
            return restClient.post()
                    .uri(keycloakAuthProperties.serverRealmUrl() + "/protocol/openid-connect/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(KeycloakTokenResponse.class);
        } catch (RestClientResponseException exception) {
            log.error("keycloak token exchange failed status={} body={}", exception.getStatusCode(), exception.getResponseBodyAsString());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "KEYCLOAK_TOKEN_EXCHANGE_FAILED", exception.getResponseBodyAsString());
        } catch (ResourceAccessException exception) {
            log.error("keycloak token exchange unreachable serverRealmUrl={}", keycloakAuthProperties.serverRealmUrl(), exception);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "KEYCLOAK_UNREACHABLE", "backend could not reach keycloak");
        }
    }

    private String callbackUri() {
        return appUrlProperties.normalizedPublicBaseUrl() + "/api/auth/callback";
    }

    private void clearPendingAuth(HttpSession session) {
        session.removeAttribute(SESSION_STATE_KEY);
        session.removeAttribute(SESSION_VERIFIER_KEY);
        session.removeAttribute(SESSION_ACTION_KEY);
    }

    private void ensureAuthEnabled() {
        if (!keycloakAuthProperties.isEnabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AUTH_DISABLED", "keycloak auth is disabled");
        }
    }

    private String createCodeChallenge(String verifier) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(verifier.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hashed);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is required for PKCE", exception);
        }
    }

    private String resolveIdTokenHint(String requestedIdTokenHint, BffSessionState sessionState) {
        if (requestedIdTokenHint != null && !requestedIdTokenHint.isBlank()) {
            return requestedIdTokenHint;
        }
        if (sessionState == null) {
            return null;
        }
        return sessionState.idToken();
    }

    @SuppressWarnings("unchecked")
    private List<String> extractAuthorities(Jwt jwt) {
        List<String> roles = new ArrayList<>();
        Object realmAccessClaim = jwt.getClaim("realm_access");
        if (realmAccessClaim instanceof Map<?, ?> realmAccess) {
            Object realmRoles = realmAccess.get("roles");
            if (realmRoles instanceof Collection<?> collection) {
                roles.addAll(collection.stream()
                        .filter(String.class::isInstance)
                        .map(String.class::cast)
                        .toList());
            }
        }

        Object resourceAccessClaim = jwt.getClaim("resource_access");
        if (resourceAccessClaim instanceof Map<?, ?> resourceAccess) {
            Object clientAccess = resourceAccess.get(keycloakAuthProperties.getClientId());
            if (clientAccess instanceof Map<?, ?> clientMap) {
                Object clientRoles = clientMap.get("roles");
                if (clientRoles instanceof Collection<?> collection) {
                    roles.addAll(collection.stream()
                            .filter(String.class::isInstance)
                            .map(String.class::cast)
                            .toList());
                }
            }
        }

        return roles.stream()
                .distinct()
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role.toUpperCase())
                .map(SimpleGrantedAuthority::new)
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
    }
}
