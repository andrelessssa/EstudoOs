package com.estudoos.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "sessao_estudo")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessaoEstudo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate dataSessao = LocalDate.now(); // Grava o dia de hoje automaticamente

    @Column(columnDefinition = "TEXT")
    private String anotacoes; // Guarda o resumo/anotações que você fez ao lado

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "materia_id", nullable = false)
    private Materia materia; // Sabe qual matéria foi estudada na sessão
}