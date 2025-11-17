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
auth.onAuthStateChanged(user => { if (user) { if(document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email; loadClients(); } else { window.location.href = "index.html"; } });
if(document.getElementById('logoutButton')) { document.getElementById('logoutButton').addEventListener('click', () => auth.signOut()); }
const menuToggle = document.getElementById('menu-toggle'); const sidebar = document.getElementById('sidebar'); const overlay = document.getElementById('overlay');
if (menuToggle && sidebar && overlay) { menuToggle.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('active'); }); overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); }); }

// --- LÓGICA DA PÁGINA DE CLIENTES ---
const tableBody = document.getElementById('resultsTableBody'); const searchInput = document.getElementById('searchInput');
let allClients = [];
function navigateToClient(clientName) { window.location.href = `client-details.html?name=${clientName}`; }
function loadClients() {
    tableBody.innerHTML = '<tr><td colspan="3">Carregando clientes...</td></tr>';
    db.collection("itens").get().then((querySnapshot) => {
          const clientsMap = new Map();
          querySnapshot.forEach((doc) => {
              const item = doc.data();
              const clientName = item.clienteNome ? item.clienteNome.trim() : '';
              if (clientName) {
                  if (clientsMap.has(clientName)) { clientsMap.get(clientName).itemCount++; } 
                  else { clientsMap.set(clientName, { name: clientName, contact: item.clienteContato || 'Não informado', itemCount: 1 }); }
              }
          });
          allClients = Array.from(clientsMap.values());
          renderTable(allClients);
      }).catch((error) => { tableBody.innerHTML = '<tr><td colspan="3">Erro ao carregar dados.</td></tr>'; });
}
function renderTable(clients) {
    tableBody.innerHTML = '';
    if (clients.length === 0) { tableBody.innerHTML = '<tr><td colspan="3">Nenhum cliente encontrado.</td></tr>'; return; }
    clients.forEach(client => {
        const rowHTML = `<tr onclick="navigateToClient('${encodeURIComponent(client.name)}')"><td>${client.name}</td><td>${client.contact}</td><td>${client.itemCount}</td></tr>`;
        tableBody.innerHTML += rowHTML;
    });
}
searchInput.addEventListener('keyup', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredClients = allClients.filter(client => (client.name && client.name.toLowerCase().includes(searchTerm)) || (client.contact && client.contact.toLowerCase().includes(searchTerm)));
    renderTable(filteredClients);
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