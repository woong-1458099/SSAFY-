package com.example.gameinfratest.api.controller;

import com.example.gameinfratest.api.dto.ApiResponse;
import com.example.gameinfratest.api.dto.auth.UserResponse;
import com.example.gameinfratest.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/bootstrap")
    public ApiResponse<UserResponse> bootstrap(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok("user bootstrap success", userService.upsertFromJwt(jwt));
    }

    @GetMapping
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok("user fetch success", userService.getCurrentUser(jwt));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteMe(@AuthenticationPrincipal Jwt jwt) {
        userService.softDeleteCurrentUser(jwt);
        return ResponseEntity.ok(ApiResponse.ok("user delete success", null));
    }
}
