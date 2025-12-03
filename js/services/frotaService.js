// Arquivo: js/services/frotaService.js
import { db } from '../config/firebase.js'; // Importa o banco configurado
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Escuta as mudanças no banco de dados em tempo real para uma data específica.
 * @param {string} dataSelecionada - Data no formato YYYY-MM-DD
 * @param {function} callbackSucesso - Função para rodar quando chegarem dados
 * @param {function} callbackErro - Função para rodar se der erro
 * @returns {function} - Função para parar de escutar (unsubscribe)
 */
export function ouvirDadosDiarios(dataSelecionada, callbackSucesso, callbackErro) {
    const docRef = doc(db, "diario_frota", dataSelecionada);
    
    // Retorna o unsubscribe para podermos parar de ouvir depois
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callbackSucesso(docSnap.data());
        } else {
            callbackSucesso({}); // Retorna vazio se não tiver dados
        }
    }, (error) => {
        if (callbackErro) callbackErro(error);
    });
}

/**
 * Salva ou atualiza os dados de um equipamento específico.
 * @param {string} dataSelecionada 
 * @param {string} idEquipamento 
 * @param {object} novosDados 
 */
export async function salvarApontamento(dataSelecionada, idEquipamento, novosDados) {
    const docRef = doc(db, "diario_frota", dataSelecionada);
    
    // O { merge: true } garante que não vamos apagar os outros equipamentos do dia
    await setDoc(docRef, {
        [idEquipamento]: novosDados
    }, { merge: true });
}