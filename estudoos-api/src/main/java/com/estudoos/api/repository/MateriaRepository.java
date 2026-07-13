package com.estudoos.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.estudoos.api.model.Materia;

@Repository
public interface MateriaRepository extends JpaRepository<Materia, Long> {

    
}
