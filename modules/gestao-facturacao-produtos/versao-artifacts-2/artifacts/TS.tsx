/* ============================================================================
   FILE 3/3 — src/views/POSView.tsx  (COMPLETO)
   Frente de caixa com o mesmo sistema de design dos Documentos.
   Adquirente tratado por ClienteField: cliente registado OU não é cliente.
   ============================================================================ */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Barcode, Banknote, Calculator, Check, CheckCircle2, ChevronDown,
  Clock, CreditCard, Delete, HelpCircle, Keyboard, List, Minus, Package, Pause,
  Percent, Play, Plus, Printer, Receipt, Search, ShoppingCart, Tag, Trash2,
  UserPlus, X,
} from "lucide-react";
import { useApp } from "../store/AppContext";
import { CaixaSessao, Fatura, Produto } from "../types";
import { downloadFatura, formatCurrency, generateFaturaHTML } from "../utils/faturaGenerator";
import {
  ClienteField, ClienteDoc, criarConsumidorFinal, clienteDePaciente,
  clienteParaDocumento, NOME_CONSUMIDOR_FINAL,
} from "../components/ClienteField";

/* ------------------------------------------------------------------ CSS --- */
const POS_CSS = `
.pos-root{background:#f2f4f7;font-family:Roboto,"Helvetica Neue",Arial,sans-serif;color:#333;min-height:100vh;font-size:14px;padding-bottom:32px}
.pos-root *{box-sizing:border-box}
.pos-container{padding:0 20px;width:100%}
.pos-breadcrumb{list-style:none;display:flex;gap:8px;margin:0;padding:12px 0;font-size:13px;color:#8a919c}
.pos-breadcrumb li+li::before{content:"/";margin-right:8px;color:#c3c9d2}
.pos-breadcrumb li.active{color:#2f3640;font-weight:700}
.pos-topbar{background:#fff;border:1px solid #e3e6ea;border-radius:4px;padding:14px 20px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.pos-topbar__title{display:flex;align-items:center;gap:12px;min-width:0}
.pos-topbar__badge{width:44px;height:44px;border-radius:50%;background:#1577EB;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pos-title{font-size:16px;font-weight:700;color:#2f3640;margin:0;line-height:1.3}
.pos-slogan{font-size:12px;font-weight:400;color:#9aa1ac;margin-left:6px}
.pos-topbar__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pos-chip{display:inline-flex;align-items:center;gap:7px;border:1px solid #e3e6ea;background:#fafbfc;border-radius:20px;padding:6px 14px;font-size:12px;font-weight:700;color:#5b6470}
.pos-chip .pos-dot{width:8px;height:8px;border-radius:50%;background:#F39C12}
.pos-chip.is-open .pos-dot{background:#28a745}
.pos-chip.is-open{border-color:#b7e4c7;background:#f2fbf5;color:#155724}
.pos-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid #d7dce3;background:#fff;color:#333;border-radius:4px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .12s,border-color .12s;white-space:nowrap}
.pos-btn:hover{background:#f5f7fa;border-color:#c3c9d2}
.pos-btn:disabled{opacity:.45;cursor:not-allowed}
.pos-btn--primary{background:#1577EB;border-color:#1577EB;color:#fff}
.pos-btn--primary:hover{background:#0d5fc0;border-color:#0d5fc0}
.pos-btn--dark{background:#2f3640;border-color:#2f3640;color:#fff}
.pos-btn--dark:hover{background:#1f242b;border-color:#1f242b}
.pos-btn--warn{background:#F39C12;border-color:#F39C12;color:#fff}
.pos-btn--warn:hover{background:#d98a0b;border-color:#d98a0b}
.pos-btn--danger{background:#fff;border-color:#f1c0bc;color:#c2261c}
.pos-btn--danger:hover{background:#fdf3f2;border-color:#e08e86}
.pos-btn--sm{padding:6px 10px;font-size:12px}
.pos-link{color:#1577EB;font-size:12px;font-weight:700;background:none;border:none;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:5px;padding:0}
.pos-link:hover{text-decoration:underline}
.pos-link--danger{color:#c2261c}
.pos-link:disabled{opacity:.45;cursor:not-allowed;text-decoration:none}
.pos-box{background:#fff;border:1px solid #e3e6ea;border-radius:4px;margin-bottom:16px}
.pos-box__header{padding:13px 18px;border-bottom:1px solid #eef0f3;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.pos-box__title{font-size:14px;font-weight:700;color:#2f3640;display:flex;align-items:center;gap:8px}
.pos-box__content{padding:18px}
.pos-box__content--flush{padding:0}
.pos-alert{border-radius:4px;padding:12px 16px;margin-bottom:16px;font-size:13px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;line-height:1.5}
.pos-alert--open{background:#f2fbf5;border:1px solid #b7e4c7;color:#155724}
.pos-alert--closed{background:#fff8e6;border:1px solid #ffe1a1;color:#8a5a00}
.pos-alert--error{background:#fdf3f2;border:1px solid #f1c0bc;color:#a02015}
.pos-alert--success{background:#f2fbf5;border:1px solid #b7e4c7;color:#155724}
.pos-layout{display:grid;grid-template-columns:minmax(0,1fr) 460px;gap:16px;align-items:start}
@media(max-width:1240px){.pos-layout{grid-template-columns:minmax(0,1fr)}.pos-right{position:static!important}}
.pos-right{position:sticky;top:16px}
.pos-searchbar{display:flex;gap:8px;flex-wrap:wrap}
.pos-search-wrap{position:relative;flex:1;min-width:220px}
.pos-search-wrap>svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#aab1bc;pointer-events:none}
.pos-search{width:100%;border:1px solid #d7dce3;border-radius:4px;padding:12px 96px 12px 42px;font-size:14px;font-family:inherit;outline:none;background:#fff;color:#333}
.pos-search:focus{border-color:#1577EB;box-shadow:0 0 0 3px rgba(21,119,235,.12)}
.pos-search__hint{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:10px;font-weight:700;color:#9aa1ac;border:1px solid #e3e6ea;border-radius:3px;padding:2px 6px;background:#fafbfc;pointer-events:none}
.pos-sectors{display:flex;gap:6px;overflow-x:auto;padding:14px 0 2px;flex-wrap:wrap}
.pos-sector{border:1px solid #d7dce3;background:#fff;color:#5b6470;border-radius:20px;padding:7px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all .12s}
.pos-sector:hover{border-color:#9CBEE8;color:#1577EB}
.pos-sector.is-active{background:#1577EB;border-color:#1577EB;color:#fff}
.pos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:10px;max-height:640px;overflow-y:auto;padding:14px 18px 18px}
.pos-card{position:relative;border:1px solid #e3e6ea;border-radius:4px;background:#fff;padding:12px;text-align:left;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;gap:6px;min-height:142px;transition:border-color .12s,box-shadow .12s,transform .12s}
.pos-card:hover:not(:disabled){border-color:#1577EB;box-shadow:0 4px 14px rgba(21,119,235,.14);transform:translateY(-1px)}
.pos-card:disabled{cursor:not-allowed;background:#fafbfc;opacity:.55}
.pos-card__top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.pos-card__icon{width:30px;height:30px;border-radius:4px;background:#eaf3ff;color:#1577EB;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pos-card__icon--service{background:#f3ecff;color:#7c3aed}
.pos-card__stock{font-size:10px;font-weight:700;color:#9aa1ac;text-align:right;line-height:1.3}
.pos-card__stock.is-low{color:#b8860b}
.pos-card__stock.is-out{color:#c2261c}
.pos-card__name{font-size:13px;font-weight:700;color:#2f3640;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pos-card__ref{font-size:10px;color:#9aa1ac;font-family:ui-monospace,Menlo,Consolas,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pos-card__bottom{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:6px}
.pos-card__price{font-size:14px;font-weight:700;color:#2f3640}
.pos-card__add{width:26px;height:26px;border-radius:4px;background:#eaf3ff;color:#1577EB;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .12s}
.pos-card:hover .pos-card__add{opacity:1}
.pos-card__flag{position:absolute;left:12px;right:12px;bottom:6px;font-size:10px;font-weight:700;color:#c2261c}
.pos-empty{text-align:center;padding:44px 20px;color:#8a919c;font-size:13px;line-height:2}
.pos-empty svg{color:#d4d9e0;display:block;margin:0 auto 10px}
.pos-table{width:100%;border-collapse:collapse}
.pos-table thead th{font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:#8a919c;font-weight:700;padding:9px 8px;border-bottom:1px solid #e3e6ea;text-align:right;background:#fafbfc}
.pos-table thead th.text-left{text-align:left}
.pos-table tbody td{padding:8px;border-bottom:1px solid #f0f2f5;font-size:13px;text-align:right;vertical-align:middle}
.pos-table tbody tr:hover{background:#f8fafd}
.pos-table tfoot th{padding:8px;font-size:12px;color:#5b6470;text-align:right;font-weight:700}
.pos-table tfoot tr.pos-grand th{border-top:1px solid #e3e6ea;font-size:15px;color:#2f3640;padding:12px 8px}
.pos-line-title{font-weight:700;color:#2f3640;font-size:13px;text-align:left;display:block}
.pos-line-ref{font-size:10px;color:#9aa1ac;text-align:left;display:block;font-family:ui-monospace,Menlo,Consolas,monospace}
.pos-line-remove{cursor:pointer;color:#c2261c;background:none;border:none;padding:4px;display:inline-flex}
.pos-line-remove:hover{color:#e74c3c}
.pos-stepper{display:inline-flex;align-items:center;border:1px solid #d7dce3;border-radius:4px;overflow:hidden;background:#fff}
.pos-stepper button{background:none;border:none;cursor:pointer;padding:4px 7px;color:#28a745;display:flex;align-items:center}
.pos-stepper button:hover{background:#f2fbf5}
.pos-stepper input{width:44px;border:none;border-left:1px solid #eef0f3;border-right:1px solid #eef0f3;text-align:center;font-size:12px;font-weight:700;padding:5px 2px;outline:none;font-family:inherit;color:#333}
.pos-line-total{font-weight:700;color:#2f3640;white-space:nowrap}
.pos-field{margin-bottom:12px}
.pos-field:last-child{margin-bottom:0}
.pos-label{display:block;font-size:11px;font-weight:700;color:#5b6470;margin-bottom:5px;text-transform:uppercase;letter-spacing:.3px}
.pos-input{width:100%;border:1px solid #d7dce3;border-radius:4px;padding:9px 12px;font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit}
.pos-input:focus{border-color:#1577EB;box-shadow:0 0 0 3px rgba(21,119,235,.12)}
.pos-input::placeholder{color:#aab1bc}
.pos-input--money{text-align:right;font-weight:700}
.pos-input-group{display:flex;align-items:stretch;border:1px solid #d7dce3;border-radius:4px;overflow:hidden;background:#fff}
.pos-input-group:focus-within{border-color:#1577EB;box-shadow:0 0 0 3px rgba(21,119,235,.12)}
.pos-input-group__addon{background:#f2f4f7;border-right:1px solid #d7dce3;padding:8px 11px;font-size:12px;font-weight:700;color:#6b7280;display:flex;align-items:center;flex-shrink:0}
.pos-input-group .pos-input{border:none;box-shadow:none!important;border-radius:0}
.pos-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pos-note{font-size:11px;color:#8a919c;line-height:1.5;margin-top:6px}
.pos-collapse{border-bottom:1px solid #eef0f3}
.pos-collapse:last-child{border-bottom:none}
.pos-collapse__header{width:100%;display:flex;align-items:center;gap:10px;padding:12px 18px;background:none;border:none;cursor:pointer;font-family:inherit;font-size:13px;color:#333;text-align:left}
.pos-collapse__header:hover{background:#f8fafd}
.pos-collapse__icon{color:#8a919c;display:flex;flex-shrink:0}
.pos-collapse__value{color:#8a919c;font-size:12px;margin-left:auto;max-width:45%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pos-collapse__change{color:#1577EB;font-size:12px;font-weight:700;flex-shrink:0;display:flex;align-items:center;gap:4px}
.pos-collapse__content{padding:0 18px 14px}
.pos-pay-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.pos-pay{border:1px solid #d7dce3;background:#fff;color:#5b6470;border-radius:4px;padding:10px 6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:5px;transition:all .12s}
.pos-pay:hover{border-color:#9CBEE8;color:#1577EB}
.pos-pay.is-active{background:#1577EB;border-color:#1577EB;color:#fff}
.pos-change-box{margin-top:10px;border:1px solid #b7e4c7;background:#f2fbf5;border-radius:4px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between}
.pos-change-box span{font-size:11px;font-weight:700;color:#155724;text-transform:uppercase;letter-spacing:.3px}
.pos-change-box strong{font-size:19px;color:#155724}
.pos-quick{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.pos-quick button{border:1px solid #d7dce3;background:#fff;border-radius:20px;padding:6px 12px;font-size:11px;font-weight:700;color:#5b6470;cursor:pointer;font-family:inherit}
.pos-quick button:hover{border-color:#1577EB;color:#1577EB;background:#eaf3ff}
.pos-apply{display:flex;align-items:center;justify-content:center;gap:9px;width:calc(100% - 36px);margin:18px;padding:16px;border-radius:4px;background:#1577EB;color:#fff;border:none;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:filter .12s}
.pos-apply:hover{filter:brightness(1.08)}
.pos-apply:disabled{background:#c3c9d2;cursor:not-allowed;filter:none}
.pos-apply small{font-weight:400;opacity:.85;font-size:12px}
.pos-shortcuts{display:flex;gap:14px;flex-wrap:wrap;padding:10px 18px;border-top:1px solid #eef0f3;background:#fafbfc;border-radius:0 0 4px 4px}
.pos-shortcut{font-size:11px;color:#8a919c;display:flex;align-items:center;gap:5px}
.pos-kbd{border:1px solid #d7dce3;border-bottom-width:2px;border-radius:3px;background:#fff;padding:1px 6px;font-size:10px;font-weight:700;color:#5b6470;font-family:ui-monospace,Menlo,Consolas,monospace}
.pos-modal{position:fixed;inset:0;z-index:400;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(16,24,40,.55)}
.pos-modal__panel{background:#fff;border-radius:6px;width:100%;max-width:460px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(16,24,40,.35)}
.pos-modal__panel--wide{max-width:640px}
.pos-modal__header{padding:16px 20px;border-bottom:1px solid #eef0f3;display:flex;align-items:center;justify-content:space-between;gap:12px}
.pos-modal__title{font-size:15px;font-weight:700;color:#2f3640;margin:0}
.pos-modal__close{background:none;border:none;cursor:pointer;color:#9aa1ac;padding:4px;display:flex}
.pos-modal__close:hover{color:#2f3640}
.pos-modal__body{padding:20px}
.pos-modal__footer{padding:0 20px 20px;display:flex;gap:10px}
.pos-modal__footer .pos-btn{flex:1;padding:13px}
.pos-keypad__display{border:1px solid #d7dce3;border-radius:4px;background:#fafbfc;padding:14px 16px;text-align:right;margin-bottom:14px}
.pos-keypad__display small{display:block;font-size:11px;font-weight:700;color:#9aa1ac;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
.pos-keypad__display strong{font-size:28px;color:#2f3640;font-weight:700;letter-spacing:-.5px}
.pos-keypad{display:grid;grid-template-columns:repeat(3,1fr) 96px;gap:8px}
.pos-key{border:1px solid #d7dce3;background:#fff;border-radius:4px;height:54px;font-size:19px;font-weight:700;color:#2f3640;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center}
.pos-key:hover{background:#f5f7fa;border-color:#c3c9d2}
.pos-key--fn{background:#fafbfc;color:#5b6470;font-size:13px}
.pos-key--ok{grid-row:span 2;background:#1577EB;border-color:#1577EB;color:#fff}
.pos-key--ok:hover{background:#0d5fc0}
.pos-held{border:1px solid #e3e6ea;border-radius:4px;padding:12px 14px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;gap:10px}
.pos-held:last-child{margin-bottom:0}
.pos-held__name{font-size:13px;font-weight:700;color:#2f3640}
.pos-held__meta{font-size:11px;color:#9aa1ac;margin-top:2px}
.pos-badge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;border-radius:9px;background:#F39C12;color:#fff;font-size:10px;font-weight:700;padding:0 5px}
.pos-success{text-align:center;padding:26px 20px}
.pos-success__icon{width:60px;height:60px;border-radius:50%;background:#f2fbf5;color:#28a745;display:flex;align-items:center;justify-content:center;margin:0 auto 14px}
.pos-success__total{font-size:30px;font-weight:700;color:#2f3640;letter-spacing:-.5px}
.pos-summary{border:1px solid #e3e6ea;border-radius:4px;background:#fafbfc;padding:14px;margin:16px 0;text-align:left}
.pos-summary__row{display:flex;justify-content:space-between;font-size:12px;color:#5b6470;padding:3px 0}
.pos-summary__row strong{color:#2f3640}
.pos-help{text-align:center;padding:30px 0 6px}
.pos-help button{background:none;border:none;color:#1098f7;font-size:13px;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px}
.pos-help button:hover{text-decoration:underline}
.text-right{text-align:right}
.text-left{text-align:left}
`;

interface POSViewProps {
  onOpenScanner?: (onSelect: (p: Produto) => void) => void;
}

interface CartLine {
  product: Produto;
  quantity: number;
}

interface CompletedSale {
  numero: string;
  total: number;
  troco: number;
  fatura: Fatura;
}

interface HeldSale {
  id: string;
  cart: CartLine[];
  cliente: ClienteDoc;
  payment: string;
  restaurantMode: "Mesa" | "Takeaway" | "Delivery";
  restaurantTable: string;
  prescriptionNumber: string;
  discountPercent: string;
  discountAmount: string;
  savedAt: string;
}

const PAYMENT_METHODS = [
  { value: "Numerário", label: "Numerário", icon: Banknote },
  { value: "Multicaixa (TPA)", label: "TPA", icon: CreditCard },
  { value: "Multicaixa Express", label: "Express", icon: CreditCard },
  { value: "Transferência Bancária", label: "Transferência", icon: CreditCard },
  { value: "Cheque", label: "Cheque", icon: Receipt },
  { value: "Crédito a 30 dias", label: "Crédito", icon: Clock },
  { value: "Misto", label: "Misto", icon: Calculator },
] as const;

type KeypadTarget = "cash" | "mixedCash" | "mixedReceived" | "opening" | "closing" | null;

function todayStr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function addDaysStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function isServiceProduct(product: Produto): boolean {
  const unit = (product.unidadeMedida || "").toLowerCase();
  const category = (product.categoria || "").toLowerCase();
  return ["serv", "exame", "hora", "dia"].includes(unit) ||
    category.includes("serviço") || category.includes("servico") || category.includes("consult");
}
function productSector(product: Produto): "Farmácia" | "Restaurante" | "Serviços" | "Comércio" {
  const text = `${product.nome} ${product.categoria} ${product.descricao || ""}`.toLowerCase();
  if (text.includes("farm") || text.includes("medic") || text.includes("saúde") || text.includes("saude") || text.includes("hospital")) return "Farmácia";
  if (text.includes("rest") || text.includes("bebida") || text.includes("aliment") || text.includes("cozinha") || text.includes("menu")) return "Restaurante";
  if (isServiceProduct(product)) return "Serviços";
  return "Comércio";
}
function parseExpiry(value?: string): Date | null {
  if (!value) return null;
  const parts = value.split("/");
  const date = parts.length === 3
    ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function formatUnit(unit: string): string { return unit === "un" ? "un." : unit; }
function nowStamp(): string { return new Date().toLocaleString("pt-AO", { dateStyle: "short", timeStyle: "medium" }); }
function qtyStep(product: Produto): number {
  return product.unidadeMedida === "kg" || product.unidadeMedida === "l" ? 0.1 : 1;
}

/* ------------------------------------------------------------ teclado ---- */
const Keypad: React.FC<{
  label: string; value: string; currency: string;
  onChange: (next: string) => void; onClose: () => void;
}> = ({ label, value, currency, onChange, onClose }) => {
  const press = (key: string) => {
    if (key === "back") { onChange(value.length <= 1 ? "0" : value.slice(0, -1)); return; }
    if (key === "clean") { onChange("0"); return; }
    if (key === ",") { if (!value.includes(",")) onChange(`${value},`); return; }
    if (value === "0") { onChange(key); return; }
    if (value.replace(/[^0-9]/g, "").length >= 10) return;
    onChange(value + key);
  };
  const numeric = parseFloat(value.replace(",", ".")) || 0;
  return (
    <div className="pos-modal" role="dialog" aria-modal="true" aria-label={label}>
      <div className="pos-modal__panel">
        <div className="pos-modal__header">
          <h3 className="pos-modal__title">{label}</h3>
          <button type="button" className="pos-modal__close" onClick={onClose} aria-label="Fechar teclado"><X className="w-5 h-5" /></button>
        </div>
        <div className="pos-modal__body">
          <div className="pos-keypad__display">
            <small>Valor</small>
            <strong>{formatCurrency(numeric, currency)}</strong>
          </div>
          <div className="pos-keypad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "00"].map((key) => (
              <button type="button" key={key} className="pos-key" onClick={() => press(key)}>{key}</button>
            ))}
            <button type="button" className="pos-key pos-key--fn" onClick={() => press("back")} aria-label="Apagar"><Delete className="w-5 h-5" /></button>
            <button type="button" className="pos-key pos-key--fn" onClick={() => press("clean")} aria-label="Limpar"><X className="w-5 h-5" /></button>
            <button type="button" className="pos-key pos-key--ok" onClick={onClose}><Check className="w-6 h-6" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- POS ---- */
export const POSView: React.FC<POSViewProps> = ({ onOpenScanner }) => {
  const {
    faturas, produtos, pacientes, config, currentUser,
    addFatura, addPaciente, findProdutoByBarcodeOrCode, updateConfig,
  } = useApp();

  const [search, setSearch] = useState("");
  const [sector, setSector] = useState<"Todos" | "Farmácia" | "Restaurante" | "Serviços" | "Comércio">("Todos");
  const [cart, setCart] = useState<CartLine[]>([]);

  /* adquirente: cliente registado OU não é cliente */
  const [cliente, setCliente] = useState<ClienteDoc>(criarConsumidorFinal());

  const [payment, setPayment] = useState("Multicaixa (TPA)");
  const [cashReceived, setCashReceived] = useState<number | "">("");
  const [paymentReference, setPaymentReference] = useState("");
  const [mixedCashAmount, setMixedCashAmount] = useState<number | "">("");
  const [openingCash, setOpeningCash] = useState<number | "">("");
  const [closingCash, setClosingCash] = useState<number | "">("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [cashModal, setCashModal] = useState<"open" | "close" | null>(null);
  const [restaurantMode, setRestaurantMode] = useState<"Mesa" | "Takeaway" | "Delivery">("Mesa");
  const [restaurantTable, setRestaurantTable] = useState("");
  const [prescriptionNumber, setPrescriptionNumber] = useState("");
  const [showCustomer, setShowCustomer] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [showHeld, setShowHeld] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [keypadTarget, setKeypadTarget] = useState<KeypadTarget>(null);
  const [keypadBuffer, setKeypadBuffer] = useState("0");
  const [openBoxes, setOpenBoxes] = useState<Record<string, boolean>>({});
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false);
  const [novoCliNome, setNovoCliNome] = useState("");
  const [novoCliNif, setNovoCliNif] = useState("");
  const [novoCliTel, setNovoCliTel] = useState("");
  const [novoCliEnd, setNovoCliEnd] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);
  const toggleBox = (key: string) => setOpenBoxes((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => { searchRef.current?.focus(); }, []);

  const sectors = ["Todos", "Comércio", "Farmácia", "Restaurante", "Serviços"] as const;

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return produtos
      .filter((product) => product.ativo)
      .filter((product) => sector === "Todos" || productSector(product) === sector)
      .filter((product) => {
        if (!query) return true;
        return [product.nome, product.codigo, product.codigoBarras, product.categoria]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));
      })
      .slice(0, 120);
  }, [produtos, search, sector]);

  const totals = useMemo(() => {
    const rate = config.ivaTaxa || 0;
    const gross = cart.reduce((sum, line) => sum + line.quantity * line.product.preco, 0);
    const grossIva = cart.reduce(
      (sum, line) => sum + (line.product.ivaIsento ? 0 : line.quantity * line.product.preco * (rate / 100)),
      0,
    );
    const pct = Math.max(0, Math.min(100, parseFloat(discountPercent.replace(",", ".")) || 0));
    const amt = Math.max(0, parseFloat(discountAmount.replace(",", ".")) || 0);
    const discount = pct > 0 ? gross * (pct / 100) : Math.min(amt, gross);
    const factor = gross > 0 ? (gross - discount) / gross : 1;
    const totalIva = grossIva * factor;
    return {
      subtotalBruto: gross,
      descontoValor: discount,
      descontoPercent: pct,
      subtotal: gross - discount,
      totalIva,
      total: gross - discount + totalIva,
    };
  }, [cart, config.ivaTaxa, discountPercent, discountAmount]);

  const change = payment === "Numerário" && typeof cashReceived === "number"
    ? Math.max(0, cashReceived - totals.total)
    : payment === "Misto" && typeof cashReceived === "number" && typeof mixedCashAmount === "number"
      ? Math.max(0, cashReceived - mixedCashAmount)
      : 0;

  const activeSession = config.caixaSessaoAtual;
  const cartSector = cart.length > 0 ? productSector(cart[0].product) : sector;

  const sessionSales = useMemo(() => {
    if (!activeSession) return [];
    return faturas.filter((fatura) => fatura.caixaSessaoId === activeSession.id && fatura.estado !== "anulada");
  }, [activeSession, faturas]);

  const expectedCash = useMemo(() => {
    if (!activeSession) return 0;
    const cashSales = sessionSales.reduce((sum, fatura) => {
      const detail = fatura.formasPagamentoDetalhe || [];
      const detailCash = detail.filter((item) => item.forma === "Numerário").reduce((v, item) => v + item.valor, 0);
      return sum + (detail.length > 0 ? detailCash : fatura.formaPagamento === "Numerário" ? fatura.total : 0);
    }, 0);
    return activeSession.fundoInicial + cashSales;
  }, [activeSession, sessionSales]);

  const sessionTotals = useMemo(() => ({
    valor: sessionSales.reduce((sum, f) => sum + f.total, 0),
    qtd: sessionSales.length,
  }), [sessionSales]);

  /* -------- caixa -------- */
  const openCashSession = () => {
    const fundo = typeof openingCash === "number" ? openingCash : 0;
    if (fundo < 0) { setFeedback({ type: "error", text: "O fundo inicial não pode ser negativo." }); return; }
    const session: CaixaSessao = {
      id: `cx-${Date.now()}`,
      terminal: config.configuracaoFiscal?.terminalCaixa || "POS-01",
      operador: currentUser.nome,
      abertaEm: nowStamp(),
      fundoInicial: fundo,
      estado: "aberta",
    };
    updateConfig({ caixaSessaoAtual: session });
    setCashModal(null);
    setOpeningCash("");
    setFeedback({ type: "success", text: `Caixa aberta com fundo de ${formatCurrency(fundo, config.moeda)}.` });
  };

  const closeCashSession = () => {
    if (!activeSession) return;
    if (typeof closingCash !== "number" || closingCash < 0) {
      setFeedback({ type: "error", text: "Informe o valor contado na caixa para fechar o turno." });
      return;
    }
    const closedSession: CaixaSessao = {
      ...activeSession,
      estado: "fechada",
      fechadaEm: nowStamp(),
      valorEsperado: expectedCash,
      valorContado: closingCash,
      diferenca: closingCash - expectedCash,
    };
    updateConfig({
      caixaSessaoAtual: undefined,
      historicoCaixa: [closedSession, ...(config.historicoCaixa || [])].slice(0, 100),
    });
    setCashModal(null);
    setClosingCash("");
    setFeedback({
      type: "success",
      text: `Caixa fechada. Esperado: ${formatCurrency(expectedCash, config.moeda)} · Contado: ${formatCurrency(closingCash, config.moeda)}.`,
    });
  };

  /* -------- carrinho -------- */
  const addToCart = useCallback((product: Produto, requestedQuantity = 1) => {
    setFeedback(null);
    const service = isServiceProduct(product);
    setCart((previous) => {
      const currentQuantity = previous.find((line) => line.product.id === product.id)?.quantity || 0;
      const step = qtyStep(product);
      const quantity = Math.max(step, requestedQuantity);
      if (!service && currentQuantity + quantity > product.stock) {
        setFeedback({ type: "error", text: `${product.nome} só tem ${product.stock} ${formatUnit(product.unidadeMedida)} disponível em stock.` });
        return previous;
      }
      const existing = previous.find((line) => line.product.id === product.id);
      if (existing) {
        return previous.map((line) => (line.product.id === product.id ? { ...line, quantity: line.quantity + quantity } : line));
      }
      return [...previous, { product, quantity }];
    });
  }, []);

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || !search.trim()) return;
    const exact = findProdutoByBarcodeOrCode(search.trim());
    if (exact) { addToCart(exact); setSearch(""); return; }
    if (filteredProducts.length >= 1) { addToCart(filteredProducts[0]); setSearch(""); return; }
    setFeedback({ type: "error", text: "Não foi encontrado um produto exacto para esse código." });
  };

  const updateQuantity = (productId: number, delta: number) => {
    const line = cart.find((item) => item.product.id === productId);
    if (!line) return;
    const step = qtyStep(line.product);
    const nextQuantity = Math.max(0, Number((line.quantity + delta * step).toFixed(3)));
    if (nextQuantity > line.quantity && !isServiceProduct(line.product) && nextQuantity > line.product.stock) {
      setFeedback({ type: "error", text: `${line.product.nome} só tem ${line.product.stock} ${formatUnit(line.product.unidadeMedida)} disponível em stock.` });
      return;
    }
    setCart((previous) =>
      nextQuantity > 0
        ? previous.map((item) => (item.product.id === productId ? { ...item, quantity: nextQuantity } : item))
        : previous.filter((item) => item.product.id !== productId),
    );
  };

  const setLineQuantity = (productId: number, raw: string) => {
    const line = cart.find((item) => item.product.id === productId);
    if (!line) return;
    const parsed = parseFloat(raw.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) return;
    const nextQuantity = Number(Math.max(qtyStep(line.product), parsed).toFixed(3));
    if (!isServiceProduct(line.product) && nextQuantity > line.product.stock) {
      setFeedback({ type: "error", text: `${line.product.nome} só tem ${line.product.stock} ${formatUnit(line.product.unidadeMedida)} disponível em stock.` });
      return;
    }
    setCart((previous) => previous.map((item) => (item.product.id === productId ? { ...item, quantity: nextQuantity } : item)));
  };

  /* -------- vendas pausadas -------- */
  const holdSale = useCallback(() => {
    if (cart.length === 0) { setFeedback({ type: "error", text: "Não há artigos para pausar." }); return; }
    const held: HeldSale = {
      id: `hold-${Date.now()}`, cart, cliente, payment, restaurantMode, restaurantTable,
      prescriptionNumber, discountPercent, discountAmount, savedAt: nowStamp(),
    };
    setHeldSales((prev) => [held, ...prev].slice(0, 12));
    setCart([]);
    setCliente(criarConsumidorFinal());
    setDiscountPercent(""); setDiscountAmount("");
    setRestaurantTable(""); setPrescriptionNumber("");
    setCashReceived(""); setPaymentReference(""); setMixedCashAmount("");
    setFeedback({ type: "success", text: "Venda pausada. Pode retomá-la quando quiser." });
    searchRef.current?.focus();
  }, [cart, cliente, payment, restaurantMode, restaurantTable, prescriptionNumber, discountPercent, discountAmount]);

  const restoreHeld = (held: HeldSale) => {
    if (cart.length > 0) {
      setHeldSales((prev) => [
        { ...held, cart, cliente, payment, restaurantMode, restaurantTable, prescriptionNumber, discountPercent, discountAmount, savedAt: nowStamp() },
        ...prev.filter((item) => item.id !== held.id),
      ]);
    } else {
      setHeldSales((prev) => prev.filter((item) => item.id !== held.id));
    }
    setCart(held.cart);
    setCliente(held.cliente);
    setPayment(held.payment);
    setRestaurantMode(held.restaurantMode);
    setRestaurantTable(held.restaurantTable);
    setPrescriptionNumber(held.prescriptionNumber);
    setDiscountPercent(held.discountPercent);
    setDiscountAmount(held.discountAmount);
    setShowHeld(false);
    setFeedback({ type: "success", text: "Venda retomada." });
  };

  /* -------- teclado -------- */
  const openKeypad = (target: Exclude<KeypadTarget, null>) => {
    const current =
      target === "cash" ? cashReceived
        : target === "mixedCash" ? mixedCashAmount
          : target === "mixedReceived" ? cashReceived
            : target === "opening" ? openingCash
              : closingCash;
    setKeypadTarget(target);
    setKeypadBuffer(typeof current === "number" && current > 0 ? String(current).replace(".", ",") : "0");
  };

  const applyKeypad = (next: string) => {
    setKeypadBuffer(next);
    const parsed = parseFloat(next.replace(",", "."));
    const value: number | "" = Number.isFinite(parsed) ? parsed : "";
    if (keypadTarget === "cash" || keypadTarget === "mixedReceived") setCashReceived(value);
    else if (keypadTarget === "mixedCash") setMixedCashAmount(value);
    else if (keypadTarget === "opening") setOpeningCash(value);
    else if (keypadTarget === "closing") setClosingCash(value);
  };

  /* -------- novo cliente rápido -------- */
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCliNome.trim()) return;
    const novo = await addPaciente({
      nome: novoCliNome.trim(),
      nif: novoCliNif.trim() || undefined,
      telefone: novoCliTel.trim() || undefined,
      endereco: novoCliEnd.trim() || undefined,
    });
    setCliente(clienteDePaciente(novo));
    setShowNovoClienteModal(false);
    setNovoCliNome(""); setNovoCliNif(""); setNovoCliTel(""); setNovoCliEnd("");
  };

  /* -------- validação -------- */
  const validateSale = (): string | null => {
    if (!activeSession) return "Abra a caixa antes de emitir uma venda.";
    if (cart.length === 0) return "Adicione pelo menos um produto ou serviço ao carrinho.";
    for (const line of cart) {
      if (!isServiceProduct(line.product) && line.quantity > line.product.stock) {
        return `${line.product.nome} já não tem quantidade suficiente em stock. Actualize o carrinho.`;
      }
      const expiry = parseExpiry(line.product.dataValidade);
      if (expiry && expiry < new Date() && productSector(line.product) === "Farmácia") {
        return `${line.product.nome} está fora da validade e não pode ser vendido.`;
      }
    }
    if (totals.descontoValor >= totals.subtotalBruto && totals.subtotalBruto > 0) {
      return "O desconto não pode ser igual ou superior ao total da venda.";
    }
    if (payment === "Numerário" && (typeof cashReceived !== "number" || cashReceived < totals.total)) {
      return "O valor recebido em numerário é inferior ao total da venda.";
    }
    if (payment === "Misto") {
      const cashPart = typeof mixedCashAmount === "number" ? mixedCashAmount : 0;
      if (cashPart < 0 || cashPart > totals.total) return "A parte em numerário do pagamento misto é inválida.";
      if (cashPart > 0 && (typeof cashReceived !== "number" || cashReceived < cashPart)) {
        return "O valor recebido em numerário é inferior à parte definida no pagamento misto.";
      }
      if (totals.total - cashPart > 0 && !paymentReference.trim()) {
        return "Informe a referência da parte paga por TPA ou transferência.";
      }
    }
    if (payment !== "Numerário" && payment !== "Misto" && payment !== "Crédito a 30 dias" && !paymentReference.trim()) {
      return "Informe a referência do pagamento ou confirme o número do TPA.";
    }
    return null;
  };

  const canComplete = Boolean(activeSession) && cart.length > 0 && !saving;

  /* -------- emissão -------- */
  const completeSale = useCallback(async () => {
    const validationError = validateSale();
    if (validationError) { setFeedback({ type: "error", text: validationError }); return; }

    setSaving(true);
    setFeedback(null);
    try {
      const isCredit = payment === "Crédito a 30 dias";
      const mixedCash = payment === "Misto" && typeof mixedCashAmount === "number" ? mixedCashAmount : 0;
      const mixedElectronic = Math.max(0, totals.total - mixedCash);
      const stamp = Date.now();
      const paymentDetails = payment === "Misto"
        ? [
          ...(mixedCash > 0 ? [{
            id: `payment-cash-${stamp}`, forma: "Numerário", valor: mixedCash,
            valorRecebido: typeof cashReceived === "number" ? cashReceived : mixedCash,
          }] : []),
          ...(mixedElectronic > 0 ? [{
            id: `payment-electronic-${stamp}`, forma: "Multicaixa (TPA)", valor: mixedElectronic,
            referencia: paymentReference.trim() || undefined,
          }] : []),
        ]
        : [{
          id: `payment-${stamp}`, forma: payment, valor: totals.total,
          valorRecebido: payment === "Numerário" ? Number(cashReceived) : undefined,
          referencia: paymentReference.trim() || undefined,
        }];

      const docCliente = clienteParaDocumento(cliente);

      const fatura = await addFatura({
        serie: config.serie,
        data: todayStr(),
        dataVencimento: isCredit ? addDaysStr(30) : todayStr(),
        ...docCliente,
        clienteNome: docCliente.clienteNome || NOME_CONSUMIDOR_FINAL,
        linhas: cart.map((line) => ({
          id: `pos-line-${line.product.id}-${stamp}`,
          produtoId: line.product.id,
          codigo: line.product.codigo,
          descricao: line.product.nome,
          quantidade: line.quantity,
          precoUnitario: line.product.preco,
          ivaIsento: line.product.ivaIsento,
          unidade: line.product.unidadeMedida,
          lote: line.product.loteAtual,
          dataValidade: line.product.dataValidade,
        })),
        subtotalSemIva: totals.subtotal,
        totalIva: totals.totalIva,
        ivaTaxa: config.ivaTaxa || 0,
        desconto: totals.descontoPercent > 0 ? totals.descontoPercent : undefined,
        total: totals.total,
        estado: isCredit ? "emitida" : "paga",
        observacoes: [
          `Venda POS · ${productSector(cart[0].product)} · Operador: ${currentUser.nome}`,
          cliente.consumidorFinal && !cliente.nif.trim() ? `Adquirente: ${NOME_CONSUMIDOR_FINAL} (não é cliente)` : "",
          cartSector === "Restaurante" ? `Atendimento: ${restaurantMode}${restaurantTable ? ` · Mesa ${restaurantTable}` : ""}` : "",
          cartSector === "Farmácia" && prescriptionNumber ? `Receita: ${prescriptionNumber}` : "",
          totals.descontoValor > 0 ? `Desconto comercial: ${formatCurrency(totals.descontoValor, config.moeda)}` : "",
        ].filter(Boolean).join(" · "),
        tipoDocumento: "factura-recibo",
        formaPagamento: payment === "Misto" ? "Pagamento misto" : payment,
        formasPagamentoDetalhe: paymentDetails,
        emitidoPor: currentUser.nome,
        caixaSessaoId: activeSession?.id,
        terminalCaixa: activeSession?.terminal,
      });

      setCompletedSale({ numero: fatura.numero, total: totals.total, troco: change, fatura });
      setCart([]);
      setCliente(criarConsumidorFinal());
      setCashReceived(""); setPaymentReference(""); setMixedCashAmount("");
      setDiscountPercent(""); setDiscountAmount("");
      setRestaurantTable(""); setPrescriptionNumber("");
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Não foi possível emitir a venda. O carrinho foi mantido.",
      });
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, payment, totals, cashReceived, mixedCashAmount, paymentReference, cliente, config, currentUser, cartSector, restaurantMode, restaurantTable, prescriptionNumber, activeSession, change, addFatura]);

  const closeCompletedSale = () => { setCompletedSale(null); searchRef.current?.focus(); };

  /* -------- leitor de códigos + atalhos -------- */
  useEffect(() => {
    let barcodeBuffer = "";
    let lastKeyTime = Date.now();

    const handleKeyboardScanner = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      if (event.key === "F2") { event.preventDefault(); searchRef.current?.focus(); return; }
      if (event.key === "F4") { event.preventDefault(); if (canComplete) void completeSale(); return; }
      if (event.key === "F9") { event.preventDefault(); holdSale(); return; }
      if (event.key === "Escape") {
        setCashModal(null); setKeypadTarget(null); setCompletedSale(null);
        setShowHeld(false); setConfirmClear(false); setShowNovoClienteModal(false);
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 120) barcodeBuffer = "";
      lastKeyTime = now;

      if (event.key === "Enter") {
        if (barcodeBuffer.length >= 3) {
          const product = findProdutoByBarcodeOrCode(barcodeBuffer);
          if (product) { event.preventDefault(); addToCart(product); }
          else setFeedback({ type: "error", text: `Código "${barcodeBuffer}" não encontrado no catálogo.` });
        }
        barcodeBuffer = "";
      } else if (event.key.length === 1) {
        barcodeBuffer += event.key;
      }
    };

    window.addEventListener("keydown", handleKeyboardScanner);
    return () => window.removeEventListener("keydown", handleKeyboardScanner);
  }, [findProdutoByBarcodeOrCode, addToCart, canComplete, completeSale, holdSale]);

  const keypadLabel =
    keypadTarget === "cash" || keypadTarget === "mixedReceived" ? "Valor recebido em numerário"
      : keypadTarget === "mixedCash" ? "Parte em numerário"
        : keypadTarget === "opening" ? "Fundo inicial de caixa"
          : "Valor contado na caixa";

  const adquirenteLabel = cliente.consumidorFinal && !cliente.nif.trim()
    ? NOME_CONSUMIDOR_FINAL
    : cliente.nome || NOME_CONSUMIDOR_FINAL;

  return (
    <div className="pos-root" data-testid="view-pos">
      <style>{POS_CSS}</style>

      <div className="pos-container">
        <ul className="pos-breadcrumb">
          <li>POS</li>
          <li className="active">Frente de Caixa</li>
        </ul>

        {/* ===== barra superior ===== */}
        <div className="pos-topbar">
          <div className="pos-topbar__title">
            <span className="pos-topbar__badge"><ShoppingCart className="w-5 h-5" /></span>
            <div>
              <h2 className="pos-title">
                Ponto de Venda
                <span className="pos-slogan">Frente de caixa · {config.configuracaoFiscal?.terminalCaixa || "POS-01"}</span>
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#8a919c" }}>
                Operador <strong style={{ color: "#5b6470" }}>{currentUser.nome}</strong>
                {activeSession && <> · turno aberto desde {activeSession.abertaEm}</>}
              </p>
            </div>
          </div>
          <div className="pos-topbar__actions">
            <span className={`pos-chip ${activeSession ? "is-open" : ""}`}>
              <span className="pos-dot" />
              {activeSession ? "Caixa aberta" : "Caixa fechada"}
            </span>
            {heldSales.length > 0 && (
              <button type="button" className="pos-btn pos-btn--sm" onClick={() => setShowHeld(true)}>
                <Pause className="w-4 h-4" /> Pausadas <span className="pos-badge">{heldSales.length}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setCashModal(activeSession ? "close" : "open")}
              className={`pos-btn pos-btn--sm ${activeSession ? "pos-btn--dark" : "pos-btn--warn"}`}
              data-testid={activeSession ? "button-pos-close-cash" : "button-pos-open-cash"}
            >
              {activeSession ? <><X className="w-4 h-4" /> Fechar caixa</> : <><Play className="w-4 h-4" /> Abrir caixa</>}
            </button>
          </div>
        </div>

        {/* ===== estado da caixa ===== */}
        <div className={`pos-alert ${activeSession ? "pos-alert--open" : "pos-alert--closed"}`} data-testid="panel-pos-cash-session">
          <div>
            {activeSession ? (
              <>
                <strong>Turno aberto</strong> · fundo inicial {formatCurrency(activeSession.fundoInicial, config.moeda)}
                <span style={{ margin: "0 6px" }}>·</span>
                {sessionTotals.qtd} venda(s) no valor de {formatCurrency(sessionTotals.valor, config.moeda)}
                <span style={{ margin: "0 6px" }}>·</span>
                numerário esperado <strong>{formatCurrency(expectedCash, config.moeda)}</strong>
              </>
            ) : (
              <>
                <strong>A caixa está fechada.</strong> Abra um turno antes de emitir vendas para manter o fecho e a conferência correctos.
              </>
            )}
          </div>
          {activeSession && <button type="button" className="pos-link" onClick={() => setCashModal("close")}>Conferir</button>}
        </div>

        {/* ===== feedback ===== */}
        {feedback && (
          <div
            className={`pos-alert ${feedback.type === "error" ? "pos-alert--error" : "pos-alert--success"}`}
            role="status" aria-live="polite" data-testid="status-pos-feedback"
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {feedback.type === "error" ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {feedback.text}
            </span>
            <button type="button" onClick={() => setFeedback(null)} className="pos-modal__close" aria-label="Fechar mensagem" data-testid="button-close-feedback">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===== layout ===== */}
        <div className="pos-layout">

          {/* ---------- catálogo ---------- */}
          <div className="pos-box" style={{ marginBottom: 0 }}>
            <div className="pos-box__header">
              <div className="pos-box__title"><Package className="w-4 h-4" style={{ color: "#1577EB" }} /> Catálogo <span className="pos-slogan">Produtos e Serviços</span></div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#8a919c" }}>{filteredProducts.length} itens</span>
                {onOpenScanner && (
                  <button type="button" className="pos-btn pos-btn--sm" onClick={() => onOpenScanner((product) => addToCart(product))} data-testid="button-pos-scan">
                    <Barcode className="w-4 h-4" style={{ color: "#1577EB" }} /> Ler código
                  </button>
                )}
              </div>
            </div>

            <div className="pos-box__content" style={{ paddingBottom: 0 }}>
              <div className="pos-searchbar">
                <div className="pos-search-wrap">
                  <Search className="w-5 h-5" />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Pesquisar e adicionar ao documento"
                    className="pos-search"
                    aria-label="Pesquisar produto"
                    autoComplete="off"
                    data-testid="input-pos-search"
                  />
                  <span className="pos-search__hint">F2</span>
                </div>
                <button type="button" className="pos-btn" onClick={() => { setSearch(""); searchRef.current?.focus(); }}>
                  <List className="w-4 h-4" /> Ver todos
                </button>
              </div>

              <div className="pos-sectors" role="tablist" aria-label="Sectores de venda">
                {sectors.map((item) => (
                  <button
                    type="button" key={item} role="tab" aria-selected={sector === item}
                    onClick={() => setSector(item)}
                    className={`pos-sector ${sector === item ? "is-active" : ""}`}
                    data-testid={`button-pos-sector-${item.toLowerCase()}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="pos-grid" data-testid="grid-pos-products">
              {filteredProducts.map((product) => {
                const service = isServiceProduct(product);
                const expiry = parseExpiry(product.dataValidade);
                const expired = Boolean(expiry && expiry < new Date());
                const unavailable = !service && product.stock <= 0;
                const lowStock = !service && product.stock > 0 && product.stock <= product.stockMinimo;
                return (
                  <button
                    type="button" key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={unavailable || expired}
                    className="pos-card"
                    data-testid={`card-pos-product-${product.id}`}
                  >
                    <div className="pos-card__top">
                      <span className={`pos-card__icon ${service ? "pos-card__icon--service" : ""}`}>
                        {service ? <Receipt className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                      </span>
                      {!service ? (
                        <span className={`pos-card__stock ${unavailable ? "is-out" : lowStock ? "is-low" : ""}`}>
                          {product.stock} {formatUnit(product.unidadeMedida)}
                          {lowStock && <><br />mínimo {product.stockMinimo}</>}
                        </span>
                      ) : (
                        <span className="pos-card__stock">serviço</span>
                      )}
                    </div>
                    <span className="pos-card__name">{product.nome}</span>
                    <span className="pos-card__ref">{product.codigo} · {product.categoria}</span>
                    <div className="pos-card__bottom">
                      <span className="pos-card__price">{formatCurrency(product.preco, config.moeda)}</span>
                      <span className="pos-card__add"><Plus className="w-4 h-4" /></span>
                    </div>
                    {expired && <span className="pos-card__flag">Fora da validade</span>}
                    {unavailable && !expired && <span className="pos-card__flag" style={{ color: "#8a919c" }}>Sem stock</span>}
                  </button>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="pos-empty" style={{ gridColumn: "1 / -1" }}>
                  <Search className="w-10 h-10" />
                  Nenhum produto encontrado.
                  <br />
                  Pesquise por nome, SKU ou código de barras.
                </div>
              )}
            </div>
          </div>

          {/* ---------- venda ---------- */}
          <div className="pos-right">
            <div className="pos-box" style={{ marginBottom: 0 }}>
              <div className="pos-box__header">
                <div className="pos-box__title">
                  <ShoppingCart className="w-4 h-4" style={{ color: "#1577EB" }} />
                  Venda actual
                  <span className="pos-slogan">{cart.length} {cart.length === 1 ? "artigo" : "artigos"}</span>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button type="button" className="pos-link" onClick={holdSale} disabled={cart.length === 0}>
                    <Pause className="w-3.5 h-3.5" /> Pausar <span className="pos-kbd">F9</span>
                  </button>
                  {cart.length > 0 && (
                    <button type="button" className="pos-link pos-link--danger" onClick={() => setConfirmClear(true)} data-testid="button-pos-clear-cart">
                      <Trash2 className="w-3.5 h-3.5" /> Limpar
                    </button>
                  )}
                </div>
              </div>

              <div className="pos-box__content pos-box__content--flush">
                {cart.length === 0 ? (
                  <div className="pos-empty">
                    <ShoppingCart className="w-10 h-10" />
                    Não existem itens associados à venda.
                    <br />
                    Seleccione um produto ou leia um código de barras para começar.
                  </div>
                ) : (
                  <div style={{ maxHeight: 320, overflowY: "auto" }}>
                    <table className="pos-table" id="pos-cart">
                      <thead>
                        <tr>
                          <th style={{ width: 34 }}></th>
                          <th className="text-left">Produto</th>
                          <th style={{ width: 108 }} className="text-right">Qtd.</th>
                          <th style={{ width: 92 }} className="text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((line) => (
                          <tr key={line.product.id} data-testid={`row-pos-cart-${line.product.id}`}>
                            <td className="text-left" style={{ paddingLeft: 10 }}>
                              <button
                                type="button" className="pos-line-remove"
                                onClick={() => setCart((previous) => previous.filter((item) => item.product.id !== line.product.id))}
                                aria-label={`Remover ${line.product.nome}`}
                                data-testid={`button-pos-remove-${line.product.id}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                            <td className="text-left">
                              <span className="pos-line-title">{line.product.nome}</span>
                              <span className="pos-line-ref">
                                {line.product.codigo} · {formatCurrency(line.product.preco, config.moeda)}/{formatUnit(line.product.unidadeMedida)}
                                {line.product.ivaIsento ? " · isento" : ` · IVA ${config.ivaTaxa || 0}%`}
                              </span>
                            </td>
                            <td className="text-right">
                              <span className="pos-stepper">
                                <button type="button" onClick={() => updateQuantity(line.product.id, -1)} aria-label="Diminuir quantidade" data-testid={`button-pos-decrease-${line.product.id}`}>
                                  <Minus className="w-4 h-4" />
                                </button>
                                <input
                                  value={line.quantity}
                                  onChange={(event) => setLineQuantity(line.product.id, event.target.value)}
                                  aria-label={`Quantidade de ${line.product.nome}`}
                                  data-testid={`text-pos-quantity-${line.product.id}`}
                                  inputMode="decimal"
                                />
                                <button type="button" onClick={() => updateQuantity(line.product.id, 1)} aria-label="Aumentar quantidade" data-testid={`button-pos-increase-${line.product.id}`}>
                                  <Plus className="w-4 h-4" />
                                </button>
                              </span>
                            </td>
                            <td className="pos-line-total" style={{ paddingRight: 12 }}>
                              {formatCurrency(line.quantity * line.product.preco, config.moeda)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        {totals.descontoValor > 0 && (
                          <tr>
                            <th colSpan={3}>Desc.{totals.descontoPercent > 0 ? ` ${totals.descontoPercent}%` : ""}</th>
                            <th className="text-right" style={{ paddingRight: 12 }}>-{formatCurrency(totals.descontoValor, config.moeda)}</th>
                          </tr>
                        )}
                        <tr>
                          <th colSpan={3}>Total s/IVA</th>
                          <th className="text-right" style={{ paddingRight: 12 }}>{formatCurrency(totals.subtotal, config.moeda)}</th>
                        </tr>
                        <tr>
                          <th colSpan={3}>IVA ({config.ivaTaxa || 0}%)</th>
                          <th className="text-right" style={{ paddingRight: 12 }}>{formatCurrency(totals.totalIva, config.moeda)}</th>
                        </tr>
                        <tr className="pos-grand">
                          <th colSpan={3}>Total c/IVA</th>
                          <th className="text-right" style={{ paddingRight: 12, color: "#1577EB" }} data-testid="text-pos-total">
                            {formatCurrency(totals.total, config.moeda)}
                          </th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* ---- cliente / não é cliente ---- */}
              <div className="pos-collapse">
                <button type="button" className="pos-collapse__header" onClick={() => setShowCustomer((v) => !v)} data-testid="button-pos-customer-toggle">
                  <span className="pos-collapse__icon"><UserPlus className="w-4 h-4" /></span>
                  Cliente
                  <span className="pos-collapse__value">
                    {cliente.consumidorFinal && !cliente.nif.trim() ? "Não é cliente" : adquirenteLabel}
                  </span>
                  <span className="pos-collapse__change">
                    Alterar <ChevronDown className="w-3.5 h-3.5" style={{ transform: showCustomer ? "rotate(180deg)" : undefined, transition: "transform .15s" }} />
                  </span>
                </button>
                {showCustomer && (
                  <div className="pos-collapse__content">
                    <ClienteField
                      value={cliente}
                      onChange={setCliente}
                      pacientes={pacientes}
                      onNovoCliente={() => setShowNovoClienteModal(true)}
                      exigirIdentificacao={false}
                      compacto
                    />
                  </div>
                )}
              </div>

              {/* ---- detalhes da operação ---- */}
              {(cartSector === "Restaurante" || cartSector === "Farmácia") && (
                <div className="pos-collapse" data-testid="panel-pos-sector-details">
                  <button type="button" className="pos-collapse__header" onClick={() => toggleBox("sector")}>
                    <span className="pos-collapse__icon"><Tag className="w-4 h-4" /></span>
                    Detalhes da operação
                    <span className="pos-collapse__value">{cartSector}</span>
                    <span className="pos-collapse__change">
                      Alterar <ChevronDown className="w-3.5 h-3.5" style={{ transform: openBoxes.sector ? "rotate(180deg)" : undefined, transition: "transform .15s" }} />
                    </span>
                  </button>
                  {openBoxes.sector && (
                    <div className="pos-collapse__content">
                      {cartSector === "Restaurante" ? (
                        <div className="pos-row2">
                          <div className="pos-field">
                            <label className="pos-label" htmlFor="pos-rest-mode">Tipo de atendimento</label>
                            <select
                              id="pos-rest-mode" value={restaurantMode}
                              onChange={(event) => setRestaurantMode(event.target.value as typeof restaurantMode)}
                              className="pos-input" aria-label="Tipo de atendimento"
                              data-testid="select-pos-restaurant-mode"
                            >
                              <option>Mesa</option>
                              <option>Takeaway</option>
                              <option>Delivery</option>
                            </select>
                          </div>
                          <div className="pos-field">
                            <label className="pos-label" htmlFor="pos-rest-table">Mesa / referência</label>
                            <input
                              id="pos-rest-table" value={restaurantTable}
                              onChange={(event) => setRestaurantTable(event.target.value)}
                              placeholder="Ex.: Mesa 12" className="pos-input"
                              aria-label="Mesa ou referência" data-testid="input-pos-restaurant-table"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="pos-field">
                          <label className="pos-label" htmlFor="pos-prescription">N.º da receita</label>
                          <input
                            id="pos-prescription" value={prescriptionNumber}
                            onChange={(event) => setPrescriptionNumber(event.target.value)}
                            placeholder="N.º da receita (opcional)" className="pos-input"
                            aria-label="Número da receita" data-testid="input-pos-prescription"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ---- desconto ---- */}
              <div className="pos-collapse">
                <button type="button" className="pos-collapse__header" onClick={() => setShowDiscount((v) => !v)}>
                  <span className="pos-collapse__icon"><Percent className="w-4 h-4" /></span>
                  Desconto
                  <span className="pos-collapse__value">{totals.descontoValor > 0 ? formatCurrency(totals.descontoValor, config.moeda) : ""}</span>
                  <span className="pos-collapse__change">
                    Alterar <ChevronDown className="w-3.5 h-3.5" style={{ transform: showDiscount ? "rotate(180deg)" : undefined, transition: "transform .15s" }} />
                  </span>
                </button>
                {showDiscount && (
                  <div className="pos-collapse__content">
                    <div className="pos-row2">
                      <div className="pos-field">
                        <label className="pos-label" htmlFor="pos-discount-pct">Desc. Percentual</label>
                        <div className="pos-input-group">
                          <span className="pos-input-group__addon">%</span>
                          <input
                            id="pos-discount-pct" className="pos-input pos-input--money" value={discountPercent}
                            onChange={(event) => { setDiscountPercent(event.target.value.replace(/[^0-9.,]/g, "")); if (event.target.value) setDiscountAmount(""); }}
                            onFocus={(event) => event.target.select()} placeholder="0" inputMode="decimal"
                          />
                        </div>
                      </div>
                      <div className="pos-field">
                        <label className="pos-label" htmlFor="pos-discount-amt">Desc. Monetário</label>
                        <div className="pos-input-group">
                          <span className="pos-input-group__addon">{config.moeda}</span>
                          <input
                            id="pos-discount-amt" className="pos-input pos-input--money" value={discountAmount}
                            onChange={(event) => { setDiscountAmount(event.target.value.replace(/[^0-9.,]/g, "")); if (event.target.value) setDiscountPercent(""); }}
                            onFocus={(event) => event.target.select()} placeholder="0,00" inputMode="decimal"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="pos-note">O desconto é rateado proporcionalmente pelos artigos e reflectido no IVA.</p>
                  </div>
                )}
              </div>

              {/* ---- pagamento ---- */}
              <div className="pos-collapse">
                <button type="button" className="pos-collapse__header" onClick={() => toggleBox("pay")}>
                  <span className="pos-collapse__icon"><Banknote className="w-4 h-4" /></span>
                  Pagamentos
                  <span className="pos-collapse__value">{payment}</span>
                  <span className="pos-collapse__change">
                    Alterar <ChevronDown className="w-3.5 h-3.5" style={{ transform: openBoxes.pay ? "rotate(180deg)" : undefined, transition: "transform .15s" }} />
                  </span>
                </button>
                {openBoxes.pay && (
                  <div className="pos-collapse__content">
                    <div className="pos-pay-grid">
                      {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                        <button
                          type="button" key={value}
                          onClick={() => { setPayment(value); setCashReceived(""); setPaymentReference(""); setMixedCashAmount(""); }}
                          className={`pos-pay ${payment === value ? "is-active" : ""}`}
                          data-testid={`button-pos-payment-${value.toLowerCase().replaceAll(" ", "-")}`}
                        >
                          <Icon className="w-4 h-4" /> {label}
                        </button>
                      ))}
                    </div>

                    {payment === "Numerário" && (
                      <div style={{ marginTop: 12 }}>
                        <label className="pos-label" htmlFor="pos-cash-received">Valor recebido</label>
                        <div className="pos-input-group">
                          <span className="pos-input-group__addon">{config.moeda}</span>
                          <input
                            id="pos-cash-received" type="text" inputMode="decimal"
                            className="pos-input pos-input--money"
                            value={cashReceived === "" ? "" : String(cashReceived)}
                            onChange={(event) => {
                              const raw = event.target.value.replace(/[^0-9.,]/g, "");
                              setCashReceived(raw === "" ? "" : Number(raw.replace(",", ".")));
                            }}
                            onFocus={(event) => event.target.select()}
                            placeholder="0,00" data-testid="input-pos-cash-received"
                          />
                          <button
                            type="button" className="pos-input-group__addon"
                            style={{ borderRight: "none", borderLeft: "1px solid #d7dce3", cursor: "pointer", background: "#eaf3ff", color: "#1577EB" }}
                            onClick={() => openKeypad("cash")} aria-label="Abrir teclado numérico"
                          >
                            <Calculator className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="pos-quick">
                          <button type="button" onClick={() => setCashReceived(Number(totals.total.toFixed(2)))}>Valor exacto</button>
                          {[1000, 2000, 5000, 10000, 20000].map((note) => (
                            <button key={note} type="button" onClick={() => setCashReceived((prev) => (typeof prev === "number" ? prev : 0) + note)}>
                              +{note.toLocaleString("pt-PT")}
                            </button>
                          ))}
                        </div>
                        <div className="pos-change-box">
                          <span>Troco a devolver</span>
                          <strong data-testid="text-pos-change">{formatCurrency(change, config.moeda)}</strong>
                        </div>
                      </div>
                    )}

                    {payment === "Misto" && (
                      <div style={{ marginTop: 12 }}>
                        <div className="pos-row2">
                          <div className="pos-field">
                            <label className="pos-label" htmlFor="pos-mixed-cash">Parte em numerário</label>
                            <div className="pos-input-group">
                              <span className="pos-input-group__addon">{config.moeda}</span>
                              <input
                                id="pos-mixed-cash" type="text" inputMode="decimal"
                                className="pos-input pos-input--money"
                                value={mixedCashAmount === "" ? "" : String(mixedCashAmount)}
                                onChange={(event) => {
                                  const raw = event.target.value.replace(/[^0-9.,]/g, "");
                                  setMixedCashAmount(raw === "" ? "" : Number(raw.replace(",", ".")));
                                }}
                                onFocus={(event) => event.target.select()}
                                placeholder="0,00" data-testid="input-pos-mixed-cash"
                              />
                              <button
                                type="button" className="pos-input-group__addon"
                                style={{ borderRight: "none", borderLeft: "1px solid #d7dce3", cursor: "pointer", background: "#eaf3ff", color: "#1577EB" }}
                                onClick={() => openKeypad("mixedCash")} aria-label="Abrir teclado numérico"
                              >
                                <Calculator className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="pos-field">
                            <label className="pos-label" htmlFor="pos-mixed-received">Numerário recebido</label>
                            <div className="pos-input-group">
                              <span className="pos-input-group__addon">{config.moeda}</span>
                              <input
                                id="pos-mixed-received" type="text" inputMode="decimal"
                                className="pos-input pos-input--money"
                                value={cashReceived === "" ? "" : String(cashReceived)}
                                onChange={(event) => {
                                  const raw = event.target.value.replace(/[^0-9.,]/g, "");
                                  setCashReceived(raw === "" ? "" : Number(raw.replace(",", ".")));
                                }}
                                onFocus={(event) => event.target.select()}
                                placeholder="0,00" data-testid="input-pos-mixed-cash-received"
                              />
                              <button
                                type="button" className="pos-input-group__addon"
                                style={{ borderRight: "none", borderLeft: "1px solid #d7dce3", cursor: "pointer", background: "#eaf3ff", color: "#1577EB" }}
                                onClick={() => openKeypad("mixedReceived")} aria-label="Abrir teclado numérico"
                              >
                                <Calculator className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="pos-change-box" style={{ borderColor: "#cfe3fb", background: "#eaf3ff", marginTop: 0 }}>
                          <span style={{ color: "#0c5460" }}>Parte electrónica</span>
                          <strong style={{ color: "#0c5460" }}>
                            {formatCurrency(Math.max(0, totals.total - (typeof mixedCashAmount === "number" ? mixedCashAmount : 0)), config.moeda)}
                          </strong>
                        </div>
                        <div className="pos-field" style={{ marginTop: 12 }}>
                          <label className="pos-label" htmlFor="pos-mixed-ref">Referência da parte electrónica</label>
                          <input
                            id="pos-mixed-ref" value={paymentReference}
                            onChange={(event) => setPaymentReference(event.target.value)}
                            placeholder="N.º do TPA, transferência ou cheque" className="pos-input"
                            aria-label="Referência do pagamento misto" data-testid="input-pos-mixed-reference"
                          />
                        </div>
                        {change > 0 && (
                          <div className="pos-change-box">
                            <span>Troco a devolver</span>
                            <strong>{formatCurrency(change, config.moeda)}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {payment !== "Numerário" && payment !== "Misto" && payment !== "Crédito a 30 dias" && (
                      <div className="pos-field" style={{ marginTop: 12 }}>
                        <label className="pos-label" htmlFor="pos-pay-ref">Referência do pagamento</label>
                        <input
                          id="pos-pay-ref" value={paymentReference}
                          onChange={(event) => setPaymentReference(event.target.value)}
                          placeholder="Referência do TPA, transferência ou cheque" className="pos-input"
                          aria-label="Referência do pagamento" data-testid="input-pos-payment-reference"
                        />
                      </div>
                    )}

                    {payment === "Crédito a 30 dias" && (
                      <div className="pos-alert pos-alert--closed" style={{ marginTop: 12, marginBottom: 0 }}>
                        A venda será emitida a crédito com vencimento em {addDaysStr(30)}. O documento fica pendente de liquidação em Conta Corrente.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ---- finalizar ---- */}
              <button
                type="button" className="pos-apply"
                onClick={() => void completeSale()}
                disabled={!canComplete}
                title={!activeSession ? "Abra a caixa para poder emitir vendas." : undefined}
                data-testid="button-pos-complete-sale"
              >
                {saving ? (
                  <span className="animate-pulse">A emitir documento...</span>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Cobrar e emitir <small>Factura Recibo · {formatCurrency(totals.total, config.moeda)} · F4</small>
                  </>
                )}
              </button>

              <div className="pos-shortcuts">
                <span className="pos-shortcut"><span className="pos-kbd">F2</span> Pesquisar</span>
                <span className="pos-shortcut"><span className="pos-kbd">F4</span> Cobrar</span>
                <span className="pos-shortcut"><span className="pos-kbd">F9</span> Pausar venda</span>
                <span className="pos-shortcut"><span className="pos-kbd">Esc</span> Fechar</span>
                <span className="pos-shortcut"><Keyboard className="w-3.5 h-3.5" /> Leitor de códigos activo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pos-help">
          <button type="button" onClick={() => setFeedback({ type: "success", text: "Centro de ajuda: F2 para pesquisar, F4 para cobrar e F9 para pausar a venda." })}>
            <HelpCircle className="w-4 h-4" /> Precisa de Ajuda?
          </button>
        </div>
      </div>

      {/* ===== abrir/fechar caixa ===== */}
      {cashModal && (
        <div className="pos-modal" role="dialog" aria-modal="true" aria-labelledby="pos-cash-dialog-title">
          <div className="pos-modal__panel">
            <div className="pos-modal__header">
              <h3 className="pos-modal__title" id="pos-cash-dialog-title">{cashModal === "open" ? "Abrir caixa" : "Fechar caixa"}</h3>
              <button type="button" className="pos-modal__close" onClick={() => setCashModal(null)} aria-label="Fechar caixa" data-testid="button-pos-close-cash-dialog">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="pos-modal__body">
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#8a919c", lineHeight: 1.6 }}>
                {cashModal === "open"
                  ? "Registe o dinheiro existente na gaveta antes de iniciar o turno."
                  : "Conte o dinheiro físico e compare com o valor esperado pelo sistema."}
              </p>

              {cashModal === "close" && (
                <div className="pos-summary" style={{ margin: "0 0 16px" }}>
                  <div className="pos-summary__row"><span>Fundo inicial</span><strong>{formatCurrency(activeSession?.fundoInicial || 0, config.moeda)}</strong></div>
                  <div className="pos-summary__row"><span>Vendas no turno</span><strong>{sessionTotals.qtd}</strong></div>
                  <div className="pos-summary__row"><span>Valor das vendas</span><strong>{formatCurrency(sessionTotals.valor, config.moeda)}</strong></div>
                  <div className="pos-summary__row" style={{ borderTop: "1px solid #e3e6ea", marginTop: 6, paddingTop: 8 }}>
                    <span>Numerário esperado</span><strong>{formatCurrency(expectedCash, config.moeda)}</strong>
                  </div>
                  {typeof closingCash === "number" && (
                    <div className="pos-summary__row">
                      <span>Diferença</span>
                      <strong style={{ color: closingCash - expectedCash === 0 ? "#28a745" : "#c2261c" }}>
                        {formatCurrency(closingCash - expectedCash, config.moeda)}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              <div className="pos-field">
                <label className="pos-label" htmlFor="pos-cash-value">{cashModal === "open" ? "Fundo inicial" : "Valor contado"}</label>
                <div className="pos-input-group">
                  <span className="pos-input-group__addon">{config.moeda}</span>
                  <input
                    id="pos-cash-value" type="text" inputMode="decimal" autoFocus
                    value={(cashModal === "open" ? openingCash : closingCash) === "" ? "" : String(cashModal === "open" ? openingCash : closingCash)}
                    onChange={(event) => {
                      const raw = event.target.value.replace(/[^0-9.,]/g, "");
                      const value: number | "" = raw === "" ? "" : Number(raw.replace(",", "."));
                      if (cashModal === "open") setOpeningCash(value); else setClosingCash(value);
                    }}
                    onFocus={(event) => event.target.select()}
                    className="pos-input pos-input--money"
                    style={{ fontSize: 17, padding: "13px 12px" }}
                    placeholder="0,00"
                    data-testid={cashModal === "open" ? "input-pos-opening-cash" : "input-pos-closing-cash"}
                  />
                  <button
                    type="button" className="pos-input-group__addon"
                    style={{ borderRight: "none", borderLeft: "1px solid #d7dce3", cursor: "pointer", background: "#eaf3ff", color: "#1577EB" }}
                    onClick={() => openKeypad(cashModal === "open" ? "opening" : "closing")}
                    aria-label="Abrir teclado numérico"
                  >
                    <Calculator className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="pos-modal__footer">
              <button type="button" className="pos-btn" onClick={() => setCashModal(null)}>Cancelar</button>
              <button
                type="button" className="pos-btn pos-btn--primary"
                onClick={cashModal === "open" ? openCashSession : closeCashSession}
                data-testid={cashModal === "open" ? "button-pos-confirm-open-cash" : "button-pos-confirm-close-cash"}
              >
                <Check className="w-4 h-4" /> {cashModal === "open" ? "Confirmar abertura" : "Confirmar fecho"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== limpar carrinho ===== */}
      {confirmClear && (
        <div className="pos-modal" role="dialog" aria-modal="true">
          <div className="pos-modal__panel" style={{ maxWidth: 400 }}>
            <div className="pos-modal__header">
              <h3 className="pos-modal__title">Limpar venda actual</h3>
              <button type="button" className="pos-modal__close" onClick={() => setConfirmClear(false)} aria-label="Fechar"><X className="w-5 h-5" /></button>
            </div>
            <div className="pos-modal__body">
              <p style={{ margin: 0, fontSize: 13, color: "#5b6470", lineHeight: 1.6 }}>
                Vai remover {cart.length} {cart.length === 1 ? "artigo" : "artigos"} no valor de{" "}
                <strong>{formatCurrency(totals.total, config.moeda)}</strong>. Esta acção não pode ser anulada.
              </p>
            </div>
            <div className="pos-modal__footer">
              <button type="button" className="pos-btn" onClick={() => setConfirmClear(false)}>Cancelar</button>
              <button
                type="button" className="pos-btn pos-btn--danger"
                onClick={() => { setCart([]); setDiscountPercent(""); setDiscountAmount(""); setConfirmClear(false); setFeedback({ type: "success", text: "Venda limpa." }); }}
              >
                <Trash2 className="w-4 h-4" /> Limpar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== vendas pausadas ===== */}
      {showHeld && (
        <div className="pos-modal" role="dialog" aria-modal="true" aria-label="Vendas pausadas">
          <div className="pos-modal__panel pos-modal__panel--wide">
            <div className="pos-modal__header">
              <h3 className="pos-modal__title"><Pause className="w-4 h-4 inline mr-2 align-[-2px]" />Vendas pausadas ({heldSales.length})</h3>
              <button type="button" className="pos-modal__close" onClick={() => setShowHeld(false)} aria-label="Fechar"><X className="w-5 h-5" /></button>
            </div>
            <div className="pos-modal__body">
              {heldSales.length === 0 ? (
                <div className="pos-empty"><Pause className="w-10 h-10" />Não existem vendas pausadas.</div>
              ) : (
                heldSales.map((held, index) => {
                  const heldTotal = held.cart.reduce((sum, line) => sum + line.quantity * line.product.preco, 0);
                  const heldName = held.cliente.consumidorFinal && !held.cliente.nif.trim()
                    ? NOME_CONSUMIDOR_FINAL
                    : held.cliente.nome;
                  return (
                    <div className="pos-held" key={held.id}>
                      <div style={{ minWidth: 0 }}>
                        <div className="pos-held__name">Venda #{heldSales.length - index} · {heldName}</div>
                        <div className="pos-held__meta">
                          {held.cart.length} {held.cart.length === 1 ? "artigo" : "artigos"} · {formatCurrency(heldTotal, config.moeda)} · pausada {held.savedAt}
                        </div>
                        <div className="pos-held__meta" style={{ marginTop: 2 }}>
                          {held.cart.slice(0, 3).map((line) => line.product.nome).join(", ")}
                          {held.cart.length > 3 ? ` +${held.cart.length - 3}` : ""}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button type="button" className="pos-btn pos-btn--sm pos-btn--primary" onClick={() => restoreHeld(held)}>
                          <Play className="w-3.5 h-3.5" /> Retomar
                        </button>
                        <button
                          type="button" className="pos-btn pos-btn--sm pos-btn--danger"
                          onClick={() => setHeldSales((prev) => prev.filter((item) => item.id !== held.id))}
                          aria-label="Eliminar venda pausada"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="pos-modal__footer">
              <button type="button" className="pos-btn" onClick={() => setShowHeld(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== novo cliente ===== */}
      {showNovoClienteModal && (
        <div className="pos-modal" role="dialog" aria-modal="true" aria-label="Cadastrar novo cliente">
          <div className="pos-modal__panel">
            <div className="pos-modal__header">
              <h3 className="pos-modal__title"><UserPlus className="w-4 h-4 inline mr-2 align-[-2px]" />Cadastrar Novo Cliente</h3>
              <button type="button" className="pos-modal__close" onClick={() => setShowNovoClienteModal(false)} aria-label="Fechar"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateCustomer} className="pos-modal__body">
              <div className="pos-field">
                <label className="pos-label" htmlFor="pos-new-nome">Nome Completo *</label>
                <input id="pos-new-nome" required autoFocus value={novoCliNome} onChange={(e) => setNovoCliNome(e.target.value)} placeholder="Nome do cliente ou empresa..." className="pos-input" />
              </div>
              <div className="pos-field">
                <label className="pos-label" htmlFor="pos-new-nif">NIF / BI</label>
                <input id="pos-new-nif" value={novoCliNif} onChange={(e) => setNovoCliNif(e.target.value)} placeholder="Ex: 5417082910" className="pos-input" style={{ fontFamily: "ui-monospace,Menlo,Consolas,monospace" }} />
              </div>
              <div className="pos-field">
                <label className="pos-label" htmlFor="pos-new-tel">Telefone</label>
                <input id="pos-new-tel" value={novoCliTel} onChange={(e) => setNovoCliTel(e.target.value)} placeholder="+244 9XX XXX XXX" className="pos-input" />
              </div>
              <div className="pos-field">
                <label className="pos-label" htmlFor="pos-new-end">Morada</label>
                <input id="pos-new-end" value={novoCliEnd} onChange={(e) => setNovoCliEnd(e.target.value)} placeholder="Ex: Luanda, Maianga" className="pos-input" />
              </div>
              <div className="pos-modal__footer" style={{ padding: 0, marginTop: 14 }}>
                <button type="button" className="pos-btn" onClick={() => setShowNovoClienteModal(false)}>Cancelar</button>
                <button type="submit" className="pos-btn pos-btn--primary">Salvar e Selecionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== teclado numérico ===== */}
      {keypadTarget && (
        <Keypad
          label={keypadLabel}
          value={keypadBuffer}
          currency={config.moeda}
          onChange={applyKeypad}
          onClose={() => setKeypadTarget(null)}
        />
      )}

      {/* ===== venda concluída ===== */}
      {completedSale && (
        <div className="pos-modal" role="dialog" aria-modal="true" aria-labelledby="pos-sale-success-title">
          <div className="pos-modal__panel">
            <div className="pos-success">
              <div className="pos-success__icon"><CheckCircle2 className="w-8 h-8" /></div>
              <h3 className="pos-modal__title" id="pos-sale-success-title" style={{ fontSize: 18 }}>Venda emitida com sucesso</h3>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#8a919c" }}>
                Factura Recibo <strong style={{ fontFamily: "ui-monospace,Menlo,Consolas,monospace", color: "#2f3640" }}>{completedSale.numero}</strong>
              </p>
              <p className="pos-success__total" style={{ margin: "14px 0 0" }}>{formatCurrency(completedSale.total, config.moeda)}</p>
              {completedSale.troco > 0 && (
                <p style={{ margin: "8px 0 0", fontSize: 14, fontWeight: 700, color: "#155724" }}>
                  Troco a devolver: {formatCurrency(completedSale.troco, config.moeda)}
                </p>
              )}
              <div className="pos-summary">
                <div className="pos-summary__row">
                  <span>Cliente</span>
                  <strong>{completedSale.fatura.clienteNome}{completedSale.fatura.clienteNif ? ` · NIF ${completedSale.fatura.clienteNif}` : " · não é cliente"}</strong>
                </div>
                <div className="pos-summary__row"><span>Pagamento</span><strong>{completedSale.fatura.formaPagamento}</strong></div>
                <div className="pos-summary__row"><span>Artigos</span><strong>{completedSale.fatura.linhas.length}</strong></div>
                <div className="pos-summary__row"><span>Estado</span><strong>{completedSale.fatura.estado}</strong></div>
              </div>
            </div>
            <div className="pos-modal__footer" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
              <button
                type="button" className="pos-btn"
                onClick={() => downloadFatura(generateFaturaHTML(completedSale.fatura, config, { termica: true }), `${completedSale.numero}_termica`)}
                data-testid="button-pos-print-receipt"
              >
                <Printer className="w-4 h-4" /> Talão
              </button>
              <button
                type="button" className="pos-btn"
                onClick={() => downloadFatura(generateFaturaHTML(completedSale.fatura, config, { termica: false }), completedSale.numero)}
              >
                <Receipt className="w-4 h-4" /> A4
              </button>
              <button type="button" className="pos-btn pos-btn--primary" onClick={closeCompletedSale} data-testid="button-pos-new-sale">
                <Plus className="w-4 h-4" /> Nova venda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSView;
