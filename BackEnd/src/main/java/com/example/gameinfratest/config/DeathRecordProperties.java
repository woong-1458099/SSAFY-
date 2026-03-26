package com.example.gameinfratest.config;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.user.death-record")
public class DeathRecordProperties {
    @NotNull(message = "app.user.death-record.cooldown is required")
    private Duration cooldown = Duration.ofSeconds(3);

    @NotNull(message = "app.user.death-record.token-ttl is required")
    private Duration tokenTtl = Duration.ofSeconds(30);

    @Positive(message = "app.user.death-record.max-active-tokens must be greater than 0")
    private int maxActiveTokens = 5;

    @Positive(message = "app.user.death-record.max-failure-attempts must be greater than 0")
    private int maxFailureAttempts = 5;

    @NotNull(message = "app.user.death-record.failure-lockout is required")
    private Duration failureLockout = Duration.ofSeconds(30);

    public Duration getCooldown() {
        return cooldown;
    }

    public void setCooldown(Duration cooldown) {
        this.cooldown = cooldown;
    }

    public Duration getTokenTtl() {
        return tokenTtl;
    }

    public void setTokenTtl(Duration tokenTtl) {
        this.tokenTtl = tokenTtl;
    }

    public int getMaxActiveTokens() {
        return maxActiveTokens;
    }

    public void setMaxActiveTokens(int maxActiveTokens) {
        this.maxActiveTokens = maxActiveTokens;
    }

    public int getMaxFailureAttempts() {
        return maxFailureAttempts;
    }

    public void setMaxFailureAttempts(int maxFailureAttempts) {
        this.maxFailureAttempts = maxFailureAttempts;
    }

    public Duration getFailureLockout() {
        return failureLockout;
    }

    public void setFailureLockout(Duration failureLockout) {
        this.failureLockout = failureLockout;
    }

    @AssertTrue(message = "app.user.death-record.cooldown must be greater than 0")
    public boolean isCooldownPositive() {
        return isPositive(cooldown);
    }

    @AssertTrue(message = "app.user.death-record.token-ttl must be greater than 0")
    public boolean isTokenTtlPositive() {
        return isPositive(tokenTtl);
    }

    @AssertTrue(message = "app.user.death-record.failure-lockout must be greater than 0")
    public boolean isFailureLockoutPositive() {
        return isPositive(failureLockout);
    }

    public void validateRuntime() {
        requirePositive(cooldown, "app.user.death-record.cooldown");
        requirePositive(tokenTtl, "app.user.death-record.token-ttl");
        requirePositive(maxActiveTokens, "app.user.death-record.max-active-tokens");
        requirePositive(maxFailureAttempts, "app.user.death-record.max-failure-attempts");
        requirePositive(failureLockout, "app.user.death-record.failure-lockout");
    }

    private boolean isPositive(Duration value) {
        return value != null && value.compareTo(Duration.ZERO) > 0;
    }

    private void requirePositive(Duration value, String propertyName) {
        if (!isPositive(value)) {
            throw new IllegalStateException(propertyName + " must be greater than 0");
        }
    }

    private void requirePositive(int value, String propertyName) {
        if (value <= 0) {
            throw new IllegalStateException(propertyName + " must be greater than 0");
        }
    }
}
