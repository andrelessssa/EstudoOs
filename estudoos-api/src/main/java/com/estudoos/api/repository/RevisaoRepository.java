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

    // 🟢 1. Lista apenas as revisões de tópicos VÁLIDOS/CONCLUÍDOS e não concluídas (HOJE ou ATRASADAS)
    @Query("""
        SELECT r FROM Revisao r 
        JOIN r.topico t 
        JOIN t.materia m 
        WHERE r.usuario.id = :usuarioId 
          AND r.feita = false 
          AND t.concluido = true 
          AND r.dataAgendada <= :hoje 
        ORDER BY r.dataAgendada ASC
    """)
    List<Revisao> buscarRevisoesAtrasadasEHojePorUsuario(@Param("usuarioId") Long usuarioId, @Param("hoje") LocalDate hoje);

    // 🟢 2. Conta revisões pendentes (hoje + atrasadas) garantindo que o tópico está concluído
    @Query("""
        SELECT COUNT(r) FROM Revisao r 
        JOIN r.topico t 
        JOIN t.materia m 
        WHERE r.usuario.id = :usuarioId 
          AND r.feita = false 
          AND t.concluido = true 
          AND r.dataAgendada <= :hoje
    """)
    long contarRevisoesAtrasadasEHojePorUsuario(@Param("usuarioId") Long usuarioId, @Param("hoje") LocalDate hoje);

    // 🟢 3. Busca revisões pendentes com paginação
    @Query("""
        SELECT r FROM Revisao r 
        JOIN r.topico t 
        JOIN t.materia m 
        WHERE r.usuario.id = :usuarioId 
          AND r.feita = false 
          AND t.concluido = true 
        ORDER BY r.dataAgendada ASC
    """)
    List<Revisao> buscarRevisoesPendentesPorUsuario(@Param("usuarioId") Long usuarioId, Pageable pageable);

    // 🟢 4. Conta revisões nos próximos 7 dias APENAS de tópicos que estão concluídos e matérias ativas
    @Query("""
        SELECT COUNT(r) FROM Revisao r 
        JOIN r.topico t 
        JOIN t.materia m 
        WHERE r.usuario.id = :usuarioId 
          AND r.feita = false 
          AND t.concluido = true 
          AND r.dataAgendada BETWEEN :dataInicio AND :dataFim
    """)
    long contarRevisoesNoIntervaloPorUsuario(
            @Param("usuarioId") Long usuarioId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim);

    // 🟢 5. Conta total de revisões concluídas de tópicos válidos
    @Query("""
        SELECT COUNT(r) FROM Revisao r 
        JOIN r.topico t 
        JOIN t.materia m 
        WHERE r.usuario.id = :usuarioId 
          AND r.feita = true 
          AND t.concluido = true
    """)
    long countByUsuarioIdAndFeitaTrueExclusivo(@Param("usuarioId") Long usuarioId);

    // Método mantido para compatibilidade caso usado em outros locais
    long countByUsuarioIdAndFeitaTrue(Long usuarioId);

    // 🟢 6. Deleção de tópico em cascata garantindo o usuário
    void deleteByTopicoIdAndUsuarioId(Long topicoId, Long usuarioId);

    void deleteByTopicoId(Long id);
}