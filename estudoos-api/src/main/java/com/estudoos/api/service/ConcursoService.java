package com.estudoos.api.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.estudoos.api.model.Concurso;
import com.estudoos.api.model.Usuario;
import com.estudoos.api.repository.ConcursoRepository;

@Service
public class ConcursoService {

    private final ConcursoRepository concursoRepository;

    public ConcursoService(ConcursoRepository concursoRepository) {
        this.concursoRepository = concursoRepository;
    }

    public List<Concurso> listarPorUsuario(Long usuarioId) {
        return concursoRepository.findByUsuarioId(usuarioId);
    }

    public Concurso salvarParaUsuario(Concurso concurso, Usuario usuario) {
        concurso.setUsuario(usuario);
        concurso.setCriadoEm(LocalDateTime.now());
        return concursoRepository.save(concurso);
    }

    public void deletarPorUsuario(Long id, Long usuarioId) {
        concursoRepository.deleteByIdAndUsuarioId(id, usuarioId);
    }
}
