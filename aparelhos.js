// Sistema de Gerenciamento de Aparelhos
class DeviceManager {
    constructor() {
        this.devices = [];
        this.clients = [];
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
        document.getElementById('new-device-btn').addEventListener('click', () => this.openDeviceModal());
        document.getElementById('scan-device-qr-btn').addEventListener('click', () => this.openQRScanner());
        document.getElementById('refresh-devices').addEventListener('click', () => this.loadDevices());

        // Busca e filtros
        document.getElementById('search-devices').addEventListener('input', (e) => this.loadDevices());
        document.getElementById('filter-device-owner').addEventListener('change', () => this.loadDevices());

        // Formulários
        document.getElementById('device-form').addEventListener('submit', (e) => this.handleDeviceSubmit(e));
        document.getElementById('process-device-qr-btn').addEventListener('click', () => this.processDeviceQR());

        // Modais
        this.setupModalListeners();

        // Menu toggle
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
            });
        }
        
        // Verificar se deve abrir modal para adicionar aparelho a um cliente específico
        const addDeviceForClient = localStorage.getItem('addDeviceForClient');
        if (addDeviceForClient) {
            localStorage.removeItem('addDeviceForClient');
            this.openDeviceModalForClient(addDeviceForClient);
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
        this.loadDevices();
        this.updateStats();
    }

    loadClients() {
        this.clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
        
        // Preencher select de proprietários
        const select = document.getElementById('device-owner');
        select.innerHTML = '<option value="">Sem proprietário (disponível para venda)</option>';
        this.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${client.name} - ${client.phone}`;
            select.appendChild(option);
        });
    }

    loadDevices() {
        const tbody = document.getElementById('devices-tbody');
        const loading = document.getElementById('devices-loading');
        const empty = document.getElementById('devices-empty');
        
        loading.style.display = 'block';
        empty.style.display = 'none';
        tbody.innerHTML = '';

        // Carregar aparelhos do localStorage
        this.devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');

        // Aplicar filtros
        const searchQuery = document.getElementById('search-devices').value.toLowerCase();
        const ownerFilter = document.getElementById('filter-device-owner').value;

        let filteredDevices = this.devices;

        // Filtro de busca
        if (searchQuery) {
            filteredDevices = filteredDevices.filter(device => 
                device.brand.toLowerCase().includes(searchQuery) ||
                device.model.toLowerCase().includes(searchQuery) ||
                (device.imei && device.imei.toLowerCase().includes(searchQuery)) ||
                device.qrCode.toLowerCase().includes(searchQuery)
            );
        }

        // Filtro de proprietário
        if (ownerFilter === 'with-owner') {
            filteredDevices = filteredDevices.filter(device => device.ownerId);
        } else if (ownerFilter === 'without-owner') {
            filteredDevices = filteredDevices.filter(device => !device.ownerId);
        }

        // Renderizar lista
        filteredDevices.forEach(device => {
            const row = this.createDeviceRow(device);
            tbody.appendChild(row);
        });

        loading.style.display = 'none';
        
        if (filteredDevices.length === 0) {
            empty.style.display = 'block';
        }

        this.updateStats();
    }

    createDeviceRow(device) {
        const row = document.createElement('tr');
        
        const owner = device.ownerId ? this.clients.find(c => c.id === device.ownerId) : null;
        const ownerName = owner ? owner.name : 'Sem proprietário';
        const createdAt = new Date(device.createdAt);

        row.innerHTML = `
            <td><span class="qr-code-badge">${device.qrCode}</span></td>
            <td>${device.brand}</td>
            <td>${device.model}</td>
            <td>${device.imei || 'N/A'}</td>
            <td>${ownerName}</td>
            <td>${createdAt.toLocaleDateString('pt-BR')} ${createdAt.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info btn-sm" onclick="deviceManager.viewDevice('${device.id}')">Ver</button>
                    <button class="btn btn-warning btn-sm" onclick="deviceManager.editDevice('${device.id}')">Editar</button>
                    <button class="btn btn-primary btn-sm" onclick="deviceManager.generateDeviceQR('${device.id}')">QR</button>
                    <button class="btn btn-danger btn-sm" onclick="deviceManager.deleteDevice('${device.id}')">Excluir</button>
                </div>
            </td>
        `;

        return row;
    }

    updateStats() {
        const total = this.devices.length;
        const withOwner = this.devices.filter(d => d.ownerId).length;
        const withoutOwner = total - withOwner;

        document.getElementById('stat-total-devices').textContent = total;
        document.getElementById('stat-devices-with-owner').textContent = withOwner;
        document.getElementById('stat-devices-without-owner').textContent = withoutOwner;
    }

    openDeviceModal(deviceId = null) {
        document.getElementById('device-modal-title').textContent = deviceId ? 'Editar Aparelho' : 'Novo Aparelho';
        document.getElementById('device-form').reset();
        document.getElementById('device-id').value = deviceId || '';

        if (deviceId) {
            const device = this.devices.find(d => d.id === deviceId);
            if (device) {
                document.getElementById('device-brand').value = device.brand;
                document.getElementById('device-model').value = device.model;
                document.getElementById('device-imei').value = device.imei || '';
                document.getElementById('device-owner').value = device.ownerId || '';
                document.getElementById('device-notes').value = device.notes || '';
            }
        }

        this.openModal('device-modal');
    }

    openDeviceModalForClient(clientId) {
        document.getElementById('device-modal-title').textContent = 'Novo Aparelho';
        document.getElementById('device-form').reset();
        document.getElementById('device-id').value = '';

        // Pre-selecionar o cliente
        const ownerSelect = document.getElementById('device-owner');
        ownerSelect.value = clientId;

        this.openModal('device-modal');
    }

    async handleDeviceSubmit(e) {
        e.preventDefault();

        const deviceId = document.getElementById('device-id').value;
        const data = {
            brand: document.getElementById('device-brand').value,
            model: document.getElementById('device-model').value,
            imei: document.getElementById('device-imei').value,
            ownerId: document.getElementById('device-owner').value || null,
            notes: document.getElementById('device-notes').value
        };

        try {
            let devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');

            if (deviceId) {
                // Atualizar aparelho existente
                const index = devices.findIndex(d => d.id === deviceId);
                if (index !== -1) {
                    devices[index] = { ...devices[index], ...data, updatedAt: new Date().toISOString() };
                    this.showNotification('Aparelho atualizado com sucesso', 'success');
                }
            } else {
                // Criar novo aparelho
                const qrNumber = String(devices.length + 1).padStart(5, '0');
                const newDevice = {
                    id: Date.now().toString(),
                    ...data,
                    qrCode: `QR-DEV-${qrNumber}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                devices.push(newDevice);
                this.showNotification(`Aparelho cadastrado! QR Code: ${newDevice.qrCode}`, 'success');
            }

            localStorage.setItem('mockDevices', JSON.stringify(devices));
            this.closeModal('device-modal');
            this.loadDevices();
        } catch (error) {
            console.error('Erro ao salvar aparelho:', error);
            this.showNotification('Erro ao salvar aparelho', 'error');
        }
    }

    editDevice(deviceId) {
        this.openDeviceModal(deviceId);
    }

    viewDevice(deviceId) {
        const device = this.devices.find(d => d.id === deviceId);
        if (!device) {
            this.showNotification('Aparelho não encontrado', 'error');
            return;
        }

        const owner = device.ownerId ? this.clients.find(c => c.id === device.ownerId) : null;
        const ownerInfo = owner ? `${owner.name} - ${owner.phone}` : 'Sem proprietário';

        const info = `
            <strong>Marca:</strong> ${device.brand}<br>
            <strong>Modelo:</strong> ${device.model}<br>
            <strong>Número de Série:</strong> ${device.imei || 'N/A'}<br>
            <strong>Proprietário:</strong> ${ownerInfo}<br>
            <strong>QR Code:</strong> ${device.qrCode}<br>
            <strong>Observações:</strong> ${device.notes || 'Nenhuma'}<br>
            <strong>Cadastrado em:</strong> ${new Date(device.createdAt).toLocaleString('pt-BR')}
        `;

        alert(info.replace(/<br>/g, '\n').replace(/<strong>|<\/strong>/g, ''));
    }

    deleteDevice(deviceId) {
        if (confirm('Tem certeza que deseja excluir este aparelho?')) {
            let devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');
            devices = devices.filter(d => d.id !== deviceId);
            localStorage.setItem('mockDevices', JSON.stringify(devices));
            this.showNotification('Aparelho excluído com sucesso', 'success');
            this.loadDevices();
        }
    }

    generateDeviceQR(deviceId) {
        const device = this.devices.find(d => d.id === deviceId);
        if (!device) {
            this.showNotification('Aparelho não encontrado', 'error');
            return;
        }

        const owner = device.ownerId ? this.clients.find(c => c.id === device.ownerId) : null;
        const ownerInfo = owner ? `<p><strong>Proprietário:</strong> ${owner.name}</p>` : '<p><strong>Status:</strong> Disponível para venda</p>';

        const qrWindow = window.open('', '_blank', 'width=450,height=700');
        qrWindow.document.write(`
            <html>
            <head>
                <title>QR Code - ${device.brand} ${device.model}</title>
                <style>
                    body { 
                        text-align: center; 
                        padding: 20px;
                        font-family: Arial, sans-serif;
                    }
                    .device-info {
                        background: #f5f5f5;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 20px 0;
                        text-align: left;
                    }
                    .device-info p {
                        margin: 8px 0;
                    }
                    #qrcode {
                        display: inline-block;
                        margin: 20px 0;
                    }
                    #qrcode canvas {
                        border: 2px solid #ddd;
                        border-radius: 8px;
                        padding: 10px;
                        background: white;
                    }
                    .qr-code-text {
                        font-family: 'Courier New', monospace;
                        font-size: 18px;
                        font-weight: bold;
                        color: #1976d2;
                        margin: 15px 0;
                        padding: 10px;
                        background: #e3f2fd;
                        border-radius: 4px;
                    }
                </style>
            </head>
            <body>
                <h2>QR Code do Aparelho</h2>
                <div class="device-info">
                    <p><strong>Marca:</strong> ${device.brand}</p>
                    <p><strong>Modelo:</strong> ${device.model}</p>
                    ${device.imei ? `<p><strong>Número de Série:</strong> ${device.imei}</p>` : ''}
                    ${ownerInfo}
                </div>
                <div id="qrcode"></div>
                <div class="qr-code-text">${device.qrCode}</div>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                <script>
                    new QRCode(document.getElementById('qrcode'), {
                        text: '${device.qrCode}',
                        width: 256,
                        height: 256
                    });
                </script>
            </body>
            </html>
        `);

        this.showNotification(`QR Code gerado para ${device.brand} ${device.model}`, 'success');
    }

    openQRScanner() {
        document.getElementById('device-qr-input').value = '';
        document.getElementById('device-qr-result').style.display = 'none';
        document.getElementById('device-qr-success').style.display = 'none';
        document.getElementById('device-qr-error').style.display = 'none';
        this.openModal('device-qr-modal');
    }

    processDeviceQR() {
        const qrInput = document.getElementById('device-qr-input').value.trim();
        
        if (!qrInput) {
            this.showNotification('Cole o código QR primeiro', 'warning');
            return;
        }

        const device = this.devices.find(d => d.qrCode === qrInput);

        const resultDiv = document.getElementById('device-qr-result');
        const successDiv = document.getElementById('device-qr-success');
        const errorDiv = document.getElementById('device-qr-error');
        const infoDiv = document.getElementById('device-qr-info');

        resultDiv.style.display = 'block';

        if (device) {
            const owner = device.ownerId ? this.clients.find(c => c.id === device.ownerId) : null;
            const ownerInfo = owner ? `<p><strong>Proprietário:</strong> ${owner.name} (${owner.phone})</p>` : '<p><strong>Status:</strong> Disponível para venda</p>';

            infoDiv.innerHTML = `
                <p><strong>Marca:</strong> ${device.brand}</p>
                <p><strong>Modelo:</strong> ${device.model}</p>
                ${device.imei ? `<p><strong>Número de Série:</strong> ${device.imei}</p>` : ''}
                ${ownerInfo}
                <div style="margin-top: 15px;">
                    <button class="btn btn-warning" onclick="deviceManager.editDevice('${device.id}'); deviceManager.closeModal('device-qr-modal');">Editar Aparelho</button>
                    <button class="btn btn-primary" onclick="deviceManager.generateDeviceQR('${device.id}')">Gerar QR Code</button>
                </div>
            `;

            successDiv.style.display = 'block';
            errorDiv.style.display = 'none';
        } else {
            document.getElementById('device-qr-error-message').textContent = 'QR Code não encontrado. Verifique o código ou cadastre um novo aparelho.';
            successDiv.style.display = 'none';
            errorDiv.style.display = 'block';
        }
    }

    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
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
            notification.style.color = '#212529';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.deviceManager = new DeviceManager();
});
