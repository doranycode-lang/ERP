import React, { useState, useMemo } from "react";
import { useApp } from "../store/AppContext";
import { Produto } from "../types";
import { formatCurrency } from "../utils/faturaGenerator";
import {
  Clock, AlertOctagon, AlertTriangle, CheckCircle2, ShieldAlert,
  Trash2, ArrowRight, Tag, Search, Filter, RefreshCw
} from "lucide-react";

function dateFromStr(dStr: string): Date {
  const p = dStr.split("/");
  if (p.length === 3) {
    return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  }
  return new Date(dStr);
}

function getDaysUntilExpiry(dStr?: string): number | null {
  if (!dStr) return null;
  const valDate = dateFromStr(dStr);
  const hoje = new Date();
  const diffMs = valDate.getTime() - hoje.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export const ValidadeAlertasView: React.FC<{
  onOpenMovementModal?: (p: Produto) => void;
  onOpenLabelModal?: (p: Produto) => void;
}> = ({ onOpenMovementModal, onOpenLabelModal }) => {
  const { produtos, darBaixaValidade, config } = useApp();

  const [filterBucket, setFilterBucket] = useState<"todos" | "expirados" | "criticos" | "atencao" | "validos">("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [writeOffModal, setWriteOffModal] = useState<{ produto: Produto; lote: string; qtd: number } | null>(null);
  const [writeOffReason, setWriteOffReason] = useState("");

  // Process all products that have expiration dates
  const productsWithExpiry = useMemo(() => {
    return produtos
      .filter((p) => p.ativo && p.dataValidade)
      .map((p) => {
        const days = getDaysUntilExpiry(p.dataValidade);
        let status: "expirado" | "critico" | "atencao" | "valido" = "valido";

        if (days !== null) {
          if (days < 0) status = "expirado";
          else if (days <= 15) status = "critico";
          else if (days <= 60) status = "atencao";
          else status = "valido";
        }

        return {
          ...p,
          daysLeft: days,
          expiryStatus: status,
        };
      })
      .sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999));
  }, [produtos]);

  // Filtered
  const filteredList = useMemo(() => {
    return productsWithExpiry.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        p.nome.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        (p.loteAtual && p.loteAtual.toLowerCase().includes(q)) ||
        p.categoria.toLowerCase().includes(q);

      if (filterBucket === "expirados") return matchesSearch && p.expiryStatus === "expirado";
      if (filterBucket === "criticos") return matchesSearch && p.expiryStatus === "critico";
      if (filterBucket === "atencao") return matchesSearch && p.expiryStatus === "atencao";
      if (filterBucket === "validos") return matchesSearch && p.expiryStatus === "valido";

      return matchesSearch;
    });
  }, [productsWithExpiry, filterBucket, searchTerm]);

  // Aggregate stats
  const stats = useMemo(() => {
    let expiradosCount = 0;
    let criticosCount = 0;
    let atencaoCount = 0;
    let valorExpirado = 0;
    let valorEmRisco = 0;

    productsWithExpiry.forEach((p) => {
      if (p.expiryStatus === "expirado") {
        expiradosCount++;
        valorExpirado += p.stock * (p.precoCusto || 0);
      } else if (p.expiryStatus === "critico") {
        criticosCount++;
        valorEmRisco += p.stock * (p.precoCusto || 0);
      } else if (p.expiryStatus === "atencao") {
        atencaoCount++;
      }
    });

    return {
      expiradosCount,
      criticosCount,
      atencaoCount,
      valorExpirado,
      valorEmRisco,
      totalComValidade: productsWithExpiry.length,
    };
  }, [productsWithExpiry]);

  const handleConfirmWriteOff = async () => {
    if (!writeOffModal) return;
    try {
      await darBaixaValidade(
        writeOffModal.produto.id,
        writeOffModal.lote || writeOffModal.produto.loteAtual || "LT-EXP",
        writeOffModal.qtd,
        writeOffReason.trim() || `Abate por validade expirada de ${writeOffModal.qtd} unidades`
      );
      setWriteOffModal(null);
      setWriteOffReason("");
    } catch (err) {
      console.error("Erro ao dar baixa por validade:", err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            ⏰ Gestão e Alertas de Validade de Lotes
          </h2>
          <p className="text-xs text-slate-500">
            Monitorização antecipada de produtos farmacêuticos e perecíveis para prevenir perdas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold">
            {stats.totalComValidade} produtos com rastreio de validade
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Expirados */}
        <button
          type="button"
          onClick={() => setFilterBucket(filterBucket === "expirados" ? "todos" : "expirados")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterBucket === "expirados"
              ? "bg-rose-100 border-rose-400 shadow-md ring-2 ring-rose-500"
              : stats.expiradosCount > 0
              ? "bg-rose-50 border-rose-200 hover:border-rose-300"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-800 uppercase">🚨 Lotes Vencidos</span>
            <AlertOctagon className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900">{stats.expiradosCount}</div>
          <div className="text-[11px] text-rose-700 font-medium mt-1">
            Valor a abater: {formatCurrency(stats.valorExpirado, config.moeda)}
          </div>
        </button>

        {/* Críticos <= 15d */}
        <button
          type="button"
          onClick={() => setFilterBucket(filterBucket === "criticos" ? "todos" : "criticos")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterBucket === "criticos"
              ? "bg-amber-100 border-amber-400 shadow-md ring-2 ring-amber-500"
              : stats.criticosCount > 0
              ? "bg-amber-50 border-amber-200 hover:border-amber-300"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 uppercase">⚠️ Vencem em ≤ 15 dias</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">{stats.criticosCount}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Em risco: {formatCurrency(stats.valorEmRisco, config.moeda)}
          </div>
        </button>

        {/* Atenção 16-60d */}
        <button
          type="button"
          onClick={() => setFilterBucket(filterBucket === "atencao" ? "todos" : "atencao")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterBucket === "atencao"
              ? "bg-sky-100 border-sky-400 shadow-md ring-2 ring-sky-500"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase">🟡 Vencem em 16 a 60d</span>
            <AlertTriangle className="w-5 h-5 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.atencaoCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Planear rotação FIFO / FEFO</div>
        </button>

        {/* Válidos */}
        <button
          type="button"
          onClick={() => setFilterBucket(filterBucket === "validos" ? "todos" : "validos")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterBucket === "validos"
              ? "bg-emerald-100 border-emerald-400 shadow-md ring-2 ring-emerald-500"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase">🟢 Válidos (&gt; 60 dias)</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800">
            {stats.totalComValidade - stats.expiradosCount - stats.criticosCount - stats.atencaoCount}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">Conformidade total</div>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por produto, lote, SKU..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-1">
          {(["todos", "expirados", "criticos", "atencao", "validos"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setFilterBucket(b)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                filterBucket === b
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Expiring Batches */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm font-semibold text-slate-600">Nenhum lote corresponde ao filtro selecionado</p>
            <p className="text-xs text-slate-400 mt-1">O seu estoque está em conformidade com as validades.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-3">Lote / Localização</th>
                  <th className="py-3 px-3">Data de Validade</th>
                  <th className="py-3 px-3 text-center">Dias Restantes</th>
                  <th className="py-3 px-3 text-center">Stock Atual</th>
                  <th className="py-3 px-3 text-right">Valor em Risco</th>
                  <th className="py-3 px-4 text-right">Ação Recomendada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((p) => {
                  const days = p.daysLeft ?? 0;
                  const isExpired = days < 0;
                  const isCritical = days >= 0 && days <= 15;
                  const isAttention = days > 15 && days <= 60;

                  const badgeClass = isExpired
                    ? "bg-rose-100 text-rose-800 font-black border border-rose-300"
                    : isCritical
                    ? "bg-amber-100 text-amber-900 font-black border border-amber-300 animate-pulse"
                    : isAttention
                    ? "bg-sky-100 text-sky-800 font-bold"
                    : "bg-emerald-100 text-emerald-800 font-bold";

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/70 transition ${
                        isExpired ? "bg-rose-50/30" : isCritical ? "bg-amber-50/20" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{p.nome}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Código: {p.codigo} · {p.categoria}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-800">
                          {p.loteAtual || "LT-PADRÃO"}
                        </div>
                        <div className="text-[10px] text-slate-400">{p.localizacao || "Armazém A"}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{p.dataValidade}</div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs ${badgeClass}`}>
                          {isExpired ? `Vencido há ${Math.abs(days)}d` : `Faltam ${days} dias`}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        {p.stock} {p.unidadeMedida}
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {formatCurrency(p.stock * (p.precoCusto || p.preco * 0.6), config.moeda)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isExpired ? (
                          <button
                            type="button"
                            onClick={() =>
                              setWriteOffModal({
                                produto: p,
                                lote: p.loteAtual || "LT-PADRÃO",
                                qtd: p.stock,
                              })
                            }
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 ml-auto shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Dar Baixa (Abater)
                          </button>
                        ) : isCritical ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[11px] font-bold text-amber-700">
                              ⚡ Venda Prioritária (FEFO)
                            </span>
                            {onOpenMovementModal && (
                              <button
                                type="button"
                                onClick={() => onOpenMovementModal(p)}
                                className="p-1.5 text-amber-800 hover:bg-amber-100 rounded-lg transition"
                                title="Ajustar"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-semibold">
                            Lote em Conformidade ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Write Off Modal (Dar Baixa por Validade) */}
      {writeOffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Abate por Validade Expirada</h3>
              <button
                onClick={() => setWriteOffModal(null)}
                className="text-rose-200 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                <div className="font-bold text-sm text-rose-950">{writeOffModal.produto.nome}</div>
                <div>Lote a Abater: <strong>{writeOffModal.lote}</strong></div>
                <div>Validade registada: <strong>{writeOffModal.produto.dataValidade}</strong></div>
                <div>Stock em Armazém: <strong>{writeOffModal.produto.stock} {writeOffModal.produto.unidadeMedida}</strong></div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Quantidade a Abater</label>
                <input
                  type="number"
                  min={1}
                  max={writeOffModal.produto.stock}
                  value={writeOffModal.qtd}
                  onChange={(e) =>
                    setWriteOffModal({
                      ...writeOffModal,
                      qtd: Math.min(writeOffModal.produto.stock, Math.max(1, parseInt(e.target.value) || 1)),
                    })
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-rose-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Justificação / Termo de Quebra</label>
                <textarea
                  rows={2}
                  value={writeOffReason}
                  onChange={(e) => setWriteOffReason(e.target.value)}
                  placeholder="Ex: Abate de produtos farmacêuticos expirados conforme protocolo sanitário..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setWriteOffModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWriteOff}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
                >
                  Confirmar Abate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
