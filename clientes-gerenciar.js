// Sistema de Gerenciamento de Clientes
class ClientManager {
    constructor() {
        this.clients = [];
        this.devices = [];
        this.currentClientId = null;
        this.init();
    }

    init() {
        // Verificar autenticação
        if (!authSystem.requireAuth()) {
            return;
        }

        // Atualizar email do usuário
        const user = authSystem.getCurrentUser();
        if (user) {
            const userEmailElement = document.getElementById('userEmail');
            if (userEmailElement) {
                userEmailElement.textContent = user.email;
            }
        }

        // Configurar logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                authSystem.logout();
            });
        }

        this.setupEventListeners();
        this.loadData();
    }

    setupEventListeners() {
        // Botões principais
        const newClientBtn = document.getElementById('new-client-btn');
        const importBtn = document.getElementById('import-clients-btn');
        
        if (newClientBtn) newClientBtn.addEventListener('click', () => { this.openClientModal(); this.closeMobileActionsMenu(); });
        if (importBtn) importBtn.addEventListener('click', () => { this.importClients(); this.closeMobileActionsMenu(); });
        
        // Botões mobile
        const mobileNewClientBtn = document.getElementById('mobile-new-client-btn');
        const mobileImportBtn = document.getElementById('mobile-import-clients-btn');
        
        if (mobileNewClientBtn) mobileNewClientBtn.addEventListener('click', () => { this.openClientModal(); this.closeMobileActionsMenu(); });
        if (mobileImportBtn) mobileImportBtn.addEventListener('click', () => { this.importClients(); this.closeMobileActionsMenu(); });
        
        document.getElementById('refresh-clients').addEventListener('click', () => this.loadClients());

        // Busca
        document.getElementById('search-clients').addEventListener('input', () => this.loadClients());

        // Formulários
        document.getElementById('client-form').addEventListener('submit', (e) => this.handleClientSubmit(e));
        document.getElementById('new-device-form').addEventListener('submit', (e) => this.handleNewDeviceSubmit(e));

        // Botões de aparelhos
        const addDeviceBtn = document.getElementById('add-device-to-client-btn');
        const linkDeviceBtn = document.getElementById('link-existing-device-btn');
        
        if (addDeviceBtn) addDeviceBtn.addEventListener('click', () => this.openNewDeviceModal());
        if (linkDeviceBtn) linkDeviceBtn.addEventListener('click', () => this.openLinkDeviceModal());

        // Modais
        this.setupModalListeners();

        // Menu toggle e mobile menu
        this.setupMobileMenu();
    }

    setupMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        if (menuToggle && sidebar && overlay) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            });
            
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
                this.closeMobileActionsMenu();
            });
        }
        
        // Setup mobile actions menu
        const mobileActionsBtn = document.getElementById('mobile-actions-btn');
        const mobileActionsMenu = document.getElementById('mobile-actions-menu');
        
        if (mobileActionsBtn && mobileActionsMenu) {
            mobileActionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                mobileActionsMenu.classList.toggle('show');
                overlay.classList.toggle('active');
            });
        }
        
        // Close mobile actions menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mobileActionsMenu && !mobileActionsMenu.contains(e.target) && e.target.id !== 'mobile-actions-btn') {
                this.closeMobileActionsMenu();
            }
        });
    }

    closeMobileActionsMenu() {
        const mobileActionsMenu = document.getElementById('mobile-actions-menu');
        const overlay = document.getElementById('overlay');
        
        if (mobileActionsMenu) {
            mobileActionsMenu.classList.remove('show');
        }
        
        // Only remove overlay if sidebar is not open
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.classList.contains('open')) {
            overlay.classList.remove('active');
        }
    }

    setupModalListeners() {
        // Fechar modais
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                this.closeModal(modalId);
            });
        });

        document.querySelectorAll('[data-close]').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-close');
                this.closeModal(modalId);
            });
        });
    }

    loadData() {
        this.loadClients();
        this.updateStats();
    }

    loadClients() {
        const tbody = document.getElementById('clients-tbody');
        const loading = document.getElementById('clients-loading');
        const empty = document.getElementById('clients-empty');
        const searchTerm = document.getElementById('search-clients').value.toLowerCase();
        
        loading.style.display = 'block';
        empty.style.display = 'none';
        tbody.innerHTML = '';

        this.clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
        this.devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');

        // Filtrar clientes
        let filteredClients = this.clients;
        if (searchTerm) {
            filteredClients = this.clients.filter(c =>
                c.nome.toLowerCase().includes(searchTerm) ||
                (c.telefone && c.telefone.includes(searchTerm)) ||
                (c.cpfCnpj && c.cpfCnpj.includes(searchTerm)) ||
                (c.email && c.email.toLowerCase().includes(searchTerm)) ||
                (c.qrCode && c.qrCode.toLowerCase().includes(searchTerm))
            );
        }

        if (filteredClients.length === 0) {
            empty.style.display = 'block';
        } else {
            filteredClients.forEach(client => {
                const deviceCount = this.devices.filter(d => d.ownerId === client.id).length;
                tbody.appendChild(this.createClientRow(client, deviceCount));
            });
        }

        loading.style.display = 'none';
    }

    createClientRow(client, deviceCount) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="qr-code-badge">${client.qrCode}</span></td>
            <td>${client.nome}</td>
            <td>${client.telefone || '-'}</td>
            <td>${client.cpfCnpj || '-'}</td>
            <td>${client.email || '-'}</td>
            <td><span class="badge badge-info">${deviceCount} aparelho${deviceCount !== 1 ? 's' : ''}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info btn-sm" onclick="clientManager.editClient('${client.id}')">✏️ Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="clientManager.deleteClient('${client.id}')">🗑️ Excluir</button>
                </div>
            </td>
        `;
        return tr;
    }

    updateStats() {
        this.clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
        this.devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');

        const totalClients = this.clients.length;
        const clientsWithDevices = this.clients.filter(c => 
            this.devices.some(d => d.ownerId === c.id)
        ).length;
        const clientsWithoutDevices = totalClients - clientsWithDevices;

        document.getElementById('stat-total-clients').textContent = totalClients;
        document.getElementById('stat-clients-with-devices').textContent = clientsWithDevices;
        document.getElementById('stat-clients-without-devices').textContent = clientsWithoutDevices;
    }

    openClientModal(clientId = null) {
        const modal = document.getElementById('client-modal');
        const form = document.getElementById('client-form');
        const title = document.getElementById('client-modal-title');

        form.reset();
        this.currentClientId = clientId;

        if (clientId) {
            title.textContent = 'Editar Cliente';
            const client = this.clients.find(c => c.id === clientId);
            if (client) {
                document.getElementById('client-id').value = client.id;
                document.getElementById('client-name').value = client.nome;
                document.getElementById('client-phone').value = client.telefone || '';
                document.getElementById('client-cpf-cnpj').value = client.cpfCnpj || '';
                document.getElementById('client-email').value = client.email || '';
                document.getElementById('client-address').value = client.endereco || '';
                
                this.loadClientDevices(clientId);
            }
        } else {
            title.textContent = 'Novo Cliente';
            document.getElementById('client-id').value = '';
            document.getElementById('client-devices-list').innerHTML = '<p style="text-align: center; color: #666;">Salve o cliente primeiro para adicionar aparelhos</p>';
        }

        modal.style.display = 'block';
    }

    loadClientDevices(clientId) {
        const devicesList = document.getElementById('client-devices-list');
        const clientDevices = this.devices.filter(d => d.ownerId === clientId);

        if (clientDevices.length === 0) {
            devicesList.innerHTML = '<p style="text-align: center; color: #666;">Nenhum aparelho vinculado</p>';
        } else {
            devicesList.innerHTML = clientDevices.map(device => `
                <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${device.brand} ${device.model}</strong><br>
                        <small>Serial: ${device.imei || 'N/A'}</small>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="clientManager.unlinkDevice('${device.id}', '${clientId}')">🗑️ Desvincular</button>
                </div>
            `).join('');
        }
    }

    async handleClientSubmit(e) {
        e.preventDefault();

        const clientId = document.getElementById('client-id').value;
        const data = {
            id: clientId || this.generateId(),
            nome: document.getElementById('client-name').value,
            telefone: document.getElementById('client-phone').value,
            cpfCnpj: document.getElementById('client-cpf-cnpj').value,
            email: document.getElementById('client-email').value,
            endereco: document.getElementById('client-address').value,
            qrCode: clientId ? this.clients.find(c => c.id === clientId).qrCode : this.generateQRCode(),
            createdAt: clientId ? this.clients.find(c => c.id === clientId).createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (clientId) {
            // Editar
            const index = this.clients.findIndex(c => c.id === clientId);
            this.clients[index] = { ...this.clients[index], ...data };
            this.showNotification('Cliente atualizado com sucesso!', 'success');
        } else {
            // Criar novo
            this.clients.push(data);
            this.showNotification('Cliente criado com sucesso!', 'success');
            this.currentClientId = data.id;
            
            // Recarregar modal para mostrar opções de aparelhos
            this.closeModal('client-modal');
            setTimeout(() => this.openClientModal(data.id), 300);
        }

        localStorage.setItem('mockClients', JSON.stringify(this.clients));
        this.loadClients();
        this.updateStats();
    }

    editClient(clientId) {
        this.openClientModal(clientId);
    }

    deleteClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        const clientDevices = this.devices.filter(d => d.ownerId === clientId);

        if (clientDevices.length > 0) {
            if (!confirm(`Este cliente possui ${clientDevices.length} aparelho(s) vinculado(s). Deseja realmente excluir? Os aparelhos ficarão sem proprietário.`)) {
                return;
            }
            
            // Desvincular todos os aparelhos
            clientDevices.forEach(device => {
                const index = this.devices.findIndex(d => d.id === device.id);
                this.devices[index].ownerId = null;
            });
            localStorage.setItem('mockDevices', JSON.stringify(this.devices));
        } else {
            if (!confirm(`Deseja realmente excluir o cliente "${client.nome}"?`)) {
                return;
            }
        }

        this.clients = this.clients.filter(c => c.id !== clientId);
        localStorage.setItem('mockClients', JSON.stringify(this.clients));
        
        this.showNotification('Cliente excluído com sucesso!', 'success');
        this.loadClients();
        this.updateStats();
    }

    openNewDeviceModal() {
        if (!this.currentClientId) {
            this.showNotification('Salve o cliente primeiro!', 'warning');
            return;
        }

        document.getElementById('new-device-form').reset();
        this.openModal('new-device-modal');
    }

    async handleNewDeviceSubmit(e) {
        e.preventDefault();

        const newDevice = {
            id: this.generateId(),
            brand: document.getElementById('new-device-brand').value,
            model: document.getElementById('new-device-model').value,
            imei: document.getElementById('new-device-imei').value,
            notes: document.getElementById('new-device-notes').value,
            ownerId: this.currentClientId,
            qrCode: this.generateQRCode(),
            createdAt: new Date().toISOString()
        };

        this.devices.push(newDevice);
        localStorage.setItem('mockDevices', JSON.stringify(this.devices));

        this.showNotification('Aparelho adicionado com sucesso!', 'success');
        this.closeModal('new-device-modal');
        this.loadClientDevices(this.currentClientId);
        this.updateStats();
    }

    openLinkDeviceModal() {
        if (!this.currentClientId) {
            this.showNotification('Salve o cliente primeiro!', 'warning');
            return;
        }

        const availableDevices = this.devices.filter(d => !d.ownerId);
        const listDiv = document.getElementById('available-devices-list');

        if (availableDevices.length === 0) {
            listDiv.innerHTML = '<p style="text-align: center; color: #666;">Nenhum aparelho disponível para vincular</p>';
        } else {
            listDiv.innerHTML = availableDevices.map(device => `
                <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s;" 
                     onmouseover="this.style.background='#f5f5f5'" 
                     onmouseout="this.style.background='white'"
                     onclick="clientManager.linkDevice('${device.id}', '${this.currentClientId}')">
                    <div>
                        <strong>${device.brand} ${device.model}</strong><br>
                        <small>Serial: ${device.imei || 'N/A'} | QR: ${device.qrCode}</small>
                    </div>
                    <button class="btn btn-primary btn-sm">Vincular</button>
                </div>
            `).join('');
        }

        this.openModal('link-device-modal');
    }

    linkDevice(deviceId, clientId) {
        const index = this.devices.findIndex(d => d.id === deviceId);
        this.devices[index].ownerId = clientId;
        localStorage.setItem('mockDevices', JSON.stringify(this.devices));

        this.showNotification('Aparelho vinculado com sucesso!', 'success');
        this.closeModal('link-device-modal');
        this.loadClientDevices(clientId);
        this.updateStats();
    }

    unlinkDevice(deviceId, clientId) {
        if (!confirm('Desvincular este aparelho do cliente?')) {
            return;
        }

        const index = this.devices.findIndex(d => d.id === deviceId);
        this.devices[index].ownerId = null;
        localStorage.setItem('mockDevices', JSON.stringify(this.devices));

        this.showNotification('Aparelho desvinculado com sucesso!', 'success');
        this.loadClientDevices(clientId);
        this.updateStats();
    }

    importClients() {
        this.showNotification('Função de importação em desenvolvimento', 'info');
    }

    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        document.getElementById('overlay').classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        document.getElementById('overlay').classList.remove('active');
    }

    generateId() {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    generateQRCode() {
        return 'QR-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };

        notification.style.backgroundColor = colors[type] || colors.info;
        if (type === 'warning') {
            notification.style.color = '#000';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.clientManager = new ClientManager();
});

// Adicionar CSS para animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .badge-info {
        background: #d1ecf1;
        color: #0c5460;
    }
    
    .search-input {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 300px;
        font-size: 14px;
    }
    
    @media (max-width: 768px) {
        .search-input {
            width: 100%;
        }
    }
`;
document.head.appendChild(style);
