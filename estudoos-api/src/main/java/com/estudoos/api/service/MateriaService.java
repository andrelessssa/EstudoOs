package com.estudoos.api.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.estudoos.api.dtos.MateriaDTO;
import com.estudoos.api.model.Materia;
import com.estudoos.api.model.SessaoEstudo;
import com.estudoos.api.model.Topico;
import com.estudoos.api.model.Usuario;
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

    public MateriaService(MateriaRepository materiaRepository, 
                          TopicoRepository topicoRepository,
                          RevisaoRepository revisaoRepository,
                          SessaoEstudoRepository sessaoEstudoRepository) {
        this.materiaRepository = materiaRepository;
        this.topicoRepository = topicoRepository;
        this.revisaoRepository = revisaoRepository;
        this.sessaoEstudoRepository = sessaoEstudoRepository;
    }

    // 🟢 1. Salva a matéria vinculando explicitamente ao Usuário logado
    @Transactional
    public MateriaDTO salvarMateriaComEdital(MateriaDTO dto, Usuario usuarioLogado) {
        // Cria e salva a entidade principal da Matéria vinculada ao usuário
        Materia materia = new Materia();
        materia.setNome(dto.nome());
        materia.setCor(dto.cor());
        materia.setUsuario(usuarioLogado); // 🔒 Vincula o usuário!
        materia = materiaRepository.save(materia);

        // Transforma cada linha do edital em um registro na tabela Topico
        List<String> nomesTopicos = dto.topicos();
        if (nomesTopicos != null && !nomesTopicos.isEmpty()) {
            for (String nomeTopico : nomesTopicos) {
                Topico topico = new Topico();
                topico.setNome(nomeTopico.trim());
                topico.setConcluido(false);
                topico.setMateria(materia);
                topicoRepository.save(topico);
            }
        }

        return new MateriaDTO(materia.getId(), materia.getNome(), materia.getCor(), null);
    }

    // 🟢 2. Lista APENAS as matérias do usuário logado
    public List<Materia> listarPorUsuario(Long usuarioId) {
        return materiaRepository.findByUsuarioId(usuarioId);
    }

    // ✏️ 3. Atualiza a matéria garantindo que ela pertence ao usuário
    @Transactional
    public Materia atualizarMateria(Long id, String novoNome, Long usuarioId) {
        Materia materia = materiaRepository.findByIdAndUsuarioId(id, usuarioId)
                .orElseThrow(() -> new RuntimeException("Matéria não encontrada ou não pertence ao usuário com ID: " + id));
        
        materia.setNome(novoNome.trim());
        return materiaRepository.save(materia);
    }

    // 🗑️ 4. Exclui a matéria e a árvore garantindo que pertencem ao usuário
    @Transactional
    public void deletarMateria(Long id, Long usuarioId) {
        if (!materiaRepository.existsByIdAndUsuarioId(id, usuarioId)) {
            throw new RuntimeException("Matéria não encontrada ou acesso negado para ID: " + id);
        }

        List<Topico> topicos = topicoRepository.findByMateriaId(id);

        for (Topico topico : topicos) {
            revisaoRepository.deleteByTopicoIdAndUsuarioId(topico.getId(), usuarioId);
        }

        List<SessaoEstudo> sessoes = sessaoEstudoRepository.findByMateriaIdAndUsuarioId(id, usuarioId);
        if (sessoes != null && !sessoes.isEmpty()) {
            sessaoEstudoRepository.deleteAll(sessoes);
        }

        topicoRepository.deleteAll(topicos);

        materiaRepository.deleteById(id);
    }
}