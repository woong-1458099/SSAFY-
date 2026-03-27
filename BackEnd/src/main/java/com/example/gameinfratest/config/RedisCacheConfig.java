package com.example.gameinfratest.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.CacheManager;
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
public class RedisCacheConfig {
    public static final String DEATH_RECENT_CACHE = "deathDashboard:recent";
    public static final String DEATH_RANKING_CACHE = "deathDashboard:ranking";
    public static final String DEATH_DASHBOARD_CACHE = "deathDashboard:dashboard";

    @Bean
    public CacheManager cacheManager(
            RedisConnectionFactory redisConnectionFactory,
            DeathDashboardCacheProperties cacheProperties,
            ObjectMapper objectMapper
    ) {
        cacheProperties.validateRuntime();
        RedisSerializationContext.SerializationPair<Object> serializer =
                RedisSerializationContext.SerializationPair.fromSerializer(
                        new GenericJackson2JsonRedisSerializer(objectMapper)
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
}
