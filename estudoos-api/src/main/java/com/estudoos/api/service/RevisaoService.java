package com.estudoos.api.service;

import java.util.List;
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

    // 🔍 Busca a fila de revisões pendentes trazendo apenas a mais próxima de cada assunto!
    public List<RevisaoDTO> listarRevisoesDoDia() {
        // 🟢 Removemos o limite rígido de 10 na Query para podermos agrupar tudo que está pendente primeiro
        List<Revisao> revisoesPendentes = revisaoRepository.findAll();

        // 🧠 MÁGICA DO STREAM: Filtra apenas as não feitas e agrupa mantendo a de menor data por Tópico!
        List<Revisao> filtradas = revisoesPendentes.stream()
                .filter(r -> !r.isFeita()) // Garante que só pegamos as pendentes
                .collect(Collectors.toMap(
                        revisao -> revisao.getTopico().getId(), // Chave: ID do Tópico (assunto)
                        revisao -> revisao,                     // Valor: A própria revisão
                        (r1, r2) -> r1.getDataAgendada().isBefore(r2.getDataAgendada()) ? r1 : r2 // Se houver duplicata, escolhe a com menor data! 📅
                ))
                .values().stream()
                .sorted((r1, r2) -> r1.getDataAgendada().compareTo(r2.getDataAgendada())) // Ordena da mais urgente para a mais distante
                .limit(10) // Aplica o limite de 10 na fila de exibição final
                .collect(Collectors.toList());

        // Converte a lista filtrada de Entidades para DTOs (Records)
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
    // ⚡ Executa a conclusão da revisão quando você clica no botão "✓ Feita"
 @Transactional
    public void concluirRevisao(Long id) {
        // 1. Busca a revisão atual que está sendo concluída
        Revisao revisaoAtual = revisaoRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Revisão não encontrada com o ID: " + id));

        // 2. Apenas marca como feita! ✅
        revisaoAtual.setFeita(true);
        revisaoRepository.save(revisaoAtual);
        
      
    }

public java.util.Map<String, Long> obterEstatisticas() {
    java.util.Map<String, Long> stats = new java.util.HashMap<>();
    
    java.time.LocalDate hoje = java.time.LocalDate.now();
    java.time.LocalDate proximaSemana = hoje.plusDays(7);

    // Busca todas as revisões do banco para processar os totais
    java.util.List<Revisao> todas = revisaoRepository.findAll();

    // 1. Quantas revisões estão agendadas para hoje ou atrasadas e não foram feitas
    long hojeCount = todas.stream()
        .filter(r -> !r.isFeita() && (r.getDataAgendada().isBefore(hoje) || r.getDataAgendada().isEqual(hoje)))
        .count();

    // 2. Quantas estão agendadas para os próximos 7 dias (incluindo hoje) e não foram feitas
    long semanaCount = todas.stream()
        .filter(r -> !r.isFeita() && !r.getDataAgendada().isBefore(hoje) && !r.getDataAgendada().isAfter(proximaSemana))
        .count();

    // 3. Quantas revisões já foram concluídas com sucesso no sistema
    long feitasCount = todas.stream()
        .filter(Revisao::isFeita)
        .count();

    stats.put("hoje", hojeCount);
    stats.put("proximos7Dias", semanaCount);
    stats.put("feitas", feitasCount);

    return stats;
}


    
}