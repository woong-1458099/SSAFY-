package com.example.gameinfratest.challenge;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserChallengeRepository extends JpaRepository<UserChallenge, UUID> {
    List<UserChallenge> findByUser_IdOrderByAssignedAtDesc(UUID userId);

    Optional<UserChallenge> findByUser_IdAndChallenge_Id(UUID userId, UUID challengeId);
}
