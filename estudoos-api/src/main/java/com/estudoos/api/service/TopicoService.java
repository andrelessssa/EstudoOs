package com.estudoos.api.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.estudoos.api.model.Materia;
import com.estudoos.api.model.Topico;
import com.estudoos.api.repository.MateriaRepository;
import com.estudoos.api.repository.TopicoRepository;

@Service
public class TopicoService {

    private final TopicoRepository topicoRepository;
    private final MateriaRepository materiaRepository;

    public TopicoService(TopicoRepository topicoRepository, MateriaRepository materiaRepository) {
        this.topicoRepository = topicoRepository;
        this.materiaRepository = materiaRepository;
    }

    // 🔍 Listar tópicos por matéria
    public List<Topico> listarPorMateria(Long materiaId) {
        return topicoRepository.findByMateriaId(materiaId);
    }

    // ✏️ Editar nome do tópico
    @Transactional
    public Topico atualizarTopico(Long id, String novoNome) {
        Topico topico = topicoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tópico não encontrado com ID: " + id));
        topico.setNome(novoNome.trim());
        return topicoRepository.save(topico);
    }

    // 🗑️ Excluir tópico
    @Transactional
    public void deletarTopico(Long id) {
        if (!topicoRepository.existsById(id)) {
            throw new RuntimeException("Tópico não encontrado para exclusão com ID: " + id);
        }
        topicoRepository.deleteById(id);
    }

    // ➕ Adicionar novos tópicos a uma matéria existente
    @Transactional
    public void adicionarTopicosAMateria(Long materiaId, List<String> novosTopicos) {
        Materia materia = materiaRepository.findById(materiaId)
                .orElseThrow(() -> new RuntimeException("Matéria não encontrada com ID: " + materiaId));

        if (novosTopicos != null && !novosTopicos.isEmpty()) {
            for (String nomeTopico : novosTopicos) {
                if (nomeTopico != null && !nomeTopico.trim().isEmpty()) {
                    Topico topico = new Topico();
                    topico.setNome(nomeTopico.trim());
                    topico.setConcluido(false);
                    topico.setMateria(materia);
                    topicoRepository.save(topico);
                }
            }
        }
    }
}