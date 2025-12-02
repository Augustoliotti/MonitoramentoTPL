import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURAÇÃO DO FIREBASE (Sua Chave Real) ---
const firebaseConfig = {
  apiKey: "AIzaSyD9M4nTZjQcKPDNGNh4RJyBomQeOyGb0yM",
  authDomain: "monitoramentotpl-17aa3.firebaseapp.com",
  projectId: "monitoramentotpl-17aa3",
  storageBucket: "monitoramentotpl-17aa3.firebasestorage.app",
  messagingSenderId: "418904686486",
  appId: "1:418904686486:web:6e0a679546ef81887ae7b7",
  measurementId: "G-21QGLJV6MD"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 1. BASE DE DADOS FIXA ---
const baseFixa = [
    { id: "11116", codigo: "3019" }, { id: "11118", codigo: "3005" }, { id: "11121", codigo: "1013" },
    { id: "11125", codigo: "1031" }, { id: "11216", codigo: "1016" }, { id: "11218", codigo: "1018" },
    { id: "11221", codigo: "3028" }, { id: "11225", codigo: "1031" }, { id: "11316", codigo: "1035" },
    { id: "11318", codigo: "3023" }, { id: "11321", codigo: "3008" }, { id: "11324", codigo: "1020" },
    { id: "11416", codigo: "3028" }, { id: "11418", codigo: "1073" }, { id: "11421", codigo: "1014" },
    { id: "11424", codigo: "1073" }, { id: "11516", codigo: "3010" }, { id: "11518", codigo: "1022" },
    { id: "11524", codigo: "1020" }, { id: "11616", codigo: "3029" }, { id: "11618", codigo: "1073" },
    { id: "11718", codigo: "1073" }, { id: "11124", codigo: "1091" }, { id: "11224", codigo: "1090" },
    { id: "329",   codigo: "1055" }, { id: "340",   codigo: "1078" }, { id: "527",   codigo: ""     },
    { id: "543",   codigo: "3028" }, { id: "724",   codigo: "1016" }, { id: "726",   codigo: "3028" },
    { id: "732",   codigo: "3029" }, { id: "50116", codigo: "1003" }, { id: "50118", codigo: "1003" },
    { id: "60116", codigo: "3010" }, { id: "70121", codigo: "1031" }, { id: "70122", codigo: "1031" },
    { id: "1001",  codigo: "" },     { id: "1002",  codigo: "" },     { id: "1003",  codigo: "" },
    { id: "1004",  codigo: "" },     { id: "1005",  codigo: "" }
];

// --- 2. MAPEAMENTOS ---
const mapaFundos = {
    "195101": "FAZENDA SANTA RITA II", "34703": "34703-FAZENDA PAULICEIA", "34702": "34702-FAZENDA SANTA GENOVEVA",
    "81563": "FAZENDA SÃO LUIZ III", "33501": "33501-FAZENDA SANTA IZILDA", "43101": "43101-SITIO SANTA CLELIA",
    "35101": "35101-FAZENDA PALMITAL", "41001": "41001-SITIO SANTA MARINA", "53201": "53201-FAZENDA SANTA RITA",
    "70417": "SÃO LUIZ III", "125001": "125001-SITIO SANTA CATARINA", "32301": "32301-SITIO PRIMAVERA GLEBA B",
    "195204": "CERVO (SUISSO)", "34704": "34704-FAZENDA PALMEIRAS AGRIAO", "40001": "40001-SITIO SANTA HELENA",
    "37342": "37342-SITIO DA ESPERANCA", "48601": "48601-FAZENDA SANTA JOSEFINA", "34601": "34601-FAZENDA SANTA RITA",
    "42101": "42101-SITIO SÃO GABRIEL", "32002": "SITIO SANTO ANTONIO", "39901": "FAZENDA AGRÍCOLA FUN",
    "37339": "37339-AREA CRT 078A", "144002": "Sitio São João", "43301": "43301-SITIO SAO JOSE GLEBA C",
    "52501": "52501-FAZENDA SANTA TEREZINHA", "65102": "65102-FAZENDA SANTA CLELIA", "40301": "40301-SITIO CERVO",
    "41601": "41601-SITIO NOSSA SENHORA APARECIDA", "42601": "42601-SITIO FORTALEZA II", "34801": "34801-FAZENDA ARIZONA",
    "41501": "FAZENDA SUIÇO", "50201": "50201-SITIO TRES IRMAOS I", "72101": "72101-FAZENDA SERRA ALPES",
    "38201": "38201-SITIO SAO JOSE", "195205": "SANTA ANTONINA", "71201": "71201-SITIO SANTA MARINA",
    "42801": "42801-SITIO CEDRO", "195206": "SANTA INES II", "50301": "50301-SITIO TRES IRMAOS II",
    "40401": "40401-SITIO SAO JOAO", "39002": "SITIO SÃO PEDRO", "51101": "51101-SITIO SAO RAFAEL VI",
    "38301": "38301-FAZENDA SANTA RITA", "33801": "33801-FAZENDA SANTA CRISTINA", "67901": "67901-SITIO SANTA HELENA",
    "31801": "31801-FAZENDA PAINEIRAS", "35902": "35902-FAZENDA SANTA RITA", "34708": "34708-FAZENDA SAO ROQUE",
    "41801": "41801-SITIO BOA VENTURA", "195201": "SAO JOSE (BEATO)", "50001": "50001-SITIO CORREGO GRANDE",
    "61601": "61601-SITIO SANTA ROSA", "36501": "36501-SITIO SANTA RITA", "195004": "CASSIANO",
    "30901": "30901-SITIO FORTALEZA", "34701": "34701-FAZENDA BURITI", "30001": "30001-SITIO ESTIVA PALMITAL",
    "30101": "30101-SITIO MARINHA", "910001": "910001-USINA PITANGUEIRAS", "233801": "FAZENDA FAZENDINHA",
    "39203": "FAZENDA SANTA MARINA", "195203": "BREJÃO", "39903": "FAZENDA AGRICOLA FUN2"
};

const mapaOperacoes = {
    "Aguardando Manutenção Borracharia": "3019", "Aplicação de Herbicida": "1031", "Subsolagem": "1016",
    "Pátio Oficina": "3028", "Oficina Externa Barretos": "1035", "Aguardando Mecanico": "3023",
    "CATACAO QUIMICA": "1091", "Segunda Aplicacao de Herbicida": "1078", "Condicoes Climaticas": "3008",
    "Patio De Tratores": "3029", "SEM OPERAÇÃO": "3072", "Apl inseticida em profundidade": "1073",
    "Sulcação": "1018", "Cultivo": "1022", "Conservação de Estradas": "1003", "Lavagem Lubrificacao": "3010",
    "Gradem Intermediaria": "1014", "Quebra Lombo": "1020", "Aguardando Mecanico Terceiros": "3030",
    "Manutenção Implemento": "3082", "Gradagem Aradora": "1013", "APLIC VINHACA COM FERTILIZANTE": "1092",
    "Enfardamento De Palha": "1061", "TRAÇÃO MOTOBOMBA": "1050", "Aplicação Mista - Correção Solo": "1071",
    "Terraceamento": "1001", "Terraplanagem": "1002", "Gradagem Niveladora": "1015",
    "Destruição De Soqueira Sph": "1019", "Manutencao Oficina": "3009", "Aguardando Ordem": "3005"
};

// --- 3. GESTÃO DE DADOS (FIREBASE) ---
let dadosDiaAtual = {}; 
let dataSelecionada = ""; 
let unsubscribe = null; 

document.addEventListener('DOMContentLoaded', function() {
    if (typeof feather !== 'undefined') feather.replace();

    const inputData = document.getElementById('input-data-selecionada');
    
    // Define data inicial
    const hoje = new Date().toISOString().split('T')[0];
    const ultimaData = localStorage.getItem('ultimaDataSelecionada');
    dataSelecionada = ultimaData || hoje;
    
    if (inputData) {
        inputData.value = dataSelecionada;
        inputData.addEventListener('change', function(e) {
            dataSelecionada = e.target.value;
            localStorage.setItem('ultimaDataSelecionada', dataSelecionada);
            carregarDadosFirebase(); 
        });
    }

    // Configura botões e selects
    setupAutoFill(); 
    popularDatalists();
    setupSearch();
    
    // Listener para o formulário
    const form = document.getElementById('form-atualizacao');
    if(form) form.addEventListener('submit', salvarAtualizacao);
    
    // Torna funções acessíveis globalmente
    window.fecharModal = fecharModal;
    window.abrirAtualizacao = abrirAtualizacao;
    window.exportarExcel = exportarExcel;
    
    // Carrega dados iniciais
    carregarDadosFirebase();
});

// --- FUNÇÃO PARA CARREGAR DADOS DO FIREBASE EM TEMPO REAL ---
function carregarDadosFirebase() {
    if (unsubscribe) {
        unsubscribe();
    }

    const docRef = doc(db, "diario_frota", dataSelecionada);

    unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            dadosDiaAtual = docSnap.data();
        } else {
            dadosDiaAtual = {}; 
        }
        renderFrotaTable();
        updateDashboard();
    }, (error) => {
        console.error("Erro ao ler dados:", error);
    });
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
        } else if (dadosOp.operacao === "") {
             statusClass = '';
        } else {
            statusClass = 'badge badge-green';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="font-bold text-slate-700">${itemBase.id}</span></td>
            <td class="text-center font-mono text-slate-500">${dadosOp.codigo || '-'}</td>
            <td>
                ${dadosOp.operacao ? `<span class="${statusClass}">${dadosOp.operacao}</span>` : '<span class="text-slate-300">--</span>'}
            </td>
            
            <td class="text-slate-700 font-bold">${dadosOp.fundo || ''}</td>
            <td class="text-slate-700 font-bold text-xs">${dadosOp.fazenda || ''}</td>
            
            <td>
                ${dadosOp.implemento ? `<span class="badge bg-blue-100 text-blue-800">${dadosOp.implemento}</span>` : ''}
            </td>

            <td>
                ${dadosOp.os ? `<span class="badge bg-blue-100 text-blue-800">${dadosOp.os}</span>` : ''}
            </td>
            
            <td>
                ${dadosOp.manutencao ? `<span class="badge badge-red" title="${dadosOp.manutencao}">${dadosOp.manutencao}</span>` : ''}
            </td>
            
            <td class="text-center">
                <button onclick="abrirAtualizacao('${itemBase.id}')" class="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-full transition">
                    <i data-feather="edit-3" style="width:16px; height:16px;"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    if (typeof feather !== 'undefined') feather.replace();
    if(document.getElementById('table-count')) document.getElementById('table-count').textContent = baseFixa.length;
}

// --- SALVAR DADOS NO FIREBASE ---
async function salvarAtualizacao(event) {
    event.preventDefault();
    const id = document.getElementById('input-equipamento').value;
    const operacaoNome = document.getElementById('input-operacao').value.trim();
    
    let codigoOp = "";
    if (mapaOperacoes[operacaoNome]) {
        codigoOp = mapaOperacoes[operacaoNome];
    } else {
        const nomeEncontrado = Object.keys(mapaOperacoes).find(key => mapaOperacoes[key] === operacaoNome);
        if (nomeEncontrado) codigoOp = operacaoNome; 
    }

    const novosDados = {
        operacao: operacaoNome,
        codigo: codigoOp, 
        os: document.getElementById('input-os').value,
        manutencao: document.getElementById('input-manutencao').value,
        fundo: document.getElementById('input-fundo').value,
        fazenda: document.getElementById('input-fazenda').value,
        implemento: document.getElementById('input-implemento').value
    };

    try {
        const docRef = doc(db, "diario_frota", dataSelecionada);
        await setDoc(docRef, {
            [id]: novosDados
        }, { merge: true });
        
        fecharModal();
    } catch (e) {
        console.error("Erro ao salvar: ", e);
        alert("Erro ao salvar os dados.");
    }
}

function abrirAtualizacao(id) {
    const modal = document.getElementById('modal-atualizacao');
    const itemBase = baseFixa.find(i => i.id === id);
    if (!itemBase) return;

    const dadosOp = dadosDiaAtual[id] || { 
        operacao: "", codigo: itemBase.codigo, os: "", manutencao: "", fundo: "", fazenda: "", implemento: "" 
    };

    document.getElementById('input-equipamento').value = itemBase.id;
    document.getElementById('input-fundo').value = dadosOp.fundo;
    document.getElementById('input-fazenda').value = dadosOp.fazenda;
    document.getElementById('input-operacao').value = dadosOp.operacao;
    document.getElementById('input-os').value = dadosOp.os;
    document.getElementById('input-manutencao').value = dadosOp.manutencao;
    document.getElementById('input-implemento').value = dadosOp.implemento || '';

    modal.classList.add('active');
    
    if(dadosOp.fundo) document.getElementById('input-fundo').dispatchEvent(new Event('input'));
}

function fecharModal() {
    document.getElementById('modal-atualizacao').classList.remove('active');
}

function setupAutoFill() {
    const inputFundo = document.getElementById('input-fundo');
    const inputFazenda = document.getElementById('input-fazenda');
    
    if(inputFundo && inputFazenda) {
        const atualizarFazenda = () => {
            const codigo = inputFundo.value.trim();
            if (mapaFundos[codigo]) {
                inputFazenda.value = mapaFundos[codigo];
                inputFazenda.classList.add('bg-green-50'); 
                setTimeout(() => inputFazenda.classList.remove('bg-green-50'), 500);
            } else {
                inputFazenda.value = ""; 
            }
        };
        inputFundo.addEventListener('input', atualizarFazenda);
        inputFundo.addEventListener('change', atualizarFazenda);
    }
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