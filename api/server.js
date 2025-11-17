const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-development';
const QR_SECRET = process.env.QR_SECRET || 'qr-signing-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock Database (Em produção, use MongoDB, PostgreSQL, etc.)
let clients = [
  {
    id: uuidv4(),
    name: "João Silva",
    phone: "11999999999",
    email: "joao@email.com",
    address: "Rua das Flores, 123",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let atendimentos = [
  {
    id: uuidv4(),
    clientId: clients[0].id,
    summary: "Reparo em smartphone",
    priority: "alta",
    status: "aguardando",
    createdAt: new Date().toISOString()
  }
];

let ordens = [
  {
    id: uuidv4(),
    clientId: clients[0].id,
    summary: "Troca de tela iPhone",
    technician: "Carlos Técnico",
    status: "pending",
    signatureUrl: null,
    qrCode: "OS-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Função para gerar código QR único
const generateQRCode = () => {
  return "OS-" + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Função para gerar assinatura HMAC
const generateHMAC = (payload, secret) => {
  return crypto.createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
};

// Função para verificar assinatura HMAC
const verifyHMAC = (payload, signature, secret) => {
  const expectedSignature = generateHMAC(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

// === ROTAS DE AUTENTICAÇÃO ===
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication - em produção, verificar com banco de dados
  if (email === 'admin@example.com' && password === 'admin123') {
    const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { email, role: 'admin' } });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
});

// === ROTAS DE CLIENTES ===
app.get('/api/clients', authenticateToken, (req, res) => {
  res.json({ clients, total: clients.length });
});

app.get('/api/clients/:id', authenticateToken, (req, res) => {
  const client = clients.find(c => c.id === req.params.id);
  if (!client) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }
  res.json(client);
});

app.post('/api/clients', authenticateToken, (req, res) => {
  const { name, phone, email, address } = req.body;
  
  if (!name || !phone) {
    return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
  }

  const newClient = {
    id: uuidv4(),
    name,
    phone,
    email: email || '',
    address: address || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  clients.push(newClient);
  res.status(201).json(newClient);
});

app.put('/api/clients/:id', authenticateToken, (req, res) => {
  const clientIndex = clients.findIndex(c => c.id === req.params.id);
  if (clientIndex === -1) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }

  const { name, phone, email, address } = req.body;
  clients[clientIndex] = {
    ...clients[clientIndex],
    name: name || clients[clientIndex].name,
    phone: phone || clients[clientIndex].phone,
    email: email || clients[clientIndex].email,
    address: address || clients[clientIndex].address,
    updatedAt: new Date().toISOString()
  };

  res.json(clients[clientIndex]);
});

// === ROTAS DE ATENDIMENTOS ===
app.get('/api/atendimentos', authenticateToken, (req, res) => {
  const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  
  let filteredAtendimentos = atendimentos;
  if (status) {
    filteredAtendimentos = atendimentos.filter(a => a.status === status);
  }

  // Ordenação
  filteredAtendimentos.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'priority') {
      const priorities = { 'baixa': 1, 'média': 2, 'alta': 3 };
      aValue = priorities[aValue] || 0;
      bValue = priorities[bValue] || 0;
    }
    
    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : -1;
    } else {
      return aValue > bValue ? 1 : -1;
    }
  });

  // Paginação
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedResults = filteredAtendimentos.slice(startIndex, endIndex);

  // Incluir dados do cliente
  const resultsWithClient = paginatedResults.map(atendimento => {
    const client = clients.find(c => c.id === atendimento.clientId);
    return { ...atendimento, client };
  });

  res.json({
    atendimentos: resultsWithClient,
    total: filteredAtendimentos.length,
    page: parseInt(page),
    totalPages: Math.ceil(filteredAtendimentos.length / limit)
  });
});

app.post('/api/atendimentos', authenticateToken, (req, res) => {
  const { clientId, summary, priority = 'média', status = 'aguardando' } = req.body;
  
  if (!clientId || !summary) {
    return res.status(400).json({ error: 'ClienteId e sumário são obrigatórios' });
  }

  const client = clients.find(c => c.id === clientId);
  if (!client) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }

  const newAtendimento = {
    id: uuidv4(),
    clientId,
    summary,
    priority,
    status,
    createdAt: new Date().toISOString()
  };

  atendimentos.push(newAtendimento);
  res.status(201).json({ ...newAtendimento, client });
});

app.put('/api/atendimentos/:id', authenticateToken, (req, res) => {
  const atendimentoIndex = atendimentos.findIndex(a => a.id === req.params.id);
  if (atendimentoIndex === -1) {
    return res.status(404).json({ error: 'Atendimento não encontrado' });
  }

  const { summary, priority, status } = req.body;
  atendimentos[atendimentoIndex] = {
    ...atendimentos[atendimentoIndex],
    summary: summary || atendimentos[atendimentoIndex].summary,
    priority: priority || atendimentos[atendimentoIndex].priority,
    status: status || atendimentos[atendimentoIndex].status
  };

  const client = clients.find(c => c.id === atendimentos[atendimentoIndex].clientId);
  res.json({ ...atendimentos[atendimentoIndex], client });
});

app.delete('/api/atendimentos/:id', authenticateToken, (req, res) => {
  const atendimentoIndex = atendimentos.findIndex(a => a.id === req.params.id);
  if (atendimentoIndex === -1) {
    return res.status(404).json({ error: 'Atendimento não encontrado' });
  }

  atendimentos.splice(atendimentoIndex, 1);
  res.status(204).send();
});

// === ROTAS DE ORDENS DE SERVIÇO ===
app.get('/api/os', authenticateToken, (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  let filteredOrdens = ordens;
  if (status) {
    filteredOrdens = ordens.filter(o => o.status === status);
  }

  // Paginação
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedResults = filteredOrdens.slice(startIndex, endIndex);

  // Incluir dados do cliente
  const resultsWithClient = paginatedResults.map(ordem => {
    const client = clients.find(c => c.id === ordem.clientId);
    return { ...ordem, client };
  });

  res.json({
    ordens: resultsWithClient,
    total: filteredOrdens.length,
    page: parseInt(page),
    totalPages: Math.ceil(filteredOrdens.length / limit)
  });
});

app.post('/api/os', authenticateToken, (req, res) => {
  const { clientId, summary, technician } = req.body;
  
  if (!clientId || !summary) {
    return res.status(400).json({ error: 'ClienteId e sumário são obrigatórios' });
  }

  const client = clients.find(c => c.id === clientId);
  if (!client) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }

  const newOrdem = {
    id: uuidv4(),
    clientId,
    summary,
    technician: technician || 'Não atribuído',
    status: 'pending',
    signatureUrl: null,
    qrCode: generateQRCode(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  ordens.push(newOrdem);
  res.status(201).json({ ...newOrdem, client });
});

app.put('/api/os/:id', authenticateToken, (req, res) => {
  const ordemIndex = ordens.findIndex(o => o.id === req.params.id);
  if (ordemIndex === -1) {
    return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
  }

  const { summary, technician, status } = req.body;
  ordens[ordemIndex] = {
    ...ordens[ordemIndex],
    summary: summary || ordens[ordemIndex].summary,
    technician: technician || ordens[ordemIndex].technician,
    status: status || ordens[ordemIndex].status,
    updatedAt: new Date().toISOString()
  };

  const client = clients.find(c => c.id === ordens[ordemIndex].clientId);
  res.json({ ...ordens[ordemIndex], client });
});

app.patch('/api/os/:id/sign', authenticateToken, (req, res) => {
  const ordemIndex = ordens.findIndex(o => o.id === req.params.id);
  if (ordemIndex === -1) {
    return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
  }

  const { signatureUrl } = req.body;
  ordens[ordemIndex] = {
    ...ordens[ordemIndex],
    status: 'signed',
    signatureUrl: signatureUrl || `signature_${Date.now()}.png`,
    updatedAt: new Date().toISOString()
  };

  const client = clients.find(c => c.id === ordens[ordemIndex].clientId);
  res.json({ ...ordens[ordemIndex], client });
});

app.patch('/api/os/:id/payment', authenticateToken, (req, res) => {
  const ordemIndex = ordens.findIndex(o => o.id === req.params.id);
  if (ordemIndex === -1) {
    return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
  }

  if (ordens[ordemIndex].status !== 'signed') {
    return res.status(400).json({ error: 'Ordem deve estar assinada para processar pagamento' });
  }

  const { paymentMethod, paymentAmount, paymentNotes } = req.body;
  ordens[ordemIndex] = {
    ...ordens[ordemIndex],
    status: 'awaiting_payment',
    paymentMethod: paymentMethod || 'Não informado',
    paymentAmount: paymentAmount || 0,
    paymentNotes: paymentNotes || '',
    paymentDate: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const client = clients.find(c => c.id === ordens[ordemIndex].clientId);
  res.json({ ...ordens[ordemIndex], client });
});

app.patch('/api/os/:id/confirm-payment', authenticateToken, (req, res) => {
  const ordemIndex = ordens.findIndex(o => o.id === req.params.id);
  if (ordemIndex === -1) {
    return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
  }

  if (ordens[ordemIndex].status !== 'awaiting_payment') {
    return res.status(400).json({ error: 'Ordem deve estar aguardando pagamento' });
  }

  ordens[ordemIndex] = {
    ...ordens[ordemIndex],
    status: 'paid',
    paymentConfirmedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const client = clients.find(c => c.id === ordens[ordemIndex].clientId);
  res.json({ ...ordens[ordemIndex], client });
});

app.patch('/api/os/:id/finalize', authenticateToken, (req, res) => {
  const ordemIndex = ordens.findIndex(o => o.id === req.params.id);
  if (ordemIndex === -1) {
    return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
  }

  if (ordens[ordemIndex].status !== 'paid') {
    return res.status(400).json({ error: 'Ordem deve estar paga para ser finalizada' });
  }

  ordens[ordemIndex] = {
    ...ordens[ordemIndex],
    status: 'finalized',
    updatedAt: new Date().toISOString()
  };

  const client = clients.find(c => c.id === ordens[ordemIndex].clientId);
  res.json({ ...ordens[ordemIndex], client });
});

// === ROTAS DE QR CODE ===
app.post('/api/qr/generate', authenticateToken, (req, res) => {
  const { clientId, action, regCode } = req.body;
  
  if (!clientId || !['edit', 'register'].includes(action)) {
    return res.status(400).json({ error: 'ClientId e action (edit|register) são obrigatórios' });
  }

  // Criar payload com timestamp de expiração (1 hora)
  const payload = {
    clientId,
    action,
    regCode: regCode || generateQRCode(), // Código de texto para busca facilitada
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hora
    iat: Math.floor(Date.now() / 1000)
  };

  // Gerar assinatura HMAC
  const signature = generateHMAC(payload, QR_SECRET);
  
  // Criar token base64
  const tokenData = {
    payload,
    signature
  };
  const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

  res.json({
    token,
    qrData: token,
    regCode: payload.regCode,
    expiresAt: new Date(payload.exp * 1000).toISOString()
  });
});

app.post('/api/qr/validate', authenticateToken, (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token é obrigatório' });
  }

  try {
    // Decodificar token base64
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    const { payload, signature } = tokenData;

    // Verificar assinatura
    if (!verifyHMAC(payload, signature, QR_SECRET)) {
      return res.status(401).json({ error: 'Token inválido - assinatura não confere' });
    }

    // Verificar expiração
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return res.status(401).json({ error: 'Token expirado' });
    }

    // Buscar cliente
    const client = clients.find(c => c.id === payload.clientId);
    if (!client && payload.action === 'edit') {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json({
      valid: true,
      payload,
      client: payload.action === 'edit' ? client : null
    });

  } catch (error) {
    res.status(400).json({ error: 'Token malformado' });
  }
});

// Rota para estatísticas do dashboard
app.get('/api/stats', authenticateToken, (req, res) => {
  const stats = {
    atendimentos: {
      aguardando: atendimentos.filter(a => a.status === 'aguardando').length,
      em_atendimento: atendimentos.filter(a => a.status === 'em_atendimento').length,
      total: atendimentos.length
    },
    ordens: {
      pending: ordens.filter(o => o.status === 'pending').length,
      signed: ordens.filter(o => o.status === 'signed').length,
      awaiting_payment: ordens.filter(o => o.status === 'awaiting_payment').length,
      paid: ordens.filter(o => o.status === 'paid').length,
      finalized: ordens.filter(o => o.status === 'finalized').length,
      total: ordens.length
    },
    clients: {
      total: clients.length
    }
  };

  res.json(stats);
});

// Rota raiz - Informações da API
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API do Sistema OS com QR Code',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      auth: 'POST /api/auth/login',
      clients: 'GET /api/clients',
      atendimentos: 'GET /api/atendimentos',
      os: 'GET /api/os',
      qr: 'POST /api/qr/generate',
      stats: 'GET /api/stats'
    },
    docs: 'Consulte README.md para documentação completa',
    credentials: {
      email: 'admin@example.com',
      password: 'admin123'
    }
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 QR Code Secret: ${QR_SECRET.substring(0, 10)}...`);
});

module.exports = app;