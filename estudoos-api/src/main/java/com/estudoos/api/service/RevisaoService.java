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

    public List<RevisaoDTO> listarRevisoesDoDia() {
        LocalDate hoje = LocalDate.now();
        List<Revisao> revisoesPendentes = revisaoRepository.findAll();

        List<Revisao> filtradas = revisoesPendentes.stream()
                .filter(r -> !r.isFeita())
                .filter(r -> r.getDataAgendada() != null
                        && (r.getDataAgendada().isBefore(hoje) || r.getDataAgendada().isEqual(hoje)))
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

    // ⚡ Conclui a revisão e gera o agendamento preenchendo todos os campos
    // obrigatórios! 🧠🛡️
    @Transactional
    public void concluirRevisao(Long id) {
        Revisao revisaoAtual = revisaoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Revisão não encontrada com o ID: " + id));

        // 1. Marca a revisão atual como feita ✅
        revisaoAtual.setFeita(true);
        revisaoRepository.save(revisaoAtual);

        // 2. Determina qual o intervalo e a etapa atual (proteção contra nulos) 📊
        Integer intervaloAtual = revisaoAtual.getIntervaloDias();
        if (intervaloAtual == null) {
            intervaloAtual = 3;
        }

        int proximoIntervalo = 0;
        int proximaEtapa = 1;

        // 🔄 Ciclo de Ebbinghaus: 3 dias (etapa 1) ➔ 7 dias (etapa 2) ➔ 15 dias (etapa
        // 3) ➔ 30 dias (etapa 4)
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

        // 3. Se houver próxima etapa, grava com TODOS os campos não nulos! 📅
        if (proximoIntervalo > 0 && revisaoAtual.getTopico() != null) {
            Revisao proximaRevisao = new Revisao();
            proximaRevisao.setTopico(revisaoAtual.getTopico());
            proximaRevisao.setDataAgendada(LocalDate.now().plusDays(proximoIntervalo));
            proximaRevisao.setIntervaloDias(proximoIntervalo); // 🟢 Preenchido! Evita erro 500 no Postgres
            proximaRevisao.setEtapa(proximaEtapa); // 🟢 Preenchido!
            proximaRevisao.setFeita(false);

            revisaoRepository.save(proximaRevisao);
        }
    }

    public Map<String, Long> obterEstatisticas() {
        Map<String, Long> stats = new HashMap<>();
        LocalDate hoje = LocalDate.now();
        LocalDate proximaSemana = hoje.plusDays(7);

        List<Revisao> todas = revisaoRepository.findAll();

        long hojeCount = todas.stream()
                .filter(r -> !r.isFeita() && r.getDataAgendada() != null
                        && (r.getDataAgendada().isBefore(hoje) || r.getDataAgendada().isEqual(hoje)))
                .count();

        long semanaCount = todas.stream()
                .filter(r -> !r.isFeita() && r.getDataAgendada() != null && !r.getDataAgendada().isBefore(hoje)
                        && !r.getDataAgendada().isAfter(proximaSemana))
                .count();

        long feitasCount = todas.stream()
                .filter(Revisao::isFeita)
                .count();

        stats.put("hoje", hojeCount);
        stats.put("proximos7Dias", semanaCount);
        stats.put("feitas", feitasCount);

        return stats;
    }
}