// 🌐 Configuração Base da API Java Spring Boot
if (typeof API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'http://localhost:8083/api';
}

// 🛡️ Função utilitária central de requisições com JWT
async function fetchComAuth(endpoint, options = {}) {
    const token = localStorage.getItem('estudoos_token');

    // 🛑 SE NÃO HOUVER TOKEN E NÃO FOR ROTA DE AUTH, CANCELA A CHAMADA IMEDIATAMENTE!
    if (!token && !endpoint.includes('/auth')) {
        const authModal = document.getElementById('auth-modal');
        if (authModal) authModal.style.display = 'flex';

        return {
            ok: false,
            status: 401,
            json: async () => ({ message: "Sem autenticação" })
        };
    }

    // Configura os cabeçalhos padrão
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(`${window.API_BASE_URL}${endpoint}`, config);

        // 🔴 Se o token expirou ou é inválido no servidor
        if (response.status === 401 || response.status === 403) {
            if (!endpoint.includes('/auth')) {
                localStorage.removeItem('estudoos_token');
                localStorage.removeItem('estudoos_usuario');

                const authModal = document.getElementById('auth-modal');
                if (authModal) authModal.style.display = 'flex';
            }
        }

        return response;
    } catch (error) {
        console.error('Erro na requisição da API:', error);
        throw error;
    }
}

// 🚪 Processa o Logout zerando o armazenamento e recarregando a tela limpa
function fazerLogout() {
    localStorage.removeItem('estudoos_token');
    localStorage.removeItem('estudoos_usuario');
    localStorage.clear();

    window.location.href = window.location.pathname;
}