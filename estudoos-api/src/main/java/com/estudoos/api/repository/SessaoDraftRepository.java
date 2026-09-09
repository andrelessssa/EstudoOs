package com.estudoos.api.repository;

import com.estudoos.api.model.SessaoDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface SessaoDraftRepository extends JpaRepository<SessaoDraft, Long> {
    Optional<SessaoDraft> findByUsuarioIdAndDataSessao(Long usuarioId, LocalDate dataSessao);
    void deleteByUsuarioIdAndDataSessao(Long usuarioId, LocalDate dataSessao);
}
