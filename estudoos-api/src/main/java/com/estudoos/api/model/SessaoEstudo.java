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
    private LocalDate dataSessao = LocalDate.now();

    @Column(columnDefinition = "TEXT")
    private String anotacoes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "materia_id", nullable = false)
    private Materia materia;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "sessao_topico",
        joinColumns = @JoinColumn(name = "sessao_id"),
        inverseJoinColumns = @JoinColumn(name = "topico_id")
    )
    private List<Topico> topicos = new ArrayList<>();

    // 🟢 Novo vínculo com o Usuario
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
}