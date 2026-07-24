package com.estudoos.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.estudoos.api.model.Materia;

@Repository
public interface MateriaRepository extends JpaRepository<Materia, Long> {

    // 🟢 Busca isolada por ID do usuário
    List<Materia> findByUsuarioId(Long usuarioId);

    // 🟢 Busca direta por e-mail via JPQL para eliminar qualquer margem de erro
    @Query("SELECT m FROM Materia m WHERE m.usuario.email = :email")
    List<Materia> findByUsuarioEmail(@Param("email") String email);

    Optional<Materia> findByIdAndUsuarioId(Long id, Long usuarioId);

    boolean existsByIdAndUsuarioId(Long id, Long usuarioId);
}