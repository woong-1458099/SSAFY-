package com.example.gameinfratest.api.controller;

import com.example.gameinfratest.api.dto.ApiResponse;
import com.example.gameinfratest.api.dto.challenge.AssignUserChallengeRequest;
import com.example.gameinfratest.api.dto.challenge.ChallengeResponse;
import com.example.gameinfratest.api.dto.challenge.UpdateUserChallengeRequest;
import com.example.gameinfratest.api.dto.challenge.UserChallengeResponse;
import com.example.gameinfratest.service.AuthorizationService;
import com.example.gameinfratest.service.ChallengeService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ChallengeController {
    private final ChallengeService challengeService;
    private final AuthorizationService authorizationService;

    public ChallengeController(ChallengeService challengeService, AuthorizationService authorizationService) {
        this.challengeService = challengeService;
        this.authorizationService = authorizationService;
    }

    @GetMapping("/challenges")
    public ApiResponse<List<ChallengeResponse>> challenges() {
        return ApiResponse.ok("challenge list success", challengeService.getChallenges());
    }

    @GetMapping("/users/{userId}/challenges")
    public ApiResponse<List<UserChallengeResponse>> userChallenges(@PathVariable("userId") UUID userId) {
        authorizationService.requireUserAccess(userId);
        return ApiResponse.ok("user challenge list success", challengeService.getUserChallenges(userId));
    }

    @PostMapping("/users/{userId}/challenges")
    public ApiResponse<UserChallengeResponse> assignUserChallenge(
            @PathVariable("userId") UUID userId,
            @Valid @RequestBody AssignUserChallengeRequest request
    ) {
        authorizationService.requireSystemAccess();
        return ApiResponse.ok("user challenge assign success", challengeService.assignUserChallenge(userId, request));
    }

    @PutMapping("/user-challenges/{userChallengeId}")
    public ApiResponse<UserChallengeResponse> updateUserChallenge(
            @PathVariable("userChallengeId") UUID userChallengeId,
            @Valid @RequestBody UpdateUserChallengeRequest request
    ) {
        authorizationService.requireSystemAccess();
        return ApiResponse.ok("user challenge update success", challengeService.updateUserChallenge(userChallengeId, request));
    }
}
