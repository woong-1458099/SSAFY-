package com.example.gameinfratest.api.dto.challenge;

import jakarta.validation.constraints.Min;

public record UpdateUserChallengeRequest(
        @Min(value = 0, message = "progress must be zero or greater")
        int progress,

        @Min(value = 1, message = "targetProgress must be at least 1")
        Integer targetProgress,

        String status
) {
}
