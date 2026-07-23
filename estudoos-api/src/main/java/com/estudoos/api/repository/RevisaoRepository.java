package com.estudoos.api.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.estudoos.api.model.Revisao;

@Repository
public interface RevisaoRepository extends JpaRepository<Revisao, Long> {

    // 🟢 Busca uma revisão garantindo que pertence ao usuário logado
    Optional<Revisao> findByIdAndUsuarioId(Long id, Long usuarioId);

    // 🟢 1. Lista apenas as revisões não concluídas (HOJE ou ATRASADAS) do USUÁRIO ⌛🔥
    @Query("SELECT r FROM Revisao r WHERE r.usuario.id = :usuarioId AND r.feita = false AND r.dataAgendada <= :hoje ORDER BY r.dataAgendada ASC")
    List<Revisao> buscarRevisoesAtrasadasEHojePorUsuario(@Param("usuarioId") Long usuarioId, @Param("hoje") LocalDate hoje);

    // 🟢 2. Conta revisões pendentes (hoje + atrasadas) do USUÁRIO
    @Query("SELECT COUNT(r) FROM Revisao r WHERE r.usuario.id = :usuarioId AND r.feita = false AND r.dataAgendada <= :hoje")
    long contarRevisoesAtrasadasEHojePorUsuario(@Param("usuarioId") Long usuarioId, @Param("hoje") LocalDate hoje);

    // 🟢 3. Busca revisões pendentes com paginação do USUÁRIO
    @Query("SELECT r FROM Revisao r WHERE r.usuario.id = :usuarioId AND r.feita = false ORDER BY r.dataAgendada ASC")
    List<Revisao> buscarRevisoesPendentesPorUsuario(@Param("usuarioId") Long usuarioId, Pageable pageable);

    // 🟢 4. Conta revisões nos próximos 7 dias do USUÁRIO
    @Query("SELECT COUNT(r) FROM Revisao r WHERE r.usuario.id = :usuarioId AND r.dataAgendada BETWEEN :dataInicio AND :dataFim AND r.feita = false")
    long contarRevisoesNoIntervaloPorUsuario(
            @Param("usuarioId") Long usuarioId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim);

    // 🟢 5. Conta total de revisões concluídas do USUÁRIO
    long countByUsuarioIdAndFeitaTrue(Long usuarioId);

    // 🟢 6. Deleção de tópico em cascata garantindo o usuário
    void deleteByTopicoIdAndUsuarioId(Long topicoId, Long usuarioId);

    void deleteByTopicoId(Long id);
}