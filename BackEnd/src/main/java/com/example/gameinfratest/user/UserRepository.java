package com.example.gameinfratest.user;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

public interface UserRepository extends JpaRepository<User, UUID> {
    boolean existsByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    Optional<User> findByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    Optional<User> findByProviderAndProviderIdAndDeletedAtIsNull(String provider, String providerId);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select u
            from User u
            where u.id = :id
              and u.deletedAt is null
            """)
    Optional<User> findByIdAndDeletedAtIsNullForUpdate(@Param("id") UUID id);

    @Query("""
            select u
            from User u
            where u.deletedAt is null
            order by u.deathCount desc,
                     case when u.lastDeathAt is null then 1 else 0 end asc,
                     u.lastDeathAt desc,
                     u.createdAt asc
            """)
    List<User> findTopDeathRanking(Pageable pageable);
}
