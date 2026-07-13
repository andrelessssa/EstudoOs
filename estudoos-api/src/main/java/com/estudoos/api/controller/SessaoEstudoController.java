package com.estudoos.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
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
}