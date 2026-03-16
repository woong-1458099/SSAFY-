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
import org.springframework.http.HttpHeaders;
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

    public AuthController(AuthService authService) {
        this.authService = authService;
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
        String redirectUrl = UriComponentsBuilder.fromUriString(request.getRequestURL().toString())
                .replacePath("/")
                .replaceQuery("auth=success")
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
    public ApiResponse<LogoutResponse> logout(
            HttpServletRequest request,
            @RequestBody(required = false) LogoutRequest logoutRequest
    ) {
        HttpSession session = request.getSession(false);
        String idTokenHint = logoutRequest == null ? null : logoutRequest.idTokenHint();
        log.info("POST /api/auth/logout idTokenHintPresent={}", idTokenHint != null && !idTokenHint.isBlank());
        return ApiResponse.ok("logout url build success", authService.logout(request, session, idTokenHint));
    }

    private ResponseEntity<Void> redirect(String location) {
        return ResponseEntity.status(302)
                .header(HttpHeaders.LOCATION, location)
                .build();
    }
}
