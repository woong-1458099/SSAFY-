package com.example.gameinfratest.challenge;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChallengeRepository extends JpaRepository<Challenge, UUID> {
}
