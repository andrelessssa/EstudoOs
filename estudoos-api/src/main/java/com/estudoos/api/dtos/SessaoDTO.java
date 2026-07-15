package com.estudoos.api.dtos;

import java.time.LocalDate;
import java.util.List;

public record SessaoDTO(
    Long materiaId,
    String anotacoes,
    List<Long> topicosConcluidosIds,
    LocalDate dataSessao
) {}