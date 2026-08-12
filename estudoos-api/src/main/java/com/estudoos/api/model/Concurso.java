package com.estudoos.api.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "concurso")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Concurso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    private LocalDateTime dataProva;

    @Column(columnDefinition = "text")
    private String jsonConteudo; // armazena o objeto completo em JSON

    private LocalDateTime criadoEm;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;
}
