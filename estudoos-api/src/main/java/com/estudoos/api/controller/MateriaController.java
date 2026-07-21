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

import com.estudoos.api.dtos.MateriaDTO;
import com.estudoos.api.model.Materia;
import com.estudoos.api.service.MateriaService;

@RestController
@RequestMapping("/api/materias")
@CrossOrigin(origins = "*") // 🌐 Permite a conexão direta com o Angular sem travas de CORS
public class MateriaController {

    private final MateriaService materiaService;

    public MateriaController(MateriaService materiaService) {
        this.materiaService = materiaService;
    }

    // 📥 Endpoint para salvar a matéria com todas as linhas do edital de uma vez
    @PostMapping
    public ResponseEntity<MateriaDTO> criarMateriaComEdital(@RequestBody MateriaDTO dto) {
        MateriaDTO novaMateria = materiaService.salvarMateriaComEdital(dto);
        return ResponseEntity.ok(novaMateria);
    }

    // 📤 Endpoint para listar todas as matérias cadastradas no painel
    @GetMapping
    public ResponseEntity<List<Materia>> listarTodas() {
        return ResponseEntity.ok(materiaService.listarTodas());
    }
    // ✏️ PUT: Atualizar nome da matéria
    @PutMapping("/{id}")
    public ResponseEntity<Materia> atualizarMateria(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String novoNome = body.get("nome");
        Materia materia = materiaService.atualizarMateria(id, novoNome);
        return ResponseEntity.ok(materia);
    }

    // 🗑️ DELETE: Excluir matéria
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarMateria(@PathVariable Long id) {
        materiaService.deletarMateria(id);
        return ResponseEntity.noContent().build();
    }
}