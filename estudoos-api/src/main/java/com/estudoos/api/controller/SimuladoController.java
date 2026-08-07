package com.estudoos.api.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.estudoos.api.model.Usuario;
import com.estudoos.api.repository.UsuarioRepository;
import com.estudoos.api.service.GeminiService;
import com.estudoos.api.service.SessaoEstudoService;

@RestController
@RequestMapping("/api/simulado")
@CrossOrigin(origins = "*")
public class SimuladoController {

    private final GeminiService geminiService;
    private final SessaoEstudoService sessaoEstudoService;
    private final UsuarioRepository usuarioRepository;

    public SimuladoController(GeminiService geminiService, SessaoEstudoService sessaoEstudoService, UsuarioRepository usuarioRepository) {
        this.geminiService = geminiService;
        this.sessaoEstudoService = sessaoEstudoService;
        this.usuarioRepository = usuarioRepository;
    }

    private Usuario obterUsuarioAutenticado(Authentication authentication) {
        String email = authentication.getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + email));
    }

    @PostMapping("/gerar")
    public ResponseEntity<Map<String, String>> gerarSimulado(
            @RequestParam(defaultValue = "semana") String periodo,
            Authentication authentication) {
        
        Usuario usuarioLogado = obterUsuarioAutenticado(authentication);
        
        // 1. Obtém o relatório de assuntos estudados pelo usuário
        Map<String, List<String>> relatorio = sessaoEstudoService.obterRelatorioSimuladoPorEmail(usuarioLogado.getEmail(), periodo);
        
        // 2. Envia para o Gemini gerar as 40 questões oficiais
        String conteudoSimulado = geminiService.gerarSimuladoComIa(relatorio);

        Map<String, String> resposta = new HashMap<>();
        resposta.put("conteudo", conteudoSimulado);

        return ResponseEntity.ok(resposta);
    }
}