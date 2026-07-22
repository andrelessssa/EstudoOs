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

    // 🟢 1. Lista apenas as revisões não concluídas agendadas para HOJE ou
    // ATRASADAS (dataAgendada <= hoje) ⌛🔥
    @Query("SELECT r FROM Revisao r WHERE r.feita = false AND r.dataAgendada <= :hoje ORDER BY r.dataAgendada ASC")
    List<Revisao> buscarRevisoesAtrasadasEHoje(@Param("hoje") LocalDate hoje);

    // 🟢 2. Conta quantas revisões estão pendentes para hoje + atrasadas (para o
    // card de topo)
    @Query("SELECT COUNT(r) FROM Revisao r WHERE r.feita = false AND r.dataAgendada <= :hoje")
    long contarRevisoesAtrasadasEHoje(@Param("hoje") LocalDate hoje);

    // 🟢 3. Mantido para trazer as revisões com paginação se necessário
    @Query("SELECT r FROM Revisao r WHERE r.feita = false ORDER BY r.dataAgendada ASC")
    List<Revisao> buscarRevisoesPendentes(org.springframework.data.domain.Pageable pageable);

    // 🟢 4. Mantido para calcular o card de "Próximos 7 dias"
    @Query("SELECT COUNT(r) FROM Revisao r WHERE r.dataAgendada BETWEEN :dataInicio AND :dataFim AND r.feita = false")
    long contarRevisoesNoIntervalo(
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim);

    // 🟢 5. Mantido para calcular o total de revisões concluídas
    long countByFeitaTrue();

    // 🟢 6. Deleção de tópico em cascata
    void deleteByTopicoId(Long topicoId);
}