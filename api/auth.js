const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-aqui-mude-em-producao';
const JWT_EXPIRES_IN = '7d';

class AuthService {
    // Registrar novo usuário
    async register(name, email, password, role = 'atendente') {
        try {
            // Verificar se email já existe
            const existing = await db.query(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existing.length > 0) {
                throw new Error('E-mail já cadastrado');
            }

            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, 10);

            // Inserir usuário
            const result = await db.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [name, email, hashedPassword, role]
            );

            return {
                id: result.insertId,
                name,
                email,
                role
            };
        } catch (error) {
            console.error('Erro no registro:', error);
            throw error;
        }
    }

    // Login
    async login(email, password) {
        try {
            // Buscar usuário
            const users = await db.query(
                'SELECT * FROM users WHERE email = ? AND active = TRUE',
                [email]
            );

            if (users.length === 0) {
                throw new Error('Credenciais inválidas');
            }

            const user = users[0];

            // Verificar senha
            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                throw new Error('Credenciais inválidas');
            }

            // Atualizar último login
            await db.query(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [user.id]
            );

            // Gerar token JWT
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            // Remover senha do retorno
            const { password: _, ...userWithoutPassword } = user;

            return {
                success: true,
                user: userWithoutPassword,
                token
            };
        } catch (error) {
            console.error('Erro no login:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Verificar token
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return decoded;
        } catch (error) {
            throw new Error('Token inválido');
        }
    }

    // Middleware de autenticação
    authMiddleware(req, res, next) {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        try {
            const decoded = this.verifyToken(token);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ error: 'Token inválido' });
        }
    }

    // Middleware de verificação de role
    roleMiddleware(...allowedRoles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ error: 'Não autenticado' });
            }

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            next();
        };
    }

    // Listar usuários (apenas admin)
    async listUsers() {
        try {
            const users = await db.query(
                'SELECT id, name, email, role, created_at, last_login, active FROM users ORDER BY created_at DESC'
            );
            return users;
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            throw error;
        }
    }

    // Atualizar usuário
    async updateUser(userId, data) {
        try {
            const { name, email, password, role, active } = data;
            let query = 'UPDATE users SET name = ?, email = ?, role = ?, active = ?';
            let params = [name, email, role, active !== undefined ? active : true];

            // Se senha fornecida, atualizar também
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                query += ', password = ?';
                params.push(hashedPassword);
            }

            query += ' WHERE id = ?';
            params.push(userId);

            await db.query(query, params);

            return { success: true, message: 'Usuário atualizado' };
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            throw error;
        }
    }

    // Deletar usuário
    async deleteUser(userId) {
        try {
            await db.query('DELETE FROM users WHERE id = ?', [userId]);
            return { success: true, message: 'Usuário excluído' };
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            throw error;
        }
    }

    // Criar admin padrão (executar apenas uma vez)
    async createDefaultAdmin() {
        try {
            const existing = await db.query(
                'SELECT id FROM users WHERE email = ?',
                ['admin@novomedica.com']
            );

            if (existing.length === 0) {
                await this.register(
                    'Administrador',
                    'admin@novomedica.com',
                    'admin123',
                    'admin'
                );
                console.log('✅ Admin padrão criado: admin@novomedica.com / admin123');
            }
        } catch (error) {
            console.error('Erro ao criar admin padrão:', error);
        }
    }
}

module.exports = new AuthService();
