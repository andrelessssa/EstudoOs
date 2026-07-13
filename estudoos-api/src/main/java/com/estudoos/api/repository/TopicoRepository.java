package com.estudoos.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.estudoos.api.model.Topico;

@Repository
public interface TopicoRepository extends JpaRepository<Topico, Long> {

    List<Topico> findByMateriaId(Long materiaId);
    
}
