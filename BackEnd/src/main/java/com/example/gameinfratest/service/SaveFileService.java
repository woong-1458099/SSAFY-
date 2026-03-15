package com.example.gameinfratest.service;

import com.example.gameinfratest.api.dto.save.CreateInventoryItemRequest;
import com.example.gameinfratest.api.dto.save.CreateSaveFileRequest;
import com.example.gameinfratest.api.dto.save.InventoryItemResponse;
import com.example.gameinfratest.api.dto.save.SaveFileResponse;
import com.example.gameinfratest.api.dto.save.UpdateInventoryItemRequest;
import com.example.gameinfratest.api.dto.save.UpdateSaveFileRequest;
import com.example.gameinfratest.save.InventoryItem;
import com.example.gameinfratest.save.InventoryItemRepository;
import com.example.gameinfratest.save.SaveFile;
import com.example.gameinfratest.save.SaveFileRepository;
import com.example.gameinfratest.support.ApiException;
import com.example.gameinfratest.user.User;
import com.example.gameinfratest.user.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SaveFileService {
    private final SaveFileRepository saveFileRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final UserRepository userRepository;

    public SaveFileService(
            SaveFileRepository saveFileRepository,
            InventoryItemRepository inventoryItemRepository,
            UserRepository userRepository
    ) {
        this.saveFileRepository = saveFileRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<SaveFileResponse> getUserSaveFiles(UUID userId) {
        ensureUserExists(userId);
        return saveFileRepository.findByUser_IdOrderByUpdatedAtDesc(userId).stream()
                .map(SaveFileResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public SaveFileResponse getSaveFile(UUID saveFileId) {
        return SaveFileResponse.from(getSaveFileEntity(saveFileId));
    }

    @Transactional
    public SaveFileResponse createSaveFile(UUID userId, CreateSaveFileRequest request) {
        User user = ensureUserExists(userId);
        SaveFile saveFile = new SaveFile();
        saveFile.setId(UUID.randomUUID());
        saveFile.setUser(user);
        saveFile.setSlotNumber(request.slotNumber());
        saveFile.setName(request.name().trim());
        saveFile.setGameState(request.gameState());
        return SaveFileResponse.from(saveFileRepository.save(saveFile));
    }

    @Transactional
    public SaveFileResponse updateSaveFile(UUID saveFileId, UpdateSaveFileRequest request) {
        SaveFile saveFile = getSaveFileEntity(saveFileId);
        saveFile.setSlotNumber(request.slotNumber());
        saveFile.setName(request.name().trim());
        saveFile.setGameState(request.gameState());
        return SaveFileResponse.from(saveFileRepository.save(saveFile));
    }

    @Transactional
    public void deleteSaveFile(UUID saveFileId) {
        saveFileRepository.delete(getSaveFileEntity(saveFileId));
    }

    @Transactional(readOnly = true)
    public List<InventoryItemResponse> getInventoryItems(UUID saveFileId) {
        getSaveFileEntity(saveFileId);
        return inventoryItemRepository.findBySaveFile_IdOrderByCreatedAtAsc(saveFileId).stream()
                .map(InventoryItemResponse::from)
                .toList();
    }

    @Transactional
    public InventoryItemResponse createInventoryItem(UUID saveFileId, CreateInventoryItemRequest request) {
        SaveFile saveFile = getSaveFileEntity(saveFileId);
        InventoryItem inventoryItem = new InventoryItem();
        inventoryItem.setId(UUID.randomUUID());
        inventoryItem.setSaveFile(saveFile);
        inventoryItem.setItemCode(request.itemCode().trim());
        inventoryItem.setItemName(request.itemName().trim());
        inventoryItem.setQuantity(request.quantity());
        inventoryItem.setMetadata(request.metadata());
        return InventoryItemResponse.from(inventoryItemRepository.save(inventoryItem));
    }

    @Transactional
    public InventoryItemResponse updateInventoryItem(UUID inventoryItemId, UpdateInventoryItemRequest request) {
        InventoryItem inventoryItem = getInventoryItemEntity(inventoryItemId);
        inventoryItem.setItemCode(request.itemCode().trim());
        inventoryItem.setItemName(request.itemName().trim());
        inventoryItem.setQuantity(request.quantity());
        inventoryItem.setMetadata(request.metadata());
        return InventoryItemResponse.from(inventoryItemRepository.save(inventoryItem));
    }

    @Transactional
    public void deleteInventoryItem(UUID inventoryItemId) {
        inventoryItemRepository.delete(getInventoryItemEntity(inventoryItemId));
    }

    @Transactional(readOnly = true)
    public SaveFile getSaveFileEntity(UUID saveFileId) {
        return saveFileRepository.findById(saveFileId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SAVE_FILE_NOT_FOUND", "save file not found"));
    }

    @Transactional(readOnly = true)
    public InventoryItem getInventoryItemEntity(UUID inventoryItemId) {
        return inventoryItemRepository.findById(inventoryItemId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "INVENTORY_ITEM_NOT_FOUND", "inventory item not found"));
    }

    private User ensureUserExists(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "user not found"));
    }
}
