package com.example.gameinfratest.api.dto.save;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record UpdateSaveFileRequest(
        @Min(value = 1, message = "slotNumber must be at least 1")
        int slotNumber,

        @NotBlank(message = "name is required")
        String name,

        String gameState
) {
}
