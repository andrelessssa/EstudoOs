package com.estudoos.api.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.estudoos.api.dtos.RevisaoDTO;
import com.estudoos.api.service.RevisaoService;

@RestController
@RequestMapping("/api/revisoes")
@CrossOrigin(origins = "*")
public class RevisaoController {

    private final RevisaoService revisaoService;

    public RevisaoController(RevisaoService revisaoService) {
        this.revisaoService = revisaoService;
    }

    @GetMapping("/hoje")
    public ResponseEntity<List<RevisaoDTO>> listarRevisoesDoDia() {
        return ResponseEntity.ok(revisaoService.listarRevisoesDoDia());
    }

    @PutMapping("/{id}/concluir")
    public ResponseEntity<String> concluirRevisao(@PathVariable Long id) {
        revisaoService.concluirRevisao(id);
        return ResponseEntity.ok("Revisão concluída! Menos um conteúdo para esquecer. 🧠✓");
    }
   @GetMapping("/estatisticas")
    public ResponseEntity<java.util.Map<String, Long>> obterEstatisticas() {
        
        return ResponseEntity.ok(revisaoService.obterEstatisticas());
    }
    
    
}