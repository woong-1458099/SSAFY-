package com.example.gameinfratest.user;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {
    boolean existsByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    Optional<User> findByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    Optional<User> findByProviderAndProviderIdAndDeletedAtIsNull(String provider, String providerId);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select user
              from User user
             where user.id = :userId
               and user.deletedAt is null
            """)
    Optional<User> findByIdAndDeletedAtIsNullForUpdate(@Param("userId") UUID userId);

    @Query("""
            select user
              from User user
             where user.deletedAt is null
               and user.deathCount > 0
             order by user.deathCount desc, user.lastDeathAt desc, user.createdAt asc
            """)
    List<User> findTopDeathRanking(Pageable pageable);
}
