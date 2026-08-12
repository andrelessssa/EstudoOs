// 🔐 Processa o Login (Exclusivo)
async function realizarLogin(event) {
    if (event) event.preventDefault();

    const emailInput = document.getElementById('login-email');
    const senhaInput = document.getElementById('login-senha');
    const msgErro = document.getElementById('msg-auth-erro');

    if (!emailInput || !senhaInput) return;

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    try {
        if (msgErro) {
            msgErro.style.color = 'var(--muted)';
            msgErro.innerText = 'Autenticando... ⏳';
        }

        // 🎯 Usa o utilitário padrão com a URL Base configurada no api.js
        const response = await fetchComAuth('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        if (!response.ok) {
            throw new Error('E-mail ou senha incorretos.');
        }

        const data = await response.json();
        const tokenRecebido = data.token || data.jwt || data.tokenAcesso;

        if (tokenRecebido) {
            // 🧹 Limpa sessões antigas
            localStorage.clear();

            localStorage.setItem('token', tokenRecebido);
            localStorage.setItem('estudoos_token', tokenRecebido);

            // 🔒 Define ADMIN estritamente para o seu e-mail principal ou se o backend retornar ADMIN
            const EMAIL_ADMIN = 'andrelessa013@gmail.com';
            const isUsuarioAdmin = email.toLowerCase() === EMAIL_ADMIN.toLowerCase() || data.role === 'ADMIN';

            // 💾 Salva os dados do usuário com a role definida
            const objUsuario = JSON.stringify({
                nome: data.nome || email.split('@')[0],
                email: data.email || email,
                role: isUsuarioAdmin ? 'ADMIN' : 'USER'
            });

            localStorage.setItem('usuario', objUsuario);
            localStorage.setItem('estudoos_usuario', objUsuario);

            const formLogin = document.getElementById('form-login');
            if (formLogin) formLogin.reset();
            if (msgErro) msgErro.innerText = '';

            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.style.display = 'none';

            // 🚀 Recarrega para iniciar a sessão limpa
            window.location.reload();
        } else {
            throw new Error('Servidor não retornou um token válido.');
        }
    } catch (err) {
        if (msgErro) {
            msgErro.style.color = 'var(--coral)';
            msgErro.innerText = '❌ ' + err.message;
        }
    }
}

// 👑 Processa a Criação de Usuário feita dentro da aba 'Meu Perfil' (Apenas Admin)
async function criarNovoUsuarioAdmin(event) {
    if (event) event.preventDefault();

    const nomeInput = document.getElementById('admin-reg-nome');
    const emailInput = document.getElementById('admin-reg-email');
    const senhaInput = document.getElementById('admin-reg-senha');
    const msgStatus = document.getElementById('msg-admin-reg');

    if (!nomeInput || !emailInput || !senhaInput) return;

    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    try {
        if (msgStatus) {
            msgStatus.style.color = 'var(--muted)';
            msgStatus.innerText = 'Cadastrando... ⏳';
        }

        const response = await fetchComAuth('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        if (!response.ok) {
            throw new Error('Erro ao cadastrar usuário. E-mail já pode estar em uso.');
        }

        if (msgStatus) {
            msgStatus.style.color = 'var(--green)';
            msgStatus.innerText = '✅ Usuário criado com sucesso!';
        }

        const formAdmin = document.getElementById('form-criar-usuario-admin');
        if (formAdmin) formAdmin.reset();

    } catch (err) {
        if (msgStatus) {
            msgStatus.style.color = 'var(--coral)';
            msgStatus.innerText = '❌ ' + err.message;
        }
    }
}

// 🛡️ Controle de Exibição de Telas por Permissão
function aplicarControleAcesso() {
    const usuarioSalvo = localStorage.getItem('usuario') || localStorage.getItem('estudoos_usuario');

    if (!usuarioSalvo) return;

    try {
        const usuario = JSON.parse(usuarioSalvo);

        const cardCadastroAdmin = document.getElementById('card-cadastrar-usuario') ||
            document.querySelector('#page-perfil .card:first-child');
        const tabPerfilNav = document.getElementById('tab-perfil');

        // Exibe os dados no Perfil
        const elNome = document.getElementById('perfil-nome-exibicao');
        const elEmail = document.getElementById('perfil-email-exibicao');
        if (elNome) elNome.innerText = usuario.nome || '—';
        if (elEmail) elEmail.innerText = usuario.email || '—';

        // 🔒 Regra de Ouro: Apenas o seu e-mail é considerado ADMIN do sistema
        const EMAIL_ADMIN = 'andrelessa013@gmail.com';
        const ehAdmin = usuario.email && (
            usuario.email.trim().toLowerCase() === EMAIL_ADMIN.toLowerCase() ||
            usuario.role === 'ADMIN'
        );

        // Oculta/Exibe o card interno de cadastro
        if (cardCadastroAdmin) {
            cardCadastroAdmin.style.display = ehAdmin ? 'block' : 'none';
        }

        // Oculta/Exibe a aba na navbar superior
        if (tabPerfilNav) {
            tabPerfilNav.style.display = ehAdmin ? 'block' : 'none';
        }

    } catch (e) {
        console.error('Erro no parse do usuário:', e);
    }
}
// 📋 Carrega a lista de usuários cadastrados na aba de Administração
async function carregarListaUsuarios() {
    const container = document.getElementById('lista-usuarios-container');
    if (!container) return;

    try {
        const response = await fetchComAuth('/usuarios');
        if (!response.ok) throw new Error('Erro ao buscar lista de usuários.');

        const usuarios = await response.json();

        if (usuarios.length === 0) {
            container.innerHTML = `<div class="empty"><div class="empty-icon">📭</div>Nenhum usuário cadastrado.</div>`;
            return;
        }

        container.innerHTML = usuarios.map(u => `
            <div style="background: var(--surface2); padding: 0.75rem 1rem; border-radius: var(--radius); display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border);">
                <div>
                    <strong style="font-size: 0.95rem; display: block; color: var(--text);">${u.nome}</strong>
                    <span style="font-size: 0.8rem; color: var(--muted);">${u.email}</span>
                </div>
                <div style="display: flex; gap: 0.4rem;">
                    <button class="btn sm" style="background: var(--surface3);" onclick="abrirModalEdicao(${u.id}, '${u.nome}', '${u.email}')">✏️ Editar</button>
                    <button class="btn sm" style="background: var(--coral); color: white;" onclick="deletarUsuario(${u.id})">🗑️ Excluir</button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        container.innerHTML = `<div class="empty" style="color: var(--coral);">❌ Erro ao carregar usuários.</div>`;
        console.error(err);
    }
}

// ✏️ Abre o modal de edição preenchendo os campos
function abrirModalEdicao(id, nome, email) {
    document.getElementById('edit-user-id').value = id;
    document.getElementById('edit-user-nome').value = nome;
    document.getElementById('edit-user-email').value = email;
    document.getElementById('edit-user-senha').value = '';
    document.getElementById('msg-edit-status').innerText = '';

    const modal = document.getElementById('modal-editar-usuario');
    if (modal) modal.style.display = 'flex';
}

// ❌ Fecha o modal de edição
function fecharModalEdicao() {
    const modal = document.getElementById('modal-editar-usuario');
    if (modal) modal.style.display = 'none';
}

// 💾 Salva as alterações do usuário (incluindo senha opcional)
async function salvarEdicaoUsuario() {
    const id = document.getElementById('edit-user-id').value;
    const nome = document.getElementById('edit-user-nome').value.trim();
    const email = document.getElementById('edit-user-email').value.trim();
    const senha = document.getElementById('edit-user-senha').value;
    const msgStatus = document.getElementById('msg-edit-status');

    try {
        if (msgStatus) {
            msgStatus.style.color = 'var(--muted)';
            msgStatus.innerText = 'Salvando... ⏳';
        }

        const bodyData = { nome, email };
        if (senha) {
            bodyData.senha = senha; // Só envia se preencheu nova senha
        }

        const response = await fetchComAuth(`/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) throw new Error('Erro ao atualizar usuário.');

        if (msgStatus) {
            msgStatus.style.color = 'var(--green)';
            msgStatus.innerText = '✅ Atualizado com sucesso!';
        }

        setTimeout(() => {
            fecharModalEdicao();
            carregarListaUsuarios();
        }, 1000);

    } catch (err) {
        if (msgStatus) {
            msgStatus.style.color = 'var(--coral)';
            msgStatus.innerText = '❌ ' + err.message;
        }
    }
}

// 🗑️ Exclui um usuário após confirmação
async function deletarUsuario(id) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
        const response = await fetchComAuth(`/usuarios/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erro ao excluir usuário.');

        carregarListaUsuarios();
    } catch (err) {
        alert('❌ Erro: ' + err.message);
    }
}

// 🔄 Dispara o carregamento da lista sempre que a aba 'Cadastrar' for aberta
const originalShowPage = window.showPage || function () { };
// Modifica o comportamento do clique na aba de administração para carregar os usuários
document.addEventListener('DOMContentLoaded', () => {
    const tabCadastrar = document.getElementById('tab-perfil');
    if (tabCadastrar) {
        tabCadastrar.addEventListener('click', () => {
            carregarListaUsuarios();
        });
    }
    // Se já estiver na aba ao carregar
    carregarListaUsuarios();
});

// 🚀 Executa ao carregar
document.addEventListener('DOMContentLoaded', () => {
    aplicarControleAcesso();
});