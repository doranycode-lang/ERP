import React, { useState, useMemo } from "react";
import { useApp } from "../store/AppContext";
import { MovimentoStock, TipoMovimento } from "../types";
import { formatCurrency } from "../utils/faturaGenerator";
import {
  ArrowDownLeft, ArrowUpRight, RefreshCw, AlertOctagon, Undo2,
  Search, Download, Filter, Calendar, History, Plus, FileText, Printer
} from "lucide-react";
import { ReportExportModal } from "../components/ReportExportModal";

export const MovimentacoesView: React.FC<{ onOpenMovementModal: () => void }> = ({
  onOpenMovementModal,
}) => {
  const { movimentos, config } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterData, setFilterData] = useState<string>("");
  const [showReportModal, setShowReportModal] = useState(false);

  const filteredMovimentos = useMemo(() => {
    return movimentos.filter((m) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        m.produtoNome.toLowerCase().includes(q) ||
        m.produtoCodigo.toLowerCase().includes(q) ||
        (m.lote && m.lote.toLowerCase().includes(q)) ||
        (m.referenciaDocumento && m.referenciaDocumento.toLowerCase().includes(q)) ||
        m.motivo.toLowerCase().includes(q) ||
        m.usuario.toLowerCase().includes(q);

      const matchesTipo = filterTipo === "todos" || m.tipo === filterTipo;
      const matchesData = !filterData || m.data === filterData;

      return matchesSearch && matchesTipo && matchesData;
    });
  }, [movimentos, searchTerm, filterTipo, filterData]);

  // Aggregate stats
  const stats = useMemo(() => {
    let entradasQtd = 0;
    let saidasQtd = 0;
    let perdasQtd = 0;
    let valorTotalSaidas = 0;

    movimentos.forEach((m) => {
      if (m.tipo === "entrada" || m.tipo === "devolucao") {
        entradasQtd += m.quantidade;
      } else if (m.tipo === "saida") {
        saidasQtd += m.quantidade;
        valorTotalSaidas += m.valorTotal || 0;
      } else if (m.tipo === "perda" || m.tipo === "validade") {
        perdasQtd += m.quantidade;
      }
    });

    return {
      entradasQtd,
      saidasQtd,
      perdasQtd,
      valorTotalSaidas,
      totalMovimentos: movimentos.length,
    };
  }, [movimentos]);

  const handleExportCSV = () => {
    const headers = ["Data", "Hora", "Código", "Produto", "Tipo", "Qtd", "Stock Anterior", "Stock Atual", "Lote", "Doc Ref", "Motivo", "Operador", "Valor Total"];
    const rows = filteredMovimentos.map((m) => [
      m.data,
      m.hora,
      m.produtoCodigo,
      `"${m.produtoNome.replace(/"/g, '""')}"`,
      m.tipo.toUpperCase(),
      m.quantidade,
      m.stockAnterior,
      m.stockAtual,
      m.lote || "",
      m.referenciaDocumento || "",
      `"${m.motivo.replace(/"/g, '""')}"`,
      `"${m.usuario}"`,
      m.valorTotal || 0,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Movimentacoes_Stock_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTipoBadge = (tipo: TipoMovimento) => {
    switch (tipo) {
      case "entrada":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <ArrowDownLeft className="w-3 h-3" /> Entrada
          </span>
        );
      case "saida":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            <ArrowUpRight className="w-3 h-3" /> Saída (Venda)
          </span>
        );
      case "ajuste":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800">
            <RefreshCw className="w-3 h-3" /> Ajuste
          </span>
        );
      case "perda":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            <AlertOctagon className="w-3 h-3" /> Quebra / Perda
          </span>
        );
      case "validade":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <AlertOctagon className="w-3 h-3" /> Validade Expirada
          </span>
        );
      case "devolucao":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
            <Undo2 className="w-3 h-3" /> Devolução
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            🔄 Histórico de Movimentações de Estoque
          </h2>
          <p className="text-xs text-slate-500">
            Registo auditável de todas as entradas, saídas por facturação, abates e inventário
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            title="Exportar Relatório de Auditoria em PDF"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            Exportar PDF
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>

          <button
            onClick={onOpenMovementModal}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registar Movimento Manual
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1 text-xs font-semibold text-slate-500">
            <span>Total Entradas</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">+{stats.entradasQtd}</div>
          <div className="text-[11px] text-slate-400 mt-1">Unidades abastecidas</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1 text-xs font-semibold text-slate-500">
            <span>Total Saídas (Vendas)</span>
            <ArrowUpRight className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">-{stats.saidasQtd}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Valor: {formatCurrency(stats.valorTotalSaidas, config.moeda)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1 text-xs font-semibold text-slate-500">
            <span>Perdas / Validade</span>
            <AlertOctagon className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.perdasQtd}</div>
          <div className="text-[11px] text-slate-400 mt-1">Unidades abatidas</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1 text-xs font-semibold text-slate-500">
            <span>Registos Auditados</span>
            <History className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalMovimentos}</div>
          <div className="text-[11px] text-slate-400 mt-1">Movimentações registadas</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por produto, SKU, lote, doc ou motivo..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500 focus:bg-white transition"
          />
        </div>

        <div>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-sky-500"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="entrada">Entrada / Compra</option>
            <option value="saida">Saída (Facturação)</option>
            <option value="ajuste">Ajuste de Inventário</option>
            <option value="perda">Quebra / Avaria</option>
            <option value="validade">Validade Expirada</option>
            <option value="devolucao">Devolução</option>
          </select>
        </div>

        <div>
          <input
            type="text"
            value={filterData}
            onChange={(e) => setFilterData(e.target.value)}
            placeholder="Filtrar Data (DD/MM/AAAA)..."
            className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredMovimentos.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <History className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm font-semibold text-slate-600">Nenhuma movimentação registada</p>
            <p className="text-xs text-slate-400 mt-1">
              As saídas automáticas de facturação e entradas manuais aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3 text-center">Qtd</th>
                  <th className="py-3 px-3 text-center">Stock (Ant → Atual)</th>
                  <th className="py-3 px-3">Lote / Doc Ref</th>
                  <th className="py-3 px-4">Motivo / Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovimentos.map((m) => {
                  const isPositive = m.tipo === "entrada" || m.tipo === "devolucao";
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{m.data}</div>
                        <div className="text-[10px] text-slate-400">{m.hora}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{m.produtoNome}</div>
                        <div className="text-[10px] text-slate-500 font-mono">SKU: {m.produtoCodigo}</div>
                      </td>

                      <td className="py-3 px-3">{getTipoBadge(m.tipo)}</td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-black text-sm ${
                            isPositive ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isPositive ? `+${m.quantidade}` : `-${m.quantidade}`}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-600">
                        <span className="text-slate-400">{m.stockAnterior}</span>
                        <span className="mx-1.5 text-slate-300">→</span>
                        <span className="font-bold text-slate-900">{m.stockAtual}</span>
                      </td>

                      <td className="py-3 px-3">
                        {m.lote && (
                          <div className="font-mono text-slate-800 font-semibold">Lote: {m.lote}</div>
                        )}
                        {m.referenciaDocumento && (
                          <div className="text-[10px] text-sky-600 font-mono font-medium">
                            Doc: {m.referenciaDocumento}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{m.motivo}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Por: {m.usuario}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF Movements Audit Report Modal */}
      <ReportExportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        tipoRelatorio="movimentacoes"
        movimentos={movimentos}
        config={config}
        filtroAtual={{
          tipoMovimento: filterTipo,
          dataMovimento: filterData,
          termoBusca: searchTerm,
        }}
      />
    </div>
  );
};
