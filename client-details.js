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
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            if(document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email;
            loadClientDetails();
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

    // --- LÓGICA DA PÁGINA DE DETALHES ---
    const clientNameHeader = document.getElementById('clientNameHeader');
    const itemsTableBody = document.getElementById('itemsTableBody');

    function loadClientDetails() {
        const params = new URLSearchParams(window.location.search);
        const clientName = decodeURIComponent(params.get('name'));

        if (!clientName) {
            clientNameHeader.textContent = "Cliente não encontrado";
            return;
        }

        clientNameHeader.textContent = clientName;
        itemsTableBody.innerHTML = '<tr><td colspan="4">Carregando itens...</td></tr>';

        db.collection("itens").where("clienteNome", "==", clientName).get()
          .then(querySnapshot => {
              itemsTableBody.innerHTML = "";
              if (querySnapshot.empty) {
                  itemsTableBody.innerHTML = '<tr><td colspan="4">Nenhum item encontrado para este cliente.</td></tr>';
                  return;
              }
              querySnapshot.forEach(doc => {
                  const item = doc.data();
                  
                  // LÓGICA NOVA: Contar o número de reparos
                  const repairCount = item.historicoReparos ? item.historicoReparos.length : 0;
                  
                  const row = document.createElement('tr');
                  row.style.cursor = 'pointer';
                  row.onclick = () => {
                      window.location.href = `view.html?id=${doc.id}`;
                  };
                  row.innerHTML = `
                      <td>${item.itemDescricao || ''}</td>
                      <td>${item.itemSerial || ''}</td>
                      <td>${item.statusGeral || ''}</td>
                      <td>${repairCount}</td>
                  `;
                  itemsTableBody.appendChild(row);
              });
          })
          .catch(error => {
              console.error("Erro ao buscar itens do cliente: ", error);
              itemsTableBody.innerHTML = '<tr><td colspan="4">Erro ao carregar dados.</td></tr>';
          });
    }
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