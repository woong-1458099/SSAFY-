package com.example.gameinfratest.api.controller;

import com.example.gameinfratest.api.dto.ApiResponse;
import com.example.gameinfratest.api.dto.EchoRequest;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ApiCheckController {

    private final JdbcTemplate jdbcTemplate;
    private final StringRedisTemplate redisTemplate;

    public ApiCheckController(JdbcTemplate jdbcTemplate, StringRedisTemplate redisTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.redisTemplate = redisTemplate;
    }

    @GetMapping("/public/ping")
    public ApiResponse<Map<String, Object>> publicPing() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("timestamp", Instant.now().toString());
        data.put("service", "game-infra-test");
        return ApiResponse.ok("public pong", data);
    }

    @PostMapping("/public/echo")
    public ApiResponse<Map<String, Object>> echo(@Valid @RequestBody EchoRequest request) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("echo", request.message());
        data.put("timestamp", Instant.now().toString());
        return ApiResponse.ok("echo success", data);
    }

    @GetMapping("/public/checks")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checks() {
        Map<String, Object> checks = new LinkedHashMap<>();
        boolean dbUp = checkDb(checks);
        boolean redisUp = checkRedis(checks);
        boolean allUp = dbUp && redisUp;

        ApiResponse<Map<String, Object>> body = ApiResponse.ok(
                allUp ? "all dependencies are up" : "some dependencies are down",
                checks
        );
        return ResponseEntity.status(allUp ? 200 : 503).body(body);
    }

    @GetMapping("/private/ping")
    public ApiResponse<Map<String, Object>> privatePing() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("timestamp", Instant.now().toString());
        data.put("auth", "required when JWT is enabled");
        return ApiResponse.ok("private pong", data);
    }

    private boolean checkDb(Map<String, Object> checks) {
        try {
            Integer result = jdbcTemplate.queryForObject("select 1", Integer.class);
            checks.put("db", result != null && result == 1 ? "UP" : "DOWN");
            return result != null && result == 1;
        } catch (Exception e) {
            checks.put("db", "DOWN");
            checks.put("dbError", e.getMessage());
            return false;
        }
    }

    private boolean checkRedis(Map<String, Object> checks) {
        try {
            String pong = redisTemplate.execute(RedisConnection::ping);
            boolean up = "PONG".equalsIgnoreCase(pong);
            checks.put("redis", up ? "UP" : "DOWN");
            return up;
        } catch (Exception e) {
            checks.put("redis", "DOWN");
            checks.put("redisError", e.getMessage());
            return false;
        }
    }
}
