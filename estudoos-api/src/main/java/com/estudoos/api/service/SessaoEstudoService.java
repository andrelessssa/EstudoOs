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
import com.estudoos.api.model.Usuario;
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

    // 🟢 1. Salva a sessão vinculando ao Usuário logado
    @Transactional
    public void salvarSessaoDeHoje(SessaoDTO dto, Usuario usuarioLogado) {
        Materia materia = materiaRepository.findByIdAndUsuarioId(dto.materiaId(), usuarioLogado.getId())
                .orElseThrow(() -> new RuntimeException("Matéria não encontrada com o ID: " + dto.materiaId()));

        SessaoEstudo sessao = new SessaoEstudo();
        sessao.setDataSessao(LocalDate.now());
        sessao.setAnotacoes(dto.anotacoes());
        sessao.setMateria(materia);
        sessao.setUsuario(usuarioLogado);

        List<Long> topicosIds = dto.topicosConcluidosIds();
        List<Topico> topicosEstudados = new ArrayList<>();

        if (topicosIds != null && !topicosIds.isEmpty()) {
            for (Long idTopico : topicosIds) {
                Topico topico = topicoRepository.findById(idTopico)
                        .orElseThrow(() -> new RuntimeException("Tópico não encontrado com o ID: " + idTopico));

                topico.setConcluido(true);
                topico.setDataConclusao(LocalDate.now());
                topicoRepository.save(topico);

                topicosEstudados.add(topico);

                // 🔁 Gera agendamentos da Curva de Ebbinghaus vinculando o Usuario
                for (int i = 0; i < INTERVALOS_REVISAO.length; i++) {
                    int diasNoFuturo = INTERVALOS_REVISAO[i];

                    Revisao revisao = new Revisao();
                    revisao.setDataAgendada(LocalDate.now().plusDays(diasNoFuturo));
                    revisao.setIntervaloDias(diasNoFuturo);
                    revisao.setEtapa(i + 1);
                    revisao.setFeita(false);
                    revisao.setTopico(topico);
                    revisao.setUsuario(usuarioLogado);

                    revisaoRepository.save(revisao);
                }
            }
        }

        sessao.setTopicos(topicosEstudados);
        sessaoEstudoRepository.save(sessao);
    }

    // 🟢 2. Listar sessões do Usuário logado
    @Transactional(readOnly = true)
    public List<SessaoDTO> listarPorUsuario(Long usuarioId) {
        return sessaoEstudoRepository.findByUsuarioId(usuarioId).stream()
                .map(sessao -> new SessaoDTO(
                        sessao.getId(),
                        sessao.getMateria().getId(),
                        sessao.getAnotacoes(),
                        sessao.getTopicos().stream().map(Topico::getId).collect(Collectors.toList()),
                        sessao.getTopicos().stream().map(Topico::getNome).collect(Collectors.toList()),
                        sessao.getDataSessao()
                ))
                .collect(Collectors.toList());
    }

    // 🟢 3. Dias estudados do Usuário logado (para o calendário)
    public List<String> obterDiasEstudadosPorUsuario(Long usuarioId) {
        return sessaoEstudoRepository.findDistinctDatasEstudoByUsuarioId(usuarioId);
    }

    // 🟢 4. Obtém a última sessão da matéria filtrando por Usuário
    public SessaoDTO obterUltimaSessaoDaMateriaEUsuario(Long materiaId, Long usuarioId) {
        org.springframework.data.domain.Pageable limiteDeUm = org.springframework.data.domain.PageRequest.of(0, 1);
        List<SessaoEstudo> sessoes = sessaoEstudoRepository.findLatestSessionByMateriaIdAndUsuarioId(materiaId, usuarioId, limiteDeUm);

        if (sessoes.isEmpty()) {
            return null;
        }

        SessaoEstudo sessao = sessoes.get(0);

        return new SessaoDTO(
                sessao.getId(),
                sessao.getMateria().getId(),
                sessao.getAnotacoes(),
                sessao.getTopicos().stream().map(Topico::getId).collect(Collectors.toList()),
                sessao.getTopicos().stream().map(Topico::getNome).collect(Collectors.toList()),
                sessao.getDataSessao()
        );
    }

    // 🗑️ 5. Exclui a sessão e reverte tópicos garantindo o Usuário
    @Transactional
    public void excluirSessaoEVoltarTopicos(Long sessaoId, Long usuarioId) {
        SessaoEstudo sessao = sessaoEstudoRepository.findByIdAndUsuarioId(sessaoId, usuarioId)
                .orElseThrow(() -> new RuntimeException("Sessão não encontrada ou acesso negado para ID: " + sessaoId));

        for (Topico topico : sessao.getTopicos()) {
            topico.setConcluido(false);
            topico.setDataConclusao(null);
            topicoRepository.save(topico);

            revisaoRepository.deleteByTopicoIdAndUsuarioId(topico.getId(), usuarioId);
        }

        sessaoEstudoRepository.delete(sessao);
    }

    // ✏️ 6. Atualiza anotações garantindo o Usuário
    @Transactional
    public void atualizarAnotacoesSessao(Long id, String novasAnotacoes, Long usuarioId) {
        SessaoEstudo sessao = sessaoEstudoRepository.findByIdAndUsuarioId(id, usuarioId)
                .orElseThrow(() -> new RuntimeException("Sessão não encontrada ou acesso negado para ID: " + id));

        sessao.setAnotacoes(novasAnotacoes);
        sessaoEstudoRepository.save(sessao);
    }
}