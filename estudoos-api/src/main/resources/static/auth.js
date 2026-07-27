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

        // Utiliza fetch normal para não enviar token antigo no header do login
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        if (!response.ok) {
            throw new Error('E-mail ou senha incorretos.');
        }

        const data = await response.json();

        // Aceita 'token' ou 'jwt' conforme o retorno do Spring Boot
        const tokenRecebido = data.token || data.jwt || data.tokenAcesso;

        if (tokenRecebido) {
            // 🧹 Limpa sessões antigas
            localStorage.clear();

            localStorage.setItem('token', tokenRecebido);
            localStorage.setItem('estudoos_token', tokenRecebido);

            // 💾 Salva os dados do usuário com fallback de segurança
            const objUsuario = JSON.stringify({
                nome: data.nome || email.split('@')[0],
                email: data.email || email,
                role: data.role || (email.toLowerCase() === 'outrousuario@gmail.com' ? 'USER' : 'ADMIN')
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

// 🛡️ Controle de Exibição por Permissões (Visual apenas)
function aplicarControleAcesso() {
    const usuarioSalvo = localStorage.getItem('usuario') || localStorage.getItem('estudoos_usuario');

    if (!usuarioSalvo) return;

    try {
        const usuario = JSON.parse(usuarioSalvo);

        const cardCadastroAdmin = document.getElementById('card-cadastrar-usuario');
        const tabPerfilNav = document.getElementById('tab-perfil');

        // Exibe os dados no Perfil
        const elNome = document.getElementById('perfil-nome-exibicao');
        const elEmail = document.getElementById('perfil-email-exibicao');
        if (elNome) elNome.innerText = usuario.nome || '—';
        if (elEmail) elEmail.innerText = usuario.email || '—';

        // 🔒 Define quem é ADMIN
        const isOutroUsuario = usuario.email && usuario.email.toLowerCase() === 'outrousuario@gmail.com';
        const ehAdmin = !isOutroUsuario && (usuario.role === 'ADMIN' || usuario.role === 'ROLE_ADMIN' || !usuario.role);

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

// 🚀 Executa ao carregar
document.addEventListener('DOMContentLoaded', () => {
    aplicarControleAcesso();
});