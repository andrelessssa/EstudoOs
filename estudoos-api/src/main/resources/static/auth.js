// 🔄 Alterna as abas na modal de autenticação (Login / Cadastro)
function alternarAbaAuth(aba) {
    const formLogin = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');
    const tabLogin = document.getElementById('btn-tab-login');
    const tabRegistro = document.getElementById('btn-tab-registro');
    const msgErro = document.getElementById('msg-auth-erro');
    if (msgErro) msgErro.innerText = '';

    if (aba === 'login') {
        if (formLogin) formLogin.style.display = 'block';
        if (formRegistro) formRegistro.style.display = 'none';
        if (tabLogin) tabLogin.classList.add('active');
        if (tabRegistro) tabRegistro.classList.remove('active');
    } else {
        if (formLogin) formLogin.style.display = 'none';
        if (formRegistro) formRegistro.style.display = 'block';
        if (tabLogin) tabLogin.classList.remove('active');
        if (tabRegistro) tabRegistro.classList.add('active');
    }
}

// 🔐 Processa o Login
async function realizarLogin(event) {
    if (event) event.preventDefault();

    const emailInput = document.getElementById('login-email');
    const senhaInput = document.getElementById('login-senha');
    const msgErro = document.getElementById('msg-auth-erro');

    if (!emailInput || !senhaInput) return;

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    try {
        const response = await fetchComAuth('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        if (!response.ok) {
            throw new Error('E-mail ou senha incorretos.');
        }

        const data = await response.json();

        // 💾 Salva o Token e dados do Usuário no navegador
        if (data.token) {
            localStorage.setItem('estudoos_token', data.token);
            localStorage.setItem('estudoos_usuario', JSON.stringify({ nome: data.nome || 'Usuário', email: data.email || email }));

            // 🧹 Limpa o formulário de login
            const formLogin = document.getElementById('form-login');
            if (formLogin) formLogin.reset();
            if (msgErro) msgErro.innerText = '';

            // 🚀 Esconde a modal e inicializa a aplicação
            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.style.display = 'none';

            if (typeof verificarAutenticacaoEInicializar === 'function') {
                verificarAutenticacaoEInicializar();
            }
        } else {
            throw new Error('Token não retornado pelo servidor.');
        }
    } catch (err) {
        if (msgErro) msgErro.innerText = err.message;
    }
}

// 📝 Processa o Registro de novo usuário
async function realizarRegistro(event) {
    if (event) event.preventDefault();

    const nomeInput = document.getElementById('reg-nome');
    const emailInput = document.getElementById('reg-email');
    const senhaInput = document.getElementById('reg-senha');
    const msgErro = document.getElementById('msg-auth-erro');

    if (!nomeInput || !emailInput || !senhaInput) return;

    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    try {
        const response = await fetchComAuth('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        if (!response.ok) {
            throw new Error('Erro ao cadastrar. E-mail já está em uso?');
        }

        const data = await response.json();

        // 💾 Salva o Token e dados do Usuário no navegador
        if (data.token) {
            localStorage.setItem('estudoos_token', data.token);
            localStorage.setItem('estudoos_usuario', JSON.stringify({ nome: data.nome || nome, email: data.email || email }));

            // 🧹 Limpa o formulário de registro
            const formRegistro = document.getElementById('form-registro');
            if (formRegistro) formRegistro.reset();
            if (msgErro) msgErro.innerText = '';

            // 🚀 Esconde a modal e inicializa a aplicação
            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.style.display = 'none';

            if (typeof verificarAutenticacaoEInicializar === 'function') {
                verificarAutenticacaoEInicializar();
            }
        } else {
            throw new Error('Token não retornado pelo servidor.');
        }
    } catch (err) {
        if (msgErro) msgErro.innerText = err.message;
    }
}