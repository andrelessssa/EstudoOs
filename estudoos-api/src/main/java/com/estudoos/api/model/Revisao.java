package com.estudoos.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "revisao")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Revisao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_agendada", nullable = false)
    private LocalDate dataAgendada; // A data exata que você deve revisar

    @Column(nullable = false)
    private Integer intervaloDias; // Grava se é a revisão de 3, 7, 15 ou 30 dias

    @Column(nullable = false)
    private Integer etapa; // Grava se é a 1ª, 2ª, 3ª ou 4ª revisão do assunto

    @Column(nullable = false)
    private boolean feita = false; // Começa como falsa. Fica true quando você clica em "✓ Feita"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topico_id", nullable = false)
    private Topico topico; // Sabe exatamente qual assunto deve ser revisado

    // 🟢 Novo vínculo com o Usuario
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
}