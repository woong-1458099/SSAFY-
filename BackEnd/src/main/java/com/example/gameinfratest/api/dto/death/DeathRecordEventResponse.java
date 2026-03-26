package com.example.gameinfratest.api.dto.death;

import com.example.gameinfratest.death.DeathRecord;
import java.time.Instant;
import java.util.UUID;

public record DeathRecordEventResponse(
        UUID id,
        UUID userId,
        String username,
        String email,
        int deathCountSnapshot,
        Instant diedAt,
        String areaId,
        String sceneId,
        String cause
) {
    public static DeathRecordEventResponse from(DeathRecord deathRecord) {
        return new DeathRecordEventResponse(
                deathRecord.getId(),
                deathRecord.getUser().getId(),
                deathRecord.getUser().getUsername(),
                deathRecord.getUser().getEmail(),
                deathRecord.getDeathCountSnapshot(),
                deathRecord.getCreatedAt(),
                deathRecord.getAreaId(),
                deathRecord.getSceneId(),
                deathRecord.getCause()
        );
    }
}
