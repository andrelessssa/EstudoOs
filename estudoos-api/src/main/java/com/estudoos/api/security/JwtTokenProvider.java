package com.estudoos.api.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtTokenProvider {

    // 🔑 Chave secreta para assinar o token (mantenha em segredo!)
    private final String SECRET_KEY = "sua_chave_secreta_super_segura_e_longa_para_o_estudoos_jwt";
    private final long EXPIRATION_TIME = 86400000; // 24 horas em milissegundos

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));
    }

    // 🟢 Gera o token JWT incluindo o email e o ID do usuário
    public String gerarToken(String email, Long usuarioId) {
        Date agora = new Date();
        Date validade = new Date(agora.getTime() + EXPIRATION_TIME);

        return Jwts.builder()
                .setSubject(email)
                .claim("id", usuarioId)
                .setIssuedAt(agora)
                .setExpiration(validade)
                .signWith(getSigningKey())
                .compact();
    }

    // 🟢 Extrai o email do token
    public String getEmailDoToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    // 🟢 Extrai o ID do usuário do token
    public Long getUsuarioIdDoToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.get("id", Long.class);
    }

    // 🟢 Valida a autenticidade do token
    public boolean validarToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}