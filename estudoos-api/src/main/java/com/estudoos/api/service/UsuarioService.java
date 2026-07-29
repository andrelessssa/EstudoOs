package com.estudoos.api.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        if (dadosNovos.getSenha() != null && !dadosNovos.getSenha().isBlank()) {
            usuario.setSenha(passwordEncoder.encode(dadosNovos.getSenha()));
        }

        Usuario atualizado = usuarioRepository.save(usuario);
        atualizado.setSenha(null);
        return atualizado;
    }

    // 🗑️ Remove o usuário e TODAS as suas dependências em cascata (Transacional)
  @Transactional
    public void deletar(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new RuntimeException("Usuário não encontrado para exclusão.");
        }

        // 1. Limpa revisões vinculadas ao usuário
        usuarioRepository.deletarRevisoesPorUsuarioId(id);

        // 2. Limpa a tabela intermediária de sessões e tópicos (sessao_topico) para evitar violação de FK
        usuarioRepository.deletarRelacionamentosSessaoTopicoPorUsuarioId(id);

        // 3. Limpa sessões de estudo do usuário
        usuarioRepository.deletarSessoesPorUsuarioId(id);

        // 4. Limpa tópicos e matérias
        usuarioRepository.deletarTopicosPorUsuarioId(id);
        usuarioRepository.deletarMateriasPorUsuarioId(id);

        // 5. Apaga o usuário do banco
        usuarioRepository.deleteById(id);
    }
}