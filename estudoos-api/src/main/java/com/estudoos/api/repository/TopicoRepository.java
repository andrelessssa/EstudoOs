package com.estudoos.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.estudoos.api.model.Topico;

public interface TopicoRepository extends JpaRepository<Topico, Long> {
    List<Topico> findByMateriaId(Long materiaId);
    void deleteByMateriaId(Long materiaId); // 💥 Adicione esta linha!
}