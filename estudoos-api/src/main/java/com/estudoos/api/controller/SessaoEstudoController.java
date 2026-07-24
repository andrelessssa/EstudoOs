package com.estudoos.api.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.estudoos.api.dtos.SessaoDTO;
import com.estudoos.api.model.Usuario;
import com.estudoos.api.repository.UsuarioRepository;
import com.estudoos.api.service.SessaoEstudoService;

@RestController
@RequestMapping("/api/sessoes")
@CrossOrigin(origins = "*")
public class SessaoEstudoController {

    private final SessaoEstudoService sessaoEstudoService;
    private final UsuarioRepository usuarioRepository;

    public SessaoEstudoController(SessaoEstudoService sessaoEstudoService, UsuarioRepository usuarioRepository) {
        this.sessaoEstudoService = sessaoEstudoService;
        this.usuarioRepository = usuarioRepository;
    }

    // 🟢 Método auxiliar para extrair o usuário autenticado a partir do Token JWT
    private Usuario obterUsuarioAutenticado(Authentication authentication) {
        String email = authentication.getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + email));
    }

    @PostMapping
    public ResponseEntity<Void> salvarSessao(@RequestBody SessaoDTO dto, Authentication authentication) {
        Usuario usuarioLogado = obterUsuarioAutenticado(authentication);
        sessaoEstudoService.salvarSessaoDeHoje(dto, usuarioLogado);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<SessaoDTO>> listarTodas(Authentication authentication) {
        Usuario usuarioLogado = obterUsuarioAutenticado(authentication);
        return ResponseEntity.ok(sessaoEstudoService.listarPorUsuario(usuarioLogado.getId()));
    }

    @GetMapping("/calendario/estudados")
    public ResponseEntity<List<String>> obterDiasEstudados(Authentication authentication) {
        Usuario usuarioLogado = obterUsuarioAutenticado(authentication);
        return ResponseEntity.ok(sessaoEstudoService.obterDiasEstudadosPorUsuario(usuarioLogado.getId()));
    }

    @GetMapping("/materia/{materiaId}/ultima")
    public ResponseEntity<SessaoDTO> obterUltimaSessaoDaMateria(@PathVariable Long materiaId, Authentication authentication) {
        Usuario usuarioLogado = obterUsuarioAutenticado(authentication);
        SessaoDTO sessao = sessaoEstudoService.obterUltimaSessaoDaMateriaEUsuario(materiaId, usuarioLogado.getId());
        if (sessao == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(sessao);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> atualizarAnotacoes(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication authentication) {
        Usuario usuarioLogado = obterUsuarioAutenticado(authentication);
        String novasAnotacoes = body.get("anotacoes");
        sessaoEstudoService.atualizarAnotacoesSessao(id, novasAnotacoes, usuarioLogado.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirSessao(@PathVariable Long id, Authentication authentication) {
        Usuario usuarioLogado = obterUsuarioAutenticado(authentication);
        sessaoEstudoService.excluirSessaoEVoltarTopicos(id, usuarioLogado.getId());
        return ResponseEntity.noContent().build();
    }
}