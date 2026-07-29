package com.estudoos.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.estudoos.api.model.Usuario;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // 🔍 Busca o usuário pelo e-mail na hora do login
    Optional<Usuario> findByEmail(String email);

    // 🔍 Verifica se um e-mail já está cadastrado
    boolean existsByEmail(String email);

    // 🧹 Limpeza das tabelas filhas antes de excluir o usuário
    @Transactional
    @Modifying
    @Query("DELETE FROM Revisao r WHERE r.usuario.id = :usuarioId")
    void deletarRevisoesPorUsuarioId(@Param("usuarioId") Long usuarioId);

    @Transactional
    @Modifying
    @Query("DELETE FROM Topico t WHERE t.materia.usuario.id = :usuarioId")
    void deletarTopicosPorUsuarioId(@Param("usuarioId") Long usuarioId);

    @Transactional
    @Modifying
    @Query("DELETE FROM Materia m WHERE m.usuario.id = :usuarioId")
    void deletarMateriasPorUsuarioId(@Param("usuarioId") Long usuarioId);

    // 🧹 Limpa os registros da tabela associativa sessao_topico do usuário
    @Transactional
    @Modifying
    @Query(value = "DELETE FROM sessao_topico st USING topico t, materia m WHERE st.topico_id = t.id AND t.materia_id = m.id AND m.usuario_id = :usuarioId", nativeQuery = true)
    void deletarRelacionamentosSessaoTopicoPorUsuarioId(@Param("usuarioId") Long usuarioId);

    // 🧹 Limpa sessões de estudo do usuário
    @Transactional
    @Modifying
    @Query("DELETE FROM SessaoEstudo s WHERE s.usuario.id = :usuarioId")
    void deletarSessoesPorUsuarioId(@Param("usuarioId") Long usuarioId);
}