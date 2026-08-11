package com.estudoos.api.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.estudoos.api.dtos.CicloRequestDTO;
import com.estudoos.api.dtos.CicloResponseDTO;
import com.estudoos.api.model.CicloEstudo;
import com.estudoos.api.model.Materia;
import com.estudoos.api.repository.MateriaRepository;
import com.estudoos.api.service.CicloService;

import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/ciclo")
@CrossOrigin(origins = "*")
public class CicloController {

    private final CicloService cicloService;
    private final MateriaRepository materiaRepository;
    private final ObjectMapper objectMapper;

    public CicloController(CicloService cicloService, MateriaRepository materiaRepository) {
        this.cicloService = cicloService;
        this.materiaRepository = materiaRepository;
        this.objectMapper = new ObjectMapper();
    }

    @GetMapping("/ativo")
    public ResponseEntity<?> buscarCicloAtivo() {
        Long usuarioId = 1L; // Ajuste conforme a sua lógica de autenticação atual
        CicloEstudo ciclo = cicloService.buscarCicloAtivo(usuarioId);
        
        if (ciclo == null) {
            return ResponseEntity.ok(java.util.Map.of("ativo", false));
        }
        
        return ResponseEntity.ok(java.util.Map.of("ativo", true, "ciclo", ciclo));
    }

    @PostMapping("/gerar")
    public ResponseEntity<CicloResponseDTO> gerarCiclo(@RequestBody CicloRequestDTO request) {
       List<Materia> materias = materiaRepository.findAllById(
    request.materiasIds().stream().map(Long::valueOf).toList()
);

        if (materias.isEmpty()) {
            return ResponseEntity.badRequest().body(
                CicloResponseDTO.vazio("Nenhuma matéria encontrada com os IDs informados.")
            );
        }

        CicloResponseDTO response = cicloService.gerarCiclo(request, materias);

        try {
            String jsonConteudo = objectMapper.writeValueAsString(response);
            Long usuarioId = 1L; // Ajuste conforme o usuário logado
            LocalDate inicio = LocalDate.parse(request.dataInicio());
            LocalDate fim = LocalDate.parse(request.dataFim());
            
            cicloService.salvarOuAtualizarCiclo(usuarioId, jsonConteudo, inicio, fim);
        } catch (Exception e) {
            System.err.println("Erro ao salvar ciclo gerado no banco: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}