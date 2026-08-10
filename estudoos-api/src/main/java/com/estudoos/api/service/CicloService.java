package com.estudoos.api.service;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.estudoos.api.model.CicloEstudo;
import com.estudoos.api.repository.CicloRepository;

@Service
public class CicloService {

    @Autowired
    private CicloRepository cicloRepository;

    public CicloEstudo buscarCicloAtivo(Long usuarioId) {
        return cicloRepository.findByUsuarioId(usuarioId).orElse(null);
    }

    public CicloEstudo salvarOuAtualizarCiclo(Long usuarioId, String jsonConteudo, LocalDate inicio, LocalDate fim) {
        // Remove ou sobrescreve o ciclo anterior caso o usuário clique em "Gerar novo plano"
        Optional<CicloEstudo> existente = cicloRepository.findByUsuarioId(usuarioId);
        CicloEstudo ciclo = existente.orElse(new CicloEstudo());

        ciclo.setUsuarioId(usuarioId);
        ciclo.setJsonConteudo(jsonConteudo);
        ciclo.setDataInicio(inicio);
        ciclo.setDataFim(fim);
        ciclo.setGeradoEm(LocalDate.now());

        return cicloRepository.save(ciclo);
    }
}