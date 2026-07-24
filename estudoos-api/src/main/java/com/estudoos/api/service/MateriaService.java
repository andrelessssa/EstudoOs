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
import com.estudoos.api.repository.UsuarioRepository;

@Service
public class MateriaService {

    private final MateriaRepository materiaRepository;
    private final TopicoRepository topicoRepository;
    private final RevisaoRepository revisaoRepository;
    private final SessaoEstudoRepository sessaoEstudoRepository;
    private final UsuarioRepository usuarioRepository; // 🟢 Injeção do repositório de usuário

    public MateriaService(MateriaRepository materiaRepository, 
                          TopicoRepository topicoRepository,
                          RevisaoRepository revisaoRepository,
                          SessaoEstudoRepository sessaoEstudoRepository,
                          UsuarioRepository usuarioRepository) {
        this.materiaRepository = materiaRepository;
        this.topicoRepository = topicoRepository;
        this.revisaoRepository = revisaoRepository;
        this.sessaoEstudoRepository = sessaoEstudoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // 🟢 1. Salva a matéria buscando o Usuário logado pelo e-mail do JWT
    @Transactional
    public MateriaDTO salvarMateriaComEditalPorEmail(MateriaDTO dto, String email) {
        Usuario usuarioLogado = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o e-mail: " + email));

        Materia materia = new Materia();
        materia.setNome(dto.nome());
        materia.setCor(dto.cor());
        materia.setUsuario(usuarioLogado); // 🔒 Vincula o usuário logado real!
        materia = materiaRepository.save(materia);

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

    // 🟢 2. Lista APENAS as matérias do usuário logado buscando pelo e-mail do JWT
    public List<Materia> listarPorEmailUsuario(String email) {
        Usuario usuarioLogado = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o e-mail: " + email));

        return materiaRepository.findByUsuarioId(usuarioLogado.getId());
    }

    // ✏️ 3. Atualiza a matéria garantindo que ela pertence ao usuário logado
    @Transactional
    public Materia atualizarMateriaPorEmail(Long id, String novoNome, String email) {
        Usuario usuarioLogado = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o e-mail: " + email));

        Materia materia = materiaRepository.findByIdAndUsuarioId(id, usuarioLogado.getId())
                .orElseThrow(() -> new RuntimeException("Matéria não encontrada ou não pertence ao usuário com ID: " + id));
        
        materia.setNome(novoNome.trim());
        return materiaRepository.save(materia);
    }

    // 🗑️ 4. Exclui a matéria garantindo que pertence ao usuário logado
    @Transactional
    public void deletarMateriaPorEmail(Long id, String email) {
        Usuario usuarioLogado = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o e-mail: " + email));

        Long usuarioId = usuarioLogado.getId();

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