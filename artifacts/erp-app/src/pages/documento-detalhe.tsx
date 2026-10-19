import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetDocument,
  useAddDocumentItem,
  useCreateDocument,
  useUpdateDocument,
  useUpdateDocumentItem,
  useDeleteDocumentItem,
  useGetSettings,
  useListClients,
  getGetDocumentQueryKey,
  getListDocumentsQueryKey,
  getGetDashboardQueryKey,
  getListSolicitacoesQueryKey,
  getListProductsQueryKey,
  useListProducts,
  useUpdateProduct,
  useListSolicitacoes,
  useUpdateSolicitacao,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronLeft, Copy, Mail, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import { useFormatCurrency } from "@/hooks/use-format-currency";

const DOC_TYPES: Record<string, string> = {
  factura: "Factura", factura_global: "Factura Global", factura_recibo: "Factura Recibo",
  nota_credito: "Nota de Crédito", factura_proforma: "Factura Pró-Forma",
  orcamento: "Orçamento", encomenda: "Encomenda", guia_transporte: "Guia de Transporte",
  guia_remessa: "Guia de Remessa", avenca: "Avença", recibo: "Recibo",
};
const STATUS_LABELS: Record<string, { label: string; next?: { label: string; value: string }; className: string }> = {
  rascunho: { label: "Rascunho", className: "bg-gray-100 text-gray-600", next: { label: "Emitir", value: "emitido" } },
  emitido: { label: "Emitido", className: "bg-blue-100 text-blue-700", next: { label: "Marcar como Pago", value: "pago" } },
  pago: { label: "Pago", className: "bg-green-100 text-green-700" },
  cancelado: { label: "Cancelado", className: "bg-red-100 text-red-600" },
};

export default function DocumentoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: settings } = useGetSettings();
  const { data: clients = [] } = useListClients();
  const { data: doc, isLoading } = useGetDocument(Number(id));
  const { data: products } = useListProducts();
  const { data: solicitacoes = [] } = useListSolicitacoes();
  const refreshDocument = () => {
    void qc.invalidateQueries({ queryKey: getGetDocumentQueryKey(Number(id)) });
    void qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
    void qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
  };
  const updateDocument = useUpdateDocument({ mutation: { onSuccess: () => { refreshDocument(); toast({ title: "Documento atualizado" }); }, onError: () => toast({ title: "Erro", variant: "destructive" }) } });
  const createDocument = useCreateDocument();
  const addItem = useAddDocumentItem({ mutation: { onSuccess: () => { refreshDocument(); setNewItem({ description: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: settings?.taxRate ?? 14 }); toast({ title: "Item adicionado" }); }, onError: () => toast({ title: "Erro ao adicionar item", variant: "destructive" }) } });
  const updateItem = useUpdateDocumentItem({ mutation: { onSuccess: () => { refreshDocument(); setEditingItemId(null); toast({ title: "Item atualizado" }); }, onError: () => toast({ title: "Erro ao atualizar item", variant: "destructive" }) } });
  const updateProduct = useUpdateProduct();
  const updateSolicitacao = useUpdateSolicitacao();
  const deleteItem = useDeleteDocumentItem({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetDocumentQueryKey(Number(id)) }), onError: () => toast({ title: "Erro ao eliminar item", variant: "destructive" }) } });
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState({ description: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 14 });
  const [newItem, setNewItem] = useState({ description: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 14 });

  const formatCurrency = useFormatCurrency();
  const formatDate = (v: string | null | undefined) => v ? new Date(v).toLocaleDateString("pt-PT") : "—";

  if (isLoading) return <div className="p-6 text-gray-500">A carregar documento...</div>;
  if (!doc) return <div className="p-6 text-gray-500">Documento não encontrado.</div>;

  const currentDocument = doc;
  const documentId = currentDocument.id;
  const st = STATUS_LABELS[currentDocument.status] ?? { label: currentDocument.status, className: "" };
  const labRequestMatch = currentDocument.notes?.match(/Solicitação de exame #(\d+)/i);
  const labRequestId = labRequestMatch ? Number(labRequestMatch[1]) : undefined;
  const agtHash = currentDocument.notes?.match(/^Hash AGT:\s*(.+)$/im)?.[1]?.trim();
  const optionLines = (currentDocument.notes ?? "").split("\n").filter(line => /^(Tipo de documento|Empresa|Data de emissão|Data de disponibilização|Vencimento|Pagamentos|Desconto|Local de carga|Local de descarga|Viatura|Incluir preços|Saída de stock|Retenção|Documento a gerar|Modo formação|Movimentar stock):/.test(line));
  const originalNotes = (currentDocument.notes ?? "").split("\n").filter(line => !/^(Tipo de documento|Empresa|Data de emissão|Data de disponibilização|Vencimento|Pagamentos|Desconto|Local de carga|Local de descarga|Viatura|Incluir preços|Saída de stock|Retenção|Documento a gerar|Modo formação|Movimentar stock|Hash AGT):/.test(line)).join("\n").trim();

  async function handleStatusChange(newStatus: string) {
    if (newStatus === "emitido" && labRequestId != null) {
      toast({ title: "Emita pelo Novo Documento", description: "Facturas ligadas a pedidos do LAB devem ser emitidas a partir da lista de espera em Novo Documento.", variant: "destructive" });
      return;
    }
    if (newStatus === "emitido" && currentDocument.status === "rascunho" && currentDocument.items?.length && currentDocument.notes?.includes("Movimentar stock: Sim")) {
      const stockRequirements = new Map<number, { quantity: number; stock: number; name: string }>();
      for (const item of currentDocument.items) {
        if (!item.productId) continue;
        const product = products?.find(candidate => candidate.id === item.productId);
        if (!product) continue;
        const previous = stockRequirements.get(item.productId);
        stockRequirements.set(item.productId, {
          quantity: (previous?.quantity ?? 0) + item.quantity,
          stock: product.stock,
          name: product.name,
        });
      }
      const insufficient = [...stockRequirements.values()].find(requirement => requirement.quantity > requirement.stock);
      if (insufficient) {
        toast({ title: "Stock insuficiente", description: `${insufficient.name}: disponíveis ${insufficient.stock}, pedidos ${insufficient.quantity}.`, variant: "destructive" });
        return;
      }
      try {
        for (const [productId, requirement] of stockRequirements) {
          await updateProduct.mutateAsync({ id: productId, data: { stock: requirement.stock - requirement.quantity } });
        }
        await updateDocument.mutateAsync({ id: documentId, data: { status: "emitido" } });
        void qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
        return;
      } catch {
        toast({ title: "Não foi possível emitir", description: "O stock não foi actualizado por completo. O documento continua em rascunho.", variant: "destructive" });
        return;
      }
    }
    updateDocument.mutate({ id: documentId, data: { status: newStatus as "rascunho" | "emitido" | "pago" | "cancelado" } });
  }

  async function handleCancel() {
    if (!confirm("Cancelar este documento?")) return;
    let documentCancelled = false;
    try {
      await updateDocument.mutateAsync({ id: doc!.id, data: { status: "cancelado" } });
      documentCancelled = true;
      const linkedRequest = solicitacoes.find(request => request.id === labRequestId);
      if (linkedRequest?.estado === "concluida") {
        await updateSolicitacao.mutateAsync({ id: linkedRequest.id, data: { estado: "pendente" } });
        void qc.invalidateQueries({ queryKey: getListSolicitacoesQueryKey() });
      }
    } catch {
      toast(documentCancelled
        ? { title: "Documento cancelado, mas o pedido do LAB não foi reaberto", description: "Verifique o estado da solicitação na lista de espera.", variant: "destructive" }
        : { title: "Não foi possível cancelar o documento", variant: "destructive" });
    }
  }

  function beginEdit(item: { id: number; description: string; quantity: number; unitPrice: number; discount?: number; taxRate?: number }) {
    setEditingItemId(item.id);
    setEditItem({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount ?? 0,
      taxRate: item.taxRate ?? 0,
    });
  }

  function submitEdit() {
    if (editingItemId == null || !editItem.description.trim()) return;
    updateItem.mutate({
      id: documentId,
      itemId: editingItemId,
      data: { ...editItem, description: editItem.description.trim() },
    });
  }

  function submitNewItem() {
    if (!newItem.description.trim()) {
      toast({ title: "Descrição obrigatória", variant: "destructive" });
      return;
    }
    addItem.mutate({
      id: documentId,
      data: { ...newItem, description: newItem.description.trim() },
    });
  }

  function emailDocument() {
    const client = clients.find(candidate => candidate.id === currentDocument.clientId);
    if (!client?.email) {
      toast({ title: "Email do cliente não disponível", description: "Adicione um endereço de email ao cliente antes de preparar o envio.", variant: "destructive" });
      return;
    }
    const subject = `${DOC_TYPES[currentDocument.type] ?? "Documento"} ${currentDocument.number ?? `#${currentDocument.id}`}`;
    const body = [
      `Olá${currentDocument.clientName ? ` ${currentDocument.clientName}` : ""},`,
      "",
      `Segue o documento ${currentDocument.number ?? `#${currentDocument.id}`}.`,
      `Total: ${formatCurrency(currentDocument.total)}`,
      currentDocument.dueDate ? `Vencimento: ${formatDate(currentDocument.dueDate)}` : "",
      "",
      "Com os melhores cumprimentos.",
    ].filter(Boolean).join("\n");
    window.location.href = `mailto:${encodeURIComponent(client.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  async function duplicateDocument() {
    if (labRequestId != null) {
      toast({ title: "Factura ligada ao LAB", description: "Para facturar outro exame, seleccione uma nova solicitação em Novo Documento.", variant: "destructive" });
      return;
    }
    try {
      const duplicate = await createDocument.mutateAsync({
        data: {
          type: currentDocument.type,
          clientId: currentDocument.clientId ?? undefined,
          discount: currentDocument.discount,
          dueDate: currentDocument.dueDate ?? undefined,
          notes: (currentDocument.notes ?? "").split("\n").filter(line => !/^Hash AGT:/i.test(line)).join("\n") || undefined,
        },
      });
      for (const item of currentDocument.items ?? []) {
        await addItem.mutateAsync({
          id: duplicate.id,
          data: {
            productId: item.productId ?? undefined,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount ?? 0,
            taxRate: item.taxRate ?? 0,
          },
        });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() }),
      ]);
      toast({ title: "Cópia criada como rascunho", description: "O documento original não foi alterado." });
      setLocation(`/documentos/${duplicate.id}`);
    } catch {
      refreshDocument();
      toast({ title: "A cópia ficou incompleta", description: "Foi criado um rascunho parcial. Reveja-o antes de emitir.", variant: "destructive" });
    }
  }

  return (
    <div className="document-detail-printable p-6 max-w-4xl mx-auto space-y-5">
      <div className="document-detail-back flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/documentos")} className="text-gray-500">
          <ChevronLeft size={16} className="mr-1" /> Documentos
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">{doc.number || `#${doc.id}`}</h2>
            <Badge className={st.className}>{st.label}</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">{DOC_TYPES[doc.type] || doc.type} · {formatDate(doc.createdAt)}</p>
        </div>
        <div className="document-detail-actions flex flex-wrap gap-2">
          {st.next && (
            <Button onClick={() => void handleStatusChange(st.next!.value)} disabled={updateDocument.isPending || updateProduct.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {st.next.label}
            </Button>
          )}
          <Button variant="outline" onClick={() => window.print()}><Printer size={15} className="mr-1" /> Imprimir / PDF</Button>
          <Button variant="outline" onClick={emailDocument}><Mail size={15} className="mr-1" /> Enviar por email</Button>
          {labRequestId == null && <Button variant="outline" onClick={() => void duplicateDocument()} disabled={createDocument.isPending || addItem.isPending}><Copy size={15} className="mr-1" /> Duplicar</Button>}
          {labRequestId != null && <span className="self-center text-xs text-gray-500">Para outro exame, seleccione um novo pedido em Novo Documento.</span>}
          {doc.status !== "cancelado" && doc.status !== "pago" && (
            <Button variant="outline" onClick={handleCancel} className="text-red-600 border-red-200 hover:bg-red-50" disabled={updateDocument.isPending}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm border-b border-gray-100 pb-2">Emitente</h3>
          <div className="text-sm space-y-1">
            <p className="font-semibold text-gray-800">{settings?.companyName || "ULTRACARDIO, LDA"}</p>
            {settings?.nif && <p className="text-gray-500 text-xs">NIF: {settings.nif}</p>}
            {settings?.address && <p className="text-gray-500 text-xs">{settings.address}</p>}
            {settings?.phone && <p className="text-gray-500 text-xs">Tel: {settings.phone}</p>}
            {settings?.email && <p className="text-gray-500 text-xs">{settings.email}</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm border-b border-gray-100 pb-2">Cliente</h3>
          <div className="text-sm space-y-1">
            <p className="font-medium text-gray-800">{doc.clientName || "Consumidor Final"}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm border-b border-gray-100 pb-2">Informações</h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between"><p className="text-gray-400 text-xs">Tipo</p><p className="font-medium text-xs">{DOC_TYPES[doc.type] || doc.type}</p></div>
            <div className="flex justify-between"><p className="text-gray-400 text-xs">Estado</p><p className="font-medium text-xs">{st.label}</p></div>
            <div className="flex justify-between"><p className="text-gray-400 text-xs">Emissão</p><p className="font-medium text-xs">{formatDate(doc.issuedAt || doc.createdAt)}</p></div>
            <div className="flex justify-between"><p className="text-gray-400 text-xs">Vencimento</p><p className="font-medium text-xs">{formatDate(doc.dueDate)}</p></div>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700 text-sm">Itens</h3>
        </div>
        {doc.items && doc.items.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Descrição</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Qtd</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Preço Unit.</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Desc %</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">IVA %</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Total</th>
                {doc.status === "rascunho" && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
                {doc.items.map(item => (
                <tr key={item.id} className="border-b border-gray-50">
                  {editingItemId === item.id ? <><td className="px-4 py-3"><input className="w-full rounded border px-2 py-1 text-sm" value={editItem.description} onChange={event => setEditItem(current => ({ ...current, description: event.target.value }))} /></td><td className="px-4 py-3"><input className="w-20 rounded border px-2 py-1 text-right text-sm" type="number" min="0.001" step="0.001" value={editItem.quantity} onChange={event => setEditItem(current => ({ ...current, quantity: Number(event.target.value) || 0 }))} /></td><td className="px-4 py-3"><input className="w-24 rounded border px-2 py-1 text-right text-sm" type="number" min="0" step="0.01" value={editItem.unitPrice} onChange={event => setEditItem(current => ({ ...current, unitPrice: Number(event.target.value) || 0 }))} /></td><td className="px-4 py-3"><input className="w-16 rounded border px-2 py-1 text-right text-sm" type="number" min="0" max="100" step="0.01" value={editItem.discount} onChange={event => setEditItem(current => ({ ...current, discount: Number(event.target.value) || 0 }))} /></td><td className="px-4 py-3"><input className="w-16 rounded border px-2 py-1 text-right text-sm" type="number" min="0" max="100" step="0.01" value={editItem.taxRate} onChange={event => setEditItem(current => ({ ...current, taxRate: Number(event.target.value) || 0 }))} /></td><td className="px-4 py-3 text-right font-medium">{formatCurrency(editItem.quantity * editItem.unitPrice * (1 - editItem.discount / 100))}</td></> : <><td className="px-4 py-3 text-gray-800">{item.description}</td><td className="px-4 py-3 text-right">{item.quantity}</td><td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td><td className="px-4 py-3 text-right">{item.discount}%</td><td className="px-4 py-3 text-right">{item.taxRate}%</td><td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td></>}
                  {doc.status === "rascunho" && (
                    <td className="px-2 py-3">
                      {editingItemId === item.id ? <div className="flex gap-1"><button onClick={submitEdit} className="rounded p-1 text-green-600 hover:bg-green-50" aria-label="Guardar item"><Check size={14} /></button><button onClick={() => setEditingItemId(null)} className="rounded p-1 text-gray-400 hover:bg-gray-50" aria-label="Cancelar edição"><X size={14} /></button></div> : <div className="flex gap-1"><button onClick={() => beginEdit(item)} className="rounded p-1 text-blue-400 hover:bg-blue-50" aria-label="Editar item"><Pencil size={14} /></button><button onClick={() => deleteItem.mutate({ id: doc.id, itemId: item.id })} className="rounded p-1 text-red-400 hover:bg-red-50" aria-label="Eliminar item"><Trash2 size={14} /></button></div>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-10 text-center text-gray-400 text-sm">Nenhum item neste documento.</div>
        )}
        {doc.status === "rascunho" && <div className="border-t border-gray-100 bg-blue-50/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700"><Plus size={15} className="text-blue-500" /> Adicionar item ao rascunho</div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
            <input className="rounded border px-2 py-2 text-sm md:col-span-2" placeholder="Descrição" value={newItem.description} onChange={event => setNewItem(current => ({ ...current, description: event.target.value }))} />
            <input className="rounded border px-2 py-2 text-sm" type="number" min="0.001" step="0.001" placeholder="Qtd." value={newItem.quantity} onChange={event => setNewItem(current => ({ ...current, quantity: Number(event.target.value) || 0 }))} />
            <input className="rounded border px-2 py-2 text-sm" type="number" min="0" step="0.01" placeholder="Preço" value={newItem.unitPrice} onChange={event => setNewItem(current => ({ ...current, unitPrice: Number(event.target.value) || 0 }))} />
            <Button size="sm" onClick={submitNewItem} disabled={addItem.isPending}><Plus size={14} /> Adicionar</Button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 md:w-1/2">
            <input className="rounded border px-2 py-2 text-sm" type="number" min="0" max="100" step="0.01" placeholder="Desconto %" value={newItem.discount} onChange={event => setNewItem(current => ({ ...current, discount: Number(event.target.value) || 0 }))} />
            <input className="rounded border px-2 py-2 text-sm" type="number" min="0" max="100" step="0.01" placeholder="IVA %" value={newItem.taxRate} onChange={event => setNewItem(current => ({ ...current, taxRate: Number(event.target.value) || 0 }))} />
          </div>
        </div>}

        {/* Totals */}
        <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <div className="space-y-1.5 text-sm w-60">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(doc.subtotal ?? 0)}</span></div>
            {Number(doc.discount) > 0 && <div className="flex justify-between text-gray-500"><span>Desconto</span><span>-{formatCurrency(Number(doc.subtotal ?? 0) * Number(doc.discount) / 100)}</span></div>}
            <div className="flex justify-between text-gray-600"><span>IVA</span><span>{formatCurrency(doc.tax ?? 0)}</span></div>
            <div className="flex justify-between font-bold text-gray-800 text-base pt-1 border-t border-gray-200"><span>Total</span><span>{formatCurrency(doc.total)}</span></div>
          </div>
        </div>
      </div>

      {optionLines.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="mb-3 font-semibold text-gray-700 text-sm">Definições aplicadas</h3>
          <div className="grid gap-x-8 gap-y-2 text-xs text-gray-600 md:grid-cols-2">
            {optionLines.map(line => { const separator = line.indexOf(":"); return <div key={line} className="flex justify-between gap-3 border-b border-gray-50 pb-1"><span className="text-gray-400">{line.slice(0, separator)}</span><strong className="text-right font-medium text-gray-700">{line.slice(separator + 1).trim()}</strong></div>; })}
          </div>
        </div>
      )}

      {agtHash && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Validação fiscal do LAB</h3>
          <div className="flex flex-wrap items-center gap-4">
            <img className="h-28 w-28 border border-gray-200 p-1" src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(agtHash)}`} alt="QR Code com hash AGT" />
            <div className="min-w-0 flex-1"><p className="text-xs text-gray-500">Hash AGT</p><p className="mt-1 break-all font-mono text-xs text-gray-800">{agtHash}</p></div>
          </div>
        </div>
      )}

      {originalNotes && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="font-semibold text-gray-700 text-sm mb-2">Notas</h3>
          <p className="whitespace-pre-line text-sm text-gray-600">{originalNotes}</p>
        </div>
      )}
    </div>
  );
}
