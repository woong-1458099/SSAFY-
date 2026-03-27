package com.example.gameinfratest;

import org.springframework.boot.SpringApplication;

public class TestGameInfraTestApplication {

    public static void main(String[] args) {
        SpringApplication.from(GameInfraTestApplication::main).with(TestcontainersConfiguration.class).run(args);
    }

}
