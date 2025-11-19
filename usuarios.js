class UserManagement {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Verificar autenticação
        if (!this.checkAuth()) {
            window.location.href = 'login.html';
            return;
        }

        // Verificar se é admin
        const user = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
        if (user.role !== 'admin') {
            alert('Acesso negado. Apenas administradores podem gerenciar usuários.');
            window.location.href = 'os-dashboard.html';
            return;
        }

        this.setupEventListeners();
        this.loadUsers();
    }

    checkAuth() {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        return !!(token && user);
    }

    setupEventListeners() {
        document.getElementById('btn-add-user').addEventListener('click', () => this.openModal());
        document.getElementById('btn-cancel-user').addEventListener('click', () => this.closeModal());
        document.getElementById('form-user').addEventListener('submit', (e) => this.handleSubmit(e));
    }

    loadUsers() {
        const tbody = document.getElementById('users-tbody');
        const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Nenhum usuário cadastrado</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        users.forEach(user => {
            const row = this.createUserRow(user);
            tbody.appendChild(row);
        });
    }

    createUserRow(user) {
        const tr = document.createElement('tr');
        const createdDate = new Date(user.createdAt).toLocaleDateString('pt-BR');

        const roleLabels = {
            'admin': 'Administrador',
            'tecnico': 'Técnico',
            'atendente': 'Atendente'
        };

        tr.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="role-badge role-${user.role}">${roleLabels[user.role] || user.role}</span></td>
            <td>${createdDate}</td>
            <td>
                <button class="btn-action btn-edit" onclick="userManagement.editUser('${user.id}')">Editar</button>
                <button class="btn-action btn-delete" onclick="userManagement.deleteUser('${user.id}')">Excluir</button>
            </td>
        `;

        return tr;
    }

    openModal(userId = null) {
        const modal = document.getElementById('modal-user');
        const title = document.getElementById('modal-user-title');
        const form = document.getElementById('form-user');

        form.reset();

        if (userId) {
            // Modo edição
            const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
            const user = users.find(u => u.id === userId);

            if (user) {
                title.textContent = 'Editar Usuário';
                document.getElementById('user-id').value = user.id;
                document.getElementById('user-name').value = user.name;
                document.getElementById('user-email').value = user.email;
                document.getElementById('user-role').value = user.role;
                
                // Senha não obrigatória na edição
                const passwordInput = document.getElementById('user-password');
                passwordInput.removeAttribute('required');
                passwordInput.placeholder = 'Deixe em branco para manter a senha atual';
            }
        } else {
            // Modo criação
            title.textContent = 'Novo Usuário';
            document.getElementById('user-password').setAttribute('required', 'required');
            document.getElementById('user-password').placeholder = '';
        }

        modal.classList.add('show');
    }

    closeModal() {
        const modal = document.getElementById('modal-user');
        modal.classList.remove('show');
    }

    handleSubmit(e) {
        e.preventDefault();

        const userId = document.getElementById('user-id').value;
        const name = document.getElementById('user-name').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const password = document.getElementById('user-password').value;
        const role = document.getElementById('user-role').value;

        if (!name || !email || !role) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        if (!userId && !password) {
            alert('Senha é obrigatória para novos usuários');
            return;
        }

        let users = JSON.parse(localStorage.getItem('systemUsers') || '[]');

        if (userId) {
            // Atualizar usuário existente
            const index = users.findIndex(u => u.id === userId);
            if (index !== -1) {
                users[index] = {
                    ...users[index],
                    name,
                    email,
                    role,
                    updatedAt: new Date().toISOString()
                };

                // Atualizar senha se fornecida
                if (password) {
                    users[index].password = this.hashPassword(password);
                }
            }
        } else {
            // Criar novo usuário
            // Verificar se email já existe
            if (users.some(u => u.email === email)) {
                alert('Este e-mail já está cadastrado');
                return;
            }

            const newUser = {
                id: Date.now().toString(),
                name,
                email,
                password: this.hashPassword(password),
                role,
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
        }

        localStorage.setItem('systemUsers', JSON.stringify(users));
        
        this.closeModal();
        this.loadUsers();
        
        alert(userId ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
    }

    editUser(userId) {
        this.openModal(userId);
    }

    deleteUser(userId) {
        // Verificar se não é o último admin
        const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
        const admins = users.filter(u => u.role === 'admin');
        const userToDelete = users.find(u => u.id === userId);

        if (userToDelete.role === 'admin' && admins.length === 1) {
            alert('Não é possível excluir o último administrador do sistema');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir o usuário "${userToDelete.name}"?`)) {
            return;
        }

        const updatedUsers = users.filter(u => u.id !== userId);
        localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));
        
        this.loadUsers();
        alert('Usuário excluído com sucesso!');
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
}

// Inicializar
let userManagement;
document.addEventListener('DOMContentLoaded', () => {
    userManagement = new UserManagement();
});
