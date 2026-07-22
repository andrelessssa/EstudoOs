package com.estudoos.api.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.estudoos.api.model.Materia;
import com.estudoos.api.model.SessaoEstudo;
import com.estudoos.api.model.Topico;
import com.estudoos.api.repository.MateriaRepository;
import com.estudoos.api.repository.RevisaoRepository;
import com.estudoos.api.repository.SessaoEstudoRepository;
import com.estudoos.api.repository.TopicoRepository;

@Service
public class TopicoService {

    private final TopicoRepository topicoRepository;
    private final MateriaRepository materiaRepository;
    private final RevisaoRepository revisaoRepository;
    private final SessaoEstudoRepository sessaoEstudoRepository;

    public TopicoService(TopicoRepository topicoRepository,
            MateriaRepository materiaRepository,
            RevisaoRepository revisaoRepository,
            SessaoEstudoRepository sessaoEstudoRepository) {
        this.topicoRepository = topicoRepository;
        this.materiaRepository = materiaRepository;
        this.revisaoRepository = revisaoRepository;
        this.sessaoEstudoRepository = sessaoEstudoRepository;
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

    // 🗑️ Excluir tópico desvinculando de revisões e sessões de estudo 🧹💥
    @Transactional
    public void deletarTopico(Long id) {
        Topico topico = topicoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tópico não encontrado para exclusão com ID: " + id));

        // 1. Limpa os agendamentos da Curva de Ebbinghaus
        revisaoRepository.deleteByTopicoId(id);

        // 2. Desvincula o tópico das sessões registradas no banco 🔗🧹
        List<SessaoEstudo> sessoes = sessaoEstudoRepository.findAll();
        for (SessaoEstudo sessao : sessoes) {
            if (sessao.getTopicos() != null && sessao.getTopicos().contains(topico)) {
                sessao.getTopicos().remove(topico);
                // Se a sessão ficou sem nenhum tópico associado, podemos optar por remover a
                // sessão ou salvá-la limpa
                sessaoEstudoRepository.save(sessao);
            }
        }

        // 3. Com todos os relacionamentos limpos, apaga o tópico com segurança! 💥
        topicoRepository.delete(topico);
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

    public List<Topico> listarTodos() {
        return topicoRepository.findAll();
    }
}