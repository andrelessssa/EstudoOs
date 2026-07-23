package com.estudoos.api.dtos;

public record TokenResponseDTO(
    String token, 
    String nome, 
    String email
) {}