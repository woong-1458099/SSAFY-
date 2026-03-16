package com.example.gameinfratest.api.dto.save;

import com.example.gameinfratest.save.SaveFile;
import java.time.Instant;
import java.util.UUID;

public record SaveFileResponse(
        UUID id,
        UUID userId,
        int slotNumber,
        String name,
        String gameState,
        Instant createdAt,
        Instant updatedAt
) {
    public static SaveFileResponse from(SaveFile saveFile) {
        return new SaveFileResponse(
                saveFile.getId(),
                saveFile.getUser().getId(),
                saveFile.getSlotNumber(),
                saveFile.getName(),
                saveFile.getGameState(),
                saveFile.getCreatedAt(),
                saveFile.getUpdatedAt()
        );
    }
}
