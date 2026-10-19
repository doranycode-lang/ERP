import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../store/AppContext";
import { Produto } from "../types";
import { formatCurrency } from "../utils/faturaGenerator";
import { generateRandomBarcode } from "../utils/barcodeUtils";
import {
  Package, Plus, Search, AlertTriangle, Edit2, Trash2, QrCode, RefreshCw, Barcode,
  FileText, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUpDown, MoreVertical, Copy, Power, ShoppingCart, CalendarClock, X, Wallet,
  TrendingUp, CheckCircle2, Zap, ClipboardCheck, Upload, Truck, Printer, BarChart3,
} from "lucide-react";
import { ReportExportModal } from "../components/ReportExportModal";

/* ═════════ Utilitários de estoque ═════════ */
const DIAS_ALERTA_VALIDADE = 90;

type StockStatus = "zero" | "baixo" | "ok";
type ValidadeStatus = "expirado" | "breve" | "ok" | "sem";

/* ───────────── Datas (guardadas como DD/MM/AAAA) ───────────── */

function parseValidade(v?: string): Date | null {
  if (!v) return null;
  const s = v.trim();
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) {
    const d = new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** DD/MM/AAAA -> AAAA-MM-DD (para <input type="date">) */
function validadeToInput(v?: string): string {
  const d = parseValidade(v);
  if (!d) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** AAAA-MM-DD -> DD/MM/AAAA (formato guardado no sistema) */
function inputToValidade(v: string): string {
  if (!v) return "";
  const [y, m, d] = v.split("-");
  return `${d}/${m}/${y}`;
}

/* ───────────── Estados ───────────── */

function getStockStatus(p: Produto): StockStatus {
  if (p.stock <= 0) return "zero";
  if (p.stockMinimo > 0 && p.stock <= p.stockMinimo) return "baixo";
  return "ok";
}

function getValidadeStatus(p: Produto): { status: ValidadeStatus; dias: number | null } {
  const d = parseValidade(p.dataValidade);
  if (!d) return { status: "sem", dias: null };
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dias = Math.round((d.getTime() - hoje.getTime()) / 86400000);
  if (dias < 0) return { status: "expirado", dias };
  if (dias <= DIAS_ALERTA_VALIDADE) return { status: "breve", dias };
  return { status: "ok", dias };
}

/* ───────────── Preços ───────────── */

/** Margem sobre o preço de venda, em %. Devolve null se não houver custo. */
function margemPercent(preco: number, custo: number): number | null {
  if (!preco || preco <= 0 || !custo || custo <= 0) return null;
  return ((preco - custo) / preco) * 100;
}

/** Sugestão simples: repor até ao dobro do stock mínimo. */
function sugestaoReposicao(p: Produto): number {
  return Math.max(p.stockMinimo * 2 - p.stock, 0);
}

function prefixoCodigo(codigo: string): string {
  const m = codigo.match(/^[A-Za-z]+/);
  return m ? m[0].toUpperCase() : "";
}

/* ───────────── Exportação CSV (abre bem no Excel) ───────────── */

function exportarCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const content = [headers, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportarProdutosCSV(filename: string, produtos: Produto[], extras?: Record<string, ExtraProduto>) {
  exportarCSV(
    filename,
    [
      "Código", "Nome", "Categoria", "Código de Barras", "Localização", "Lote",
      "Validade", "Stock", "Stock Mínimo", "Unidade", "Preço Custo", "Preço Venda",
      "Margem %", "IVA Isento", "Ativo", "Fornecedor", "Preço Grosso",
    ],
    produtos.map((p) => {
      const m = margemPercent(p.preco, p.precoCusto || 0);
      return [
        p.codigo, p.nome, p.categoria || "", p.codigoBarras || "", p.localizacao || "",
        p.loteAtual || "", p.dataValidade || "", p.stock, p.stockMinimo, p.unidadeMedida,
        p.precoCusto || 0, p.preco, m === null ? "" : m.toFixed(1),
        p.ivaIsento ? "Sim" : "Não", p.ativo ? "Sim" : "Não", extras?.[p.codigo]?.fornecedor || "", extras?.[p.codigo]?.precoGrosso ?? "",
      ];
    })
  );
}

/* ───── Dados complementares (guardados neste navegador) ───── */
interface ExtraProduto { fornecedor?: string; precoGrosso?: number }
interface ItemEncomenda { codigo: string; nome: string; unidade: string; qtd: number; custo: number }
type EstadoEncomenda = "Rascunho" | "Enviada" | "Recebida" | "Cancelada";
interface Encomenda {
  id: string; numero: string; fornecedor: string; data: string;
  estado: EstadoEncomenda; itens: ItemEncomenda[];
}
interface LinhaImportacao {
  linha: number; codigo: string; nome: string; acao: "novo" | "atualizar" | "erro";
  erro?: string; dados: Record<string, any>; fornecedor?: string; precoGrosso?: number; idExistente?: string;
}

const SEM_FORNECEDOR = "Fornecedor não definido";

function lerLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function gravarLS(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* armazenamento indisponível */ }
}

/* ───── Importação CSV ───── */
function parseCSV(text: string): string[][] {
  const t = text.replace(/^\uFEFF/, "");
  const first = t.split(/\r?\n/)[0] || "";
  const delim = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"' && t[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const normKey = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

function parseNumero(v: string): number {
  let s = v.replace(/\s/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(",", ".");
  return Number(s);
}

const CABECALHOS_IMPORTACAO = [
  "Código", "Nome", "Categoria", "Código de Barras", "Localização", "Lote", "Validade",
  "Stock", "Stock Mínimo", "Unidade", "Preço Custo", "Preço Venda", "IVA Isento", "Ativo",
  "Fornecedor", "Preço Grosso",
];

function analisarImportacao(text: string, produtos: Produto[]): LinhaImportacao[] {
  const linhas = parseCSV(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (linhas.length < 2) return [];
  const alias: Record<string, string> = {
    codigo: "codigo", sku: "codigo", nome: "nome", produto: "nome", categoria: "categoria",
    codigodebarras: "codigoBarras", ean: "codigoBarras", localizacao: "localizacao",
    lote: "loteAtual", validade: "dataValidade", stock: "stock", stockminimo: "stockMinimo",
    minimo: "stockMinimo", unidade: "unidadeMedida", precocusto: "precoCusto", custo: "precoCusto",
    precovenda: "preco", preco: "preco", venda: "preco", ivaisento: "ivaIsento", ativo: "ativo",
    fornecedor: "fornecedor", precogrosso: "precoGrosso", grosso: "precoGrosso",
  };
  const cols: Record<string, number> = {};
  linhas[0].forEach((h, i) => {
    const k = alias[normKey(h)];
    if (k && cols[k] === undefined) cols[k] = i;
  });
  const existentes = new Map(produtos.map((p) => [p.codigo.toLowerCase(), p]));
  const vistos = new Set<string>();

  return linhas.slice(1).map((r, idx) => {
    const get = (k: string) => {
      const i = cols[k];
      const v = i === undefined ? undefined : (r[i] ?? "").trim();
      return v === "" ? undefined : v;
    };
    const codigo = get("codigo") || "";
    const nome = get("nome") || "";
    const base = { linha: idx + 2, codigo, nome, dados: {} as Record<string, any> };
    const erro = (msg: string): LinhaImportacao => ({ ...base, acao: "erro", erro: msg });

    if (cols.codigo === undefined) return erro("Coluna “Código” não encontrada.");
    if (!codigo) return erro("Código em falta.");
    const chave = codigo.toLowerCase();
    if (vistos.has(chave)) return erro("Código repetido no ficheiro.");
    vistos.add(chave);
    const existente = existentes.get(chave);
    if (!existente && !nome) return erro("Nome em falta.");

    let dados: Record<string, any> = {};
    for (const k of ["nome", "categoria", "codigoBarras", "localizacao", "loteAtual", "unidadeMedida"]) {
      const v = get(k);
      if (v !== undefined) dados[k] = v;
    }
    for (const k of ["preco", "precoCusto", "stock", "stockMinimo"]) {
      const v = get(k);
      if (v !== undefined) {
        const n = parseNumero(v);
        if (isNaN(n) || n < 0) return erro(`Valor inválido na coluna ${k}.`);
        dados[k] = k.startsWith("stock") ? Math.round(n) : n;
      }
    }
    const val = get("dataValidade");
    if (val !== undefined) {
      if (!parseValidade(val)) return erro("Validade inválida (use DD/MM/AAAA).");
      dados.dataValidade = val;
    }
    const iva = get("ivaIsento");
    if (iva !== undefined) dados.ivaIsento = /^(sim|s|true|1|yes)$/i.test(iva);
    const at = get("ativo");
    if (at !== undefined) dados.ativo = !/^(nao|não|n|false|0|no)$/i.test(at);

    if (!existente) {
      if (dados.preco === undefined || dados.preco <= 0) return erro("Preço de venda em falta.");
      dados = {
        categoria: "Geral", codigoBarras: "", precoCusto: 0, stock: 0, stockMinimo: 10,
        unidadeMedida: "un", localizacao: "", loteAtual: "", dataValidade: "",
        ivaIsento: false, descricao: "", ativo: true, ...dados,
      };
    }
    const g = get("precoGrosso");
    return {
      ...base,
      nome: nome || existente?.nome || "",
      acao: existente ? "atualizar" : "novo",
      dados,
      fornecedor: get("fornecedor"),
      precoGrosso: g !== undefined && !isNaN(parseNumero(g)) ? parseNumero(g) : undefined,
      idExistente: existente?.id,
    };
  });
}

/* ───── Impressão da encomenda de compra ───── */
function imprimirEncomenda(o: Encomenda, moeda: string) {
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const total = o.itens.reduce((s, i) => s + i.qtd * i.custo, 0);
  const linhas = o.itens
    .map((i, n) =>
      `<tr><td>${n + 1}</td><td>${esc(i.codigo)}</td><td>${esc(i.nome)}</td><td class="r">${i.qtd} ${esc(i.unidade)}</td><td class="r">${formatCurrency(i.custo, moeda)}</td><td class="r">${formatCurrency(i.qtd * i.custo, moeda)}</td></tr>`
    )
    .join("");
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>${esc(o.numero)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:32px;font-size:12px}
h1{font-size:18px;margin:0 0 4px}.m{color:#64748b;margin-bottom:20px}
table{width:100%;border-collapse:collapse}th{background:#f1f5f9;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
th,td{padding:8px;border-bottom:1px solid #e2e8f0}.r{text-align:right}
.t{margin-top:12px;text-align:right;font-size:14px;font-weight:bold}
.s{display:flex;gap:48px;margin-top:64px}.s div{flex:1;border-top:1px solid #94a3b8;padding-top:6px;color:#64748b}
</style></head><body>
<h1>Encomenda de compra ${esc(o.numero)}</h1>
<div class="m">Fornecedor: <b>${esc(o.fornecedor)}</b> &nbsp;·&nbsp; Data: ${esc(o.data)}</div>
<table><thead><tr><th>#</th><th>Código</th><th>Produto</th><th class="r">Quantidade</th><th class="r">Custo unit.</th><th class="r">Total</th></tr></thead><tbody>${linhas}</tbody></table>
<div class="t">Total estimado: ${formatCurrency(total, moeda)}</div>
<div class="s"><div>Elaborado por</div><div>Aprovado por</div></div>
</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

/* ═════════ Imagem do produto ═════════ */
/** Lê a fotografia de produtos antigos que possam usar um nome de campo diferente. */
function obterImagemCadastro(produto: Produto | null | undefined): string {
  if (!produto) return "";
  const item = produto as unknown as Record<string, unknown>;
  const candidatos = [
    item.imagem, item.image, item.imageUrl, item.imageURL, item.imagemUrl,
    item.imagemURL, item.urlImagem, item.foto, item.fotoUrl, item.fotoProduto,
    item.fotografia, item.photo, item.photoUrl, item.thumbnail, item.img,
    item.imgUrl, item.imagemProduto, item.imagemPrincipal,
  ];
  for (const candidato of candidatos) {
    if (typeof candidato === "string" && candidato.trim()) return candidato.trim();
    if (candidato && typeof candidato === "object" && !Array.isArray(candidato)) {
      const obj = candidato as Record<string, unknown>;
      for (const chave of ["url", "src", "dataUrl", "dataURL", "base64", "path"]) {
        const valor = obj[chave];
        if (typeof valor === "string" && valor.trim()) return valor.trim();
      }
    }
  }
  return "";
}

/** Reduz a fotografia no navegador para não guardar ficheiros enormes no produto. */
function comprimirImagemProduto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Escolha um ficheiro de imagem válido."));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error("A imagem deve ter menos de 12 MB."));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 720;
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Não foi possível processar a imagem.");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resultado = canvas.toDataURL("image/jpeg", 0.78);
        URL.revokeObjectURL(objectUrl);
        if (resultado.length > 1_000_000) {
          reject(new Error("A imagem ainda ficou muito grande. Escolha uma imagem mais pequena."));
          return;
        }
        resolve(resultado);
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error instanceof Error ? error : new Error("Erro ao processar a imagem."));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível abrir esta imagem."));
    };
    img.src = objectUrl;
  });
}

/* ═════════ Formulário de produto ═════════ */
interface ProdutoFormData {
  nome: string;
  codigo: string;
  codigoBarras: string;
  categoria: string;
  preco: number;
  precoCusto: number;
  stock: number;
  stockMinimo: number;
  unidadeMedida: string;
  localizacao: string;
  loteAtual: string;
  dataValidade: string; // DD/MM/AAAA
  ivaIsento: boolean;
  descricao: string;
  imagem: string;
  ativo: boolean;
  fornecedor: string;
  precoGrosso: number;
}

interface Props {
  open: boolean;
  produto: Produto | null;
  categorias: string[];
  codigosEmUso: Set<string>; // códigos de OUTROS produtos (em minúsculas)
  moeda: string;
  codigoSugerido: string;
  extras?: ExtraProduto;
  fornecedores?: string[];
  onClose: () => void;
  onSave: (data: ProdutoFormData) => Promise<void> | void;
}

type FormState = Record<keyof ProdutoFormData, string | boolean>;

const inputCls =
  "w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition";

const Field: React.FC<{ label: string; error?: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }> = ({
  label, error, hint, action, children,
}) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      {action}
    </div>
    {children}
    {error ? (
      <p className="text-[11px] text-rose-600 font-medium mt-1">{error}</p>
    ) : hint ? (
      <p className="text-[11px] text-slate-400 mt-1">{hint}</p>
    ) : null}
  </div>
);

const Section: React.FC<{ title: string; tone?: "slate" | "amber"; children: React.ReactNode }> = ({
  title, tone = "slate", children,
}) => (
  <fieldset className={`rounded-md border p-4 space-y-3 ${tone === "amber" ? "border-amber-200 bg-amber-50/40" : "border-slate-200 bg-slate-50/50"}`}>
    <legend className="px-2 text-xs font-semibold text-slate-600">{title}</legend>
    {children}
  </fieldset>
);

const emptyState = (codigo: string, categoria: string): FormState => ({
  nome: "", codigo, codigoBarras: generateRandomBarcode(), categoria,
  preco: "", precoCusto: "", stock: "0", stockMinimo: "10",
  unidadeMedida: "un", localizacao: "Armazém A",
  loteAtual: `LT-${new Date().getFullYear()}-01`, dataValidade: "",
  ivaIsento: false, descricao: "", imagem: "", ativo: true, fornecedor: "", precoGrosso: "",
});

const ProductFormModal: React.FC<Props> = ({
  open, produto, categorias, codigosEmUso, moeda, codigoSugerido, extras, fornecedores, onClose, onSave,
}) => {
  const [f, setF] = useState<FormState>(emptyState("", ""));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setSaving(false);
    if (produto) {
      setF({
        nome: produto.nome, codigo: produto.codigo, codigoBarras: produto.codigoBarras || "",
        categoria: produto.categoria || "Geral", preco: String(produto.preco),
        precoCusto: String(produto.precoCusto || ""), stock: String(produto.stock),
        stockMinimo: String(produto.stockMinimo), unidadeMedida: produto.unidadeMedida,
        localizacao: produto.localizacao || "", loteAtual: produto.loteAtual || "",
        dataValidade: validadeToInput(produto.dataValidade), ivaIsento: produto.ivaIsento,
        descricao: produto.descricao || "", imagem: obterImagemCadastro(produto), ativo: produto.ativo,
        fornecedor: extras?.fornecedor || "", precoGrosso: extras?.precoGrosso ? String(extras.precoGrosso) : "",
      });
    } else {
      setF(emptyState(codigoSugerido, categorias[0] || "Geral"));
    }
  }, [open, produto, codigoSugerido, categorias, extras]);

  if (!open) return null;

  const set = (k: keyof ProdutoFormData, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));
  const num = (k: keyof ProdutoFormData) => parseFloat(String(f[k]).replace(",", ".")) || 0;

  const preco = num("preco");
  const custo = num("precoCusto");
  const margem = margemPercent(preco, custo);
  const lucroUnit = preco - custo;
  const prejuizo = custo > 0 && preco > 0 && preco < custo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!String(f.nome).trim()) err.nome = "Indique o nome do produto.";
    const cod = String(f.codigo).trim();
    if (!cod) err.codigo = "Indique o código.";
    else if (codigosEmUso.has(cod.toLowerCase())) err.codigo = "Este código já existe noutro produto.";
    if (preco <= 0) err.preco = "O preço de venda deve ser maior que zero.";
    if (num("precoGrosso") > 0 && num("precoGrosso") >= preco) err.precoGrosso = "O preço por grosso deve ser inferior ao preço de venda.";
    if (num("stock") < 0) err.stock = "O stock não pode ser negativo.";
    setErrors(err);
    if (Object.keys(err).length) return;

    setSaving(true);
    try {
      await onSave({
        nome: String(f.nome).trim(),
        codigo: cod,
        codigoBarras: String(f.codigoBarras).trim(),
        categoria: String(f.categoria).trim() || "Geral",
        preco,
        precoCusto: custo,
        stock: Math.round(num("stock")),
        stockMinimo: Math.round(num("stockMinimo")),
        unidadeMedida: String(f.unidadeMedida),
        localizacao: String(f.localizacao).trim(),
        loteAtual: String(f.loteAtual).trim(),
        dataValidade: inputToValidade(String(f.dataValidade)),
        ivaIsento: Boolean(f.ivaIsento),
        descricao: String(f.descricao).trim(),
        imagem: String(f.imagem || ""),
        ativo: Boolean(f.ativo),
        fornecedor: String(f.fornecedor).trim(),
        precoGrosso: num("precoGrosso"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200 max-h-[92vh]">
        <div className="px-6 py-4 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{produto ? "Editar produto" : "Novo produto"}</h3>
              <p className="text-xs text-slate-500">Preços, stock, lote e validade num só lugar</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <Section title="Identificação">
            <Field label="Nome do produto *" error={errors.nome}>
              <input
                type="text" autoFocus value={String(f.nome)} onChange={(e) => set("nome", e.target.value)}
                placeholder="Ex: Paracetamol 500mg (20 comprimidos)" className={`${inputCls} font-semibold`}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Código / SKU *" error={errors.codigo}>
                <input type="text" value={String(f.codigo)} onChange={(e) => set("codigo", e.target.value)} className={`${inputCls} font-mono`} />
              </Field>
              <Field
                label="Código de barras"
                action={
                  <button type="button" onClick={() => set("codigoBarras", generateRandomBarcode())}
                    className="text-[11px] font-semibold text-sky-600 hover:underline flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Gerar EAN-13
                  </button>
                }
              >
                <input type="text" value={String(f.codigoBarras)} onChange={(e) => set("codigoBarras", e.target.value)} className={`${inputCls} font-mono`} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Categoria">
                <input type="text" list="cat-options" value={String(f.categoria)} onChange={(e) => set("categoria", e.target.value)} className={inputCls} />
                <datalist id="cat-options">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
              </Field>
              <Field label="Unidade">
                <select value={String(f.unidadeMedida)} onChange={(e) => set("unidadeMedida", e.target.value)} className={inputCls}>
                  <option value="un">Unidade (un)</option>
                  <option value="cx">Caixa (cx)</option>
                  <option value="fr">Frasco (fr)</option>
                  <option value="kg">Quilograma (kg)</option>
                  <option value="l">Litro (l)</option>
                  <option value="exame">Exame</option>
                  <option value="serv">Serviço</option>
                </select>
              </Field>
              <Field label="Localização">
                <input type="text" value={String(f.localizacao)} onChange={(e) => set("localizacao", e.target.value)} placeholder="Armazém A - Prat. 2" className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section title="Fotografia do produto">
            <div className="grid grid-cols-1 sm:grid-cols-[140px_minmax(0,1fr)] gap-4 items-start">
              <div className="w-32 h-32 rounded-lg border border-dashed border-slate-300 bg-white overflow-hidden flex items-center justify-center">
                {String(f.imagem || "").trim() ? (
                  <img
                    src={String(f.imagem)}
                    alt={`Pré-visualização de ${String(f.nome || "produto")}`}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400 text-xs text-center px-2">
                    <Package className="w-8 h-8 opacity-60" />
                    Sem fotografia
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Field
                  label="Imagem / fotografia"
                  error={errors.imagem}
                  hint="Formatos de imagem comuns. A fotografia é reduzida para facilitar o carregamento no POS."
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-sky-700 hover:file:bg-sky-100"
                    onChange={(event) => {
                      const input = event.currentTarget;
                      const file = input.files?.[0];
                      input.value = "";
                      if (!file) return;
                      setErrors((prev) => ({ ...prev, imagem: "" }));
                      void comprimirImagemProduto(file)
                        .then((imagem) => set("imagem", imagem))
                        .catch((error: unknown) => {
                          setErrors((prev) => ({
                            ...prev,
                            imagem: error instanceof Error ? error.message : "Não foi possível carregar a imagem.",
                          }));
                        });
                    }}
                  />
                </Field>
                {String(f.imagem || "").trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      set("imagem", "");
                      setErrors((prev) => ({ ...prev, imagem: "" }));
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remover fotografia
                  </button>
                )}
                <p className="text-[11px] text-slate-500">A mesma imagem será usada nos cartões dos produtos e no carrinho do POS.</p>
              </div>
            </div>
          </Section>

          <Section title="Preços">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label={`Preço de venda (${moeda}) *`} error={errors.preco}>
                <input type="number" min={0} step="0.01" value={String(f.preco)} onChange={(e) => set("preco", e.target.value)} className={`${inputCls} font-semibold text-sky-900`} />
              </Field>
              <Field label={`Preço de custo (${moeda})`}>
                <input type="number" min={0} step="0.01" value={String(f.precoCusto)} onChange={(e) => set("precoCusto", e.target.value)} className={`${inputCls} font-semibold`} />
              </Field>
            </div>

            {(preco > 0 || custo > 0) && (
              <div className={`rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-2 ${prejuizo ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                {prejuizo && <AlertTriangle className="w-4 h-4 shrink-0" />}
                {margem === null
                  ? "Indique o preço de custo para ver a margem."
                  : prejuizo
                  ? `Venda abaixo do custo: prejuízo de ${formatCurrency(Math.abs(lucroUnit), moeda)} por unidade.`
                  : `Lucro de ${formatCurrency(lucroUnit, moeda)} por unidade (margem ${margem.toFixed(1)}%).`}
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" checked={Boolean(f.ivaIsento)} onChange={(e) => set("ivaIsento", e.target.checked)} className="rounded accent-sky-500" />
              <span>Isento de IVA (Regime M04 - Artigo 12º do CIVA)</span>
            </label>
          </Section>

          <Section title="Compras e preço por grosso">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Fornecedor habitual" hint="Usado para agrupar a reposição em encomendas de compra.">
                <input type="text" list="forn-options" value={String(f.fornecedor)} onChange={(e) => set("fornecedor", e.target.value)} className={inputCls} />
                <datalist id="forn-options">{(fornecedores || []).map((x) => <option key={x} value={x} />)}</datalist>
              </Field>
              <Field label={`Preço por grosso (${moeda})`} error={errors.precoGrosso} hint="Opcional. Deve ser inferior ao preço de venda.">
                <input type="number" min={0} step="0.01" value={String(f.precoGrosso)} onChange={(e) => set("precoGrosso", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section title="Stock">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label={produto ? "Stock atual" : "Stock inicial"} error={errors.stock}
                hint={produto ? "Para entradas e saídas use “Movimentar stock”, que fica registado." : undefined}>
                <input type="number" min={0} value={String(f.stock)} onChange={(e) => set("stock", e.target.value)} className={`${inputCls} font-semibold`} />
              </Field>
              <Field label="Stock mínimo (alerta de reposição)">
                <input type="number" min={0} value={String(f.stockMinimo)} onChange={(e) => set("stockMinimo", e.target.value)} className={`${inputCls} font-semibold`} />
              </Field>
            </div>
          </Section>

          <Section title="Lote e validade" tone="amber">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Lote ativo">
                <input type="text" value={String(f.loteAtual)} onChange={(e) => set("loteAtual", e.target.value)} placeholder="Ex: LT-2026-A1" className={`${inputCls} font-mono`} />
              </Field>
              <Field label="Data de validade" hint="Deixe vazio se o produto não expira.">
                <input type="date" value={String(f.dataValidade)} onChange={(e) => set("dataValidade", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          <Field label="Descrição / notas internas">
            <textarea rows={2} value={String(f.descricao)} onChange={(e) => set("descricao", e.target.value)} className={inputCls} />
          </Field>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" checked={Boolean(f.ativo)} onChange={(e) => set("ativo", e.target.checked)} className="rounded accent-sky-500" />
            <span>Produto ativo (inativos não aparecem nas vendas)</span>
          </label>

          <div className="pt-4 flex gap-3 border-t border-slate-200">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold transition">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-md bg-sky-700 hover:bg-sky-800 active:bg-sky-900 disabled:opacity-60 text-white text-sm font-semibold transition shadow-sm">
              {saving ? "A guardar…" : produto ? "Guardar alterações" : "Criar produto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ═════════ Página de estoque ═════════ */
interface EstoqueViewProps {
  onOpenMovementModal: (produto?: Produto) => void;
  onOpenLabelModal: (produto: Produto) => void;
  onOpenScanner?: (onSelect: (p: Produto) => void) => void;
}

type Tab = "catalogo" | "reposicao" | "compras" | "validades" | "contagem" | "analise";
type StatusFilter = "todos" | "baixo" | "zero" | "expirando" | "expirado" | "inativos";
type SortKey = "nome" | "codigo" | "stock" | "custo" | "preco" | "margem" | "validade";

const STATUS_LABELS: Record<StatusFilter, string> = {
  todos: "Todos os estados",
  baixo: "Stock baixo",
  zero: "Sem stock",
  expirando: "A expirar (90 dias)",
  expirado: "Expirados",
  inativos: "Inativos",
};

export const EstoqueView: React.FC<EstoqueViewProps> = ({
  onOpenMovementModal, onOpenLabelModal, onOpenScanner,
}) => {
  const { produtos, config, addProduto, updateProduto, deleteProduto } = useApp();

  /* ───────────── Estado ───────────── */
  const [tab, setTab] = useState<Tab>("catalogo");

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("todas");
  const [prefix, setPrefix] = useState("todos");
  const [status, setStatus] = useState<StatusFilter>("todos");

  const [sortKey, setSortKey] = useState<SortKey>("nome");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuId, setMenuId] = useState<string | null>(null);

  const [showReport, setShowReport] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [toDelete, setToDelete] = useState<Produto[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [local, setLocal] = useState("todos");
  const [compact, setCompact] = useState(false);
  const [reposQtd, setReposQtd] = useState<Record<string, string>>({});
  const [contagem, setContagem] = useState<Record<string, string>>({});
  const [contSearch, setContSearch] = useState("");
  const [contLocal, setContLocal] = useState("todos");
  const [confirmAjuste, setConfirmAjuste] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [extras, setExtras] = useState<Record<string, ExtraProduto>>(() => lerLS("estoque_extras", {}));
  const [encomendas, setEncomendas] = useState<Encomenda[]>(() => lerLS("estoque_encomendas", []));
  const [fornecedorFiltro, setFornecedorFiltro] = useState("todos");
  const [confirmReceber, setConfirmReceber] = useState<string | null>(null);
  const [importRows, setImportRows] = useState<LinhaImportacao[] | null>(null);
  const [importando, setImportando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { gravarLS("estoque_extras", extras); }, [extras]);
  useEffect(() => { gravarLS("estoque_encomendas", encomendas); }, [encomendas]);


  // Atalho: "/" abre a pesquisa do catálogo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      e.preventDefault();
      setTab("catalogo");
      setTimeout(() => searchRef.current?.focus(), 0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  // Pesquisa com atraso (evita recalcular a cada tecla com catálogos grandes)
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [searchTerm, category, prefix, status, local, fornecedorFiltro, pageSize, sortKey, sortDir, tab]);

  /* ───────────── Dados derivados ───────────── */
  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    produtos.forEach((p) => {
      const k = p.categoria || "Geral";
      c[k] = (c[k] || 0) + 1;
    });
    return c;
  }, [produtos]);
  const categories = useMemo(() => Object.keys(categoryCounts).sort((a, b) => a.localeCompare(b, "pt")), [categoryCounts]);

  // Grupos de código (SVC, PEC, CON…) calculados a partir dos dados reais
  const prefixCounts = useMemo(() => {
    const c: Record<string, number> = {};
    produtos.forEach((p) => {
      const k = prefixoCodigo(p.codigo);
      if (k) c[k] = (c[k] || 0) + 1;
    });
    return c;
  }, [produtos]);

  const stats = useMemo(() => {
    let units = 0, cost = 0, retail = 0, low = 0, zero = 0, expiring = 0, expired = 0, active = 0;
    produtos.forEach((p) => {
      if (!p.ativo) return;
      active++;
      units += p.stock;
      cost += p.stock * (p.precoCusto || 0);
      retail += p.stock * p.preco;
      const s = getStockStatus(p);
      if (s === "zero") zero++;
      else if (s === "baixo") low++;
      const v = getValidadeStatus(p).status;
      if (v === "breve") expiring++;
      if (v === "expirado") expired++;
    });
    return { active, units, cost, retail, low, zero, expiring, expired, alerts: low + zero + expiring + expired };
  }, [produtos]);

  const matchesStatus = (p: Produto, s: StatusFilter) => {
    switch (s) {
      case "baixo": return getStockStatus(p) === "baixo";
      case "zero": return getStockStatus(p) === "zero";
      case "expirando": return getValidadeStatus(p).status === "breve";
      case "expirado": return getValidadeStatus(p).status === "expirado";
      case "inativos": return !p.ativo;
      default: return true;
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm;
    return produtos.filter((p) => {
      const okSearch =
        !q ||
        p.nome.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        (p.codigoBarras || "").toLowerCase().includes(q) ||
        (p.loteAtual || "").toLowerCase().includes(q) ||
        (p.categoria || "").toLowerCase().includes(q);
      const okCat = category === "todas" || (p.categoria || "Geral") === category;
      const okPrefix = prefix === "todos" || prefixoCodigo(p.codigo) === prefix;
      const okLocal = local === "todos" || (p.localizacao || "").trim() === local;
      const okForn = fornecedorFiltro === "todos" || (extras[p.codigo]?.fornecedor || "").trim() === fornecedorFiltro;
      return okSearch && okCat && okPrefix && okLocal && okForn && matchesStatus(p, status);
    });
  }, [produtos, searchTerm, category, prefix, status, local, fornecedorFiltro, extras]);

  const sorted = useMemo(() => {
    const m = sortDir === "asc" ? 1 : -1;
    const val = (p: Produto): number | string => {
      switch (sortKey) {
        case "nome": return p.nome.toLowerCase();
        case "codigo": return p.codigo.toLowerCase();
        case "stock": return p.stock;
        case "custo": return p.precoCusto || 0;
        case "preco": return p.preco;
        case "margem": return margemPercent(p.preco, p.precoCusto || 0) ?? -Infinity;
        case "validade": return parseValidade(p.dataValidade)?.getTime() ?? Infinity;
      }
    };
    return [...filtered].sort((a, b) => {
      const va = val(a), vb = val(b);
      if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb, "pt") * m;
      return ((va as number) - (vb as number)) * m;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageItems = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, pageSize]);

  const reposicao = useMemo(
    () =>
      produtos
        .filter((p) => p.ativo && getStockStatus(p) !== "ok")
        .map((p) => ({ p, qtd: sugestaoReposicao(p) }))
        .sort((a, b) => a.p.stock - b.p.stock),
    [produtos]
  );
  const reposFinal = reposicao.map(({ p, qtd }) => ({
    p,
    qtd: reposQtd[p.id] !== undefined ? Math.max(0, Math.round(Number(reposQtd[p.id]) || 0)) : qtd,
  }));
  const custoReposicao = reposFinal.reduce((s, r) => s + r.qtd * (r.p.precoCusto || 0), 0);

  const codigosEmUso = useMemo(
    () => new Set(produtos.filter((p) => p.id !== editing?.id).map((p) => p.codigo.toLowerCase())),
    [produtos, editing]
  );

  const proximoCodigo = () => {
    const usados = new Set(produtos.map((p) => p.codigo.toLowerCase()));
    let n = produtos.length + 1;
    while (usados.has(`prd${String(n).padStart(3, "0")}`)) n++;
    return `PRD${String(n).padStart(3, "0")}`;
  };

  /* ───────────── Compras, fornecedores e importação ───────────── */
  const fornecedores = useMemo(
    () =>
      Array.from(
        new Set(
          [...Object.values(extras).map((e) => (e.fornecedor || "").trim()), ...encomendas.map((o) => o.fornecedor)]
            .filter((f) => f && f !== SEM_FORNECEDOR)
        )
      ).sort((a, b) => a.localeCompare(b, "pt")),
    [extras, encomendas]
  );

  const guardarExtra = (codigo: string, extra: ExtraProduto, anterior?: string) => {
    setExtras((prev) => {
      const next = { ...prev };
      if (anterior && anterior !== codigo) delete next[anterior];
      const fornecedor = (extra.fornecedor || "").trim() || undefined;
      const precoGrosso = extra.precoGrosso && extra.precoGrosso > 0 ? extra.precoGrosso : undefined;
      if (!fornecedor && !precoGrosso) delete next[codigo];
      else next[codigo] = { fornecedor, precoGrosso };
      return next;
    });
  };

  const sugestoesCompra: [string, ItemEncomenda[]][] = (() => {
    const g: Record<string, ItemEncomenda[]> = {};
    reposFinal.forEach(({ p, qtd }) => {
      if (qtd <= 0) return;
      const f = (extras[p.codigo]?.fornecedor || "").trim() || SEM_FORNECEDOR;
      if (!g[f]) g[f] = [];
      g[f].push({ codigo: p.codigo, nome: p.nome, unidade: p.unidadeMedida, qtd, custo: p.precoCusto || 0 });
    });
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b, "pt"));
  })();

  const encomendasAbertas = encomendas.filter((o) => o.estado === "Rascunho" || o.estado === "Enviada").length;
  const totalEnc = (o: Encomenda) => o.itens.reduce((s, i) => s + i.qtd * i.custo, 0);

  const criarEncomenda = (fornecedor: string, itens: ItemEncomenda[]) => {
    const ano = new Date().getFullYear();
    const seq = encomendas.reduce((m, o) => Math.max(m, Number(o.numero.split("-")[2]) || 0), 0) + 1;
    const nova: Encomenda = {
      id: `${Date.now()}`,
      numero: `EC-${ano}-${String(seq).padStart(3, "0")}`,
      fornecedor,
      data: new Date().toLocaleDateString("pt-PT"),
      estado: "Rascunho",
      itens,
    };
    setEncomendas((prev) => [nova, ...prev]);
    notify(`Encomenda ${nova.numero} criada.`);
  };

  const mudarEstado = (id: string, estado: EstadoEncomenda) =>
    setEncomendas((prev) => prev.map((o) => (o.id === id ? { ...o, estado } : o)));

  const receberEncomenda = async (id: string) => {
    const o = encomendas.find((e) => e.id === id);
    if (!o) return;
    try {
      await Promise.all(
        o.itens.map((i) => {
          const p = produtos.find((x) => x.codigo === i.codigo);
          return p ? updateProduto(p.id, { stock: p.stock + i.qtd }) : Promise.resolve();
        })
      );
      mudarEstado(id, "Recebida");
      notify("Encomenda recebida e stock atualizado.");
    } catch {
      notify("Não foi possível dar entrada no stock.");
    }
    setConfirmReceber(null);
  };

  const abc = useMemo(() => {
    const itens = produtos
      .filter((p) => p.ativo)
      .map((p) => ({ p, valor: p.stock * (p.precoCusto || 0) }))
      .filter((x) => x.valor > 0)
      .sort((a, b) => b.valor - a.valor);
    const total = itens.reduce((s, x) => s + x.valor, 0);
    let acum = 0;
    const lista = itens.map((x) => {
      const antes = total ? (acum / total) * 100 : 0;
      acum += x.valor;
      const classe = antes < 80 ? "A" : antes < 95 ? "B" : "C";
      return { ...x, classe, pct: total ? (acum / total) * 100 : 0 };
    });
    const resumo = (["A", "B", "C"] as const).map((c) => {
      const l = lista.filter((x) => x.classe === c);
      return { c, n: l.length, valor: l.reduce((s, x) => s + x.valor, 0) };
    });
    return { total, lista, resumo };
  }, [produtos]);

  const onEscolherFicheiro = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const rows = analisarImportacao(await file.text(), produtos);
      if (rows.length === 0) notify("O ficheiro está vazio ou sem linhas de dados.");
      else setImportRows(rows);
    } catch {
      notify("Não foi possível ler o ficheiro.");
    }
  };

  const confirmarImportacao = async () => {
    if (!importRows) return;
    const validas = importRows.filter((r) => r.acao !== "erro");
    setImportando(true);
    let falhas = 0;
    for (let i = 0; i < validas.length; i += 20) {
      const res = await Promise.allSettled(
        validas.slice(i, i + 20).map((r) =>
          r.acao === "novo"
            ? addProduto({ ...r.dados, codigo: r.codigo, nome: r.nome } as any)
            : updateProduto(r.idExistente!, r.dados)
        )
      );
      falhas += res.filter((x) => x.status === "rejected").length;
    }
    setExtras((prev) => {
      const next = { ...prev };
      validas.forEach((r) => {
        if (r.fornecedor === undefined && r.precoGrosso === undefined) return;
        next[r.codigo] = {
          ...next[r.codigo],
          ...(r.fornecedor !== undefined ? { fornecedor: r.fornecedor } : {}),
          ...(r.precoGrosso !== undefined ? { precoGrosso: r.precoGrosso } : {}),
        };
      });
      return next;
    });
    setImportando(false);
    setImportRows(null);
    notify(falhas ? `Importação concluída com ${falhas} falha(s).` : `${validas.length} produto(s) importado(s).`);
  };

  const descarregarModelo = () =>
    exportarCSV("modelo-importacao.csv", CABECALHOS_IMPORTACAO, [
      ["PRD001", "Produto de exemplo", "Geral", "", "Armazém A", "LT-2026-01", "31/12/2027", 100, 10, "un", 50, 80, "Não", "Sim", "Fornecedor Exemplo", 70],
    ]);

  /* ───────────── Ações ───────────── */
  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (p: Produto) => { setEditing(p); setShowForm(true); setMenuId(null); };

  const handleSave = async (data: ProdutoFormData) => {
    const { fornecedor, precoGrosso, ...dados } = data;
    try {
      if (editing) await updateProduto(editing.id, dados as any);
      else await addProduto(dados as any);
      guardarExtra(dados.codigo, { fornecedor, precoGrosso }, editing?.codigo);
      setShowForm(false);
      notify(editing ? "Produto atualizado." : "Produto criado.");
    } catch (err) {
      console.error("Erro ao guardar produto:", err);
      notify("Não foi possível guardar. Tente novamente.");
    }
  };

  const duplicate = async (p: Produto) => {
    setMenuId(null);
    const { id, ...rest } = p as any;
    try {
      await addProduto({
        ...rest,
        nome: `${p.nome} (cópia)`,
        codigo: proximoCodigo(),
        codigoBarras: generateRandomBarcode(),
        ativo: true,
      });
      notify("Produto duplicado. Edite o código e o nome.");
    } catch {
      notify("Não foi possível duplicar.");
    }
  };

  const setAtivo = async (list: Produto[], ativo: boolean) => {
    setMenuId(null);
    try {
      await Promise.all(list.map((p) => updateProduto(p.id, { ativo })));
      setSelected(new Set());
      notify(ativo ? "Produtos ativados." : "Produtos desativados.");
    } catch {
      notify("Não foi possível atualizar.");
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await Promise.all(toDelete.map((p) => deleteProduto(p.id)));
      notify(toDelete.length === 1 ? "Produto eliminado." : `${toDelete.length} produtos eliminados.`);
      setSelected(new Set());
    } catch {
      notify("Não foi possível eliminar.");
    }
    setToDelete(null);
  };

  const selectedProducts = useMemo(() => produtos.filter((p) => selected.has(p.id)), [produtos, selected]);
  const allPageSelected = pageItems.length > 0 && pageItems.every((p) => selected.has(p.id));
  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageItems.forEach((p) => next.delete(p.id));
      else pageItems.forEach((p) => next.add(p.id));
      return next;
    });
  };
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const exportReposicao = () =>
    exportarCSV(
      "lista-de-reposicao.csv",
      ["Código", "Produto", "Stock", "Mínimo", "Qtd. sugerida", "Custo unit.", "Custo estimado"],
      reposFinal.map(({ p, qtd }) => [p.codigo, p.nome, p.stock, p.stockMinimo, qtd, p.precoCusto || 0, qtd * (p.precoCusto || 0)])
    );

  const clearFilters = () => {
    setSearchInput(""); setCategory("todas"); setPrefix("todos"); setStatus("todos"); setLocal("todos"); setFornecedorFiltro("todos"); setFornecedorFiltro("todos");
  };
  const hasFilters = searchInput || category !== "todas" || prefix !== "todos" || status !== "todos" || local !== "todos" || fornecedorFiltro !== "todos";

  const money = (v: number) => formatCurrency(v, config.moeda);

  /* ───────────── Componentes pequenos ───────────── */
  const SortTh: React.FC<{ k: SortKey; label: string; align?: "left" | "right" | "center"; className?: string }> = ({
    k, label, align = "left", className = "",
  }) => (
    <th className={`py-3 px-3 ${className}`}>
      <button
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 font-semibold uppercase tracking-wide text-[11px] hover:text-slate-900 ${sortKey === k ? "text-sky-700" : ""} ${align === "right" ? "float-right" : ""}`}
      >
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? "opacity-100" : "opacity-30"}`} />
      </button>
    </th>
  );

  const Kpi: React.FC<{
    icon: React.ReactNode; label: string; value: string; sub: string; tone?: "default" | "warn"; onClick?: () => void;
  }> = ({ icon, label, value, sub, tone = "default", onClick }) => (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`text-left px-4 py-3.5 rounded-lg border bg-white transition ${
        tone === "warn" ? "border-slate-200 border-l-4 border-l-amber-500" : "border-slate-200"
      } ${onClick ? "hover:border-slate-300 hover:shadow-sm cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className="text-slate-400">{icon}</span>
      </div>
      <div className="text-xl font-semibold text-slate-900 mt-1.5 tabular-nums">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
    </button>
  );

  const pageNumbers = (() => {
    const n = Math.min(5, totalPages);
    return Array.from({ length: n }, (_, i) => {
      if (totalPages <= 5 || page <= 3) return i + 1;
      if (page >= totalPages - 2) return totalPages - 4 + i;
      return page - 2 + i;
    });
  })();

  const locais = useMemo(
    () => Array.from(new Set(produtos.map((p) => (p.localizacao || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt")),
    [produtos]
  );

  const validades = useMemo(
    () =>
      produtos
        .filter((p) => p.ativo && p.stock > 0)
        .map((p) => ({ p, v: getValidadeStatus(p) }))
        .filter((x) => x.v.status === "expirado" || x.v.status === "breve")
        .sort((a, b) => (a.v.dias ?? 0) - (b.v.dias ?? 0)),
    [produtos]
  );
  const valorEmRisco = validades.reduce((t, x) => t + x.p.stock * (x.p.precoCusto || 0), 0);
  const exportValidades = () =>
    exportarCSV(
      "controlo-de-validades.csv",
      ["Código", "Produto", "Lote", "Validade", "Dias", "Stock", "Valor em custo"],
      validades.map(({ p, v }) => [p.codigo, p.nome, p.loteAtual || "", p.dataValidade || "", v.dias ?? "", p.stock, p.stock * (p.precoCusto || 0)])
    );

  const contagemLista = useMemo(() => {
    const q = contSearch.trim().toLowerCase();
    return produtos
      .filter((p) => p.ativo)
      .filter((p) => contLocal === "todos" || (p.localizacao || "").trim() === contLocal)
      .filter((p) => !q || p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q) || (p.codigoBarras || "").toLowerCase().includes(q))
      .sort((a, b) => (a.localizacao || "").localeCompare(b.localizacao || "", "pt") || a.nome.localeCompare(b.nome, "pt"));
  }, [produtos, contSearch, contLocal]);

  const ajustes = useMemo(
    () =>
      produtos
        .filter((p) => contagem[p.id] !== undefined && contagem[p.id] !== "")
        .map((p) => ({ p, novo: Math.max(0, Math.round(Number(contagem[p.id]) || 0)) }))
        .filter((a) => a.novo !== a.p.stock),
    [produtos, contagem]
  );
  const valorAjustes = ajustes.reduce((t, a) => t + (a.novo - a.p.stock) * (a.p.precoCusto || 0), 0);

  const aplicarAjustes = async () => {
    try {
      await Promise.all(ajustes.map((a) => updateProduto(a.p.id, { stock: a.novo })));
      notify(`${ajustes.length} ajuste(s) de stock aplicado(s).`);
      setContagem({});
    } catch {
      notify("Não foi possível aplicar os ajustes.");
    }
    setConfirmAjuste(false);
  };
  const exportFolhaContagem = () =>
    exportarCSV(
      "folha-de-contagem.csv",
      ["Código", "Produto", "Localização", "Lote", "Stock no sistema", "Contagem"],
      contagemLista.map((p) => [p.codigo, p.nome, p.localizacao || "", p.loteAtual || "", p.stock, ""])
    );

  /* ───────────── Render ───────────── */
  return (
    <div className="space-y-5 text-slate-800" onClick={() => menuId && setMenuId(null)}>
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Gestão de Estoque</h2>
          <p className="text-xs text-slate-500">Inventário, preços, lotes, validades e reposição de produtos</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenScanner && (
            <button onClick={() => onOpenScanner((p) => openEdit(p))}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold transition flex items-center gap-1.5">
              <QrCode className="w-4 h-4" /> Localizar com scanner
            </button>
          )}
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onEscolherFicheiro} />
          <button onClick={() => fileRef.current?.click()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold transition flex items-center gap-1.5"
            title="Importar produtos de um ficheiro CSV">
            <Upload className="w-4 h-4" /> Importar
          </button>
          <button onClick={() => exportarProdutosCSV("estoque.csv", sorted, extras)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold transition flex items-center gap-1.5"
            title="Exporta a lista filtrada para Excel">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => setShowReport(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold transition flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button onClick={() => onOpenMovementModal()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold transition flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> Movimentar stock
          </button>
          <button onClick={openNew}
            className="px-4 py-2 bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white rounded-md text-xs font-semibold transition flex items-center gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> Novo produto
          </button>
        </div>
      </div>

      {/* Indicadores (clicáveis: aplicam o filtro) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<Package className="w-4 h-4" />} label="Produtos ativos" value={String(stats.active)}
          sub={`${stats.units} unidades em armazém`} onClick={() => { setTab("catalogo"); clearFilters(); }} />
        <Kpi icon={<Wallet className="w-4 h-4" />} label="Valor em custo" value={money(stats.cost)} sub="Investido em stock" />
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Valor de venda" value={money(stats.retail)}
          sub={`Margem estimada: ${money(stats.retail - stats.cost)}`} />
        <Kpi icon={<AlertTriangle className="w-4 h-4" />} label="Requer atenção" value={String(stats.alerts)}
          tone={stats.alerts > 0 ? "warn" : "default"}
          sub={stats.alerts > 0
            ? `${stats.zero} sem stock · ${stats.low} baixo · ${stats.expiring + stats.expired} validade`
            : "Tudo em ordem"}
          onClick={stats.alerts > 0 ? () => { setTab("reposicao"); } : undefined} />
      </div>

      {/* Separadores */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {([
          ["catalogo", "Catálogo", produtos.length],
          ["reposicao", "Reposição", reposicao.length],
          ["compras", "Compras", encomendasAbertas],
          ["validades", "Validades", validades.length],
          ["contagem", "Contagem física", stats.active],
          ["analise", "Análise ABC", abc.lista.length],
        ] as const).map(([id, label, count]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition flex items-center gap-2 whitespace-nowrap ${
              tab === id ? "border-sky-700 text-sky-800" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}>
            {id === "reposicao" && <ShoppingCart className="w-4 h-4" />}
            {label}
            <span className={`px-2 py-0.5 rounded-full text-[11px] ${
              (id === "reposicao" || id === "validades") && count > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {tab === "catalogo" ? (
        <>
          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input ref={searchRef} type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Pesquisar por nome, código, código de barras ou lote…   ( / )"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-sky-500 focus:bg-white transition" />
              </div>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="border border-slate-200 bg-slate-50 rounded-md px-3 py-2 text-xs font-medium focus:outline-none focus:border-sky-500">
                <option value="todas">Todas as categorias ({produtos.length})</option>
                {categories.map((c) => <option key={c} value={c}>{c} ({categoryCounts[c]})</option>)}
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="border border-slate-200 bg-slate-50 rounded-md px-3 py-2 text-xs font-medium focus:outline-none focus:border-sky-500">
                {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            {Object.keys(prefixCounts).length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400 mr-1">Grupo de código:</span>
                {[["todos", `Todos (${produtos.length})`], ...Object.entries(prefixCounts).sort().map(([k, n]) => [k, `${k} (${n})`])].map(([id, label]) => (
                  <button key={id} onClick={() => setPrefix(id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      prefix === id ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4 flex-wrap">
                <span>
                  A mostrar <b>{sorted.length}</b> de <b>{produtos.length}</b> produtos
                </span>
                {locais.length > 0 && (
                  <label className="flex items-center gap-1.5">
                    <span className="text-slate-400">Localização</span>
                    <select value={local} onChange={(e) => setLocal(e.target.value)}
                      className="border border-slate-200 bg-white rounded-md px-2 py-1 text-xs font-semibold focus:outline-none focus:border-sky-500">
                      <option value="todos">Todas</option>
                      {locais.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </label>
                )}
                {fornecedores.length > 0 && (
                  <label className="flex items-center gap-1.5">
                    <span className="text-slate-400">Fornecedor</span>
                    <select value={fornecedorFiltro} onChange={(e) => setFornecedorFiltro(e.target.value)}
                      className="border border-slate-200 bg-white rounded-md px-2 py-1 text-xs font-semibold focus:outline-none focus:border-sky-500">
                      <option value="todos">Todos</option>
                      {fornecedores.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </label>
                )}
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} className="accent-sky-600" />
                  <span>Vista compacta</span>
                </label>
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="text-sky-600 font-semibold hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" /> Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Barra de ações em massa */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-900 text-white rounded-lg px-4 py-3 shadow-lg">
              <span className="text-sm font-semibold">{selected.size} selecionado(s)</span>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => exportarProdutosCSV("selecionados.csv", selectedProducts, extras)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Exportar
                </button>
                <button onClick={() => setAtivo(selectedProducts, true)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ativar
                </button>
                <button onClick={() => setAtivo(selectedProducts, false)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <Power className="w-3.5 h-3.5" /> Desativar
                </button>
                <button onClick={() => setToDelete(selectedProducts)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
                <button onClick={() => setSelected(new Set())} className="p-1.5 text-slate-300 hover:text-white" aria-label="Limpar seleção">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Tabela */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            {sorted.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-semibold text-slate-600">
                  {produtos.length === 0 ? "Ainda não tem produtos" : "Nenhum produto corresponde aos filtros"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {produtos.length === 0 ? "Crie o primeiro produto para começar a vender." : "Ajuste a pesquisa ou limpe os filtros."}
                </p>
                {produtos.length === 0 && (
                  <button onClick={openNew} className="mt-4 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-md text-xs font-semibold">
                    Novo produto
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className={`w-full text-left text-xs tabular-nums ${compact ? "[&_td]:!py-1.5" : ""}`}>
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wide">
                      <tr>
                        <th className="py-3 pl-4 pr-1 w-8">
                          <input type="checkbox" checked={allPageSelected} onChange={togglePage} className="accent-sky-500" aria-label="Selecionar página" />
                        </th>
                        <SortTh k="nome" label="Produto" />
                        <th className="py-3 px-3 font-semibold">Categoria / Local</th>
                        <SortTh k="validade" label="Lote / Validade" />
                        <SortTh k="stock" label="Stock" align="center" className="text-center" />
                        <SortTh k="custo" label="Custo" align="right" className="text-right" />
                        <SortTh k="preco" label="Venda" align="right" className="text-right" />
                        <SortTh k="margem" label="Margem" align="right" className="text-right" />
                        <th className="py-3 px-4 text-right font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pageItems.map((p) => {
                        const st = getStockStatus(p);
                        const val = getValidadeStatus(p);
                        const margem = margemPercent(p.preco, p.precoCusto || 0);
                        const pct = p.stockMinimo > 0 ? Math.min(100, (p.stock / (p.stockMinimo * 2)) * 100) : 100;
                        return (
                          <tr key={p.id} className={`hover:bg-slate-50/70 transition ${!p.ativo ? "opacity-55" : ""} ${selected.has(p.id) ? "bg-sky-50/60" : ""}`}>
                            <td className="py-3 pl-4 pr-1">
                              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} className="accent-sky-500" aria-label={`Selecionar ${p.nome}`} />
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3 min-w-[190px]">
                                <div className="w-11 h-11 shrink-0 rounded-md border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                                  {obterImagemCadastro(p) ? (
                                    <img src={obterImagemCadastro(p)} alt={`Imagem de ${p.nome}`} loading="lazy" className="w-full h-full object-contain p-0.5" />
                                  ) : (
                                    <Package className="w-5 h-5 text-slate-300" aria-hidden="true" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                    <span className="truncate">{p.nome}</span>
                                    {!p.ativo && <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded shrink-0">Inativo</span>}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">{p.codigo}</span>
                                {p.codigoBarras && (
                                  <span className="flex items-center gap-1 text-sky-700">
                                    <Barcode className="w-3.5 h-3.5" /> {p.codigoBarras}
                                  </span>
                                )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-semibold text-[10px]">{p.categoria || "Geral"}</span>
                              {p.localizacao && <div className="text-[10px] text-slate-400 mt-0.5">{p.localizacao}</div>}
                              {extras[p.codigo]?.fornecedor && <div className="text-[10px] text-slate-500 mt-0.5">Forn.: {extras[p.codigo].fornecedor}</div>}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-mono text-slate-800 font-medium">{p.loteAtual || "—"}</div>
                              {val.status === "sem" ? (
                                <div className="text-[10px] text-slate-400">Sem validade</div>
                              ) : (
                                <div className={`text-[10px] font-semibold flex items-center gap-1 ${
                                  val.status === "expirado" ? "text-rose-600" : val.status === "breve" ? "text-amber-700" : "text-slate-500"}`}>
                                  {val.status !== "ok" && <CalendarClock className="w-3 h-3" />}
                                  {p.dataValidade}
                                  {val.status === "expirado" && " · expirado"}
                                  {val.status === "breve" && ` · ${val.dias}d`}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center min-w-[110px]">
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                                st === "zero" ? "bg-rose-100 text-rose-800" : st === "baixo" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                                {p.stock} {p.unidadeMedida}
                                {st !== "ok" && <AlertTriangle className="w-3 h-3" />}
                              </div>
                              <div className="h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                <div className={`h-full rounded-full ${st === "zero" ? "bg-rose-500" : st === "baixo" ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">Mín: {p.stockMinimo}</div>
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-slate-600">{money(p.precoCusto || 0)}</td>
                            <td className="py-3 px-3 text-right font-semibold text-slate-900 text-sm">
                              {money(p.preco)}
                              {p.ivaIsento && <span className="block text-[10px] text-slate-400 font-normal">Isento IVA</span>}
                              {extras[p.codigo]?.precoGrosso ? <span className="block text-[10px] text-slate-500 font-normal">Grosso: {money(extras[p.codigo].precoGrosso as number)}</span> : null}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {margem === null ? (
                                <span className="text-slate-300">—</span>
                              ) : (
                                <span className={`font-semibold ${margem < 0 ? "text-rose-600" : margem < 15 ? "text-amber-700" : "text-emerald-700"}`}>
                                  {margem.toFixed(0)}%
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1 relative" onClick={(e) => e.stopPropagation()}>
                                <button type="button" onClick={() => onOpenMovementModal(p)} title="Entrada / saída de stock"
                                  className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition">
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => onOpenLabelModal(p)} title="Etiquetas com código de barras"
                                  className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition">
                                  <Barcode className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => openEdit(p)} title="Editar"
                                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => setMenuId(menuId === p.id ? null : p.id)} title="Mais ações"
                                  className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {menuId === p.id && (
                                  <div className="absolute right-0 top-9 z-20 w-44 bg-white border border-slate-200 rounded-md shadow-xl py-1 text-left">
                                    <button onClick={() => duplicate(p)} className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                      <Copy className="w-3.5 h-3.5" /> Duplicar
                                    </button>
                                    <button onClick={() => setAtivo([p], !p.ativo)} className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                      <Power className="w-3.5 h-3.5" /> {p.ativo ? "Desativar" : "Ativar"}
                                    </button>
                                    <button onClick={() => { setMenuId(null); setToDelete([p]); }} className="w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span>
                      <b>{Math.min((page - 1) * pageSize + 1, sorted.length)}</b>–<b>{Math.min(page * pageSize, sorted.length)}</b> de <b>{sorted.length}</b>
                    </span>
                    <label className="flex items-center gap-1.5">
                      <span className="text-slate-400">Por página</span>
                      <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
                        className="border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-sky-500">
                        {[25, 50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="flex items-center gap-1">
                    {[
                      { icon: <ChevronsLeft className="w-4 h-4" />, go: () => setPage(1), off: page === 1, t: "Primeira" },
                      { icon: <ChevronLeft className="w-4 h-4" />, go: () => setPage((p) => Math.max(1, p - 1)), off: page === 1, t: "Anterior" },
                    ].map((b) => (
                      <button key={b.t} disabled={b.off} onClick={b.go} title={b.t}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition">{b.icon}</button>
                    ))}
                    {pageNumbers.map((n) => (
                      <button key={n} onClick={() => setPage(n)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                          n === page ? "bg-sky-700 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"}`}>
                        {n}
                      </button>
                    ))}
                    {[
                      { icon: <ChevronRight className="w-4 h-4" />, go: () => setPage((p) => Math.min(totalPages, p + 1)), off: page === totalPages, t: "Seguinte" },
                      { icon: <ChevronsRight className="w-4 h-4" />, go: () => setPage(totalPages), off: page === totalPages, t: "Última" },
                    ].map((b) => (
                      <button key={b.t} disabled={b.off} onClick={b.go} title={b.t}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition">{b.icon}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      ) : tab === "reposicao" ? (
        /* ───────────── Separador Reposição ───────────── */
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 flex items-center justify-between flex-wrap gap-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Lista de reposição</h3>
              <p className="text-xs text-slate-500">
                Produtos ativos com stock baixo ou esgotado. A quantidade sugerida repõe até ao dobro do stock mínimo e pode ser alterada.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Custo estimado</div>
                <div className="text-sm font-semibold text-slate-900">{money(custoReposicao)}</div>
              </div>
              <button onClick={exportReposicao} disabled={reposicao.length === 0}
                className="px-3.5 py-2 bg-sky-700 hover:bg-sky-800 disabled:opacity-40 text-white rounded-md text-xs font-semibold flex items-center gap-1.5">
                <Download className="w-4 h-4" /> Exportar lista
              </button>
            </div>
          </div>

          {reposicao.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
              <p className="text-sm font-semibold text-slate-600">Nenhum produto precisa de reposição</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-3 text-center">Stock</th>
                    <th className="py-3 px-3 text-center">Mínimo</th>
                    <th className="py-3 px-3 text-center">Repor</th>
                    <th className="py-3 px-3 text-right">Custo unit.</th>
                    <th className="py-3 px-3 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reposFinal.map(({ p, qtd }) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-sm">{p.nome}</div>
                        <div className="text-[11px] font-mono text-slate-500">{p.codigo}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-semibold ${p.stock <= 0 ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                          {p.stock} {p.unidadeMedida}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">{p.stockMinimo}</td>
                      <td className="py-3 px-3 text-center">
                        <input type="number" min={0} value={reposQtd[p.id] ?? String(qtd)}
                          onChange={(e) => setReposQtd((r) => ({ ...r, [p.id]: e.target.value }))}
                          className="w-20 text-center border border-slate-300 rounded-md px-2 py-1 text-xs font-semibold focus:outline-none focus:border-sky-500" />
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">{money(p.precoCusto || 0)}</td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-900">{money(qtd * (p.precoCusto || 0))}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => onOpenMovementModal(p)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                          Dar entrada
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : tab === "compras" ? (
        /* ───────────── Separador Compras ───────────── */
        <div className="space-y-5">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Sugestão de compra por fornecedor</h3>
              <p className="text-xs text-slate-500">
                Gerada a partir da lista de reposição, com as quantidades que definiu. Indique o fornecedor na ficha de cada produto para os agrupar.
              </p>
            </div>
            {sugestoesCompra.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-9 h-9 mx-auto mb-2 text-emerald-400" />
                <p className="text-sm font-semibold text-slate-600">Não há produtos a repor neste momento</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sugestoesCompra.map(([forn, itens]) => {
                  const total = itens.reduce((s, i) => s + i.qtd * i.custo, 0);
                  return (
                    <div key={forn} className="p-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                          <Truck className="w-4 h-4 text-slate-400" /> {forn}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {itens.length} produto(s) · {itens.slice(0, 3).map((i) => i.nome).join(", ")}{itens.length > 3 ? "…" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[11px] text-slate-400">Total estimado</div>
                          <div className="text-sm font-semibold text-slate-900">{money(total)}</div>
                        </div>
                        <button onClick={() => criarEncomenda(forn, itens)}
                          className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-md text-xs font-semibold">
                          Criar encomenda
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Encomendas de compra</h3>
              <p className="text-xs text-slate-500">Ao receber uma encomenda, o stock dos produtos é atualizado.</p>
            </div>

            {confirmReceber && (
              <div className="m-4 flex items-center justify-between flex-wrap gap-3 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
                <p className="text-xs text-amber-900">Confirma a receção? Será somada ao stock a quantidade de cada produto desta encomenda.</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmReceber(null)} className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-700">Cancelar</button>
                  <button onClick={() => receberEncomenda(confirmReceber)} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold">Confirmar receção</button>
                </div>
              </div>
            )}

            {encomendas.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">Ainda não criou encomendas.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wide font-semibold">
                    <tr>
                      <th className="py-3 px-4">Nº</th>
                      <th className="py-3 px-3">Fornecedor</th>
                      <th className="py-3 px-3">Data</th>
                      <th className="py-3 px-3 text-center">Itens</th>
                      <th className="py-3 px-3 text-right">Total</th>
                      <th className="py-3 px-3">Estado</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {encomendas.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">{o.numero}</td>
                        <td className="py-3 px-3">{o.fornecedor}</td>
                        <td className="py-3 px-3 text-slate-600">{o.data}</td>
                        <td className="py-3 px-3 text-center">{o.itens.length}</td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-900">{money(totalEnc(o))}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-semibold ${
                            o.estado === "Recebida" ? "bg-emerald-100 text-emerald-800"
                            : o.estado === "Enviada" ? "bg-sky-100 text-sky-800"
                            : o.estado === "Cancelada" ? "bg-slate-200 text-slate-600"
                            : "bg-amber-100 text-amber-800"}`}>
                            {o.estado}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button onClick={() => imprimirEncomenda(o, config.moeda)} title="Imprimir encomenda"
                              className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-md">
                              <Printer className="w-4 h-4" />
                            </button>
                            {o.estado === "Rascunho" && (
                              <button onClick={() => mudarEstado(o.id, "Enviada")}
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md font-semibold">Marcar enviada</button>
                            )}
                            {(o.estado === "Rascunho" || o.estado === "Enviada") && (
                              <>
                                <button onClick={() => setConfirmReceber(o.id)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md font-semibold">Receber</button>
                                <button onClick={() => mudarEstado(o.id, "Cancelada")}
                                  className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-md font-semibold">Cancelar</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : tab === "analise" ? (
        /* ───────────── Separador Análise ABC ───────────── */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {abc.resumo.map(({ c, n, valor }) => (
              <div key={c} className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Classe {c}</span>
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-xl font-semibold text-slate-900 mt-1.5">{n} produtos</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {money(valor)} · {abc.total ? ((valor / abc.total) * 100).toFixed(0) : 0}% do valor em stock
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Análise ABC do stock</h3>
              <p className="text-xs text-slate-500">
                Classifica os produtos pelo valor em stock (a custo). A concentra cerca de 80% do valor, B os 15% seguintes e C o restante. Não inclui vendas nem rotação.
              </p>
            </div>
            {abc.lista.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">Sem produtos com valor em stock. Preencha o preço de custo e o stock.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wide font-semibold">
                    <tr>
                      <th className="py-3 px-4">Classe</th>
                      <th className="py-3 px-3">Produto</th>
                      <th className="py-3 px-3 text-center">Stock</th>
                      <th className="py-3 px-3 text-right">Valor em custo</th>
                      <th className="py-3 px-4 text-right">% acumulada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {abc.lista.slice(0, 150).map(({ p, valor, classe, pct }) => (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md font-semibold ${classe === "A" ? "bg-sky-100 text-sky-800" : classe === "B" ? "bg-slate-200 text-slate-700" : "bg-slate-100 text-slate-500"}`}>{classe}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900 text-[13px]">{p.nome}</div>
                          <div className="text-[11px] font-mono text-slate-500">{p.codigo}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center">{p.stock} {p.unidadeMedida}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{money(valor)}</td>
                        <td className="py-2.5 px-4 text-right text-slate-600">{pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {abc.lista.length > 150 && (
              <div className="px-4 py-3 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">A mostrar os 150 produtos de maior valor, de {abc.lista.length}.</div>
            )}
          </div>
        </div>
      ) : tab === "validades" ? (
        /* ───────────── Separador Validades ───────────── */
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 flex items-center justify-between flex-wrap gap-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Controlo de validades</h3>
              <p className="text-xs text-slate-500">Produtos com stock expirados ou a expirar nos próximos 90 dias, por ordem de urgência.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Valor em risco (custo)</div>
                <div className="text-sm font-semibold text-slate-900">{money(valorEmRisco)}</div>
              </div>
              <button onClick={exportValidades} disabled={validades.length === 0}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5">
                <Download className="w-4 h-4" /> Exportar
              </button>
            </div>
          </div>
          {validades.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
              <p className="text-sm font-semibold text-slate-600">Sem produtos expirados ou a expirar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wide font-semibold">
                  <tr>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-3">Lote</th>
                    <th className="py-3 px-3">Validade</th>
                    <th className="py-3 px-3">Prazo</th>
                    <th className="py-3 px-3 text-center">Stock</th>
                    <th className="py-3 px-3 text-right">Valor em custo</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validades.map(({ p, v }) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-[13px]">{p.nome}</div>
                        <div className="text-[11px] font-mono text-slate-500">{p.codigo}</div>
                      </td>
                      <td className="py-3 px-3 font-mono">{p.loteAtual || "—"}</td>
                      <td className="py-3 px-3">{p.dataValidade}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md font-semibold ${v.status === "expirado" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                          {v.status === "expirado" ? `Expirado há ${Math.abs(v.dias ?? 0)} d` : `${v.dias} dias`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold">{p.stock} {p.unidadeMedida}</td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-900">{money(p.stock * (p.precoCusto || 0))}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => onOpenMovementModal(p)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold">
                          Dar baixa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ───────────── Separador Contagem física ───────────── */
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Contagem física de inventário</h3>
                <p className="text-xs text-slate-500">Registe a quantidade contada. Só os produtos com diferença serão ajustados.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={exportFolhaContagem}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5">
                  <Download className="w-4 h-4" /> Folha de contagem
                </button>
                {Object.keys(contagem).length > 0 && (
                  <button onClick={() => { setContagem({}); setConfirmAjuste(false); }}
                    className="px-3.5 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold">Limpar contagem</button>
                )}
                <button onClick={() => setConfirmAjuste(true)} disabled={ajustes.length === 0}
                  className="px-4 py-2 bg-sky-700 hover:bg-sky-800 disabled:opacity-40 text-white rounded-md text-xs font-semibold flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4" /> Aplicar ajustes ({ajustes.length})
                </button>
              </div>
            </div>

            {confirmAjuste && (
              <div className="flex items-center justify-between flex-wrap gap-3 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
                <p className="text-xs text-amber-900">
                  Vai alterar o stock de <b>{ajustes.length}</b> produto(s). Impacto no valor de custo: <b>{money(valorAjustes)}</b>. Esta ação substitui o stock atual pela quantidade contada.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmAjuste(false)} className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-700">Cancelar</button>
                  <button onClick={aplicarAjustes} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold">Confirmar ajustes</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="text" value={contSearch} onChange={(e) => setContSearch(e.target.value)}
                  placeholder="Pesquisar produto, código ou código de barras…"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-sky-500 focus:bg-white" />
              </div>
              <select value={contLocal} onChange={(e) => setContLocal(e.target.value)}
                className="border border-slate-200 bg-slate-50 rounded-md px-3 py-2 text-xs font-medium focus:outline-none focus:border-sky-500">
                <option value="todos">Todas as localizações</option>
                {locais.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wide font-semibold">
                <tr>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-3">Localização</th>
                  <th className="py-3 px-3 text-center">Sistema</th>
                  <th className="py-3 px-3 text-center">Contagem</th>
                  <th className="py-3 px-3 text-center">Diferença</th>
                  <th className="py-3 px-4 text-right">Impacto (custo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contagemLista.slice(0, 300).map((p) => {
                  const raw = contagem[p.id];
                  const counted = raw !== undefined && raw !== "";
                  const novo = counted ? Math.max(0, Math.round(Number(raw) || 0)) : p.stock;
                  const diff = novo - p.stock;
                  return (
                    <tr key={p.id} className={diff !== 0 ? "bg-amber-50/50" : "hover:bg-slate-50/70"}>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900 text-[13px]">{p.nome}</div>
                        <div className="text-[11px] font-mono text-slate-500">{p.codigo}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{p.localizacao || "—"}</td>
                      <td className="py-2.5 px-3 text-center font-semibold">{p.stock} {p.unidadeMedida}</td>
                      <td className="py-2.5 px-3 text-center">
                        <input type="number" min={0} value={raw ?? ""} placeholder="—"
                          onChange={(e) => setContagem((c) => ({ ...c, [p.id]: e.target.value }))}
                          className="w-24 text-center border border-slate-300 rounded-md px-2 py-1 text-xs font-semibold focus:outline-none focus:border-sky-500" />
                      </td>
                      <td className={`py-2.5 px-3 text-center font-semibold ${!counted ? "text-slate-300" : diff === 0 ? "text-emerald-700" : diff < 0 ? "text-rose-600" : "text-amber-700"}`}>
                        {!counted ? "—" : diff === 0 ? "Conforme" : diff > 0 ? `+${diff}` : diff}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-600">
                        {counted && diff !== 0 ? money(diff * (p.precoCusto || 0)) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {contagemLista.length > 300 && (
            <div className="px-4 py-3 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
              A mostrar 300 de {contagemLista.length} produtos. Use a pesquisa ou a localização para contar por zonas.
            </div>
          )}
        </div>
      )}

      {/* Modais */}
      <ProductFormModal
        open={showForm}
        produto={editing}
        categorias={categories}
        codigosEmUso={codigosEmUso}
        moeda={config.moeda}
        codigoSugerido={proximoCodigo()}
        extras={editing ? extras[editing.codigo] : undefined}
        fornecedores={fornecedores}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
      />

      {importRows && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col border border-slate-200 max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Importar produtos</h3>
                <p className="text-xs text-slate-500">Reveja o resultado antes de confirmar. Códigos existentes são atualizados.</p>
              </div>
              <button onClick={() => setImportRows(null)} className="text-slate-400 hover:text-slate-700" aria-label="Fechar"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-3 flex items-center gap-2 flex-wrap text-xs font-semibold border-b border-slate-100">
              <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800">{importRows.filter((r) => r.acao === "novo").length} novos</span>
              <span className="px-2 py-1 rounded-md bg-sky-100 text-sky-800">{importRows.filter((r) => r.acao === "atualizar").length} a atualizar</span>
              <span className="px-2 py-1 rounded-md bg-rose-100 text-rose-800">{importRows.filter((r) => r.acao === "erro").length} com erro (ignorados)</span>
              <button onClick={descarregarModelo} className="ml-auto text-sky-700 hover:underline">Descarregar modelo CSV</button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wide font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">Linha</th>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Produto</th>
                    <th className="py-2.5 px-3">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importRows.slice(0, 200).map((r) => (
                    <tr key={r.linha}>
                      <td className="py-2 px-4 text-slate-400">{r.linha}</td>
                      <td className="py-2 px-3 font-mono">{r.codigo || "—"}</td>
                      <td className="py-2 px-3">{r.nome || "—"}</td>
                      <td className="py-2 px-3">
                        {r.acao === "erro" ? <span className="text-rose-600 font-semibold">{r.erro}</span>
                          : r.acao === "novo" ? <span className="text-emerald-700 font-semibold">Novo</span>
                          : <span className="text-sky-700 font-semibold">Atualizar</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importRows.length > 200 && <div className="px-4 py-3 text-xs text-slate-500">A mostrar as primeiras 200 de {importRows.length} linhas.</div>}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
              <button onClick={() => setImportRows(null)} className="flex-1 py-2.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold">Cancelar</button>
              <button onClick={confirmarImportacao}
                disabled={importando || importRows.every((r) => r.acao === "erro")}
                className="flex-1 py-2.5 rounded-md bg-sky-700 hover:bg-sky-800 disabled:opacity-40 text-white text-sm font-semibold">
                {importando ? "A importar…" : `Importar ${importRows.filter((r) => r.acao !== "erro").length} produto(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 border border-slate-200">
            <div className="w-11 h-11 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900">
              {toDelete.length === 1 ? "Eliminar produto?" : `Eliminar ${toDelete.length} produtos?`}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {toDelete.length === 1 ? `“${toDelete[0].nome}” será removido do catálogo.` : "Os produtos selecionados serão removidos do catálogo."}{" "}
              Esta ação não pode ser desfeita. Se só quer deixar de vender, use “Desativar”.
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setToDelete(null)} className="flex-1 py-2.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <ReportExportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        tipoRelatorio="estoque"
        produtos={produtos}
        config={config}
        filtroAtual={{
          categoria: category,
          apenasStockBaixo: status === "baixo" || status === "zero",
          termoBusca: searchInput,
        }}
      />

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
};