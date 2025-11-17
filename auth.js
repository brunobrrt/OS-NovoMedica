// Sistema de Autenticação Simples usando localStorage
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Verificar se há usuário logado
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
            } catch (e) {
                console.error('Erro ao parsear usuário:', e);
                localStorage.removeItem('currentUser');
            }
        }
    }

    login(email, password) {
        return new Promise((resolve, reject) => {
            // Buscar usuários do localStorage
            const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
            
            // Se não houver usuários, criar um padrão
            if (users.length === 0) {
                const defaultUser = {
                    id: 'user-' + Date.now(),
                    email: 'admin@assistencia.com',
                    password: 'admin123',
                    name: 'Administrador',
                    role: 'admin',
                    createdAt: new Date().toISOString()
                };
                users.push(defaultUser);
                localStorage.setItem('mockUsers', JSON.stringify(users));
            }

            // Verificar credenciais
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                // Login bem-sucedido
                const userSession = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    loginAt: new Date().toISOString()
                };
                
                this.currentUser = userSession;
                localStorage.setItem('currentUser', JSON.stringify(userSession));
                
                resolve(userSession);
            } else {
                reject(new Error('E-mail ou senha incorretos.'));
            }
        });
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    requireAuth() {
        if (!this.isAuthenticated()) {
            // Salvar a URL atual para redirecionar depois do login
            localStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    // Criar novo usuário (apenas para admin)
    createUser(email, password, name, role = 'user') {
        return new Promise((resolve, reject) => {
            const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
            
            // Verificar se já existe
            if (users.find(u => u.email === email)) {
                reject(new Error('Usuário já existe'));
                return;
            }

            const newUser = {
                id: 'user-' + Date.now(),
                email,
                password,
                name,
                role,
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem('mockUsers', JSON.stringify(users));
            resolve(newUser);
        });
    }
}

// Instância global
const authSystem = new AuthSystem();
