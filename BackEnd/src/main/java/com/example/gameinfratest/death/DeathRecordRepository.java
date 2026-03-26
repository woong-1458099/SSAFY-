package com.example.gameinfratest.death;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeathRecordRepository extends JpaRepository<DeathRecord, UUID> {

    @EntityGraph(attributePaths = "user")
    List<DeathRecord> findByUser_DeletedAtIsNullOrderByCreatedAtDesc(Pageable pageable);
}
