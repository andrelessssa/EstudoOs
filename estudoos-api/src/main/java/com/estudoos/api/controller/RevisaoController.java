package com.estudoos.api.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
        Long usuarioIdTemp = 1L;
        return ResponseEntity.ok(revisaoService.listarRevisoesDoDiaPorUsuario(usuarioIdTemp));
    }

    @PutMapping("/{id}/concluir")
    public ResponseEntity<Map<String, String>> concluirRevisao(@PathVariable Long id) {
        Long usuarioIdTemp = 1L;
        revisaoService.concluirRevisao(id, usuarioIdTemp);

        Map<String, String> resposta = new HashMap<>();
        resposta.put("mensagem", "Revisão concluída! Menos um conteúdo para esquecer. 🧠✓");

        return ResponseEntity.ok(resposta);
    }

    @GetMapping("/estatisticas")
    public ResponseEntity<Map<String, Long>> obterEstatisticas() {
        Long usuarioIdTemp = 1L;
        return ResponseEntity.ok(revisaoService.obterEstatisticasPorUsuario(usuarioIdTemp));
    }
}