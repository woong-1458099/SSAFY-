package com.example.gameinfratest.api.dto.auth;

import java.time.Instant;

public record DeathRecordTokenResponse(
        String token,
        Instant expiresAt
) {
}
