package com.example.gameinfratest.api.dto.death;

public record RecordDeathRequest(
        String areaId,
        String sceneId,
        String cause
) {
}
