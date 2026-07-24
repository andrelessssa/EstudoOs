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

    // 🔑 Chave secreta para assinar o token
    private final String SECRET_KEY = "sua_chave_secreta_super_segura_e_longa_para_o_estudoos_jwt";
    private final long EXPIRATION_TIME = 86400000; // 24 horas em milissegundos

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));
    }

    // 🟢 Método auxiliar centralizado para extrair os Claims
    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // 🟢 Gera o token JWT incluindo o e-mail e o ID do usuário
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

    // 🟢 Extrai o e-mail do token
    public String getEmailDoToken(String token) {
        return getClaims(token).getSubject();
    }

    // 🟢 Extrai o ID do usuário com conversão segura (evita ClassCastException de Integer/Long)
    public Long getUsuarioIdDoToken(String token) {
        Object idObj = getClaims(token).get("id");
        if (idObj instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    // 🟢 Valida a autenticidade e expiração do token
    public boolean validarToken(String token) {
        try {
            getClaims(token); // Se estiver expirado ou adulterado, lança exceção aqui
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}