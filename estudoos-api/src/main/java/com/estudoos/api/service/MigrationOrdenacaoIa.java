package com.estudoos.api.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.estudoos.api.model.Materia;
import com.estudoos.api.model.Topico;
import com.estudoos.api.repository.MateriaRepository;
import com.estudoos.api.repository.TopicoRepository;

@Component
public class MigrationOrdenacaoIa implements CommandLineRunner {

    private final MateriaRepository materiaRepository;
    private final TopicoRepository topicoRepository;
    private final GeminiService geminiService;

    public MigrationOrdenacaoIa(MateriaRepository materiaRepository, 
                                TopicoRepository topicoRepository,
                                GeminiService geminiService) {
        this.materiaRepository = materiaRepository;
        this.topicoRepository = topicoRepository;
        this.geminiService = geminiService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        System.out.println("🔄 [MIGRATION] Verificando se há matérias antigas para ordenar com IA...");

        List<Materia> todasMaterias = materiaRepository.findAll();

        for (Materia materia : todasMaterias) {
            List<Topico> topicosAtuais = topicoRepository.findByMateriaId(materia.getId());

            // Se a matéria tem mais de 1 tópico, vale a pena garantir que estão ordenados
            if (topicosAtuais != null && topicosAtuais.size() > 1) {
                List<String> nomesAtuais = topicosAtuais.stream()
                        .map(Topico::getNome)
                        .collect(Collectors.toList());

                try {
                    // 🤖 Pede para a IA ordenar os tópicos existentes dessa matéria
                    String respostaIa = geminiService.ordenarTopicosComIa(materia.getNome(), nomesAtuais);
                    List<String> nomesOrdenados = List.of(respostaIa.split("\n"));

                    // Atualiza a ordem ou reatribui os nomes de forma limpa
                    int index = 0;
                    for (String nomeOrdenado : nomesOrdenados) {
                        String nomeLimpo = nomeOrdenado.replaceAll("^[-*\\d.]+\\s*", "").trim();
                        if (!nomeLimpo.isEmpty() && index < topicosAtuais.size()) {
                            Topico topico = topicosAtuais.get(index);
                            topico.setNome(nomeLimpo);
                            topicoRepository.save(topico);
                            index++;
                        }
                    }
                    System.out.println("✅ Tópicos da matéria '" + materia.getNome() + "' ordenados com sucesso via IA!");
                } catch (Exception e) {
                    System.err.println("⚠️ Falha ao ordenar tópicos da matéria " + materia.getNome() + ": " + e.getMessage());
                }
            }
        }
        System.out.println("🚀 [MIGRATION] Processo de ordenação retroativa finalizado!");
    }
}