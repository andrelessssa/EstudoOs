package com.estudoos.api.model;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "materia")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Materia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 7)
    private String cor;

    // 🟢 Ignora campos internos do proxy Usuario ao converter para JSON
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id", nullable = true)
    @JsonIgnoreProperties({"senha", "hibernateLazyInitializer", "handler"})
    private Usuario usuario;

    // 🔴 MAPEAMENTO CORRETO: Apaga todos os Tópicos associados automaticamente
    @OneToMany(mappedBy = "materia", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"materia", "hibernateLazyInitializer", "handler"})
    @jakarta.persistence.OrderBy("id ASC")
    private List<Topico> topicos = new ArrayList<>();
}