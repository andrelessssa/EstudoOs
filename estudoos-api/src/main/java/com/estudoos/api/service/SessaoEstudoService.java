package com.estudoos.api.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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
    private static final int[] INTERVALOS_REVISAO = { 3, 7, 15, 30 };

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

        // 2. Cria o Histórico da Sessão com as suas Notas Rápidas
        SessaoEstudo sessao = new SessaoEstudo();
        sessao.setDataSessao(LocalDate.now());
        sessao.setAnotacoes(dto.anotacoes());
        sessao.setMateria(materia);

        // 3. Atualiza os Tópicos que você marcou como concluídos hoje e agenda as
        // revisões
        List<Long> topicosIds = dto.topicosConcluidosIds();
        List<Topico> topicosEstudados = new ArrayList<>();

        if (topicosIds != null && !topicosIds.isEmpty()) {
            for (Long idTopico : topicosIds) {
                Topico topico = topicoRepository.findById(idTopico)
                        .orElseThrow(() -> new RuntimeException("Tópico não encontrado com o ID: " + idTopico));

                // Marca o assunto como batido no edital
                topico.setConcluido(true);
                topico.setDataConclusao(LocalDate.now());
                topicoRepository.save(topico);

                // Adiciona o tópico à lista desta sessão
                topicosEstudados.add(topico);

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

        // 🔗 Vincula os tópicos estudados na sessão física e salva
        sessao.setTopicos(topicosEstudados);
        sessaoEstudoRepository.save(sessao);
    }

    @Transactional(readOnly = true)
    public List<SessaoDTO> listarTodas() {
        return sessaoEstudoRepository.findAll().stream()
                .map(sessao -> new SessaoDTO(
                        sessao.getMateria().getId(), // 1. materiaId
                        sessao.getAnotacoes(), // 2. anotacoes
                        sessao.getTopicos().stream().map(Topico::getId).collect(Collectors.toList()), // 3.
                                                                                                      // topicosConcluidosIds
                        sessao.getDataSessao() // 4. dataSessao vinda do banco!
                ))
                .collect(Collectors.toList());
    }

    public List<String> obterDiasEstudados() {
        return sessaoEstudoRepository.findDistinctDatasEstudo();
    }

    // 🟢 Ajustado para bater exatamente com o construtor do seu SessaoDTO!
    public SessaoDTO obterUltimaSessaoDaMateria(Long materiaId) {
        org.springframework.data.domain.Pageable limiteDeUm = org.springframework.data.domain.PageRequest.of(0, 1);
        List<SessaoEstudo> sessoes = sessaoEstudoRepository.findLatestSessionByMateriaId(materiaId, limiteDeUm);

        if (sessoes.isEmpty()) {
            return null;
        }

        SessaoEstudo sessao = sessoes.get(0);

        // Mapeia na ordem correta: materiaId, anotacoes, topicosConcluidosIds,
        // dataSessao 🚀
        return new SessaoDTO(
                sessao.getMateria().getId(),
                sessao.getAnotacoes(),
                sessao.getTopicos().stream().map(t -> t.getId()).collect(Collectors.toList()),
                sessao.getDataSessao() // Passa o LocalDate direto do banco
        );
    }

}