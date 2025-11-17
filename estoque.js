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

const produtosList = [
    "Ultrassom Apogee 1000 lite", "Ultrassom Apogee AX2", "Ultrassom Apogee 1000 Pro",
    "Emissor 1600", "Emissor 1600B", "Emissor 2800", "Placa Optimum 1212", "Placa Prudent 1212",
    "Placa Optimum 1417", "Placa Prudent 1417", "Placa Optimum 1717", "Placa Prudent 1717",
    "Placa Mamografia", "Otoscópio", "Dermatoscópio", "Endoscópio HD Pro", "Nebulizador", "Arco Cirúrgico",
    "Probe Linear (Apogee)", "Probe Convexa (Apogee)", "Probe Retal (Apogee)", "Probe Microconvexa (Apogee)", "Probe Setorial Adulto (Apogee)", "Probe Setorial Infantil (Apogee)",
    "Probe Linear (AX2)", "Probe Convexa (AX2)", "Probe Retal (AX2)", "Probe Microconvexa (AX2)", "Probe Setorial Adulto (AX2)", "Probe Setorial Infantil (AX2)",
    "Case 1212", "Case 1417", "Case 1717", "Avental Plumbífero", "Protetor de Tireóide",
    "Capa 1212", "Capa 1417", "Capa 1717", "Silver", "Bateria Optimum/Prudent", "Bateria Pixx"
];

let stockGroups = new Map();

function registrarVenda(stockId, itemName) {
    if (confirm(`Confirmar a venda do item:\n${itemName}\n\nEsta ação irá movê-lo para a tela de registro de venda.`)) {
        db.collection("estoque").doc(stockId).get().then(doc => {
            if (doc.exists) {
                const item = doc.data();
                const desc = `${item.itemName} (S/N: ${item.serialNumber || 'N/A'})`;
                const url = `registrar.html?from=estoque&stockId=${stockId}&desc=${encodeURIComponent(desc)}&serial=${encodeURIComponent(item.serialNumber || '')}`;
                window.location.href = url;
            }
        });
    }
}

function deletarItemEstoque(stockId, itemName) {
    if (confirm(`TEM CERTEZA que deseja deletar permanentemente o item:\n${itemName}\n\nEsta ação não pode ser desfeita.`)) {
        db.collection("estoque").doc(stockId).delete().then(() => {
            alert("Item removido do estoque com sucesso.");
            document.getElementById('action-modal').style.display = 'none';
            loadStockItems(); 
        }).catch(error => console.error("Erro ao deletar item: ", error));
    }
}

// ==========================================================
// A MUDANÇA PRINCIPAL ESTÁ NA FUNÇÃO loadStockItems ABAIXO
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {

    const loadStockItems = async () => {
        const stockTableBody = document.getElementById('stockTableBody');
        stockTableBody.innerHTML = '<tr><td colspan="5">Carregando estoque...</td></tr>';
        
        try {
            // ***** ALTERAÇÃO AQUI: Removemos o .orderBy("itemName") *****
            // Isso simplifica a consulta e elimina a necessidade do índice.
            const querySnapshot = await db.collection("estoque").where("status", "==", "Em Estoque").get();
            
            stockGroups.clear();

            if (querySnapshot.empty) {
                stockTableBody.innerHTML = '<tr><td colspan="5">Nenhum item em estoque.</td></tr>';
                return;
            }
            
            querySnapshot.forEach(doc => {
                const item = { id: doc.id, ...doc.data() };
                const key = `${item.itemName}-${item.empresa}-${item.condicao}`;

                if (!stockGroups.has(key)) {
                    stockGroups.set(key, {
                        name: item.itemName,
                        empresa: item.empresa,
                        condicao: item.condicao,
                        items: []
                    });
                }
                stockGroups.get(key).items.push(item);
            });

            stockTableBody.innerHTML = "";
            
            // ***** MELHORIA: Ordenamos os dados aqui no navegador *****
            const sortedGroups = Array.from(stockGroups.values()).sort((a, b) => a.name.localeCompare(b.name));

            // Usamos o array ordenado para criar as linhas da tabela
            sortedGroups.forEach(group => {
                const key = `${group.name}-${group.empresa}-${group.condicao}`;
                const row = `
                    <tr>
                        <td>${group.name}</td>
                        <td>${group.empresa}</td>
                        <td>${group.condicao}</td>
                        <td><strong>${group.items.length}</strong></td>
                        <td class="actions-cell">
                            <button class="btn-vender" onclick="openActionModal('${key}')">Vender / Gerenciar</button>
                        </td>
                    </tr>`;
                stockTableBody.innerHTML += row;
            });

        } catch (error) {
            console.error("Erro ao carregar itens do estoque: ", error);
            stockTableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar o estoque. Verifique o console.</td></tr>';
        }
    };

    auth.onAuthStateChanged(user => {
        if (user) {
            if(document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email;
            
            db.collection('cargos').doc(user.uid).get().then(roleDoc => {
                if (roleDoc.exists && roleDoc.data().cargo === 'admin') {
                    document.querySelector('.container-estoque').style.display = 'flex';
                    loadStockItems(); 
                } else {
                    document.querySelector('.main-content').innerHTML = '<h1>Acesso Negado</h1><p>Você não tem permissão para acessar esta página.</p>';
                }
            }).catch(error => {
                console.error("Erro ao verificar cargo do usuário:", error);
                document.querySelector('.main-content').innerHTML = '<h1>Erro</h1><p>Ocorreu um erro ao verificar suas permissões.</p>';
            });

        } else {
            window.location.href = "index.html";
        }
    });

    const produtosContainer = document.getElementById('aparelhos-list');
    produtosList.forEach(item => {
        const id = `prod_${item.replace(/[\s()/]+/g, '_')}`;
        produtosContainer.innerHTML += `<div><input type="radio" id="${id}" name="produto" value="${item}"><label for="${id}">${item}</label></div>`;
    });

    const quantityInput = document.getElementById('quantity');
    const serialsContainer = document.getElementById('serial-numbers-container');

    quantityInput.addEventListener('input', () => {
        const count = parseInt(quantityInput.value, 10) || 0;
        serialsContainer.innerHTML = '';
        if (count > 0) {
            let serialsHTML = '<p><strong>Insira os Números de Série (deixe em branco se não aplicável):</strong></p>';
            for (let i = 1; i <= count; i++) {
                serialsHTML += `
                    <div class="serial-input-group">
                        <label for="serial_${i}">Unidade ${i}:</label>
                        <input type="text" id="serial_${i}" class="serial-number-input" placeholder="Nº de Série da unidade ${i}">
                    </div>`;
            }
            serialsContainer.innerHTML = serialsHTML;
        }
    });
    quantityInput.dispatchEvent(new Event('input'));

    document.getElementById('saveStockButton').addEventListener('click', async () => {
        const empresa = document.querySelector('input[name="empresa"]:checked');
        const condicao = document.querySelector('input[name="condicao"]:checked');
        const produto = document.querySelector('input[name="produto"]:checked');
        const arrivalDate = document.getElementById('arrivalDate').value;
        const notes = document.getElementById('notes').value;
        const quantity = parseInt(quantityInput.value, 10);
        const serialInputs = document.querySelectorAll('.serial-number-input');

        if (!empresa || !condicao || !produto || !arrivalDate) {
            alert("Preencha todos os campos obrigatórios: Empresa, Condição, Produto e Data de Chegada.");
            return;
        }

        const batch = db.batch();
        for (let i = 0; i < quantity; i++) {
            const docRef = db.collection("estoque").doc();
            const serialNumber = serialInputs[i] ? serialInputs[i].value.trim() : '';
            
            const stockData = {
                empresa: empresa.value,
                condicao: condicao.value,
                itemName: produto.value,
                serialNumber: serialNumber,
                arrivalDate: arrivalDate,
                notes: notes,
                status: "Em Estoque",
                criadoEm: new Date()
            };
            batch.set(docRef, stockData);
        }

        try {
            await batch.commit();
            alert(`${quantity} unidade(s) de '${produto.value}' adicionada(s) ao estoque com sucesso!`);
            document.getElementById('stockForm').reset();
            quantityInput.dispatchEvent(new Event('input'));
            loadStockItems();
        } catch (error) {
            console.error("Erro ao salvar lote no estoque: ", error);
            alert("Ocorreu um erro ao salvar os itens.");
        }
    });

    const actionModal = document.getElementById('action-modal');
    document.getElementById('close-action-modal-button').addEventListener('click', () => {
        actionModal.style.display = 'none';
    });

    window.openActionModal = function(groupKey) {
        const group = stockGroups.get(groupKey);
        if (!group) return;

        document.getElementById('action-modal-title').textContent = `Gerenciar: ${group.name}`;
        const itemListBody = document.getElementById('modal-item-list');
        itemListBody.innerHTML = '';

        group.items.sort((a, b) => new Date(a.arrivalDate) - new Date(b.arrivalDate));

        group.items.forEach(item => {
            const formattedDate = new Date(item.arrivalDate + 'T00:00:00').toLocaleDateString('pt-BR');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.serialNumber || '<em>N/A</em>'}</td>
                <td>${formattedDate}</td>
                <td>${item.notes || ''}</td>
                <td class="actions-cell">
                    <button class="btn-vender" onclick="registrarVenda('${item.id}', '${group.name} (S/N: ${item.serialNumber || 'N/A'})')">Vender</button>
                    <button class="btn-deletar" onclick="deletarItemEstoque('${item.id}', '${group.name} (S/N: ${item.serialNumber || 'N/A'})')">Deletar</button>
                </td>
            `;
            itemListBody.appendChild(row);
        });

        actionModal.style.display = 'flex';
    };

});