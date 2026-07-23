package com.estudoos.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.estudoos.api.model.Usuario;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // 🔍 Método para buscar o usuário pelo e-mail na hora do login
    Optional<Usuario> findByEmail(String email);

    // 🔍 Método para verificar se um e-mail já está cadastrado
    boolean existsByEmail(String email);
}