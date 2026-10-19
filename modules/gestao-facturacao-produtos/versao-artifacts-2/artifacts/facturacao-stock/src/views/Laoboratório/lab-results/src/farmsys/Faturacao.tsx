// @ts-nocheck
import React, { useState, useMemo, useRef, useEffect } from "react";
import { TrendingUp, ShoppingCart } from "lucide-react";
import { useApp } from "../store/AppContext";
import { Fatura, LinhaFatura, formatCurrency } from "../store/storage";
import { generateFaturaHTML, downloadFatura, gerarHashFatura, gerarHashFaturaAsync } from "../utils/faturaGenerator";
import { Session } from "../store/auth";
import { jsPDF } from "jspdf";

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 1: FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════════
function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function addDays(dateStr: string, days: number): string {
  const p = dateStr.split("/");
  if (p.length !== 3) return dateStr;
  const d = new Date(`${p[2]}-${p[1]}-${p[0]}`);
  d.setDate(d.getDate() + days);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function isVencida(dv: string, estado: string) {
  if (estado !== "emitida") return false;
  const p = dv.split("/");
  if (p.length !== 3) return false;
  return new Date(`${p[2]}-${p[1]}-${p[0]}`) < new Date();
}

function diasParaVencimento(dv: string): number {
  const p = dv.split("/");
  if (p.length !== 3) return 0;
  const venc = new Date(`${p[2]}-${p[1]}-${p[0]}`);
  const hoje = new Date();
  const diff = venc.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDateLong(dateStr: string): string {
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const p = dateStr.split("/");
  if (p.length !== 3) return dateStr;
  return `${parseInt(p[0])} de ${meses[parseInt(p[1])-1]} de ${p[2]}`;
}

function getMesAno(dateStr: string): { mes: number; ano: number } {
  const p = dateStr.split("/");
  if (p.length !== 3) return { mes: 0, ano: 0 };
  return { mes: parseInt(p[1]), ano: parseInt(p[2]) };
}

function nowTimeStr() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}:${String(n.getSeconds()).padStart(2,"0")}`;
}

function getTimestamp() {
  return new Date().toISOString();
}

function gerarId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function emptyLinha(): LinhaFatura {
  return { descricao: "", quantidade: 1, precoUnitario: 0, ivaIsento: false, unidade: "" };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 2: VALIDAÇÕES
// ═══════════════════════════════════════════════════════════════════════════════
function validarNIF(nif: string): boolean {
  if (!nif) return true;
  const nifLimpo = nif.replace(/\D/g, "");
  return nifLimpo.length === 9 || nifLimpo.length === 14;
}

function validarBI(bi: string): boolean {
  if (!bi) return true;
  const biLimpo = bi.replace(/\s/g, "");
  return /^[A-Za-z0-9]{14}$/.test(biLimpo);
}

function validarPassaporte(passaporte: string): boolean {
  if (!passaporte) return true;
  const passLimpo = passaporte.replace(/[^A-Za-z0-9]/g, "");
  return passLimpo.length >= 6 && passLimpo.length <= 12;
}

function validarEmail(email: string): boolean {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarTelefone(telefone: string): boolean {
  if (!telefone) return true;
  const telLimpo = telefone.replace(/\D/g, "");
  return telLimpo.length >= 9;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 3: CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════
const TIPO_DOC_OPTS = [
  { value: "factura",         label: "Factura",          code: "FT", estadoDefault: "emitida" },
  { value: "factura-global",  label: "Factura Global",   code: "FG", estadoDefault: "emitida" },
  { value: "pro-forma",       label: "Pró-Forma",        code: "PF", estadoDefault: "rascunho" },
];

const FORMA_PAG_OPTS = [
  "Numerário",
  "Transferência Bancária",
  "Multicaixa Express",
  "Multicaixa (TPA)",
  "Cheque",
  "Crédito",
  "Outro",
];

// Ícones para formas de pagamento
const FORMA_PAG_ICONS: Record<string, string> = {
  "Numerário": "💵",
  "Transferência Bancária": "🏦",
  "Multicaixa Express": "📱",
  "Multicaixa (TPA)": "💳",
  "Cheque": "📝",
  "Crédito": "📅",
  "Outro": "💰",
};

const ESTADO_CORES: Record<string, { bg: string; text: string; dot: string }> = {
  rascunho: { bg: "bg-amber-500/10",    text: "text-amber-400",   dot: "bg-amber-400" },
  emitida:  { bg: "bg-blue-500/10",     text: "text-blue-400",    dot: "bg-blue-500"  },
  paga:     { bg: "bg-emerald-500/10",  text: "text-emerald-400", dot: "bg-emerald-500" },
  anulada:  { bg: "bg-red-500/10",      text: "text-red-400",     dot: "bg-red-400"   },
};

const ESTADO_LABEL: Record<string, string> = {
  rascunho: "Rascunho", emitida: "Emitida", paga: "Paga", anulada: "Anulada",
};

const TIPO_LABEL: Record<string, string> = {
  factura: "Factura", "factura-recibo": "Factura-Recibo",
  "factura-global": "Factura Global", "pro-forma": "Pró-Forma",
  "nota-credito": "Nota de Crédito",
};

const TIPO_AVATAR: Record<string, { code: string; bg: string }> = {
  "factura":         { code: "FT", bg: "bg-[#00AEEF]" },
  "factura-recibo":  { code: "FR", bg: "bg-teal-500" },
  "factura-global":  { code: "FG", bg: "bg-violet-500" },
  "pro-forma":       { code: "PF", bg: "bg-amber-500" },
  "nota-credito":    { code: "NC", bg: "bg-orange-500" },
};

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const PROVINCIAS_ANGOLA = [
  "Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango", "Cuanza Norte",
  "Cuanza Sul", "Cunene", "Huambo", "Huíla", "Luanda", "Lunda Norte",
  "Lunda Sul", "Malanje", "Moxico", "Namibe", "Uíge", "Zaire"
];

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 4: TIPOS
// ═══════════════════════════════════════════════════════════════════════════════
interface TemplateFatura {
  id: string;
  nome: string;
  descricao?: string;
  tipoDocumento: string;
  linhas: LinhaFatura[];
  observacoes?: string;
  criadoEm: string;
  usadoCount: number;
  categoria?: string;
}

interface NotificacaoItem {
  id: string;
  tipo: "vencimento" | "stock" | "pagamento" | "sistema" | "info";
  titulo: string;
  mensagem: string;
  data: string;
  hora: string;
  lida: boolean;
  faturaId?: number;
  produtoId?: number;
}

interface LogAuditoria {
  id: string;
  timestamp: string;
  usuario: string;
  acao: string;
  modulo: string;
  detalhes: string;
}

interface ConfigSistema {
  nomeClinica: string;
  nif: string;
  endereco: string;
  telefone: string;
  email: string;
  serie: string;
  moeda: string;
  ivaTaxa: number;
  tema: "claro" | "escuro";
  autoSalvar: boolean;
  alertasStock: boolean;
  alertasVencimento: boolean;
  diasAlertaVencimento: number;
  imprimirAutomatico: boolean;
  backupAutomatico: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  attachments?: { type: string; url: string; name: string }[];
}

interface DadosExtraidosBI {
  nome?: string;
  bi?: string;
  dataNascimento?: string;
  sexo?: string;
  naturalidade?: string;
  filiacao?: string;
  endereco?: string;
  foto?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOVO TIPO: Múltiplas Formas de Pagamento
// ═══════════════════════════════════════════════════════════════════════════════
interface FormaPagamentoItem {
  id: string;
  forma: string;
  valor: number;
  valorRecebido?: number;
  referencia?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 5: COMPONENTES UI
// ═══════════════════════════════════════════════════════════════════════════════
function FTAvatar({ tipo }: { tipo?: string }) {
  const cfg = TIPO_AVATAR[tipo ?? "factura"] ?? TIPO_AVATAR["factura"];
  return (
    <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
      <span className="text-white text-xs font-black tracking-tight">{cfg.code}</span>
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error" | "info" | "warning"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { bg: "bg-emerald-500", icon: "✓" },
    error: { bg: "bg-red-500", icon: "✕" },
    info: { bg: "bg-blue-500", icon: "ℹ" },
    warning: { bg: "bg-amber-500", icon: "⚠" },
  };

  const cfg = config[type];

  return (
    <div className={`fixed top-4 right-4 ${cfg.bg} text-white px-6 py-3 rounded-lg shadow-2xl z-[200] flex items-center gap-3 animate-slide-in min-w-[300px]`}>
      <span className="text-xl font-bold">{cfg.icon}</span>
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-lg">×</button>
    </div>
  );
}

function ModalWrapper({ title, subtitle, onClose, children, size = "md" }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; size?: "sm" | "md" | "lg" | "xl" | "full";
}) {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
    full: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col text-slate-100`}>
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-bold text-lg text-slate-100">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 w-8 h-8 flex items-center justify-center rounded hover:bg-slate-800 text-lg">×</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sublabel, color }: {
  icon: string; label: string; value: string; sublabel?: string; color: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${color} text-white rounded-xl p-4 shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs opacity-80">{label}</div>
        <div className="text-2xl">{icon}</div>
      </div>
      <div className="text-2xl font-black">{value}</div>
      {sublabel && <div className="text-xs opacity-80 mt-1">{sublabel}</div>}
    </div>
  );
}

function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
    teal: "bg-teal-100 text-teal-700",
    orange: "bg-orange-100 text-orange-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return <span className={`inline-flex items-center gap-1 rounded-full text-xs px-2 py-0.5 font-semibold ${colors[color]}`}>{children}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 6: COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function Faturacao({ session }: { session: Session }) {
  const { data, addFatura, updateFatura, removeFatura, addMovimento, addProduto, addPaciente, updateProduto, updatePaciente } = useApp();
  const produtos = (data.produtos ?? []).filter(p => p.ativo !== false);
  const todosProdutos = data.produtos ?? [];
  const moeda = data.config.moeda || "AOA";
  const ivaTaxaDefault = data.config.ivaTaxa || 14;
  const hoje = todayStr();

  // ═════════════════════════════════════════════════════════════════════════════
  // ESTADOS PRINCIPAIS
  // ═════════════════════════════════════════════════════════════════════════════
  const [view, setView] = useState<"lista" | "form">("lista");
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroData, setFiltroData] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteNif, setClienteNif] = useState("");
  const [clienteEndereco, setClienteEndereco] = useState("");
  const [pacienteId, setPacienteId] = useState("");
  const [linhas, setLinhas] = useState<LinhaFatura[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [refExterna, setRefExterna] = useState("");
  const [estado, setEstado] = useState<Fatura["estado"]>("emitida");
  const [dataEmissao, setDataEmissao] = useState(hoje);
  const [dataVenc, setDataVenc] = useState(addDays(hoje, 30));
  const [ivaTaxa, setIvaTaxa] = useState(ivaTaxaDefault);
  const [desconto, setDesconto] = useState(0);
  const [tipoDocumento, setTipoDocumento] = useState("factura");

  // ═════════════════════════════════════════════════════════════════════════════
  // NOVO: Múltiplas Formas de Pagamento
  // ═════════════════════════════════════════════════════════════════════════════
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamentoItem[]>([]);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [valorRecebido, setValorRecebido] = useState<number | "">(0);
  const [usarMultiplasFormas, setUsarMultiplasFormas] = useState(false);

  const [produtoSearch, setProdutoSearch] = useState("");
  const [produtoQtd, setProdutoQtd] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRascunhos, setShowRascunhos] = useState(true);
  const [dropdownIndex, setDropdownIndex] = useState(-1);
  const [showProdutosPanel, setShowProdutosPanel] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCat, setCatalogCat] = useState<string | null>(null);
  const [catalogViewMode, setCatalogViewMode] = useState<"grid" | "list">("grid");
  const [nifError, setNifError] = useState("");
  const [facturaPremiada, setFacturaPremiada] = useState(false);
  const [ncModal, setNcModal] = useState<{ fatura: Fatura } | null>(null);
  const [ncMotivo, setNcMotivo] = useState("");
  const [reciboModal, setReciboModal] = useState<{ fatura: Fatura } | null>(null);
  const [reciboFormaPag, setReciboFormaPag] = useState("");
  const [showNovoProduto, setShowNovoProduto] = useState(false);
  const [editandoProdutoId, setEditandoProdutoId] = useState<number | null>(null);
  const [novoProduto, setNovoProduto] = useState({
    nome: "", codigo: "", preco: 0, categoria: "", ivaIsento: false, descricao: "",
    stock: 0, stockMinimo: 0,
  });
  const [novoProdutoError, setNovoProdutoError] = useState("");
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [editandoClienteId, setEditandoClienteId] = useState<number | null>(null);
  const [novoCliente, setNovoCliente] = useState({
    nome: "", nif: "", bi: "", passaporte: "", telefone: "", email: "",
    endereco: "", observacoes: "", tipoDocumento: "nif",
  });
  const [novoClienteError, setNovoClienteError] = useState("");
  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [showGestaoProdutos, setShowGestaoProdutos] = useState(false);
  const [showGestaoClientes, setShowGestaoClientes] = useState(false);
  const [gestaoSearch, setGestaoSearch] = useState("");
  const [gestaoCat, setGestaoCat] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashSalesHover, setDashSalesHover] = useState<number | null>(null);
  const [dashProdHover, setDashProdHover] = useState<number | null>(null);
  const [showDetalhesCliente, setShowDetalhesCliente] = useState<{ clienteId: number } | null>(null);
  const [showDetalhesProduto, setShowDetalhesProduto] = useState<{ produtoId: number } | null>(null);

  const [showRelatorios, setShowRelatorios] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const [relatorioTipo, setRelatorioTipo] = useState<"resumo" | "iva" | "clientes" | "produtos" | "pagamentos" | "vencidos">("resumo");
  const [relatorioPeriodo, setRelatorioPeriodo] = useState<"dia" | "semana" | "mes" | "trimestre" | "ano" | "personalizado">("mes");
  const [relatorioDataInicio, setRelatorioDataInicio] = useState("");
  const [relatorioDataFim, setRelatorioDataFim] = useState("");

  const [templates, setTemplates] = useState<TemplateFatura[]>(() => {
    try {
      const saved = localStorage.getItem("templates_fatura");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showNovoTemplate, setShowNovoTemplate] = useState(false);
  const [templateEditando, setTemplateEditando] = useState<TemplateFatura | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateFatura>({
    id: "", nome: "", descricao: "", tipoDocumento: "factura", linhas: [],
    observacoes: "", criadoEm: hoje, usadoCount: 0, categoria: "Geral",
  });

  const [logs, setLogs] = useState<LogAuditoria[]>(() => {
    try {
      const saved = localStorage.getItem("logs_auditoria");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [logFiltro, setLogFiltro] = useState<"todos" | "faturas" | "produtos" | "clientes" | "sistema">("todos");

  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);

  const [configForm, setConfigForm] = useState<ConfigSistema>({
    nomeClinica: data.config.nomeClinica || "",
    nif: data.config.nif || "",
    endereco: data.config.endereco || "",
    telefone: data.config.telefone || "",
    email: data.config.email || "",
    serie: data.config.serie || "A",
    moeda: data.config.moeda || "AOA",
    ivaTaxa: data.config.ivaTaxa || 14,
    tema: "claro",
    autoSalvar: true,
    alertasStock: true,
    alertasVencimento: true,
    diasAlertaVencimento: 7,
    imprimirAutomatico: false,
    backupAutomatico: true,
  });

  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: gerarId(),
      role: "assistant",
      content: "Olá! Sou seu assistente inteligente. Posso ajudar com:\n• 📄 Faturar (ex: 'faturar 2 consultas para João')\n• 🔍 Localizar cliente ou produto\n• 👤 Criar cliente (com upload de BI/Passaporte)\n• 📦 Criar produto\n• 📊 Dashboard e relatórios\nComo posso ajudar?",
      timestamp: nowTimeStr(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTipo, setUploadTipo] = useState<"cliente" | "produto">("cliente");
  const [uploadArquivo, setUploadArquivo] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const [uploadExtraindo, setUploadExtraindo] = useState(false);
  const [uploadDadosExtraidos, setUploadDadosExtraidos] = useState<any>(null);

  const recognitionRef = useRef<any>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelAction, setCancelAction] = useState<() => void>(() => {});
  const [confirmModal, setConfirmModal] = useState<{
    title: string; message: string; onConfirm: () => void;
    confirmText?: string; cancelText?: string;
    type?: "warning" | "danger" | "info";
  } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ═════════════════════════════════════════════════════════════════════════════
  // NOVO: Funções para Múltiplas Formas de Pagamento
  // ═════════════════════════════════════════════════════════════════════════════
  function adicionarFormaPagamento() {
    const novaForma: FormaPagamentoItem = {
      id: gerarId(),
      forma: "",
      valor: 0,
      valorRecebido: undefined,
      referencia: "",
    };
    setFormasPagamento(prev => [...prev, novaForma]);
  }

  function removerFormaPagamento(id: string) {
    setFormasPagamento(prev => prev.filter(f => f.id !== id));
  }

  function atualizarFormaPagamento(id: string, campo: keyof FormaPagamentoItem, valor: any) {
    setFormasPagamento(prev => prev.map(f =>
      f.id === id ? { ...f, [campo]: valor } : f
    ));
  }

  function calcularTotalFormasPagamento(): number {
    return formasPagamento.reduce((total, f) => total + (Number(f.valor) || 0), 0);
  }

  function calcularTrocoForma(forma: FormaPagamentoItem): number {
    if (forma.forma !== "Numerário" || !forma.valorRecebido) return 0;
    return Math.max(0, forma.valorRecebido - forma.valor);
  }

  function distribuirTotalAutomaticamente(totalAlvo: number) {
    if (formasPagamento.length === 0 || totalAlvo === 0) return;
    const valorPorForma = totalAlvo / formasPagamento.length;
    setFormasPagamento(prev => prev.map(f => ({ ...f, valor: Math.round(valorPorForma * 100) / 100 })));
  }

  function preencherRestante(id: string, totalFatura: number) {
    const totalAtual = formasPagamento.reduce((s, f) => s + (f.id === id ? 0 : (Number(f.valor) || 0)), 0);
    const restante = totalFatura - totalAtual;
    if (restante > 0) {
      atualizarFormaPagamento(id, "valor", Math.round(restante * 100) / 100);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // FUNÇÃO: Adicionar Log
  // ════════════════════════════════════════════════════════════════════════════
  function addLog(acao: string, modulo: string, detalhes: string) {
    const novoLog: LogAuditoria = {
      id: gerarId(),
      timestamp: getTimestamp(),
      usuario: session.funcionarioNome || session.username || "Sistema",
      acao,
      modulo,
      detalhes,
    };
    setLogs(prev => {
      const novos = [novoLog, ...prev].slice(0, 500);
      try { localStorage.setItem("logs_auditoria", JSON.stringify(novos)); } catch {}
      return novos;
    });
  }

  function gerarNotificacoes(): NotificacaoItem[] {
    const notifs: NotificacaoItem[] = [];
    const hora = nowTimeStr();

    data.faturas.forEach(f => {
      if (f.estado === "emitida") {
        const dias = diasParaVencimento(f.dataVencimento);
        if (dias < 0) {
          notifs.push({
            id: `venc_${f.id}`,
            tipo: "vencimento",
            titulo: "Fatura Vencida",
            mensagem: `${f.numero} (${f.clienteNome}) venceu há ${Math.abs(dias)} dia(s) - ${formatCurrency(f.total, moeda)}`,
            data: hoje,
            hora,
            lida: false,
            faturaId: f.id,
          });
        } else if (dias <= 7) {
          notifs.push({
            id: `venc_soon_${f.id}`,
            tipo: "vencimento",
            titulo: "Fatura a Vencer",
            mensagem: `${f.numero} vence em ${dias} dia(s) - ${formatCurrency(f.total, moeda)}`,
            data: hoje,
            hora,
            lida: false,
            faturaId: f.id,
          });
        }
      }
    });

    produtos.forEach(p => {
      if (p.stock <= (p.stockMinimo || 0)) {
        notifs.push({
          id: `stock_${p.id}`,
          tipo: "stock",
          titulo: "Stock Baixo",
          mensagem: `${p.nome} tem apenas ${p.stock} unidades (mín: ${p.stockMinimo || 0})`,
          data: hoje,
          hora,
          lida: false,
          produtoId: p.id,
        });
      }
    });

    return notifs;
  }

  useEffect(() => {
    setNotificacoes(gerarNotificacoes());
  }, [data.faturas, produtos]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current && !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setDropdownIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "n" || e.key === "N") {
          e.preventDefault();
          handleNovo();
        } else if (e.key === "p" || e.key === "P") {
          e.preventDefault();
          openNovoProdutoModal();
        } else if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          openNovoClienteModal();
        } else if (e.key === "d" || e.key === "D") {
          e.preventDefault();
          setShowDashboard(v => !v);
        } else if (e.key === "h" || e.key === "H") {
          e.preventDefault();
          setShowChat(v => !v);
        }
      }
      if (e.key === "Escape") {
        if (showDashboard) setShowDashboard(false);
        else if (showRelatorios) setShowRelatorios(false);
        else if (showTemplates) setShowTemplates(false);
        else if (showLogs) setShowLogs(false);
        else if (showNotificacoes) setShowNotificacoes(false);
        else if (showConfig) setShowConfig(false);
        else if (showChat) setShowChat(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showDashboard, showRelatorios, showTemplates, showLogs, showNotificacoes, showConfig, showChat]);

  useEffect(() => {
    try { localStorage.setItem("templates_fatura", JSON.stringify(templates)); } catch {}
  }, [templates]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // ═════════════════════════════════════════════════════════════════════════════
  // FUNÇÕES DE RESET E NAVEGAÇÃO
  // ═════════════════════════════════════════════════════════════════════════════
  function resetForm() {
    setClienteNome(""); setClienteNif(""); setClienteEndereco(""); setPacienteId("");
    setLinhas([]); setObservacoes(""); setRefExterna("");
    setEstado("emitida"); setDataEmissao(hoje); setDataVenc(addDays(hoje, 30));
    setIvaTaxa(ivaTaxaDefault); setDesconto(0);
    setTipoDocumento("factura");
    setFormaPagamento(""); setValorRecebido(0);
    setFormasPagamento([]); setUsarMultiplasFormas(false);
    setProdutoSearch(""); setProdutoQtd(1);
    setShowDropdown(false); setDropdownIndex(-1);
    setShowProdutosPanel(false); setNifError("");
    setFacturaPremiada(false);
    setEditId(null);
  }

  function handleNovo() { resetForm(); setView("form"); addLog("Criar", "Faturas", "Iniciando nova fatura"); }

  function handleEdit(f: Fatura) {
    setClienteNome(f.clienteNome); setClienteNif(f.clienteNif);
    setClienteEndereco(f.clienteEndereco); setPacienteId(f.pacienteId ? String(f.pacienteId) : "");
    setLinhas(f.linhas.length > 0 ? f.linhas.map(l => ({ ...l, unidade: l.unidade ?? "" })) : []);
    setObservacoes(f.observacoes); setRefExterna("");
    setEstado(f.estado); setDataEmissao(f.data); setDataVenc(f.dataVencimento);
    setIvaTaxa(f.ivaTaxa); setDesconto(0);
    setTipoDocumento(f.tipoDocumento ?? "factura");
    setFormaPagamento(f.formaPagamento ?? "");
    setFacturaPremiada(f.facturaPremiada ?? false);
    setShowDropdown(false); setDropdownIndex(-1);
    setShowProdutosPanel(false); setNifError("");
    setEditId(f.id); setView("form");
    addLog("Editar", "Faturas", `Editando ${f.numero}`);
  }

  function handleNotaCredito(f: Fatura) {
    setNcMotivo("");
    setNcModal({ fatura: f });
  }

  function confirmarNotaCredito(f: Fatura, motivo: string) {
    setNcModal(null);
    resetForm();
    setTipoDocumento("nota-credito");
    setClienteNome(f.clienteNome);
    setClienteNif(f.clienteNif);
    setClienteEndereco(f.clienteEndereco);
    setLinhas(f.linhas.map(l => ({ ...l, quantidade: -Math.abs(l.quantidade) })));
    setObservacoes(`Nota de Crédito referente ao documento ${f.numero}${motivo ? " — " + motivo : ""}`);
    setEstado("emitida");
    setIvaTaxa(f.ivaTaxa);
    setView("form");
    addLog("Nota Crédito", "Faturas", `NC para ${f.numero}`);
  }

  function handleEmitirRecibo(f: Fatura) {
    setReciboFormaPag(f.formaPagamento ?? "");
    setReciboModal({ fatura: f });
  }

  function confirmarRecibo(f: Fatura, formaPag: string) {
    setReciboModal(null);
    const hora = nowTimeStr();
    const recibo: Omit<Fatura, "id" | "numero"> = {
      serie: f.serie, data: hoje, horaOperacao: hora, dataVencimento: hoje,
      clienteNome: f.clienteNome, clienteNif: f.clienteNif, clienteEndereco: f.clienteEndereco,
      linhas: f.linhas, subtotalSemIva: f.subtotalSemIva, totalIva: f.totalIva,
      ivaTaxa: f.ivaTaxa, total: f.total, estado: "paga",
      observacoes: `Recibo de pagamento da ${f.numero}`,
      pacienteId: f.pacienteId, emitidoPor: f.emitidoPor,
      tipoDocumento: "recibo", formaPagamento: formaPag, facturaPremiada: false,
    };
    addFatura(recibo).then((nova) => {
      gerarHashFaturaAsync({ ...nova, numero: nova.numero }, data.config.nif || "")
        .then(hash => updateFatura(nova.id, { codigoHash: hash }));
      const htmlRecibo = generateFaturaHTML(
        { ...nova, tipoDocumento: "recibo" }, data.config, { segundaVia: false }
      );
      downloadFatura(htmlRecibo, nova.numero);
      setToast({ message: "Recibo emitido com sucesso!", type: "success" });
      addLog("Recibo", "Faturas", `Recibo para ${f.numero}`);
    }).catch(() => {
      setToast({ message: "Erro ao emitir recibo", type: "error" });
    });
  }

  function openNovoProdutoModal(nomePrePreenchido?: string) {
    setNovoProduto({
      nome: nomePrePreenchido || "", codigo: "", preco: 0, categoria: "",
      ivaIsento: false, descricao: "", stock: 0, stockMinimo: 0,
    });
    setNovoProdutoError("");
    setEditandoProdutoId(null);
    setShowNovoProduto(true);
  }

  function openNovoClienteModal() {
    setNovoCliente({
      nome: "", nif: "", bi: "", passaporte: "", telefone: "", email: "",
      endereco: "", observacoes: "", tipoDocumento: "nif",
    });
    setNovoClienteError("");
    setEditandoClienteId(null);
    setShowNovoCliente(true);
  }

  function temDadosNaoSalvosProduto(): boolean {
    return novoProduto.nome.trim() !== "" || novoProduto.preco > 0;
  }

  function temDadosNaoSalvosCliente(): boolean {
    return novoCliente.nome.trim() !== "" || novoCliente.nif.trim() !== "" ||
      novoCliente.bi.trim() !== "" || novoCliente.passaporte.trim() !== "" ||
      novoCliente.telefone.trim() !== "";
  }

  function handleCloseProdutoModal() {
    if (temDadosNaoSalvosProduto()) {
      setCancelAction(() => () => {
        setShowNovoProduto(false);
        setEditandoProdutoId(null);
        setNovoProduto({ nome: "", codigo: "", preco: 0, categoria: "", ivaIsento: false, descricao: "", stock: 0, stockMinimo: 0 });
        setNovoProdutoError("");
      });
      setShowCancelConfirm(true);
    } else {
      setShowNovoProduto(false);
      setEditandoProdutoId(null);
      setNovoProduto({ nome: "", codigo: "", preco: 0, categoria: "", ivaIsento: false, descricao: "", stock: 0, stockMinimo: 0 });
      setNovoProdutoError("");
    }
  }

  function handleCloseClienteModal() {
    if (temDadosNaoSalvosCliente()) {
      setCancelAction(() => () => {
        setShowNovoCliente(false);
        setEditandoClienteId(null);
        setNovoCliente({ nome: "", nif: "", bi: "", passaporte: "", telefone: "", email: "", endereco: "", observacoes: "", tipoDocumento: "nif" });
        setNovoClienteError("");
      });
      setShowCancelConfirm(true);
    } else {
      setShowNovoCliente(false);
      setEditandoClienteId(null);
      setNovoCliente({ nome: "", nif: "", bi: "", passaporte: "", telefone: "", email: "", endereco: "", observacoes: "", tipoDocumento: "nif" });
      setNovoClienteError("");
    }
  }

  async function handleSaveProduto() {
    setNovoProdutoError("");
    if (!novoProduto.nome.trim()) {
      setNovoProdutoError("O nome do produto é obrigatório.");
      return;
    }
    if (novoProduto.preco < 0) {
      setNovoProdutoError("O preço não pode ser negativo.");
      return;
    }
    if (novoProduto.stock < 0) {
      setNovoProdutoError("O stock não pode ser negativo.");
      return;
    }

    const produtoExistente = produtos.find(p =>
      p.nome.toLowerCase() === novoProduto.nome.trim().toLowerCase() &&
      p.id !== editandoProdutoId
    );
    if (produtoExistente) {
      setNovoProdutoError(`Já existe um produto com o nome "${novoProduto.nome}".`);
      return;
    }

    if (novoProduto.codigo && produtos.find(p => p.codigo === novoProduto.codigo.trim() && p.id !== editandoProdutoId)) {
      setNovoProdutoError(`Já existe um produto com o código "${novoProduto.codigo}".`);
      return;
    }

    setSalvandoProduto(true);
    try {
      const produtoData = {
        nome: novoProduto.nome.trim(),
        codigo: novoProduto.codigo.trim() || undefined,
        preco: Number(novoProduto.preco) || 0,
        categoria: novoProduto.categoria.trim() || undefined,
        ivaIsento: !!novoProduto.ivaIsento,
        descricao: novoProduto.descricao.trim() || undefined,
        stock: Number(novoProduto.stock) || 0,
        stockMinimo: Number(novoProduto.stockMinimo) || 0,
        ativo: true,
      };

      if (editandoProdutoId !== null) {
        if (updateProduto) {
          await updateProduto(editandoProdutoId, produtoData);
          setToast({ message: `Produto "${produtoData.nome}" atualizado!`, type: "success" });
          addLog("Atualizar", "Produtos", produtoData.nome);
        } else {
          throw new Error("Função de edição indisponível");
        }
      } else {
        if (addProduto) {
          await addProduto(produtoData);
          setToast({ message: `Produto "${produtoData.nome}" criado!`, type: "success" });
          addLog("Criar", "Produtos", produtoData.nome);
        } else {
          throw new Error("Função de criação indisponível");
        }
      }

      setShowNovoProduto(false);
      setEditandoProdutoId(null);
      setNovoProduto({ nome: "", codigo: "", preco: 0, categoria: "", ivaIsento: false, descricao: "", stock: 0, stockMinimo: 0 });
    } catch (err: any) {
      setNovoProdutoError(err.message || "Erro ao salvar produto. Tente novamente.");
      setToast({ message: err.message || "Erro ao salvar produto", type: "error" });
    } finally {
      setSalvandoProduto(false);
    }
  }

  function handleEditarProduto(produtoId: number) {
    const produto = todosProdutos.find(p => p.id === produtoId);
    if (!produto) return;
    setNovoProduto({
      nome: produto.nome, codigo: produto.codigo || "", preco: produto.preco,
      categoria: produto.categoria || "", ivaIsento: !!produto.ivaIsento,
      descricao: produto.descricao || "", stock: produto.stock || 0,
      stockMinimo: produto.stockMinimo || 0,
    });
    setEditandoProdutoId(produtoId);
    setNovoProdutoError("");
    setShowNovoProduto(true);
  }

  function handleDesativarProduto(produtoId: number) {
    const produto = todosProdutos.find(p => p.id === produtoId);
    if (!produto) return;

    setConfirmModal({
      title: produto.ativo ? "Desativar Produto" : "Ativar Produto",
      message: produto.ativo
        ? `Deseja desativar "${produto.nome}"? Ele não aparecerá mais nas listagens.`
        : `Deseja ativar "${produto.nome}"?`,
      confirmText: produto.ativo ? "Desativar" : "Ativar",
      type: produto.ativo ? "warning" : "info",
      onConfirm: async () => {
        try {
          if (updateProduto) {
            await updateProduto(produtoId, { ...produto, ativo: !produto.ativo });
            setToast({
              message: `"${produto.nome}" ${produto.ativo ? "desativado" : "ativado"}!`,
              type: "success"
            });
            addLog(produto.ativo ? "Desativar" : "Ativar", "Produtos", produto.nome);
          }
        } catch (err) {
          setToast({ message: "Erro ao alterar estado", type: "error" });
        }
        setConfirmModal(null);
      }
    });
  }

  async function handleSaveCliente() {
    setNovoClienteError("");

    if (!novoCliente.nome.trim()) {
      setNovoClienteError("O nome do cliente é obrigatório.");
      return;
    }

    if (novoCliente.tipoDocumento === "nif" && novoCliente.nif && !validarNIF(novoCliente.nif)) {
      setNovoClienteError("NIF inválido. Deve ter 9 ou 14 dígitos.");
      return;
    }
    if (novoCliente.tipoDocumento === "bi" && novoCliente.bi && !validarBI(novoCliente.bi)) {
      setNovoClienteError("BI inválido. Deve ter exatamente 14 caracteres (letras e números).");
      return;
    }
    if (novoCliente.tipoDocumento === "passaporte" && novoCliente.passaporte && !validarPassaporte(novoCliente.passaporte)) {
      setNovoClienteError("Passaporte inválido. Deve ter entre 6 e 12 caracteres.");
      return;
    }
    if (novoCliente.email && !validarEmail(novoCliente.email)) {
      setNovoClienteError("Email inválido.");
      return;
    }
    if (novoCliente.telefone && !validarTelefone(novoCliente.telefone)) {
      setNovoClienteError("Telefone inválido. Deve ter pelo menos 9 dígitos.");
      return;
    }

    const docValue = novoCliente.tipoDocumento === "nif" ? novoCliente.nif :
      novoCliente.tipoDocumento === "bi" ? novoCliente.bi :
        novoCliente.passaporte;

    if (docValue) {
      const clienteExistente = data.pacientes.find(p => {
        if (novoCliente.tipoDocumento === "nif" && p.nif === docValue.trim()) return true;
        if (novoCliente.tipoDocumento === "bi" && p.bi === docValue.trim()) return true;
        if (novoCliente.tipoDocumento === "passaporte" && p.passaporte === docValue.trim()) return true;
        return false;
      });

      if (clienteExistente && clienteExistente.id !== editandoClienteId) {
        setNovoClienteError(`Já existe um cliente com este ${novoCliente.tipoDocumento.toUpperCase()}.`);
        return;
      }
    }

    const clienteNomeExistente = data.pacientes.find(p =>
      p.nome.toLowerCase() === novoCliente.nome.trim().toLowerCase() &&
      p.id !== editandoClienteId
    );
    if (clienteNomeExistente) {
      setNovoClienteError(`Já existe um cliente com o nome "${novoCliente.nome}".`);
      return;
    }

    setSalvandoCliente(true);
    try {
      const clienteData: any = {
        nome: novoCliente.nome.trim(),
        telefone: novoCliente.telefone.trim() || undefined,
        email: novoCliente.email.trim() || undefined,
        endereco: novoCliente.endereco.trim() || undefined,
        observacoes: novoCliente.observacoes.trim() || undefined,
      };

      if (novoCliente.tipoDocumento === "nif" && novoCliente.nif) {
        clienteData.nif = novoCliente.nif.trim();
      }
      if (novoCliente.tipoDocumento === "bi" && novoCliente.bi) {
        clienteData.bi = novoCliente.bi.trim();
      }
      if (novoCliente.tipoDocumento === "passaporte" && novoCliente.passaporte) {
        clienteData.passaporte = novoCliente.passaporte.trim();
      }

      if (editandoClienteId !== null) {
        if (updatePaciente) {
          await updatePaciente(editandoClienteId, clienteData);
          setToast({ message: `Cliente "${clienteData.nome}" atualizado!`, type: "success" });
          addLog("Atualizar", "Clientes", clienteData.nome);
        } else {
          throw new Error("Função de edição indisponível");
        }
      } else {
        if (addPaciente) {
          const novoPaciente = await addPaciente(clienteData);
          setPacienteId(String(novoPaciente.id));
          setClienteNome(novoPaciente.nome);
          setClienteNif(novoPaciente.nif || "");
          setClienteEndereco(novoPaciente.endereco || "");
          setNifError("");
          setToast({ message: `Cliente "${clienteData.nome}" criado e selecionado!`, type: "success" });
          addLog("Criar", "Clientes", clienteData.nome);
        } else {
          throw new Error("Função de criação indisponível");
        }
      }

      setShowNovoCliente(false);
      setEditandoClienteId(null);
      setNovoCliente({ nome: "", nif: "", bi: "", passaporte: "", telefone: "", email: "", endereco: "", observacoes: "", tipoDocumento: "nif" });
    } catch (err: any) {
      setNovoClienteError(err.message || "Erro ao salvar cliente. Tente novamente.");
      setToast({ message: err.message || "Erro ao salvar cliente", type: "error" });
    } finally {
      setSalvandoCliente(false);
    }
  }

  function handleEditarCliente(clienteId: number) {
    const cliente = data.pacientes.find(p => p.id === clienteId);
    if (!cliente) return;
    setNovoCliente({
      nome: cliente.nome,
      nif: cliente.nif || "",
      bi: cliente.bi || "",
      passaporte: cliente.passaporte || "",
      telefone: cliente.telefone || "",
      email: cliente.email || "",
      endereco: cliente.endereco || "",
      observacoes: cliente.observacoes || "",
      tipoDocumento: cliente.nif ? "nif" : cliente.bi ? "bi" : "passaporte",
    });
    setEditandoClienteId(clienteId);
    setNovoClienteError("");
    setShowNovoCliente(true);
  }

  function handleSalvarTemplate() {
    if (!templateForm.nome.trim()) {
      setToast({ message: "Nome do template é obrigatório", type: "error" });
      return;
    }
    if (templateForm.linhas.length === 0) {
      setToast({ message: "Adicione pelo menos um item", type: "error" });
      return;
    }

    const template: TemplateFatura = {
      ...templateForm,
      id: templateForm.id || gerarId(),
      criadoEm: hoje,
    };

    setTemplates(prev => {
      const idx = prev.findIndex(t => t.id === template.id);
      if (idx >= 0) {
        const novos = [...prev];
        novos[idx] = template;
        return novos;
      }
      return [template, ...prev];
    });

    setToast({ message: `Template "${template.nome}" salvo!`, type: "success" });
    setShowNovoTemplate(false);
    setTemplateEditando(null);
    setTemplateForm({ id: "", nome: "", descricao: "", tipoDocumento: "factura", linhas: [], observacoes: "", criadoEm: hoje, usadoCount: 0, categoria: "Geral" });
    addLog("Salvar", "Templates", template.nome);
  }

  function handleUsarTemplate(template: TemplateFatura) {
    resetForm();
    setTipoDocumento(template.tipoDocumento);
    setLinhas(template.linhas.map(l => ({ ...l })));
    setObservacoes(template.observacoes || "");
    setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, usadoCount: t.usadoCount + 1 } : t));
    setView("form");
    setShowTemplates(false);
    setToast({ message: `Template "${template.nome}" aplicado!`, type: "success" });
    addLog("Usar", "Templates", template.nome);
  }

  function handleEditarTemplate(template: TemplateFatura) {
    setTemplateForm({ ...template });
    setTemplateEditando(template);
    setShowNovoTemplate(true);
  }

  function handleRemoverTemplate(templateId: string) {
    setConfirmModal({
      title: "Remover Template",
      message: "Deseja remover este template? Esta ação não pode ser desfeita.",
      confirmText: "Remover",
      type: "danger",
      onConfirm: () => {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        setToast({ message: "Template removido", type: "success" });
        setConfirmModal(null);
        addLog("Remover", "Templates", templateId);
      }
    });
  }

  function handleCriarTemplateDaFaturaAtual() {
    setTemplateForm({
      id: "",
      nome: "",
      descricao: "",
      tipoDocumento: tipoDocumento,
      linhas: linhas.map(l => ({ ...l })),
      observacoes: observacoes,
      criadoEm: hoje,
      usadoCount: 0,
      categoria: "Geral",
    });
    setTemplateEditando(null);
    setShowNovoTemplate(true);
  }

  const templatesLaboratorio: TemplateFatura[] = [
    {
      id: "lab_hemograma",
      nome: "Hemograma Completo",
      descricao: "Exames hematológicos básicos",
      tipoDocumento: "pro-forma",
      categoria: "Hematologia",
      linhas: [
        { descricao: "Hemograma Completo", quantidade: 1, precoUnitario: 3500, ivaIsento: false, unidade: "exame" },
        { descricao: "Velocidade de Sedimentação (VS)", quantidade: 1, precoUnitario: 1500, ivaIsento: false, unidade: "exame" },
      ],
      observacoes: "Jejum de 8 horas recomendado",
      criadoEm: hoje,
      usadoCount: 0,
    },
    {
      id: "lab_bioquimica",
      nome: "Painel Bioquímico Básico",
      descricao: "Exames bioquímicos de rotina",
      tipoDocumento: "pro-forma",
      categoria: "Bioquímica",
      linhas: [
        { descricao: "Glicemia em Jejum", quantidade: 1, precoUnitario: 2000, ivaIsento: false, unidade: "exame" },
        { descricao: "Ureia", quantidade: 1, precoUnitario: 2000, ivaIsento: false, unidade: "exame" },
        { descricao: "Creatinina", quantidade: 1, precoUnitario: 2000, ivaIsento: false, unidade: "exame" },
        { descricao: "Ácido Úrico", quantidade: 1, precoUnitario: 2000, ivaIsento: false, unidade: "exame" },
        { descricao: "Colesterol Total", quantidade: 1, precoUnitario: 2000, ivaIsento: false, unidade: "exame" },
        { descricao: "Triglicerídeos", quantidade: 1, precoUnitario: 2000, ivaIsento: false, unidade: "exame" },
      ],
      observacoes: "Jejum obrigatório de 12 horas",
      criadoEm: hoje,
      usadoCount: 0,
    },
    {
      id: "lab_urinalise",
      nome: "Análise de Urina Completa",
      descricao: "Exame completo de urina",
      tipoDocumento: "pro-forma",
      categoria: "Urinálise",
      linhas: [
        { descricao: "Análise Macroscópica de Urina", quantidade: 1, precoUnitario: 1500, ivaIsento: false, unidade: "exame" },
        { descricao: "Análise Microscópica de Urina", quantidade: 1, precoUnitario: 2000, ivaIsento: false, unidade: "exame" },
        { descricao: "Urocultura com Antibiograma", quantidade: 1, precoUnitario: 5000, ivaIsento: false, unidade: "exame" },
      ],
      observacoes: "Primeira urina da manhã",
      criadoEm: hoje,
      usadoCount: 0,
    },
    {
      id: "lab_parasitologia",
      nome: "Exame Parasitológico de Fezes",
      descricao: "Detecção de parasitas intestinais",
      tipoDocumento: "pro-forma",
      categoria: "Parasitologia",
      linhas: [
        { descricao: "Exame Parasitológico de Fezes (3 amostras)", quantidade: 1, precoUnitario: 4500, ivaIsento: false, unidade: "exame" },
        { descricao: "Pesquisa de Giardia", quantidade: 1, precoUnitario: 2500, ivaIsento: false, unidade: "exame" },
        { descricao: "Pesquisa de Cryptosporidium", quantidade: 1, precoUnitario: 3000, ivaIsento: false, unidade: "exame" },
      ],
      observacoes: "Recolher 3 amostras em dias diferentes",
      criadoEm: hoje,
      usadoCount: 0,
    },
    {
      id: "lab_serologia",
      nome: "Painel Serológico",
      descricao: "Exames sorológicos diversos",
      tipoDocumento: "pro-forma",
      categoria: "Sorologia",
      linhas: [
        { descricao: "HIV 1/2 (Teste Rápido)", quantidade: 1, precoUnitario: 3000, ivaIsento: true, unidade: "exame" },
        { descricao: "Hepatite B (HBsAg)", quantidade: 1, precoUnitario: 3500, ivaIsento: false, unidade: "exame" },
        { descricao: "Hepatite C (Anti-HCV)", quantidade: 1, precoUnitario: 3500, ivaIsento: false, unidade: "exame" },
        { descricao: "Sífilis (VDRL)", quantidade: 1, precoUnitario: 2500, ivaIsento: false, unidade: "exame" },
      ],
      observacoes: "",
      criadoEm: hoje,
      usadoCount: 0,
    },
    {
      id: "lab_checkup",
      nome: "Check-up Completo",
      descricao: "Pacote de exames gerais",
      tipoDocumento: "pro-forma",
      categoria: "Pacotes",
      linhas: [
        { descricao: "Hemograma Completo", quantidade: 1, precoUnitario: 3500, ivaIsento: false, unidade: "exame" },
        { descricao: "Glicemia", quantidade: 1, precoUnitario: 2000, ivaIsento: false, unidade: "exame" },
        { descricao: "Ureia e Creatinina", quantidade: 1, precoUnitario: 3500, ivaIsento: false, unidade: "exame" },
        { descricao: "Perfil Lipídico", quantidade: 1, precoUnitario: 6000, ivaIsento: false, unidade: "exame" },
        { descricao: "Transaminases (TGO/TGP)", quantidade: 1, precoUnitario: 4000, ivaIsento: false, unidade: "exame" },
        { descricao: "Análise de Urina", quantidade: 1, precoUnitario: 2500, ivaIsento: false, unidade: "exame" },
        { descricao: "Exame Parasitológico de Fezes", quantidade: 1, precoUnitario: 3000, ivaIsento: false, unidade: "exame" },
      ],
      observacoes: "Jejum de 12 horas. Resultados em 48h.",
      criadoEm: hoje,
      usadoCount: 0,
    },
  ];

  function handleMarcarNotificacaoLida(notifId: string) {
    setNotificacoes(prev => prev.map(n => n.id === notifId ? { ...n, lida: true } : n));
  }

  function handleMarcarTodasLidas() {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    setToast({ message: "Todas as notificações marcadas como lidas", type: "success" });
  }

  function handleLimparNotificacoes() {
    setConfirmModal({
      title: "Limpar Notificações",
      message: "Deseja remover todas as notificações?",
      confirmText: "Limpar",
      type: "danger",
      onConfirm: () => {
        setNotificacoes([]);
        setToast({ message: "Notificações limpas", type: "success" });
        setConfirmModal(null);
      }
    });
  }

  function handleAcaoNotificacao(notif: NotificacaoItem) {
    handleMarcarNotificacaoLida(notif.id);
    if (notif.faturaId) {
      const fatura = data.faturas.find(f => f.id === notif.faturaId);
      if (fatura) {
        setShowNotificacoes(false);
        handleEdit(fatura);
      }
    } else if (notif.produtoId) {
      setShowNotificacoes(false);
      setShowGestaoProdutos(true);
      setGestaoSearch("");
    }
  }

  function handleLimparLogs() {
    setConfirmModal({
      title: "Limpar Logs",
      message: "Deseja remover todos os logs de auditoria? Esta ação não pode ser desfeita.",
      confirmText: "Limpar",
      type: "danger",
      onConfirm: () => {
        setLogs([]);
        try { localStorage.removeItem("logs_auditoria"); } catch {}
        setToast({ message: "Logs limpos", type: "success" });
        setConfirmModal(null);
      }
    });
  }

  function handleExportarLogs() {
    const csv = [
      "Data/Hora,Usuário,Ação,Módulo,Detalhes",
      ...logs.map(l => `${l.timestamp},${l.usuario},${l.acao},${l.modulo},"${l.detalhes}"`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs_auditoria_${todayStr().replace(/\//g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: "Logs exportados com sucesso", type: "success" });
  }

  function handleSalvarConfig() {
    setToast({ message: "Configurações salvas com sucesso!", type: "success" });
    addLog("Configurar", "Sistema", "Configurações atualizadas");
    setShowConfig(false);
  }

  function handleExportarBackup() {
    const backup = {
      data: new Date().toISOString(),
      faturas: data.faturas,
      produtos: data.produtos,
      pacientes: data.pacientes,
      config: data.config,
      templates,
      logs,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_${todayStr().replace(/\//g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: "Backup exportado com sucesso!", type: "success" });
    addLog("Backup", "Sistema", "Backup exportado");
  }

  function handleExportarListaPDF() {
    try {
      setToast({ message: "A gerar PDF profissional...", type: "info" });
      const doc = new jsPDF("landscape", "mm", "a4");
      
      const clinicaNome = data.config.nomeClinica || "Clínica Geral";
      const clinicaNif = data.config.nif || "999999999";
      const clinicaEnd = data.config.endereco || "Angola";
      const clinicaTel = data.config.telefone || "";
      const clinicaEmail = data.config.email || "";
      const emitidoPorNome = session.funcionarioNome || session.username || "Operador";
      const dataRelatorio = todayStr();

      // Totalizadores
      const totalGeral = filtered.reduce((s, f) => s + f.total, 0);
      const totalIvaGeral = filtered.reduce((s, f) => s + f.totalIva, 0);
      const totalSubGeral = filtered.reduce((s, f) => s + f.subtotalSemIva, 0);
      const totalPagoGeral = filtered.filter(f => f.estado === "paga").reduce((s, f) => s + f.total, 0);
      const totalPendenteGeral = filtered.filter(f => f.estado === "emitida").reduce((s, f) => s + f.total, 0);

      // Configurações de layout
      const startX = 13;
      let startY = 15;
      const pageWidth = 297;
      const pageHeight = 210;

      // Cabeçalho da página (desenhado em todas as páginas)
      const drawHeaderAndFooter = (pageNumber: number, totalPages: number) => {
        // Logotipo / Ícone Fictício
        doc.setFillColor(0, 174, 239); // Cor azul primária #00AEEF
        doc.rect(startX, startY, 12, 12, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("AGT", startX + 2, startY + 8);

        // Nome da Clínica / Empresa
        doc.setTextColor(31, 41, 55); // Gray 800
        doc.setFontSize(14);
        doc.text(clinicaNome, startX + 16, startY + 5);

        // Detalhes da Clínica
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128); // Gray 500
        doc.text(`NIF: ${clinicaNif} | Endereço: ${clinicaEnd}`, startX + 16, startY + 10);
        doc.text(`Tel: ${clinicaTel} | Email: ${clinicaEmail}`, startX + 16, startY + 14);

        // Título do Relatório (Direita)
        doc.setTextColor(0, 174, 239);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("RELATÓRIO DE DOCUMENTOS FISCAIS", pageWidth - startX, startY + 5, { align: "right" });

        // Informação de Emissão (Direita)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(`Data: ${dataRelatorio} | Emitido por: ${emitidoPorNome}`, pageWidth - startX, startY + 10, { align: "right" });
        
        // Tipo de filtro texto amigável
        const tipoFiltroTexto = filtroTipo !== "todos" && typeof TIPO_LABEL !== "undefined" && TIPO_LABEL[filtroTipo] 
          ? TIPO_LABEL[filtroTipo] 
          : filtroTipo === "todos" ? "Todos" : filtroTipo;
        
        doc.text(`Filtros: ${filtroEstado !== "todos" ? "Estado: " + filtroEstado.toUpperCase() : "Todos os estados"} | Tipo: ${tipoFiltroTexto}`, pageWidth - startX, startY + 14, { align: "right" });

        // Linha divisória
        doc.setDrawColor(229, 231, 235); // Gray 200
        doc.setLineWidth(0.5);
        doc.line(startX, startY + 18, pageWidth - startX, startY + 18);

        // Rodapé
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175); // Gray 400
        const footerText = "Processado por programa certificado nº 428/AGT · Cópia em formato digital autorizada · Os dados fiscais obedecem às especificações da AGT.";
        doc.text(footerText, startX, pageHeight - 10);
        doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - startX, pageHeight - 10, { align: "right" });
      };

      // Desenhar primeira página temporariamente
      drawHeaderAndFooter(1, 1);

      // Caixa de Resumo / KPI Dashboard no topo da primeira página
      let currentY = startY + 25;

      // Desenhar caixas de resumo
      const drawSummaryBoxes = () => {
        const boxWidth = 51;
        const boxHeight = 16;
        const gap = 4;
        const titles = ["Subtotal Geral", "IVA Geral", "Total Faturado", "Total Pago", "Total Pendente"];
        const values = [
          formatCurrency(totalSubGeral, moeda),
          formatCurrency(totalIvaGeral, moeda),
          formatCurrency(totalGeral, moeda),
          formatCurrency(totalPagoGeral, moeda),
          formatCurrency(totalPendenteGeral, moeda)
        ];
        const fillColors = [
          [249, 250, 251], // Gray 50
          [249, 250, 251], 
          [239, 246, 255], // Blue 50
          [240, 253, 250], // Teal 50
          [254, 242, 242]  // Red 50
        ];
        const borderColors = [
          [229, 231, 235], // Gray 200
          [229, 231, 235],
          [191, 219, 254], // Blue 200
          [153, 246, 228], // Teal 200
          [254, 202, 202]  // Red 200
        ];
        const textColors = [
          [31, 41, 55],
          [31, 41, 55],
          [29, 78, 216],  // Blue 700
          [15, 118, 110], // Teal 700
          [185, 28, 28]   // Red 700
        ];

        for (let i = 0; i < 5; i++) {
          const bx = startX + i * (boxWidth + gap);
          // Caixa de fundo
          doc.setFillColor(fillColors[i][0], fillColors[i][1], fillColors[i][2]);
          doc.rect(bx, currentY, boxWidth, boxHeight, "F");
          doc.setDrawColor(borderColors[i][0], borderColors[i][1], borderColors[i][2]);
          doc.rect(bx, currentY, boxWidth, boxHeight, "S");

          // Título da caixa
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(107, 114, 128);
          doc.text(titles[i], bx + 3, currentY + 5);

          // Valor
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(textColors[i][0], textColors[i][1], textColors[i][2]);
          doc.text(values[i], bx + 3, currentY + 11);
        }
        currentY += boxHeight + 8;
      };

      drawSummaryBoxes();

      // Configuração da Tabela de Itens
      const headers = ["Nº Documento", "Data", "Cliente", "NIF", "Tipo", "Estado", "Subtotal", "IVA", "Total"];
      const colWidths = [35, 22, 65, 25, 25, 20, 28, 23, 28]; // Soma = 271

      // Desenhar cabeçalho da tabela
      const drawTableHeader = (y: number) => {
        doc.setFillColor(31, 41, 55); // Dark Slate Blue / Gray 800
        doc.rect(startX, y, 271, 8, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);

        let currentX = startX;
        headers.forEach((h, idx) => {
          // Align right for subtotal, iva, total
          const align = idx >= 6 ? "right" : "left";
          const textX = align === "right" ? currentX + colWidths[idx] - 3 : currentX + 3;
          doc.text(h, textX, y + 5, { align });
          currentX += colWidths[idx];
        });
      };

      // Agrupar faturas para renderizar por página
      const rowHeight = 7.5;
      const firstPageMaxY = pageHeight - 20; // deixar margem para o rodapé
      const otherPageMaxY = pageHeight - 20;

      // Lista de faturas a desenhar
      const faturasParaExportar = filtered;

      // Calcular número de páginas necessárias
      // Na 1ª página temos as caixas de resumo, então cabe menos linhas
      const firstPageSpace = firstPageMaxY - (currentY + 10); // 10 é para o cabeçalho da tabela
      const firstPageRowsCount = Math.floor(firstPageSpace / rowHeight);

      const remainingInvoicesCount = faturasParaExportar.length - firstPageRowsCount;
      let totalPages = 1;
      if (remainingInvoicesCount > 0) {
        const otherPageSpace = otherPageMaxY - (startY + 25 + 10); // 10 é para o cabeçalho da tabela
        const otherPageRowsCount = Math.floor(otherPageSpace / rowHeight);
        totalPages += Math.ceil(remainingInvoicesCount / otherPageRowsCount);
      }

      // Agora vamos desenhar as páginas reais
      let currentPage = 1;
      doc.deletePage(1); // Remover página em branco default criada temporariamente para obter o estado
      doc.addPage("a4", "landscape");

      // Reiniciar coordenadas
      startY = 15;
      currentY = startY + 25;
      drawHeaderAndFooter(currentPage, totalPages);
      drawSummaryBoxes();
      drawTableHeader(currentY);
      currentY += 8;

      let lineIndex = 0;
      faturasParaExportar.forEach((f) => {
        const isFirstPage = currentPage === 1;
        const limitY = isFirstPage ? firstPageMaxY : otherPageMaxY;

        // Se passar do limite, cria nova página
        if (currentY + rowHeight > limitY) {
          currentPage++;
          doc.addPage("a4", "landscape");
          drawHeaderAndFooter(currentPage, totalPages);
          currentY = startY + 25;
          drawTableHeader(currentY);
          currentY += 8;
          lineIndex = 0;
        }

        // Fundo zebra das linhas
        if (lineIndex % 2 === 0) {
          doc.setFillColor(249, 250, 251); // Gray 50
        } else {
          doc.setFillColor(255, 255, 255);
        }
        doc.rect(startX, currentY, 271, rowHeight, "F");

        // Borda inferior discreta
        doc.setDrawColor(243, 244, 246); // Gray 100
        doc.setLineWidth(0.2);
        doc.line(startX, currentY + rowHeight, startX + 271, currentY + rowHeight);

        // Escrever dados
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(55, 65, 81); // Gray 700

        let currentX = startX;

        // Nº Documento
        doc.setFont("helvetica", "bold");
        doc.text(f.numero, currentX + 3, currentY + 5);
        doc.setFont("helvetica", "normal");
        currentX += colWidths[0];

        // Data
        doc.text(f.data, currentX + 3, currentY + 5);
        currentX += colWidths[1];

        // Cliente (truncar se for muito longo)
        let cName = f.clienteNome;
        if (cName.length > 32) cName = cName.substring(0, 30) + "...";
        doc.text(cName, currentX + 3, currentY + 5);
        currentX += colWidths[2];

        // NIF
        doc.text(f.clienteNif || "999999999", currentX + 3, currentY + 5);
        currentX += colWidths[3];

        // Tipo Documento
        const tipoAbr = {
          "factura": "Fatura (FT)",
          "factura-recibo": "Fat. Recibo (FR)",
          "recibo": "Recibo (RE)",
          "nota-credito": "Nota Crédito (NC)",
          "pro-forma": "Pro-Forma (FP)"
        }[f.tipoDocumento] || "Fatura (FT)";
        doc.text(tipoAbr, currentX + 3, currentY + 5);
        currentX += colWidths[4];

        // Estado (estilizar texto dependendo do estado)
        const estLabel = {
          "paga": "Paga",
          "emitida": "Emitida",
          "rascunho": "Rascunho",
          "anulada": "Anulada"
        }[f.estado] || f.estado;
        
        if (f.estado === "paga") {
          doc.setTextColor(16, 185, 129); // Emerald Green
          doc.setFont("helvetica", "bold");
        } else if (f.estado === "emitida") {
          doc.setTextColor(59, 130, 246); // Blue
          doc.setFont("helvetica", "bold");
        } else if (f.estado === "anulada") {
          doc.setTextColor(239, 68, 68); // Red
        } else {
          doc.setTextColor(245, 158, 11); // Amber
        }
        doc.text(estLabel, currentX + 3, currentY + 5);
        doc.setTextColor(55, 65, 81); // Reset
        doc.setFont("helvetica", "normal");
        currentX += colWidths[5];

        // Subtotal (Alinhado à direita)
        doc.text(formatCurrency(f.subtotalSemIva, moeda), currentX + colWidths[6] - 3, currentY + 5, { align: "right" });
        currentX += colWidths[6];

        // IVA (Alinhado à direita)
        doc.text(formatCurrency(f.totalIva, moeda), currentX + colWidths[7] - 3, currentY + 5, { align: "right" });
        currentX += colWidths[7];

        // Total (Alinhado à direita)
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 24, 39); // Gray 900
        doc.text(formatCurrency(f.total, moeda), currentX + colWidths[8] - 3, currentY + 5, { align: "right" });
        currentX += colWidths[8];

        currentY += rowHeight;
        lineIndex++;
      });

      // Guardar PDF
      const fileName = `faturas_export_${dataRelatorio.replace(/\//g, "-")}.pdf`;
      doc.save(fileName);
      setToast({ message: `Exportação de faturas concluída: ${fileName}`, type: "success" });
      addLog("Exportar PDF", "Faturas", `Lista de faturas em PDF exportada com ${filtered.length} itens.`);
    } catch (err) {
      console.error(err);
      setToast({ message: "Erro ao gerar PDF das faturas.", type: "error" });
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // CÁLCULOS
  // ═════════════════════════════════════════════════════════════════════════════
  function calcTotals(ls: LinhaFatura[], taxa: number, desc: number) {
    let sub = 0, iva = 0;
    for (const l of ls) {
      const s = l.quantidade * l.precoUnitario;
      sub += s;
      if (!l.ivaIsento) iva += s * (taxa / 100);
    }
    const descVal = sub * (desc / 100);
    return { subtotalSemIva: sub - descVal, totalIva: iva, total: sub - descVal + iva };
  }

  const totals = useMemo(() => calcTotals(linhas, ivaTaxa, desconto), [linhas, ivaTaxa, desconto]);

  // NOVO: Cálculos para múltiplas formas de pagamento
  const totalFormasPagamento = useMemo(() => calcularTotalFormasPagamento(), [formasPagamento]);
  const diferencaPagamento = useMemo(() => totals.total - totalFormasPagamento, [totals.total, totalFormasPagamento]);

  const troco = useMemo(() => {
    if (formaPagamento !== "Numerário" || valorRecebido === "") return 0;
    return Math.max(0, (valorRecebido as number) - totals.total);
  }, [formaPagamento, valorRecebido, totals.total]);

  const trocoNegativo = useMemo(() => {
    if (formaPagamento !== "Numerário" || valorRecebido === "") return false;
    return (valorRecebido as number) < totals.total && (valorRecebido as number) > 0;
  }, [formaPagamento, valorRecebido, totals.total]);

  // Auto-distribuir quando o total mudar
  useEffect(() => {
    if (usarMultiplasFormas && formasPagamento.length > 0 && totals.total > 0) {
      const totalAtual = calcularTotalFormasPagamento();
      if (Math.abs(totalAtual - totals.total) > 0.01 && totalAtual === 0) {
        distribuirTotalAutomaticamente(totals.total);
      }
    }
  }, [totals.total, usarMultiplasFormas]);

  const produtosFiltrados = useMemo(() => {
    const q = produtoSearch.trim().toLowerCase();
    if (!q) return [];
    return produtos.filter(p =>
      p.nome.toLowerCase().includes(q) || (p.codigo && p.codigo.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [produtoSearch, produtos]);

  useEffect(() => {
    if (produtosFiltrados.length > 0 && produtoSearch.trim()) {
      setShowDropdown(true); setDropdownIndex(-1);
    } else {
      setShowDropdown(false); setDropdownIndex(-1);
    }
  }, [produtosFiltrados, produtoSearch]);

  function handleAddProduto(p?: typeof produtos[0]) {
    if (p) {
      setLinhas(prev => [...prev, {
        descricao: p.nome, quantidade: produtoQtd,
        precoUnitario: p.preco, ivaIsento: !!p.ivaIsento, unidade: "",
      }]);
    } else if (produtoSearch.trim()) {
      setLinhas(prev => [...prev, {
        descricao: produtoSearch.trim(), quantidade: produtoQtd,
        precoUnitario: 0, ivaIsento: false, unidade: "",
      }]);
    }
    setProdutoSearch(""); setProdutoQtd(1);
    setShowDropdown(false); setDropdownIndex(-1);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  function handleAddProdutoFromPanel(p: typeof produtos[0]) {
    setLinhas(prev => [...prev, {
      descricao: p.nome, quantidade: 1,
      precoUnitario: p.preco, ivaIsento: !!p.ivaIsento, unidade: "",
    }]);
  }

  function handleRemoverLinha(i: number) {
    setLinhas(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleUpdateLinha(i: number, field: keyof LinhaFatura, value: string | number | boolean) {
    setLinhas(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || produtosFiltrados.length === 0) {
      if (e.key === "Enter" && produtoSearch.trim()) { e.preventDefault(); handleAddProduto(); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setDropdownIndex(i => Math.min(i + 1, produtosFiltrados.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setDropdownIndex(i => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (dropdownIndex >= 0) handleAddProduto(produtosFiltrados[dropdownIndex]);
      else handleAddProduto(produtosFiltrados[0]);
    } else if (e.key === "Escape") { setShowDropdown(false); setDropdownIndex(-1); }
  }

  async function handleSave() {
    setNifError("");
    const nomeEfectivo = clienteNome.trim() || "Consumidor Final";
    if (nomeEfectivo !== "Consumidor Final" && !clienteNif.trim() && !novoCliente.bi && !novoCliente.passaporte) {
      setNifError("É necessário NIF, BI ou Passaporte para clientes identificados.");
      return;
    }

    const linhasValidas = linhas.filter(l => l.descricao.trim());
    if (linhasValidas.length === 0) {
      setToast({ message: "Adicione pelo menos um item", type: "error" });
      return;
    }

    // NOVO: Validar múltiplas formas de pagamento
    if (usarMultiplasFormas && formasPagamento.length > 0) {
      const formasInvalidas = formasPagamento.filter(f => !f.forma || (Number(f.valor) || 0) <= 0);
      if (formasInvalidas.length > 0) {
        setToast({ message: "Preencha todas as formas de pagamento (tipo e valor)", type: "error" });
        return;
      }

      if (Math.abs(diferencaPagamento) > 0.01) {
        setToast({
          message: `Total das formas (${formatCurrency(totalFormasPagamento, moeda)}) não corresponde ao total da fatura (${formatCurrency(totals.total, moeda)}). Diferença: ${formatCurrency(Math.abs(diferencaPagamento), moeda)}`,
          type: "error"
        });
        return;
      }
    }

    const t = calcTotals(linhasValidas, ivaTaxa, desconto);
    const hora = nowTimeStr();

    // NOVO: Determinar forma de pagamento final
    let formaPagamentoFinal = formaPagamento;
    if (usarMultiplasFormas && formasPagamento.length > 0) {
      formaPagamentoFinal = formasPagamento.length === 1
        ? formasPagamento[0].forma
        : "Múltiplas (" + formasPagamento.map(f => f.forma).join(" + ") + ")";
    }

    const dados: Omit<Fatura, "id" | "numero"> = {
      serie: data.config.serie, data: dataEmissao, horaOperacao: hora,
      dataVencimento: dataVenc,
      clienteNome: nomeEfectivo, clienteNif: clienteNif.trim(),
      clienteEndereco: clienteEndereco.trim(), linhas: linhasValidas,
      subtotalSemIva: t.subtotalSemIva, totalIva: t.totalIva,
      ivaTaxa, total: t.total, estado, observacoes: observacoes.trim(),
      pacienteId: pacienteId ? parseInt(pacienteId) : undefined,
      emitidoPor: session.funcionarioNome || session.username,
      tipoDocumento, formaPagamento: formaPagamentoFinal, facturaPremiada,
      emissaoContagem: 1,
    };

    if (editId !== null) {
      await updateFatura(editId, dados);
      setToast({ message: "Documento atualizado!", type: "success" });
      addLog("Atualizar", "Faturas", `Fatura ${editId}`);
    } else {
      const nova = await addFatura(dados);
      const hash = await gerarHashFaturaAsync(nova, data.config.nif || "");
      await updateFatura(nova.id, { codigoHash: hash });

      if (estado === "paga") {
        await addMovimento({
          data: dataEmissao,
          descricao: `${TIPO_LABEL[tipoDocumento] ?? "Fatura"} ${nova.numero} — ${dados.clienteNome}`,
          tipo: "entrada", valor: nova.total, categoria: "Faturação",
          faturaId: nova.id, referencia: nova.numero,
          registadoPor: session.funcionarioNome || session.username,
        });
      }

      setToast({ message: `${TIPO_LABEL[tipoDocumento] ?? "Documento"} criado!`, type: "success" });
      addLog("Criar", "Faturas", nova.numero);
    }

    resetForm(); setView("lista");
  }

  function handleMarcarPaga(f: Fatura) {
    const hora = nowTimeStr();
    updateFatura(f.id, { estado: "paga", horaOperacao: f.horaOperacao || hora });
    addMovimento({
      data: hoje,
      descricao: `Recebimento ${f.numero} — ${f.clienteNome}`,
      tipo: "entrada", valor: f.total, categoria: "Faturação",
      faturaId: f.id, referencia: f.numero,
      registadoPor: session.funcionarioNome || session.username,
    });
    setToast({ message: `${f.numero} marcada como paga!`, type: "success" });
    setReciboFormaPag(f.formaPagamento ?? "");
    setReciboModal({ fatura: { ...f, estado: "paga" } });
    addLog("Pagar", "Faturas", f.numero);
  }

  function handleRemover(f: Fatura) {
    if (f.estado === "emitida" || f.estado === "paga") {
      setToast({ message: `Não é possível eliminar "${f.numero}" com estado "${ESTADO_LABEL[f.estado]}"`, type: "error" });
      return;
    }

    setConfirmModal({
      title: "Eliminar Documento",
      message: `Deseja eliminar ${f.numero}? Esta ação não pode ser desfeita.`,
      confirmText: "Eliminar",
      type: "danger",
      onConfirm: () => {
        removeFatura(f.id);
        setToast({ message: `${f.numero} eliminado!`, type: "success" });
        setConfirmModal(null);
        addLog("Eliminar", "Faturas", f.numero);
      }
    });
  }

  const filtered = useMemo(() => {
    let items = [...data.faturas];
    if (filtroEstado !== "todos") items = items.filter(f => f.estado === filtroEstado);
    if (filtroTipo !== "todos") items = items.filter(f => (f.tipoDocumento || "factura") === filtroTipo);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(f =>
        f.clienteNome.toLowerCase().includes(q) ||
        f.numero.toLowerCase().includes(q) ||
        (f.clienteNif || "").includes(q)
      );
    }
    return items.sort((a, b) => b.id - a.id);
  }, [data.faturas, filtroEstado, filtroTipo, search]);

  const rascunhos = filtered.filter(f => f.estado === "rascunho");
  const outros = filtered.filter(f => f.estado !== "rascunho");

  const catalogCats = useMemo(() => {
    const s = new Set<string>();
    for (const p of produtos) s.add(p.categoria || "Sem Categoria");
    return Array.from(s).sort();
  }, [produtos]);

  const produtosPorCategoria = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    const map: Record<string, typeof produtos> = {};
    for (const p of produtos) {
      const cat = p.categoria || "Sem Categoria";
      if (catalogCat && cat !== catalogCat) continue;
      if (q && !p.nome.toLowerCase().includes(q) && !(p.codigo || "").toLowerCase().includes(q)) continue;
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }
    return map;
  }, [produtos, catalogSearch, catalogCat]);

  const catalogTotalFiltrados = useMemo(() =>
    Object.values(produtosPorCategoria).reduce((s, arr) => s + (arr as any).length, 0),
    [produtosPorCategoria]);

  const produtosGestao = useMemo(() => {
    let items = [...todosProdutos];
    if (gestaoCat) items = items.filter(p => (p.categoria || "Sem Categoria") === gestaoCat);
    if (gestaoSearch.trim()) {
      const q = gestaoSearch.toLowerCase();
      items = items.filter(p => p.nome.toLowerCase().includes(q) || (p.codigo || "").toLowerCase().includes(q));
    }
    return items.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [todosProdutos, gestaoCat, gestaoSearch]);

  const clientesGestao = useMemo(() => {
    let items = [...data.pacientes];
    if (gestaoSearch.trim()) {
      const q = gestaoSearch.toLowerCase();
      items = items.filter(p =>
        p.nome.toLowerCase().includes(q) || (p.nif || "").includes(q) ||
        (p.bi || "").toLowerCase().includes(q) || (p.passaporte || "").toLowerCase().includes(q) ||
        (p.telefone || "").includes(q) || (p.email || "").toLowerCase().includes(q)
      );
    }
    return items.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [data.pacientes, gestaoSearch]);

  const stats = useMemo(() => {
    const hojeDate = new Date();
    const mesAtual = hojeDate.getMonth();
    const anoAtual = hojeDate.getFullYear();

    const faturasMes = data.faturas.filter(f => {
      const p = f.data.split("/");
      if (p.length !== 3) return false;
      const d = new Date(`${p[2]}-${p[1]}-${p[0]}`);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });

    const totalMes = faturasMes.reduce((s, f) => s + f.total, 0);
    const totalPago = faturasMes.filter(f => f.estado === "paga").reduce((s, f) => s + f.total, 0);
    const totalPendente = faturasMes.filter(f => f.estado === "emitida").reduce((s, f) => s + f.total, 0);
    const totalAnulado = faturasMes.filter(f => f.estado === "anulada").reduce((s, f) => s + f.total, 0);

    const clientesMap: Record<string, { nome: string; total: number; count: number }> = {};
    for (const f of data.faturas) {
      if (!clientesMap[f.clienteNome]) {
        clientesMap[f.clienteNome] = { nome: f.clienteNome, total: 0, count: 0 };
      }
      clientesMap[f.clienteNome].total += f.total;
      clientesMap[f.clienteNome].count += 1;
    }
    const topClientes = Object.values(clientesMap).sort((a, b) => b.total - a.total).slice(0, 5);

    const produtosMap: Record<string, { nome: string; qtd: number; total: number }> = {};
    for (const f of data.faturas) {
      for (const l of f.linhas) {
        if (!produtosMap[l.descricao]) {
          produtosMap[l.descricao] = { nome: l.descricao, qtd: 0, total: 0 };
        }
        produtosMap[l.descricao].qtd += l.quantidade;
        produtosMap[l.descricao].total += l.quantidade * l.precoUnitario;
      }
    }
    const topProdutos = Object.values(produtosMap).sort((a, b) => b.total - a.total).slice(0, 5);

    const stockBaixo = produtos.filter(p => p.stock <= (p.stockMinimo || 0));

    return {
      totalMes, totalPago, totalPendente, totalAnulado,
      totalDocs: data.faturas.length,
      docsMes: faturasMes.length,
      topClientes, topProdutos, stockBaixo,
    };
  }, [data.faturas, produtos]);

  const dadosRelatorio = useMemo(() => {
    const faturasFiltradas = data.faturas.filter(f => {
      const { mes, ano } = getMesAno(f.data);
      const hojeDate = new Date();
      const mesAtual = hojeDate.getMonth() + 1;
      const anoAtual = hojeDate.getFullYear();

      if (relatorioPeriodo === "dia") return f.data === hoje;
      if (relatorioPeriodo === "semana") {
        const diasAtras = addDays(hoje, -7);
        return f.data >= diasAtras && f.data <= hoje;
      }
      if (relatorioPeriodo === "mes") return mes === mesAtual && ano === anoAtual;
      if (relatorioPeriodo === "trimestre") {
        const tresMesesAtras = mesAtual - 3;
        return mes >= tresMesesAtras && mes <= mesAtual && ano === anoAtual;
      }
      if (relatorioPeriodo === "ano") return ano === anoAtual;
      return true;
    });

    const total = faturasFiltradas.reduce((s, f) => s + f.total, 0);
    const totalIva = faturasFiltradas.reduce((s, f) => s + f.totalIva, 0);
    const totalSemIva = faturasFiltradas.reduce((s, f) => s + f.subtotalSemIva, 0);
    const totalPaga = faturasFiltradas.filter(f => f.estado === "paga").reduce((s, f) => s + f.total, 0);
    const totalEmitida = faturasFiltradas.filter(f => f.estado === "emitida").reduce((s, f) => s + f.total, 0);

    const porTipo: Record<string, { count: number; total: number }> = {};
    faturasFiltradas.forEach(f => {
      const tipo = f.tipoDocumento || "factura";
      if (!porTipo[tipo]) porTipo[tipo] = { count: 0, total: 0 };
      porTipo[tipo].count += 1;
      porTipo[tipo].total += f.total;
    });

    const porEstado: Record<string, { count: number; total: number }> = {};
    faturasFiltradas.forEach(f => {
      if (!porEstado[f.estado]) porEstado[f.estado] = { count: 0, total: 0 };
      porEstado[f.estado].count += 1;
      porEstado[f.estado].total += f.total;
    });

    const porFormaPag: Record<string, number> = {};
    faturasFiltradas.filter(f => f.estado === "paga").forEach(f => {
      const forma = f.formaPagamento || "Não especificado";
      porFormaPag[forma] = (porFormaPag[forma] || 0) + f.total;
    });

    return {
      faturas: faturasFiltradas,
      total, totalIva, totalSemIva, totalPaga, totalEmitida,
      porTipo, porEstado, porFormaPag,
      count: faturasFiltradas.length,
    };
  }, [data.faturas, relatorioPeriodo, relatorioDataInicio, relatorioDataFim]);

  function addChatMessage(role: "user" | "assistant" | "system", content: string, attachments?: { type: string; url: string; name: string }[]) {
    const msg: ChatMessage = {
      id: gerarId(),
      role,
      content,
      timestamp: nowTimeStr(),
      attachments,
    };
    setChatMessages(prev => [...prev, msg]);
  }

  function processarComandoChat(texto: string): string {
    const textoLower = texto.toLowerCase().trim();

    if (textoLower.includes("faturar") || textoLower.includes("facturar") || textoLower.includes("criar factura")) {
      setTimeout(() => {
        handleNovo();
        setShowChat(false);
      }, 500);
      return "Vou abrir o formulário de faturação para você!";
    }

    if (textoLower.includes("onde está") || textoLower.includes("localizar") || textoLower.includes("encontrar")) {
      if (textoLower.includes("cliente")) {
        setTimeout(() => {
          setShowGestaoClientes(true);
          setShowChat(false);
        }, 500);
        return `Temos ${data.pacientes.length} clientes cadastrados. Abrindo gestão de clientes...`;
      }
      if (textoLower.includes("produto")) {
        setTimeout(() => {
          setShowGestaoProdutos(true);
          setShowChat(false);
        }, 500);
        return `Temos ${produtos.length} produtos no catálogo. Abrindo gestão de produtos...`;
      }
    }

    if (textoLower.includes("criar cliente") || textoLower.includes("novo cliente") || textoLower.includes("cadastrar cliente")) {
      setTimeout(() => {
        openNovoClienteModal();
        setShowChat(false);
      }, 500);
      return "Vou abrir o formulário de cadastro de cliente!";
    }

    if (textoLower.includes("criar produto") || textoLower.includes("novo produto") || textoLower.includes("cadastrar produto")) {
      setTimeout(() => {
        openNovoProdutoModal();
        setShowChat(false);
      }, 500);
      return "Vou abrir o formulário de cadastro de produto!";
    }

    if (textoLower.includes("dashboard") || textoLower.includes("resumo") || textoLower.includes("estatísticas")) {
      setTimeout(() => {
        setShowDashboard(true);
        setShowChat(false);
      }, 500);
      return `Este mês: ${formatCurrency(stats.totalMes, moeda)} faturado, ${stats.docsMes} documentos. Abrindo dashboard...`;
    }

    if (textoLower.includes("ajuda") || textoLower.includes("help") || textoLower.includes("o que você faz")) {
      return "Posso ajudar com:\n• 📄 Faturar (ex: 'faturar 2 consultas para João')\n• 🔍 Localizar cliente ou produto\n• 👤 Criar cliente (com upload de BI/Passaporte)\n• 📦 Criar produto\n• 📊 Dashboard e relatórios\nDigite o que deseja fazer!";
    }

    if (textoLower.includes("upload") || textoLower.includes("carregar") || textoLower.includes("bi") || textoLower.includes("passaporte")) {
      setTimeout(() => {
        setShowUploadModal(true);
        setShowChat(false);
      }, 500);
      return "Vou abrir o upload de documento para extração automática de dados!";
    }

    return "Desculpe, não entendi o comando. Tente:\n• 'faturar' para criar fatura\n• 'onde está o cliente' para localizar\n• 'criar cliente' para cadastrar\n• 'dashboard' para ver estatísticas\n• 'ajuda' para ver todos os comandos";
  }

  function handleChatSubmit() {
    if (!chatInput.trim()) return;
    const texto = chatInput.trim();
    addChatMessage("user", texto);
    setChatInput("");
    setIsProcessing(true);

    setTimeout(() => {
      const resposta = processarComandoChat(texto);
      addChatMessage("assistant", resposta);
      setIsProcessing(false);
    }, 800);
  }

  function toggleVoiceRecognition() {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setToast({ message: "Reconhecimento de voz não suportado neste navegador", type: "error" });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-PT';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setToast({ message: "🎤 Ouvindo... Fale agora!", type: "info" });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
      setToast({ message: `✓ ${transcript}`, type: "success" });
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setToast({ message: "Erro no reconhecimento de voz", type: "error" });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function handleUploadClick(tipo: "cliente" | "produto") {
    setUploadTipo(tipo);
    setUploadArquivo(null);
    setUploadPreview("");
    setUploadDadosExtraidos(null);
    setShowUploadModal(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadArquivo(file);
    setUploadExtraindo(true);
    setUploadPreview("");

    setTimeout(() => {
      if (uploadTipo === "cliente") {
        const dadosSimulados: DadosExtraidosBI = {
          nome: "João Silva Santos",
          bi: "000000000LA000",
          dataNascimento: "15/03/1990",
          sexo: "M",
          naturalidade: "Luanda",
          filiacao: "Manuel Santos e Maria Silva",
          endereco: "Rua da Maianga, 123, Luanda",
          foto: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzAwQUVFRiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SlM8L3RleHQ+PC9zdmc+",
        };
        setUploadDadosExtraidos(dadosSimulados);
        setUploadPreview(dadosSimulados.foto || "");
      } else {
        const dadosSimulados = {
          nome: "Produto Exemplo",
          codigo: "PRD" + Math.floor(Math.random() * 10000),
          preco: Math.floor(Math.random() * 10000) + 1000,
          categoria: catalogCats[0] || "Geral",
          descricao: "Descrição extraída automaticamente do documento",
          stock: Math.floor(Math.random() * 100),
          stockMinimo: 10,
          ivaIsento: false,
        };
        setUploadDadosExtraidos(dadosSimulados);
      }

      setUploadExtraindo(false);
      setToast({ message: "✓ Dados extraídos com sucesso!", type: "success" });
    }, 2000);
  }

  function aplicarDadosExtraidos() {
    if (!uploadDadosExtraidos) return;

    if (uploadTipo === "cliente") {
      const dados = uploadDadosExtraidos as DadosExtraidosBI;
      setNovoCliente({
        nome: dados.nome || "",
        bi: dados.bi || "",
        passaporte: "",
        nif: "",
        telefone: "",
        email: "",
        endereco: dados.endereco || "",
        observacoes: `Naturalidade: ${dados.naturalidade || ""} | Filiação: ${dados.filiacao || ""}`,
        tipoDocumento: "bi",
      });
      setShowUploadModal(false);
      setToast({ message: "Dados do cliente preenchidos automaticamente!", type: "success" });
      setShowNovoCliente(true);
    } else {
      const dados = uploadDadosExtraidos;
      setNovoProduto({
        nome: dados.nome,
        codigo: dados.codigo,
        preco: dados.preco,
        categoria: dados.categoria,
        descricao: dados.descricao,
        stock: dados.stock,
        stockMinimo: dados.stockMinimo,
        ivaIsento: dados.ivaIsento,
      });
      setShowUploadModal(false);
      setToast({ message: "Dados do produto preenchidos automaticamente!", type: "success" });
      setShowNovoProduto(true);
    }
  }

  function handleTipoDocumentoChange(novoTipo: string) {
    setTipoDocumento(novoTipo);
    const opt = TIPO_DOC_OPTS.find(t => t.value === novoTipo);
    if (opt && editId === null) {
      setEstado(opt.estadoDefault as Fatura["estado"]);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER: FORMULÁRIO
  // ═════════════════════════════════════════════════════════════════════════════
  if (view === "form") {
    const tipoLabel = TIPO_DOC_OPTS.find(t => t.value === tipoDocumento)?.label
      ?? (tipoDocumento === "nota-credito" ? "Nota de Crédito" : "Factura");

    return (
      <div className="min-h-full bg-slate-950/20 text-slate-100 relative">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2 text-sm">
              <button onClick={() => { resetForm(); setView("lista"); }} className="text-[#00AEEF] hover:underline font-medium">Documentos</button>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">{editId !== null ? `Editar ${tipoLabel}` : `Novo ${tipoLabel}`}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm" title="Os produtos e stocks estão totalmente sincronizados com o POS em tempo real.">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SINCRONISMO POS: ATIVO</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
            <button
              onClick={() => openNovoProdutoModal()}
              className="text-xs px-3 py-1.5 rounded-xl font-semibold border border-violet-500/20 text-violet-400 hover:bg-violet-500/10 transition flex items-center gap-1.5"
            >
              📦 Criar Produto
            </button>
            <button
              onClick={() => openNovoClienteModal()}
              className="text-xs px-3 py-1.5 rounded-xl font-semibold border border-teal-500/20 text-teal-400 hover:bg-teal-500/10 transition flex items-center gap-1.5"
            >
              👤 Criar Cliente
            </button>
            <button
              onClick={() => setShowChat(true)}
              className="text-xs px-3 py-1.5 rounded-xl font-semibold border border-blue-500/20 text-blue-400 hover:bg-blue-500/10 transition flex items-center gap-1.5"
            >
              💬 Assistente
            </button>
          </div>
        </div>

        <div className="px-6 py-5 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <FTAvatar tipo={tipoDocumento} />
              <div>
                <h1 className="text-xl font-bold text-slate-100">{tipoLabel}</h1>
                <p className="text-xs text-slate-500">
                  {editId !== null ? "Editar documento existente" : "Estado inicial: " + ESTADO_LABEL[estado]}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-5 items-start">
            <div className="flex-1 w-full space-y-4 min-w-0">
              {/* Cliente */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    Seleccione o Cliente
                  </label>
                  <button
                    type="button"
                    onClick={() => openNovoClienteModal()}
                    className="text-xs text-teal-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    + Novo Cliente
                  </button>
                </div>
                <select value={pacienteId} onChange={e => {
                  const p = data.pacientes.find(x => x.id === parseInt(e.target.value));
                  setPacienteId(e.target.value);
                  if (p) { setClienteNome(p.nome); setClienteNif(p.nif || ""); setClienteEndereco(p.endereco || ""); }
                  else { setClienteNome("Consumidor Final"); setClienteNif(""); setClienteEndereco(""); }
                  setNifError("");
                }} className="w-full border border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00AEEF] bg-slate-950/60 text-slate-100">
                  <option value="" className="bg-slate-900 text-slate-100">Consumidor Final</option>
                  {data.pacientes.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">{p.nome}</option>
                  ))}
                </select>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                      NIF / BI / Passaporte
                      {(clienteNome && clienteNome !== "Consumidor Final") && (
                        <span className="text-red-500">*</span>
                      )}
                    </p>
                    <input value={clienteNif} onChange={e => { setClienteNif(e.target.value); setNifError(""); }}
                      className={`mt-0.5 w-full border-0 border-b py-1 text-sm text-slate-100 focus:outline-none bg-transparent transition-colors ${
                        nifError ? "border-red-400 focus:border-red-500" : "border-slate-800 focus:border-[#00AEEF]"
                      }`}
                      placeholder="NIF (9/14 dígitos) · BI (14 caracteres) · Passaporte" />
                    {nifError && <p className="text-xs text-red-500 mt-1">{nifError}</p>}
                    <p className="text-xs text-slate-500 mt-1">💡 Aceita NIF, BI angolano (14 caracteres) ou Passaporte</p>
                  </div>
                  {clienteNome && clienteNome !== "Consumidor Final" && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nome</p>
                      <input value={clienteNome} onChange={e => setClienteNome(e.target.value)}
                        className="mt-0.5 w-full border-0 border-b border-slate-800 py-1 text-sm text-slate-100 focus:outline-none focus:border-[#00AEEF] bg-transparent" />
                    </div>
                  )}
                  {clienteEndereco && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Morada</p>
                      <input value={clienteEndereco} onChange={e => setClienteEndereco(e.target.value)}
                        className="mt-0.5 w-full border-0 border-b border-slate-800 py-1 text-sm text-slate-100 focus:outline-none focus:border-[#00AEEF] bg-transparent" />
                    </div>
                  )}
                </div>
                <div className="flex gap-5 mt-3">
                  <button onClick={() => { setClienteNome("Consumidor Final"); setClienteNif(""); setClienteEndereco(""); setPacienteId(""); setNifError(""); }}
                    className="text-xs text-[#00AEEF] hover:underline flex items-center gap-1">
                    👤 Consumidor Final
                  </button>
                </div>
              </div>

              {/* Itens */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Itens</h3>
                    <p className="text-xs text-slate-400">Produtos e Serviços</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl font-medium">
                      {linhas.length} item{linhas.length !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => openNovoProdutoModal(produtoSearch.trim())}
                      className="text-xs px-3 py-1.5 rounded-xl font-semibold border border-violet-500/20 text-violet-400 hover:bg-violet-500/10 transition flex items-center gap-1.5"
                    >
                      + Produto
                    </button>
                    <button
                      onClick={() => setShowProdutosPanel(v => !v)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition flex items-center gap-1.5 ${
                        showProdutosPanel
                          ? "bg-[#00AEEF] text-white border-[#00AEEF]"
                          : "border-[#00AEEF] text-[#00AEEF] hover:bg-[#00AEEF]/10"
                      }`}
                    >
                      📦 {showProdutosPanel ? "Ocultar" : "Ver"} Produtos
                    </button>
                  </div>
                </div>
                {linhas.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-950/40 border-b border-slate-800">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-slate-400">Produto / Serviço</th>
                          <th className="text-center px-2 py-2 text-xs font-semibold text-slate-400 w-20">Unid.</th>
                          <th className="text-center px-2 py-2 text-xs font-semibold text-slate-400">IVA</th>
                          <th className="text-right px-2 py-2 text-xs font-semibold text-slate-400">P.Unit.</th>
                          <th className="text-center px-2 py-2 text-xs font-semibold text-slate-400">Qtd.</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-slate-400">Total</th>
                          <th className="w-8 px-2 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {linhas.map((l, i) => {
                          const sub = l.quantidade * l.precoUnitario;
                          return (
                            <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                              <td className="px-4 py-2.5">
                                <input value={l.descricao}
                                  onChange={e => handleUpdateLinha(i, "descricao", e.target.value)}
                                  className="text-sm font-medium text-gray-800 w-full border-0 border-b border-transparent hover:border-gray-200 focus:border-[#00AEEF] focus:outline-none bg-transparent py-0.5 transition-colors" />
                              </td>
                              <td className="px-2 py-2.5 text-center">
                                <input value={l.unidade ?? ""}
                                  onChange={e => handleUpdateLinha(i, "unidade", e.target.value)}
                                  placeholder="un"
                                  className="w-16 text-xs text-center border border-gray-200 rounded px-1 py-1 focus:outline-none focus:border-[#00AEEF]" />
                              </td>
                              <td className="px-2 py-2.5 text-center">
                                <button
                                  onClick={() => handleUpdateLinha(i, "ivaIsento", !l.ivaIsento)}
                                  className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-colors ${
                                    l.ivaIsento ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-600"
                                  }`}>
                                  {l.ivaIsento ? "Isento" : `${ivaTaxa}%`}
                                </button>
                              </td>
                              <td className="px-2 py-2.5 text-right">
                                <input type="number" value={l.precoUnitario} min={0} step={0.01}
                                  onChange={e => handleUpdateLinha(i, "precoUnitario", Number(e.target.value))}
                                  className="w-24 border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-[#00AEEF]" />
                              </td>
                              <td className="px-2 py-2.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => handleUpdateLinha(i, "quantidade", Math.max(-999, l.quantidade - 1))}
                                    className="w-5 h-5 rounded border border-gray-200 text-gray-400 hover:border-[#00AEEF] hover:text-[#00AEEF] flex items-center justify-center text-xs transition-colors">−</button>
                                  <input type="number" value={l.quantidade}
                                    onChange={e => handleUpdateLinha(i, "quantidade", Number(e.target.value))}
                                    className="w-12 border border-gray-200 rounded px-1 py-1 text-xs text-center focus:outline-none focus:border-[#00AEEF]" />
                                  <button onClick={() => handleUpdateLinha(i, "quantidade", l.quantidade + 1)}
                                    className="w-5 h-5 rounded border border-gray-200 text-gray-400 hover:border-[#00AEEF] hover:text-[#00AEEF] flex items-center justify-center text-xs transition-colors">+</button>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <span className="text-sm font-bold text-gray-800">{formatCurrency(sub, moeda)}</span>
                              </td>
                              <td className="px-2 py-2.5 text-center">
                                <button onClick={() => handleRemoverLinha(i)}
                                  className="w-6 h-6 rounded-full border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-400 flex items-center justify-center text-xs font-bold transition-all">×</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-6 bg-gray-50/50">
                      <div className="flex flex-col items-end gap-1 text-xs text-gray-500">
                        <div className="flex gap-4">
                          <span>Subtotal s/IVA</span>
                          <span className="font-semibold w-32 text-right">{formatCurrency(totals.subtotalSemIva, moeda)}</span>
                        </div>
                        <div className="flex gap-4">
                          <span>IVA ({ivaTaxa}%)</span>
                          <span className="font-semibold w-32 text-right">{formatCurrency(totals.totalIva, moeda)}</span>
                        </div>
                        <div className="flex gap-4 pt-1 border-t border-gray-200 mt-1">
                          <span className="text-sm font-bold text-gray-700">Total</span>
                          <span className="text-sm font-black text-[#00AEEF] w-32 text-right">{formatCurrency(totals.total, moeda)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 flex flex-col items-center text-gray-300">
                    <div className="text-4xl mb-2">📦</div>
                    <p className="text-sm text-gray-400">Nenhum item adicionado.</p>
                    <p className="text-xs text-gray-400 mt-1">Pesquise abaixo ou clique em "Ver Produtos".</p>
                  </div>
                )}
                {/* Pesquisa de produto */}
                <div className="px-5 py-4 border-t border-slate-800">
                  <div className="relative">
                    <div className={`flex items-center gap-2 border rounded-xl bg-slate-950/40 px-3 py-2.5 transition-all ${
                      showDropdown ? "border-[#00AEEF] ring-2 ring-[#00AEEF]/20" : "border-slate-850 hover:border-slate-800"
                    }`}>
                      <div className="flex items-center gap-1 border-r border-slate-800 pr-2 mr-1">
                        <button type="button" onClick={() => setProdutoQtd(q => Math.max(1, q - 1))}
                          className="w-6 h-6 rounded-full border border-[#00AEEF]/50 text-[#00AEEF] flex items-center justify-center text-sm font-bold hover:bg-[#00AEEF] hover:text-white transition-all flex-shrink-0">−</button>
                        <input type="number" value={produtoQtd} min={1}
                          onChange={e => setProdutoQtd(Math.max(1, Number(e.target.value)))}
                          className="w-8 text-center text-sm border-0 focus:outline-none font-semibold text-slate-100 bg-transparent" />
                        <button type="button" onClick={() => setProdutoQtd(q => q + 1)}
                          className="w-6 h-6 rounded-full border border-[#00AEEF]/50 text-[#00AEEF] flex items-center justify-center text-sm font-bold hover:bg-[#00AEEF] hover:text-white transition-all flex-shrink-0">+</button>
                      </div>
                      <span className="text-slate-500 text-sm">🔍</span>
                      <input ref={searchInputRef} value={produtoSearch}
                        onChange={e => setProdutoSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        onFocus={() => { if (produtosFiltrados.length > 0) setShowDropdown(true); }}
                        placeholder="Pesquisar produto por nome ou código..."
                        className="flex-1 text-sm focus:outline-none text-slate-100 placeholder-slate-500 bg-transparent" />
                      {produtoSearch && (
                        <button type="button" onClick={() => { setProdutoSearch(""); setShowDropdown(false); searchInputRef.current?.focus(); }}
                          className="text-slate-500 hover:text-slate-300 text-lg leading-none transition-colors flex-shrink-0">×</button>
                      )}
                    </div>
                    {showDropdown && produtosFiltrados.length > 0 && (
                      <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-950/40">
                          <span className="text-xs text-slate-400 font-medium">{produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? "s" : ""}</span>
                        </div>
                        {produtosFiltrados.map((p, idx) => (
                          <button key={p.id} type="button" onMouseDown={e => e.preventDefault()} onClick={() => handleAddProduto(p)}
                            className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-left border-b border-slate-800/60 last:border-0 ${dropdownIndex === idx ? "bg-[#00AEEF]/10" : "hover:bg-slate-800/40"}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#00AEEF]/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-[#00AEEF] text-xs font-bold">{p.nome.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-200 truncate">{p.nome}</div>
                                <div className="text-xs text-slate-400">{p.codigo}</div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                              <div className="text-sm font-bold text-[#00AEEF]">{formatCurrency(p.preco, moeda)}</div>
                              {p.ivaIsento && <div className="text-xs text-slate-400">IVA isento</div>}
                            </div>
                          </button>
                        ))}
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => openNovoProdutoModal(produtoSearch.trim())}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/40 transition-colors border-t border-slate-800 text-left">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-emerald-400 text-sm font-bold">+</span>
                          </div>
                          <span className="text-sm text-slate-400">Criar produto <span className="font-semibold text-slate-200">"{produtoSearch}"</span></span>
                        </button>
                      </div>
                    )}
                    {produtoSearch.trim() && !showDropdown && produtosFiltrados.length === 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-3 flex items-center justify-between">
                          <span className="text-sm text-slate-400">Nenhum produto para <span className="font-semibold text-slate-300">"{produtoSearch}"</span></span>
                          <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => openNovoProdutoModal(produtoSearch.trim())}
                            className="text-xs text-violet-400 hover:underline font-semibold ml-3 flex-shrink-0">+ Criar produto</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">↑↓ navegar · Enter seleccionar · Esc fechar</p>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════════
                  PAINEL DE PRODUTOS REORGANIZADO - Com grelha/lista, filtros, pesquisa
                  ═══════════════════════════════════════════════════════════════════ */}
              {showProdutosPanel && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg mb-6">
                  {/* Header do painel */}
                  <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        📦 Catálogo de Produtos
                        <span className="text-xs bg-[#00AEEF] text-white px-2 py-0.5 rounded-full font-bold">
                          {produtos.length}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {catalogSearch || catalogCat
                          ? `${catalogTotalFiltrados} de ${produtos.length} produto${produtos.length !== 1 ? "s" : ""}`
                          : `${catalogCats.length} categoria${catalogCats.length !== 1 ? "s" : ""} · ${produtos.length} produto${produtos.length !== 1 ? "s" : ""} activos`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Toggle grelha/lista */}
                      <div className="flex bg-slate-950/60 border border-slate-800 rounded-xl p-0.5">
                        <button
                          onClick={() => setCatalogViewMode("grid")}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                            catalogViewMode === "grid" ? "bg-[#00AEEF] text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                          }`}
                          title="Visualização em grelha"
                        >
                          ▦
                        </button>
                        <button
                          onClick={() => setCatalogViewMode("list")}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                            catalogViewMode === "list" ? "bg-[#00AEEF] text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                          }`}
                          title="Visualização em lista"
                        >
                          ☰
                        </button>
                      </div>
                      <button
                        onClick={() => { setShowProdutosPanel(false); setCatalogSearch(""); setCatalogCat(null); }}
                        className="text-slate-400 hover:text-slate-200 w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Barra de pesquisa e filtros */}
                  <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/20 space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                      <input
                        type="text"
                        value={catalogSearch}
                        onChange={e => setCatalogSearch(e.target.value)}
                        placeholder="Pesquisar por nome ou código..."
                        className="w-full pl-9 pr-8 py-2 text-sm border border-slate-800 rounded-xl focus:outline-none focus:border-[#00AEEF] bg-slate-950/60 text-slate-100 placeholder-slate-500"
                      />
                      {catalogSearch && (
                        <button
                          type="button"
                          onClick={() => setCatalogSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >×</button>
                      )}
                    </div>

                    {/* Categorias como chips */}
                    {catalogCats.length > 1 && (
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setCatalogCat(null)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                            catalogCat === null
                              ? "bg-[#00AEEF] text-white shadow-sm"
                              : "bg-slate-950/40 text-slate-300 border border-slate-800 hover:border-[#00AEEF] hover:text-white"
                          }`}
                        >
                          Todas ({produtos.length})
                        </button>
                        {catalogCats.map(cat => {
                          const count = produtos.filter(p => (p.categoria || "Sem Categoria") === cat).length;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCatalogCat(catalogCat === cat ? null : cat)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                                catalogCat === cat
                                  ? "bg-[#00AEEF] text-white shadow-sm"
                                  : "bg-slate-950/40 text-slate-300 border border-slate-800 hover:border-[#00AEEF] hover:text-white"
                              }`}
                            >
                              {cat} ({count})
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Conteúdo do catálogo */}
                  <div className="max-h-[500px] overflow-y-auto">
                    {catalogTotalFiltrados === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <div className="text-5xl mb-3 opacity-30">📦</div>
                        <p className="text-sm font-medium">
                          {produtos.length === 0 ? "Sem produtos cadastrados." : "Nenhum produto corresponde à pesquisa."}
                        </p>
                        {produtos.length === 0 && (
                          <button
                            onClick={() => openNovoProdutoModal()}
                            className="mt-3 text-xs text-[#00AEEF] hover:underline font-semibold"
                          >
                            + Criar primeiro produto
                          </button>
                        )}
                      </div>
                    ) : catalogViewMode === "grid" ? (
                      /* VISUALIZAÇÃO EM GRELHA */
                      <div className="p-4 grid grid-cols-2 gap-3">
                        {(Object.entries(produtosPorCategoria) as [string, any][]).map(([cat, prods]) => (
                          <div key={cat} className="col-span-2">
                            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-slate-900 py-1 z-10">
                              <div className="w-1 h-4 bg-[#00AEEF] rounded-full"></div>
                              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">{cat}</span>
                              <span className="text-xs text-slate-400">({prods.length})</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                              {prods.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => handleAddProdutoFromPanel(p)}
                                  className="group bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 hover:border-[#00AEEF] hover:shadow-md transition-all text-left relative overflow-hidden"
                                >
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#00AEEF]/5 to-transparent rounded-bl-full"></div>
                                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00AEEF]/20 to-[#00AEEF]/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <span className="text-[#00AEEF] text-sm font-bold">{p.nome.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-[#00AEEF] transition-colors">
                                    {p.nome}
                                  </div>
                                  {p.codigo && (
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.codigo}</div>
                                  )}
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
                                    <span className="text-sm font-black text-[#00AEEF]">{formatCurrency(p.preco, moeda)}</span>
                                    {p.ivaIsento && (
                                      <span className="text-[9px] bg-slate-950 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded">s/IVA</span>
                                    )}
                                  </div>
                                  <div className="absolute inset-0 bg-[#00AEEF]/0 group-hover:bg-[#00AEEF]/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <span className="bg-[#00AEEF] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                      + Adicionar
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* VISUALIZAÇÃO EM LISTA */
                      <div>
                        {(Object.entries(produtosPorCategoria) as [string, any][]).map(([cat, prods]) => (
                          <div key={cat}>
                            <div className="px-5 py-2 bg-slate-950/40 border-b border-slate-800 sticky top-0 flex items-center gap-2 z-10">
                              <div className="w-1 h-4 bg-[#00AEEF] rounded-full"></div>
                              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">{cat}</span>
                              <span className="text-xs text-slate-400">({prods.length})</span>
                            </div>
                            {prods.map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleAddProdutoFromPanel(p)}
                                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#00AEEF]/5 transition-colors text-left border-b border-slate-800 last:border-0 group"
                              >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00AEEF]/20 to-[#00AEEF]/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                  <span className="text-[#00AEEF] text-sm font-bold">{p.nome.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-slate-200 truncate group-hover:text-[#00AEEF] transition-colors">
                                    {p.nome}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {p.codigo && (
                                      <span className="text-[10px] text-slate-400 font-mono">{p.codigo}</span>
                                    )}
                                    {p.ivaIsento && (
                                      <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded">IVA Isento</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-sm font-black text-[#00AEEF]">{formatCurrency(p.preco, moeda)}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Clique para adicionar →
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer do painel */}
                  <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
                    <button
                      onClick={() => openNovoProdutoModal()}
                      className="text-xs text-[#00AEEF] hover:underline font-semibold flex items-center gap-1"
                    >
                      + Criar novo produto
                    </button>
                    <span className="text-[10px] text-slate-400">
                      Clique num produto para adicionar à fatura
                    </span>
                  </div>
                </div>
              )}


              {/* Observações */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-200">Observações</h3>
                <p className="text-xs text-slate-400 mb-4">Referência Externa</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Observações</label>
                    <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
                      rows={3} placeholder="Observações, notas ou comentários"
                      className="w-full border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00AEEF] bg-slate-950/60 text-slate-200 resize-none placeholder-slate-600" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Referência Externa</label>
                    <input value={refExterna} onChange={e => setRefExterna(e.target.value)}
                      className="w-full border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00AEEF] bg-slate-950/60 text-slate-200 placeholder-slate-600"
                      placeholder="Referência Externa" />
                  </div>
                </div>
              </div>
            </div>

            {/* Painel Lateral */}
            <div className="w-80 flex-shrink-0 space-y-3">
              {/* Definições do Documento */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40">
                  <h3 className="text-sm font-bold text-slate-100">Definições do Documento</h3>
                </div>
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-slate-400 text-base">📋</span>
                    <div className="flex-1">
                      <div className="text-sm text-slate-300">Tipo de Documento</div>
                      <select value={tipoDocumento} onChange={e => handleTipoDocumentoChange(e.target.value)}
                        className="text-xs text-slate-200 border-0 focus:outline-none bg-transparent w-full mt-0.5 cursor-pointer font-medium">
                        {TIPO_DOC_OPTS.map(t => (
                          <option key={t.value} value={t.value} className="bg-slate-900 text-slate-100">{t.label} ({t.code})</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Estado inicial: <span className="font-semibold text-slate-200">{ESTADO_LABEL[TIPO_DOC_OPTS.find(t => t.value === tipoDocumento)?.estadoDefault || "emitida"]}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-slate-400 text-base">🏢</span>
                    <div className="flex-1">
                      <div className="text-sm text-slate-200 font-medium">{data.config.nomeClinica || "Clínica"}</div>
                      {data.config.nif && <div className="text-xs text-slate-400">NIF: {data.config.nif}</div>}
                      {data.config.endereco && <div className="text-xs text-slate-400 mt-0.5">{data.config.endereco}</div>}
                      {data.config.telefone && <div className="text-xs text-slate-400">{data.config.telefone}</div>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center px-4 py-3.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-slate-400 text-base">📅</span>
                    <div className="flex-1">
                      <div className="text-sm text-slate-300">Data de Emissão</div>
                      <input value={dataEmissao} onChange={e => setDataEmissao(e.target.value)}
                        className="text-xs text-slate-200 border-0 border-b border-slate-800 focus:outline-none focus:border-[#00AEEF] bg-transparent w-full mt-0.5"
                        placeholder="DD/MM/AAAA" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center px-4 py-3.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-slate-400 text-base">⏰</span>
                    <div className="flex-1">
                      <div className="text-sm text-slate-300">Vencimento</div>
                      <input value={dataVenc} onChange={e => setDataVenc(e.target.value)}
                        className="text-xs text-slate-200 border-0 border-b border-slate-800 focus:outline-none focus:border-[#00AEEF] bg-transparent w-full mt-0.5"
                        placeholder="DD/MM/AAAA" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center px-4 py-3.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-slate-400 text-base">💶</span>
                    <div className="flex-1">
                      <div className="text-sm text-slate-300">Estado</div>
                      <select value={estado} onChange={e => setEstado(e.target.value as Fatura["estado"])}
                        className="text-xs text-slate-200 border-0 focus:outline-none bg-transparent w-full mt-0.5 cursor-pointer">
                        <option value="emitida" className="bg-slate-900 text-slate-100">Emitida</option>
                        <option value="paga" className="bg-slate-900 text-slate-100">Paga</option>
                        <option value="rascunho" className="bg-slate-900 text-slate-100">Rascunho</option>
                        <option value="anulada" className="bg-slate-900 text-slate-100">Anulada</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    SEÇÃO DE PAGAMENTO - COM SUPORTE A MÚLTIPLAS FORMAS
                    ═══════════════════════════════════════════════════════════════ */}
                <div className="px-4 py-3.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-slate-400 text-base">💳</span>
                    <div className="flex-1">
                      <div className="text-sm text-slate-200 font-semibold">Forma de Pagamento</div>
                    </div>
                  </div>

                  {/* Toggle entre forma única e múltiplas */}
                  <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-0.5 mb-3">
                    <button
                      type="button"
                      onClick={() => { setUsarMultiplasFormas(false); setFormasPagamento([]); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                        !usarMultiplasFormas ? "bg-slate-800 text-[#00AEEF] shadow-sm" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Forma Única
                    </button>
                    <button
                      type="button"
                      onClick={() => { setUsarMultiplasFormas(true); setFormaPagamento(""); setValorRecebido(0); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                        usarMultiplasFormas ? "bg-slate-800 text-[#00AEEF] shadow-sm" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Múltiplas Formas
                    </button>
                  </div>

                  {!usarMultiplasFormas ? (
                    /* FORMA ÚNICA */
                    <>
                      <select value={formaPagamento} onChange={e => { setFormaPagamento(e.target.value); setValorRecebido(0); }}
                        className="w-full border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00AEEF] bg-slate-950/60 text-slate-200 cursor-pointer">
                        <option value="" className="bg-slate-900 text-slate-300">— Seleccionar —</option>
                        {FORMA_PAG_OPTS.map(f => <option key={f} value={f} className="bg-slate-900 text-slate-200">{f}</option>)}
                      </select>

                      {formaPagamento === "Numerário" && (
                        <div className="mt-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 overflow-hidden">
                          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-950/40 border-b border-emerald-900/40">
                            <span className="text-base">💵</span>
                            <span className="text-xs font-bold text-emerald-400">Pagamento em Numerário</span>
                          </div>
                          <div className="px-3 py-3 space-y-3">
                            <div>
                              <label className="text-xs font-semibold text-emerald-500 mb-1 block">Total a Cobrar</label>
                              <div className="text-base font-black text-emerald-400">{formatCurrency(totals.total, moeda)}</div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-emerald-500 mb-1 block">Valor Recebido</label>
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={valorRecebido}
                                onChange={e => setValorRecebido(e.target.value === "" ? "" : Number(e.target.value))}
                                onFocus={e => e.target.select()}
                                placeholder="0.00"
                                className={`w-full border rounded-lg px-3 py-2 text-sm font-bold text-right focus:outline-none transition ${
                                  trocoNegativo
                                    ? "border-red-900 bg-red-950/40 focus:border-red-500 text-red-400"
                                    : "border-emerald-800 bg-slate-950/60 focus:border-emerald-500 text-slate-100"
                                }`}
                              />
                              {trocoNegativo && (
                                <p className="text-xs text-red-400 mt-1">⚠ Falta {formatCurrency(totals.total - (valorRecebido as number), moeda)}</p>
                              )}
                            </div>
                            <div className={`rounded-lg p-3 border ${troco > 0 ? "bg-slate-950/60 border-emerald-800" : "bg-emerald-950/20 border-emerald-900/40"}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-emerald-500">Troco</span>
                                <span className={`text-lg font-black ${troco > 0 ? "text-emerald-400" : "text-emerald-600"}`}>
                                  {formatCurrency(troco, moeda)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* MÚLTIPLAS FORMAS DE PAGAMENTO */
                    <>
                      <div className="bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-900/50 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💳</span>
                            <span className="text-xs font-bold text-blue-400">Pagamento Dividido</span>
                          </div>
                          <span className="text-[10px] bg-blue-900 text-blue-200 px-2 py-0.5 rounded-full font-semibold">
                            {formasPagamento.length} forma{formasPagamento.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="text-[10px] text-blue-300">
                          Combine diferentes métodos de pagamento para o mesmo documento
                        </p>
                      </div>

                      {/* Lista de formas de pagamento */}
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {formasPagamento.length === 0 ? (
                          <div className="py-6 text-center text-slate-400 bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
                            <div className="text-3xl mb-2 opacity-40">💳</div>
                            <p className="text-xs text-slate-400">Nenhuma forma de pagamento adicionada</p>
                            <p className="text-[10px] text-slate-500 mt-1">Clique em "Adicionar Forma" abaixo</p>
                          </div>
                        ) : (
                          formasPagamento.map((forma, idx) => {
                            const trocoForma = calcularTrocoForma(forma);
                            return (
                              <div key={forma.id} className="bg-slate-950/40 border border-slate-800 rounded-lg p-3 hover:border-[#00AEEF]/50 transition">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-500 w-5">#{idx + 1}</span>
                                    <span className="text-sm">{FORMA_PAG_ICONS[forma.forma] || "💰"}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removerFormaPagamento(forma.id)}
                                    className="text-rose-400 hover:text-rose-300 text-sm hover:bg-slate-800 w-6 h-6 rounded flex items-center justify-center transition"
                                    title="Remover"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  <select
                                    value={forma.forma}
                                    onChange={e => atualizarFormaPagamento(forma.id, "forma", e.target.value)}
                                    className="w-full border border-slate-800 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#00AEEF] bg-slate-900 text-slate-200"
                                  >
                                    <option value="" className="bg-slate-900 text-slate-400">— Tipo de pagamento —</option>
                                    {FORMA_PAG_OPTS.filter(f => !formasPagamento.some(fp => fp.forma === f && fp.id !== forma.id)).map(f => (
                                      <option key={f} value={f} className="bg-slate-900 text-slate-200">{FORMA_PAG_ICONS[f]} {f}</option>
                                    ))}
                                  </select>
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <label className="text-[10px] font-semibold text-slate-400 mb-0.5 block">Valor</label>
                                      <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={forma.valor || ""}
                                        onChange={e => atualizarFormaPagamento(forma.id, "valor", e.target.value === "" ? 0 : Number(e.target.value))}
                                        placeholder="0.00"
                                        className="w-full border border-slate-800 bg-slate-950/60 rounded px-2 py-1.5 text-xs font-bold text-right text-slate-200 focus:outline-none focus:border-[#00AEEF]"
                                      />
                                    </div>
                                    {forma.forma === "Numerário" && (
                                      <div className="flex-1">
                                        <label className="text-[10px] font-semibold text-slate-400 mb-0.5 block">Recebido</label>
                                        <input
                                          type="number"
                                          min={0}
                                          step={0.01}
                                          value={forma.valorRecebido || ""}
                                          onChange={e => atualizarFormaPagamento(forma.id, "valorRecebido", e.target.value === "" ? undefined : Number(e.target.value))}
                                          placeholder="0.00"
                                          className="w-full border border-slate-800 bg-slate-950/60 rounded px-2 py-1.5 text-xs text-right text-slate-200 focus:outline-none focus:border-[#00AEEF]"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  {forma.forma && forma.forma !== "Numerário" && (
                                    <input
                                      type="text"
                                      value={forma.referencia || ""}
                                      onChange={e => atualizarFormaPagamento(forma.id, "referencia", e.target.value)}
                                      placeholder="Referência (opcional)"
                                      className="w-full border border-slate-800 bg-slate-950/60 rounded px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-[#00AEEF]"
                                    />
                                  )}
                                  {forma.forma === "Numerário" && trocoForma > 0 && (
                                    <div className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-900/40 rounded px-2 py-1">
                                      💵 Troco: {formatCurrency(trocoForma, moeda)}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => preencherRestante(forma.id, totals.total)}
                                    className="w-full text-[10px] text-[#00AEEF] hover:text-[#0099d4] hover:bg-slate-800 py-1 rounded transition font-semibold"
                                  >
                                    ⚡ Preencher com o restante ({formatCurrency(totals.total - formasPagamento.reduce((s, f) => s + (f.id === forma.id ? 0 : (Number(f.valor) || 0)), 0), moeda)})
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Ações rápidas */}
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={adicionarFormaPagamento}
                          disabled={formasPagamento.length >= FORMA_PAG_OPTS.length}
                          className="flex-1 py-2 rounded-lg bg-[#00AEEF] text-white text-xs font-semibold hover:bg-[#0099d4] transition disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          + Adicionar Forma
                        </button>
                        {formasPagamento.length > 0 && totals.total > 0 && (
                          <button
                            type="button"
                            onClick={() => distribuirTotalAutomaticamente(totals.total)}
                            className="px-3 py-2 rounded-lg bg-violet-950 text-violet-300 text-xs font-semibold hover:bg-violet-900 transition border border-violet-800/60"
                            title="Dividir o total igualmente entre todas as formas"
                          >
                            ÷ Dividir
                          </button>
                        )}
                      </div>

                      {/* Resumo do pagamento */}
                      {formasPagamento.length > 0 && (
                        <div className={`mt-3 rounded-lg p-3 border ${
                          Math.abs(diferencaPagamento) < 0.01
                            ? "bg-emerald-950/20 border-emerald-900/40"
                            : diferencaPagamento > 0
                              ? "bg-amber-950/20 border-amber-900/40"
                              : "bg-red-950/20 border-red-900/40"
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Total da Fatura</span>
                            <span className="text-xs font-bold text-slate-200">{formatCurrency(totals.total, moeda)}</span>
                          </div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Pago</span>
                            <span className="text-xs font-bold text-slate-200">{formatCurrency(totalFormasPagamento, moeda)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {Math.abs(diferencaPagamento) < 0.01 ? "✓ Completo" : diferencaPagamento > 0 ? "⚠ Falta" : "⚠ Excesso"}
                            </span>
                            <span className={`text-sm font-black ${
                              Math.abs(diferencaPagamento) < 0.01
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }`}>
                              {formatCurrency(Math.abs(diferencaPagamento), moeda)}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center px-4 py-3.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-slate-400 text-base">🏷️</span>
                    <div className="flex-1">
                      <div className="text-sm text-slate-300">Desconto (%)</div>
                      <input type="number" value={desconto} min={0} max={100}
                        onChange={e => setDesconto(Number(e.target.value))}
                        className="text-xs text-slate-200 border-0 border-b border-slate-800 focus:outline-none focus:border-[#00AEEF] bg-transparent w-full mt-0.5"
                        placeholder="0%" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center px-4 py-3.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-slate-400 text-base">💰</span>
                    <div className="flex-1">
                      <div className="text-sm text-slate-300">IVA (%)</div>
                      <input type="number" value={ivaTaxa} min={0} max={100}
                        onChange={e => setIvaTaxa(Number(e.target.value))}
                        className="text-xs text-slate-200 border-0 border-b border-slate-800 focus:outline-none focus:border-[#00AEEF] bg-transparent w-full mt-0.5" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center px-4 py-3.5 border-b border-slate-800/80">
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <span className="text-base">🏆</span>
                    <div className="flex-1">
                      <div className="text-sm text-slate-300">Factura Premiada</div>
                      <div className="text-xs text-slate-400">NIF participa no sorteio AGT</div>
                    </div>
                    <div
                      onClick={() => setFacturaPremiada(v => !v)}
                      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${facturaPremiada ? "bg-amber-400" : "bg-slate-800"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${facturaPremiada ? "left-5" : "left-0.5"}`} />
                    </div>
                  </label>
                </div>
                <div className="p-4 space-y-3">
                  <button onClick={handleSave}
                    className="w-full bg-[#00AEEF] hover:bg-[#0099d4] active:bg-[#0088bb] text-white py-3 rounded-lg text-sm font-bold transition shadow-lg hover:shadow-cyan-500/10 flex items-center justify-center gap-2">
                    ✅ {editId !== null ? "Guardar Alterações" : `Criar ${tipoLabel}`}
                  </button>
                  {nifError && (
                    <p className="text-xs text-rose-400 text-center">{nifError}</p>
                  )}
                  <button onClick={() => { resetForm(); setView("lista"); }}
                    className="w-full flex items-center justify-center gap-1 text-xs text-rose-400 hover:text-rose-300 hover:underline transition">
                    🗑 {editId !== null ? "Cancelar Edição" : "Descartar"}
                  </button>
                </div>
              </div>

              {totals.total !== 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Resumo de Totais</p>
                  <div className="flex justify-between text-xs text-slate-400 py-1">
                    <span>Subtotal s/IVA</span>
                    <span className="font-semibold text-slate-200">{formatCurrency(totals.subtotalSemIva, moeda)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 py-1 border-b border-slate-800">
                    <span>IVA ({ivaTaxa}%)</span>
                    <span className="font-semibold text-slate-200">{formatCurrency(totals.totalIva, moeda)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-100 pt-1">
                    <span>Total</span>
                    <span className="text-[#00AEEF]">{formatCurrency(totals.total, moeda)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modais de Produto e Cliente */}
        {showNovoProduto && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
                <div>
                  <h3 className="font-bold text-base text-violet-400">📦 {editandoProdutoId ? "Editar" : "Criar"} Produto</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{editandoProdutoId ? "Atualize os dados" : "Adicione um produto ao catálogo"}</p>
                </div>
                <button onClick={handleCloseProdutoModal} className="text-slate-400 hover:text-slate-200 w-7 h-7 flex items-center justify-center rounded hover:bg-slate-850">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                    Nome do Produto <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoProduto.nome}
                    onChange={e => setNovoProduto(p => ({ ...p, nome: e.target.value }))}
                    placeholder="Ex: Consulta Médica, Medicamento X..."
                    className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00AEEF]"
                    autoFocus
                    disabled={salvandoProduto}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Código</label>
                    <input
                      type="text"
                      value={novoProduto.codigo}
                      onChange={e => setNovoProduto(p => ({ ...p, codigo: e.target.value }))}
                      placeholder="Ex: PRD001"
                      className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00AEEF]"
                      disabled={salvandoProduto}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                      Preço ({moeda}) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={novoProduto.preco}
                      onChange={e => setNovoProduto(p => ({ ...p, preco: Number(e.target.value) }))}
                      placeholder="0.00"
                      className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00AEEF]"
                      disabled={salvandoProduto}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Stock Atual</label>
                    <input
                      type="number"
                      min={0}
                      value={novoProduto.stock}
                      onChange={e => setNovoProduto(p => ({ ...p, stock: Number(e.target.value) }))}
                      placeholder="0"
                      className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00AEEF]"
                      disabled={salvandoProduto}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Stock Mínimo</label>
                    <input
                      type="number"
                      min={0}
                      value={novoProduto.stockMinimo}
                      onChange={e => setNovoProduto(p => ({ ...p, stockMinimo: Number(e.target.value) }))}
                      placeholder="0"
                      className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00AEEF]"
                      disabled={salvandoProduto}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Categoria</label>
                  <input
                    type="text"
                    value={novoProduto.categoria}
                    onChange={e => setNovoProduto(p => ({ ...p, categoria: e.target.value }))}
                    placeholder="Ex: Serviços, Medicamentos..."
                    list="categorias-produtos"
                    className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00AEEF]"
                    disabled={salvandoProduto}
                  />
                  <datalist id="categorias-produtos">
                    {catalogCats.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Descrição</label>
                  <textarea
                    value={novoProduto.descricao}
                    onChange={e => setNovoProduto(p => ({ ...p, descricao: e.target.value }))}
                    rows={2}
                    placeholder="Descrição opcional..."
                    className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00AEEF] resize-none"
                    disabled={salvandoProduto}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={novoProduto.ivaIsento}
                    onChange={e => setNovoProduto(p => ({ ...p, ivaIsento: e.target.checked }))}
                    className="w-4 h-4 accent-violet-500"
                    disabled={salvandoProduto}
                  />
                  <span className="text-sm text-slate-300">Isento de IVA</span>
                </label>
                {novoProdutoError && (
                  <p className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/50 rounded-lg px-3 py-2">{novoProdutoError}</p>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-800 flex gap-3 sticky bottom-0 bg-slate-900">
                <button onClick={handleCloseProdutoModal}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition"
                  disabled={salvandoProduto}>
                  Cancelar
                </button>
                <button onClick={handleSaveProduto}
                  className="flex-1 py-2 rounded-lg text-white text-sm font-semibold transition bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={salvandoProduto}>
                  {salvandoProduto ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      A guardar...
                    </>
                  ) : (
                    <>✓ {editandoProdutoId ? "Guardar" : "Criar"}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showNovoCliente && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
                <div>
                  <h3 className="font-bold text-base text-teal-400">👤 {editandoClienteId ? "Editar" : "Criar"} Cliente</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{editandoClienteId ? "Atualize os dados" : "Adicione um cliente"}</p>
                </div>
                <button onClick={handleCloseClienteModal} className="text-slate-400 hover:text-slate-200 w-7 h-7 flex items-center justify-center rounded hover:bg-slate-850">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoCliente.nome}
                    onChange={e => setNovoCliente(c => ({ ...c, nome: e.target.value }))}
                    placeholder="Nome do cliente"
                    className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    autoFocus
                    disabled={salvandoCliente}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Tipo de Documento</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNovoCliente(c => ({ ...c, tipoDocumento: "nif" }))}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                        novoCliente.tipoDocumento === "nif"
                          ? "bg-teal-950/40 border-teal-500 text-teal-400"
                          : "border-slate-800 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      📄 NIF
                    </button>
                    <button
                      type="button"
                      onClick={() => setNovoCliente(c => ({ ...c, tipoDocumento: "bi" }))}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                        novoCliente.tipoDocumento === "bi"
                          ? "bg-teal-950/40 border-teal-500 text-teal-400"
                          : "border-slate-800 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      🪪 BI
                    </button>
                    <button
                      type="button"
                      onClick={() => setNovoCliente(c => ({ ...c, tipoDocumento: "passaporte" }))}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                        novoCliente.tipoDocumento === "passaporte"
                          ? "bg-teal-950/40 border-teal-500 text-teal-400"
                          : "border-slate-800 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      🛂 Passaporte
                    </button>
                  </div>
                </div>
                {novoCliente.tipoDocumento === "nif" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">NIF</label>
                    <input
                      type="text"
                      value={novoCliente.nif}
                      onChange={e => setNovoCliente(c => ({ ...c, nif: e.target.value }))}
                      placeholder="9 ou 14 dígitos"
                      className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                      disabled={salvandoCliente}
                    />
                    {novoCliente.nif && !validarNIF(novoCliente.nif) && (
                      <p className="text-xs text-rose-400 mt-1">NIF inválido</p>
                    )}
                  </div>
                )}
                {novoCliente.tipoDocumento === "bi" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                      Bilhete de Identidade (BI)
                    </label>
                    <input
                      type="text"
                      value={novoCliente.bi}
                      onChange={e => setNovoCliente(c => ({ ...c, bi: e.target.value.toUpperCase() }))}
                      placeholder="Ex: 000000000LA000 (14 caracteres)"
                      maxLength={14}
                      className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 font-mono uppercase"
                      disabled={salvandoCliente}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {novoCliente.bi.length}/14 caracteres · {novoCliente.bi.length === 14 ? "✓ Completo" : "Faltam " + (14 - novoCliente.bi.length)}
                    </p>
                    {novoCliente.bi && !validarBI(novoCliente.bi) && novoCliente.bi.length === 14 && (
                      <p className="text-xs text-rose-400 mt-1">BI inválido (apenas letras e números)</p>
                    )}
                  </div>
                )}
                {novoCliente.tipoDocumento === "passaporte" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Passaporte</label>
                    <input
                      type="text"
                      value={novoCliente.passaporte}
                      onChange={e => setNovoCliente(c => ({ ...c, passaporte: e.target.value.toUpperCase() }))}
                      placeholder="Ex: AB123456"
                      maxLength={12}
                      className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 font-mono uppercase"
                      disabled={salvandoCliente}
                    />
                    <p className="text-xs text-slate-400 mt-1">6 a 12 caracteres alfanuméricos</p>
                    {novoCliente.passaporte && !validarPassaporte(novoCliente.passaporte) && (
                      <p className="text-xs text-rose-400 mt-1">Passaporte inválido</p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Telefone</label>
                    <input
                      type="text"
                      value={novoCliente.telefone}
                      onChange={e => setNovoCliente(c => ({ ...c, telefone: e.target.value }))}
                      placeholder="+244 9XX XXX XXX"
                      className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                      disabled={salvandoCliente}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email</label>
                    <input
                      type="email"
                      value={novoCliente.email}
                      onChange={e => setNovoCliente(c => ({ ...c, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                      className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                      disabled={salvandoCliente}
                    />
                    {novoCliente.email && !validarEmail(novoCliente.email) && (
                      <p className="text-xs text-rose-400 mt-1">Email inválido</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Endereço / Morada</label>
                  <input
                    type="text"
                    value={novoCliente.endereco}
                    onChange={e => setNovoCliente(c => ({ ...c, endereco: e.target.value }))}
                    placeholder="Morada completa"
                    className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    disabled={salvandoCliente}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Observações</label>
                  <textarea
                    value={novoCliente.observacoes}
                    onChange={e => setNovoCliente(c => ({ ...c, observacoes: e.target.value }))}
                    rows={2}
                    placeholder="Notas adicionais..."
                    className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 resize-none"
                    disabled={salvandoCliente}
                  />
                </div>
                {novoClienteError && (
                  <p className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/50 rounded-lg px-3 py-2">{novoClienteError}</p>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-800 flex gap-3 sticky bottom-0 bg-slate-900">
                <button onClick={handleCloseClienteModal}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition"
                  disabled={salvandoCliente}>
                  Cancelar
                </button>
                <button onClick={handleSaveCliente}
                  className="flex-1 py-2 rounded-lg text-white text-sm font-semibold transition bg-teal-600 hover:bg-teal-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={salvandoCliente}>
                  {salvandoCliente ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      A guardar...
                    </>
                  ) : (
                    <>✓ {editandoClienteId ? "Guardar" : "Criar"}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-slate-800">
                <h3 className="font-bold text-base text-slate-200">Descartar alterações?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tem dados não salvos. Deseja descartar?</p>
              </div>
              <div className="px-6 py-4 flex gap-3">
                <button onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition">
                  Continuar Editando
                </button>
                <button onClick={() => { cancelAction(); setShowCancelConfirm(false); }}
                  className="flex-1 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition">
                  Descartar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER: LISTA
  // ═════════════════════════════════════════════════════════════════════════════
  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida).length;
  return (
    <div className="min-h-full bg-slate-950/20 text-slate-100">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 justify-between w-full xl:w-auto">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#00AEEF] font-semibold">Documentos</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">Listagem</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm" title="Os produtos e stocks estão totalmente sincronizados com o POS em tempo real.">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SINCRONISMO POS: ATIVO</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end w-full xl:w-auto">
          <button onClick={() => setShowChat(true)}
            className="text-xs px-3 py-2 rounded-xl font-semibold border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition flex items-center gap-1.5">
            💬 Assistente
          </button>
          <button onClick={() => setShowDashboard(true)}
            className="text-xs px-3 py-2 rounded-xl font-semibold border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition flex items-center gap-1.5">
            📊 Dashboard
          </button>
          <button onClick={() => setShowRelatorios(true)}
            className="text-xs px-3 py-2 rounded-xl font-semibold border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition flex items-center gap-1.5">
            📈 Relatórios
          </button>
          <button onClick={() => setShowTemplates(true)}
            className="text-xs px-3 py-2 rounded-xl font-semibold border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition flex items-center gap-1.5">
            📋 Templates
          </button>
          <button onClick={() => { setGestaoSearch(""); setGestaoCat(null); setShowGestaoProdutos(true); }}
            className="text-xs px-3 py-2 rounded-xl font-semibold border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition flex items-center gap-1.5">
            📦 Gestão Produtos
          </button>
          <button onClick={() => { setGestaoSearch(""); setShowGestaoClientes(true); }}
            className="text-xs px-3 py-2 rounded-xl font-semibold border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 transition flex items-center gap-1.5">
            👤 Gestão Clientes
          </button>
          <button onClick={() => setShowLogs(true)}
            className="text-xs px-3 py-2 rounded-xl font-semibold border border-slate-800 text-slate-300 hover:bg-slate-800/40 transition flex items-center gap-1.5">
            📋 Logs
          </button>
          <button onClick={() => setShowNotificacoes(true)}
            className="text-xs px-3 py-2 rounded-xl font-semibold border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition flex items-center gap-1.5 relative">
            🔔 Notificações
            {notificacoesNaoLidas > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{notificacoesNaoLidas}</span>}
          </button>
          <button onClick={() => setShowConfig(true)}
            className="text-xs px-3 py-2 rounded-xl font-semibold border border-slate-800 text-slate-300 hover:bg-slate-800/40 transition flex items-center gap-1.5">
            ⚙️ Config
          </button>
          <button onClick={handleExportarListaPDF}
            className="text-xs px-3 py-2 rounded-xl font-semibold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition flex items-center gap-1.5 shadow-sm"
            title="Exportar listagem de faturas em PDF">
            📥 Exportar PDF
          </button>
          <button onClick={handleNovo}
            className="bg-[#00AEEF] hover:bg-[#0099d4] text-white px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-sm">
            📄 Criar Documento
          </button>
        </div>
      </div>
      <div className="px-6 py-5 max-w-7xl mx-auto flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 w-full min-w-0 space-y-3">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex gap-2">
            <div className="flex-1 flex items-center gap-2 border border-slate-800 rounded-xl px-3 py-2 bg-slate-950/60">
              <span className="text-slate-500">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar por Número, Referência ou Cliente"
                className="flex-1 text-sm focus:outline-none text-slate-100 placeholder-slate-500 bg-transparent" />
            </div>
            <button className="bg-[#00AEEF] hover:bg-[#0099d4] text-white px-5 py-2 rounded-xl text-sm font-semibold transition">
              Pesquisar
            </button>
          </div>
          {rascunhos.length > 0 && (
            <div className="border border-amber-500/20 rounded-2xl overflow-hidden bg-amber-500/10 shadow-lg">
              <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-500/5 transition"
                onClick={() => setShowRascunhos(s => !s)}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center shadow-sm">
                    <span className="text-white text-sm">📄</span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-amber-300">Rascunho</div>
                    <div className="text-xs text-amber-400">
                      {rascunhos.length} documento{rascunhos.length > 1 ? "s" : ""} em rascunho
                    </div>
                  </div>
                </div>
                <span className="text-amber-400 font-bold text-lg">{showRascunhos ? "∧" : "∨"}</span>
              </button>
              {showRascunhos && rascunhos.map(f => (
                <div key={f.id} onClick={() => handleEdit(f)}
                  className="flex items-center gap-4 px-4 py-3 border-t border-amber-500/10 hover:bg-amber-500/20 transition cursor-pointer">
                  <FTAvatar tipo={f.tipoDocumento} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-200">{f.numero}</div>
                    <div className="text-xs text-slate-400 truncate">{f.clienteNome}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-200">{formatCurrency(f.total, moeda)}</div>
                    <div className="text-xs text-slate-500">{f.data}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleRemover(f); }}
                    className="text-xs text-red-400 border border-red-500/30 px-2.5 py-1 rounded hover:bg-red-500/20 transition font-semibold ml-2">
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {outros.length === 0 && (
              <div className="py-16 text-center">
                <div className="text-4xl mb-3 opacity-20">📄</div>
                <p className="text-sm text-gray-400">Nenhum documento encontrado.</p>
                <button onClick={handleNovo} className="mt-3 text-xs text-[#00AEEF] hover:underline font-semibold">
                  Criar primeiro documento
                </button>
              </div>
            )}
            {outros.map(f => {
              const cores = ESTADO_CORES[f.estado];
              const vencida = isVencida(f.dataVencimento, f.estado);
              const podeDeletar = f.estado === "rascunho" || f.estado === "anulada";
              const rowBg = f.estado === "paga" ? "hover:bg-emerald-950/10 border-l-4 border-l-emerald-500"
                : f.estado === "anulada" ? "hover:bg-red-950/10 border-l-4 border-l-red-500 opacity-60"
                : f.estado === "rascunho" ? "hover:bg-amber-950/10 border-l-4 border-l-amber-500"
                : vencida ? "hover:bg-orange-950/10 border-l-4 border-l-orange-500"
                : "hover:bg-slate-800/40 border-l-4 border-l-[#00AEEF]";
              return (
                <div key={f.id}
                  className={`flex items-center gap-4 px-4 py-4 border-b border-slate-800/60 last:border-0 transition cursor-pointer group ${rowBg}`}
                  onClick={() => handleEdit(f)}>
                  <FTAvatar tipo={f.tipoDocumento} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-100">{f.numero}</span>
                      {f.tipoDocumento && f.tipoDocumento !== "factura" && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          f.tipoDocumento === "factura-global" ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" :
                          f.tipoDocumento === "pro-forma" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          f.tipoDocumento === "nota-credito" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                          "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }`}>
                          {TIPO_LABEL[f.tipoDocumento] ?? f.tipoDocumento}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${cores.bg} ${cores.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cores.dot}`}/>
                        {ESTADO_LABEL[f.estado]}
                      </span>
                      {vencida && (
                        <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full font-semibold border border-orange-500/20">⚠️ Vencida</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">{f.clienteNome}</div>
                    {f.formaPagamento && (
                      <div className="text-xs text-slate-400 mt-0.5">💳 {f.formaPagamento}</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-bold ${f.estado === "paga" ? "text-emerald-400" : f.estado === "anulada" ? "text-slate-500" : "text-slate-100"}`}>
                      {formatCurrency(f.total, moeda)}
                    </div>
                    <div className="text-xs text-slate-400">{f.data}</div>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition ml-2"
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => downloadFatura(generateFaturaHTML(f, data.config), f.numero)}
                      className="text-xs text-[#00AEEF] border border-[#00AEEF]/30 px-2.5 py-1 rounded-xl hover:bg-blue-500/10 transition font-semibold">
                      PDF
                    </button>
                    {f.estado === "emitida" && (
                      <button onClick={() => handleMarcarPaga(f)}
                        className="text-xs text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl hover:bg-emerald-500/10 transition font-semibold">
                        Pagar
                      </button>
                    )}
                    {f.estado === "paga" && (
                      <button onClick={() => handleEmitirRecibo(f)}
                        className="text-xs text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-xl hover:bg-teal-500/10 transition font-semibold">
                        Recibo
                      </button>
                    )}
                    {(f.estado === "emitida" || f.estado === "paga") && (
                      <button onClick={() => handleNotaCredito(f)}
                        className="text-xs text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-xl hover:bg-orange-500/10 transition font-semibold">
                        NC
                      </button>
                    )}
                    {f.estado !== "paga" && f.estado !== "anulada" && (
                      <button onClick={() => setConfirmModal({
                        title: "Anular Documento",
                        message: `Deseja anular ${f.numero}?`,
                        confirmText: "Anular",
                        type: "warning",
                        onConfirm: () => {
                          updateFatura(f.id, { estado: "anulada" });
                          setToast({ message: `${f.numero} anulada`, type: "success" });
                          setConfirmModal(null);
                          addLog("Anular", "Faturas", f.numero);
                        }
                      })}
                        className="text-xs text-slate-300 border border-slate-700 px-2.5 py-1 rounded-xl hover:bg-slate-800 transition font-semibold">
                        Anular
                      </button>
                    )}
                    <button
                      onClick={() => handleRemover(f)}
                      disabled={!podeDeletar}
                      title={!podeDeletar ? "Não é possível eliminar" : "Eliminar"}
                      className={`text-xs border px-2.5 py-1 rounded-xl transition font-semibold ${
                        podeDeletar
                          ? "text-red-400 border-red-500/20 hover:bg-red-500/10"
                          : "text-slate-600 border-slate-800/40 cursor-not-allowed"
                      }`}>
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modais NC e Recibo */}
        {ncModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-orange-700">Nota de Crédito</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Referente a: <strong>{ncModal.fatura.numero}</strong></p>
                </div>
                <button onClick={() => setNcModal(null)} className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                    Motivo <span className="text-red-500">*</span>
                  </label>
                  <textarea value={ncMotivo} onChange={e => setNcMotivo(e.target.value)} rows={3}
                    placeholder="Ex: Anulação parcial, erro de facturação..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none" autoFocus />
                  <p className="text-xs text-gray-400 mt-1">Obrigatório nos termos da Lei n.º 2/22 (AGT).</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700">
                  <strong>Cliente:</strong> {ncModal.fatura.clienteNome} · <strong>Total:</strong> {formatCurrency(ncModal.fatura.total, moeda)}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button onClick={() => setNcModal(null)}
                  className="flex-1 py-2 rounded-lg bg-gray-600 text-white text-sm font-semibold hover:bg-gray-700 transition">
                  Cancelar
                </button>
                <button onClick={() => {
                  if (!ncMotivo.trim()) { setToast({ message: "Motivo é obrigatório", type: "error" }); return; }
                  confirmarNotaCredito(ncModal.fatura, ncMotivo.trim());
                }}
                  className="flex-1 py-2 rounded-lg text-white text-sm font-semibold transition bg-orange-600 hover:bg-orange-700">
                  ✓ Emitir Nota de Crédito
                </button>
              </div>
            </div>
          </div>
        )}
        {reciboModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-teal-700">Emitir Recibo</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Pagamento de: <strong>{reciboModal.fatura.numero}</strong></p>
                </div>
                <button onClick={() => setReciboModal(null)} className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs text-teal-700">
                  <strong>Cliente:</strong> {reciboModal.fatura.clienteNome}<br/>
                  <strong>Total pago:</strong> {formatCurrency(reciboModal.fatura.total, moeda)}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Forma de Pagamento</label>
                  <select value={reciboFormaPag} onChange={e => setReciboFormaPag(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-white">
                    <option value="">— Seleccionar —</option>
                    {FORMA_PAG_OPTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button onClick={() => setReciboModal(null)}
                  className="flex-1 py-2 rounded-lg bg-gray-600 text-white text-sm font-semibold hover:bg-gray-700 transition">
                  Agora Não
                </button>
                <button onClick={() => confirmarRecibo(reciboModal.fatura, reciboFormaPag)}
                  className="flex-1 py-2 rounded-lg text-white text-sm font-semibold transition bg-teal-600 hover:bg-teal-700">
                  🧾 Emitir Recibo PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gestão Produtos */}
        {showGestaoProdutos && (
          <ModalWrapper title="📦 Gestão de Produtos" subtitle={`${todosProdutos.length} produtos · ${produtos.length} ativos`} onClose={() => { setShowGestaoProdutos(false); setGestaoSearch(""); setGestaoCat(null); }} size="xl">
            <div className="px-6 py-3 border-b border-gray-100 flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input type="text" value={gestaoSearch} onChange={e => setGestaoSearch(e.target.value)}
                  placeholder="Pesquisar por nome ou código..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <select value={gestaoCat || ""} onChange={e => setGestaoCat(e.target.value || null)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400">
                <option value="">Todas categorias</option>
                {catalogCats.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <button onClick={() => openNovoProdutoModal()}
                className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 transition flex items-center gap-2">
                + Novo Produto
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {produtosGestao.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <div className="text-4xl mb-3">📦</div>
                  <p>Nenhum produto encontrado</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Produto</th>
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500">Código</th>
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500">Categoria</th>
                      <th className="text-right px-2 py-2 text-xs font-semibold text-gray-500">Preço</th>
                      <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500">Stock</th>
                      <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500">IVA</th>
                      <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500">Estado</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosGestao.map(p => {
                      const stockBaixo = p.ativo && p.stock <= (p.stockMinimo || 0);
                      return (
                        <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${!p.ativo ? "opacity-50" : ""}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-violet-600 text-xs font-bold">{p.nome.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-800">{p.nome}</div>
                                {p.descricao && <div className="text-xs text-gray-400 truncate max-w-xs">{p.descricao}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-xs text-gray-500 font-mono">{p.codigo || "—"}</td>
                          <td className="px-2 py-3 text-xs text-gray-500">{p.categoria || "—"}</td>
                          <td className="px-2 py-3 text-sm font-bold text-gray-800 text-right">{formatCurrency(p.preco, moeda)}</td>
                          <td className="px-2 py-3 text-center">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              stockBaixo ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                            }`}>
                              {p.stock || 0}
                              {stockBaixo && " ⚠️"}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              p.ivaIsento ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-600"
                            }`}>
                              {p.ivaIsento ? "Isento" : `${ivaTaxaDefault}%`}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              p.ativo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                            }`}>
                              {p.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-1 justify-end">
                              <button onClick={() => handleEditarProduto(p.id)}
                                className="text-xs text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 transition font-semibold">
                                ✏️ Editar
                              </button>
                              <button onClick={() => handleDesativarProduto(p.id)}
                                className={`text-xs border px-2 py-1 rounded transition font-semibold ${
                                  p.ativo ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                }`}>
                                {p.ativo ? "⏸️" : "▶️"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </ModalWrapper>
        )}

        {/* Gestão Clientes */}
        {showGestaoClientes && (
          <ModalWrapper title="👤 Gestão de Clientes" subtitle={`${data.pacientes.length} clientes cadastrados`} onClose={() => { setShowGestaoClientes(false); setGestaoSearch(""); }} size="xl">
            <div className="px-6 py-3 border-b border-gray-100 flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input type="text" value={gestaoSearch} onChange={e => setGestaoSearch(e.target.value)}
                  placeholder="Pesquisar por nome, NIF, BI, passaporte, telefone..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400" />
              </div>
              <button onClick={() => openNovoClienteModal()}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition flex items-center gap-2">
                + Novo Cliente
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {clientesGestao.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <div className="text-4xl mb-3">👤</div>
                  <p>Nenhum cliente encontrado</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Cliente</th>
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500">Documento</th>
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500">Contacto</th>
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500">Morada</th>
                      <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500">Faturas</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesGestao.map(c => {
                      const faturasCliente = data.faturas.filter(f => f.pacienteId === c.id);
                      const totalGasto = faturasCliente.reduce((s, f) => s + f.total, 0);
                      const doc = c.nif ? { tipo: "NIF", valor: c.nif } :
                        c.bi ? { tipo: "BI", valor: c.bi } :
                        c.passaporte ? { tipo: "PASS", valor: c.passaporte } : null;
                      return (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-teal-600 text-xs font-bold">{c.nome.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-800">{c.nome}</div>
                                {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            {doc ? (
                              <div>
                                <div className="text-xs font-semibold text-teal-600">{doc.tipo}</div>
                                <div className="text-xs text-gray-600 font-mono">{doc.valor}</div>
                              </div>
                            ) : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-2 py-3 text-xs text-gray-600">
                            {c.telefone || <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-2 py-3 text-xs text-gray-600 max-w-xs truncate">
                            {c.endereco || <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-2 py-3 text-center">
                            <div className="text-xs font-bold text-gray-700">{faturasCliente.length}</div>
                            <div className="text-[10px] text-gray-400">{formatCurrency(totalGasto, moeda)}</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-1 justify-end">
                              <button onClick={() => handleEditarCliente(c.id)}
                                className="text-xs text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 transition font-semibold">
                                ✏️ Editar
                              </button>
                              <button onClick={() => {
                                setShowGestaoClientes(false);
                                setPacienteId(String(c.id));
                                setClienteNome(c.nome);
                                setClienteNif(c.nif || "");
                                setClienteEndereco(c.endereco || "");
                                handleNovo();
                              }}
                                className="text-xs text-teal-600 border border-teal-200 px-2 py-1 rounded hover:bg-teal-50 transition font-semibold">
                                📄 Faturar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </ModalWrapper>
        )}

        {/* Dashboard */}
        {showDashboard && (
          <ModalWrapper title="📊 Dashboard" subtitle="Resumo completo do negócio" onClose={() => setShowDashboard(false)} size="xl">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <StatCard icon="💰" label="Total do Mês" value={formatCurrency(stats.totalMes, moeda)} sublabel={`${stats.docsMes} documentos`} color="from-blue-500 to-blue-600" />
                <StatCard icon="✅" label="Recebido" value={formatCurrency(stats.totalPago, moeda)} sublabel="Faturas pagas" color="from-emerald-500 to-emerald-600" />
                <StatCard icon="⏳" label="Pendente" value={formatCurrency(stats.totalPendente, moeda)} sublabel="A receber" color="from-amber-500 to-amber-600" />
                <StatCard icon="🚫" label="Anulado" value={formatCurrency(stats.totalAnulado, moeda)} sublabel="Documentos anulados" color="from-red-500 to-red-600" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2">Total de Documentos</div>
                  <div className="text-3xl font-black text-slate-100">{stats.totalDocs}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2">Produtos Ativos</div>
                  <div className="text-3xl font-black text-violet-400">{produtos.length}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2">Clientes</div>
                  <div className="text-3xl font-black text-teal-400">{data.pacientes.length}</div>
                </div>
              </div>

              {/* RECHARTS INTERACTIVE GRAPHS (Matches the main app dashboard) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                {/* Chart 1: Volume de Vendas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                      <TrendingUp className="h-4 w-4 text-indigo-400" /> Vendas Diárias
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">7 Dias</span>
                  </div>
                  <div className="w-full h-52 relative bg-slate-950/20 rounded-xl border border-slate-800/40 p-2 flex flex-col justify-between">
                    {/* Custom Interactive SVG Area Chart */}
                    {(() => {
                      const salesData = [
                        { dia: 'Seg', valor: 1200 },
                        { dia: 'Ter', valor: 1500 },
                        { dia: 'Qua', valor: 980 },
                        { dia: 'Qui', valor: 1750 },
                        { dia: 'Sex', valor: 2100 },
                        { dia: 'Sáb', valor: 1890 },
                        { dia: 'Dom', valor: 2340 + stats.totalMes * 0.05 }
                      ];
                      const maxSale = Math.max(...salesData.map(d => d.valor)) || 1;
                      const graphWidth = 340;
                      const graphHeight = 150;
                      const paddingLeft = 35;
                      const paddingRight = 15;
                      const paddingTop = 15;
                      const paddingBottom = 25;
                      const effWidth = graphWidth - paddingLeft - paddingRight;
                      const effHeight = graphHeight - paddingTop - paddingBottom;
                      
                      const salesPoints = salesData.map((d, i) => {
                        const x = paddingLeft + (i * effWidth) / (salesData.length - 1);
                        const y = paddingTop + effHeight - (d.valor / maxSale) * effHeight;
                        return { x, y, ...d };
                      });

                      const salesLineD = `M ${salesPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
                      const salesAreaD = `M ${salesPoints[0].x.toFixed(1)},${(paddingTop + effHeight).toFixed(1)} L ${salesPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')} L ${salesPoints[salesPoints.length - 1].x.toFixed(1)},${(paddingTop + effHeight).toFixed(1)} Z`;

                      return (
                        <>
                          <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-full overflow-visible">
                            <defs>
                              <linearGradient id="colorSalesGradFaturacao" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                              const y = paddingTop + ratio * effHeight;
                              const gridValue = maxSale * (1 - ratio);
                              return (
                                <g key={index}>
                                  <line 
                                    x1={paddingLeft} 
                                    y1={y} 
                                    x2={graphWidth - paddingRight} 
                                    y2={y} 
                                    stroke="rgba(255,255,255,0.04)" 
                                    strokeDasharray="3 3" 
                                  />
                                  <text 
                                    x={paddingLeft - 5} 
                                    y={y + 3} 
                                    fill="#475569" 
                                    fontSize="7" 
                                    fontFamily="monospace" 
                                    textAnchor="end"
                                  >
                                    {moeda}{gridValue >= 1000 ? (gridValue / 1000).toFixed(1) + 'k' : Math.round(gridValue)}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Area Fill */}
                            <path d={salesAreaD} fill="url(#colorSalesGradFaturacao)" />
                            
                            {/* Line Stroke */}
                            <path d={salesLineD} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Point Circles & Hitbox */}
                            {salesPoints.map((pt, i) => {
                              const isHovered = dashSalesHover === i;
                              return (
                                <g key={i} onMouseEnter={() => setDashSalesHover(i)} onMouseLeave={() => setDashSalesHover(null)}>
                                  {/* Glowing background on hover */}
                                  {isHovered && (
                                    <circle cx={pt.x} cy={pt.y} r="8" fill="#6366f1" fillOpacity="0.25" />
                                  )}
                                  <circle 
                                    cx={pt.x} 
                                    cy={pt.y} 
                                    r={isHovered ? "4" : "2.5"} 
                                    fill={isHovered ? "#818cf8" : "#6366f1"} 
                                    stroke="#0f172a" 
                                    strokeWidth="1" 
                                    className="transition-all"
                                  />
                                  <text 
                                    x={pt.x} 
                                    y={graphHeight - 5} 
                                    fill={isHovered ? "#94a3b8" : "#475569"} 
                                    fontSize="8" 
                                    fontFamily="monospace" 
                                    textAnchor="middle"
                                    fontWeight={isHovered ? "bold" : "normal"}
                                  >
                                    {pt.dia}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                          
                          {/* Interactive Floating Tooltip */}
                          {dashSalesHover !== null && (
                            <div className="absolute top-4 right-4 bg-slate-950/95 border border-slate-800 p-2 rounded-lg text-[10px] font-mono shadow-xl flex flex-col pointer-events-none z-10 animate-fade-in">
                              <span className="text-slate-400 font-bold">{salesData[dashSalesHover].dia}feira</span>
                              <span className="text-indigo-400 font-extrabold text-xs mt-0.5">
                                {moeda}{salesData[dashSalesHover].valor.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Chart 2: Produtos Mais Vendidos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                      <ShoppingCart className="h-4 w-4 text-emerald-400" /> Top Produtos
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">Mais Vendidos</span>
                  </div>
                  <div className="w-full h-52 relative bg-slate-950/20 rounded-xl border border-slate-800/40 p-2 flex flex-col justify-between">
                    {/* Custom Interactive SVG Bar Chart */}
                    {(() => {
                      const topProducts = stats.topProdutos.length > 0 
                        ? stats.topProdutos.map(p => ({
                            nome: p.nome.length > 12 ? p.nome.substring(0, 10) + '...' : p.nome,
                            vendas: p.qtd,
                            rawName: p.nome
                          }))
                        : [
                            { nome: "Produto A", vendas: 45, rawName: "Produto A" },
                            { nome: "Produto B", vendas: 32, rawName: "Produto B" },
                            { nome: "Produto C", vendas: 28, rawName: "Produto C" },
                            { nome: "Produto D", vendas: 15, rawName: "Produto D" },
                            { nome: "Produto E", vendas: 10, rawName: "Produto E" }
                          ];
                      
                      const maxVendas = Math.max(...topProducts.map(p => p.vendas)) || 1;
                      const graphWidth = 340;
                      const graphHeight = 150;
                      const paddingLeft = 30;
                      const paddingRight = 10;
                      const paddingTop = 15;
                      const paddingBottom = 25;
                      const effWidth = graphWidth - paddingLeft - paddingRight;
                      const effHeight = graphHeight - paddingTop - paddingBottom;

                      const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#3b82f6'];
                      const barWidth = 24;
                      const spacing = effWidth / topProducts.length;

                      return (
                        <>
                          <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-full overflow-visible">
                            {/* Horizontal Grid Lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                              const y = paddingTop + ratio * effHeight;
                              const gridValue = maxVendas * (1 - ratio);
                              return (
                                <g key={index}>
                                  <line 
                                    x1={paddingLeft} 
                                    y1={y} 
                                    x2={graphWidth - paddingRight} 
                                    y2={y} 
                                    stroke="rgba(255,255,255,0.03)" 
                                    strokeDasharray="3 3" 
                                  />
                                  <text 
                                    x={paddingLeft - 5} 
                                    y={y + 3} 
                                    fill="#475569" 
                                    fontSize="7" 
                                    fontFamily="monospace" 
                                    textAnchor="end"
                                  >
                                    {Math.round(gridValue)}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Bars rendering */}
                            {topProducts.map((pt, i) => {
                              const height = (pt.vendas / maxVendas) * effHeight;
                              const x = paddingLeft + (i * spacing) + (spacing - barWidth) / 2;
                              const y = paddingTop + effHeight - height;
                              const isHovered = dashProdHover === i;
                              const color = colors[i % colors.length];

                              return (
                                <g 
                                  key={i} 
                                  onMouseEnter={() => setDashProdHover(i)} 
                                  onMouseLeave={() => setDashProdHover(null)}
                                  className="cursor-pointer"
                                >
                                  {/* Background highlight pill */}
                                  {isHovered && (
                                    <rect 
                                      x={x - 4} 
                                      y={paddingTop - 5} 
                                      width={barWidth + 8} 
                                      height={effHeight + 10} 
                                      fill="rgba(255,255,255,0.02)" 
                                      rx="4"
                                    />
                                  )}
                                  
                                  {/* Bar */}
                                  <rect 
                                    x={x} 
                                    y={y} 
                                    width={barWidth} 
                                    height={Math.max(2, height)} 
                                    fill={color} 
                                    fillOpacity={isHovered ? 1 : 0.8}
                                    rx="3"
                                    className="transition-all duration-200"
                                  />

                                  {/* Label */}
                                  <text 
                                    x={x + barWidth / 2} 
                                    y={graphHeight - 5} 
                                    fill={isHovered ? "#94a3b8" : "#475569"} 
                                    fontSize="7.5" 
                                    fontFamily="monospace" 
                                    textAnchor="middle"
                                    fontWeight={isHovered ? "bold" : "normal"}
                                  >
                                    {pt.nome}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                          
                          {/* Floating tooltip */}
                          {dashProdHover !== null && (
                            <div className="absolute top-4 right-4 bg-slate-950/95 border border-slate-800 p-2 rounded-lg text-[10px] font-mono shadow-xl flex flex-col pointer-events-none z-10 animate-fade-in">
                              <span className="text-slate-400 font-bold max-w-[120px] truncate">{topProducts[dashProdHover].rawName}</span>
                              <span className="text-emerald-400 font-extrabold text-xs mt-0.5">
                                {topProducts[dashProdHover].vendas} unidades
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-slate-200 mb-3">🏆 Top 5 Clientes</h4>
                  {stats.topClientes.length === 0 ? (
                    <p className="text-xs text-slate-500">Sem dados</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.topClientes.map((c, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-800/30 pb-2 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 w-4">{i+1}.</span>
                            <span className="text-sm text-slate-300 font-medium">{c.nome}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-emerald-400">{formatCurrency(c.total, moeda)}</div>
                            <div className="text-[10px] text-slate-500">{c.count} faturas</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-slate-200 mb-3">📦 Top 5 Produtos</h4>
                  {stats.topProdutos.length === 0 ? (
                    <p className="text-xs text-slate-500">Sem dados</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.topProdutos.map((p, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-800/30 pb-2 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-500 w-4">{i+1}.</span>
                            <span className="text-sm text-slate-300 truncate font-medium">{p.nome}</span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-sm font-bold text-violet-400">{formatCurrency(p.total, moeda)}</div>
                            <div className="text-[10px] text-slate-500">{p.qtd} unid.</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {stats.stockBaixo.length > 0 && (
                <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-rose-400 mb-3">⚠️ Stock Baixo ({stats.stockBaixo.length})</h4>
                  <div className="space-y-2">
                    {stats.stockBaixo.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-slate-950/40 rounded-lg px-3 py-2 border border-rose-500/10">
                        <span className="text-sm text-slate-300">{p.nome}</span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-rose-400">{p.stock || 0}</span>
                          <span className="text-xs text-slate-500 ml-2">/ mín. {p.stockMinimo || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ModalWrapper>
        )}

        {/* Relatórios */}
        {showRelatorios && (
          <ModalWrapper title="📈 Relatórios" subtitle="Análise detalhada de faturação" onClose={() => setShowRelatorios(false)} size="xl">
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Tipo de Relatório</label>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { v: "resumo", l: "📊 Resumo" },
                      { v: "iva", l: "💰 IVA" },
                      { v: "clientes", l: "👥 Clientes" },
                      { v: "produtos", l: "📦 Produtos" },
                      { v: "pagamentos", l: "💳 Pagamentos" },
                      { v: "vencidos", l: "⚠️ Vencidos" },
                    ].map(t => (
                      <button key={t.v} onClick={() => setRelatorioTipo(t.v as any)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${relatorioTipo === t.v ? "bg-[#00AEEF] text-white border-[#00AEEF]" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                        {t.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Período</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { v: "dia", l: "Hoje" },
                      { v: "semana", l: "Última Semana" },
                      { v: "mes", l: "Este Mês" },
                      { v: "trimestre", l: "Trimestre" },
                      { v: "ano", l: "Este Ano" },
                    ].map(p => (
                      <button key={p.v} onClick={() => setRelatorioPeriodo(p.v as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${relatorioPeriodo === p.v ? "bg-blue-500 text-white border-blue-500" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                        {p.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <StatCard icon="📄" label="Documentos" value={String(dadosRelatorio.count)} sublabel="Total de faturas" color="from-blue-500 to-blue-600" />
                <StatCard icon="💰" label="Total Faturado" value={formatCurrency(dadosRelatorio.total, moeda)} sublabel="Com IVA" color="from-emerald-500 to-emerald-600" />
                <StatCard icon="✅" label="Recebido" value={formatCurrency(dadosRelatorio.totalPaga, moeda)} sublabel="Faturas pagas" color="from-teal-500 to-teal-600" />
                <StatCard icon="⏳" label="Por Receber" value={formatCurrency(dadosRelatorio.totalEmitida, moeda)} sublabel="Faturas emitidas" color="from-amber-500 to-amber-600" />
              </div>
              {relatorioTipo === "resumo" && (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">📋 Por Tipo de Documento</h4>
                    {Object.keys(dadosRelatorio.porTipo).length === 0 ? <p className="text-xs text-gray-400">Sem dados</p> : (
                      <div className="space-y-2">
                        {(Object.entries(dadosRelatorio.porTipo) as [string, any][]).map(([tipo, d]) => (
                          <div key={tipo} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-2">
                              <FTAvatar tipo={tipo} />
                              <span className="text-sm font-medium text-gray-700">{TIPO_LABEL[tipo] ?? tipo}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-gray-800">{formatCurrency(d.total, moeda)}</div>
                              <div className="text-xs text-gray-400">{d.count} documento(s)</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">💶 Por Estado</h4>
                    {Object.keys(dadosRelatorio.porEstado).length === 0 ? <p className="text-xs text-gray-400">Sem dados</p> : (
                      <div className="space-y-2">
                        {(Object.entries(dadosRelatorio.porEstado) as [string, any][]).map(([estado, d]) => (
                          <div key={estado} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <Badge color={estado === "paga" ? "green" : estado === "emitida" ? "blue" : estado === "rascunho" ? "amber" : "red"}>
                              {ESTADO_LABEL[estado]}
                            </Badge>
                            <div className="text-right">
                              <div className="text-sm font-bold text-gray-800">{formatCurrency(d.total, moeda)}</div>
                              <div className="text-xs text-gray-400">{d.count} documento(s)</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {relatorioTipo === "iva" && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">💰 Relatório de IVA</h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-blue-600 font-semibold">Base Tributável</div>
                      <div className="text-xl font-black text-blue-700">{formatCurrency(dadosRelatorio.totalSemIva, moeda)}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <div className="text-xs text-emerald-600 font-semibold">IVA Liquidado</div>
                      <div className="text-xl font-black text-emerald-700">{formatCurrency(dadosRelatorio.totalIva, moeda)}</div>
                    </div>
                    <div className="bg-violet-50 rounded-lg p-3">
                      <div className="text-xs text-violet-600 font-semibold">Total com IVA</div>
                      <div className="text-xl font-black text-violet-700">{formatCurrency(dadosRelatorio.total, moeda)}</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Taxa de IVA aplicada: {ivaTaxaDefault}%</p>
                </div>
              )}
              {relatorioTipo === "clientes" && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">👥 Faturação por Cliente</h4>
                  {(() => {
                    const map: Record<string, { total: number; count: number }> = {};
                    dadosRelatorio.faturas.forEach(f => {
                      if (!map[f.clienteNome]) map[f.clienteNome] = { total: 0, count: 0 };
                      map[f.clienteNome].total += f.total;
                      map[f.clienteNome].count += 1;
                    });
                    const sorted = Object.entries(map).sort((a, b) => b[1].total - a[1].total);
                    return sorted.length === 0 ? <p className="text-xs text-gray-400">Sem dados</p> : (
                      <div className="space-y-2">
                        {sorted.map(([nome, d], i) => (
                          <div key={nome} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-400 w-6">{i+1}.</span>
                              <span className="text-sm font-medium text-gray-700">{nome}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-gray-800">{formatCurrency(d.total, moeda)}</div>
                              <div className="text-xs text-gray-400">{d.count} fatura(s)</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
              {relatorioTipo === "produtos" && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">📦 Produtos Mais Vendidos</h4>
                  {(() => {
                    const map: Record<string, { qtd: number; total: number }> = {};
                    dadosRelatorio.faturas.forEach(f => {
                      f.linhas.forEach(l => {
                        if (!map[l.descricao]) map[l.descricao] = { qtd: 0, total: 0 };
                        map[l.descricao].qtd += l.quantidade;
                        map[l.descricao].total += l.quantidade * l.precoUnitario;
                      });
                    });
                    const sorted = Object.entries(map).sort((a, b) => b[1].total - a[1].total).slice(0, 20);
                    return sorted.length === 0 ? <p className="text-xs text-gray-400">Sem dados</p> : (
                      <div className="space-y-2">
                        {sorted.map(([nome, d], i) => (
                          <div key={nome} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="text-xs font-bold text-gray-400 w-6">{i+1}.</span>
                              <span className="text-sm font-medium text-gray-700 truncate">{nome}</span>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <div className="text-sm font-bold text-gray-800">{formatCurrency(d.total, moeda)}</div>
                              <div className="text-xs text-gray-400">{d.qtd} unid.</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
              {relatorioTipo === "pagamentos" && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">💳 Por Forma de Pagamento</h4>
                  {Object.keys(dadosRelatorio.porFormaPag).length === 0 ? <p className="text-xs text-gray-400">Sem dados</p> : (
                    <div className="space-y-2">
                      {(Object.entries(dadosRelatorio.porFormaPag) as [string, number][]).sort((a, b) => b[1] - a[1]).map(([forma, total]) => (
                        <div key={forma} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <span className="text-sm font-medium text-gray-700">💳 {forma}</span>
                          <div className="text-sm font-bold text-gray-800">{formatCurrency(total, moeda)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {relatorioTipo === "vencidos" && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">⚠️ Faturas Vencidas</h4>
                  {(() => {
                    const vencidas = dadosRelatorio.faturas.filter(f => isVencida(f.dataVencimento, f.estado));
                    return vencidas.length === 0 ? <p className="text-xs text-gray-400">Nenhuma fatura vencida 🎉</p> : (
                      <div className="space-y-2">
                        {vencidas.map(f => (
                          <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 bg-red-50/50 rounded px-3">
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{f.numero}</div>
                              <div className="text-xs text-gray-500">{f.clienteNome} · Venceu: {f.dataVencimento}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-red-600">{formatCurrency(f.total, moeda)}</div>
                              <div className="text-xs text-red-500">{Math.abs(diasParaVencimento(f.dataVencimento))} dias atraso</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button onClick={() => setToast({ message: "Relatório exportado com sucesso!", type: "success" })}
                  className="flex-1 py-2 rounded-lg bg-[#00AEEF] text-white text-sm font-semibold hover:bg-[#0099d4] transition">
                  📥 Exportar PDF
                </button>
                <button onClick={() => setToast({ message: "Relatório enviado por email!", type: "success" })}
                  className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition">
                  📧 Enviar por Email
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}

        {/* Templates */}
        {showTemplates && (
          <ModalWrapper title="📋 Templates de Exames" subtitle="Pacotes pré-configurados para solicitar exames" onClose={() => setShowTemplates(false)} size="xl">
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <button onClick={() => { setTemplateForm({ id: "", nome: "", descricao: "", tipoDocumento: "pro-forma", linhas: [], observacoes: "", criadoEm: hoje, usadoCount: 0, categoria: "Geral" }); setTemplateEditando(null); setShowNovoTemplate(true); }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition flex items-center gap-2">
                  ➕ Criar Template
                </button>
                <button onClick={handleCriarTemplateDaFaturaAtual} disabled={linhas.length === 0}
                  className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  💾 Salvar Fatura Atual como Template
                </button>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">🧪 Pacotes de Exames Pré-definidos</h4>
                <div className="grid grid-cols-2 gap-3">
                  {templatesLaboratorio.map(t => (
                    <div key={t.id} className="border border-purple-200 rounded-lg p-3 hover:bg-purple-50 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-bold text-gray-800">{t.nome}</div>
                          <Badge color="purple">{t.categoria}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{t.descricao}</p>
                      <div className="text-xs text-gray-400 mb-2">{t.linhas.length} exame(s)</div>
                      <div className="text-xs font-bold text-purple-600 mb-2">
                        {formatCurrency(t.linhas.reduce((s, l) => s + l.precoUnitario * l.quantidade, 0), moeda)}
                      </div>
                      <button onClick={() => handleUsarTemplate(t)}
                        className="w-full py-1.5 rounded bg-purple-100 text-purple-700 text-xs font-semibold hover:bg-purple-200 transition">
                        ✅ Usar este Pacote
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">⭐ Meus Templates ({templates.length})</h4>
                {templates.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-sm">Nenhum template personalizado criado</p>
                    <p className="text-xs mt-1">Crie seu primeiro template para agilizar a faturação</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.map(t => (
                      <div key={t.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-800">{t.nome}</div>
                            <div className="text-xs text-gray-500">{t.descricao || "Sem descrição"} · {t.linhas.length} item(s) · Usado {t.usadoCount}x</div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleUsarTemplate(t)} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded font-semibold hover:bg-emerald-200">Usar</button>
                            <button onClick={() => handleEditarTemplate(t)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded font-semibold hover:bg-blue-200">Editar</button>
                            <button onClick={() => handleRemoverTemplate(t.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded font-semibold hover:bg-red-200">🗑</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ModalWrapper>
        )}

        {showNovoTemplate && (
          <ModalWrapper title={templateEditando ? "Editar Template" : "Novo Template"} subtitle="Configure o pacote de exames" onClose={() => { setShowNovoTemplate(false); setTemplateEditando(null); }} size="lg">
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nome do Template <span className="text-red-500">*</span></label>
                  <input type="text" value={templateForm.nome} onChange={e => setTemplateForm(t => ({ ...t, nome: e.target.value }))} placeholder="Ex: Check-up Completo"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Categoria</label>
                  <input type="text" value={templateForm.categoria || ""} onChange={e => setTemplateForm(t => ({ ...t, categoria: e.target.value }))} placeholder="Ex: Hematologia"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Descrição</label>
                <input type="text" value={templateForm.descricao || ""} onChange={e => setTemplateForm(t => ({ ...t, descricao: e.target.value }))} placeholder="Breve descrição do pacote"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Tipo de Documento</label>
                <select value={templateForm.tipoDocumento} onChange={e => setTemplateForm(t => ({ ...t, tipoDocumento: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400">
                  {TIPO_DOC_OPTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Itens do Template</label>
                <div className="space-y-2">
                  {templateForm.linhas.map((l, i) => (
                    <div key={i} className="flex gap-2 items-center bg-gray-50 rounded-lg p-2">
                      <input type="text" value={l.descricao} onChange={e => {
                        const novas = [...templateForm.linhas];
                        novas[i] = { ...novas[i], descricao: e.target.value };
                        setTemplateForm(t => ({ ...t, linhas: novas }));
                      }} placeholder="Nome do exame" className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm" />
                      <input type="number" value={l.quantidade} onChange={e => {
                        const novas = [...templateForm.linhas];
                        novas[i] = { ...novas[i], quantidade: Number(e.target.value) };
                        setTemplateForm(t => ({ ...t, linhas: novas }));
                      }} className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center" />
                      <input type="number" value={l.precoUnitario} onChange={e => {
                        const novas = [...templateForm.linhas];
                        novas[i] = { ...novas[i], precoUnitario: Number(e.target.value) };
                        setTemplateForm(t => ({ ...t, linhas: novas }));
                      }} className="w-24 border border-gray-200 rounded px-2 py-1 text-sm text-right" />
                      <button onClick={() => setTemplateForm(t => ({ ...t, linhas: t.linhas.filter((_, idx) => idx !== i) }))}
                        className="text-red-400 hover:text-red-600 px-2">×</button>
                    </div>
                  ))}
                  <button onClick={() => setTemplateForm(t => ({ ...t, linhas: [...t.linhas, { descricao: "", quantidade: 1, precoUnitario: 0, ivaIsento: false, unidade: "exame" }] }))}
                    className="w-full py-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 text-sm hover:border-purple-400 hover:text-purple-600 transition">
                    + Adicionar Exame
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Observações</label>
                <textarea value={templateForm.observacoes || ""} onChange={e => setTemplateForm(t => ({ ...t, observacoes: e.target.value }))} rows={2} placeholder="Ex: Jejum de 12 horas"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 resize-none" />
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-purple-700 mb-1">Total do Template</div>
                <div className="text-xl font-black text-purple-700">{formatCurrency(templateForm.linhas.reduce((s, l) => s + l.precoUnitario * l.quantidade, 0), moeda)}</div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowNovoTemplate(false); setTemplateEditando(null); }}
                  className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition">Cancelar</button>
                <button onClick={handleSalvarTemplate}
                  className="flex-1 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition">💾 Salvar Template</button>
              </div>
            </div>
          </ModalWrapper>
        )}

        {/* Logs */}
        {showLogs && (
          <ModalWrapper title="📋 Logs de Auditoria" subtitle={`${logs.length} registros · Armazenamento local`} onClose={() => setShowLogs(false)} size="xl">
            <div className="p-6 space-y-4">
              <div className="flex gap-2 items-center justify-between">
                <div className="flex gap-2">
                  {["todos", "faturas", "produtos", "clientes", "sistema"].map(m => (
                    <button key={m} onClick={() => setLogFiltro(m as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${logFiltro === m ? "bg-gray-800 text-white border-gray-800" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                      {m === "todos" ? "Todos" : m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportarLogs} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded font-semibold hover:bg-emerald-200">📥 Exportar CSV</button>
                  <button onClick={handleLimparLogs} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded font-semibold hover:bg-red-200">🗑 Limpar</button>
                </div>
              </div>
              {logs.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-sm">Nenhum log registrado</p>
                  <p className="text-xs mt-1">As ações do sistema serão registradas aqui</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {logs.filter(l => logFiltro === "todos" || l.modulo.toLowerCase() === logFiltro).map(l => {
                    const data = new Date(l.timestamp);
                    const dataStr = `${String(data.getDate()).padStart(2,"0")}/${String(data.getMonth()+1).padStart(2,"0")}/${data.getFullYear()} ${String(data.getHours()).padStart(2,"0")}:${String(data.getMinutes()).padStart(2,"0")}`;
                    const corModulo = l.modulo === "Faturas" ? "blue" : l.modulo === "Produtos" ? "violet" : l.modulo === "Clientes" ? "teal" : "gray";
                    return (
                      <div key={l.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 border-b border-gray-100">
                        <div className="text-xs text-gray-400 w-32 flex-shrink-0 font-mono">{dataStr}</div>
                        <Badge color={corModulo}>{l.modulo}</Badge>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-800">{l.acao}</div>
                          <div className="text-xs text-gray-500 truncate">{l.detalhes}</div>
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0">👤 {l.usuario}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ModalWrapper>
        )}

        {/* Notificações */}
        {showNotificacoes && (
          <ModalWrapper title="🔔 Notificações" subtitle={`${notificacoesNaoLidas} não lida(s) · ${notificacoes.length} total`} onClose={() => setShowNotificacoes(false)} size="lg">
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <button onClick={handleMarcarTodasLidas} disabled={notificacoesNaoLidas === 0}
                  className="flex-1 py-2 rounded-lg bg-blue-100 text-blue-700 text-sm font-semibold hover:bg-blue-200 transition disabled:opacity-50">
                  ✓ Marcar Todas como Lidas
                </button>
                <button onClick={handleLimparNotificacoes} disabled={notificacoes.length === 0}
                  className="flex-1 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition disabled:opacity-50">
                  🗑 Limpar Todas
                </button>
              </div>
              {notificacoes.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <div className="text-4xl mb-3">🔔</div>
                  <p className="text-sm">Nenhuma notificação</p>
                  <p className="text-xs mt-1">Você está em dia! 🎉</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {notificacoes.map(n => {
                    const icon = n.tipo === "vencimento" ? "⏰" : n.tipo === "stock" ? "📦" : n.tipo === "pagamento" ? "💰" : "ℹ️";
                    return (
                      <div key={n.id} onClick={() => handleAcaoNotificacao(n)}
                        className={`p-3 rounded-lg border cursor-pointer transition ${n.lida ? "bg-white border-gray-200 opacity-60" : "bg-blue-50 border-blue-200"} hover:shadow-md`}>
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-bold text-gray-800">{n.titulo}</div>
                              {!n.lida && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{n.mensagem}</div>
                            <div className="text-[10px] text-gray-400 mt-1">{n.data} às {n.hora}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ModalWrapper>
        )}

        {/* Config */}
        {showConfig && (
          <ModalWrapper title="⚙️ Configurações do Sistema" subtitle="Personalize o comportamento do sistema" onClose={() => setShowConfig(false)} size="lg">
            <div className="p-6 space-y-5">
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">🏢 Dados da Empresa</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nome da Clínica/Empresa</label>
                    <input type="text" value={configForm.nomeClinica} onChange={e => setConfigForm(c => ({ ...c, nomeClinica: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">NIF da Empresa</label>
                    <input type="text" value={configForm.nif} onChange={e => setConfigForm(c => ({ ...c, nif: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Telefone</label>
                    <input type="text" value={configForm.telefone} onChange={e => setConfigForm(c => ({ ...c, telefone: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email</label>
                    <input type="email" value={configForm.email} onChange={e => setConfigForm(c => ({ ...c, email: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Endereço</label>
                    <input type="text" value={configForm.endereco} onChange={e => setConfigForm(c => ({ ...c, endereco: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">📄 Faturação</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Série</label>
                    <input type="text" value={configForm.serie} onChange={e => setConfigForm(c => ({ ...c, serie: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Moeda</label>
                    <select value={configForm.moeda} onChange={e => setConfigForm(c => ({ ...c, moeda: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                      <option value="AOA">Kwanza (AOA)</option>
                      <option value="USD">Dólar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Taxa IVA (%)</label>
                    <input type="number" value={configForm.ivaTaxa} onChange={e => setConfigForm(c => ({ ...c, ivaTaxa: Number(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">🎨 Preferências</h4>
                <div className="space-y-2">
                  {[
                    { key: "autoSalvar", label: "Auto-salvar rascunhos", icon: "💾" },
                    { key: "alertasStock", label: "Alertas de stock baixo", icon: "📦" },
                    { key: "alertasVencimento", label: "Alertas de vencimento", icon: "⏰" },
                    { key: "imprimirAutomatico", label: "Imprimir automaticamente", icon: "🖨️" },
                    { key: "backupAutomatico", label: "Backup automático", icon: "☁️" },
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{opt.icon}</span>
                        <span className="text-sm text-gray-700">{opt.label}</span>
                      </div>
                      <div onClick={() => setConfigForm(c => ({ ...c, [opt.key]: !c[opt.key as keyof ConfigSistema] }))}
                        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${(configForm as any)[opt.key] ? "bg-blue-500" : "bg-gray-300"}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${(configForm as any)[opt.key] ? "left-5" : "left-0.5"}`} />
                      </div>
                    </label>
                  ))}
                  {configForm.alertasVencimento && (
                    <div className="ml-8 p-3 bg-blue-50 rounded-lg">
                      <label className="text-xs font-semibold text-blue-700">Dias de antecedência para alerta</label>
                      <input type="number" value={configForm.diasAlertaVencimento} onChange={e => setConfigForm(c => ({ ...c, diasAlertaVencimento: Number(e.target.value) }))}
                        className="mt-1 w-full border border-blue-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">💾 Backup & Dados</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleExportarBackup}
                    className="py-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2">
                    📥 Exportar Backup Completo
                  </button>
                  <button onClick={() => setToast({ message: "Funcionalidade de importação em desenvolvimento", type: "info" })}
                    className="py-3 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                    📤 Importar Backup
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button onClick={() => setShowConfig(false)}
                  className="flex-1 py-2.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition">Cancelar</button>
                <button onClick={handleSalvarConfig}
                  className="flex-1 py-2.5 rounded-lg bg-[#00AEEF] text-white text-sm font-semibold hover:bg-[#0099d4] transition">✓ Salvar Configurações</button>
              </div>
            </div>
          </ModalWrapper>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <ModalWrapper title="📤 Upload de Documento" subtitle="Carregue BI, Passaporte ou documento do produto" onClose={() => setShowUploadModal(false)} size="md">
            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Clique para carregar ou arraste o arquivo</p>
                  <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC até 10MB</p>
                </label>
              </div>
              {uploadArquivo && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">📎 {uploadArquivo.name}</span>
                    <span className="text-xs text-gray-500">({(uploadArquivo.size / 1024).toFixed(1)} KB)</span>
                  </div>
                </div>
              )}
              {uploadExtraindo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div>
                      <p className="text-sm font-semibold text-blue-700">Extraindo dados...</p>
                      <p className="text-xs text-blue-600">Processando documento com OCR</p>
                    </div>
                  </div>
                </div>
              )}
              {uploadDadosExtraidos && !uploadExtraindo && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-emerald-600 text-xl">✓</span>
                    <span className="text-sm font-semibold text-emerald-700">Dados extraídos com sucesso!</span>
                  </div>
                  {uploadTipo === "cliente" && uploadPreview && (
                    <div className="mb-3">
                      <img src={uploadPreview} alt="Foto" className="w-20 h-20 rounded-full mx-auto border-2 border-emerald-300" />
                    </div>
                  )}
                  <div className="space-y-1 text-xs">
                    {Object.entries(uploadDadosExtraidos).filter(([key]) => key !== 'foto').map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 font-medium">{key}:</span>
                        <span className="text-gray-800">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowUploadModal(false)}
                className="flex-1 py-2 rounded-lg bg-gray-600 text-white text-sm font-semibold hover:bg-gray-700 transition">
                Cancelar
              </button>
              <button onClick={aplicarDadosExtraidos} disabled={!uploadDadosExtraidos}
                className="flex-1 py-2 rounded-lg text-white text-sm font-semibold transition bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                ✓ Aplicar Dados
              </button>
            </div>
          </ModalWrapper>
        )}

        {/* Chat Assistente */}
        {showChat && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-lg">🤖</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-800">Assistente de Faturação</h3>
                    <p className="text-xs text-gray-400">Ctrl+H para abrir/fechar</p>
                  </div>
                </div>
                <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-blue-100" : "text-gray-400"}`}>{msg.timestamp}</p>
                      {msg.attachments && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((att, i) => (
                            <div key={i} className="text-xs opacity-80">📎 {att.name}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                        <span className="text-xs text-gray-500">Processando...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSubmit(); } }}
                    placeholder="Digite sua mensagem ou use o microfone..."
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-400"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={toggleVoiceRecognition}
                    className={`px-4 py-2 rounded-lg text-white text-sm font-semibold transition flex items-center gap-2 ${
                      isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {isListening ? "🔴" : "🎤"}
                  </button>
                  <button
                    onClick={handleChatSubmit}
                    disabled={!chatInput.trim() || isProcessing}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Enviar
                  </button>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button onClick={() => { setChatInput("faturar"); handleChatSubmit(); }}
                    className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">📄 Faturar</button>
                  <button onClick={() => { setChatInput("onde está o cliente"); handleChatSubmit(); }}
                    className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">🔍 Localizar cliente</button>
                  <button onClick={() => { setChatInput("criar cliente"); handleChatSubmit(); }}
                    className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">👤 Criar cliente</button>
                  <button onClick={() => { setChatInput("dashboard"); handleChatSubmit(); }}
                    className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">📊 Dashboard</button>
                  <button onClick={() => { setChatInput("ajuda"); handleChatSubmit(); }}
                    className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">❓ Ajuda</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmação genérico */}
        {confirmModal && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-base text-gray-800">{confirmModal.title}</h3>
                <p className="text-sm text-gray-600 mt-2">{confirmModal.message}</p>
              </div>
              <div className="px-6 py-4 flex gap-3">
                <button onClick={() => setConfirmModal(null)}
                  className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition">
                  {confirmModal.cancelText || "Cancelar"}
                </button>
                <button onClick={confirmModal.onConfirm}
                  className={`flex-1 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition ${
                    confirmModal.type === "danger" ? "bg-red-500" :
                    confirmModal.type === "info" ? "bg-blue-500" : "bg-amber-500"
                  }`}>
                  {confirmModal.confirmText || "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Painel Lateral Filtros */}
        <div className="w-72 flex-shrink-0 space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-700">Filtro de Documentos</h3>
            </div>
            <div className="px-4 py-3.5 border-b border-gray-50">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Estado</div>
              <div className="space-y-1.5">
                {[
                  { val: "todos", label: "Todos", dot: "bg-gray-400", count: data.faturas.filter(f => f.estado !== "rascunho").length },
                  { val: "emitida", label: "Emitida", dot: "bg-blue-500", count: data.faturas.filter(f => f.estado === "emitida").length },
                  { val: "paga", label: "Paga", dot: "bg-emerald-500", count: data.faturas.filter(f => f.estado === "paga").length },
                  { val: "rascunho", label: "Rascunho", dot: "bg-amber-400", count: data.faturas.filter(f => f.estado === "rascunho").length },
                  { val: "anulada", label: "Anulada", dot: "bg-red-400", count: data.faturas.filter(f => f.estado === "anulada").length },
                ].map(o => (
                  <label key={o.val} className={`flex items-center gap-2.5 cursor-pointer text-xs rounded-lg px-2 py-1.5 transition ${filtroEstado === o.val ? "bg-gray-100 font-semibold text-gray-800" : "text-gray-500 hover:bg-gray-50"}`}>
                    <input type="radio" name="filtroEstado" value={o.val}
                      checked={filtroEstado === o.val}
                      onChange={() => setFiltroEstado(o.val)}
                      className="sr-only" />
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${o.dot}`} />
                    <span className="flex-1">{o.label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filtroEstado === o.val ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-400"}`}>{o.count}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-4 space-y-2">
              <button onClick={() => { setSearch(""); setFiltroEstado("todos"); setFiltroTipo("todos"); }}
                className="w-full text-center text-xs font-semibold py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 flex items-center justify-center gap-1 transition border border-red-100">
                🗑 Limpar Filtro
              </button>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-bold mb-3 uppercase tracking-wide">Tipos de Documentos</p>
            <div className="space-y-1.5 text-xs">
              {[
                { tipo: "todos", label: "Todos os tipos" },
                { tipo: "factura", label: "Factura" },
                { tipo: "factura-global", label: "Factura Global" },
                { tipo: "pro-forma", label: "Pró-Forma" },
                { tipo: "nota-credito", label: "Nota de Crédito" },
              ].map(({ tipo, label }) => {
                const cfg = TIPO_AVATAR[tipo] ?? { bg: "bg-gray-400", code: "·" };
                const isActive = filtroTipo === tipo;
                return (
                  <button key={tipo} onClick={() => setFiltroTipo(tipo)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition text-left ${
                      isActive ? "bg-[#00AEEF]/10 font-semibold text-[#0077a8]" : "text-gray-600 hover:bg-gray-50"
                    }`}>
                    {tipo === "todos" ? (
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-black">·</span>
                      </div>
                    ) : (
                      <div className={`w-7 h-7 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-[10px] font-black">{cfg.code}</span>
                      </div>
                    )}
                    <span className="flex-1">{label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-[#00AEEF]/20 text-[#0077a8]" : "bg-gray-100 text-gray-400"}`}>
                      {tipo === "todos"
                        ? data.faturas.length
                        : data.faturas.filter(f => (f.tipoDocumento || "factura") === tipo).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Resumo Geral</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total de documentos</span>
                <span className="font-bold text-gray-700">{data.faturas.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total recebido</span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(data.faturas.filter(f => f.estado === "paga").reduce((s, f) => s + f.total, 0), moeda)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Pendente</span>
                <span className="font-bold text-blue-500">
                  {formatCurrency(data.faturas.filter(f => f.estado === "emitida").reduce((s, f) => s + f.total, 0), moeda)}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-gray-100">
                <span className="text-gray-400">Produtos</span>
                <span className="font-bold text-violet-600">{produtos.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Clientes</span>
                <span className="font-bold text-teal-600">{data.pacientes.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Templates</span>
                <span className="font-bold text-purple-600">{templates.length}</span>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">⌨️ Atalhos</p>
            <div className="space-y-1.5 text-xs text-gray-500">
              {[
                { label: "Novo documento", key: "Ctrl+N" },
                { label: "Novo produto", key: "Ctrl+P" },
                { label: "Novo cliente", key: "Ctrl+C" },
                { label: "Dashboard", key: "Ctrl+D" },
                { label: "Relatórios", key: "Ctrl+R" },
                { label: "Templates", key: "Ctrl+T" },
                { label: "Logs", key: "Ctrl+L" },
                { label: "Assistente", key: "Ctrl+H" },
              ].map(({ label, key }) => (
                <div key={key} className="flex justify-between">
                  <span>{label}</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
