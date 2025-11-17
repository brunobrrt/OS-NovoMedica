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
auth.onAuthStateChanged(user => {
    if (user) {
        if(document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email;
        loadActiveServices();
    } else {
        window.location.href = "index.html";
    }
});
if(document.getElementById('logoutButton')) {
    document.getElementById('logoutButton').addEventListener('click', () => auth.signOut());
}
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
if (menuToggle && sidebar && overlay) {
    menuToggle.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('active'); });
    overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); });
}
// --- FIM DA LÓGICA DO MENU ---

// --- LÓGICA DA PÁGINA DE ATENDIMENTOS ---
const tableBody = document.getElementById('resultsTableBody');
const searchInput = document.getElementById('searchInput');

let allServices = []; // Array para guardar os atendimentos e facilitar a busca

function loadActiveServices() {
    tableBody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
    
    const params = new URLSearchParams(window.location.search);
    const statusFilter = params.get('status');

    let query = db.collection("itens");

    if (statusFilter) {
        document.querySelector('header h1').textContent = `Atendimentos: ${statusFilter}`;
        query = query.where("statusGeral", "==", statusFilter);
    } else {
        query = query.where("statusGeral", "not-in", ["Vendido", "Finalizado e Entregue"]);
    }

    query.get()
      .then((querySnapshot) => {
          allServices = [];
          querySnapshot.forEach((doc) => {
              const item = doc.data();
              const lastHistory = item.historicoReparos && item.historicoReparos.length > 0
                  ? item.historicoReparos[item.historicoReparos.length - 1]
                  : null;

              allServices.push({
                  id: doc.id,
                  clienteNome: item.clienteNome,
                  itemDescricao: item.itemDescricao,
                  osNumber: lastHistory ? lastHistory.os : 'N/A',
                  statusGeral: item.statusGeral,
                  dataEntrada: lastHistory ? lastHistory.data.toDate().toLocaleDateString('pt-BR') : 'N/A'
              });
          });
          renderTable(allServices);
      })
      .catch((error) => {
          console.error("Erro ao buscar atendimentos: ", error);
          tableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar dados.</td></tr>';
      });
}

function renderTable(services) {
    tableBody.innerHTML = '';
    if (services.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">Nenhum atendimento encontrado para este filtro.</td></tr>';
        return;
    }
    services.forEach(service => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.onclick = () => {
            window.location.href = `view.html?id=${service.id}`;
        };
        row.innerHTML = `
            <td>${service.clienteNome || ''}</td>
            <td>${service.itemDescricao || ''}</td>
            <td>${service.osNumber || ''}</td>
            <td>${service.statusGeral || ''}</td>
            <td>${service.dataEntrada || ''}</td>
        `;
        tableBody.appendChild(row);
    });
}

searchInput.addEventListener('keyup', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredServices = allServices.filter(service =>
        (service.clienteNome && service.clienteNome.toLowerCase().includes(searchTerm)) ||
        (service.itemDescricao && service.itemDescricao.toLowerCase().includes(searchTerm)) ||
        (service.osNumber && service.osNumber.toLowerCase().includes(searchTerm)) ||
        (service.statusGeral && service.statusGeral.toLowerCase().includes(searchTerm))
    );
    renderTable(filteredServices);
});    // --- LÓGICA PARA SCROLL AUTOMÁTICO DO MENU ---
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