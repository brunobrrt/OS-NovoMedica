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
    // --- ELEMENTOS DO DOM ---
    const elements = {
        userEmail: document.getElementById('userEmail'),
        logoutButton: document.getElementById('logoutButton'),
        menuToggle: document.getElementById('menu-toggle'),
        sidebar: document.getElementById('sidebar'),
        overlay: document.getElementById('overlay'),
        tableBody: document.getElementById('resultsTableBody'),
        searchInput: document.getElementById('searchInput')
    };

    let allHistoryForDisplay = []; 
    let unsubscribe; 

    // --- FUNÇÕES PRINCIPAIS ---

    function setupRealtimeListener() {
        if (unsubscribe) {
            unsubscribe();
        }

        elements.tableBody.innerHTML = '<tr><td colspan="5">Carregando histórico...</td></tr>';
        
        unsubscribe = db.collection("itens").where("historicoReparos", "!=", [])
            .onSnapshot((querySnapshot) => {
                console.clear(); // Limpa o console a cada nova atualização para facilitar a leitura
                console.log("===== INICIANDO DIAGNÓSTICO DE HISTÓRICO =====");
                console.log(`Encontrados ${querySnapshot.size} itens com histórico de reparos.`);

                let flatHistory = [];
                
                querySnapshot.forEach((doc) => {
                    const item = doc.data();
                    console.log(`%cAnalisando Item ID: ${doc.id}`, 'color: blue; font-weight: bold;', item);
                    
                    if (item.historicoReparos && Array.isArray(item.historicoReparos)) {
                        item.historicoReparos.forEach(reparo => {
                            // LOG DE DIAGNÓSTICO: Mostra cada entrada de reparo que está sendo processada
                            console.log(`   -> Encontrado reparo:`, reparo);
                            
                            if (reparo.os && reparo.data) {
                                flatHistory.push({
                                    id: doc.id,
                                    clienteNome: item.clienteNome,
                                    itemDescricao: item.itemDescricao,
                                    osNumber: reparo.os,
                                    statusFinal: reparo.status,
                                    data: reparo.data.toDate() 
                                });
                            } else {
                                // LOG DE DIAGNÓSTICO: Avisa se um reparo foi pulado
                                console.warn(`      --> REPARO PULADO! Não tinha 'os' ou 'data' válidos.`, reparo);
                            }
                        });
                    }
                });

                console.log("--------------------------------------------------");
                console.log("HISTÓRICO COMPLETO (FLAT LIST ANTES DE AGRUPAR):", flatHistory);

                const latestEntries = new Map();
                flatHistory.forEach(entry => {
                    const existingEntry = latestEntries.get(entry.osNumber);
                    if (!existingEntry || entry.data > existingEntry.data) {
                        latestEntries.set(entry.osNumber, entry);
                    }
                });
                
                allHistoryForDisplay = Array.from(latestEntries.values());
                allHistoryForDisplay.sort((a, b) => b.osNumber.localeCompare(a.osNumber));
                
                // LOG DE DIAGNÓSTICO: Mostra a lista final que será exibida na tela
                console.log(`%cLISTA FINAL PARA EXIBIÇÃO (Após agrupar):`, 'color: green; font-size: 16px; font-weight: bold;', allHistoryForDisplay);
                console.log("===============================================");

                renderTable(allHistoryForDisplay);

            }, (error) => {
                console.error("Erro ao buscar histórico em tempo real: ", error);
                elements.tableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar dados. Verifique o console.</td></tr>';
            });
    }

    function renderTable(historyList) {
        // A lógica de renderização e busca permanece a mesma
        const currentSearchTerm = elements.searchInput.value.toLowerCase();
        const filteredList = historyList.filter(entry =>
            (entry.osNumber && entry.osNumber.toLowerCase().includes(currentSearchTerm)) ||
            (entry.clienteNome && entry.clienteNome.toLowerCase().includes(currentSearchTerm)) ||
            (entry.itemDescricao && entry.itemDescricao.toLowerCase().includes(currentSearchTerm)) ||
            (entry.data.toLocaleDateString('pt-BR').includes(currentSearchTerm))
        );

        elements.tableBody.innerHTML = '';
        if (filteredList.length === 0) {
            elements.tableBody.innerHTML = '<tr><td colspan="5">Nenhum registro de O.S. encontrado.</td></tr>';
            return;
        }

        filteredList.forEach(entry => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.onclick = () => { window.location.href = `view.html?id=${entry.id}`; };
            row.innerHTML = `
                <td>${entry.osNumber}</td>
                <td>${entry.clienteNome || 'N/A'}</td>
                <td>${entry.itemDescricao || 'N/A'}</td>
                <td>${entry.statusFinal}</td>
                <td>${entry.data.toLocaleDateString('pt-BR')}</td>
            `;
            elements.tableBody.appendChild(row);
        });
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            if (elements.userEmail) elements.userEmail.textContent = user.email;
            setupRealtimeListener();
        } else {
            if (unsubscribe) unsubscribe(); 
            window.location.href = "index.html";
        }
    });

    if (elements.logoutButton) {
        elements.logoutButton.addEventListener('click', () => auth.signOut());
    }

    if (elements.menuToggle && elements.sidebar && elements.overlay) {
        elements.menuToggle.addEventListener('click', () => {
            elements.sidebar.classList.toggle('open');
            elements.overlay.classList.toggle('active');
        });
        elements.overlay.addEventListener('click', () => {
            elements.sidebar.classList.remove('open');
            elements.overlay.classList.remove('active');
        });
    }

    elements.searchInput.addEventListener('input', () => {
        renderTable(allHistoryForDisplay);
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