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
function marcarRealizada(remotoId) {
    db.collection("remotos").doc(remotoId).update({ status: "Realizado" })
        .then(() => {
            alert("Atendimento marcado como 'Realizado'!");
            document.dispatchEvent(new Event('reloadCalendar'));
        });
}

function marcarAdiada(remotoId) {
    const novaDataInput = prompt("Atendimento adiado. Por favor, insira a nova data (DD/MM/AAAA):");
    if (novaDataInput) {
        const parts = novaDataInput.split('/');
        if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
            const novaDataFormatada = `${parts[2]}-${parts[1]}-${parts[0]}`;
            db.collection("remotos").doc(remotoId).update({ status: "Adiado", dataAgendada: novaDataFormatada })
                .then(() => {
                    alert("Atendimento adiado com sucesso!");
                    document.dispatchEvent(new Event('reloadCalendar'));
                });
        } else {
            alert("Formato de data inválido. Por favor, use DD/MM/AAAA.");
        }
    }
}

function deletarAtendimento(remotoId) {
    if (confirm("Tem certeza que deseja deletar este atendimento? A ação não pode ser desfeita.")) {
        db.collection("remotos").doc(remotoId).delete()
            .then(() => {
                alert("Atendimento deletado com sucesso.");
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
    
    document.getElementById('saveRemoteButton').addEventListener('click', () => {
        const remotoData = {
            clienteNome: document.getElementById('remoteCustomerName').value,
            contato: document.getElementById('remoteContact').value,
            problema: document.getElementById('remoteProblem').value,
            dataAgendada: document.getElementById('remoteDate').value,
            tecnico: document.getElementById('technicianName').value,
            status: "Agendado",
            criadoEm: new Date(),
            agendadoPor: auth.currentUser.email
        };
        if (!remotoData.clienteNome || !remotoData.dataAgendada || !remotoData.tecnico) {
            alert("Preencha Nome do Cliente, Data e Técnico Responsável.");
            return;
        }
        db.collection("remotos").add(remotoData).then(() => {
            alert("Atendimento remoto agendado com sucesso!");
            document.getElementById('remoteCustomerName').value = '';
            document.getElementById('remoteContact').value = '';
            document.getElementById('remoteProblem').value = '';
            document.getElementById('remoteDate').value = '';
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
        visitDetailsElement.innerHTML = '<p>Clique em um dia para ver os detalhes do atendimento.</p>';

        const startOfMonth = new Date(year, month, 1).toISOString().slice(0,10);
        const endOfMonth = new Date(year, month + 1, 1).toISOString().slice(0,10);
        
        const remotosSnapshot = await db.collection("remotos")
            .where('dataAgendada', '>=', startOfMonth)
            .where('dataAgendada', '<', endOfMonth)
            .get();
        
        let remotosData = [];
        remotosSnapshot.forEach(doc => {
            remotosData.push({ id: doc.id, ...doc.data() });
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let i = 0; i < firstDay; i++) {
            daysElement.innerHTML += `<div class="day-cell other-month"></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayString = `${year}-${('0'+(month+1)).slice(-2)}-${('0'+day).slice(-2)}`;
            const remotosOnDay = remotosData.filter(r => r.dataAgendada === dayString);
            
            let cellClass = 'day-cell';
            if (remotosOnDay.length > 0) { cellClass += ' has-visit'; }
            if (new Date().toDateString() === new Date(year, month, day).toDateString()) { cellClass += ' today'; }

            const dayDiv = document.createElement('div');
            dayDiv.className = cellClass;
            dayDiv.textContent = day;

            if (remotosOnDay.length > 0) {
                dayDiv.addEventListener('click', () => {
                    let detailsHtml = `<h4>Atendimentos para ${day}/${month+1}/${year}</h4>`;
                    remotosOnDay.forEach(remoto => {
                        let visitStatusHtml = `<p><strong>Status:</strong> ${remoto.status}</p>`;
                        let actionButtonsHtml = '';
                        if (remoto.status === 'Agendado' || remoto.status === 'Adiado') {
                            actionButtonsHtml = `
                                <div class="visit-actions">
                                    <button class="btn-realizada" onclick="marcarRealizada('${remoto.id}')">Realizado</button>
                                    <button class="btn-adiada" onclick="marcarAdiada('${remoto.id}')">Adiar</button>
                                    <button class="btn-deletar" onclick="deletarAtendimento('${remoto.id}')">Deletar</button>
                                </div>`;
                        }
                        detailsHtml += `<div><p><strong>Cliente:</strong> ${remoto.clienteNome}<br><strong>Técnico:</strong> ${remoto.tecnico}</p>${visitStatusHtml}${actionButtonsHtml}</div><hr>`;
                    });
                    visitDetailsElement.innerHTML = detailsHtml;
                });
            }
            daysElement.appendChild(dayDiv);
        }
    }
});