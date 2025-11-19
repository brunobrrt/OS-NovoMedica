// Configuração do banco de dados MySQL (Hostgator)
const mysql = require('mysql2/promise');

class Database {
    constructor() {
        this.pool = null;
        this.config = {
            // Configurações para produção no Hostgator
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'novomedica_user',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'novomedica_os',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };
    }

    async init() {
        try {
            this.pool = mysql.createPool(this.config);
            console.log('✅ Conexão com MySQL estabelecida');
            await this.createTables();
        } catch (error) {
            console.error('❌ Erro ao conectar com MySQL:', error);
            throw error;
        }
    }

    async createTables() {
        const connection = await this.pool.getConnection();
        
        try {
            // Tabela de usuários
            await connection.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role ENUM('admin', 'tecnico', 'atendente') NOT NULL DEFAULT 'atendente',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    last_login TIMESTAMP NULL,
                    active BOOLEAN DEFAULT TRUE,
                    INDEX idx_email (email),
                    INDEX idx_role (role)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            // Tabela de clientes
            await connection.query(`
                CREATE TABLE IF NOT EXISTS clients (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    phone VARCHAR(20),
                    cpf_cnpj VARCHAR(20),
                    email VARCHAR(255),
                    address TEXT,
                    qr_code VARCHAR(50) UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_qr_code (qr_code),
                    INDEX idx_phone (phone)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            // Tabela de dispositivos
            await connection.query(`
                CREATE TABLE IF NOT EXISTS devices (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    owner_id INT NOT NULL,
                    brand VARCHAR(100),
                    model VARCHAR(100),
                    imei VARCHAR(50),
                    serial_number VARCHAR(100),
                    qr_code VARCHAR(50) UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (owner_id) REFERENCES clients(id) ON DELETE CASCADE,
                    INDEX idx_owner (owner_id),
                    INDEX idx_qr_code (qr_code)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            // Tabela de atendimentos
            await connection.query(`
                CREATE TABLE IF NOT EXISTS atendimentos (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    client_id INT NOT NULL,
                    device_id INT,
                    device_info VARCHAR(255),
                    summary TEXT,
                    priority ENUM('baixa', 'media', 'alta', 'urgente') DEFAULT 'media',
                    status VARCHAR(50) NOT NULL,
                    scheduled_date DATE,
                    scheduled_time TIME,
                    fotos_entrada JSON,
                    fotos_entrada_obs TEXT,
                    fotos_saida JSON,
                    fotos_saida_obs TEXT,
                    os_id INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
                    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL,
                    INDEX idx_status (status),
                    INDEX idx_client (client_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            // Tabela de ordens de serviço
            await connection.query(`
                CREATE TABLE IF NOT EXISTS ordens_servico (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    atendimento_id INT,
                    client_id INT NOT NULL,
                    client_name VARCHAR(255),
                    device_id INT,
                    device_info VARCHAR(255),
                    problem TEXT,
                    service TEXT,
                    summary TEXT,
                    technician VARCHAR(255),
                    status VARCHAR(50) NOT NULL,
                    qr_code VARCHAR(50),
                    signature LONGTEXT,
                    payment_amount DECIMAL(10,2),
                    payment_method VARCHAR(50),
                    fotos_entrada JSON,
                    fotos_entrada_obs TEXT,
                    fotos_saida JSON,
                    fotos_saida_obs TEXT,
                    signed_at TIMESTAMP NULL,
                    paid_at TIMESTAMP NULL,
                    finalized_at TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
                    FOREIGN KEY (atendimento_id) REFERENCES atendimentos(id) ON DELETE SET NULL,
                    INDEX idx_status (status),
                    INDEX idx_client (client_id),
                    INDEX idx_qr_code (qr_code)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            // Tabela de histórico de status
            await connection.query(`
                CREATE TABLE IF NOT EXISTS status_history (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    ordem_id INT NOT NULL,
                    from_status VARCHAR(50),
                    to_status VARCHAR(50) NOT NULL,
                    changed_by VARCHAR(255),
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (ordem_id) REFERENCES ordens_servico(id) ON DELETE CASCADE,
                    INDEX idx_ordem (ordem_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            console.log('✅ Tabelas criadas/verificadas com sucesso');
        } catch (error) {
            console.error('❌ Erro ao criar tabelas:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    async query(sql, params) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Erro na query:', error);
            throw error;
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('Conexão com MySQL encerrada');
        }
    }
}

module.exports = new Database();
