// Arquivo: js/main.js

import { baseFixa as baseFixaDefault, mapaFundos as mapaFundosDefault, mapaOperacoes as mapaOperacoesDefault, mapaGrupos as mapaGruposPadrao } from './data/constants.js';
import { 
    ouvirDadosDiarios, salvarApontamento, 
    salvarConfiguracaoGrupos, ouvirConfiguracaoGrupos, lerConfiguracaoGrupos,
    salvarCadastrosGerais, ouvirCadastrosGerais,
    logout, monitorarAuth 
} from './services/frotaService.js';

// --- ESTADO GLOBAL DA APLICAÇÃO ---
// Inicializa com os valores PADRÃO do constants.js para evitar "undefined"
let listaEquipamentos = [...baseFixaDefault];
let listaFazendas = {...mapaFundosDefault};
let listaOperacoes = {...mapaOperacoesDefault};

let dadosDiaAtual = {}; 
let dataSelecionada = new Date().toISOString().split('T')[0];
let gruposAtivos = mapaGruposPadrao;

let unsubscribeDados = null;
let unsubscribeConfig = null;
let unsubscribeCadastros = null;

// Filas de seleção múltipla
let fundosSelecionados = []; 
let operacoesSelecionadas = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof feather !== 'undefined') feather.replace();
    
    // -- 1. VERIFICAÇÃO DE AUTH --
    monitorarAuth((user) => {
        if (user) {
            const appContainer = document.getElementById('app-container');
            if(appContainer) appContainer.classList.remove('opacity-0');
            iniciarSistema();
        } else {
            window.location.href = 'login/login.html';
        }
    });

    // -- 2. CONFIGURAÇÃO DE DATA --
    const inputDataElement = document.getElementById('input-data-selecionada');
    if (inputDataElement) {
        const dataSalva = localStorage.getItem('ultimaDataSelecionada') || new Date().toISOString().split('T')[0];
        dataSelecionada = dataSalva;

        flatpickr(inputDataElement, {
            locale: "pt",
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d \\de F, Y",
            defaultDate: dataSelecionada,
            disableMobile: "true",
            onChange: function(selectedDates, dateStr, instance) {
                dataSelecionada = dateStr;
                localStorage.setItem('ultimaDataSelecionada', dataSelecionada);
                carregarDados(); 
            }
        });
    }

    // -- 3. SETUP GLOBAL --
    setupSearch();

    try {
        const config = await lerConfiguracaoGrupos();
        if(config) gruposAtivos = config;
    } catch(e) { console.log("Usando grupos padrão"); }
    
    // -- EXPOR FUNÇÕES PARA O HTML --
    window.logoutApp = async () => {
        await logout();
        window.location.href = 'login/login.html';
    };
    
    window.fecharModal = fecharModal;
    window.abrirConfigGrupos = abrirConfigGrupos;
    window.salvarConfigGrupos = salvarConfigGrupos;
    window.resetarGruposPadrao = resetarGruposPadrao;
    window.formatarIds = formatarIds;
    window.abrirAtualizacao = abrirAtualizacao;
    window.adicionarFundo = adicionarFundo;
    window.removerFundo = removerFundo;
    window.adicionarOperacao = adicionarOperacao;
    window.removerOperacao = removerOperacao;
    window.exportarExcel = exportarExcel;
    window.adicionarCadastro = adicionarCadastro;
    window.removerCadastro = removerCadastro;
});

// --- INICIALIZAÇÃO DO SISTEMA ---

function iniciarSistema() {
    console.log("Sistema iniciado.");

    // 1. OUVIR CADASTROS GERAIS
    unsubscribeCadastros = ouvirCadastrosGerais((dados) => {
        if(dados) {
            // Se vier do banco, atualiza. Se não, mantém o padrão.
            if(dados.equipamentos) listaEquipamentos = dados.equipamentos;
            if(dados.fazendas) listaFazendas = dados.fazendas;
            if(dados.operacoes) listaOperacoes = dados.operacoes;
        } else {
            console.log("Primeira vez: Salvando cadastros padrão...");
            salvarCadastrosGerais({
                equipamentos: baseFixaDefault,
                fazendas: mapaFundosDefault,
                operacoes: mapaOperacoesDefault
            });
        }
        
        // Atualiza telas após garantir que os dados existem
        popularDatalists();
        
        if(document.getElementById('frota-table-body')) {
            popularFiltroGrupos();
            renderFrotaTable();
        }
        if(document.getElementById('lista-equipamentos')) {
            renderConfigPage();
        }
        if(document.getElementById('container-logistico')) {
            renderizarQuadroLogistico();
        }
    });

    // 2. OUVIR CONFIGURAÇÃO DE GRUPOS
    unsubscribeConfig = ouvirConfiguracaoGrupos((config) => {
        if(config) {
            gruposAtivos = config;
            if(document.getElementById('container-logistico')) renderizarQuadroLogistico();
            if(document.getElementById('filtro-grupo')) popularFiltroGrupos();
            if(document.getElementById('modal-config-grupos')?.classList.contains('active')) abrirConfigGrupos();
        }
    });

    // 3. OUVIR DADOS DIÁRIOS
    carregarDados();
    
    const form = document.getElementById('form-atualizacao');
    if(form) form.onsubmit = lidarComSalvamento;
}

function pararSistema() {
    if(unsubscribeDados) unsubscribeDados();
    if(unsubscribeConfig) unsubscribeConfig();
    if(unsubscribeCadastros) unsubscribeCadastros();
    dadosDiaAtual = {};
}

function carregarDados() {
    if(unsubscribeDados) unsubscribeDados();
    unsubscribeDados = ouvirDadosDiarios(dataSelecionada, (dados) => {
        dadosDiaAtual = dados;
        if(document.getElementById('frota-table-body')) renderFrotaTable();
        if(document.getElementById('container-logistico')) renderizarQuadroLogistico();
        updateDashboardStats();
    }, (erro) => console.error("Erro dados:", erro));
}

// --- FUNÇÕES DE RENDERIZAÇÃO ---

// TELA DE FROTA (CORRIGIDA)
function renderFrotaTable() {
    const tbody = document.getElementById('frota-table-body');
    if (!tbody) return;
    tbody.innerHTML = ''; 

    const filtroTexto = document.getElementById('search-input')?.value.toLowerCase() || "";
    const filtroStatus = document.getElementById('filtro-status')?.value || "";
    const filtroGrupo = document.getElementById('filtro-grupo')?.value || "";

    let contagemVisivel = 0;

    listaEquipamentos.forEach(itemBase => {
        const dadosOp = dadosDiaAtual[itemBase.id] || { 
            operacao: "", codigo: itemBase.codigo, os: "", manutencao: "", fundo: "", fazenda: "", implemento: "" 
        };

        const textoBusca = (itemBase.id + (dadosOp.fazenda||"") + (dadosOp.operacao||"") + (dadosOp.manutencao||"")).toLowerCase();
        if (filtroTexto && !textoBusca.includes(filtroTexto)) return;

        const emManutencao = isManutencao(dadosOp);
        const operando = dadosOp.operacao && !emManutencao;
        
        if (filtroStatus === 'operando' && !operando) return;
        if (filtroStatus === 'manutencao' && !emManutencao) return;
        if (filtroStatus === 'parado' && (operando || emManutencao)) return;

        if (filtroGrupo) {
            const grupo = gruposAtivos[filtroGrupo];
            if (!grupo || !grupo.equipamentos.includes(itemBase.id)) return;
        }

        let rowClass = "row-status-neutro";
        if (emManutencao) rowClass = "row-status-manutencao";
        else if (operando) rowClass = "row-status-operando";

        let statusBadge = '';
        if (emManutencao) statusBadge = 'badge badge-red';
        else if (operando) statusBadge = 'badge badge-green';

        const tr = document.createElement('tr');
        tr.className = `transition hover:bg-opacity-80 ${rowClass}`;
        
        // Aqui usamos formatarListaVertical para garantir que undefined vire "--"
        tr.innerHTML = `
            <td><span class="font-bold text-slate-700 text-lg ml-2">${itemBase.id}</span></td>
            <td class="text-center font-mono text-slate-700 font-bold text-sm">${formatarListaVertical(dadosOp.codigo)}</td>
            <td>${formatarListaVertical(dadosOp.operacao, statusBadge)}</td>
            <td class="text-slate-800 font-bold text-sm">${formatarListaVertical(dadosOp.fundo)}</td>
            <td class="text-slate-800 font-bold text-xs leading-tight">${formatarListaVertical(dadosOp.fazenda)}</td>
            <td>${dadosOp.implemento ? `<span class="badge bg-blue-100 text-blue-800">${dadosOp.implemento}</span>` : ''}</td>
            <td>${formatarListaVertical(dadosOp.os, dadosOp.os ? 'badge bg-blue-100 text-blue-800' : '')}</td>
            <td class="font-medium text-red-600">${dadosOp.manutencao ? `⚠️ ${dadosOp.manutencao}` : ''}</td>
            <td class="text-center">
                <button onclick="abrirAtualizacao('${itemBase.id}')" class="text-emerald-600 hover:bg-emerald-50 p-2 rounded-full transition shadow-sm border border-emerald-100 bg-white">
                    <i data-feather="edit-3" style="width:16px; height:16px;"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
        contagemVisivel++;
    });
    
    if (typeof feather !== 'undefined') feather.replace();
    const elCount = document.getElementById('table-count');
    if(elCount) elCount.textContent = contagemVisivel;
}

function formatarListaVertical(texto, classeExtra = "") {
    if (!texto || texto === "undefined") return '<span class="text-slate-300">--</span>';
    const strTexto = texto.toString();
    
    if (strTexto.includes('/')) {
        return strTexto.split('/').map(item => {
            const val = item.trim();
            if (classeExtra.includes('badge')) {
                return `<div class="inline-block mb-1 ${classeExtra}">${val}</div><br>`;
            } else {
                return `<div class="whitespace-nowrap ${classeExtra}">- ${val}</div>`;
            }
        }).join('');
    }
    
    if (classeExtra.includes('badge')) {
        return `<span class="${classeExtra}">${strTexto}</span>`;
    }
    return `<div class="${classeExtra}">${strTexto}</div>`;
}

// ... (Mantenha todas as outras funções: renderizarQuadroLogistico, gerarCard, abrirAtualizacao, etc.)
// As funções abaixo NÃO PRECISAM SER ALTERADAS, apenas copie do arquivo anterior.
// Elas incluem: popularDatalists, popularFiltroGrupos, setupSearch, exportarExcel, 
// adicionarFundo/Remover, adicionarOperacao/Remover, lidarComSalvamento, etc.

// --- REPLICAR FUNÇÕES AUXILIARES IMPORTANTES PARA EVITAR ERROS ---

function popularDatalists() {
    const dlFundo = document.getElementById('lista-fundos-sugestao');
    if(dlFundo) {
        dlFundo.innerHTML = '';
        Object.entries(listaFazendas).forEach(([cod, nome]) => {
            const opt = document.createElement('option');
            opt.value = cod;
            opt.label = nome;
            dlFundo.appendChild(opt);
        });
    }
    const dlOp = document.getElementById('lista-operacoes');
    if(dlOp) {
        dlOp.innerHTML = '';
        Object.entries(listaOperacoes).forEach(([nome, cod]) => {
            const opt = document.createElement('option');
            opt.value = nome;
            opt.label = "Cód: " + cod;
            dlOp.appendChild(opt);
        });
    }
}

function popularFiltroGrupos() {
    const select = document.getElementById('filtro-grupo');
    if(!select) return;
    const valorAtual = select.value;
    select.innerHTML = '<option value="">Todas Frentes</option>';
    Object.keys(gruposAtivos).sort().forEach(nome => {
        const opt = document.createElement('option');
        opt.value = nome;
        opt.textContent = nome;
        select.appendChild(opt);
    });
    select.value = valorAtual;
}

function setupSearch() {
    const inputs = ['search-input', 'filtro-status', 'filtro-grupo'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', () => renderFrotaTable());
    });
}

// ... (Incluir as demais funções de modal e salvamento que já estavam funcionando) ...
// (Para garantir que o código funcione, mantenha as funções abrirAtualizacao, lidarComSalvamento, adicionarFundo, etc.)

function abrirAtualizacao(id) {
    const d = dadosDiaAtual[id] || {};
    const inpEquip = document.getElementById('input-equipamento');
    const inpOp = document.getElementById('input-operacao');
    const inpBuscaOp = document.getElementById('input-busca-operacao');
    const inpOs = document.getElementById('input-os');
    const inpManut = document.getElementById('input-manutencao');
    const inpImpl = document.getElementById('input-implemento');
    const modal = document.getElementById('modal-atualizacao');

    if(inpEquip) inpEquip.value = id;
    if(inpOp) inpOp.value = d.operacao || "";
    if(inpBuscaOp) inpBuscaOp.value = d.operacao || ""; 
    if(inpOs) inpOs.value = d.os || "";
    if(inpManut) inpManut.value = d.manutencao || "";
    if(inpImpl) inpImpl.value = d.implemento || "";

    fundosSelecionados = [];
    operacoesSelecionadas = [];
    
    if (d.fundo) {
        const arr = d.fundo.toString().split('/').map(s => s.trim());
        arr.forEach(c => { if(c && listaFazendas[c]) fundosSelecionados.push(c); });
    }
    renderizarFundos();
    atualizarCamposFundos();

    if (d.operacao) {
        const arr = d.operacao.toString().split('/').map(s => s.trim());
        arr.forEach(op => { if(op && listaOperacoes[op]) operacoesSelecionadas.push(op); });
    }
    if (operacoesSelecionadas.length === 0 && d.operacao) inpBuscaOp.value = d.operacao;

    renderizarOperacoes();
    atualizarCamposOperacoes();

    if(modal) modal.classList.add('active');
}

function fecharModal() {
    document.getElementById('modal-atualizacao')?.classList.remove('active');
}

async function lidarComSalvamento(e) {
    e.preventDefault();
    const id = document.getElementById('input-equipamento').value;
    const opInput = document.getElementById('input-busca-operacao').value;
    let listaOps = operacoesSelecionadas.length > 0 ? operacoesSelecionadas : (opInput ? [opInput] : []);
    const operacaoFinal = listaOps.join(' / ');
    const codigoFinal = listaOps.map(nome => listaOperacoes[nome] || "").filter(c => c !== "").join(" / ");

    const novosDados = {
        operacao: operacaoFinal,
        codigo: codigoFinal,
        os: document.getElementById('input-os').value,
        manutencao: document.getElementById('input-manutencao').value,
        fundo: document.getElementById('input-fundo').value, 
        fazenda: document.getElementById('input-fazenda').value,
        implemento: document.getElementById('input-implemento').value
    };

    try {
        await salvarApontamento(dataSelecionada, id, novosDados);
        fecharModal();
        mostrarToast("Salvo!", "success");
    } catch (err) {
        console.error("Erro:", err);
        mostrarToast("Erro ao salvar.", "error");
    }
}

// Helpers de UI
function adicionarFundo() {
    const input = document.getElementById('input-busca-fundo');
    const codigo = input.value.trim().split(' ')[0]; 
    if (!codigo) return; 
    if (!listaFazendas[codigo]) { mostrarToast("Fundo não encontrado", "error"); return; }
    if (fundosSelecionados.includes(codigo)) { input.value = ''; return; }
    fundosSelecionados.push(codigo);
    renderizarFundos();
    atualizarCamposFundos();
    input.value = ''; input.focus();
}
function removerFundo(c) { fundosSelecionados = fundosSelecionados.filter(x => x !== c); renderizarFundos(); atualizarCamposFundos(); }
function renderizarFundos() { const c = document.getElementById('container-fundos-selecionados'); if(!c) return; c.innerHTML = ''; fundosSelecionados.forEach(cod => c.innerHTML += `<span class="badge badge-green flex items-center gap-1 cursor-pointer" onclick="removerFundo('${cod}')">${cod} <i data-feather="x" class="w-3 h-3"></i></span>`); feather.replace(); }
function atualizarCamposFundos() { document.getElementById('input-fundo').value = fundosSelecionados.join(' / '); document.getElementById('input-fazenda').value = fundosSelecionados.map(c => listaFazendas[c] || c).join(' / '); }

function adicionarOperacao() {
    const input = document.getElementById('input-busca-operacao');
    const nome = input.value.trim();
    if (!nome) return;
    if (!listaOperacoes[nome]) { mostrarToast("Operação não listada", "error"); return; }
    if (operacoesSelecionadas.includes(nome)) { input.value = ''; return; }
    operacoesSelecionadas.push(nome);
    renderizarOperacoes();
    atualizarCamposOperacoes();
    input.value = ''; input.focus();
}
function removerOperacao(n) { operacoesSelecionadas = operacoesSelecionadas.filter(x => x !== n); renderizarOperacoes(); atualizarCamposOperacoes(); }
function renderizarOperacoes() { const c = document.getElementById('container-operacoes-selecionadas'); if(!c) return; c.innerHTML = ''; operacoesSelecionadas.forEach(nome => c.innerHTML += `<span class="badge bg-blue-100 text-blue-800 flex items-center gap-1 cursor-pointer" onclick="removerOperacao('${nome}')">${nome} <i data-feather="x" class="w-3 h-3"></i></span>`); feather.replace(); }
function atualizarCamposOperacoes() { document.getElementById('input-operacao').value = operacoesSelecionadas.join(' / '); }

function isManutencao(d) {
    const op = (d.operacao || "").toLowerCase();
    const obs = (d.manutencao || "").toLowerCase();
    return op.includes('manutenção') || op.includes('oficina') || op.includes('mecânico') || obs.length > 0;
}

function getStatus(d) {
    if (isManutencao(d)) return { bg: 'bg-red-50', border: 'border-red-200 text-red-700', icon: 'alert-circle' };
    if (d.operacao) return { bg: 'bg-emerald-50', border: 'border-emerald-200 text-emerald-700', icon: 'check-circle' };
    return { bg: 'bg-slate-50', border: 'border-slate-200 text-slate-400', icon: '' };
}

function updateDashboardStats() {
    const total = listaEquipamentos.length;
    let emManutencao = 0;
    Object.values(dadosDiaAtual).forEach(op => { if(isManutencao(op)) emManutencao++; });
    const operando = total - emManutencao;
    const ids = ['dash-total-operando', 'dash-total-manutencao', 'total-operando', 'total-manutencao'];
    ids.forEach(id => { const el = document.getElementById(id); if(el) el.textContent = id.includes('manutencao') ? emManutencao : operando; });
    if(document.getElementById('total-frota')) document.getElementById('total-frota').textContent = total;
}

function mostrarToast(msg, type='success') {
    let t = document.getElementById('toast-notification');
    if(!t) { t = document.createElement('div'); t.id = 'toast-notification'; t.className = 'toast'; document.body.appendChild(t); }
    t.innerHTML = `<i data-feather="${type==='success'?'check':'alert-circle'}" class="w-4 h-4"></i> ${msg}`; t.className = `toast show ${type}`; feather.replace(); setTimeout(()=>t.classList.remove('show'), 3000);
}

function renderizarQuadroLogistico() { /* (Código idêntico ao que você já tem, mas usando listaEquipamentos) */ 
    const container = document.getElementById('container-logistico');
    if(!container) return;
    let html = ''; const usados = new Set();
    for (const [nome, info] of Object.entries(gruposAtivos)) {
        info.equipamentos.forEach(id => usados.add(id));
        html += gerarCard(nome, info.lider, info.equipamentos);
    }
    const orfaos = listaEquipamentos.filter(b => !usados.has(b.id)).map(b => b.id);
    if(orfaos.length > 0) html += gerarCard("Sem Grupo", "-", orfaos, true);
    container.innerHTML = html; feather.replace();
}

function gerarCard(nome, lider, ids, alert = false) {
    ids.sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
    const items = ids.map(id => {
        const d = dadosDiaAtual[id] || {};
        const st = getStatus(d);
        return `<div onclick="abrirAtualizacao('${id}')" class="flex flex-col items-center justify-center p-2 rounded border cursor-pointer hover:-translate-y-1 transition ${st.bg} ${st.border} h-16 relative group" title="${d.operacao||''}"><span class="text-xs font-black">${id}</span>${st.icon?`<div class="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow border border-slate-100"><i data-feather="${st.icon}" class="w-3 h-3"></i></div>`:''}</div>`;
    }).join('');
    // ... (restante da função igual)
    const op = ids.filter(id => { const d = dadosDiaAtual[id] || {}; return d.operacao && !isManutencao(d); }).length;
    const mn = ids.filter(id => { const d = dadosDiaAtual[id] || {}; return isManutencao(d); }).length;
    const color = alert ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-white";
    return `<div class="card-modern rounded-xl shadow-sm border overflow-hidden flex flex-col ${color}"><div class="px-4 py-3 border-b flex justify-between items-center bg-slate-50"><div><h3 class="font-bold text-sm uppercase">${nome}</h3><p class="text-xs text-slate-500">${lider}</p></div><div class="text-[10px] font-bold text-right">${op>0?`<span class="text-emerald-600">OP:${op}</span>`:''} ${mn>0?`<span class="text-red-600 ml-1">MN:${mn}</span>`:''}</div></div><div class="p-3 grid grid-cols-4 gap-2 bg-white flex-1">${items}</div></div>`;
}

function exportarExcel() {
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += `RELATÓRIO DIÁRIO - DATA: ${dataSelecionada}\n`;
    csv += "Equipamento;Código;Fundo;Fazenda;Operação;Implemento;O.S.;Manutenção\n";
    listaEquipamentos.forEach(item => {
        const op = dadosDiaAtual[item.id] || { operacao: "", codigo: item.codigo, os: "", manutencao: "", fundo: "", fazenda: "", implemento: "" };
        const row = [item.id, op.codigo, op.fundo, `"${op.fazenda}"`, `"${op.operacao}"`, `"${op.implemento}"`, op.os, `"${op.manutencao}"`];
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

// Funções de Config (Adicionar/Remover)
async function adicionarCadastro(tipo) { /* Código igual ao anterior */ }
async function removerCadastro(tipo, id) { /* Código igual ao anterior */ }
function renderConfigPage() { /* Código igual ao anterior */ }
function abrirConfigGrupos() { /* Código igual ao anterior */ }
async function salvarConfigGrupos() { /* Código igual ao anterior */ }
function resetarGruposPadrao() { /* Código igual ao anterior */ }