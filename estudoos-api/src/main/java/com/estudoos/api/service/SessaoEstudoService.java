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

    // Matrizes de intervalos fixed da Curva de Ebbinghaus (3, 7, 15, 30 dias)
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

        // 3. Atualiza os Tópicos que você marcou como concluídos hoje e agenda as revisões
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
                        sessao.getId(),              // 🟢 1. ID da própria sessão
                        sessao.getMateria().getId(), // 2. materiaId
                        sessao.getAnotacoes(),       // 3. anotacoes
                        sessao.getTopicos().stream().map(Topico::getNome).collect(Collectors.toList()), // 4. topicosNomes
                        sessao.getDataSessao()       // 5. dataSessao
                ))
                .collect(Collectors.toList());
    }

    public List<String> obterDiasEstudados() {
        return sessaoEstudoRepository.findDistinctDatasEstudo();
    }

   public SessaoDTO obterUltimaSessaoDaMateria(Long materiaId) {
        org.springframework.data.domain.Pageable limiteDeUm = org.springframework.data.domain.PageRequest.of(0, 1);
        List<SessaoEstudo> sessoes = sessaoEstudoRepository.findLatestSessionByMateriaId(materiaId, limiteDeUm);

        if (sessoes.isEmpty()) {
            return null;
        }

        SessaoEstudo sessao = sessoes.get(0);

        return new SessaoDTO(
                sessao.getId(),              // 🟢 1. ID da própria sessão
                sessao.getMateria().getId(), 
                sessao.getAnotacoes(),
                sessao.getTopicos().stream().map(Topico::getNome).collect(Collectors.toList()),
                sessao.getDataSessao() 
        );
    }

    @Transactional // 🔴 Essencial: Garante consistência total na exclusão e Rollback em caso de falha!
    public void excluirSessaoEVoltarTopicos(Long sessaoId) {
        // 1. Busca a sessão que será excluída do histórico
        SessaoEstudo sessao = sessaoEstudoRepository.findById(sessaoId)
                .orElseThrow(() -> new RuntimeException("Sessão não encontrada com o ID: " + sessaoId));

        // 2. Passa por cada tópico associado a essa sessão para reverter o progresso
        for (Topico topico : sessao.getTopicos()) {
            topico.setConcluido(false);     // Tira o risco visual 🟩
            topico.setDataConclusao(null);  // Reseta a data de finalização
            topicoRepository.save(topico);

            // 🔁 Remove os agendamentos futuros da Curva de Ebbinghaus gerados por esse assunto
            revisaoRepository.deleteByTopicoId(topico.getId());
        }

        // 3. Com os tópicos limpos, deleta fisicamente a sessão (o texto do resumo some)
        sessaoEstudoRepository.delete(sessao);
    }
    @Transactional // 🔴 Essencial para garantir a gravação segura no banco!
    public void atualizarAnotacoesSessao(Long id, String novasAnotacoes) {
        // 1. Busca a sessão que está sendo editada no caderno
        SessaoEstudo sessao = sessaoEstudoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sessão não encontrada com o ID: " + id));
        
        // 2. Altera estritamente o caderno de notas 📓
        sessao.setAnotacoes(novasAnotacoes);
        
        // 3. Salva no banco preservando todas as datas, matérias e tópicos intactos! ✅
        sessaoEstudoRepository.save(sessao);
    }
}