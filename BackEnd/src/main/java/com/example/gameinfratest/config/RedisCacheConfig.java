package com.example.gameinfratest.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
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
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

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
        RedisSerializationContext.SerializationPair<Object> serializer =
                RedisSerializationContext.SerializationPair.fromSerializer(
                        new GenericJackson2JsonRedisSerializer(cacheObjectMapper(objectMapper))
                );

        RedisCacheConfiguration baseConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeValuesWith(serializer)
                .disableCachingNullValues();

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(baseConfig)
                .withCacheConfiguration(
                    DEATH_RECENT_CACHE,
                    baseConfig.entryTtl(cacheProperties.getRecentTtl())
                )
                .withCacheConfiguration(
                    DEATH_RANKING_CACHE,
                    baseConfig.entryTtl(cacheProperties.getRankingTtl())
                )
                .withCacheConfiguration(
                    DEATH_DASHBOARD_CACHE,
                    baseConfig.entryTtl(cacheProperties.getDashboardTtl())
                )
                .build();
    }

    @Override
    @Bean
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, org.springframework.cache.Cache cache, Object key) {
                log.warn("Cache GET failed for cache={} key={}: {}", cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception, org.springframework.cache.Cache cache, Object key, Object value) {
                log.error("Cache PUT failed for cache={} key={}: {}", cache.getName(), key, exception.getMessage(), exception);
                throw exception;
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, org.springframework.cache.Cache cache, Object key) {
                log.error("Cache EVICT failed for cache={} key={}: {}", cache.getName(), key, exception.getMessage(), exception);
                throw exception;
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, org.springframework.cache.Cache cache) {
                log.error("Cache CLEAR failed for cache={}: {}", cache.getName(), exception.getMessage(), exception);
                throw exception;
            }
        };
    }

    private ObjectMapper cacheObjectMapper(ObjectMapper objectMapper) {
        ObjectMapper cacheMapper = objectMapper.copy();
        cacheMapper.activateDefaultTyping(
                BasicPolymorphicTypeValidator.builder().allowIfSubType(Object.class).build(),
                ObjectMapper.DefaultTyping.EVERYTHING,
                JsonTypeInfo.As.PROPERTY
        );
        return cacheMapper;
    }
}
