package com.example.gameinfratest.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class BffSessionAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            HttpSession session = request.getSession(false);
            if (session != null) {
                Object attribute = session.getAttribute(BffSessionState.SESSION_KEY);
                if (attribute instanceof BffSessionState sessionState) {
                    if (sessionState.isExpired()) {
                        session.invalidate();
                    } else {
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        sessionState,
                                        null,
                                        toAuthorities(sessionState.authorities())
                                );
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private List<SimpleGrantedAuthority> toAuthorities(List<String> authorities) {
        if (authorities == null) {
            return List.of();
        }

        return authorities.stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
    }
}
