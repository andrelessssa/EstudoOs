package com.estudoos.api.service;


import com.estudoos.api.dtos.CicloRequestDTO;
import com.estudoos.api.dtos.CicloResponseDTO;
import com.estudoos.api.dtos.CicloResponseDTO.BlocoDTO;
import com.estudoos.api.dtos.CicloResponseDTO.DiaDTO;
import com.estudoos.api.model.CicloEstudo;
import com.estudoos.api.model.Materia;
import com.estudoos.api.model.Topico;
import com.estudoos.api.repository.CicloRepository;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CicloService {

    private static final Set<String> PALAVRAS_CALCULO = Set.of(
        "matemática", "estatística", "raciocínio lógico", "lógica", "contabilidade",
        "finanças", "orçamento", "probabilidade", "álgebra", "geometria",
        "banco de dados", "sql", "algoritmos", "programação", "código",
        "redes", "estruturas de dados", "cálculo", "trigonometria"
    );

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final GeminiService geminiService;
    private final CicloRepository cicloRepository;

    public CicloService(GeminiService geminiService, CicloRepository cicloRepository) {
        this.geminiService = geminiService;
        this.cicloRepository = cicloRepository;
    }

    // ─── MÉTODOS DE BANCO DE DADOS ────────────────────────────────────────────

    public CicloEstudo buscarCicloAtivo(Long usuarioId) {
        return cicloRepository.findByUsuarioId(usuarioId).orElse(null);
    }

    public CicloEstudo salvarOuAtualizarCiclo(Long usuarioId, String jsonConteudo, LocalDate inicio, LocalDate fim) {
        Optional<CicloEstudo> existente = cicloRepository.findByUsuarioId(usuarioId);
        CicloEstudo ciclo = existente.orElse(new CicloEstudo());

        ciclo.setUsuarioId(usuarioId);
        ciclo.setJsonConteudo(jsonConteudo);
        ciclo.setDataInicio(inicio);
        ciclo.setDataFim(fim);
        ciclo.setGeradoEm(LocalDate.now());

        return cicloRepository.save(ciclo);
    }

    public void deletarCicloPorUsuarioId(Long usuarioId) {
        cicloRepository.findByUsuarioId(usuarioId).ifPresent(cicloRepository::delete);
    }

    // ─── MÉTODOS DE GERAÇÃO INTELIGENTE ───────────────────────────────────────

    public CicloResponseDTO gerarCiclo(CicloRequestDTO request, List<Materia> materias) {
        Set<Long> materiasIds = request.materiasIds().stream()
            .map(Long::valueOf)
            .collect(Collectors.toSet());

        List<Materia> materiasFiltradas = materias.stream()
            .filter(m -> materiasIds.contains(m.getId()))
            .collect(Collectors.toList());

        List<BlocoRaw> blocosPendentes = coletarBlocosPendentes(materiasFiltradas, request.prioridade());

        if (blocosPendentes.isEmpty()) {
            return CicloResponseDTO.vazio("Todos os assuntos já foram concluídos!");
        }

        List<LocalDate> diasDisponiveis = buildDiasDisponiveis(
            request.dataInicio(), request.dataFim(), request.diasSemana()
        );

        if (diasDisponiveis.isEmpty()) {
            return CicloResponseDTO.vazio("Nenhum dia disponível no período com os dias da semana selecionados.");
        }

        boolean sequentialMode = request.prioridade() == null || request.prioridade().isBlank() || request.prioridade().equals("sequential");
        List<DiaDTO> dias = distribuirBlocosPorDia(blocosPendentes, diasDisponiveis, request.horasPorDia(), sequentialMode);

        enriquecerComDicasIA(dias);

        int totalBlocos = dias.stream().mapToInt(d -> d.getBlocos().size()).sum();
        int assuntosNaoAlocados = Math.max(0, blocosPendentes.size() - totalBlocos);

        String aviso = null;
        if (assuntosNaoAlocados > 0) {
            aviso = assuntosNaoAlocados + " assunto(s) não couberam no período. Considere aumentar as horas diárias ou estender o prazo.";
        }

        return new CicloResponseDTO(dias.size(), totalBlocos, dias, aviso);
    }

    private List<BlocoRaw> coletarBlocosPendentes(List<Materia> materias, String prioridade) {
        List<BlocoRaw> blocos = new ArrayList<>();
        // Sequencial: percorre as matérias na ordem enviada e adiciona todos os tópicos pendentes de cada uma,
        // mantendo a ordem dos tópicos dentro da matéria. Remove duplicatas por nome normalizado.
        Set<String> seenNormalizedNames = new HashSet<>();
        for (Materia m : materias) {
            List<Topico> pendentes = m.getTopicos().stream()
                .filter(t -> !t.isConcluido())
                .collect(Collectors.toList());

            for (Topico t : pendentes) {
                String norm = normalizeName(t.getNome());
                if (seenNormalizedNames.contains(norm)) continue;
                seenNormalizedNames.add(norm);
                blocos.add(new BlocoRaw(
                    String.valueOf(m.getId()),
                    m.getNome(),
                    categorizar(m.getNome()),
                    String.valueOf(t.getId()),
                    t.getNome(),
                    0
                ));
            }
        }

        String pr = prioridade == null ? "" : prioridade;
        if ("weak".equals(pr)) {
            blocos.sort(Comparator.comparingInt(bloco -> bloco.progressoPct()));
        } else if ("random".equals(pr)) {
            Collections.shuffle(blocos);
        } else {
            // 'sequential' or default -> preserve collected order (materias top->down, tópicos em ordem)
        }

        return blocos;
    }

    private List<LocalDate> buildDiasDisponiveis(String inicio, String fim, List<Integer> diasSemana) {
        List<LocalDate> dias = new ArrayList<>();
        LocalDate cur = LocalDate.parse(inicio, FMT);
        LocalDate end = LocalDate.parse(fim, FMT);

        Set<Integer> diasSet = new HashSet<>(diasSemana);

        while (!cur.isAfter(end)) {
            int dow = cur.getDayOfWeek().getValue() % 7;
            if (diasSet.contains(dow)) {
                dias.add(cur);
            }
            cur = cur.plusDays(1);
        }

        return dias;
    }

    private List<DiaDTO> distribuirBlocosPorDia(List<BlocoRaw> blocos, List<LocalDate> dias, int horasPorDia) {
        return distribuirBlocosPorDia(blocos, dias, horasPorDia, false);
    }

    private List<DiaDTO> distribuirBlocosPorDia(List<BlocoRaw> blocos, List<LocalDate> dias, int horasPorDia, boolean sequentialMode) {
        if (sequentialMode) {
            Queue<BlocoRaw> fila = new LinkedList<>(blocos);
            List<DiaDTO> resultado = new ArrayList<>();

            for (LocalDate dia : dias) {
                if (fila.isEmpty()) break;
                List<BlocoDTO> blocosNoDia = new ArrayList<>();
                for (int slot = 0; slot < horasPorDia; slot++) {
                    BlocoRaw escolhido = fila.poll();
                    if (escolhido == null) break;
                    blocosNoDia.add(new BlocoDTO(
                        UUID.randomUUID().toString(),
                        escolhido.matId(),
                        escolhido.materia(),
                        escolhido.topicId(),
                        escolhido.assunto(),
                        null,
                        false
                    ));
                }
                resultado.add(new DiaDTO(dia.format(FMT), blocosNoDia));
            }

            return resultado;
        }

        Queue<BlocoRaw> filaCalculo = new LinkedList<>();
        Queue<BlocoRaw> filaTeoria = new LinkedList<>();

        for (BlocoRaw b : blocos) {
            if (b.categoria() == Categoria.CALCULO) filaCalculo.add(b);
            else                                    filaTeoria.add(b);
        }

        List<DiaDTO> resultado = new ArrayList<>();

        for (LocalDate dia : dias) {
            if (filaCalculo.isEmpty() && filaTeoria.isEmpty()) break;

            List<BlocoDTO> blocosNoDia = new ArrayList<>();
            boolean vezCalculo = true;

            for (int slot = 0; slot < horasPorDia; slot++) {
                BlocoRaw escolhido;

                if (vezCalculo) {
                    escolhido = filaCalculo.isEmpty() ? filaTeoria.poll() : filaCalculo.poll();
                } else {
                    escolhido = filaTeoria.isEmpty() ? filaCalculo.poll() : filaTeoria.poll();
                }

                if (escolhido == null) break;

                blocosNoDia.add(new BlocoDTO(
                    UUID.randomUUID().toString(),
                    escolhido.matId(),
                    escolhido.materia(),
                    escolhido.topicId(),
                    escolhido.assunto(),
                    null,
                    false
                ));

                vezCalculo = !vezCalculo;
            }

            resultado.add(new DiaDTO(dia.format(FMT), blocosNoDia));
        }

        return resultado;
    }

    private void enriquecerComDicasIA(List<DiaDTO> dias) {
        List<BlocoDTO> todosBlocos = dias.stream()
            .flatMap(d -> d.getBlocos().stream())
            .collect(Collectors.toList());

        int LOTE = 20;
        for (int i = 0; i < todosBlocos.size(); i += LOTE) {
            List<BlocoDTO> lote = todosBlocos.subList(i, Math.min(i + LOTE, todosBlocos.size()));
            gerarDicasParaLote(lote);
        }
    }

    private void gerarDicasParaLote(List<BlocoDTO> lote) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < lote.size(); i++) {
            BlocoDTO b = lote.get(i);
            sb.append(String.format(
                "{\"idx\":%d,\"materia\":\"%s\",\"assunto\":\"%s\"}",
                i, escapar(b.getMateria()), escapar(b.getAssunto())
            ));
            if (i < lote.size() - 1) sb.append(",");
        }
        sb.append("]");

        String prompt = "Você é especialista em concursos públicos brasileiros. " +
            "Para cada item abaixo, gere UMA dica de estudo objetiva (máx 15 palavras). " +
            "A dica deve indicar a melhor técnica para estudar aquele assunto específico. " +
            "Responda APENAS com JSON válido, sem texto extra, sem markdown: " +
            "[{\"idx\":0,\"dica\":\"...\"}, {\"idx\":1,\"dica\":\"...\"}] " +
            "Itens: " + sb.toString();

        try {
            String resposta = geminiService.chamarGeminiRaw(prompt);
            if (resposta == null || resposta.isBlank()) return;

            ObjectMapper mapper = new ObjectMapper();
            JsonNode arr = mapper.readTree(
                resposta.replace("```json", "").replace("```", "").trim()
            );

            if (arr.isArray()) {
                for (JsonNode node : arr) {
                    int idx = node.path("idx").asInt(-1);
                    String dica = node.path("dica").asText("");
                    if (idx >= 0 && idx < lote.size() && !dica.isBlank()) {
                        lote.get(idx).setDica(dica);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ Falha ao gerar dicas para lote: " + e.getMessage());
        }
    }

    private Categoria categorizar(String nomeMateria) {
        String lower = nomeMateria.toLowerCase();
        for (String palavra : PALAVRAS_CALCULO) {
            if (lower.contains(palavra)) return Categoria.CALCULO;
        }
        return Categoria.TEORIA;
    }

    private enum Categoria { CALCULO, TEORIA }

    private String escapar(String s) {
        return s == null ? "" : s.replace("\"", "\\\"").replace("\n", " ");
    }

    private String normalizeName(String s) {
        if (s == null) return "";
        return s.trim().toLowerCase().replaceAll("\s+"," ");
    }

    private record BlocoRaw(
        String matId, String materia, Categoria categoria,
        String topicId, String assunto, int progressoPct
    ) {}
}