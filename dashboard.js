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

// Tentar inicializar Firebase, mas não falhar se não funcionar
let auth, db;
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
    }
} catch (e) {
    console.log('Firebase não disponível, usando sistema local');
}

document.addEventListener('DOMContentLoaded', () => {
    
    // Verificar autenticação local primeiro
    if (!authSystem.requireAuth()) {
        return;
    }

    // Exibir email do usuário
    const currentUser = authSystem.getCurrentUser();
    if (document.getElementById('userEmail')) {
        document.getElementById('userEmail').textContent = currentUser.email;
    }

    // Tentar autenticação Firebase (opcional)
    if (auth) {
        auth.onAuthStateChanged(user => {
            if (user) {
                updateDashboardCards();
            }
        });
    } else {
        // Usar dados locais se Firebase não estiver disponível
        updateDashboardCardsLocal();
    }

    if (document.getElementById('logoutButton')) {
        document.getElementById('logoutButton').addEventListener('click', () => { 
            authSystem.logout();
        });
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

    async function updateDashboardCards() {
        try {
            const itensSnapshot = await db.collection("itens").get();
            const statusCounts = {
                'Pendente': 0, 'Aguardando Orçamento': 0, 'Aguardando Peças': 0,
                'Em Manutenção': 0, 'Pronto para Retirada': 0, 'Reprovado - Aguardando Devolução': 0
            };
            let totalRepairTime = 0;
            let completedRepairs = 0;

            itensSnapshot.forEach(doc => {
                const item = doc.data();
                if (item.statusGeral && statusCounts.hasOwnProperty(item.statusGeral)) {
                    statusCounts[item.statusGeral]++;
                }

                if ((item.statusGeral === "Finalizado e Entregue" || item.statusGeral === "Reprovado - Aguardando Devolução") && item.historicoReparos && item.historicoReparos.length > 0) {
                    const firstEntry = item.historicoReparos.find(entry => entry.os); // Encontra a primeira entrada com O.S.
                    const lastEntry = item.historicoReparos[item.historicoReparos.length - 1];

                    if (firstEntry && lastEntry) {
                        const startDate = firstEntry.data.toDate();
                        const endDate = lastEntry.data.toDate();
                        const differenceInMs = endDate.getTime() - startDate.getTime();
                        if (differenceInMs > 0) {
                            const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24);
                            totalRepairTime += differenceInDays;
                            completedRepairs++;
                        }
                    }
                }
            });
            
            const visitasSnapshot = await db.collection("visitas").where("status", "in", ["Agendada", "Adiada"]).get();
            const acaminhoSnapshot = await db.collection("itens_a_caminho").where("status", "==", "A Caminho").get();

            document.getElementById('stat-pendentes').textContent = statusCounts['Pendente'];
            document.getElementById('stat-orcamento').textContent = statusCounts['Aguardando Orçamento'];
            document.getElementById('stat-aguardando-pecas').textContent = statusCounts['Aguardando Peças'];
            document.getElementById('stat-em-manutencao').textContent = statusCounts['Em Manutenção'];
            document.getElementById('stat-prontos').textContent = statusCounts['Pronto para Retirada'];
            document.getElementById('stat-reprovados').textContent = statusCounts['Reprovado - Aguardando Devolução'];
            document.getElementById('stat-visita').textContent = visitasSnapshot.size;
            document.getElementById('stat-a-caminho').textContent = acaminhoSnapshot.size;
            
            if (completedRepairs > 0) {
                const averageTime = totalRepairTime / completedRepairs;
                document.getElementById('stat-tempo-medio').textContent = `${averageTime.toFixed(1)} dias`;
            } else {
                document.getElementById('stat-tempo-medio').textContent = "N/A";
            }

        } catch (error) {
            console.error("Erro ao atualizar os cards do dashboard:", error);
        }
    }

    function updateDashboardCardsLocal() {
        // Usar dados do localStorage
        try {
            const atendimentos = JSON.parse(localStorage.getItem('mockAtendimentos') || '[]');
            const statusCounts = {
                'Pendente': 0, 
                'Aguardando Orçamento': 0, 
                'Aguardando Peças': 0,
                'Em Manutenção': 0, 
                'Pronto para Retirada': 0, 
                'Reprovado - Aguardando Devolução': 0
            };

            atendimentos.forEach(item => {
                if (item.status && statusCounts.hasOwnProperty(item.status)) {
                    statusCounts[item.status]++;
                }
            });

            document.getElementById('stat-pendentes').textContent = statusCounts['Pendente'];
            document.getElementById('stat-orcamento').textContent = statusCounts['Aguardando Orçamento'];
            document.getElementById('stat-aguardando-pecas').textContent = statusCounts['Aguardando Peças'];
            document.getElementById('stat-em-manutencao').textContent = statusCounts['Em Manutenção'];
            document.getElementById('stat-prontos').textContent = statusCounts['Pronto para Retirada'];
            document.getElementById('stat-reprovados').textContent = statusCounts['Reprovado - Aguardando Devolução'];
            
            // Valores padrão para visitas e a caminho (quando não houver Firebase)
            if (document.getElementById('stat-visita')) {
                document.getElementById('stat-visita').textContent = '0';
            }
            if (document.getElementById('stat-a-caminho')) {
                document.getElementById('stat-a-caminho').textContent = '0';
            }
            if (document.getElementById('stat-tempo-medio')) {
                document.getElementById('stat-tempo-medio').textContent = 'N/A';
            }
        } catch (error) {
            console.error("Erro ao atualizar cards locais:", error);
        }
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