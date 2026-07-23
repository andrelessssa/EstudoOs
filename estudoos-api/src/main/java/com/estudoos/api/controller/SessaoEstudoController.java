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

import com.estudoos.api.dtos.SessaoDTO;
import com.estudoos.api.model.Usuario;
import com.estudoos.api.service.SessaoEstudoService;

@RestController
@RequestMapping("/api/sessoes")
@CrossOrigin(origins = "*")
public class SessaoEstudoController {

    private final SessaoEstudoService sessaoEstudoService;

    public SessaoEstudoController(SessaoEstudoService sessaoEstudoService) {
        this.sessaoEstudoService = sessaoEstudoService;
    }

    @PostMapping
    public ResponseEntity<Void> salvarSessao(@RequestBody SessaoDTO dto) {
        Usuario usuarioTemp = new Usuario();
        usuarioTemp.setId(1L);

        sessaoEstudoService.salvarSessaoDeHoje(dto, usuarioTemp);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<SessaoDTO>> listarTodas() {
        Long usuarioIdTemp = 1L;
        return ResponseEntity.ok(sessaoEstudoService.listarPorUsuario(usuarioIdTemp));
    }

    @GetMapping("/calendario/estudados")
    public ResponseEntity<List<String>> obterDiasEstudados() {
        Long usuarioIdTemp = 1L;
        return ResponseEntity.ok(sessaoEstudoService.obterDiasEstudadosPorUsuario(usuarioIdTemp));
    }

    @GetMapping("/materia/{materiaId}/ultima")
    public ResponseEntity<SessaoDTO> obterUltimaSessaoDaMateria(@PathVariable Long materiaId) {
        Long usuarioIdTemp = 1L;
        SessaoDTO sessao = sessaoEstudoService.obterUltimaSessaoDaMateriaEUsuario(materiaId, usuarioIdTemp);
        if (sessao == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(sessao);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> atualizarAnotacoes(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Long usuarioIdTemp = 1L;
        String novasAnotacoes = body.get("anotacoes");
        sessaoEstudoService.atualizarAnotacoesSessao(id, novasAnotacoes, usuarioIdTemp);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirSessao(@PathVariable Long id) {
        Long usuarioIdTemp = 1L;
        sessaoEstudoService.excluirSessaoEVoltarTopicos(id, usuarioIdTemp);
        return ResponseEntity.noContent().build();
    }
}