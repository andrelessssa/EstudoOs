// ─── CONFIGURAÇÃO DA API ──────────────────────────────────────────────────────
const API_URL = ''; // Como as telas estão na pasta static, a URL é relativa

// ─── CORES ───────────────────────────────────────────────────────────────────
const COLORS = ['#6c7bff','#34d399','#fbbf24','#f87171','#c084fc','#2dd4bf','#fb7185','#60a5fa','#a3e635','#f97316'];

// ─── STATE LOCAL ─────────────────────────────────────────────────────────────
let state = { materias: [], sessions: [], reviews: [], questions: [] };
let topicosSelecionadosLocalmente = []; // Controla os checks clicados na sessão de hoje

// ─── NAVEGAÇÃO ───────────────────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  const pages = ['dashboard','materias','hoje','revisao','questoes','pomodoro'];
  const idx = pages.indexOf(id);
  document.querySelectorAll('.tab')[idx]?.classList.add('active');
  
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
function dateStr(d) { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'}); }

// ─── DASHBOARD (PAINEL PRINCIPAL) ─────────────────────────────────────────────
async function renderDashboard() {
  document.getElementById('dash-date').textContent = new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  
  try {
    const resMat = await fetch(`${API_URL}/api/materias`);
    state.materias = await resMat.json();

    const resRev = await fetch(`${API_URL}/api/revisoes/hoje`);
    const revisoesHoje = await resRev.json();

    const concluidosLocais = JSON.parse(localStorage.getItem('studyos_v2_concluidos_local') || '[]');

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
        const estaConcluido = t.concluido === true || t.concluido === 'true' || t.done === true || concluidosLocais.includes(parseInt(t.id));
        if(estaConcluido) {
          studied++; 
        }
      });
    });
    
    const correct = state.questions.filter(q=>q.result==='correct').length;
    const total = state.questions.filter(q=>q.result).length;
    const rate = total ? Math.round(correct/total*100)+'%' : '—';

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
        const done = lista.filter(t => t.concluido === true || t.concluido === 'true' || t.done === true || concluidosLocais.includes(parseInt(t.id))).length;
        const pct = tot ? Math.round(done/tot*100) : 0;
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
    const year = now.getFullYear(); const month = now.getMonth();
    document.getElementById('cal-title').textContent = now.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^\w/, c=>c.toUpperCase());
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month+1, 0).getDate();
    const todayStr = today();
    const headers = ['D','S','T','Q','Q','S','S'];
    let html = `<div class="cal-grid" style="margin-bottom:6px;">${headers.map(h=>`<div style="text-align:center;font-size:10px;color:var(--muted);padding:4px 0;">${h}</div>`).join('')}</div><div class="cal-grid">`;
    for(let i=0;i<first;i++) html += `<div class="cal-day empty"></div>`;
    for(let d=1;d<=days;d++) {
      const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = ds===todayStr;
      let cls = 'cal-day';
      if(isToday) cls+=' today';
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
  if(!name) { alert('Informe o nome da matéria.'); return; }
  
  const listaProcessada = topicsRaw.split('\n').map(t=>t.trim()).filter(Boolean);
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

    if(!state.materias || !state.materias.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">📘</div>Nenhuma matéria cadastrada ainda</div>';
      return;
    }

    const concluidosLocais = JSON.parse(localStorage.getItem('studyos_v2_concluidos_local') || '[]');

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
        t.done === true ||
        concluidosLocais.includes(parseInt(t.id))
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
                                t.done === true ||
                                concluidosLocais.includes(parseInt(t.id));
            
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
  if(!confirm('Remover matéria e todos os dados associados?')) return;
  try {
    const res = await fetch(`${API_URL}/api/materias/${id}`, { method: 'DELETE' });
    if(res.ok) {
      renderMaterias();
    }
  } catch (error) {
    console.error("Erro ao excluir:", error);
  }
}

// ─── REVISÃO ESPAÇADA ─────────────────────────────────────────────────────────
async function renderRevisao() {
  const el = document.getElementById('review-list');
  try {
    const res = await fetch(`${API_URL}/api/revisoes/hoje`);
    const revisoesHoje = await res.json();

    document.getElementById('rev-today').textContent = revisoesHoje.length;
    document.getElementById('rev-week').textContent = "—"; 
    document.getElementById('rev-done').textContent = "—";

    if(!revisoesHoje.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">🔁</div>Nenhuma revisão pendente para hoje — continue estudando!</div>';
      return;
    }

    const stageColors = ['#f87171','#fbbf24','#60a5fa','#34d399'];
    el.innerHTML = revisoesHoje.map(r => {
      const stage = r.etapa || 1;
      return `<div class="review-card">
        <div class="review-icon" style="background:${stageColors[(stage-1)%4]}22;">
          <span style="font-size:14px;font-weight:700;color:${stageColors[(stage-1)%4]};">${stage}ª</span>
        </div>
        <div class="review-info">
          <div class="review-title">${r.topicoNome}</div>
          <div class="review-sub">${r.materiaNome} · revisão ${stage} de 4 (intervalo: ${r.intervaloDias} dias)</div>
        </div>
        <span class="badge due">REVISAR HOJE</span>
        <button class="btn sm primary" onclick="doneReview('${r.id}')">✓ Feita</button>
      </div>`;
    }).join('');
  } catch (error) {
    console.error("Erro ao listar revisões:", error);
  }
}

async function doneReview(id) {
  try {
    const res = await fetch(`${API_URL}/api/revisoes/${id}/concluir`, { method: 'PUT' });
    if (res.ok) {
      renderRevisao();
    }
  } catch (error) {
    console.error("Erro ao concluir revisão:", error);
  }
}

// ─── SESSÃO DE HOJE ───────────────────────────────────────────────────────────
async function renderHoje() {
  document.getElementById('hoje-date').textContent = new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  const sel = document.getElementById('session-mat');
  const cur = sel.value;

  try {
    const res = await fetch(`${API_URL}/api/materias`);
    state.materias = await res.json();

    sel.innerHTML = '<option value="">Selecionar matéria...</option>' +
      state.materias.map(m=>`<option value="${m.id}" ${m.id==cur?'selected':''}>${m.nome}</option>`).join('');
    
    loadSessionTopics();
    renderHistoricoSessoes();
  } catch (error) {
    console.error("Erro na aba hoje:", error);
  }
}

async function loadSessionTopics() {
  const matId = document.getElementById('session-mat').value;
  const el = document.getElementById('session-topics-list');
  if(!matId) { el.innerHTML='<div class="empty"><div class="empty-icon">📖</div>Selecione uma matéria acima</div>'; return; }
  
  try {
    const res = await fetch(`${API_URL}/api/topicos/materia/${matId}`);
    const topicos = await res.json();

    if(!topicos.length) { el.innerHTML='<div class="empty">Nenhum assunto cadastrado nesta matéria</div>'; return; }
    
    const concluidosLocais = JSON.parse(localStorage.getItem('studyos_v2_concluidos_local') || '[]');

    el.innerHTML = topicos.map(t => {
      const idNum = parseInt(t.id);
      const jaConcluido = t.concluido === true || t.concluido === 'true' || t.done === true || concluidosLocais.includes(idNum);
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
  if(!matId) { alert('Selecione uma matéria.'); return; }
  const notes = document.getElementById('session-notes').value.trim();
  
  if(topicosSelecionadosLocalmente.length === 0) {
    alert("Selecione pelo menos um tópico concluído para salvar a sessão.");
    return;
  }

  const sessaoDTO = {
    materiaId: parseInt(matId),
    topicosIds: topicosSelecionadosLocalmente,
    anotacoes: notes
  };

  try {
    const res = await fetch(`${API_URL}/api/sessoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessaoDTO)
    });

    if (res.ok) {
      // Salva localmente para persistência impecável entre as abas
      const salvosGerais = JSON.parse(localStorage.getItem('studyos_v2_concluidos_local') || '[]');
      topicosSelecionadosLocalmente.forEach(id => {
        if (!salvosGerais.includes(id)) {
          salvosGerais.push(id);
        }
      });
      localStorage.setItem('studyos_v2_concluidos_local', JSON.stringify(salvosGerais));

      document.getElementById('session-notes').value = '';
      
      const materiaSelecionada = state.materias.find(m => m.id == matId);
      const nomesDosTopicos = [];
      
      try {
        const resT = await fetch(`${API_URL}/api/topicos/materia/${matId}`);
        const topicosMat = await resT.json();
        topicosMat.forEach(t => {
          if (topicosSelecionadosLocalmente.includes(parseInt(t.id))) {
            nomesDosTopicos.push(t.nome);
          }
        });
      } catch (e) {
        console.error(e);
      }

      const novaSessaoLocal = {
        id: Date.now() + '',
        dataSessao: today(),
        materiaNome: materiaSelecionada ? materiaSelecionada.nome : "Matéria",
        topicosNomes: nomesDosTopicos,
        anotacoes: notes
      };

      const historicoCache = JSON.parse(localStorage.getItem('studyos_v2_sessions_local') || '[]');
      historicoCache.push(novaSessaoLocal);
      localStorage.setItem('studyos_v2_sessions_local', JSON.stringify(historicoCache));

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

function renderHistoricoSessoes() {
  const hist = document.getElementById('session-history');
  const sessoesLocais = JSON.parse(localStorage.getItem('studyos_v2_sessions_local') || '[]');
  
  if(!sessoesLocais.length) { 
    hist.innerHTML = '<div class="empty"><div class="empty-icon">🗂️</div>Nenhuma sessão registrada</div>'; 
    return; 
  }
  
  const sessoesInvertidas = [...sessoesLocais].reverse();
  hist.innerHTML = sessoesInvertidas.map(s => {
    const topicosList = s.topicosNomes || [];
    return `<div style="padding:.85rem;background:var(--surface2);border-radius:var(--radius);margin-bottom:.4rem;display:flex;gap:.75rem;align-items:flex-start;">
      <div style="font-family:var(--mono);font-size:11px;color:var(--muted);min-width:70px;padding-top:2px;">${dateStr(s.dataSessao)}</div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;color:var(--text);">${s.materiaNome}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px;">${topicosList.join(', ')}</div>
        ${s.anotacoes ? `<div style="font-size:12px;color:var(--text);margin-top:4px;opacity:.7;">📝 ${s.anotacoes}</div>` : ''}
      </div>
      <button class="btn sm danger" onclick="deleteSessionLocal('${s.id}')">✕</button>
    </div>`;
  }).join('');
}

function deleteSessionLocal(id) {
  let sessoesLocais = JSON.parse(localStorage.getItem('studyos_v2_sessions_local') || '[]');
  sessoesLocais = sessoesLocais.filter(s => s.id !== id);
  localStorage.setItem('studyos_v2_sessions_local', JSON.stringify(sessoesLocais));
  renderHoje();
}

// ─── QUESTÕES (Local em localStorage) ──────────────────────────────────────────
let optionCount = 0;

function openAddQuestion() {
  optionCount = 0;
  document.getElementById('question-panel').style.display = 'block';
  const qm = document.getElementById('q-mat');
  qm.innerHTML = state.materias.map(m=>`<option value="${m.id}">${m.nome}</option>`).join('');
  updateQTopics();
  document.getElementById('q-text').value = '';
  document.getElementById('q-comment').value = '';
  document.getElementById('q-options-input').innerHTML = '';
  [0,1,2,3].forEach(() => addOption());
}
function closeQuestionPanel() { document.getElementById('question-panel').style.display = 'none'; }

function updateQTopics() {
  const matId = document.getElementById('q-mat').value;
  const m = state.materias.find(x=>x.id==matId);
  const lista = m ? (m.topicos || m.assuntos || m.topico || []) : [];
  document.getElementById('q-topic').innerHTML = m && lista.length
    ? lista.map(t=>`<option value="${t.id}">${t.nome}</option>`).join('')
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
  if(!text) { alert('Escreva o enunciado da questão.'); return; }
  const m = state.materias.find(x=>x.id==matId);
  const lista = m ? (m.topicos || m.assuntos || m.topico || []) : [];
  const t = lista.find(x=>x.id==topicId);
  let correctIdx = -1;
  document.querySelectorAll('input[name="correct-opt"]').forEach(r => { if(r.checked) correctIdx = parseInt(r.value); });
  const options = [];
  let li = 0;
  document.querySelectorAll('[id^="opt-"]').forEach(inp => {
    if(inp.value.trim()) options.push({ label: String.fromCharCode(65+li++), text: inp.value.trim() });
  });
  if(options.length && correctIdx < 0) { alert('Marque a alternativa correta.'); return; }
  
  state.questions.push({
    id: Date.now()+'',
    matId, matName: m?.nome||'',
    topicId, topicName: t?.nome||'',
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
    state.materias.map(m=>`<option value="${m.id}" ${m.id==cur?'selected':''}>${m.nome}</option>`).join('');

  state.questions = JSON.parse(localStorage.getItem('studyos_v2_questions') || '[]');

  let qs = [...state.questions];
  if(filterMat) qs = qs.filter(q=>q.matId==filterMat);
  if(filterRes==='correct') qs = qs.filter(q=>q.result==='correct');
  else if(filterRes==='wrong') qs = qs.filter(q=>q.result==='wrong');
  else if(filterRes==='pending') qs = qs.filter(q=>!q.result);

  const el = document.getElementById('questions-list');
  if(!qs.length) { el.innerHTML='<div class="empty"><div class="empty-icon">✏️</div>Nenhuma questão aqui</div>'; return; }

  el.innerHTML = qs.map(q => {
    const rColor = q.result==='correct'?'var(--green)':q.result==='wrong'?'var(--red)':'var(--muted)';
    const rIcon = q.result==='correct'?'✓':q.result==='wrong'?'✗':'—';
    return `<div class="card" style="margin-bottom:.75rem;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.75rem;gap:.5rem;flex-wrap:wrap;">
        <div>
          <span style="font-size:11px;color:var(--muted);">${q.matName}</span>
          ${q.topicName?`<span style="font-size:11px;color:var(--muted);"> · ${q.topicName}</span>`:''}
        </div>
        <div style="display:flex;align-items:center;gap:.5rem;">
          <span style="font-size:15px;color:${rColor};font-weight:700;">${rIcon}</span>
          <button class="btn sm" onclick="resetQ('${q.id}')" ${!q.result?'disabled':''} style="${!q.result?'opacity:.3;':''}" title="Tentar novamente">↺</button>
          <button class="btn sm danger" onclick="deleteQuestion('${q.id}')">✕</button>
        </div>
      </div>
      <div style="font-size:14px;margin-bottom:.75rem;line-height:1.6;">${q.text}</div>
      ${q.options.length ? `<div class="q-options">
        ${q.options.map((o,i) => {
          let cls = 'q-option';
          if(q.answeredIdx !== null) {
            if(i === q.correctIdx) cls += ' correct';
            else if(i === q.answeredIdx) cls += ' wrong';
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

function answerQ(qId, idx) {
  const q = state.questions.find(x=>x.id===qId);
  if(q.answeredIdx !== null) return;
  q.answeredIdx = idx;
  q.result = idx === q.correctIdx ? 'correct' : 'wrong';
  localStorage.setItem('studyos_v2_questions', JSON.stringify(state.questions));
  renderQuestoes();
}
function markQ(qId, result) {
  const q = state.questions.find(x=>x.id===qId);
  q.result = result;
  q.answeredIdx = result === 'correct' ? 0 : -1;
  localStorage.setItem('studyos_v2_questions', JSON.stringify(state.questions));
  renderQuestoes();
}
function resetQ(qId) {
  const q = state.questions.find(x=>x.id===qId);
  q.result = null; q.answeredIdx = null;
  localStorage.setItem('studyos_v2_questions', JSON.stringify(state.questions));
  renderQuestoes();
}
function deleteQuestion(id) {
  if(!confirm('Remover esta questão?')) return;
  state.questions = state.questions.filter(q=>q.id!==id);
  localStorage.setItem('studyos_v2_questions', JSON.stringify(state.questions));
  renderQuestoes();
}

// ─── POMODORO (Local) ─────────────────────────────────────────────────────────
const POMO_MODES = { work: 25*60, short: 5*60, long: 15*60 };
const POMO_LABELS = { work: 'FOCO', short: 'PAUSA', long: 'LONGA' };
const TECHNIQUE_TIPS = {
  'Resumo Ativo': 'Leia o material, depois feche e escreva os pontos principais com suas palavras. Repita até conseguir reproduzir sem olhar.',
  'Mapa Mental': 'Coloque o tema central no meio e ramifique os subtópicos. Use cores e ícones. Conecte conceitos relacionados com setas.',
  'Questões de Prova': 'Resolva questões de provas anteriores do concurso. Anote padrões de cobrança e revise os erros com atenção.',
  'Flashcards Anki': 'Crie cards com pergunta na frente e resposta atrás. Foque em conceitos, fórmulas e definições. Revise diariamente.',
  'Leitura Focada': 'Leia sem sublinhar primeiro. Na segunda leitura, destaque apenas o essencial. Na terceira, anote dúvidas.',
  'Produção Textual': 'Escolha um tema, esboce a estrutura (introdução, desenvolvimento, conclusão) e escreva sem parar. Revise depois.'
};

let pomoTimer = null;
let pomoSeconds = 25*60;
let pomoMode = 'work';
let pomoRunning = false;
let pomoCount = parseInt(localStorage.getItem('pomoCount')||'0');
let lastPomoDate = localStorage.getItem('pomoDate')||'';
if(lastPomoDate !== today()) { pomoCount = 0; localStorage.setItem('pomoDate', today()); localStorage.setItem('pomoCount','0'); }

function setPomoMode(mode) {
  if(pomoRunning) return;
  pomoMode = mode;
  pomoSeconds = POMO_MODES[mode];
  document.querySelectorAll('[id^="pomo-mode-"]').forEach(b => b.style.borderColor='');
  document.getElementById('pomo-mode-'+mode).style.borderColor = 'var(--accent)';
  document.getElementById('pomo-mode-'+mode).style.color = 'var(--accent)';
  updatePomoDisplay();
}

function togglePomo() {
  pomoRunning = !pomoRunning;
  document.getElementById('pomo-btn').textContent = pomoRunning ? '⏸ Pausar' : '▶ Retomar';
  if(pomoRunning) {
    pomoTimer = setInterval(() => {
      pomoSeconds--;
      updatePomoDisplay();
      if(pomoSeconds <= 0) {
        clearInterval(pomoTimer);
        pomoRunning = false;
        document.getElementById('pomo-btn').textContent = '▶ Iniciar';
        if(pomoMode === 'work') {
          pomoCount++;
          localStorage.setItem('pomoCount', pomoCount);
          document.getElementById('pomo-count').textContent = pomoCount;
        }
        if(Notification.permission === 'granted') {
          new Notification('StudyOS', { body: pomoMode==='work' ? '✓ Pomodoro completo! Hora da pausa.' : '▶ Pausa concluída! Volte ao foco.', icon: '' });
        }
        alert(pomoMode==='work' ? '🎯 Pomodoro completo! Hora de descansar.' : '✅ Pausa encerrada! Volte ao foco.');
        setPomoMode(pomoMode==='work'?'short':'work');
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
  const m = String(Math.floor(pomoSeconds/60)).padStart(2,'0');
  const s = String(pomoSeconds%60).padStart(2,'0');
  document.getElementById('pomo-display').textContent = `${m}:${s}`;
  document.getElementById('pomo-label').textContent = POMO_LABELS[pomoMode];
  document.getElementById('pomo-count').textContent = pomoCount;
  const pct = 1 - (pomoSeconds / POMO_MODES[pomoMode]);
  const color = pomoMode==='work'?'var(--accent)':pomoMode==='short'?'var(--green)':'var(--amber)';
  document.getElementById('pomo-circle').style.borderColor = `color-mix(in srgb, ${color} ${Math.round(pct*100)}%, var(--surface3))`;
}

document.getElementById('pomo-technique').addEventListener('change', function() {
  document.getElementById('technique-tip').textContent = TECHNIQUE_TIPS[this.value] || '';
});

// Pedir permissão para notificações
if(Notification.permission === 'default') Notification.requestPermission();

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.getElementById('dash-date').textContent = new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
document.getElementById('hoje-date').textContent = new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
renderDashboard();
updatePomoDisplay();