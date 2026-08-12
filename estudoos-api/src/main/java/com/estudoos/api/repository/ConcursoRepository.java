package com.estudoos.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.repository.query.Param;

import com.estudoos.api.model.Concurso;

@Repository
public interface ConcursoRepository extends JpaRepository<Concurso, Long> {
    List<Concurso> findByUsuarioId(Long usuarioId);
    @Transactional
    @Modifying
    @Query("DELETE FROM Concurso c WHERE c.id = :id AND c.usuario.id = :usuarioId")
    void deleteByIdAndUsuarioId(@Param("id") Long id, @Param("usuarioId") Long usuarioId);
}
