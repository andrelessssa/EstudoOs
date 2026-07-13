package com.estudoos.api.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.estudoos.api.dtos.SessaoDTO;
import com.estudoos.api.model.Materia;
import com.estudoos.api.model.Revisao;
import com.estudoos.api.model.SessaoEstudo;
import com.estudoos.api.model.Topico;
import com.estudoos.api.repository.MateriaRepository;
import com.estudoos.api.repository.RevisaoRepository;
import com.estudoos.api.repository.SessaoEstudoRepository;
import com.estudoos.api.repository.TopicoRepository;

@Service
public class SessaoEstudoService {

    private final SessaoEstudoRepository sessaoEstudoRepository;
    private final MateriaRepository materiaRepository;
    private final TopicoRepository topicoRepository;
    private final RevisaoRepository revisaoRepository;

    // Matrizes de intervalos fixos da Curva de Ebbinghaus (3, 7, 15, 30 dias)
    private static final int[] INTERVALOS_REVISAO = {3, 7, 15, 30};

    public SessaoEstudoService(SessaoEstudoRepository sessaoEstudoRepository,
                               MateriaRepository materiaRepository,
                               TopicoRepository topicoRepository,
                               RevisaoRepository revisaoRepository) {
        this.sessaoEstudoRepository = sessaoEstudoRepository;
        this.materiaRepository = materiaRepository;
        this.topicoRepository = topicoRepository;
        this.revisaoRepository = revisaoRepository;
    }

    @Transactional // Garante consistência total: ou grava tudo ou desfaz tudo em caso de falha
    public void salvarSessaoDeHoje(SessaoDTO dto) {
        // 1. Busca a Matéria associada
        Materia materia = materiaRepository.findById(dto.materiaId())
                .orElseThrow(() -> new RuntimeException("Matéria não encontrada com o ID: " + dto.materiaId()));

        // 2. Cria e salva o Histórico da Sessão com as suas Notas Rápidas
        SessaoEstudo sessao = new SessaoEstudo();
        sessao.setDataSessao(LocalDate.now());
        sessao.setAnotacoes(dto.anotacoes());
        sessao.setMateria(materia);
        sessaoEstudoRepository.save(sessao);

        // 3. Atualiza os Tópicos que você marcou como concluídos hoje e agenda as revisões
        List<Long> topicosIds = dto.topicosConcluidosIds();
        if (topicosIds != null && !topicosIds.isEmpty()) {
            for (Long idTopico : topicosIds) {
                Topico topico = topicoRepository.findById(idTopico)
                        .orElseThrow(() -> new RuntimeException("Tópico não encontrado com o ID: " + idTopico));
                
                // Marca o assunto como batido no edital
                topico.setConcluido(true);
                topico.setDataConclusao(LocalDate.now());
                topicoRepository.save(topico);

                // 🔁 MÁGICA: Gera os agendamentos da Curva de Ebbinghaus para esse assunto
                for (int i = 0; i < INTERVALOS_REVISAO.length; i++) {
                    int diasNoFuturo = INTERVALOS_REVISAO[i];
                    
                    Revisao revisao = new Revisao();
                    revisao.setDataAgendada(LocalDate.now().plusDays(diasNoFuturo)); // Calcula a data futura
                    revisao.setIntervaloDias(diasNoFuturo);
                    revisao.setEtapa(i + 1); // 1ª, 2ª, 3ª ou 4ª revisão
                    revisao.setFeita(false); // Começa pendente para o futuro
                    revisao.setTopico(topico);
                    
                    revisaoRepository.save(revisao); // Grava a linha de alerta no banco
                }
            }
        }
    }
}