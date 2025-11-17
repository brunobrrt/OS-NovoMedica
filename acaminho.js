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

// --- LÓGICA DO MENU E USUÁRIO (padrão) ---
auth.onAuthStateChanged(user => {
    if (user) {
        if(document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email;
        loadItems();
    } else {
        window.location.href = "index.html";
    }
});
if(document.getElementById('logoutButton')) { document.getElementById('logoutButton').addEventListener('click', () => auth.signOut()); }
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
if (menuToggle && sidebar && overlay) {
    menuToggle.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('active'); });
    overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); });
}
// --- FIM DA LÓGICA DO MENU ---

const saveButton = document.getElementById('saveButton');
const tableBody = document.getElementById('itemsTableBody');

// Função para marcar como recebido (apagar da lista do Firebase)
function marcarComoRecebido(itemId) {
    if (confirm("Tem certeza que deseja marcar este item como recebido? Ele será removido desta lista.")) {
        db.collection("itens_a_caminho").doc(itemId).delete()
            .then(() => {
                alert("Item marcado como recebido e removido da lista.");
                loadItems();
            })
            .catch(error => {
                console.error("Erro ao remover item: ", error);
                alert("Ocorreu um erro ao dar baixa no item.");
            });
    }
}

function loadItems() {
    tableBody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
    db.collection("itens_a_caminho").orderBy("dataRegistro", "desc").get()
        .then(querySnapshot => {
            tableBody.innerHTML = "";
            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="4">Nenhum item a caminho registrado.</td></tr>';
                return;
            }
            querySnapshot.forEach(doc => {
                const item = doc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.clienteNome}</td>
                    <td>${item.itemDescricao}</td>
                    <td>${item.codigoRastreio}</td>
                    <td>
                        <button class="action-button" onclick="marcarComoRecebido('${doc.id}')">Recebido</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        });
}

saveButton.addEventListener('click', () => {
    const itemData = {
        clienteNome: document.getElementById('customerName').value.trim(),
        itemDescricao: document.getElementById('itemDescription').value.trim(),
        codigoRastreio: document.getElementById('shippingCode').value.trim(),
        observacoes: document.getElementById('notes').value.trim(),
        status: "A Caminho",
        dataRegistro: new Date(),
        registradoPor: auth.currentUser.email
    };
    if (!itemData.clienteNome || !itemData.itemDescricao) { alert("Preencha Nome do Cliente e a Descrição do Item."); return; }
    db.collection("itens_a_caminho").add(itemData)
        .then(() => {
            alert("Registro de item a caminho salvo com sucesso!");
            document.getElementById('customerName').value = '';
            document.getElementById('itemDescription').value = '';
            document.getElementById('shippingCode').value = '';
            document.getElementById('notes').value = '';
            loadItems();
        });
});
    // --- LÓGICA PARA SCROLL AUTOMÁTICO DO MENU ---
    try {
        const activeLink = document.querySelector('.sidebar nav a.active');
        if (activeLink) {
            activeLink.scrollIntoView({
                behavior: 'auto', // 'auto' para ser instantâneo
                block: 'center'   // Centraliza o link na tela
            });
        }
    } catch (e) {
        console.error("Erro no scroll automático do menu:", e);
    }