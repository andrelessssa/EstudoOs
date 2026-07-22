// ─── CONFIGURAÇÃO DA API ──────────────────────────────────────────────────────
const API_URL = ''; // Deixe vazio se o frontend for servido pelo próprio Spring Boot

// ─── CORES ───────────────────────────────────────────────────────────────────
const COLORS = ['#6c7bff', '#34d399', '#fbbf24', '#f87171', '#c084fc', '#2dd4bf', '#fb7185', '#60a5fa', '#a3e635', '#f97316'];

// ─── STATE LOCAL ─────────────────────────────────────────────────────────────
let state = { materias: [], sessions: [], reviews: [], questions: [] };
let topicosSelecionadosLocalmente = [];
let revisaoAtiva = null;
let modoEdicao = false;

// ─── NAVEGAÇÃO ───────────────────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

  const pageEl = document.getElementById('page-' + id);
  if (pageEl) pageEl.classList.add('active');

  const pages = ['dashboard', 'materias', 'hoje', 'revisao', 'questoes', 'pomodoro'];
  const idx = pages.indexOf(id);
  if (idx !== -1) {
    document.querySelectorAll('.tab')[idx]?.classList.add('active');
  }

  if (id !== 'hoje') {
    revisaoAtiva = null;
  }

  if (id === 'dashboard') renderDashboard();
  if (id === 'materias') renderMaterias();
  if (id === 'hoje') renderHoje();
  if (id === 'revisao') renderRevisao();
  if (id === 'questoes') renderQuestoes();
}

function toggleTopics(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

// ─── DATAS ───────────────────────────────────────────────────────────────────
function today() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}

function dateStr(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
async function renderDashboard() {
  const dashDateEl = document.getElementById('dash-date');
  if (dashDateEl) {
    dashDateEl.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  try {
    const [resMat, resRev, resDias] = await Promise.all([
      fetch(`${API_URL}/api/materias`),
      fetch(`${API_URL}/api/revisoes/hoje`),
      fetch(`${API_URL}/api/sessoes/calendario/estudados`)
    ]);

    state.materias = await resMat.json();
    const revisoesHoje = await resRev.json();
    const diasEstudadosNoBanco = await resDias.json();

    const materiasComTopicos = await Promise.all(state.materias.map(async (m) => {
      try {
        const resTopicos = await fetch(`${API_URL}/api/topicos/materia/${m.id}`);
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

    document.getElementById('dash-studied').textContent = studied;
    document.getElementById('dash-correct').textContent = correct;
    document.getElementById('dash-rate').textContent = rate;
    document.getElementById('dash-reviews').textContent = revisoesHoje.length;

    // 1. Renderiza Progresso por Matéria
    const pl = document.getElementById('dash-progress-list');
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

    // 2. Renderiza o Calendário
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

        html += `<div class="${cls}"><span class="cal-day-num">${d}</span></div>`;
      }
      html += '</div>';
      cal.innerHTML = html;
    }

  } catch (error) {
    console.error("Erro ao carregar o Dashboard:", error);
  }
}

// ─── MATÉRIAS & CONTROLE DE PAINÉIS ──────────────────────────────────────────
function alternarModoEdicao() {
  modoEdicao = !modoEdicao;

  const btnGerenciar = document.querySelector("button[onclick='alternarModoEdicao()']");
  if (btnGerenciar) {
    if (modoEdicao) {
      btnGerenciar.innerHTML = '✓ Concluir';
      btnGerenciar.classList.add('active-green');
    } else {
      btnGerenciar.innerHTML = '✏️ Gerenciar';
      btnGerenciar.classList.remove('active-green');
    }
  }

  renderMaterias();
}

async function renderMaterias() {
  const el = document.getElementById('materias-list');
  if (!el) return;

  try {
    const res = await fetch(`${API_URL}/api/materias`);
    state.materias = await res.json();

    if (!state.materias || !state.materias.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">📘</div>Nenhuma matéria cadastrada ainda</div>';
      return;
    }

    const materiasComTopicos = await Promise.all(state.materias.map(async (m) => {
      try {
        const resTopicos = await fetch(`${API_URL}/api/topicos/materia/${m.id}`);
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
        <div class="actions-edicao" style="display:flex; gap:.4rem; margin-left:auto;">
          <button class="btn sm" onclick="event.stopPropagation(); openEditMateriaPanel('${m.id}', '${m.nome}')" title="Editar matéria">✏️</button>
          <button class="btn sm danger" onclick="event.stopPropagation(); deleteMateria('${m.id}')" title="Excluir matéria">🗑️</button>
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
        
        <div id="tops-${m.id}" style="display:${modoEdicao ? 'block' : 'none'}; padding:.4rem 0 .4rem 1.5rem;">
          ${listaTopicos.length ? listaTopicos.map(t => {
        const jaConcluido = t.concluido === true || t.concluido === 'true' || t.done === true;

        const botoesAcaoTopico = modoEdicao ? `
              <div style="display:flex; gap:.3rem; margin-left:auto;">
                <button class="btn sm" onclick="event.stopPropagation(); openEditTopicoPanel('${t.id}', '${t.nome}')" title="Renomear assunto">✏️</button>
                <button class="btn sm danger" onclick="event.stopPropagation(); deleteTopico('${t.id}')" title="Apagar assunto">🗑️</button>
              </div>
            ` : '';

        return `
            <div class="topic-row" style="display:flex; align-items:center; justify-content:space-between; padding: 0.4rem 0.8rem; margin-bottom: 0.2rem; background: var(--surface2); border-radius: var(--radius);">
              <div style="display:flex; align-items:center; gap: 0.5rem;">
                <div class="topic-check ${jaConcluido ? 'checked' : ''}" style="pointer-events: none;"></div>
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
  document.getElementById('mat-id-edit').value = '';
  document.getElementById('mat-name').value = '';
  document.getElementById('mat-topics').value = '';
  document.getElementById('materias-panel').style.display = 'block';
  document.getElementById('mat-name').focus();
}

function closeMateriaPanel() {
  document.getElementById('materias-panel').style.display = 'none';
  document.getElementById('mat-id-edit').value = '';
}

function openEditMateriaPanel(id, nome) {
  document.getElementById('mat-id-edit').value = id;
  document.getElementById('mat-name').value = nome;
  document.getElementById('mat-topics').value = '';
  document.getElementById('materias-panel').style.display = 'block';
  document.getElementById('mat-name').focus();
}

function openEditTopicoPanel(id, nome) {
  document.getElementById('topico-id-edit').value = id;
  document.getElementById('topico-name-edit').value = nome;
  document.getElementById('topico-panel').style.display = 'block';
  document.getElementById('topico-name-edit').focus();
}

function closeTopicoPanel() {
  document.getElementById('topico-panel').style.display = 'none';
  document.getElementById('topico-id-edit').value = '';
}

async function saveMateria() {
  const matId = document.getElementById('mat-id-edit').value;
  const name = document.getElementById('mat-name').value.trim();
  const topicsRaw = document.getElementById('mat-topics').value;

  if (!name) {
    alert('Informe o nome da matéria.');
    return;
  }

  const novosTopicos = topicsRaw.split('\n').map(t => t.trim()).filter(Boolean);

  try {
    if (matId) {
      await fetch(`${API_URL}/api/materias/${matId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: name })
      });

      if (novosTopicos.length > 0) {
        await fetch(`${API_URL}/api/topicos/materia/${matId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novosTopicos)
        });
      }
    } else {
      const materiaDTO = {
        nome: name,
        topicos: novosTopicos,
        cor: COLORS[state.materias.length % COLORS.length]
      };

      await fetch(`${API_URL}/api/materias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materiaDTO)
      });
    }

    closeMateriaPanel();
    renderMaterias();
    renderDashboard();

  } catch (error) {
    console.error("Erro ao salvar matéria:", error);
    alert("Erro de comunicação com o servidor.");
  }
}

async function deleteMateria(idMateria) {
  if (!confirm('Deseja excluir a matéria e todos os seus assuntos?')) return;

  try {
    const res = await fetch(`${API_URL}/api/materias/${idMateria}`, {
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
  const topicoId = document.getElementById('topico-id-edit').value;
  const novoNome = document.getElementById('topico-name-edit').value.trim();

  if (!novoNome) {
    alert("Informe o nome do assunto.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/topicos/${topicoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${API_URL}/api/topicos/${idTopico}`, {
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

// ─── REVISÃO ESPAÇADA & FILA ─────────────────────────────────────────────────
async function renderRevisao() {
  try {
    const [resHoje, resStats] = await Promise.all([
      fetch(`${API_URL}/api/revisoes/hoje`),
      fetch(`${API_URL}/api/revisoes/estatisticas`)
    ]);

    const stats = await resStats.json();

    const cardHoje = document.getElementById('rev-today');
    const cardSemana = document.getElementById('rev-week');
    const cardFeitas = document.getElementById('rev-done');

    if (cardHoje) cardHoje.textContent = stats.hoje ?? 0;
    if (cardSemana) cardSemana.textContent = stats.proximos7Dias ?? 0;
    if (cardFeitas) cardFeitas.textContent = stats.feitas ?? 0;

  } catch (error) {
    console.error("Erro ao listar revisões:", error);
  }
}

// ─── SESSÃO DE HOJE ──────────────────────────────────────────────────────────
async function renderHoje() {
  const sel = document.getElementById('session-mat');
  if (!sel) return;

  try {
    const res = await fetch(`${API_URL}/api/materias`);
    state.materias = await res.json();

    const valorAtual = sel.value;

    if (!state.materias || !state.materias.length) {
      sel.innerHTML = '<option value="">Nenhuma matéria cadastrada</option>';
    } else {
      sel.innerHTML = '<option value="">Selecionar matéria...</option>' +
        state.materias.map(m => `<option value="${m.id}">${m.nome}</option>`).join('');
    }

    if (valorAtual) sel.value = valorAtual;

    if (sel.value) {
      loadSessionTopics();
    } else {
      document.getElementById('session-topics-list').innerHTML =
        '<div class="empty"><div class="empty-icon">📖</div>Selecione uma matéria acima</div>';
    }

    renderHistoricoSessaoHoje();

  } catch (error) {
    console.error("Erro na aba hoje:", error);
  }
}

// 📖 Carrega e exibe os assuntos da matéria selecionada (Nome limpo sem tags extras)
async function loadSessionTopics() {
  const matId = document.getElementById('session-mat').value;
  const el = document.getElementById('session-topics-list');
  if (!el) return;

  if (!matId) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">📖</div>Selecione uma matéria acima</div>';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/topicos/materia/${matId}`);
    const topicos = await res.json();

    if (!topicos || !topicos.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">📂</div>Nenhum assunto cadastrado nesta matéria</div>';
      return;
    }

    el.innerHTML = topicos.map(t => {
      const idNum = parseInt(t.id);
      const jaConcluido = t.concluido === true || t.concluido === 'true' || t.done === true;
      const estaMarcadoLocalmente = topicosSelecionadosLocalmente.includes(idNum);

      return `<div class="topic-row ${jaConcluido ? 'concluido-banco' : ''}" style="display:flex; align-items:center; gap:0.6rem; padding:0.5rem 0.8rem; margin-bottom:0.3rem; background:var(--surface2); border-radius:var(--radius); cursor:pointer;" onclick="tratarCliqueTopico('${t.id}', ${jaConcluido})">
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

// 📏 Ajusta dinamicamente a altura do campo de anotações (empurra a tela)
function autoGrowNotes(element) {
  if (!element) return;
  element.style.height = 'auto';
  element.style.height = (element.scrollHeight) + 'px';
}

// 📌 Decide o que fazer ao clicar no assunto (Marcar local X Abrir Resumo/Caderno)
async function tratarCliqueTopico(topicId, jaConcluido) {
  if (jaConcluido) {
    try {
      const res = await fetch(`${API_URL}/api/topicos/${topicId}`);
      if (res.ok) {
        const topico = await res.json();
        const notesEl = document.getElementById('session-notes');
        if (notesEl) {
          notesEl.value = topico.anotacoes || `Resumo de ${topico.nome}: Nenhuma anotação cadastrada.`;
          autoGrowNotes(notesEl); // Redimensiona a altura do caderno ao carregar o resumo
        }
      }
      renderHistoricoSessaoHoje();
    } catch (e) {
      console.error("Erro ao abrir caderno do assunto:", e);
    }
    return;
  }

  toggleTopicLocal(topicId);
}

// 📌 Alterna a seleção do tópico novo na sessão atual
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

// 🗂️ Renderiza o histórico de sessões
async function renderHistoricoSessaoHoje() {
  const hist = document.getElementById('session-history');
  if (!hist) return;

  try {
    const [resSessoes, resTopicos] = await Promise.all([
      fetch(`${API_URL}/api/sessoes`),
      fetch(`${API_URL}/api/topicos`)
    ]);

    if (!resSessoes.ok) throw new Error();

    const sessoesDoBanco = await resSessoes.json();
    let todosTopicos = [];
    if (resTopicos.ok) {
      todosTopicos = await resTopicos.json();
    }

    const todayStr = today();
    const sessoesDeHoje = sessoesDoBanco.filter(s => s.dataSessao === todayStr);

    if (!sessoesDeHoje.length) {
      hist.innerHTML = '<div class="empty"><div class="empty-icon">🗂️</div>Nenhuma sessão registrada hoje</div>';
      return;
    }

    const sessoesInvertidas = [...sessoesDeHoje].reverse();

    hist.innerHTML = sessoesInvertidas.map(s => {
      const dataFormatada = s.dataSessao ? dateStr(s.dataSessao) : dateStr(today());
      const materiaObj = state.materias.find(m => m.id == s.materiaId);
      const materiaNome = materiaObj ? materiaObj.nome : `Matéria`;

      const idsTopicos = s.topicosConcluidosIds || s.topicosIds || [];
      const nomesAssuntos = idsTopicos.map(id => {
        const topico = todosTopicos.find(t => t.id == id);
        return topico ? topico.nome : null;
      }).filter(Boolean);

      const textoAssuntos = nomesAssuntos.length > 0
        ? nomesAssuntos.join(', ')
        : 'Assuntos estudados';

      return `<div style="padding:.85rem;background:var(--surface2);border-radius:var(--radius);margin-bottom:.4rem;display:flex;gap:.75rem;align-items:flex-start;">
        <div style="font-family:var(--mono);font-size:11px;color:var(--muted);min-width:70px;padding-top:2px;">📅 ${dataFormatada}</div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:var(--text);">${materiaNome}</div>
          <div style="font-size:12px;color:var(--accent);margin-top:2px;font-weight:500;">📌 ${textoAssuntos}</div>
        </div>
      </div>`;
    }).join('');

  } catch (e) {
    console.error("Erro ao renderizar histórico de sessões:", e);
    hist.innerHTML = '<div class="empty"><div class="empty-icon">🗂️</div>Nenhuma sessão registrada hoje</div>';
  }
}

// 💾 Salva a sessão de estudo
async function saveSession() {
  const matId = document.getElementById('session-mat').value;
  if (!matId) {
    alert('Selecione uma matéria primeiro.');
    return;
  }

  const notes = document.getElementById('session-notes').value.trim();

  if (topicosSelecionadosLocalmente.length === 0) {
    alert("Selecione pelo menos um assunto concluído para salvar a sessão.");
    return;
  }

  const sessaoDTO = {
    materiaId: parseInt(matId),
    topicosConcluidosIds: topicosSelecionadosLocalmente,
    anotacoes: notes
  };

  try {
    const res = await fetch(`${API_URL}/api/sessoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessaoDTO)
    });

    if (res.ok) {
      document.getElementById('session-notes').value = '';
      const notesEl = document.getElementById('session-notes');
      if (notesEl) autoGrowNotes(notesEl); // Reseta a altura do caderno

      topicosSelecionadosLocalmente = [];

      await loadSessionTopics();
      await renderHistoricoSessaoHoje();
      renderDashboard();
    } else {
      alert("Erro ao salvar sessão no servidor Java.");
    }
  } catch (error) {
    console.error("Erro ao salvar sessão:", error);
    alert("Erro de conexão com o servidor.");
  }
}

// ─── QUESTÕES & POMODORO ──────────────────────────────────────────────────────
function openAddQuestion() {
  document.getElementById('question-panel').style.display = 'block';
}

function closeQuestionPanel() {
  document.getElementById('question-panel').style.display = 'none';
}

function renderQuestoes() {
  state.questions = JSON.parse(localStorage.getItem('studyos_v2_questions') || '[]');
}

const POMO_MODES = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };
let pomoTimer = null;
let pomoSeconds = 25 * 60;

function updatePomoDisplay() {
  const m = String(Math.floor(pomoSeconds / 60)).padStart(2, '0');
  const s = String(pomoSeconds % 60).padStart(2, '0');
  const disp = document.getElementById('pomo-display');
  if (disp) disp.textContent = `${m}:${s}`;
}

// ─── INIT & LISTENERS ─────────────────────────────────────────────────────────
document.getElementById('dash-date').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
document.getElementById('hoje-date').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

// Escuta a digitação no caderno para expandir a altura automaticamente enquanto digita
const notesInput = document.getElementById('session-notes');
if (notesInput) {
  notesInput.addEventListener('input', function () {
    autoGrowNotes(this);
  });
}

renderDashboard();
updatePomoDisplay();