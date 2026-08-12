package com.estudoos.api.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

import com.estudoos.api.model.Concurso;
import com.estudoos.api.model.Usuario;
import com.estudoos.api.repository.UsuarioRepository;
import com.estudoos.api.service.ConcursoService;

@RestController
@RequestMapping("/api/concursos")
@CrossOrigin(origins = "*")
public class ConcursoController {

    private final ConcursoService concursoService;
    private final UsuarioRepository usuarioRepository;

    public ConcursoController(ConcursoService concursoService, UsuarioRepository usuarioRepository) {
        this.concursoService = concursoService;
        this.usuarioRepository = usuarioRepository;
    }

    private Usuario getUsuario(Authentication authentication) {
        if (authentication == null) return null;
        String email = authentication.getName();
        return usuarioRepository.findByEmail(email).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> listar(Authentication authentication) {
        Usuario u = getUsuario(authentication);
        if (u == null) return ResponseEntity.status(401).build();

        List<Concurso> list = concursoService.listarPorUsuario(u.getId());

        // retorna uma versão leve para o frontend (usa HashMap para permitir valores nulos)
        List<Map<String,Object>> out = list.stream().map(c -> {
            Map<String,Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("nome", c.getNome());
            m.put("data", c.getDataProva() != null ? c.getDataProva().toString() : null);
            m.put("jsonConteudo", c.getJsonConteudo());
            m.put("criadoEm", c.getCriadoEm() != null ? c.getCriadoEm().toString() : null);
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(out);
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Map<String, Object> payload, Authentication authentication) {
        Usuario u = getUsuario(authentication);
        if (u == null) return ResponseEntity.status(401).build();

        Concurso c = new Concurso();
        c.setNome((String) payload.getOrDefault("nome", payload.get("name")));
        Object data = payload.get("data") != null ? payload.get("data") : payload.get("dataProva");
        if (data instanceof String) {
            try {
                c.setDataProva(LocalDateTime.parse((String) data));
            } catch (DateTimeParseException ex) {
                // ignore
            }
        }
        // guarda o payload inteiro em jsonConteudo (frontend já serializa o objeto)
        if (payload.containsKey("json") && payload.get("json") instanceof String) {
            c.setJsonConteudo((String) payload.get("json"));
        } else {
            try { c.setJsonConteudo(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload)); } catch (Exception e) {}
        }

        Concurso saved = concursoService.salvarParaUsuario(c, u);
        return ResponseEntity.ok(Map.of("id", saved.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id, Authentication authentication) {
        Usuario u = getUsuario(authentication);
        if (u == null) return ResponseEntity.status(401).build();

        concursoService.deletarPorUsuario(id, u.getId());
        return ResponseEntity.ok().build();
    }
}
