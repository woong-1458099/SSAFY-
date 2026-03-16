package com.example.gameinfratest.api.dto.save;

import com.example.gameinfratest.save.InventoryItem;
import java.time.Instant;
import java.util.UUID;

public record InventoryItemResponse(
        UUID id,
        UUID saveFileId,
        String itemCode,
        String itemName,
        int quantity,
        String metadata,
        Instant createdAt,
        Instant updatedAt
) {
    public static InventoryItemResponse from(InventoryItem inventoryItem) {
        return new InventoryItemResponse(
                inventoryItem.getId(),
                inventoryItem.getSaveFile().getId(),
                inventoryItem.getItemCode(),
                inventoryItem.getItemName(),
                inventoryItem.getQuantity(),
                inventoryItem.getMetadata(),
                inventoryItem.getCreatedAt(),
                inventoryItem.getUpdatedAt()
        );
    }
}
