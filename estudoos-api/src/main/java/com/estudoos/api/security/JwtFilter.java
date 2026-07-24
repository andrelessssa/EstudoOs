package com.estudoos.api.security;

import java.io.IOException;
import java.util.Collections;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    public JwtFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        // 🛑 Ignora o filtro JWT para rotas públicas e chamadas OPTIONS (preflight CORS)
        return path.startsWith("/api/auth") || path.startsWith("/auth") || "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token = recuperarToken(request);

        if (token != null && tokenProvider.validarToken(token)) {
            // 🟢 Usando o nome exato do seu método: getEmailDoToken
            String email = tokenProvider.getEmailDoToken(token);
            
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    email, null, Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }

    private String recuperarToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}