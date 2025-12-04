// Arquivo: js/services/frotaService.js
import { db, auth } from '../config/firebase.js'; 
import { doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- AUTENTICAÇÃO ---

export function loginEmailSenha(email, senha) {
    return signInWithEmailAndPassword(auth, email, senha);
}

export function logout() {
    return signOut(auth);
}

export function monitorarAuth(callbackUsuario) {
    return onAuthStateChanged(auth, (user) => {
        callbackUsuario(user);
    });
}

// --- DADOS DIÁRIOS (APONTAMENTOS) ---

export function ouvirDadosDiarios(dataSelecionada, callbackSucesso, callbackErro) {
    const docRef = doc(db, "diario_frota", dataSelecionada);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callbackSucesso(docSnap.data());
        } else {
            callbackSucesso({});
        }
    }, (error) => {
        if (callbackErro) callbackErro(error);
    });
}

export async function salvarApontamento(dataSelecionada, idEquipamento, novosDados) {
    const docRef = doc(db, "diario_frota", dataSelecionada);
    await setDoc(docRef, {
        [idEquipamento]: novosDados
    }, { merge: true });
}

// --- CONFIGURAÇÃO DE GRUPOS (LOGÍSTICA) ---

export async function salvarConfiguracaoGrupos(config) {
    const docRef = doc(db, "configuracoes", "grupos_logistica");
    await setDoc(docRef, { dados: config });
}

export function ouvirConfiguracaoGrupos(callbackSucesso) {
    const docRef = doc(db, "configuracoes", "grupos_logistica");
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callbackSucesso(docSnap.data().dados);
        }
    }, (error) => console.error("Erro config grupos:", error));
}

export async function lerConfiguracaoGrupos() {
    const docRef = doc(db, "configuracoes", "grupos_logistica");
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) return docSnap.data().dados;
    } catch (e) { console.error(e); }
    return null;
}

// --- NOVAS FUNÇÕES: CADASTROS GERAIS (FAZENDAS, OPERAÇÕES, EQUIPAMENTOS) ---

export async function salvarCadastrosGerais(dados) {
    const docRef = doc(db, "configuracoes", "cadastros_gerais");
    // Merge true para atualizar apenas o que mudou (ex: só lista de fazendas)
    await setDoc(docRef, dados, { merge: true });
}

export function ouvirCadastrosGerais(callbackSucesso) {
    const docRef = doc(db, "configuracoes", "cadastros_gerais");
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callbackSucesso(docSnap.data());
        } else {
            callbackSucesso(null); // Ainda não criado
        }
    }, (error) => console.error("Erro cadastros gerais:", error));
}