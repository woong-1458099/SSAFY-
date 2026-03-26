package com.example.gameinfratest.api.controller;

import com.example.gameinfratest.api.dto.ApiResponse;
import com.example.gameinfratest.api.dto.auth.DeathRecordTokenResponse;
import com.example.gameinfratest.api.dto.auth.UserResponse;
import com.example.gameinfratest.service.AuthorizationService;
import com.example.gameinfratest.service.DeathRecordVerificationService;
import com.example.gameinfratest.service.UserService;
import com.example.gameinfratest.support.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
public class UserController {
    private static final String DEATH_RECORD_TOKEN_HEADER = "X-Death-Record-Token";
    private static final String SESSION_REQUIRED_MESSAGE = "death record APIs require an authenticated session";

    private final UserService userService;
    private final AuthorizationService authorizationService;
    private final DeathRecordVerificationService deathRecordVerificationService;

    public UserController(
            UserService userService,
            AuthorizationService authorizationService,
            DeathRecordVerificationService deathRecordVerificationService
    ) {
        this.userService = userService;
        this.authorizationService = authorizationService;
        this.deathRecordVerificationService = deathRecordVerificationService;
    }

    @PostMapping("/bootstrap")
    public ApiResponse<UserResponse> bootstrap() {
        return ApiResponse.ok("user bootstrap success", authorizationService.requireAuthenticatedUser());
    }

    @GetMapping
    public ApiResponse<UserResponse> me() {
        return ApiResponse.ok("user fetch success", authorizationService.requireAuthenticatedUser());
    }

    @PostMapping("/deaths/token")
    public ApiResponse<DeathRecordTokenResponse> issueDeathRecordToken(HttpServletRequest request) {
        UserResponse currentUser = authorizationService.requireAuthenticatedSessionUser();
        HttpSession session = requireSession(request);
        return ApiResponse.ok(
                "user death record token issue success",
                deathRecordVerificationService.issueToken(session, currentUser.id())
        );
    }

    @PostMapping("/deaths")
    public ApiResponse<UserResponse> recordDeath(
            HttpServletRequest request,
            @RequestHeader(value = DEATH_RECORD_TOKEN_HEADER, required = false) String deathRecordToken
    ) {
        UserResponse currentUser = authorizationService.requireAuthenticatedSessionUser();
        HttpSession session = requireSession(request);
        deathRecordVerificationService.verifyAndConsume(session, currentUser.id(), deathRecordToken);
        return ApiResponse.ok("user death count update success", userService.recordDeath(currentUser.id()));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteMe() {
        UserResponse currentUser = authorizationService.requireAuthenticatedUser();
        userService.softDeleteCurrentUser(currentUser.id());
        return ResponseEntity.ok(ApiResponse.ok("user delete success", null));
    }

    private HttpSession requireSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "DEATH_RECORD_SESSION_REQUIRED", SESSION_REQUIRED_MESSAGE);
        }
        return session;
    }
}
