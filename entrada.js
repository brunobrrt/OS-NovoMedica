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

auth.onAuthStateChanged(user => { if (!user) { window.location.href = "index.html"; } });
const saveButton = document.getElementById('saveButton'); const qrcodeDiv = document.getElementById('qrcode'); const qrMessage = document.getElementById('qr-message'); const downloadLink = document.getElementById('download-link');
saveButton.addEventListener('click', () => {
    if (!auth.currentUser) { alert("Você não está logado."); return; }
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = ('0' + (now.getMonth() + 1)).slice(-2);
    const day = ('0' + now.getDate()).slice(-2);
    const hours = ('0' + now.getHours()).slice(-2);
    const minutes = ('0' + now.getMinutes()).slice(-2);
    const seconds = ('0' + now.getSeconds()).slice(-2);
    const osNumber = `OS-${year}${month}${day}-${hours}${minutes}${seconds}`;
    const firstHistoryEntry = { os: osNumber, status: "Pendente", nota: `Entrada Avulsa: ${document.getElementById('defect-reported').value}\nAcessórios: ${document.getElementById('accessories').value}`, data: new Date(), tecnico: auth.currentUser.email };
    const itemData = {
        clienteNome: document.getElementById('customerName').value.trim(),
        clienteContato: document.getElementById('customerContact').value.trim(),
        itemDescricao: document.getElementById('itemDescription').value.trim(),
        itemSerial: document.getElementById('serialNumber').value.trim(),
        statusGeral: "Pendente",
        dataCriacao: new Date(),
        registradoPor: auth.currentUser.email,
        historicoReparos: [firstHistoryEntry]
    };
    if (!itemData.clienteNome || !itemData.itemDescricao) { alert("Preencha o Nome do Cliente e a Descrição do Item."); return; }
    db.collection("itens").add(itemData).then((docRef) => {
            alert(`Entrada registrada com sucesso!\nOrdem de Serviço: ${osNumber}`);
            const viewUrl = `https://${firebaseConfig.authDomain}/view.html?id=${docRef.id}`;
            qrcodeDiv.innerHTML = ""; qrMessage.style.display = 'none';
            new QRCode(qrcodeDiv, { text: viewUrl, width: 256, height: 256 });
            setTimeout(() => {
                const qrImage = qrcodeDiv.querySelector('img');
                if (qrImage) { downloadLink.href = qrImage.src; downloadLink.download = `qrcode-${docRef.id}.png`; downloadLink.style.display = 'block'; }
            }, 500);
        }).catch((error) => { alert("Ocorreu um erro ao salvar."); console.error("Erro ao salvar item: ", error); });
});