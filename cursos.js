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
function marcarPreparado(cursoId) {
    db.collection("cursos").doc(cursoId).update({ status: "Equipamentos Preparados" })
        .then(() => {
            alert("Curso marcado como 'Equipamentos Preparados'!");
            document.dispatchEvent(new Event('reloadCalendar'));
        });
}

function marcarAdiadoCurso(cursoId) {
    const novaDataInicio = prompt("Curso adiado. Insira a NOVA data de INÍCIO (DD/MM/AAAA):");
    const novaDataFim = prompt("Agora, insira a NOVA data de FIM (DD/MM/AAAA):");

    if (novaDataInicio && novaDataFim) {
        // Valida e converte as datas para o formato do Firebase (AAAA-MM-DD)
        const partsInicio = novaDataInicio.split('/');
        const partsFim = novaDataFim.split('/');
        if (partsInicio.length === 3 && partsFim.length === 3) {
            const dataInicioFormatada = `${partsInicio[2]}-${partsInicio[1]}-${partsInicio[0]}`;
            const dataFimFormatada = `${partsFim[2]}-${partsFim[1]}-${partsFim[0]}`;
            db.collection("cursos").doc(cursoId).update({ 
                status: "Adiado", 
                dataInicio: dataInicioFormatada,
                dataFim: dataFimFormatada
            }).then(() => {
                alert("Curso adiado com sucesso!");
                document.dispatchEvent(new Event('reloadCalendar'));
            });
        } else {
            alert("Formato de data inválido. Por favor, use DD/MM/AAAA.");
        }
    }
}

function deletarCurso(cursoId) {
    if (confirm("Tem certeza que deseja deletar este curso? A ação não pode ser desfeita.")) {
        db.collection("cursos").doc(cursoId).delete()
            .then(() => {
                alert("Curso deletado com sucesso.");
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
    
    const saveCourseButton = document.getElementById('saveCourseButton');
    saveCourseButton.addEventListener('click', () => {
        const courseData = {
            nomeCurso: document.getElementById('courseName').value,
            equipamentos: document.getElementById('neededEquipment').value,
            dataInicio: document.getElementById('startDate').value,
            dataFim: document.getElementById('endDate').value,
            status: "Agendado", // Status inicial
            agendadoPor: auth.currentUser.email
        };
        if (!courseData.nomeCurso || !courseData.dataInicio || !courseData.dataFim) {
            alert("Preencha o Nome, Data de Início e Data de Fim do curso.");
            return;
        }
        db.collection("cursos").add(courseData).then(() => {
            alert("Curso agendado com sucesso!");
            document.getElementById('courseName').value = '';
            document.getElementById('neededEquipment').value = '';
            document.getElementById('startDate').value = '';
            document.getElementById('endDate').value = '';
            renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });
    });

    const monthYearElement = document.getElementById('calendar-month-year');
    const daysElement = document.getElementById('calendar-days');
    const prevMonthButton = document.getElementById('prev-month-button');
    const nextMonthButton = document.getElementById('next-month-button');
    const courseDetailsElement = document.getElementById('course-details');
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
        courseDetailsElement.innerHTML = '<p>Clique em um dia para ver os detalhes do curso.</p>';
        
        const coursesSnapshot = await db.collection("cursos").get();
        let coursesData = [];
        coursesSnapshot.forEach(doc => {
            coursesData.push({ id: doc.id, ...doc.data() });
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let i = 0; i < firstDay; i++) { daysElement.innerHTML += `<div class="day-cell other-month"></div>`; }

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDay = new Date(year, month, day);
            const coursesOnDay = coursesData.filter(course => {
                const startDate = new Date(course.dataInicio + 'T00:00:00');
                const endDate = new Date(course.dataFim + 'T23:59:59');
                return currentDay >= startDate && currentDay <= endDate;
            });
            
            let cellClass = 'day-cell';
            if (coursesOnDay.length > 0) { cellClass += ' has-visit'; }
            if (new Date().toDateString() === currentDay.toDateString()) { cellClass += ' today'; }

            const dayDiv = document.createElement('div');
            dayDiv.className = cellClass;
            dayDiv.textContent = day;

            if (coursesOnDay.length > 0) {
                dayDiv.addEventListener('click', () => {
                    let detailsHtml = `<h4>Cursos/Eventos para ${day}/${month+1}/${year}</h4>`;
                    coursesOnDay.forEach(course => {
                        const statusDoCurso = course.status || "Agendado"; // Se não tiver status, considera "Agendado"
                        let statusHtml = `<p><strong>Status:</strong> ${statusDoCurso}</p>`;
                        let actionButtonsHtml = '';

                        // A verificação agora usa a nova variável
                        if (statusDoCurso === 'Agendado' || statusDoCurso === 'Adiado') {
                            actionButtonsHtml = `
                                <div class="visit-actions">
                                    <button class="btn-preparado" onclick="marcarPreparado('${course.id}')">Equip. Preparado</button>
                                    <button class="btn-adiado" onclick="marcarAdiadoCurso('${course.id}')">Adiar</button>
                                    <button class="btn-deletar" onclick="deletarCurso('${course.id}')">Deletar</button>
                                </div>`;
                        }
                        // ===================================

                        detailsHtml += `<div><p><strong>Curso:</strong> ${course.nomeCurso}<br><strong>Equipamentos:</strong> ${course.equipamentos}</p>${statusHtml}${actionButtonsHtml}</div><hr>`;
                    });
                    courseDetailsElement.innerHTML = detailsHtml;
                });
            }
            daysElement.appendChild(dayDiv);
        }
    }
});