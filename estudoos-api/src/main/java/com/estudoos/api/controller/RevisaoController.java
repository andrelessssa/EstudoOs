package com.estudoos.api.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.estudoos.api.dtos.RevisaoDTO;
import com.estudoos.api.model.Usuario;
import com.estudoos.api.repository.UsuarioRepository;
import com.estudoos.api.service.RevisaoService;

@RestController
@RequestMapping("/api/revisoes")
@CrossOrigin(origins = "*")
public class RevisaoController {

    private final RevisaoService revisaoService;
    private final UsuarioRepository usuarioRepository;

    public RevisaoController(RevisaoService revisaoService, UsuarioRepository usuarioRepository) {
        this.revisaoService = revisaoService;
        this.usuarioRepository = usuarioRepository;
    }

    // 🔒 Extrai o e-mail do token via SecurityContextHolder e busca o ID correto no banco
    private Long getUsuarioIdAutenticado() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        if (principal instanceof String email) {
            return usuarioRepository.findByEmail(email)
                    .map(Usuario::getId)
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado para o e-mail: " + email));
        }
        
        throw new RuntimeException("Sessão inválida ou token ausente.");
    }

    // 🟢 1. Lista revisões do dia do usuário LOGADO
    @GetMapping("/hoje")
    public ResponseEntity<List<RevisaoDTO>> listarRevisoesDoDia() {
        Long usuarioId = getUsuarioIdAutenticado();
        return ResponseEntity.ok(revisaoService.listarRevisoesDoDiaPorUsuario(usuarioId));
    }

    // 🟢 2. Conclui a revisão garantindo pertencimento ao usuário LOGADO
    @PutMapping("/{id}/concluir")
    public ResponseEntity<Map<String, String>> concluirRevisao(@PathVariable Long id) {
        Long usuarioId = getUsuarioIdAutenticado();
        revisaoService.concluirRevisao(id, usuarioId);

        Map<String, String> resposta = new HashMap<>();
        resposta.put("mensagem", "Revisão concluída! Menos um conteúdo para esquecer. 🧠✓");

        return ResponseEntity.ok(resposta);
    }

    // 🟢 3. Busca as estatísticas reais do usuário LOGADO
    @GetMapping("/estatisticas")
    public ResponseEntity<Map<String, Long>> obterEstatisticas() {
        Long usuarioId = getUsuarioIdAutenticado();
        return ResponseEntity.ok(revisaoService.obterEstatisticasPorUsuario(usuarioId));
    }
}