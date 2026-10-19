import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from "react";
import { useUser } from "@clerk/react";
import { commitDocument } from "@workspace/api-client-react";
import {
  Fatura,
  Produto,
  MovimentoStock,
  PacienteCliente,
  ConfigSistema,
  PerfilImpressoraTermica,
  ConfiguracaoFiscalAGT,
  UsuarioSistema,
  NivelAcesso,
  Notificacao,
  ConsumoMensalData,
  TipoMovimento,
  LoteItem,
  KitProduto
} from "../types";
import { defaultUsuarios } from "../utils/userPermissions";
import { soundManager } from "../utils/barcodeUtils";
import { validarNifAngola, validarNifEmitente } from "../utils/faturaGenerator";
import { catalogoEletromedicina999 } from "../data/eletromedicinaCatalog";
import { initialKits, calculateKitTotals } from "../data/kitsCatalog";

function todayStr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function nowTimeStr(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}:${String(n.getSeconds()).padStart(2, "0")}`;
}

function dateFromStr(dStr: string): Date {
  const p = dStr.split("/");
  if (p.length === 3) {
    return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  }
  return new Date(dStr);
}

function lotExpiryDate(value?: string): Date {
  if (!value) return new Date("2999-12-31");
  const parsed = dateFromStr(value);
  return Number.isNaN(parsed.getTime()) ? new Date("2999-12-31") : parsed;
}

function formatDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function addDays(d: Date, days: number): string {
  const target = new Date(d);
  target.setDate(target.getDate() + days);
  return formatDate(target);
}

// Default thermal printer profiles
export const defaultPerfisImpressoras: PerfilImpressoraTermica[] = [
  {
    id: "term-epson-01",
    nome: "Epson TM-T20III (Balcão Principal)",
    modelo: "Epson ESC/POS 80mm",
    tipoConexao: "usb",
    larguraPapel: "80mm",
    colunas: 48,
    protocolo: "esc_pos",
    padrao: true,
    ativo: true,
    cortarPapel: true,
    abrirGaveta: true,
    imprimirLogotipo: true,
    imprimirQrCodeFiscal: true,
    imprimirCodigoBarras: true,
    viasImpressao: 2,
    densidadeImpressao: "normal",
    localizacaoSetor: "Caixa 01 / Balcão Principal",
    rodapePersonalizado: "Obrigado pela sua visita! Guarde este talão fiscal.",
  },
  {
    id: "term-bixolon-02",
    nome: "Bixolon SRP-330 (Caixa 02 / Rede TCP)",
    modelo: "Bixolon POS Ethernet",
    tipoConexao: "rede_tcp",
    enderecoIp: "192.168.1.180",
    portaTcp: 9100,
    larguraPapel: "80mm",
    colunas: 48,
    protocolo: "esc_pos",
    padrao: false,
    ativo: true,
    cortarPapel: true,
    abrirGaveta: true,
    imprimirLogotipo: true,
    imprimirQrCodeFiscal: true,
    imprimirCodigoBarras: false,
    viasImpressao: 1,
    densidadeImpressao: "normal",
    localizacaoSetor: "Caixa 02 - Farmácia",
    rodapePersonalizado: "Consulte o nosso farmacêutico de serviço.",
  },
  {
    id: "term-zebra-03",
    nome: "Zebra ZD220 (Armazém & Etiquetas)",
    modelo: "Zebra / Xprinter 58mm",
    tipoConexao: "usb",
    larguraPapel: "58mm",
    colunas: 32,
    protocolo: "esc_pos",
    padrao: false,
    ativo: true,
    cortarPapel: false,
    abrirGaveta: false,
    imprimirLogotipo: false,
    imprimirQrCodeFiscal: false,
    imprimirCodigoBarras: true,
    viasImpressao: 1,
    densidadeImpressao: "escuro",
    localizacaoSetor: "Armazém Geral / Recepção",
    rodapePersonalizado: "Conferido no Armazém Central",
  },
  {
    id: "term-fiscal-04",
    nome: "Impressora Fiscal Homologada AGT",
    modelo: "Datecs / Bematech Fiscal AGT",
    tipoConexao: "serial_com",
    portaSerial: "COM1",
    baudRate: 115200,
    larguraPapel: "80mm",
    colunas: 48,
    protocolo: "fiscal_agt_direto",
    padrao: false,
    ativo: true,
    cortarPapel: true,
    abrirGaveta: true,
    imprimirLogotipo: true,
    imprimirQrCodeFiscal: true,
    imprimirCodigoBarras: true,
    viasImpressao: 1,
    densidadeImpressao: "normal",
    localizacaoSetor: "Terminal Fiscal Certificado",
  rodapePersonalizado: "Software de facturação — certificação AGT pendente",
  },
];

export const defaultFiscalAGTConfig: ConfiguracaoFiscalAGT = {
  softwareCertificadoNumero: "PENDENTE_AGT",
  softwareVersao: "v2.5.0-PRO",
  softwareNome: "PharmaStock Fiscal Core",
  chaveVersao: "1.0",
  regimeIva: "Regime Geral",
  motivoIsencaoPadrao: "M02 - Artigo 12.º alínea a) do CIVA - Produtos Farmacêuticos e de Saúde",
  terminalCaixa: "POS-01",
  incluirMencaoDispensaAGT: true,
  exigirNifObrigatorioAcimaDe: 500000,
  validarHashAssinatura: true,
  comunicacaoSaftAtiva: false,
  emailContabilidadeSaft: "fiscal.angola@central-angola.ao",
  codigoValidacaoHash: "",
};

// Initial realistic data
const initialConfig: ConfigSistema = {
  nomeClinica: "DR. ELIAS MED LAB TECH",
  logoDataUrl: undefined,
  nif: "",
  endereco: "Avenida 4 de Fevereiro, n.º 142, Luanda - Angola",
  telefone: "+244 923 456 789 / 912 345 678",
  email: "contato@eliasmedlabtech.ao",
  serie: "A",
  moeda: "AOA",
  ivaTaxa: 14,
  regimeIva: "Regime Geral",
  bancoNome: "Banco BAI (Banco Angolano de Investimentos)",
  bancoIban: "AO06.0040.0000.1234.5678.9012.3",
  bancoSwift: "BAIAOLUA",
  alertaDiasValidade: 30,
  alertaStockBaixo: true,
  sonsScanner: true,
  formatoImpressaoPadrao: "a4",
  mensagemRodape: "DR. ELIAS MED LAB TECH - Eletromedicina & Lab - Software de facturação (certificação AGT pendente)",
  perfisImpressoras: defaultPerfisImpressoras,
  configuracaoFiscal: defaultFiscalAGTConfig,
};

function normalizeConfig(candidate: Partial<ConfigSistema> = {}): ConfigSistema {
  const merged = { ...initialConfig, ...candidate };
  const fiscal = {
    ...defaultFiscalAGTConfig,
    ...(candidate.configuracaoFiscal || {}),
  };
  const certificateNumber = String(fiscal.softwareCertificadoNumero || "");
  if (!certificateNumber || certificateNumber === "999/AGT/2026" || certificateNumber === "998/AGT/2026") {
    fiscal.softwareCertificadoNumero = "PENDENTE_AGT";
  }
  fiscal.comunicacaoSaftAtiva = false;

  return {
    ...merged,
    mensagemRodape: merged.mensagemRodape?.replace(/Software Certificado pela AGT[^-]*/i, "Software de facturação (certificação AGT pendente)") || merged.mensagemRodape,
    perfisImpressoras: (merged.perfisImpressoras?.length ? merged.perfisImpressoras : defaultPerfisImpressoras).map((perfil) => ({
      ...perfil,
      rodapePersonalizado: perfil.rodapePersonalizado?.replace(/Certificado AGT[^-]*/i, "Software de facturação — certificação AGT pendente"),
    })),
    configuracaoFiscal: fiscal,
  };
}

const initialClientes: PacienteCliente[] = [
  { id: 1, nome: "Hospital Central de Luanda", nif: "5409823101", telefone: "+244 924 112 233", email: "compras@hospitalcentral.ao", endereco: "Maianga, Luanda" },
  { id: 2, nome: "Laboratório Clínico Diagnóstico Vida", nif: "5418902345", telefone: "+244 912 887 766", email: "lab@diagnosticovida.ao", endereco: "Talatona, Luanda" },
  { id: 3, nome: "Clínica Universitária de Benguela", nif: "006781290LA031", telefone: "+244 933 445 566", email: "engenharia@clinicabenguela.ao", endereco: "Benguela, Angola" },
  { id: 4, nome: "Consumidor Final", nif: "999999999", endereco: "Luanda" }
];

const now = new Date();
const initialProdutos: Produto[] = catalogoEletromedicina999;

const initialMovimentos: MovimentoStock[] = [
  {
    id: "mov-1",
    data: todayStr(),
    hora: "08:30:00",
    produtoId: 51,
    produtoNome: "Lâmpada Halogénea 6V 20W",
    produtoCodigo: "PEC051",
    tipo: "entrada",
    quantidade: 30,
    stockAnterior: 0,
    stockAtual: 30,
    lote: "LT-MIC-51",
    dataValidade: "31/12/2028",
    motivo: "Importação direta fornecedor óptico",
    referenciaDocumento: "GE-9821",
    usuario: "Gestor de Estoque",
    valorUnitario: 9900,
    valorTotal: 297000,
  },
  {
    id: "mov-2",
    data: todayStr(),
    hora: "09:15:00",
    produtoId: 551,
    produtoNome: "Lâmina para Microscópio Lapidada Fosca cx 50un",
    produtoCodigo: "CON551",
    tipo: "entrada",
    quantidade: 50,
    stockAnterior: 0,
    stockAtual: 50,
    lote: "LT-CON-551",
    dataValidade: "31/12/2027",
    motivo: "Lote Inicial de Consumíveis",
    referenciaDocumento: "GE-9830",
    usuario: "Gestor de Estoque",
    valorUnitario: 3500,
    valorTotal: 175000,
  },
  {
    id: "mov-3",
    data: todayStr(),
    hora: "10:45:00",
    produtoId: 51,
    produtoNome: "Lâmpada Halogénea 6V 20W",
    produtoCodigo: "PEC051",
    tipo: "saida",
    quantidade: 2,
    stockAnterior: 30,
    stockAtual: 28,
    lote: "LT-MIC-51",
    motivo: "Venda na Factura FT A/2026/001",
    referenciaDocumento: "FT A/2026/001",
    usuario: "Operador de Caixa",
    valorUnitario: 18000,
    valorTotal: 36000,
  },
  {
    id: "mov-4",
    data: todayStr(),
    hora: "11:20:00",
    produtoId: 252,
    produtoNome: "Sensor SPO2 Adulto Reutilizável Clip de Dedo",
    produtoCodigo: "PEC252",
    tipo: "saida",
    quantidade: 1,
    stockAnterior: 10,
    stockAtual: 9,
    lote: "LT-HOSP-252",
    motivo: "Venda na Factura FT A/2026/002",
    referenciaDocumento: "FT A/2026/002",
    usuario: "Operador de Caixa",
    valorUnitario: 35000,
    valorTotal: 35000,
  }
];

const initialFaturas: Fatura[] = [
  {
    id: 1,
    numero: "RASCUNHO-0001",
    serie: "A",
    data: todayStr(),
    horaOperacao: "10:45:00",
    dataVencimento: todayStr(),
    clienteNome: "Laboratório Clínico Diagnóstico Vida",
    clienteNif: "5418902345",
    clienteEndereco: "Talatona, Luanda",
    linhas: [
      {
        produtoId: 1,
        codigo: "SVC001",
        descricao: "Manutenção Preventiva Microscópio Biológico",
        quantidade: 1,
        precoUnitario: 75000,
        ivaIsento: false,
        unidade: "serv",
      },
      {
        produtoId: 51,
        codigo: "PEC051",
        descricao: "Lâmpada Halogénea 6V 20W",
        quantidade: 2,
        precoUnitario: 18000,
        ivaIsento: false,
        unidade: "un",
        lote: "LT-MIC-51",
      },
      {
        produtoId: 70,
        codigo: "PEC070",
        descricao: "Óleo de Imersão Tipo A 100ml",
        quantidade: 1,
        precoUnitario: 9000,
        ivaIsento: false,
        unidade: "un",
        lote: "LT-MIC-70",
      }
    ],
    subtotalSemIva: 120000,
    totalIva: 16800, // 14% on 120000
    ivaTaxa: 14,
    total: 136800,
    estado: "rascunho",
    formaPagamento: "Multicaixa (TPA)",
    observacoes: "Manutenção realizada e aprovada pelo técnico responsável Dr. Elias",
    pacienteId: 2,
    emitidoPor: "Administrador do Sistema",
    tipoDocumento: "factura-recibo",
    facturaPremiada: true,
    codigoHash: undefined,
    emissaoContagem: 1,
  },
  {
    id: 2,
    numero: "RASCUNHO-0002",
    serie: "A",
    data: todayStr(),
    horaOperacao: "11:20:00",
    dataVencimento: addDays(now, 30),
    clienteNome: "Hospital Central de Luanda",
    clienteNif: "5409823101",
    clienteEndereco: "Maianga, Luanda",
    linhas: [
      {
        produtoId: 3,
        codigo: "SVC003",
        descricao: "Calibração de Balança Analítica 0.1mg",
        quantidade: 2,
        precoUnitario: 60000,
        ivaIsento: false,
        unidade: "serv",
      },
      {
        produtoId: 252,
        codigo: "PEC252",
        descricao: "Sensor SPO2 Adulto Reutilizável Clip de Dedo",
        quantidade: 2,
        precoUnitario: 35000,
        ivaIsento: false,
        unidade: "un",
        lote: "LT-HOSP-252",
      }
    ],
    subtotalSemIva: 190000,
    totalIva: 26600,
    ivaTaxa: 14,
    total: 216600,
    estado: "rascunho",
    formaPagamento: "Transferência Bancária",
    observacoes: "Fornecimento e calibração para UTI / Bloco Operatório",
    pacienteId: 1,
    emitidoPor: "Administrador do Sistema",
    tipoDocumento: "factura",
    facturaPremiada: false,
    codigoHash: undefined,
    emissaoContagem: 1,
  }
];

interface AppContextType {
  faturas: Fatura[];
  produtos: Produto[];
  movimentos: MovimentoStock[];
  pacientes: PacienteCliente[];
  config: ConfigSistema;
  notificacoes: Notificacao[];
  // Users & Permissions
  usuarios: UsuarioSistema[];
  currentUser: UsuarioSistema;
  setCurrentUser: (user: UsuarioSistema) => void;
  loginWithPin: (pin: string) => { success: boolean; user?: UsuarioSistema; message?: string };
  switchUser: (userId: string, pin?: string) => { success: boolean; message?: string };
  addUsuario: (user: Omit<UsuarioSistema, "id" | "criadoEm">) => UsuarioSistema;
  updateUsuario: (id: string, dados: Partial<UsuarioSistema>) => void;
  deleteUsuario: (id: string) => { success: boolean; message?: string };
  verifyAdminAccess: (pin: string) => boolean;
  // Kits de Produtos
  kits: KitProduto[];
  addKit: (kit: Omit<KitProduto, "id"> | KitProduto) => KitProduto;
  updateKit: (id: string, dados: Partial<KitProduto>) => void;
  deleteKit: (id: string) => void;
  findKitByCode: (code: string) => KitProduto | undefined;
  // Actions
  addFatura: (dados: Omit<Fatura, "id" | "numero">) => Promise<Fatura>;
  updateFatura: (id: number, dados: Partial<Fatura>) => Promise<Fatura>;
  removeFatura: (id: number) => void;
  addProduto: (dados: Omit<Produto, "id">) => Promise<Produto>;
  updateProduto: (id: number, dados: Partial<Produto>) => Promise<void>;
  deleteProduto: (id: number) => Promise<void>;
  addMovimento: (dados: Omit<MovimentoStock, "id" | "stockAnterior" | "stockAtual">) => Promise<MovimentoStock>;
  darBaixaValidade: (produtoId: number, lote: string, quantidade: number, motivo: string) => Promise<void>;
  addPaciente: (dados: Omit<PacienteCliente, "id">) => Promise<PacienteCliente>;
  updatePaciente: (id: number, dados: Partial<PacienteCliente>) => Promise<void>;
  deletePaciente: (id: number) => Promise<void>;
  updateConfig: (novasConfig: Partial<ConfigSistema>) => void;
  marcarNotificacaoLida: (id: string) => void;
  limparNotificacoes: () => void;
  findProdutoByBarcodeOrCode: (codeOrBarcode: string) => Produto | undefined;
  exportBackupJson: () => string;
  importBackupJson: (jsonStr: string) => boolean;
  resetToDefaults: () => void;
  consumoMensalData: ConsumoMensalData[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  FATURAS: "facturacao_faturas_v3_eletromedicina",
  PRODUTOS: "facturacao_produtos_v3_eletromedicina",
  MOVIMENTOS: "facturacao_movimentos_v3_eletromedicina",
  CLIENTES: "facturacao_clientes_v3_eletromedicina",
  CONFIG: "facturacao_config_v3_eletromedicina",
  USUARIOS: "facturacao_usuarios_v3_eletromedicina",
  CURRENT_USER: "facturacao_current_user_v3_eletromedicina",
  KITS: "facturacao_kits_v3_eletromedicina",
};

type PersistedAppState = {
  faturas: Fatura[];
  produtos: Produto[];
  movimentos: MovimentoStock[];
  pacientes: PacienteCliente[];
  config: ConfigSistema;
  usuarios: UsuarioSistema[];
  currentUser: UsuarioSistema;
  kits: KitProduto[];
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoaded: isAuthLoaded } = useUser();
  const [remoteStateReady, setRemoteStateReady] = useState(false);
  const remoteUpdatedAtRef = useRef<string | null>(null);
  // Users state
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USUARIOS);
      return saved ? JSON.parse(saved) : defaultUsuarios;
    } catch {
      return defaultUsuarios;
    }
  });

  const [currentUser, setCurrentUser] = useState<UsuarioSistema>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        const exists = defaultUsuarios.find((u) => u.id === parsed.id);
        if (exists) return parsed;
      }
      return defaultUsuarios[0]; // Admin by default
    } catch {
      return defaultUsuarios[0];
    }
  });

  // Kits state
  const [kits, setKits] = useState<KitProduto[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.KITS);
      return saved ? JSON.parse(saved) : initialKits;
    } catch {
      return initialKits;
    }
  });

  const [faturas, setFaturas] = useState<Fatura[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FATURAS);
      return saved ? JSON.parse(saved) : initialFaturas;
    } catch {
      return initialFaturas;
    }
  });

  const [produtos, setProdutos] = useState<Produto[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUTOS);
      return saved ? JSON.parse(saved) : initialProdutos;
    } catch {
      return initialProdutos;
    }
  });

  const [movimentos, setMovimentos] = useState<MovimentoStock[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVIMENTOS);
      return saved ? JSON.parse(saved) : initialMovimentos;
    } catch {
      return initialMovimentos;
    }
  });

  const [pacientes, setPacientes] = useState<PacienteCliente[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTES);
      return saved ? JSON.parse(saved) : initialClientes;
    } catch {
      return initialClientes;
    }
  });

  const [config, setConfig] = useState<ConfigSistema>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        return normalizeConfig(parsed);
      }
      return initialConfig;
    } catch {
      return initialConfig;
    }
  });

  const applyPersistedState = (remote: Partial<PersistedAppState>) => {
    if (Array.isArray(remote.faturas)) setFaturas(remote.faturas);
    if (Array.isArray(remote.produtos)) setProdutos(remote.produtos);
    if (Array.isArray(remote.movimentos)) setMovimentos(remote.movimentos);
    if (Array.isArray(remote.pacientes)) setPacientes(remote.pacientes);
    if (Array.isArray(remote.usuarios) && remote.usuarios.length > 0) setUsuarios(remote.usuarios);
    if (remote.currentUser) setCurrentUser(remote.currentUser);
    if (Array.isArray(remote.kits)) setKits(remote.kits);
    if (remote.config) setConfig(normalizeConfig(remote.config));
  };

  // Load the signed-in user's workspace from PostgreSQL. localStorage remains
  // as an offline cache, while the server becomes the source of truth whenever
  // the app is online.
  useEffect(() => {
    if (!isAuthLoaded || !user?.id) return;

    let cancelled = false;
    setRemoteStateReady(false);

    const loadRemoteState = async () => {
      try {
        const response = await fetch("/api/app-state", { credentials: "include" });
        if (!response.ok) throw new Error(`Estado remoto indisponível (${response.status})`);
        const result = await response.json() as { data: PersistedAppState | null; updatedAt: string | null };
        if (cancelled) return;

        if (result.data) {
          applyPersistedState(result.data);
        }
        remoteUpdatedAtRef.current = result.updatedAt;
      } catch (error) {
        console.warn("A trabalhar com a cópia offline; sincronização será tentada novamente.", error);
      } finally {
        if (!cancelled) setRemoteStateReady(true);
      }
    };

    void loadRemoteState();
    return () => {
      cancelled = true;
    };
  }, [isAuthLoaded, user?.id]);

  useEffect(() => {
    if (!user?.id || !remoteStateReady) return;

    const snapshot: PersistedAppState = {
      faturas,
      produtos,
      movimentos,
      pacientes,
      config,
      usuarios,
      currentUser,
      kits,
    };

    const timer = window.setTimeout(() => {
      void fetch("/api/app-state", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: snapshot,
          expectedUpdatedAt: remoteUpdatedAtRef.current,
        }),
      }).then(async (response) => {
        if (!response.ok) {
          if (response.status === 409) return;
          throw new Error(`Estado remoto indisponível (${response.status})`);
        }
        const result = await response.json() as { updatedAt: string | null };
        remoteUpdatedAtRef.current = result.updatedAt;
      }).catch((error) => {
        console.warn("Não foi possível sincronizar agora; os dados continuam guardados offline.", error);
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [
    user?.id,
    remoteStateReady,
    faturas,
    produtos,
    movimentos,
    pacientes,
    config,
    usuarios,
    currentUser,
    kits,
  ]);

  // Save to localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.FATURAS, JSON.stringify(faturas)); } catch {}
  }, [faturas]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.PRODUTOS, JSON.stringify(produtos)); } catch {}
  }, [produtos]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.MOVIMENTOS, JSON.stringify(movimentos)); } catch {}
  }, [movimentos]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(pacientes)); } catch {}
  }, [pacientes]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config)); } catch {}
  }, [config]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(usuarios)); } catch {}
  }, [usuarios]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser)); } catch {}
  }, [currentUser]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.KITS, JSON.stringify(kits)); } catch {}
  }, [kits]);

  // Generate dynamic notifications based on product stock and expiry dates
  const notificacoes = useMemo<Notificacao[]>(() => {
    const list: Notificacao[] = [];
    const hoje = new Date();
    const alertDays = config.alertaDiasValidade || 30;

    // Check expiration dates
    produtos.forEach((p) => {
      if (!p.ativo) return;
      if (p.dataValidade) {
        const valDate = dateFromStr(p.dataValidade);
        const diffMs = valDate.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          list.push({
            id: `exp-${p.id}`,
            tipo: "validade_expirada",
            titulo: "Lote Vencido!",
            mensagem: `O produto "${p.nome}" (Lote: ${p.loteAtual || "Padrão"}) venceu há ${Math.abs(diffDays)} dia(s)!`,
            data: todayStr(),
            hora: nowTimeStr(),
            lida: false,
            produtoId: p.id,
            urgencia: "alta",
          });
        } else if (diffDays <= alertDays) {
          list.push({
            id: `exp-soon-${p.id}`,
            tipo: "validade_proxima",
            titulo: "Validade Próxima",
            mensagem: `O produto "${p.nome}" vence em ${diffDays} dia(s) (${p.dataValidade}).`,
            data: todayStr(),
            hora: nowTimeStr(),
            lida: false,
            produtoId: p.id,
            urgencia: diffDays <= 7 ? "alta" : "media",
          });
        }
      }

      // Check low stock (except purely virtual services with stock > 500)
      if (config.alertaStockBaixo && p.stockMinimo > 0 && p.stock <= p.stockMinimo) {
        list.push({
          id: `stock-${p.id}`,
          tipo: "stock_baixo",
          titulo: "Stock Baixo",
          mensagem: `Stock crítico de "${p.nome}": apenas ${p.stock} ${p.unidadeMedida} restantes (Mínimo: ${p.stockMinimo}).`,
          data: todayStr(),
          hora: nowTimeStr(),
          lida: false,
          produtoId: p.id,
          urgencia: p.stock === 0 ? "alta" : "media",
        });
      }
    });

    // Check expired unpaid invoices
    faturas.forEach((f) => {
      if (f.estado === "emitida" && f.dataVencimento) {
        const venc = dateFromStr(f.dataVencimento);
        if (venc < hoje) {
          list.push({
            id: `fat-venc-${f.id}`,
            tipo: "fatura_vencida",
            titulo: "Fatura Vencida",
            mensagem: `${f.numero} (${f.clienteNome}) está vencida desde ${f.dataVencimento}.`,
            data: todayStr(),
            hora: nowTimeStr(),
            lida: false,
            faturaId: f.id,
            urgencia: "media",
          });
        }
      }
    });

    return list;
  }, [produtos, faturas, config]);

  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());

  const activeNotificacoes = useMemo(() => {
    return notificacoes.map((n) => ({
      ...n,
      lida: readNotificationIds.has(n.id),
    }));
  }, [notificacoes, readNotificationIds]);

  const marcarNotificacaoLida = (id: string) => {
    setReadNotificationIds((prev) => new Set([...prev, id]));
  };

  const limparNotificacoes = () => {
    setReadNotificationIds(new Set(notificacoes.map((n) => n.id)));
  };

  // Find product by Barcode or Code (case-insensitive)
  const findProdutoByBarcodeOrCode = (codeOrBarcode: string): Produto | undefined => {
    const clean = codeOrBarcode.trim().toLowerCase();
    return produtos.find(
      (p) =>
        p.ativo &&
        ((p.codigoBarras && p.codigoBarras.toLowerCase() === clean) ||
          (p.codigo && p.codigo.toLowerCase() === clean) ||
          p.nome.toLowerCase() === clean)
    );
  };

  // Calculate monthly consumption and sales data for charts
  const consumoMensalData = useMemo<ConsumoMensalData[]>(() => {
    const mesesMap: Record<string, ConsumoMensalData> = {};
    const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Initialize last 6 months
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const curDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const key = `${String(curDate.getMonth() + 1).padStart(2, "0")}/${curDate.getFullYear()}`;
      const label = `${mesesNomes[curDate.getMonth()]} ${curDate.getFullYear().toString().slice(-2)}`;
      mesesMap[key] = {
        mes: label,
        mesAno: key,
        quantidadeVendida: 0,
        quantidadeEntrada: 0,
        quantidadePerdas: 0,
        faturacaoTotal: 0,
        custoTotal: 0,
        lucroEstimado: 0,
      };
    }

    // Process movements
    movimentos.forEach((m) => {
      const parts = m.data.split("/");
      if (parts.length === 3) {
        const key = `${parts[1]}/${parts[2]}`;
        if (mesesMap[key]) {
          if (m.tipo === "saida") {
            mesesMap[key].quantidadeVendida += m.quantidade;
            mesesMap[key].faturacaoTotal += m.valorTotal || (m.quantidade * (m.valorUnitario || 0));
          } else if (m.tipo === "entrada") {
            mesesMap[key].quantidadeEntrada += m.quantidade;
            mesesMap[key].custoTotal += m.valorTotal || (m.quantidade * (m.valorUnitario || 0));
          } else if (m.tipo === "perda" || m.tipo === "validade") {
            mesesMap[key].quantidadePerdas += m.quantidade;
          }
        }
      }
    });

    // Ensure realistic baseline data for demonstration if empty
    return Object.values(mesesMap).map((m, idx) => {
      // If zero, provide representative realistic distribution
      const baselineSales = [45, 62, 78, 85, 94, 115];
      const baselineRev = [185000, 240000, 310000, 345000, 420000, 485000];
      const baselineCost = [95000, 125000, 160000, 175000, 210000, 240000];

      const qtdVendida = m.quantidadeVendida > 0 ? m.quantidadeVendida : baselineSales[idx % baselineSales.length];
      const fatTotal = m.faturacaoTotal > 0 ? m.faturacaoTotal : baselineRev[idx % baselineRev.length];
      const costTotal = m.custoTotal > 0 ? m.custoTotal : baselineCost[idx % baselineCost.length];
      const lucro = Math.max(0, fatTotal - costTotal);

      return {
        ...m,
        quantidadeVendida: qtdVendida,
        quantidadeEntrada: m.quantidadeEntrada > 0 ? m.quantidadeEntrada : qtdVendida + 20,
        quantidadePerdas: m.quantidadePerdas > 0 ? m.quantidadePerdas : (idx === 4 ? 4 : 1),
        faturacaoTotal: fatTotal,
        custoTotal: costTotal,
        lucroEstimado: lucro,
      };
    });
  }, [movimentos]);

  const commitOfficialDocument = async (
    document: Partial<Fatura>,
    existingDocumentId?: number,
  ): Promise<Fatura> => {
    try {
      const result = await commitDocument({
        document: document as unknown as Record<string, unknown>,
        ...(existingDocumentId !== undefined ? { existingDocumentId } : {}),
      });
      applyPersistedState(result.data as unknown as PersistedAppState);
      remoteUpdatedAtRef.current = result.updatedAt;
      if (config.sonsScanner) soundManager.playSuccessBeep();
      return result.fatura as unknown as Fatura;
    } catch (error) {
      if (error instanceof Error && "status" in error && "data" in error) {
        const apiError = error as Error & {
          status: number;
          data: { error?: string; data?: Record<string, unknown>; updatedAt?: string } | null;
        };
        const payload = apiError.data;
        if (payload?.data) {
          applyPersistedState(payload.data as PersistedAppState);
          remoteUpdatedAtRef.current = payload.updatedAt || remoteUpdatedAtRef.current;
        }
        throw new Error(
          payload?.error ||
            (apiError.status === 409
              ? "O documento foi rejeitado por conflito no estado partilhado. Actualize os dados e tente novamente."
              : "Não foi possível confirmar o documento no servidor."),
        );
      }
      throw error;
    }
  };

  // Drafts and pro-formas stay editable; every official document is committed atomically by the API.
  const addFatura = async (dados: Omit<Fatura, "id" | "numero">): Promise<Fatura> => {
    const isOfficial = dados.tipoDocumento !== "pro-forma" && dados.estado !== "rascunho";
    if (isOfficial && !validarNifEmitente(config.nif)) {
      throw new Error("Configure um NIF do emitente válido antes de emitir um documento oficial.");
    }
    if (!validarNifAngola(dados.clienteNif, !dados.clienteNif || dados.clienteNif === "999999999")) {
      throw new Error("O NIF do adquirente não tem um formato válido.");
    }
    const stockSaleTypes = ["factura", "factura-recibo", "factura-global"];
    if (isOfficial && stockSaleTypes.includes(dados.tipoDocumento)) {
      const requested = new Map<number, number>();
      dados.linhas.forEach((linha) => {
        const produto = linha.produtoId
          ? produtos.find((p) => p.id === linha.produtoId)
          : produtos.find((p) => p.nome.toLowerCase() === linha.descricao.toLowerCase());
        if (produto && produto.unidadeMedida !== "serv" && produto.unidadeMedida !== "exame") {
          requested.set(produto.id, (requested.get(produto.id) || 0) + linha.quantidade);
        }
      });
      requested.forEach((quantidade, produtoId) => {
        const produto = produtos.find((p) => p.id === produtoId);
        if (produto && quantidade > produto.stock) {
          throw new Error(`Stock insuficiente para "${produto.nome}". Disponível: ${produto.stock}; solicitado: ${quantidade}.`);
        }
      });
    }
    if (isOfficial && dados.tipoDocumento === "nota-credito") {
      if (!dados.documentoOrigem) {
        throw new Error("A Nota de Crédito deve indicar o documento de origem.");
      }
      const origem = faturas.find((f) => f.numero === dados.documentoOrigem);
      if (
        !origem ||
        origem.tipoDocumento === "pro-forma" ||
        origem.tipoDocumento === "nota-credito" ||
        origem.estado === "rascunho" ||
        origem.estado === "anulada"
      ) {
        throw new Error("O documento de origem da Nota de Crédito não é válido.");
      }
      const creditado = new Map<string, number>();
      faturas
        .filter((f) =>
          f.tipoDocumento === "nota-credito" &&
          f.documentoOrigem === origem.numero &&
          f.estado !== "anulada" &&
          f.estado !== "rascunho"
        )
        .flatMap((f) => f.linhas)
        .forEach((linha) => {
          const chave = linha.produtoId ? `id:${linha.produtoId}` : `desc:${linha.descricao.toLowerCase()}`;
          creditado.set(chave, (creditado.get(chave) || 0) + Math.abs(linha.quantidade));
        });
      dados.linhas.forEach((linha) => {
        const chave = linha.produtoId ? `id:${linha.produtoId}` : `desc:${linha.descricao.toLowerCase()}`;
        const linhaOrigem = origem.linhas.find((item) =>
          linha.produtoId ? item.produtoId === linha.produtoId : item.descricao.toLowerCase() === linha.descricao.toLowerCase(),
        );
        if (!linhaOrigem) throw new Error(`O artigo "${linha.descricao}" não existe no documento de origem.`);
        const totalCreditado = (creditado.get(chave) || 0) + Math.abs(linha.quantidade);
        if (totalCreditado > Math.abs(linhaOrigem.quantidade)) {
          throw new Error(`A quantidade creditada de "${linha.descricao}" ultrapassa a quantidade facturada.`);
        }
        creditado.set(chave, totalCreditado);
      });
    }

    if (isOfficial) return commitOfficialDocument(dados);

    const year = new Date().getFullYear();
    const typeCodeMap: Record<string, string> = {
      "factura": "FT",
      "factura-recibo": "FR",
      "factura-global": "FG",
      "pro-forma": "PF",
      "nota-credito": "NC",
      "recibo": "RC",
    };
    const code = typeCodeMap[dados.tipoDocumento] || "FT";
    const sameTypeDocs = faturas.filter((f) => f.tipoDocumento === dados.tipoDocumento && f.serie === config.serie);
    const seq = sameTypeDocs.reduce((max, f) => {
      const match = f.numero.match(/\/(\d+)$/);
      return Math.max(max, match ? Number(match[1]) : 0);
    }, 0) + 1;
    const newId = faturas.length > 0 ? Math.max(...faturas.map((f) => f.id)) + 1 : 1;
    const numero = dados.tipoDocumento === "pro-forma"
      ? `${code} ${config.serie}/${year}/${String(seq).padStart(3, "0")}`
      : `RASCUNHO-${String(newId).padStart(4, "0")}`;
    const newFatura: Fatura = {
      ...dados,
      id: newId,
      numero,
      hashAnterior: undefined,
      codigoHash: undefined,
      horaOperacao: dados.horaOperacao || nowTimeStr(),
    };

    setFaturas((prev) => [newFatura, ...prev]);

    if (config.sonsScanner) {
      soundManager.playSuccessBeep();
    }

    return newFatura;
  };

  const deductStockForProduct = (
    produtoId: number,
    qtd: number,
    docNumero: string,
    precoVenda: number,
    lote?: string
  ) => {
    let actualDeducted = qtd;
    let allocatedLots: string[] = [];
    setProdutos((prevProds) =>
      prevProds.map((p) => {
        if (p.id !== produtoId) return p;
        let updatedLotes = p.lotes;
        if (p.lotes && p.lotes.length > 0) {
          const available = p.lotes
            .filter((item) => !lote || item.numeroLote === lote)
            .reduce((sum, item) => sum + item.quantidade, 0);
          actualDeducted = Math.min(qtd, available);
          let remaining = actualDeducted;
          const ordered = [...p.lotes]
            .filter((item) => !lote || item.numeroLote === lote)
            .sort((a, b) => lotExpiryDate(a.dataValidade).getTime() - lotExpiryDate(b.dataValidade).getTime());
          const allocations = new Map<string, number>();
          ordered.forEach((item) => {
            if (remaining <= 0) return;
            const take = Math.min(item.quantidade, remaining);
            allocations.set(item.id, take);
            allocatedLots.push(item.numeroLote);
            remaining -= take;
          });
          updatedLotes = p.lotes.map((item) => ({
            ...item,
            quantidade: Math.max(0, item.quantidade - (allocations.get(item.id) || 0)),
          }));
        }

        const noLotAvailable = !p.lotes || p.lotes.length === 0;
        if (noLotAvailable) actualDeducted = Math.min(qtd, p.stock);
        const newStock = Math.max(0, p.stock - actualDeducted);
        const remainingLot = updatedLotes?.find((item) => item.quantidade > 0);
        return {
          ...p,
          stock: newStock,
          lotes: updatedLotes,
          loteAtual: remainingLot?.numeroLote || p.loteAtual,
          dataValidade: remainingLot?.dataValidade || p.dataValidade,
        };
      })
    );

    // Record movement
    const prod = produtos.find((p) => p.id === produtoId);
    if (prod) {
      const newMov: MovimentoStock = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        data: todayStr(),
        hora: nowTimeStr(),
        produtoId: prod.id,
        produtoNome: prod.nome,
        produtoCodigo: prod.codigo,
        tipo: "saida",
        quantidade: actualDeducted,
        stockAnterior: prod.stock,
        stockAtual: Math.max(0, prod.stock - actualDeducted),
        lote: lote || allocatedLots.join(", ") || prod.loteAtual,
        dataValidade: prod.dataValidade,
        motivo: lote ? `Saída do lote ${lote} na emissão do documento ${docNumero}` : `Saída FEFO automática na emissão do documento ${docNumero}`,
        referenciaDocumento: docNumero,
        usuario: "Sistema de Facturação",
        valorUnitario: precoVenda,
        valorTotal: actualDeducted * precoVenda,
      };
      setMovimentos((prev) => [newMov, ...prev]);
    }
  };

  const restoreStockForProduct = (
    produtoId: number,
    qtd: number,
    docNumero: string,
    precoVenda: number,
    lote?: string,
    dataValidade?: string,
  ) => {
    const prod = produtos.find((p) => p.id === produtoId);
    if (!prod) return;

    setProdutos((prevProds) =>
      prevProds.map((p) => {
        if (p.id !== produtoId) return p;
        if (!p.lotes || p.lotes.length === 0) {
          return { ...p, stock: p.stock + qtd, loteAtual: lote || p.loteAtual, dataValidade: dataValidade || p.dataValidade };
        }
        const lotId = lote || `DEV-${docNumero.replace(/\s+/g, "-")}`;
        const existing = p.lotes.find((item) => item.numeroLote === lotId);
        const lotes = existing
          ? p.lotes.map((item) => item.numeroLote === lotId ? { ...item, quantidade: item.quantidade + qtd } : item)
          : [{
              id: `lot-${Date.now()}`,
              numeroLote: lotId,
              dataValidade: dataValidade || "31/12/2099",
              quantidade: qtd,
              precoCusto: p.precoCusto,
            }, ...p.lotes];
        return {
          ...p,
          stock: p.stock + qtd,
          lotes,
          loteAtual: lotId,
          dataValidade: dataValidade || p.dataValidade,
        };
      })
    );

    const newMov: MovimentoStock = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      data: todayStr(),
      hora: nowTimeStr(),
      produtoId: prod.id,
      produtoNome: prod.nome,
      produtoCodigo: prod.codigo,
      tipo: "devolucao",
      quantidade: qtd,
      stockAnterior: prod.stock,
      stockAtual: prod.stock + qtd,
      lote: lote || prod.loteAtual,
      dataValidade: dataValidade || prod.dataValidade,
      motivo: `Reposição por Nota de Crédito ${docNumero}`,
      referenciaDocumento: docNumero,
      usuario: "Sistema de Facturação",
      valorUnitario: precoVenda,
      valorTotal: qtd * precoVenda,
    };
    setMovimentos((prev) => [newMov, ...prev]);
  };

  const updateFatura = async (id: number, dados: Partial<Fatura>) => {
    const current = faturas.find((f) => f.id === id);
    if (!current) throw new Error("O documento já não existe neste estado.");
    const updated = { ...current, ...dados };
    if (
      current.estado === "rascunho" &&
      updated.estado !== "rascunho" &&
      updated.tipoDocumento !== "pro-forma"
    ) {
      if (!validarNifEmitente(config.nif)) {
        throw new Error("Configure um NIF do emitente válido antes de emitir um documento oficial.");
      }
      return commitOfficialDocument(updated, current.id);
    }
    if (current.estado !== "rascunho" && (
      dados.tipoDocumento !== undefined ||
      dados.numero !== undefined ||
      dados.total !== undefined ||
      dados.linhas !== undefined ||
      dados.clienteNif !== undefined ||
      dados.data !== undefined ||
      dados.codigoHash !== undefined ||
      dados.hashAnterior !== undefined
    )) {
      throw new Error("Documentos emitidos não podem ser alterados; emita uma nota de crédito ou anule o documento.");
    }
    setFaturas((prev) => prev.map((f) => (f.id === id ? { ...f, ...dados } : f)));
    return updated;
  };

  const removeFatura = (id: number) => {
    const current = faturas.find((f) => f.id === id);
    if (current?.estado === "rascunho") {
      setFaturas((prev) => prev.filter((f) => f.id !== id));
    }
  };

  // Add Product
  const addProduto = async (dados: Omit<Produto, "id">): Promise<Produto> => {
    const newId = produtos.length > 0 ? Math.max(...produtos.map((p) => p.id)) + 1 : 1;
    const novoProduto: Produto = {
      ...dados,
      id: newId,
      criadoEm: todayStr(),
      lotes: dados.lotes || (dados.loteAtual ? [{
        id: `lot-${Date.now()}`,
        numeroLote: dados.loteAtual,
        dataValidade: dados.dataValidade || addDays(new Date(), 180),
        quantidade: dados.stock,
        precoCusto: dados.precoCusto,
      }] : []),
    };

    setProdutos((prev) => [...prev, novoProduto]);

    // If initial stock > 0, log movement
    if (novoProduto.stock > 0 && novoProduto.unidadeMedida !== "serv" && novoProduto.unidadeMedida !== "exame") {
      const mov: MovimentoStock = {
        id: `mov-${Date.now()}`,
        data: todayStr(),
        hora: nowTimeStr(),
        produtoId: newId,
        produtoNome: novoProduto.nome,
        produtoCodigo: novoProduto.codigo,
        tipo: "entrada",
        quantidade: novoProduto.stock,
        stockAnterior: 0,
        stockAtual: novoProduto.stock,
        lote: novoProduto.loteAtual,
        dataValidade: novoProduto.dataValidade,
        motivo: "Stock inicial de cadastro de produto",
        referenciaDocumento: "CAD-INICIAL",
        usuario: "Gestor de Estoque",
        valorUnitario: novoProduto.precoCusto || 0,
        valorTotal: (novoProduto.precoCusto || 0) * novoProduto.stock,
      };
      setMovimentos((prev) => [mov, ...prev]);
    }

    return novoProduto;
  };

  const updateProduto = async (id: number, dados: Partial<Produto>) => {
    setProdutos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return { ...p, ...dados };
      })
    );
  };

  const deleteProduto = async (id: number) => {
    setProdutos((prev) => prev.filter((p) => p.id !== id));
  };

  // Add Stock Movement (Manual or adjustment)
  const addMovimento = async (
    dados: Omit<MovimentoStock, "id" | "stockAnterior" | "stockAtual">
  ): Promise<MovimentoStock> => {
    const prod = produtos.find((p) => p.id === dados.produtoId);
    const stockAnterior = prod ? prod.stock : 0;
    let stockAtual = stockAnterior;

    if (dados.tipo === "entrada" || dados.tipo === "devolucao") {
      stockAtual = stockAnterior + dados.quantidade;
    } else if (dados.tipo === "saida" || dados.tipo === "perda" || dados.tipo === "validade") {
      stockAtual = Math.max(0, stockAnterior - dados.quantidade);
    } else if (dados.tipo === "ajuste") {
      // For adjustments, quantidade is the new target stock
      stockAtual = dados.quantidade;
    }

    const newMov: MovimentoStock = {
      ...dados,
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stockAnterior,
      stockAtual,
      data: dados.data || todayStr(),
      hora: dados.hora || nowTimeStr(),
    };

    setMovimentos((prev) => [newMov, ...prev]);

    // Update product stock
    setProdutos((prev) =>
      prev.map((p) => {
        if (p.id !== dados.produtoId) return p;
        return {
          ...p,
          stock: stockAtual,
          loteAtual: dados.lote || p.loteAtual,
          dataValidade: dados.dataValidade || p.dataValidade,
        };
      })
    );

    return newMov;
  };

  // Write off expired batch (Dar baixa por validade)
  const darBaixaValidade = async (
    produtoId: number,
    lote: string,
    quantidade: number,
    motivo: string
  ) => {
    const prod = produtos.find((p) => p.id === produtoId);
    if (!prod) return;

    await addMovimento({
      data: todayStr(),
      hora: nowTimeStr(),
      produtoId: prod.id,
      produtoNome: prod.nome,
      produtoCodigo: prod.codigo,
      tipo: "validade",
      quantidade,
      lote,
      dataValidade: prod.dataValidade,
      motivo: motivo || `Abate por validade expirada do lote ${lote}`,
      referenciaDocumento: `ABATE-VAL-${lote}`,
      usuario: "Responsável Técnico de Farmácia",
      valorUnitario: prod.precoCusto || 0,
      valorTotal: (prod.precoCusto || 0) * quantidade,
    });
  };

  // Customers management
  const addPaciente = async (dados: Omit<PacienteCliente, "id">): Promise<PacienteCliente> => {
    const newId = pacientes.length > 0 ? Math.max(...pacientes.map((p) => p.id)) + 1 : 1;
    const novo: PacienteCliente = {
      ...dados,
      id: newId,
      criadoEm: todayStr(),
    };
    setPacientes((prev) => [...prev, novo]);
    return novo;
  };

  const updatePaciente = async (id: number, dados: Partial<PacienteCliente>) => {
    setPacientes((prev) => prev.map((p) => (p.id === id ? { ...p, ...dados } : p)));
  };

  const deletePaciente = async (id: number) => {
    setPacientes((prev) => prev.filter((p) => p.id !== id));
  };

  const updateConfig = (novasConfig: Partial<ConfigSistema>) => {
    setConfig((prev) => ({ ...prev, ...novasConfig }));
  };

  // User & Access Management
  const loginWithPin = (pin: string): { success: boolean; user?: UsuarioSistema; message?: string } => {
    const cleanPin = pin.trim();
    const found = usuarios.find((u) => u.ativo && u.pin === cleanPin);
    if (found) {
      const updatedUser = { ...found, ultimoAcesso: `Hoje, ${nowTimeStr().substring(0, 5)}` };
      setUsuarios((prev) => prev.map((u) => (u.id === found.id ? updatedUser : u)));
      setCurrentUser(updatedUser);
      return { success: true, user: updatedUser };
    }
    return { success: false, message: "Código PIN incorreto ou utilizador inativo." };
  };

  const switchUser = (userId: string, pin?: string): { success: boolean; message?: string } => {
    const target = usuarios.find((u) => u.id === userId);
    if (!target) {
      return { success: false, message: "Utilizador não encontrado." };
    }
    if (!target.ativo) {
      return { success: false, message: "Este utilizador está inativo no sistema." };
    }
    if (pin !== undefined && pin.trim() !== target.pin) {
      return { success: false, message: "PIN incorreto para este utilizador." };
    }
    const updatedUser = { ...target, ultimoAcesso: `Hoje, ${nowTimeStr().substring(0, 5)}` };
    setUsuarios((prev) => prev.map((u) => (u.id === target.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    return { success: true };
  };

  const addUsuario = (dados: Omit<UsuarioSistema, "id" | "criadoEm">): UsuarioSistema => {
    const colors = ["bg-purple-600", "bg-sky-600", "bg-emerald-600", "bg-amber-600", "bg-indigo-600", "bg-rose-600", "bg-teal-600"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const novo: UsuarioSistema = {
      ...dados,
      id: `usr-${Date.now()}`,
      avatarColor: dados.avatarColor || randomColor,
      criadoEm: todayStr(),
      ultimoAcesso: "Nunca",
    };
    setUsuarios((prev) => [...prev, novo]);
    return novo;
  };

  const updateUsuario = (id: string, dados: Partial<UsuarioSistema>) => {
    setUsuarios((prev) => {
      const nextList = prev.map((u) => (u.id === id ? { ...u, ...dados } : u));
      return nextList;
    });
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...dados }));
    }
  };

  const deleteUsuario = (id: string): { success: boolean; message?: string } => {
    const target = usuarios.find((u) => u.id === id);
    if (!target) return { success: false, message: "Utilizador não encontrado." };
    
    // Check if it's the only active admin
    const activeAdmins = usuarios.filter((u) => u.ativo && u.role === "admin");
    if (target.role === "admin" && activeAdmins.length <= 1) {
      return {
        success: false,
        message: "Não é possível eliminar o único Administrador ativo do sistema.",
      };
    }

    setUsuarios((prev) => prev.filter((u) => u.id !== id));
    if (currentUser.id === id) {
      const fallback = usuarios.find((u) => u.id !== id && u.ativo) || defaultUsuarios[0];
      setCurrentUser(fallback);
    }
    return { success: true };
  };

  const verifyAdminAccess = (pin: string): boolean => {
    const cleanPin = pin.trim();
    // Allow if matches current user PIN (if admin) or ANY active admin's PIN
    if (currentUser.role === "admin" && currentUser.pin === cleanPin) return true;
    const adminUser = usuarios.find((u) => u.ativo && u.role === "admin" && u.pin === cleanPin);
    return !!adminUser;
  };

  // Kits de Produtos Operations
  const addKit = (kitData: Omit<KitProduto, "id"> | KitProduto): KitProduto => {
    const newId = "id" in kitData && kitData.id ? kitData.id : `kit-${Date.now()}`;
    const calculatedTotal = calculateKitTotals(kitData.itens || []);
    const discount = calculatedTotal > 0 && kitData.precoVendaKit < calculatedTotal
      ? Math.round(((calculatedTotal - kitData.precoVendaKit) / calculatedTotal) * 100)
      : 0;

    const newKit: KitProduto = {
      ...kitData,
      id: newId,
      precoTotalCalculado: calculatedTotal,
      descontoPercentual: discount,
      criadoEm: kitData.criadoEm || todayStr(),
    };

    setKits((prev) => [newKit, ...prev.filter((k) => k.id !== newId)]);
    return newKit;
  };

  const updateKit = (id: string, dados: Partial<KitProduto>) => {
    setKits((prev) =>
      prev.map((k) => {
        if (k.id !== id) return k;
        const updated = { ...k, ...dados };
        const calculatedTotal = calculateKitTotals(updated.itens || []);
        const discount = calculatedTotal > 0 && updated.precoVendaKit < calculatedTotal
          ? Math.round(((calculatedTotal - updated.precoVendaKit) / calculatedTotal) * 100)
          : 0;
        return {
          ...updated,
          precoTotalCalculado: calculatedTotal,
          descontoPercentual: discount,
        };
      })
    );
  };

  const deleteKit = (id: string) => {
    setKits((prev) => prev.filter((k) => k.id !== id));
  };

  const findKitByCode = (code: string): KitProduto | undefined => {
    const clean = code.trim().toLowerCase();
    if (!clean) return undefined;
    return kits.find(
      (k) =>
        k.ativo &&
        (k.codigo.toLowerCase() === clean ||
          k.id.toLowerCase() === clean ||
          k.nome.toLowerCase() === clean)
    );
  };

  const exportBackupJson = (): string => {
    const backup = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      config,
      produtos,
      faturas,
      movimentos,
      pacientes,
      usuarios,
      currentUser,
      kits,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importBackupJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.produtos && Array.isArray(data.produtos)) setProdutos(data.produtos);
      if (data.faturas && Array.isArray(data.faturas)) setFaturas(data.faturas);
      if (data.movimentos && Array.isArray(data.movimentos)) setMovimentos(data.movimentos);
      if (data.pacientes && Array.isArray(data.pacientes)) setPacientes(data.pacientes);
      if (data.usuarios && Array.isArray(data.usuarios)) setUsuarios(data.usuarios);
      if (data.currentUser) setCurrentUser(data.currentUser);
      if (data.config) setConfig(normalizeConfig(data.config));
      if (data.kits && Array.isArray(data.kits)) setKits(data.kits);
      return true;
    } catch (e) {
      console.error("Failed to import backup JSON:", e);
      return false;
    }
  };

  const resetToDefaults = () => {
    setFaturas(initialFaturas);
    setProdutos(initialProdutos);
    setMovimentos(initialMovimentos);
    setPacientes(initialClientes);
    setConfig(initialConfig);
    setUsuarios(defaultUsuarios);
    setCurrentUser(defaultUsuarios[0]);
    setKits(initialKits);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        faturas,
        produtos,
        movimentos,
        pacientes,
        config,
        notificacoes: activeNotificacoes,
        usuarios,
        currentUser,
        setCurrentUser,
        loginWithPin,
        switchUser,
        addUsuario,
        updateUsuario,
        deleteUsuario,
        verifyAdminAccess,
        kits,
        addKit,
        updateKit,
        deleteKit,
        findKitByCode,
        addFatura,
        updateFatura,
        removeFatura,
        addProduto,
        updateProduto,
        deleteProduto,
        addMovimento,
        darBaixaValidade,
        addPaciente,
        updatePaciente,
        deletePaciente,
        updateConfig,
        marcarNotificacaoLida,
        limparNotificacoes,
        findProdutoByBarcodeOrCode,
        exportBackupJson,
        importBackupJson,
        resetToDefaults,
        consumoMensalData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
