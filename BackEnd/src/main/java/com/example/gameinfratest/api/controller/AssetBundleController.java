package com.example.gameinfratest.api.controller;

import com.example.gameinfratest.api.dto.ApiResponse;
import com.example.gameinfratest.api.dto.assetbundle.AssetBundleFileResponse;
import com.example.gameinfratest.service.AssetBundleService;
import com.example.gameinfratest.service.AuthorizationService;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AssetBundleController {
    private final AssetBundleService assetBundleService;
    private final AuthorizationService authorizationService;

    public AssetBundleController(AssetBundleService assetBundleService, AuthorizationService authorizationService) {
        this.assetBundleService = assetBundleService;
        this.authorizationService = authorizationService;
    }

    @GetMapping("/asset-bundles/{assetBundleId}/files")
    public ApiResponse<List<AssetBundleFileResponse>> assetBundleFiles(@PathVariable("assetBundleId") UUID assetBundleId) {
        authorizationService.requireSystemAccess();
        return ApiResponse.ok("asset bundle file list success", assetBundleService.getAssetBundleFiles(assetBundleId));
    }
}
