package com.example.gameinfratest.api.controller;

import com.example.gameinfratest.api.dto.ApiResponse;
import com.example.gameinfratest.api.dto.save.CreateInventoryItemRequest;
import com.example.gameinfratest.api.dto.save.CreateSaveFileRequest;
import com.example.gameinfratest.api.dto.save.InventoryItemResponse;
import com.example.gameinfratest.api.dto.save.SaveFileResponse;
import com.example.gameinfratest.api.dto.save.UpdateInventoryItemRequest;
import com.example.gameinfratest.api.dto.save.UpdateSaveFileRequest;
import com.example.gameinfratest.save.InventoryItem;
import com.example.gameinfratest.save.SaveFile;
import com.example.gameinfratest.service.AuthorizationService;
import com.example.gameinfratest.service.SaveFileService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class SaveFileController {
    private final SaveFileService saveFileService;
    private final AuthorizationService authorizationService;

    public SaveFileController(SaveFileService saveFileService, AuthorizationService authorizationService) {
        this.saveFileService = saveFileService;
        this.authorizationService = authorizationService;
    }

    @GetMapping("/users/{userId}/save-files")
    public ApiResponse<List<SaveFileResponse>> userSaveFiles(@PathVariable("userId") UUID userId) {
        authorizationService.requireUserAccess(userId);
        return ApiResponse.ok("save file list success", saveFileService.getUserSaveFiles(userId));
    }

    @GetMapping("/save-files/{saveFileId}")
    public ApiResponse<SaveFileResponse> saveFile(@PathVariable("saveFileId") UUID saveFileId) {
        SaveFile saveFile = saveFileService.getSaveFileEntity(saveFileId);
        authorizationService.requireUserAccess(saveFile.getUser().getId());
        return ApiResponse.ok("save file fetch success", SaveFileResponse.from(saveFile));
    }

    @PostMapping("/users/{userId}/save-files")
    public ApiResponse<SaveFileResponse> createSaveFile(
            @PathVariable("userId") UUID userId,
            @Valid @RequestBody CreateSaveFileRequest request
    ) {
        authorizationService.requireUserAccess(userId);
        return ApiResponse.ok("save file create success", saveFileService.createSaveFile(userId, request));
    }

    @PutMapping("/save-files/{saveFileId}")
    public ApiResponse<SaveFileResponse> updateSaveFile(
            @PathVariable("saveFileId") UUID saveFileId,
            @Valid @RequestBody UpdateSaveFileRequest request
    ) {
        SaveFile saveFile = saveFileService.getSaveFileEntity(saveFileId);
        authorizationService.requireUserAccess(saveFile.getUser().getId());
        return ApiResponse.ok("save file update success", saveFileService.updateSaveFile(saveFileId, request));
    }

    @DeleteMapping("/save-files/{saveFileId}")
    public ResponseEntity<ApiResponse<Void>> deleteSaveFile(@PathVariable("saveFileId") UUID saveFileId) {
        SaveFile saveFile = saveFileService.getSaveFileEntity(saveFileId);
        authorizationService.requireUserAccess(saveFile.getUser().getId());
        saveFileService.deleteSaveFile(saveFileId);
        return ResponseEntity.ok(ApiResponse.ok("save file delete success", null));
    }

    @GetMapping("/save-files/{saveFileId}/inventory")
    public ApiResponse<List<InventoryItemResponse>> inventory(@PathVariable("saveFileId") UUID saveFileId) {
        SaveFile saveFile = saveFileService.getSaveFileEntity(saveFileId);
        authorizationService.requireUserAccess(saveFile.getUser().getId());
        return ApiResponse.ok("inventory fetch success", saveFileService.getInventoryItems(saveFileId));
    }

    @PostMapping("/save-files/{saveFileId}/inventory")
    public ApiResponse<InventoryItemResponse> createInventoryItem(
            @PathVariable("saveFileId") UUID saveFileId,
            @Valid @RequestBody CreateInventoryItemRequest request
    ) {
        SaveFile saveFile = saveFileService.getSaveFileEntity(saveFileId);
        authorizationService.requireUserAccess(saveFile.getUser().getId());
        return ApiResponse.ok("inventory item create success", saveFileService.createInventoryItem(saveFileId, request));
    }

    @PutMapping("/inventory-items/{inventoryItemId}")
    public ApiResponse<InventoryItemResponse> updateInventoryItem(
            @PathVariable("inventoryItemId") UUID inventoryItemId,
            @Valid @RequestBody UpdateInventoryItemRequest request
    ) {
        InventoryItem inventoryItem = saveFileService.getInventoryItemEntity(inventoryItemId);
        authorizationService.requireUserAccess(inventoryItem.getSaveFile().getUser().getId());
        return ApiResponse.ok("inventory item update success", saveFileService.updateInventoryItem(inventoryItemId, request));
    }

    @DeleteMapping("/inventory-items/{inventoryItemId}")
    public ResponseEntity<ApiResponse<Void>> deleteInventoryItem(@PathVariable("inventoryItemId") UUID inventoryItemId) {
        InventoryItem inventoryItem = saveFileService.getInventoryItemEntity(inventoryItemId);
        authorizationService.requireUserAccess(inventoryItem.getSaveFile().getUser().getId());
        saveFileService.deleteInventoryItem(inventoryItemId);
        return ResponseEntity.ok(ApiResponse.ok("inventory item delete success", null));
    }
}
