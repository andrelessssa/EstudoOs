package com.estudoos.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.estudoos.api.model.SessaoEstudo;

@Repository
public interface SessaoEstudoRepository extends JpaRepository<SessaoEstudo, Long> {

    @Query("SELECT DISTINCT CAST(s.dataSessao AS string) FROM SessaoEstudo s")
    List<String> findDistinctDatasEstudo();

    // 🟢 Busca a última sessão de estudos completa de uma matéria
    @Query("SELECT s FROM SessaoEstudo s WHERE s.materia.id = :materiaId ORDER BY s.id DESC")
    List<SessaoEstudo> findLatestSessionByMateriaId(
        @Param("materiaId") Long materiaId, 
        org.springframework.data.domain.Pageable pageable
    );
}