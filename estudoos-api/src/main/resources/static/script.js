// ─── CONFIGURAÇÃO DA API ──────────────────────────────────────────────────────
const API_URL = ''; // Como as telas estão na pasta static, a URL é relativa

// ─── CORES ───────────────────────────────────────────────────────────────────
const COLORS = ['#6c7bff', '#34d399', '#fbbf24', '#f87171', '#c084fc', '#2dd4bf', '#fb7185', '#60a5fa', '#a3e635', '#f97316'];

// ─── STATE LOCAL ─────────────────────────────────────────────────────────────
let state = { materias: [], sessions: [], reviews: [], questions: [] };
let topicosSelecionadosLocalmente = []; // Controla os checks clicados na sessão de hoje
let revisaoAtiva = null; // 🟢 Guarda os dados da revisão histórica selecionada
let sessaoSendoEditadaId = null; // 🟢 Controla qual sessão do histórico está carregada no caderno

// ─── NAVEGAÇÃO ───────────────────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  const pages = ['dashboard', 'materias', 'hoje', 'revisao', 'questoes', 'pomodoro'];
  const idx = pages.indexOf(id);
  document.querySelectorAll('.tab')[idx]?.classList.add('active');

  // 🟢 Se o usuário navegou clicando manualmente nas abas, desativa o modo revisão
  if (id !== 'hoje') {
    revisaoAtiva = null;
  }

  if (id === 'dashboard') renderDashboard();
  if (id === 'materias') renderMaterias();
  if (id === 'hoje') renderHoje();
  if (id === 'revisao') renderRevisao();
  if (id === 'questoes') renderQuestoes();
}

// ─── FUNÇÃO DE TOOGLE (ABRIR/FECHAR SANFONA) ──────────────────────────────────
function toggleTopics(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

// ─── DATAS (Fuso Horário Local) ──────────────────────────────────────────────
function today() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}
function dateStr(d) { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

// ─── DASHBOARD (PAINEL PRINCIPAL) ─────────────────────────────────────────────
async function renderDashboard() {
  document.getElementById('dash-date').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

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
        if (estaConcluido) {
          studied++;
        }
      });
    });

    const correct = state.questions.filter(q => q.result === 'correct').length;
    const total = state.questions.filter(q => q.result).length;
    const rate = total ? Math.round(correct / total * 100) + '%' : '—';

    document.getElementById('dash-studied').textContent = studied;
    document.getElementById('dash-correct').textContent = correct;
    document.getElementById('dash-rate').textContent = rate;
    document.getElementById('dash-reviews').textContent = revisoesHoje.length;

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

    const cal = document.getElementById('dash-calendar');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    document.getElementById('cal-title').textContent = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());

    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const todayStr = today();
    const headers = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    const datasLimpasDoBanco = diasEstudadosNoBanco.map(d => d ? d.substring(0, 10) : '');

    let html = `<div class="cal-grid" style="margin-bottom:6px;">${headers.map(h => `<div style="text-align:center;font-size:10px;color:var(--muted);padding:4px 0;">${h}</div>`).join('')}</div><div class="cal-grid">`;

    for (let i = 0; i < first; i++) html += `<div class="cal-day empty"></div>`;

    for (let d = 1; d <= days; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = ds === todayStr;
      const foiEstudado = datasLimpasDoBanco.includes(ds);

      let cls = 'cal-day';
      if (isToday) {
        cls += ' today';
      } else if (foiEstudado) {
        cls += ' studied';
      }

      html += `<div class="${cls}"><span class="cal-day-num">${d}</span></div>`;
    }
    html += '</div>';
    cal.innerHTML = html;

  } catch (error) {
    console.error("Erro ao carregar o Dashboard:", error);
  }
}

// ─── MATÉRIAS & ASSUNTOS ──────────────────────────────────────────────────────
function openAddMateria() {
  document.getElementById('materias-panel').style.display = 'block';
  document.getElementById('mat-name').value = '';
  document.getElementById('mat-topics').value = '';
  document.getElementById('mat-name').focus();
}
function closeMateriaPanel() { document.getElementById('materias-panel').style.display = 'none'; }

async function saveMateria() {
  const name = document.getElementById('mat-name').value.trim();
  const topicsRaw = document.getElementById('mat-topics').value;
  if (!name) { alert('Informe o nome da matéria.'); return; }

  const listaProcessada = topicsRaw.split('\n').map(t => t.trim()).filter(Boolean);
  const corSelecionada = COLORS[state.materias.length % COLORS.length];

  const materiaDTO = {
    nome: name,
    topicos: listaProcessada,
    cor: corSelecionada
  };

  try {
    const res = await fetch(`${API_URL}/api/materias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(materiaDTO)
    });

    if (res.ok) {
      closeMateriaPanel();
      renderMaterias();
    } else {
      alert("Falha ao salvar a matéria no banco de dados.");
    }
  } catch (error) {
    console.error("Erro ao conectar com a API:", error);
  }
}

async function renderMaterias() {
  const el = document.getElementById('materias-list');
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
      const done = listaTopicos.filter(t =>
        t.concluido === true ||
        t.concluido === 'true' ||
        t.done === true
      ).length;

      const tot = listaTopicos.length;
      const pct = tot ? Math.round(done / tot * 100) : 0;
      const color = m.cor || COLORS[i % COLORS.length];

      return `<div>
        <div class="subject-row" onclick="toggleTopics('tops-${m.id}')">
          <div class="subject-dot" style="background:${color};box-shadow:0 0 8px ${color}55;"></div>
          <div class="subject-name">${m.nome}</div>
          <div class="subject-topics">${done}/${tot} assuntos</div>
          <div style="width:80px;"><div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${color};"></div></div></div>
          <span style="font-size:12px;font-family:var(--mono);color:var(--muted);">${pct}%</span>
          <button class="btn sm danger" onclick="event.stopPropagation();deleteMateria('${m.id}')">✕</button>
        </div>
        
        <div id="tops-${m.id}" style="display:none;padding:.4rem 0 .4rem 1.5rem;">
          ${listaTopicos.length ? listaTopicos.map(t => {
        const jaConcluido = t.concluido === true ||
          t.concluido === 'true' ||
          t.done === true;

        return `
            <div class="topic-row">
              <div class="topic-check ${jaConcluido ? 'checked' : ''}" style="pointer-events: none;"></div>
              <div class="topic-name ${jaConcluido ? 'done' : ''}">${t.nome}</div>
              ${jaConcluido && (t.dataConclusao || t.doneDate) ? `<span style="font-size:11px;color:var(--muted);">${dateStr(t.dataConclusao || t.doneDate)}</span>` : ''}
            </div>`;
      }).join('') : '<div style="font-size:13px;color:var(--muted);padding:.5rem .9rem;">Nenhum assunto cadastrado</div>'}
        </div>
      </div>`;
    }).join('');
  } catch (error) {
    console.error("Erro ao listar matérias:", error);
  }
}

async function deleteMateria(id) {
  if (!confirm('Remover matéria e todos os dados associados?')) return;
  try {
    const res = await fetch(`${API_URL}/api/materias/${id}`, { method: 'DELETE' });
    if (res.ok) {
      renderMaterias();
    }
  } catch (error) {
    console.error("Erro ao excluir:", error);
  }
}

// ─── REVISÃO ESPAÇADA (FILA ORDENADA LIMITADA A 10) ───────────────────────────
async function renderRevisao() {
  const el = document.getElementById('review-list');
  try {
    if (!state.materias || state.materias.length === 0) {
      const resMat = await fetch(`${API_URL}/api/materias`);
      state.materias = await resMat.json();
    }

    const [resHoje, resStats] = await Promise.all([
      fetch(`${API_URL}/api/revisoes/hoje`),
      fetch(`${API_URL}/api/revisoes/estatisticas`)
    ]);

    const revisoesFila = await resHoje.json();
    const stats = await resStats.json();

    const cardHoje = document.getElementById('rev-today');
    const cardSemana = document.getElementById('rev-week');
    const cardFeitas = document.getElementById('rev-done');

    if (cardHoje) cardHoje.textContent = stats.hoje ?? 0;
    if (cardSemana) cardSemana.textContent = stats.proximos7Dias ?? 0;
    if (cardFeitas) cardFeitas.textContent = stats.feitas ?? 0;

    if (!revisoesFila.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">🔁</div>Nenhuma revisão agendada no sistema!</div>';
      return;
    }

    const stageColors = ['#f87171', '#fbbf24', '#60a5fa', '#34d399'];
    const hojeStr = new Date().toISOString().split('T')[0];

    el.innerHTML = revisoesFila.map(r => {
      const stage = r.etapa || 1;
      const idRevisao = r.id;
      const topico = r.nomeTopico || "Sem Assunto";
      const materia = r.nomeMateria || "Sem Matéria";
      const cor = r.corMateria || "#6b7280";
      const dataAgendadaStr = r.dataAgendada;

      const materiaId = r.materiaId || (state.materias.find(m => m.nome.toLowerCase() === materia.toLowerCase())?.id || "");

      const intervalo = stage === 1 ? 1 : stage === 2 ? 7 : stage === 3 ? 15 : 30;
      const isDue = dataAgendadaStr <= hojeStr;

      const partesData = dataAgendadaStr.split('-');
      const dataFormatada = partesData.length === 3 ? `${partesData[2]}/${partesData[1]}` : dataAgendadaStr;

      const badgeHTML = isDue
        ? `<span class="badge due" style="background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); font-size: 11px; padding: 4px 8px; border-radius: 4px; font-weight: 600; white-space: nowrap;">REVISAR HOJE</span>`
        : `<span class="badge future" style="background: rgba(107, 114, 128, 0.15); color: #9ca3af; border: 1px solid rgba(107, 114, 128, 0.3); font-size: 11px; padding: 4px 8px; border-radius: 4px; font-weight: 600; white-space: nowrap;">AGENDADA: ${dataFormatada}</span>`;

      const botaoHTML = isDue
        ? `<button class="btn sm primary" onclick="doneReview('${idRevisao}')">✓ Feita</button>`
        : `<button class="btn sm" disabled style="opacity: 0.4; cursor: not-allowed; background: var(--surface3); color: var(--muted); border: 1px solid var(--border-color);">Aguardando</button>`;

      return `<div class="review-card" onclick="irParaSessaoDeRevisao('${materiaId}', '${topico}')" style="${!isDue ? 'opacity: 0.85;' : ''} cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--surface2); border: 1px solid var(--border-color); border-radius: var(--radius); margin-bottom: 0.5rem;">
        <div style="display: flex; gap: 1rem; align-items: center; pointer-events: none;">
          <div class="review-icon" style="background:${stageColors[(stage - 1) % 4]}22; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius);">
            <span style="font-size:14px;font-weight:700;color:${stageColors[(stage - 1) % 4]};">${stage}ª</span>
          </div>
          <div class="review-info">
            <div class="review-title" style="font-size: 14px; font-weight: 600; color: var(--text-primary); text-align: left;">${topico}</div>
            <div class="review-sub" style="font-size: 12px; color: var(--text-secondary); margin-top: 2px; text-align: left;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${cor}; margin-right: 4px;"></span>
              ${materia} · revisão ${stage} de 4 (intervalo: ${intervalo} dias)
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;" onclick="event.stopPropagation();">
          ${badgeHTML}
          ${botaoHTML}
        </div>
      </div>`;
    }).join('');
  } catch (error) {
    console.error("Erro ao listar revisões:", error);
  }
}

// ─── SESSÃO DE REVISÃO / HOJE ──────────────────────────────────────────────────
async function renderHoje() {
  const tituloPagina = document.querySelector('#page-hoje h2');
  const subtituloData = document.getElementById('hoje-date');
  const sel = document.getElementById('session-mat');
  const btnSalvar = document.querySelector('#page-hoje .btn.primary');
  const cur = sel.value;

  try {
    const res = await fetch(`${API_URL}/api/materias`);
    state.materias = await res.json();

    sel.innerHTML = '<option value="">Selecionar matéria...</option>' +
      state.materias.map(m => `<option value="${m.id}" ${m.id == cur ? 'selected' : ''}>${m.nome}</option>`).join('');

    // 🟢 MODO REVISÃO HISTÓRICA ATIVO
    if (revisaoAtiva) {
      if (tituloPagina) tituloPagina.textContent = "SESSÃO DE REVISÃO";

      // 📅 Exibe a data real da sessão formatada no padrão brasileiro (DD/MM/YYYY)
      if (subtituloData && revisaoAtiva.dataSessao) {
        const partes = revisaoAtiva.dataSessao.split('-');
        const dataFormatada = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : revisaoAtiva.dataSessao;
        subtituloData.textContent = `Sessão realizada em: ${dataFormatada}`;
      }

      // 🔄 Transforma o botão salvar em "Concluir Revisão"
      if (btnSalvar) {
        btnSalvar.innerHTML = '💾 Concluir revisão';
        btnSalvar.onclick = concluirRevisaoDaFila;
      }

      // Bloqueia e preenche os campos para visualização
      sel.value = revisaoAtiva.materiaId;
      document.getElementById('session-notes').value = revisaoAtiva.anotacoes || '';
      autoGrow(document.getElementById('session-notes'));

      await loadSessionTopicsRevisao(revisaoAtiva.topicosConcluidosIds);
      renderHistoricoSessaoUnica(revisaoAtiva); // 🚀 Chama o design limpo para o card ativo!

    } else {
      // 🟢 MODO HOJE TRADICIONAL
      if (tituloPagina) tituloPagina.textContent = "SESSÃO DE HOJE";
      if (subtituloData) {
        subtituloData.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
      }

      // Voltar o botão para o estado original de salvar sessão
      if (btnSalvar) {
        btnSalvar.innerHTML = '💾 Salvar sessão';
        btnSalvar.onclick = saveSession;
      }

      loadSessionTopics();
      renderHistoricoSessaoHoje();
    }

  } catch (error) {
    console.error("Erro na aba hoje:", error);
  }
}

async function loadSessionTopics() {
  const matId = document.getElementById('session-mat').value;
  const el = document.getElementById('session-topics-list');
  if (!matId) { el.innerHTML = '<div class="empty"><div class="empty-icon">📖</div>Selecione uma matéria acima</div>'; return; }

  try {
    const res = await fetch(`${API_URL}/api/topicos/materia/${matId}`);
    const topicos = await res.json();

    if (!topicos.length) { el.innerHTML = '<div class="empty">Nenhum assunto cadastrado nesta matéria</div>'; return; }

    el.innerHTML = topicos.map(t => {
      const idNum = parseInt(t.id);
      const jaConcluido = t.concluido === true || t.concluido === 'true' || t.done === true;
      const estaMarcadoLocalmente = topicosSelecionadosLocalmente.includes(idNum);

      return `
      <div class="topic-row">
        <div class="topic-check ${jaConcluido || estaMarcadoLocalmente ? 'checked' : ''}" 
             id="check-${t.id}" 
             onclick="${jaConcluido ? '' : `toggleTopicLocal('${t.id}')`}"></div>
        <div class="topic-name ${jaConcluido || estaMarcadoLocalmente ? 'done' : ''}" id="name-${t.id}">${t.nome}</div>
        ${jaConcluido && (t.dataConclusao || t.doneDate) ? `<span style="font-size:11px;color:var(--muted);">${dateStr(t.dataConclusao || t.doneDate)}</span>` : ''}
      </div>`;
    }).join('');
  } catch (error) {
    console.error("Erro ao carregar tópicos:", error);
  }
}

function toggleTopicLocal(topicId) {
  const checkEl = document.getElementById(`check-${topicId}`);
  const nameEl = document.getElementById(`name-${topicId}`);
  const idNum = parseInt(topicId);

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

async function saveSession() {
  const matId = document.getElementById('session-mat').value;
  if (!matId) { alert('Selecione uma matéria.'); return; }
  const notes = document.getElementById('session-notes').value.trim();

  if (sessaoSendoEditadaId !== null) {
    try {
      const res = await fetch(`${API_URL}/api/sessoes/${sessaoSendoEditadaId}/anotacoes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: notes
      });

      if (res.ok) {
        alert("Caderno updated com sucesso! 📝");
        sessaoSendoEditadaId = null;
        document.getElementById('session-notes').value = '';
        const btnSalvar = document.querySelector('#page-hoje .btn.primary');
        if (btnSalvar) btnSalvar.innerHTML = '💾 Salvar sessão';
        renderHoje();
      } else {
        alert("Erro ao atualizar o caderno no servidor.");
      }
    } catch (error) {
      console.error("Erro ao editar notas da sessão:", error);
    }
    return;
  }

  if (topicosSelecionadosLocalmente.length === 0) {
    alert("Selecione pelo menos um tópico concluído para salvar a sessão.");
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
      topicosSelecionadosLocalmente = [];
      renderDashboard();
      renderHoje();
    } else {
      alert("Erro ao salvar sessão no banco. Verifique os logs do seu Spring Boot!");
    }
  } catch (error) {
    console.error("Erro ao salvar sessão:", error);
  }
}

// ─── FUNÇÕES AUXILIARES DE REVISÃO HISTÓRICA ──────────────────────────────────
async function loadSessionTopicsRevisao(topicosIdsConcluidos) {
  const matId = document.getElementById('session-mat').value;
  const el = document.getElementById('session-topics-list');
  if (!matId) return;

  try {
    const res = await fetch(`${API_URL}/api/topicos/materia/${matId}`);
    const topicos = await res.json();

    el.innerHTML = topicos.map(t => {
      const idNum = parseInt(t.id);
      const foiConcluidoNaSessao = topicosIdsConcluidos ? topicosIdsConcluidos.includes(idNum) : false;

      return `
      <div class="topic-row" style="opacity: ${foiConcluidoNaSessao ? '1' : '0.5'};">
        <div class="topic-check ${foiConcluidoNaSessao ? 'checked' : ''}" style="pointer-events: none;"></div>
        <div class="topic-name ${foiConcluidoNaSessao ? 'done' : ''}">${t.nome}</div>
      </div>`;
    }).join('');
  } catch (error) {
    console.error("Erro ao carregar tópicos de revisão:", error);
  }
}

// 🟢 FUNÇÃO CORRIGIDA: Mesma estrutura vertical limpa (Sem a linha do bloco de notas)
function renderHistoricoSessaoUnica(sessao) {
  const container = document.getElementById('session-history');
  if (!container) return;

  const materia = state.materias.find(m => m.id == sessao.materiaId);
  const nomeMateria = materia ? materia.nome : 'Matéria';

  const topicosHtml = sessao.topicosNomes && sessao.topicosNomes.length > 0
    ? sessao.topicosNomes.map(nome => `<span class="badge warn" style="font-size: 11px; width: fit-content;">${nome}</span>`).join('')
    : `<span class="badge warn" style="font-size: 11px; width: fit-content;">Focando no assunto agendado</span>`;

  const partes = sessao.dataSessao.split('-');
  const dataFormatada = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : sessao.dataSessao;

  container.innerHTML = `
    <div class="review-card" style="border: 1px solid var(--accent); background: var(--surface2); width: 100%; padding: 0.85rem;">
      <div class="review-info" style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="text-muted" style="font-size: 12px;">📅 ${dataFormatada}</span>
          <strong class="subject-name" style="font-size: 14px; color: var(--accent);">${nomeMateria} (Visualizando)</strong>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
          ${topicosHtml}
        </div>
      </div>
    </div>
  `;
}

async function renderHistoricoSessaoHoje() {
  const container = document.getElementById('session-history');
  if (!container) return;

  try {
    const res = await fetch(`${API_URL}/api/sessoes`);
    const sessoes = await res.json();

    if (!sessoes || sessoes.length === 0) {
      container.innerHTML = `
        <div class="empty">
          <div class="empty-icon">📂</div>
          <p>Nenhuma sessão registrada por enquanto.</p>
        </div>`;
      return;
    }

    const sessoesInvertidas = [...sessoes].reverse();

    container.innerHTML = sessoesInvertidas.map(sessao => {
      const materia = state.materias.find(m => m.id == sessao.materiaId);
      const nomeMateria = materia ? materia.nome : 'Matéria';

      const topicosHtml = sessao.topicosNomes && sessao.topicosNomes.length > 0
        ? sessao.topicosNomes.map(nome => `<span class="badge warn" style="font-size: 11px; width: fit-content;">${nome}</span>`).join('')
        : '<span class="text-muted" style="font-size: 11px;">Nenhum assunto selecionado</span>';

      const partes = sessao.dataSessao.split('-');
      const dataFormatada = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : sessao.dataSessao;

      return `
        <div class="review-card" 
             onclick="reabrirSessaoNoCaderno(${JSON.stringify(sessao).replace(/"/g, '&quot;')})"
             style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; width: 100%; cursor: pointer;">
          <div class="review-info" style="pointer-events: none; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="text-muted" style="font-size: 12px;">📅 ${dataFormatada}</span>
              <strong class="subject-name" style="font-size: 14px; color: var(--text);">${nomeMateria}</strong>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${topicosHtml}
            </div>
          </div>
          <button class="btn danger sm" onclick="event.stopPropagation(); deletarSessaoHistorico(${sessao.id})" style="padding: 0.35rem 0.6rem; margin-left: 10px; z-index: 10;">✕</button>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error("Erro ao carregar histórico de sessões:", error);
    container.innerHTML = '<div class="empty">Erro ao carregar histórico</div>';
  }
}

function reabrirSessaoNoCaderno(sessao) {
  if (!sessao) return;
  sessaoSendoEditadaId = sessao.id;

  const selMateria = document.getElementById('session-mat');
  if (selMateria) {
    selMateria.value = sessao.materiaId;
    loadSessionTopics();
  }

  const campoNotas = document.getElementById('session-notes');
  if (campoNotas) {
    campoNotas.value = sessao.anotacoes || '';
    autoGrow(campoNotas);
  }

  const btnSalvar = document.querySelector('#page-hoje .btn.primary');
  if (btnSalvar && !revisaoAtiva) {
    btnSalvar.innerHTML = '🔄 Atualizar caderno';
  }
}

async function irParaSessaoDeRevisao(materiaId, topicoNome) {
  if (!materiaId) return;

  try {
    const res = await fetch(`${API_URL}/api/sessoes/revisar/${materiaId}`);
    if (res.ok) {
      revisaoAtiva = await res.json();
      showPage('hoje');
    } else {
      alert("Nenhuma sessão de estudos salva encontrada para essa matéria!");
    }
  } catch (error) {
    console.error("Erro ao carregar sessão para revisão:", error);
  }
}

// ─── QUESTÕES (Local em localStorage) ──────────────────────────────────────────
let optionCount = 0;

function openAddQuestion() {
  optionCount = 0;
  document.getElementById('question-panel').style.display = 'block';
  const qm = document.getElementById('q-mat');
  qm.innerHTML = state.materias.map(m => `<option value="${m.id}">${m.nome}</option>`).join('');
  updateQTopics();
  document.getElementById('q-text').value = '';
  document.getElementById('q-comment').value = '';
  document.getElementById('q-options-input').innerHTML = '';
  [0, 1, 2, 3].forEach(() => addOption());
}
function closeQuestionPanel() { document.getElementById('question-panel').style.display = 'none'; }

function updateQTopics() {
  const matId = document.getElementById('q-mat').value;
  const m = state.materias.find(x => x.id == matId);
  const lista = m ? (m.topicos || m.assuntos || m.topico || []) : [];
  document.getElementById('q-topic').innerHTML = m && lista.length
    ? lista.map(t => `<option value="${t.id}">${t.nome}</option>`).join('')
    : '<option value="">Sem assuntos</option>';
}

function addOption() {
  const container = document.getElementById('q-options-input');
  const idx = optionCount++;
  const label = String.fromCharCode(65 + idx);
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:.4rem;align-items:center;margin-bottom:.4rem;';
  div.innerHTML = `
    <input type="radio" name="correct-opt" value="${idx}" style="width:auto;flex-shrink:0;accent-color:var(--accent);" title="Marcar como correta">
    <input placeholder="Alternativa ${label}" id="opt-${idx}" style="flex:1;">
    <button class="btn sm" onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(div);
}

function saveQuestion() {
  const matId = document.getElementById('q-mat').value;
  const topicId = document.getElementById('q-topic').value;
  const text = document.getElementById('q-text').value.trim();
  if (!text) { alert('Escreva o enunciado da questão.'); return; }
  const m = state.materias.find(x => x.id == matId);
  const lista = m ? (m.topicos || m.assuntos || m.topico || []) : [];
  const t = lista.find(x => x.id == topicId);
  let correctIdx = -1;
  document.querySelectorAll('input[name="correct-opt"]').forEach(r => { if (r.checked) correctIdx = parseInt(r.value); });
  const options = [];
  let li = 0;
  document.querySelectorAll('[id^="opt-"]').forEach(inp => {
    if (inp.value.trim()) options.push({ label: String.fromCharCode(65 + li++), text: inp.value.trim() });
  });
  if (options.length && correctIdx < 0) { alert('Marque a alternativa correta.'); return; }

  state.questions.push({
    id: Date.now() + '',
    matId, matName: m?.nome || '',
    topicId, topicName: t?.nome || '',
    text, options, correctIdx,
    comment: document.getElementById('q-comment').value.trim(),
    result: null, answeredIdx: null
  });
  localStorage.setItem('studyos_v2_questions', JSON.stringify(state.questions));
  closeQuestionPanel();
  renderQuestoes();
}

function renderQuestoes() {
  const filterMat = document.getElementById('filter-mat').value;
  const filterRes = document.getElementById('filter-result').value;

  const fm = document.getElementById('filter-mat');
  const cur = fm.value;
  fm.innerHTML = '<option value="">Todas as matérias</option>' +
    state.materias.map(m => `<option value="${m.id}" ${m.id == cur ? 'selected' : ''}>${m.nome}</option>`).join('');

  state.questions = JSON.parse(localStorage.getItem('studyos_v2_questions') || '[]');

  let qs = [...state.questions];
  if (filterMat) qs = qs.filter(q => q.matId == filterMat);
  if (filterRes === 'correct') qs = qs.filter(q => q.result === 'correct');
  else if (filterRes === 'wrong') qs = qs.filter(q => q.result === 'wrong');
  else if (filterRes === 'pending') qs = qs.filter(q => !q.result);

  const el = document.getElementById('questions-list');
  if (!qs.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">✏️</div>Nenhuma questão aqui</div>'; return; }

  el.innerHTML = qs.map(q => {
    const rColor = q.result === 'correct' ? 'var(--green)' : q.result === 'wrong' ? 'var(--red)' : 'var(--muted)';
    const rIcon = q.result === 'correct' ? '✓' : q.result === 'wrong' ? '✗' : '—';
    return `<div class="card" style="margin-bottom:.75rem;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.75rem;gap:.5rem;flex-wrap:wrap;">
        <div>
          <span style="font-size:11px;color:var(--muted);">${q.matName}</span>
          ${q.topicName ? `<span style="font-size:11px;color:var(--muted);"> · ${q.topicName}</span>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:.5rem;">
          <span style="font-size:15px;color:${rColor};font-weight:700;">${rIcon}</span>
          <button class="btn sm" onclick="resetQ('${q.id}')" ${!q.result ? 'disabled' : ''} style="${!q.result ? 'opacity:.3;' : ''}" title="Tentar novamente">↺</button>
          <button class="btn sm danger" onclick="deleteQuestion('${q.id}')">✕</button>
        </div>
      </div>
      <div style="font-size:14px;margin-bottom:.75rem;line-height:1.6;">${q.text}</div>
      ${q.options.length ? `<div class="q-options">
        ${q.options.map((o, i) => {
      let cls = 'q-option';
      if (q.answeredIdx !== null) {
        if (i === q.correctIdx) cls += ' correct';
        else if (i === q.answeredIdx) cls += ' wrong';
      }
      return `<div class="${cls}" onclick="answerQ('${q.id}',${i})"><strong>${o.label}</strong> ${o.text}</div>`;
    }).join('')}
      </div>` : `
        ${q.result === null ? `<div style="display:flex;gap:.5rem;margin-top:.5rem;">
          <button class="btn sm primary" onclick="markQ('${q.id}','correct')">✓ Acertei</button>
          <button class="btn sm danger" onclick="markQ('${q.id}','wrong')">✗ Errei</button>
        </div>` : ''}`}
      ${q.answeredIdx !== null && q.comment ? `<div style="font-size:12px;color:var(--muted);background:var(--surface2);padding:.65rem .85rem;border-radius:var(--radius);margin-top:.5rem;line-height:1.5;">💡 ${q.comment}</div>` : ''}
    </div>`;
  }).join('');
}

// ─── CONCLUIR REVISÃO DA FILA ESPAÇADA ─────────────────────────────────────────
async function concluirRevisaoDaFila() {
  if (!revisaoAtiva) return;

  try {
    const resHoje = await fetch(`${API_URL}/api/revisoes/hoje`);
    const revisoesFila = await resHoje.json();

    const revisaoParaConcluir = revisoesFila.find(r => {
      const materiaDoState = state.materias.find(m => m.nome.toLowerCase() === r.nomeMateria.toLowerCase());
      return materiaDoState && materiaDoState.id == revisaoAtiva.materiaId;
    });

    if (!revisaoParaConcluir) {
      alert("Não foi possível localizar essa revisão ativa na fila!");
      return;
    }

    const res = await fetch(`${API_URL}/api/revisoes/${revisaoParaConcluir.id}/concluir`, {
      method: 'PUT'
    });

    if (res.ok) {
      alert("Revisão concluída com sucesso! 🚀");
      revisaoAtiva = null;
      document.getElementById('session-notes').value = '';

      await renderDashboard();
      await renderRevisao();

      showPage('revisao');
    } else {
      alert("Erro ao concluir a revisão no backend.");
    }

  } catch (error) {
    console.error("Erro ao concluir a revisão:", error);
  }
}

// ─── EXCLUSÃO DA SESSÃO DE ESTUDOS NO BANCO ────────────────────────────────────
async function deletarSessaoHistorico(idSessao) {
  if (!confirm("Tem certeza que deseja apagar este resumo e reverter o progresso dos assuntos? 🛑")) return;

  try {
    const res = await fetch(`${API_URL}/api/sessoes/${idSessao}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      await renderDashboard();
      await renderHoje();
      await renderMaterias();
    } else {
      alert("Erro ao tentar excluir a sessão no servidor.");
    }
  } catch (error) {
    console.error("Erro na exclusão da sessão:", error);
  }
}

// ─── POMODORO (Local) ─────────────────────────────────────────────────────────
const POMO_MODES = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };
const POMO_LABELS = { work: 'FOCO', short: 'PAUSA', long: 'LONGA' };
const TECHNIQUE_TIPS = {
  'Resumo Ativo': 'Leia o material, depois feche e escreva os pontos principais com suas palavras. Repita até conseguir reproduzir sem olhar.',
  'Mapa Mental': 'Coloque o tema central no meio e ramifique os subtópicos. Use cores e ícones. Conecte conceitos relacionados com setas.',
  'Questões de Prova': 'Resolva questões de provas anteriores do concurso. Anote padrões de cobrança e revise os erros com atenção.',
  'Flashcards Anki': 'Crie cards com pergunta na frente e resposta atrás. Foque em conceitos, fórmulas e definitions. Revise diariamente.',
  'Leitura Focada': 'Leia sem sublinhar primeiro. Na segunda leitura, destaque apenas o essencial. Na terceira, anote dúvidas.',
  'Produção Textual': 'Escolha um tema, esboce a estrutura (introdução, desenvolvimento, conclusão) e escreva sem parar. Revise depois.'
};

let pomoTimer = null;
let pomoSeconds = 25 * 60;
let pomoMode = 'work';
let pomoRunning = false;
let pomoCount = parseInt(localStorage.getItem('pomoCount') || '0');
let lastPomoDate = localStorage.getItem('pomoDate') || '';
if (lastPomoDate !== today()) { pomoCount = 0; localStorage.setItem('pomoDate', today()); localStorage.setItem('pomoCount', '0'); }

function setPomoMode(mode) {
  if (pomoRunning) return;
  pomoMode = mode;
  pomoSeconds = POMO_MODES[mode];
  document.querySelectorAll('[id^="pomo-mode-"]').forEach(b => b.style.borderColor = '');
  document.getElementById('pomo-mode-' + mode).style.borderColor = 'var(--accent)';
  document.getElementById('pomo-mode-' + mode).style.color = 'var(--accent)';
  updatePomoDisplay();
}

function togglePomo() {
  pomoRunning = !pomoRunning;
  document.getElementById('pomo-btn').textContent = pomoRunning ? '⏸ Pausar' : '▶ Retomar';
  if (pomoRunning) {
    pomoTimer = setInterval(() => {
      pomoSeconds--;
      updatePomoDisplay();
      if (pomoSeconds <= 0) {
        clearInterval(pomoTimer);
        pomoRunning = false;
        document.getElementById('pomo-btn').textContent = '▶ Iniciar';
        if (pomoMode === 'work') {
          pomoCount++;
          localStorage.setItem('pomoCount', pomoCount);
          document.getElementById('pomo-count').textContent = pomoCount;
        }
        if (Notification.permission === 'granted') {
          new Notification('StudyOS', { body: pomoMode === 'work' ? '✓ Pomodoro completo! Hora da pausa.' : '▶ Pausa concluída! Volte ao foco.', icon: '' });
        }
        alert(pomoMode === 'work' ? '🎯 Pomodoro completo! Hora de descansar.' : '✅ Pausa encerrada! Volte ao foco.');
        setPomoMode(pomoMode === 'work' ? 'short' : 'work');
      }
    }, 1000);
  } else {
    clearInterval(pomoTimer);
  }
}

function resetPomo() {
  clearInterval(pomoTimer);
  pomoRunning = false;
  pomoSeconds = POMO_MODES[pomoMode];
  document.getElementById('pomo-btn').textContent = '▶ Iniciar';
  updatePomoDisplay();
}

function updatePomoDisplay() {
  const m = String(Math.floor(pomoSeconds / 60)).padStart(2, '0');
  const s = String(pomoSeconds % 60).padStart(2, '0');
  document.getElementById('pomo-display').textContent = `${m}:${s}`;
  document.getElementById('pomo-label').textContent = POMO_LABELS[pomoMode];
  document.getElementById('pomo-count').textContent = pomoCount;
  const pct = 1 - (pomoSeconds / POMO_MODES[pomoMode]);
  const color = pomoMode === 'work' ? 'var(--accent)' : pomoMode === 'short' ? 'var(--green)' : 'var(--amber)';
  document.getElementById('pomo-circle').style.borderColor = `color-mix(in srgb, ${color} ${Math.round(pct * 100)}%, var(--surface3))`;
}

document.getElementById('pomo-technique').addEventListener('change', function () {
  document.getElementById('technique-tip').textContent = TECHNIQUE_TIPS[this.value] || '';
});

if (Notification.permission === 'default') Notification.requestPermission();

function autoGrow(element) {
  element.style.height = "auto";
  element.style.height = (element.scrollHeight) + "px";
}

function resetNotes() {
  const notes = document.getElementById('session-notes');
  if (notes) {
    notes.value = '';
    notes.style.height = '180px';
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.getElementById('dash-date').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
document.getElementById('hoje-date').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
renderDashboard();
updatePomoDisplay();