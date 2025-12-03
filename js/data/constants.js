// Arquivo: js/data/constants.js

export const baseFixa = [
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

export const mapaFundos = {
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

export const mapaOperacoes = {
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