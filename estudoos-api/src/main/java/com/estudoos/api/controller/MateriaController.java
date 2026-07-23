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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.estudoos.api.dtos.MateriaDTO;
import com.estudoos.api.model.Materia;
import com.estudoos.api.model.Usuario;
import com.estudoos.api.service.MateriaService;

@RestController
@RequestMapping("/api/materias")
@CrossOrigin(origins = "*")
public class MateriaController {

    private final MateriaService materiaService;

    public MateriaController(MateriaService materiaService) {
        this.materiaService = materiaService;
    }

    // 📥 Endpoint para salvar a matéria vinculando ao usuário logado
    @PostMapping
    public ResponseEntity<MateriaDTO> criarMateriaComEdital(@RequestBody MateriaDTO dto) {
        // 💡 OBS: Quando o JWT estiver 100%, o 'usuarioLogado' virá direto do contexto do Spring Security
        Usuario usuarioTemp = new Usuario(); 
        usuarioTemp.setId(1L); // Mock temporário para compilar antes do JWT estar ativo

        MateriaDTO novaMateria = materiaService.salvarMateriaComEdital(dto, usuarioTemp);
        return ResponseEntity.ok(novaMateria);
    }

    // 📤 Endpoint para listar matérias APENAS do usuário logado
    @GetMapping
    public ResponseEntity<List<Materia>> listarTodas() {
        Long usuarioIdTemp = 1L; // Mock temporário
        return ResponseEntity.ok(materiaService.listarPorUsuario(usuarioIdTemp));
    }

    // ✏️ PUT: Atualizar nome da matéria garantindo o usuário
    @PutMapping("/{id}")
    public ResponseEntity<Materia> atualizarMateria(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Long usuarioIdTemp = 1L;
        String novoNome = body.get("nome");
        Materia materia = materiaService.atualizarMateria(id, novoNome, usuarioIdTemp);
        return ResponseEntity.ok(materia);
    }

    // 🗑️ DELETE: Excluir matéria garantindo o usuário
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarMateria(@PathVariable Long id) {
        Long usuarioIdTemp = 1L;
        materiaService.deletarMateria(id, usuarioIdTemp);
        return ResponseEntity.noContent().build();
    }
}