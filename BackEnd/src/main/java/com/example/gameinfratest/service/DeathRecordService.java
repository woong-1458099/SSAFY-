package com.example.gameinfratest.service;

import com.example.gameinfratest.api.dto.auth.UserResponse;
import com.example.gameinfratest.api.dto.death.DeathDashboardResponse;
import com.example.gameinfratest.api.dto.death.DeathRankingResponse;
import com.example.gameinfratest.api.dto.death.DeathRecordEventResponse;
import com.example.gameinfratest.config.RedisCacheConfig;
import com.example.gameinfratest.api.dto.death.RecordDeathRequest;
import com.example.gameinfratest.config.DeathRecordProperties;
import com.example.gameinfratest.death.DeathRecord;
import com.example.gameinfratest.death.DeathRecordRepository;
import com.example.gameinfratest.support.ApiException;
import com.example.gameinfratest.user.User;
import com.example.gameinfratest.user.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DeathRecordService {
    private static final int DEFAULT_RECENT_LIMIT = 10;
    private static final int DEFAULT_RANKING_LIMIT = 10;
    private static final int MAX_QUERY_LIMIT = 50;

    private final UserRepository userRepository;
    private final DeathRecordRepository deathRecordRepository;
    private final DeathRecordProperties deathRecordProperties;

    public DeathRecordService(
            UserRepository userRepository,
            DeathRecordRepository deathRecordRepository,
            DeathRecordProperties deathRecordProperties
    ) {
        this.userRepository = userRepository;
        this.deathRecordRepository = deathRecordRepository;
        this.deathRecordProperties = deathRecordProperties;
        this.deathRecordProperties.validateRuntime();
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = RedisCacheConfig.DEATH_RECENT_CACHE, allEntries = true),
            @CacheEvict(cacheNames = RedisCacheConfig.DEATH_RANKING_CACHE, allEntries = true),
            @CacheEvict(cacheNames = RedisCacheConfig.DEATH_DASHBOARD_CACHE, allEntries = true)
    })
    public UserResponse recordDeath(UUID userId, RecordDeathRequest request) {
        User user = userRepository.findByIdAndDeletedAtIsNullForUpdate(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "user profile not found"));

        Instant now = Instant.now();
        Instant lastDeathAt = user.getLastDeathAt();
        if (lastDeathAt != null && lastDeathAt.plus(deathRecordProperties.getCooldown()).isAfter(now)) {
            return UserResponse.from(user);
        }

        user.setDeathCount(user.getDeathCount() + 1);
        user.setLastDeathAt(now);
        User savedUser = userRepository.saveAndFlush(user);

        DeathRecord deathRecord = new DeathRecord();
        deathRecord.setId(UUID.randomUUID());
        deathRecord.setUser(savedUser);
        deathRecord.setAreaId(normalizeNullable(request == null ? null : request.areaId(), 100));
        deathRecord.setSceneId(normalizeNullable(request == null ? null : request.sceneId(), 100));
        deathRecord.setCause(normalizeNullable(request == null ? null : request.cause(), 120));
        deathRecord.setDeathCountSnapshot(savedUser.getDeathCount());
        deathRecordRepository.save(deathRecord);

        return UserResponse.from(savedUser);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisCacheConfig.DEATH_RECENT_CACHE, key = "#requestedLimit", sync = true)
    public List<DeathRecordEventResponse> getRecentDeaths(Integer requestedLimit) {
        int limit = sanitizeLimit(requestedLimit, DEFAULT_RECENT_LIMIT);
        return deathRecordRepository.findByUser_DeletedAtIsNullOrderByCreatedAtDesc(PageRequest.of(0, limit)).stream()
                .map(DeathRecordEventResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisCacheConfig.DEATH_RANKING_CACHE, key = "#requestedLimit", sync = true)
    public List<DeathRankingResponse> getDeathRanking(Integer requestedLimit) {
        int limit = sanitizeLimit(requestedLimit, DEFAULT_RANKING_LIMIT);
        return userRepository.findTopDeathRanking(PageRequest.of(0, limit)).stream()
                .map(DeathRankingResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(
            cacheNames = RedisCacheConfig.DEATH_DASHBOARD_CACHE,
            key = "T(java.lang.String).valueOf(#recentLimit) + ':' + T(java.lang.String).valueOf(#rankingLimit)",
            sync = true
    )
    public DeathDashboardResponse getDeathDashboard(Integer recentLimit, Integer rankingLimit) {
        return new DeathDashboardResponse(
                getRecentDeaths(recentLimit),
                getDeathRanking(rankingLimit)
        );
    }

    private int sanitizeLimit(Integer requestedLimit, int defaultLimit) {
        if (requestedLimit == null) {
            return defaultLimit;
        }
        return Math.max(1, Math.min(MAX_QUERY_LIMIT, requestedLimit));
    }

    private String normalizeNullable(String value, int maxLength) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        String normalized = trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
        return normalized.toUpperCase(Locale.ROOT);
    }
}
