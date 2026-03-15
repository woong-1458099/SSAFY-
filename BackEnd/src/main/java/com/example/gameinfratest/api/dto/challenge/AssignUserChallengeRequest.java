package com.example.gameinfratest.api.dto.challenge;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AssignUserChallengeRequest(
        @NotNull(message = "challengeId is required")
        UUID challengeId,

        @Min(value = 0, message = "initialProgress must be zero or greater")
        int initialProgress,

        @Min(value = 1, message = "targetProgress must be at least 1")
        Integer targetProgress
) {
}
