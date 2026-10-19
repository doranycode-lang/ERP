export interface Parametro {
  nome: string;
  unidade: string;
  refMin?: string;
  refMax?: string;
  refTexto?: string;
  tipo: "numerico" | "texto" | "selecao";
  opcoes?: string[];
}

export interface ExameBuiltin {
  codigo?: string;
  categoria: string;
  nome: string;
  parametros: Parametro[];
  preco?: number;
  prazo?: string;
}

export const EXAMES_BUILTIN: ExameBuiltin[] = [

  /* ═══════════════════════════════════════════════════════
     HEMATOLOGIA
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Hematologia",
    nome: "Hemograma Completo",
    parametros: [
      { nome: "Hemoglobina", unidade: "g/dL", refMin: "12.0", refMax: "17.0", tipo: "numerico" },
      { nome: "Hematócrito", unidade: "%", refMin: "36", refMax: "50", tipo: "numerico" },
      { nome: "Eritrócitos", unidade: "×10⁶/µL", refMin: "4.0", refMax: "6.0", tipo: "numerico" },
      { nome: "VCM", unidade: "fL", refMin: "80", refMax: "100", tipo: "numerico" },
      { nome: "HCM", unidade: "pg", refMin: "27", refMax: "33", tipo: "numerico" },
      { nome: "CHCM", unidade: "g/dL", refMin: "32", refMax: "36", tipo: "numerico" },
      { nome: "RDW-CV", unidade: "%", refMin: "11.5", refMax: "14.5", tipo: "numerico" },
      { nome: "Leucócitos", unidade: "×10³/µL", refMin: "4.0", refMax: "11.0", tipo: "numerico" },
      { nome: "Neutrófilos (%)", unidade: "%", refMin: "50", refMax: "70", tipo: "numerico" },
      { nome: "Neutrófilos (abs.)", unidade: "×10³/µL", refMin: "1.8", refMax: "7.7", tipo: "numerico" },
      { nome: "Linfócitos (%)", unidade: "%", refMin: "20", refMax: "40", tipo: "numerico" },
      { nome: "Linfócitos (abs.)", unidade: "×10³/µL", refMin: "1.0", refMax: "4.8", tipo: "numerico" },
      { nome: "Monócitos (%)", unidade: "%", refMin: "2", refMax: "8", tipo: "numerico" },
      { nome: "Monócitos (abs.)", unidade: "×10³/µL", refMin: "0.2", refMax: "0.8", tipo: "numerico" },
      { nome: "Eosinófilos (%)", unidade: "%", refMin: "1", refMax: "4", tipo: "numerico" },
      { nome: "Eosinófilos (abs.)", unidade: "×10³/µL", refMin: "0.0", refMax: "0.5", tipo: "numerico" },
      { nome: "Basófilos (%)", unidade: "%", refMin: "0", refMax: "1", tipo: "numerico" },
      { nome: "Basófilos (abs.)", unidade: "×10³/µL", refMin: "0.0", refMax: "0.1", tipo: "numerico" },
      { nome: "Plaquetas", unidade: "×10³/µL", refMin: "150", refMax: "400", tipo: "numerico" },
      { nome: "VPM", unidade: "fL", refMin: "7.5", refMax: "12.5", tipo: "numerico" },
    ],
  },
  {
    categoria: "Hematologia",
    nome: "Reticulócitos",
    parametros: [
      { nome: "Reticulócitos (%)", unidade: "%", refMin: "0.5", refMax: "2.5", tipo: "numerico" },
      { nome: "Reticulócitos (abs.)", unidade: "×10³/µL", refMin: "25", refMax: "100", tipo: "numerico" },
    ],
  },
  {
    categoria: "Hematologia",
    nome: "Grupo Sanguíneo e Fator Rh",
    parametros: [
      { nome: "Grupo Sanguíneo", unidade: "", tipo: "selecao", opcoes: ["A", "B", "AB", "O"] },
      { nome: "Fator Rh", unidade: "", tipo: "selecao", opcoes: ["Positivo (+)", "Negativo (-)"] },
      { nome: "Fenotipagem Rh", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Hematologia",
    nome: "VS — Velocidade de Sedimentação",
    parametros: [
      { nome: "VS 1ª hora", unidade: "mm/h", refMin: "0", refMax: "20", tipo: "numerico" },
      { nome: "VS 2ª hora", unidade: "mm/2h", refMin: "0", refMax: "40", tipo: "numerico" },
    ],
  },
  {
    categoria: "Hematologia",
    nome: "Coagulação — Painel Básico",
    parametros: [
      { nome: "Tempo de Protrombina (TP)", unidade: "s", refMin: "11", refMax: "15", tipo: "numerico" },
      { nome: "Actividade de Protrombina", unidade: "%", refMin: "70", refMax: "120", tipo: "numerico" },
      { nome: "INR", unidade: "", refMin: "0.8", refMax: "1.2", tipo: "numerico" },
      { nome: "TTPa", unidade: "s", refMin: "25", refMax: "38", tipo: "numerico" },
      { nome: "Ratio TTPa", unidade: "", refMin: "0.8", refMax: "1.2", tipo: "numerico" },
      { nome: "Tempo de Trombina (TT)", unidade: "s", refMin: "14", refMax: "21", tipo: "numerico" },
      { nome: "Fibrinogénio", unidade: "mg/dL", refMin: "200", refMax: "400", tipo: "numerico" },
    ],
  },
  {
    categoria: "Hematologia",
    nome: "Coagulação — Painel Avançado",
    parametros: [
      { nome: "D-dímero", unidade: "µg/mL FEU", refMin: "0.0", refMax: "0.5", tipo: "numerico" },
      { nome: "Antitrombina III", unidade: "%", refMin: "80", refMax: "120", tipo: "numerico" },
      { nome: "Proteína C", unidade: "%", refMin: "70", refMax: "140", tipo: "numerico" },
      { nome: "Proteína S livre", unidade: "%", refMin: "65", refMax: "140", tipo: "numerico" },
      { nome: "Factor V de Leiden", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Heterozigoto", "Homozigoto"] },
      { nome: "Mutação do Gene da Protrombina G20210A", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Heterozigoto", "Homozigoto"] },
      { nome: "Resistência à Proteína C Activada (RPCA)", unidade: "", tipo: "selecao", opcoes: ["Normal", "Alterado"] },
      { nome: "Homocisteína", unidade: "µmol/L", refMin: "5", refMax: "15", tipo: "numerico" },
    ],
  },
  {
    categoria: "Hematologia",
    nome: "Electroforese de Hemoglobinas",
    parametros: [
      { nome: "HbA1", unidade: "%", refMin: "95", refMax: "98", tipo: "numerico" },
      { nome: "HbA2", unidade: "%", refMin: "1.5", refMax: "3.5", tipo: "numerico" },
      { nome: "HbF (fetal)", unidade: "%", refMin: "0.0", refMax: "2.0", tipo: "numerico" },
      { nome: "HbS", unidade: "%", refMin: "0.0", refMax: "0.0", tipo: "numerico" },
      { nome: "HbC", unidade: "%", refMin: "0.0", refMax: "0.0", tipo: "numerico" },
      { nome: "Outras Hb", unidade: "%", refMin: "0.0", refMax: "1.0", tipo: "numerico" },
      { nome: "Interpretação", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Hematologia",
    nome: "Pesquisa de Células Falciformes (Drepanocitose)",
    parametros: [
      { nome: "Teste de Falcização", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Resultado HbSS/HbAS", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Hematologia",
    nome: "Ferro Sérico e Reservas",
    parametros: [
      { nome: "Ferro Sérico", unidade: "µg/dL", refMin: "60", refMax: "170", tipo: "numerico" },
      { nome: "Ferritina", unidade: "ng/mL", refMin: "12", refMax: "300", tipo: "numerico" },
      { nome: "Capacidade Total de Ligação do Ferro (TIBC)", unidade: "µg/dL", refMin: "250", refMax: "370", tipo: "numerico" },
      { nome: "Capacidade Não Saturada de Ligação (UIBC)", unidade: "µg/dL", refMin: "130", refMax: "290", tipo: "numerico" },
      { nome: "Saturação da Transferrina", unidade: "%", refMin: "20", refMax: "50", tipo: "numerico" },
      { nome: "Transferrina", unidade: "mg/dL", refMin: "200", refMax: "360", tipo: "numerico" },
    ],
  },
  {
    categoria: "Hematologia",
    nome: "Esfregaço de Sangue Periférico",
    parametros: [
      { nome: "Morfologia eritrocitária", unidade: "", tipo: "texto" },
      { nome: "Morfologia leucocitária", unidade: "", tipo: "texto" },
      { nome: "Morfologia plaquetária", unidade: "", tipo: "texto" },
      { nome: "Células anormais", unidade: "", tipo: "selecao", opcoes: ["Não observadas", "Presentes (ver descrição)"] },
      { nome: "Conclusão", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Hematologia",
    nome: "Teste de Coombs",
    parametros: [
      { nome: "Coombs Directo (DAT)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo +", "Positivo ++", "Positivo +++"] },
      { nome: "Coombs Indirecto (IAT)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo +", "Positivo ++", "Positivo +++"] },
    ],
  },
  {
    categoria: "Hematologia",
    nome: "Contagem de CD4 e CD8",
    parametros: [
      { nome: "CD4+ (abs.)", unidade: "células/µL", refMin: "500", refMax: "1500", tipo: "numerico" },
      { nome: "CD4+ (%)", unidade: "%", refMin: "28", refMax: "57", tipo: "numerico" },
      { nome: "CD8+ (abs.)", unidade: "células/µL", refMin: "180", refMax: "1000", tipo: "numerico" },
      { nome: "CD8+ (%)", unidade: "%", refMin: "10", refMax: "39", tipo: "numerico" },
      { nome: "Ratio CD4/CD8", unidade: "", refMin: "1.0", refMax: "3.5", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     BIOQUÍMICA — FUNÇÃO RENAL
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Função Renal",
    nome: "Bioquímica Renal Básica",
    parametros: [
      { nome: "Ureia", unidade: "mg/dL", refMin: "15", refMax: "45", tipo: "numerico" },
      { nome: "Creatinina sérica", unidade: "mg/dL", refMin: "0.6", refMax: "1.2", tipo: "numerico" },
      { nome: "TFG estimada (CKD-EPI)", unidade: "mL/min/1.73m²", refMin: "60", refMax: "120", tipo: "numerico" },
      { nome: "Ácido Úrico", unidade: "mg/dL", refMin: "2.5", refMax: "7.0", tipo: "numerico" },
      { nome: "Cistatina C", unidade: "mg/L", refMin: "0.5", refMax: "1.0", tipo: "numerico" },
    ],
  },
  {
    categoria: "Função Renal",
    nome: "Electrólitos Séricos",
    parametros: [
      { nome: "Sódio (Na⁺)", unidade: "mEq/L", refMin: "135", refMax: "145", tipo: "numerico" },
      { nome: "Potássio (K⁺)", unidade: "mEq/L", refMin: "3.5", refMax: "5.0", tipo: "numerico" },
      { nome: "Cloro (Cl⁻)", unidade: "mEq/L", refMin: "96", refMax: "106", tipo: "numerico" },
      { nome: "Bicarbonato (HCO₃⁻)", unidade: "mEq/L", refMin: "22", refMax: "29", tipo: "numerico" },
      { nome: "Cálcio total", unidade: "mg/dL", refMin: "8.5", refMax: "10.5", tipo: "numerico" },
      { nome: "Cálcio iónico", unidade: "mmol/L", refMin: "1.15", refMax: "1.35", tipo: "numerico" },
      { nome: "Fósforo inorgânico", unidade: "mg/dL", refMin: "2.5", refMax: "4.5", tipo: "numerico" },
      { nome: "Magnésio (Mg²⁺)", unidade: "mg/dL", refMin: "1.7", refMax: "2.4", tipo: "numerico" },
    ],
  },
  {
    categoria: "Função Renal",
    nome: "Microalbuminúria (urina 24h ou spot)",
    parametros: [
      { nome: "Microalbuminúria", unidade: "mg/g creat", refMin: "0", refMax: "30", tipo: "numerico" },
      { nome: "Albumina urinária (24h)", unidade: "mg/24h", refMin: "0", refMax: "30", tipo: "numerico" },
      { nome: "Ratio Albumina/Creatinina (RAC)", unidade: "mg/g", refMin: "0", refMax: "30", tipo: "numerico" },
    ],
  },
  {
    categoria: "Função Renal",
    nome: "Proteinúria (urina 24h)",
    parametros: [
      { nome: "Proteínas totais (urina)", unidade: "mg/24h", refMin: "0", refMax: "150", tipo: "numerico" },
      { nome: "Creatinina urinária (24h)", unidade: "g/24h", refMin: "0.5", refMax: "2.5", tipo: "numerico" },
      { nome: "Clearance da Creatinina", unidade: "mL/min/1.73m²", refMin: "80", refMax: "120", tipo: "numerico" },
    ],
  },
  {
    categoria: "Função Renal",
    nome: "Beta-2 Microglobulina",
    parametros: [
      { nome: "Beta-2 Microglobulina sérica", unidade: "mg/L", refMin: "0.8", refMax: "2.2", tipo: "numerico" },
      { nome: "Beta-2 Microglobulina urinária", unidade: "µg/L", refMin: "0", refMax: "300", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     BIOQUÍMICA — FUNÇÃO HEPÁTICA
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Função Hepática",
    nome: "Painel Hepático Completo",
    parametros: [
      { nome: "AST (TGO)", unidade: "U/L", refMin: "10", refMax: "40", tipo: "numerico" },
      { nome: "ALT (TGP)", unidade: "U/L", refMin: "7", refMax: "56", tipo: "numerico" },
      { nome: "Fosfatase Alcalina (FA)", unidade: "U/L", refMin: "44", refMax: "147", tipo: "numerico" },
      { nome: "Gama-GT (GGT)", unidade: "U/L", refMin: "8", refMax: "61", tipo: "numerico" },
      { nome: "Bilirrubina Total", unidade: "mg/dL", refMin: "0.2", refMax: "1.2", tipo: "numerico" },
      { nome: "Bilirrubina Directa (conjugada)", unidade: "mg/dL", refMin: "0.0", refMax: "0.3", tipo: "numerico" },
      { nome: "Bilirrubina Indirecta", unidade: "mg/dL", refMin: "0.2", refMax: "0.9", tipo: "numerico" },
      { nome: "Proteínas Totais", unidade: "g/dL", refMin: "6.0", refMax: "8.3", tipo: "numerico" },
      { nome: "Albumina", unidade: "g/dL", refMin: "3.5", refMax: "5.0", tipo: "numerico" },
      { nome: "Globulinas", unidade: "g/dL", refMin: "2.0", refMax: "3.5", tipo: "numerico" },
      { nome: "Ratio Albumina/Globulina", unidade: "", refMin: "1.1", refMax: "2.5", tipo: "numerico" },
      { nome: "LDH (Lactato Desidrogenase)", unidade: "U/L", refMin: "135", refMax: "225", tipo: "numerico" },
    ],
  },
  {
    categoria: "Função Hepática",
    nome: "Electroforese de Proteínas Séricas",
    parametros: [
      { nome: "Albumina", unidade: "%", refMin: "55", refMax: "65", tipo: "numerico" },
      { nome: "Alfa-1 Globulinas", unidade: "%", refMin: "2", refMax: "4", tipo: "numerico" },
      { nome: "Alfa-2 Globulinas", unidade: "%", refMin: "6", refMax: "10", tipo: "numerico" },
      { nome: "Beta Globulinas", unidade: "%", refMin: "7", refMax: "12", tipo: "numerico" },
      { nome: "Gama Globulinas", unidade: "%", refMin: "11", refMax: "18", tipo: "numerico" },
    ],
  },
  {
    categoria: "Função Hepática",
    nome: "Colinesterase Sérica",
    parametros: [
      { nome: "Colinesterase (pseudo)", unidade: "U/L", refMin: "5300", refMax: "12900", tipo: "numerico" },
    ],
  },
  {
    categoria: "Função Hepática",
    nome: "5'-Nucleotidase",
    parametros: [
      { nome: "5'-Nucleotidase", unidade: "U/L", refMin: "0", refMax: "15", tipo: "numerico" },
    ],
  },
  {
    categoria: "Função Hepática",
    nome: "Amónia Sérica",
    parametros: [
      { nome: "Amónia (NH₃)", unidade: "µmol/L", refMin: "11", refMax: "35", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     GLICEMIA E DIABETES
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Glicemia e Diabetes",
    nome: "Glicemia em Jejum",
    parametros: [
      { nome: "Glicose em Jejum", unidade: "mg/dL", refMin: "70", refMax: "99", tipo: "numerico" },
    ],
  },
  {
    categoria: "Glicemia e Diabetes",
    nome: "HbA1c — Hemoglobina Glicada",
    parametros: [
      { nome: "HbA1c", unidade: "%", refMin: "4.0", refMax: "5.6", tipo: "numerico" },
      { nome: "HbA1c (mmol/mol)", unidade: "mmol/mol", refMin: "20", refMax: "38", tipo: "numerico" },
      { nome: "Glicemia média estimada", unidade: "mg/dL", refMin: "70", refMax: "115", tipo: "numerico" },
    ],
  },
  {
    categoria: "Glicemia e Diabetes",
    nome: "Teste de Tolerância à Glicose (PTOG 75g)",
    parametros: [
      { nome: "Glicose em Jejum (0h)", unidade: "mg/dL", refMin: "70", refMax: "99", tipo: "numerico" },
      { nome: "Glicose 1ª hora (60 min)", unidade: "mg/dL", refMin: "0", refMax: "180", tipo: "numerico" },
      { nome: "Glicose 2ª hora (120 min)", unidade: "mg/dL", refMin: "0", refMax: "140", tipo: "numerico" },
    ],
  },
  {
    categoria: "Glicemia e Diabetes",
    nome: "Insulinemia e HOMA",
    parametros: [
      { nome: "Insulina em Jejum", unidade: "µIU/mL", refMin: "2.6", refMax: "24.9", tipo: "numerico" },
      { nome: "Peptídeo C", unidade: "ng/mL", refMin: "0.9", refMax: "4.0", tipo: "numerico" },
      { nome: "HOMA-IR", unidade: "", refMin: "0", refMax: "2.7", tipo: "numerico" },
      { nome: "HOMA-β", unidade: "%", refMin: "100", refMax: "300", tipo: "numerico" },
    ],
  },
  {
    categoria: "Glicemia e Diabetes",
    nome: "Fructosamina",
    parametros: [
      { nome: "Fructosamina", unidade: "µmol/L", refMin: "204", refMax: "284", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     LIPIDOGRAMA
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Lipidograma",
    nome: "Perfil Lipídico Completo",
    parametros: [
      { nome: "Colesterol Total", unidade: "mg/dL", refMin: "0", refMax: "200", tipo: "numerico" },
      { nome: "LDL-colesterol", unidade: "mg/dL", refMin: "0", refMax: "130", tipo: "numerico" },
      { nome: "HDL-colesterol", unidade: "mg/dL", refMin: "40", refMax: "999", tipo: "numerico" },
      { nome: "VLDL-colesterol", unidade: "mg/dL", refMin: "0", refMax: "30", tipo: "numerico" },
      { nome: "Triglicerídeos", unidade: "mg/dL", refMin: "0", refMax: "150", tipo: "numerico" },
      { nome: "Colesterol não-HDL", unidade: "mg/dL", refMin: "0", refMax: "160", tipo: "numerico" },
      { nome: "Ratio Colesterol Total/HDL", unidade: "", refMin: "0", refMax: "5.0", tipo: "numerico" },
      { nome: "Ratio LDL/HDL", unidade: "", refMin: "0", refMax: "3.0", tipo: "numerico" },
    ],
  },
  {
    categoria: "Lipidograma",
    nome: "Apolipoproteínas",
    parametros: [
      { nome: "Apolipoproteína A1 (ApoA1)", unidade: "mg/dL", refMin: "115", refMax: "180", tipo: "numerico" },
      { nome: "Apolipoproteína B (ApoB)", unidade: "mg/dL", refMin: "50", refMax: "120", tipo: "numerico" },
      { nome: "Ratio ApoB/ApoA1", unidade: "", refMin: "0", refMax: "0.9", tipo: "numerico" },
    ],
  },
  {
    categoria: "Lipidograma",
    nome: "Lipoproteína(a)",
    parametros: [
      { nome: "Lp(a)", unidade: "mg/dL", refMin: "0", refMax: "30", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     CARDIOLOGIA — MARCADORES CARDÍACOS
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Marcadores Cardíacos",
    nome: "Painel de Enfarte Agudo do Miocárdio",
    parametros: [
      { nome: "Troponina I (cTnI)", unidade: "ng/mL", refMin: "0.0", refMax: "0.04", tipo: "numerico" },
      { nome: "Troponina T (cTnT)", unidade: "ng/L", refMin: "0", refMax: "14", tipo: "numerico" },
      { nome: "Troponina T altamente sensível (hs-cTnT)", unidade: "ng/L", refMin: "0", refMax: "19", tipo: "numerico" },
      { nome: "CK-MB massa", unidade: "ng/mL", refMin: "0.0", refMax: "5.0", tipo: "numerico" },
      { nome: "CK total", unidade: "U/L", refMin: "24", refMax: "195", tipo: "numerico" },
      { nome: "Mioglobina", unidade: "ng/mL", refMin: "28", refMax: "72", tipo: "numerico" },
    ],
  },
  {
    categoria: "Marcadores Cardíacos",
    nome: "Insuficiência Cardíaca",
    parametros: [
      { nome: "BNP (Peptídeo Natriurético tipo B)", unidade: "pg/mL", refMin: "0", refMax: "100", tipo: "numerico" },
      { nome: "NT-proBNP", unidade: "pg/mL", refMin: "0", refMax: "125", tipo: "numerico" },
      { nome: "MR-proANP", unidade: "pmol/L", refMin: "0", refMax: "120", tipo: "numerico" },
    ],
  },
  {
    categoria: "Marcadores Cardíacos",
    nome: "Proteína C-Reactiva de Alta Sensibilidade",
    parametros: [
      { nome: "PCR-hs (risco cardiovascular)", unidade: "mg/L", refMin: "0.0", refMax: "1.0", tipo: "numerico" },
    ],
  },
  {
    categoria: "Marcadores Cardíacos",
    nome: "Copeptina",
    parametros: [
      { nome: "Copeptina", unidade: "pmol/L", refMin: "0", refMax: "10", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     INFLAMAÇÃO E IMUNIDADE INATA
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Inflamação",
    nome: "Proteína C-Reactiva (PCR)",
    parametros: [
      { nome: "PCR quantitativa", unidade: "mg/L", refMin: "0.0", refMax: "5.0", tipo: "numerico" },
    ],
  },
  {
    categoria: "Inflamação",
    nome: "Procalcitonina (PCT)",
    parametros: [
      { nome: "Procalcitonina", unidade: "ng/mL", refMin: "0.0", refMax: "0.5", tipo: "numerico" },
      { nome: "Interpretação", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Inflamação",
    nome: "Interleucinas e Citocinas",
    parametros: [
      { nome: "IL-6 (Interleucina-6)", unidade: "pg/mL", refMin: "0", refMax: "7", tipo: "numerico" },
      { nome: "TNF-α", unidade: "pg/mL", refMin: "0", refMax: "8.1", tipo: "numerico" },
      { nome: "IL-1β", unidade: "pg/mL", refMin: "0", refMax: "5", tipo: "numerico" },
      { nome: "IL-10", unidade: "pg/mL", refMin: "0", refMax: "9.1", tipo: "numerico" },
    ],
  },
  {
    categoria: "Inflamação",
    nome: "Ferritina",
    parametros: [
      { nome: "Ferritina", unidade: "ng/mL", refMin: "12", refMax: "300", tipo: "numerico" },
    ],
  },
  {
    categoria: "Inflamação",
    nome: "Amilóide A Sérica (SAA)",
    parametros: [
      { nome: "Amilóide A Sérica (SAA)", unidade: "mg/L", refMin: "0", refMax: "6.4", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     FUNÇÃO TIROIDEIA
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Função Tiroideia",
    nome: "Painel Tiroideu Completo",
    parametros: [
      { nome: "TSH (hormona estimulante da tiróide)", unidade: "µIU/mL", refMin: "0.4", refMax: "4.0", tipo: "numerico" },
      { nome: "T4 Total", unidade: "µg/dL", refMin: "4.5", refMax: "12.0", tipo: "numerico" },
      { nome: "T4 Livre (FT4)", unidade: "ng/dL", refMin: "0.8", refMax: "1.8", tipo: "numerico" },
      { nome: "T3 Total", unidade: "ng/dL", refMin: "80", refMax: "200", tipo: "numerico" },
      { nome: "T3 Livre (FT3)", unidade: "pg/mL", refMin: "2.3", refMax: "4.2", tipo: "numerico" },
      { nome: "T3 Reverso (rT3)", unidade: "ng/dL", refMin: "9", refMax: "27", tipo: "numerico" },
      { nome: "Tireoglobulina", unidade: "ng/mL", refMin: "1.4", refMax: "78", tipo: "numerico" },
      { nome: "Anti-TPO (anticorpos anti-peroxidase)", unidade: "UI/mL", refMin: "0", refMax: "34", tipo: "numerico" },
      { nome: "Anti-Tireoglobulina (Anti-Tg)", unidade: "UI/mL", refMin: "0", refMax: "115", tipo: "numerico" },
      { nome: "Receptor TSH Ac (TRAb)", unidade: "IU/L", refMin: "0", refMax: "1.75", tipo: "numerico" },
    ],
  },
  {
    categoria: "Função Tiroideia",
    nome: "Calcitonina",
    parametros: [
      { nome: "Calcitonina", unidade: "pg/mL", refMin: "0", refMax: "10", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     HORMONAS — SUPRARRENAIS E HIPOFISÁRIAS
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Hormonas",
    nome: "Eixo Hipofisário Básico",
    parametros: [
      { nome: "ACTH (hormona adrenocorticotrófica)", unidade: "pg/mL", refMin: "7.2", refMax: "63.3", tipo: "numerico" },
      { nome: "Cortisol (manhã)", unidade: "µg/dL", refMin: "6.2", refMax: "19.4", tipo: "numerico" },
      { nome: "Cortisol (tarde)", unidade: "µg/dL", refMin: "2.3", refMax: "11.9", tipo: "numerico" },
      { nome: "GH (hormona de crescimento)", unidade: "ng/mL", refMin: "0", refMax: "5", tipo: "numerico" },
      { nome: "IGF-1 (Somatomedina C)", unidade: "ng/mL", refMin: "88", refMax: "246", tipo: "numerico" },
      { nome: "Prolactina", unidade: "ng/mL", refMin: "2", refMax: "18", tipo: "numerico" },
      { nome: "ADH (Vasopressina)", unidade: "pg/mL", refMin: "0", refMax: "6.7", tipo: "numerico" },
    ],
  },
  {
    categoria: "Hormonas",
    nome: "Aldosterona e Renina",
    parametros: [
      { nome: "Aldosterona (decúbito)", unidade: "ng/dL", refMin: "1", refMax: "16", tipo: "numerico" },
      { nome: "Renina plasmática", unidade: "ng/mL/h", refMin: "0.2", refMax: "3.3", tipo: "numerico" },
      { nome: "Ratio Aldosterona/Renina", unidade: "", refMin: "0", refMax: "30", tipo: "numerico" },
    ],
  },
  {
    categoria: "Hormonas",
    nome: "Catecolaminas e Metanefrinas (plasma)",
    parametros: [
      { nome: "Adrenalina (plasma)", unidade: "pg/mL", refMin: "0", refMax: "60", tipo: "numerico" },
      { nome: "Noradrenalina (plasma)", unidade: "pg/mL", refMin: "0", refMax: "750", tipo: "numerico" },
      { nome: "Dopamina (plasma)", unidade: "pg/mL", refMin: "0", refMax: "30", tipo: "numerico" },
      { nome: "Metanefrina livre (plasma)", unidade: "nmol/L", refMin: "0", refMax: "0.5", tipo: "numerico" },
      { nome: "Normetanefrina livre (plasma)", unidade: "nmol/L", refMin: "0", refMax: "0.9", tipo: "numerico" },
    ],
  },
  {
    categoria: "Hormonas",
    nome: "Eixo Gonadal Masculino",
    parametros: [
      { nome: "Testosterona Total", unidade: "ng/dL", refMin: "270", refMax: "1070", tipo: "numerico" },
      { nome: "Testosterona Livre", unidade: "pg/mL", refMin: "9", refMax: "30", tipo: "numerico" },
      { nome: "Testosterona Biodisponível", unidade: "ng/dL", refMin: "131", refMax: "682", tipo: "numerico" },
      { nome: "SHBG (globulina ligadora)", unidade: "nmol/L", refMin: "10", refMax: "57", tipo: "numerico" },
      { nome: "LH (hormona luteinizante)", unidade: "mIU/mL", refMin: "1.7", refMax: "8.6", tipo: "numerico" },
      { nome: "FSH (hormona folículo-estimulante)", unidade: "mIU/mL", refMin: "1.5", refMax: "12.4", tipo: "numerico" },
      { nome: "Estradiol (E2)", unidade: "pg/mL", refMin: "0", refMax: "53", tipo: "numerico" },
      { nome: "Inibina B", unidade: "pg/mL", refMin: "80", refMax: "300", tipo: "numerico" },
    ],
  },
  {
    categoria: "Hormonas",
    nome: "Eixo Gonadal Feminino",
    parametros: [
      { nome: "Estradiol (E2)", unidade: "pg/mL", refMin: "12", refMax: "499", tipo: "numerico" },
      { nome: "Estrona (E1)", unidade: "pg/mL", refMin: "17", refMax: "200", tipo: "numerico" },
      { nome: "Progesterona", unidade: "ng/mL", refMin: "0.1", refMax: "25", tipo: "numerico" },
      { nome: "LH", unidade: "mIU/mL", refMin: "2.4", refMax: "12.6", tipo: "numerico" },
      { nome: "FSH", unidade: "mIU/mL", refMin: "3.5", refMax: "12.5", tipo: "numerico" },
      { nome: "Prolactina", unidade: "ng/mL", refMin: "2", refMax: "29", tipo: "numerico" },
      { nome: "AMH (hormona anti-mülleriana)", unidade: "ng/mL", refMin: "1.0", refMax: "3.5", tipo: "numerico" },
      { nome: "SHBG", unidade: "nmol/L", refMin: "18", refMax: "144", tipo: "numerico" },
    ],
  },
  {
    categoria: "Hormonas",
    nome: "Androgénios Adrenais",
    parametros: [
      { nome: "DHEA-S (sulfato de deidroepiandrosterona)", unidade: "µg/dL", refMin: "65", refMax: "380", tipo: "numerico" },
      { nome: "DHEA", unidade: "ng/dL", refMin: "180", refMax: "1250", tipo: "numerico" },
      { nome: "Androstenediona", unidade: "ng/dL", refMin: "50", refMax: "210", tipo: "numerico" },
      { nome: "17-α-Hidroxiprogesterona", unidade: "ng/dL", refMin: "20", refMax: "100", tipo: "numerico" },
    ],
  },
  {
    categoria: "Hormonas",
    nome: "Hormona Paratiróide (PTH)",
    parametros: [
      { nome: "PTH intacta", unidade: "pg/mL", refMin: "15", refMax: "65", tipo: "numerico" },
    ],
  },
  {
    categoria: "Hormonas",
    nome: "Vitamina D",
    parametros: [
      { nome: "25-OH Vitamina D (D2+D3)", unidade: "ng/mL", refMin: "30", refMax: "100", tipo: "numerico" },
      { nome: "1,25-(OH)₂ Vitamina D (calcitriol)", unidade: "pg/mL", refMin: "19.6", refMax: "54.3", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     MARCADORES TUMORAIS
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Marcadores Tumorais",
    nome: "Marcadores Tumorais Gerais",
    parametros: [
      { nome: "CEA (Ag carcinoembrionário)", unidade: "ng/mL", refMin: "0", refMax: "5.0", tipo: "numerico" },
      { nome: "AFP (Alfa-fetoproteína)", unidade: "ng/mL", refMin: "0", refMax: "5.8", tipo: "numerico" },
      { nome: "CA 125", unidade: "U/mL", refMin: "0", refMax: "35", tipo: "numerico" },
      { nome: "CA 19-9", unidade: "U/mL", refMin: "0", refMax: "37", tipo: "numerico" },
      { nome: "CA 15-3", unidade: "U/mL", refMin: "0", refMax: "28", tipo: "numerico" },
      { nome: "CA 72-4", unidade: "U/mL", refMin: "0", refMax: "8.2", tipo: "numerico" },
      { nome: "CA 50", unidade: "U/mL", refMin: "0", refMax: "25", tipo: "numerico" },
      { nome: "Beta-HCG (β-hCG)", unidade: "mIU/mL", refMin: "0", refMax: "5", tipo: "numerico" },
      { nome: "LDH (marcador tumoral)", unidade: "U/L", refMin: "135", refMax: "225", tipo: "numerico" },
    ],
  },
  {
    categoria: "Marcadores Tumorais",
    nome: "Marcadores Prostáticos",
    parametros: [
      { nome: "PSA Total", unidade: "ng/mL", refMin: "0", refMax: "4.0", tipo: "numerico" },
      { nome: "PSA Livre", unidade: "ng/mL", refMin: "0", refMax: "2.0", tipo: "numerico" },
      { nome: "Ratio PSA Livre/Total", unidade: "%", refMin: "25", refMax: "100", tipo: "numerico" },
    ],
  },
  {
    categoria: "Marcadores Tumorais",
    nome: "Marcadores Tiroideus e Neuroendócrinos",
    parametros: [
      { nome: "Tireoglobulina (TG)", unidade: "ng/mL", refMin: "1.4", refMax: "78", tipo: "numerico" },
      { nome: "Calcitonina", unidade: "pg/mL", refMin: "0", refMax: "10", tipo: "numerico" },
      { nome: "Cromogranina A (CgA)", unidade: "ng/mL", refMin: "0", refMax: "100", tipo: "numerico" },
      { nome: "NSE (Enolase Neurónio-Específica)", unidade: "µg/L", refMin: "0", refMax: "16.3", tipo: "numerico" },
      { nome: "5-HIAA urinário (24h)", unidade: "mg/24h", refMin: "2", refMax: "9", tipo: "numerico" },
    ],
  },
  {
    categoria: "Marcadores Tumorais",
    nome: "HE4 e ROMA (Carcinoma Ovário)",
    parametros: [
      { nome: "HE4 (Proteína Epididimal Humana 4)", unidade: "pmol/L", refMin: "0", refMax: "70", tipo: "numerico" },
      { nome: "ROMA (score de risco)", unidade: "%", tipo: "texto" },
    ],
  },
  {
    categoria: "Marcadores Tumorais",
    nome: "Citoqueratinas (CYFRA 21-1)",
    parametros: [
      { nome: "CYFRA 21-1", unidade: "ng/mL", refMin: "0", refMax: "3.3", tipo: "numerico" },
    ],
  },
  {
    categoria: "Marcadores Tumorais",
    nome: "SCC (Antígeno Carcinoma de Células Escamosas)",
    parametros: [
      { nome: "SCC-Ag", unidade: "ng/mL", refMin: "0", refMax: "1.5", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     SEROLOGIA — DOENÇAS INFECCIOSAS
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Serologia Infecciosa",
    nome: "HIV",
    parametros: [
      { nome: "HIV Ag/Ac combinado (4ª geração)", unidade: "", tipo: "selecao", opcoes: ["Não Reactivo", "Reactivo (confirmar)"] },
      { nome: "Western Blot HIV-1/2 (confirmação)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Indeterminado", "Positivo HIV-1", "Positivo HIV-2"] },
      { nome: "Carga Viral HIV RNA (cópias/mL)", unidade: "cópias/mL", refMin: "0", refMax: "0", tipo: "numerico" },
      { nome: "Carga Viral HIV RNA (Log₁₀)", unidade: "Log₁₀", tipo: "numerico" },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Hepatite B — Painel Completo",
    parametros: [
      { nome: "HBsAg (Ag de superfície HB)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-HBs (Ac anti-superfície)", unidade: "mIU/mL", refMin: "0", refMax: "0", tipo: "numerico" },
      { nome: "Anti-HBc Total (Ac anti-core)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-HBc IgM (infecção aguda)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "HBeAg (Ag e HB)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-HBe (Ac anti-e)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "DNA VHB (carga viral, UI/mL)", unidade: "UI/mL", tipo: "numerico" },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Hepatite C",
    parametros: [
      { nome: "Anti-HCV (anticorpos totais)", unidade: "", tipo: "selecao", opcoes: ["Não Reactivo", "Reactivo"] },
      { nome: "RNA VHC (carga viral qualitativo)", unidade: "", tipo: "selecao", opcoes: ["Não detectado", "Detectado"] },
      { nome: "RNA VHC (carga viral quantitativo)", unidade: "UI/mL", tipo: "numerico" },
      { nome: "Genótipo VHC", unidade: "", tipo: "selecao", opcoes: ["1a", "1b", "2", "3", "4", "5", "6", "Não determinado"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Hepatite A",
    parametros: [
      { nome: "Anti-HAV IgM (fase aguda)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-HAV IgG (imunidade)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Hepatite E",
    parametros: [
      { nome: "Anti-HEV IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-HEV IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Sífilis (VDRL / TPHA / RPR)",
    parametros: [
      { nome: "VDRL / RPR (triagem)", unidade: "", tipo: "selecao", opcoes: ["Não Reactivo", "Reactivo"] },
      { nome: "Título VDRL/RPR", unidade: "", tipo: "texto" },
      { nome: "TPHA / TPPA (confirmação)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "FTA-Abs (confirmação)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Borderline", "Positivo"] },
      { nome: "Anti-Treponema IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-Treponema IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Paludismo / Malária",
    parametros: [
      { nome: "Gota Espessa (microscopia)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo P. falciparum", "Positivo P. vivax", "Positivo P. malariae", "Positivo P. ovale"] },
      { nome: "Teste Rápido Antigénio (RDT)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo P. falciparum", "Positivo não-falciparum"] },
      { nome: "Parasitémia (%)", unidade: "%", refMin: "0", refMax: "0", tipo: "numerico" },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Rubéola",
    parametros: [
      { nome: "Anti-Rubéola IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Equívoco", "Positivo"] },
      { nome: "Anti-Rubéola IgG", unidade: "IU/mL", refMin: "10", refMax: "999", tipo: "numerico" },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Toxoplasmose",
    parametros: [
      { nome: "Anti-Toxoplasma IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Equívoco", "Positivo"] },
      { nome: "Anti-Toxoplasma IgG", unidade: "UI/mL", refMin: "0", refMax: "3", tipo: "numerico" },
      { nome: "Avidez IgG Toxoplasma", unidade: "%", tipo: "texto" },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "CMV — Citomegalovírus",
    parametros: [
      { nome: "CMV IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Equívoco", "Positivo"] },
      { nome: "CMV IgG", unidade: "U/mL", refMin: "0", refMax: "0.4", tipo: "numerico" },
      { nome: "Avidez IgG CMV", unidade: "%", tipo: "texto" },
      { nome: "CMV PCR DNA (cópias/mL)", unidade: "cópias/mL", tipo: "numerico" },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Epstein-Barr (EBV / Mononucleose)",
    parametros: [
      { nome: "VCA IgM (infecção aguda)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "VCA IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-EBNA IgG (infecção passada)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "EA-D IgG (fase precoce)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Herpes Vírus",
    parametros: [
      { nome: "HSV-1 IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "HSV-1 IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "HSV-2 IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "HSV-2 IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Varicela-Zóster (VZV)",
    parametros: [
      { nome: "VZV IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "VZV IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "HTLV I/II",
    parametros: [
      { nome: "Anti-HTLV I/II (triagem)", unidade: "", tipo: "selecao", opcoes: ["Não Reactivo", "Reactivo"] },
      { nome: "Western Blot HTLV (confirmação)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Indeterminado", "Positivo HTLV-I", "Positivo HTLV-II"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Dengue",
    parametros: [
      { nome: "Dengue NS1 Ag", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Dengue IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Dengue IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "RNA Dengue (RT-PCR)", unidade: "", tipo: "selecao", opcoes: ["Não detectado", "Detectado"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Chikungunya",
    parametros: [
      { nome: "Chikungunya IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Chikungunya IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Chikungunya RNA (RT-PCR)", unidade: "", tipo: "selecao", opcoes: ["Não detectado", "Detectado"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Zika",
    parametros: [
      { nome: "Zika IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Zika IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Zika RNA (RT-PCR)", unidade: "", tipo: "selecao", opcoes: ["Não detectado", "Detectado"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "COVID-19 (SARS-CoV-2)",
    parametros: [
      { nome: "RT-PCR SARS-CoV-2 (qualitativo)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Ct value", unidade: "", tipo: "numerico" },
      { nome: "Anti-SARS-CoV-2 IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-SARS-CoV-2 IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-SARS-CoV-2 IgG (quant., UI/mL)", unidade: "BAU/mL", refMin: "0", refMax: "0", tipo: "numerico" },
      { nome: "Ag rápido SARS-CoV-2", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Febre Amarela",
    parametros: [
      { nome: "Febre Amarela IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Febre Amarela IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Febre Tifoide (Widal / Salmonella)",
    parametros: [
      { nome: "Widal (S. typhi O)", unidade: "", tipo: "selecao", opcoes: ["< 1/40", "1/40", "1/80", "1/160", "1/320", "≥ 1/640"] },
      { nome: "Widal (S. typhi H)", unidade: "", tipo: "selecao", opcoes: ["< 1/40", "1/40", "1/80", "1/160", "1/320", "≥ 1/640"] },
      { nome: "Widal (S. paratyphi AH)", unidade: "", tipo: "selecao", opcoes: ["< 1/40", "1/40", "1/80", "1/160", "1/320"] },
      { nome: "Widal (S. paratyphi BH)", unidade: "", tipo: "selecao", opcoes: ["< 1/40", "1/40", "1/80", "1/160", "1/320"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Brucelose",
    parametros: [
      { nome: "Rosa de Bengala (triagem)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "SAT (titulação em soro)", unidade: "", tipo: "texto" },
      { nome: "Anti-Brucella IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-Brucella IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Leptospirose",
    parametros: [
      { nome: "Leptospirose IgM (ELISA)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "MAT (Microscopic Agglutination Test)", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Rickettsia",
    parametros: [
      { nome: "Rickettsia IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Rickettsia IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Leishmaniose",
    parametros: [
      { nome: "Anti-Leishmania (rK39 / ELISA)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Leishmania PCR", unidade: "", tipo: "selecao", opcoes: ["Não detectado", "Detectado"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Trypanosoma (Doença de Chagas)",
    parametros: [
      { nome: "Anti-T.cruzi IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-T.cruzi IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "T.cruzi PCR", unidade: "", tipo: "selecao", opcoes: ["Não detectado", "Detectado"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Filariose",
    parametros: [
      { nome: "Microfilárias (gota espessa nocturna)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo — Wuchereria bancrofti", "Positivo — Loa loa", "Positivo — Mansonella perstans"] },
      { nome: "Ag circundante filarial (CFA)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Helmintíases (serologia)",
    parametros: [
      { nome: "Anti-Schistosoma (ELISA)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-Cisticerco IgG (Taenia)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-Echinococcus IgG (Hidátido)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-Strongyloides IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Tuberculose — IGRA / QuantiFERON",
    parametros: [
      { nome: "QuantiFERON-TB Gold Plus", unidade: "IU/mL", refMin: "0", refMax: "0.35", tipo: "numerico" },
      { nome: "Interpretação IGRA", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Indeterminado", "Positivo"] },
    ],
  },
  {
    categoria: "Serologia Infecciosa",
    nome: "Pneumococo e Legionella (Ag urinário)",
    parametros: [
      { nome: "Ag Streptococcus pneumoniae (urina)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Ag Legionella pneumophila (urina)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     AUTOIMUNIDADE
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Autoimunidade",
    nome: "ANA — Painel Básico",
    parametros: [
      { nome: "ANA (HANA — triagem)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "1/40", "1/80", "1/160", "1/320", "1/640", "1/1280", "≥ 1/2560"] },
      { nome: "Padrão ANA", unidade: "", tipo: "selecao", opcoes: ["Homogéneo", "Moteado fino", "Moteado grosseiro", "Nucleolar", "Centrómero", "Membrana nuclear", "Outros"] },
      { nome: "Anti-dsDNA (DNA nativo)", unidade: "UI/mL", refMin: "0", refMax: "10", tipo: "numerico" },
      { nome: "Anti-Sm", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-SSA/Ro", unidade: "U/mL", refMin: "0", refMax: "7", tipo: "numerico" },
      { nome: "Anti-SSB/La", unidade: "U/mL", refMin: "0", refMax: "7", tipo: "numerico" },
      { nome: "Anti-Scl-70 (Topoisomerase I)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-Jo-1 (Histidil-ARNt-sintetase)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-Centrómero (CENP-B)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-Histona", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-U1-snRNP", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Autoimunidade",
    nome: "ANCA (Vasculites)",
    parametros: [
      { nome: "ANCA (IFI) — c-ANCA", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "ANCA (IFI) — p-ANCA", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-PR3 (proteinase 3)", unidade: "U/mL", refMin: "0", refMax: "10", tipo: "numerico" },
      { nome: "Anti-MPO (mieloperoxidase)", unidade: "U/mL", refMin: "0", refMax: "10", tipo: "numerico" },
    ],
  },
  {
    categoria: "Autoimunidade",
    nome: "Artrite Reumatóide",
    parametros: [
      { nome: "Factor Reumatóide IgM (FR)", unidade: "IU/mL", refMin: "0", refMax: "14", tipo: "numerico" },
      { nome: "Anti-CCP (anti-péptido citrulinado)", unidade: "U/mL", refMin: "0", refMax: "5", tipo: "numerico" },
      { nome: "Anti-MCV (vírus mutado citrulinado)", unidade: "U/mL", refMin: "0", refMax: "20", tipo: "numerico" },
    ],
  },
  {
    categoria: "Autoimunidade",
    nome: "Síndrome Antifosfolípido",
    parametros: [
      { nome: "Anticoagulante Lúpico (DRVVT)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-Cardiolipina IgM", unidade: "GPL/mL", refMin: "0", refMax: "12", tipo: "numerico" },
      { nome: "Anti-Cardiolipina IgG", unidade: "GPL/mL", refMin: "0", refMax: "12", tipo: "numerico" },
      { nome: "Anti-Beta2-Glicoproteína I IgM", unidade: "SGU/mL", refMin: "0", refMax: "20", tipo: "numerico" },
      { nome: "Anti-Beta2-Glicoproteína I IgG", unidade: "SGU/mL", refMin: "0", refMax: "20", tipo: "numerico" },
    ],
  },
  {
    categoria: "Autoimunidade",
    nome: "Doença Celíaca",
    parametros: [
      { nome: "Anti-gliadina IgA (AGA)", unidade: "U/mL", refMin: "0", refMax: "10", tipo: "numerico" },
      { nome: "Anti-transglutaminase IgA (tTG-IgA)", unidade: "U/mL", refMin: "0", refMax: "10", tipo: "numerico" },
      { nome: "Anti-endomísio IgA (EMA)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "IgA total (despiste défice)", unidade: "g/L", refMin: "0.7", refMax: "4.0", tipo: "numerico" },
    ],
  },
  {
    categoria: "Autoimunidade",
    nome: "Autoanticorpos Hepáticos",
    parametros: [
      { nome: "Anti-músculo liso (ASMA)", unidade: "", tipo: "texto" },
      { nome: "Anti-LKM1 (microssomas)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-mitocôndria AMA (M2)", unidade: "", tipo: "texto" },
      { nome: "Anti-LC1 (citosol hepático)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anti-SLA (antígeno hepático solúvel)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Autoimunidade",
    nome: "Anticorpos Anti-Insulares (Diabetes T1)",
    parametros: [
      { nome: "Anti-GAD65 (glutamato descarboxilase)", unidade: "IU/mL", refMin: "0", refMax: "10", tipo: "numerico" },
      { nome: "Anti-IA2 (tirosina fosfatase)", unidade: "U/mL", refMin: "0", refMax: "7.5", tipo: "numerico" },
      { nome: "Anti-insulina (IAA)", unidade: "U/mL", refMin: "0", refMax: "0.4", tipo: "numerico" },
      { nome: "Anti-ZnT8", unidade: "U/mL", refMin: "0", refMax: "15", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     URINA — EXAME TIPO II e SEDIMENTO
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Urina",
    nome: "Exame de Urina Tipo II (EQU + Sedimento)",
    parametros: [
      { nome: "Cor", unidade: "", tipo: "selecao", opcoes: ["Amarela clara", "Amarela", "Amarela escura", "Âmbar", "Laranja", "Rosa", "Vermelha", "Castanha", "Esverdeada", "Turva"] },
      { nome: "Aspecto", unidade: "", tipo: "selecao", opcoes: ["Límpido", "Ligeiramente turvo", "Turvo", "Muito turvo"] },
      { nome: "pH", unidade: "", refMin: "5.0", refMax: "8.0", tipo: "numerico" },
      { nome: "Densidade", unidade: "", refMin: "1.003", refMax: "1.030", tipo: "numerico" },
      { nome: "Proteínas", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Traços", "+", "++", "+++", "++++"] },
      { nome: "Glicose", unidade: "", tipo: "selecao", opcoes: ["Negativo", "+", "++", "+++", "++++"] },
      { nome: "Hemoglobina / Eritrócitos", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Traços", "+", "++", "+++"] },
      { nome: "Leucócitos (esterase)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Traços", "+", "++", "+++"] },
      { nome: "Nitritos", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Cetonas", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Traços", "+", "++", "+++"] },
      { nome: "Bilirrubina", unidade: "", tipo: "selecao", opcoes: ["Negativo", "+", "++", "+++"] },
      { nome: "Urobilinogénio", unidade: "mg/dL", tipo: "numerico" },
      { nome: "Sedimento — Eritrócitos", unidade: "/campo", refMin: "0", refMax: "5", tipo: "numerico" },
      { nome: "Sedimento — Leucócitos", unidade: "/campo", refMin: "0", refMax: "5", tipo: "numerico" },
      { nome: "Sedimento — Células epiteliais", unidade: "/campo", refMin: "0", refMax: "5", tipo: "numerico" },
      { nome: "Sedimento — Cilindros hialinos", unidade: "/campo", refMin: "0", refMax: "2", tipo: "numerico" },
      { nome: "Sedimento — Cilindros granulosos", unidade: "", tipo: "selecao", opcoes: ["Ausentes", "Raros", "Presentes"] },
      { nome: "Sedimento — Cristais", unidade: "", tipo: "texto" },
      { nome: "Sedimento — Bactérias", unidade: "", tipo: "selecao", opcoes: ["Ausentes", "Escassas", "Moderadas", "Abundantes"] },
    ],
  },
  {
    categoria: "Urina",
    nome: "Urocultura",
    parametros: [
      { nome: "Colónia (UFC/mL)", unidade: "UFC/mL", refMin: "0", refMax: "10000", tipo: "numerico" },
      { nome: "Agente identificado", unidade: "", tipo: "texto" },
      { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Ausência de crescimento", "Contaminação", "Infecção urinária — ver antibiotipo"] },
    ],
  },
  {
    categoria: "Urina",
    nome: "Glicosúria 24h",
    parametros: [
      { nome: "Glicose urinária 24h", unidade: "mg/24h", refMin: "0", refMax: "25", tipo: "numerico" },
      { nome: "Volume urinário 24h", unidade: "mL/24h", refMin: "800", refMax: "2000", tipo: "numerico" },
    ],
  },
  {
    categoria: "Urina",
    nome: "Ionograma Urinário (urina 24h)",
    parametros: [
      { nome: "Sódio urinário (24h)", unidade: "mEq/24h", refMin: "40", refMax: "220", tipo: "numerico" },
      { nome: "Potássio urinário (24h)", unidade: "mEq/24h", refMin: "25", refMax: "100", tipo: "numerico" },
      { nome: "Cálcio urinário (24h)", unidade: "mg/24h", refMin: "100", refMax: "300", tipo: "numerico" },
      { nome: "Fósforo urinário (24h)", unidade: "mg/24h", refMin: "400", refMax: "1300", tipo: "numerico" },
      { nome: "Magnésio urinário (24h)", unidade: "mg/24h", refMin: "50", refMax: "150", tipo: "numerico" },
      { nome: "Ácido Úrico urinário (24h)", unidade: "mg/24h", refMin: "250", refMax: "800", tipo: "numerico" },
      { nome: "Oxalato urinário (24h)", unidade: "mg/24h", refMin: "0", refMax: "45", tipo: "numerico" },
      { nome: "Citrato urinário (24h)", unidade: "mg/24h", refMin: "320", refMax: "1240", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     FEZES / PARASITOLOGIA
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Parasitologia e Fezes",
    nome: "Exame Parasitológico de Fezes (EPF)",
    parametros: [
      { nome: "Aspecto macroscópico", unidade: "", tipo: "texto" },
      { nome: "Consistência", unidade: "", tipo: "selecao", opcoes: ["Normal/Formada", "Mole/pastosa", "Líquida/diarreia", "Endurecida"] },
      { nome: "Muco/sangue", unidade: "", tipo: "selecao", opcoes: ["Ausente", "Muco presente", "Sangue presente", "Muco e sangue"] },
      { nome: "Resultado parasitológico", unidade: "", tipo: "texto" },
      { nome: "Protozoários", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Entamoeba histolytica", "Entamoeba coli (comensal)", "Giardia lamblia", "Cryptosporidium", "Cyclospora", "Blastocystis hominis", "Balantidium coli"] },
      { nome: "Helmintas (ovos/larvas)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Ascaris lumbricoides", "Trichuris trichiura", "Ancylostomídeos", "Strongyloides stercoralis", "Enterobius vermicularis", "Taenia spp.", "Schistosoma mansoni"] },
    ],
  },
  {
    categoria: "Parasitologia e Fezes",
    nome: "Sangue Oculto nas Fezes (PSOF)",
    parametros: [
      { nome: "Pesquisa de Sangue Oculto (FIT/guaiaco)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Parasitologia e Fezes",
    nome: "Coproculturas e Ag Fecais",
    parametros: [
      { nome: "Coprocultura (resultado geral)", unidade: "", tipo: "texto" },
      { nome: "Ag Clostridium difficile toxina A/B", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Ag Helicobacter pylori (fezes)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Ag Rotavírus", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Ag Adenovírus entérico", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Ag Norovírus GI/GII", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },
  {
    categoria: "Parasitologia e Fezes",
    nome: "Calprotectina Fecal",
    parametros: [
      { nome: "Calprotectina fecal", unidade: "µg/g", refMin: "0", refMax: "50", tipo: "numerico" },
    ],
  },
  {
    categoria: "Parasitologia e Fezes",
    nome: "Lactoferrina Fecal",
    parametros: [
      { nome: "Lactoferrina fecal", unidade: "µg/g", refMin: "0", refMax: "7.25", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     MICROBIOLOGIA — CULTURAS
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Microbiologia",
    nome: "Hemocultura",
    parametros: [
      { nome: "Resultado (aeróbio)", unidade: "", tipo: "selecao", opcoes: ["Sem crescimento", "Crescimento — ver identificação e TSA"] },
      { nome: "Resultado (anaeróbio)", unidade: "", tipo: "selecao", opcoes: ["Sem crescimento", "Crescimento — ver identificação e TSA"] },
      { nome: "Agente identificado", unidade: "", tipo: "texto" },
      { nome: "Antibiograma (TSA)", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Microbiologia",
    nome: "Exsudado Faríngeo / Nasofaríngeo",
    parametros: [
      { nome: "Exame directo", unidade: "", tipo: "texto" },
      { nome: "Resultado cultura", unidade: "", tipo: "texto" },
      { nome: "Teste rápido Streptococcus A", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Antibiograma", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Microbiologia",
    nome: "Exsudado Nasal",
    parametros: [
      { nome: "Exame directo", unidade: "", tipo: "texto" },
      { nome: "Agente isolado", unidade: "", tipo: "texto" },
      { nome: "Antibiograma", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Microbiologia",
    nome: "Exsudado Ocular / Conjuntival",
    parametros: [
      { nome: "Exame directo", unidade: "", tipo: "texto" },
      { nome: "Agente isolado", unidade: "", tipo: "texto" },
      { nome: "Antibiograma", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Microbiologia",
    nome: "Secreção Vaginal / STI",
    parametros: [
      { nome: "pH vaginal", unidade: "", refMin: "3.8", refMax: "4.5", tipo: "numerico" },
      { nome: "Gram / exame directo", unidade: "", tipo: "texto" },
      { nome: "Trichomonas vaginalis", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Gardnerella vaginalis (critérios Amsel)", unidade: "", tipo: "selecao", opcoes: ["Vaginose ausente", "Vaginose bacteriana presente"] },
      { nome: "Candida spp.", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Cultura vaginal", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Microbiologia",
    nome: "Chlamydia trachomatis e Neisseria gonorrhoeae (NAAT)",
    parametros: [
      { nome: "Chlamydia trachomatis (PCR/NAAT)", unidade: "", tipo: "selecao", opcoes: ["Não detectado", "Detectado"] },
      { nome: "Neisseria gonorrhoeae (PCR/NAAT)", unidade: "", tipo: "selecao", opcoes: ["Não detectado", "Detectado"] },
    ],
  },
  {
    categoria: "Microbiologia",
    nome: "Mycoplasma / Ureaplasma",
    parametros: [
      { nome: "Mycoplasma genitalium (PCR)", unidade: "", tipo: "selecao", opcoes: ["Não detectado", "Detectado"] },
      { nome: "Mycoplasma hominis (cultura)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Ureaplasma urealyticum/parvum (cultura)", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Microbiologia",
    nome: "BK no Escarro (Baciloscopia e Cultura MTB)",
    parametros: [
      { nome: "Baciloscopia (Ziehl-Neelsen) — amostra 1", unidade: "", tipo: "selecao", opcoes: ["Negativo", "BAAR raros (< 1/campo)", "1+ (1-9/100 campos)", "2+ (1-9/10 campos)", "3+ (1-9/campo)", "4+ (≥ 10/campo)"] },
      { nome: "Baciloscopia — amostra 2", unidade: "", tipo: "selecao", opcoes: ["Negativo", "BAAR raros", "1+", "2+", "3+", "4+"] },
      { nome: "Cultura MTB (meio sólido/líquido)", unidade: "", tipo: "selecao", opcoes: ["Negativa (8 semanas)", "Positiva — M. tuberculosis", "Positiva — M. não-tuberculosa"] },
      { nome: "Teste de sensibilidade (TSA-TB)", unidade: "", tipo: "texto" },
      { nome: "MTB PCR (GeneXpert)", unidade: "", tipo: "selecao", opcoes: ["MTB não detectado", "MTB detectado — RIF sensível", "MTB detectado — RIF resistente"] },
    ],
  },
  {
    categoria: "Microbiologia",
    nome: "Fungos (Cultura micológica)",
    parametros: [
      { nome: "Exame directo (KOH/Gram)", unidade: "", tipo: "texto" },
      { nome: "Fungo isolado", unidade: "", tipo: "texto" },
      { nome: "Antifungigrama", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Microbiologia",
    nome: "Cryptococcus (Ag em LCR ou soro)",
    parametros: [
      { nome: "Ag Cryptococcus neoformans (tinta da China / LFA)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Título Ag Cryptococcus", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Microbiologia",
    nome: "Exame de LCR (Líquido Cefalorraquidiano)",
    parametros: [
      { nome: "Aspecto", unidade: "", tipo: "selecao", opcoes: ["Límpido (água de rocha)", "Xantocrómico", "Turvo", "Hemorrágico"] },
      { nome: "Pressão de abertura", unidade: "cmH₂O", refMin: "6", refMax: "20", tipo: "numerico" },
      { nome: "Glicose (LCR)", unidade: "mg/dL", refMin: "45", refMax: "80", tipo: "numerico" },
      { nome: "Proteínas totais (LCR)", unidade: "mg/dL", refMin: "15", refMax: "45", tipo: "numerico" },
      { nome: "Leucócitos (LCR)", unidade: "células/µL", refMin: "0", refMax: "5", tipo: "numerico" },
      { nome: "Eritrócitos (LCR)", unidade: "células/µL", refMin: "0", refMax: "0", tipo: "numerico" },
      { nome: "Diferencial celular", unidade: "", tipo: "texto" },
      { nome: "Gram / Exame directo", unidade: "", tipo: "texto" },
      { nome: "Cultura bacteriana (LCR)", unidade: "", tipo: "texto" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     VITAMINAS E MICRONUTRIENTES
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Vitaminas e Micronutrientes",
    nome: "Vitaminas do Complexo B",
    parametros: [
      { nome: "Vitamina B12 (Cobalamina)", unidade: "pg/mL", refMin: "200", refMax: "900", tipo: "numerico" },
      { nome: "Ácido Fólico (B9)", unidade: "ng/mL", refMin: "3.1", refMax: "17.5", tipo: "numerico" },
      { nome: "Vitamina B1 (Tiamina)", unidade: "nmol/L", refMin: "70", refMax: "180", tipo: "numerico" },
      { nome: "Vitamina B2 (Riboflavina)", unidade: "nmol/L", refMin: "100", refMax: "630", tipo: "numerico" },
      { nome: "Vitamina B6 (Piridoxal-5-fosfato)", unidade: "nmol/L", refMin: "20", refMax: "125", tipo: "numerico" },
      { nome: "Vitamina B3 (Niacina)", unidade: "µmol/L", refMin: "50", refMax: "800", tipo: "numerico" },
      { nome: "Vitamina B7 (Biotina)", unidade: "ng/L", refMin: "100", refMax: "2000", tipo: "numerico" },
    ],
  },
  {
    categoria: "Vitaminas e Micronutrientes",
    nome: "Vitaminas Lipossolúveis",
    parametros: [
      { nome: "Vitamina A (Retinol)", unidade: "µg/dL", refMin: "20", refMax: "60", tipo: "numerico" },
      { nome: "Vitamina D (25-OH)", unidade: "ng/mL", refMin: "30", refMax: "100", tipo: "numerico" },
      { nome: "Vitamina E (Alfa-tocoferol)", unidade: "mg/L", refMin: "5", refMax: "18", tipo: "numerico" },
      { nome: "Vitamina K1 (Fitomenadiona)", unidade: "ng/mL", refMin: "0.2", refMax: "3.2", tipo: "numerico" },
    ],
  },
  {
    categoria: "Vitaminas e Micronutrientes",
    nome: "Oligoelementos e Minerais",
    parametros: [
      { nome: "Zinco (Zn)", unidade: "µg/dL", refMin: "60", refMax: "130", tipo: "numerico" },
      { nome: "Cobre (Cu)", unidade: "µg/dL", refMin: "70", refMax: "140", tipo: "numerico" },
      { nome: "Selénio (Se)", unidade: "µg/L", refMin: "70", refMax: "150", tipo: "numerico" },
      { nome: "Manganês (Mn)", unidade: "µg/L", refMin: "4", refMax: "14", tipo: "numerico" },
      { nome: "Cromo (Cr)", unidade: "µg/L", refMin: "0.05", refMax: "0.5", tipo: "numerico" },
      { nome: "Molibdénio (Mo)", unidade: "µg/L", refMin: "0.1", refMax: "3.0", tipo: "numerico" },
      { nome: "Iodo (I)", unidade: "µg/L", refMin: "52", refMax: "109", tipo: "numerico" },
    ],
  },
  {
    categoria: "Vitaminas e Micronutrientes",
    nome: "Metais Pesados (Toxicologia)",
    parametros: [
      { nome: "Chumbo (Pb) no sangue", unidade: "µg/dL", refMin: "0", refMax: "5", tipo: "numerico" },
      { nome: "Mercúrio (Hg) no sangue", unidade: "µg/L", refMin: "0", refMax: "10", tipo: "numerico" },
      { nome: "Arsénio (As) urinário", unidade: "µg/g creat", refMin: "0", refMax: "35", tipo: "numerico" },
      { nome: "Cádmio (Cd) urinário", unidade: "µg/g creat", refMin: "0", refMax: "1.0", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     GASIMETRIA E EQUILÍBRIO ÁCIDO-BASE
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Gasimetria",
    nome: "Gasimetria Arterial",
    parametros: [
      { nome: "pH", unidade: "", refMin: "7.35", refMax: "7.45", tipo: "numerico" },
      { nome: "pCO₂", unidade: "mmHg", refMin: "35", refMax: "45", tipo: "numerico" },
      { nome: "pO₂", unidade: "mmHg", refMin: "80", refMax: "100", tipo: "numerico" },
      { nome: "HCO₃⁻ actual", unidade: "mEq/L", refMin: "22", refMax: "26", tipo: "numerico" },
      { nome: "HCO₃⁻ standard", unidade: "mEq/L", refMin: "22", refMax: "26", tipo: "numerico" },
      { nome: "Base Excess (BE)", unidade: "mEq/L", refMin: "-2", refMax: "2", tipo: "numerico" },
      { nome: "Saturação O₂ (SaO₂)", unidade: "%", refMin: "95", refMax: "100", tipo: "numerico" },
      { nome: "Lactato", unidade: "mmol/L", refMin: "0.5", refMax: "2.0", tipo: "numerico" },
      { nome: "Interpretação", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Gasimetria",
    nome: "Lactato venoso",
    parametros: [
      { nome: "Lactato venoso", unidade: "mmol/L", refMin: "0.5", refMax: "2.2", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     IMUNOGLOBULINAS E COMPLEMENTO
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Imunoglobulinas",
    nome: "Doseamento de Imunoglobulinas",
    parametros: [
      { nome: "IgG", unidade: "mg/dL", refMin: "700", refMax: "1600", tipo: "numerico" },
      { nome: "IgA", unidade: "mg/dL", refMin: "70", refMax: "400", tipo: "numerico" },
      { nome: "IgM", unidade: "mg/dL", refMin: "40", refMax: "230", tipo: "numerico" },
      { nome: "IgE total", unidade: "IU/mL", refMin: "0", refMax: "100", tipo: "numerico" },
      { nome: "IgD", unidade: "mg/dL", refMin: "0", refMax: "8", tipo: "numerico" },
    ],
  },
  {
    categoria: "Imunoglobulinas",
    nome: "Complemento",
    parametros: [
      { nome: "C3 (componente do complemento 3)", unidade: "mg/dL", refMin: "90", refMax: "180", tipo: "numerico" },
      { nome: "C4", unidade: "mg/dL", refMin: "16", refMax: "47", tipo: "numerico" },
      { nome: "CH50 (actividade total do complemento)", unidade: "U/mL", refMin: "23", refMax: "46", tipo: "numerico" },
    ],
  },
  {
    categoria: "Imunoglobulinas",
    nome: "IgE Específica (RAST) — Alergia",
    parametros: [
      { nome: "IgE total", unidade: "IU/mL", refMin: "0", refMax: "100", tipo: "numerico" },
      { nome: "IgE específica — ácaros (D. pteronyssinus)", unidade: "kU/L", refMin: "0", refMax: "0.35", tipo: "numerico" },
      { nome: "IgE específica — Leite de vaca", unidade: "kU/L", refMin: "0", refMax: "0.35", tipo: "numerico" },
      { nome: "IgE específica — Ovo (clara)", unidade: "kU/L", refMin: "0", refMax: "0.35", tipo: "numerico" },
      { nome: "IgE específica — Amendoim", unidade: "kU/L", refMin: "0", refMax: "0.35", tipo: "numerico" },
      { nome: "IgE específica — Látex", unidade: "kU/L", refMin: "0", refMax: "0.35", tipo: "numerico" },
      { nome: "IgE específica — Pólens misturados", unidade: "kU/L", refMin: "0", refMax: "0.35", tipo: "numerico" },
      { nome: "IgE específica — Pelo de gato", unidade: "kU/L", refMin: "0", refMax: "0.35", tipo: "numerico" },
      { nome: "IgE específica — Pelo de cão", unidade: "kU/L", refMin: "0", refMax: "0.35", tipo: "numerico" },
    ],
  },
  {
    categoria: "Imunoglobulinas",
    nome: "Crioglobulinas",
    parametros: [
      { nome: "Crioglobulinas (pesquisa)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Tipo de crioglobulina", unidade: "", tipo: "selecao", opcoes: ["Tipo I (monoclonal)", "Tipo II (mista monoclonal)", "Tipo III (mista policlonal)"] },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     MONITORIZAÇÃO TERAPÊUTICA
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Monitorização Terapêutica",
    nome: "Anticoagulantes Orais",
    parametros: [
      { nome: "INR (Varfarina)", unidade: "", refMin: "2.0", refMax: "3.0", tipo: "numerico" },
      { nome: "Anti-Xa (Heparina baixo peso molecular)", unidade: "UI/mL", refMin: "0.5", refMax: "1.0", tipo: "numerico" },
      { nome: "Anti-Xa (Rivaroxabano/Apixabano)", unidade: "ng/mL", tipo: "numerico" },
      { nome: "Dabigatrano (Hemoclot TT)", unidade: "ng/mL", tipo: "numerico" },
    ],
  },
  {
    categoria: "Monitorização Terapêutica",
    nome: "Imunossupressores",
    parametros: [
      { nome: "Ciclosporina (sangue total, trough C0)", unidade: "ng/mL", refMin: "100", refMax: "300", tipo: "numerico" },
      { nome: "Tacrolimus (sangue total, trough C0)", unidade: "ng/mL", refMin: "5", refMax: "20", tipo: "numerico" },
      { nome: "Sirolimus (rapamicina)", unidade: "ng/mL", refMin: "4", refMax: "12", tipo: "numerico" },
      { nome: "Micofenolato (ácido micofenólico, C0)", unidade: "mg/L", refMin: "1.0", refMax: "3.5", tipo: "numerico" },
      { nome: "Everolimus", unidade: "ng/mL", refMin: "3", refMax: "8", tipo: "numerico" },
    ],
  },
  {
    categoria: "Monitorização Terapêutica",
    nome: "Antiepilépticos",
    parametros: [
      { nome: "Fenitoína (Difenilhidantoína)", unidade: "µg/mL", refMin: "10", refMax: "20", tipo: "numerico" },
      { nome: "Fenobarbital", unidade: "µg/mL", refMin: "15", refMax: "40", tipo: "numerico" },
      { nome: "Carbamazepina", unidade: "µg/mL", refMin: "4", refMax: "12", tipo: "numerico" },
      { nome: "Ácido Valpróico (Valproato)", unidade: "µg/mL", refMin: "50", refMax: "100", tipo: "numerico" },
      { nome: "Lamotrigina", unidade: "µg/mL", refMin: "2.5", refMax: "15", tipo: "numerico" },
      { nome: "Levetiracetam", unidade: "µg/mL", refMin: "12", refMax: "46", tipo: "numerico" },
    ],
  },
  {
    categoria: "Monitorização Terapêutica",
    nome: "Aminoglicosídeos",
    parametros: [
      { nome: "Gentamicina (pico, 1h pós-dose)", unidade: "µg/mL", refMin: "5", refMax: "10", tipo: "numerico" },
      { nome: "Gentamicina (trough, pré-dose)", unidade: "µg/mL", refMin: "0", refMax: "2", tipo: "numerico" },
      { nome: "Amicacina (pico)", unidade: "µg/mL", refMin: "20", refMax: "35", tipo: "numerico" },
      { nome: "Amicacina (trough)", unidade: "µg/mL", refMin: "0", refMax: "10", tipo: "numerico" },
      { nome: "Vancomicina (AUC/MIC)", unidade: "µg/mL", refMin: "10", refMax: "20", tipo: "numerico" },
    ],
  },
  {
    categoria: "Monitorização Terapêutica",
    nome: "Antirretrovirais",
    parametros: [
      { nome: "Efavirenz (EFV, trough C12h)", unidade: "ng/mL", refMin: "1000", refMax: "4000", tipo: "numerico" },
      { nome: "Lopinavir/r (trough C12h)", unidade: "ng/mL", refMin: "1000", refMax: "8000", tipo: "numerico" },
      { nome: "Tenofovir (TDF, trough)", unidade: "ng/mL", refMin: "80", refMax: "300", tipo: "numerico" },
    ],
  },
  {
    categoria: "Monitorização Terapêutica",
    nome: "Digoxina",
    parametros: [
      { nome: "Digoxina (sérica)", unidade: "ng/mL", refMin: "0.8", refMax: "2.0", tipo: "numerico" },
    ],
  },
  {
    categoria: "Monitorização Terapêutica",
    nome: "Lítio",
    parametros: [
      { nome: "Litémia (trough)", unidade: "mEq/L", refMin: "0.6", refMax: "1.2", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     TOXICOLOGIA
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Toxicologia",
    nome: "Rastreio de Drogas (urina)",
    parametros: [
      { nome: "Cannabis (THC/THCA)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Cocaína (benzoilecgonina)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Opiáceos (morfina/codeína)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Metadona", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Anfetaminas", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "MDMA (ecstasy)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Benzodiazepinas", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Barbitúricos", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "Etanol (álcool)", unidade: "g/L", refMin: "0", refMax: "0", tipo: "numerico" },
    ],
  },
  {
    categoria: "Toxicologia",
    nome: "Paracetamol (Acetaminofeno)",
    parametros: [
      { nome: "Paracetamol sérico", unidade: "µg/mL", refMin: "0", refMax: "30", tipo: "numerico" },
    ],
  },
  {
    categoria: "Toxicologia",
    nome: "Salicilatos",
    parametros: [
      { nome: "Salicilato sérico", unidade: "mg/dL", refMin: "0", refMax: "20", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     GRAVIDEZ E PERINATAL
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Gravidez e Perinatal",
    nome: "Rastreio Pré-natal do 1º Trimestre",
    parametros: [
      { nome: "β-hCG livre", unidade: "ng/mL", tipo: "numerico" },
      { nome: "PAPP-A (proteína A plasmática da gravidez)", unidade: "mIU/mL", tipo: "numerico" },
      { nome: "β-hCG livre (MoM)", unidade: "MoM", refMin: "0.5", refMax: "2.5", tipo: "numerico" },
      { nome: "PAPP-A (MoM)", unidade: "MoM", refMin: "0.5", refMax: "2.5", tipo: "numerico" },
      { nome: "Risco calculado Trissomia 21", unidade: "", tipo: "texto" },
      { nome: "Risco calculado Trissomia 18", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Gravidez e Perinatal",
    nome: "Rastreio Pré-natal do 2º Trimestre (Quadruplo)",
    parametros: [
      { nome: "AFP (alfa-fetoproteína) MoM", unidade: "MoM", refMin: "0.5", refMax: "2.5", tipo: "numerico" },
      { nome: "β-hCG Total MoM", unidade: "MoM", refMin: "0.5", refMax: "2.5", tipo: "numerico" },
      { nome: "Estriol não conjugado (uE3) MoM", unidade: "MoM", refMin: "0.5", refMax: "2.0", tipo: "numerico" },
      { nome: "Inibina A MoM", unidade: "MoM", refMin: "0.5", refMax: "2.0", tipo: "numerico" },
      { nome: "Risco calculado Trissomia 21", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Gravidez e Perinatal",
    nome: "Pré-eclâmpsia (PlGF / sFlt-1)",
    parametros: [
      { nome: "PlGF (factor de crescimento placentário)", unidade: "pg/mL", tipo: "numerico" },
      { nome: "sFlt-1 (receptor solúvel do VEGF)", unidade: "pg/mL", tipo: "numerico" },
      { nome: "Ratio sFlt-1/PlGF", unidade: "", refMin: "0", refMax: "38", tipo: "numerico" },
    ],
  },
  {
    categoria: "Gravidez e Perinatal",
    nome: "Rastreio Neonatal Ampliado (Guthrie)",
    parametros: [
      { nome: "Hipotiroidismo Congénito (TSH neonatal)", unidade: "mIU/L", refMin: "0", refMax: "20", tipo: "numerico" },
      { nome: "PKU — Fenilcetonúria (Fenilalanina)", unidade: "mg/dL", refMin: "0", refMax: "2.0", tipo: "numerico" },
      { nome: "Galactosemia (Galactose total)", unidade: "mg/dL", refMin: "0", refMax: "10", tipo: "numerico" },
      { nome: "Hemoglobinopatias (IEF neonatal)", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Gravidez e Perinatal",
    nome: "Streptococcus B (GBS) — Vaginal/Anal",
    parametros: [
      { nome: "Streptococcus agalactiae (Grupo B) cultura", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     CARDIOLOGIA CLÍNICA (EXAMES FUNCIONAIS)
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Cardiologia Clínica",
    nome: "Electrocardiograma (ECG) em Repouso",
    parametros: [
      { nome: "Ritmo", unidade: "", tipo: "selecao", opcoes: ["Sinusal regular", "Sinusal irregular", "Fibrilação auricular", "Flutter auricular", "Taquicardia supra-ventricular", "Taquicardia ventricular", "Bloqueio AV 1º grau", "Bloqueio AV 2º grau Mobitz I", "Bloqueio AV 2º grau Mobitz II", "Bloqueio AV 3º grau (completo)", "Outros"] },
      { nome: "Frequência cardíaca", unidade: "bpm", refMin: "60", refMax: "100", tipo: "numerico" },
      { nome: "Eixo eléctrico", unidade: "°", refMin: "-30", refMax: "90", tipo: "numerico" },
      { nome: "Intervalo PR", unidade: "ms", refMin: "120", refMax: "200", tipo: "numerico" },
      { nome: "Duração QRS", unidade: "ms", refMin: "60", refMax: "120", tipo: "numerico" },
      { nome: "Intervalo QTc (Bazett)", unidade: "ms", refMin: "370", refMax: "450", tipo: "numerico" },
      { nome: "Alterações ST-T", unidade: "", tipo: "selecao", opcoes: ["Sem alterações", "Supra-desnivelamento ST", "Infra-desnivelamento ST", "Inversão onda T", "Onda T achatada"] },
      { nome: "Ondas Q patológicas", unidade: "", tipo: "selecao", opcoes: ["Ausentes", "Presentes — localização:"] },
      { nome: "Conclusão", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Cardiologia Clínica",
    nome: "Teste de Esforço (Prova de Esforço em Tapete/Bicicleta)",
    parametros: [
      { nome: "Protocolo", unidade: "", tipo: "selecao", opcoes: ["Bruce", "Bruce modificado", "Naughton", "Balke-Ware", "Ramp", "Cicloergómetro"] },
      { nome: "FC em repouso", unidade: "bpm", refMin: "50", refMax: "100", tipo: "numerico" },
      { nome: "PA sistólica em repouso", unidade: "mmHg", refMin: "90", refMax: "140", tipo: "numerico" },
      { nome: "PA diastólica em repouso", unidade: "mmHg", refMin: "60", refMax: "90", tipo: "numerico" },
      { nome: "FC máxima atingida", unidade: "bpm", tipo: "numerico" },
      { nome: "% FC máx. prevista atingida", unidade: "%", refMin: "85", refMax: "100", tipo: "numerico" },
      { nome: "PA sistólica máxima", unidade: "mmHg", tipo: "numerico" },
      { nome: "Capacidade funcional (METs)", unidade: "METs", refMin: "7", refMax: "15", tipo: "numerico" },
      { nome: "Duração do esforço", unidade: "min:seg", tipo: "texto" },
      { nome: "Tempo de recuperação FC", unidade: "min", tipo: "numerico" },
      { nome: "Motivo de paragem", unidade: "", tipo: "selecao", opcoes: ["Exaustão física", "Critério FC alvo atingido", "Angina", "Dispneia", "Arritmia", "Alterações ECG", "Hipotensão", "Hipertensão excessiva", "Decisão médica"] },
      { nome: "Alterações ST no pico", unidade: "mm", tipo: "numerico" },
      { nome: "Arritmias observadas", unidade: "", tipo: "texto" },
      { nome: "Sintomas relatados", unidade: "", tipo: "texto" },
      { nome: "Conclusão / Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo para isquémia", "Positivo para isquémia", "Não diagnóstico", "Interrompido por critério de segurança"] },
      { nome: "Observações", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Cardiologia Clínica",
    nome: "Ecocardiograma Transtorácico (ETT)",
    parametros: [
      { nome: "Diâmetro diastólico VE (DDVE)", unidade: "mm", refMin: "42", refMax: "59", tipo: "numerico" },
      { nome: "Diâmetro sistólico VE (DSVE)", unidade: "mm", refMin: "25", refMax: "40", tipo: "numerico" },
      { nome: "Espessura septo interventricular (SIV)", unidade: "mm", refMin: "6", refMax: "11", tipo: "numerico" },
      { nome: "Espessura parede posterior VE (PPVE)", unidade: "mm", refMin: "6", refMax: "11", tipo: "numerico" },
      { nome: "Fracção de ejecção VE (FE — Simpson)", unidade: "%", refMin: "55", refMax: "75", tipo: "numerico" },
      { nome: "Diâmetro AD", unidade: "mm", tipo: "numerico" },
      { nome: "Diâmetro AE", unidade: "mm", refMin: "20", refMax: "40", tipo: "numerico" },
      { nome: "Volume AE (indexado)", unidade: "mL/m²", refMin: "0", refMax: "34", tipo: "numerico" },
      { nome: "Função diastólica — E/A", unidade: "", refMin: "0.8", refMax: "1.5", tipo: "numerico" },
      { nome: "E/e' (pressão de enchimento)", unidade: "", refMin: "0", refMax: "14", tipo: "numerico" },
      { nome: "Velocidade pico tricúspide (IT) para PSAP", unidade: "m/s", refMin: "0", refMax: "2.8", tipo: "numerico" },
      { nome: "PSAP estimada", unidade: "mmHg", refMin: "0", refMax: "35", tipo: "numerico" },
      { nome: "Válvula mitral", unidade: "", tipo: "selecao", opcoes: ["Normal", "Insuficiência ligeira", "Insuficiência moderada", "Insuficiência grave", "Estenose ligeira", "Estenose moderada", "Estenose grave", "Prolapso", "Outras alterações"] },
      { nome: "Válvula aórtica", unidade: "", tipo: "selecao", opcoes: ["Normal", "Insuficiência ligeira", "Insuficiência moderada", "Insuficiência grave", "Estenose ligeira", "Estenose moderada", "Estenose grave", "Esclerose sem estenose significativa"] },
      { nome: "Pericárdio", unidade: "", tipo: "selecao", opcoes: ["Normal", "Derrame ligeiro", "Derrame moderado", "Derrame grave", "Pericardite constritiva"] },
      { nome: "Conclusão", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Cardiologia Clínica",
    nome: "Holter ECG 24h",
    parametros: [
      { nome: "Ritmo dominante", unidade: "", tipo: "texto" },
      { nome: "Frequência cardíaca média", unidade: "bpm", refMin: "50", refMax: "90", tipo: "numerico" },
      { nome: "FC mínima", unidade: "bpm", refMin: "40", refMax: "60", tipo: "numerico" },
      { nome: "FC máxima", unidade: "bpm", refMin: "100", refMax: "170", tipo: "numerico" },
      { nome: "Pausas > 2.5s", unidade: "nº", refMin: "0", refMax: "0", tipo: "numerico" },
      { nome: "Extra-sístoles supraventriculares (ESSV)", unidade: "nº/24h", refMin: "0", refMax: "200", tipo: "numerico" },
      { nome: "Extra-sístoles ventriculares (ESV)", unidade: "nº/24h", refMin: "0", refMax: "100", tipo: "numerico" },
      { nome: "Pares / Tripletos ESV", unidade: "nº", refMin: "0", refMax: "0", tipo: "numerico" },
      { nome: "Episódios FA/Flutter", unidade: "nº", refMin: "0", refMax: "0", tipo: "numerico" },
      { nome: "Alterações ST significativas", unidade: "", tipo: "selecao", opcoes: ["Não observadas", "Supra-desnivelamento", "Infra-desnivelamento"] },
      { nome: "Conclusão", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Cardiologia Clínica",
    nome: "MAPA — Monitorização Ambulatória da Pressão Arterial 24h",
    parametros: [
      { nome: "PA sistólica média 24h", unidade: "mmHg", refMin: "0", refMax: "130", tipo: "numerico" },
      { nome: "PA diastólica média 24h", unidade: "mmHg", refMin: "0", refMax: "80", tipo: "numerico" },
      { nome: "PA sistólica média diurna (vigília)", unidade: "mmHg", refMin: "0", refMax: "135", tipo: "numerico" },
      { nome: "PA diastólica média diurna", unidade: "mmHg", refMin: "0", refMax: "85", tipo: "numerico" },
      { nome: "PA sistólica média nocturna (sono)", unidade: "mmHg", refMin: "0", refMax: "120", tipo: "numerico" },
      { nome: "PA diastólica média nocturna", unidade: "mmHg", refMin: "0", refMax: "70", tipo: "numerico" },
      { nome: "Descida nocturna PA sistólica (dipping)", unidade: "%", refMin: "10", refMax: "20", tipo: "numerico" },
      { nome: "Carga sistólica 24h", unidade: "%", refMin: "0", refMax: "25", tipo: "numerico" },
      { nome: "Padrão de dipping", unidade: "", tipo: "selecao", opcoes: ["Dipper normal", "Non-dipper", "Extreme dipper", "Reverse dipper"] },
      { nome: "Conclusão", unidade: "", tipo: "texto" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     NEUROLOGIA / PSIQUIATRIA
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Neurologia",
    nome: "Biomarcadores de Alzheimer (LCR)",
    parametros: [
      { nome: "Proteína Tau total (t-Tau)", unidade: "pg/mL", refMin: "0", refMax: "300", tipo: "numerico" },
      { nome: "Proteína Tau fosforilada (p-Tau 181)", unidade: "pg/mL", refMin: "0", refMax: "61", tipo: "numerico" },
      { nome: "Amilóide β 42 (Aβ42)", unidade: "pg/mL", refMin: "550", refMax: "2000", tipo: "numerico" },
      { nome: "Ratio Aβ42/Aβ40", unidade: "", refMin: "0.09", refMax: "0.5", tipo: "numerico" },
      { nome: "Ratio Aβ42/p-Tau181", unidade: "", refMin: "6", refMax: "999", tipo: "numerico" },
    ],
  },
  {
    categoria: "Neurologia",
    nome: "Proteína 14-3-3 e RT-QuIC (Prião)",
    parametros: [
      { nome: "Proteína 14-3-3 (LCR)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
      { nome: "RT-QuIC (LCR)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     ANATOMIA PATOLÓGICA / CITOLOGIA
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Anatomia Patológica",
    nome: "Citologia Cervical (Papanicolau / PAP)",
    parametros: [
      { nome: "Adequabilidade da amostra", unidade: "", tipo: "selecao", opcoes: ["Satisfatória para avaliação", "Insatisfatória — ver motivo"] },
      { nome: "Classificação Bethesda", unidade: "", tipo: "selecao", opcoes: ["Negativo para lesão / malignidade (NILM)", "ASC-US (células escamosas atípicas de significado indeterminado)", "LSIL (lesão intra-epitelial escamosa de baixo grau)", "HSIL (lesão intra-epitelial escamosa de alto grau)", "ASC-H (HSIL não excluível)", "Carcinoma de células escamosas", "Células glandulares atípicas (AGC)", "Adenocarcinoma in situ", "Adenocarcinoma invasor"] },
      { nome: "HPV (teste co-teste, se realizado)", unidade: "", tipo: "selecao", opcoes: ["Não realizado", "Negativo", "HPV 16", "HPV 18", "HPV outro alto risco"] },
      { nome: "Agentes infecciosos observados", unidade: "", tipo: "texto" },
    ],
  },
  {
    categoria: "Anatomia Patológica",
    nome: "HPV DNA — Genotipagem",
    parametros: [
      { nome: "HPV 16", unidade: "", tipo: "selecao", opcoes: ["Não detectado", "Detectado"] },
      { nome: "HPV 18", unidade: "", tipo: "selecao", opcoes: ["Não detectado", "Detectado"] },
      { nome: "HPV outros alto risco (31,33,45,52,58…)", unidade: "", tipo: "selecao", opcoes: ["Não detectado", "Detectado"] },
      { nome: "HPV baixo risco (6, 11)", unidade: "", tipo: "selecao", opcoes: ["Não detectado", "Detectado"] },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     METABOLISMO ÓSSEO
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Metabolismo Ósseo",
    nome: "Painel de Metabolismo Ósseo",
    parametros: [
      { nome: "Cálcio total", unidade: "mg/dL", refMin: "8.5", refMax: "10.5", tipo: "numerico" },
      { nome: "Fósforo", unidade: "mg/dL", refMin: "2.5", refMax: "4.5", tipo: "numerico" },
      { nome: "PTH intacta", unidade: "pg/mL", refMin: "15", refMax: "65", tipo: "numerico" },
      { nome: "25-OH Vitamina D", unidade: "ng/mL", refMin: "30", refMax: "100", tipo: "numerico" },
      { nome: "Osteocalcina", unidade: "ng/mL", refMin: "11", refMax: "43", tipo: "numerico" },
      { nome: "CTX (telopeptídeo C-terminal β-CrossLaps)", unidade: "ng/mL", refMin: "0.0", refMax: "0.573", tipo: "numerico" },
      { nome: "P1NP (propeptídeo pró-colagénio tipo I N-terminal)", unidade: "ng/mL", refMin: "15", refMax: "74", tipo: "numerico" },
      { nome: "Fosfatase Alcalina óssea (BAP)", unidade: "µg/L", refMin: "7", refMax: "22", tipo: "numerico" },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     GENÉTICA MOLECULAR
  ═══════════════════════════════════════════════════════ */
  {
    categoria: "Genética Molecular",
    nome: "Cariótipo Convencional",
    parametros: [
      { nome: "Fórmula cromossómica", unidade: "", tipo: "texto" },
      { nome: "Número de cromossomas", unidade: "", refMin: "46", refMax: "46", tipo: "numerico" },
      { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Normal — 46,XX", "Normal — 46,XY", "Alterado — ver descrição"] },
    ],
  },
  {
    categoria: "Genética Molecular",
    nome: "BRCA1 / BRCA2 (pesquisa de mutações)",
    parametros: [
      { nome: "BRCA1 — resultado", unidade: "", tipo: "selecao", opcoes: ["Sem variante patogénica detectada", "Variante patogénica detectada", "Variante de significado incerto (VUS)"] },
      { nome: "BRCA2 — resultado", unidade: "", tipo: "selecao", opcoes: ["Sem variante patogénica detectada", "Variante patogénica detectada", "Variante de significado incerto (VUS)"] },
    ],
  },
  {
    categoria: "Genética Molecular",
    nome: "Factor V Leiden e Protrombina G20210A",
    parametros: [
      { nome: "Factor V Leiden (G1691A)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Heterozigoto", "Homozigoto"] },
      { nome: "Protrombina G20210A", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Heterozigoto", "Homozigoto"] },
      { nome: "MTHFR C677T", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Heterozigoto C/T", "Homozigoto T/T"] },
      { nome: "MTHFR A1298C", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Heterozigoto", "Homozigoto"] },
    ],
  },

  /* ═══════════════════════════════════════════════════════
     FUTI-LAB — SEROLOGIA HEPATITE B/C/A
  ═══════════════════════════════════════════════════════ */
  { codigo: "10000", categoria: "Serologia — Hepatite", nome: "Anticorpo Anti-HBc IgM", preco: 21321.50, prazo: "24h",
    parametros: [{ nome: "Anti-HBc IgM", unidade: "", tipo: "selecao", opcoes: ["Não reactivo", "Reactivo"] }] },
  { codigo: "10001", categoria: "Serologia — Hepatite", nome: "Anticorpo Anti-HBc Total (IgG)", preco: 21321.50, prazo: "24h",
    parametros: [{ nome: "Anti-HBc IgG (Total)", unidade: "", tipo: "selecao", opcoes: ["Não reactivo", "Reactivo"] }] },
  { codigo: "10002", categoria: "Serologia — Hepatite", nome: "Anticorpo Anti-HBe", preco: 21312.50, prazo: "24h",
    parametros: [{ nome: "Anti-HBe", unidade: "", tipo: "selecao", opcoes: ["Não reactivo", "Reactivo"] }] },
  { codigo: "10003", categoria: "Serologia — Hepatite", nome: "Anticorpo Anti-HBs", preco: 21312.50, prazo: "24h",
    parametros: [{ nome: "Anti-HBs", unidade: "mUI/mL", refMin: "0", refMax: "10", tipo: "numerico" }, { nome: "Interpretação", unidade: "", tipo: "selecao", opcoes: ["Negativo (<10)", "Positivo (≥10)"] }] },
  { codigo: "10004", categoria: "Serologia — Hepatite", nome: "Antigenio HBe (HBeAg)", preco: 21312.50, prazo: "24h",
    parametros: [{ nome: "HBeAg", unidade: "", tipo: "selecao", opcoes: ["Não reactivo", "Reactivo"] }] },
  { codigo: "10130", categoria: "Serologia — Hepatite", nome: "HBs Ag (Antigénio de Superfície)", preco: 13062.50, prazo: "24h",
    parametros: [{ nome: "HBsAg", unidade: "", tipo: "selecao", opcoes: ["Não reactivo", "Reactivo"] }] },
  { codigo: "10131", categoria: "Serologia — Hepatite", nome: "HBs Ag Confirmatório", preco: 28187.50, prazo: "48h",
    parametros: [{ nome: "HBsAg (confirmação)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Índice de confirmação", unidade: "", tipo: "numerico" }] },
  { codigo: "10128", categoria: "Serologia — Hepatite", nome: "HAV IgM (Vírus Hepatite A)", preco: 27706.25, prazo: "48h",
    parametros: [{ nome: "Anti-HAV IgM", unidade: "", tipo: "selecao", opcoes: ["Não reactivo", "Reactivo"] }] },
  { codigo: "10129", categoria: "Serologia — Hepatite", nome: "HAV Total IgG (Vírus Hepatite A)", preco: 27706.25, prazo: "48h",
    parametros: [{ nome: "Anti-HAV IgG", unidade: "", tipo: "selecao", opcoes: ["Não reactivo", "Reactivo"] }] },
  { codigo: "10132", categoria: "Serologia — Hepatite", nome: "HCV (Anticorpo Anti-Hepatite C)", preco: 14437.50, prazo: "24h",
    parametros: [{ nome: "Anti-HCV", unidade: "", tipo: "selecao", opcoes: ["Não reactivo", "Reactivo"] }] },
  { codigo: "10030", categoria: "Serologia — Hepatite", nome: "Carga Viral HCV", preco: 173250.00, prazo: "15 Dias",
    parametros: [{ nome: "RNA HCV (cópias/mL)", unidade: "UI/mL", tipo: "numerico" }, { nome: "Resultado qualitativo", unidade: "", tipo: "selecao", opcoes: ["Indetectável", "Detectável"] }] },
  { codigo: "10031", categoria: "Serologia — Hepatite", nome: "Carga Viral HIV", preco: 173250.00, prazo: "15 Dias",
    parametros: [{ nome: "RNA HIV-1 (cópias/mL)", unidade: "cópias/mL", tipo: "numerico" }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Indetectável (<20)", "Detectável"] }] },
  { codigo: "10032", categoria: "Serologia — Hepatite", nome: "Carga Viral HBV (Hepatite B)", preco: 173250.00, prazo: "15 Dias",
    parametros: [{ nome: "DNA HBV", unidade: "UI/mL", tipo: "numerico" }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Indetectável", "Detectável"] }] },

  /* ═══════════════════════════════════════════════════════
     FUTI-LAB — MARCADORES TUMORAIS
  ═══════════════════════════════════════════════════════ */
  { codigo: "10005", categoria: "Marcadores Tumorais", nome: "CEA — Antigénio Carcinoembrinário", preco: 22687.50, prazo: "24h",
    parametros: [{ nome: "CEA", unidade: "ng/mL", refMin: "0", refMax: "5.0", tipo: "numerico" }] },
  { codigo: "10009", categoria: "Marcadores Tumorais", nome: "AFP — Alfa Fetoproteína", preco: 28187.50, prazo: "24h",
    parametros: [{ nome: "AFP", unidade: "ng/mL", refMin: "0", refMax: "10.0", tipo: "numerico" }] },
  { codigo: "10026", categoria: "Marcadores Tumorais", nome: "CA 125", preco: 27912.50, prazo: "48h",
    parametros: [{ nome: "CA 125", unidade: "U/mL", refMin: "0", refMax: "35.0", tipo: "numerico" }] },
  { codigo: "10027", categoria: "Marcadores Tumorais", nome: "CA 15.3", preco: 27912.50, prazo: "48h",
    parametros: [{ nome: "CA 15-3", unidade: "U/mL", refMin: "0", refMax: "30.0", tipo: "numerico" }] },
  { codigo: "10028", categoria: "Marcadores Tumorais", nome: "CA 19.9", preco: 27912.50, prazo: "48h",
    parametros: [{ nome: "CA 19-9", unidade: "U/mL", refMin: "0", refMax: "37.0", tipo: "numerico" }] },
  { codigo: "10194", categoria: "Marcadores Tumorais", nome: "PSA Livre", preco: 40000.00, prazo: "48h",
    parametros: [{ nome: "PSA Livre", unidade: "ng/mL", tipo: "numerico" }, { nome: "Ratio PSA Livre/Total (%)", unidade: "%", refMin: "25", refMax: "100", tipo: "numerico" }] },
  { codigo: "10195", categoria: "Marcadores Tumorais", nome: "PSA Total", preco: 40000.00, prazo: "48h",
    parametros: [{ nome: "PSA Total", unidade: "ng/mL", refMin: "0", refMax: "4.0", tipo: "numerico" }] },

  /* ═══════════════════════════════════════════════════════
     FUTI-LAB — BIOQUÍMICA INDIVIDUAL
  ═══════════════════════════════════════════════════════ */
  { codigo: "10007", categoria: "Bioquímica", nome: "Ácido Úrico", preco: 6875.00, prazo: "24h",
    parametros: [{ nome: "Ácido Úrico", unidade: "mg/dL", refMin: "2.5", refMax: "7.0", tipo: "numerico" }] },
  { codigo: "10006", categoria: "Bioquímica", nome: "Ácido Úrico na Urina de 24h", preco: 29562.50, prazo: "24h",
    parametros: [{ nome: "Ácido Úrico urina 24h", unidade: "mg/24h", refMin: "250", refMax: "750", tipo: "numerico" }] },
  { codigo: "10014", categoria: "Bioquímica", nome: "Albumina (sérica)", preco: 6325.00, prazo: "24h",
    parametros: [{ nome: "Albumina", unidade: "g/dL", refMin: "3.5", refMax: "5.2", tipo: "numerico" }] },
  { codigo: "10012", categoria: "Bioquímica", nome: "Albumina na Urina de 24h", preco: 7012.50, prazo: "24h",
    parametros: [{ nome: "Albumina urina 24h", unidade: "mg/24h", refMin: "0", refMax: "30", tipo: "numerico" }] },
  { codigo: "10013", categoria: "Bioquímica", nome: "Aldolase", preco: 15675.00, prazo: "24h",
    parametros: [{ nome: "Aldolase", unidade: "U/L", refMin: "1.0", refMax: "7.5", tipo: "numerico" }] },
  { codigo: "10018", categoria: "Bioquímica", nome: "Amilase Pancreática", preco: 13818.75, prazo: "24h",
    parametros: [{ nome: "Amilase Pancreática", unidade: "U/L", refMin: "0", refMax: "100", tipo: "numerico" }] },
  { codigo: "10015", categoria: "Bioquímica", nome: "GPT (ALT — Alanina Aminotransferase)", preco: 8250.00, prazo: "24h",
    parametros: [{ nome: "GPT/ALT", unidade: "U/L", refMin: "0", refMax: "40", tipo: "numerico" }] },
  { codigo: "10016", categoria: "Bioquímica", nome: "GOT (AST — Aspartato Aminotransferase)", preco: 8250.00, prazo: "24h",
    parametros: [{ nome: "GOT/AST", unidade: "U/L", refMin: "0", refMax: "40", tipo: "numerico" }] },
  { codigo: "10017", categoria: "Bioquímica", nome: "GGT (Gama Glutamil Transferase)", preco: 8250.00, prazo: "24h",
    parametros: [{ nome: "GGT", unidade: "U/L", refMin: "0", refMax: "55", tipo: "numerico" }] },
  { codigo: "10022", categoria: "Bioquímica", nome: "Bilirrubina Direta", preco: 6325.00, prazo: "24h",
    parametros: [{ nome: "Bilirrubina Direta", unidade: "mg/dL", refMin: "0.0", refMax: "0.3", tipo: "numerico" }] },
  { codigo: "10023", categoria: "Bioquímica", nome: "Bilirrubina Total", preco: 6325.00, prazo: "24h",
    parametros: [{ nome: "Bilirrubina Total", unidade: "mg/dL", refMin: "0.2", refMax: "1.2", tipo: "numerico" }, { nome: "Bilirrubina Indireta", unidade: "mg/dL", refMin: "0.1", refMax: "0.9", tipo: "numerico" }] },
  { codigo: "10029", categoria: "Bioquímica", nome: "Cálcio (sérico)", preco: 6875.00, prazo: "24h",
    parametros: [{ nome: "Cálcio", unidade: "mg/dL", refMin: "8.5", refMax: "10.5", tipo: "numerico" }] },
  { codigo: "10172", categoria: "Bioquímica", nome: "Cálcio na Urina de 24h", preco: 3960.00, prazo: "24h",
    parametros: [{ nome: "Cálcio urina 24h", unidade: "mg/24h", refMin: "50", refMax: "300", tipo: "numerico" }] },
  { codigo: "10034", categoria: "Bioquímica", nome: "Cloro (Cl — sérico)", preco: 7562.50, prazo: "24h",
    parametros: [{ nome: "Cloro", unidade: "mEq/L", refMin: "96", refMax: "106", tipo: "numerico" }] },
  { codigo: "10033", categoria: "Bioquímica", nome: "Cloro na Urina de 24h", preco: 7562.50, prazo: "24h",
    parametros: [{ nome: "Cloro urina 24h", unidade: "mEq/24h", refMin: "110", refMax: "250", tipo: "numerico" }] },
  { codigo: "10035", categoria: "Bioquímica", nome: "CK (Creatinina Quinase)", preco: 10312.50, prazo: "24h",
    parametros: [{ nome: "CK Total", unidade: "U/L", refMin: "26", refMax: "308", tipo: "numerico" }] },
  { codigo: "10036", categoria: "Bioquímica", nome: "CK-MB (Fracção Cardíaca)", preco: 33000.00, prazo: "48h",
    parametros: [{ nome: "CK-MB (massa)", unidade: "ng/mL", refMin: "0", refMax: "5.0", tipo: "numerico" }, { nome: "CK-MB (%)", unidade: "%", refMin: "0", refMax: "5", tipo: "numerico" }] },
  { codigo: "10039", categoria: "Bioquímica", nome: "Colesterol HDL", preco: 8937.50, prazo: "24h",
    parametros: [{ nome: "Colesterol HDL", unidade: "mg/dL", refMin: "40", refMax: "200", tipo: "numerico" }] },
  { codigo: "10040", categoria: "Bioquímica", nome: "Colesterol LDL", preco: 8937.50, prazo: "24h",
    parametros: [{ nome: "Colesterol LDL", unidade: "mg/dL", refMin: "0", refMax: "130", tipo: "numerico" }] },
  { codigo: "10041", categoria: "Bioquímica", nome: "Colesterol Total", preco: 6325.00, prazo: "24h",
    parametros: [{ nome: "Colesterol Total", unidade: "mg/dL", refMin: "0", refMax: "200", tipo: "numerico" }] },
  { codigo: "10042", categoria: "Bioquímica", nome: "Colesterol VLDL", preco: 8937.50, prazo: "24h",
    parametros: [{ nome: "Colesterol VLDL", unidade: "mg/dL", refMin: "0", refMax: "30", tipo: "numerico" }] },
  { codigo: "10052", categoria: "Bioquímica", nome: "Creatinina (sérica)", preco: 6325.00, prazo: "24h",
    parametros: [{ nome: "Creatinina", unidade: "mg/dL", refMin: "0.6", refMax: "1.2", tipo: "numerico" }] },
  { codigo: "10050", categoria: "Bioquímica", nome: "Creatinina na Urina de 24h", preco: 7562.50, prazo: "24h",
    parametros: [{ nome: "Creatinina urina 24h", unidade: "mg/24h", refMin: "500", refMax: "2000", tipo: "numerico" }] },
  { codigo: "10085", categoria: "Bioquímica", nome: "Depuração da Creatinina (Clearance)", preco: 14437.50, prazo: "24h",
    parametros: [{ nome: "Creatinina sérica", unidade: "mg/dL", refMin: "0.6", refMax: "1.2", tipo: "numerico" }, { nome: "Creatinina urina 24h", unidade: "mg/24h", tipo: "numerico" }, { nome: "Depuração creatinina", unidade: "mL/min/1.73m²", refMin: "80", refMax: "130", tipo: "numerico" }, { nome: "Volume urina 24h", unidade: "mL", tipo: "numerico" }] },
  { codigo: "10054", categoria: "Bioquímica", nome: "PCR — Proteína C Reactiva", preco: 9006.25, prazo: "24h",
    parametros: [{ nome: "PCR", unidade: "mg/L", refMin: "0", refMax: "5.0", tipo: "numerico" }] },
  { codigo: "10060", categoria: "Bioquímica", nome: "D-Dímero", preco: 26375.00, prazo: "48h",
    parametros: [{ nome: "D-Dímero", unidade: "µg/mL FEU", refMin: "0.0", refMax: "0.5", tipo: "numerico" }] },
  { codigo: "10102", categoria: "Bioquímica", nome: "Ferro Sérico", preco: 20625.00, prazo: "24h",
    parametros: [{ nome: "Ferro Sérico", unidade: "µg/dL", refMin: "60", refMax: "170", tipo: "numerico" }] },
  { codigo: "10100", categoria: "Bioquímica", nome: "Ferritina", preco: 26125.00, prazo: "48h",
    parametros: [{ nome: "Ferritina", unidade: "ng/mL", refMin: "12", refMax: "300", tipo: "numerico" }] },
  { codigo: "10111", categoria: "Bioquímica", nome: "Factor Reumatoide (FR)", preco: 10106.25, prazo: "24h",
    parametros: [{ nome: "Factor Reumatoide", unidade: "UI/mL", refMin: "0", refMax: "14", tipo: "numerico" }, { nome: "Resultado qualitativo", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10125", categoria: "Bioquímica", nome: "Glicose (Glicemia em Jejum)", preco: 6668.75, prazo: "24h",
    parametros: [{ nome: "Glicose", unidade: "mg/dL", refMin: "70", refMax: "100", tipo: "numerico" }] },
  { codigo: "10124", categoria: "Bioquímica", nome: "Glicemia Pós-Prandial (2h)", preco: 5568.75, prazo: "24h",
    parametros: [{ nome: "Glicose pós-prandial", unidade: "mg/dL", refMin: "70", refMax: "140", tipo: "numerico" }] },
  { codigo: "10196", categoria: "Bioquímica", nome: "PTGO — Prova de Tolerância à Glicose Oral", preco: 25000.00, prazo: "24h",
    parametros: [{ nome: "Glicose em jejum", unidade: "mg/dL", refMin: "70", refMax: "100", tipo: "numerico" }, { nome: "Glicose 1h (75g)", unidade: "mg/dL", refMin: "0", refMax: "180", tipo: "numerico" }, { nome: "Glicose 2h (75g)", unidade: "mg/dL", refMin: "0", refMax: "140", tipo: "numerico" }, { nome: "Interpretação", unidade: "", tipo: "texto" }] },
  { codigo: "10148", categoria: "Bioquímica", nome: "Ionograma Sanguíneo (Na, K, Cl)", preco: 24750.00, prazo: "48h",
    parametros: [{ nome: "Sódio (Na)", unidade: "mEq/L", refMin: "136", refMax: "145", tipo: "numerico" }, { nome: "Potássio (K)", unidade: "mEq/L", refMin: "3.5", refMax: "5.0", tipo: "numerico" }, { nome: "Cloro (Cl)", unidade: "mEq/L", refMin: "96", refMax: "106", tipo: "numerico" }] },
  { codigo: "10149", categoria: "Bioquímica", nome: "Potássio — K (sérico)", preco: 5775.00, prazo: "24h",
    parametros: [{ nome: "Potássio", unidade: "mEq/L", refMin: "3.5", refMax: "5.0", tipo: "numerico" }] },
  { codigo: "10150", categoria: "Bioquímica", nome: "Potássio — K (urina 24h)", preco: 5775.00, prazo: "24h",
    parametros: [{ nome: "Potássio urina 24h", unidade: "mEq/24h", refMin: "25", refMax: "125", tipo: "numerico" }] },
  { codigo: "10153", categoria: "Bioquímica", nome: "LDH — Lactato Desidrogenase", preco: 8937.50, prazo: "24h",
    parametros: [{ nome: "LDH", unidade: "U/L", refMin: "100", refMax: "240", tipo: "numerico" }] },
  { codigo: "10158", categoria: "Bioquímica", nome: "Lipase", preco: 41250.00, prazo: "24h",
    parametros: [{ nome: "Lipase", unidade: "U/L", refMin: "0", refMax: "60", tipo: "numerico" }] },
  { codigo: "10166", categoria: "Bioquímica", nome: "Magnésio — Mg (sérico)", preco: 13750.00, prazo: "48h",
    parametros: [{ nome: "Magnésio", unidade: "mg/dL", refMin: "1.7", refMax: "2.2", tipo: "numerico" }] },
  { codigo: "10164", categoria: "Bioquímica", nome: "Magnésio na Urina de 24h", preco: 17325.00, prazo: "48h",
    parametros: [{ nome: "Magnésio urina 24h", unidade: "mg/24h", refMin: "72", refMax: "120", tipo: "numerico" }] },
  { codigo: "10167", categoria: "Bioquímica", nome: "Microalbuminúria", preco: 11687.50, prazo: "24h",
    parametros: [{ nome: "Microalbuminúria", unidade: "mg/L", refMin: "0", refMax: "30", tipo: "numerico" }, { nome: "Índice Albumina/Creatinina", unidade: "mg/g", refMin: "0", refMax: "30", tipo: "numerico" }] },
  { codigo: "10170", categoria: "Bioquímica", nome: "Sódio — Na (sérico)", preco: 8250.00, prazo: "24h",
    parametros: [{ nome: "Sódio", unidade: "mEq/L", refMin: "136", refMax: "145", tipo: "numerico" }] },
  { codigo: "10169", categoria: "Bioquímica", nome: "Sódio — Na (urina 24h)", preco: 8250.00, prazo: "24h",
    parametros: [{ nome: "Sódio urina 24h", unidade: "mEq/24h", refMin: "40", refMax: "220", tipo: "numerico" }] },
  { codigo: "10187", categoria: "Bioquímica", nome: "Fósforo (Fosfato sérico)", preco: 22275.00, prazo: "24h",
    parametros: [{ nome: "Fósforo", unidade: "mg/dL", refMin: "2.5", refMax: "4.5", tipo: "numerico" }] },
  { codigo: "10112", categoria: "Bioquímica", nome: "Fósforo na Urina de 24h", preco: 6668.75, prazo: "48h",
    parametros: [{ nome: "Fósforo urina 24h", unidade: "mg/24h", refMin: "400", refMax: "1300", tipo: "numerico" }] },
  { codigo: "10188", categoria: "Bioquímica", nome: "Fosfatase Alcalina", preco: 8250.00, prazo: "24h",
    parametros: [{ nome: "Fosfatase Alcalina", unidade: "U/L", refMin: "40", refMax: "150", tipo: "numerico" }] },
  { codigo: "10313", categoria: "Bioquímica", nome: "Fosfatase Ácida", preco: 20000.00, prazo: "24h",
    parametros: [{ nome: "Fosfatase Ácida Total", unidade: "U/L", refMin: "0", refMax: "5.5", tipo: "numerico" }, { nome: "Fosfatase Ácida Prostática", unidade: "U/L", refMin: "0", refMax: "3.0", tipo: "numerico" }] },
  { codigo: "10192", categoria: "Bioquímica", nome: "Proteína Total (sérica)", preco: 6187.50, prazo: "24h",
    parametros: [{ nome: "Proteína Total", unidade: "g/dL", refMin: "6.0", refMax: "8.3", tipo: "numerico" }] },
  { codigo: "10193", categoria: "Bioquímica", nome: "Proteína na Urina de 24h", preco: 6187.50, prazo: "24h",
    parametros: [{ nome: "Proteína urina 24h", unidade: "mg/24h", refMin: "0", refMax: "150", tipo: "numerico" }] },
  { codigo: "10213", categoria: "Bioquímica", nome: "Triglicerídeos", preco: 7562.50, prazo: "24h",
    parametros: [{ nome: "Triglicerídeos", unidade: "mg/dL", refMin: "0", refMax: "150", tipo: "numerico" }] },
  { codigo: "10214", categoria: "Bioquímica", nome: "Ureia (sérica)", preco: 7562.50, prazo: "24h",
    parametros: [{ nome: "Ureia", unidade: "mg/dL", refMin: "15", refMax: "45", tipo: "numerico" }, { nome: "BUN", unidade: "mg/dL", refMin: "7", refMax: "21", tipo: "numerico" }] },
  { codigo: "10215", categoria: "Bioquímica", nome: "Ureia na Urina de 24h", preco: 7562.50, prazo: "24h",
    parametros: [{ nome: "Ureia urina 24h", unidade: "g/24h", refMin: "12", refMax: "20", tipo: "numerico" }] },
  { codigo: "10212", categoria: "Bioquímica", nome: "Transferrina", preco: 28875.00, prazo: "48h",
    parametros: [{ nome: "Transferrina", unidade: "mg/dL", refMin: "200", refMax: "360", tipo: "numerico" }, { nome: "Saturação da Transferrina", unidade: "%", refMin: "20", refMax: "50", tipo: "numerico" }] },
  { codigo: "10302", categoria: "Bioquímica", nome: "Ácido Fólico", preco: 16000.00, prazo: "24h",
    parametros: [{ nome: "Ácido Fólico", unidade: "ng/mL", refMin: "3.1", refMax: "17.5", tipo: "numerico" }] },
  { codigo: "10317", categoria: "Bioquímica", nome: "Mioglobina", preco: 25500.00, prazo: "48h",
    parametros: [{ nome: "Mioglobina", unidade: "ng/mL", refMin: "0", refMax: "92", tipo: "numerico" }] },
  { codigo: "10318", categoria: "Bioquímica", nome: "Péptido C", preco: 45000.00, prazo: "48h",
    parametros: [{ nome: "Péptido C", unidade: "ng/mL", refMin: "0.5", refMax: "2.0", tipo: "numerico" }] },

  /* ═══════════════════════════════════════════════════════
     FUTI-LAB — HEMATOLOGIA INDIVIDUAL
  ═══════════════════════════════════════════════════════ */
  { codigo: "10136", categoria: "Hematologia", nome: "Hemograma Completo (Futi-Lab)", preco: 5775.00, prazo: "24h",
    parametros: [{ nome: "Hemoglobina", unidade: "g/dL", refMin: "12.0", refMax: "17.0", tipo: "numerico" }, { nome: "Hematócrito", unidade: "%", refMin: "36", refMax: "50", tipo: "numerico" }, { nome: "Eritrócitos", unidade: "×10⁶/µL", refMin: "4.0", refMax: "6.0", tipo: "numerico" }, { nome: "Leucócitos", unidade: "×10³/µL", refMin: "4.0", refMax: "11.0", tipo: "numerico" }, { nome: "Plaquetas", unidade: "×10³/µL", refMin: "150", refMax: "400", tipo: "numerico" }] },
  { codigo: "10043", categoria: "Hematologia", nome: "Contagem de Reticulócitos", preco: 14437.50, prazo: "24h",
    parametros: [{ nome: "Reticulócitos (%)", unidade: "%", refMin: "0.5", refMax: "2.5", tipo: "numerico" }, { nome: "Reticulócitos (abs.)", unidade: "×10³/µL", refMin: "25", refMax: "100", tipo: "numerico" }] },
  { codigo: "10044", categoria: "Hematologia", nome: "Contagem CD3/CD4/CD8", preco: 165550.00, prazo: "5 Dias",
    parametros: [{ nome: "CD3+ (abs.)", unidade: "células/µL", refMin: "700", refMax: "2100", tipo: "numerico" }, { nome: "CD4+ (abs.)", unidade: "células/µL", refMin: "500", refMax: "1500", tipo: "numerico" }, { nome: "CD4+ (%)", unidade: "%", refMin: "28", refMax: "57", tipo: "numerico" }, { nome: "CD8+ (abs.)", unidade: "células/µL", refMin: "180", refMax: "1000", tipo: "numerico" }, { nome: "CD8+ (%)", unidade: "%", refMin: "10", refMax: "39", tipo: "numerico" }, { nome: "Ratio CD4/CD8", unidade: "", refMin: "1.0", refMax: "3.5", tipo: "numerico" }] },
  { codigo: "10046", categoria: "Hematologia", nome: "Contagem de Eosinófilos", preco: 11000.00, prazo: "24h",
    parametros: [{ nome: "Eosinófilos (%)", unidade: "%", refMin: "1", refMax: "4", tipo: "numerico" }, { nome: "Eosinófilos (abs.)", unidade: "×10³/µL", refMin: "0.0", refMax: "0.5", tipo: "numerico" }] },
  { codigo: "10047", categoria: "Hematologia", nome: "Contagem de Plaquetas", preco: 11687.50, prazo: "24h",
    parametros: [{ nome: "Plaquetas", unidade: "×10³/µL", refMin: "150", refMax: "400", tipo: "numerico" }] },
  { codigo: "10175", categoria: "Hematologia", nome: "Numeração de Plaquetas", preco: 6600.00, prazo: "24h",
    parametros: [{ nome: "Plaquetas", unidade: "×10³/µL", refMin: "150", refMax: "400", tipo: "numerico" }] },
  { codigo: "10048", categoria: "Hematologia", nome: "Coagulograma Completo", preco: 35062.50, prazo: "24h",
    parametros: [{ nome: "Tempo de Protrombina (TP)", unidade: "s", refMin: "11", refMax: "15", tipo: "numerico" }, { nome: "INR", unidade: "", refMin: "0.8", refMax: "1.2", tipo: "numerico" }, { nome: "TTPa", unidade: "s", refMin: "25", refMax: "38", tipo: "numerico" }, { nome: "Fibrinogénio", unidade: "mg/dL", refMin: "200", refMax: "400", tipo: "numerico" }, { nome: "Tempo de Trombina", unidade: "s", refMin: "14", refMax: "21", tipo: "numerico" }, { nome: "D-Dímero", unidade: "µg/mL FEU", refMin: "0.0", refMax: "0.5", tipo: "numerico" }] },
  { codigo: "10107", categoria: "Hematologia", nome: "Coombs Directo (DAT)", preco: 21312.50, prazo: "24h",
    parametros: [{ nome: "Coombs Directo", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo +", "Positivo ++", "Positivo +++"] }] },
  { codigo: "10108", categoria: "Hematologia", nome: "Coombs Indirecto (IAT)", preco: 21312.50, prazo: "24h",
    parametros: [{ nome: "Coombs Indirecto", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo +", "Positivo ++", "Positivo +++"] }] },
  { codigo: "10127", categoria: "Hematologia", nome: "Grupo Sanguíneo ABO e Factor Rh", preco: 6888.75, prazo: "24h",
    parametros: [{ nome: "Grupo Sanguíneo", unidade: "", tipo: "selecao", opcoes: ["A", "B", "AB", "O"] }, { nome: "Factor Rh", unidade: "", tipo: "selecao", opcoes: ["Positivo (+)", "Negativo (-)"] }] },
  { codigo: "10151", categoria: "Hematologia", nome: "Lâmina de Sangue Periférico", preco: 49500.00, prazo: "3 Dias",
    parametros: [{ nome: "Morfologia eritrocitária", unidade: "", tipo: "texto" }, { nome: "Morfologia leucocitária", unidade: "", tipo: "texto" }, { nome: "Morfologia plaquetária", unidade: "", tipo: "texto" }, { nome: "Células anormais", unidade: "", tipo: "selecao", opcoes: ["Não observadas", "Presentes"] }, { nome: "Conclusão", unidade: "", tipo: "texto" }] },
  { codigo: "10178", categoria: "Hematologia", nome: "RAI — Pesquisa de Anticorpos Irregulares", preco: 31350.00, prazo: "48h",
    parametros: [{ nome: "RAI (Pesquisa)", unidade: "", tipo: "selecao", opcoes: ["Negativa", "Positiva"] }, { nome: "Especificidade (se positivo)", unidade: "", tipo: "texto" }] },
  { codigo: "10203", categoria: "Hematologia", nome: "Tempo de Protrombina (TP)", preco: 9075.00, prazo: "24h",
    parametros: [{ nome: "Tempo de Protrombina", unidade: "s", refMin: "11", refMax: "15", tipo: "numerico" }, { nome: "Actividade", unidade: "%", refMin: "70", refMax: "120", tipo: "numerico" }, { nome: "INR", unidade: "", refMin: "0.8", refMax: "1.2", tipo: "numerico" }] },
  { codigo: "10204", categoria: "Hematologia", nome: "TC — Tempo de Coagulação", preco: 4812.50, prazo: "24h",
    parametros: [{ nome: "Tempo de Coagulação", unidade: "min", refMin: "5", refMax: "10", tipo: "numerico" }] },
  { codigo: "10205", categoria: "Hematologia", nome: "TH — Tempo de Hemorragia", preco: 4812.50, prazo: "24h",
    parametros: [{ nome: "Tempo de Hemorragia", unidade: "min", refMin: "1", refMax: "6", tipo: "numerico" }] },
  { codigo: "10206", categoria: "Hematologia", nome: "Teste de Falciformação", preco: 6187.50, prazo: "24h",
    parametros: [{ nome: "Teste de Falcização", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Resultado HbSS/HbAS", unidade: "", tipo: "texto" }] },
  { codigo: "10332", categoria: "Hematologia", nome: "Fibrinogénio", preco: 9036.00, prazo: "24h",
    parametros: [{ nome: "Fibrinogénio", unidade: "mg/dL", refMin: "200", refMax: "400", tipo: "numerico" }] },
  { codigo: "10168", categoria: "Hematologia", nome: "Mineralograma Completo", preco: 80000.00, prazo: "72h",
    parametros: [{ nome: "Sódio (Na)", unidade: "mEq/L", refMin: "136", refMax: "145", tipo: "numerico" }, { nome: "Potássio (K)", unidade: "mEq/L", refMin: "3.5", refMax: "5.0", tipo: "numerico" }, { nome: "Cloro (Cl)", unidade: "mEq/L", refMin: "96", refMax: "106", tipo: "numerico" }, { nome: "Magnésio (Mg)", unidade: "mg/dL", refMin: "1.7", refMax: "2.2", tipo: "numerico" }, { nome: "Cálcio (Ca)", unidade: "mg/dL", refMin: "8.5", refMax: "10.5", tipo: "numerico" }, { nome: "Fósforo (P)", unidade: "mg/dL", refMin: "2.5", refMax: "4.5", tipo: "numerico" }] },
  { codigo: "10331", categoria: "Hematologia", nome: "Mineralograma Simples", preco: 45000.00, prazo: "72h",
    parametros: [{ nome: "Sódio (Na)", unidade: "mEq/L", refMin: "136", refMax: "145", tipo: "numerico" }, { nome: "Potássio (K)", unidade: "mEq/L", refMin: "3.5", refMax: "5.0", tipo: "numerico" }, { nome: "Cálcio (Ca)", unidade: "mg/dL", refMin: "8.5", refMax: "10.5", tipo: "numerico" }] },
  { codigo: "10008", categoria: "Hematologia", nome: "APTT (TTPa isolado)", preco: 17325.00, prazo: "24h",
    parametros: [{ nome: "TTPa", unidade: "s", refMin: "25", refMax: "38", tipo: "numerico" }, { nome: "Ratio TTPa", unidade: "", refMin: "0.8", refMax: "1.2", tipo: "numerico" }] },
  { codigo: "10086", categoria: "Hematologia", nome: "Electroforese de Hemoglobina", preco: 28875.00, prazo: "5 - 7 Dias",
    parametros: [{ nome: "HbA1", unidade: "%", refMin: "95", refMax: "98", tipo: "numerico" }, { nome: "HbA2", unidade: "%", refMin: "1.5", refMax: "3.5", tipo: "numerico" }, { nome: "HbF (fetal)", unidade: "%", refMin: "0.0", refMax: "2.0", tipo: "numerico" }, { nome: "HbS", unidade: "%", refMin: "0.0", refMax: "0.0", tipo: "numerico" }, { nome: "Interpretação", unidade: "", tipo: "texto" }] },

  /* ═══════════════════════════════════════════════════════
     FUTI-LAB — MICROBIOLOGIA / CULTURAS
  ═══════════════════════════════════════════════════════ */
  { codigo: "10019", categoria: "Microbiologia", nome: "Baciloscopia 1ª Amostra (BAAR)", preco: 27500.00, prazo: "24h",
    parametros: [{ nome: "Resultado (BAAR)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "1+ (1-9 BAAR/100 campos)", "2+ (1-9 BAAR/10 campos)", "3+ (1-9 BAAR/campo)", "4+ (>9 BAAR/campo)"] }, { nome: "Observações", unidade: "", tipo: "texto" }] },
  { codigo: "10020", categoria: "Microbiologia", nome: "Baciloscopia 2ª Amostra (BAAR)", preco: 27500.00, prazo: "24h",
    parametros: [{ nome: "Resultado (BAAR)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "1+", "2+", "3+", "4+"] }, { nome: "Observações", unidade: "", tipo: "texto" }] },
  { codigo: "10021", categoria: "Microbiologia", nome: "Baciloscopia 3ª Amostra (BAAR)", preco: 27500.00, prazo: "24h",
    parametros: [{ nome: "Resultado (BAAR)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "1+", "2+", "3+", "4+"] }, { nome: "Observações", unidade: "", tipo: "texto" }] },
  { codigo: "10055", categoria: "Microbiologia", nome: "Cultura Bacteriológica", preco: 24475.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado da cultura", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo isolado", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10056", categoria: "Microbiologia", nome: "Cultura da Ferida", preco: 24475.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo isolado", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10057", categoria: "Microbiologia", nome: "Coprocultura 1ª Amostra", preco: 24475.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Agente isolado", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10058", categoria: "Microbiologia", nome: "Coprocultura 2ª Amostra", preco: 24475.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Agente isolado", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10059", categoria: "Microbiologia", nome: "Coprocultura 3ª Amostra", preco: 24475.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Agente isolado", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10063", categoria: "Microbiologia", nome: "Hemocultura", preco: 55000.00, prazo: "14 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo isolado", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10064", categoria: "Microbiologia", nome: "Cultura de Secreções do Ouvido", preco: 24475.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10065", categoria: "Microbiologia", nome: "Cultura de Secreções Vaginais", preco: 27225.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10066", categoria: "Microbiologia", nome: "Cultura de Secreções Uretrais", preco: 27225.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10067", categoria: "Microbiologia", nome: "Cultura de Secreções Oculares", preco: 28600.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10068", categoria: "Microbiologia", nome: "Cultura de Secreções da Nasofaringe", preco: 28600.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10069", categoria: "Microbiologia", nome: "Cultura de Secreções Purulentas", preco: 28600.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10070", categoria: "Microbiologia", nome: "Cultura de Secreções Traqueais", preco: 28600.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10071", categoria: "Microbiologia", nome: "Cultura de Secreções Endocervicais", preco: 28600.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10072", categoria: "Microbiologia", nome: "Cultura de Expectoração", preco: 28600.00, prazo: "14 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10073", categoria: "Microbiologia", nome: "Cultura de Lavado Broncoalveolar", preco: 28600.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10074", categoria: "Microbiologia", nome: "Cultura de Líquido Biliar", preco: 28600.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10075", categoria: "Microbiologia", nome: "Cultura de LCR (Líquido Cefalo-Raquidiano)", preco: 28600.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10076", categoria: "Microbiologia", nome: "Cultura de Líquido Pericárdico", preco: 28600.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10078", categoria: "Microbiologia", nome: "Cultura do Líquido Ascítico", preco: 28600.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10079", categoria: "Microbiologia", nome: "Cultura do Líquido Pleural", preco: 28600.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10081", categoria: "Microbiologia", nome: "Cultura do Líquido Sinovial", preco: 28600.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10082", categoria: "Microbiologia", nome: "Cultura Micológica", preco: 35475.00, prazo: "14 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Fungo isolado", unidade: "", tipo: "texto" }, { nome: "Antifungiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10092", categoria: "Microbiologia", nome: "Espermocultura", preco: 28600.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Microrganismo", unidade: "", tipo: "texto" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10208", categoria: "Microbiologia", nome: "Teste Imunológico de BK (Tuberculose)", preco: 12870.00, prazo: "24h",
    parametros: [{ nome: "Resultado (IGRA/TST)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Indeterminado", "Positivo"] }] },
  { codigo: "10217", categoria: "Microbiologia", nome: "Urocultura / Urina Asséptica", preco: 23100.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo (<10³ UFC/mL)", "Contaminação (10³-10⁴)", "Infecção (≥10⁵ UFC/mL)"] }, { nome: "Agente isolado", unidade: "", tipo: "texto" }, { nome: "Contagem de colónias", unidade: "UFC/mL", tipo: "numerico" }, { nome: "Antibiograma", unidade: "", tipo: "texto" }] },
  { codigo: "10253", categoria: "Microbiologia", nome: "Pesquisa de BAAR na Urina", preco: 33000.00, prazo: "5 Dias",
    parametros: [{ nome: "BAAR na Urina", unidade: "", tipo: "selecao", opcoes: ["Negativo", "1+", "2+", "3+"] }, { nome: "Observações", unidade: "", tipo: "texto" }] },
  { codigo: "10254", categoria: "Microbiologia", nome: "Pesquisa de BAAR no LCR", preco: 33000.00, prazo: "5 Dias",
    parametros: [{ nome: "BAAR no LCR", unidade: "", tipo: "selecao", opcoes: ["Negativo", "1+", "2+", "3+"] }, { nome: "Observações", unidade: "", tipo: "texto" }] },
  { codigo: "10255", categoria: "Microbiologia", nome: "Pesquisa de BAAR no Líquido Ascítico", preco: 33000.00, prazo: "5 Dias",
    parametros: [{ nome: "BAAR no Líq. Ascítico", unidade: "", tipo: "selecao", opcoes: ["Negativo", "1+", "2+", "3+"] }] },
  { codigo: "10256", categoria: "Microbiologia", nome: "Pesquisa de BAAR no Líquido Pleural", preco: 33000.00, prazo: "5 Dias",
    parametros: [{ nome: "BAAR no Líq. Pleural", unidade: "", tipo: "selecao", opcoes: ["Negativo", "1+", "2+", "3+"] }] },
  { codigo: "10257", categoria: "Microbiologia", nome: "Pesquisa de BAAR no Líquido Pericárdico", preco: 33000.00, prazo: "5 Dias",
    parametros: [{ nome: "BAAR no Líq. Pericárdico", unidade: "", tipo: "selecao", opcoes: ["Negativo", "1+", "2+", "3+"] }] },
  { codigo: "10258", categoria: "Microbiologia", nome: "Pesquisa de BAAR no Líquido Sinovial", preco: 33000.00, prazo: "5 Dias",
    parametros: [{ nome: "BAAR no Líq. Sinovial", unidade: "", tipo: "selecao", opcoes: ["Negativo", "1+", "2+", "3+"] }] },
  { codigo: "10326", categoria: "Microbiologia", nome: "Pesquisa de Mycobacterium leprae (Baciloscopia)", preco: 31500.00, prazo: "7 Dias",
    parametros: [{ nome: "M. leprae (pele/mucosa)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Índice Baciloscópico (IB)", unidade: "", tipo: "numerico" }] },
  { codigo: "10182", categoria: "Microbiologia", nome: "Pesquisa de Mycobacterium leprae (Esfregaço)", preco: 33825.00, prazo: "5 Dias",
    parametros: [{ nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Índice Baciloscópico", unidade: "", tipo: "numerico" }] },
  { codigo: "10329", categoria: "Microbiologia", nome: "Estudo Micológico do Couro Cabeludo", preco: 45000.00, prazo: "7 Dias",
    parametros: [{ nome: "Resultado (KOH/cultura)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Fungo identificado", unidade: "", tipo: "texto" }] },

  /* ═══════════════════════════════════════════════════════
     FUTI-LAB — SEROLOGIA INFECCIOSA
  ═══════════════════════════════════════════════════════ */
  { codigo: "10010", categoria: "Serologia Infecciosa", nome: "Chlamydia (Exsudado)", preco: 13062.50, prazo: "24h",
    parametros: [{ nome: "Chlamydia trachomatis (exsudado)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10011", categoria: "Serologia Infecciosa", nome: "Chlamydia (Soro)", preco: 11687.50, prazo: "24h",
    parametros: [{ nome: "Chlamydia IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Chlamydia IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10053", categoria: "Serologia Infecciosa", nome: "Chikungunya (Anticorpos)", preco: 13062.25, prazo: "24h",
    parametros: [{ nome: "Chikungunya IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Chikungunya IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10037", categoria: "Serologia Infecciosa", nome: "CMV (Citomegalovírus) IgG", preco: 33000.00, prazo: "48h",
    parametros: [{ nome: "CMV IgG", unidade: "U/mL", tipo: "numerico" }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10038", categoria: "Serologia Infecciosa", nome: "CMV (Citomegalovírus) IgM", preco: 33000.00, prazo: "48h",
    parametros: [{ nome: "CMV IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10083", categoria: "Serologia Infecciosa", nome: "Dengue IgM/IgG", preco: 12375.00, prazo: "24h",
    parametros: [{ nome: "Dengue IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Dengue IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10089", categoria: "Serologia Infecciosa", nome: "Epstein-Barr IgG (VCA)", preco: 33000.00, prazo: "48h",
    parametros: [{ nome: "EBV VCA IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10090", categoria: "Serologia Infecciosa", nome: "Epstein-Barr IgM (VCA)", preco: 33000.00, prazo: "48h",
    parametros: [{ nome: "EBV VCA IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10133", categoria: "Serologia Infecciosa", nome: "Helicobacter pylori (Fezes — Ag)", preco: 27637.50, prazo: "24h",
    parametros: [{ nome: "H. pylori Ag (fezes)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10134", categoria: "Serologia Infecciosa", nome: "Helicobacter pylori (Anticorpos)", preco: 22000.00, prazo: "24h",
    parametros: [{ nome: "H. pylori IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10137", categoria: "Serologia Infecciosa", nome: "Herpes Simplex I IgG", preco: 33000.00, prazo: "48h",
    parametros: [{ nome: "HSV-1 IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10138", categoria: "Serologia Infecciosa", nome: "Herpes Simplex I IgM", preco: 33000.00, prazo: "48h",
    parametros: [{ nome: "HSV-1 IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10139", categoria: "Serologia Infecciosa", nome: "Herpes Simplex II IgG", preco: 33000.00, prazo: "48h",
    parametros: [{ nome: "HSV-2 IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10140", categoria: "Serologia Infecciosa", nome: "Herpes Simplex II IgM", preco: 33000.00, prazo: "48h",
    parametros: [{ nome: "HSV-2 IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10142", categoria: "Serologia Infecciosa", nome: "HIV 1/2 (Teste Rápido)", preco: 18562.50, prazo: "24h",
    parametros: [{ nome: "HIV 1/2 (teste rápido)", unidade: "", tipo: "selecao", opcoes: ["Não reactivo", "Reactivo — necessita confirmação"] }] },
  { codigo: "10252", categoria: "Serologia Infecciosa", nome: "Teste HIV 1/2 Unigold", preco: 21312.50, prazo: "24h",
    parametros: [{ nome: "HIV 1/2 Unigold", unidade: "", tipo: "selecao", opcoes: ["Não reactivo", "Reactivo"] }] },
  { codigo: "10184", categoria: "Serologia Infecciosa", nome: "Pesquisa de Tripanosoma (Sangue)", preco: 25575.00, prazo: "24h",
    parametros: [{ nome: "Trypanosoma spp. (esfregaço)", unidade: "", tipo: "selecao", opcoes: ["Não observado", "Observado"] }] },
  { codigo: "10199", categoria: "Serologia Infecciosa", nome: "Rubéola IgG", preco: 33150.00, prazo: "48h",
    parametros: [{ nome: "Rubéola IgG", unidade: "UI/mL", tipo: "numerico" }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo (<10)", "Equivocado (10-15)", "Positivo (>15)"] }] },
  { codigo: "10200", categoria: "Serologia Infecciosa", nome: "Rubéola IgM", preco: 33150.00, prazo: "48h",
    parametros: [{ nome: "Rubéola IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10209", categoria: "Serologia Infecciosa", nome: "Toxoplasma IgG", preco: 28000.00, prazo: "48h",
    parametros: [{ nome: "Toxoplasma IgG", unidade: "UI/mL", tipo: "numerico" }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Equivocado", "Positivo"] }] },
  { codigo: "10210", categoria: "Serologia Infecciosa", nome: "Toxoplasma IgM", preco: 28000.00, prazo: "48h",
    parametros: [{ nome: "Toxoplasma IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10211", categoria: "Serologia Infecciosa", nome: "TPHA (Treponema pallidum)", preco: 23100.00, prazo: "48h",
    parametros: [{ nome: "TPHA", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo (reagente)"] }, { nome: "Título (se positivo)", unidade: "", tipo: "texto" }] },
  { codigo: "10218", categoria: "Serologia Infecciosa", nome: "VDRL no LCR", preco: 7425.00, prazo: "24h",
    parametros: [{ nome: "VDRL (LCR)", unidade: "", tipo: "selecao", opcoes: ["Não reactivo", "Reactivo"] }, { nome: "Título", unidade: "", tipo: "texto" }] },
  { codigo: "10219", categoria: "Serologia Infecciosa", nome: "VDRL / RPR (Sangue)", preco: 7425.00, prazo: "24h",
    parametros: [{ nome: "VDRL/RPR", unidade: "", tipo: "selecao", opcoes: ["Não reactivo", "Reactivo"] }, { nome: "Título (se reactivo)", unidade: "", tipo: "texto" }] },
  { codigo: "10198", categoria: "Serologia Infecciosa", nome: "Reacção de Widal (Salmonella)", preco: 6187.00, prazo: "24h",
    parametros: [{ nome: "S. typhi H", unidade: "", tipo: "selecao", opcoes: ["Negativo", "1/40", "1/80", "1/160", "1/320"] }, { nome: "S. typhi O", unidade: "", tipo: "selecao", opcoes: ["Negativo", "1/40", "1/80", "1/160", "1/320"] }, { nome: "S. paratyphi AH", unidade: "", tipo: "selecao", opcoes: ["Negativo", "1/40", "1/80", "1/160"] }, { nome: "Interpretação", unidade: "", tipo: "texto" }] },
  { codigo: "10201", categoria: "Serologia Infecciosa", nome: "TASO/ASO/ASLO (Antiestreptolisina O)", preco: 6200.00, prazo: "24h",
    parametros: [{ nome: "ASLO", unidade: "UI/mL", refMin: "0", refMax: "200", tipo: "numerico" }, { nome: "Resultado qualitativo", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10310", categoria: "Serologia Infecciosa", nome: "Papilomavírus Humano (HPV) IgG", preco: 45000.00, prazo: "5 Dias",
    parametros: [{ nome: "HPV IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10311", categoria: "Serologia Infecciosa", nome: "Papilomavírus Humano (HPV) IgM", preco: 45000.00, prazo: "5 Dias",
    parametros: [{ nome: "HPV IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10319", categoria: "Serologia Infecciosa", nome: "Vírus Varicela Zoster (VZV) IgM", preco: 30050.00, prazo: "48h",
    parametros: [{ nome: "VZV IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10320", categoria: "Serologia Infecciosa", nome: "Vírus Varicela Zoster (VZV) IgG", preco: 30050.00, prazo: "48h",
    parametros: [{ nome: "VZV IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10314", categoria: "Serologia Infecciosa", nome: "FTA-ABS IgG (Treponema — Quantitativo)", preco: 30000.00, prazo: "48h",
    parametros: [{ nome: "FTA-ABS IgG", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Título", unidade: "", tipo: "texto" }] },
  { codigo: "10315", categoria: "Serologia Infecciosa", nome: "FTA-ABS IgM (Treponema — Quantitativo)", preco: 30000.00, prazo: "48h",
    parametros: [{ nome: "FTA-ABS IgM", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },

  /* ═══════════════════════════════════════════════════════
     FUTI-LAB — HORMONAS INDIVIDUAIS
  ═══════════════════════════════════════════════════════ */
  { codigo: "10049", categoria: "Hormonas", nome: "Cortisol (sérico)", preco: 31212.50, prazo: "48h",
    parametros: [{ nome: "Cortisol (manhã)", unidade: "µg/dL", refMin: "6", refMax: "23", tipo: "numerico" }, { nome: "Cortisol (tarde)", unidade: "µg/dL", refMin: "2", refMax: "14", tipo: "numerico" }] },
  { codigo: "10094", categoria: "Hormonas", nome: "Estradiol (E2)", preco: 27500.00, prazo: "48h",
    parametros: [{ nome: "Estradiol", unidade: "pg/mL", tipo: "numerico" }, { nome: "Fase do ciclo / comentário", unidade: "", tipo: "texto" }] },
  { codigo: "10113", categoria: "Hormonas", nome: "FSH (Hormona Folículo-Estimulante)", preco: 33550.00, prazo: "48h",
    parametros: [{ nome: "FSH", unidade: "mUI/mL", tipo: "numerico" }, { nome: "Fase / Comentário", unidade: "", tipo: "texto" }] },
  { codigo: "10114", categoria: "Hormonas", nome: "LH (Hormona Luteinizante)", preco: 30250.00, prazo: "48h",
    parametros: [{ nome: "LH", unidade: "mUI/mL", tipo: "numerico" }, { nome: "Fase / Comentário", unidade: "", tipo: "texto" }] },
  { codigo: "10115", categoria: "Hormonas", nome: "Testosterona Total", preco: 34500.00, prazo: "48h",
    parametros: [{ nome: "Testosterona Total", unidade: "ng/dL", refMin: "270", refMax: "1070", tipo: "numerico" }] },
  { codigo: "10165", categoria: "Hormonas", nome: "Testosterona Livre", preco: 34500.00, prazo: "48h",
    parametros: [{ nome: "Testosterona Livre", unidade: "pg/mL", refMin: "50", refMax: "210", tipo: "numerico" }] },
  { codigo: "10116", categoria: "Hormonas", nome: "Prolactina", preco: 27885.00, prazo: "48h",
    parametros: [{ nome: "Prolactina", unidade: "ng/mL", refMin: "2.0", refMax: "18.0", tipo: "numerico" }] },
  { codigo: "10117", categoria: "Hormonas", nome: "Progesterona", preco: 28050.00, prazo: "48h",
    parametros: [{ nome: "Progesterona", unidade: "ng/mL", tipo: "numerico" }, { nome: "Fase / Comentário", unidade: "", tipo: "texto" }] },
  { codigo: "10118", categoria: "Hormonas", nome: "TSH (Tirotrofina)", preco: 27293.75, prazo: "48h",
    parametros: [{ nome: "TSH", unidade: "µUI/mL", refMin: "0.27", refMax: "4.20", tipo: "numerico" }] },
  { codigo: "10119", categoria: "Hormonas", nome: "T3 (Tri-iodotironina Total)", preco: 25987.50, prazo: "48h",
    parametros: [{ nome: "T3 Total", unidade: "ng/dL", refMin: "60", refMax: "181", tipo: "numerico" }] },
  { codigo: "10120", categoria: "Hormonas", nome: "T4 (Tiroxina Total)", preco: 26812.50, prazo: "48h",
    parametros: [{ nome: "T4 Total", unidade: "µg/dL", refMin: "4.5", refMax: "12.5", tipo: "numerico" }] },
  { codigo: "10121", categoria: "Hormonas", nome: "T3 Livre (FT3)", preco: 26812.50, prazo: "48h",
    parametros: [{ nome: "T3 Livre", unidade: "pg/mL", refMin: "2.3", refMax: "4.2", tipo: "numerico" }] },
  { codigo: "10122", categoria: "Hormonas", nome: "T4 Livre (FT4)", preco: 26812.50, prazo: "48h",
    parametros: [{ nome: "T4 Livre", unidade: "ng/dL", refMin: "0.89", refMax: "1.76", tipo: "numerico" }] },
  { codigo: "10171", categoria: "Hormonas", nome: "β-HCG (Gonadotrofina Coriónica)", preco: 25575.00, prazo: "24h",
    parametros: [{ nome: "β-HCG", unidade: "mUI/mL", tipo: "numerico" }, { nome: "Interpretação", unidade: "", tipo: "texto" }] },
  { codigo: "10197", categoria: "Hormonas", nome: "PTH — Paratormona", preco: 59400.00, prazo: "48h",
    parametros: [{ nome: "PTH intacta", unidade: "pg/mL", refMin: "15", refMax: "65", tipo: "numerico" }] },
  { codigo: "10259", categoria: "Hormonas", nome: "AMH — Hormona Anti-Mülleriana", preco: 39000.00, prazo: "48h",
    parametros: [{ nome: "AMH", unidade: "ng/mL", tipo: "numerico" }, { nome: "Reserva ovárica", unidade: "", tipo: "texto" }] },
  { codigo: "10301", categoria: "Hormonas", nome: "Insulina (basal)", preco: 50000.00, prazo: "48h",
    parametros: [{ nome: "Insulina basal", unidade: "µUI/mL", refMin: "2.6", refMax: "24.9", tipo: "numerico" }, { nome: "HOMA-IR", unidade: "", refMin: "0", refMax: "3.0", tipo: "numerico" }] },
  { codigo: "10305", categoria: "Hormonas", nome: "Tiroglobulina (TG)", preco: 45000.00, prazo: "48h",
    parametros: [{ nome: "Tiroglobulina", unidade: "ng/mL", refMin: "1.4", refMax: "78.0", tipo: "numerico" }] },
  { codigo: "10306", categoria: "Hormonas", nome: "Anti-Tiroglobulina (Anti-TG)", preco: 35000.00, prazo: "48h",
    parametros: [{ nome: "Anti-TG", unidade: "UI/mL", refMin: "0", refMax: "115", tipo: "numerico" }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10322", categoria: "Hormonas", nome: "Anti-TPO (Anti-Tireoperoxidase)", preco: 37000.00, prazo: "5 Dias",
    parametros: [{ nome: "Anti-TPO", unidade: "UI/mL", refMin: "0", refMax: "34", tipo: "numerico" }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10325", categoria: "Hormonas", nome: "Anti-Receptor do TSH (TRAb)", preco: 45000.00, prazo: "5 Dias",
    parametros: [{ nome: "TRAb", unidade: "UI/L", refMin: "0", refMax: "1.75", tipo: "numerico" }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo (<1.75)", "Positivo (≥1.75)"] }] },
  { codigo: "10316", categoria: "Hormonas", nome: "GH — Hormona de Crescimento Humano", preco: 30000.00, prazo: "48h",
    parametros: [{ nome: "GH basal", unidade: "ng/mL", refMin: "0", refMax: "3.0", tipo: "numerico" }] },

  /* ═══════════════════════════════════════════════════════
     FUTI-LAB — PARASITOLOGIA
  ═══════════════════════════════════════════════════════ */
  { codigo: "10103", categoria: "Parasitologia", nome: "Exame Parasitológico de Fezes 1ª Amostra", preco: 5775.00, prazo: "24h",
    parametros: [{ nome: "Ovos e parasitas", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo — ver observações"] }, { nome: "Parasitas encontrados", unidade: "", tipo: "texto" }, { nome: "Consistência das fezes", unidade: "", tipo: "selecao", opcoes: ["Normais", "Moles", "Líquidas"] }] },
  { codigo: "10104", categoria: "Parasitologia", nome: "Exame Parasitológico de Fezes 2ª Amostra", preco: 5775.00, prazo: "24h",
    parametros: [{ nome: "Ovos e parasitas", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo — ver observações"] }, { nome: "Parasitas encontrados", unidade: "", tipo: "texto" }] },
  { codigo: "10105", categoria: "Parasitologia", nome: "Exame Parasitológico de Fezes 3ª Amostra", preco: 5775.00, prazo: "24h",
    parametros: [{ nome: "Ovos e parasitas", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo — ver observações"] }, { nome: "Parasitas encontrados", unidade: "", tipo: "texto" }] },
  { codigo: "10109", categoria: "Parasitologia", nome: "FOB — Pesquisa de Sangue Oculto nas Fezes", preco: 17325.00, prazo: "24h",
    parametros: [{ nome: "Sangue oculto nas fezes", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10126", categoria: "Parasitologia", nome: "Gota Espessa / Pesquisa de Plasmodium (Malária)", preco: 6187.50, prazo: "24h",
    parametros: [{ nome: "Plasmodium spp.", unidade: "", tipo: "selecao", opcoes: ["Não observado", "P. falciparum", "P. vivax", "P. malariae", "P. ovale"] }, { nome: "Parasitemia (%)", unidade: "%", refMin: "0", refMax: "0", tipo: "numerico" }] },
  { codigo: "10106", categoria: "Parasitologia", nome: "Filária Directo (Sangue periférico)", preco: 6875.00, prazo: "24h",
    parametros: [{ nome: "Microfilarias", unidade: "", tipo: "selecao", opcoes: ["Não observadas", "Observadas"] }, { nome: "Espécie (se positivo)", unidade: "", tipo: "texto" }] },
  { codigo: "10180", categoria: "Parasitologia", nome: "Pesquisa de Filária no Sangue", preco: 6187.50, prazo: "24h",
    parametros: [{ nome: "Filária (sangue)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Espécie", unidade: "", tipo: "texto" }] },
  { codigo: "10183", categoria: "Parasitologia", nome: "Pesquisa de Schistosoma haematobium (Urina)", preco: 25740.00, prazo: "24h",
    parametros: [{ nome: "Schistosoma haematobium (urina)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Ovos/10mL urina", unidade: "ovos/10mL", tipo: "numerico" }] },
  { codigo: "10327", categoria: "Parasitologia", nome: "Pesquisa de Schistosoma haematobium (Fezes)", preco: 17600.00, prazo: "24h",
    parametros: [{ nome: "Schistosoma spp. (fezes)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Ovos por grama de fezes", unidade: "ovos/g", tipo: "numerico" }] },

  /* ═══════════════════════════════════════════════════════
     FUTI-LAB — IMUNOGLOBULINAS
  ═══════════════════════════════════════════════════════ */
  { codigo: "10144", categoria: "Imunoglobulinas", nome: "IgA (Imunoglobulina A)", preco: 24612.50, prazo: "48h",
    parametros: [{ nome: "IgA", unidade: "mg/dL", refMin: "70", refMax: "400", tipo: "numerico" }] },
  { codigo: "10145", categoria: "Imunoglobulinas", nome: "IgG (Imunoglobulina G)", preco: 24612.50, prazo: "48h",
    parametros: [{ nome: "IgG", unidade: "mg/dL", refMin: "700", refMax: "1600", tipo: "numerico" }] },
  { codigo: "10146", categoria: "Imunoglobulinas", nome: "IgE Total", preco: 30951.25, prazo: "48h",
    parametros: [{ nome: "IgE Total", unidade: "UI/mL", refMin: "0", refMax: "100", tipo: "numerico" }] },
  { codigo: "10147", categoria: "Imunoglobulinas", nome: "IgM (Imunoglobulina M)", preco: 24612.50, prazo: "48h",
    parametros: [{ nome: "IgM", unidade: "mg/dL", refMin: "40", refMax: "230", tipo: "numerico" }] },

  /* ═══════════════════════════════════════════════════════
     FUTI-LAB — AUTOIMUNIDADE
  ═══════════════════════════════════════════════════════ */
  { codigo: "10233", categoria: "Autoimunidade", nome: "FAN/ANA (Factor Anti-Nuclear)", preco: 140250.00, prazo: "5 Dias",
    parametros: [{ nome: "ANA (ELISA)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Título (IFI)", unidade: "", tipo: "texto" }, { nome: "Padrão (se positivo)", unidade: "", tipo: "texto" }] },
  { codigo: "10312", categoria: "Autoimunidade", nome: "ANA (Anticorpos Anti-Nucleares)", preco: 35000.00, prazo: "5 Dias",
    parametros: [{ nome: "ANA", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Título", unidade: "", tipo: "texto" }] },
  { codigo: "10251", categoria: "Autoimunidade", nome: "Anti-CCP (Anticorpo Anti-Peptídeo Citrulado)", preco: 28050.00, prazo: "48h",
    parametros: [{ nome: "Anti-CCP", unidade: "U/mL", refMin: "0", refMax: "5.0", tipo: "numerico" }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo (<5)", "Positivo (≥5)"] }] },
  { codigo: "10300", categoria: "Autoimunidade", nome: "Anti-RNP (Anticorpo Anti-Ribonucleoproteína)", preco: 95000.00, prazo: "5 Dias",
    parametros: [{ nome: "Anti-RNP", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Título", unidade: "", tipo: "texto" }] },
  { codigo: "10303", categoria: "Autoimunidade", nome: "Beta-2 Glicoproteína 1 IgG", preco: 45000.00, prazo: "48h",
    parametros: [{ nome: "β2-GP1 IgG", unidade: "U/mL", refMin: "0", refMax: "20", tipo: "numerico" }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10304", categoria: "Autoimunidade", nome: "Beta-2 Glicoproteína 1 IgM", preco: 45000.00, prazo: "48h",
    parametros: [{ nome: "β2-GP1 IgM", unidade: "U/mL", refMin: "0", refMax: "20", tipo: "numerico" }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10307", categoria: "Autoimunidade", nome: "Anti-Cardiolipina IgA (ACA)", preco: 30000.00, prazo: "48h",
    parametros: [{ nome: "Anti-Cardiolipina IgA", unidade: "GPL/mL", refMin: "0", refMax: "12", tipo: "numerico" }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10308", categoria: "Autoimunidade", nome: "Anti-Cardiolipina IgM (ACA)", preco: 30000.00, prazo: "48h",
    parametros: [{ nome: "Anti-Cardiolipina IgM", unidade: "MPL/mL", refMin: "0", refMax: "12", tipo: "numerico" }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10309", categoria: "Autoimunidade", nome: "Anti-Cardiolipina IgG (ACA)", preco: 30000.00, prazo: "48h",
    parametros: [{ nome: "Anti-Cardiolipina IgG", unidade: "GPL/mL", refMin: "0", refMax: "15", tipo: "numerico" }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10323", categoria: "Autoimunidade", nome: "Anticorpo Anti-DNA", preco: 55000.00, prazo: "5 Dias",
    parametros: [{ nome: "Anti-dsDNA", unidade: "UI/mL", refMin: "0", refMax: "10", tipo: "numerico" }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10328", categoria: "Autoimunidade", nome: "Pesquisa de Células LE", preco: 45000.00, prazo: "7 Dias",
    parametros: [{ nome: "Células LE", unidade: "", tipo: "selecao", opcoes: ["Não observadas", "Observadas"] }] },
  { codigo: "10330", categoria: "Autoimunidade", nome: "ANCA (Anticorpo Anti-Citoplasma de Neutrófilo)", preco: 45000.00, prazo: "5 Dias",
    parametros: [{ nome: "c-ANCA (PR3)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "p-ANCA (MPO)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10324", categoria: "Autoimunidade", nome: "Anticorpo Anti-PGL 1 (Glicolipídeo Fenólico)", preco: 39000.00, prazo: "5 Dias",
    parametros: [{ nome: "Anti-PGL-1", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },

  /* ═══════════════════════════════════════════════════════
     FUTI-LAB — ANÁLISE DE URINA
  ═══════════════════════════════════════════════════════ */
  { codigo: "10216", categoria: "Análise de Urina", nome: "Urina Tipo II (Sumária de Urina)", preco: 6187.50, prazo: "24h",
    parametros: [{ nome: "Cor", unidade: "", tipo: "selecao", opcoes: ["Amarela", "Incolor", "Âmbar", "Avermelhada", "Acastanhada"] }, { nome: "Aspecto", unidade: "", tipo: "selecao", opcoes: ["Límpida", "Ligeiramente turva", "Turva"] }, { nome: "pH", unidade: "", refMin: "5.0", refMax: "8.0", tipo: "numerico" }, { nome: "Densidade", unidade: "", refMin: "1010", refMax: "1025", tipo: "numerico" }, { nome: "Proteínas", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Traços", "+", "++", "+++"] }, { nome: "Glucose", unidade: "", tipo: "selecao", opcoes: ["Negativo", "+", "++", "+++"] }, { nome: "Corpos cetónicos", unidade: "", tipo: "selecao", opcoes: ["Negativo", "+", "++", "+++"] }, { nome: "Bilirrubina", unidade: "", tipo: "selecao", opcoes: ["Negativo", "+", "++"] }, { nome: "Urobilinogénio", unidade: "mg/dL", refMin: "0.2", refMax: "1.0", tipo: "numerico" }, { nome: "Nitritos", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Eritrócitos", unidade: "cél/µL", refMin: "0", refMax: "10", tipo: "numerico" }, { nome: "Leucócitos", unidade: "cél/µL", refMin: "0", refMax: "10", tipo: "numerico" }] },
  { codigo: "10084", categoria: "Análise de Urina", nome: "Densidade Urinária", preco: 7562.50, prazo: "24h",
    parametros: [{ nome: "Densidade", unidade: "", refMin: "1010", refMax: "1025", tipo: "numerico" }] },
  { codigo: "10186", categoria: "Análise de Urina", nome: "pH Urinário", preco: 4125.00, prazo: "24h",
    parametros: [{ nome: "pH urina", unidade: "", refMin: "5.0", refMax: "8.0", tipo: "numerico" }] },
  { codigo: "10185", categoria: "Análise de Urina", nome: "pH da Saliva", preco: 5500.00, prazo: "24h",
    parametros: [{ nome: "pH salivar", unidade: "", refMin: "6.2", refMax: "7.6", tipo: "numerico" }] },
  { codigo: "10045", categoria: "Análise de Urina", nome: "Contagem de Addis (Urina 3h)", preco: 22412.50, prazo: "24h",
    parametros: [{ nome: "Eritrócitos/mL", unidade: "cél/mL", refMin: "0", refMax: "1000", tipo: "numerico" }, { nome: "Leucócitos/mL", unidade: "cél/mL", refMin: "0", refMax: "2000", tipo: "numerico" }, { nome: "Cilindros/mL", unidade: "cilindros/mL", refMin: "0", refMax: "20", tipo: "numerico" }] },

  /* ═══════════════════════════════════════════════════════
     FUTI-LAB — EXAMES ESPECIAIS / CITOLOGIA / ANATOMIA PAT.
  ═══════════════════════════════════════════════════════ */
  { codigo: "10093", categoria: "Citologia e Anatomia Patológica", nome: "Espermograma", preco: 20625.00, prazo: "24h",
    parametros: [{ nome: "Volume (mL)", unidade: "mL", refMin: "1.5", refMax: "6.0", tipo: "numerico" }, { nome: "pH", unidade: "", refMin: "7.2", refMax: "8.0", tipo: "numerico" }, { nome: "Concentração (×10⁶/mL)", unidade: "×10⁶/mL", refMin: "16", refMax: "300", tipo: "numerico" }, { nome: "Total de espermatozóides", unidade: "×10⁶", refMin: "39", refMax: "999", tipo: "numerico" }, { nome: "Motilidade progressiva (%)", unidade: "%", refMin: "32", refMax: "100", tipo: "numerico" }, { nome: "Motilidade total (%)", unidade: "%", refMin: "40", refMax: "100", tipo: "numerico" }, { nome: "Morfologia normal (%)", unidade: "%", refMin: "4", refMax: "100", tipo: "numerico" }, { nome: "Vitalidade (%)", unidade: "%", refMin: "54", refMax: "100", tipo: "numerico" }, { nome: "Leucócitos (×10⁶/mL)", unidade: "×10⁶/mL", refMin: "0", refMax: "1.0", tipo: "numerico" }] },
  { codigo: "10097", categoria: "Citologia e Anatomia Patológica", nome: "Papa de Nicolau / Citologia Orgânica", preco: 49500.00, prazo: "15 Dias",
    parametros: [{ nome: "Adequabilidade da amostra", unidade: "", tipo: "selecao", opcoes: ["Satisfatória", "Insatisfatória"] }, { nome: "Resultado", unidade: "", tipo: "selecao", opcoes: ["Negativo para lesão intraepitelial ou malignidade (NILM)", "ASC-US", "ASC-H", "LSIL (NIC I)", "HSIL (NIC II/III)", "Carcinoma"] }, { nome: "Observações", unidade: "", tipo: "texto" }] },
  { codigo: "10098", categoria: "Citologia e Anatomia Patológica", nome: "Exame Cérvico-Vaginal", preco: 49500.00, prazo: "15 Dias",
    parametros: [{ nome: "Resultado citológico", unidade: "", tipo: "texto" }, { nome: "Microbiota", unidade: "", tipo: "texto" }, { nome: "Conclusão", unidade: "", tipo: "texto" }] },
  { codigo: "10099", categoria: "Citologia e Anatomia Patológica", nome: "Exame de Secreção Vaginal", preco: 13750.00, prazo: "24h",
    parametros: [{ nome: "Resultado (microscopia)", unidade: "", tipo: "texto" }, { nome: "pH vaginal", unidade: "", refMin: "3.8", refMax: "4.5", tipo: "numerico" }, { nome: "Clue cells", unidade: "", tipo: "selecao", opcoes: ["Ausentes", "Presentes"] }, { nome: "Trichomonas", unidade: "", tipo: "selecao", opcoes: ["Ausente", "Presente"] }, { nome: "Candida", unidade: "", tipo: "selecao", opcoes: ["Ausente", "Presente"] }, { nome: "Microbiota", unidade: "", tipo: "texto" }] },
  { codigo: "10024", categoria: "Citologia e Anatomia Patológica", nome: "Biópsia Aspirativa por Agulha (PAAF/BAAF)", preco: 49500.00, prazo: "15 Dias",
    parametros: [{ nome: "Resultado citológico", unidade: "", tipo: "texto" }, { nome: "Adequabilidade", unidade: "", tipo: "selecao", opcoes: ["Adequada", "Não adequada"] }, { nome: "Conclusão", unidade: "", tipo: "texto" }] },
  { codigo: "10025", categoria: "Citologia e Anatomia Patológica", nome: "Biópsia (Histologia)", preco: 173825.85, prazo: "30 Dias",
    parametros: [{ nome: "Resultado histológico", unidade: "", tipo: "texto" }, { nome: "Diagnóstico final", unidade: "", tipo: "texto" }] },
  { codigo: "10176", categoria: "Citologia e Anatomia Patológica", nome: "Peça Cirúrgica (Histologia)", preco: 255750.00, prazo: "30 Dias",
    parametros: [{ nome: "Órgão / peça cirúrgica", unidade: "", tipo: "texto" }, { nome: "Resultado histológico", unidade: "", tipo: "texto" }, { nome: "Diagnóstico final", unidade: "", tipo: "texto" }] },
  { codigo: "10096", categoria: "Citologia e Anatomia Patológica", nome: "Exame Cito-Bacteriológico do Suco Ganglionar", preco: 34320.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Resultado citológico", unidade: "", tipo: "texto" }, { nome: "Resultado bacteriológico", unidade: "", tipo: "texto" }, { nome: "Conclusão", unidade: "", tipo: "texto" }] },
  { codigo: "10321", categoria: "Citologia e Anatomia Patológica", nome: "Adenograma", preco: 37000.00, prazo: "5 Dias",
    parametros: [{ nome: "Resultado citológico", unidade: "", tipo: "texto" }, { nome: "Celularidade", unidade: "", tipo: "texto" }, { nome: "Conclusão", unidade: "", tipo: "texto" }] },
  { codigo: "10152", categoria: "Citologia e Anatomia Patológica", nome: "LCR — Exame Cito-Químico", preco: 34375.00, prazo: "48h",
    parametros: [{ nome: "Aspecto", unidade: "", tipo: "selecao", opcoes: ["Límpido e incolor", "Xantocrómico", "Hemorrágico", "Turvo"] }, { nome: "Leucócitos (cél/µL)", unidade: "cél/µL", refMin: "0", refMax: "5", tipo: "numerico" }, { nome: "Eritrócitos (cél/µL)", unidade: "cél/µL", refMin: "0", refMax: "0", tipo: "numerico" }, { nome: "Proteínas (mg/dL)", unidade: "mg/dL", refMin: "15", refMax: "45", tipo: "numerico" }, { nome: "Glicose (mg/dL)", unidade: "mg/dL", refMin: "45", refMax: "80", tipo: "numerico" }, { nome: "Cloretos (mEq/L)", unidade: "mEq/L", refMin: "120", refMax: "130", tipo: "numerico" }] },
  { codigo: "10154", categoria: "Citologia e Anatomia Patológica", nome: "Exame Oncológico de LCR", preco: 49500.00, prazo: "15 Dias",
    parametros: [{ nome: "Células neoplásicas", unidade: "", tipo: "selecao", opcoes: ["Não observadas", "Observadas"] }, { nome: "Resultado citológico", unidade: "", tipo: "texto" }] },
  { codigo: "10155", categoria: "Citologia e Anatomia Patológica", nome: "Exame Oncológico do Líquido Ascítico", preco: 49500.00, prazo: "15 Dias",
    parametros: [{ nome: "Células neoplásicas", unidade: "", tipo: "selecao", opcoes: ["Não observadas", "Observadas"] }, { nome: "Resultado citológico", unidade: "", tipo: "texto" }] },
  { codigo: "10156", categoria: "Citologia e Anatomia Patológica", nome: "Exame Oncológico do Líquido Pericárdico", preco: 49500.00, prazo: "15 Dias",
    parametros: [{ nome: "Células neoplásicas", unidade: "", tipo: "selecao", opcoes: ["Não observadas", "Observadas"] }, { nome: "Resultado citológico", unidade: "", tipo: "texto" }] },
  { codigo: "10157", categoria: "Citologia e Anatomia Patológica", nome: "Exame Oncológico do Líquido Sinovial", preco: 49500.00, prazo: "15 Dias",
    parametros: [{ nome: "Células neoplásicas", unidade: "", tipo: "selecao", opcoes: ["Não observadas", "Observadas"] }, { nome: "Resultado citológico", unidade: "", tipo: "texto" }] },
  { codigo: "10159", categoria: "Citologia e Anatomia Patológica", nome: "Líquido Ascítico — Exame Cito-Químico", preco: 41250.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Aspecto", unidade: "", tipo: "texto" }, { nome: "Leucócitos (cél/µL)", unidade: "cél/µL", refMin: "0", refMax: "300", tipo: "numerico" }, { nome: "Proteínas (g/dL)", unidade: "g/dL", tipo: "numerico" }, { nome: "LDH (U/L)", unidade: "U/L", tipo: "numerico" }, { nome: "Glicose (mg/dL)", unidade: "mg/dL", tipo: "numerico" }, { nome: "GASA (g/dL)", unidade: "g/dL", tipo: "numerico" }] },
  { codigo: "10160", categoria: "Citologia e Anatomia Patológica", nome: "Líquido Biliar — Exame Cito-Químico", preco: 41250.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Aspecto", unidade: "", tipo: "texto" }, { nome: "Leucócitos (cél/µL)", unidade: "cél/µL", tipo: "numerico" }, { nome: "Proteínas (g/dL)", unidade: "g/dL", tipo: "numerico" }, { nome: "Resultado citológico", unidade: "", tipo: "texto" }] },
  { codigo: "10161", categoria: "Citologia e Anatomia Patológica", nome: "Líquido Pericárdico — Exame Cito-Químico", preco: 41250.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Aspecto", unidade: "", tipo: "texto" }, { nome: "Leucócitos (cél/µL)", unidade: "cél/µL", tipo: "numerico" }, { nome: "Proteínas (g/dL)", unidade: "g/dL", tipo: "numerico" }, { nome: "Resultado citológico", unidade: "", tipo: "texto" }] },
  { codigo: "10162", categoria: "Citologia e Anatomia Patológica", nome: "Líquido Pleural — Exame Cito-Químico", preco: 41250.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Aspecto", unidade: "", tipo: "texto" }, { nome: "Leucócitos (cél/µL)", unidade: "cél/µL", tipo: "numerico" }, { nome: "Proteínas (g/dL)", unidade: "g/dL", tipo: "numerico" }, { nome: "LDH (U/L)", unidade: "U/L", tipo: "numerico" }, { nome: "Glicose (mg/dL)", unidade: "mg/dL", tipo: "numerico" }, { nome: "Resultado citológico", unidade: "", tipo: "texto" }] },
  { codigo: "10163", categoria: "Citologia e Anatomia Patológica", nome: "Líquido Sinovial — Exame Cito-Químico", preco: 41250.00, prazo: "3 - 5 Dias",
    parametros: [{ nome: "Aspecto", unidade: "", tipo: "texto" }, { nome: "Viscosidade", unidade: "", tipo: "selecao", opcoes: ["Alta", "Média", "Baixa"] }, { nome: "Leucócitos (cél/µL)", unidade: "cél/µL", refMin: "0", refMax: "200", tipo: "numerico" }, { nome: "Proteínas (g/dL)", unidade: "g/dL", tipo: "numerico" }, { nome: "Glicose (mg/dL)", unidade: "mg/dL", tipo: "numerico" }, { nome: "Cristais", unidade: "", tipo: "selecao", opcoes: ["Ausentes", "Urato (gota)", "Pirofosfato (condrocalcinose)"] }] },
  { codigo: "10221", categoria: "Citologia e Anatomia Patológica", nome: "Prova da Curva de Ouro Coloidal (LCR)", preco: 30525.00, prazo: "72h",
    parametros: [{ nome: "Resultado (curva)", unidade: "", tipo: "texto" }, { nome: "Interpretação", unidade: "", tipo: "selecao", opcoes: ["Normal", "Curva sifilítica", "Curva meningítica", "Curva paralítica"] }] },
  { codigo: "10123", categoria: "Citologia e Anatomia Patológica", nome: "Teste de Meares-Stamey (Próstata)", preco: 138875.00, prazo: "15 Dias",
    parametros: [{ nome: "VB1 (uretral)", unidade: "", tipo: "texto" }, { nome: "VB2 (vesical)", unidade: "", tipo: "texto" }, { nome: "EPS (secreção prostática)", unidade: "", tipo: "texto" }, { nome: "VB3 (pós-massagem)", unidade: "", tipo: "texto" }, { nome: "Conclusão", unidade: "", tipo: "texto" }] },

  /* ═══════════════════════════════════════════════════════
     FUTI-LAB — MARCADORES CARDÍACOS ADICIONAIS
  ═══════════════════════════════════════════════════════ */
  { codigo: "10249", categoria: "Marcadores Cardíacos", nome: "Troponina I (cardíaca)", preco: 32670.00, prazo: "48h",
    parametros: [{ nome: "Troponina I", unidade: "ng/mL", refMin: "0", refMax: "0.04", tipo: "numerico" }, { nome: "Interpretação", unidade: "", tipo: "selecao", opcoes: ["Normal", "Elevada — suspeita de lesão miocárdica"] }] },
  { codigo: "10250", categoria: "Marcadores Cardíacos", nome: "Troponina (cardíaca — total)", preco: 32670.00, prazo: "48h",
    parametros: [{ nome: "Troponina", unidade: "ng/mL", refMin: "0", refMax: "0.04", tipo: "numerico" }] },

  /* ═══════════════════════════════════════════════════════
     FUTI-LAB — ENDOCRINOLOGIA / ESPECIALIDADE
  ═══════════════════════════════════════════════════════ */
  { codigo: "10087", categoria: "Electroforese", nome: "Electroforese Urinária de Proteínas", preco: 28875.00, prazo: "5 - 7 Dias",
    parametros: [{ nome: "Resultado electroforético", unidade: "", tipo: "texto" }, { nome: "Bandas identificadas", unidade: "", tipo: "texto" }, { nome: "Comentário", unidade: "", tipo: "texto" }] },
  { codigo: "10088", categoria: "Electroforese", nome: "Electroforese de Proteínas Séricas", preco: 28875.00, prazo: "5 - 7 Dias",
    parametros: [{ nome: "Albumina (%)", unidade: "%", refMin: "55", refMax: "68", tipo: "numerico" }, { nome: "Alfa-1 globulinas (%)", unidade: "%", refMin: "2", refMax: "5", tipo: "numerico" }, { nome: "Alfa-2 globulinas (%)", unidade: "%", refMin: "7", refMax: "13", tipo: "numerico" }, { nome: "Beta globulinas (%)", unidade: "%", refMin: "8", refMax: "14", tipo: "numerico" }, { nome: "Gama globulinas (%)", unidade: "%", refMin: "12", refMax: "20", tipo: "numerico" }, { nome: "Padrão electroforético", unidade: "", tipo: "texto" }] },

  /* ═══════════════════════════════════════════════════════
     FUTI-LAB — OUTROS / RASTREIO
  ═══════════════════════════════════════════════════════ */
  { codigo: "10207", categoria: "Rastreio / Outros", nome: "Teste de Gravidez (urina)", preco: 5775.00, prazo: "24h",
    parametros: [{ nome: "β-HCG (qualitativo)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10179", categoria: "Rastreio / Outros", nome: "Pesquisa de Drogas de Abuso (Urina)", preco: 57750.00, prazo: "48h",
    parametros: [{ nome: "Anfetaminas", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Cocaína", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Opiáceos", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Canabinóides (THC)", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Benzodiazepinas", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }, { nome: "Barbitúricos", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10234", categoria: "Rastreio / Outros", nome: "Teste de Urease (H. pylori)", preco: 31350.00, prazo: "72h",
    parametros: [{ nome: "Teste de Urease", unidade: "", tipo: "selecao", opcoes: ["Negativo", "Positivo"] }] },
  { codigo: "10191", categoria: "Rastreio / Outros", nome: "Deslocação de Técnico de Colheita", preco: 33000.00, prazo: "24h",
    parametros: [{ nome: "Serviço", unidade: "", tipo: "texto" }] },
  { codigo: "10095", categoria: "Vitaminas e Oligoelementos", nome: "Vitamina D (25-OH — Hidroxivitamina D)", preco: 48125.00, prazo: "48h",
    parametros: [{ nome: "25-OH Vitamina D", unidade: "ng/mL", refMin: "30", refMax: "100", tipo: "numerico" }, { nome: "Interpretação", unidade: "", tipo: "selecao", opcoes: ["Deficiência grave (<10)", "Deficiência (10-20)", "Insuficiência (20-30)", "Suficiência (30-100)", "Toxicidade (>100)"] }] },
];
