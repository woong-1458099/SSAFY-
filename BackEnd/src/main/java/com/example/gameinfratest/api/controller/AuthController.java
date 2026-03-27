package com.example.gameinfratest.api.controller;

import com.example.gameinfratest.api.dto.ApiResponse;
import com.example.gameinfratest.api.dto.auth.AuthSessionResponse;
import com.example.gameinfratest.api.dto.auth.LogoutRequest;
import com.example.gameinfratest.api.dto.auth.LogoutResponse;
import com.example.gameinfratest.auth.AuthAction;
import com.example.gameinfratest.auth.BffSessionState;
import com.example.gameinfratest.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final AuthService authService;
    private final String sessionCookieName;
    private final boolean sessionCookieSecure;
    private final String sessionCookieSameSite;
    private final String sessionCookiePath;
    private final String sessionCookieDomain;

    public AuthController(
            AuthService authService,
            @Value("${server.servlet.session.cookie.name:JSESSIONID}") String sessionCookieName,
            @Value("${server.servlet.session.cookie.secure:false}") boolean sessionCookieSecure,
            @Value("${server.servlet.session.cookie.same-site:Lax}") String sessionCookieSameSite,
            @Value("${server.servlet.session.cookie.path:/}") String sessionCookiePath,
            @Value("${server.servlet.session.cookie.domain:}") String sessionCookieDomain
    ) {
        this.authService = authService;
        this.sessionCookieName = sessionCookieName;
        this.sessionCookieSecure = sessionCookieSecure;
        this.sessionCookieSameSite = sessionCookieSameSite;
        this.sessionCookiePath = sessionCookiePath;
        this.sessionCookieDomain = sessionCookieDomain;
    }

    @GetMapping("/login")
    public ResponseEntity<Void> login(HttpSession session, HttpServletRequest request) {
        log.info("GET /api/auth/login sessionId={}", session.getId());
        return redirect(authService.buildAuthorizationUrl(session, request, AuthAction.LOGIN));
    }

    @GetMapping("/signup")
    public ResponseEntity<Void> signup(HttpSession session, HttpServletRequest request) {
        log.info("GET /api/auth/signup sessionId={}", session.getId());
        return redirect(authService.buildAuthorizationUrl(session, request, AuthAction.SIGNUP));
    }

    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            HttpSession session,
            HttpServletRequest request,
            @RequestParam("code") String code,
            @RequestParam("state") String state
    ) {
        log.info("GET /api/auth/callback sessionId={} codePresent={} statePresent={}",
                session.getId(), code != null && !code.isBlank(), state != null && !state.isBlank());
        authService.handleCallback(session, request, code, state);
        String redirectUrl = UriComponentsBuilder.fromUriString(authService.frontendRootUri())
                .queryParam("auth", "success")
                .build()
                .toUriString();
        return redirect(redirectUrl);
    }

    @GetMapping("/session")
    public ApiResponse<AuthSessionResponse> session(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        BffSessionState sessionState = authService.getSessionState(session);
        boolean authenticated = sessionState != null;
        log.info("GET /api/auth/session sessionId={} authenticated={}", session == null ? "none" : session.getId(), authenticated);
        return ApiResponse.ok("auth session fetch success", new AuthSessionResponse(
                authenticated,
                authenticated ? sessionState.expiresAt() : 0L,
                authenticated ? sessionState.user() : null
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<LogoutResponse>> logout(
            HttpServletRequest request,
            @RequestBody(required = false) LogoutRequest logoutRequest
    ) {
        HttpSession session = request.getSession(false);
        String idTokenHint = logoutRequest == null ? null : logoutRequest.idTokenHint();
        log.info("POST /api/auth/logout idTokenHintPresent={}", idTokenHint != null && !idTokenHint.isBlank());
        LogoutResponse response = authService.logout(request, session, idTokenHint);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, expireSessionCookie(request).toString())
                .body(ApiResponse.ok("logout url build success", response));
    }

    private ResponseEntity<Void> redirect(String location) {
        return ResponseEntity.status(302)
                .header(HttpHeaders.LOCATION, location)
                .build();
    }

    private ResponseCookie expireSessionCookie(HttpServletRequest request) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(sessionCookieName, "")
                .httpOnly(true)
                .secure(sessionCookieSecure || request.isSecure())
                .path(resolveCookiePath(request))
                .maxAge(0);

        if (sessionCookieSameSite != null && !sessionCookieSameSite.isBlank()) {
            builder.sameSite(sessionCookieSameSite);
        }

        if (sessionCookieDomain != null && !sessionCookieDomain.isBlank()) {
            builder.domain(sessionCookieDomain);
        }

        return builder.build();
    }

    private String resolveCookiePath(HttpServletRequest request) {
        if (sessionCookiePath != null && !sessionCookiePath.isBlank()) {
            return sessionCookiePath;
        }
        String contextPath = request.getContextPath();
        if (contextPath == null || contextPath.isBlank()) {
            return "/";
        }
        return contextPath;
    }
}
