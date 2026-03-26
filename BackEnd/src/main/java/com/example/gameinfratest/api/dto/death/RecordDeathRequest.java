package com.example.gameinfratest.api.dto.death;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RecordDeathRequest(
        @Size(max = 100, message = "areaId must be at most 100 characters")
        @Pattern(
                regexp = "^[A-Za-z0-9_./:-]+$",
                message = "areaId contains unsupported characters"
        )
        String areaId,
        @Size(max = 100, message = "sceneId must be at most 100 characters")
        @Pattern(
                regexp = "^[A-Za-z0-9_./:-]+$",
                message = "sceneId contains unsupported characters"
        )
        String sceneId,
        @Size(max = 120, message = "cause must be at most 120 characters")
        @Pattern(
                regexp = "^[A-Za-z0-9_./:-]+$",
                message = "cause contains unsupported characters"
        )
        String cause
) {
}
