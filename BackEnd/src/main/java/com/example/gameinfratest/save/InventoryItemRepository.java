package com.example.gameinfratest.save;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID> {
    List<InventoryItem> findBySaveFile_IdOrderByCreatedAtAsc(UUID saveFileId);
}
