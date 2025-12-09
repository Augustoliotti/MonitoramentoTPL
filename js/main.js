// Arquivo: js/main.js

import { baseFixa as baseFixaDefault, mapaFundos as mapaFundosDefault, mapaOperacoes as mapaOperacoesDefault, mapaGrupos as mapaGruposPadrao } from './data/constants.js';
import { 
    ouvirDadosDiarios, salvarApontamento, 
    salvarConfiguracaoGrupos, ouvirConfiguracaoGrupos, lerConfiguracaoGrupos,
    salvarCadastrosGerais, ouvirCadastrosGerais,
    logout, monitorarAuth 
} from './services/frotaService.js';

// --- FUNÇÃO CRÍTICA (DEFINIDA NO TOPO PARA EVITAR ERROS) ---
function formatarIds(ids) {
    if (!ids) return "-";
    if (Array.isArray(ids)) return ids.join(", ");
    return ids;
}

// --- ESTADO GLOBAL DA APLICAÇÃO ---
let listaEquipamentos = [...baseFixaDefault];
let listaFazendas = {...mapaFundosDefault};
let listaOperacoes = {...mapaOperacoesDefault};

let dadosDiaAtual = {}; 
let dataSelecionada = new Date().toISOString().split('T')[0];
let gruposAtivos = mapaGruposPadrao;

let unsubscribeDados = null;
let unsubscribeConfig = null;
let unsubscribeCadastros = null;

let fundosSelecionados = []; 
let operacoesSelecionadas = [];

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof feather !== 'undefined') feather.replace();
    
    // EXPORTAR FUNÇÕES IMEDIATAMENTE (Para garantir que o HTML as enxergue)
    window.formatarIds = formatarIds;
    window.abrirAtualizacao = abrirAtualizacao;
    window.fecharModal = fecharModal;
    window.salvarConfigGrupos = salvarConfigGrupos;
    window.abrirConfigGrupos = abrirConfigGrupos;
    window.resetarGruposPadrao = resetarGruposPadrao;
    window.adicionarFundo = adicionarFundo;
    window.removerFundo = removerFundo;
    window.adicionarOperacao = adicionarOperacao;
    window.removerOperacao = removerOperacao;
    window.exportarExcel = exportarExcel;
    window.adicionarCadastro = adicionarCadastro;
    window.removerCadastro = removerCadastro;
    // NOVAS FUNÇÕES EXPORTADAS PARA O MODAL DE GRUPOS
    window.adicionarEquipamentoAoGrupo = adicionarEquipamentoAoGrupo;
    window.removerEquipamentoDoGrupo = removerEquipamentoDoGrupo;
    
    window.logoutApp = async () => {
        await logout();
        window.location.href = 'login/login.html';
    };

    // VERIFICAÇÃO DE AUTH
    monitorarAuth((user) => {
        if (user) {
            const appContainer = document.getElementById('app-container');
            if(appContainer) appContainer.classList.remove('opacity-0');
            iniciarSistema();
        } else {
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login/login.html';
            }
        }
    });

    // CONFIGURAÇÃO DE DATA
    const inputDataElement = document.getElementById('input-data-selecionada');
    if (inputDataElement) {
        const dataSalva = localStorage.getItem('ultimaDataSelecionada') || new Date().toISOString().split('T')[0];
        dataSelecionada = dataSalva;

        try {
            flatpickr(inputDataElement, {
                locale: "pt", 
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "d \\de F, Y",
                defaultDate: dataSelecionada,
                disableMobile: "true",
                onChange: function(selectedDates, dateStr) {
                    dataSelecionada = dateStr;
                    localStorage.setItem('ultimaDataSelecionada', dataSelecionada);
                    carregarDados(); 
                }
            });
        } catch (e) {
            console.warn("Erro ao carregar locale pt, usando padrão.", e);
            flatpickr(inputDataElement, {
                dateFormat: "Y-m-d",
                defaultDate: dataSelecionada,
                onChange: (d, s) => { dataSelecionada = s; carregarDados(); }
            });
        }
    }

    setupSearch();

    try {
        const config = await lerConfiguracaoGrupos();
        if(config) gruposAtivos = config;
    } catch(e) { console.log("Usando grupos padrão"); }
});

// --- LÓGICA DO SISTEMA ---

function iniciarSistema() {
    console.log("Sistema iniciado.");

    unsubscribeCadastros = ouvirCadastrosGerais((dados) => {
        if(dados) {
            if(dados.equipamentos) listaEquipamentos = dados.equipamentos;
            if(dados.fazendas) listaFazendas = dados.fazendas;
            if(dados.operacoes) listaOperacoes = dados.operacoes;
        } else {
            salvarCadastrosGerais({
                equipamentos: baseFixaDefault,
                fazendas: mapaFundosDefault,
                operacoes: mapaOperacoesDefault
            });
        }
        popularDatalists();
        if(document.getElementById('frota-table-body')) { popularFiltroGrupos(); renderFrotaTable(); }
        if(document.getElementById('lista-equipamentos')) { renderConfigPage(); }
        if(document.getElementById('container-logistico')) { renderizarQuadroLogistico(); }
    });

    unsubscribeConfig = ouvirConfiguracaoGrupos((config) => {
        if(config) {
            gruposAtivos = config;
            if(document.getElementById('container-logistico')) renderizarQuadroLogistico();
            if(document.getElementById('filtro-grupo')) popularFiltroGrupos();
            
            // ATUALIZA O MODAL DE GRUPOS SE ESTIVER ABERTO
            if(document.getElementById('modal-config-grupos')?.classList.contains('active')) renderizarConfigGruposModal();
        }
    });

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
    if (classeExtra.includes('badge')) return `<span class="${classeExtra}">${strTexto}</span>`;
    return `<div class="${classeExtra}">${strTexto}</div>`;
}

// --- FUNÇÕES AUXILIARES E MODAIS ---

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
    ['search-input', 'filtro-status', 'filtro-grupo'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', () => renderFrotaTable());
    });
}

function abrirAtualizacao(id) {
    const d = dadosDiaAtual[id] || {};
    const inpEquip = document.getElementById('input-equipamento');
    if(inpEquip) inpEquip.value = id;
    
    document.getElementById('input-busca-operacao').value = d.operacao || ""; 
    document.getElementById('input-os').value = d.os || "";
    document.getElementById('input-manutencao').value = d.manutencao || "";
    document.getElementById('input-implemento').value = d.implemento || "";

    fundosSelecionados = [];
    operacoesSelecionadas = [];
    
    if (d.fundo) {
        d.fundo.toString().split('/').forEach(c => { 
            const val = c.trim();
            if(val && listaFazendas[val]) fundosSelecionados.push(val); 
        });
    }
    renderizarFundos();
    atualizarCamposFundos();

    if (d.operacao) {
        d.operacao.toString().split('/').forEach(op => { 
            const val = op.trim();
            if(val && listaOperacoes[val]) operacoesSelecionadas.push(val); 
        });
    }
    if (operacoesSelecionadas.length === 0 && d.operacao) document.getElementById('input-busca-operacao').value = d.operacao;

    renderizarOperacoes();
    atualizarCamposOperacoes();

    document.getElementById('modal-atualizacao').classList.add('active');
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
function renderizarFundos() { 
    const c = document.getElementById('container-fundos-selecionados'); 
    if(!c) return; 
    c.innerHTML = fundosSelecionados.map(cod => `<span class="badge badge-green flex items-center gap-1 cursor-pointer" onclick="removerFundo('${cod}')">${cod} <i data-feather="x" class="w-3 h-3"></i></span>`).join(''); 
    feather.replace(); 
}
function atualizarCamposFundos() { 
    document.getElementById('input-fundo').value = fundosSelecionados.join(' / '); 
    document.getElementById('input-fazenda').value = fundosSelecionados.map(c => listaFazendas[c] || c).join(' / '); 
}

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
function renderizarOperacoes() { 
    const c = document.getElementById('container-operacoes-selecionadas'); 
    if(!c) return; 
    c.innerHTML = operacoesSelecionadas.map(nome => `<span class="badge bg-blue-100 text-blue-800 flex items-center gap-1 cursor-pointer" onclick="removerOperacao('${nome}')">${nome} <i data-feather="x" class="w-3 h-3"></i></span>`).join(''); 
    feather.replace(); 
}
function atualizarCamposOperacoes() { document.getElementById('input-operacao').value = operacoesSelecionadas.join(' / '); }

function isManutencao(d) {
    const op = (d.operacao || "").toLowerCase();
    const obs = (d.manutencao || "").toLowerCase();
    return op.includes('manutenção') || op.includes('oficina') || op.includes('mecânico') || obs.length > 0;
}

function updateDashboardStats() {
    const total = listaEquipamentos.length;
    let emManutencao = 0;
    Object.values(dadosDiaAtual).forEach(op => { if(isManutencao(op)) emManutencao++; });
    const els = {'dash-total-operando': total-emManutencao, 'dash-total-manutencao': emManutencao, 'total-frota': total};
    for(const k in els) { const el = document.getElementById(k); if(el) el.textContent = els[k]; }
}

function mostrarToast(msg, type='success') {
    let t = document.getElementById('toast-notification');
    if(!t) { t = document.createElement('div'); t.id = 'toast-notification'; t.className = 'toast'; document.body.appendChild(t); }
    t.innerHTML = `<i data-feather="${type==='success'?'check':'alert-circle'}" class="w-4 h-4"></i> ${msg}`; t.className = `toast show ${type}`; feather.replace(); setTimeout(()=>t.classList.remove('show'), 3000);
}

function renderizarQuadroLogistico() { 
    const container = document.getElementById('container-logistico');
    if(!container) return;
    let html = ''; const usados = new Set();
    for (const [nome, info] of Object.entries(gruposAtivos)) {
        if(info.equipamentos) info.equipamentos.forEach(id => usados.add(id));
        html += gerarCard(nome, info.lider, info.equipamentos || []);
    }
    const orfaos = listaEquipamentos.filter(b => !usados.has(b.id)).map(b => b.id);
    if(orfaos.length > 0) html += gerarCard("Sem Grupo", "-", orfaos, true);
    container.innerHTML = html; feather.replace();
}

function gerarCard(nome, lider, ids, alert = false) {
    ids.sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
    const items = ids.map(id => {
        const d = dadosDiaAtual[id] || {};
        const st = isManutencao(d) ? {bg:'bg-red-50', icon:'alert-circle'} : (d.operacao ? {bg:'bg-emerald-50', icon:'check-circle'} : {bg:'bg-slate-50', icon:''});
        return `<div onclick="abrirAtualizacao('${id}')" class="flex flex-col items-center justify-center p-2 rounded border cursor-pointer hover:-translate-y-1 transition ${st.bg} h-16 relative group"><span class="text-xs font-black">${id}</span></div>`;
    }).join('');
    
    const op = ids.filter(id => { const d = dadosDiaAtual[id] || {}; return d.operacao && !isManutencao(d); }).length;
    const mn = ids.filter(id => { const d = dadosDiaAtual[id] || {}; return isManutencao(d); }).length;
    return `<div class="card-modern rounded-xl shadow-sm border overflow-hidden flex flex-col border-slate-200 bg-white"><div class="px-4 py-3 border-b flex justify-between items-center bg-slate-50"><div><h3 class="font-bold text-sm uppercase">${nome}</h3><p class="text-xs text-slate-500">${lider}</p></div><div class="text-[10px] font-bold text-right"><span class="text-emerald-600">OP:${op}</span> <span class="text-red-600 ml-1">MN:${mn}</span></div></div><div class="p-3 grid grid-cols-4 gap-2 bg-white flex-1">${items}</div></div>`;
}

// =================================================================
// NOVO CÓDIGO: FUNÇÕES DE CONFIGURAÇÃO DE GRUPOS (CONFIGURAR FRENTES)
// =================================================================

function gerarInputEquipamento(id, grupoNome) {
    // Renderiza um tag com o ID do equipamento e um botão para remover do grupo
    return `<div class="bg-white px-3 py-1 rounded-lg border border-slate-200 flex items-center justify-between text-sm font-bold text-slate-700">
                <span>${id}</span>
                <button type="button" onclick="removerEquipamentoDoGrupo('${grupoNome}', '${id}')" class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition"><i data-feather="x" class="w-4 h-4"></i></button>
            </div>`;
}

function renderizarConfigGruposModal() {
    const container = document.getElementById('container-config-grupos');
    if (!container) return;

    let html = '';
    const todosEquipamentos = listaEquipamentos.map(e => e.id);
    const usados = new Set();
    
    // Renderiza os grupos existentes
    for (const [nome, info] of Object.entries(gruposAtivos)) {
        info.equipamentos.forEach(id => usados.add(id));
        
        // Ordena os equipamentos para melhor visualização
        (info.equipamentos || []).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
        
        const listaEquip = (info.equipamentos || []).map(id => gerarInputEquipamento(id, nome)).join('');

        html += `
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div class="flex justify-between items-center mb-4">
                    <h4 class="font-bold text-slate-800">${nome}</h4>
                    <input type="text" value="${info.lider || ''}" placeholder="Líder" class="input-modern w-32 text-xs py-1 px-2 border-slate-200" data-group="${nome}" data-field="lider">
                </div>
                <div class="grid grid-cols-5 gap-2 border-t pt-4" id="lista-equipamentos-grupo-${nome}">
                    ${listaEquip}
                </div>
                <div class="flex gap-2 mt-4">
                    <input type="text" placeholder="Adicionar Equipamento (ID)" class="input-modern flex-1 text-sm uppercase" id="input-add-equip-${nome}">
                    <button type="button" onclick="adicionarEquipamentoAoGrupo('${nome}')" class="btn-modern btn-primary p-2 w-10 justify-center text-sm"><i data-feather="plus" class="w-4 h-4"></i></button>
                </div>
            </div>
        `;
    }
    
    // Adicionar seção de equipamentos sem grupo
    const orfaos = todosEquipamentos.filter(id => !usados.has(id));
    if (orfaos.length > 0) {
         const listaOrfaos = orfaos.map(id => 
            `<div class="bg-red-50 px-3 py-1 rounded-lg border border-red-200 flex items-center justify-between text-xs font-bold text-red-700"><span>${id}</span></div>`
         ).join('');
         
         html += `
            <div class="bg-red-50 p-5 rounded-xl border border-red-200 shadow-sm mt-6">
                <h4 class="font-bold text-red-800 mb-4">Equipamentos Sem Frente (${orfaos.length})</h4>
                <div class="grid grid-cols-5 gap-2">
                    ${listaOrfaos}
                </div>
                <p class="text-xs text-red-600 mt-4">Estes IDs não estão alocados em nenhuma frente.</p>
            </div>
         `;
    }


    container.innerHTML = html;
    if (typeof feather !== 'undefined') feather.replace();
}

function adicionarEquipamentoAoGrupo(groupName) {
    const input = document.getElementById(`input-add-equip-${groupName}`);
    const id = input.value.trim().toUpperCase();
    if (!id) return mostrarToast("Digite o ID do equipamento", "error");
    if (!listaEquipamentos.some(e => e.id === id)) return mostrarToast(`Equipamento ${id} não está na lista base. Adicione em Configurações.`, "error");
    
    // Remove o equipamento de outros grupos antes de adicionar
    Object.values(gruposAtivos).forEach(g => {
        g.equipamentos = g.equipamentos.filter(e => e !== id);
    });

    const grupo = gruposAtivos[groupName];
    if (grupo && !grupo.equipamentos.includes(id)) {
        grupo.equipamentos.push(id);
        grupo.equipamentos.sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
        mostrarToast(`Equipamento ${id} adicionado. Clique em Salvar.`, "success");
        input.value = '';
        renderizarConfigGruposModal(); 
    } else if (grupo && grupo.equipamentos.includes(id)) {
         mostrarToast(`Equipamento ${id} já está neste grupo.`, "error");
    }
}

function removerEquipamentoDoGrupo(groupName, id) {
    const grupo = gruposAtivos[groupName];
    if (grupo) {
        grupo.equipamentos = grupo.equipamentos.filter(e => e !== id);
        mostrarToast(`Equipamento ${id} removido. Clique em Salvar.`, "success");
        renderizarConfigGruposModal(); 
    }
}

function abrirConfigGrupos() { 
    renderizarConfigGruposModal(); // Carrega o conteúdo dinâmico
    document.getElementById('modal-config-grupos').classList.add('active'); 
}

async function salvarConfigGrupos() { 
    // 1. Captura o líder de cada grupo antes de salvar
    document.querySelectorAll('[data-group][data-field="lider"]').forEach(input => {
        const groupName = input.getAttribute('data-group');
        gruposAtivos[groupName].lider = input.value.trim();
    });

    try {
        // 2. Salva o estado atual de gruposAtivos no Firebase
        await salvarConfiguracaoGrupos(gruposAtivos);
        mostrarToast("Configuração de Frentes salva com sucesso!", "success"); 
        // 3. Fecha o modal (a re-renderização do Dashboard será feita pelo listener de mudanças)
        document.getElementById('modal-config-grupos').classList.remove('active'); 
    } catch(e) {
        console.error("Erro ao salvar configuração de grupos:", e);
        mostrarToast("Erro ao salvar configuração.", "error"); 
    }
}

function resetarGruposPadrao() { 
    if(confirm("Tem certeza que deseja restaurar as Frentes para o padrão inicial?")) {
        salvarConfiguracaoGrupos(mapaGruposPadrao)
            .then(() => mostrarToast("Frentes restauradas para o padrão. Clique em Salvar.", "success"))
            .catch(() => mostrarToast("Erro ao restaurar. Tente novamente.", "error"));
    }
}
// =================================================================
// FIM DO NOVO CÓDIGO
// =================================================================


// Funções de Configurações Gerais (Mantidas do original)
function exportarExcel() {
    let csv = "data:text/csv;charset=utf-8,\uFEFFEquipamento;Código;Fundo;Fazenda;Operação;Implemento;O.S.;Manutenção\n";
    listaEquipamentos.forEach(item => {
        const op = dadosDiaAtual[item.id] || { operacao: "", codigo: item.codigo, os: "", manutencao: "", fundo: "", fazenda: "", implemento: "" };
        csv += `${item.id};${op.codigo};${op.fundo};"${op.fazenda}";"${op.operacao}";"${op.implemento}";${op.os};"${op.manutencao}"\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Relatorio_${dataSelecionada}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

async function adicionarCadastro(tipo) {
    if (tipo === 'equipamento') {
        const id = document.getElementById('novo-equip-id').value.trim().toUpperCase();
        if(!id) return mostrarToast("Digite o ID", "error");
        if(!listaEquipamentos.some(e=>e.id===id)) listaEquipamentos.push({id:id, codigo:""});
    } else if (tipo === 'fazenda') {
        const cod = document.getElementById('nova-fazenda-cod').value.trim();
        const nome = document.getElementById('nova-fazenda-nome').value.trim().toUpperCase();
        if(cod && nome) listaFazendas[cod] = `${cod}-${nome}`;
    } else if (tipo === 'operacao') {
        const cod = document.getElementById('nova-operacao-cod').value.trim();
        const nome = document.getElementById('nova-operacao-nome').value.trim();
        if(cod && nome) listaOperacoes[nome] = cod;
    }
    await salvarCadastrosGerais({equipamentos:listaEquipamentos, fazendas:listaFazendas, operacoes:listaOperacoes});
    mostrarToast("Salvo!", "success"); renderConfigPage();
}

async function removerCadastro(tipo, id) {
    if(!confirm("Remover?")) return;
    if(tipo === 'equipamento') listaEquipamentos = listaEquipamentos.filter(e => e.id !== id);
    else if(tipo === 'fazenda') delete listaFazendas[id];
    else if(tipo === 'operacao') delete listaOperacoes[id];
    await salvarCadastrosGerais({equipamentos:listaEquipamentos, fazendas:listaFazendas, operacoes:listaOperacoes});
    mostrarToast("Removido.", "success"); renderConfigPage();
}

function renderConfigPage() {
    const elEquip = document.getElementById('lista-equipamentos');
    if(elEquip) {
        elEquip.innerHTML = listaEquipamentos.map(e => `<div class="flex justify-between p-2 border-b"><span class="font-bold">${e.id}</span><button onclick="removerCadastro('equipamento','${e.id}')" class="text-red-500">Excluir</button></div>`).join('');
        document.getElementById('count-equip').textContent = listaEquipamentos.length;
    }
}