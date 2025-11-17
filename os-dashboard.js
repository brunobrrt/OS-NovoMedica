// Dashboard de OS - JavaScript principal
class OSDashboard {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api'; // Configurar conforme necessário
        this.qrManager = new QRCodeManager(this.apiBaseUrl);
        this.atendimentosAPI = new AtendimentosAPI(this.apiBaseUrl);
        this.osAPI = new OSApi(this.apiBaseUrl);
        this.clientsAPI = new ClientsAPI(this.apiBaseUrl);
        
        this.currentQRData = null;
        this.signatureCanvas = null;
        this.signatureCtx = null;
        this.isDrawing = false;
        
        this.init();
    }

    init() {
        this.initializeAuth();
        this.setupEventListeners();
        this.initSignatureCanvas();
        this.loadInitialData();
    }

    initializeAuth() {
        // Verificar autenticação usando authSystem
        if (!authSystem.requireAuth()) {
            return; // Redireciona automaticamente para login
        }
        
        // Atualizar informações do usuário na interface
        const user = authSystem.getCurrentUser();
        if (user) {
            const userEmailElement = document.getElementById('userEmail');
            if (userEmailElement) {
                userEmailElement.textContent = user.email;
            }
        }
        
        // Verificar autenticação via token (compatibilidade)
        const token = localStorage.getItem('authToken');
        if (!token) {
            // Em produção, redirecionar para login
            console.warn('Token não encontrado. Usando modo mock.');
            // Para desenvolvimento, usar token mock
            const mockToken = 'mock-jwt-token';
            localStorage.setItem('authToken', mockToken);
            this.qrManager.setAuthToken(mockToken);
            this.atendimentosAPI.setAuthToken(mockToken);
            this.osAPI.setAuthToken(mockToken);
            this.clientsAPI.setAuthToken(mockToken);
        } else {
            this.qrManager.setAuthToken(token);
            this.atendimentosAPI.setAuthToken(token);
            this.osAPI.setAuthToken(token);
            this.clientsAPI.setAuthToken(token);
        }
        
        // Configurar botão de logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                authSystem.logout();
            });
        }
    }

    setupEventListeners() {
        // Botões principais
        document.getElementById('qr-scan-btn').addEventListener('click', () => this.openQRModal());
        document.getElementById('manage-devices-btn').addEventListener('click', () => window.location.href = 'aparelhos.html');
        document.getElementById('manage-clients-btn').addEventListener('click', () => this.openClientsListModal());
        document.getElementById('new-atendimento-btn').addEventListener('click', () => this.openAtendimentoModal());
        document.getElementById('new-os-btn').addEventListener('click', () => this.openOSModal());
        document.getElementById('add-client-btn').addEventListener('click', () => this.openNewClientModal());
        document.getElementById('scan-qr-client-btn').addEventListener('click', () => this.openQRModalForAtendimento());

        // Busca de cliente
        document.getElementById('atendimento-client-search').addEventListener('input', (e) => this.searchClients(e.target.value));

        // Botões de refresh
        document.getElementById('refresh-atendimentos').addEventListener('click', () => this.loadAtendimentos());
        document.getElementById('refresh-entrada-aparelhos').addEventListener('click', () => this.loadEntradaAparelhos());
        document.getElementById('refresh-os-pending').addEventListener('click', () => this.loadOSPending());
        document.getElementById('filter-os-pending').addEventListener('change', () => this.loadOSPending());
        document.getElementById('refresh-saida-aparelhos').addEventListener('click', () => this.loadSaidaAparelhos());
        document.getElementById('refresh-clients-list').addEventListener('click', () => this.loadClientsList());
        document.getElementById('refresh-os-signed').addEventListener('click', () => this.loadOSSigned());
        document.getElementById('refresh-os-awaiting-payment').addEventListener('click', () => this.loadOSAwaitingPayment());
        document.getElementById('refresh-os-paid').addEventListener('click', () => this.loadOSPaid());
        document.getElementById('refresh-os-finalized').addEventListener('click', () => this.loadOSFinalized());

        // Search clients list
        document.getElementById('search-clients-list').addEventListener('input', (e) => this.filterClientsList(e.target.value));
        document.getElementById('add-new-client-btn').addEventListener('click', () => this.openNewClientModal());

        // Filtros
        document.getElementById('filter-atendimentos').addEventListener('change', () => this.loadAtendimentos());
        document.getElementById('filter-priority').addEventListener('change', () => this.loadAtendimentos());
        document.getElementById('sort-atendimentos').addEventListener('change', () => this.loadAtendimentos());

        // Botões de lista expandida
        document.getElementById('expand-atendimentos').addEventListener('click', () => this.openExpandedList('atendimentos'));
        document.getElementById('expand-os-pending').addEventListener('click', () => this.openExpandedList('os-pending'));

        // QR Code
        document.getElementById('process-qr-btn').addEventListener('click', () => this.processQRCode());

        // Modais
        this.setupModalListeners();

        // Formulários
        document.getElementById('atendimento-form').addEventListener('submit', (e) => this.handleAtendimentoSubmit(e));
        document.getElementById('os-form').addEventListener('submit', (e) => this.handleOSSubmit(e));
        document.getElementById('client-form').addEventListener('submit', (e) => this.handleClientSubmit(e));
        document.getElementById('payment-form').addEventListener('submit', (e) => this.handlePaymentSubmit(e));

        // Assinatura
        document.getElementById('clear-signature').addEventListener('click', () => this.clearSignature());
        document.getElementById('save-signature').addEventListener('click', () => this.saveSignature());
        
        // Confirmação de pagamento
        document.getElementById('confirm-payment-btn').addEventListener('click', () => this.confirmPayment());
        
        // Fotos de entrada e saída
        document.getElementById('salvar-fotos-entrada-btn').addEventListener('click', () => this.salvarFotosEntrada());
        document.getElementById('salvar-fotos-saida-btn').addEventListener('click', () => this.salvarFotosSaida());
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

        // Overlay
        document.getElementById('overlay').addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    }

    initSignatureCanvas() {
        this.signatureCanvas = document.getElementById('signature-canvas');
        this.signatureCtx = this.signatureCanvas.getContext('2d');
        
        this.signatureCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.signatureCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.signatureCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.signatureCanvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events para mobile
        this.signatureCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.signatureCanvas.dispatchEvent(mouseEvent);
        });

        this.signatureCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.signatureCanvas.dispatchEvent(mouseEvent);
        });

        this.signatureCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.signatureCanvas.dispatchEvent(mouseEvent);
        });
    }

    async loadInitialData() {
        await this.loadStats();
        await Promise.all([
            this.loadAtendimentos(),
            this.loadEntradaAparelhos(),
            this.loadOSPending(),
            this.loadSaidaAparelhos(),
            this.loadOSSigned(),
            this.loadOSAwaitingPayment(),
            this.loadOSPaid(),
            this.loadOSFinalized(),
            this.loadClientOptions()
        ]);
    }

    async loadStats() {
        try {
            // Carregar estatísticas do localStorage
            const ordens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
            const atendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
            
            // Estatísticas de Atendimentos por status (todos os 8 status)
            document.getElementById('stat-em-manutencao').textContent = atendimentos.filter(a => a.status === 'em_manutencao').length;
            document.getElementById('stat-aguardando-pecas').textContent = atendimentos.filter(a => a.status === 'aguardando_pecas').length;
            document.getElementById('stat-aparelho-pronto').textContent = atendimentos.filter(a => a.status === 'aparelho_pronto').length;
            document.getElementById('stat-aguardando-orcamento').textContent = atendimentos.filter(a => a.status === 'aguardando_orcamento').length;
            document.getElementById('stat-pendente').textContent = atendimentos.filter(a => a.status === 'pendente').length;
            document.getElementById('stat-reprovado').textContent = atendimentos.filter(a => a.status === 'reprovado_esperando_devolucao').length;
            document.getElementById('stat-aguardando-visita').textContent = atendimentos.filter(a => a.status === 'aguardando_visita_tecnica').length;
            document.getElementById('stat-a-caminho').textContent = atendimentos.filter(a => a.status === 'aparelho_a_caminho').length;
            
            // Estatísticas de OS por status
            document.getElementById('stat-os-aguardando-assinatura').textContent = ordens.filter(o => o.status === 'aguardando_assinatura').length;
            document.getElementById('stat-os-pending').textContent = ordens.filter(o => o.status === 'pending').length;
            document.getElementById('stat-os-signed').textContent = ordens.filter(o => o.status === 'signed').length;
            document.getElementById('stat-os-awaiting-payment').textContent = ordens.filter(o => o.status === 'awaiting_payment').length;
            document.getElementById('stat-os-paid').textContent = ordens.filter(o => o.status === 'paid').length;
            document.getElementById('stat-os-finalized').textContent = ordens.filter(o => o.status === 'finalized').length;
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    async loadAtendimentos() {
        const tbody = document.getElementById('atendimentos-tbody');
        const loading = document.getElementById('atendimentos-loading');
        const empty = document.getElementById('atendimentos-empty');
        
        try {
            loading.style.display = 'block';
            empty.style.display = 'none';
            tbody.innerHTML = '';

            const status = document.getElementById('filter-atendimentos').value;
            const priority = document.getElementById('filter-priority').value;
            const sortValue = document.getElementById('sort-atendimentos').value;
            const [sortBy, sortOrder] = sortValue.split('-');

            // Carregar atendimentos do localStorage
            const allAtendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
            const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
            
            // Preencher dados do cliente em cada atendimento
            const mockAtendimentos = allAtendimentos.map(atend => {
                const client = clients.find(c => c.id === atend.clientId);
                return {
                    ...atend,
                    client: client || { id: atend.clientId, name: 'Cliente não encontrado', phone: 'N/A' }
                };
            });

            let filteredData = mockAtendimentos;
            
            // Ocultar atendimentos finalizados e recusados por padrão
            const hiddenStatuses = ['os_criada', 'atendimento_finalizado', 'recusado'];
            
            if (status) {
                // Se um status específico foi selecionado, filtrar por ele
                filteredData = filteredData.filter(item => item.status === status);
            } else {
                // Se nenhum status foi selecionado ("Todos os Status"), ocultar status finalizados
                filteredData = filteredData.filter(item => !hiddenStatuses.includes(item.status));
            }
            
            // Filtrar por prioridade
            if (priority) {
                filteredData = filteredData.filter(item => item.priority === priority);
            }

            filteredData.forEach(atendimento => {
                const row = this.createAtendimentoRow(atendimento);
                tbody.appendChild(row);
            });

            if (filteredData.length === 0) {
                empty.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao carregar atendimentos:', error);
            this.showNotification('Erro ao carregar atendimentos', 'error');
        } finally {
            loading.style.display = 'none';
        }
    }

    createAtendimentoRow(atendimento) {
        const row = document.createElement('tr');
        const createdAt = new Date(atendimento.createdAt);
        
        // Formatar o nome do status para exibição
        const statusDisplay = this.formatStatusName(atendimento.status);
        
        row.innerHTML = `
            <td>${atendimento.id.substring(0, 8)}...</td>
            <td>${atendimento.client.name}</td>
            <td>${atendimento.client.phone}</td>
            <td>${atendimento.summary}</td>
            <td><span class="priority-badge priority-${atendimento.priority}">${atendimento.priority}</span></td>
            <td>${createdAt.toLocaleDateString('pt-BR')} ${createdAt.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</td>
            <td><span class="status-badge status-${atendimento.status}">${statusDisplay}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info btn-sm" onclick="dashboard.editAtendimento('${atendimento.id}')">Editar</button>
                    <button class="btn btn-success btn-sm" onclick="dashboard.createOSFromAtendimento('${atendimento.id}')">Abrir OS</button>
                    <button class="btn btn-primary btn-sm" onclick="dashboard.generateQRForClient('${atendimento.client.id}')">QR</button>
                    <button class="btn btn-danger btn-sm" onclick="dashboard.deleteAtendimento('${atendimento.id}')">Excluir</button>
                </div>
            </td>
        `;
        
        return row;
    }

    formatStatusName(status) {
        const statusNames = {
            'pendente': 'Pendente',
            'aguardando_assinatura': 'Aguardando Assinatura',
            'aguardando_orcamento': 'Aguardando Orçamento',
            'aguardando_pecas': 'Aguardando Peças',
            'em_manutencao': 'Em Manutenção',
            'periodo_testes': 'Período de Testes',
            'aparelho_pronto': 'Aparelho Pronto',
            'reprovado_esperando_devolucao': 'Reprovado - Esperando Devolução',
            'aguardando_visita_tecnica': 'Aguardando Visita Técnica',
            'aparelho_a_caminho': 'Aparelho a Caminho',
            'os_criada': 'OS Criada',
            'atendimento_finalizado': 'Atendimento Finalizado',
            'recusado': 'Recusado',
            'aguardando': 'Aguardando',
            'em_atendimento': 'Em Atendimento',
            'pending': 'Pendente',
            'signed': 'Assinada',
            'awaiting_payment': 'Aguardando Pagamento',
            'paid': 'Paga',
            'finalized': 'Finalizada'
        };
        return statusNames[status] || status.replace(/_/g, ' ');
    }

    async loadOSPending() {
        const tbody = document.getElementById('os-pending-tbody');
        const loading = document.getElementById('os-pending-loading');
        const empty = document.getElementById('os-pending-empty');
        
        try {
            loading.style.display = 'block';
            empty.style.display = 'none';
            tbody.innerHTML = '';

            const status = document.getElementById('filter-os-pending').value;

            // Carregar OS do localStorage
            const allOrdens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
            let mockOrdens = allOrdens;
            
            // Filtrar por status se selecionado
            if (status) {
                // Se um status específico foi selecionado, filtrar por ele
                mockOrdens = mockOrdens.filter(o => o.status === status);
            } else {
                // Se nenhum status foi selecionado ("Todos os Status"), ocultar status que não são pendentes
                // Ocultar: signed, aparelho_pronto, periodo_testes (estes vão para lista de saída)
                const hiddenStatuses = ['signed', 'aparelho_pronto', 'periodo_testes', 'finalized', 'paid', 'awaiting_payment'];
                mockOrdens = mockOrdens.filter(o => !hiddenStatuses.includes(o.status));
            }

            mockOrdens.forEach(ordem => {
                const row = this.createOSRow(ordem, 'os-pending');
                tbody.appendChild(row);
            });

            if (mockOrdens.length === 0) {
                empty.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao carregar OS pendentes:', error);
        } finally {
            loading.style.display = 'none';
        }
    }

    createOSRow(ordem, context) {
        const row = document.createElement('tr');
        const createdAt = new Date(ordem.createdAt);
        
        let actions = '';
        let extraColumns = '';
        
        if (context === 'pending' || context === 'os-pending') {
            const statusBadge = ordem.status ? `<td><span class="status-badge status-${ordem.status}">${this.formatStatusName(ordem.status)}</span></td>` : '<td>-</td>';
            extraColumns = context === 'os-pending' ? statusBadge : '';
            
            // Verificar se tem fotos de entrada ou saída
            const hasFotosEntrada = ordem.fotosEntradaCount > 0;
            const hasFotosSaida = ordem.fotosSaidaCount > 0;
            const fotosBtn = (hasFotosEntrada || hasFotosSaida) ? 
                `<button class="btn btn-primary btn-sm" onclick="dashboard.viewOSFotos('${ordem.id}')">📷 Fotos</button>` : '';
            
            actions = `
                <button class="btn btn-info btn-sm" onclick="dashboard.viewOS('${ordem.id}')">Ver</button>
                <button class="btn btn-warning btn-sm" onclick="dashboard.editOS('${ordem.id}')">Editar</button>
                <button class="btn btn-success btn-sm" onclick="dashboard.signOS('${ordem.id}')">Assinar</button>
                ${fotosBtn}
                <button class="btn btn-danger btn-sm" onclick="dashboard.deleteOS('${ordem.id}')">Excluir</button>
            `;
        } else if (context === 'signed') {
            const qrCode = ordem.qrCode || 'N/A';
            extraColumns = `<td><span class="qr-code-badge">${qrCode}</span></td>`;
            
            const hasFotosEntrada = ordem.fotosEntradaCount > 0;
            const hasFotosSaida = ordem.fotosSaidaCount > 0;
            const fotosBtn = (hasFotosEntrada || hasFotosSaida) ? 
                `<button class="btn btn-primary btn-sm" onclick="dashboard.viewOSFotos('${ordem.id}')">📷 Fotos</button>` : '';
            
            actions = `
                <button class="btn btn-info btn-sm" onclick="dashboard.viewOS('${ordem.id}')">Ver</button>
                ${fotosBtn}
                <button class="btn btn-success btn-sm" onclick="dashboard.sendToPaymentDirect('${ordem.id}')">Enviar p/ Pagamento</button>
                <button class="btn btn-danger btn-sm" onclick="dashboard.deleteOS('${ordem.id}')">Excluir</button>
            `;
        } else if (context === 'awaiting_payment') {
            const qrCode = ordem.qrCode || 'N/A';
            const paymentAmount = ordem.paymentAmount ? `R$ ${ordem.paymentAmount.toFixed(2)}` : 'N/A';
            const paymentMethod = ordem.paymentMethod || 'N/A';
            extraColumns = `
                <td><span class="qr-code-badge">${qrCode}</span></td>
                <td>${paymentAmount}</td>
                <td>${paymentMethod}</td>
            `;
            
            const hasFotosEntrada = ordem.fotosEntradaCount > 0;
            const hasFotosSaida = ordem.fotosSaidaCount > 0;
            const fotosBtn = (hasFotosEntrada || hasFotosSaida) ? 
                `<button class="btn btn-primary btn-sm" onclick="dashboard.viewOSFotos('${ordem.id}')">📷 Fotos</button>` : '';
            
            actions = `
                <button class="btn btn-info btn-sm" onclick="dashboard.viewOS('${ordem.id}')">Ver</button>
                ${fotosBtn}
                <button class="btn btn-success btn-sm" onclick="dashboard.openConfirmPayment('${ordem.id}')">Confirmar Pagamento</button>
                <button class="btn btn-danger btn-sm" onclick="dashboard.deleteOS('${ordem.id}')">Excluir</button>
            `;
        } else if (context === 'paid') {
            const qrCode = ordem.qrCode || 'N/A';
            const paymentAmount = ordem.paymentAmount ? `R$ ${ordem.paymentAmount.toFixed(2)}` : 'N/A';
            const paymentDate = ordem.paidAt ? new Date(ordem.paidAt).toLocaleDateString('pt-BR') : 'N/A';
            extraColumns = `
                <td><span class="qr-code-badge">${qrCode}</span></td>
                <td>${paymentAmount}</td>
                <td>${paymentDate}</td>
            `;
            
            const hasFotosEntrada = ordem.fotosEntradaCount > 0;
            const hasFotosSaida = ordem.fotosSaidaCount > 0;
            const fotosBtn = (hasFotosEntrada || hasFotosSaida) ? 
                `<button class="btn btn-primary btn-sm" onclick="dashboard.viewOSFotos('${ordem.id}')">📷 Fotos</button>` : '';
            
            actions = `
                <button class="btn btn-info btn-sm" onclick="dashboard.viewOS('${ordem.id}')">Ver</button>
                ${fotosBtn}
                <button class="btn btn-primary btn-sm" onclick="dashboard.finalizeOS('${ordem.id}')">Finalizar</button>
                <button class="btn btn-danger btn-sm" onclick="dashboard.deleteOS('${ordem.id}')">Excluir</button>
            `;
        } else if (context === 'finalized') {
            const qrCode = ordem.qrCode || 'N/A';
            extraColumns = `<td><span class="qr-code-badge">${qrCode}</span></td>`;
            
            const hasFotosEntrada = ordem.fotosEntradaCount > 0;
            const hasFotosSaida = ordem.fotosSaidaCount > 0;
            const fotosBtn = (hasFotosEntrada || hasFotosSaida) ? 
                `<button class="btn btn-primary btn-sm" onclick="dashboard.viewOSFotos('${ordem.id}')">📷 Fotos</button>` : '';
            
            actions = `
                <button class="btn btn-info btn-sm" onclick="dashboard.viewOS('${ordem.id}')">Ver</button>
                ${fotosBtn}
                <button class="btn btn-secondary btn-sm" onclick="dashboard.downloadOS('${ordem.id}')">Download</button>
                <button class="btn btn-danger btn-sm" onclick="dashboard.deleteOS('${ordem.id}')">Excluir</button>
            `;
        }
        
        row.innerHTML = `
            <td>${ordem.id.substring(0, 8)}...</td>
            <td>${ordem.client.name}</td>
            <td>${ordem.summary}</td>
            <td>${ordem.technician}</td>
            <td>${createdAt.toLocaleDateString('pt-BR')} ${createdAt.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</td>
            ${extraColumns}
            <td>
                <div class="action-buttons">
                    ${actions}
                </div>
            </td>
        `;
        
        return row;
    }

    async loadOSSigned() {
        const tbody = document.getElementById('os-signed-tbody');
        const loading = document.getElementById('os-signed-loading');
        const empty = document.getElementById('os-signed-empty');
        
        try {
            loading.style.display = 'block';
            empty.style.display = 'none';
            tbody.innerHTML = '';

            // Carregar OS do localStorage
            const allOrdens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
            const mockOrdens = allOrdens.filter(o => o.status === 'signed');

            mockOrdens.forEach(ordem => {
                const row = this.createOSRow(ordem, 'signed');
                tbody.appendChild(row);
            });

            if (mockOrdens.length === 0) {
                empty.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao carregar OS assinadas:', error);
        } finally {
            loading.style.display = 'none';
        }
    }

    async loadOSFinalized() {
        const tbody = document.getElementById('os-finalized-tbody');
        const loading = document.getElementById('os-finalized-loading');
        const empty = document.getElementById('os-finalized-empty');
        
        try {
            loading.style.display = 'block';
            empty.style.display = 'none';
            tbody.innerHTML = '';

            // Carregar OS do localStorage
            const allOrdens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
            const mockOrdens = allOrdens.filter(o => o.status === 'finalized');

            mockOrdens.forEach(ordem => {
                const row = this.createOSRow(ordem, 'finalized');
                tbody.appendChild(row);
            });

            if (mockOrdens.length === 0) {
                empty.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao carregar OS finalizadas:', error);
        } finally {
            loading.style.display = 'none';
        }
    }

    async loadOSAwaitingPayment() {
        const tbody = document.getElementById('os-awaiting-payment-tbody');
        const loading = document.getElementById('os-awaiting-payment-loading');
        const empty = document.getElementById('os-awaiting-payment-empty');
        
        try {
            loading.style.display = 'block';
            empty.style.display = 'none';
            tbody.innerHTML = '';

            // Carregar OS do localStorage
            const allOrdens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
            const mockOrdens = allOrdens.filter(o => o.status === 'awaiting_payment');

            mockOrdens.forEach(ordem => {
                const row = this.createOSRow(ordem, 'awaiting_payment');
                tbody.appendChild(row);
            });

            if (mockOrdens.length === 0) {
                empty.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao carregar OS aguardando pagamento:', error);
        } finally {
            loading.style.display = 'none';
        }
    }

    async loadOSPaid() {
        const tbody = document.getElementById('os-paid-tbody');
        const loading = document.getElementById('os-paid-loading');
        const empty = document.getElementById('os-paid-empty');
        
        try {
            loading.style.display = 'block';
            empty.style.display = 'none';
            tbody.innerHTML = '';

            // Carregar OS do localStorage
            const allOrdens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
            const mockOrdens = allOrdens.filter(o => o.status === 'paid');

            mockOrdens.forEach(ordem => {
                const row = this.createOSRow(ordem, 'paid');
                tbody.appendChild(row);
            });

            if (mockOrdens.length === 0) {
                empty.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao carregar OS pagas:', error);
        } finally {
            loading.style.display = 'none';
        }
    }

    async loadEntradaAparelhos() {
        const tbody = document.getElementById('entrada-aparelhos-tbody');
        const loading = document.getElementById('entrada-aparelhos-loading');
        const empty = document.getElementById('entrada-aparelhos-empty');
        
        try {
            loading.style.display = 'block';
            empty.style.display = 'none';
            tbody.innerHTML = '';

            // Carregar atendimentos que estão em status de entrada (recém-criados ou a caminho)
            const allAtendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
            const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
            const devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');
            
            const entradaStatuses = ['pendente', 'aparelho_a_caminho', 'aguardando_orcamento'];
            const entradaItems = allAtendimentos.filter(a => entradaStatuses.includes(a.status));

            entradaItems.forEach(item => {
                const client = clients.find(c => c.id === item.clientId);
                const device = devices.find(d => d.id === item.deviceId);
                const row = this.createEntradaAparelhoRow(item, client, device);
                tbody.appendChild(row);
            });

            if (entradaItems.length === 0) {
                empty.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao carregar entrada de aparelhos:', error);
        } finally {
            loading.style.display = 'none';
        }
    }

    createEntradaAparelhoRow(item, client, device) {
        const row = document.createElement('tr');
        const createdAt = new Date(item.createdAt);
        
        const clientName = client ? client.name : 'Cliente não encontrado';
        const deviceInfo = device ? `${device.brand} ${device.model}` : item.summary || 'N/A';
        const serial = device ? (device.imei || 'N/A') : 'N/A';
        
        // Verificar fotos de entrada
        const fotosCount = item.fotosEntradaCount || 0;
        const hasObs = item.fotosEntradaObs ? '📝' : '';
        const fotosStatus = fotosCount > 0 ? `✅ ${fotosCount} foto${fotosCount > 1 ? 's' : ''} ${hasObs}` : '📷 Adicionar';
        
        row.innerHTML = `
            <td>${createdAt.toLocaleDateString('pt-BR')} ${createdAt.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</td>
            <td>${clientName}</td>
            <td>${deviceInfo}</td>
            <td>${serial}</td>
            <td>${item.summary || 'N/A'}</td>
            <td>
                <button class="btn btn-sm ${fotosCount > 0 ? 'btn-success' : 'btn-warning'}" onclick="dashboard.openFotosEntrada('${item.id}')">${fotosStatus}</button>
                ${fotosCount > 0 ? `<button class="btn btn-sm btn-info" onclick="dashboard.viewAtendimentoFotos('${item.id}')" title="Ver fotos">👁️</button>` : ''}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info btn-sm" onclick="dashboard.editAtendimento('${item.id}')">Editar</button>
                    <button class="btn btn-primary btn-sm" onclick="dashboard.createOSFromAtendimento('${item.id}')">Iniciar OS</button>
                </div>
            </td>
        `;
        
        return row;
    }

    async loadSaidaAparelhos() {
        const tbody = document.getElementById('saida-aparelhos-tbody');
        const loading = document.getElementById('saida-aparelhos-loading');
        const empty = document.getElementById('saida-aparelhos-empty');
        
        try {
            loading.style.display = 'block';
            empty.style.display = 'none';
            tbody.innerHTML = '';

            // Carregar atendimentos e OS que estão prontos para saída
            const allAtendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
            const allOrdens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
            const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
            const devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');
            
            const saidaStatuses = ['aparelho_pronto', 'periodo_testes'];
            
            // Atendimentos com status de saída
            const saidaAtendimentos = allAtendimentos.filter(a => saidaStatuses.includes(a.status));
            
            // OS com status de saída
            const saidaOrdens = allOrdens.filter(o => saidaStatuses.includes(o.status));

            // Renderizar atendimentos
            saidaAtendimentos.forEach(item => {
                const client = clients.find(c => c.id === item.clientId);
                const device = devices.find(d => d.id === item.deviceId);
                const row = this.createSaidaAparelhoRow(item, client, device, 'atendimento');
                tbody.appendChild(row);
            });
            
            // Renderizar OS
            saidaOrdens.forEach(ordem => {
                const client = clients.find(c => c.id === ordem.clientId);
                const row = this.createSaidaAparelhoRow(ordem, client, null, 'os');
                tbody.appendChild(row);
            });

            if (saidaAtendimentos.length === 0 && saidaOrdens.length === 0) {
                empty.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao carregar saída de aparelhos:', error);
        } finally {
            loading.style.display = 'none';
        }
    }

    createSaidaAparelhoRow(item, client, device, tipo) {
        const row = document.createElement('tr');
        const updatedAt = new Date(item.updatedAt || item.createdAt);
        
        const clientName = client ? client.name : 'Cliente não encontrado';
        const deviceInfo = device ? `${device.brand} ${device.model}` : item.summary || 'N/A';
        const serial = device ? (device.imei || 'N/A') : 'N/A';
        
        // Verificar fotos de saída
        const fotosCount = item.fotosSaidaCount || 0;
        const hasObs = item.fotosSaidaObs ? '📝' : '';
        const fotosStatus = fotosCount > 0 ? `✅ ${fotosCount} foto${fotosCount > 1 ? 's' : ''} ${hasObs}` : '📷 Adicionar';
        
        // Ações diferentes para OS e Atendimento
        let actions = '';
        if (tipo === 'atendimento') {
            actions = `
                <button class="btn btn-info btn-sm" onclick="dashboard.editAtendimento('${item.id}')">Editar</button>
                <button class="btn btn-success btn-sm" onclick="dashboard.finalizarEntrega('${item.id}')">Finalizar Entrega</button>
            `;
        } else if (tipo === 'os') {
            actions = `
                <button class="btn btn-info btn-sm" onclick="dashboard.viewOS('${item.id}')">Ver OS</button>
                <button class="btn btn-warning btn-sm" onclick="dashboard.editOS('${item.id}')">Editar</button>
                <button class="btn btn-success btn-sm" onclick="dashboard.finalizarEntregaOS('${item.id}')">Finalizar Entrega</button>
            `;
        }
        
        row.innerHTML = `
            <td>${updatedAt.toLocaleDateString('pt-BR')} ${updatedAt.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</td>
            <td>${clientName}</td>
            <td>${deviceInfo}</td>
            <td>${serial}</td>
            <td>${item.notes || item.summary || 'N/A'}</td>
            <td>
                <button class="btn btn-sm ${fotosCount > 0 ? 'btn-success' : 'btn-warning'}" onclick="dashboard.openFotosSaida('${item.id}')">${fotosStatus}</button>
                ${fotosCount > 0 ? `<button class="btn btn-sm btn-info" onclick="dashboard.viewAtendimentoFotos('${item.id}')" title="Ver fotos">👁️</button>` : ''}
            </td>
            <td>
                <div class="action-buttons">
                    ${actions}
                </div>
            </td>
        `;
        
        return row;
    }

    async loadClientOptions() {
        try {
            // Usar localStorage para persistir clientes
            let clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
            
            // Adicionar clientes padrão se lista estiver vazia
            if (clients.length === 0) {
                clients = [
                    { id: '1', name: 'João Silva', phone: '(11) 98765-4321', cpfCnpj: '123.456.789-00', email: 'joao@email.com', qrCode: 'QR-CLI-001' },
                    { id: '2', name: 'Maria Santos', phone: '(11) 91234-5678', cpfCnpj: '987.654.321-00', email: 'maria@email.com', qrCode: 'QR-CLI-002' },
                    { id: '3', name: 'Pedro Costa', phone: '(21) 99876-5432', cpfCnpj: '12.345.678/0001-90', email: 'pedro@email.com', qrCode: 'QR-CLI-003' }
                ];
                localStorage.setItem('mockClients', JSON.stringify(clients));
            }

            const selects = ['atendimento-client', 'os-client'];
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                select.innerHTML = '<option value="">Selecione um cliente</option>';
                clients.forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.id;
                    option.textContent = client.name;
                    select.appendChild(option);
                });
            });
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    }

    // Modal management
    openQRModal() {
        document.getElementById('qr-input').value = '';
        document.getElementById('qr-result').style.display = 'none';
        document.getElementById('qr-success').style.display = 'none';
        document.getElementById('qr-error').style.display = 'none';
        this.openModal('qr-modal');
    }

    openAtendimentoModal(id = null) {
        document.getElementById('atendimento-modal-title').textContent = id ? 'Editar Atendimento' : 'Novo Atendimento';
        document.getElementById('atendimento-form').reset();
        document.getElementById('atendimento-id').value = id || '';
        
        // Definir data/hora atual como padrão no formato brasileiro
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        document.getElementById('atendimento-date').value = `${day}/${month}/${year}`;
        document.getElementById('atendimento-time').value = `${hours}:${minutes}`;
        
        this.openModal('atendimento-modal');
    }

    openOSModal(id = null) {
        document.getElementById('os-modal-title').textContent = id ? 'Editar OS' : 'Nova OS';
        document.getElementById('os-form').reset();
        document.getElementById('os-id').value = id || '';
        
        // Definir status padrão como "pending"
        document.getElementById('os-status').value = 'pending';
        
        this.openModal('os-modal');
    }

    openNewClientModal() {
        document.getElementById('client-modal-title').textContent = 'Novo Cliente';
        document.getElementById('client-form').reset();
        document.getElementById('client-id').value = 'new-client-id';
        this.openModal('client-modal');
    }

    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // QR Code processing
    async processQRCode() {
        const input = document.getElementById('qr-input');
        const qrData = input.value.trim();
        
        if (!qrData) {
            this.showNotification('Cole o código QR primeiro', 'warning');
            return;
        }

        try {
            // Buscar cliente pelo QR Code
            const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
            const client = clients.find(c => c.qrCode === qrData);

            if (client) {
                // Cliente encontrado
                if (this.qrModeAtendimento) {
                    // Preencher no modal de atendimento
                    document.getElementById('atendimento-client').value = client.id;
                    document.getElementById('atendimento-client-display').value = `${client.name} - ${client.phone}`;
                    this.closeModal('qr-modal');
                    this.openModal('atendimento-modal');
                    this.qrModeAtendimento = false;
                    this.showNotification(`Cliente selecionado: ${client.name}`, 'success');
                } else {
                    // Exibir informações do cliente
                    const resultDiv = document.getElementById('qr-result');
                    const successDiv = document.getElementById('qr-success');
                    const errorDiv = document.getElementById('qr-error');
                    const clientInfo = document.getElementById('qr-client-info');

                    clientInfo.innerHTML = `
                        <h4>Cliente encontrado!</h4>
                        <p><strong>Nome:</strong> ${client.name}</p>
                        <p><strong>Telefone:</strong> ${client.phone}</p>
                        <p><strong>CPF/CNPJ:</strong> ${client.cpfCnpj || 'Não informado'}</p>
                        <p><strong>Email:</strong> ${client.email || 'Não informado'}</p>
                        <p><strong>QR Code:</strong> ${client.qrCode}</p>
                    `;

                    resultDiv.style.display = 'block';
                    successDiv.style.display = 'block';
                    errorDiv.style.display = 'none';
                    
                    document.getElementById('qr-edit-client').style.display = 'inline-block';
                    document.getElementById('qr-register-client').style.display = 'none';
                    document.getElementById('qr-edit-client').onclick = () => this.editClientFromQR(client.id);
                }
            } else {
                // Cliente não encontrado
                const resultDiv = document.getElementById('qr-result');
                const successDiv = document.getElementById('qr-success');
                const errorDiv = document.getElementById('qr-error');

                resultDiv.style.display = 'block';
                successDiv.style.display = 'none';
                errorDiv.style.display = 'block';
                document.getElementById('qr-error-message').textContent = 'QR Code não encontrado. Verifique o código ou cadastre um novo cliente.';
            }
        } catch (error) {
            console.error('Erro ao processar QR:', error);
            this.showNotification('Erro ao processar QR Code', 'error');
        }
    }

    editClientFromQR(clientId) {
        const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
        const client = clients.find(c => c.id === clientId);
        
        if (client) {
            document.getElementById('client-modal-title').textContent = 'Editar Cliente';
            document.getElementById('client-id').value = client.id;
            document.getElementById('client-name').value = client.name;
            document.getElementById('client-phone').value = client.phone;
            document.getElementById('client-cpf-cnpj').value = client.cpfCnpj || '';
            document.getElementById('client-email').value = client.email || '';
            document.getElementById('client-address').value = client.address || '';
            
            this.closeModal('qr-modal');
            this.openModal('client-modal');
        }
    }

    displayQRSuccess(result) {
        const clientInfo = document.getElementById('qr-client-info');
        const editBtn = document.getElementById('qr-edit-client');
        const registerBtn = document.getElementById('qr-register-client');

        if (result.action === 'edit' && result.client) {
            clientInfo.innerHTML = `
                <h4>Cliente encontrado:</h4>
                <p><strong>Nome:</strong> ${result.client.name}</p>
                <p><strong>Telefone:</strong> ${result.client.phone}</p>
                <p><strong>Email:</strong> ${result.client.email || 'Não informado'}</p>
            `;
            editBtn.style.display = 'inline-block';
            registerBtn.style.display = 'none';
            
            editBtn.onclick = () => this.openClientEditFromQR();
        } else if (result.action === 'register') {
            clientInfo.innerHTML = `
                <h4>Novo cadastro de cliente</h4>
                <p>ID: ${result.clientId}</p>
            `;
            editBtn.style.display = 'none';
            registerBtn.style.display = 'inline-block';
            
            registerBtn.onclick = () => this.openClientRegisterFromQR();
        }
    }

    openClientEditFromQR() {
        if (!this.currentQRData || !this.currentQRData.client) return;
        
        const client = this.currentQRData.client;
        document.getElementById('client-modal-title').textContent = 'Editar Cliente';
        document.getElementById('client-id').value = client.id;
        document.getElementById('client-name').value = client.name;
        document.getElementById('client-phone').value = client.phone;
        document.getElementById('client-email').value = client.email || '';
        document.getElementById('client-address').value = client.address || '';
        
        this.closeModal('qr-modal');
        this.openModal('client-modal');
    }

    openClientRegisterFromQR() {
        if (!this.currentQRData) return;
        
        document.getElementById('client-modal-title').textContent = 'Registrar Cliente';
        document.getElementById('client-form').reset();
        document.getElementById('client-id').value = this.currentQRData.clientId;
        
        this.closeModal('qr-modal');
        this.openModal('client-modal');
    }

    // Form submissions
    async handleAtendimentoSubmit(e) {
        e.preventDefault();
        
        const atendimentoDate = document.getElementById('atendimento-date').value;
        const atendimentoTime = document.getElementById('atendimento-time').value;
        
        const data = {
            clientId: document.getElementById('atendimento-client').value,
            summary: document.getElementById('atendimento-summary').value,
            priority: document.getElementById('atendimento-priority').value,
            status: document.getElementById('atendimento-status').value,
            scheduledDate: atendimentoDate,
            scheduledTime: atendimentoTime
        };

        try {
            // Usar localStorage para persistir atendimentos
            let atendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
            const id = document.getElementById('atendimento-id').value;
            
            if (id) {
                // Atualizar atendimento existente
                const index = atendimentos.findIndex(a => a.id === id);
                if (index !== -1) {
                    atendimentos[index] = { ...atendimentos[index], ...data, updatedAt: new Date().toISOString() };
                }
                this.showNotification('Atendimento atualizado com sucesso', 'success');
            } else {
                // Criar novo atendimento
                const newAtendimento = {
                    id: Date.now().toString(),
                    ...data,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                atendimentos.push(newAtendimento);
                this.showNotification('Atendimento criado com sucesso', 'success');
            }
            
            localStorage.setItem('mockAtendimentos', JSON.stringify(atendimentos));
            this.closeModal('atendimento-modal');
            await this.loadAtendimentos();
            await this.loadEntradaAparelhos();
            await this.loadSaidaAparelhos();
            await this.loadStats();
        } catch (error) {
            console.error('Erro ao salvar atendimento:', error);
            this.showNotification('Erro ao salvar atendimento', 'error');
        }
    }

    async handleOSSubmit(e) {
        e.preventDefault();
        
        const clientId = document.getElementById('os-client').value;
        const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
        const client = clients.find(c => c.id === clientId);
        
        const data = {
            clientId: clientId,
            client: client || { id: clientId, name: 'Cliente não encontrado' },
            summary: document.getElementById('os-summary').value,
            technician: document.getElementById('os-technician').value,
            status: document.getElementById('os-status').value
        };

        try {
            // Usar localStorage para persistir OS
            let ordens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
            const id = document.getElementById('os-id').value;
            
            if (id) {
                // Atualizar OS existente
                const index = ordens.findIndex(o => o.id === id);
                if (index !== -1) {
                    const oldStatus = ordens[index].status;
                    ordens[index] = { ...ordens[index], ...data, updatedAt: new Date().toISOString() };
                    
                    // Adicionar ao histórico se status mudou
                    if (oldStatus !== data.status) {
                        if (!ordens[index].statusHistory) {
                            ordens[index].statusHistory = [];
                        }
                        ordens[index].statusHistory.push({
                            from: oldStatus,
                            to: data.status,
                            timestamp: new Date().toISOString(),
                            changedBy: 'Usuário (Edição)'
                        });
                    }
                }
                this.showNotification('OS atualizada com sucesso', 'success');
            } else {
                // Criar nova OS
                const newOS = {
                    id: Date.now().toString(),
                    ...data,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    statusHistory: [{
                        from: null,
                        to: data.status,
                        timestamp: new Date().toISOString(),
                        changedBy: 'Sistema (Criação)'
                    }]
                };
                ordens.push(newOS);
                this.showNotification('OS criada com sucesso', 'success');
            }
            
            localStorage.setItem('mockOrdens', JSON.stringify(ordens));
            this.closeModal('os-modal');
            
            // Recarregar todos os painéis de OS
            await this.loadOSPending();
            await this.loadSaidaAparelhos();
            await this.loadOSSigned();
            await this.loadOSAwaitingPayment();
            await this.loadOSPaid();
            await this.loadOSFinalized();
            await this.loadStats();
        } catch (error) {
            console.error('Erro ao salvar OS:', error);
            this.showNotification('Erro ao salvar OS', 'error');
        }
    }

    async handleClientSubmit(e) {
        e.preventDefault();
        
        const data = {
            name: document.getElementById('client-name').value,
            phone: document.getElementById('client-phone').value,
            cpfCnpj: document.getElementById('client-cpf-cnpj').value,
            email: document.getElementById('client-email').value,
            address: document.getElementById('client-address').value
        };

        try {
            // Usar localStorage para persistir clientes
            let clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
            const id = document.getElementById('client-id').value;
            let savedClient;
            
            if (id && id !== 'new-client-id') {
                // Atualizar cliente existente
                const index = clients.findIndex(c => c.id === id);
                if (index !== -1) {
                    clients[index] = { ...clients[index], ...data };
                    savedClient = clients[index];
                }
                this.showNotification('Cliente atualizado com sucesso', 'success');
            } else {
                // Criar novo cliente
                // Gerar número sequencial de 5 dígitos baseado no número de clientes
                const qrNumber = String(clients.length + 1).padStart(5, '0');
                
                const newClient = {
                    id: Date.now().toString(),
                    ...data,
                    qrCode: `QR-CLI-${qrNumber}`, // Formato: QR-CLI-00001, QR-CLI-00002, etc.
                    createdAt: new Date().toISOString()
                };
                clients.push(newClient);
                savedClient = newClient;
                this.showNotification(`Cliente criado com sucesso! QR Code: ${newClient.qrCode}`, 'success');
            }
            
            localStorage.setItem('mockClients', JSON.stringify(clients));
            
            // Se foi criado do modal de atendimento, selecionar o cliente automaticamente
            if (id === 'new-client-id' && savedClient && savedClient.id) {
                document.getElementById('atendimento-client').value = savedClient.id;
                document.getElementById('atendimento-client-display').value = `${savedClient.name} - ${savedClient.phone}`;
                this.closeModal('client-modal');
                this.openModal('atendimento-modal');
            } else {
                // Recarregar a seção de aparelhos se estiver editando
                if (id && id !== 'new-client-id') {
                    this.loadClientDevices(id);
                }
            }
            
            await this.loadClientOptions();
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            this.showNotification('Erro ao salvar cliente', 'error');
        }
    }

    editClientFromQR(clientId) {
        const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
        const client = clients.find(c => c.id === clientId);
        
        if (client) {
            document.getElementById('client-modal-title').textContent = 'Editar Cliente';
            document.getElementById('client-id').value = client.id;
            document.getElementById('client-name').value = client.name;
            document.getElementById('client-phone').value = client.phone;
            document.getElementById('client-cpf-cnpj').value = client.cpfCnpj || '';
            document.getElementById('client-email').value = client.email || '';
            document.getElementById('client-address').value = client.address || '';
            
            // Mostrar seção de aparelhos
            document.getElementById('client-devices-section').style.display = 'block';
            document.getElementById('client-devices-new-message').style.display = 'none';
            
            // Carregar aparelhos do cliente
            this.loadClientDevices(client.id);
            
            // Configurar botões de aparelhos
            document.getElementById('add-device-to-client-btn').onclick = () => this.addDeviceToClient(client.id);
            document.getElementById('link-existing-device-btn').onclick = () => this.linkExistingDevice(client.id);
            
            this.closeModal('qr-modal');
            this.openModal('client-modal');
        }
    }

    loadClientDevices(clientId) {
        const devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');
        const clientDevices = devices.filter(d => d.ownerId === clientId);
        
        const listDiv = document.getElementById('client-devices-list');
        
        if (clientDevices.length === 0) {
            listDiv.innerHTML = '<p style="text-align: center; color: #666;">Nenhum aparelho vinculado</p>';
        } else {
            let html = '';
            clientDevices.forEach(device => {
                html += `
                    <div style="border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 10px; background: #f9f9f9;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${device.brand} ${device.model}</strong>
                                <br><small>QR: ${device.qrCode}</small>
                                ${device.imei ? `<br><small>IMEI: ${device.imei}</small>` : ''}
                            </div>
                            <div>
                                <button class="btn btn-danger btn-sm" onclick="dashboard.unlinkDevice('${device.id}', '${clientId}')">Desvincular</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            listDiv.innerHTML = html;
        }
    }

    addDeviceToClient(clientId) {
        // Redirecionar para página de aparelhos com parâmetro do cliente
        localStorage.setItem('addDeviceForClient', clientId);
        window.location.href = 'aparelhos.html';
    }

    linkExistingDevice(clientId) {
        const devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');
        const availableDevices = devices.filter(d => !d.ownerId);
        
        const listDiv = document.getElementById('available-devices-list');
        
        if (availableDevices.length === 0) {
            listDiv.innerHTML = '<p style="text-align: center; color: #666;">Nenhum aparelho disponível para vincular</p>';
        } else {
            let html = '';
            availableDevices.forEach(device => {
                html += `
                    <div style="border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 10px; cursor: pointer; hover: background: #f5f5f5;" onclick="dashboard.confirmLinkDevice('${device.id}', '${clientId}')">
                        <strong>${device.brand} ${device.model}</strong>
                        <br><small>QR: ${device.qrCode}</small>
                        ${device.imei ? `<br><small>IMEI: ${device.imei}</small>` : ''}
                        ${device.color ? `<br><small>Cor: ${device.color}</small>` : ''}
                        ${device.storage ? `<br><small>Armazenamento: ${device.storage}</small>` : ''}
                    </div>
                `;
            });
            listDiv.innerHTML = html;
        }
        
        this.openModal('link-device-modal');
    }

    confirmLinkDevice(deviceId, clientId) {
        if (confirm('Vincular este aparelho ao cliente?')) {
            let devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');
            const deviceIndex = devices.findIndex(d => d.id === deviceId);
            
            if (deviceIndex !== -1) {
                devices[deviceIndex].ownerId = clientId;
                devices[deviceIndex].updatedAt = new Date().toISOString();
                localStorage.setItem('mockDevices', JSON.stringify(devices));
                
                this.showNotification('Aparelho vinculado com sucesso', 'success');
                this.closeModal('link-device-modal');
                this.loadClientDevices(clientId);
            }
        }
    }

    unlinkDevice(deviceId, clientId) {
        if (confirm('Desvincular este aparelho do cliente?')) {
            let devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');
            const deviceIndex = devices.findIndex(d => d.id === deviceId);
            
            if (deviceIndex !== -1) {
                devices[deviceIndex].ownerId = null;
                devices[deviceIndex].updatedAt = new Date().toISOString();
                localStorage.setItem('mockDevices', JSON.stringify(devices));
                
                this.showNotification('Aparelho desvinculado', 'success');
                this.loadClientDevices(clientId);
            }
        }
    }

    // Busca de clientes
    searchClients(query) {
        const resultsDiv = document.getElementById('client-search-results');
        
        if (!query || query.length < 2) {
            resultsDiv.style.display = 'none';
            return;
        }

        const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
        const searchQuery = query.toLowerCase();
        
        const filtered = clients.filter(c => 
            c.name.toLowerCase().includes(searchQuery) ||
            c.phone.includes(searchQuery) ||
            (c.cpfCnpj && c.cpfCnpj.includes(searchQuery)) ||
            (c.qrCode && c.qrCode.toLowerCase().includes(searchQuery))
        );

        if (filtered.length === 0) {
            resultsDiv.innerHTML = '<div style="padding: 10px; color: #666;">Nenhum cliente encontrado</div>';
            resultsDiv.style.display = 'block';
            return;
        }

        resultsDiv.innerHTML = filtered.map(client => `
            <div onclick="dashboard.selectClient('${client.id}')" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee; hover: background: #f5f5f5;">
                <strong>${client.name}</strong><br>
                <small>${client.phone}${client.cpfCnpj ? ` | CPF/CNPJ: ${client.cpfCnpj}` : ''}${client.qrCode ? ` | QR: ${client.qrCode}` : ''}</small>
            </div>
        `).join('');
        
        resultsDiv.style.display = 'block';
    }

    selectClient(clientId) {
        const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
        const client = clients.find(c => c.id === clientId);
        
        if (client) {
            document.getElementById('atendimento-client').value = client.id;
            document.getElementById('atendimento-client-display').value = `${client.name} - ${client.phone}`;
            document.getElementById('atendimento-client-search').value = '';
            document.getElementById('client-search-results').style.display = 'none';
        }
    }

    openQRModalForAtendimento() {
        this.qrModeAtendimento = true;
        this.openQRModal();
    }

    // Signature handling
    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.signatureCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.signatureCtx.beginPath();
        this.signatureCtx.moveTo(x, y);
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.signatureCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.signatureCtx.lineWidth = 2;
        this.signatureCtx.lineCap = 'round';
        this.signatureCtx.strokeStyle = '#000';
        this.signatureCtx.lineTo(x, y);
        this.signatureCtx.stroke();
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    clearSignature() {
        this.signatureCtx.clearRect(0, 0, this.signatureCanvas.width, this.signatureCanvas.height);
    }

    async saveSignature() {
        if (!this.currentOSId) {
            this.showNotification('Nenhuma OS selecionada', 'error');
            return;
        }

        try {
            // Carregar OS do localStorage
            const allOrdens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
            const osIndex = allOrdens.findIndex(o => o.id === this.currentOSId);
            
            if (osIndex === -1) {
                this.showNotification('OS não encontrada', 'error');
                return;
            }

            // Atualizar status para "signed" automaticamente
            const oldStatus = allOrdens[osIndex].status;
            allOrdens[osIndex].status = 'signed';
            allOrdens[osIndex].signedAt = new Date().toISOString();
            allOrdens[osIndex].signature = this.signatureCanvas.toDataURL();
            
            // Adicionar ao histórico
            if (!allOrdens[osIndex].statusHistory) {
                allOrdens[osIndex].statusHistory = [];
            }
            allOrdens[osIndex].statusHistory.push({
                from: oldStatus,
                to: 'signed',
                timestamp: new Date().toISOString(),
                changedBy: 'Cliente (Assinatura)'
            });
            
            // Salvar no localStorage
            localStorage.setItem('mockOrdens', JSON.stringify(allOrdens));
            
            this.showNotification('OS assinada com sucesso e movida para OS Assinadas', 'success');
            this.closeModal('signature-modal');
            
            // Recarregar as listas
            await this.loadOSPending();
            await this.loadOSSigned();
            await this.loadStats();
        } catch (error) {
            console.error('Erro ao salvar assinatura:', error);
            this.showNotification('Erro ao salvar assinatura', 'error');
        }
    }

    // Action methods
    editAtendimento(id) {
        try {
            // Buscar dados do atendimento do localStorage
            const atendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
            const atendimento = atendimentos.find(a => a.id === id);
            
            if (!atendimento) {
                this.showNotification('Atendimento não encontrado', 'error');
                return;
            }
            
            // Preencher o formulário
            document.getElementById('atendimento-modal-title').textContent = 'Editar Atendimento';
            document.getElementById('atendimento-id').value = atendimento.id;
            document.getElementById('atendimento-client').value = atendimento.clientId;
            
            // Buscar dados do cliente
            const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
            const client = clients.find(c => c.id === atendimento.clientId);
            if (client) {
                document.getElementById('atendimento-client-display').value = `${client.name} - ${client.phone}`;
            }
            
            document.getElementById('atendimento-summary').value = atendimento.summary;
            document.getElementById('atendimento-priority').value = atendimento.priority;
            document.getElementById('atendimento-status').value = atendimento.status;
            document.getElementById('atendimento-date').value = atendimento.scheduledDate || '';
            document.getElementById('atendimento-time').value = atendimento.scheduledTime || '';
            
            this.openModal('atendimento-modal');
        } catch (error) {
            console.error('Erro ao carregar atendimento:', error);
            this.showNotification('Erro ao carregar atendimento', 'error');
        }
    }

    createOSFromAtendimento(atendimentoId) {
        try {
            // Buscar dados do atendimento
            const atendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
            const atendimento = atendimentos.find(a => a.id === atendimentoId);
            
            if (!atendimento) {
                this.showNotification('Atendimento não encontrado', 'error');
                return;
            }
            
            // Atualizar status do atendimento para "os_criada"
            const atendimentoIndex = atendimentos.findIndex(a => a.id === atendimentoId);
            if (atendimentoIndex !== -1) {
                atendimentos[atendimentoIndex].status = 'os_criada';
                atendimentos[atendimentoIndex].osCreatedAt = new Date().toISOString();
                localStorage.setItem('mockAtendimentos', JSON.stringify(atendimentos));
            }
            
            // Abrir modal de OS e preencher com dados do atendimento
            document.getElementById('os-modal-title').textContent = 'Nova OS';
            document.getElementById('os-form').reset();
            document.getElementById('os-id').value = '';
            
            // Preencher cliente
            document.getElementById('os-client').value = atendimento.clientId;
            
            // Preencher sumário com informações do atendimento
            document.getElementById('os-summary').value = atendimento.summary;
            
            // Definir status padrão como "aguardando_assinatura"
            document.getElementById('os-status').value = 'aguardando_assinatura';
            
            this.openModal('os-modal');
            this.showNotification('OS criada a partir do atendimento. Atendimento marcado como "OS Criada"!', 'success');
            
            // Recarregar lista de atendimentos
            this.loadAtendimentos();
        } catch (error) {
            console.error('Erro ao criar OS do atendimento:', error);
            this.showNotification('Erro ao criar OS', 'error');
        }
    }

    async generateQRForClient(clientId) {
        try {
            // Buscar dados do cliente
            const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
            const client = clients.find(c => c.id === clientId);
            
            if (!client) {
                this.showNotification('Cliente não encontrado', 'error');
                return;
            }
            
            if (!client.qrCode) {
                this.showNotification('Cliente não possui QR Code gerado', 'error');
                return;
            }
            
            // Mostrar QR code gerado
            const qrWindow = window.open('', '_blank', 'width=450,height=600');
            qrWindow.document.write(`
                <html>
                <head>
                    <title>QR Code - ${client.name}</title>
                    <style>
                        body { 
                            text-align: center; 
                            padding: 20px;
                            font-family: Arial, sans-serif;
                        }
                        .client-info {
                            background: #f5f5f5;
                            padding: 15px;
                            border-radius: 8px;
                            margin: 20px 0;
                            text-align: left;
                        }
                        .client-info p {
                            margin: 8px 0;
                        }
                        #qrcode canvas {
                            border: 2px solid #ddd;
                            border-radius: 8px;
                            padding: 10px;
                            background: white;
                        }
                        .qr-code-text {
                            font-family: 'Courier New', monospace;
                            font-size: 16px;
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
                    <h2>QR Code do Cliente</h2>
                    <div class="client-info">
                        <p><strong>Nome:</strong> ${client.name}</p>
                        <p><strong>Telefone:</strong> ${client.phone}</p>
                        ${client.cpfCnpj ? `<p><strong>CPF/CNPJ:</strong> ${client.cpfCnpj}</p>` : ''}
                        ${client.email ? `<p><strong>Email:</strong> ${client.email}</p>` : ''}
                    </div>
                    <div id="qrcode"></div>
                    <div class="qr-code-text">${client.qrCode}</div>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                    <script>
                        new QRCode(document.getElementById('qrcode'), {
                            text: '${client.qrCode}',
                            width: 256,
                            height: 256
                        });
                    </script>
                </body>
                </html>
            `);
            
            this.showNotification(`QR Code gerado para ${client.name}`, 'success');
        } catch (error) {
            console.error('Erro ao gerar QR:', error);
            this.showNotification('Erro ao gerar QR Code', 'error');
        }
    }

    viewOS(id) {
        try {
            // Buscar OS do localStorage
            const ordens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
            const ordem = ordens.find(o => o.id === id);
            
            if (!ordem) {
                this.showNotification('OS não encontrada', 'error');
                return;
            }
            
            // Buscar cliente
            const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
            const client = clients.find(c => c.id === ordem.clientId) || ordem.client || {};
            
            // Verificações de segurança
            const clientName = client.name || 'N/A';
            const clientPhone = client.phone || 'N/A';
            const summary = ordem.summary || 'Sem descrição';
            const status = ordem.status || 'pendente';
            const createdAt = ordem.createdAt ? new Date(ordem.createdAt) : new Date();
            
            // Montar detalhes da OS
            const detailsHtml = `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <p><strong>ID da OS:</strong> ${ordem.id}</p>
                    <p><strong>Cliente:</strong> ${clientName}</p>
                    <p><strong>Telefone:</strong> ${clientPhone}</p>
                    ${client.cpfCnpj ? `<p><strong>CPF/CNPJ:</strong> ${client.cpfCnpj}</p>` : ''}
                    ${client.email ? `<p><strong>Email:</strong> ${client.email}</p>` : ''}
                    <p><strong>Sumário:</strong> ${summary}</p>
                    <p><strong>Técnico:</strong> ${ordem.technician || 'Não atribuído'}</p>
                    <p><strong>Status Atual:</strong> <span class="status-badge status-${status}">${this.formatStatusName(status)}</span></p>
                    <p><strong>Data de Criação:</strong> ${createdAt.toLocaleString('pt-BR')}</p>
                    ${ordem.signedAt ? `<p><strong>Assinado em:</strong> ${new Date(ordem.signedAt).toLocaleString('pt-BR')}</p>` : ''}
                    ${ordem.sentToPaymentAt ? `<p><strong>Enviado para Pagamento:</strong> ${new Date(ordem.sentToPaymentAt).toLocaleString('pt-BR')}</p>` : ''}
                    ${ordem.paidAt ? `<p><strong>Pago em:</strong> ${new Date(ordem.paidAt).toLocaleString('pt-BR')}</p>` : ''}
                    ${ordem.paymentAmount ? `<p><strong>Valor:</strong> R$ ${ordem.paymentAmount.toFixed(2)}</p>` : ''}
                    ${ordem.paymentMethod ? `<p><strong>Método de Pagamento:</strong> ${ordem.paymentMethod}</p>` : ''}
                </div>
            `;
            
            document.getElementById('view-os-details').innerHTML = detailsHtml;
            
            // Montar histórico
            let historyHtml = '';
            if (ordem.statusHistory && ordem.statusHistory.length > 0) {
                historyHtml = '<div style="border-left: 3px solid #007bff; padding-left: 15px;">';
                ordem.statusHistory.forEach(entry => {
                    if (!entry || !entry.timestamp) return; // Pular entradas inválidas
                    
                    const timestamp = new Date(entry.timestamp).toLocaleString('pt-BR');
                    const fromStatus = entry.from || 'pendente';
                    const toStatus = entry.to || 'pendente';
                    
                    historyHtml += `
                        <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <span class="status-badge status-${fromStatus}">${this.formatStatusName(fromStatus)}</span>
                                    <span style="margin: 0 10px;">→</span>
                                    <span class="status-badge status-${toStatus}">${this.formatStatusName(toStatus)}</span>
                                </div>
                                <small style="color: #666;">${timestamp}</small>
                            </div>
                            ${entry.changedBy ? `<small style="color: #888; margin-top: 5px; display: block;">Alterado por: ${entry.changedBy}</small>` : ''}
                        </div>
                    `;
                });
                historyHtml += '</div>';
            } else {
                historyHtml = '<p style="color: #666; font-style: italic;">Nenhum histórico de alterações registrado.</p>';
            }
            
            document.getElementById('view-os-history').innerHTML = historyHtml;
            
            this.openModal('view-os-modal');
        } catch (error) {
            console.error('Erro ao visualizar OS:', error);
            this.showNotification('Erro ao visualizar OS', 'error');
        }
    }

    async editOS(id) {
        try {
            // Buscar dados da OS do localStorage
            const ordens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
            const ordem = ordens.find(o => o.id === id);
            
            if (!ordem) {
                throw new Error('OS não encontrada');
            }
            
            // Preencher o formulário
            document.getElementById('os-modal-title').textContent = 'Editar OS';
            document.getElementById('os-id').value = ordem.id;
            document.getElementById('os-client').value = ordem.clientId;
            document.getElementById('os-summary').value = ordem.summary;
            document.getElementById('os-technician').value = ordem.technician || '';
            document.getElementById('os-status').value = ordem.status;
            
            this.openModal('os-modal');
        } catch (error) {
            console.error('Erro ao carregar OS:', error);
            this.showNotification('Erro ao carregar OS', 'error');
        }
    }

    async deleteOS(id) {
        try {
            // Verificar o status atual da OS
            let ordens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
            const ordem = ordens.find(o => o.id === id);
            
            if (!ordem) {
                this.showNotification('OS não encontrada', 'error');
                return;
            }
            
            // Se a OS está assinada, reverter para "aguardando_assinatura" em vez de excluir
            if (ordem.status === 'signed') {
                if (confirm('Reverter esta OS para "Aguardando Assinatura"? A assinatura será removida.')) {
                    const osIndex = ordens.findIndex(o => o.id === id);
                    const oldStatus = ordens[osIndex].status;
                    ordens[osIndex].status = 'aguardando_assinatura';
                    ordens[osIndex].signature = null;
                    ordens[osIndex].signedAt = null;
                    ordens[osIndex].updatedAt = new Date().toISOString();
                    
                    // Adicionar ao histórico
                    if (!ordens[osIndex].statusHistory) {
                        ordens[osIndex].statusHistory = [];
                    }
                    ordens[osIndex].statusHistory.push({
                        from: oldStatus,
                        to: 'aguardando_assinatura',
                        timestamp: new Date().toISOString(),
                        changedBy: 'Usuário (Reversão)'
                    });
                    
                    localStorage.setItem('mockOrdens', JSON.stringify(ordens));
                    this.showNotification('OS revertida para Aguardando Assinatura', 'success');
                    
                    // Recarregar os painéis
                    await this.loadOSPending();
                    await this.loadOSSigned();
                    await this.loadStats();
                }
            } else {
                // Para outros status, excluir normalmente
                if (confirm('Tem certeza que deseja excluir esta OS? Esta ação não pode ser desfeita.')) {
                    ordens = ordens.filter(o => o.id !== id);
                    localStorage.setItem('mockOrdens', JSON.stringify(ordens));
                    
                    this.showNotification('OS excluída com sucesso', 'success');
                    
                    // Recarregar todos os painéis
                    await this.loadOSPending();
                    await this.loadOSSigned();
                    await this.loadOSAwaitingPayment();
                    await this.loadOSPaid();
                    await this.loadOSFinalized();
                    await this.loadStats();
                }
            }
        } catch (error) {
            console.error('Erro ao processar OS:', error);
            this.showNotification('Erro ao processar OS', 'error');
        }
    }

    signOS(id) {
        document.getElementById('signature-info').innerHTML = `
            <p><strong>OS ID:</strong> ${id}</p>
            <p>Colete a assinatura do cliente no campo abaixo:</p>
        `;
        this.clearSignature();
        this.currentOSId = id;
        this.openModal('signature-modal');
    }

    async finalizeOS(id) {
        if (confirm('Finalizar esta OS?')) {
            try {
                // Carregar OS do localStorage
                const allOrdens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
                const osIndex = allOrdens.findIndex(o => o.id === id);
                
                if (osIndex === -1) {
                    this.showNotification('OS não encontrada', 'error');
                    return;
                }

                // Atualizar status para "finalized"
                const oldStatus = allOrdens[osIndex].status;
                allOrdens[osIndex].status = 'finalized';
                allOrdens[osIndex].finalizedAt = new Date().toISOString();
                
                // Adicionar ao histórico
                if (!allOrdens[osIndex].statusHistory) {
                    allOrdens[osIndex].statusHistory = [];
                }
                allOrdens[osIndex].statusHistory.push({
                    from: oldStatus,
                    to: 'finalized',
                    timestamp: new Date().toISOString(),
                    changedBy: 'Sistema'
                });
                
                // Salvar no localStorage
                localStorage.setItem('mockOrdens', JSON.stringify(allOrdens));
                
                this.showNotification('OS finalizada com sucesso', 'success');
                await this.loadOSPaid();
                await this.loadOSFinalized();
                await this.loadStats();
            } catch (error) {
                console.error('Erro ao finalizar OS:', error);
                this.showNotification('Erro ao finalizar OS', 'error');
            }
        }
    }

    async sendToPaymentDirect(id) {
        if (confirm('Enviar esta OS para o Comercial (Aguardando Pagamento)?')) {
            try {
                // Carregar OS do localStorage
                const allOrdens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
                const osIndex = allOrdens.findIndex(o => o.id === id);
                
                if (osIndex === -1) {
                    this.showNotification('OS não encontrada', 'error');
                    return;
                }

                // Atualizar status para "awaiting_payment"
                const oldStatus = allOrdens[osIndex].status;
                allOrdens[osIndex].status = 'awaiting_payment';
                allOrdens[osIndex].sentToPaymentAt = new Date().toISOString();
                
                // Adicionar ao histórico
                if (!allOrdens[osIndex].statusHistory) {
                    allOrdens[osIndex].statusHistory = [];
                }
                allOrdens[osIndex].statusHistory.push({
                    from: oldStatus,
                    to: 'awaiting_payment',
                    timestamp: new Date().toISOString(),
                    changedBy: 'Sistema'
                });
                
                // Salvar no localStorage
                localStorage.setItem('mockOrdens', JSON.stringify(allOrdens));
                
                this.showNotification('OS enviada para Aguardando Pagamento (Comercial)', 'success');
                
                // Recarregar as listas
                await this.loadOSSigned();
                await this.loadOSAwaitingPayment();
                await this.loadStats();
            } catch (error) {
                console.error('Erro ao enviar para pagamento:', error);
                this.showNotification('Erro ao enviar para pagamento', 'error');
            }
        }
    }

    sendToPayment(id) {
        this.currentOSId = id;
        document.getElementById('payment-form').reset();
        this.openModal('payment-modal');
    }

    openConfirmPayment(id) {
        this.currentOSId = id;
        this.openModal('confirm-payment-modal');
    }

    async handlePaymentSubmit(e) {
        e.preventDefault();
        
        if (!this.currentOSId) {
            this.showNotification('Nenhuma OS selecionada', 'error');
            return;
        }

        const paymentData = {
            amount: parseFloat(document.getElementById('payment-amount').value),
            method: document.getElementById('payment-method').value,
            notes: document.getElementById('payment-notes').value
        };

        try {
            await this.osAPI.paymentOrdem(this.currentOSId, paymentData);
            this.showNotification('OS enviada para pagamento', 'success');
            this.closeModal('payment-modal');
            await this.loadOSSigned();
            await this.loadOSAwaitingPayment();
            await this.loadStats();
        } catch (error) {
            console.error('Erro ao processar pagamento:', error);
            this.showNotification('Erro ao processar pagamento', 'error');
        }
    }

    async confirmPayment() {
        if (!this.currentOSId) {
            this.showNotification('Nenhuma OS selecionada', 'error');
            return;
        }

        try {
            // Carregar OS do localStorage
            const allOrdens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
            const osIndex = allOrdens.findIndex(o => o.id === this.currentOSId);
            
            if (osIndex === -1) {
                this.showNotification('OS não encontrada', 'error');
                return;
            }

            // Atualizar status para "paid"
            const oldStatus = allOrdens[osIndex].status;
            allOrdens[osIndex].status = 'paid';
            allOrdens[osIndex].paidAt = new Date().toISOString();
            
            // Adicionar ao histórico
            if (!allOrdens[osIndex].statusHistory) {
                allOrdens[osIndex].statusHistory = [];
            }
            allOrdens[osIndex].statusHistory.push({
                from: oldStatus,
                to: 'paid',
                timestamp: new Date().toISOString(),
                changedBy: 'Sistema'
            });
            
            // Salvar no localStorage
            localStorage.setItem('mockOrdens', JSON.stringify(allOrdens));
            
            this.showNotification('Pagamento confirmado com sucesso', 'success');
            this.closeModal('confirm-payment-modal');
            await this.loadOSAwaitingPayment();
            await this.loadOSPaid();
            await this.loadStats();
        } catch (error) {
            console.error('Erro ao confirmar pagamento:', error);
            this.showNotification('Erro ao confirmar pagamento', 'error');
        }
    }

    downloadOS(id) {
        // Implementar download de OS
        this.showNotification('Download iniciado', 'info');
    }

    // Lista Expandida
    openExpandedList(type) {
        try {
            const modal = document.getElementById('expanded-list-modal');
            const title = document.getElementById('expanded-list-title');
            const filters = document.getElementById('expanded-list-filters');
            const content = document.getElementById('expanded-list-content');
            
            if (type === 'atendimentos') {
                title.textContent = 'Lista Completa de Atendimentos';
                
                // Criar filtros
                filters.innerHTML = `
                    <select id="exp-filter-status" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">Todos os Status</option>
                        <option value="pendente">Pendente</option>
                        <option value="aguardando_orcamento">Aguardando Orçamento</option>
                        <option value="aguardando_pecas">Aguardando Peças</option>
                        <option value="em_manutencao">Em Manutenção</option>
                        <option value="aparelho_pronto">Aparelho Pronto</option>
                        <option value="reprovado_esperando_devolucao">Reprovado - Esperando Devolução</option>
                        <option value="aguardando_visita_tecnica">Aguardando Visita Técnica</option>
                        <option value="aparelho_a_caminho">Aparelho a Caminho</option>
                        <option value="os_criada">OS Criada</option>
                    </select>
                    <select id="exp-filter-priority" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">Todas as Prioridades</option>
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                    </select>
                    <input type="text" id="exp-search" placeholder="Buscar por cliente, telefone..." style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; flex: 1;">
                    <button class="btn btn-secondary" onclick="dashboard.filterExpandedList('atendimentos')">Filtrar</button>
                `;
                
                this.loadExpandedAtendimentos();
            } else if (type === 'os-pending') {
                title.textContent = 'Lista Completa de OS Pendentes';
                
                filters.innerHTML = `
                    <select id="exp-filter-status" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">Todos os Status</option>
                        <option value="pendente">Pendente</option>
                        <option value="aguardando_assinatura">Aguardando Assinatura</option>
                        <option value="signed">Assinada</option>
                        <option value="aguardando_orcamento">Aguardando Orçamento</option>
                        <option value="aguardando_pecas">Aguardando Peças</option>
                        <option value="em_manutencao">Em Manutenção</option>
                        <option value="aparelho_pronto">Aparelho Pronto</option>
                        <option value="reprovado_esperando_devolucao">Reprovado - Esperando Devolução</option>
                        <option value="aguardando_visita_tecnica">Aguardando Visita Técnica</option>
                        <option value="aparelho_a_caminho">Aparelho a Caminho</option>
                    </select>
                    <input type="text" id="exp-search" placeholder="Buscar por cliente, técnico, sumário..." style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; flex: 1;">
                    <button class="btn btn-secondary" onclick="dashboard.filterExpandedList('os-pending')">Filtrar</button>
                `;
                
                this.loadExpandedOSPending();
            }
            
            this.openModal('expanded-list-modal');
        } catch (error) {
            console.error('Erro ao abrir lista expandida:', error);
            this.showNotification('Erro ao abrir lista expandida', 'error');
        }
    }

    loadExpandedAtendimentos(filters = {}) {
        try {
            const allAtendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
            const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
            
            let filteredData = allAtendimentos.map(atend => {
                const client = clients.find(c => c.id === atend.clientId);
                return { ...atend, client: client || { name: 'N/A', phone: 'N/A' } };
            });
            
            // Aplicar filtros
            if (filters.status) {
                filteredData = filteredData.filter(a => a.status === filters.status);
            }
            if (filters.priority) {
                filteredData = filteredData.filter(a => a.priority === filters.priority);
            }
            if (filters.search) {
                const search = filters.search.toLowerCase();
                filteredData = filteredData.filter(a => 
                    a.client.name.toLowerCase().includes(search) ||
                    a.client.phone.includes(search) ||
                    a.summary.toLowerCase().includes(search)
                );
            }
            
            const content = document.getElementById('expanded-list-content');
            
            if (filteredData.length === 0) {
                content.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Nenhum atendimento encontrado</p>';
                return;
            }
            
            let html = `
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                            <th style="padding: 12px; text-align: left;">ID</th>
                            <th style="padding: 12px; text-align: left;">Cliente</th>
                            <th style="padding: 12px; text-align: left;">Telefone</th>
                            <th style="padding: 12px; text-align: left;">Serviço</th>
                            <th style="padding: 12px; text-align: left;">Prioridade</th>
                            <th style="padding: 12px; text-align: left;">Data Criação</th>
                            <th style="padding: 12px; text-align: left;">Status</th>
                            <th style="padding: 12px; text-align: left;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            filteredData.forEach(atend => {
                const createdAt = new Date(atend.createdAt);
                html += `
                    <tr style="border-bottom: 1px solid #dee2e6;">
                        <td style="padding: 12px;">${atend.id.substring(0, 8)}...</td>
                        <td style="padding: 12px;">${atend.client.name}</td>
                        <td style="padding: 12px;">${atend.client.phone}</td>
                        <td style="padding: 12px;">${atend.summary}</td>
                        <td style="padding: 12px;"><span class="priority-badge priority-${atend.priority}">${atend.priority}</span></td>
                        <td style="padding: 12px;">${createdAt.toLocaleDateString('pt-BR')} ${createdAt.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</td>
                        <td style="padding: 12px;"><span class="status-badge status-${atend.status}">${this.formatStatusName(atend.status)}</span></td>
                        <td style="padding: 12px;">
                            <button class="btn btn-info btn-sm" onclick="dashboard.editAtendimento('${atend.id}'); dashboard.closeModal('expanded-list-modal');">Editar</button>
                            <button class="btn btn-success btn-sm" onclick="dashboard.createOSFromAtendimento('${atend.id}'); dashboard.closeModal('expanded-list-modal');">Abrir OS</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            content.innerHTML = html;
            
        } catch (error) {
            console.error('Erro ao carregar lista expandida:', error);
        }
    }

    loadExpandedOSPending(filters = {}) {
        try {
            const allOrdens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
            
            let filteredData = allOrdens;
            
            // Aplicar filtros
            if (filters.status) {
                filteredData = filteredData.filter(o => o.status === filters.status);
            }
            if (filters.search) {
                const search = filters.search.toLowerCase();
                filteredData = filteredData.filter(o => 
                    o.client.name.toLowerCase().includes(search) ||
                    (o.technician && o.technician.toLowerCase().includes(search)) ||
                    o.summary.toLowerCase().includes(search)
                );
            }
            
            const content = document.getElementById('expanded-list-content');
            
            if (filteredData.length === 0) {
                content.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Nenhuma OS encontrada</p>';
                return;
            }
            
            let html = `
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                            <th style="padding: 12px; text-align: left;">OS ID</th>
                            <th style="padding: 12px; text-align: left;">Cliente</th>
                            <th style="padding: 12px; text-align: left;">Sumário</th>
                            <th style="padding: 12px; text-align: left;">Técnico</th>
                            <th style="padding: 12px; text-align: left;">Data Abertura</th>
                            <th style="padding: 12px; text-align: left;">Status</th>
                            <th style="padding: 12px; text-align: left;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            filteredData.forEach(ordem => {
                const createdAt = ordem.createdAt ? new Date(ordem.createdAt) : new Date();
                const clientName = ordem.client?.name || 'N/A';
                const summary = ordem.summary || 'Sem descrição';
                const status = ordem.status || 'pendente';
                html += `
                    <tr style="border-bottom: 1px solid #dee2e6;">
                        <td style="padding: 12px;">${ordem.id.substring(0, 8)}...</td>
                        <td style="padding: 12px;">${clientName}</td>
                        <td style="padding: 12px;">${summary}</td>
                        <td style="padding: 12px;">${ordem.technician || 'N/A'}</td>
                        <td style="padding: 12px;">${createdAt.toLocaleDateString('pt-BR')} ${createdAt.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</td>
                        <td style="padding: 12px;"><span class="status-badge status-${status}">${this.formatStatusName(status)}</span></td>
                        <td style="padding: 12px;">
                            <button class="btn btn-info btn-sm" onclick="dashboard.viewOS('${ordem.id}')">Ver</button>
                            <button class="btn btn-warning btn-sm" onclick="dashboard.editOS('${ordem.id}'); dashboard.closeModal('expanded-list-modal');">Editar</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            content.innerHTML = html;
            
        } catch (error) {
            console.error('Erro ao carregar lista expandida:', error);
        }
    }

    filterExpandedList(type) {
        const statusFilter = document.getElementById('exp-filter-status')?.value || '';
        const priorityFilter = document.getElementById('exp-filter-priority')?.value || '';
        const searchFilter = document.getElementById('exp-search')?.value || '';
        
        const filters = {
            status: statusFilter,
            priority: priorityFilter,
            search: searchFilter
        };
        
        if (type === 'atendimentos') {
            this.loadExpandedAtendimentos(filters);
        } else if (type === 'os-pending') {
            this.loadExpandedOSPending(filters);
        }
    }

    // Utility methods
    showNotification(message, type = 'info') {
        // Implementar sistema de notificação
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

    // Funções para gerenciar fotos de entrada
    openFotosEntrada(atendimentoId) {
        // Buscar em todos os arrays possíveis
        const atendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
        const ordensServico = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
        
        let atendimento = atendimentos.find(a => a.id === atendimentoId);
        
        // Se não encontrou em atendimentos, buscar em OS
        if (!atendimento) {
            atendimento = ordensServico.find(o => o.id === atendimentoId);
        }
        
        if (!atendimento) {
            this.showNotification('Atendimento não encontrado', 'error');
            return;
        }

        const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
        const devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');
        const client = clients.find(c => c.id === atendimento.clientId);
        const device = devices.find(d => d.id === atendimento.deviceId);

        document.getElementById('fotos-entrada-item-id').value = atendimentoId;
        document.getElementById('fotos-entrada-cliente').textContent = client ? client.name : 'N/A';
        document.getElementById('fotos-entrada-aparelho').textContent = device ? `${device.brand} ${device.model}` : atendimento.summary || 'N/A';
        document.getElementById('fotos-entrada-serial').textContent = device ? (device.imei || 'N/A') : 'N/A';
        
        // Carregar fotos e observações salvas
        this.loadFotosPreview('entrada', atendimento.fotosEntrada || []);
        document.getElementById('fotos-entrada-obs').value = atendimento.fotosEntradaObs || '';
        
        // Setup file upload handler
        const uploadInput = document.getElementById('fotos-entrada-upload');
        uploadInput.value = '';
        uploadInput.onchange = (e) => this.handleFotosUpload(e, 'entrada');
        
        this.openModal('fotos-entrada-modal');
    }

    handleFotosUpload(event, tipo) {
        const files = event.target.files;
        const previewDiv = document.getElementById(`fotos-${tipo}-preview`);
        
        if (!files || files.length === 0) {
            return;
        }
        
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('div');
                    img.style.cssText = 'position: relative; border: 2px solid #ddd; border-radius: 8px; overflow: hidden;';
                    img.innerHTML = `
                        <img src="${e.target.result}" style="width: 100%; height: 120px; object-fit: cover;" data-image-data="${e.target.result}">
                        <button onclick="this.parentElement.remove()" style="position: absolute; top: 5px; right: 5px; background: red; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-size: 16px; line-height: 1;">×</button>
                    `;
                    previewDiv.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    loadFotosPreview(tipo, fotos) {
        const previewDiv = document.getElementById(`fotos-${tipo}-preview`);
        previewDiv.innerHTML = '';
        
        if (fotos && fotos.length > 0) {
            fotos.forEach(fotoData => {
                const img = document.createElement('div');
                img.style.cssText = 'position: relative; border: 2px solid #ddd; border-radius: 8px; overflow: hidden;';
                img.innerHTML = `
                    <img src="${fotoData}" data-image-data="${fotoData}" style="width: 100%; height: 120px; object-fit: cover;">
                    <button onclick="this.parentElement.remove()" style="position: absolute; top: 5px; right: 5px; background: red; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-size: 16px; line-height: 1;">×</button>
                `;
                previewDiv.appendChild(img);
            });
        }
    }

    salvarFotosEntrada() {
        const atendimentoId = document.getElementById('fotos-entrada-item-id').value;
        
        // Buscar em todos os arrays possíveis
        const atendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
        const ordensServico = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
        
        let found = false;
        let targetArray = null;
        let targetKey = null;
        let index = -1;
        
        // Tentar encontrar em atendimentos
        index = atendimentos.findIndex(a => a.id === atendimentoId);
        if (index !== -1) {
            found = true;
            targetArray = atendimentos;
            targetKey = 'mockAtendimentos';
        }
        
        // Se não encontrou, buscar em OS
        if (!found) {
            index = ordensServico.findIndex(o => o.id === atendimentoId);
            if (index !== -1) {
                found = true;
                targetArray = ordensServico;
                targetKey = 'mockOrdens';
            }
        }
        
        if (!found) {
            this.showNotification('Atendimento não encontrado', 'error');
            return;
        }

        // Coletar todas as imagens do preview
        const previewDiv = document.getElementById('fotos-entrada-preview');
        const imgElements = previewDiv.querySelectorAll('img');
        
        if (imgElements.length === 0) {
            this.showNotification('Nenhuma foto foi adicionada', 'warning');
            return;
        }
        
        const fotos = Array.from(imgElements).map(img => {
            // Tentar pegar do data-attribute primeiro, senão usar src
            return img.dataset.imageData || img.src;
        });

        targetArray[index].fotosEntrada = fotos;
        targetArray[index].fotosEntradaObs = document.getElementById('fotos-entrada-obs').value;
        targetArray[index].fotosEntradaCount = fotos.length;
        targetArray[index].updatedAt = new Date().toISOString();

        localStorage.setItem(targetKey, JSON.stringify(targetArray));
        
        this.showNotification(`${fotos.length} foto(s) e observações de entrada salvas com sucesso`, 'success');
        this.closeModal('fotos-entrada-modal');
        this.loadEntradaAparelhos();
    }

    // Funções para gerenciar fotos de saída
    openFotosSaida(atendimentoId) {
        // Buscar em todos os arrays possíveis
        const atendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
        const ordensServico = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
        
        let atendimento = atendimentos.find(a => a.id === atendimentoId);
        
        // Se não encontrou em atendimentos, buscar em OS
        if (!atendimento) {
            atendimento = ordensServico.find(o => o.id === atendimentoId);
        }
        
        if (!atendimento) {
            this.showNotification('Atendimento não encontrado', 'error');
            return;
        }

        const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
        const devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');
        const client = clients.find(c => c.id === atendimento.clientId);
        const device = devices.find(d => d.id === atendimento.deviceId);

        document.getElementById('fotos-saida-item-id').value = atendimentoId;
        document.getElementById('fotos-saida-cliente').textContent = client ? client.name : 'N/A';
        document.getElementById('fotos-saida-aparelho').textContent = device ? `${device.brand} ${device.model}` : atendimento.summary || 'N/A';
        document.getElementById('fotos-saida-serial').textContent = device ? (device.imei || 'N/A') : 'N/A';
        
        // Carregar fotos e observações salvas
        this.loadFotosPreview('saida', atendimento.fotosSaida || []);
        document.getElementById('fotos-saida-obs').value = atendimento.fotosSaidaObs || '';
        
        // Setup file upload handler
        const uploadInput = document.getElementById('fotos-saida-upload');
        uploadInput.value = '';
        uploadInput.onchange = (e) => this.handleFotosUpload(e, 'saida');
        
        this.openModal('fotos-saida-modal');
    }

    salvarFotosSaida() {
        const atendimentoId = document.getElementById('fotos-saida-item-id').value;
        
        // Buscar em todos os arrays possíveis
        const atendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
        const ordensServico = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
        
        let found = false;
        let targetArray = null;
        let targetKey = null;
        let index = -1;
        
        // Tentar encontrar em atendimentos
        index = atendimentos.findIndex(a => a.id === atendimentoId);
        if (index !== -1) {
            found = true;
            targetArray = atendimentos;
            targetKey = 'mockAtendimentos';
        }
        
        // Se não encontrou, buscar em OS
        if (!found) {
            index = ordensServico.findIndex(o => o.id === atendimentoId);
            if (index !== -1) {
                found = true;
                targetArray = ordensServico;
                targetKey = 'mockOrdens';
            }
        }
        
        if (!found) {
            this.showNotification('Atendimento não encontrado', 'error');
            return;
        }

        // Coletar todas as imagens do preview
        const previewDiv = document.getElementById('fotos-saida-preview');
        const imgElements = previewDiv.querySelectorAll('img');
        
        if (imgElements.length === 0) {
            this.showNotification('Nenhuma foto foi adicionada', 'warning');
            return;
        }
        
        const fotos = Array.from(imgElements).map(img => {
            // Tentar pegar do data-attribute primeiro, senão usar src
            return img.dataset.imageData || img.src;
        });

        targetArray[index].fotosSaida = fotos;
        targetArray[index].fotosSaidaObs = document.getElementById('fotos-saida-obs').value;
        targetArray[index].fotosSaidaCount = fotos.length;
        targetArray[index].updatedAt = new Date().toISOString();

        localStorage.setItem(targetKey, JSON.stringify(targetArray));
        
        this.showNotification(`${fotos.length} foto(s) e observações de saída salvas com sucesso`, 'success');
        this.closeModal('fotos-saida-modal');
        this.loadSaidaAparelhos();
    }

    finalizarEntrega(atendimentoId) {
        if (!confirm('Deseja finalizar a entrega deste aparelho ao cliente?')) {
            return;
        }

        const atendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
        const index = atendimentos.findIndex(a => a.id === atendimentoId);
        
        if (index === -1) {
            this.showNotification('Atendimento não encontrado', 'error');
            return;
        }

        // Atualizar status para "atendimento_finalizado" (oculto)
        atendimentos[index].status = 'atendimento_finalizado';
        atendimentos[index].dataEntrega = new Date().toISOString();
        atendimentos[index].updatedAt = new Date().toISOString();

        localStorage.setItem('mockAtendimentos', JSON.stringify(atendimentos));
        
        this.showNotification('Entrega finalizada com sucesso!', 'success');
        this.loadSaidaAparelhos();
        this.loadAtendimentos();
        this.updateStats();
    }

    finalizarEntregaOS(osId) {
        if (!confirm('Deseja finalizar a entrega desta OS ao cliente?')) {
            return;
        }

        const ordens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
        const index = ordens.findIndex(o => o.id === osId);
        
        if (index === -1) {
            this.showNotification('OS não encontrada', 'error');
            return;
        }

        // Atualizar status para "finalized"
        ordens[index].status = 'finalized';
        ordens[index].dataEntrega = new Date().toISOString();
        ordens[index].updatedAt = new Date().toISOString();
        
        // Adicionar ao histórico
        if (!ordens[index].statusHistory) {
            ordens[index].statusHistory = [];
        }
        ordens[index].statusHistory.push({
            from: 'aparelho_pronto',
            to: 'finalized',
            timestamp: new Date().toISOString(),
            changedBy: 'Sistema (Entrega Finalizada)'
        });

        localStorage.setItem('mockOrdens', JSON.stringify(ordens));
        
        this.showNotification('Entrega da OS finalizada com sucesso!', 'success');
        this.loadSaidaAparelhos();
        this.loadOSPending();
        this.loadOSFinalized();
        this.updateStats();
    }

    // Client list management
    openClientsListModal() {
        const modal = document.getElementById('clients-list-modal');
        modal.classList.add('show');
        this.loadClientsList();
    }

    loadClientsList() {
        const tbody = document.querySelector('#clients-list-modal tbody');
        const loading = document.getElementById('clients-list-loading');
        const empty = document.getElementById('clients-list-empty');
        
        loading.style.display = 'block';
        empty.style.display = 'none';
        tbody.innerHTML = '';

        const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
        const devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');

        setTimeout(() => {
            loading.style.display = 'none';
            
            if (clients.length === 0) {
                empty.style.display = 'block';
                return;
            }

            clients.forEach(client => {
                const clientDevices = devices.filter(d => d.clientQRCode === client.qrCode);
                const row = this.createClientRow(client, clientDevices.length);
                tbody.appendChild(row);
            });
        }, 300);
    }

    createClientRow(client, deviceCount) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="qr-code">${client.qrCode}</span></td>
            <td>${client.nome}</td>
            <td>${client.telefone || '-'}</td>
            <td>${client.cpfCnpj || '-'}</td>
            <td>${client.email || '-'}</td>
            <td><span class="badge badge-info">${deviceCount} aparelho${deviceCount !== 1 ? 's' : ''}</span></td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="dashboard.editClientFromList('${client.qrCode}')">
                    ✏️ Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="dashboard.deleteClientFromList('${client.qrCode}')">
                    🗑️ Excluir
                </button>
            </td>
        `;
        return tr;
    }

    filterClientsList(searchTerm) {
        const tbody = document.querySelector('#clients-list-modal tbody');
        const rows = tbody.querySelectorAll('tr');
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    }

    editClientFromList(qrCode) {
        const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
        const client = clients.find(c => c.qrCode === qrCode);
        
        if (!client) {
            this.showNotification('Cliente não encontrado!', 'error');
            return;
        }

        // Close clients list modal
        document.getElementById('clients-list-modal').classList.remove('show');
        
        // Open client modal for editing
        this.openClientModal(client);
    }

    deleteClientFromList(qrCode) {
        if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
            return;
        }

        const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
        const devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');
        
        // Check if client has devices
        const clientDevices = devices.filter(d => d.clientQRCode === qrCode);
        if (clientDevices.length > 0) {
            if (!confirm(`Este cliente possui ${clientDevices.length} aparelho(s) cadastrado(s). Deseja continuar? Os aparelhos ficarão sem vínculo.`)) {
                return;
            }
            
            // Unlink devices
            devices.forEach(device => {
                if (device.clientQRCode === qrCode) {
                    device.clientQRCode = null;
                }
            });
            localStorage.setItem('mockDevices', JSON.stringify(devices));
        }

        // Delete client
        const filteredClients = clients.filter(c => c.qrCode !== qrCode);
        localStorage.setItem('mockClients', JSON.stringify(filteredClients));
        
        this.showNotification('Cliente excluído com sucesso!', 'success');
        this.loadClientsList();
    }

    deleteAtendimento(id) {
        if (!confirm('Tem certeza que deseja excluir este atendimento? Esta ação não pode ser desfeita.')) {
            return;
        }

        const atendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
        const filteredAtendimentos = atendimentos.filter(a => a.id !== id);
        
        localStorage.setItem('mockAtendimentos', JSON.stringify(filteredAtendimentos));
        
        this.showNotification('Atendimento excluído com sucesso!', 'success');
        this.loadAtendimentos();
        this.loadEntradaAparelhos();
        this.loadSaidaAparelhos();
        this.updateStats();
    }

    // Visualizar fotos da OS
    viewOSFotos(osId) {
        const ordens = JSON.parse(localStorage.getItem('mockOrdens') || '[]');
        const ordem = ordens.find(o => o.id === osId);
        
        if (!ordem) {
            this.showNotification('OS não encontrada', 'error');
            return;
        }

        const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
        const client = clients.find(c => c.id === ordem.clientId);

        // Preencher informações da OS
        document.getElementById('view-fotos-os-id').textContent = ordem.id.substring(0, 8) + '...';
        document.getElementById('view-fotos-cliente').textContent = client ? client.name : 'N/A';
        document.getElementById('view-fotos-aparelho').textContent = ordem.summary || 'N/A';

        this.renderFotosView(ordem);
        this.openModal('view-os-fotos-modal');
    }

    // Visualizar fotos de atendimento
    viewAtendimentoFotos(atendimentoId) {
        const atendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
        const atendimento = atendimentos.find(a => a.id === atendimentoId);
        
        if (!atendimento) {
            this.showNotification('Atendimento não encontrado', 'error');
            return;
        }

        const clients = JSON.parse(localStorage.getItem('mockClients') || '[]');
        const devices = JSON.parse(localStorage.getItem('mockDevices') || '[]');
        const client = clients.find(c => c.id === atendimento.clientId);
        const device = devices.find(d => d.id === atendimento.deviceId);

        // Preencher informações do atendimento
        document.getElementById('view-fotos-os-id').textContent = atendimento.id.substring(0, 8) + '...';
        document.getElementById('view-fotos-cliente').textContent = client ? client.name : 'N/A';
        document.getElementById('view-fotos-aparelho').textContent = device ? `${device.brand} ${device.model}` : atendimento.summary || 'N/A';

        this.renderFotosView(atendimento);
        this.openModal('view-os-fotos-modal');
    }

    renderFotosView(item) {
        // Fotos de Entrada
        const entradaGallery = document.getElementById('view-fotos-entrada-gallery');
        const entradaObs = document.getElementById('view-fotos-entrada-obs');
        const entradaEmpty = document.getElementById('view-fotos-entrada-empty');
        
        entradaGallery.innerHTML = '';
        entradaObs.innerHTML = '';
        
        if (item.fotosEntrada && item.fotosEntrada.length > 0) {
            entradaEmpty.style.display = 'none';
            item.fotosEntrada.forEach((foto, index) => {
                const imgDiv = document.createElement('div');
                imgDiv.style.cssText = 'border: 2px solid #ddd; border-radius: 8px; overflow: hidden; cursor: pointer;';
                imgDiv.innerHTML = `<img src="${foto}" style="width: 100%; height: 200px; object-fit: cover;" onclick="window.open(this.src, '_blank')" title="Clique para ampliar">`;
                entradaGallery.appendChild(imgDiv);
            });
            
            if (item.fotosEntradaObs) {
                entradaObs.innerHTML = `<strong>📝 Observações:</strong><br>${item.fotosEntradaObs.replace(/\n/g, '<br>')}`;
            } else {
                entradaObs.style.display = 'none';
            }
        } else {
            entradaEmpty.style.display = 'block';
            entradaObs.style.display = 'none';
        }

        // Fotos de Saída
        const saidaGallery = document.getElementById('view-fotos-saida-gallery');
        const saidaObs = document.getElementById('view-fotos-saida-obs');
        const saidaEmpty = document.getElementById('view-fotos-saida-empty');
        
        saidaGallery.innerHTML = '';
        saidaObs.innerHTML = '';
        
        if (item.fotosSaida && item.fotosSaida.length > 0) {
            saidaEmpty.style.display = 'none';
            item.fotosSaida.forEach((foto, index) => {
                const imgDiv = document.createElement('div');
                imgDiv.style.cssText = 'border: 2px solid #ddd; border-radius: 8px; overflow: hidden; cursor: pointer;';
                imgDiv.innerHTML = `<img src="${foto}" style="width: 100%; height: 200px; object-fit: cover;" onclick="window.open(this.src, '_blank')" title="Clique para ampliar">`;
                saidaGallery.appendChild(imgDiv);
            });
            
            if (item.fotosSaidaObs) {
                saidaObs.innerHTML = `<strong>📝 Observações:</strong><br>${item.fotosSaidaObs.replace(/\n/g, '<br>')}`;
            } else {
                saidaObs.style.display = 'none';
            }
        } else {
            saidaEmpty.style.display = 'block';
            saidaObs.style.display = 'none';
        }
    }
}

// Inicializar dashboard quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new OSDashboard();
});

// CSS para animação de notificação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);