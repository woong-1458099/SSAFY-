package com.example.gameinfratest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class GameInfraTestApplication {

    public static void main(String[] args) {
        SpringApplication.run(GameInfraTestApplication.class, args);
    }

}
