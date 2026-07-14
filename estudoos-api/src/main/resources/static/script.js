// ─── CONFIGURAÇÃO DA API ──────────────────────────────────────────────────────
const API_URL = ''; // Como as telas estão na pasta static, a URL é relativa

// ─── CORES ───────────────────────────────────────────────────────────────────
const COLORS = ['#6c7bff','#34d399','#fbbf24','#f87171','#c084fc','#2dd4bf','#fb7185','#60a5fa','#a3e635','#f97316'];

// ─── STATE LOCAL (Apenas cache para renderização rápida) ──────────────────────
let state = { materias: [], sessions: [], reviews: [], questions: [] };

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

// ─── DATAS (Fuso Horário Local Corrigido!) ───────────────────────────────────
function today() { 
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0]; 
}

function dateStr(d) { 
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'}); 
}

// ─── DASHBOARD (Consome dados dinâmicos da API) ────────────────────────────────
async function renderDashboard() {
  document.getElementById('dash-date').textContent = new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  
  try {
    const resMat = await fetch(`${API_URL}/api/materias`);
    state.materias = await resMat.json();

    const resRev = await fetch(`${API_URL}/api/revisoes/hoje`);
    const revisoesHoje = await resRev.json();

    let studied = 0;
    state.materias.forEach(m => {
      const lista = m.topicos || m.assuntos || m.topico || [];
      lista.forEach(t => { if(t.concluido || t.done) studied++; });
    });
    
    const correct = state.questions.filter(q=>q.result==='correct').length;
    const total = state.questions.filter(q=>q.result).length;
    const rate = total ? Math.round(correct/total*100)+'%' : '—';

    document.getElementById('dash-studied').textContent = studied;
    document.getElementById('dash-correct').textContent = correct;
    document.getElementById('dash-rate').textContent = rate;
    document.getElementById('dash-reviews').textContent = revisoesHoje.length;

    // Progresso por matéria
    const pl = document.getElementById('dash-progress-list');
    if (!state.materias.length) {
      pl.innerHTML = '<div class="empty"><div class="empty-icon">📚</div>Adicione matérias para ver o progresso</div>';
    } else {
      pl.innerHTML = state.materias.map((m, i) => {
        const lista = m.topicos || m.assuntos || m.topico || [];
        const tot = lista.length;
        const done = lista.filter(t=>t.concluido || t.done).length;
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

    // Calendário simples
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

// ─── MATÉRIAS (Integração direta com o Banco de Dados) ────────────────────────
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

    el.innerHTML = state.materias.map((m, i) => {
      const listaTopicos = m.topicos || m.assuntos || m.topico || [];
      const done = listaTopicos.filter(t => t.concluido || t.done).length;
      const tot = listaTopicos.length;
      const pct = tot ? Math.round(done / tot * 100) : 0;
      
      const corMateria = m.cor || COLORS[i % COLORS.length];

      return `
      <div style="margin-bottom: .5rem;">
        <div class="subject-row" onclick="toggleTopics('tops-${m.id}')">
          <div class="subject-dot" style="background:${corMateria}; box-shadow:0 0 8px ${corMateria}55;"></div>
          <div class="subject-name">${m.nome}</div>
          <div class="subject-topics">${done}/${tot} assuntos</div>
          <div style="width:80px;">
            <div class="progress-track">
              <div class="progress-fill" style="width:${pct}%; background:${corMateria};"></div>
            </div>
          </div>
          <span style="font-size:12px; font-family:var(--mono); color:var(--muted);">${pct}%</span>
          <button class="btn sm danger" onclick="event.stopPropagation(); deleteMateria('${m.id}')">✕</button>
        </div>
        
        <div id="tops-${m.id}" style="display:none; padding:.4rem 0 .4rem 1.5rem;">
          ${listaTopicos.length ? listaTopicos.map(t => `
            <div class="topic-row">
              <div class="topic-check ${(t.concluido || t.done) ? 'checked' : ''}" style="pointer-events: none;"></div>
              <div class="topic-name ${(t.concluido || t.done) ? 'done' : ''}">${t.nome}</div>
              ${t.dataConclusao || t.doneDate ? `<span style="font-size:11px; color:var(--muted);">${dateStr(t.dataConclusao || t.doneDate)}</span>` : ''}
            </div>`).join('') : '<div style="font-size:13px; color:var(--muted); padding:.5rem .9rem;">Nenhum assunto cadastrado</div>'}
        </div>
      </div>`;
    }).join('');
  } catch (error) {
    console.error("Erro ao listar matérias:", error);
    el.innerHTML = '<div class="empty"><div class="empty-icon">❌</div>Erro ao carregar dados do servidor</div>';
  }
}

function toggleTopics(id) {
  const el = document.getElementById(id);
  if(el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

async function deleteMateria(id) {
  if(!confirm('Remover matéria e todos os dados associados?')) return;
  try {
    const res = await fetch(`${API_URL}/api/materias/${id}`, { method: 'DELETE' });
    if(res.ok) {
      renderMaterias();
    } else {
      alert("Erro ao excluir matéria.");
    }
  } catch (error) {
    console.error("Erro ao excluir:", error);
  }
}

// ─── REVISÃO ESPAÇADA (Integração com as Revisões do Banco de Dados) ──────────
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
      const anotacoes = r.anotacoes || r.sessaoAnotacoes || "Nenhuma anotação registrada para este tópico.";
      
      return `
      <div style="margin-bottom: .75rem;">
        <div class="review-card" onclick="toggleReviewNotes('notes-${r.id}')" style="cursor: pointer; margin-bottom: 0;">
          <div class="review-icon" style="background:${stageColors[(stage-1)%4]}22;">
            <span style="font-size:14px;font-weight:700;color:${stageColors[(stage-1)%4]};">${stage}ª</span>
          </div>
          <div class="review-info">
            <div class="review-title" style="display: flex; align-items: center; gap: .5rem;">
              ${r.topicoNome} 
              <span style="font-size: 11px; color: var(--accent2);">📝 Ver resumo</span>
            </div>
            <div class="review-sub">${r.materiaNome} · clique para ler suas anotações</div>
          </div>
          <span class="badge due">REVISAR HOJE</span>
          <button class="btn sm primary" onclick="event.stopPropagation(); doneReview('${r.id}')">✓ Feita</button>
        </div>
        
        <div id="notes-${r.id}" style="display: none; background: var(--surface3); border: 1px solid var(--border); border-top: none; border-bottom-left-radius: var(--radius); border-bottom-right-radius: var(--radius); padding: 1rem; font-size: 13px; color: var(--text); line-height: 1.6;">
          <strong style="color: var(--accent2); display: block; margin-bottom: .4rem;">📝 Suas Notas do Estudo:</strong>
          <p style="opacity: 0.9; font-style: italic;">"${anotacoes}"</p>
        </div>
      </div>`;
    }).join('');
  } catch (error) {
    console.error("Erro ao listar revisões:", error);
  }
}

function toggleReviewNotes(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

async function doneReview(id) {
  try {
    const res = await fetch(`${API_URL}/api/revisoes/${id}/concluir`, {
      method: 'PUT'
    });
    if (res.ok) {
      renderRevisao();
    } else {
      alert("Falha ao concluir revisão.");
    }
  } catch (error) {
    console.error("Erro ao concluir revisão:", error);
  }
}

// ─── SESSÃO DE HOJE ──────────────────────────────────────────────────────────
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
    
    el.innerHTML = topicos.map(t=>`
      <div class="topic-row">
        <!-- Riscado se já estiver concluído, com checkbox desabilitado, exatamente como no seu print -->
        <input type="checkbox" class="topic-check-db" value="${t.id}" ${t.concluido ? 'checked disabled' : ''} style="width: 18px; height: 18px; accent-color: var(--accent);">
        <div class="topic-name ${t.concluido ? 'done' : ''}">${t.nome}</div>
        ${t.concluido && t.dataConclusao ? `<span style="font-size:11px;color:var(--muted);">${dateStr(t.dataConclusao)}</span>` : ''}
      </div>`).join('');
  } catch (error) {
    console.error("Erro ao carregar tópicos:", error);
  }
}

async function saveSession() {
  const matId = document.getElementById('session-mat').value;
  if(!matId) { alert('Selecione uma matéria.'); return; }
  
  const notes = document.getElementById('session-notes').value.trim();
  const selectedTopicIds = [];
  
  document.querySelectorAll('.topic-check-db:checked').forEach(cb => {
    if(!cb.disabled) {
      selectedTopicIds.push(parseInt(cb.value));
    }
  });

  if(selectedTopicIds.length === 0) {
    alert("Selecione pelo menos um tópico para salvar a sessão de estudos.");
    return;
  }

  const sessaoDTO = {
    materiaId: parseInt(matId),
    topicosIds: selectedTopicIds,
    anotacoes: notes
  };

  try {
    const res = await fetch(`${API_URL}/api/sessoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessaoDTO)
    });

    if (res.ok) {
      alert("Sessão salva! Suas revisões foram agendadas automaticamente na Curva de Ebbinghaus! 🧠🎯");
      document.getElementById('session-notes').value = '';
      renderHoje();
    } else {
      alert("Erro ao salvar sessão no servidor.");
    }
  } catch (error) {
    console.error("Erro de conexão ao salvar sessão:", error);
  }
}

// ─── RENDERS ADICIONAIS DE HISTÓRICO ──────────────────────────────────────────
async function renderHistoricoSessoes() {
  const hist = document.getElementById('session-history');
  try {
    const res = await fetch(`${API_URL}/api/sessoes`);
    const sessoes = await res.json();
    
    if(!sessoes.length) { 
      hist.innerHTML = '<div class="empty"><div class="empty-icon">🗂️</div>Nenhuma sessão registrada</div>'; 
      return; 
    }
    
    const sessoesInvertidas = [...sessoes].reverse();
    hist.innerHTML = sessoesInvertidas.map(s => {
      const topicosList = s.topicosNomes || [];
      return `<div style="padding:.85rem;background:var(--surface2);border-radius:var(--radius);margin-bottom:.4rem;display:flex;gap:.75rem;align-items:flex-start;">
        <div style="font-family:var(--mono);font-size:11px;color:var(--muted);min-width:70px;padding-top:2px;">${dateStr(s.dataSessao)}</div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:var(--text);">${s.materiaNome}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px;">${topicosList.join(', ')}</div>
          ${s.anotacoes ? `<div style="font-size:12px;color:var(--text);margin-top:4px;opacity:.7;">📝 ${s.anotacoes}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    hist.innerHTML = '<div class="empty">Nenhuma sessão registrada</div>';
  }
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