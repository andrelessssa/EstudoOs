package com.estudoos.api.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.estudoos.api.model.Revisao;

@Repository
public interface RevisaoRepository extends JpaRepository<Revisao, Long> {

    // 🎯 ESSA É A QUERY QUE RESOLVE O FLUXO:
    @Query("SELECT r FROM Revisao r WHERE r.feita = false AND r.dataAgendada <= :hoje ORDER BY r.dataAgendada ASC")
    List<Revisao> buscarRevisoesPendentes(@Param("hoje") LocalDate hoje);
}
