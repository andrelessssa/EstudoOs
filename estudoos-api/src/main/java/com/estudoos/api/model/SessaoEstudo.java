package com.estudoos.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

    // 🔗 CORREÇÃO DE OURO: Mapeia o relacionamento de muitos-para-muitos com a tabela de tópicos!
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "sessao_topico",
        joinColumns = @JoinColumn(name = "sessao_id"),
        inverseJoinColumns = @JoinColumn(name = "topico_id")
    )
    private List<Topico> topicos = new ArrayList<>(); // Guarda a lista de assuntos estudados na sessão
}