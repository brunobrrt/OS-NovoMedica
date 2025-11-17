#!/bin/bash

# Script de setup do Sistema OS com QR Code
# Execute com: bash setup.sh

echo "🚀 Configurando Sistema de Ordem de Serviço com QR Code..."
echo

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js primeiro:"
    echo "   https://nodejs.org/"
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale npm primeiro."
    exit 1
fi

echo "✅ Node.js $(node --version) encontrado"
echo "✅ npm $(npm --version) encontrado"
echo

# Criar diretório de logs se não existir
mkdir -p api/logs

# Entrar no diretório da API
cd api

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Copiar arquivo de ambiente se não existir
if [ ! -f .env ]; then
    echo "⚙️ Criando arquivo de configuração..."
    cp .env.example .env
    echo "✅ Arquivo .env criado. Edite-o com suas configurações específicas."
else
    echo "✅ Arquivo .env já existe."
fi

echo
echo "🔧 Configuração concluída!"
echo
echo "Para iniciar o sistema:"
echo "1. API: cd api && npm run dev"
echo "2. Frontend: Abra os-dashboard.html em um navegador"
echo "3. Demo: Abra demo-qr.html para demonstração interativa"
echo
echo "📝 Credenciais padrão:"
echo "   Email: admin@example.com"
echo "   Senha: admin123"
echo
echo "🔗 Endpoints importantes:"
echo "   API: http://localhost:3000/api"
echo "   Docs: Consulte README.md"
echo
echo "🧪 Para executar testes:"
echo "   cd api && npm test"
echo