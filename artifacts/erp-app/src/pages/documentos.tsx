import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useListDocuments,
  useDeleteDocument,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, FileText, Eye, Trash2 } from "lucide-react";
import { MetricCard } from "./lab-ui";

const DOC_TYPES: Record<string, string> = {
  factura: "Factura",
  factura_global: "Factura Global",
  factura_recibo: "Factura Recibo",
  nota_credito: "Nota de Crédito",
  factura_proforma: "Factura Pró-Forma",
  orcamento: "Orçamento",
  encomenda: "Encomenda",
  guia_transporte: "Guia de Transporte",
  guia_remessa: "Guia de Remessa",
  avenca: "Avença",
  recibo: "Recibo",
};

const INVOICE_TYPES = new Set(["factura", "factura_global", "factura_recibo", "factura_proforma", "recibo"]);
const TRANSPORT_TYPES = new Set(["guia_transporte", "guia_remessa"]);
export type DocumentView = "todos" | "faturacao" | "liquidar" | "transporte" | "avencas" | "formacao";
const VIEW_TITLES: Record<DocumentView, string> = {
  todos: "Todos os Documentos",
  faturacao: "Facturas",
  liquidar: "Faturas por Liquidar",
  transporte: "Transporte",
  avencas: "Avenças",
  formacao: "Formação",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  rascunho: { label: "Rascunho", className: "bg-gray-100 text-gray-600 border-gray-200" },
  emitido: { label: "Emitido", className: "bg-blue-100 text-blue-700 border-blue-200" },
  pago: { label: "Pago", className: "bg-green-100 text-green-700 border-green-200" },
  cancelado: { label: "Cancelado", className: "bg-red-100 text-red-600 border-red-200" },
};

export default function Documentos({ view = "todos" }: { view?: DocumentView }) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: documents = [], isLoading } = useListDocuments({
    type: filterType || undefined,
    status: filterStatus || (view === "liquidar" ? "emitido" : undefined),
  });
  const deleteDocument = useDeleteDocument({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() }); toast({ title: "Documento eliminado" }); }, onError: () => toast({ title: "Erro ao eliminar", variant: "destructive" }) } });

  const filtered = documents.filter(document => {
    if (view === "faturacao" && !INVOICE_TYPES.has(document.type)) return false;
    if (view === "liquidar" && (!INVOICE_TYPES.has(document.type) || document.status !== "emitido")) return false;
    if (view === "transporte" && !TRANSPORT_TYPES.has(document.type)) return false;
    if (view === "avencas" && document.type !== "avenca") return false;
    if (view === "formacao" && !/modo forma[cç][aã]o:\s*sim|modo forma[cç][aã]o ativo/i.test(document.notes ?? "")) return false;
    return !search ||
      document.number?.toLowerCase().includes(search.toLowerCase()) ||
      document.clientName?.toLowerCase().includes(search.toLowerCase());
  });
  const totalValue = filtered.filter(document => document.status !== "cancelado").reduce((sum, document) => sum + document.total, 0);
  const outstandingValue = filtered.filter(document => document.status === "emitido").reduce((sum, document) => sum + document.total, 0);

  function handleDelete(id: number) {
    if (confirm("Eliminar este documento?")) deleteDocument.mutate({ id });
  }

  const formatCurrency = useFormatCurrency();
  const formatDate = (val: string | null | undefined) => val ? new Date(val).toLocaleDateString("pt-PT") : "—";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{VIEW_TITLES[view]}</h2>
          <p className="mt-1 text-sm text-gray-500">{view === "liquidar" ? "Documentos emitidos que ainda não foram marcados como pagos." : "Consulte e acompanhe documentos guardados no ERP."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setLocation("/documentos/novo")} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus size={16} className="mr-2" /> Novo Documento
          </Button>
        </div>
      </div>

      {view !== "todos" && <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="Documentos" value={filtered.length} detail={`${VIEW_TITLES[view]} encontrados`} tone="blue" />
        <MetricCard label={view === "liquidar" ? "Saldo por liquidar" : "Valor listado"} value={formatCurrency(view === "liquidar" ? outstandingValue : totalValue)} detail="Exclui documentos cancelados" tone={view === "liquidar" ? "amber" : "teal"} />
      </div>}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input className="pl-9" placeholder="Pesquisar por número ou cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[160px]" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos os tipos</option>
          {Object.entries(DOC_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[140px]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_LABELS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Número</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Data</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center py-12 text-gray-400">A carregar...</td></tr>}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center py-16 text-gray-400">
                    <FileText size={40} className="mb-3 opacity-40" />
                    <p className="font-medium">Nenhum documento encontrado</p>
                    <p className="text-sm mt-1">Crie o primeiro documento</p>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map(doc => {
              const st = STATUS_LABELS[doc.status] ?? { label: doc.status, className: "" };
              return (
                <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setLocation(`/documentos/${doc.id}`)}>
                  <td className="px-4 py-3 font-mono text-blue-700 font-medium">{doc.number || `#${doc.id}`}</td>
                  <td className="px-4 py-3 text-gray-600">{DOC_TYPES[doc.type] || doc.type}</td>
                  <td className="px-4 py-3 text-gray-800">{doc.clientName || "Consumidor Final"}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(doc.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(doc.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={st.className}>{st.label}</Badge>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/documentos/${doc.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Eye size={14} /></Button>
                      </Link>
                      {doc.status === "rascunho" && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(doc.id)} aria-label={`Eliminar rascunho ${doc.number ?? doc.id}`} title="Eliminar rascunho">
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
