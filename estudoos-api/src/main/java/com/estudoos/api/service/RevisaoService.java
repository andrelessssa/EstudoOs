package com.estudoos.api.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.estudoos.api.dtos.RevisaoDTO;
import com.estudoos.api.model.Revisao;
import com.estudoos.api.repository.RevisaoRepository;

@Service
public class RevisaoService {

    private final RevisaoRepository revisaoRepository;

    public RevisaoService(RevisaoRepository revisaoRepository) {
        this.revisaoRepository = revisaoRepository;
    }

    // 🟢 1. Lista apenas as revisões de hoje/atrasadas do USUÁRIO logado
    public List<RevisaoDTO> listarRevisoesDoDiaPorUsuario(Long usuarioId) {
        LocalDate hoje = LocalDate.now();
        List<Revisao> revisoesPendentes = revisaoRepository.buscarRevisoesAtrasadasEHojePorUsuario(usuarioId, hoje);

        List<Revisao> filtradas = revisoesPendentes.stream()
                .collect(Collectors.toMap(
                        revisao -> revisao.getTopico().getId(),
                        revisao -> revisao,
                        (r1, r2) -> r1.getDataAgendada().isBefore(r2.getDataAgendada()) ? r1 : r2))
                .values().stream()
                .sorted((r1, r2) -> r1.getDataAgendada().compareTo(r2.getDataAgendada()))
                .collect(Collectors.toList());

        return filtradas.stream()
                .map(revisao -> new RevisaoDTO(
                        revisao.getId(),
                        revisao.getTopico().getNome(),
                        revisao.getTopico().getMateria().getNome(),
                        revisao.getTopico().getMateria().getCor(),
                        revisao.getDataAgendada(),
                        revisao.getEtapa()))
                .collect(Collectors.toList());
    }

    // 🟢 2. Conclui a revisão e gera o próximo ciclo vinculando o USUÁRIO
    @Transactional
    public void concluirRevisao(Long id, Long usuarioId) {
        Revisao revisaoAtual = revisaoRepository.findByIdAndUsuarioId(id, usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Revisão não encontrada ou acesso negado para ID: " + id));

        // 1. Marca a revisão atual como feita ✅
        revisaoAtual.setFeita(true);
        revisaoRepository.save(revisaoAtual);

        // 2. Determina intervalo e próxima etapa
        Integer intervaloAtual = revisaoAtual.getIntervaloDias();
        if (intervaloAtual == null) {
            intervaloAtual = 3;
        }

        int proximoIntervalo = 0;
        int proximaEtapa = 1;

        if (intervaloAtual <= 3) {
            proximoIntervalo = 7;
            proximaEtapa = 2;
        } else if (intervaloAtual == 7) {
            proximoIntervalo = 15;
            proximaEtapa = 3;
        } else if (intervaloAtual == 15) {
            proximoIntervalo = 30;
            proximaEtapa = 4;
        }

        // 3. Salva a próxima revisão mantendo o vinculo com o Usuario 📅🔒
        if (proximoIntervalo > 0 && revisaoAtual.getTopico() != null) {
            Revisao proximaRevisao = new Revisao();
            proximaRevisao.setTopico(revisaoAtual.getTopico());
            proximaRevisao.setDataAgendada(LocalDate.now().plusDays(proximoIntervalo));
            proximaRevisao.setIntervaloDias(proximoIntervalo);
            proximaRevisao.setEtapa(proximaEtapa);
            proximaRevisao.setFeita(false);
            proximaRevisao.setUsuario(revisaoAtual.getUsuario()); // 🔒 Garante que a próxima etapa pertence ao mesmo usuário!

            revisaoRepository.save(proximaRevisao);
        }
    }

    // 🟢 3. Estatísticas exclusivas do USUÁRIO logado
    public Map<String, Long> obterEstatisticasPorUsuario(Long usuarioId) {
        Map<String, Long> stats = new HashMap<>();
        LocalDate hoje = LocalDate.now();
        LocalDate proximaSemana = hoje.plusDays(7);

        long hojeCount = revisaoRepository.contarRevisoesAtrasadasEHojePorUsuario(usuarioId, hoje);
        long semanaCount = revisaoRepository.contarRevisoesNoIntervaloPorUsuario(usuarioId, hoje, proximaSemana);
        long feitasCount = revisaoRepository.countByUsuarioIdAndFeitaTrue(usuarioId);

        stats.put("hoje", hojeCount);
        stats.put("proximos7Dias", semanaCount);
        stats.put("feitas", feitasCount);

        return stats;
    }
}