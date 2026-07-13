package com.estudoos.api.dtos;

import com.estudoos.api.enums.ResultadoQuestao;

public record QuestaoDTO(
  Long id,
    String texto,
    String comentario,
    ResultadoQuestao resultado,
    Long materiaId,
    Long topicoId,
    String nomeMateria,
    String nomeTopico
) {}