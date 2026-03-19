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
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
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

    private final List<String> publicBaseUrls;
    private final List<String> frontendBaseUrls;
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
        this.publicBaseUrls = appUrlProperties.configuredPublicBaseUrls();
        this.frontendBaseUrls = appUrlProperties.configuredFrontendBaseUrls();
        this.keycloakAuthProperties = keycloakAuthProperties;
        this.userService = userService;
        this.jwtDecoder = jwtDecoder;
        this.restClient = RestClient.builder().build();
    }

    @PostConstruct
    void validateRequiredUrls() {
        if (!keycloakAuthProperties.enabled()) {
            return;
        }
        requireConfiguredBaseUrls(publicBaseUrls, "app.urls.public-base-urls");
        requireConfiguredBaseUrls(frontendBaseUrls, "app.urls.frontend-base-urls");
    }

    public String buildAuthorizationUrl(HttpSession session, HttpServletRequest request, AuthAction action) {
        ensureAuthEnabled();

        String state = UUID.randomUUID().toString().replace("-", "");
        String verifier = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        String challenge = createCodeChallenge(verifier);
        String callbackUri = callbackUri(request);

        session.setAttribute(SESSION_STATE_KEY, state);
        session.setAttribute(SESSION_VERIFIER_KEY, verifier);
        session.setAttribute(SESSION_ACTION_KEY, action.name());

        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(keycloakAuthProperties.browserRealmUrl() + "/protocol/openid-connect/auth")
                .queryParam("client_id", "{clientId}")
                .queryParam("redirect_uri", "{redirectUri}")
                .queryParam("response_type", "{responseType}")
                .queryParam("scope", "{scope}")
                .queryParam("state", "{state}")
                .queryParam("code_challenge", "{codeChallenge}")
                .queryParam("code_challenge_method", "{codeChallengeMethod}");

        Map<String, Object> uriVariables = new java.util.LinkedHashMap<>();
        uriVariables.put("clientId", keycloakAuthProperties.clientId());
        uriVariables.put("redirectUri", callbackUri);
        uriVariables.put("responseType", "code");
        uriVariables.put("scope", OIDC_SCOPE);
        uriVariables.put("state", state);
        uriVariables.put("codeChallenge", challenge);
        uriVariables.put("codeChallengeMethod", "S256");

        if (action == AuthAction.SIGNUP) {
            builder.queryParam("prompt", "{prompt}");
            uriVariables.put("prompt", "create");
        }

        String authorizationUrl = builder
                .encode()
                .buildAndExpand(uriVariables)
                .toUriString();
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

        String callbackUri = callbackUri(request);
        log.info("auth callback received sessionId={} codePresent={} callbackUri={} keycloakServer={}",
                session.getId(), true, callbackUri, keycloakAuthProperties.serverRealmUrl());
        KeycloakTokenResponse tokenResponse = exchangeCode(code, verifier, callbackUri);
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
                .queryParam("post_logout_redirect_uri", "{postLogoutRedirectUri}")
                .queryParam("client_id", "{clientId}");

        if (resolvedIdTokenHint != null && !resolvedIdTokenHint.isBlank()) {
            builder.queryParam("id_token_hint", "{idTokenHint}");
        }

        Map<String, Object> uriVariables = new java.util.LinkedHashMap<>();
        uriVariables.put("postLogoutRedirectUri", frontendRootUri(request));
        uriVariables.put("clientId", keycloakAuthProperties.clientId());
        if (resolvedIdTokenHint != null && !resolvedIdTokenHint.isBlank()) {
            uriVariables.put("idTokenHint", resolvedIdTokenHint);
        }

        String logoutUrl = builder.encode().buildAndExpand(uriVariables).toUriString();
        log.info("auth logout prepared redirect={} idTokenHintPresent={}", frontendRootUri(request), resolvedIdTokenHint != null && !resolvedIdTokenHint.isBlank());
        return new LogoutResponse(logoutUrl);
    }

    public String frontendRootUri(HttpServletRequest request) {
        return resolveConfiguredBaseUrl(request, frontendBaseUrls, "app.urls.frontend-base-urls") + "/";
    }

    private KeycloakTokenResponse exchangeCode(String code, String verifier, String callbackUri) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("client_id", keycloakAuthProperties.clientId());
        body.add("code", code);
        body.add("redirect_uri", callbackUri);
        body.add("code_verifier", verifier);
        if (keycloakAuthProperties.clientSecret() != null && !keycloakAuthProperties.clientSecret().isBlank()) {
            body.add("client_secret", keycloakAuthProperties.clientSecret());
        }

        try {
            log.info("keycloak token exchange start serverRealmUrl={} clientId={} redirectUri={} clientSecretPresent={}",
                    keycloakAuthProperties.serverRealmUrl(),
                    keycloakAuthProperties.clientId(),
                    callbackUri,
                    keycloakAuthProperties.clientSecret() != null && !keycloakAuthProperties.clientSecret().isBlank());
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

    private String callbackUri(HttpServletRequest request) {
        return resolveConfiguredBaseUrl(request, publicBaseUrls, "app.urls.public-base-urls") + "/api/auth/callback";
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String normalized = value;
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String requireConfiguredBaseUrl(String value, String propertyName) {
        if (value.isBlank()) {
            throw new IllegalStateException(propertyName + " must not be blank");
        }
        try {
            String normalized = trimTrailingSlash(value);
            URI uri = new URI(normalized);
            if (uri.getScheme() == null || uri.getHost() == null) {
                throw new IllegalStateException(propertyName + " must be an absolute URL");
            }
            String scheme = uri.getScheme().toLowerCase(Locale.ROOT);
            if (!scheme.equals("http") && !scheme.equals("https")) {
                throw new IllegalStateException(propertyName + " must use http or https");
            }
            if (uri.getUserInfo() != null) {
                throw new IllegalStateException(propertyName + " must not include user info");
            }
            if (uri.getFragment() != null) {
                throw new IllegalStateException(propertyName + " must not include a fragment");
            }
            return normalized;
        } catch (URISyntaxException exception) {
            throw new IllegalStateException(propertyName + " must be a valid URL", exception);
        }
    }

    private List<String> requireConfiguredBaseUrls(List<String> values, String propertyName) {
        if (values == null || values.isEmpty()) {
            throw new IllegalStateException(propertyName + " must not be blank");
        }
        return values.stream()
                .map(value -> requireConfiguredBaseUrl(value, propertyName))
                .distinct()
                .toList();
    }

    private String resolveConfiguredBaseUrl(HttpServletRequest request, List<String> configuredBaseUrls, String propertyName) {
        List<String> validatedBaseUrls = requireConfiguredBaseUrls(configuredBaseUrls, propertyName);
        if (validatedBaseUrls.size() == 1) {
            return validatedBaseUrls.get(0);
        }

        String requestBaseUrl = requestBaseUrl(request);
        if (requestBaseUrl != null) {
            for (String configuredBaseUrl : validatedBaseUrls) {
                if (sameBaseUrl(configuredBaseUrl, requestBaseUrl)) {
                    return configuredBaseUrl;
                }
            }
            log.warn("request base url did not match configured property={} requestBaseUrl={} configuredBaseUrls={}",
                    propertyName, requestBaseUrl, validatedBaseUrls);
        }

        return validatedBaseUrls.get(0);
    }

    private String requestBaseUrl(HttpServletRequest request) {
        if (request == null || request.getScheme() == null || request.getServerName() == null || request.getServerName().isBlank()) {
            return null;
        }

        String scheme = request.getScheme().toLowerCase(Locale.ROOT);
        String host = request.getServerName().toLowerCase(Locale.ROOT);
        int port = request.getServerPort();
        boolean defaultPort = ("http".equals(scheme) && port == 80) || ("https".equals(scheme) && port == 443);

        if (port <= 0 || defaultPort) {
            return scheme + "://" + host;
        }
        return scheme + "://" + host + ":" + port;
    }

    private boolean sameBaseUrl(String configuredBaseUrl, String requestBaseUrl) {
        try {
            URI configuredUri = new URI(configuredBaseUrl);
            URI requestUri = new URI(requestBaseUrl);
            return configuredUri.getScheme().equalsIgnoreCase(requestUri.getScheme())
                    && configuredUri.getHost().equalsIgnoreCase(requestUri.getHost())
                    && effectivePort(configuredUri) == effectivePort(requestUri)
                    && normalizePath(configuredUri.getPath()).equals(normalizePath(requestUri.getPath()));
        } catch (URISyntaxException exception) {
            return configuredBaseUrl.equalsIgnoreCase(requestBaseUrl);
        }
    }

    private int effectivePort(URI uri) {
        if (uri.getPort() >= 0) {
            return uri.getPort();
        }
        return switch (uri.getScheme().toLowerCase(Locale.ROOT)) {
            case "http" -> 80;
            case "https" -> 443;
            default -> -1;
        };
    }

    private String normalizePath(String path) {
        if (path == null || path.isBlank() || "/".equals(path)) {
            return "";
        }
        return trimTrailingSlash(path);
    }

    private void clearPendingAuth(HttpSession session) {
        session.removeAttribute(SESSION_STATE_KEY);
        session.removeAttribute(SESSION_VERIFIER_KEY);
        session.removeAttribute(SESSION_ACTION_KEY);
    }

    private void ensureAuthEnabled() {
        if (!keycloakAuthProperties.enabled()) {
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
            Object clientAccess = resourceAccess.get(keycloakAuthProperties.clientId());
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
