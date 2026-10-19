import { useEffect, useMemo, useState } from "react";
import { Check, Download, FileText, Link2, Loader2, Mail, Printer, QrCode, Receipt, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { useLocation } from "wouter";
import {
  getGetDashboardQueryKey,
  getListDocumentsQueryKey,
  getListSolicitacoesQueryKey,
  useAddDocumentItem,
  useCreateDocument,
  useGetSettings,
  useListClients,
  useListPacientes,
  useListProducts,
  useListSolicitacoes,
  useUpdateDocument,
  useUpdateSolicitacao,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { ANGOLA_VAT_RATE, createAgthash, INVOICE_SERIES } from "@/lib/agt";
import { LoadingRows, PageShell, QueryError, Section } from "./lab-ui";

type BillingItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  productId?: number;
};

type RequestExam = Record<string, unknown> | string;
type RequestLike = {
  id: number;
  parceiroId?: number | null;
  parceiroNome?: string;
  pacienteId: number;
  pacienteNome: string;
  exames: unknown[];
  urgente?: boolean;
  estado: string;
  observacoes?: string;
};

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function examName(exam: RequestExam, index: number) {
  if (typeof exam === "string") return exam;
  return String(exam.nome ?? exam.name ?? exam.descricao ?? exam.description ?? `Exame ${index + 1}`);
}

function examPrice(exam: RequestExam) {
  if (typeof exam === "string") return undefined;
  return asNumber(exam.preco ?? exam.precoUnitario ?? exam.price ?? exam.valor ?? exam.unitPrice);
}

export default function BillingModule() {
  const [location, setLocation] = useLocation();
  const isGestaoRoute = location.startsWith("/documentos/");
  const pageEyebrow = isGestaoRoute ? "GESTÃO / DOCUMENTOS" : "LAB / DOCUMENTOS";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const formatCurrency = useFormatCurrency();
  const settings = useGetSettings();
  const requests = useListSolicitacoes();
  const patients = useListPacientes();
  const products = useListProducts();
  const clients = useListClients();
  const createDocument = useCreateDocument();
  const addDocumentItem = useAddDocumentItem();
  const updateDocument = useUpdateDocument();
  const updateRequest = useUpdateSolicitacao();

  const [requestId, setRequestId] = useState<number | undefined>();
  const [patientId, setPatientId] = useState<number | undefined>();
  const [clientId, setClientId] = useState<number | undefined>();
  const [items, setItems] = useState<BillingItem[]>([]);
  const [search, setSearch] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("PENDENTE");
  const [invoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hash, setHash] = useState("");
  const [successInvoice, setSuccessInvoice] = useState<string | null>(null);
  const [persistedSummary, setPersistedSummary] = useState<{ subtotal: number; tax: number; total: number } | null>(null);

  const pendingRequests = useMemo(
    () => ((requests.data ?? []) as RequestLike[]).filter(request => request.estado === "pendente"),
    [requests.data],
  );
  const selectedRequest = pendingRequests.find(request => request.id === requestId);
  const selectedPatient = (patients.data ?? []).find(patient => patient.id === patientId);
  const selectedClient = (clients.data ?? []).find(client => client.id === clientId);
  const matchingProducts = products.data ?? [];
  const visibleRequests = pendingRequests.filter(request => {
    const value = `${request.id} ${request.pacienteNome} ${request.parceiroNome ?? ""}`.toLowerCase();
    return value.includes(search.toLowerCase());
  });

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (item.taxRate / 100), 0);
  const total = subtotal + taxTotal;
  const displaySubtotal = persistedSummary?.subtotal ?? subtotal;
  const displayTaxTotal = persistedSummary?.tax ?? taxTotal;
  const displayTotal = persistedSummary?.total ?? total;
  const sellerNif = settings.data?.nif?.trim() || "999999999";
  const hashPayload = `${sellerNif}|${invoiceDate}|${INVOICE_SERIES}|${invoiceNumber}|${displayTotal.toFixed(2)}`;
  const qrUrl = hash ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=0&data=${encodeURIComponent(hash)}` : "";
  const missingPrices = items.filter(item => item.unitPrice <= 0).length;
  const isSaving = createDocument.isPending || addDocumentItem.isPending || updateDocument.isPending || updateRequest.isPending;

  useEffect(() => {
    let cancelled = false;
    void createAgthash(hashPayload).then(value => {
      if (!cancelled) setHash(value);
    });
    return () => { cancelled = true; };
  }, [hashPayload]);

  function applyRequest(value: string) {
    const nextId = Number(value);
    const request = pendingRequests.find(item => item.id === nextId);
    if (!request) return;
    setRequestId(request.id);
    setPatientId(request.pacienteId);
    const partnerName = request.parceiroNome?.trim().toLowerCase();
    const relatedClient = partnerName ? (clients.data ?? []).find(client => client.name.toLowerCase() === partnerName) : undefined;
    setClientId(relatedClient?.id);

    const nextItems = request.exames.map((rawExam, index) => {
      const exam = isRecord(rawExam) ? rawExam : rawExam as string;
      const name = examName(exam, index);
      const product = matchingProducts.find(item => item.name.trim().toLowerCase() === name.trim().toLowerCase());
      return {
        description: name,
        quantity: asNumber(isRecord(exam) ? exam.quantidade ?? exam.quantity : undefined) ?? 1,
        unitPrice: examPrice(exam) ?? product?.price ?? 0,
        taxRate: ANGOLA_VAT_RATE,
        productId: product?.id,
      };
    });
    setItems(nextItems.length ? nextItems : [{ description: "Serviço laboratorial", quantity: 1, unitPrice: 0, taxRate: ANGOLA_VAT_RATE }]);
    setInvoiceNumber("PENDENTE");
    setPersistedSummary(null);
  }

  function updateItem(index: number, field: "description" | "quantity" | "unitPrice", value: string) {
    setItems(current => current.map((item, itemIndex) => itemIndex === index ? {
      ...item,
      [field]: field === "description" ? value : Number(value),
    } : item));
  }

  async function saveInvoice() {
    if (!selectedRequest || !patientId || items.length === 0) {
      toast({ title: "Selecione uma solicitação pendente", description: "A fatura precisa de uma solicitação e de pelo menos um serviço.", variant: "destructive" });
      return;
    }
    if (missingPrices > 0) {
      toast({ title: "Existem serviços sem preço", description: "Preencha os valores antes de emitir a fatura.", variant: "destructive" });
      return;
    }
    try {
      const patientLabel = selectedPatient?.nome || selectedRequest.pacienteNome;
      const patientNif = selectedPatient?.nif?.trim() || "Sem NIF";
      const notes = [
        `Faturação laboratorial AGT`,
        `Solicitação de exame #${selectedRequest.id}`,
        `Paciente: ${patientLabel}`,
        `NIF do paciente: ${patientNif}`,
      ].join("\n");
      const document = await createDocument.mutateAsync({
        data: {
          type: "factura",
          clientId,
          notes,
          discount: 0,
        },
      });
      for (const item of items) {
        await addDocumentItem.mutateAsync({
          id: document.id,
          data: {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: 0,
            taxRate: ANGOLA_VAT_RATE,
            productId: item.productId,
          },
        });
      }
      const emittedDocument = await updateDocument.mutateAsync({
        id: document.id,
        data: {
          status: "emitido",
        },
      });
      const documentNumber = emittedDocument.number || document.number || `DOC-${String(document.id).padStart(4, "0")}`;
      const persistedTotal = Number(emittedDocument.total);
      const finalHash = await createAgthash(`${sellerNif}|${invoiceDate}|${INVOICE_SERIES}|${documentNumber}|${persistedTotal.toFixed(2)}`);
      await updateDocument.mutateAsync({
        id: document.id,
        data: {
          notes: `${notes}\nHash AGT: ${finalHash}`,
        },
      });
      await updateRequest.mutateAsync({ id: selectedRequest.id, data: { estado: "concluida" } });
      setInvoiceNumber(documentNumber);
      setHash(finalHash);
      setPersistedSummary({
        subtotal: Number(emittedDocument.subtotal ?? subtotal),
        tax: Number(emittedDocument.tax ?? taxTotal),
        total: persistedTotal,
      });
      setSuccessInvoice(documentNumber);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListSolicitacoesQueryKey() }),
      ]);
      toast({ title: "Fatura criada com sucesso", description: `${document.number || `Documento #${document.id}`} associada à solicitação #${selectedRequest.id}.` });
    } catch {
      toast({ title: "Não foi possível criar a fatura", description: "Verifique os dados da solicitação e tente novamente.", variant: "destructive" });
    }
  }

  function printInvoice() {
    window.print();
  }

  function emailInvoice() {
    const email = selectedClient?.email?.trim();
    if (!email) {
      toast({
        title: "Email do cliente não disponível",
        description: "Associe uma entidade com email para preparar o envio.",
        variant: "destructive",
      });
      return;
    }
    const subject = `Fatura ${invoiceNumber} · ${settings.data?.companyName || "Ultracardio"}`;
    const body = `Fatura ${invoiceNumber}\nTotal: ${formatCurrency(displayTotal)}\nHash AGT: ${hash}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  const loading = settings.isLoading || requests.isLoading || patients.isLoading || products.isLoading || clients.isLoading;
  const error = settings.isError || requests.isError || patients.isError || products.isError || clients.isError;
  if (error) {
    return <PageShell eyebrow={pageEyebrow} title="Facturação" description="Emissão fiscal laboratorial integrada com o ERP."><QueryError onRetry={() => { void settings.refetch(); void requests.refetch(); void patients.refetch(); void products.refetch(); void clients.refetch(); }} /></PageShell>;
  }
  if (loading) return <PageShell eyebrow={pageEyebrow} title="Facturação" description="A carregar dados fiscais e solicitações pendentes."><LoadingRows count={5} columns={4} /></PageShell>;

  return (
    <PageShell
      eyebrow={pageEyebrow}
      title="Facturação"
      description="Emita e consulte documentos de faturação laboratorial integrados com as solicitações do LAB."
      actions={<div className="billing-actions flex items-center gap-2"><Button variant="outline" onClick={printInvoice}><Printer size={15} /> Imprimir</Button><Button onClick={() => void saveInvoice()} disabled={isSaving || !selectedRequest}>{isSaving ? <Loader2 size={15} className="animate-spin" /> : <Receipt size={15} />} Emitir documento</Button></div>}
    >
      <div className="billing-vendus-shell">
        <div className="billing-vendus-toolbar billing-interface">
          <div className="flex min-w-0 items-center gap-3">
            <div className="billing-vendus-mark">V</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Documentos</span><span className="text-slate-300">/</span><span>Facturas</span>
              </div>
              <h2 className="mt-1 truncate text-lg font-semibold text-slate-800">Nova factura</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={printInvoice}><Printer size={14} /> Imprimir</Button>
            <Button variant="outline" size="sm" onClick={printInvoice}><Download size={14} /> PDF</Button>
            <Button variant="outline" size="sm" onClick={emailInvoice}><Mail size={14} /> Email</Button>
          </div>
        </div>

        <div className="billing-interface grid gap-5 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.25fr)]">
        <div className="space-y-5">
          <Section title="Exames pendentes de cobrança" hint={`${pendingRequests.length} solicitações aguardam faturação`}>
            <div className="border-b border-[hsl(var(--border))] p-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <Input className="pl-9" placeholder="Pesquisar paciente ou parceiro..." value={search} onChange={event => setSearch(event.target.value)} />
              </div>
            </div>
            {visibleRequests.length === 0 ? (
              <div className="p-6 text-center text-sm text-[hsl(var(--muted-foreground))]">Não há solicitações de exame pendentes.</div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto">
                {visibleRequests.map(request => (
                  <button type="button" key={request.id} onClick={() => applyRequest(String(request.id))} className={`billing-request-row flex w-full items-center gap-3 border-b border-[hsl(var(--border))] px-4 py-3 text-left transition-colors hover:bg-[hsl(var(--accent))] ${request.id === requestId ? "bg-[hsl(var(--accent))]" : ""}`}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--primary))]"><FileText size={16} /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">#{request.id} · {request.pacienteNome}</span><span className="mt-1 block truncate text-xs text-[hsl(var(--muted-foreground))]">{request.parceiroNome || "Atendimento direto"} · {request.exames.length} serviço(s)</span></span>
                    {request.urgente && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800">Urgente</span>}
                  </button>
                ))}
              </div>
            )}
          </Section>

          <Section title="Dados da factura" hint="A emissão usa a configuração fiscal da empresa">
            <div className="space-y-3 p-4">
              <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))]">Solicitação seleccionada</label>
              <select className="h-10 w-full rounded-md border border-[hsl(var(--input))] bg-background px-3 text-sm" value={requestId ?? ""} onChange={event => applyRequest(event.target.value)}>
                <option value="">Escolher solicitação pendente</option>
                {pendingRequests.map(request => <option key={request.id} value={request.id}>#{request.id} · {request.pacienteNome}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">IVA AGT</p><p className="mt-1 text-xl font-bold text-teal-900">{ANGOLA_VAT_RATE}%</p></div>
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-sky-700">NIF emitente</p><p className="mt-1 truncate font-mono text-sm font-bold text-sky-900">{sellerNif}</p></div>
              </div>
              {selectedPatient && <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 text-xs"><p className="font-semibold">{selectedPatient.nome}</p><p className="mt-1 text-[hsl(var(--muted-foreground))]">{selectedPatient.nif ? `NIF: ${selectedPatient.nif}` : "NIF não registado"} · {selectedPatient.telefone || "Sem telefone"}</p></div>}
            </div>
          </Section>

          <Section title="Serviços facturados" hint={missingPrices ? `${missingPrices} serviço(s) sem preço` : "Valores preenchidos a partir do catálogo"}>
            <div className="overflow-x-auto">
              {items.length === 0 ? <div className="p-6 text-center text-sm text-[hsl(var(--muted-foreground))]">Selecione uma solicitação para carregar os serviços.</div> : <table className="w-full min-w-[520px] text-sm"><thead className="bg-[hsl(var(--muted))] text-left text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]"><tr><th className="px-3 py-2">Descrição</th><th className="w-20 px-2 py-2 text-right">Qtd.</th><th className="w-32 px-2 py-2 text-right">Preço</th><th className="w-24 px-3 py-2 text-right">Total</th></tr></thead><tbody>{items.map((item, index) => <tr key={`${item.description}-${index}`} className="border-t border-[hsl(var(--border))]"><td className="px-3 py-2"><Input className="h-8" value={item.description} onChange={event => updateItem(index, "description", event.target.value)} /></td><td className="px-2 py-2"><Input className="h-8 text-right" type="number" min="1" value={item.quantity} onChange={event => updateItem(index, "quantity", event.target.value)} /></td><td className="px-2 py-2"><Input className={`h-8 text-right ${item.unitPrice <= 0 ? "border-amber-400" : ""}`} type="number" min="0" step="0.01" value={item.unitPrice} onChange={event => updateItem(index, "unitPrice", event.target.value)} /></td><td className="px-3 py-2 text-right font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</td></tr>)}</tbody></table>}
            </div>
          </Section>
        </div>

        <div className="billing-printable billing-vendus-paper rounded-xl border border-[hsl(var(--border))] bg-white shadow-sm">
          <div className="billing-interface flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4">
            <div><p className="font-mono text-[10px] uppercase tracking-wider text-[#1577eb]">Pré-visualização do documento</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Documento A4 · IVA incluído à taxa legal.</p></div>
            <span className="billing-status-pill"><ShieldCheck size={14} /> Rascunho</span>
          </div>
          <div className="billing-invoice p-6 sm:p-10">
            <div className="billing-invoice-header flex flex-col justify-between gap-6 border-b pb-6 sm:flex-row">
              <div><p className="text-xl font-black tracking-tight text-slate-900">{settings.data?.companyName || "ULTRACARDIO, LDA"}</p><p className="mt-2 text-xs leading-5 text-slate-600">{settings.data?.address || "Angola"} · {settings.data?.phone || "Contacto não configurado"}</p><p className="mt-1 font-mono text-xs font-semibold text-slate-700">NIF: {sellerNif}</p></div>
              <div className="text-left sm:text-right"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1577eb]">Factura</p><p className="mt-1 text-2xl font-black text-slate-900">{invoiceNumber}</p><p className="mt-2 text-xs text-slate-600">Data de emissão: {invoiceDate}</p></div>
            </div>

            <div className="billing-patient-grid mt-7 grid gap-4 sm:grid-cols-2">
              <div className="billing-party-card rounded-lg border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cliente</p><div className="mt-3 flex items-start gap-2"><UserRound size={17} className="mt-0.5 text-[#1577eb]" /><div><p className="font-semibold text-slate-900">{selectedPatient?.nome || selectedRequest?.pacienteNome || "A seleccionar"}</p><p className="mt-1 text-xs text-slate-600">NIF: {selectedPatient?.nif || "Não registado"}</p><p className="mt-1 text-xs text-slate-600">Processo: {selectedPatient?.processo || "—"} · Amostra: {selectedPatient?.nAmostra || "—"}</p></div></div></div>
              <div className="billing-party-card rounded-lg border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Entidade pagadora</p><div className="mt-3 flex items-start gap-2"><Link2 size={17} className="mt-0.5 text-[#1577eb]" /><div><p className="font-semibold text-slate-900">{selectedClient?.name || selectedRequest?.parceiroNome || "Consumidor Final"}</p><p className="mt-1 text-xs text-slate-600">NIF: {selectedClient?.nif || "—"}</p><p className="mt-1 text-xs text-slate-600">{selectedClient?.email || "Sem email registado"}</p></div></div></div>
            </div>

            <div className="mt-7 overflow-hidden rounded-lg border border-slate-200"><table className="w-full text-sm"><thead className="bg-[#eef5fc] text-left text-[10px] uppercase tracking-wider text-slate-600"><tr><th className="px-4 py-3">Descrição</th><th className="px-4 py-3 text-right">Qtd.</th><th className="px-4 py-3 text-right">Preço unit.</th><th className="px-4 py-3 text-right">IVA</th><th className="px-4 py-3 text-right">Total</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Nenhum serviço carregado</td></tr> : items.map((item, index) => <tr key={`${item.description}-preview-${index}`} className="border-t border-slate-200"><td className="px-4 py-3 font-medium text-slate-800">{item.description || "Serviço laboratorial"}</td><td className="px-4 py-3 text-right">{item.quantity}</td><td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td><td className="px-4 py-3 text-right">{ANGOLA_VAT_RATE}%</td><td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</td></tr>)}</tbody></table></div>

            <div className="mt-6 flex flex-col justify-between gap-6 sm:flex-row"><div className="max-w-sm text-xs text-slate-500"><p className="font-semibold text-slate-700">Informação fiscal</p><p className="mt-1 leading-5">IVA calculado automaticamente à taxa de {ANGOLA_VAT_RATE}% sobre os serviços tributáveis.</p><p className="mt-2 break-all font-mono text-[9px]">Hash AGT: {hash || "A calcular..."}</p></div><div className="w-full max-w-xs space-y-2 text-sm text-slate-700"><div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(displaySubtotal)}</span></div><div className="flex justify-between"><span>IVA ({ANGOLA_VAT_RATE}%)</span><span>{formatCurrency(displayTaxTotal)}</span></div><div className="billing-total flex justify-between border-t-2 border-[#1577eb] pt-3 text-lg font-black text-slate-900"><span>Total a pagar</span><span>{formatCurrency(displayTotal)}</span></div></div></div>

            <div className="mt-8 flex flex-col items-start justify-between gap-5 border-t border-slate-200 pt-5 sm:flex-row sm:items-end"><div className="text-[10px] leading-5 text-slate-500"><p>Documento processado pelo BillingModule · Série {INVOICE_SERIES}</p><p>Hash composto por NIF, data, série, número e total.</p></div><div className="flex items-end gap-3"><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">QR Code AGT</p><p className="mt-1 max-w-[180px] break-all font-mono text-[8px] text-slate-500">{hash}</p></div>{qrUrl ? <img className="h-24 w-24 border border-slate-200 p-1" src={qrUrl} alt="QR Code AGT da fatura" /> : <div className="flex h-24 w-24 items-center justify-center border border-slate-200"><QrCode size={36} className="text-slate-400" /></div>}</div></div>
          </div>
        </div>
      </div>
      </div>
      {successInvoice && (
        <div className="billing-success-backdrop billing-interface fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation" onClick={() => setSuccessInvoice(null)}>
          <div className="billing-success-modal w-full max-w-md rounded-xl bg-white p-7 text-center shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="billing-success-title" onClick={event => event.stopPropagation()}>
            <button type="button" className="absolute right-4 top-4 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fechar" onClick={() => setSuccessInvoice(null)}><X size={17} /></button>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check size={28} strokeWidth={3} /></div>
            <h2 id="billing-success-title" className="mt-5 text-xl font-bold text-slate-900">Documento emitido com sucesso</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">A factura <strong className="text-slate-800">{successInvoice}</strong> foi criada e a solicitação ficou concluída.</p>
            <div className="mt-6 flex justify-center gap-2"><Button variant="outline" onClick={printInvoice}><Printer size={14} /> Imprimir</Button><Button onClick={() => setSuccessInvoice(null)}>Concluir</Button></div>
          </div>
        </div>
      )}
    </PageShell>
  );
}