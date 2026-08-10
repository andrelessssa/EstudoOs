package com.estudoos.api.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ciclos_estudo")
public class CicloEstudo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long usuarioId;

    private LocalDate dataInicio;
    private LocalDate dataFim;

    @Column(columnDefinition = "TEXT")
    private String jsonConteudo;

    private LocalDate geradoEm;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public LocalDate getDataInicio() { return dataInicio; }
    public void setDataInicio(LocalDate dataInicio) { this.dataInicio = dataInicio; }

    public LocalDate getDataFim() { return dataFim; }
    public void setDataFim(LocalDate dataFim) { this.dataFim = dataFim; }

    public String getJsonConteudo() { return jsonConteudo; }
    public void setJsonConteudo(String jsonConteudo) { this.jsonConteudo = jsonConteudo; }

    public LocalDate getGeradoEm() { return geradoEm; }
    public void setGeradoEm(LocalDate geradoEm) { this.geradoEm = geradoEm; }
}