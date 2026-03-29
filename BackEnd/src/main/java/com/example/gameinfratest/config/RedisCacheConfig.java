package com.example.gameinfratest.config;

import com.example.gameinfratest.api.dto.death.DeathDashboardResponse;
import com.example.gameinfratest.api.dto.death.DeathRankingResponse;
import com.example.gameinfratest.api.dto.death.DeathRecordEventResponse;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;

@Configuration
@EnableCaching
public class RedisCacheConfig implements CachingConfigurer {
    public static final String DEATH_RECENT_CACHE = "deathDashboard:recent";
    public static final String DEATH_RANKING_CACHE = "deathDashboard:ranking";
    public static final String DEATH_DASHBOARD_CACHE = "deathDashboard:dashboard";
    private static final Logger log = LoggerFactory.getLogger(RedisCacheConfig.class);

    @Bean
    public CacheManager cacheManager(
            RedisConnectionFactory redisConnectionFactory,
            DeathDashboardCacheProperties cacheProperties,
            ObjectMapper objectMapper
    ) {
        cacheProperties.validateRuntime();
        RedisCacheConfiguration baseConfig = RedisCacheConfiguration.defaultCacheConfig()
                .disableCachingNullValues();
        JavaType recentDeathListType = objectMapper.getTypeFactory()
                .constructCollectionType(List.class, DeathRecordEventResponse.class);
        JavaType deathRankingListType = objectMapper.getTypeFactory()
                .constructCollectionType(List.class, DeathRankingResponse.class);

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(baseConfig)
                .withCacheConfiguration(
                    DEATH_RECENT_CACHE,
                    typedCacheConfig(baseConfig, objectMapper, recentDeathListType, cacheProperties.getRecentTtl())
                )
                .withCacheConfiguration(
                    DEATH_RANKING_CACHE,
                    typedCacheConfig(baseConfig, objectMapper, deathRankingListType, cacheProperties.getRankingTtl())
                )
                .withCacheConfiguration(
                    DEATH_DASHBOARD_CACHE,
                    typedCacheConfig(
                            baseConfig,
                            objectMapper,
                            objectMapper.getTypeFactory().constructType(DeathDashboardResponse.class),
                            cacheProperties.getDashboardTtl()
                    )
                )
                .build();
    }

    @Override
    @Bean
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, org.springframework.cache.Cache cache, Object key) {
                log.error(
                        "Cache GET failed for cache={} key={} and will fall back to source of truth: {}",
                        cache.getName(),
                        key,
                        exception.getMessage(),
                        exception
                );
            }

            @Override
            public void handleCachePutError(RuntimeException exception, org.springframework.cache.Cache cache, Object key, Object value) {
                log.error("Cache PUT failed for cache={} key={}: {}", cache.getName(), key, exception.getMessage(), exception);
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, org.springframework.cache.Cache cache, Object key) {
                log.error("Cache EVICT failed for cache={} key={}: {}", cache.getName(), key, exception.getMessage(), exception);
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, org.springframework.cache.Cache cache) {
                log.error("Cache CLEAR failed for cache={}: {}", cache.getName(), exception.getMessage(), exception);
            }
        };
    }

    private RedisCacheConfiguration typedCacheConfig(
            RedisCacheConfiguration baseConfig,
            ObjectMapper objectMapper,
            JavaType javaType,
            java.time.Duration ttl
    ) {
        RedisSerializationContext.SerializationPair<Object> serializer =
                RedisSerializationContext.SerializationPair.fromSerializer(typedSerializer(objectMapper, javaType));
        return baseConfig.serializeValuesWith(serializer).entryTtl(ttl);
    }

    private RedisSerializer<Object> typedSerializer(ObjectMapper objectMapper, JavaType javaType) {
        return new Jackson2JsonRedisSerializer<>(objectMapper.copy(), javaType);
    }
}
