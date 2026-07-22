package com.estudoos.api.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.estudoos.api.dtos.MateriaDTO;
import com.estudoos.api.model.Materia;
import com.estudoos.api.model.SessaoEstudo;
import com.estudoos.api.model.Topico;
import com.estudoos.api.repository.MateriaRepository;
import com.estudoos.api.repository.RevisaoRepository;
import com.estudoos.api.repository.SessaoEstudoRepository;
import com.estudoos.api.repository.TopicoRepository;

@Service
public class MateriaService {

    private final MateriaRepository materiaRepository;
    private final TopicoRepository topicoRepository;
    private final RevisaoRepository revisaoRepository;
    private final SessaoEstudoRepository sessaoEstudoRepository;

    // Construtor injetando os repositories necessários
    public MateriaService(MateriaRepository materiaRepository, 
                          TopicoRepository topicoRepository,
                          RevisaoRepository revisaoRepository,
                          SessaoEstudoRepository sessaoEstudoRepository) {
        this.materiaRepository = materiaRepository;
        this.topicoRepository = topicoRepository;
        this.revisaoRepository = revisaoRepository;
        this.sessaoEstudoRepository = sessaoEstudoRepository;
    }

    @Transactional // Garante que se der erro em um tópico, não salva a matéria pela metade (Tudo ou nada)
    public MateriaDTO salvarMateriaComEdital(MateriaDTO dto) {
        // 1. Cria e salva a entidade principal da Matéria
        Materia materia = new Materia();
        materia.setNome(dto.nome());
        materia.setCor(dto.cor());
        materia = materiaRepository.save(materia);

        // 2. Transforma cada linha do edital enviada em um registro na tabela Topico
        List<String> nomesTopicos = dto.topicos();
        if (nomesTopicos != null && !nomesTopicos.isEmpty()) {
            for (String nomeTopico : nomesTopicos) {
                Topico topico = new Topico();
                topico.setNome(nomeTopico.trim());
                topico.setConcluido(false); // Começa pendente no edital
                topico.setMateria(materia); // Vincula o assunto à matéria criada
                topicoRepository.save(topico);
            }
        }

        // 3. Devolve o DTO com o ID gerado pelo banco para o Frontend saber que deu certo
        return new MateriaDTO(materia.getId(), materia.getNome(), materia.getCor(), null);
    }

    public List<Materia> listarTodas() {
        return materiaRepository.findAll();
    }

    // ✏️ Atualizar apenas o nome da matéria
    @Transactional
    public Materia atualizarMateria(Long id, String novoNome) {
        Materia materia = materiaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matéria não encontrada com ID: " + id));
        materia.setNome(novoNome.trim());
        return materiaRepository.save(materia);
    }

    // 🗑️ Excluir matéria e toda a sua árvore de forma segura
    @Transactional
    public void deletarMateria(Long id) {
        if (!materiaRepository.existsById(id)) {
            throw new RuntimeException("Matéria não encontrada com ID: " + id);
        }

        // 1. Busca todos os tópicos dessa matéria
        List<Topico> topicos = topicoRepository.findByMateriaId(id);

        // 2. Apaga as revisões agendadas vinculadas a cada tópico 🧹
        for (Topico topico : topicos) {
            revisaoRepository.deleteByTopicoId(topico.getId());
        }

        // 3. Busca e remove as sessões de estudo vinculadas a esta matéria
        List<SessaoEstudo> sessoes = sessaoEstudoRepository.findByMateriaId(id);
        if (sessoes != null && !sessoes.isEmpty()) {
            sessaoEstudoRepository.deleteAll(sessoes);
        }

        // 4. Limpa os tópicos da matéria
        topicoRepository.deleteAll(topicos);

        // 5. Agora deleta a matéria sem conflito de chave estrangeira! 💥
        materiaRepository.deleteById(id);
    }
}