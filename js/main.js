// Arquivo: js/main.js

import { baseFixa, mapaFundos, mapaOperacoes, mapaGrupos as mapaGruposPadrao } from './data/constants.js';
import { 
    ouvirDadosDiarios, salvarApontamento, 
    salvarConfiguracaoGrupos, ouvirConfiguracaoGrupos, lerConfiguracaoGrupos,
    loginEmailSenha, logout, monitorarAuth 
} from './services/frotaService.js';

// --- ESTADO DA APLICAÇÃO ---
let dadosDiaAtual = {}; 
let dataSelecionada = new Date().toISOString().split('T')[0];
let gruposAtivos = mapaGruposPadrao;
let unsubscribeDados = null;
let unsubscribeConfig = null;

// Listas para seleção múltipla
let fundosSelecionados = []; 
let operacoesSelecionadas = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof feather !== 'undefined') feather.replace();
    
    // -- 1. CONFIGURAÇÃO DE AUTH --
    const loginOverlay = document.getElementById('login-overlay');
    const appContainer = document.getElementById('app-container');
    const formLogin = document.getElementById('form-login');
    const erroLogin = document.getElementById('login-erro');

    monitorarAuth((user) => {
        if (user) {
            if(loginOverlay) loginOverlay.classList.add('hidden');
            if(appContainer) appContainer.classList.remove('opacity-0');
            iniciarSistema();
        } else {
            if(loginOverlay) loginOverlay.classList.remove('hidden');
            if(appContainer) appContainer.classList.add('opacity-0');
            pararSistema();
        }
    });

    if(formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            erroLogin.classList.add('hidden');
            try {
                await loginEmailSenha(document.getElementById('login-email').value, document.getElementById('login-senha').value);
            } catch (error) {
                console.error(error);
                erroLogin.textContent = "Erro: Verifique email e senha.";
                erroLogin.classList.remove('hidden');
            }
        });
    }

    // -- 2. CONFIGURAÇÃO DE DATA --
    const inputData = document.getElementById('input-data-selecionada');
    if (inputData) {
        const dataSalva = localStorage.getItem('ultimaDataSelecionada');
        if(dataSalva) dataSelecionada = dataSalva;
        
        inputData.value = dataSelecionada;
        inputData.addEventListener('change', (e) => {
            dataSelecionada = e.target.value;
            localStorage.setItem('ultimaDataSelecionada', dataSelecionada);
            carregarDados(); 
        });
    }

    // -- 3. SETUP GLOBAL --
    popularDatalists();
    setupSearch();

    // Carrega configuração salva
    try {
        const config = await lerConfiguracaoGrupos();
        if(config) gruposAtivos = config;
    } catch(e) { console.log("Usando grupos padrão"); }
    
    popularFiltroGrupos();

    // Expondo funções para o HTML
    window.logoutApp = () => logout();
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
});

// --- FUNÇÕES DE SISTEMA ---

function iniciarSistema() {
    console.log("Iniciando sistema...");
    unsubscribeConfig = ouvirConfiguracaoGrupos((config) => {
        if(config) {
            gruposAtivos = config;
            if(document.getElementById('modal-config-grupos')?.classList.contains('active')) abrirConfigGrupos(); 
            if(document.getElementById('container-logistico')) renderizarQuadroLogistico();
            popularFiltroGrupos();
            mostrarToast("Layout atualizado.", "success");
        }
    });
    carregarDados();
    const form = document.getElementById('form-atualizacao');
    if(form) form.onsubmit = lidarComSalvamento;
}

function pararSistema() {
    if(unsubscribeDados) unsubscribeDados();
    if(unsubscribeConfig) unsubscribeConfig();
    dadosDiaAtual = {};
}

function carregarDados() {
    if(unsubscribeDados) unsubscribeDados();
    unsubscribeDados = ouvirDadosDiarios(dataSelecionada, (dados) => {
        dadosDiaAtual = dados;
        if(document.getElementById('frota-table-body')) renderFrotaTable();
        if(document.getElementById('container-logistico')) renderizarQuadroLogistico();
        updateDashboardStats();
    }, (erro) => console.error("Erro ao ouvir dados:", erro));
}

// --- QUADRO LOGÍSTICO (DASHBOARD) ---

function renderizarQuadroLogistico() {
    const container = document.getElementById('container-logistico');
    if(!container) return;
    
    let html = '';
    const usados = new Set();

    for (const [nome, info] of Object.entries(gruposAtivos)) {
        info.equipamentos.forEach(id => usados.add(id));
        html += gerarCard(nome, info.lider, info.equipamentos);
    }

    const orfaos = baseFixa.filter(b => !usados.has(b.id)).map(b => b.id);
    if(orfaos.length > 0) html += gerarCard("Sem Grupo", "-", orfaos, true);

    container.innerHTML = html;
    if (typeof feather !== 'undefined') feather.replace();
}

function gerarCard(nome, lider, ids, alert = false) {
    ids.sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
    
    const items = ids.map(id => {
        const d = dadosDiaAtual[id] || {};
        const st = getStatus(d);
        // Tooltip mostra operação
        const titulo = d.operacao ? d.operacao : (isManutencao(d) ? d.manutencao : 'Sem apontamento');
        
        return `
            <div onclick="abrirAtualizacao('${id}')" 
                 class="flex flex-col items-center justify-center p-2 rounded border cursor-pointer hover:-translate-y-1 transition ${st.bg} ${st.border} h-16 relative group"
                 title="${titulo}">
                <span class="text-xs font-black">${id}</span>
                ${st.icon ? `<div class="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow border border-slate-100"><i data-feather="${st.icon}" class="w-3 h-3"></i></div>` : ''}
            </div>
        `;
    }).join('');

    const op = ids.filter(id => { const d = dadosDiaAtual[id] || {}; return d.operacao && !isManutencao(d); }).length;
    const mn = ids.filter(id => { const d = dadosDiaAtual[id] || {}; return isManutencao(d); }).length;

    const colorClass = alert ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-white";
    const headerClass = alert ? "bg-orange-100 border-orange-200" : "bg-slate-50 border-slate-100";

    return `
        <div class="card-modern rounded-xl shadow-sm border overflow-hidden flex flex-col ${colorClass}">
            <div class="px-4 py-3 border-b flex justify-between items-center ${headerClass}">
                <div>
                    <h3 class="font-bold text-sm uppercase flex items-center gap-2">
                        ${alert ? '<i data-feather="alert-triangle" class="w-4 h-4 text-orange-600"></i>' : ''} ${nome}
                    </h3>
                    <p class="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5"><i data-feather="user" class="w-3 h-3"></i> ${lider}</p>
                </div>
                <div class="text-[10px] font-bold text-right">
                    <span class="block bg-white px-2 py-0.5 rounded border border-slate-200 mb-1 text-slate-600">${ids.length} Equip.</span>
                    <div class="flex justify-end gap-2">
                        ${op > 0 ? `<span class="text-emerald-600">OP:${op}</span>` : ''} 
                        ${mn > 0 ? `<span class="text-red-600">MN:${mn}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="p-3 grid grid-cols-4 gap-2 bg-white flex-1 content-start">${items}</div>
        </div>
    `;
}

// --- TABELA DE FROTA (COM CORES E FILTROS) ---

function renderFrotaTable() {
    const tbody = document.getElementById('frota-table-body');
    if (!tbody) return;
    tbody.innerHTML = ''; 

    const filtroTexto = document.getElementById('search-input')?.value.toLowerCase() || "";
    const filtroStatus = document.getElementById('filtro-status')?.value || "";
    const filtroGrupo = document.getElementById('filtro-grupo')?.value || "";

    let contagemVisivel = 0;

    baseFixa.forEach(itemBase => {
        const dadosOp = dadosDiaAtual[itemBase.id] || { 
            operacao: "", codigo: itemBase.codigo, os: "", manutencao: "", fundo: "", fazenda: "", implemento: "" 
        };

        const textoBusca = (itemBase.id + dadosOp.fazenda + dadosOp.operacao + dadosOp.manutencao).toLowerCase();
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
            <td class="text-center font-mono text-slate-700 font-bold text-sm">${formatarListaVertical(dadosOp.codigo || '-')}</td>
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

// --- FUNÇÕES DE CONFIGURAÇÃO ---

function abrirConfigGrupos() {
    const modal = document.getElementById('modal-config-grupos');
    const container = document.getElementById('container-config-grupos');
    if(!modal || !container) return;

    container.innerHTML = '';

    for (const [nomeGrupo, info] of Object.entries(gruposAtivos)) {
        container.innerHTML += `
            <div class="bg-slate-50 p-4 rounded border border-slate-200 shadow-sm">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Grupo</label>
                        <input class="input-grupo-nome input-modern text-sm font-bold bg-white" value="${nomeGrupo}" readonly>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Líder</label>
                        <input class="input-grupo-lider input-modern text-sm border-emerald-200" value="${info.lider}" data-grupo="${nomeGrupo}">
                    </div>
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Equipamentos</label>
                    <textarea class="input-grupo-equips input-modern w-full h-16 text-xs font-mono" 
                              data-grupo="${nomeGrupo}" 
                              onblur="formatarIds(this)">${info.equipamentos.join(', ')}</textarea>
                </div>
            </div>
        `;
    }
    modal.classList.add('active');
}

window.formatarIds = function(el) {
    if(!el) return;
    let valor = el.value;
    let idsLimpos = valor.replace(/[\n\r\s]+/g, ',').replace(/[^0-9,]/g, '').split(',').map(s=>s.trim()).filter(s=>s !== "");
    idsLimpos = [...new Set(idsLimpos)];
    el.value = idsLimpos.join(', ');
};

async function salvarConfigGrupos() {
    const inputsLider = document.querySelectorAll('.input-grupo-lider');
    const inputsEquips = document.querySelectorAll('.input-grupo-equips');
    let novaConfig = {};
    let erros = [];

    inputsLider.forEach((inp, index) => {
        const nomeGrupo = inp.getAttribute('data-grupo');
        const lider = inp.value;
        const textEquips = inputsEquips[index].value;
        const listaEquips = textEquips.split(',').map(s => s.trim()).filter(s => s !== "");
            
        const invalidos = listaEquips.filter(id => !baseFixa.find(b => b.id === id));
        if(invalidos.length > 0) erros.push(`Grupo '${nomeGrupo}': IDs inválidos (${invalidos.join(', ')})`);

        novaConfig[nomeGrupo] = { lider: lider, equipamentos: listaEquips };
    });

    if(erros.length > 0) {
        alert("Corrija os erros:\n" + erros.join('\n'));
        return;
    }

    try {
        await salvarConfiguracaoGrupos(novaConfig);
        document.getElementById('modal-config-grupos').classList.remove('active');
        mostrarToast("Configuração salva!", "success");
    } catch (error) {
        mostrarToast("Erro ao salvar.", "error");
        console.error(error);
    }
}

function resetarGruposPadrao() {
    if(confirm("Restaurar padrão?")) {
        salvarConfiguracaoGrupos(mapaGruposPadrao);
        mostrarToast("Padrão restaurado!", "success");
    }
}

// --- FUNÇÕES DE APONTAMENTO (MODAL) ---

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
    
    // Recupera e processa Fundos
    if (d.fundo) {
        // Divide string por barra e limpa espaços
        const arr = d.fundo.toString().split('/').map(s => s.trim());
        arr.forEach(c => { 
            // Verifica se o código existe no mapaFundos
            if(c && mapaFundos[c]) fundosSelecionados.push(c); 
        });
    }
    renderizarFundos();
    atualizarCamposFundos();

    // Recupera e processa Operações
    if (d.operacao) {
        const arr = d.operacao.toString().split('/').map(s => s.trim());
        arr.forEach(op => { 
            // Verifica se a operação existe
            if(op && mapaOperacoes[op]) operacoesSelecionadas.push(op); 
        });
    }
    // Se a operação não for múltipla e não estiver no mapa, tenta pegar o texto direto
    if (operacoesSelecionadas.length === 0 && d.operacao) {
        // Caso seja texto livre ou operação não mapeada
        inpBuscaOp.value = d.operacao;
    }

    renderizarOperacoes();
    atualizarCamposOperacoes();

    if(modal) modal.classList.add('active');
}

function fecharModal() {
    const modal = document.getElementById('modal-atualizacao');
    if(modal) modal.classList.remove('active');
}

async function lidarComSalvamento(e) {
    e.preventDefault();
    const id = document.getElementById('input-equipamento').value;
    
    const opInput = document.getElementById('input-busca-operacao').value;
    // Usa lista de seleção ou o input direto
    let listaOps = operacoesSelecionadas.length > 0 ? operacoesSelecionadas : (opInput ? [opInput] : []);
    
    const operacaoFinal = listaOps.join(' / ');
    const codigoFinal = listaOps.map(nome => mapaOperacoes[nome] || "").filter(c => c !== "").join(" / ");

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

// --- HELPERS (ADD/REMOVE FUNDOS) ---

function adicionarFundo() {
    const input = document.getElementById('input-busca-fundo');
    const codigo = input.value.trim().split(' ')[0]; 
    if (!codigo) return; 
    
    // Validação correta usando mapaFundos
    if (!mapaFundos[codigo]) { mostrarToast("Fundo não encontrado", "error"); return; }
    
    if (fundosSelecionados.includes(codigo)) { input.value = ''; return; }
    fundosSelecionados.push(codigo);
    renderizarFundos();
    atualizarCamposFundos();
    input.value = ''; input.focus();
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
    // Mapeia códigos para nomes usando mapaFundos
    const nomes = fundosSelecionados.map(c => mapaFundos[c] || c).join(' / ');
    document.getElementById('input-fazenda').value = nomes;
}

function adicionarOperacao() {
    const input = document.getElementById('input-busca-operacao');
    const nome = input.value.trim();
    if (!nome) return;
    
    // Validação correta usando mapaOperacoes
    if (!mapaOperacoes[nome]) { mostrarToast("Operação não listada", "error"); return; }
    
    if (operacoesSelecionadas.includes(nome)) { input.value = ''; return; }
    operacoesSelecionadas.push(nome);
    renderizarOperacoes();
    atualizarCamposOperacoes();
    input.value = ''; input.focus();
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

// --- UTILS ---

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

function formatarListaVertical(texto, classeExtra = "") {
    if (!texto) return '<span class="text-slate-300">--</span>';
    const strTexto = texto.toString();
    const isBadge = classeExtra.includes('badge'); 
    
    if (strTexto.includes('/')) {
        const itens = strTexto.split('/');
        return itens.map(item => {
            const val = item.trim();
            if (isBadge) return `<div class="inline-block mb-1 ${classeExtra}">${val}</div><br>`;
            else return `<div class="whitespace-nowrap ${classeExtra}">- ${val}</div>`;
        }).join('');
    }
    
    if (isBadge) return `<span class="${classeExtra}">${strTexto}</span>`;
    return `<div class="${classeExtra}">${strTexto}</div>`;
}

function popularDatalists() {
    const dlFundo = document.getElementById('lista-fundos-sugestao');
    if(dlFundo) {
        dlFundo.innerHTML = '';
        Object.keys(mapaFundos).forEach(cod => {
            const opt = document.createElement('option');
            opt.value = cod;
            opt.label = mapaFundos[cod]; // IMPORTANTE: Exibe o nome correto
            dlFundo.appendChild(opt);
        });
    }
    const dlOp = document.getElementById('lista-operacoes');
    if(dlOp) {
        dlOp.innerHTML = '';
        Object.keys(mapaOperacoes).forEach(op => {
            const opt = document.createElement('option');
            opt.value = op;
            opt.label = "Cód: " + mapaOperacoes[op]; // Exibe o código
            dlOp.appendChild(opt);
        });
    }
}

function setupSearch() {
    const inputs = ['search-input', 'filtro-status', 'filtro-grupo'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', () => renderFrotaTable());
    });
}

function exportarExcel() {
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += `RELATÓRIO DIÁRIO - DATA: ${dataSelecionada}\n`;
    csv += "Equipamento;Código;Fundo;Fazenda;Operação;Implemento;O.S.;Manutenção\n";
    baseFixa.forEach(item => {
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

function updateDashboardStats() {
    const total = baseFixa.length;
    let emManutencao = 0;
    Object.values(dadosDiaAtual).forEach(op => {
        if(isManutencao(op)) emManutencao++;
    });
    const operando = total - emManutencao;

    const ids = ['dash-total-operando', 'dash-total-manutencao', 'total-operando', 'total-manutencao'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.textContent = id.includes('manutencao') ? emManutencao : operando;
    });
    if(document.getElementById('total-frota')) document.getElementById('total-frota').textContent = total;
}

function mostrarToast(mensagem, tipo = 'success') {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = tipo === 'success' ? `<i data-feather="check-circle" class="w-4 h-4"></i> ${mensagem}` : `<i data-feather="alert-circle" class="w-4 h-4"></i> ${mensagem}`;
    toast.className = `toast show ${tipo}`;
    if (typeof feather !== 'undefined') feather.replace();
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}