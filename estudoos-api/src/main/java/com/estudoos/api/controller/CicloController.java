package com.estudoos.api.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
import com.estudoos.api.model.Usuario;
import com.estudoos.api.repository.MateriaRepository;
import com.estudoos.api.repository.UsuarioRepository;
import com.estudoos.api.service.CicloService;

import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/ciclo")
@CrossOrigin(origins = "*")
public class CicloController {

    private final CicloService cicloService;
    private final MateriaRepository materiaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper;

    public CicloController(CicloService cicloService, MateriaRepository materiaRepository, UsuarioRepository usuarioRepository) {
        this.cicloService = cicloService;
        this.materiaRepository = materiaRepository;
        this.usuarioRepository = usuarioRepository;
        this.objectMapper = new ObjectMapper();
    }

    private Usuario obterUsuarioAutenticado(Authentication authentication) {
        String email = authentication.getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + email));
    }

    @GetMapping("/ativo")
    public ResponseEntity<?> buscarCicloAtivo(Authentication authentication) {
        Usuario usuarioLogado = obterUsuarioAutenticado(authentication);
        CicloEstudo ciclo = cicloService.buscarCicloAtivo(usuarioLogado.getId());
        
        if (ciclo == null) {
            return ResponseEntity.ok(java.util.Map.of("ativo", false));
        }
        
        return ResponseEntity.ok(java.util.Map.of("ativo", true, "ciclo", ciclo));
    }

    @PostMapping("/gerar")
    public ResponseEntity<CicloResponseDTO> gerarCiclo(@RequestBody CicloRequestDTO request, Authentication authentication) {
        Usuario usuarioLogado = obterUsuarioAutenticado(authentication);
        List<Materia> materias = materiaRepository.findByUsuarioId(usuarioLogado.getId()).stream()
            .filter(m -> request.materiasIds().contains(String.valueOf(m.getId())))
            .collect(Collectors.toList());

        if (materias.isEmpty()) {
            return ResponseEntity.badRequest().body(
                CicloResponseDTO.vazio("Nenhuma matéria encontrada com os IDs informados.")
            );
        }

        CicloResponseDTO response = cicloService.gerarCiclo(request, materias);

        try {
            String jsonConteudo = objectMapper.writeValueAsString(response);
            LocalDate inicio = LocalDate.parse(request.dataInicio());
            LocalDate fim = LocalDate.parse(request.dataFim());
            cicloService.salvarOuAtualizarCiclo(usuarioLogado.getId(), jsonConteudo, inicio, fim);
        } catch (Exception e) {
            System.err.println("Erro ao salvar ciclo gerado no banco: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}
