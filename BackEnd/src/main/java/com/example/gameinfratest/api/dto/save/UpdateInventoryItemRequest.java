package com.example.gameinfratest.api.dto.save;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record UpdateInventoryItemRequest(
        @NotBlank(message = "itemCode is required")
        String itemCode,

        @NotBlank(message = "itemName is required")
        String itemName,

        @Min(value = 1, message = "quantity must be at least 1")
        int quantity,

        String metadata
) {
}
