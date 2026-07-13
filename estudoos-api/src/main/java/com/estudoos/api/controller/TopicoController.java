package com.estudoos.api.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.estudoos.api.model.Topico;
import com.estudoos.api.repository.TopicoRepository;

@RestController
@RequestMapping("/api/topicos")
@CrossOrigin(origins = "*") // 🌐 Permite o Angular se conectar sem bloqueios
public class TopicoController {

    private final TopicoRepository topicoRepository;

    // Injeção direta do Repository para buscas rápidas (Padrão para rotas simples de leitura)
    public TopicoController(TopicoRepository topicoRepository) {
        this.topicoRepository = topicoRepository;
    }

    // 🔍 Traz apenas os assuntos vinculados a uma determinada matéria
    @GetMapping("/materia/{materiaId}")
    public ResponseEntity<List<Topico>> listarPorMateria(@PathVariable Long materiaId) {
        List<Topico> topicos = topicoRepository.findByMateriaId(materiaId);
        return ResponseEntity.ok(topicos);
    }
}