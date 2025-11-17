// Configuração do Firebase (mantida para compatibilidade)
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
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        var auth = firebase.auth();
    }
} catch (e) {
    console.log('Firebase não disponível, usando autenticação local');
}

// --- Lógica de Login ---
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const errorMessage = document.getElementById('errorMessage');

loginButton.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    errorMessage.textContent = ''; 

    if (!email || !password) {
        errorMessage.textContent = 'Por favor, preencha todos os campos.';
        return;
    }

    // Usar sistema de autenticação local
    authSystem.login(email, password)
        .then((user) => {
            console.log('Login bem-sucedido:', user.email);
            
            // Procurar pelo redirecionamento salvo
            const redirectUrl = localStorage.getItem('redirectAfterLogin');

            if (redirectUrl) {
                localStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
            } else {
                // Redirecionar para o dashboard de OS
                window.location.href = "os-dashboard.html";
            }
        })
        .catch((error) => {
            console.error("Erro no login:", error.message);
            errorMessage.textContent = error.message || 'Ocorreu um erro. Tente novamente.';
        });
});

// Permitir login com Enter
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginButton.click();
    }
});

emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        passwordInput.focus();
    }
});