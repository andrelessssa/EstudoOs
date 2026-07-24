package com.estudoos.api.controller;

import java.security.Principal;
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

import com.estudoos.api.dtos.MateriaDTO;
import com.estudoos.api.model.Materia;
import com.estudoos.api.service.MateriaService;

@RestController
@RequestMapping("/api/materias")
@CrossOrigin(origins = "*")
public class MateriaController {

    private final MateriaService materiaService;

    public MateriaController(MateriaService materiaService) {
        this.materiaService = materiaService;
    }

    // 📥 Salva matéria vinculando ao usuário logado via e-mail do JWT
    @PostMapping
    public ResponseEntity<MateriaDTO> criarMateriaComEdital(
            @RequestBody MateriaDTO dto, 
            Principal principal) {
        
        MateriaDTO novaMateria = materiaService.salvarMateriaComEditalPorEmail(dto, principal.getName());
        return ResponseEntity.ok(novaMateria);
    }

    // 📤 Lista matérias APENAS do usuário logado via e-mail do JWT
    @GetMapping
    public ResponseEntity<List<Materia>> listarTodas(Principal principal) {
        List<Materia> materias = materiaService.listarPorEmailUsuario(principal.getName());
        return ResponseEntity.ok(materias);
    }

    // ✏️ PUT: Atualizar nome da matéria garantindo o usuário
    @PutMapping("/{id}")
    public ResponseEntity<Materia> atualizarMateria(
            @PathVariable Long id, 
            @RequestBody Map<String, String> body,
            Principal principal) {
        
        String novoNome = body.get("nome");
        Materia materia = materiaService.atualizarMateriaPorEmail(id, novoNome, principal.getName());
        return ResponseEntity.ok(materia);
    }

    // 🗑️ DELETE: Excluir matéria garantindo o usuário
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarMateria(
            @PathVariable Long id,
            Principal principal) {
        
        materiaService.deletarMateriaPorEmail(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}