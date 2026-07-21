package com.estudoos.api.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.estudoos.api.model.Topico;
import com.estudoos.api.service.TopicoService;

@RestController
@RequestMapping("/api/topicos")
@CrossOrigin(origins = "*")
public class TopicoController {

    private final TopicoService topicoService;

    public TopicoController(TopicoService topicoService) {
        this.topicoService = topicoService;
    }

    // 🔍 GET: Buscar tópicos de uma matéria
    @GetMapping("/materia/{materiaId}")
    public ResponseEntity<List<Topico>> listarPorMateria(@PathVariable Long materiaId) {
        return ResponseEntity.ok(topicoService.listarPorMateria(materiaId));
    }

    // ✏️ PUT: Renomear tópico existente
    @PutMapping("/{id}")
    public ResponseEntity<Topico> atualizarTopico(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String novoNome = body.get("nome");
        Topico topicoAtualizado = topicoService.atualizarTopico(id, novoNome);
        return ResponseEntity.ok(topicoAtualizado);
    }

    // 🗑️ DELETE: Excluir tópico pelo ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarTopico(@PathVariable Long id) {
        topicoService.deletarTopico(id);
        return ResponseEntity.noContent().build();
    }

    // ➕ POST: Adicionar novos assuntos em uma matéria já criada
    @PostMapping("/materia/{materiaId}")
    public ResponseEntity<Void> adicionarTopicos(@PathVariable Long materiaId, @RequestBody List<String> topicos) {
        topicoService.adicionarTopicosAMateria(materiaId, topicos);
        return ResponseEntity.ok().build();
    }
    @GetMapping
    public ResponseEntity<List<Topico>> listarTodos() {
        return ResponseEntity.ok(topicoService.listarTodos());
    }
}