package com.estudoos.api.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class GeminiService {    

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${GEMINI_API_KEY:chave_temporaria_local}")
    private String apiKey;

    public GeminiService() {
        this.restClient = RestClient.create();
        this.objectMapper = new ObjectMapper();
    }

    public String ordenarTopicosComIa(String nomeDisciplina, List<String> topicos) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return String.join("\n", topicos);
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/interactions";

        String prompt = "Você é um especialista em pedagogia e concursos públicos. " +
                "A disciplina é: " + nomeDisciplina + ". " +
                "Ordene rigorosamente a seguinte lista de tópicos do nível básico ao avançado, " +
                "seguindo a ordem pedagógica padrão dos editais de concurso. " +
                "Retorne apenas os nomes dos tópicos ordenados, um por linha, sem numeração extra ou introduções: " + topicos;

        String requestBody = """
            {
              "model": "gemini-3.6-flash",
              "input": "%s"
            }
            """.formatted(prompt.replace("\"", "\\\"").replace("\n", " "));

        try {
            String jsonResponse = restClient.post()
                    .uri(url)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            System.out.println("🤖 RESPOSTA CRUA DO GEMINI: " + jsonResponse);

            JsonNode root = objectMapper.readTree(jsonResponse);
            
            // Extrai o texto da nova estrutura de steps -> content -> text
            JsonNode steps = root.path("steps");
            if (steps.isArray() && !steps.isEmpty()) {
                for (JsonNode step : steps) {
                    JsonNode contentArray = step.path("content");
                    if (contentArray.isArray() && !contentArray.isEmpty()) {
                        for (JsonNode content : contentArray) {
                            String texto = content.path("text").asText();
                            if (texto != null && !texto.trim().isEmpty()) {
                                return texto;
                            }
                        }
                    }
                }
            }

            return String.join("\n", topicos);

        } catch (Exception e) {
            System.err.println("❌ ERRO COMPLETO NA CHAMADA DO GEMINI: " + e.getMessage());
            e.printStackTrace();
            return String.join("\n", topicos);
        }
    }
    public String gerarSimuladoComIa(java.util.Map<String, List<String>> relatorioAssuntos) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("chave_temporaria_local")) {
            return "⚠️ Chave do Gemini não configurada para gerar o simulado na máquina local. Configure a variável de ambiente na VPS.";
        }

        StringBuilder sb = new StringBuilder();
        relatorioAssuntos.forEach((materia, assuntos) -> {
            sb.append("- ").append(materia).append(": ").append(String.join(", ", assuntos)).append("\n");
        });

        String prompt = "Atue como um especialista em bancas de concursos públicos (como FGV, Cebraspe/Cespe, FCC, Vunesp). " +
            "Com base estritamente nas seguintes matérias e assuntos estudados pelo aluno:\n" + 
            sb.toString() + 
            "\nGere um simulado contendo exatamente 40 questões de múltipla escolha (A, B, C, D, E).\n" +
            "REGRA OBRIGATÓRIA: As questões DEVEM ser de concursos públicos reais aplicados nos últimos anos no Brasil. Não invente questões.\n" +
            "Em cada questão, você DEVE indicar obrigatoriamente:\n" +
            "1. Órgão / Concurso e a Banca\n" +
            "2. Ano da prova\n" +
            "3. Enunciado completo\n" +
            "4. Alternativas de A a E\n" +
            "5. Gabarito oficial comentado ao final.\n" +
            "Formate o resultado de forma limpa em Markdown.";

        String url = "https://generativelanguage.googleapis.com/v1beta/interactions";

        String requestBody = """
            {
              "model": "gemini-3.6-flash",
              "input": "%s"
            }
            """.formatted(prompt.replace("\"", "\\\"").replace("\n", " "));

        try {
            String jsonResponse = restClient.post()
                    .uri(url)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode steps = root.path("steps");
            if (steps.isArray() && !steps.isEmpty()) {
                for (JsonNode step : steps) {
                    JsonNode contentArray = step.path("content");
                    if (contentArray.isArray() && !contentArray.isEmpty()) {
                        for (JsonNode content : contentArray) {
                            String texto = content.path("text").asText();
                            if (texto != null && !texto.trim().isEmpty()) {
                                return texto;
                            }
                        }
                    }
                }
            }
            return "⚠️ Não foi possível extrair o texto da resposta da IA.";
        } catch (Exception e) {
            System.err.println("❌ ERRO AO GERAR SIMULADO: " + e.getMessage());
            e.printStackTrace();
            return "⚠️ Erro interno ao comunicar com a API do Gemini.";
        }
    }
}