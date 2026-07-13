package com.estudoos.api.dtos;

import java.util.List;

public record SessaoDTO(
    Long materiaId,
    String anotacoes,
    List<Long> topicosConcluidosIds
) {}