package com.estudoos.api.dtos;

import java.util.List;

public record MateriaDTO(
    Long id,
    String nome,
    String cor,
    List<String> topicos // As linhas que você cola do edital[cite: 1]
) {}