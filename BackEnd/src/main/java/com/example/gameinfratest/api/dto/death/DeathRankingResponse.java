package com.example.gameinfratest.api.dto.death;

import com.example.gameinfratest.user.User;
import java.time.Instant;
import java.util.UUID;

public record DeathRankingResponse(
        UUID userId,
        String username,
        String email,
        int deathCount,
        Instant lastDeathAt
) {
    public static DeathRankingResponse from(User user) {
        return new DeathRankingResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDeathCount(),
                user.getLastDeathAt()
        );
    }
}
