package com.example.gameinfratest.api.dto.auth;

public record AuthSessionResponse(
        String accessToken,
        String refreshToken,
        String idToken,
        long expiresAt,
        UserResponse user
) {
}
