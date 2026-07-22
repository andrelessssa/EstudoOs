package com.estudoos.api.controller;

import java.util.List;

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
    public ResponseEntity<String> salvarSessaoDeHoje(@RequestBody SessaoDTO dto) {
        sessaoEstudoService.salvarSessaoDeHoje(dto);
        return ResponseEntity.ok("Sessão de estudos salva e revisões agendadas com sucesso! 🧠🎯");
    }

    // 🔗 ADICIONADO: Expõe o endpoint GET para o histórico vir direto do Postgres!
    @GetMapping
    public ResponseEntity<List<SessaoDTO>> listarSessoes() {
        return ResponseEntity.ok(sessaoEstudoService.listarTodas());
    }

    @GetMapping("/calendario/estudados")
    public ResponseEntity<List<String>> getDiasEstudados() {
        // 🟢 Agora a controller apenas delega a responsabilidade para o Service!
        List<String> dias = sessaoEstudoService.obterDiasEstudados();
        return ResponseEntity.ok(dias);
    }

    // 🟢 Novo endpoint que retorna a sessão completa para a tela de revisão
    @GetMapping("/revisar/{materiaId}")
    public ResponseEntity<SessaoDTO> obterSessaoParaRevisao(@PathVariable Long materiaId) {
        SessaoDTO sessao = sessaoEstudoService.obterUltimaSessaoDaMateria(materiaId);
        if (sessao == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(sessao);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirSessao(@PathVariable Long id) {
        // 🟢 Agora chamando o service correto onde o método foi colado!
        sessaoEstudoService.excluirSessaoEVoltarTopicos(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> atualizarAnotacoes(@PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        String novasAnotacoes = payload.get("anotacoes");
        sessaoEstudoService.atualizarAnotacoesSessao(id, novasAnotacoes);
        return ResponseEntity.ok().build();
    }

}