import React, { useState } from "react";
import { Produto, TipoMovimento } from "../types";
import { useApp } from "../store/AppContext";
import { formatCurrency } from "../utils/faturaGenerator";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, AlertOctagon, Undo2, X, PlusCircle } from "lucide-react";

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto?: Produto | null;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  produto: initialProduto,
}) => {
  const { produtos, addMovimento, config } = useApp();

  const [selectedProdutoId, setSelectedProdutoId] = useState<number>(initialProduto?.id || (produtos[0]?.id || 1));
  const [tipo, setTipo] = useState<TipoMovimento>("entrada");
  const [quantidade, setQuantidade] = useState<number>(1);
  const [motivo, setMotivo] = useState("");
  const [referenciaDoc, setReferenciaDoc] = useState("");
  const [lote, setLote] = useState(initialProduto?.loteAtual || "");
  const [dataValidade, setDataValidade] = useState(initialProduto?.dataValidade || "");
  const [valorUnitario, setValorUnitario] = useState<number>(initialProduto?.precoCusto || 0);
  const [loading, setLoading] = useState(false);

  const selectedProduto = produtos.find((p) => p.id === selectedProdutoId);

  React.useEffect(() => {
    if (initialProduto) {
      setSelectedProdutoId(initialProduto.id);
      setLote(initialProduto.loteAtual || "");
      setDataValidade(initialProduto.dataValidade || "");
      setValorUnitario(initialProduto.precoCusto || 0);
    }
  }, [initialProduto]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduto) return;
    if (quantidade <= 0) return;

    setLoading(true);
    try {
      await addMovimento({
        data: new Date().toLocaleDateString("pt-PT"),
        hora: new Date().toLocaleTimeString("pt-PT"),
        produtoId: selectedProduto.id,
        produtoNome: selectedProduto.nome,
        produtoCodigo: selectedProduto.codigo,
        tipo,
        quantidade,
        lote: lote || selectedProduto.loteAtual,
        dataValidade: dataValidade || selectedProduto.dataValidade,
        motivo: motivo.trim() || (tipo === "entrada" ? "Entrada Manual de Stock" : tipo === "saida" ? "Saída Manual" : "Ajuste de Stock"),
        referenciaDocumento: referenciaDoc.trim() || undefined,
        usuario: "Operador de Estoque",
        valorUnitario: valorUnitario || selectedProduto.precoCusto || 0,
        valorTotal: (valorUnitario || selectedProduto.precoCusto || 0) * quantidade,
      });

      onClose();
    } catch (err) {
      console.error("Erro ao gravar movimento:", err);
    } finally {
      setLoading(false);
    }
  };

  const tipoConfig: Record<TipoMovimento, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    entrada: { label: "Entrada / Compra", icon: <ArrowDownLeft className="w-4 h-4" />, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-300" },
    saida: { label: "Saída Manual", icon: <ArrowUpRight className="w-4 h-4" />, color: "text-blue-700", bg: "bg-blue-50 border-blue-300" },
    ajuste: { label: "Ajuste de Inventário", icon: <RefreshCw className="w-4 h-4" />, color: "text-violet-700", bg: "bg-violet-50 border-violet-300" },
    perda: { label: "Quebra / Perda / Avaria", icon: <AlertOctagon className="w-4 h-4" />, color: "text-rose-700", bg: "bg-rose-50 border-rose-300" },
    validade: { label: "Validade Expirada", icon: <AlertOctagon className="w-4 h-4" />, color: "text-amber-700", bg: "bg-amber-50 border-amber-300" },
    devolucao: { label: "Devolução de Cliente", icon: <Undo2 className="w-4 h-4" />, color: "text-teal-700", bg: "bg-teal-50 border-teal-300" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Registar Movimentação de Estoque</h3>
              <p className="text-xs text-slate-300">Entradas, saídas manuais, quebras e ajustes</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* Product Select */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Produto</label>
            <select
              value={selectedProdutoId}
              onChange={(e) => {
                const pId = parseInt(e.target.value);
                setSelectedProdutoId(pId);
                const p = produtos.find((x) => x.id === pId);
                if (p) {
                  setLote(p.loteAtual || "");
                  setDataValidade(p.dataValidade || "");
                  setValorUnitario(p.precoCusto || 0);
                }
              }}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium focus:outline-none focus:border-sky-500"
            >
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.codigo}) — Stock: {p.stock} {p.unidadeMedida}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Banner */}
          {selectedProduto && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Stock Atual: </span>
                <strong className="text-slate-900 text-sm">
                  {selectedProduto.stock} {selectedProduto.unidadeMedida}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Custo Ref: </span>
                <strong className="text-slate-900">
                  {formatCurrency(selectedProduto.precoCusto || 0, config.moeda)}
                </strong>
              </div>
            </div>
          )}

          {/* Movement Type Buttons */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Tipo de Movimento</label>
            <div className="grid grid-cols-3 gap-2">
              {(["entrada", "saida", "ajuste", "perda", "validade", "devolucao"] as TipoMovimento[]).map((t) => {
                const conf = tipoConfig[t];
                const isSelected = tipo === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      isSelected
                        ? `${conf.bg} ${conf.color} shadow-sm border-2`
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {conf.icon}
                    <span className="truncate">{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Unit Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                {tipo === "ajuste" ? "Novo Stock Alvo" : "Quantidade"}
              </label>
              <input
                type="number"
                min={tipo === "ajuste" ? 0 : 1}
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Preço Unitário de Custo ({config.moeda})
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={valorUnitario}
                onChange={(e) => setValorUnitario(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
              />
            </div>
          </div>

          {/* Batch & Expiry Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Número do Lote</label>
              <input
                type="text"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                placeholder="Ex: LT-2026-X1"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Data de Validade</label>
              <input
                type="text"
                value={dataValidade}
                onChange={(e) => setDataValidade(e.target.value)}
                placeholder="DD/MM/AAAA"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Document Reference */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              Doc. de Referência / Guia de Remessa
            </label>
            <input
              type="text"
              value={referenciaDoc}
              onChange={(e) => setReferenciaDoc(e.target.value)}
              placeholder="Ex: Guia nº 8901, Fatura Fornecedor FR-123..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Justification / Reason */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Motivo / Justificação</label>
            <textarea
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo desta movimentação..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-sm font-bold transition shadow-sm"
            >
              {loading ? "A processar..." : "Confirmar Movimentação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
