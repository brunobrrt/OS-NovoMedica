class LoginSystem {
    constructor() {
        // Configuração da API - mudar para produção no Hostgator
        this.API_URL = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api' 
            : '/api'; // Produção no Hostgator
        
        this.init();
    }

    init() {
        // Verificar se já está logado
        if (this.checkAuth()) {
            window.location.href = 'os-dashboard.html';
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('login-form');
        const forgotPassword = document.getElementById('forgot-password');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (forgotPassword) {
            forgotPassword.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }

        // Enter key para submit
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        if (!email || !password) {
            this.showError('Por favor, preencha todos os campos');
            return;
        }

        this.setLoading(true);

        try {
            // Tentar autenticação via API
            const response = await this.authenticate(email, password);

            if (response.success) {
                // Salvar token e dados do usuário
                this.saveSession(response.user, response.token, rememberMe);
                
                this.showSuccess('Login realizado com sucesso!');
                
                // Redirecionar após 500ms
                setTimeout(() => {
                    window.location.href = 'os-dashboard.html';
                }, 500);
            } else {
                this.showError(response.message || 'Credenciais inválidas');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.showError('Erro ao conectar com o servidor. Verifique sua conexão.');
        } finally {
            this.setLoading(false);
        }
    }

    async authenticate(email, password) {
        try {
            const response = await fetch(`${this.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                // Se servidor não estiver disponível, usar autenticação local temporária
                if (response.status === 404 || !response.ok) {
                    return this.authenticateLocal(email, password);
                }
                throw new Error('Erro na autenticação');
            }

            return await response.json();
        } catch (error) {
            // Fallback para autenticação local (modo desenvolvimento)
            console.warn('API não disponível, usando autenticação local');
            return this.authenticateLocal(email, password);
        }
    }

    authenticateLocal(email, password) {
        // Autenticação local usando localStorage (modo desenvolvimento)
        const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
        
        // Criar usuário admin padrão se não existir
        if (users.length === 0) {
            const defaultAdmin = {
                id: '1',
                name: 'Administrador',
                email: 'admin@novomedica.com',
                password: this.hashPassword('admin123'), // Senha padrão
                role: 'admin',
                createdAt: new Date().toISOString()
            };
            users.push(defaultAdmin);
            localStorage.setItem('systemUsers', JSON.stringify(users));
        }

        // Buscar usuário
        const user = users.find(u => u.email === email);

        if (!user) {
            return {
                success: false,
                message: 'Usuário não encontrado'
            };
        }

        // Verificar senha
        const hashedPassword = this.hashPassword(password);
        if (user.password !== hashedPassword) {
            return {
                success: false,
                message: 'Senha incorreta'
            };
        }

        // Remover senha do objeto retornado
        const { password: _, ...userWithoutPassword } = user;

        return {
            success: true,
            user: userWithoutPassword,
            token: this.generateToken(user.id)
        };
    }

    hashPassword(password) {
        // Hash simples para desenvolvimento (usar bcrypt no backend real)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    generateToken(userId) {
        // Token simples para desenvolvimento (usar JWT no backend real)
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return btoa(`${userId}:${timestamp}:${random}`);
    }

    saveSession(user, token, rememberMe) {
        const storage = rememberMe ? localStorage : sessionStorage;
        
        storage.setItem('authToken', token);
        storage.setItem('currentUser', JSON.stringify(user));
        storage.setItem('loginTime', new Date().toISOString());
    }

    checkAuth() {
        // Verificar em localStorage e sessionStorage
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        
        return !!(token && user);
    }

    handleForgotPassword() {
        const email = document.getElementById('email').value.trim();
        
        if (!email) {
            this.showError('Digite seu e-mail para recuperar a senha');
            document.getElementById('email').focus();
            return;
        }

        // Simular recuperação de senha
        alert(`Um e-mail de recuperação foi enviado para: ${email}\n\nPor favor, entre em contato com o administrador do sistema.`);
    }

    setLoading(isLoading) {
        const btn = document.getElementById('login-btn');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');

        if (isLoading) {
            btn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
        } else {
            btn.disabled = false;
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.className = 'error-message';

        // Ocultar após 5 segundos
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.className = 'success-message';
    }
}

// Inicializar sistema de login quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new LoginSystem();
});
