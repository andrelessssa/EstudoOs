package com.estudoos.api.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.estudoos.api.model.Usuario;
import com.estudoos.api.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // 📋 Lista todos os usuários sem expor a senha no retorno
    public List<Usuario> listarTodos() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        usuarios.forEach(u -> u.setSenha(null));
        return usuarios;
    }

    // ✏️ Atualiza nome, e-mail e opcionalmente a senha
    public Usuario atualizar(Long id, Usuario dadosNovos) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        usuario.setNome(dadosNovos.getNome());
        usuario.setEmail(dadosNovos.getEmail());

        // Atualiza a senha apenas se uma nova foi informada
        if (dadosNovos.getSenha() != null && !dadosNovos.getSenha().isBlank()) {
            usuario.setSenha(passwordEncoder.encode(dadosNovos.getSenha()));
        }

        Usuario atualizado = usuarioRepository.save(usuario);
        atualizado.setSenha(null); // Oculta a senha tratada
        return atualizado;
    }

    // 🗑️ Remove o usuário do banco
    public void deletar(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new RuntimeException("Usuário não encontrado para exclusão.");
        }
        usuarioRepository.deleteById(id);
    }
}