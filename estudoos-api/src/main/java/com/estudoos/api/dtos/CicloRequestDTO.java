package com.estudoos.api.dtos;

import java.util.List;

public record CicloRequestDTO(
    String dataInicio,
    String dataFim,
    List<Integer> diasSemana,
    int horasPorDia,
    String prioridade,
    List<String> materiasIds
) {
    public String prioridade() {
        return prioridade != null ? prioridade : "balanced";
    }
}