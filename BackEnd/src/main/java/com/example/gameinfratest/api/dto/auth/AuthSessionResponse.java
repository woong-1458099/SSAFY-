package com.example.gameinfratest.api.dto.auth;

public record AuthSessionResponse(
        boolean authenticated,
        long expiresAt,
        UserResponse user
) {
}
