package com.estudoos.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.estudoos.api.model.CicloEstudo;

public interface CicloRepository extends JpaRepository<CicloEstudo, Long> {
    Optional<CicloEstudo> findByUsuarioId(Long usuarioId);
    void deleteByUsuarioId(Long usuarioId);
}