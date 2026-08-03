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
    private final GeminiService geminiService; // 🤖 Serviço da IA injetado

    public TopicoService(TopicoRepository topicoRepository,
            MateriaRepository materiaRepository,
            RevisaoRepository revisaoRepository,
            SessaoEstudoRepository sessaoEstudoRepository,
            GeminiService geminiService) {
        this.topicoRepository = topicoRepository;
        this.materiaRepository = materiaRepository;
        this.revisaoRepository = revisaoRepository;
        this.sessaoEstudoRepository = sessaoEstudoRepository;
        this.geminiService = geminiService;
    }

    // 🔍 Listar tópicos por matéria
    public List<Topico> listarPorMateria(Long materiaId) {
        return topicoRepository.findByMateriaId(materiaId);
    }

    // ✏️ Editar nome OU status de conclusão do tópico 🔄
    @Transactional
    public Topico atualizarTopico(Long id, String novoNome, Boolean concluido) {
        Topico topico = topicoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tópico não encontrado com ID: " + id));

        // Se informou um nome válido, atualiza
        if (novoNome != null && !novoNome.trim().isEmpty()) {
            topico.setNome(novoNome.trim());
        }

        // Se informou o booleano de conclusão (true ou false), atualiza
        if (concluido != null) {
            topico.setConcluido(concluido);
            
            // 💡 Se desmarcou o assunto (concluido == false)
            if (!concluido) {
                // 1. Remove as revisões agendadas pendentes
                revisaoRepository.deleteByTopicoId(id);

                // 2. Remove o tópico das sessões registradas no banco 🧹
                List<SessaoEstudo> sessoes = sessaoEstudoRepository.findAll();
                for (SessaoEstudo sessao : sessoes) {
                    if (sessao.getTopicos() != null && sessao.getTopicos().contains(topico)) {
                        sessao.getTopicos().remove(topico);

                        // Se a sessão ficou vazia (sem tópicos), exclui a sessão por completo 💥
                        if (sessao.getTopicos().isEmpty()) {
                            sessaoEstudoRepository.delete(sessao);
                        } else {
                            sessaoEstudoRepository.save(sessao);
                        }
                    }
                }
            }
        }

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
                if (sessao.getTopicos().isEmpty()) {
                    sessaoEstudoRepository.delete(sessao);
                } else {
                    sessaoEstudoRepository.save(sessao);
                }
            }
        }

        // 3. Com todos os relacionamentos limpos, apaga o tópico com segurança! 💥
        topicoRepository.delete(topico);
    }

    // ➕ Adicionar novos tópicos a uma matéria existente (Ordenados pela IA 🧠✨)
    @Transactional
    public void adicionarTopicosAMateria(Long materiaId, List<String> novosTopicos) {
        Materia materia = materiaRepository.findById(materiaId)
                .orElseThrow(() -> new RuntimeException("Matéria não encontrada com ID: " + materiaId));

        if (novosTopicos != null && !novosTopicos.isEmpty()) {
            // 🤖 Chama o Gemini para organizar os tópicos do básico ao avançado
            String respostaIa = geminiService.ordenarTopicosComIa(materia.getNome(), novosTopicos);
            
            // Quebra o texto retornado pela IA linha por linha
            List<String> topicosOrdenados = List.of(respostaIa.split("\n"));

            for (String nomeTopico : topicosOrdenados) {
                if (nomeTopico != null && !nomeTopico.trim().isEmpty()) {
                    Topico topico = new Topico();
                    // Limpa traços, números ou asteriscos extras que a IA possa retornar
                    topico.setNome(nomeTopico.replaceAll("^[-*\\d.]+\\s*", "").trim());
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