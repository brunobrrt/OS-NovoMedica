// Testes para o sistema de QR Code e fluxo de OS
const request = require('supertest');
const app = require('../api/server');

describe('Sistema de QR Code e OS', () => {
    let authToken;
    let clientId;
    let atendimentoId;
    let osId;

    beforeAll(async () => {
        // Login para obter token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'admin123'
            });
        
        authToken = loginResponse.body.token;

        // Criar cliente de teste
        const clientResponse = await request(app)
            .post('/api/clients')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Cliente Teste',
                phone: '11999999999',
                email: 'teste@email.com',
                address: 'Rua Teste, 123'
            });
        
        clientId = clientResponse.body.id;
    });

    describe('Autenticação', () => {
        test('Deve fazer login com credenciais válidas', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@example.com',
                    password: 'admin123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
        });

        test('Deve rejeitar credenciais inválidas', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@example.com',
                    password: 'senha_errada'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });

        test('Deve rejeitar acesso sem token', async () => {
            const response = await request(app)
                .get('/api/clients');

            expect(response.status).toBe(401);
        });
    });

    describe('Gestão de Clientes', () => {
        test('Deve criar cliente', async () => {
            const clientData = {
                name: 'João Silva',
                phone: '11888888888',
                email: 'joao@email.com'
            };

            const response = await request(app)
                .post('/api/clients')
                .set('Authorization', `Bearer ${authToken}`)
                .send(clientData);

            expect(response.status).toBe(201);
            expect(response.body.name).toBe(clientData.name);
            expect(response.body).toHaveProperty('id');
        });

        test('Deve buscar cliente por ID', async () => {
            const response = await request(app)
                .get(`/api/clients/${clientId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(clientId);
        });

        test('Deve atualizar cliente', async () => {
            const updateData = {
                name: 'Cliente Teste Atualizado',
                email: 'atualizado@email.com'
            };

            const response = await request(app)
                .put(`/api/clients/${clientId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe(updateData.name);
            expect(response.body.email).toBe(updateData.email);
        });

        test('Deve retornar 404 para cliente inexistente', async () => {
            const response = await request(app)
                .get('/api/clients/id-inexistente')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('QR Code - Geração e Validação', () => {
        let qrToken;

        test('Deve gerar QR Code para cliente existente', async () => {
            const response = await request(app)
                .post('/api/qr/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    clientId: clientId,
                    action: 'edit'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('qrData');
            expect(response.body).toHaveProperty('expiresAt');
            
            qrToken = response.body.token;
        });

        test('Deve validar QR Code válido', async () => {
            const response = await request(app)
                .post('/api/qr/validate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    token: qrToken
                });

            expect(response.status).toBe(200);
            expect(response.body.valid).toBe(true);
            expect(response.body.payload.clientId).toBe(clientId);
            expect(response.body.payload.action).toBe('edit');
            expect(response.body).toHaveProperty('client');
        });

        test('Deve rejeitar QR Code com ação inválida', async () => {
            const response = await request(app)
                .post('/api/qr/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    clientId: clientId,
                    action: 'acao_invalida'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('action');
        });

        test('Deve rejeitar QR Code malformado', async () => {
            const response = await request(app)
                .post('/api/qr/validate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    token: 'token-malformado-123'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('malformado');
        });

        test('Deve gerar QR Code para registro', async () => {
            const response = await request(app)
                .post('/api/qr/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    clientId: 'novo-cliente',
                    action: 'register'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
        });
    });

    describe('Gestão de Atendimentos', () => {
        test('Deve criar atendimento', async () => {
            const atendimentoData = {
                clientId: clientId,
                summary: 'Reparo de smartphone',
                priority: 'alta',
                status: 'aguardando'
            };

            const response = await request(app)
                .post('/api/atendimentos')
                .set('Authorization', `Bearer ${authToken}`)
                .send(atendimentoData);

            expect(response.status).toBe(201);
            expect(response.body.summary).toBe(atendimentoData.summary);
            expect(response.body.priority).toBe(atendimentoData.priority);
            expect(response.body).toHaveProperty('client');
            
            atendimentoId = response.body.id;
        });

        test('Deve buscar atendimentos com filtros', async () => {
            const response = await request(app)
                .get('/api/atendimentos?status=aguardando&sortBy=priority&sortOrder=desc')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('atendimentos');
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('page');
        });

        test('Deve atualizar atendimento', async () => {
            const updateData = {
                status: 'em_atendimento',
                priority: 'média'
            };

            const response = await request(app)
                .put(`/api/atendimentos/${atendimentoId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(updateData.status);
        });

        test('Deve deletar atendimento', async () => {
            const response = await request(app)
                .delete(`/api/atendimentos/${atendimentoId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(204);
        });

        test('Deve rejeitar criação sem dados obrigatórios', async () => {
            const response = await request(app)
                .post('/api/atendimentos')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    clientId: clientId
                    // summary ausente
                });

            expect(response.status).toBe(400);
        });
    });

    describe('Gestão de Ordens de Serviço', () => {
        test('Deve criar OS', async () => {
            const osData = {
                clientId: clientId,
                summary: 'Troca de tela de smartphone',
                technician: 'João Técnico'
            };

            const response = await request(app)
                .post('/api/os')
                .set('Authorization', `Bearer ${authToken}`)
                .send(osData);

            expect(response.status).toBe(201);
            expect(response.body.summary).toBe(osData.summary);
            expect(response.body.status).toBe('pending');
            expect(response.body.signatureUrl).toBe(null);
            
            osId = response.body.id;
        });

        test('Deve buscar OS por status', async () => {
            const response = await request(app)
                .get('/api/os?status=pending')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('ordens');
            expect(response.body.ordens.length).toBeGreaterThan(0);
        });

        test('Deve assinar OS', async () => {
            const response = await request(app)
                .patch(`/api/os/${osId}/sign`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    signatureUrl: 'signature_test.png'
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('signed');
            expect(response.body.signatureUrl).toBeDefined();
        });

        test('Deve finalizar OS assinada', async () => {
            const response = await request(app)
                .patch(`/api/os/${osId}/finalize`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('finalized');
        });

        test('Deve rejeitar finalização de OS não assinada', async () => {
            // Criar OS não assinada
            const osResponse = await request(app)
                .post('/api/os')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    clientId: clientId,
                    summary: 'OS para teste de rejeição'
                });

            const newOsId = osResponse.body.id;

            const response = await request(app)
                .patch(`/api/os/${newOsId}/finalize`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('paga');
        });

        test('Deve atualizar OS', async () => {
            const updateData = {
                technician: 'Maria Técnica',
                summary: 'Reparo atualizado'
            };

            const response = await request(app)
                .put(`/api/os/${osId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.technician).toBe(updateData.technician);
        });
    });

    describe('Fluxo de Pagamento', () => {
        let paymentOsId;

        beforeEach(async () => {
            // Criar e assinar uma OS para teste de pagamento
            const osResponse = await request(app)
                .post('/api/os')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    clientId: clientId,
                    summary: 'OS para teste de pagamento',
                    technician: 'Técnico Teste'
                });

            paymentOsId = osResponse.body.id;

            // Assinar a OS
            await request(app)
                .patch(`/api/os/${paymentOsId}/sign`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ signatureUrl: 'data:image/png;base64,test' });
        });

        test('Deve enviar OS assinada para pagamento', async () => {
            const paymentData = {
                amount: 150.00,
                method: 'pix',
                notes: 'Pagamento via PIX'
            };

            const response = await request(app)
                .patch(`/api/os/${paymentOsId}/payment`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(paymentData);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('awaiting_payment');
            expect(response.body.paymentAmount).toBe(paymentData.amount);
            expect(response.body.paymentMethod).toBe(paymentData.method);
        });

        test('Deve rejeitar pagamento sem valor', async () => {
            const response = await request(app)
                .patch(`/api/os/${paymentOsId}/payment`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ method: 'pix' });

            expect(response.status).toBe(400);
        });

        test('Deve confirmar pagamento de OS', async () => {
            // Primeiro enviar para pagamento
            await request(app)
                .patch(`/api/os/${paymentOsId}/payment`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    amount: 150.00,
                    method: 'pix',
                    notes: 'Teste'
                });

            // Confirmar pagamento
            const response = await request(app)
                .patch(`/api/os/${paymentOsId}/confirm-payment`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('paid');
            expect(response.body.paidAt).toBeDefined();
        });

        test('Deve rejeitar confirmação de pagamento de OS não aguardando', async () => {
            const response = await request(app)
                .patch(`/api/os/${paymentOsId}/confirm-payment`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('aguardando pagamento');
        });

        test('Deve finalizar OS paga', async () => {
            // Enviar para pagamento
            await request(app)
                .patch(`/api/os/${paymentOsId}/payment`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    amount: 150.00,
                    method: 'pix'
                });

            // Confirmar pagamento
            await request(app)
                .patch(`/api/os/${paymentOsId}/confirm-payment`)
                .set('Authorization', `Bearer ${authToken}`);

            // Finalizar
            const response = await request(app)
                .patch(`/api/os/${paymentOsId}/finalize`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('finalized');
        });

        test('Verificar estatísticas incluindo status de pagamento', async () => {
            const response = await request(app)
                .get('/api/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.ordens).toHaveProperty('awaiting_payment');
            expect(response.body.ordens).toHaveProperty('paid');
        });
    });

    describe('Fluxo Completo E2E', () => {
        test('Fluxo completo: Atendimento → OS → Assinatura → Pagamento → Finalização', async () => {
            // 1. Criar cliente
            const clientResponse = await request(app)
                .post('/api/clients')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Cliente E2E',
                    phone: '11777777777',
                    email: 'e2e@email.com'
                });

            const e2eClientId = clientResponse.body.id;

            // 2. Criar atendimento
            const atendimentoResponse = await request(app)
                .post('/api/atendimentos')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    clientId: e2eClientId,
                    summary: 'Reparo de notebook',
                    priority: 'alta'
                });

            expect(atendimentoResponse.status).toBe(201);
            const e2eAtendimentoId = atendimentoResponse.body.id;

            // 3. Criar OS a partir do atendimento
            const osResponse = await request(app)
                .post('/api/os')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    clientId: e2eClientId,
                    summary: 'Substituição de HD',
                    technician: 'Técnico E2E'
                });

            expect(osResponse.status).toBe(201);
            expect(osResponse.body.status).toBe('pending');
            const e2eOsId = osResponse.body.id;

            // 4. Gerar QR Code para o cliente
            const qrResponse = await request(app)
                .post('/api/qr/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    clientId: e2eClientId,
                    action: 'edit'
                });

            expect(qrResponse.status).toBe(200);
            expect(qrResponse.body).toHaveProperty('token');
            expect(qrResponse.body).toHaveProperty('regCode');

            // 5. Validar QR Code
            const validateResponse = await request(app)
                .post('/api/qr/validate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    token: qrResponse.body.token
                });

            expect(validateResponse.status).toBe(200);
            expect(validateResponse.body.valid).toBe(true);

            // 6. Assinar OS
            const signResponse = await request(app)
                .patch(`/api/os/${e2eOsId}/sign`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    signatureUrl: 'e2e_signature.png'
                });

            expect(signResponse.status).toBe(200);
            expect(signResponse.body.status).toBe('signed');
            expect(signResponse.body.qrCode).toBeDefined();

            // 7. Enviar para pagamento
            const paymentResponse = await request(app)
                .patch(`/api/os/${e2eOsId}/payment`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    amount: 250.00,
                    method: 'cartao',
                    notes: 'Pagamento via cartão de crédito'
                });

            expect(paymentResponse.status).toBe(200);
            expect(paymentResponse.body.status).toBe('awaiting_payment');

            // 8. Confirmar pagamento
            const confirmResponse = await request(app)
                .patch(`/api/os/${e2eOsId}/confirm-payment`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(confirmResponse.status).toBe(200);
            expect(confirmResponse.body.status).toBe('paid');
            expect(confirmResponse.body.paidAt).toBeDefined();

            // 9. Finalizar OS
            const finalizeResponse = await request(app)
                .patch(`/api/os/${e2eOsId}/finalize`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(finalizeResponse.status).toBe(200);
            expect(finalizeResponse.body.status).toBe('finalized');

            // 10. Verificar estatísticas
            const statsResponse = await request(app)
                .get('/api/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(statsResponse.status).toBe(200);
            expect(statsResponse.body).toHaveProperty('ordens');
            expect(statsResponse.body.ordens.finalized).toBeGreaterThan(0);
            expect(statsResponse.body.ordens).toHaveProperty('awaiting_payment');
            expect(statsResponse.body.ordens).toHaveProperty('paid');
        });
    });

    describe('Validação de Segurança QR', () => {
        test('Token expirado deve ser rejeitado', async () => {
            // Criar payload com tempo expirado
            const expiredPayload = {
                clientId: clientId,
                action: 'edit',
                exp: Math.floor(Date.now() / 1000) - 3600, // Expirado há 1 hora
                iat: Math.floor(Date.now() / 1000) - 7200
            };

            // Tentar validar (em ambiente real, isso seria gerado com assinatura válida mas expirada)
            // Para teste, simulamos a resposta esperada
            const mockToken = Buffer.from(JSON.stringify({
                payload: expiredPayload,
                signature: 'mock-signature'
            })).toString('base64');

            const response = await request(app)
                .post('/api/qr/validate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    token: mockToken
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toContain('expirado');
        });

        test('Deve rejeitar clientId inexistente para ação edit', async () => {
            const response = await request(app)
                .post('/api/qr/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    clientId: 'cliente-inexistente',
                    action: 'edit'
                });

            // Gerar será bem-sucedido, mas validação deve falhar ao não encontrar cliente
            expect(response.status).toBe(200);

            const validateResponse = await request(app)
                .post('/api/qr/validate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    token: response.body.token
                });

            expect(validateResponse.status).toBe(404);
        });
    });
});

// Testes unitários para utilitários QR
describe('Utilitários QR Code Frontend', () => {
    test('Deve retornar exemplos de payloads', () => {
        const examples = QRCodeManager.getExamplePayloads();
        
        expect(examples).toHaveProperty('validExamples');
        expect(examples).toHaveProperty('invalidExamples');
        
        expect(examples.validExamples).toHaveProperty('editClient');
        expect(examples.validExamples).toHaveProperty('registerClient');
        
        expect(examples.invalidExamples).toHaveProperty('expiredToken');
        expect(examples.invalidExamples).toHaveProperty('invalidAction');
        expect(examples.invalidExamples).toHaveProperty('malformedToken');
    });
});

// Configuração de teste para limpeza
afterAll(async () => {
    // Limpar dados de teste se necessário
    console.log('Testes concluídos');
});