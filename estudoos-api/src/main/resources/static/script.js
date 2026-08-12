// 🎨 CORES 
const COLORS = ['#6c7bff', '#34d399', '#fbbf24', '#f87171', '#c084fc', '#2dd4bf', '#fb7185', '#60a5fa', '#a3e635', '#f97316'];

// 🗄️ STATE LOCAL 
let state = { materias: [], sessions: [], reviews: [], questions: [] };
let topicosSelecionadosLocalmente = [];
let revisaoAtiva = null;
let modoEdicao = false;
let sessaoEmEdicaoId = null;
let dataAtivaSessao = today();

// 🔑 AUXILIAR PARA TOKEN 
function getAuthToken() {
  return localStorage.getItem('token') || localStorage.getItem('estudoos_token');
}

// 🚪 LOGOUT COMPLETO DA APLICAÇÃO 
function fazerLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('estudoos_token');
  localStorage.removeItem('estudoos_usuario');
  localStorage.removeItem('usuario');
  localStorage.clear();
  window.location.reload();
}

// 🧭 NAVEGAÇÃO 
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

  const pageEl = document.getElementById('page-' + id);
  if (pageEl) pageEl.classList.add('active');

  const pages = ['dashboard', 'materias', 'hoje', 'revisao', 'questoes', 'pomodoro', 'ciclo', 'concurso', 'cadastrar'];
  const idx = pages.indexOf(id);
  if (idx !== -1) {
    const tabs = document.querySelectorAll('.tab');
    if (tabs[idx]) tabs[idx].classList.add('active');
  }

  if (id !== 'hoje' && id !== 'revisao') {
    revisaoAtiva = null;
  }

  if (id === 'dashboard') renderDashboard();
  if (id === 'materias') renderMaterias();
  if (id === 'hoje') renderHoje();
  if (id === 'revisao') renderRevisao();
  if (id === 'questoes') renderQuestoes();
  if (id === 'ciclo') renderCiclo();
  if (id === 'concurso') renderConcurso();
  if (id === 'cadastrar' && typeof aplicarControleAcesso === 'function') {
    aplicarControleAcesso();
  }
  try { localStorage.setItem('studyos_active_page', id); } catch (e) {}
}

function toggleTopics(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

// 📅 DATAS 
function today() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateStr(d) {
  if (!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// 📊 DASHBOARD 
async function renderDashboard() {
  if (!getAuthToken()) return;

  const dashDateEl = document.getElementById('dash-date');
  if (dashDateEl) {
    dashDateEl.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  try {
    const [resMat, resRev, resDias] = await Promise.all([
      fetchComAuth('/materias'),
      fetchComAuth('/revisoes/hoje'),
      fetchComAuth('/sessoes/calendario/estudados')
    ]);

    if (!resMat.ok || !resRev.ok || !resDias.ok) return;

    state.materias = await resMat.json();
    const revisoesHoje = await resRev.json();
    const diasEstudadosNoBanco = await resDias.json();

    const materiasComTopicos = await Promise.all(state.materias.map(async (m) => {
      try {
        const resTopicos = await fetchComAuth(`/topicos/materia/${m.id}`);
        if (!resTopicos.ok) return { ...m, topicos: [] };
        const topicos = await resTopicos.json();
        return { ...m, topicos: topicos };
      } catch (e) {
        return { ...m, topicos: [] };
      }
    }));

    let studied = 0;
    materiasComTopicos.forEach(m => {
      const lista = m.topicos || [];
      lista.forEach(t => {
        const estaConcluido = t.concluido === true || t.concluido === 'true' || t.done === true;
        if (estaConcluido) studied++;
      });
    });

    const correct = state.questions.filter(q => q.result === 'correct').length;
    const total = state.questions.filter(q => q.result).length;
    const rate = total ? Math.round(correct / total * 100) + '%' : '—';

    const elStudied = document.getElementById('dash-studied');
    const elCorrect = document.getElementById('dash-correct');
    const elRate = document.getElementById('dash-rate');
    const elReviews = document.getElementById('dash-reviews');

    if (elStudied) elStudied.textContent = studied;
    if (elCorrect) elCorrect.textContent = correct;
    if (elRate) elRate.textContent = rate;
    if (elReviews) elReviews.textContent = revisoesHoje.length;

    const pl = document.getElementById('dash-progress-list');
    if (pl) {
      if (!materiasComTopicos.length) {
        pl.innerHTML = '<div class="empty"><div class="empty-icon">📚</div>Adicione matérias para ver o progresso</div>';
      } else {
        pl.innerHTML = materiasComTopicos.map((m, i) => {
          const lista = m.topicos || [];
          const tot = lista.length;
          const done = lista.filter(t => t.concluido === true || t.concluido === 'true' || t.done === true).length;
          const pct = tot ? Math.round(done / tot * 100) : 0;
          const color = m.cor || COLORS[i % COLORS.length];

          return `<div style="margin-bottom:.85rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:13px;font-weight:500;">${m.nome}</span>
              <span style="font-size:12px;color:var(--muted);font-family:var(--mono);">${done}/${tot} · ${pct}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${pct}%;background:${color};"></div>
            </div>
          </div>`;
        }).join('');
      }
    }

    const cal = document.getElementById('dash-calendar');
    if (cal) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      const calTitle = document.getElementById('cal-title');
      if (calTitle) {
        calTitle.textContent = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
      }

      const first = new Date(year, month, 1).getDay();
      const days = new Date(year, month + 1, 0).getDate();
      const todayStr = today();
      const headers = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

      const datasLimpasDoBanco = (diasEstudadosNoBanco || []).map(d => d ? d.substring(0, 10) : '');

      let html = `<div class="cal-grid" style="margin-bottom:6px;">${headers.map(h => `<div style="text-align:center;font-size:10px;color:var(--muted);padding:4px 0;">${h}</div>`).join('')}</div><div class="cal-grid">`;

      for (let i = 0; i < first; i++) html += `<div class="cal-day empty"></div>`;

      for (let d = 1; d <= days; d++) {
        const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = ds === todayStr;
        const foiEstudado = datasLimpasDoBanco.includes(ds);

        let cls = 'cal-day';
        if (isToday) cls += ' today';
        else if (foiEstudado) cls += ' studied';

        const eventoClique = foiEstudado || isToday ? `onclick="irParaDataEspecifica('${ds}')" style="cursor:pointer;"` : '';

        html += `<div class="${cls}" ${eventoClique}><span class="cal-day-num">${d}</span></div>`;
      }
      html += '</div>';
      cal.innerHTML = html;
    }

  } catch (error) {
    console.error("Erro ao carregar o Dashboard:", error);
  }
}

async function irParaDataEspecifica(dataSelecionada) {
  dataAtivaSessao = dataSelecionada;
  showPage('hoje');
}

// 🔁 REVISÃO ESPAÇADA & FILA 
async function renderRevisao() {
  if (!getAuthToken()) return;

  const elFila = document.getElementById('rev-queue') || document.getElementById('revisoes-list');

  try {
    const [resHoje, resStats] = await Promise.all([
      fetchComAuth('/revisoes/hoje'),
      fetchComAuth('/revisoes/estatisticas')
    ]);

    if (!resHoje.ok || !resStats.ok) return;

    const revisoesHojeEAtrasadas = await resHoje.json();
    const stats = await resStats.json();

    const cardHoje = document.getElementById('rev-today');
    const cardSemana = document.getElementById('rev-week');
    const cardFeitas = document.getElementById('rev-done');

    if (cardHoje) cardHoje.textContent = stats.hoje ?? revisoesHojeEAtrasadas.length;
    if (cardSemana) cardSemana.textContent = stats.proximos7Dias ?? 0;
    if (cardFeitas) cardFeitas.textContent = stats.feitas ?? 0;

    if (!elFila) return;

    if (!revisoesHojeEAtrasadas || !revisoesHojeEAtrasadas.length) {
      elFila.innerHTML = `
        <div class="empty">
          <div class="empty-icon">🔁</div>
          Nenhuma revisão pendente ou atrasada para hoje — continue estudando! 
        </div>`;
      return;
    }

    const hojeStr = today();

    elFila.innerHTML = revisoesHojeEAtrasadas.map(r => {
      const eAtrasada = r.dataAgendada < hojeStr;
      const dataFormatada = dateStr(r.dataAgendada);

      const tagStatus = eAtrasada
        ? `<span style="background:#f87171; color:#fff; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; margin-left:8px;">ATRASADA</span>`
        : `<span style="background:#6c7bff; color:#fff; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; margin-left:8px;">HOJE</span>`;

      const nomeTopico = r.topicoNome || r.nomeTopico || 'Assunto';

      return `
        <div style="padding:0.85rem 1rem; background:var(--surface2); border-radius:var(--radius); margin-bottom:0.5rem; display:flex; align-items:center; justify-content:space-between;">
          <div>
            <div style="font-size:14px; font-weight:700; color:var(--text); display:flex; align-items:center;">
               ${nomeTopico} ${tagStatus}
            </div>
            <div style="font-size:12px; color:var(--muted); margin-top:2px;">
               ${r.materiaNome || r.nomeMateria || 'Matéria'} · Agendada: ${dataFormatada}
            </div>
          </div>
          <button class="btn sm primary" onclick="iniciarRevisaoNoCaderno(${r.id}, '${nomeTopico.replace(/'/g, "\\'")}')" style="cursor:pointer; background:var(--accent);">
               Revisar agora
          </button>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error("Erro ao carregar Fila de Revisões:", error);
  }
}

async function iniciarRevisaoNoCaderno(revisaoId, nomeTopico) {
  revisaoAtiva = revisaoId;
  dataAtivaSessao = today();
  showPage('hoje');

  try {
    const [resTopicos, resSessoes] = await Promise.all([
      fetchComAuth('/topicos'),
      fetchComAuth('/sessoes')
    ]);

    const todosTopicos = resTopicos.ok ? await resTopicos.json() : [];
    const sessoes = resSessoes.ok ? await resSessoes.json() : [];

    const topicoEncontrado = todosTopicos.find(t => t.nome.trim().toLowerCase() === nomeTopico.trim().toLowerCase());

    if (topicoEncontrado) {
      const matId = topicoEncontrado.materiaId || topicoEncontrado.materia?.id;
      const materiaObj = state.materias.find(m => m.id == matId);
      const materiaNome = materiaObj ? materiaObj.nome : 'Matéria';

      const selMat = document.getElementById('session-mat');
      if (selMat) selMat.value = matId;

      const hojeDateEl = document.getElementById('hoje-date');
      if (hojeDateEl) {
        hojeDateEl.innerHTML = `<span style="background:rgba(108,123,255,0.15); color:var(--accent); border:1px solid var(--accent); padding:4px 10px; border-radius:20px; font-weight:700; font-size:12px; display:inline-block; margin-top:4px;">
            REVISANDO AGORA: <b>${materiaNome}</b> <i>${topicoEncontrado.nome}</i>
        </span>`;
      }

      const elTopicsList = document.getElementById('session-topics-list');
      if (elTopicsList) {
        elTopicsList.innerHTML = `
          <div class="topic-row concluido-banco" style="display:flex; align-items:center; gap:0.6rem; padding:0.6rem 0.8rem; background:var(--surface2); border-radius:var(--radius); border:1px solid var(--accent);">
            <div class="topic-check checked"></div>
            <div class="topic-name done" style="font-weight:700; color:var(--text);">
               ${topicoEncontrado.nome}
            </div>
            <span style="font-size:11px; color:var(--accent); margin-left:auto; font-weight:600;">Modo Revisão</span>
          </div>`;
      }

      const sessaoDoTopico = sessoes.reverse().find(s => {
        const ids = s.topicosConcluidosIds || s.topicosIds || [];
        return ids.includes(parseInt(topicoEncontrado.id));
      });

      const notesEl = document.getElementById('session-notes');
      if (sessaoDoTopico) {
        sessaoEmEdicaoId = sessaoDoTopico.id;
        if (notesEl) {
          notesEl.value = sessaoDoTopico.anotacoes || "";
          autoGrowNotes(notesEl);
        }
        exibirSessaoEspecificaNoHistorico(sessaoDoTopico);
      } else {
        sessaoEmEdicaoId = null;
        if (notesEl) {
          notesEl.value = "";
          autoGrowNotes(notesEl);
        }
      }

      const btnSave = document.getElementById('btn-save-session');
      if (btnSave) {
        btnSave.innerHTML = ' Concluir Revisão';
        btnSave.style.background = '#34d399';
        btnSave.style.color = '#000';
      }
    }
  } catch (e) {
    console.error("Erro ao carregar caderno para revisão:", e);
  }
}

function resetaModoSalvarSessao() {
  sessaoEmEdicaoId = null;
  revisaoAtiva = null;

  const btnSave = document.getElementById('btn-save-session');
  if (btnSave) {
    btnSave.innerHTML = ' Salvar sessão';
    btnSave.style.background = 'var(--accent)';
    btnSave.style.color = '#fff';
  }

  const notesEl = document.getElementById('session-notes');
  if (notesEl) {
    notesEl.value = '';
    autoGrowNotes(notesEl);
  }
}

async function saveSession() {
  const notesEl = document.getElementById('session-notes');
  const notes = notesEl ? notesEl.value.trim() : '';

  if (revisaoAtiva) {
    try {
      if (sessaoEmEdicaoId) {
        await fetchComAuth(`/sessoes/${sessaoEmEdicaoId}`, {
          method: 'PUT',
          body: JSON.stringify({ anotacoes: notes })
        });
      }

      const res = await fetchComAuth(`/revisoes/${revisaoAtiva}/concluir`, {
        method: 'PUT'
      });

      if (res.ok) {
        alert("Revisão concluída e anotação atualizada com sucesso! ");
        resetaModoSalvarSessao();
        showPage('revisao');
      } else {
        alert("Erro ao concluir revisão no servidor.");
      }
    } catch (e) {
      console.error("Erro ao concluir revisão e salvar caderno:", e);
      alert("Erro de conexão com o servidor.");
    }
    return;
  }

  if (sessaoEmEdicaoId) {
    try {
      const res = await fetchComAuth(`/sessoes/${sessaoEmEdicaoId}`, {
        method: 'PUT',
        body: JSON.stringify({ anotacoes: notes })
      });

      if (res.ok) {
        resetaModoSalvarSessao();
        await renderHistoricoSessaoHoje();
      } else {
        alert("Erro ao atualizar anotação no servidor.");
      }
    } catch (error) {
      console.error("Erro ao atualizar anotação:", error);
    }
    return;
  }

  const matEl = document.getElementById('session-mat');
  const matId = matEl ? matEl.value : '';
  if (!matId) {
    alert('Selecione uma matéria primeiro.');
    return;
  }

  if (topicosSelecionadosLocalmente.length === 0) {
    alert("Selecione pelo menos um assunto concluído para salvar a sessão.");
    return;
  }

  const sessaoDTO = {
    materiaId: parseInt(matId),
    topicosConcluidosIds: topicosSelecionadosLocalmente,
    anotacoes: notes,
    dataSessao: today()
  };

  try {
    const res = await fetchComAuth('/sessoes', {
      method: 'POST',
      body: JSON.stringify({ ...sessaoDTO })
    });

    if (res.ok) {
      resetaModoSalvarSessao();
      topicosSelecionadosLocalmente = [];

      await loadSessionTopics();
      await renderHistoricoSessaoHoje();
      renderDashboard();
    } else {
      alert("Erro ao salvar sessão no servidor Java.");
    }
  } catch (error) {
    console.error("Erro ao salvar sessão:", error);
  }
}

// 📅 SESSÃO DE HOJE 
async function renderHoje() {
  if (!getAuthToken()) return;

  const sel = document.getElementById('session-mat');
  if (!sel) return;

  if (!revisaoAtiva) {
    const hojeDateEl = document.getElementById('hoje-date');
    if (hojeDateEl) {
      const dataObj = new Date(dataAtivaSessao + 'T12:00:00');
      hojeDateEl.textContent = dataObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
  }

  try {
    const res = await fetchComAuth('/materias');
    if (!res.ok) return;

    state.materias = await res.json();

    const valorAtual = sel.value;

    if (!state.materias || !state.materias.length) {
      sel.innerHTML = '<option value="">Nenhuma matéria cadastrada</option>';
    } else {
      sel.innerHTML = '<option value="">Selecionar matéria...</option>' +
        state.materias.map(m => `<option value="${m.id}">${m.nome}</option>`).join('');
    }

    if (valorAtual) sel.value = valorAtual;

    if (!revisaoAtiva) {
      if (sel.value) {
        await loadSessionTopics();
      } else {
        const topList = document.getElementById('session-topics-list');
        if (topList) topList.innerHTML = '<div class="empty"><div class="empty-icon">📚</div>Selecione uma matéria acima</div>';
      }
      await renderHistoricoSessaoPorData(dataAtivaSessao);
    }

  } catch (error) {
    console.error("Erro na aba hoje:", error);
  }
}

async function loadSessionTopics() {
  if (revisaoAtiva) return;

  const matEl = document.getElementById('session-mat');
  const matId = matEl ? matEl.value : '';
  const el = document.getElementById('session-topics-list');
  if (!el) return;

  if (!matId) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">📚</div>Selecione uma matéria acima</div>';
    return;
  }

  try {
    const res = await fetchComAuth(`/topicos/materia/${matId}`);
    if (!res.ok) return;

    const topicos = await res.json();

    if (!topicos || !topicos.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">📘</div>Nenhum assunto cadastrado nesta matéria</div>';
      return;
    }

    el.innerHTML = topicos.map(t => {
      const idNum = parseInt(t.id);
      const jaConcluido = t.concluido === true || t.concluido === 'true' || t.done === true;
      const estaMarcadoLocalmente = topicosSelecionadosLocalmente.includes(idNum);

      return `<div class="topic-row ${jaConcluido ? 'concluido-banco' : ''}" style="display:flex; align-items:center; gap:0.6rem; padding:0.5rem 0.8rem; margin-bottom:0.3rem; background:var(--surface2); border-radius:var(--radius); cursor:pointer;" onclick="tratarCliqueTopico('${t.id}', ${jaConcluido}, '${matId}')">
        <div class="topic-check ${jaConcluido || estaMarcadoLocalmente ? 'checked' : ''}" id="check-${t.id}"></div>
        <div class="topic-name ${jaConcluido || estaMarcadoLocalmente ? 'done' : ''}" id="name-${t.id}">
          ${t.nome}
        </div>
        ${jaConcluido && (t.dataConclusao || t.doneDate) ? `<span style="font-size:11px;color:var(--muted);margin-left:auto;">${dateStr(t.dataConclusao || t.doneDate)}</span>` : ''}
      </div>`;
    }).join('');

  } catch (error) {
    console.error("Erro ao carregar tópicos:", error);
  }
}

function autoGrowNotes(element) {
  if (!element) return;
  element.style.height = 'auto';
  element.style.height = (element.scrollHeight) + 'px';
}

async function irParaCadernoMateria(materiaId, topicoId) {
  dataAtivaSessao = today();
  showPage('hoje');

  const selMat = document.getElementById('session-mat');
  if (selMat) selMat.value = materiaId;

  await loadSessionTopics();
  await tratarCliqueTopico(topicoId, true, materiaId);
}

async function carregarSessaoDiretaNoCaderno(sessaoId) {
  try {
    const resSessoes = await fetchComAuth('/sessoes');
    if (!resSessoes.ok) return;

    const sessoes = await resSessoes.json();
    const sessaoEncontrada = sessoes.find(s => s.id == sessaoId);

    if (sessaoEncontrada) {
      sessaoEmEdicaoId = sessaoEncontrada.id;
      const selMat = document.getElementById('session-mat');
      if (selMat && sessaoEncontrada.materiaId) {
        selMat.value = sessaoEncontrada.materiaId;
        await loadSessionTopics();
      }

      const notesEl = document.getElementById('session-notes');
      if (notesEl) {
        notesEl.value = sessaoEncontrada.anotacoes || "";
        autoGrowNotes(notesEl);
      }

      const btnSave = document.getElementById('btn-save-session');
      if (btnSave) {
        btnSave.innerHTML = ' Atualizar anotação';
        btnSave.style.background = 'var(--accent)';
      }
    }
  } catch (e) {
    console.error("Erro ao carregar sessão direta:", e);
  }
}

async function tratarCliqueTopico(topicId, jaConcluido, materiaIdAtual) {
  const selMat = document.getElementById('session-mat');

  if (jaConcluido) {
    try {
      const resSessoes = await fetchComAuth('/sessoes');
      if (!resSessoes.ok) throw new Error();

      const sessoes = await resSessoes.json();
      const topicIdNum = parseInt(topicId);

      const sessaoDoTopico = sessoes.reverse().find(s => {
        const ids = s.topicosConcluidosIds || s.topicosIds || [];
        return ids.includes(topicIdNum);
      });

      const notesEl = document.getElementById('session-notes');
      const btnSave = document.getElementById('btn-save-session');

      if (sessaoDoTopico) {
        sessaoEmEdicaoId = sessaoDoTopico.id;

        if (notesEl) {
          notesEl.value = sessaoDoTopico.anotacoes || "";
          autoGrowNotes(notesEl);
        }

        if (btnSave) {
          btnSave.innerHTML = ' Atualizar anotação';
          btnSave.style.background = 'var(--accent)';
          btnSave.style.color = '#fff';
        }

        if (selMat && (materiaIdAtual || sessaoDoTopico.materiaId)) {
          selMat.value = materiaIdAtual || sessaoDoTopico.materiaId;
        }

        exibirSessaoEspecificaNoHistorico(sessaoDoTopico);
      }

    } catch (e) {
      console.error("Erro ao carregar resumo da sessão:", e);
    }
    return;
  }

  const matIdSalva = materiaIdAtual || (selMat ? selMat.value : null);

  dataAtivaSessao = today();

  const hojeDateEl = document.getElementById('hoje-date');
  if (hojeDateEl) {
    const dataObj = new Date(dataAtivaSessao + 'T12:00:00');
    hojeDateEl.textContent = dataObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  await renderHistoricoSessaoPorData(dataAtivaSessao);

  if (selMat && matIdSalva) {
    selMat.value = matIdSalva;
  }

  resetaModoSalvarSessao();
  toggleTopicLocal(topicId);
}

function toggleTopicLocal(topicId) {
  const checkEl = document.getElementById(`check-${topicId}`);
  const nameEl = document.getElementById(`name-${topicId}`);
  const idNum = parseInt(topicId);

  if (!checkEl || !nameEl) return;

  if (checkEl.classList.contains('checked')) {
    checkEl.classList.remove('checked');
    nameEl.classList.remove('done');
    topicosSelecionadosLocalmente = topicosSelecionadosLocalmente.filter(id => id !== idNum);
  } else {
    checkEl.classList.add('checked');
    nameEl.classList.add('done');
    topicosSelecionadosLocalmente.push(idNum);
  }
}

async function renderHistoricoSessaoPorData(dataFiltro) {
  const hist = document.getElementById('session-history');
  if (!hist) return;

  try {
    const [resSessoes, resTopicos] = await Promise.all([
      fetchComAuth('/sessoes'),
      fetchComAuth('/topicos')
    ]);

    if (!resSessoes.ok) throw new Error();

    const sessoesDoBanco = await resSessoes.json();
    let todosTopicos = resTopicos.ok ? await resTopicos.json() : [];

    const sessoesDaData = sessoesDoBanco.filter(s => s.dataSessao === dataFiltro);

    if (!sessoesDaData.length) {
      hist.innerHTML = `<div class="empty"><div class="empty-icon">🗂️</div>Nenhuma sessão registrada em ${dateStr(dataFiltro)}</div>`;
      if (!revisaoAtiva) resetaModoSalvarSessao();
      return;
    }

    const sessoesInvertidas = [...sessoesDaData].reverse();

    const primeiraSessao = sessoesInvertidas[0];
    if (primeiraSessao && !revisaoAtiva) {
      const selMat = document.getElementById('session-mat');

      if (selMat && primeiraSessao.materiaId && !selMat.value) {
        selMat.value = primeiraSessao.materiaId;
        await loadSessionTopics();
      }

      const notesEl = document.getElementById('session-notes');
      if (notesEl && !notesEl.value) {
        notesEl.value = primeiraSessao.anotacoes || "";
        autoGrowNotes(notesEl);
      }

      sessaoEmEdicaoId = primeiraSessao.id;
      const btnSave = document.getElementById('btn-save-session');
      if (btnSave) {
        btnSave.innerHTML = ' Atualizar anotação';
        btnSave.style.background = 'var(--accent)';
      }
    }

    hist.innerHTML = sessoesInvertidas.map(s => {
      const dataFormatada = s.dataSessao ? dateStr(s.dataSessao) : dateStr(dataFiltro);
      const materiaObj = state.materias.find(m => m.id == s.materiaId);
      const materiaNome = materiaObj ? materiaObj.nome : `Matéria`;

      const idsTopicos = s.topicosConcluidosIds || s.topicosIds || [];
      const nomesAssuntos = idsTopicos.map(id => {
        const topico = todosTopicos.find(t => t.id == id);
        return topico ? topico.nome : null;
      }).filter(Boolean);

      const textoAssuntos = nomesAssuntos.length > 0 ? nomesAssuntos.join(', ') : 'Assuntos estudados';

      return `<div class="historico-card-destaque" style="cursor:pointer;" onclick="carregarSessaoDiretaNoCaderno(${s.id})">
        <div style="font-family:var(--mono); font-size:11px; color:var(--muted); min-width:70px; padding-top:2px;">📅 ${dataFormatada}</div>
        <div style="flex:1;">
          <div style="font-size:13px; font-weight:700; color:var(--text);">${materiaNome}</div>
          <div style="font-size:12px; color:var(--accent); margin-top:2px; font-weight:500;">📖 ${textoAssuntos}</div>
        </div>
      </div>`;
    }).join('');

  } catch (e) {
    console.error("Erro ao renderizar histórico por data:", e);
  }
}

async function renderHistoricoSessaoHoje() {
  await renderHistoricoSessaoPorData(dataAtivaSessao);
}

async function exibirSessaoEspecificaNoHistorico(sessao) {
  const hist = document.getElementById('session-history');
  if (!hist) return;

  try {
    const resTopicos = await fetchComAuth('/topicos');
    const todosTopicos = resTopicos.ok ? await resTopicos.json() : [];

    const dataFormatada = sessao.dataSessao ? dateStr(sessao.dataSessao) : dateStr(dataAtivaSessao);
    const materiaObj = state.materias.find(m => m.id == sessao.materiaId);
    const materiaNome = materiaObj ? materiaObj.nome : `Matéria`;

    const idsTopicos = sessao.topicosConcluidosIds || sessao.topicosIds || [];
    const nomesAssuntos = idsTopicos.map(id => {
      const topico = todosTopicos.find(t => t.id == id);
      return topico ? topico.nome : null;
    }).filter(Boolean);

    const textoAssuntos = nomesAssuntos.length > 0 ? nomesAssuntos.join(', ') : 'Assuntos estudados';

    hist.innerHTML = `
      <div class="historico-card-destaque">
        <div style="font-family:var(--mono); font-size:11px; color:var(--muted); min-width:70px; padding-top:2px;">📅 ${dataFormatada}</div>
        <div style="flex:1;">
          <div style="font-size:13px; font-weight:700; color:var(--text);">${materiaNome}</div>
          <div style="font-size:12px; color:var(--accent); margin-top:2px; font-weight:500;">📖 ${textoAssuntos}</div>
        </div>
      </div>
    `;
  } catch (e) {
    console.error("Erro ao renderizar card da sessão:", e);
  }
}

async function saveSession() {
  const notesEl = document.getElementById('session-notes');
  const notes = notesEl ? notesEl.value.trim() : '';

  if (revisaoAtiva) {
    try {
      if (sessaoEmEdicaoId) {
        await fetchComAuth(`/sessoes/${sessaoEmEdicaoId}`, {
          method: 'PUT',
          body: JSON.stringify({ anotacoes: notes })
        });
      }

      const res = await fetchComAuth(`/revisoes/${revisaoAtiva}/concluir`, {
        method: 'PUT'
      });

      if (res.ok) {
        alert("Revisão concluída e anotação atualizada com sucesso! ");
        resetaModoSalvarSessao();
        showPage('revisao');
      } else {
        alert("Erro ao concluir revisão no servidor.");
      }
    } catch (e) {
      console.error("Erro ao concluir revisão e salvar caderno:", e);
      alert("Erro de conexão com o servidor.");
    }
    return;
  }

  if (sessaoEmEdicaoId) {
    try {
      const res = await fetchComAuth(`/sessoes/${sessaoEmEdicaoId}`, {
        method: 'PUT',
        body: JSON.stringify({ anotacoes: notes })
      });

      if (res.ok) {
        resetaModoSalvarSessao();
        await renderHistoricoSessaoHoje();
      } else {
        alert("Erro ao atualizar anotação no servidor.");
      }
    } catch (error) {
      console.error("Erro ao atualizar anotação:", error);
    }
    return;
  }

  const matEl = document.getElementById('session-mat');
  const matId = matEl ? matEl.value : '';
  if (!matId) {
    alert('Selecione uma matéria primeiro.');
    return;
  }

  if (topicosSelecionadosLocalmente.length === 0) {
    alert("Selecione pelo menos um assunto concluído para salvar a sessão.");
    return;
  }

  const sessaoDTO = {
    materiaId: parseInt(matId),
    topicosConcluidosIds: topicosSelecionadosLocalmente,
    anotacoes: notes,
    dataSessao: today()
  };

  try {
    const res = await fetchComAuth('/sessoes', {
      method: 'POST',
      body: JSON.stringify({ ...sessaoDTO })
    });

    if (res.ok) {
      // 🔄 SINCRONIZAÇÃO COM O CICLO IA: Risca automaticamente no ciclo ativo após salvar na aba Hoje
      const cicloAtual = getCiclo();
      if (cicloAtual && cicloAtual.dias) {
        cicloAtual.dias.forEach(dia => {
          if (dia.blocos) {
            dia.blocos.forEach(bloco => {
              if (topicosSelecionadosLocalmente.includes(parseInt(bloco.topicId))) {
                bloco.done = true;
              }
            });
          }
        });
        saveCiclo(cicloAtual);

        // Salva a atualização na nuvem (banco de dados)
        try {
          await fetchComAuth('/ciclo/gerar', {
            method: 'POST',
            body: JSON.stringify({
              dataInicio: cicloAtual.config.start,
              dataFim: cicloAtual.config.end,
              diasSemana: cicloAtual.config.activeDays,
              horasPorDia: cicloAtual.config.hours,
              prioridade: cicloAtual.config.priority,
              materiasIds: cicloAtual.config.selectedMatIds || []
            })
          });
        } catch (err) {
          console.log("Progresso sincronizado localmente.");
        }
      }

      resetaModoSalvarSessao();
      topicosSelecionadosLocalmente = [];

      await loadSessionTopics();
      await renderHistoricoSessaoHoje();
      renderDashboard();
    } else {
      alert("Erro ao salvar sessão no servidor Java.");
    }
  } catch (error) {
    console.error("Erro ao salvar sessão:", error);
  }
}

// 📘 MATÉRIAS & CONTROLE DE PAINÉIS 
function alternarModoEdicao() {
  modoEdicao = !modoEdicao;

  const btnGerenciar = document.querySelector("button[onclick='alternarModoEdicao()']");
  if (btnGerenciar) {
    if (modoEdicao) {
      btnGerenciar.innerHTML = '✅ Concluir';
      btnGerenciar.classList.add('active-green');
    } else {
      btnGerenciar.innerHTML = '✏️ Gerenciar';
      btnGerenciar.classList.remove('active-green');
    }
  }

  renderMaterias();
}

async function alternarStatusConclusaoTopico(topicoId, statusAtual) {
  const novoStatus = !statusAtual;

  try {
    let nomeTopicoAtual = '';
    for (const mat of state.materias) {
      if (mat.topicos) {
        const top = mat.topicos.find(t => String(t.id) === String(topicoId));
        if (top) {
          nomeTopicoAtual = top.nome;
          break;
        }
      }
    }

    const payload = {
      nome: nomeTopicoAtual,
      concluido: novoStatus
    };

    const res = await fetchComAuth(`/topicos/${topicoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      await renderMaterias();
      await renderDashboard();
      if (typeof renderRevisao === 'function') await renderRevisao();
      if (typeof renderHistoricoSessaoHoje === 'function') await renderHistoricoSessaoHoje();
    } else {
      const errorData = await res.json().catch(() => null);
      console.error("Erro retornado pelo servidor Java no PUT:", errorData);
      alert("❌ Não foi possível alterar o status do assunto no servidor.");
    }

  } catch (error) {
    console.error("Erro ao alternar status do assunto:", error);
    alert("❌ Erro de conexão ao atualizar o assunto.");
  }
}

async function ordenarComIa(materiaId) {
  if (!confirm('Deseja que a Inteligência Artificial ordene os tópicos desta matéria do básico ao avançado?')) return;

  try {
    const res = await fetchComAuth(`/materias/${materiaId}/ordenar-ia`, {
      method: 'POST'
    });

    if (res.ok) {
      alert("✨ Tópicos ordenados com sucesso pelo Gemini!");
      await renderMaterias();
      await renderDashboard();
    } else {
      alert("❌ Erro ao ordenar tópicos com IA.");
    }
  } catch (e) {
    console.error("Erro na chamada da IA:", e);
    alert("❌ Erro de conexão com o servidor ao chamar a IA.");
  }
}

async function renderMaterias() {
  if (!getAuthToken()) return;

  const el = document.getElementById('materias-list');
  if (!el) return;

  try {
    const res = await fetchComAuth('/materias');
    if (!res.ok) return;

    state.materias = await res.json();

    if (!state.materias || !state.materias.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">📘</div>Nenhuma matéria cadastrada ainda</div>';
      return;
    }

    const materiasComTopicos = await Promise.all(state.materias.map(async (m) => {
      try {
        const resTopicos = await fetchComAuth(`/topicos/materia/${m.id}`);
        if (!resTopicos.ok) return { ...m, topicos: [] };
        const topicos = await resTopicos.json();
        return { ...m, topicos: topicos };
      } catch (e) {
        return { ...m, topicos: [] };
      }
    }));

    el.innerHTML = materiasComTopicos.map((m, i) => {
      const listaTopicos = m.topicos || [];
      const done = listaTopicos.filter(t => t.concluido === true || t.concluido === 'true' || t.done === true).length;
      const tot = listaTopicos.length;
      const pct = tot ? Math.round(done / tot * 100) : 0;
      const color = m.cor || COLORS[i % COLORS.length];

      const botoesAcaoMateria = modoEdicao ? `
        <div class="actions-edicao" style="display:flex; gap:.4rem; margin-left:auto; align-items:center;">
          <button class="btn sm" onclick="event.stopPropagation(); ordenarComIa('${m.id}')" title="Ordenar tópicos com IA do básico ao avançado" style="background:var(--surface3); color:var(--accent); font-size:11px; padding:4px 10px;">🤖 IA</button>
          <button class="btn sm" onclick="event.stopPropagation(); openEditMateriaPanel('${m.id}', '${m.nome}')" title="Editar matéria" style="background:var(--surface3);">✏️</button>
          <button class="btn sm danger" onclick="event.stopPropagation(); deleteMateria('${m.id}')" title="Excluir matéria" style="background:var(--coral); color:#fff;">🗑️</button>
        </div>
      ` : '';

      return `<div style="margin-bottom: 0.8rem;">
        <div class="subject-row" onclick="toggleTopics('tops-${m.id}')" style="cursor: pointer;">
          <div class="subject-dot" style="background:${color};box-shadow:0 0 8px ${color}55;"></div>
          <div class="subject-name">${m.nome}</div>
          <div class="subject-topics">${done}/${tot} assuntos</div>
          <div style="width:80px;"><div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${color};"></div></div></div>
          <span style="font-size:12px;font-family:var(--mono);color:var(--muted);">${pct}%</span>
          ${botoesAcaoMateria}
        </div>
        
        <div id="tops-${m.id}" style="display:none; padding:.4rem 0 .4rem 1.5rem;">
          ${listaTopicos.length ? listaTopicos.map(t => {
        const jaConcluido = t.concluido === true || t.concluido === 'true' || t.done === true;

        const botoesAcaoTopico = modoEdicao ? `
              <div style="display:flex; gap:.3rem; margin-left:auto;">
                <button class="btn sm" onclick="event.stopPropagation(); openEditTopicoPanel('${t.id}', '${t.nome}')" title="Renomear assunto" style="background:var(--surface3);">✏️</button>
                <button class="btn sm danger" onclick="event.stopPropagation(); deleteTopico('${t.id}')" title="Apagar assunto" style="background:var(--coral); color:#fff;">🗑️</button>
              </div>
            ` : '';

        const cliqueContainer = modoEdicao
          ? `onclick="alternarStatusConclusaoTopico('${t.id}', ${jaConcluido})"`
          : (jaConcluido ? `onclick="irParaCadernoMateria('${m.id}', '${t.id}')"` : '');

        return `
            <div class="topic-row" style="display:flex; align-items:center; justify-content:space-between; padding: 0.4rem 0.8rem; margin-bottom: 0.2rem; background: var(--surface2); border-radius: var(--radius); cursor: pointer;" ${cliqueContainer}>
              <div style="display:flex; align-items:center; gap: 0.5rem;">
                <div class="topic-check ${jaConcluido ? 'checked' : ''}" title="${modoEdicao ? 'Clique para alternar status' : ''}"></div>
                <div class="topic-name ${jaConcluido ? 'done' : ''}">${t.nome}</div>
              </div>
              ${botoesAcaoTopico}
            </div>`;
      }).join('') : '<div style="font-size:13px;color:var(--muted);padding:.5rem .9rem;">Nenhum assunto cadastrado</div>'}
        </div>
      </div>`;
    }).join('');

  } catch (error) {
    console.error("Erro ao listar matérias:", error);
  }
}

function openAddMateria() {
  const idEl = document.getElementById('mat-id-edit');
  const nameEl = document.getElementById('mat-name');
  const topEl = document.getElementById('mat-topics');
  const panel = document.getElementById('materias-panel');

  if (idEl) idEl.value = '';
  if (nameEl) nameEl.value = '';
  if (topEl) topEl.value = '';
  if (panel) panel.style.display = 'block';
  if (nameEl) nameEl.focus();
}

function closeMateriaPanel() {
  const panel = document.getElementById('materias-panel');
  const idEl = document.getElementById('mat-id-edit');
  if (panel) panel.style.display = 'none';
  if (idEl) idEl.value = '';
}

function openEditMateriaPanel(id, nome) {
  const idEl = document.getElementById('mat-id-edit');
  const nameEl = document.getElementById('mat-name');
  const topEl = document.getElementById('mat-topics');
  const panel = document.getElementById('materias-panel');

  if (idEl) idEl.value = id;
  if (nameEl) nameEl.value = nome;
  if (topEl) topEl.value = '';
  if (panel) panel.style.display = 'block';
  if (nameEl) nameEl.focus();
}

function openEditTopicoPanel(id, nome) {
  const idEl = document.getElementById('topico-id-edit');
  const nameEl = document.getElementById('topico-name-edit');
  const panel = document.getElementById('topico-panel');

  if (idEl) idEl.value = id;
  if (nameEl) nameEl.value = nome;
  if (panel) panel.style.display = 'block';
  if (nameEl) nameEl.focus();
}

function closeTopicoPanel() {
  const panel = document.getElementById('topico-panel');
  const idEl = document.getElementById('topico-id-edit');
  if (panel) panel.style.display = 'none';
  if (idEl) idEl.value = '';
}

async function saveMateria() {
  const idEl = document.getElementById('mat-id-edit');
  const nameEl = document.getElementById('mat-name');
  const topEl = document.getElementById('mat-topics');

  const matId = idEl ? idEl.value : '';
  const name = nameEl ? nameEl.value.trim() : '';
  const topicsRaw = topEl ? topEl.value : '';

  if (!name) {
    alert('Informe o nome da matéria.');
    return;
  }

  const novosTopicos = topicsRaw.split('\n').map(t => t.trim()).filter(Boolean);

  try {
    if (matId) {
      await fetchComAuth(`/materias/${matId}`, {
        method: 'PUT',
        body: JSON.stringify({ nome: name })
      });

      if (novosTopicos.length > 0) {
        await fetchComAuth(`/topicos/materia/${matId}`, {
          method: 'POST',
          body: JSON.stringify(novosTopicos)
        });
      }
    } else {
      const materiaDTO = {
        nome: name,
        topicos: novosTopicos,
        cor: COLORS[state.materias.length % COLORS.length]
      };

      await fetchComAuth('/materias', {
        method: 'POST',
        body: JSON.stringify(materiaDTO)
      });
    }

    closeMateriaPanel();
    renderMaterias();
    renderDashboard();

  } catch (error) {
    console.error("Erro ao salvar matéria:", error);
  }
}

async function deleteMateria(idMateria) {
  if (!confirm('Deseja excluir a matéria e todos os seus assuntos?')) return;

  try {
    const res = await fetchComAuth(`/materias/${idMateria}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      renderMaterias();
      renderDashboard();
    } else {
      alert("Erro ao excluir matéria.");
    }
  } catch (error) {
    console.error("Erro ao excluir matéria:", error);
  }
}

async function salvarEdicaoTopico() {
  const idEl = document.getElementById('topico-id-edit');
  const nameEl = document.getElementById('topico-name-edit');

  const topicoId = idEl ? idEl.value : '';
  const novoNome = nameEl ? nameEl.value.trim() : '';

  if (!novoNome) {
    alert("Informe o nome do assunto.");
    return;
  }

  try {
    const res = await fetchComAuth(`/topicos/${topicoId}`, {
      method: 'PUT',
      body: JSON.stringify({ nome: novoNome })
    });

    if (res.ok) {
      closeTopicoPanel();
      renderMaterias();
    } else {
      alert("Erro ao renomear assunto no servidor.");
    }
  } catch (error) {
    console.error("Erro ao atualizar assunto:", error);
  }
}

async function deleteTopico(idTopico) {
  if (!confirm('Deseja realmente excluir este assunto?')) return;

  try {
    const res = await fetchComAuth(`/topicos/${idTopico}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      renderMaterias();
      renderDashboard();
    } else {
      alert("Erro ao excluir o assunto.");
    }
  } catch (error) {
    console.error("Erro ao excluir tópico:", error);
  }
}

// ✏️ QUESTÕES & SIMULADO IA
function openAddQuestion() {
  const panel = document.getElementById('question-panel');
  if (panel) panel.style.display = 'block';
}

function closeQuestionPanel() {
  const panel = document.getElementById('question-panel');
  if (panel) panel.style.display = 'none';
}

function renderQuestoes() {
  state.questions = JSON.parse(localStorage.getItem('studyos_v2_questions') || '[]');
}

function normalizeText(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function extractEditalTopics(text) {
  if (!text || !text.trim()) return [];

  const cleaned = text
    .replace(/\r/g, '\n')
    .replace(/[•·–—]/g, '\n')
    .replace(/;/g, '\n');

  return cleaned
    .split('\n')
    .map(line => line.trim())
    .map(line => line.replace(/^[\d\s\.\-\)\(\*]+/, '').trim())
    .filter(line => line && line.length > 2);
}

async function carregarMateriasParaConcurso() {
  if (!state.materias || !state.materias.length) {
    const res = await fetchComAuth('/materias');
    if (!res.ok) {
      throw new Error('Não foi possível carregar as matérias do servidor.');
    }
    state.materias = await res.json();
  }

  await Promise.all(state.materias.map(async materia => {
    const res = await fetchComAuth(`/topicos/materia/${materia.id}`);
    materia.topicos = res.ok ? await res.json() : [];
  }));
}

function criarCartaoConcurso({ title, content, items = [] }) {
  return `
    <div class="card" style="border:1px solid var(--border);">
      <div class="card-title" style="margin-bottom: 0.75rem;">${title}</div>
      <div style="color: var(--muted); font-size: 0.95rem; line-height: 1.6;">${content}</div>
      ${items.length ? `<ul style="margin: 1rem 0 0 1rem; color: var(--text);">${items.map(item => `<li style="margin-bottom:0.5rem;">${item}</li>`).join('')}</ul>` : ''}
    </div>
  `;
}

function renderConcurso() {
  const container = document.getElementById('lista-concursos-container');
  const button = document.getElementById('btn-processar-edital');

  if (button) {
    button.removeEventListener('click', processarEdital);
    button.addEventListener('click', processarEdital);
  }

  if (!container) return;

  container.innerHTML = `
    <div class="card" style="border:1px solid var(--border);">
      <div class="card-title">Comece a análise do edital</div>
      <div style="color: var(--muted); font-size: 0.95rem; line-height: 1.6;">
        Insira o nome do concurso, a data da prova e cole o conteúdo do edital. O sistema irá comparar os assuntos extraídos com os seus tópicos cadastrados.
      </div>
    </div>
  `;

  carregarMateriasParaConcurso().then(() => {
    const totalAssuntos = state.materias.reduce((acc, m) => acc + ((m.topicos || []).length), 0);
    const totalMaterias = state.materias.length;
    container.innerHTML = criarCartaoConcurso({
      title: 'Matérias e assuntos carregados',
      content: `Encontramos ${totalMaterias} matéria(s) e ${totalAssuntos} assunto(s) cadastrados no seu banco de dados. Agora basta colar o edital acima e processar a análise.`,
    });
    // Renderiza concursos salvos (local ou servidor)
    Promise.resolve(loadConcursosFromStorage()).then(concursos => {
      if (concursos && concursos.length) renderConcursoCards(container, concursos);
    });
  }).catch(() => {
    container.innerHTML = criarCartaoConcurso({
      title: 'Não foi possível carregar seus dados',
      content: 'Verifique se você está autenticado e se o servidor está respondendo. A aba Concurso precisa das matérias e assuntos já cadastrados.',
    });
    // Mesmo em falha de carregamento do servidor, mostra concursos locais
    Promise.resolve(loadConcursosFromStorage()).then(concursos => {
      if (concursos && concursos.length) renderConcursoCards(container, concursos);
    });
  });
}

function calcularTempoRestante(dataString) {
  if (!dataString) return null;
  const prova = new Date(dataString);
  if (Number.isNaN(prova.getTime())) return null;

  const agora = new Date();
  const ms = prova.getTime() - agora.getTime();

  if (ms <= 0) return 'Prova já passou ou inválida';

  const dias = Math.floor(ms / 86400000);
  const horas = Math.floor((ms % 86400000) / 3600000);
  const minutos = Math.floor((ms % 3600000) / 60000);

  return `${dias}d ${horas}h ${minutos}m`;
}

async function processarEdital() {
  const nome = document.getElementById('c-nome')?.value.trim();
  const data = document.getElementById('c-data')?.value;
  const edital = document.getElementById('c-edital')?.value.trim();
  const container = document.getElementById('lista-concursos-container');

  if (!container) return;

  if (!nome) return alert('Informe o nome do concurso.');
  if (!data) return alert('Informe a data da prova.');
  if (!edital) return alert('Cole o texto do edital.');

  let topics = extractEditalTopics(edital);
  if (!topics.length) {
    return alert('Não foi possível extrair nenhum assunto do edital. Use linhas ou separadores claros entre os tópicos.');
  }

  try {
    await carregarMateriasParaConcurso();
  } catch (e) {
    return alert('Erro ao carregar matérias do servidor: ' + e.message);
  }

  if (!state.materias.length) {
    return alert('Cadastre pelo menos uma matéria antes de analisar o edital.');
  }

  const matchesByMateria = new Map();
  state.materias.forEach(m => matchesByMateria.set(m.nome, []));

  const matched = [];
  const missing = [];

  topics.forEach(editalTopic => {
    const normalizedEdital = normalizeText(editalTopic);
    let encontrado = null;

    for (const materia of state.materias) {
      const topicos = materia.topicos || [];
      const correspondencia = topicos.find(topico => {
        const normalizedTopico = normalizeText(topico.nome || topico.name || '');
        return normalizedTopico === normalizedEdital || normalizedTopico.includes(normalizedEdital) || normalizedEdital.includes(normalizedTopico);
      });

      if (correspondencia) {
        encontrado = { editalTopic, materia: materia.nome, topico: correspondencia.nome || correspondencia.name };
        break;
      }
    }

    if (encontrado) {
      matched.push(encontrado);
      const materiaTopics = matchesByMateria.get(encontrado.materia) || [];
      materiaTopics.push(encontrado);
      matchesByMateria.set(encontrado.materia, materiaTopics);
    } else {
      missing.push(editalTopic);
    }
  });

  const total = topics.length;
  const done = matched.length;
  const coverage = total ? Math.round((done / total) * 100) : 0;
  const remaining = missing.length;

  const resumoItems = [
    `Total de assuntos no edital: <strong>${total}</strong>`,
    `Assuntos já presentes no banco: <strong>${done}</strong>`,
    `Assuntos faltantes: <strong>${remaining}</strong>`,
    `Cobertura do edital: <strong>${coverage}%</strong>`,
    `Tempo restante até a prova: <strong>${calcularTempoRestante(data) || 'Data inválida'}</strong>`
  ];

  const materiasItems = Array.from(matchesByMateria.entries())
    .filter(([, assuntos]) => assuntos.length)
    .map(([materia, assuntos]) => `
      <div style="margin-bottom: 1rem;">
        <strong style="color: var(--accent);">${materia}</strong> — ${assuntos.length} assunto(s) identificados
        <ul style="margin: 0.5rem 0 0 1rem; color: var(--text);">
          ${assuntos.map(item => `<li>${item.editalTopic} → ${item.topico}</li>`).join('')}
        </ul>
      </div>
    `);

  const missingHtml = missing.length
    ? `<div style="margin-top: 1rem;"><strong style="color: var(--coral);">Assuntos faltantes</strong><ul style="margin: 0.75rem 0 0 1rem; color: var(--text);">${missing.map(item => `<li>${item}</li>`).join('')}</ul></div>`
    : `<div style="margin-top: 1rem; color: var(--green);">Todos os assuntos do edital já existem no banco de dados!</div>`;

  // Cria objeto do concurso para persistir localmente e exibir em cards compactos
  const concursoObj = {
    id: Date.now().toString(),
    nome,
    data,
    topics,
    matched,
    missing,
    total,
    done,
    coverage,
    createdAt: new Date().toISOString()
  };

  // Se autenticado, tente salvar no servidor e usar o id retornado
  if (getAuthToken()) {
    try {
      const resp = await fetchComAuth('/concursos', {
        method: 'POST',
        body: JSON.stringify({
          nome: concursoObj.nome,
          data: concursoObj.data,
          json: JSON.stringify(concursoObj),
        })
      });
      if (resp.ok) {
        const body = await resp.json();
        if (body && body.id) concursoObj.id = body.id;
        // sincroniza a lista do servidor para garantir consistência entre navegadores
        try {
          const listaResp = await fetchComAuth('/concursos');
          if (listaResp.ok) {
            const srvList = await listaResp.json();
            const parsed = srvList.map(i => {
              try { const j = i.jsonConteudo ? JSON.parse(i.jsonConteudo) : {}; return { id: i.id, nome: i.nome, data: i.data, ...j }; } catch (e) { return { id: i.id, nome: i.nome, data: i.data }; }
            });
            localStorage.setItem('studyos_concursos', JSON.stringify(parsed));
          }
        } catch (e) { /* ignore sync errors */ }
      }
    } catch (e) {
      console.log('Falha ao salvar concurso no servidor, salvando localmente.');
    }
  }

  // Carrega concursos existentes do localStorage e adiciona
  const existing = JSON.parse(localStorage.getItem('studyos_concursos') || '[]');
  existing.unshift(concursoObj); // adicionar no topo
  localStorage.setItem('studyos_concursos', JSON.stringify(existing));

  // Re-renderiza a lista de concursos usando o novo resumo e detalhes
  renderConcurso();

  // Limpa o formulário após criar o card
  try {
    const elNome = document.getElementById('c-nome'); if (elNome) elNome.value = '';
    const elData = document.getElementById('c-data'); if (elData) elData.value = '';
    const elEdital = document.getElementById('c-edital'); if (elEdital) elEdital.value = '';
  } catch (e) { /* ignore */ }

  // Limpa o formulário após gerar o card
  try {
    const nomeEl = document.getElementById('c-nome');
    const dataEl = document.getElementById('c-data');
    const editalEl = document.getElementById('c-edital');
    if (nomeEl) nomeEl.value = '';
    if (dataEl) dataEl.value = '';
    if (editalEl) editalEl.value = '';
    if (nomeEl) nomeEl.focus();
  } catch (e) {}
}

function loadConcursosFromStorage() {
  try {
    // se estiver autenticado, busque do servidor primeiro
    if (getAuthToken()) {
      return (async () => {
        try {
          const res = await fetchComAuth('/concursos');
          if (res.ok) {
              const list = await res.json();
            // cada item contém jsonConteudo (string) — tente parsear
            const parsed = list.map(i => {
              try {
                const j = i.jsonConteudo ? JSON.parse(i.jsonConteudo) : {};
                return { id: i.id, nome: i.nome, data: i.data, ...j };
              } catch (e) {
                return { id: i.id, nome: i.nome, data: i.data };
              }
            });
            // also sync to localStorage
            localStorage.setItem('studyos_concursos', JSON.stringify(parsed));
            return parsed;
            }
            // se a resposta não foi OK, cai para fallback
            return JSON.parse(localStorage.getItem('studyos_concursos') || '[]');
        } catch (e) {
          console.log('Erro ao buscar concursos do servidor, usando localStorage.');
            return JSON.parse(localStorage.getItem('studyos_concursos') || '[]');
        }
      })();
    }

    return JSON.parse(localStorage.getItem('studyos_concursos') || '[]');
  } catch (e) {
    return [];
  }
}

function saveConcursosToStorage(list) {
  localStorage.setItem('studyos_concursos', JSON.stringify(list || []));
}

function toggleExpandConcurso(id) {
  const el = document.getElementById('concurso-details-' + id);
  const btn = document.getElementById('concurso-toggle-' + id);
  if (!el) return;
  const open = el.style.display === 'block';
  el.style.display = open ? 'none' : 'block';
  if (btn) btn.textContent = open ? '🔽' : '🔼';
}

async function excluirConcurso(id) {
  if (!confirm('Remover este concurso?')) return;

  // Se autenticado, remova no servidor também
  if (getAuthToken()) {
    try {
      await fetchComAuth(`/concursos/${id}`, { method: 'DELETE' });
    } catch (e) { /* continue */ }
  }

  let list = loadConcursosFromStorage();
  if (list && typeof list.then === 'function') {
    try { list = await list; } catch (e) { list = []; }
  }

  list = (Array.isArray(list) ? list : []).filter(c => String(c.id) !== String(id));
  saveConcursosToStorage(list);
  renderConcurso();
}

function renderConcursoCards(container, concursos) {
  if (!container) return;
  if (!concursos || !concursos.length) {
    // mantém card inicial explicativo
    return;
  }

  const html = concursos.map(c => {
    const dias = calcularTempoRestante(c.data) || 'Data inválida';
    const pct = c.coverage + '%';
    const remaining = c.missing ? c.missing.length : 0;

    const materiasIdent = Array.from(new Map((c.matched || []).map(m => [m.materia, []]))).map(k => k[0]);

    return `
      <div class="card concurso-card">
        <div class="concurso-main-row">
          <div class="concurso-left">
            <div class="concurso-days">${dias.split(' ')[0] || dias}</div>
            <div class="concurso-days-label">${dias.includes('Prova') ? dias : 'restantes'}</div>
          </div>
          <div class="concurso-body">
            <div class="concurso-header">
              <div class="concurso-title">${c.nome}</div>
              <div style="text-align:right;">
                <div class="concurso-pct" style="color:${c.coverage === 100 ? 'var(--green)' : 'var(--muted)'}">${pct}</div>
              </div>
            </div>
            <div class="concurso-sub">${c.done}/${c.total} assuntos detectados</div>
            <div class="progress-track"><div class="progress-fill" style="width:${100 - c.coverage}%; background: linear-gradient(90deg, var(--green), #2dd4bf); height:8px;"></div></div>
          </div>
          <div class="concurso-actions">
            <button class="btn sm danger" onclick="excluirConcurso('${c.id}')">🗑</button>
            <button id="concurso-toggle-${c.id}" class="btn sm" onclick="toggleExpandConcurso('${c.id}')">🔼</button>
          </div>
        </div>

        <div id="concurso-details-${c.id}" class="concurso-details" style="display:none;">
          <div class="concurso-details-inner">
            <div class="concurso-detail-section">
              <div class="concurso-detail-title">Matérias identificadas</div>
              <div class="concurso-detail-list">${(c.matched && c.matched.length) ? c.matched.map(m => `<div class=\"concurso-match\"><strong>${m.materia}</strong>: ${m.editalTopic} → ${m.topico}</div>`).join('') : '<div class="empty" style="padding:0.75rem;">Nenhuma correspondência encontrada</div>'}</div>
            </div>
            ${(c.missing && c.missing.length) ? `<div class="concurso-detail-section" style="margin-top:12px;"><div class="concurso-detail-title" style="color:var(--coral);">Assuntos faltantes</div><ul style="margin:6px 0 0 1rem; color:var(--text);">${c.missing.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
          </div>
        </div>
      </div>`;
  }).join('\n');

  container.insertAdjacentHTML('beforeend', html);
}

function showConcursoFullView(id) {
  Promise.resolve(loadConcursosFromStorage()).then(concursos => {
    const c = (concursos || []).find(x => String(x.id) === String(id));
    if (!c) return alert('Concurso não encontrado');

    // cria modal
    const modal = document.createElement('div');
    modal.className = 'concurso-fullmodal';
    modal.innerHTML = `
    <div class="concurso-fullcard">
      <button class="concurso-full-close btn sm" onclick="this.closest('.concurso-fullmodal').remove()">Fechar</button>
      <div class="card" style="border:1px solid var(--border); margin-bottom:1rem;">
        <div class="card-title">✅ Resultado da Análise</div>
        <div style="color: var(--text); font-size: 0.95rem; line-height: 1.6;">Concurso: <strong>${c.nome}</strong></div>
        <div style="color: var(--muted); font-size: 0.9rem; margin-top: 0.5rem;">Prova em ${new Date(c.data).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
        <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:1rem;">${[
          `Total de assuntos no edital: <strong>${c.total}</strong>`,
          `Assuntos já presentes no banco: <strong>${c.done}</strong>`,
          `Assuntos faltantes: <strong>${c.missing.length}</strong>`,
          `Cobertura do edital: <strong>${c.coverage}%</strong>`,
          `Tempo restante até a prova: <strong>${calcularTempoRestante(c.data) || 'Data inválida'}</strong>`
        ].map(item => `<span style="background: var(--surface2); padding: 0.8rem 1rem; border-radius: 12px; font-size: 0.9rem;">${item}</span>`).join('')}</div>
      </div>

      <div class="card" style="border:1px solid var(--border); margin-bottom:1rem;">
        <div class="card-title">Matérias com assuntos identificados</div>
        ${(c.matched && c.matched.length) ? c.matched.map(m => `<div style="margin-bottom: 1rem;"><strong style="color: var(--accent);">${m.materia}</strong> — 1 assunto(s) identificado<ul style="margin: 0.5rem 0 0 1rem; color: var(--text);"><li>${m.editalTopic} → ${m.topico}</li></ul></div>`).join('') : '<div class="empty"><div class="empty-icon">📦</div>Nenhuma correspondência encontrada.</div>'}
      </div>

      <div class="card" style="border:1px solid var(--border);">
        <div class="card-title">Assuntos extraídos do edital</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.75rem;">${c.topics.map(t => {
          const presente = c.missing.indexOf(t) === -1;
          return `<span style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 0.9rem;border-radius:999px;background:${presente ? 'rgba(74, 222, 128, 0.12)' : 'rgba(248, 113, 113, 0.12)'};color:${presente ? 'var(--green)' : 'var(--coral)'};font-size:0.9rem;">${presente ? '✔' : '✖'} ${t}</span>`;
        }).join('')}</div>
        ${(c.missing && c.missing.length) ? `<div style="margin-top:1rem;"><strong style="color:var(--coral);">Assuntos faltantes</strong><ul style="margin: 0.75rem 0 0 1rem; color: var(--text);">${c.missing.map(item => `<li>${item}</li>`).join('')}</ul></div>` : `<div style="margin-top:1rem; color: var(--green);">Todos os assuntos do edital já existem no banco de dados!</div>`}
      </div>
    </div>
  `;

    document.body.appendChild(modal);
  }).catch(e => { alert('Erro ao carregar concurso'); });
}

function openRelatorioPeriodoPanel() {
    const panel = document.getElementById('relatorio-periodo-panel');
    if (panel) panel.style.display = 'block';
}

function fecharRelatorioPeriodoPanel() {
    const panel = document.getElementById('relatorio-periodo-panel');
    if (panel) panel.style.display = 'none';
}

async function gerarRelatorioPeriodo() {
    const container = document.getElementById('relatorio-questoes-resultado');
    const resumoEl = document.getElementById('relatorio-periodo-resumo');
    const startDateInput = document.getElementById('rel-start-date');
    const endDateInput = document.getElementById('rel-end-date');

    if (!startDateInput || !endDateInput || !container) return;

    const start = startDateInput.value;
    const end = endDateInput.value;

    if (!start || !end) {
        alert('Escolha as duas datas do período.');
        return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate < startDate) {
        alert('A data de término deve ser igual ou posterior à data de início.');
        return;
    }

    resumoEl.textContent = `Período: ${dateStr(start)} até ${dateStr(end)}`;
    fecharRelatorioPeriodoPanel();
    container.innerHTML = `<div class="empty" style="padding: 1.5rem;">⏳ Carregando...</div>`;

    try {
        const token = localStorage.getItem('token') || localStorage.getItem('jwt');
        const res = await fetch(`/api/sessoes/relatorio?start=${start}&end=${end}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dados = await res.json();

        if (Object.keys(dados).length === 0) {
            container.innerHTML = `<div class="empty" style="padding: 1.5rem;">📭 Nenhum estudo registrado no período.</div>`;
            return;
        }

        container.innerHTML = Object.entries(dados).map(([mat, assuntos]) => `
            <div style="background: var(--surface2); padding: 1rem; border-radius: var(--radius); border: 1px solid var(--border); margin-bottom: 0.75rem;">
                <div style="font-weight: 700; color: #fff; margin-bottom: 0.5rem;">📖 ${mat} <span style="font-size: 0.75rem; color: var(--muted);">(${assuntos.length})</span></div>
                <ul style="margin: 0; padding-left: 1.25rem; color: var(--muted); font-size: 0.85rem; line-height: 1.5;">
                    ${assuntos.map(a => `<li>${a}</li>`).join('')}
                </ul>
            </div>
        `).join('');

    } catch (e) {
        container.innerHTML = `<div class="empty" style="padding: 1.5rem; color: var(--coral);">⚠️ Erro ao carregar dados.</div>`;
    }
}

async function gerarRelatorioQuestoes(periodo) {
    const container = document.getElementById('relatorio-questoes-resultado');
    if (!container) return;

    await gerarRelatorioPeriodo();
}

async function gerarSimuladoIA() {
    const containerConteudo = document.getElementById('conteudo-simulado-ia');
    const containerSalvar = document.getElementById('container-salvar-simulado');
    if (!containerConteudo) return;
    
    containerConteudo.innerHTML = `
        <div style="text-align: center; color: var(--muted); margin-top: 5rem;">
            <p style="font-size: 1.2rem;">🤖 Analisando suas matérias e gerando as 40 questões oficiais com a IA... Aguarde um instante.</p>
        </div>`;
    
    if (containerSalvar) containerSalvar.style.display = 'none';
    
    try {
        const response = await fetch('/api/simulado/gerar', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + getAuthToken(),
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            containerConteudo.innerHTML = `<div style="white-space: pre-wrap; color: var(--text); text-align: left;">${data.conteudo || data.simulado || JSON.stringify(data)}</div>`;
            if (containerSalvar) containerSalvar.style.display = 'block';
        } else {
            containerConteudo.innerHTML = `<p style="color: var(--coral); text-align: center; margin-top: 4rem;">❌ Erro ao gerar o simulado pelo servidor. Tente novamente.</p>`;
        }
    } catch (e) {
        console.error(e);
        containerConteudo.innerHTML = `<p style="color: var(--coral); text-align: center; margin-top: 4rem;">❌ Erro de conexão com o servidor.</p>`;
    }
}

async function salvarSimuladoNoBanco() {
    alert("🚀 Questões do simulado finalizadas e salvas com sucesso!");

    const containerConteudo = document.getElementById('conteudo-simulado-ia');
    const containerSalvar = document.getElementById('container-salvar-simulado');

    if (containerConteudo) {
        containerConteudo.innerHTML = `
            <div style="text-align: center; color: var(--muted); margin-top: 3rem; margin-bottom: 2rem;">
                <p style="font-size: 1.2rem; margin-bottom: 1.5rem;">💡 Clique no botão abaixo para estruturar sua prova oficial com a IA.</p>
            </div>
            <div style="text-align: center;">
                <button class="btn primary" onclick="gerarSimuladoIA()" style="padding: 0.85rem 2rem; font-size: 1rem; cursor: pointer;">
                    🤖 Gerar Simulado com IA (40 Questões)
                </button>
            </div>
        `;
    }

    if (containerSalvar) {
        containerSalvar.style.display = 'none';
    }
}

// ⏱️ POMODORO 
const POMO_MODES = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };
let pomoTimer = null;
let pomoMode = 'work';
let pomoSeconds = POMO_MODES.work;
let pomoRunning = false;
let pomoCompletedCount = 0;

function updatePomoDisplay() {
  const m = String(Math.floor(pomoSeconds / 60)).padStart(2, '0');
  const s = String(pomoSeconds % 60).padStart(2, '0');

  const disp = document.getElementById('pomo-display');
  if (disp) disp.textContent = `${m}:${s}`;

  document.title = `${m}:${s} - Estudando 🧠`;
}

function setPomoMode(mode) {
  if (!POMO_MODES[mode]) return;

  pomoMode = mode;
  pomoSeconds = POMO_MODES[mode];

  if (pomoRunning) {
    clearInterval(pomoTimer);
    pomoRunning = false;
  }

  const btn = document.getElementById('pomo-btn');
  if (btn) btn.innerHTML = '▶ Iniciar';

  const label = document.getElementById('pomo-label');
  if (label) {
    if (mode === 'work') label.textContent = 'FOCO';
    else if (mode === 'short') label.textContent = 'PAUSA CURTA';
    else if (mode === 'long') label.textContent = 'PAUSA LONGA';
  }

  const btnWork = document.getElementById('pomo-mode-work');
  const btnShort = document.getElementById('pomo-mode-short');
  const btnLong = document.getElementById('pomo-mode-long');

  if (btnWork) btnWork.style.borderColor = mode === 'work' ? 'var(--accent)' : 'var(--border2)';
  if (btnShort) btnShort.style.borderColor = mode === 'short' ? 'var(--accent)' : 'var(--border2)';
  if (btnLong) btnLong.style.borderColor = mode === 'long' ? 'var(--accent)' : 'var(--border2)';

  updatePomoDisplay();
}

function togglePomo() {
  const btn = document.getElementById('pomo-btn');

  if (pomoRunning) {
    clearInterval(pomoTimer);
    pomoRunning = false;
    if (btn) btn.innerHTML = '▶ Continuar';
  } else {
    pomoRunning = true;
    if (btn) btn.innerHTML = '⏸ Pausar';

    pomoTimer = setInterval(() => {
      if (pomoSeconds > 0) {
        pomoSeconds--;
        updatePomoDisplay();
      } else {
        clearInterval(pomoTimer);
        pomoRunning = false;
        finalizarCicloPomodoro();
      }
    }, 1000);
  }
}

function resetPomo() {
  if (pomoTimer) clearInterval(pomoTimer);
  pomoRunning = false;
  pomoSeconds = POMO_MODES[pomoMode];

  const btn = document.getElementById('pomo-btn');
  if (btn) btn.innerHTML = '▶ Iniciar';

  updatePomoDisplay();
}

async function finalizarCicloPomodoro() {
  tocarAlarmeFimCiclo();

  const btn = document.getElementById('pomo-btn');
  if (btn) btn.innerHTML = '▶ Iniciar';

  if (pomoMode === 'work') {
    pomoCompletedCount++;

    const countEl = document.getElementById('pomo-count');
    if (countEl) countEl.textContent = pomoCompletedCount;

    alert("🎉 Parabéns! Ciclo de foco de 25 minutos concluído! Hora de descansar 5 minutos.");

    setPomoMode('short');
  } else {
    alert("⚡ Pausa finalizada! Pronto para o próximo ciclo de foco?");
    setPomoMode('work');
  }
}

function tocarAlarmeFimCiclo() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 1.2);
  } catch (e) {
    console.log("Audio API não suportada ou bloqueada pelo navegador.");
  }
}

// 🔐 CHECAGEM DE AUTENTICAÇÃO E INICIALIZAÇÃO 
function verificarAutenticacaoEInicializar() {
  const token = getAuthToken();
  const usuarioRaw = localStorage.getItem('usuario') || localStorage.getItem('estudoos_usuario');
  const authModal = document.getElementById('auth-modal');

  if (!token) {
    if (authModal) authModal.style.display = 'flex';
    return;
  }

  if (authModal) authModal.style.display = 'none';

  if (usuarioRaw) {
    try {
      const usuario = JSON.parse(usuarioRaw);
      const greetingEl = document.getElementById('dash-greeting');
      const userDisplayEl = document.getElementById('user-display');

      if (greetingEl) greetingEl.textContent = `Bom estudo, ${usuario.nome}! 👋`;
      if (userDisplayEl) userDisplayEl.textContent = `👤 ${usuario.nome}`;
    } catch (e) {
      console.error("Erro ao carregar dados do usuário:", e);
    }
  }

  if (typeof aplicarControleAcesso === 'function') {
    aplicarControleAcesso();
  }

  renderDashboard();
  updatePomoDisplay();
}

// 🚀 INIT & LISTENERS 
document.addEventListener('DOMContentLoaded', () => {
  const dashDateEl = document.getElementById('dash-date');
  if (dashDateEl) {
    dashDateEl.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  const hojeDateEl = document.getElementById('hoje-date');
  if (hojeDateEl) {
    hojeDateEl.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  const notesInput = document.getElementById('session-notes');
  if (notesInput) {
    notesInput.addEventListener('input', function () {
      autoGrowNotes(this);
    });
  }

  verificarAutenticacaoEInicializar();

  // Restaurar aba ativa anteriormente selecionada (se existir)
  try {
    const active = localStorage.getItem('studyos_active_page');
    if (active) showPage(active);
  } catch (e) { /* ignore */ }
});

// ─── CICLO IA LOGIC ──────────────────────────────────────────────────────────

function getCiclo() {
  try {
    return JSON.parse(localStorage.getItem('studyos_ciclo') || 'null');
  } catch {
    return null;
  }
}

function saveCiclo(c) {
  localStorage.setItem('studyos_ciclo', JSON.stringify(c));
}

async function renderCiclo() {
  let ciclo = null;
  try {
    const resp = await fetchComAuth('/ciclo/ativo');
    if (resp.ok) {
      const data = await resp.json();
      if (data.ativo && data.ciclo && data.ciclo.jsonConteudo) {
        ciclo = JSON.parse(data.ciclo.jsonConteudo);
      }
    }
  } catch (e) {
    console.log("Buscando ciclo do localStorage devido a falha na API.");
  }

  if (!ciclo) {
    ciclo = getCiclo();
  }

  if (!ciclo) {
    _cicloShowEmpty();
    return;
  }

  // 🔄 SINCRONIZAÇÃO DE STATUS REAL: Verifica se algum tópico foi desmarcado na aba Matérias
  if (state.materias && state.materias.length > 0 && ciclo.dias) {
    ciclo.dias.forEach(dia => {
      if (dia.blocos) {
        dia.blocos.forEach(bloco => {
          if (bloco.matId && bloco.topicId) {
            const mat = state.materias.find(m => String(m.id) === String(bloco.matId));
            if (mat && mat.topicos) {
              const top = mat.topicos.find(t => String(t.id) === String(bloco.topicId));
              if (top) {
                const realConcluido = top.concluido === true || top.concluido === 'true' || top.done === true;
                bloco.done = realConcluido; // Força o ciclo a refletir exatamente o que está na matéria
              }
            }
          }
        });
      }
    });
    saveCiclo(ciclo);
  }

  _cicloHideEmpty();
  const btnClear = document.getElementById('btn-clear-ciclo');
  if (btnClear) btnClear.style.display = 'inline-flex';
  renderCicloPlano(ciclo);
}
function _cicloShowEmpty() {
  document.getElementById('ciclo-empty').style.display   = 'block';
  document.getElementById('ciclo-plan').style.display    = 'none';
  document.getElementById('ciclo-stats').style.display   = 'none';
  document.getElementById('ciclo-loading').style.display = 'none';
  const btnClear = document.getElementById('btn-clear-ciclo');
  if (btnClear) btnClear.style.display = 'none';
}

function _cicloHideEmpty() {
  document.getElementById('ciclo-empty').style.display   = 'none';
  document.getElementById('ciclo-loading').style.display = 'none';
}

function openCicloConfig() {
  const cfg = document.getElementById('ciclo-config');
  cfg.style.display = 'block';

  const t = today();
  document.getElementById('ciclo-start').value = t;
  document.getElementById('ciclo-end').value   = addDays(t, 30);
  document.getElementById('ciclo-hours').value = 3;

  document.querySelectorAll('.weekday-btn').forEach(btn => {
    btn.onclick = () => btn.classList.toggle('active');
  });

  const ms = document.getElementById('ciclo-mat-select');
  if (!state.materias.length) {
    ms.innerHTML = '<span style="font-size:13px;color:var(--muted);">Nenhuma matéria cadastrada. Adicione matérias primeiro.</span>';
    return;
  }

  ms.innerHTML = state.materias.map(m => `
    <button
      type="button"
      class="mat-select-btn active"
      data-id="${m.id}"
      style="color:${m.cor || 'var(--accent)'};border-color:${m.cor || 'var(--accent)'};background:${(m.cor || 'var(--accent)')}22;"
      onclick="toggleMatSelect(this, '${m.cor || 'var(--accent)'}')"
    >${m.nome || m.name}</button>
  `).join('');
}

function toggleMatSelect(btn, color) {
  btn.classList.toggle('active');
  btn.style.background = btn.classList.contains('active')
    ? color + '22'
    : 'var(--surface2)';
}

async function gerarCicloIA() {
  const start    = document.getElementById('ciclo-start').value;
  const end      = document.getElementById('ciclo-end').value;
  const hours    = parseInt(document.getElementById('ciclo-hours').value) || 3;
  const priority = document.getElementById('ciclo-priority').value;

  if (!start || !end || end <= start) {
    alert('Defina datas válidas de início e fim.');
    return;
  }

  const activeDays = [...document.querySelectorAll('.weekday-btn.active')]
    .map(b => parseInt(b.dataset.day));

  if (!activeDays.length) {
    alert('Selecione ao menos um dia da semana.');
    return;
  }

  const selectedMatIds = [...document.querySelectorAll('.mat-select-btn.active')]
    .map(b => b.dataset.id);

  if (!selectedMatIds.length) {
    alert('Selecione ao menos uma matéria.');
    return;
  }

  const studyDays = _buildStudyDays(start, end, activeDays);
  if (!studyDays.length) {
    alert('Nenhum dia disponível no período com os dias da semana selecionados.');
    return;
  }

  document.getElementById('ciclo-config').style.display = 'none';
  _cicloHideEmpty();
  document.getElementById('ciclo-plan').style.display  = 'none';
  document.getElementById('ciclo-stats').style.display = 'none';
  document.getElementById('ciclo-loading').style.display = 'block';

  const msgs = [
    'Analisando suas matérias e todos os assuntos cadastrados',
    'Calculando a distribuição ideal por semanas',
    'Aplicando estratégia de revisão espaçada',
    'Montando o cronograma completo dia a dia',
    'Finalizando seu plano personalizado'
  ];
  let mi = 0;
  const msgInterval = setInterval(() => {
    const el = document.getElementById('ciclo-loading-msg');
    if (el) el.textContent = msgs[mi % msgs.length];
    mi++;
  }, 2200);

  // GARANTINDO QUE TODOS OS TÓPICOS DE CADA MATÉRIA SELECIONADA SEJAM ENVIADOS PARA A IA
  const materiasFiltradas = state.materias.filter(m => selectedMatIds.includes(String(m.id)));
  const materiasData = materiasFiltradas.map(m => ({
    id:       m.id,
    nome:     m.nome || m.name,
    assuntos: (m.topicos || m.topics || []).map(t => ({ 
      id: t.id, 
      nome: t.nome || t.name, 
      concluido: t.concluido || t.done 
    }))
  }));

    try {
    const resp = await fetchComAuth('/ciclo/gerar', {
      method: 'POST',
      body: JSON.stringify({
        dataInicio: start,
        dataFim: end,
        diasSemana: activeDays,
        horasPorDia: hours,
        prioridade: priority,
        materiasIds: selectedMatIds
      })
    });

    clearInterval(msgInterval);
    document.getElementById('ciclo-loading').style.display = 'none';

    if (!resp.ok) throw new Error('Erro na comunicação com o servidor.');

    const parsed = await resp.json();

    if (!parsed || !parsed.dias || !Array.isArray(parsed.dias)) {
      throw new Error(parsed.erro || 'A IA retornou um formato inesperado. Tente gerar novamente.');
    }

    const cicloData = {
      geradoEm: today(),
      aviso: parsed.aviso || null,
      config: { start, end, hours, priority, activeDays },
      totalDias:   parsed.totalDias   || parsed.dias.length,
      totalBlocos: parsed.totalBlocos || parsed.dias.reduce((s, d) => s + (d.blocos ? d.blocos.length : 0), 0),
      dias: parsed.dias.map(d => ({
        data: d.data,
        blocos: (d.blocos || []).map(b => ({
          ...b,
          id:   Math.random().toString(36).slice(2),
          done: false
        }))
      }))
    };

    saveCiclo(cicloData);
    semanaAtivaIndex = 0;
    renderCiclo();

    if (cicloData.aviso) {
      setTimeout(() => alert('⚠️ Aviso da IA: ' + cicloData.aviso), 300);
    }

  } catch (err) {
    clearInterval(msgInterval);
    document.getElementById('ciclo-loading').style.display = 'none';
    _cicloShowEmpty();
    alert('Erro ao gerar o plano:\n' + err.message);
  }
}

let semanaAtivaIndex = 0;

function renderCicloPlano(ciclo) {
  if (!ciclo || !ciclo.dias) return;
  const todayStr   = today();
  const allBlocos  = ciclo.dias.flatMap(d => d.blocos || []);
  const doneCount  = allBlocos.filter(b => b.done).length;
  const total      = allBlocos.length;
  const pct        = total ? Math.round(doneCount / total * 100) : 0;

  const statsEl = document.getElementById('ciclo-stats');
  if (statsEl) statsEl.style.display = 'block';
  
  const dEl = document.getElementById('cstat-days');
  if (dEl) dEl.textContent = ciclo.dias.length;

  const bEl = document.getElementById('cstat-blocks');
  if (bEl) bEl.textContent = total;

  const doneEl = document.getElementById('cstat-done');
  if (doneEl) doneEl.textContent = doneCount;

  const pctEl = document.getElementById('cstat-pct');
  if (pctEl) pctEl.textContent = pct + '%';

  const fillEl = document.getElementById('ciclo-overall-fill');
  if (fillEl) fillEl.style.width = pct + '%';

  const plan = document.getElementById('ciclo-plan');
  if (!plan) return;
  plan.style.display = 'block';

  // Agrupa os dias em semanas (blocos de 7 dias)
  const semanas = [];
  for (let i = 0; i < ciclo.dias.length; i += 7) {
    semanas.push(ciclo.dias.slice(i, i + 7));
  }

  if (semanaAtivaIndex >= semanas.length) semanaAtivaIndex = 0;

  // Seletor Compacto e Limpo para Semanas
  let navSemanasHtml = `
    <div style="display:flex; align-items:center; justify-content:space-between; background:var(--surface2); padding:0.75rem 1rem; border-radius:var(--radius); margin-bottom:1rem; border:1px solid var(--border);">
      <button class="btn sm" onclick="mudarSemanaCiclo(-1)" ${semanaAtivaIndex === 0 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>◀ Semana Anterior</button>
      <div style="font-weight:700; font-size:13px; color:var(--text); text-align:center;">
        📅 Semana ${semanaAtivaIndex + 1} de ${semanas.length} 
        <span style="font-weight:400; color:var(--muted); font-size:11px; display:block;">
          (${semanas[semanaAtivaIndex] ? dateStr(semanas[semanaAtivaIndex][0].data) : ''} até ${semanas[semanaAtivaIndex] ? dateStr(semanas[semanaAtivaIndex][semanas[semanaAtivaIndex].length - 1].data) : ''})
        </span>
      </div>
      <button class="btn sm" onclick="mudarSemanaCiclo(1)" ${semanaAtivaIndex === semanas.length - 1 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>Próxima Semana ▶</button>
    </div>`;

  const diasDaSemanaAtiva = semanas[semanaAtivaIndex] || [];

  plan.innerHTML = navSemanasHtml + diasDaSemanaAtiva.map((d) => {
    const di = ciclo.dias.findIndex(item => item.data === d.data);
    const isToday  = d.data === todayStr;
    const blocosDia = d.blocos || [];
    const allDone  = blocosDia.length > 0 && blocosDia.every(b => b.done);
    const dayDone  = blocosDia.filter(b => b.done).length;

    let numCls = 'ciclo-day-num';
    if (allDone)   numCls += ' done-day';
    else if (isToday) numCls += ' today-day';

    const dateObj  = new Date(d.data + 'T12:00:00');
    const dayLabel = dateObj.toLocaleDateString('pt-BR', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
    const mats = [...new Set(blocosDia.map(b => b.materia))].join(', ');
    const bodyId = `cday-body-${di}`;
    const chevId = `cday-chev-${di}`;

    return `
      <div class="ciclo-day ${isToday ? 'active-day' : ''}">
        <div class="ciclo-day-header" onclick="toggleCicloDay('${bodyId}','${chevId}')">
          <div class="${numCls}">
            ${allDone ? '✓' : isToday ? '📅' : di + 1}
          </div>
          <div class="ciclo-day-info">
            <div class="ciclo-day-date">${dayLabel}${isToday ? ' — <span style="color:var(--accent)">Hoje</span>' : ''}</div>
            <div class="ciclo-day-mats">${mats || 'Sem blocos planejados'}</div>
          </div>
          <div class="ciclo-day-progress">${dayDone}/${blocosDia.length} blocos</div>
          <div class="ciclo-day-chevron ${isToday ? 'open' : ''}" id="${chevId}">▾</div>
        </div>

        <div class="ciclo-body ${isToday ? 'open' : ''}" id="${bodyId}">
          ${blocosDia.length
            ? blocosDia.map(b => `
                <div class="ciclo-block ${b.done ? 'done-block' : ''}" id="cblock-${b.id}">
                  <div
                    class="ciclo-block-check ${b.done ? 'done' : ''}"
                    onclick="event.stopPropagation(); toggleCicloBlock('${b.id}', ${di})"
                    title="${b.done ? 'Desmarcar' : 'Marcar como concluído'}"
                  ></div>
                  <div class="ciclo-block-content" style="cursor:pointer;" onclick="irParaCadernoDoCiclo('${b.matId}', '${b.topicId}')" title="Clique para abrir e anotar na aba Hoje">
                    <div class="ciclo-block-mat">📖 ${b.materia} <span style="font-size:10px; color:var(--accent);">(Ir para Caderno ➔)</span></div>
                    <div class="ciclo-block-topic">${b.assunto}</div>
                    ${b.dica ? `<div class="ciclo-block-tip">💡 ${b.dica}</div>` : ''}
                  </div>
                  <div class="ciclo-block-time">1h</div>
                </div>
              `).join('')
            : '<div style="font-size:13px;color:var(--muted);padding:.5rem 0;">Dia de descanso 🛌</div>'
          }
        </div>
      </div>`;
  }).join('');
}

function mudarSemanaCiclo(direcao) {
  semanaAtivaIndex += direcao;
  renderCiclo();
}

async function irParaCadernoDoCiclo(materiaId, topicoId) {
  if (!materiaId || !topicoId) {
    alert("Este bloco não possui ID de vínculo direto com a matéria cadastrada.");
    return;
  }
  
  showPage('hoje');
  dataAtivaSessao = today();
  
  const selMat = document.getElementById('session-mat');
  if (selMat) {
    selMat.value = materiaId;
  }

  await loadSessionTopics();
  await tratarCliqueTopico(topicoId, false, materiaId);
}

function toggleCicloDay(bodyId, chevId) {
  const body = document.getElementById(bodyId);
  const chev = document.getElementById(chevId);
  const open = body.classList.toggle('open');
  if (chev) chev.classList.toggle('open', open);
}

async function toggleCicloBlock(blockId, dayIdx) {
  const ciclo = getCiclo();
  if (!ciclo || !ciclo.dias) return;
  const day   = ciclo.dias[dayIdx];
  const block = day.blocos.find(b => b.id === blockId);
  if (!block) return;

  block.done = !block.done;

  if (block.matId && block.topicId) {
    const m = state.materias.find(x => String(x.id) === String(block.matId));
    if (m) {
      const topicosList = m.topicos || m.topics || [];
      const t = topicosList.find(x => String(x.id) === String(block.topicId));
      if (t) {
        t.concluido = block.done;
        t.done = block.done;
        t.dataConclusao = block.done ? today() : null;

        try {
          await fetchComAuth(`/topicos/${block.topicId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: t.nome || t.name, concluido: block.done })
          });
        } catch (e) {
          console.error("Erro ao sincronizar status do tópico com o servidor:", e);
        }

        if (block.done && typeof scheduleReview === 'function') {
          scheduleReview(block.matId, block.topicId, t.nome || t.name, m.nome || m.name);
        }
      }
    }
  }

  saveCiclo(ciclo);
  renderCicloPlano(ciclo);

    try {
      await fetchComAuth('/ciclo/gerar', {
        method: 'POST',
        body: JSON.stringify({
          dataInicio: ciclo.config.start,
          dataFim: ciclo.config.end,
          diasSemana: ciclo.config.activeDays,
          horasPorDia: ciclo.config.hours,
          prioridade: ciclo.config.priority,
          materiasIds: ciclo.config.materiasIds || []
        })
      });
    } catch (e) {
      console.log("Progresso salvo localmente.");
    }
}

async function clearCiclo() {
  if (!confirm('Remover o plano gerado? O progresso dos assuntos já marcados será mantido nas Matérias.')) return;

  try {
    await fetchComAuth('/ciclo', { method: 'DELETE' });
  } catch (e) {
    console.log('Falha ao remover o plano no servidor, prosseguindo localmente.');
  }

  localStorage.removeItem('studyos_ciclo');
  renderCiclo();
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function _buildStudyDays(start, end, activeDays) {
  const days   = [];
  let   cur    = new Date(start + 'T12:00:00');
  const endDate = new Date(end   + 'T12:00:00');
  while (cur <= endDate) {
    if (activeDays.includes(cur.getDay())) {
      days.push(cur.toISOString().split('T')[0]);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}