package com.example.gameinfratest.user;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {
    boolean existsByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    Optional<User> findByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    Optional<User> findByProviderAndProviderIdAndDeletedAtIsNull(String provider, String providerId);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update User user
               set user.deathCount = user.deathCount + 1,
                   user.lastDeathAt = :occurredAt,
                   user.updatedAt = :occurredAt
             where user.id = :userId
               and user.deletedAt is null
            """)
    int incrementDeathCount(@Param("userId") UUID userId, @Param("occurredAt") Instant occurredAt);
}
