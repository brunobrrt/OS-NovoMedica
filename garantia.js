// ATENÇÃO: COLE AQUI A MESMA CONFIGURAÇÃO DO SEU FIREBASE
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

// --- LÓGICA DO MENU E USUÁRIO ---
const userEmailSpan = document.getElementById('userEmail');
const logoutButton = document.getElementById('logoutButton');
auth.onAuthStateChanged(user => {
    if (user) {
        if(userEmailSpan) userEmailSpan.textContent = user.email;
        loadWarrantyItems(); // Carrega os itens depois de confirmar o login
    } else {
        window.location.href = "index.html";
    }
});
if(logoutButton) {
    logoutButton.addEventListener('click', () => auth.signOut());
}
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
if (menuToggle && sidebar && overlay) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });
}
// --- FIM DA LÓGICA DO MENU ---


// --- LÓGICA DA PÁGINA DE GARANTIA ---
const tableBody = document.getElementById('resultsTableBody');
const searchInput = document.getElementById('searchInput');

let allItems = []; // Array para guardar os itens e facilitar a busca em tempo real

function loadWarrantyItems() {
    tableBody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
    const today = new Date().toISOString().slice(0, 10); // Formato AAAA-MM-DD

    db.collection("itens").where("dataGarantia", ">=", today).get()
        .then((querySnapshot) => {
            allItems = []; // Limpa a lista antiga
            querySnapshot.forEach((doc) => {
                allItems.push(doc.data());
            });
            renderTable(allItems); // Desenha a tabela com todos os itens
        })
        .catch((error) => {
            console.error("Erro ao buscar itens: ", error);
            tableBody.innerHTML = '<tr><td colspan="4">Erro ao carregar dados.</td></tr>';
        });
}

function renderTable(items) {
    tableBody.innerHTML = '';
    if (items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">Nenhum item encontrado na garantia.</td></tr>';
        return;
    }
    items.forEach(item => {
        const row = `
            <tr>
                <td>${item.clienteNome || ''}</td>
                <td>${item.itemDescricao || ''}</td>
                <td>${item.dataVenda || ''}</td>
                <td>${item.dataGarantia || ''}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

searchInput.addEventListener('keyup', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredItems = allItems.filter(item => 
        (item.clienteNome && item.clienteNome.toLowerCase().includes(searchTerm)) ||
        (item.itemDescricao && item.itemDescricao.toLowerCase().includes(searchTerm))
    );
    renderTable(filteredItems); // Redesenha a tabela apenas com os itens filtrados
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