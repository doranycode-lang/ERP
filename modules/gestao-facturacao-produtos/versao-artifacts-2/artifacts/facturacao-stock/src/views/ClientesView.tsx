import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useApp } from "../store/AppContext";
import { PacienteCliente } from "../types";
import { formatCurrency } from "../utils/faturaGenerator";
import {
  Users, Plus, Search, Phone, Mail, MapPin, FileText, Edit2, Trash2, X,
  MessageCircle, Download, Printer, LayoutGrid, List, AlertTriangle, Wallet,
  TrendingUp, UserPlus, Eye, ChevronLeft, ChevronRight, Building2, User, Ban,
  CheckCircle2, Clock, Copy, Filter, Star,
} from "lucide-react";

/* ============================================================================
 * TIPOS LOCAIS
 * Os campos extra (tipo, categoria, limiteCredito, estado...) devem ser
 * adicionados a PacienteCliente em ../types para ficarem totalmente tipados.
 * ========================================================================== */
type TipoCliente = "particular" | "empresa";
type EstadoCliente = "ativo" | "inativo" | "bloqueado";
type Categoria = "normal" | "vip" | "revendedor" | "corporativo";
type ViewMode = "cards" | "table";
type SortKey = "nome" | "recentes" | "maior_comprador" | "maior_divida" | "ultima_compra";
type DrawerTab = "resumo" | "facturas" | "conta" | "produtos" | "notas";
type FormTab = "dados" | "contacto" | "financeiro" | "notas";

type ClienteX = PacienteCliente & {
  tipo?: TipoCliente;
  categoria?: Categoria;
  estado?: EstadoCliente;
  limiteCredito?: number;
  prazoPagamento?: number;
  desconto?: number;
  contactoPessoa?: string;
  provincia?: string;
  municipio?: string;
  dataNascimento?: string;
  tags?: string[];
  criadoEm?: string;
  createdAt?: string;
};

interface FormState {
  nome: string;
  tipo: TipoCliente;
  categoria: Categoria;
  estado: EstadoCliente;
  nif: string;
  bi: string;
  passaporte: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  contactoPessoa: string;
  endereco: string;
  municipio: string;
  provincia: string;
  limiteCredito: string;
  prazoPagamento: string;
  desconto: string;
  tags: string;
  observacoes: string;
}

const EMPTY_FORM: FormState = {
  nome: "", tipo: "particular", categoria: "normal", estado: "ativo",
  nif: "", bi: "", passaporte: "", dataNascimento: "",
  telefone: "", email: "", contactoPessoa: "",
  endereco: "", municipio: "", provincia: "Luanda",
  limiteCredito: "", prazoPagamento: "0", desconto: "0",
  tags: "", observacoes: "",
};

const PROVINCIAS = [
  "Bengo", "Benguela", "Bié", "Cabinda", "Cuando", "Cubango", "Cuanza Norte",
  "Cuanza Sul", "Cunene", "Huambo", "Huíla", "Luanda", "Lunda Norte",
  "Lunda Sul", "Malanje", "Moxico", "Moxico Leste", "Namibe", "Uíge", "Zaire",
];

/* ============================================================================
 * HELPERS
 * ========================================================================== */
const NAO_CONTA = ["anulada", "cancelada", "rascunho"];
const PAGE_SIZES = [12, 24, 48];

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const normPhone = (s: string) => {
  const d = onlyDigits(s);
  return d.startsWith("244") ? d.slice(3) : d;
};
const norm = (s?: string) => (s || "").trim().toLowerCase();

const validarNIF = (v: string) => /^\d{9,10}$/.test(v.trim());
const validarBI = (v: string) => /^\d{9}[A-Z]{2}\d{3}$/.test(v.trim().toUpperCase());
const validarPassaporte = (v: string) => /^[A-Z0-9]{6,9}$/.test(v.trim().toUpperCase());
const validarEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const validarTelefone = (v: string) => /^9\d{8}$/.test(normPhone(v));

const fatData = (f: any): string | undefined =>
  f.dataEmissao || f.data || f.criadoEm || f.createdAt;
const fatVenc = (f: any): string | undefined => f.dataVencimento || f.vencimento;
const fatNumero = (f: any): string => f.numero || f.numeroFatura || f.id?.toString().slice(0, 8) || "—";

const fmtData = (d?: string) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("pt-AO");
};

const fatPago = (f: any): number => {
  if (Array.isArray(f.pagamentos) && f.pagamentos.length) {
    return f.pagamentos.reduce((s: number, p: any) => s + (Number(p.valor) || 0), 0);
  }
  if (typeof f.valorPago === "number") return f.valorPago;
  return f.estado === "paga" ? Number(f.total) || 0 : 0;
};

const fatItens = (f: any): any[] => f.itens || f.items || f.linhas || [];

interface ClienteStats {
  nFaturas: number;
  totalFacturado: number;
  totalPago: number;
  emDivida: number;
  vencido: number;
  nVencidas: number;
  ultimaCompra?: string;
  ticketMedio: number;
  acimaLimite: boolean;
}

const calcStats = (c: ClienteX, faturas: any[]): ClienteStats => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const mine = faturas.filter(
    (f) =>
      f.pacienteId === c.id ||
      (!f.pacienteId && norm(f.clienteNome) === norm(c.nome))
  );
  const validas = mine.filter((f) => !NAO_CONTA.includes(f.estado));
  let totalFacturado = 0, totalPago = 0, vencido = 0, nVencidas = 0;
  let ultima: string | undefined;

  validas.forEach((f) => {
    const total = Number(f.total) || 0;
    const pago = Math.min(fatPago(f), total);
    totalFacturado += total;
    totalPago += pago;
    const aberto = total - pago;
    const venc = fatVenc(f);
    if (aberto > 0.009 && venc && new Date(venc) < hoje) {
      vencido += aberto;
      nVencidas += 1;
    }
    const d = fatData(f);
    if (d && (!ultima || new Date(d) > new Date(ultima))) ultima = d;
  });

  const emDivida = Math.max(0, totalFacturado - totalPago);
  const limite = c.limiteCredito || 0;
  return {
    nFaturas: validas.length,
    totalFacturado,
    totalPago,
    emDivida,
    vencido,
    nVencidas,
    ultimaCompra: ultima,
    ticketMedio: validas.length ? totalFacturado / validas.length : 0,
    acimaLimite: limite > 0 && emDivida > limite,
  };
};

const estadoStyle: Record<EstadoCliente, string> = {
  ativo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inativo: "bg-slate-100 text-slate-600 border-slate-200",
  bloqueado: "bg-rose-50 text-rose-700 border-rose-200",
};

const catStyle: Record<Categoria, string> = {
  normal: "bg-slate-100 text-slate-600",
  vip: "bg-amber-100 text-amber-700",
  revendedor: "bg-violet-100 text-violet-700",
  corporativo: "bg-sky-100 text-sky-700",
};

const fatEstadoStyle = (e: string) => {
  switch (e) {
    case "paga": return "bg-emerald-50 text-emerald-700";
    case "anulada":
    case "cancelada": return "bg-slate-100 text-slate-500 line-through";
    case "parcial": return "bg-amber-50 text-amber-700";
    default: return "bg-sky-50 text-sky-700";
  }
};

const downloadFile = (name: string, content: string, mime: string) => {
  const blob = new Blob(["\uFEFF" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

const inputCls =
  "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500 bg-white";
const errCls = "text-[11px] text-rose-600 mt-1";

/* ============================================================================
 * COMPONENTE
 * ========================================================================== */
export const ClientesView: React.FC<{ onFaturarCliente?: (cliente: PacienteCliente) => void }> = ({
  onFaturarCliente,
}) => {
  const { pacientes, faturas, config, addPaciente, updatePaciente, deletePaciente } = useApp();
  const clientes = pacientes as ClienteX[];
  const moeda = config.moeda;
  const money = useCallback((v: number) => formatCurrency(v, moeda), [moeda]);

  /* ---------- estado UI ---------- */
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [showFilters, setShowFilters] = useState(false);
  const [fEstado, setFEstado] = useState<"todos" | EstadoCliente>("todos");
  const [fTipo, setFTipo] = useState<"todos" | TipoCliente>("todos");
  const [fCategoria, setFCategoria] = useState<"todos" | Categoria>("todos");
  const [fProvincia, setFProvincia] = useState("todas");
  const [fSoDevedores, setFSoDevedores] = useState(false);
  const [fSoVencidos, setFSoVencidos] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("nome");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteX | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [formTab, setFormTab] = useState<FormTab>("dados");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dupBlock, setDupBlock] = useState<string[]>([]);
  const [dupWarn, setDupWarn] = useState<string[]>([]);
  const [ignoreWarn, setIgnoreWarn] = useState(false);
  const [saving, setSaving] = useState(false);

  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("resumo");
  const [toDelete, setToDelete] = useState<ClienteX | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);

  const showToast = (msg: string, kind: "ok" | "err" = "ok") => {
    setToast({ msg, kind });
  };
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- estatísticas por cliente ---------- */
  const statsMap = useMemo(() => {
    const m = new Map<string, ClienteStats>();
    clientes.forEach((c) => m.set(c.id, calcStats(c, faturas as any[])));
    return m;
  }, [clientes, faturas]);

  const getStats = (c: ClienteX): ClienteStats =>
    statsMap.get(c.id) || calcStats(c, faturas as any[]);

  /* ---------- resumo topo ---------- */
  const resumo = useMemo(() => {
    const now = new Date();
    let ativos = 0, devedores = 0, totalDivida = 0, totalVencido = 0, novosMes = 0, bloqueados = 0;
    clientes.forEach((c) => {
      const s = statsMap.get(c.id);
      if ((c.estado || "ativo") === "ativo") ativos++;
      if (c.estado === "bloqueado") bloqueados++;
      if (s && s.emDivida > 0.009) { devedores++; totalDivida += s.emDivida; }
      if (s) totalVencido += s.vencido;
      const cr = c.criadoEm || c.createdAt;
      if (cr) {
        const d = new Date(cr);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) novosMes++;
      }
    });
    return { total: clientes.length, ativos, devedores, totalDivida, totalVencido, novosMes, bloqueados };
  }, [clientes, statsMap]);

  /* ---------- filtro + ordenação ---------- */
  const filteredClientes = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const qDigits = onlyDigits(q);
    let list = clientes.filter((c) => {
      if (q) {
        const hit =
          c.nome.toLowerCase().includes(q) ||
          (c.nif && c.nif.toLowerCase().includes(q)) ||
          (c.bi && c.bi.toLowerCase().includes(q)) ||
          (c.passaporte && c.passaporte.toLowerCase().includes(q)) ||
          (qDigits.length >= 3 && c.telefone && onlyDigits(c.telefone).includes(qDigits)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.endereco && c.endereco.toLowerCase().includes(q)) ||
          (c.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!hit) return false;
      }
      const est = c.estado || "ativo";
      if (fEstado !== "todos" && est !== fEstado) return false;
      if (fTipo !== "todos" && (c.tipo || "particular") !== fTipo) return false;
      if (fCategoria !== "todos" && (c.categoria || "normal") !== fCategoria) return false;
      if (fProvincia !== "todas" && c.provincia !== fProvincia) return false;
      const s = statsMap.get(c.id);
      if (fSoDevedores && !(s && s.emDivida > 0.009)) return false;
      if (fSoVencidos && !(s && s.vencido > 0.009)) return false;
      return true;
    });

    const cmpDate = (a?: string, b?: string) =>
      (b ? new Date(b).getTime() : 0) - (a ? new Date(a).getTime() : 0);

    list = [...list].sort((a, b) => {
      const sa = statsMap.get(a.id)!, sb = statsMap.get(b.id)!;
      switch (sortKey) {
        case "maior_comprador": return (sb?.totalFacturado || 0) - (sa?.totalFacturado || 0);
        case "maior_divida": return (sb?.emDivida || 0) - (sa?.emDivida || 0);
        case "ultima_compra": return cmpDate(sa?.ultimaCompra, sb?.ultimaCompra);
        case "recentes": return cmpDate(a.criadoEm || a.createdAt, b.criadoEm || b.createdAt);
        default: return a.nome.localeCompare(b.nome, "pt");
      }
    });
    return list;
  }, [clientes, searchTerm, fEstado, fTipo, fCategoria, fProvincia, fSoDevedores, fSoVencidos, sortKey, statsMap]);

  useEffect(() => { setPage(1); }, [searchTerm, fEstado, fTipo, fCategoria, fProvincia, fSoDevedores, fSoVencidos, sortKey, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredClientes.length / pageSize));
  const pageItems = filteredClientes.slice((page - 1) * pageSize, page * pageSize);
  const activeFilters =
    [fEstado !== "todos", fTipo !== "todos", fCategoria !== "todos", fProvincia !== "todas", fSoDevedores, fSoVencidos].filter(Boolean).length;

  const clearFilters = () => {
    setFEstado("todos"); setFTipo("todos"); setFCategoria("todos");
    setFProvincia("todas"); setFSoDevedores(false); setFSoVencidos(false);
  };

  /* ---------- seleção ---------- */
  const toggleSel = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const allPageSelected = pageItems.length > 0 && pageItems.every((c) => selected.has(c.id));
  const togglePage = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allPageSelected) pageItems.forEach((c) => n.delete(c.id));
      else pageItems.forEach((c) => n.add(c.id));
      return n;
    });

  /* ---------- exportação ---------- */
  const exportCSV = (list: ClienteX[]) => {
    const head = [
      "Nome", "Tipo", "Categoria", "Estado", "NIF", "BI", "Passaporte", "Telefone", "Email",
      "Endereço", "Município", "Província", "Limite Crédito", "Nº Facturas",
      "Total Facturado", "Total Pago", "Em Dívida", "Vencido", "Última Compra",
    ];
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = list.map((c) => {
      const s = getStats(c);
      return [
        c.nome, c.tipo || "particular", c.categoria || "normal", c.estado || "ativo",
        c.nif, c.bi, c.passaporte, c.telefone, c.email, c.endereco, c.municipio, c.provincia,
        c.limiteCredito || 0, s.nFaturas, s.totalFacturado.toFixed(2), s.totalPago.toFixed(2),
        s.emDivida.toFixed(2), s.vencido.toFixed(2), fmtData(s.ultimaCompra),
      ].map(esc).join(";");
    });
    downloadFile(
      `clientes_${new Date().toISOString().slice(0, 10)}.csv`,
      [head.map(esc).join(";"), ...rows].join("\n"),
      "text/csv;charset=utf-8;"
    );
    showToast(`${list.length} cliente(s) exportado(s) para Excel (CSV)`);
  };

  const printList = (list: ClienteX[]) => {
    const w = window.open("", "_blank");
    if (!w) { showToast("Permita pop-ups para imprimir", "err"); return; }
    const rows = list.map((c) => {
      const s = getStats(c);
      return `<tr><td>${c.nome}</td><td>${c.nif || c.bi || "—"}</td><td>${c.telefone || "—"}</td>
        <td style="text-align:right">${money(s.totalFacturado)}</td>
        <td style="text-align:right">${money(s.emDivida)}</td></tr>`;
    }).join("");
    w.document.write(`<html><head><title>Clientes</title><style>
      body{font-family:Arial,sans-serif;padding:24px;font-size:12px}
      table{width:100%;border-collapse:collapse}
      th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left}
      th{background:#f1f5f9}</style></head><body>
      <h2>Lista de Clientes (${list.length})</h2>
      <p>Emitido em ${new Date().toLocaleString("pt-AO")}</p>
      <table><thead><tr><th>Nome</th><th>NIF / BI</th><th>Telefone</th>
      <th style="text-align:right">Facturado</th><th style="text-align:right">Em dívida</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  /* ---------- formulário ---------- */
  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setFormData((f) => ({ ...f, [k]: v }));
    setErrors((e) => { const n = { ...e }; delete n[k as string]; return n; });
    setIgnoreWarn(false);
  };

  const handleOpenAdd = () => {
    setEditingCliente(null);
    setFormData(EMPTY_FORM);
    setErrors({}); setDupBlock([]); setDupWarn([]); setIgnoreWarn(false);
    setFormTab("dados");
    setShowModal(true);
  };

  const handleOpenEdit = (c: ClienteX) => {
    setEditingCliente(c);
    setFormData({
      nome: c.nome,
      tipo: c.tipo || "particular",
      categoria: c.categoria || "normal",
      estado: c.estado || "ativo",
      nif: c.nif || "",
      bi: c.bi || "",
      passaporte: c.passaporte || "",
      dataNascimento: c.dataNascimento || "",
      telefone: c.telefone || "",
      email: c.email || "",
      contactoPessoa: c.contactoPessoa || "",
      endereco: c.endereco || "",
      municipio: c.municipio || "",
      provincia: c.provincia || "Luanda",
      limiteCredito: c.limiteCredito ? String(c.limiteCredito) : "",
      prazoPagamento: String(c.prazoPagamento ?? 0),
      desconto: String(c.desconto ?? 0),
      tags: (c.tags || []).join(", "),
      observacoes: c.observacoes || "",
    });
    setErrors({}); setDupBlock([]); setDupWarn([]); setIgnoreWarn(false);
    setFormTab("dados");
    setShowModal(true);
  };

  const validar = (): Record<string, string> => {
    const e: Record<string, string> = {};
    const f = formData;
    if (!f.nome.trim()) e.nome = "O nome é obrigatório";
    else if (f.nome.trim().length < 3) e.nome = "Nome demasiado curto";
    if (f.nif && !validarNIF(f.nif)) e.nif = "NIF deve ter 9 ou 10 dígitos";
    if (f.bi && !validarBI(f.bi)) e.bi = "Formato inválido (ex: 005489123LA042)";
    if (f.passaporte && !validarPassaporte(f.passaporte)) e.passaporte = "6 a 9 caracteres alfanuméricos";
    if (f.telefone && !validarTelefone(f.telefone)) e.telefone = "Telefone angolano: 9XX XXX XXX";
    if (f.email && !validarEmail(f.email)) e.email = "Email inválido";
    if (f.limiteCredito && (isNaN(Number(f.limiteCredito)) || Number(f.limiteCredito) < 0)) e.limiteCredito = "Valor inválido";
    if (f.prazoPagamento && (isNaN(Number(f.prazoPagamento)) || Number(f.prazoPagamento) < 0)) e.prazoPagamento = "Dias inválidos";
    const d = Number(f.desconto || 0);
    if (isNaN(d) || d < 0 || d > 100) e.desconto = "Entre 0 e 100%";
    if (f.dataNascimento && new Date(f.dataNascimento) > new Date()) e.dataNascimento = "Data futura";
    return e;
  };

  const detectarDuplicados = () => {
    const block: string[] = [];
    const warn: string[] = [];
    const f = formData;
    clientes.forEach((c) => {
      if (editingCliente && c.id === editingCliente.id) return;
      if (f.nif.trim() && c.nif && norm(c.nif) === norm(f.nif)) block.push(`NIF ${f.nif} já pertence a "${c.nome}"`);
      if (f.bi.trim() && c.bi && norm(c.bi) === norm(f.bi)) block.push(`BI ${f.bi} já pertence a "${c.nome}"`);
      if (f.telefone.trim() && c.telefone && normPhone(c.telefone) === normPhone(f.telefone))
        warn.push(`Telefone já usado por "${c.nome}"`);
      if (f.email.trim() && c.email && norm(c.email) === norm(f.email))
        warn.push(`Email já usado por "${c.nome}"`);
      if (norm(c.nome) === norm(f.nome) && f.nome.trim())
        warn.push(`Já existe um cliente chamado "${c.nome}"`);
    });
    return { block, warn };
  };

  const tabDoErro = (e: Record<string, string>): FormTab => {
    if (e.nome || e.nif || e.bi || e.passaporte || e.dataNascimento) return "dados";
    if (e.telefone || e.email) return "contacto";
    if (e.limiteCredito || e.prazoPagamento || e.desconto) return "financeiro";
    return "dados";
  };

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validar();
    setErrors(e);
    if (Object.keys(e).length) {
      setFormTab(tabDoErro(e));
      showToast("Corrija os campos assinalados", "err");
      return;
    }
    const { block, warn } = detectarDuplicados();
    setDupBlock(block);
    setDupWarn(warn);
    if (block.length) { setFormTab("dados"); return; }
    if (warn.length && !ignoreWarn) { setIgnoreWarn(true); return; }

    const f = formData;
    const payload: any = {
      nome: f.nome.trim(),
      tipo: f.tipo,
      categoria: f.categoria,
      estado: f.estado,
      nif: f.nif.trim(),
      bi: f.bi.trim().toUpperCase(),
      passaporte: f.passaporte.trim().toUpperCase(),
      dataNascimento: f.dataNascimento,
      telefone: f.telefone.trim(),
      email: f.email.trim().toLowerCase(),
      contactoPessoa: f.contactoPessoa.trim(),
      endereco: f.endereco.trim(),
      municipio: f.municipio.trim(),
      provincia: f.provincia,
      limiteCredito: Number(f.limiteCredito || 0),
      prazoPagamento: Number(f.prazoPagamento || 0),
      desconto: Number(f.desconto || 0),
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
      observacoes: f.observacoes.trim(),
    };

    setSaving(true);
    try {
      if (editingCliente) {
        await updatePaciente(editingCliente.id, payload);
        showToast("Cliente actualizado com sucesso");
      } else {
        await addPaciente(payload);
        showToast("Cliente registado com sucesso");
      }
      setShowModal(false);
    } catch (err) {
      console.error("Erro ao salvar cliente:", err);
      showToast("Erro ao guardar o cliente", "err");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- eliminar / inativar ---------- */
  const alterarEstado = async (c: ClienteX, estado: EstadoCliente) => {
    try {
      await updatePaciente(c.id, { estado } as any);
      showToast(`${c.nome}: estado alterado para ${estado}`);
    } catch {
      showToast("Não foi possível alterar o estado", "err");
    }
  };

  const confirmarEliminar = async () => {
    if (!toDelete) return;
    try {
      await deletePaciente(toDelete.id);
      setSelected((s) => { const n = new Set(s); n.delete(toDelete.id); return n; });
      if (drawerId === toDelete.id) setDrawerId(null);
      showToast("Cliente removido");
    } catch {
      showToast("Erro ao remover cliente", "err");
    }
    setToDelete(null);
  };

  const inativarSelecionados = async () => {
    for (const id of selected) {
      const c = clientes.find((x) => x.id === id);
      if (c) await alterarEstado(c, "inativo");
    }
    setSelected(new Set());
  };

  /* ---------- ações rápidas ---------- */
  const waLink = (tel?: string) => {
    const d = normPhone(tel || "");
    return d ? `https://wa.me/244${d}` : "#";
  };

  const copiar = async (txt: string) => {
    try { await navigator.clipboard.writeText(txt); showToast("Copiado"); }
    catch { showToast("Não foi possível copiar", "err"); }
  };

  const cobrarWhatsApp = (c: ClienteX) => {
    const s = getStats(c);
    const msg = encodeURIComponent(
      `Olá ${c.nome}, informamos que tem um valor em aberto de ${money(s.emDivida)}` +
      (s.vencido > 0 ? ` (dos quais ${money(s.vencido)} vencidos)` : "") +
      `. Pode contactar-nos para regularizar. Obrigado.`
    );
    window.open(`${waLink(c.telefone)}?text=${msg}`, "_blank");
  };

  const podeFacturar = (c: ClienteX) => (c.estado || "ativo") === "ativo";

  /* ---------- dados do painel lateral ---------- */
  const drawerCliente = clientes.find((c) => c.id === drawerId) || null;
  const drawerStats = drawerCliente ? getStats(drawerCliente) : null;

  const drawerFaturas = useMemo(() => {
    if (!drawerCliente) return [] as any[];
    return (faturas as any[])
      .filter(
        (f) =>
          f.pacienteId === drawerCliente.id ||
          (!f.pacienteId && norm(f.clienteNome) === norm(drawerCliente.nome))
      )
      .sort((a, b) => new Date(fatData(b) || 0).getTime() - new Date(fatData(a) || 0).getTime());
  }, [drawerCliente, faturas]);

  const contaCorrente = useMemo(() => {
    const mov: { data: string; desc: string; debito: number; credito: number }[] = [];
    drawerFaturas
      .filter((f) => !NAO_CONTA.includes(f.estado))
      .forEach((f) => {
        const total = Number(f.total) || 0;
        mov.push({ data: fatData(f) || "", desc: `Factura ${fatNumero(f)}`, debito: total, credito: 0 });
        if (Array.isArray(f.pagamentos) && f.pagamentos.length) {
          f.pagamentos.forEach((p: any) =>
            mov.push({
              data: p.data || fatData(f) || "",
              desc: `Pagamento ${fatNumero(f)}${p.metodo ? ` (${p.metodo})` : ""}`,
              debito: 0,
              credito: Number(p.valor) || 0,
            })
          );
        } else {
          const pago = fatPago(f);
          if (pago > 0)
            mov.push({ data: fatData(f) || "", desc: `Pagamento ${fatNumero(f)}`, debito: 0, credito: pago });
        }
      });
    mov.sort((a, b) => new Date(a.data || 0).getTime() - new Date(b.data || 0).getTime());
    let saldo = 0;
    return mov.map((m) => { saldo += m.debito - m.credito; return { ...m, saldo }; });
  }, [drawerFaturas]);

  const topProdutos = useMemo(() => {
    const map = new Map<string, { nome: string; qtd: number; valor: number }>();
    drawerFaturas
      .filter((f) => !NAO_CONTA.includes(f.estado))
      .forEach((f) =>
        fatItens(f).forEach((i: any) => {
          const nome = i.descricao || i.nome || i.produtoNome || i.servico || "Item";
          const qtd = Number(i.quantidade ?? i.qtd ?? 1) || 1;
          const valor = Number(i.total ?? qtd * (Number(i.precoUnitario ?? i.preco) || 0)) || 0;
          const cur = map.get(nome) || { nome, qtd: 0, valor: 0 };
          cur.qtd += qtd; cur.valor += valor;
          map.set(nome, cur);
        })
      );
    return [...map.values()].sort((a, b) => b.valor - a.valor).slice(0, 10);
  }, [drawerFaturas]);

  /* ======================================================================
   * RENDER
   * ==================================================================== */
  const Badge: React.FC<{ c: ClienteX }> = ({ c }) => {
    const est = c.estado || "ativo";
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${estadoStyle[est]}`}>
        {est}
      </span>
    );
  };

  const docLabel = (c: ClienteX) =>
    c.nif ? `NIF: ${c.nif}` : c.bi ? `BI: ${c.bi}` : c.passaporte ? `Pass.: ${c.passaporte}` : "Consumidor Final";

  const KPI: React.FC<{ icon: React.ReactNode; label: string; value: string; tone: string; sub?: string }> = ({
    icon, label, value, tone, sub,
  }) => (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
        <div className="text-base font-black text-slate-900 truncate">{value}</div>
        {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[70] px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg text-white ${
            toast.kind === "ok" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" /> Registo de Clientes e Pacientes
          </h2>
          <p className="text-xs text-slate-500">
            Gestão completa: cadastro, crédito, dívidas, histórico e facturação
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportCSV(filteredClientes)}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button
            onClick={() => printList(filteredClientes)}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> PDF / Imprimir
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPI icon={<Users className="w-5 h-5 text-sky-700" />} tone="bg-sky-50" label="Clientes"
          value={String(resumo.total)} sub={`${resumo.ativos} activos`} />
        <KPI icon={<UserPlus className="w-5 h-5 text-emerald-700" />} tone="bg-emerald-50" label="Novos este mês"
          value={String(resumo.novosMes)} />
        <KPI icon={<Wallet className="w-5 h-5 text-amber-700" />} tone="bg-amber-50" label="Total em dívida"
          value={money(resumo.totalDivida)} sub={`${resumo.devedores} devedor(es)`} />
        <KPI icon={<Clock className="w-5 h-5 text-rose-700" />} tone="bg-rose-50" label="Vencido"
          value={money(resumo.totalVencido)} />
        <KPI icon={<Ban className="w-5 h-5 text-slate-600" />} tone="bg-slate-100" label="Bloqueados"
          value={String(resumo.bloqueados)} />
      </div>

      {/* Pesquisa + controlos */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome, NIF, BI, passaporte, telefone, email, endereço ou etiqueta..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500 focus:bg-white transition"
            />
          </div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
          >
            <option value="nome">Ordenar: Nome (A-Z)</option>
            <option value="recentes">Mais recentes</option>
            <option value="maior_comprador">Maiores compradores</option>
            <option value="maior_divida">Maior dívida</option>
            <option value="ultima_compra">Última compra</option>
          </select>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 ${
              showFilters || activeFilters ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            <Filter className="w-4 h-4" /> Filtros{activeFilters ? ` (${activeFilters})` : ""}
          </button>
          <div className="flex border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-2 ${viewMode === "cards" ? "bg-sky-500 text-white" : "bg-white text-slate-500"}`}
              title="Cartões"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 ${viewMode === "table" ? "bg-sky-500 text-white" : "bg-white text-slate-500"}`}
              title="Tabela"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100">
            <select value={fEstado} onChange={(e) => setFEstado(e.target.value as any)} className={inputCls + " !text-xs"}>
              <option value="todos">Estado: todos</option>
              <option value="ativo">Activo</option>
              <option value="inativo">Inactivo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
            <select value={fTipo} onChange={(e) => setFTipo(e.target.value as any)} className={inputCls + " !text-xs"}>
              <option value="todos">Tipo: todos</option>
              <option value="particular">Particular</option>
              <option value="empresa">Empresa</option>
            </select>
            <select value={fCategoria} onChange={(e) => setFCategoria(e.target.value as any)} className={inputCls + " !text-xs"}>
              <option value="todos">Categoria: todas</option>
              <option value="normal">Normal</option>
              <option value="vip">VIP</option>
              <option value="revendedor">Revendedor</option>
              <option value="corporativo">Corporativo</option>
            </select>
            <select value={fProvincia} onChange={(e) => setFProvincia(e.target.value)} className={inputCls + " !text-xs"}>
              <option value="todas">Província: todas</option>
              {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" checked={fSoDevedores} onChange={(e) => setFSoDevedores(e.target.checked)} />
              Só devedores
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" checked={fSoVencidos} onChange={(e) => setFSoVencidos(e.target.checked)} />
              Só vencidos
            </label>
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="text-xs font-bold text-rose-600 hover:underline text-left col-span-2">
                Limpar filtros
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>
            {filteredClientes.length} de {clientes.length} cliente(s)
          </span>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-sky-700">{selected.size} seleccionado(s)</span>
              <button
                onClick={() => exportCSV(clientes.filter((c) => selected.has(c.id)))}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
              >
                Exportar
              </button>
              <button
                onClick={inativarSelecionados}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
              >
                Inactivar
              </button>
              <button onClick={() => setSelected(new Set())} className="px-2 py-1 text-rose-600 font-bold">
                Limpar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista vazia */}
      {filteredClientes.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-2">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Nenhum cliente encontrado</p>
          <p className="text-xs text-slate-500">Ajuste a pesquisa ou os filtros, ou registe um novo cliente.</p>
        </div>
      )}

      {/* Vista cartões */}
      {viewMode === "cards" && filteredClientes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pageItems.map((c) => {
            const s = getStats(c);
            const tipo = c.tipo || "particular";
            return (
              <div
                key={c.id}
                className={`bg-white p-5 rounded-2xl border shadow-sm hover:border-sky-300 transition-all flex flex-col justify-between space-y-4 ${
                  selected.has(c.id) ? "border-sky-400 ring-2 ring-sky-100" : "border-slate-200"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleSel(c.id)}
                        className="shrink-0"
                      />
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        {c.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{c.nome}</h4>
                        <span className="text-[11px] text-sky-700 font-mono font-semibold">{docLabel(c)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => { setDrawerId(c.id); setDrawerTab("resumo"); }}
                        className="p-1 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition" title="Ver ficha">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleOpenEdit(c)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition" title="Editar">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setToDelete(c)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge c={c} />
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                      {tipo === "empresa" ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {tipo === "empresa" ? "Empresa" : "Particular"}
                    </span>
                    {(c.categoria || "normal") !== "normal" && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${catStyle[c.categoria!]}`}>
                        {c.categoria === "vip" && <Star className="w-3 h-3" />}
                        {c.categoria}
                      </span>
                    )}
                    {s.acimaLimite && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Acima do limite
                      </span>
                    )}
                    {s.nVencidas > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                        {s.nVencidas} vencida(s)
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    {c.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <a href={`tel:+244${normPhone(c.telefone)}`} className="hover:text-sky-700">{c.telefone}</a>
                        <a href={waLink(c.telefone)} target="_blank" rel="noreferrer"
                          className="ml-auto text-emerald-600 hover:text-emerald-700" title="WhatsApp">
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <a href={`mailto:${c.email}`} className="truncate hover:text-sky-700">{c.email}</a>
                      </div>
                    )}
                    {(c.endereco || c.municipio) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">
                          {[c.endereco, c.municipio, c.provincia].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Facturado</span>
                      <span className="text-xs font-black text-slate-900">{money(s.totalFacturado)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Em dívida</span>
                      <span className={`text-xs font-black ${s.emDivida > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {money(s.emDivida)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Última compra</span>
                      <span className="text-xs font-bold text-slate-700">{fmtData(s.ultimaCompra)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {onFaturarCliente && (
                      <button
                        onClick={() => onFaturarCliente(c)}
                        disabled={!podeFacturar(c)}
                        title={podeFacturar(c) ? "Emitir factura" : "Cliente inactivo ou bloqueado"}
                        className="flex-1 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-500 hover:text-white disabled:opacity-40 disabled:hover:bg-sky-50 disabled:hover:text-sky-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Facturar
                      </button>
                    )}
                    {s.emDivida > 0 && c.telefone && (
                      <button
                        onClick={() => cobrarWhatsApp(c)}
                        className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white rounded-lg text-xs font-bold transition"
                        title="Enviar cobrança por WhatsApp"
                      >
                        Cobrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista tabela */}
      {viewMode === "table" && filteredClientes.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase">
              <tr>
                <th className="p-3 w-8">
                  <input type="checkbox" checked={allPageSelected} onChange={togglePage} />
                </th>
                <th className="p-3 text-left">Cliente</th>
                <th className="p-3 text-left">Documento</th>
                <th className="p-3 text-left">Contacto</th>
                <th className="p-3 text-left">Estado</th>
                <th className="p-3 text-right">Facturado</th>
                <th className="p-3 text-right">Em dívida</th>
                <th className="p-3 text-left">Última compra</th>
                <th className="p-3 text-right">Acções</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((c) => {
                const s = getStats(c);
                return (
                  <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3">
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSel(c.id)} />
                    </td>
                    <td className="p-3">
                      <button onClick={() => { setDrawerId(c.id); setDrawerTab("resumo"); }}
                        className="font-bold text-slate-900 hover:text-sky-700 text-left">
                        {c.nome}
                      </button>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {c.tipo || "particular"} · {c.categoria || "normal"}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-sky-700">{docLabel(c)}</td>
                    <td className="p-3">
                      <div>{c.telefone || "—"}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{c.email}</div>
                    </td>
                    <td className="p-3"><Badge c={c} /></td>
                    <td className="p-3 text-right font-bold">{money(s.totalFacturado)}</td>
                    <td className={`p-3 text-right font-bold ${s.emDivida > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {money(s.emDivida)}
                    </td>
                    <td className="p-3">{fmtData(s.ultimaCompra)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        {c.telefone && (
                          <a href={waLink(c.telefone)} target="_blank" rel="noreferrer"
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="WhatsApp">
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        {onFaturarCliente && podeFacturar(c) && (
                          <button onClick={() => onFaturarCliente(c)}
                            className="p-1 text-sky-600 hover:bg-sky-50 rounded-lg" title="Facturar">
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleOpenEdit(c)}
                          className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setToDelete(c)}
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {filteredClientes.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            Por página
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-2 py-1 bg-white">
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold">Página {page} de {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===================== PAINEL LATERAL: FICHA DO CLIENTE ===================== */}
      {drawerCliente && drawerStats && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/50 backdrop-blur-sm" onClick={() => setDrawerId(null)}>
          <div className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-slate-900 text-white flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="font-bold text-base truncate">{drawerCliente.nome}</h3>
                <p className="text-[11px] text-slate-300 font-mono">{docLabel(drawerCliente)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge c={drawerCliente} />
                </div>
              </div>
              <button onClick={() => setDrawerId(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-200 text-xs font-bold overflow-x-auto">
              {([
                ["resumo", "Resumo"],
                ["facturas", `Facturas (${drawerFaturas.length})`],
                ["conta", "Conta corrente"],
                ["produtos", "Produtos"],
                ["notas", "Notas"],
              ] as [DrawerTab, string][]).map(([k, label]) => (
                <button key={k} onClick={() => setDrawerTab(k)}
                  className={`px-4 py-3 whitespace-nowrap border-b-2 ${
                    drawerTab === k ? "border-sky-500 text-sky-700" : "border-transparent text-slate-500"
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-4 flex-1">
              {drawerTab === "resumo" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Total facturado", money(drawerStats.totalFacturado), "text-slate-900"],
                      ["Total pago", money(drawerStats.totalPago), "text-emerald-600"],
                      ["Em dívida", money(drawerStats.emDivida), drawerStats.emDivida > 0 ? "text-rose-600" : "text-emerald-600"],
                      ["Vencido", money(drawerStats.vencido), drawerStats.vencido > 0 ? "text-rose-600" : "text-slate-900"],
                      ["Nº de facturas", String(drawerStats.nFaturas), "text-slate-900"],
                      ["Ticket médio", money(drawerStats.ticketMedio), "text-slate-900"],
                    ].map(([l, v, cls]) => (
                      <div key={l} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">{l}</div>
                        <div className={`text-sm font-black ${cls}`}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {(drawerCliente.limiteCredito || 0) > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                        <span>Limite de crédito</span>
                        <span>{money(drawerStats.emDivida)} / {money(drawerCliente.limiteCredito!)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${drawerStats.acimaLimite ? "bg-rose-500" : "bg-sky-500"}`}
                          style={{ width: `${Math.min(100, (drawerStats.emDivida / drawerCliente.limiteCredito!) * 100)}%` }}
                        />
                      </div>
                      {drawerStats.acimaLimite && (
                        <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Cliente ultrapassou o limite de crédito
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 text-xs text-slate-700">
                    {[
                      ["Tipo", drawerCliente.tipo === "empresa" ? "Empresa" : "Particular"],
                      ["Categoria", drawerCliente.categoria || "normal"],
                      ["Contacto", drawerCliente.contactoPessoa],
                      ["Telefone", drawerCliente.telefone],
                      ["Email", drawerCliente.email],
                      ["Endereço", [drawerCliente.endereco, drawerCliente.municipio, drawerCliente.provincia].filter(Boolean).join(", ")],
                      ["Data nascimento", drawerCliente.dataNascimento ? fmtData(drawerCliente.dataNascimento) : ""],
                      ["Prazo pagamento", drawerCliente.prazoPagamento ? `${drawerCliente.prazoPagamento} dias` : "Pronto pagamento"],
                      ["Desconto", drawerCliente.desconto ? `${drawerCliente.desconto}%` : ""],
                    ].filter(([, v]) => v).map(([l, v]) => (
                      <div key={l as string} className="flex justify-between gap-4 border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400">{l}</span>
                        <span className="font-semibold text-right capitalize-first">{v}</span>
                      </div>
                    ))}
                  </div>

                  {(drawerCliente.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {drawerCliente.tags!.map((t) => (
                        <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">#{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {onFaturarCliente && (
                      <button onClick={() => onFaturarCliente(drawerCliente)} disabled={!podeFacturar(drawerCliente)}
                        className="px-3 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <FileText className="w-4 h-4" /> Nova factura
                      </button>
                    )}
                    {drawerCliente.telefone && (
                      <a href={waLink(drawerCliente.telefone)} target="_blank" rel="noreferrer"
                        className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                    )}
                    {drawerStats.emDivida > 0 && drawerCliente.telefone && (
                      <button onClick={() => cobrarWhatsApp(drawerCliente)}
                        className="px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white rounded-xl text-xs font-bold">
                        Cobrar dívida
                      </button>
                    )}
                    <button onClick={() => { setDrawerId(null); handleOpenEdit(drawerCliente); }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <Edit2 className="w-4 h-4" /> Editar
                    </button>
                    {(drawerCliente.estado || "ativo") === "bloqueado" ? (
                      <button onClick={() => alterarEstado(drawerCliente, "ativo")}
                        className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Desbloquear
                      </button>
                    ) : (
                      <button onClick={() => alterarEstado(drawerCliente, "bloqueado")}
                        className="px-3 py-2 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <Ban className="w-4 h-4" /> Bloquear
                      </button>
                    )}
                    {drawerCliente.telefone && (
                      <button onClick={() => copiar(drawerCliente.telefone!)}
                        className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <Copy className="w-4 h-4" /> Copiar tel.
                      </button>
                    )}
                  </div>
                </>
              )}

              {drawerTab === "facturas" && (
                drawerFaturas.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">Este cliente ainda não tem facturas.</p>
                ) : (
                  <div className="space-y-2">
                    {drawerFaturas.map((f) => {
                      const total = Number(f.total) || 0;
                      const aberto = Math.max(0, total - fatPago(f));
                      return (
                        <div key={f.id} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900">{fatNumero(f)}</div>
                            <div className="text-[10px] text-slate-400">
                              {fmtData(fatData(f))}
                              {fatVenc(f) ? ` · vence ${fmtData(fatVenc(f))}` : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-black">{money(total)}</div>
                            {aberto > 0 && !NAO_CONTA.includes(f.estado) && (
                              <div className="text-[10px] text-rose-600 font-bold">Em aberto {money(aberto)}</div>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${fatEstadoStyle(f.estado)}`}>
                            {f.estado}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {drawerTab === "conta" && (
                contaCorrente.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">Sem movimentos.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="text-[10px] uppercase text-slate-400">
                          <tr>
                            <th className="text-left py-2">Data</th>
                            <th className="text-left">Descrição</th>
                            <th className="text-right">Débito</th>
                            <th className="text-right">Crédito</th>
                            <th className="text-right">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contaCorrente.map((m, i) => (
                            <tr key={i} className="border-t border-slate-100">
                              <td className="py-2">{fmtData(m.data)}</td>
                              <td>{m.desc}</td>
                              <td className="text-right">{m.debito ? money(m.debito) : ""}</td>
                              <td className="text-right text-emerald-600">{m.credito ? money(m.credito) : ""}</td>
                              <td className={`text-right font-bold ${m.saldo > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                {money(m.saldo)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-between bg-slate-50 rounded-xl p-3 text-xs font-bold">
                      <span>Saldo actual</span>
                      <span className={drawerStats.emDivida > 0 ? "text-rose-600" : "text-emerald-600"}>
                        {money(contaCorrente[contaCorrente.length - 1].saldo)}
                      </span>
                    </div>
                  </>
                )
              )}

              {drawerTab === "produtos" && (
                topProdutos.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">Sem itens comprados registados.</p>
                ) : (
                  <div className="space-y-2">
                    {topProdutos.map((p, i) => (
                      <div key={p.nome} className="flex items-center gap-3 border border-slate-200 rounded-xl p-3">
                        <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-700 text-xs font-black flex items-center justify-center">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate">{p.nome}</div>
                          <div className="text-[10px] text-slate-400">{p.qtd} un.</div>
                        </div>
                        <div className="text-xs font-black">{money(p.valor)}</div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {drawerTab === "notas" && (
                <div className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-xl p-4 border border-slate-100 min-h-[100px]">
                  {drawerCliente.observacoes || "Sem observações. Use Editar para adicionar notas internas."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL ADICIONAR / EDITAR ===================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">{editingCliente ? "Editar Cliente" : "Registar Novo Cliente"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex border-b border-slate-200 text-xs font-bold">
              {([
                ["dados", "Dados"],
                ["contacto", "Contacto e morada"],
                ["financeiro", "Financeiro"],
                ["notas", "Notas"],
              ] as [FormTab, string][]).map(([k, label]) => (
                <button key={k} type="button" onClick={() => setFormTab(k)}
                  className={`flex-1 px-3 py-3 border-b-2 ${
                    formTab === k ? "border-sky-500 text-sky-700" : "border-transparent text-slate-500"
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto flex flex-col">
              <div className="p-6 space-y-4 flex-1">
                {(dupBlock.length > 0 || (dupWarn.length > 0 && ignoreWarn)) && (
                  <div className="space-y-2">
                    {dupBlock.length > 0 && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Duplicado — não é possível guardar
                        </div>
                        {dupBlock.map((d) => <div key={d}>• {d}</div>)}
                      </div>
                    )}
                    {dupWarn.length > 0 && ignoreWarn && dupBlock.length === 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Possível duplicado
                        </div>
                        {dupWarn.map((d) => <div key={d}>• {d}</div>)}
                        <div className="font-semibold pt-1">Clique novamente em guardar para confirmar.</div>
                      </div>
                    )}
                  </div>
                )}

                {formTab === "dados" && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Nome Completo / Empresa *</label>
                      <input type="text" value={formData.nome} autoFocus
                        onChange={(e) => setField("nome", e.target.value)}
                        placeholder="Nome do cliente ou denominação social..."
                        className={inputCls + " font-semibold"} />
                      {errors.nome && <p className={errCls}>{errors.nome}</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Tipo</label>
                        <select value={formData.tipo} onChange={(e) => setField("tipo", e.target.value as TipoCliente)} className={inputCls}>
                          <option value="particular">Particular</option>
                          <option value="empresa">Empresa</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Categoria</label>
                        <select value={formData.categoria} onChange={(e) => setField("categoria", e.target.value as Categoria)} className={inputCls}>
                          <option value="normal">Normal</option>
                          <option value="vip">VIP</option>
                          <option value="revendedor">Revendedor</option>
                          <option value="corporativo">Corporativo</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Estado</label>
                        <select value={formData.estado} onChange={(e) => setField("estado", e.target.value as EstadoCliente)} className={inputCls}>
                          <option value="ativo">Activo</option>
                          <option value="inativo">Inactivo</option>
                          <option value="bloqueado">Bloqueado</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">NIF (9 ou 10 dígitos)</label>
                        <input type="text" value={formData.nif} inputMode="numeric" maxLength={10}
                          onChange={(e) => setField("nif", onlyDigits(e.target.value))}
                          placeholder="Ex: 5417082910" className={inputCls + " font-mono"} />
                        {errors.nif && <p className={errCls}>{errors.nif}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">BI Angolano (14 caracteres)</label>
                        <input type="text" value={formData.bi} maxLength={14}
                          onChange={(e) => setField("bi", e.target.value.toUpperCase())}
                          placeholder="Ex: 005489123LA042" className={inputCls + " font-mono uppercase"} />
                        {errors.bi && <p className={errCls}>{errors.bi}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Passaporte (estrangeiros)</label>
                        <input type="text" value={formData.passaporte} maxLength={9}
                          onChange={(e) => setField("passaporte", e.target.value.toUpperCase())}
                          placeholder="Ex: N1234567" className={inputCls + " font-mono uppercase"} />
                        {errors.passaporte && <p className={errCls}>{errors.passaporte}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">
                          {formData.tipo === "empresa" ? "Data de constituição" : "Data de nascimento"}
                        </label>
                        <input type="date" value={formData.dataNascimento}
                          onChange={(e) => setField("dataNascimento", e.target.value)} className={inputCls} />
                        {errors.dataNascimento && <p className={errCls}>{errors.dataNascimento}</p>}
                      </div>
                    </div>
                  </>
                )}

                {formTab === "contacto" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Telefone</label>
                        <input type="text" value={formData.telefone}
                          onChange={(e) => setField("telefone", e.target.value)}
                          placeholder="+244 9XX XXX XXX" className={inputCls} />
                        {errors.telefone && <p className={errCls}>{errors.telefone}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Email</label>
                        <input type="email" value={formData.email}
                          onChange={(e) => setField("email", e.target.value)}
                          placeholder="cliente@exemplo.ao" className={inputCls} />
                        {errors.email && <p className={errCls}>{errors.email}</p>}
                      </div>
                    </div>

                    {formData.tipo === "empresa" && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Pessoa de contacto</label>
                        <input type="text" value={formData.contactoPessoa}
                          onChange={(e) => setField("contactoPessoa", e.target.value)}
                          placeholder="Nome do responsável" className={inputCls} />
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Endereço Completo</label>
                      <input type="text" value={formData.endereco}
                        onChange={(e) => setField("endereco", e.target.value)}
                        placeholder="Rua, Bairro..." className={inputCls} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Município</label>
                        <input type="text" value={formData.municipio}
                          onChange={(e) => setField("municipio", e.target.value)}
                          placeholder="Ex: Talatona" className={inputCls} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Província</label>
                        <select value={formData.provincia} onChange={(e) => setField("provincia", e.target.value)} className={inputCls}>
                          {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {formTab === "financeiro" && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Limite de crédito ({moeda})</label>
                        <input type="number" min={0} value={formData.limiteCredito}
                          onChange={(e) => setField("limiteCredito", e.target.value)}
                          placeholder="0 = sem crédito" className={inputCls} />
                        {errors.limiteCredito && <p className={errCls}>{errors.limiteCredito}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Prazo (dias)</label>
                        <select value={formData.prazoPagamento} onChange={(e) => setField("prazoPagamento", e.target.value)} className={inputCls}>
                          <option value="0">Pronto pagamento</option>
                          <option value="15">15 dias</option>
                          <option value="30">30 dias</option>
                          <option value="45">45 dias</option>
                          <option value="60">60 dias</option>
                          <option value="90">90 dias</option>
                        </select>
                        {errors.prazoPagamento && <p className={errCls}>{errors.prazoPagamento}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Desconto (%)</label>
                        <input type="number" min={0} max={100} value={formData.desconto}
                          onChange={(e) => setField("desconto", e.target.value)} className={inputCls} />
                        {errors.desconto && <p className={errCls}>{errors.desconto}</p>}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      O limite é comparado com o valor em dívida do cliente. Clientes acima do limite são assinalados na lista.
                    </p>
                  </>
                )}

                {formTab === "notas" && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Etiquetas (separadas por vírgula)</label>
                      <input type="text" value={formData.tags}
                        onChange={(e) => setField("tags", e.target.value)}
                        placeholder="ex: seguro, frequente, parceiro" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Observações internas</label>
                      <textarea rows={6} value={formData.observacoes}
                        onChange={(e) => setField("observacoes", e.target.value)}
                        placeholder="Preferências, alergias, condições especiais, avisos..."
                        className={inputCls + " resize-none"} />
                    </div>
                  </>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-white">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 disabled:opacity-60 text-white text-xs font-bold shadow-sm">
                  {saving ? "A guardar..." : ignoreWarn && dupWarn.length ? "Guardar mesmo assim" : editingCliente ? "Guardar Alterações" : "Criar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL ELIMINAR ===================== */}
      {toDelete && (() => {
        const s = getStats(toDelete);
        const temHistorico = s.nFaturas > 0 || (faturas as any[]).some((f) => f.pacienteId === toDelete.id);
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  {temHistorico ? "Não é possível eliminar" : "Eliminar cliente?"}
                </h3>
              </div>
              {temHistorico ? (
                <p className="text-xs text-slate-600">
                  <b>{toDelete.nome}</b> tem {s.nFaturas} factura(s) associada(s). Por razões fiscais o histórico deve
                  ser mantido. Pode inactivar o cliente, que deixa de aparecer nas vendas mas conserva o histórico.
                </p>
              ) : (
                <p className="text-xs text-slate-600">
                  Vai remover <b>{toDelete.nome}</b>. Esta acção não pode ser desfeita.
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setToDelete(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300">
                  Cancelar
                </button>
                {temHistorico ? (
                  <button onClick={() => { alterarEstado(toDelete, "inativo"); setToDelete(null); }}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold">
                    Inactivar
                  </button>
                ) : (
                  <button onClick={confirmarEliminar}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold">
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};