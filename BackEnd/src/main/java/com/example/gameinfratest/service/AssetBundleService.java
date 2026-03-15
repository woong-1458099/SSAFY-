package com.example.gameinfratest.service;

import com.example.gameinfratest.api.dto.assetbundle.AssetBundleFileResponse;
import com.example.gameinfratest.assetbundle.AssetBundleFileRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssetBundleService {
    private final AssetBundleFileRepository assetBundleFileRepository;

    public AssetBundleService(AssetBundleFileRepository assetBundleFileRepository) {
        this.assetBundleFileRepository = assetBundleFileRepository;
    }

    @Transactional(readOnly = true)
    public List<AssetBundleFileResponse> getAssetBundleFiles(UUID assetBundleId) {
        return assetBundleFileRepository.findByAssetBundleIdOrderByPathAsc(assetBundleId).stream()
                .map(AssetBundleFileResponse::from)
                .toList();
    }
}
