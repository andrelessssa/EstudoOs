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

    @Value("${gemini.api.key}")
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
}