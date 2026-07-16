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

    // 🟢 1. Método limpo com paginação para trazer apenas as 10 próximas!
    @Query("SELECT r FROM Revisao r WHERE r.feita = false ORDER BY r.dataAgendada ASC")
    List<Revisao> buscarRevisoesPendentes(org.springframework.data.domain.Pageable pageable);

    // 🟢 2. Mantido para calcular o card de "Próximos 7 dias" no Service!
    @Query("SELECT COUNT(r) FROM Revisao r WHERE r.dataAgendada BETWEEN :dataInicio AND :dataFim AND r.feita = false")
    long contarRevisoesNoIntervalo(
        @Param("dataInicio") LocalDate dataInicio, 
        @Param("dataFim") LocalDate dataFim
    );

    // 🟢 3. Mantido para calcular o total de revisões concluídas
    long countByFeitaTrue();

    
}