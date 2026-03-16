package com.example.gameinfratest.save;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SaveFileRepository extends JpaRepository<SaveFile, UUID> {
    List<SaveFile> findByUser_IdOrderByUpdatedAtDesc(UUID userId);
}
