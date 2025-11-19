require('dotenv').config();
const db = require('./database');

async function migrateLocalStorageToMySQL() {
    console.log('🚀 Iniciando migração de dados...\n');

    try {
        await db.init();
        console.log('✅ Conexão com banco estabelecida\n');

        // Cole aqui os dados exportados do localStorage
        // Você pode obter esses dados executando no console do navegador:
        /*
        const dados = {
            clientes: localStorage.getItem('mockClients'),
            atendimentos: localStorage.getItem('mockAtendimentos'),
            ordens: localStorage.getItem('mockOrdens'),
            dispositivos: localStorage.getItem('mockDevices'),
            usuarios: localStorage.getItem('systemUsers')
        };
        console.log(JSON.stringify(dados, null, 2));
        */

        const dados = {
            // COLE OS DADOS AQUI
            clientes: '[]',
            atendimentos: '[]',
            ordens: '[]',
            dispositivos: '[]',
            usuarios: '[]'
        };

        // Migrar Clientes
        console.log('📋 Migrando clientes...');
        const clientes = JSON.parse(dados.clientes || '[]');
        let clientesCount = 0;
        
        for (const cliente of clientes) {
            try {
                await db.query(
                    `INSERT INTO clients (name, phone, cpf_cnpj, email, address, qr_code, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        cliente.name,
                        cliente.phone,
                        cliente.cpfCnpj || cliente.cpf_cnpj || null,
                        cliente.email || null,
                        cliente.address || null,
                        cliente.qrCode || cliente.qr_code || null,
                        cliente.createdAt || new Date().toISOString(),
                        cliente.updatedAt || new Date().toISOString()
                    ]
                );
                clientesCount++;
            } catch (error) {
                console.warn(`⚠️  Erro ao migrar cliente ${cliente.name}:`, error.message);
            }
        }
        console.log(`✅ ${clientesCount} clientes migrados\n`);

        // Migrar Dispositivos
        console.log('📱 Migrando dispositivos...');
        const dispositivos = JSON.parse(dados.dispositivos || '[]');
        let dispositivosCount = 0;
        
        for (const device of dispositivos) {
            try {
                // Buscar ID do cliente no novo banco
                const clientResult = await db.query(
                    'SELECT id FROM clients WHERE qr_code = ? LIMIT 1',
                    [device.ownerId] // Assumindo que ownerId é o qr_code do cliente
                );
                
                const ownerId = clientResult[0]?.id;
                
                if (ownerId) {
                    await db.query(
                        `INSERT INTO devices (owner_id, brand, model, imei, serial_number, qr_code, created_at, updated_at) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            ownerId,
                            device.brand || null,
                            device.model || null,
                            device.imei || null,
                            device.serialNumber || device.serial_number || null,
                            device.qrCode || device.qr_code || null,
                            device.createdAt || new Date().toISOString(),
                            device.updatedAt || new Date().toISOString()
                        ]
                    );
                    dispositivosCount++;
                }
            } catch (error) {
                console.warn(`⚠️  Erro ao migrar dispositivo:`, error.message);
            }
        }
        console.log(`✅ ${dispositivosCount} dispositivos migrados\n`);

        // Migrar Atendimentos
        console.log('📞 Migrando atendimentos...');
        const atendimentos = JSON.parse(dados.atendimentos || '[]');
        let atendimentosCount = 0;
        
        for (const atend of atendimentos) {
            try {
                await db.query(
                    `INSERT INTO atendimentos (client_id, device_id, device_info, summary, priority, status, 
                                                scheduled_date, scheduled_time, fotos_entrada, fotos_entrada_obs, 
                                                fotos_saida, fotos_saida_obs, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        atend.clientId,
                        atend.deviceId || null,
                        atend.deviceInfo || null,
                        atend.summary,
                        atend.priority || 'media',
                        atend.status,
                        atend.scheduledDate || null,
                        atend.scheduledTime || null,
                        JSON.stringify(atend.fotosEntrada || []),
                        atend.fotosEntradaObs || null,
                        JSON.stringify(atend.fotosSaida || []),
                        atend.fotosSaidaObs || null,
                        atend.createdAt || new Date().toISOString(),
                        atend.updatedAt || new Date().toISOString()
                    ]
                );
                atendimentosCount++;
            } catch (error) {
                console.warn(`⚠️  Erro ao migrar atendimento:`, error.message);
            }
        }
        console.log(`✅ ${atendimentosCount} atendimentos migrados\n`);

        // Migrar Ordens de Serviço
        console.log('📄 Migrando ordens de serviço...');
        const ordens = JSON.parse(dados.ordens || '[]');
        let ordensCount = 0;
        
        for (const ordem of ordens) {
            try {
                await db.query(
                    `INSERT INTO ordens_servico (atendimento_id, client_id, client_name, device_id, device_info, 
                                                  problem, service, summary, technician, status, qr_code, signature,
                                                  payment_amount, payment_method, fotos_entrada, fotos_entrada_obs,
                                                  fotos_saida, fotos_saida_obs, signed_at, paid_at, finalized_at,
                                                  created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        ordem.atendimentoId || null,
                        ordem.clientId,
                        ordem.clientName || null,
                        ordem.deviceId || null,
                        ordem.deviceInfo || null,
                        ordem.problem || null,
                        ordem.service || null,
                        ordem.summary,
                        ordem.technician,
                        ordem.status,
                        ordem.qrCode || null,
                        ordem.signature || null,
                        ordem.paymentAmount || null,
                        ordem.paymentMethod || null,
                        JSON.stringify(ordem.fotosEntrada || []),
                        ordem.fotosEntradaObs || null,
                        JSON.stringify(ordem.fotosSaida || []),
                        ordem.fotosSaidaObs || null,
                        ordem.signedAt || null,
                        ordem.paidAt || null,
                        ordem.finalizedAt || null,
                        ordem.createdAt || new Date().toISOString(),
                        ordem.updatedAt || new Date().toISOString()
                    ]
                );
                ordensCount++;
            } catch (error) {
                console.warn(`⚠️  Erro ao migrar ordem:`, error.message);
            }
        }
        console.log(`✅ ${ordensCount} ordens de serviço migradas\n`);

        // Migrar Usuários
        console.log('👤 Migrando usuários...');
        const bcrypt = require('bcryptjs');
        const usuarios = JSON.parse(dados.usuarios || '[]');
        let usuariosCount = 0;
        
        for (const user of usuarios) {
            try {
                // Verificar se usuário já existe
                const existing = await db.query('SELECT id FROM users WHERE email = ?', [user.email]);
                
                if (existing.length === 0) {
                    await db.query(
                        `INSERT INTO users (name, email, password, role, created_at, updated_at) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            user.name,
                            user.email,
                            user.password, // Já está hasheado no localStorage
                            user.role || 'atendente',
                            user.createdAt || new Date().toISOString(),
                            user.updatedAt || new Date().toISOString()
                        ]
                    );
                    usuariosCount++;
                }
            } catch (error) {
                console.warn(`⚠️  Erro ao migrar usuário ${user.email}:`, error.message);
            }
        }
        console.log(`✅ ${usuariosCount} usuários migrados\n`);

        console.log('\n🎉 Migração concluída com sucesso!');
        console.log(`📊 Resumo:`);
        console.log(`   - ${clientesCount} clientes`);
        console.log(`   - ${dispositivosCount} dispositivos`);
        console.log(`   - ${atendimentosCount} atendimentos`);
        console.log(`   - ${ordensCount} ordens de serviço`);
        console.log(`   - ${usuariosCount} usuários\n`);

    } catch (error) {
        console.error('❌ Erro na migração:', error);
    } finally {
        await db.close();
        process.exit(0);
    }
}

// Executar migração
migrateLocalStorageToMySQL();
