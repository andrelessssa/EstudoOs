package com.estudoos.api.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.estudoos.api.dtos.LoginDTO;
import com.estudoos.api.dtos.RegistroDTO;
import com.estudoos.api.dtos.TokenResponseDTO;
import com.estudoos.api.model.Usuario;
import com.estudoos.api.repository.UsuarioRepository;
import com.estudoos.api.security.JwtTokenProvider;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UsuarioRepository usuarioRepository, 
                       PasswordEncoder passwordEncoder, 
                       JwtTokenProvider tokenProvider) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public TokenResponseDTO registrar(RegistroDTO dto) {
        if (usuarioRepository.existsByEmail(dto.email())) {
            throw new RuntimeException("E-mail já cadastrado no sistema!");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(dto.nome());
        usuario.setEmail(dto.email());
        usuario.setSenha(passwordEncoder.encode(dto.senha()));

        usuario = usuarioRepository.save(usuario);

        String token = tokenProvider.gerarToken(usuario.getEmail(), usuario.getId());
        return new TokenResponseDTO(token, usuario.getNome(), usuario.getEmail());
    }

    public TokenResponseDTO login(LoginDTO dto) {
        Usuario usuario = usuarioRepository.findByEmail(dto.email())
                .orElseThrow(() -> new RuntimeException("E-mail ou senha incorretos."));

        if (!passwordEncoder.matches(dto.senha(), usuario.getSenha())) {
            throw new RuntimeException("E-mail ou senha incorretos.");
        }

        String token = tokenProvider.gerarToken(usuario.getEmail(), usuario.getId());
        return new TokenResponseDTO(token, usuario.getNome(), usuario.getEmail());
    }
}