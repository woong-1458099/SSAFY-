package com.example.gameinfratest.api.controller;

import com.example.gameinfratest.api.dto.ApiResponse;
import com.example.gameinfratest.api.dto.auth.UserResponse;
import com.example.gameinfratest.service.AuthorizationService;
import com.example.gameinfratest.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final UserService userService;
    private final AuthorizationService authorizationService;

    public UserController(UserService userService, AuthorizationService authorizationService) {
        this.userService = userService;
        this.authorizationService = authorizationService;
    }

    @PostMapping("/bootstrap")
    public ApiResponse<UserResponse> bootstrap() {
        return ApiResponse.ok("user bootstrap success", authorizationService.requireAuthenticatedUser());
    }

    @GetMapping
    public ApiResponse<UserResponse> me() {
        return ApiResponse.ok("user fetch success", authorizationService.requireAuthenticatedUser());
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteMe() {
        UserResponse currentUser = authorizationService.requireAuthenticatedUser();
        userService.softDeleteCurrentUser(currentUser.id());
        return ResponseEntity.ok(ApiResponse.ok("user delete success", null));
    }
}
