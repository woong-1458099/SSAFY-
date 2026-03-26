package com.example.gameinfratest;

import com.example.gameinfratest.config.DeathRecordProperties;
import com.example.gameinfratest.config.DeathDashboardCacheProperties;
import com.example.gameinfratest.config.KeycloakAuthProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({
        KeycloakAuthProperties.class,
        DeathRecordProperties.class,
        DeathDashboardCacheProperties.class
})
public class GameInfraTestApplication {

    public static void main(String[] args) {
        SpringApplication.run(GameInfraTestApplication.class, args);
    }

}
