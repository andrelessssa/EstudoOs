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
        // Usando o modelo atualizado e ativo gemini-3.6-flash
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" + apiKey;

        String prompt = "Você é um especialista em pedagogia e concursos públicos. " +
                "A disciplina é: " + nomeDisciplina + ". " +
                "Ordene a seguinte lista de tópicos rigorosamente do nível básico ao avançado, " +
                "seguindo a ordem pedagógica padrão dos editais de concurso. " +
                "Retorne apenas os nomes dos tópicos ordenados, um por linha, sem numeração extra ou introduções: " + topicos;

        String requestBody = """
            {
              "contents": [{
                "parts": [{
                  "text": "%s"
                }]
              }]
            }
            """.formatted(prompt.replace("\"", "\\\"").replace("\n", " "));

        try {
            String jsonResponse = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(jsonResponse);
            return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

        } catch (Exception e) {
            System.err.println("❌ ERRO DETALHADO AO CHAMAR O GEMINI: " + e.getMessage());
            e.printStackTrace();
            // Retorna a lista original como fallback se a IA falhar
            return String.join("\n", topicos);
        }
    }
}