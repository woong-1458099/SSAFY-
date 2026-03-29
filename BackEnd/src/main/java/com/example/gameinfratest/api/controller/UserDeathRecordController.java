package com.example.gameinfratest.api.controller;

import com.example.gameinfratest.api.dto.ApiResponse;
import com.example.gameinfratest.api.dto.auth.DeathRecordTokenResponse;
import com.example.gameinfratest.api.dto.auth.UserResponse;
import com.example.gameinfratest.api.dto.death.RecordDeathRequest;
import com.example.gameinfratest.service.AuthorizationService;
import com.example.gameinfratest.service.DeathRecordService;
import com.example.gameinfratest.service.DeathRecordVerificationService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me/deaths")
public class UserDeathRecordController {

    private final AuthorizationService authorizationService;
    private final DeathRecordVerificationService deathRecordVerificationService;
    private final DeathRecordService deathRecordService;

    public UserDeathRecordController(
            AuthorizationService authorizationService,
            DeathRecordVerificationService deathRecordVerificationService,
            DeathRecordService deathRecordService
    ) {
        this.authorizationService = authorizationService;
        this.deathRecordVerificationService = deathRecordVerificationService;
        this.deathRecordService = deathRecordService;
    }

    @PostMapping("/token")
    public ApiResponse<DeathRecordTokenResponse> issueDeathRecordToken(HttpSession session) {
        UserResponse currentUser = authorizationService.requireAuthenticatedUser();
        DeathRecordTokenResponse response = deathRecordVerificationService.issueToken(session, currentUser.id());
        return ApiResponse.ok("death record token issued", response);
    }

    @PostMapping
    public ApiResponse<UserResponse> recordDeath(
            HttpSession session,
            @RequestHeader(value = "X-Death-Record-Token", required = false) String verificationToken,
            @Valid @RequestBody(required = false) RecordDeathRequest request
    ) {
        UserResponse currentUser = authorizationService.requireAuthenticatedUser();
        deathRecordVerificationService.verifyAndConsume(session, currentUser.id(), verificationToken);
        UserResponse response = deathRecordService.recordDeath(currentUser.id(), request);
        return ApiResponse.ok("death record success", response);
    }
}
