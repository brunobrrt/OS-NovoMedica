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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged(user => { if (!user) { window.location.href = "index.html"; } });
const saveButton = document.getElementById('saveButton'); const qrcodeDiv = document.getElementById('qrcode'); const qrMessage = document.getElementById('qr-message'); const downloadLink = document.getElementById('download-link');
document.getElementById('saleDate').valueAsDate = new Date();
saveButton.addEventListener('click', () => {
    if (!auth.currentUser) { alert("Você não está logado."); return; }
    const itemData = {
        clienteNome: document.getElementById('customerName').value.trim(),
        clienteContato: document.getElementById('customerContact').value.trim(),
        itemDescricao: document.getElementById('itemDescription').value.trim(),
        itemSerial: document.getElementById('serialNumber').value.trim(),
        dataVenda: document.getElementById('saleDate').value,
        dataGarantia: document.getElementById('warrantyDate').value,
        observacoesVenda: document.getElementById('notes').value,
        statusGeral: "Vendido",
        dataCriacao: new Date(),
        registradoPor: auth.currentUser.email,
        historicoReparos: [] 
    };
    if (!itemData.clienteNome || !itemData.itemDescricao) { alert("Preencha o Nome do Cliente e a Descrição do Item."); return; }
    db.collection("itens").add(itemData).then((docRef) => {
            alert("Registro salvo com sucesso! O QR Code foi gerado.");
            const viewUrl = `https://${firebaseConfig.authDomain}/view.html?id=${docRef.id}`;
            qrcodeDiv.innerHTML = ""; qrMessage.style.display = 'none';
            new QRCode(qrcodeDiv, { text: viewUrl, width: 256, height: 256 });
            setTimeout(() => {
                const qrImage = qrcodeDiv.querySelector('img');
                if (qrImage) { downloadLink.href = qrImage.src; downloadLink.download = `qrcode-${docRef.id}.png`; downloadLink.style.display = 'block'; }
            }, 500);
        }).catch((error) => { alert("Ocorreu um erro ao salvar."); console.error("Erro ao salvar item: ", error); });
});