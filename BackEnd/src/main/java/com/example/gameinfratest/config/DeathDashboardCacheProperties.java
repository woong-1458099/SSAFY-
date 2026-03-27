package com.example.gameinfratest.config;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.cache.death-dashboard")
public class DeathDashboardCacheProperties {
    @NotNull(message = "app.cache.death-dashboard.recent-ttl is required")
    private Duration recentTtl = Duration.ofSeconds(15);

    @NotNull(message = "app.cache.death-dashboard.ranking-ttl is required")
    private Duration rankingTtl = Duration.ofSeconds(15);

    @NotNull(message = "app.cache.death-dashboard.dashboard-ttl is required")
    private Duration dashboardTtl = Duration.ofSeconds(15);

    public Duration getRecentTtl() {
        return recentTtl;
    }

    public void setRecentTtl(Duration recentTtl) {
        this.recentTtl = recentTtl;
    }

    public Duration getRankingTtl() {
        return rankingTtl;
    }

    public void setRankingTtl(Duration rankingTtl) {
        this.rankingTtl = rankingTtl;
    }

    public Duration getDashboardTtl() {
        return dashboardTtl;
    }

    public void setDashboardTtl(Duration dashboardTtl) {
        this.dashboardTtl = dashboardTtl;
    }

    @AssertTrue(message = "app.cache.death-dashboard.recent-ttl must be greater than 0")
    public boolean isRecentTtlPositive() {
        return isPositive(recentTtl);
    }

    @AssertTrue(message = "app.cache.death-dashboard.ranking-ttl must be greater than 0")
    public boolean isRankingTtlPositive() {
        return isPositive(rankingTtl);
    }

    @AssertTrue(message = "app.cache.death-dashboard.dashboard-ttl must be greater than 0")
    public boolean isDashboardTtlPositive() {
        return isPositive(dashboardTtl);
    }

    public void validateRuntime() {
        requirePositive(recentTtl, "app.cache.death-dashboard.recent-ttl");
        requirePositive(rankingTtl, "app.cache.death-dashboard.ranking-ttl");
        requirePositive(dashboardTtl, "app.cache.death-dashboard.dashboard-ttl");
    }

    private boolean isPositive(Duration value) {
        return value != null && value.compareTo(Duration.ZERO) > 0;
    }

    private void requirePositive(Duration value, String propertyName) {
        if (!isPositive(value)) {
            throw new IllegalStateException(propertyName + " must be greater than 0");
        }
    }
}
