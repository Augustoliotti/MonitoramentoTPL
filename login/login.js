// Arquivo: login/login.js

// Importa funções do serviço principal (ajustando o caminho com ../)
import { loginEmailSenha, monitorarAuth } from '../js/services/frotaService.js';

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const loginForm = document.getElementById('loginForm');

document.addEventListener('DOMContentLoaded', () => {
    
    // Se já estiver logado, volta para a raiz (Dashboard)
    monitorarAuth((user) => {
        if (user) {
            window.location.href = '../index.html'; 
        }
    });

    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLoginSubmit();
        });
    }

    if(togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePasswordBtn.querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    }
});

async function handleLoginSubmit() {
    const email = emailInput.value.trim();
    const pass = passwordInput.value.trim();
    
    if (!email || !pass) {
        showError("Preencha todos os campos.");
        return;
    }

    setLoading(true);

    try {
        await loginEmailSenha(email, pass);
        // O monitorarAuth fará o redirecionamento automático
    } catch (error) {
        console.error("Erro:", error);
        let msg = "Erro ao entrar.";
        if(error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') msg = "Email ou senha incorretos.";
        showError(msg);
        setLoading(false);
    }
}

function showError(msg) {
    if(loginError) {
        loginError.textContent = msg;
        loginError.style.display = 'block';
    }
    const formGroup = emailInput.closest('.form-group');
    if(formGroup) formGroup.classList.add('error');
    setTimeout(() => { if(formGroup) formGroup.classList.remove('error'); }, 500);
}

function setLoading(isLoading) {
    if (isLoading) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Verificando...`;
        loginBtn.style.opacity = 0.7;
    } else {
        loginBtn.disabled = false;
        loginBtn.innerHTML = `<span>Entrar</span>`;
        loginBtn.style.opacity = 1;
    }
}