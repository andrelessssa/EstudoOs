package com.estudoos.api.service;

import com.estudoos.api.model.SessaoDraft;
import com.estudoos.api.model.Usuario;
import com.estudoos.api.repository.SessaoDraftRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class SessaoDraftService {

    private final SessaoDraftRepository draftRepository;

    public SessaoDraftService(SessaoDraftRepository draftRepository) {
        this.draftRepository = draftRepository;
    }

    public void saveOrUpdateDraft(Usuario usuario, LocalDate date, String anotacoes) {
        Optional<SessaoDraft> existing = draftRepository.findByUsuarioIdAndDataSessao(usuario.getId(), date);
        SessaoDraft draft;
        if (existing.isPresent()) {
            draft = existing.get();
            draft.setAnotacoes(anotacoes);
        } else {
            draft = new SessaoDraft();
            draft.setUsuario(usuario);
            draft.setDataSessao(date);
            draft.setAnotacoes(anotacoes);
        }
        draftRepository.save(draft);
    }

    public Optional<String> getDraftForUserAndDate(Usuario usuario, LocalDate date) {
        return draftRepository.findByUsuarioIdAndDataSessao(usuario.getId(), date).map(SessaoDraft::getAnotacoes);
    }

    public void deleteDraft(Usuario usuario, LocalDate date) {
        draftRepository.deleteByUsuarioIdAndDataSessao(usuario.getId(), date);
    }
}
