const firebaseConfig = {
    apiKey: "AIzaSyB3VrpjGKbVGQVio57r-nDtfIPTF2vdleY",
    authDomain: "controle-qr-assistenciaabla.firebaseapp.com",
    projectId: "controle-qr-assistenciaabla",
    storageBucket: "controle-qr-assistenciaabla.firebasestorage.app",
    messagingSenderId: "685774792518",
    appId: "1:685774792518:web:e8b800c8f27fd1c4766747",
    measurementId: "G-FGZYSQCT8X"
  };
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {

    const loadFinancialData = async () => {
        const financialTableBody = document.getElementById('financialTableBody');
        financialTableBody.innerHTML = '<tr><td colspan="6">Carregando dados financeiros...</td></tr>';
        
        try {
            // Consulta a coleção 'vendas', ordenando pela data mais recente
            const querySnapshot = await db.collection('vendas').orderBy('dataVenda', 'desc').get();

            if (querySnapshot.empty) {
                financialTableBody.innerHTML = '<tr><td colspan="6">Nenhum registro financeiro encontrado.</td></tr>';
                return;
            }

            financialTableBody.innerHTML = ''; // Limpa a tabela
            querySnapshot.forEach(doc => {
                const venda = doc.data();
                
                const valorFormatado = venda.valor ? venda.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
                
                // Formata a data
                const dataVenda = venda.dataVenda.toDate ? venda.dataVenda.toDate().toLocaleDateString('pt-BR') : 'Data inválida';

                // Define a classe CSS para o status
                const statusClass = `status-${(venda.statusPagamento || 'pendente').toLowerCase()}`;

                const row = `
                    <tr>
                        <td>${dataVenda}</td>
                        <td>${venda.clienteNome || 'Não informado'}</td>
                        <td>${venda.descricao || ''}</td>
                        <td>${valorFormatado}</td>
                        <td><span class="status ${statusClass}">${venda.statusPagamento || 'Pendente'}</span></td>
                        <td>${venda.vendedor || 'Não informado'}</td>
                    </tr>`;
                financialTableBody.innerHTML += row;
            });

        } catch (error) {
            console.error("Erro ao carregar dados financeiros: ", error);
            // Este erro pode indicar que a coleção 'vendas' não existe ou falta um índice.
            if(error.code === 'not-found' || error.code === 'failed-precondition') {
                 financialTableBody.innerHTML = '<tr><td colspan="6">Aguardando primeiros registros de venda para exibir dados.</td></tr>';
            } else {
                 financialTableBody.innerHTML = '<tr><td colspan="6">Erro ao carregar dados. Verifique o console.</td></tr>';
            }
        }
    };

    // --- LÓGICA DE CONTROLE DE ACESSO ---
    auth.onAuthStateChanged(user => {
        if (user) {
            if(document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email;
            
            // Define os cargos que podem ver esta página
            const allowedRoles = ['admin', 'financeiro'];

            db.collection('cargos').doc(user.uid).get().then(roleDoc => {
                // Verifica se o cargo do usuário está na lista de permitidos
                if (roleDoc.exists && allowedRoles.includes(roleDoc.data().cargo)) {
                    // SE PERMITIDO: Carrega os dados financeiros
                    loadFinancialData();
                } else {
                    // SE NÃO PERMITIDO: Mostra "Acesso Negado"
                    document.querySelector('.main-content').innerHTML = '<h1>Acesso Negado</h1><p>Você não tem permissão para acessar esta página.</p>';
                }
            });
        } else {
            window.location.href = "index.html";
        }
    });

    // TODO: Adicionar lógica para os botões de menu e logout, se necessário.
});