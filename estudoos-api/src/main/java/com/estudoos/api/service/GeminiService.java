package com.estudoos.api.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

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

            return String.join("\n", topicos);

        } catch (Exception e) {
            System.err.println("❌ ERRO COMPLETO NA CHAMADA DO GEMINI: " + e.getMessage());
            e.printStackTrace();
            return String.join("\n", topicos);
        }
    }

    public String chamarGeminiRaw(String prompt) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("chave_temporaria_local")) {
            return "";
        }

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

            return jsonResponse;
        } catch (Exception e) {
            System.err.println("❌ ERRO NA CHAMADA RAW DO GEMINI: " + e.getMessage());
            return "";
        }
    }

    public String gerarCicloEstudosInteligente(List<String> nomesMaterias) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("chave_temporaria_local")) {
            return "⚠️ Chave do Gemini não configurada.";
        }

        String prompt = "Atue como um mentor especialista em aprovação em concursos públicos. " +
                "Com base exclusivamente nas seguintes matérias cadastradas pelo aluno: " + String.join(", ", nomesMaterias) + ". " +
                "Estruture um Ciclo de Estudos Inteligente e otimizado.";

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
            return "⚠️ Não foi possível extrair o ciclo gerado pela IA.";
        } catch (Exception e) {
            return "⚠️ Erro interno ao comunicar com a API do Gemini.";
        }
    }

    public String gerarSimuladoComIa(java.util.Map<String, List<String>> relatorioAssuntos) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("chave_temporaria_local")) {
            return "⚠️ Chave do Gemini não configurada.";
        }

        StringBuilder sb = new StringBuilder();
        relatorioAssuntos.forEach((materia, assuntos) -> {
            sb.append("- ").append(materia).append(": ").append(String.join(", ", assuntos)).append("\n");
        });

        String prompt = "Atue como um especialista em bancas de concursos públicos. Gere um simulado com base em: " + sb.toString();

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
            return "⚠️ Erro interno ao comunicar com a API do Gemini.";
        }
    }

    // MÉTODO ADICIONADO PARA O CICLO PERSONALIZADO AVANÇADO
   public String gerarCicloEstudosPersonalizado(java.util.Map<String, Object> payload) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("chave_temporaria_local")) {
            return "{\"erro\": \"Chave do Gemini não configurada.\"}";
        }

        String prompt = "Você é especialista em planejamento de estudos para concursos públicos brasileiros.\n" +
                "Com base nos seguintes dados de configuração e matérias do aluno (em formato JSON):\n" +
                payload.toString() + "\n\n" +
                "REGRAS OBRIGATÓRIAS:\n" +
                "1. Monte um ciclo focado em BLOCOS SEMANAIS (organizado estritamente de segunda a domingo).\n" +
                "2. Cada bloco = 1 hora de estudo com 1 assunto.\n" +
                "3. Para cada bloco inclua uma 'dica' curta de estudo (1 frase).\n" +
                "4. Use os campos 'matId', 'materia', 'topicId' e 'assunto' exatamente como estão nos dados de entrada.\n\n" +
                "RESPONDA APENAS com um JSON válido, sem texto antes/depois, sem markdown e sem backticks, seguindo esta estrutura exata:\n" +
                "{\n" +
                "  \"totalDias\": 0,\n" +
                "  \"totalBlocos\": 0,\n" +
                "  \"dias\": [\n" +
                "    {\n" +
                "      \"data\": \"YYYY-MM-DD\",\n" +
                "      \"blocos\": [\n" +
                "        {\n" +
                "          \"materia\": \"Nome da Matéria\",\n" +
                "          \"matId\": \"id_materia\",\n" +
                "          \"assunto\": \"Nome do Assunto\",\n" +
                "          \"topicId\": \"id_topico\",\n" +
                "          \"dica\": \"Dica de estudo\"\n" +
                "        }\n" +
                "      ]\n" +
                "    }\n" +
                "  ]\n" +
                "}";

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
                                return texto.replace("```json", "").replace("```", "").trim();
                            }
                        }
                    }
                }
            }
            return "{\"erro\": \"Não foi possível extrair o texto da resposta da IA.\"}";
        } catch (Exception e) {
            System.err.println("❌ ERRO AO GERAR CICLO PERSONALIZADO: " + e.getMessage());
            return "{\"erro\": \"Erro interno ao comunicar com a API do Gemini.\"}";
        }
    }
}