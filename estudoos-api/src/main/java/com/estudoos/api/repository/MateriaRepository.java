package com.estudoos.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.estudoos.api.model.Materia;

@Repository
public interface MateriaRepository extends JpaRepository<Materia, Long> {

    // 🟢 Busca todas as matérias de um usuário específico
    List<Materia> findByUsuarioId(Long usuarioId);

    // 🟢 Busca uma matéria específica garantindo que ela pertence ao usuário logado
    Optional<Materia> findByIdAndUsuarioId(Long id, Long usuarioId);

    // 🟢 Verifica se a matéria existe para aquele usuário
    boolean existsByIdAndUsuarioId(Long id, Long usuarioId);
}