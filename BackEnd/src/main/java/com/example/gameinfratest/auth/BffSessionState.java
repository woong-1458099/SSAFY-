package com.example.gameinfratest.auth;

import com.example.gameinfratest.api.dto.auth.UserResponse;
import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;
import java.util.List;

public record BffSessionState(
        UserResponse user,
        String subject,
        List<String> authorities,
        String accessToken,
        String refreshToken,
        String idToken,
        long expiresAt
) implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    public static final String SESSION_KEY = "auth.bff.session";

    public boolean isExpired() {
        return expiresAt > 0 && Instant.now().toEpochMilli() >= expiresAt;
    }
}
