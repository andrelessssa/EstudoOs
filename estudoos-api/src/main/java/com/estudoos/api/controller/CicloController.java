package com.estudoos.api.controller;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.estudoos.api.model.CicloEstudo;
import com.estudoos.api.service.CicloService;
import com.estudoos.api.service.GeminiService;

import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/ciclo")
public class CicloController {

    @Autowired
    private CicloService cicloService;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping("/ativo")
    public ResponseEntity<?> obterCicloAtivo(@RequestHeader("Authorization") String token) {
        Long usuarioId = 1L; // Ajuste conforme seu sistema de autenticação
        CicloEstudo ciclo = cicloService.buscarCicloAtivo(usuarioId);
        if (ciclo == null) {
            return ResponseEntity.ok(Map.of("ativo", false));
        }
        try {
            // Converte a string salva no banco de volta para objeto JSON para o front-end ler perfeitamente
            Object jsonNode = objectMapper.readValue(ciclo.getJsonConteudo(), Object.class);
            return ResponseEntity.ok(jsonNode);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("ativo", true, "ciclo", ciclo));
        }
    }

    @PostMapping("/gerar-avancado")
    public ResponseEntity<?> gerarCicloAvancado(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, Object> payload) {
        try {
            Long usuarioId = 1L; // Ajuste para o ID real do usuário do token

            String startStr = (String) payload.get("start");
            String endStr = (String) payload.get("end");

            // 1. Chama a IA para estruturar o JSON do ciclo
            String jsonRespostaIA = geminiService.gerarCicloEstudosPersonalizado(payload);

            // 2. Salva no banco de dados
            cicloService.salvarOuAtualizarCiclo(
                usuarioId, 
                jsonRespostaIA, 
                LocalDate.parse(startStr), 
                LocalDate.parse(endStr)
            );

            // 3. Converte a resposta da IA em objeto Java para o front-end ler a propriedade 'dias' na hora
            Object jsonNode = objectMapper.readValue(jsonRespostaIA, Object.class);

            return ResponseEntity.ok(jsonNode);
        } catch (Exception e) {
            System.err.println("❌ ERRO NO CONTROLLER DE CICLO: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("erro", e.getMessage()));
        }
    }
}