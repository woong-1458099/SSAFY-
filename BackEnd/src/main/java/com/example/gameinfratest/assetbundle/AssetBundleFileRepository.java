package com.example.gameinfratest.assetbundle;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetBundleFileRepository extends JpaRepository<AssetBundleFile, UUID> {
    List<AssetBundleFile> findByAssetBundleIdOrderByPathAsc(UUID assetBundleId);
}
