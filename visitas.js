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

// --- FUNÇÕES GLOBAIS PARA OS BOTÕES ---
function marcarRealizada(visitId) {
    db.collection("visitas").doc(visitId).update({ status: "Realizada" })
        .then(() => {
            alert("Visita marcada como 'Realizada'!");
            document.dispatchEvent(new Event('reloadCalendar'));
        });
}

function marcarAdiada(visitId) {
    const novaDataInput = prompt("Visita adiada. Por favor, insira a nova data (DD/MM/AAAA):");
    if (novaDataInput) {
        const parts = novaDataInput.split('/');
        if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
            const novaDataFormatada = `${parts[2]}-${parts[1]}-${parts[0]}`;
            db.collection("visitas").doc(visitId).update({ status: "Adiada", dataAgendada: novaDataFormatada })
                .then(() => {
                    alert("Visita adiada com sucesso!");
                    document.dispatchEvent(new Event('reloadCalendar'));
                });
        } else {
            alert("Formato de data inválido. Por favor, use DD/MM/AAAA.");
        }
    }
}

function deletarVisita(visitId) {
    if (confirm("Tem certeza que deseja deletar esta visita? A ação não pode ser desfeita.")) {
        db.collection("visitas").doc(visitId).delete()
            .then(() => {
                alert("Visita deletada com sucesso.");
                document.dispatchEvent(new Event('reloadCalendar'));
            });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            if(document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email;
            initializeCalendar();
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
    
    const saveVisitButton = document.getElementById('saveVisitButton');
    saveVisitButton.addEventListener('click', () => {
        const visitData = {
            clienteNome: document.getElementById('visitCustomerName').value,
            contato: document.getElementById('visitContact').value,
            endereco: document.getElementById('visitAddress').value,
            problema: document.getElementById('visitProblem').value,
            dataAgendada: document.getElementById('visitDate').value,
            tecnico: document.getElementById('technicianName').value,
            status: "Agendada",
            criadoEm: new Date(),
            agendadoPor: auth.currentUser.email
        };
        if (!visitData.clienteNome || !visitData.endereco || !visitData.dataAgendada || !visitData.tecnico) {
            alert("Preencha Nome do Cliente, Endereço, Data e Técnico Responsável.");
            return;
        }
        db.collection("visitas").add(visitData).then(() => {
            alert("Visita agendada com sucesso!");
            document.getElementById('visitCustomerName').value = '';
            document.getElementById('visitContact').value = '';
            document.getElementById('visitAddress').value = '';
            document.getElementById('visitProblem').value = '';
            document.getElementById('visitDate').value = '';
            document.getElementById('technicianName').value = '';
            renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });
    });

    const monthYearElement = document.getElementById('calendar-month-year');
    const daysElement = document.getElementById('calendar-days');
    const prevMonthButton = document.getElementById('prev-month-button');
    const nextMonthButton = document.getElementById('next-month-button');
    const visitDetailsElement = document.getElementById('visit-details');
    
    let currentDate = new Date();
    
    function initializeCalendar() {
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        prevMonthButton.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });
        nextMonthButton.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });
        document.addEventListener('reloadCalendar', () => {
            renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });
    }

    async function renderCalendar(year, month) {
        monthYearElement.textContent = `${new Date(year, month).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`;
        daysElement.innerHTML = '';
        visitDetailsElement.innerHTML = '<p>Clique em um dia para ver os detalhes da visita.</p>';

        const startOfMonth = new Date(year, month, 1).toISOString().slice(0,10);
        const endOfMonth = new Date(year, month + 1, 1).toISOString().slice(0,10);
        
        const visitsSnapshot = await db.collection("visitas").get();
        
        let visitsData = [];
        visitsSnapshot.forEach(doc => {
            visitsData.push({ id: doc.id, ...doc.data() });
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let i = 0; i < firstDay; i++) {
            daysElement.innerHTML += `<div class="day-cell other-month"></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayString = `${year}-${('0'+(month+1)).slice(-2)}-${('0'+day).slice(-2)}`;
            const visitsOnDay = visitsData.filter(v => v.dataAgendada === dayString);
            
            let cellClass = 'day-cell';
            if (visitsOnDay.length > 0) { cellClass += ' has-visit'; }
            if (new Date().toDateString() === new Date(year, month, day).toDateString()) { cellClass += ' today'; }

            const dayDiv = document.createElement('div');
            dayDiv.className = cellClass;
            dayDiv.textContent = day;

            if (visitsOnDay.length > 0) {
                dayDiv.addEventListener('click', () => {
                    let detailsHtml = `<h4>Visitas para ${day}/${month+1}/${year}</h4>`;
                    visitsOnDay.forEach(visit => {
                        let visitStatusHtml = `<p><strong>Status:</strong> ${visit.status}</p>`;
                        let actionButtonsHtml = '';

                        if (visit.status === 'Agendada' || visit.status === 'Adiada') {
                            actionButtonsHtml = `
                                <div class="visit-actions">
                                    <button class="btn-realizada" onclick="marcarRealizada('${visit.id}')">Realizada</button>
                                    <button class="btn-adiada" onclick="marcarAdiada('${visit.id}')">Adiar</button>
                                    <button class="btn-deletar" onclick="deletarVisita('${visit.id}')">Deletar</button>
                                </div>`;
                        }
                        detailsHtml += `<div><p><strong>Cliente:</strong> ${visit.clienteNome}<br><strong>Técnico:</strong> ${visit.tecnico}<br><strong>Endereço:</strong> ${visit.endereco}</p>${visitStatusHtml}${actionButtonsHtml}</div><hr>`;
                    });
                    visitDetailsElement.innerHTML = detailsHtml;
                });
            }
            daysElement.appendChild(dayDiv);
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