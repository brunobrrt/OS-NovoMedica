// Utilitários para sistema QR Code
class QRCodeManager {
    constructor(apiBaseUrl = 'http://localhost:3000/api') {
        this.apiBaseUrl = apiBaseUrl;
        this.token = localStorage.getItem('authToken');
    }

    // Configurar token de autenticação
    setAuthToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Headers padrão para requisições
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': this.token ? `Bearer ${this.token}` : ''
        };
    }

    // Gerar QR Code para cliente
    async generateQRCode(clientId, action = 'edit') {
        try {
            const response = await fetch(`${this.apiBaseUrl}/qr/generate`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ clientId, action })
            });

            if (!response.ok) {
                throw new Error(`Erro ao gerar QR: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao gerar QR Code:', error);
            throw error;
        }
    }

    // Validar token QR Code
    async validateQRToken(token) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/qr/validate`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ token })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `Erro de validação: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao validar QR Code:', error);
            throw error;
        }
    }

    // Processar QR Code escaneado/colado
    async processQRCode(qrData) {
        try {
            // Validar o token
            const validation = await this.validateQRToken(qrData);
            
            if (!validation.valid) {
                throw new Error('QR Code inválido');
            }

            const { payload, client } = validation;

            // Retornar dados processados
            return {
                success: true,
                action: payload.action,
                clientId: payload.clientId,
                client: client,
                expiresAt: new Date(payload.exp * 1000)
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Exemplo de payloads válidos e inválidos
    static getExamplePayloads() {
        const validExamples = {
            editClient: {
                description: "QR Code para editar cliente existente",
                payload: {
                    clientId: "123e4567-e89b-12d3-a456-426614174000",
                    action: "edit",
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    iat: Math.floor(Date.now() / 1000)
                },
                base64Token: "eyJwYXlsb2FkIjp7ImNsaWVudElkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwiYWN0aW9uIjoiZWRpdCIsImV4cCI6MTczNjY5NDAwMCwiaWF0IjoxNzM2NjkwNDAwfSwic2lnbmF0dXJlIjoiYWJjZGVmMTIzNDU2Nzg5MCJ9"
            },
            registerClient: {
                description: "QR Code para registrar novo cliente",
                payload: {
                    clientId: "new-client-id",
                    action: "register",
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    iat: Math.floor(Date.now() / 1000)
                },
                base64Token: "eyJwYXlsb2FkIjp7ImNsaWVudElkIjoibmV3LWNsaWVudC1pZCIsImFjdGlvbiI6InJlZ2lzdGVyIiwiZXhwIjoxNzM2Njk0MDAwLCJpYXQiOjE3MzY2OTA0MDB9LCJzaWduYXR1cmUiOiJ4eXoxMjM0NTY3ODkwIn0="
            }
        };

        const invalidExamples = {
            expiredToken: {
                description: "Token expirado",
                error: "Token expirado",
                payload: {
                    clientId: "123e4567-e89b-12d3-a456-426614174000",
                    action: "edit",
                    exp: Math.floor(Date.now() / 1000) - 3600, // Expirado há 1 hora
                    iat: Math.floor(Date.now() / 1000) - 7200
                }
            },
            invalidAction: {
                description: "Ação inválida",
                error: "Ação deve ser 'edit' ou 'register'",
                payload: {
                    clientId: "123e4567-e89b-12d3-a456-426614174000",
                    action: "invalid_action",
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    iat: Math.floor(Date.now() / 1000)
                }
            },
            malformedToken: {
                description: "Token malformado",
                error: "Token malformado",
                base64Token: "invalid-base64-token"
            },
            invalidSignature: {
                description: "Assinatura inválida",
                error: "Token inválido - assinatura não confere",
                payload: {
                    clientId: "123e4567-e89b-12d3-a456-426614174000",
                    action: "edit",
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    iat: Math.floor(Date.now() / 1000)
                },
                tamperedSignature: "tampered-signature"
            }
        };

        return { validExamples, invalidExamples };
    }
}

// Utilitários para API de Atendimentos
class AtendimentosAPI {
    constructor(apiBaseUrl = 'http://localhost:3000/api') {
        this.apiBaseUrl = apiBaseUrl;
        this.token = localStorage.getItem('authToken');
    }

    setAuthToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': this.token ? `Bearer ${this.token}` : ''
        };
    }

    async getAtendimentos(filters = {}) {
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== '') {
                    params.append(key, filters[key]);
                }
            });

            const response = await fetch(`${this.apiBaseUrl}/atendimentos?${params}`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar atendimentos: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar atendimentos:', error);
            throw error;
        }
    }

    async createAtendimento(data) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/atendimentos`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Erro ao criar atendimento: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao criar atendimento:', error);
            throw error;
        }
    }

    async updateAtendimento(id, data) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/atendimentos/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Erro ao atualizar atendimento: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar atendimento:', error);
            throw error;
        }
    }

    async deleteAtendimento(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/atendimentos/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Erro ao deletar atendimento: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Erro ao deletar atendimento:', error);
            throw error;
        }
    }
}

// Utilitários para API de Ordens de Serviço
class OSApi {
    constructor(apiBaseUrl = 'http://localhost:3000/api') {
        this.apiBaseUrl = apiBaseUrl;
        this.token = localStorage.getItem('authToken');
    }

    setAuthToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': this.token ? `Bearer ${this.token}` : ''
        };
    }

    async getOrdens(filters = {}) {
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== '') {
                    params.append(key, filters[key]);
                }
            });

            const response = await fetch(`${this.apiBaseUrl}/os?${params}`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar ordens: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar ordens:', error);
            throw error;
        }
    }

    async createOrdem(data) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/os`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Erro ao criar ordem: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao criar ordem:', error);
            throw error;
        }
    }

    async updateOrdem(id, data) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/os/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Erro ao atualizar ordem: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar ordem:', error);
            throw error;
        }
    }

    async signOrdem(id, signatureUrl) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/os/${id}/sign`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({ signatureUrl })
            });

            if (!response.ok) {
                throw new Error(`Erro ao assinar ordem: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao assinar ordem:', error);
            throw error;
        }
    }

    async finalizeOrdem(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/os/${id}/finalize`, {
                method: 'PATCH',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Erro ao finalizar ordem: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao finalizar ordem:', error);
            throw error;
        }
    }

    async paymentOrdem(id, paymentData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/os/${id}/payment`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                throw new Error(`Erro ao processar pagamento: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao processar pagamento:', error);
            throw error;
        }
    }

    async confirmPaymentOrdem(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/os/${id}/confirm-payment`, {
                method: 'PATCH',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Erro ao confirmar pagamento: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao confirmar pagamento:', error);
            throw error;
        }
    }

    async getOrdem(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/os/${id}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar ordem: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar ordem:', error);
            throw error;
        }
    }

    async deleteOrdem(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/os/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Erro ao excluir ordem: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao excluir ordem:', error);
            throw error;
        }
    }
}

// Utilitários para clientes
class ClientsAPI {
    constructor(apiBaseUrl = 'http://localhost:3000/api') {
        this.apiBaseUrl = apiBaseUrl;
        this.token = localStorage.getItem('authToken');
    }

    setAuthToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': this.token ? `Bearer ${this.token}` : ''
        };
    }

    async getClient(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/clients/${id}`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar cliente: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar cliente:', error);
            throw error;
        }
    }

    async getClients() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/clients`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar clientes: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            throw error;
        }
    }

    async createClient(data) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/clients`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Erro ao criar cliente: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            throw error;
        }
    }

    async updateClient(id, data) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/clients/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Erro ao atualizar cliente: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            throw error;
        }
    }
}

// Exportar classes para uso global
window.QRCodeManager = QRCodeManager;
window.AtendimentosAPI = AtendimentosAPI;
window.OSApi = OSApi;
window.ClientsAPI = ClientsAPI;