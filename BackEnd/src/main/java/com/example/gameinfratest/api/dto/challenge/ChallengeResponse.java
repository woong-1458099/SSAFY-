package com.example.gameinfratest.api.dto.challenge;

import com.example.gameinfratest.challenge.Challenge;
import java.time.Instant;
import java.util.UUID;

public record ChallengeResponse(
        UUID id,
        String code,
        String name,
        String description,
        int targetProgress,
        Instant createdAt,
        Instant updatedAt
) {
    public static ChallengeResponse from(Challenge challenge) {
        return new ChallengeResponse(
                challenge.getId(),
                challenge.getCode(),
                challenge.getName(),
                challenge.getDescription(),
                challenge.getTargetProgress(),
                challenge.getCreatedAt(),
                challenge.getUpdatedAt()
        );
    }
}
