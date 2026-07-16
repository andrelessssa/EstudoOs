package com.estudoos.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.estudoos.api.model.SessaoEstudo;

@Repository
public interface SessaoEstudoRepository extends JpaRepository<SessaoEstudo, Long> {

    @Query("SELECT DISTINCT CAST(s.dataSessao AS string) FROM SessaoEstudo s")
List<String> findDistinctDatasEstudo();


    
}
