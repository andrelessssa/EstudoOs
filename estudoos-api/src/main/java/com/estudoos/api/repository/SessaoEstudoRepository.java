package com.estudoos.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.estudoos.api.model.SessaoEstudo;

@Repository
public interface SessaoEstudoRepository extends JpaRepository<SessaoEstudo, Long> {

    // 🟢 Busca todas as sessões do usuário logado
    List<SessaoEstudo> findByUsuarioId(Long usuarioId);

    // 🟢 Busca uma sessão específica garantindo que pertence ao usuário
    Optional<SessaoEstudo> findByIdAndUsuarioId(Long id, Long usuarioId);

    // 🟢 CORRIGIDO: Query nativa em SQL do PostgreSQL garantindo os nomes das colunas físicas (data_sessao e usuario_id)
    @Query(value = "SELECT DISTINCT CAST(s.data_sessao AS VARCHAR) FROM sessao_estudo s WHERE s.usuario_id = :usuarioId", nativeQuery = true)
    List<String> findDistinctDatasEstudoByUsuarioId(@Param("usuarioId") Long usuarioId);

    // 🟢 Busca a última sessão de estudos de uma matéria garantindo o usuário
    @Query("SELECT s FROM SessaoEstudo s WHERE s.materia.id = :materiaId AND s.usuario.id = :usuarioId ORDER BY s.id DESC")
    List<SessaoEstudo> findLatestSessionByMateriaIdAndUsuarioId(
        @Param("materiaId") Long materiaId, 
        @Param("usuarioId") Long usuarioId, 
        Pageable pageable
    );

    // 🟢 Busca sessões por matéria e usuário
    List<SessaoEstudo> findByMateriaIdAndUsuarioId(Long materiaId, Long usuarioId);
}