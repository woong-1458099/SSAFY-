package com.example.gameinfratest.api.dto.assetbundle;

import com.example.gameinfratest.assetbundle.AssetBundleFile;
import java.time.Instant;
import java.util.UUID;

public record AssetBundleFileResponse(
        UUID id,
        UUID assetBundleId,
        String path,
        String url,
        String checksum,
        long sizeBytes,
        Instant createdAt,
        Instant updatedAt
) {
    public static AssetBundleFileResponse from(AssetBundleFile file) {
        return new AssetBundleFileResponse(
                file.getId(),
                file.getAssetBundleId(),
                file.getPath(),
                file.getUrl(),
                file.getChecksum(),
                file.getSizeBytes(),
                file.getCreatedAt(),
                file.getUpdatedAt()
        );
    }
}
