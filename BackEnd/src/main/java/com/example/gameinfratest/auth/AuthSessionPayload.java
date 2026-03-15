package com.example.gameinfratest.auth;

import com.example.gameinfratest.api.dto.auth.UserResponse;

public record AuthSessionPayload(
        String accessToken,
        String refreshToken,
        String idToken,
        long expiresAt,
        UserResponse user
) {
}
