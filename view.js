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
    let currentUserIsAdmin = false;
    let currentItemData = null;

    const elements = {
        userEmail: document.getElementById('userEmail'),
        logoutButton: document.getElementById('logoutButton'),
        menuToggle: document.getElementById('menu-toggle'),
        sidebar: document.getElementById('sidebar'),
        overlay: document.getElementById('overlay'),
        startServiceButton: document.getElementById('start-service-button'),
        serviceSection: document.getElementById('service-section'),
        historyListDiv: document.getElementById('historyList'),
        adminActionsDiv: document.getElementById('admin-actions'),
        adminValueField: document.getElementById('admin-value-field'),
        checkinModalOverlay: document.getElementById('checkin-modal-overlay'),
        saveCheckinButton: document.getElementById('save-checkin-button'),
        cancelCheckinButton: document.getElementById('cancel-checkin-button'),
        saveStatusButton: document.getElementById('saveStatusButton'),
        editItemButton: document.getElementById('edit-item-button'),
        deleteItemButton: document.getElementById('delete-item-button'),
        editModalOverlay: document.getElementById('edit-modal-overlay'),
        saveEditButton: document.getElementById('save-edit-button'),
        cancelEditButton: document.getElementById('cancel-edit-button'),
        generateQuoteButton: document.getElementById('generate-quote-button'),
        quoteModalOverlay: document.getElementById('quote-modal-overlay'),
        cancelQuoteButton: document.getElementById('cancel-quote-button'),
        generatePdfFinalButton: document.getElementById('generate-pdf-final-button')
    };

    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id');

    async function checkUserRole(user) {
        if (!user || !elements.adminActionsDiv || !elements.adminValueField) return;
        try {
            const roleDoc = await db.collection('cargos').doc(user.uid).get();
            if (roleDoc.exists && roleDoc.data().cargo === 'admin') {
                currentUserIsAdmin = true;
                elements.adminActionsDiv.style.display = 'flex';
                elements.adminValueField.style.display = 'block';
            } else {
                currentUserIsAdmin = false;
                elements.adminActionsDiv.style.display = 'none';
                elements.adminValueField.style.display = 'none';
            }
        } catch (error) {
            console.error("Erro ao verificar cargo do usuário:", error);
            currentUserIsAdmin = false;
        }
    }

    function loadItemData() {
        if (!itemId) {
            document.querySelector('.view-container').innerHTML = '<h1>ID do item não encontrado na URL.</h1>';
            return;
        }
        db.collection("itens").doc(itemId).onSnapshot(doc => {
            if (doc.exists) {
                currentItemData = doc.data();
                const item = currentItemData;
                document.getElementById('headerItemDesc').textContent = item.itemDescricao || '';
                document.getElementById('info-clienteNome').textContent = item.clienteNome || 'Não informado';
                document.getElementById('info-clienteContato').textContent = item.clienteContato || 'Não informado';
                document.getElementById('info-itemDescricao').textContent = item.itemDescricao || 'Não informado';
                document.getElementById('info-itemSerial').textContent = item.itemSerial || 'Não informado';
                document.getElementById('info-dataVenda').textContent = item.dataVenda || 'Não informado';
                document.getElementById('info-dataGarantia').textContent = item.dataGarantia || 'Não informado';
                
                if (item.statusGeral === "Vendido" || item.statusGeral === "Finalizado e Entregue" || item.statusGeral === "Reprovado - Aguardando Devolução") {
                    elements.startServiceButton.style.display = 'block';
                    elements.serviceSection.style.display = 'none';
                } else {
                    elements.startServiceButton.style.display = 'none';
                    elements.serviceSection.style.display = 'block';
                    document.getElementById('statusSelect').value = item.statusGeral || 'Pendente';
                }
                renderHistory(item.historicoReparos || []);
            } else {
                alert("Item não encontrado. Pode ter sido excluído.");
                window.location.href = "dashboard.html";
            }
        }, error => {
            console.error("Erro ao buscar dados do item: ", error);
            alert("Não foi possível carregar os dados do item.");
        });
    }

    function renderHistory(historyArray) {
        elements.historyListDiv.innerHTML = '';
        if (!historyArray || historyArray.length === 0) {
            elements.historyListDiv.innerHTML = '<p>Nenhum reparo registrado.</p>';
            return;
        }
        historyArray.slice().reverse().forEach(entry => {
            const entryDate = entry.data && entry.data.toDate ? entry.data.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'}) : 'Data inválida';
            const osNumber = entry.os ? `<strong>OS: ${entry.os}</strong> - ` : '';
            const receivedBy = entry.recebidoPor ? `<p><strong>Recebido por:</strong> ${entry.recebidoPor}</p>` : '';
            let serviceValue = '';
            if (currentUserIsAdmin && entry.valor) {
                serviceValue = `<p><strong>Valor Orçado:</strong> ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.valor)}</p>`;
            }
            const historyElement = `<div class="history-item"><p>${osNumber}<span class="history-status">${entry.status}</span> - ${entryDate}</p>${receivedBy}${serviceValue}<p><strong>Técnico:</strong> ${entry.tecnico}</p><p><strong>Observação:</strong> ${entry.nota}</p></div>`;
            elements.historyListDiv.innerHTML += historyElement;
        });
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            if (elements.userEmail) elements.userEmail.textContent = user.email;
            checkUserRole(user).then(() => {
                loadItemData();
            });
        } else {
            localStorage.setItem('redirectAfterLogin', window.location.href);
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

    elements.startServiceButton.addEventListener('click', () => {
        const now = new Date();
        document.getElementById('checkin-date').value = now.toISOString().slice(0, 10);
        document.getElementById('checkin-time').value = now.toTimeString().slice(0, 5);
        document.getElementById('received-by').value = auth.currentUser ? auth.currentUser.email : '';
        elements.checkinModalOverlay.style.display = 'flex';
    });

    elements.cancelCheckinButton.addEventListener('click', () => {
        elements.checkinModalOverlay.style.display = 'none';
    });

    elements.saveCheckinButton.addEventListener('click', () => {
        const now = new Date();
        const osNumber = `OS-${now.getFullYear().toString().slice(-2)}${('0' + (now.getMonth() + 1)).slice(-2)}${('0' + now.getDate()).slice(-2)}-${('0' + now.getHours()).slice(-2)}${('0' + now.getMinutes()).slice(-2)}${('0' + now.getSeconds()).slice(-2)}`;
        const firstHistoryEntry = {
            os: osNumber,
            status: "Pendente",
            nota: `Defeito: ${document.getElementById('defect-reported').value}\nAcessórios: ${document.getElementById('accessories').value}`,
            data: new Date(`${document.getElementById('checkin-date').value}T${document.getElementById('checkin-time').value}`),
            recebidoPor: document.getElementById('received-by').value,
            tecnico: auth.currentUser.email
        };
        if (!firstHistoryEntry.recebidoPor) {
            alert("Preencha o campo 'Recebido Por'.");
            return;
        }
        db.collection("itens").doc(itemId).update({
            statusGeral: "Pendente",
            historicoReparos: firebase.firestore.FieldValue.arrayUnion(firstHistoryEntry)
        }).then(() => {
            alert(`Entrada registrada com sucesso!\nOrdem de Serviço: ${osNumber}`);
            elements.checkinModalOverlay.style.display = 'none';
        }).catch(error => console.error("Erro ao salvar entrada: ", error));
    });

    elements.saveStatusButton.addEventListener('click', () => {
        const newStatus = document.getElementById('statusSelect').value;
        const newNote = document.getElementById('serviceNotes').value;
        const valorInput = document.getElementById('serviceValue').value;
        const valorNumerico = valorInput ? parseFloat(valorInput.replace(/\./g, '').replace(',', '.')) : null;

        if (!newNote) {
            alert("Adicione uma observação para esta atualização.");
            return;
        }
        
        if (!currentItemData || !currentItemData.historicoReparos || currentItemData.historicoReparos.length === 0) {
            alert("ERRO: O histórico de reparos não foi encontrado. Ação cancelada.");
            return;
        }

        const reversedHistory = [...currentItemData.historicoReparos].reverse();
        const latestEntryWithOs = reversedHistory.find(entry => entry.os);
        
        if (!latestEntryWithOs) {
            alert("ERRO CRÍTICO: Não foi possível determinar a O.S. atual para este ciclo de serviço. Ação cancelada.");
            return;
        }
        
        const osToKeep = latestEntryWithOs.os;

        const historyEntry = {
            os: osToKeep,
            status: newStatus,
            nota: newNote,
            data: new Date(),
            tecnico: auth.currentUser.email
        };

        if (currentUserIsAdmin && valorNumerico) {
            historyEntry.valor = valorNumerico;
        }

        db.collection("itens").doc(itemId).update({
            statusGeral: newStatus,
            historicoReparos: firebase.firestore.FieldValue.arrayUnion(historyEntry)
        }).then(() => {
            alert("Status atualizado com sucesso!");
            document.getElementById('serviceNotes').value = '';
            if (document.getElementById('serviceValue')) document.getElementById('serviceValue').value = '';
        }).catch(error => {
            console.error("Erro ao atualizar status: ", error);
            alert("Ocorreu um erro ao atualizar o status. Tente novamente.");
        });
    });
    
    elements.editItemButton.addEventListener('click', () => {
        if (!currentItemData) return;
        document.getElementById('edit-customerName').value = currentItemData.clienteNome || '';
        document.getElementById('edit-customerContact').value = currentItemData.clienteContato || '';
        document.getElementById('edit-itemDescription').value = currentItemData.itemDescricao || '';
        document.getElementById('edit-serialNumber').value = currentItemData.itemSerial || '';
        elements.editModalOverlay.style.display = 'flex';
    });

    elements.cancelEditButton.addEventListener('click', () => { elements.editModalOverlay.style.display = 'none'; });

    elements.saveEditButton.addEventListener('click', () => {
        const updatedData = {
            clienteNome: document.getElementById('edit-customerName').value.trim(),
            clienteContato: document.getElementById('edit-customerContact').value.trim(),
            itemDescricao: document.getElementById('edit-itemDescription').value.trim(),
            itemSerial: document.getElementById('edit-serialNumber').value.trim()
        };
        db.collection("itens").doc(itemId).update(updatedData).then(() => {
            alert("Item atualizado com sucesso!");
            elements.editModalOverlay.style.display = 'none';
        }).catch(error => console.error("Erro ao editar item: ", error));
    });

    elements.deleteItemButton.addEventListener('click', () => {
        if (confirm("Você tem CERTEZA ABSOLUTA que quer excluir este item e todo o seu histórico? Esta ação não pode ser desfeita.")) {
            db.collection("itens").doc(itemId).delete()
            .then(() => {
                // SÓ executa se a exclusão no servidor der CERTO
                alert("Item excluído com sucesso.");
                window.location.href = "dashboard.html";
            })
            .catch((error) => {
                // SÓ executa se a exclusão no servidor der ERRADO
                console.error("Erro ao excluir o item:", error);
                alert(`Falha ao excluir o item. O servidor barrou a ação. Motivo: ${error.message}`);
           });
        }
    });

    if (elements.generateQuoteButton) {
        elements.generateQuoteButton.addEventListener('click', () => {
            if (!currentItemData) { alert("Dados não carregados."); return; }
            const osHistory = currentItemData.historicoReparos || [];
            const lastHistoryEntry = [...osHistory].reverse().find(entry => entry.os);
            if (!lastHistoryEntry) { alert("Não há O.S. no histórico para gerar um orçamento."); return; }
            document.getElementById('quote-services').value = lastHistoryEntry.nota || '';
            document.getElementById('quote-value').value = lastHistoryEntry.valor ? lastHistoryEntry.valor.toString().replace('.', ',') : '';
            elements.quoteModalOverlay.style.display = 'flex';
        });
    }
    
    if (elements.cancelQuoteButton) {
        elements.cancelQuoteButton.addEventListener('click', () => { elements.quoteModalOverlay.style.display = 'none'; });
    }
    
    if (elements.generatePdfFinalButton) {
        elements.generatePdfFinalButton.addEventListener('click', () => {
            if (typeof html2pdf === 'undefined') {
                alert("Erro fatal: A biblioteca de PDF (html2pdf) não foi encontrada. Verifique o arquivo view.html.");
                return;
            }
            const item = currentItemData;
            const finalServices = document.getElementById('quote-services').value;
            const finalValue = document.getElementById('quote-value').value;
            const osHistory = item.historicoReparos || [];
            
            const lastOsEntry = [...osHistory].reverse().find(entry => entry.os);
            const numeroOS = lastOsEntry ? lastOsEntry.os : 'N/A';

            const entryDate = new Date().toLocaleDateString('pt-BR');
            const formattedValue = finalValue ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(finalValue.replace(/\./g, '').replace(',', '.'))) : "Aguardando definição";
            const pdfContentElement = document.createElement('div');
            
            pdfContentElement.innerHTML = `
                <div style="font-family: Arial, sans-serif; padding: 30px; color: #333;">
                    <h1 style="text-align: center; font-size: 22px; margin-bottom: 25px;">Orçamento de Serviço</h1>
                    
                    <p><strong>Nº O.S.:</strong> ${numeroOS}</p>
                    <p><strong>Data de Emissão:</strong> ${entryDate}</p>
                    
                    <hr style="margin: 20px 0;">
                    
                    <h2 style="font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px;">1. Cliente e Equipamento</h2>
                    <p><strong>Cliente:</strong> ${item.clienteNome || 'Não informado'}</p>
                    <p><strong>Equipamento:</strong> ${item.itemDescricao || 'Não informado'}</p>
                    
                    <hr style="margin: 20px 0;">
                    
                    <h2 style="font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px;">2. Descrição dos Serviços Propostos</h2>
                    <div style="min-height: 100px;">
                        <p>${finalServices.replace(/\n/g, '<br>') || 'Nenhuma observação.'}</p>
                    </div>
                    
                    <hr style="margin: 20px 0;">
                    
                    <h2 style="font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px;">3. Valor do Orçamento</h2>
                    <p style="font-size: 16px; font-weight: bold;">Valor Total: ${formattedValue}</p>

                    <div style="margin-top: 80px; text-align: center;">
                        <p style="margin-bottom: 5px;">_________________________________________</p>
                        <p style="margin: 0;">${item.clienteNome || 'Assinatura do Cliente'}</p>
                    </div>
                </div>
            `;
            
            const options = {
                margin: 0.5,
                filename: `Service O.S ${numeroOS}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().from(pdfContentElement).set(options).save();
            elements.quoteModalOverlay.style.display = 'none';
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