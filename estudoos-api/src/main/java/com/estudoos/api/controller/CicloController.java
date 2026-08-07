package com.estudoos.api.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.estudoos.api.model.Materia;
import com.estudoos.api.repository.MateriaRepository;
import com.estudoos.api.service.GeminiService;

@RestController
@RequestMapping("/api/ciclo")
public class CicloController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private MateriaRepository materiaRepository;

    @PostMapping("/gerar")
    public ResponseEntity<Map<String, String>> gerarCiclo(@RequestHeader("Authorization") String token) {
        try {
            List<Materia> materias = materiaRepository.findAll();
            List<String> nomes = materias.stream().map(Materia::getNome).collect(Collectors.toList());

            if (nomes.isEmpty()) {
                return ResponseEntity.ok(Map.of("conteudo", "⚠️ Cadastre ao menos uma matéria na aba 'Matérias' antes de gerar o ciclo."));
            }

            String cicloGerado = geminiService.gerarCicloEstudosInteligente(nomes);
            return ResponseEntity.ok(Map.of("conteudo", cicloGerado));
        } catch (Exception e) {
            System.err.println("❌ ERRO NO CONTROLLER DE CICLO: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("erro", "Erro ao gerar ciclo: " + e.getMessage()));
        }
    }
}