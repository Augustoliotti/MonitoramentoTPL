// Arquivo: js/main.js

import { baseFixa, mapaFundos, mapaOperacoes } from './data/constants.js';
import { ouvirDadosDiarios, salvarApontamento } from './services/frotaService.js';

// --- ESTADO DA APLICAÇÃO ---
let dadosDiaAtual = {}; 
let dataSelecionada = ""; 
let pararEscutaFirebase = null; 

// Listas para seleção múltipla
let fundosSelecionados = []; 
let operacoesSelecionadas = [];

document.addEventListener('DOMContentLoaded', function() {
    if (typeof feather !== 'undefined') feather.replace();

    const inputData = document.getElementById('input-data-selecionada');
    const hoje = new Date().toISOString().split('T')[0];
    dataSelecionada = localStorage.getItem('ultimaDataSelecionada') || hoje;
    
    if (inputData) {
        inputData.value = dataSelecionada;
        inputData.addEventListener('change', (e) => {
            dataSelecionada = e.target.value;
            localStorage.setItem('ultimaDataSelecionada', dataSelecionada);
            carregarDados(); 
        });
    }

    popularDatalists();
    setupSearch();
    
    const form = document.getElementById('form-atualizacao');
    if(form) form.addEventListener('submit', lidarComSalvamento);
    
    // Funções globais
    window.fecharModal = fecharModal;
    window.abrirAtualizacao = abrirAtualizacao;
    window.exportarExcel = exportarExcel;
    window.adicionarFundo = adicionarFundo;
    window.removerFundo = removerFundo;
    window.adicionarOperacao = adicionarOperacao;
    window.removerOperacao = removerOperacao;
    
    carregarDados();
});

// --- LÓGICA DE DADOS ---

function carregarDados() {
    if (pararEscutaFirebase) pararEscutaFirebase();

    pararEscutaFirebase = ouvirDadosDiarios(
        dataSelecionada, 
        (dados) => {
            dadosDiaAtual = dados; 
            renderFrotaTable();    
            updateDashboard();     
        },
        (erro) => console.error("Erro no serviço:", erro)
    );
}

async function lidarComSalvamento(event) {
    event.preventDefault();
    
    const id = document.getElementById('input-equipamento').value;
    const operacaoNomeCompleto = document.getElementById('input-operacao').value;

    let listaParaCodigo = operacoesSelecionadas.length > 0 ? operacoesSelecionadas : [operacaoNomeCompleto];
    
    let codigoOp = listaParaCodigo.map(nome => {
        return mapaOperacoes[nome] || "";
    }).filter(c => c !== "").join(" / ");

    const novosDados = {
        operacao: operacaoNomeCompleto,
        codigo: codigoOp,
        os: document.getElementById('input-os').value,
        manutencao: document.getElementById('input-manutencao').value,
        fundo: document.getElementById('input-fundo').value, 
        fazenda: document.getElementById('input-fazenda').value,
        implemento: document.getElementById('input-implemento').value
    };

    try {
        await salvarApontamento(dataSelecionada, id, novosDados);
        fecharModal();
    } catch (e) {
        console.error("Erro ao salvar:", e);
        alert("Erro ao salvar os dados.");
    }
}

// --- FUNÇÕES DE MÚLTIPLOS FUNDOS E OPERAÇÕES ---

function adicionarFundo() {
    const inputBusca = document.getElementById('input-busca-fundo');
    const codigo = inputBusca.value.trim().split(' ')[0]; 

    if (!codigo) return; 
    if (!mapaFundos[codigo]) { alert("Código de fundo não encontrado!"); return; }
    if (fundosSelecionados.includes(codigo)) { inputBusca.value = ''; return; }

    fundosSelecionados.push(codigo);
    renderizarFundos();
    atualizarCamposFundos();
    inputBusca.value = '';
    inputBusca.focus();
}

function removerFundo(codigo) {
    fundosSelecionados = fundosSelecionados.filter(c => c !== codigo);
    renderizarFundos(); 
    atualizarCamposFundos();
}

function renderizarFundos() {
    const container = document.getElementById('container-fundos-selecionados');
    if (!container) return;
    container.innerHTML = '';
    fundosSelecionados.forEach(codigo => {
        const badge = document.createElement('span');
        badge.className = "px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full flex items-center gap-1 cursor-pointer hover:bg-red-100 hover:text-red-700 transition select-none";
        badge.innerHTML = `${codigo} <i data-feather="x" class="w-3 h-3"></i>`;
        badge.onclick = () => removerFundo(codigo);
        container.appendChild(badge);
    });
    if (typeof feather !== 'undefined') feather.replace();
}

function atualizarCamposFundos() {
    document.getElementById('input-fundo').value = fundosSelecionados.join(' / ');
    const nomes = fundosSelecionados.map(c => mapaFundos[c]).join(' / ');
    document.getElementById('input-fazenda').value = nomes;
}

function adicionarOperacao() {
    const inputBusca = document.getElementById('input-busca-operacao');
    const nomeOperacao = inputBusca.value.trim();

    if (!nomeOperacao) return;
    if (!mapaOperacoes[nomeOperacao]) { alert("Operação não encontrada na lista!"); return; }
    if (operacoesSelecionadas.includes(nomeOperacao)) { inputBusca.value = ''; return; }

    operacoesSelecionadas.push(nomeOperacao);
    renderizarOperacoes();
    atualizarCamposOperacoes();
    inputBusca.value = '';
    inputBusca.focus();
}

function removerOperacao(nome) {
    operacoesSelecionadas = operacoesSelecionadas.filter(op => op !== nome);
    renderizarOperacoes();
    atualizarCamposOperacoes();
}

function renderizarOperacoes() {
    const container = document.getElementById('container-operacoes-selecionadas');
    if (!container) return;
    container.innerHTML = '';
    operacoesSelecionadas.forEach(nome => {
        const badge = document.createElement('span');
        badge.className = "px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full flex items-center gap-1 cursor-pointer hover:bg-red-100 hover:text-red-700 transition select-none";
        badge.innerHTML = `${nome} <i data-feather="x" class="w-3 h-3"></i>`;
        badge.onclick = () => removerOperacao(nome);
        container.appendChild(badge);
    });
    if (typeof feather !== 'undefined') feather.replace();
}

function atualizarCamposOperacoes() {
    document.getElementById('input-operacao').value = operacoesSelecionadas.join(' / ');
}

// --- LÓGICA DE INTERFACE (UI) ---

function formatarListaVertical(texto, classeExtra = "") {
    if (!texto) return '<span class="text-slate-300">--</span>';
    
    const strTexto = texto.toString();
    const isBadge = classeExtra.includes('badge'); 

    if (strTexto.includes('/')) {
        const itens = strTexto.split('/');
        return itens.map(item => {
            const val = item.trim();
            if (isBadge) {
                return `<div class="inline-block mb-1 ${classeExtra}">${val}</div><br>`;
            } else {
                return `<div class="whitespace-nowrap ${classeExtra}">- ${val}</div>`;
            }
        }).join('');
    }
    
    if (isBadge) {
        return `<span class="${classeExtra}">${strTexto}</span>`;
    }
    return `<div class="${classeExtra}">${strTexto}</div>`;
}

function renderFrotaTable(filtro = "") {
    const tbody = document.getElementById('frota-table-body');
    if (!tbody) return;
    tbody.innerHTML = ''; 

    baseFixa.forEach(itemBase => {
        const dadosOp = dadosDiaAtual[itemBase.id] || { 
            operacao: "", codigo: itemBase.codigo, os: "", manutencao: "", fundo: "", fazenda: "", implemento: "" 
        };

        const textoBusca = (itemBase.id + dadosOp.fazenda + dadosOp.operacao).toLowerCase();
        if (filtro && !textoBusca.includes(filtro)) return;

        let statusClass = '';
        const opLower = dadosOp.operacao.toLowerCase();
        
        if (opLower.includes("manutenção") || opLower.includes("oficina") || opLower.includes("aguardando")) {
            statusClass = 'badge badge-red'; 
        } else if (dadosOp.operacao) {
            statusClass = 'badge badge-green'; 
        }

        const osClass = dadosOp.os ? 'badge bg-blue-100 text-blue-800' : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="font-bold text-slate-700 text-lg">${itemBase.id}</span></td>
            
            <td class="text-center font-mono text-slate-700 font-bold text-sm">
                ${formatarListaVertical(dadosOp.codigo || '-')}
            </td>
            
            <td>
                ${formatarListaVertical(dadosOp.operacao, statusClass)}
            </td>
            
            <td class="text-slate-800 font-bold text-sm">
                ${formatarListaVertical(dadosOp.fundo)}
            </td>
            
            <td class="text-slate-800 font-bold text-xs leading-tight">
                ${formatarListaVertical(dadosOp.fazenda)}
            </td>
            
            <td>${dadosOp.implemento ? `<span class="badge bg-blue-100 text-blue-800">${dadosOp.implemento}</span>` : ''}</td>
            
            <td>
                 ${formatarListaVertical(dadosOp.os, osClass)}
            </td>
            
            <td>${dadosOp.manutencao ? `<span class="badge badge-red" title="${dadosOp.manutencao}">${dadosOp.manutencao}</span>` : ''}</td>
            
            <td class="text-center">
                <button onclick="abrirAtualizacao('${itemBase.id}')" class="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-full transition"><i data-feather="edit-3" style="width:16px; height:16px;"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    if (typeof feather !== 'undefined') feather.replace();
    if(document.getElementById('table-count')) document.getElementById('table-count').textContent = baseFixa.length;
}

function updateDashboard() {
    const total = baseFixa.length;
    let emManutencao = 0;
    Object.values(dadosDiaAtual).forEach(op => {
        const t = op.operacao.toLowerCase();
        if(t.includes('manutenção') || t.includes('oficina') || t.includes('mecânico')) emManutencao++;
    });
    if(document.getElementById('total-frota')) document.getElementById('total-frota').textContent = total;
    if(document.getElementById('total-operando')) document.getElementById('total-operando').textContent = total - emManutencao;
    if(document.getElementById('total-manutencao')) document.getElementById('total-manutencao').textContent = emManutencao;
}

function abrirAtualizacao(id) {
    const modal = document.getElementById('modal-atualizacao');
    const itemBase = baseFixa.find(i => i.id === id);
    if (!itemBase) return;

    const dadosOp = dadosDiaAtual[id] || { 
        operacao: "", codigo: itemBase.codigo, os: "", manutencao: "", fundo: "", fazenda: "", implemento: "" 
    };

    document.getElementById('input-equipamento').value = itemBase.id;
    document.getElementById('input-os').value = dadosOp.os;
    document.getElementById('input-manutencao').value = dadosOp.manutencao;
    document.getElementById('input-implemento').value = dadosOp.implemento || '';

    fundosSelecionados = [];
    if (dadosOp.fundo) {
        const codigosSalvos = dadosOp.fundo.toString().split('/').map(s => s.trim());
        codigosSalvos.forEach(c => { if(c && mapaFundos[c]) fundosSelecionados.push(c); });
    }
    renderizarFundos();     
    atualizarCamposFundos();

    operacoesSelecionadas = [];
    if (dadosOp.operacao) {
        const opsSalvas = dadosOp.operacao.toString().split('/').map(s => s.trim());
        opsSalvas.forEach(op => { if(op && mapaOperacoes[op]) operacoesSelecionadas.push(op); });
    }
    renderizarOperacoes();
    atualizarCamposOperacoes();

    modal.classList.add('active');
}

function fecharModal() {
    const modal = document.getElementById('modal-atualizacao');
    if(modal) modal.classList.remove('active');
}

function popularDatalists() {
    const dlFundo = document.getElementById('lista-fundos-sugestao');
    if(dlFundo) {
        dlFundo.innerHTML = '';
        Object.keys(mapaFundos).forEach(cod => {
            const opt = document.createElement('option');
            opt.value = cod;
            opt.label = mapaFundos[cod];
            dlFundo.appendChild(opt);
        });
    }

    const dlOp = document.getElementById('lista-operacoes');
    if(dlOp) {
        dlOp.innerHTML = '';
        Object.keys(mapaOperacoes).forEach(op => {
            const opt = document.createElement('option');
            opt.value = op;
            opt.label = "Cód: " + mapaOperacoes[op];
            dlOp.appendChild(opt);
        });
    }
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if(!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        renderFrotaTable(e.target.value.toLowerCase());
    });
}

function exportarExcel() {
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += `RELATÓRIO DIÁRIO - DATA: ${dataSelecionada}\n`;
    csv += "Equipamento;Código;Fundo;Fazenda;Operação;Implemento;O.S.;Manutenção\n";

    baseFixa.forEach(item => {
        const op = dadosDiaAtual[item.id] || { 
            operacao: "", codigo: item.codigo, os: "", manutencao: "", fundo: "", fazenda: "", implemento: "" 
        };
        const row = [
            item.id, op.codigo, op.fundo, `"${op.fazenda}"`, `"${op.operacao}"`, `"${op.implemento}"`, op.os, `"${op.manutencao}"`
        ];
        csv += row.join(";") + "\n";
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_${dataSelecionada}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}