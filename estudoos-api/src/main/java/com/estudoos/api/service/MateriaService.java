package com.estudoos.api.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.estudoos.api.dtos.MateriaDTO;
import com.estudoos.api.model.Materia;
import com.estudoos.api.model.Topico;
import com.estudoos.api.repository.MateriaRepository;
import com.estudoos.api.repository.TopicoRepository;

@Service
public class MateriaService {

    private final MateriaRepository materiaRepository;
    private final TopicoRepository topicoRepository;

    // Construtor injetando os repositories (@Autowired implícito pelo Spring)
    public MateriaService(MateriaRepository materiaRepository, TopicoRepository topicoRepository) {
        this.materiaRepository = materiaRepository;
        this.topicoRepository = topicoRepository;
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
}