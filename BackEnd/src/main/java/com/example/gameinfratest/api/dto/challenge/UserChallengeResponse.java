package com.example.gameinfratest.api.dto.challenge;

import com.example.gameinfratest.challenge.UserChallenge;
import java.time.Instant;
import java.util.UUID;

public record UserChallengeResponse(
        UUID id,
        UUID userId,
        ChallengeResponse challenge,
        int progress,
        int targetProgress,
        String status,
        Instant assignedAt,
        Instant achievedAt,
        Instant updatedAt
) {
    public static UserChallengeResponse from(UserChallenge userChallenge) {
        return new UserChallengeResponse(
                userChallenge.getId(),
                userChallenge.getUser().getId(),
                ChallengeResponse.from(userChallenge.getChallenge()),
                userChallenge.getProgress(),
                userChallenge.getTargetProgress(),
                userChallenge.getStatus(),
                userChallenge.getAssignedAt(),
                userChallenge.getAchievedAt(),
                userChallenge.getUpdatedAt()
        );
    }
}
