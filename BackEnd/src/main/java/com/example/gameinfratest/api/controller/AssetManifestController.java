package com.example.gameinfratest.api.controller;

import com.example.gameinfratest.api.dto.ApiResponse;
import com.example.gameinfratest.api.dto.assets.AssetManifestResponse;
import com.example.gameinfratest.service.AssetManifestService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/assets")
public class AssetManifestController {

    private final AssetManifestService assetManifestService;

    public AssetManifestController(AssetManifestService assetManifestService) {
        this.assetManifestService = assetManifestService;
    }

    @GetMapping("/manifest")
    public ApiResponse<AssetManifestResponse> manifest() {
        return ApiResponse.ok("asset manifest success", assetManifestService.getManifest());
    }
}
