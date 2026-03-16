package com.example.gameinfratest.config;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {
    @Value("${app.security.jwt.enabled:true}")
    private boolean jwtEnabled;

    @Value("${app.security.cors.allowed-origins:http://localhost:5173}")
    private List<String> allowedOrigins;

    @Value("${app.keycloak.client-id:ssafy-maker-public}")
    private String keycloakClientId;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http)throws Exception{
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults());

        if (jwtEnabled) {
            http.authorizeHttpRequests(auth -> auth
                    .requestMatchers(
                            "/actuator/health", "/actuator/info", "/actuator/prometheus",
                            "/api/public/**",
                            "/public/assets/manifest",
                            "/api/auth/**",
                            "/api/v3/api-docs/**", "/api/v3/api-docs.yaml",
                            "/api/swagger-ui.html", "/swagger-ui/**", "/error"
                    ).permitAll()
                    .anyRequest().authenticated()
            ).oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));
        } else {
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        }

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter());
        return converter;
    }

    @Bean
    Converter<Jwt, Collection<GrantedAuthority>> jwtGrantedAuthoritiesConverter() {
        return jwt -> {
            List<String> roles = new ArrayList<>();
            roles.addAll(extractRealmRoles(jwt));
            roles.addAll(extractClientRoles(jwt));

            return roles.stream()
                    .distinct()
                    .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role.toUpperCase())
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
        };
    }

    @SuppressWarnings("unchecked")
    private List<String> extractRealmRoles(Jwt jwt) {
        Object claim = jwt.getClaim("realm_access");
        if (!(claim instanceof Map<?, ?> realmAccess)) {
            return List.of();
        }

        Object roles = realmAccess.get("roles");
        if (!(roles instanceof Collection<?> collection)) {
            return List.of();
        }

        return collection.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .toList();
    }

    @SuppressWarnings("unchecked")
    private List<String> extractClientRoles(Jwt jwt) {
        Object claim = jwt.getClaim("resource_access");
        if (!(claim instanceof Map<?, ?> resourceAccess)) {
            return List.of();
        }

        Object clientAccess = resourceAccess.get(keycloakClientId);
        if (!(clientAccess instanceof Map<?, ?> clientMap)) {
            return List.of();
        }

        Object roles = clientMap.get("roles");
        if (!(roles instanceof Collection<?> collection)) {
            return List.of();
        }

        return collection.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .toList();
    }
}
