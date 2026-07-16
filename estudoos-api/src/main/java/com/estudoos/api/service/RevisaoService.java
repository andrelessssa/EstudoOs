package com.estudoos.api.service;

import com.estudoos.api.dtos.RevisaoDTO;
import com.estudoos.api.model.Revisao;
import com.estudoos.api.repository.RevisaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RevisaoService {

    private final RevisaoRepository revisaoRepository;

    public RevisaoService(RevisaoRepository revisaoRepository) {
        this.revisaoRepository = revisaoRepository;
    }

    // 🔍 Busca a fila de revisões pendentes até a data atual
    public List<RevisaoDTO> listarRevisoesDoDia() {
        // 🟢 Cria a limitação de 10 itens na consulta do banco
        org.springframework.data.domain.Pageable limiteDeDez = org.springframework.data.domain.PageRequest.of(0, 10);
        
        List<Revisao> revisoesPendentes = revisaoRepository.buscarRevisoesPendentes(limiteDeDez);

        // Converte a lista de Entidades do banco para a nossa lista de DTOs (Records)
        return revisoesPendentes.stream()
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
        Revisao revisao = revisaoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agendamento de revisão não encontrado com o ID: " + id));

        revisao.setFeita(true); // Marca como revisado e remove da fila do dia
        revisaoRepository.save(revisao);
    }

    
    public java.util.Map<String, Long> obterEstatisticasRevisao() {
        java.util.Map<String, Long> stats = new java.util.HashMap<>();

        stats.put("hoje", (long) listarRevisoesDoDia().size());

        // Chamando o nosso método manual que contorna a geração automática
        stats.put("proximos7Dias", revisaoRepository.contarRevisoesNoIntervalo(
                java.time.LocalDate.now().plusDays(1),
                java.time.LocalDate.now().plusDays(7)));

        stats.put("feitas", revisaoRepository.countByFeitaTrue());

        return stats;
    }
}