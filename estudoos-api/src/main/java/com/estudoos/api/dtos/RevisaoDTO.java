package com.estudoos.api.dtos;

import java.time.LocalDate;

public record RevisaoDTO(
    Long id,
    String nomeTopico,
    String nomeMateria,
    String corMateria,
    LocalDate dataAgendada,
    Integer etapa
) {}