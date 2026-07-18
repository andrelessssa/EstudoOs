package com.estudoos.api.dtos;

import java.time.LocalDate;
import java.util.List;

public record SessaoDTO(
    Long id,                        
    Long materiaId,
    String anotacoes,
    List<Long> topicosConcluidosIds, 
    List<String> topicosNomes,       
    LocalDate dataSessao
) {
    // Construtor alternativo ajustado para incluir o ID
    public SessaoDTO(Long id, Long materiaId, String anotacoes, List<String> topicosNomes, LocalDate dataSessao) {
        this(id, materiaId, anotacoes, null, topicosNomes, dataSessao);
    }
}