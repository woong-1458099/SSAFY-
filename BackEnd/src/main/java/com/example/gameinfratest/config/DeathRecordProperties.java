package com.example.gameinfratest.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.user.death-record")
public class DeathRecordProperties {
    private Duration cooldown = Duration.ofSeconds(3);
    private Duration tokenTtl = Duration.ofSeconds(30);

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
}
