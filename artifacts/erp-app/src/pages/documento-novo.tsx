import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, CircleHelp, CreditCard, FilePenLine, List, Minus, Package, Percent, Plus, ReceiptText, Search, Trash2, Truck, WalletCards, X } from "lucide-react";
import { useLocation } from "wouter";
import {
  getGetDashboardQueryKey,
  getGetDocumentQueryOptions,
  getListDocumentsQueryKey,
  getListProductsQueryKey,
  getListSolicitacoesQueryKey,
  useAddDocumentItem,
  useCreateDocument,
  useGetSettings,
  useListClients,
  useListDocuments,
  useListPacientes,
  useListProducts,
  useListSolicitacoes,
  useUpdateProduct,
  useUpdateDocument,
  useUpdateSolicitacao,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { ANGOLA_VAT_RATE, createAgthash, INVOICE_SERIES } from "@/lib/agt";

type DocumentCode = "FT" | "FG" | "FR" | "NC" | "PF" | "OT" | "EC" | "GT" | "GR";
type DueMode = "now" | "1" | "7" | "15" | "30" | "45" | "60" | "90" | "date";
type PaymentKey = "cash" | "multicaixa" | "card" | "transfer" | "balance";
type Item = { description: string; quantity: number; unitPrice: number; discount: number; taxRate: number; productId?: number; productStock?: number; productCategory?: string | null };
type TransportPoint = { address: string; postalCode: string; place: string; country: string; date: string; time: string; plate: string };
type DocumentOption = { code: DocumentCode; label: string };
type LabExam = Record<string, unknown> | string;

function examValue(exam: LabExam, keys: string[]): number | undefined {
  if (typeof exam === "string") return undefined;
  for (const key of keys) {
    const value = exam[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function isExamService(description: string, category?: string | null) {
  return Boolean(category && /exame|an[aá]lise|laborat[oó]rio/i.test(category))
    || /exame|an[aá]lise|laborat[oó]rio/i.test(description);
}

function linkedRequestId(notes?: string | null) {
  const match = notes?.match(/Solicitação de exame #(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

const DOCUMENT_GROUPS: { title: string; options: DocumentOption[] }[] = [
  {
    title: "Venda",
    options: [
      { code: "FT", label: "Factura" },
      { code: "FG", label: "Factura Global" },
      { code: "FR", label: "Factura Recibo" },
    ],
  },
  { title: "Retificação", options: [{ code: "NC", label: "Nota de Crédito" }] },
  {
    title: "Informativo",
    options: [
      { code: "PF", label: "Factura Pró-Forma" },
      { code: "OT", label: "Orçamento" },
      { code: "EC", label: "Encomenda" },
    ],
  },
  {
    title: "Transporte",
    options: [
      { code: "GT", label: "Guia de Transporte" },
      { code: "GR", label: "Guia de Remessa" },
    ],
  },
] ;

const DOCUMENT_TYPES = DOCUMENT_GROUPS.flatMap(group => group.options);
const INVOICE_CODES = new Set<DocumentCode>(["FT", "FG", "FR"]);
const API_TYPE_BY_CODE: Record<DocumentCode, "factura" | "factura_global" | "factura_recibo" | "nota_credito" | "factura_proforma" | "orcamento" | "encomenda" | "guia_transporte" | "guia_remessa"> = {
  FT: "factura",
  FG: "factura_global",
  FR: "factura_recibo",
  NC: "nota_credito",
  PF: "factura_proforma",
  OT: "orcamento",
  EC: "encomenda",
  GT: "guia_transporte",
  GR: "guia_remessa",
};

const PAYMENT_OPTIONS: { key: PaymentKey; label: string }[] = [
  { key: "cash", label: "Dinheiro" },
  { key: "multicaixa", label: "Multicaixa" },
  { key: "card", label: "Cartão de Crédito" },
  { key: "transfer", label: "Transferência Bancária" },
  { key: "balance", label: "Compensação de Saldos C/C" },
];

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (date: string, days: number) => {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
};
const moneyNumber = (value: string) => Math.max(0, Number(value) || 0);
const dateLabel = (date: string) => date ? new Intl.DateTimeFormat("pt-PT").format(new Date(`${date}T12:00:00`)) : "Não definida";

const blankPoint: TransportPoint = { address: "", postalCode: "", place: "", country: "Angola", date: "", time: "", plate: "" };

function SettingRow({
  icon,
  label,
  summary,
  open,
  onToggle,
  children,
}: {
  icon: ReactNode;
  label: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="new-document-setting-box">
      <button type="button" className="new-document-setting-row" onClick={onToggle} aria-expanded={open}>
        {icon}
        <span>{label}</span>
        <strong>{summary}</strong>
        <span className="new-document-setting-change">{open ? "Fechar" : "Alterar"}</span>
      </button>
      {open && <div className="new-document-setting-content">{children}</div>}
    </div>
  );
}

export default function DocumentoNovo() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const formatCurrency = useFormatCurrency();
  const settings = useGetSettings();
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [labSearch, setLabSearch] = useState("");
  const [labRequestId, setLabRequestId] = useState<number | undefined>();
  const [clientId, setClientId] = useState<number | undefined>();
  const [items, setItems] = useState<Item[]>([]);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({ description: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 14 });
  const [newItemKind, setNewItemKind] = useState<"other" | "lab-exam">("other");
  const [notes, setNotes] = useState("");
  const [externalReference, setExternalReference] = useState("");
  const [documentCode, setDocumentCode] = useState<DocumentCode>("FT");
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [store, setStore] = useState("SoftmedSys (Ultracardio)");
  const [issueDate, setIssueDate] = useState(today);
  const [availabilityDate, setAvailabilityDate] = useState(today);
  const [dueMode, setDueMode] = useState<DueMode>("now");
  const [dueDate, setDueDate] = useState(today);
  const [paymentMethods, setPaymentMethods] = useState<Record<PaymentKey, boolean>>({
    cash: false,
    multicaixa: false,
    card: false,
    transfer: false,
    balance: false,
  });
  const [paymentAmounts, setPaymentAmounts] = useState<Record<PaymentKey, number>>({
    cash: 0,
    multicaixa: 0,
    card: 0,
    transfer: 0,
    balance: 0,
  });
  const [discountPercent, setDiscountPercent] = useState(0);
  const [transportEnabled, setTransportEnabled] = useState(false);
  const [transportTab, setTransportTab] = useState<"load" | "land">("load");
  const [loadpoint, setLoadpoint] = useState<TransportPoint>(blankPoint);
  const [landpoint, setLandpoint] = useState<TransportPoint>(blankPoint);
  const [includePrices, setIncludePrices] = useState(true);
  const [stockOperation, setStockOperation] = useState(false);
  const [withholdingType, setWithholdingType] = useState<"none" | "IPU">("none");
  const [withholdingRate, setWithholdingRate] = useState(15);
  const [generatedType, setGeneratedType] = useState<"FT" | "FR">("FT");
  const [trainingMode, setTrainingMode] = useState<"normal" | "tests">("normal");
  const [stockControl, setStockControl] = useState<"yes" | "no">("yes");
  const [expandedSetting, setExpandedSetting] = useState<string | null>(null);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const clients = useListClients({ search: clientSearch || undefined });
  const allClients = useListClients();
  const products = useListProducts({ search: productSearch || undefined });
  const allProducts = useListProducts();
  const patients = useListPacientes();
  const solicitacoes = useListSolicitacoes();
  const allDocuments = useListDocuments();
  const createDocument = useCreateDocument();
  const addItem = useAddDocumentItem();
  const updateDocument = useUpdateDocument();
  const updateProduct = useUpdateProduct();
  const updateSolicitacao = useUpdateSolicitacao();
  const selectedType = DOCUMENT_TYPES.find(option => option.code === documentCode) ?? DOCUMENT_TYPES[0];
  const selectedClient = (allClients.data ?? []).find(client => client.id === clientId);
  const selectedLabRequest = (solicitacoes.data ?? []).find(request => request.id === labRequestId && request.estado === "pendente");
  const selectedLabPatient = (patients.data ?? []).find(patient => patient.id === selectedLabRequest?.pacienteId);
  const issuedRequestIds = useMemo(() => new Set((allDocuments.data ?? [])
    .filter(document => document.status === "emitido" || document.status === "pago")
    .map(document => linkedRequestId(document.notes))
    .filter((requestId): requestId is number => requestId != null)), [allDocuments.data]);
  const pendingLabRequests = useMemo(() => allDocuments.isLoading || allDocuments.isError ? [] : (solicitacoes.data ?? [])
    .filter(request => request.estado === "pendente" && !issuedRequestIds.has(request.id)), [allDocuments.isError, allDocuments.isLoading, issuedRequestIds, solicitacoes.data]);
  const visibleLabRequests = pendingLabRequests.filter(request =>
    `${request.id} ${request.pacienteNome} ${request.parceiroNome ?? ""}`.toLowerCase().includes(labSearch.toLowerCase()));

  useEffect(() => {
    if (dueMode !== "date") setDueDate(addDays(issueDate, dueMode === "now" ? 0 : Number(dueMode)));
  }, [dueMode, issueDate]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("origem") === "lab") {
      document.getElementById("lab-waiting-list")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [location]);

  const subtotalBeforeDiscount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (1 - item.discount / 100), 0);
  const discountAmount = subtotalBeforeDiscount * (discountPercent / 100);
  const subtotal = subtotalBeforeDiscount - discountAmount;
  const tax = items.reduce((sum, item) => {
    const lineBase = item.quantity * item.unitPrice * (1 - item.discount / 100);
    return sum + lineBase * (1 - discountPercent / 100) * (item.taxRate / 100);
  }, 0);
  const total = subtotal + tax;
  const withholdingAmount = withholdingType === "IPU" ? total * (withholdingRate / 100) : 0;
  const payable = Math.max(0, total - withholdingAmount);
  const selectedPayments = PAYMENT_OPTIONS.filter(option => paymentMethods[option.key]);
  const paymentSummary = selectedPayments.length ? selectedPayments.map(option => option.label).join(", ") : "Não definido";
  const selectedDueSummary = dueMode === "now" ? "Hoje" : dueMode === "date" ? dateLabel(dueDate) : `A prazo de ${dueMode} dias`;
  const saving = createDocument.isPending || addItem.isPending || updateDocument.isPending || updateProduct.isPending || updateSolicitacao.isPending;

  function setSetting(key: string) {
    setExpandedSetting(current => current === key ? null : key);
  }

  function addProduct(product: { id: number; name: string; price: number; stock: number; taxRate?: number | null; category?: string | null }) {
    if (INVOICE_CODES.has(documentCode) && isExamService(product.name, product.category) && !selectedLabRequest) {
      toast({ title: "Seleccione um pedido do LAB", description: "Exames só podem ser facturados a partir da lista de espera do LAB.", variant: "destructive" });
      return;
    }
    setItems(current => [...current, {
      description: product.name,
      quantity: itemQuantity,
      unitPrice: product.price,
      discount: 0,
      taxRate: product.taxRate ?? settings.data?.taxRate ?? 14,
      productId: product.id,
      productStock: product.stock,
      productCategory: product.category,
    }]);
    setProductSearch("");
    setItemQuantity(1);
  }

  function addManualItem() {
    setNewItemKind("other");
    setNewItem({
      description: "",
      quantity: itemQuantity,
      unitPrice: 0,
      discount: 0,
      taxRate: settings.data?.taxRate ?? 14,
    });
    setNewItemDialogOpen(true);
  }

  function submitManualItem() {
    if (!newItem.description.trim()) {
      toast({ title: "Descrição obrigatória", description: "Indique a descrição do item antes de o adicionar.", variant: "destructive" });
      return;
    }
    const isLabExam = newItemKind === "lab-exam" || isExamService(newItem.description);
    if (INVOICE_CODES.has(documentCode) && isLabExam && !selectedLabRequest) {
      toast({ title: "Seleccione um pedido do LAB", description: "Exames só podem ser facturados a partir da lista de espera do LAB.", variant: "destructive" });
      return;
    }
    setItems(current => [...current, { ...newItem, description: newItem.description.trim(), productCategory: isLabExam ? "Exames" : undefined }]);
    setNewItemDialogOpen(false);
    setItemQuantity(1);
  }

  function updateItem(index: number, field: keyof Pick<Item, "description" | "quantity" | "unitPrice" | "discount">, value: string) {
    setItems(current => current.map((row, rowIndex) => rowIndex === index ? {
      ...row,
      [field]: field === "description" ? value : moneyNumber(value),
    } : row));
  }

  function updatePayment(key: PaymentKey, value: string) {
    setPaymentAmounts(current => ({ ...current, [key]: moneyNumber(value) }));
  }

  function updatePoint(point: "load" | "land", field: keyof TransportPoint, value: string) {
    if (point === "load") setLoadpoint(current => ({ ...current, [field]: value }));
    else setLandpoint(current => ({ ...current, [field]: value }));
  }

  async function selectLabRequest(requestId: number) {
    const [freshRequests, freshDocuments, freshClients, freshProducts] = await Promise.all([
      solicitacoes.refetch(),
      allDocuments.refetch(),
      allClients.refetch(),
      allProducts.refetch(),
    ]);
    if (freshRequests.isError || freshDocuments.isError || freshClients.isError || freshProducts.isError) {
      toast({ title: "Não foi possível confirmar o pedido", description: "Actualize a lista de espera e tente novamente.", variant: "destructive" });
      return;
    }
    const request = freshRequests.data?.find(item => item.id === requestId && item.estado === "pendente");
    const alreadyIssued = freshDocuments.data?.some(document =>
      (document.status === "emitido" || document.status === "pago") && linkedRequestId(document.notes) === requestId);
    if (!request || alreadyIssued) {
      toast({ title: "Pedido já actualizado", description: "A lista de espera mudou. Escolha um pedido que continue pendente.", variant: "destructive" });
      return;
    }
    const partnerName = request.parceiroNome?.trim().toLowerCase();
    const relatedClient = partnerName ? (freshClients.data ?? []).find(client => client.name.trim().toLowerCase() === partnerName) : undefined;
    setLabRequestId(request.id);
    setDocumentCode("FT");
    setClientId(relatedClient?.id);
    setClientSearch(relatedClient?.name ?? "");
    setExternalReference(`LAB-${request.id}`);
    setStockControl("no");
    setDiscountPercent(0);
    setItems(request.exames.map((rawExam, index) => {
      const exam = typeof rawExam === "string" ? rawExam : rawExam as Record<string, unknown>;
      const name = typeof exam === "string"
        ? exam
        : String(exam.nome ?? exam.name ?? exam.descricao ?? exam.description ?? `Exame ${index + 1}`);
      const product = (freshProducts.data ?? []).find(item => item.name.trim().toLowerCase() === name.trim().toLowerCase());
      return {
        description: name,
        quantity: examValue(exam, ["quantidade", "quantity"]) ?? 1,
        unitPrice: examValue(exam, ["preco", "precoUnitario", "price", "valor", "unitPrice"]) ?? product?.price ?? 0,
        discount: 0,
        taxRate: ANGOLA_VAT_RATE,
        productId: product?.id,
        productStock: product?.stock,
        productCategory: "Exames",
      };
    }));
  }

  function clearLabRequest() {
    const selectedId = labRequestId;
    setLabRequestId(undefined);
    if (selectedId != null && externalReference === `LAB-${selectedId}`) setExternalReference("");
  }

  function buildNotes() {
    const paymentLines = selectedPayments.map(option => `${option.label}: ${formatCurrency(paymentAmounts[option.key])}`);
    const transportLines = transportEnabled ? [
      `Local de carga: ${loadpoint.address || "Não definido"} · ${loadpoint.postalCode} ${loadpoint.place}`.trim(),
      `Local de descarga: ${landpoint.address || "Não definido"} · ${landpoint.postalCode} ${landpoint.place}`.trim(),
      `Viatura: ${loadpoint.plate || landpoint.plate || "Não definida"}`,
    ] : ["Transporte: Não"];
    return [
      notes.trim(),
      externalReference.trim() ? `Referência externa: ${externalReference.trim()}` : "",
      `Tipo de documento: ${documentCode} — ${selectedType.label}`,
      `Empresa: ${store}`,
      `Data de emissão: ${issueDate}`,
      `Data de disponibilização: ${availabilityDate}`,
      `Vencimento: ${dueDate}`,
      `Pagamentos: ${paymentLines.length ? paymentLines.join(" · ") : "Não definido"}`,
      `Desconto: ${discountPercent.toFixed(2)}% (${formatCurrency(discountAmount)})`,
      ...transportLines,
      `Incluir preços: ${includePrices ? "Sim" : "Não"}`,
      `Saída de stock: ${stockOperation ? "Sim" : "Não"}`,
      `Retenção: ${withholdingType === "IPU" ? `IPU ${withholdingRate}% (${formatCurrency(withholdingAmount)})` : "Não"}`,
      `Documento a gerar após pagamento: ${generatedType === "FR" ? "Factura Recibo" : "Factura"}`,
      `Modo formação: ${trainingMode === "tests" ? "Sim" : "Não"}`,
      `Movimentar stock: ${stockControl === "yes" && !selectedLabRequest ? "Sim" : "Não"}`,
      selectedLabRequest ? `Solicitação de exame #${selectedLabRequest.id}` : "",
      selectedLabRequest ? `Paciente: ${selectedLabRequest.pacienteNome}` : "",
      selectedLabRequest && selectedLabPatient?.nif ? `NIF do paciente: ${selectedLabPatient.nif}` : "",
    ].filter(Boolean).join("\n");
  }

  async function save(status: "rascunho" | "emitido") {
    const containsExam = items.some(item => isExamService(item.description, item.productCategory));
    if (INVOICE_CODES.has(documentCode) && containsExam && !selectedLabRequest) {
      toast({ title: "Pedido do LAB obrigatório", description: "Seleccione a solicitação pendente que originou estes exames.", variant: "destructive" });
      return;
    }
    if (selectedLabRequest && !["FT", "FR"].includes(documentCode)) {
      toast({ title: "Tipo de documento inválido", description: "Um pedido de exames do LAB deve ser facturado como Factura ou Factura Recibo.", variant: "destructive" });
      return;
    }
    if (selectedLabRequest && status === "rascunho") {
      toast({ title: "Emita a factura do pedido", description: "Para concluir a ligação à lista de espera, os pedidos do LAB têm de ser emitidos neste fluxo.", variant: "destructive" });
      return;
    }
    if (selectedLabRequest && items.some(item => item.unitPrice <= 0)) {
      toast({ title: "Existem exames sem preço", description: "Preencha os valores dos exames antes de emitir a factura.", variant: "destructive" });
      return;
    }
    if (selectedLabRequest && items.length === 0) {
      toast({ title: "A factura não tem exames", description: "A solicitação seleccionada precisa de pelo menos um exame para ser facturada.", variant: "destructive" });
      return;
    }
    if (selectedLabRequest && !settings.data?.nif?.trim()) {
      toast({ title: "NIF do emitente não configurado", description: "Configure o NIF da empresa antes de emitir a factura do LAB.", variant: "destructive" });
      return;
    }
    if (selectedLabRequest) {
      const [freshRequests, freshDocuments] = await Promise.all([solicitacoes.refetch(), allDocuments.refetch()]);
      const latestRequest = freshRequests.data?.find(request => request.id === selectedLabRequest.id && request.estado === "pendente");
      const alreadyIssued = freshDocuments.data?.some(document =>
        (document.status === "emitido" || document.status === "pago") && linkedRequestId(document.notes) === selectedLabRequest.id);
      if (freshRequests.isError || freshDocuments.isError || !latestRequest || latestRequest.updatedAt !== selectedLabRequest.updatedAt || alreadyIssued) {
        toast({ title: "Pedido do LAB alterado", description: "A solicitação já não está pendente ou foi actualizada. Volte a seleccioná-la na lista.", variant: "destructive" });
        return;
      }
    }
    const stockRequirements = new Map<number, { quantity: number; stock: number }>();
    for (const item of items) {
      if (!item.productId || item.productStock == null) continue;
      const previous = stockRequirements.get(item.productId);
      stockRequirements.set(item.productId, {
        quantity: (previous?.quantity ?? 0) + item.quantity,
        stock: item.productStock,
      });
    }
    if (status === "emitido" && stockControl === "yes" && !selectedLabRequest) {
      const insufficient = [...stockRequirements.entries()].find(([, requirement]) => requirement.quantity > requirement.stock);
      if (insufficient) {
        toast({
          title: "Stock insuficiente",
          description: `A quantidade pedida (${insufficient[1].quantity}) excede o stock disponível (${insufficient[1].stock}).`,
          variant: "destructive",
        });
        return;
      }
    }
    let labRequestUpdateFailed = false;
    try {
      const document = await createDocument.mutateAsync({
        data: {
          type: API_TYPE_BY_CODE[documentCode],
          clientId,
          notes: buildNotes(),
          discount: discountPercent,
          dueDate,
        },
      });
      for (const item of items) {
        await addItem.mutateAsync({
          id: document.id,
          data: {
            description: item.description.trim() || "Item sem descrição",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate,
            productId: item.productId,
          },
        });
      }
      if (status === "emitido" && stockControl === "yes" && !selectedLabRequest) {
        for (const [productId, requirement] of stockRequirements) {
          await updateProduct.mutateAsync({ id: productId, data: { stock: requirement.stock - requirement.quantity } });
        }
      }
      if (status === "emitido" && selectedLabRequest) {
        const persistedDocument = await queryClient.fetchQuery({
          ...getGetDocumentQueryOptions(document.id),
          staleTime: 0,
        });
        const invoiceNumber = persistedDocument.number || document.number || `DOC-${String(document.id).padStart(4, "0")}`;
        const persistedTotal = Number(persistedDocument.total);
        const sellerNif = settings.data?.nif?.trim();
        const hash = await createAgthash(`${sellerNif}|${issueDate}|${INVOICE_SERIES}|${invoiceNumber}|${persistedTotal.toFixed(2)}`);
        await updateDocument.mutateAsync({ id: document.id, data: { notes: `${buildNotes()}\nHash AGT: ${hash}` } });
      }
      await updateDocument.mutateAsync({ id: document.id, data: { status } });
      if (status === "emitido" && selectedLabRequest) {
        try {
          await updateSolicitacao.mutateAsync({ id: selectedLabRequest.id, data: { estado: "concluida" } });
        } catch {
          labRequestUpdateFailed = true;
          toast({ title: "Factura emitida; pedido ainda pendente", description: `O documento está ligado à solicitação #${selectedLabRequest.id}, mas não foi possível actualizar o estado do pedido.`, variant: "destructive" });
        }
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListSolicitacoesQueryKey() }),
      ]);
      if (!labRequestUpdateFailed) {
        toast({
          title: status === "emitido" ? `${selectedType.label} emitida` : "Rascunho guardado",
          description: selectedLabRequest ? `Factura ligada à solicitação #${selectedLabRequest.id}; pedido marcado como concluído.` : undefined,
        });
      }
      setLocation(`/documentos/${document.id}`);
    } catch {
      toast({ title: "Erro ao criar documento", description: "Verifique os dados e tente novamente.", variant: "destructive" });
    }
  }

  const renderTransportPoint = (point: "load" | "land", value: TransportPoint) => (
    <div className="new-document-transport-fields">
      <label>Local de {point === "load" ? "Carga" : "Descarga"}<Input value={value.address} onChange={event => updatePoint(point, "address", event.target.value)} placeholder={point === "load" ? "Morada do Local de Carga" : "Rua, Avenida, Praça"} /></label>
      <div className="new-document-transport-grid">
        <label>Código Postal<Input value={value.postalCode} onChange={event => updatePoint(point, "postalCode", event.target.value)} placeholder="4200-100" /></label>
        <label>Localidade<Input value={value.place} onChange={event => updatePoint(point, "place", event.target.value)} placeholder="Luanda" /></label>
        <label>País<Input value={value.country} onChange={event => updatePoint(point, "country", event.target.value)} placeholder="Angola" /></label>
      </div>
      <div className="new-document-transport-grid">
        <label>Data<Input type="date" value={value.date} onChange={event => updatePoint(point, "date", event.target.value)} /></label>
        <label>Hora<Input value={value.time} onChange={event => updatePoint(point, "time", event.target.value)} placeholder="HH:MM" maxLength={5} /></label>
        <label>Matrícula<Input value={value.plate} onChange={event => updatePoint(point, "plate", event.target.value)} placeholder="00-AA-00 (Opcional)" /></label>
      </div>
    </div>
  );

  return (
    <div className="new-document-page">
      <div className="new-document-breadcrumb">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/documentos")}><ChevronLeft size={16} /> Documentos</Button>
        <span>/</span><span>Novo Documento</span>
      </div>
      <div className="new-document-layout">
        <main className="new-document-main">
          <section className="new-document-card new-document-type-card">
            <div className="new-document-card-heading">
              <button type="button" className="new-document-type-icon" onClick={() => setTypeDialogOpen(true)} aria-label="Alterar tipo de documento">{documentCode}</button>
              <div><h1>{selectedType.label}</h1><p>Documento de venda</p></div>
              <Button variant="ghost" size="sm" className="new-document-alter" onClick={() => setTypeDialogOpen(true)}><FilePenLine size={15} /> Alterar</Button>
            </div>
            <div className="new-document-field">
              <label>Selecione o Cliente <CircleHelp size={13} /></label>
              <div className="relative">
                <Search size={15} className="new-document-search-icon" />
                <Input className="pl-9" placeholder="Consumidor Final" value={clientSearch} onChange={event => { setClientSearch(event.target.value); if (!event.target.value) setClientId(undefined); }} />
                {clientId && <button type="button" className="new-document-clear-client" onClick={() => { setClientId(undefined); setClientSearch(""); }} aria-label="Limpar cliente"><X size={14} /></button>}
              </div>
              {clientSearch && !clientId && clients.data && clients.data.length > 0 && (
                <div className="new-document-results">{clients.data.map(client => <button type="button" key={client.id} onClick={() => { setClientId(client.id); setClientSearch(client.name); }}>{client.name}{client.nif ? <span>NIF: {client.nif}</span> : null}</button>)}</div>
              )}
              {selectedClient && <p className="new-document-selected-client">Cliente seleccionado: {selectedClient.name}{selectedClient.nif ? ` · NIF ${selectedClient.nif}` : ""}</p>}
            </div>
          </section>

          <section id="lab-waiting-list" className="new-document-card">
            <div className="new-document-section-heading">
              <div><h2>Exames do LAB</h2><p>As facturas de exames têm de estar ligadas a uma solicitação pendente.</p></div>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">{allDocuments.isLoading || solicitacoes.isLoading ? "…" : `${pendingLabRequests.length} pendente(s)`}</span>
            </div>
            <div className="space-y-3 p-4">
              {selectedLabRequest && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
                  <div><strong>Pedido #{selectedLabRequest.id} ligado</strong><span className="ml-2">{selectedLabRequest.pacienteNome}{selectedLabPatient?.nif ? ` · NIF ${selectedLabPatient.nif}` : ""}</span></div>
                  <Button type="button" size="sm" variant="outline" onClick={clearLabRequest}>Remover ligação</Button>
                </div>
              )}
              <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))]" htmlFor="lab-request-search">Lista de espera do LAB</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <Input id="lab-request-search" className="pl-9" placeholder="Pesquisar pedido, paciente ou parceiro..." value={labSearch} onChange={event => setLabSearch(event.target.value)} />
              </div>
              {solicitacoes.isLoading || allDocuments.isLoading ? <p className="py-3 text-sm text-[hsl(var(--muted-foreground))]">A carregar pedidos pendentes...</p>
                : solicitacoes.isError || allDocuments.isError ? <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><span>Não foi possível confirmar a lista de espera e as facturas já emitidas.</span><Button type="button" size="sm" variant="outline" onClick={() => void Promise.all([solicitacoes.refetch(), allDocuments.refetch()])}>Tentar novamente</Button></div>
                  : visibleLabRequests.length === 0 ? <p className="py-3 text-sm text-[hsl(var(--muted-foreground))]">{pendingLabRequests.length ? "Nenhum pedido corresponde à pesquisa." : "Não há pedidos de exames pendentes de facturação."}</p>
                    : <div className="max-h-64 overflow-y-auto rounded-lg border border-[hsl(var(--border))]">
                      {visibleLabRequests.map(request => (
                        <button type="button" key={request.id} aria-pressed={request.id === labRequestId} onClick={() => selectLabRequest(request.id)} className={`flex w-full items-center gap-3 border-b border-[hsl(var(--border))] px-3 py-3 text-left last:border-b-0 hover:bg-[hsl(var(--accent))] ${request.id === labRequestId ? "bg-emerald-50" : ""}`}>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-sm font-semibold text-[hsl(var(--primary))]">#{request.id}</span>
                          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{request.pacienteNome}</span><span className="mt-1 block truncate text-xs text-[hsl(var(--muted-foreground))]">{request.parceiroNome || "Atendimento directo"} · {request.exames.length} exame(s)</span></span>
                          {request.urgente && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800">Urgente</span>}
                        </button>
                      ))}
                    </div>}
            </div>
          </section>

          <section className="new-document-card new-document-items-card">
            <div className="new-document-section-heading"><div><h2>Itens</h2><p>Produtos e Serviços</p></div><span className="new-document-items-label"><List size={16} /> Itens</span></div>
            {items.length === 0 ? <div className="new-document-empty-items"><div className="new-document-empty-icon"><List size={32} /></div><p>Não existem itens associados ao documento.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr><th>Descrição</th><th>Qtd.</th><th>Preço</th><th>Desc.</th><th>IVA</th><th>Total</th><th /></tr></thead><tbody>{items.map((item, index) => <tr key={index}><td><Input value={item.description} onChange={event => updateItem(index, "description", event.target.value)} placeholder="Descrição do item" /></td><td><Input type="number" min="0.001" step="0.001" value={item.quantity} onChange={event => updateItem(index, "quantity", event.target.value)} /></td><td><Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={event => updateItem(index, "unitPrice", event.target.value)} /></td><td><Input type="number" min="0" max="100" step="0.01" value={item.discount} onChange={event => updateItem(index, "discount", event.target.value)} /></td><td className="text-right">{item.taxRate}%</td><td className="text-right font-semibold">{formatCurrency(item.quantity * item.unitPrice * (1 - item.discount / 100))}</td><td><button type="button" className="text-destructive" onClick={() => setItems(current => current.filter((_, rowIndex) => rowIndex !== index))}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>}
            <div className="new-document-items-footer">
              <div className="new-document-quantity-control"><button type="button" onClick={() => setItemQuantity(current => Math.max(1, current - 1))} aria-label="Diminuir quantidade"><Minus size={14} /></button><span>{itemQuantity}</span><button type="button" onClick={() => setItemQuantity(current => current + 1)} aria-label="Aumentar quantidade"><Plus size={14} /></button></div>
              <div className="new-document-product-search relative"><Search size={14} /><Input placeholder="Pesquisar e adicionar ao documento" value={productSearch} onChange={event => setProductSearch(event.target.value)} />{productSearch && products.data && products.data.length > 0 && <div className="new-document-results new-document-product-results">{products.data.map(product => <button type="button" key={product.id} onClick={() => addProduct(product)}>{product.name}<span>{formatCurrency(product.price)}</span></button>)}</div>}</div>
              <button type="button" className="new-document-create-item" onClick={addManualItem}>+&nbsp; Criar Novo Item</button>
            </div>
          </section>

          <section className="new-document-card new-document-notes-card">
            <div className="new-document-section-heading"><div><h2>Observações</h2><p>Referência Externa</p></div></div>
            <div className="new-document-notes-fields">
              <label>Observações <span>?</span><textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={1250} placeholder="Observações, notas ou comentários a adicionar ao documento" /></label>
              <label>Referência Externa <span>?</span><Input value={externalReference} onChange={event => setExternalReference(event.target.value)} maxLength={20} placeholder="Referência Externa" /></label>
            </div>
          </section>
        </main>

        <aside className="new-document-settings">
          <div className="new-document-settings-heading"><h2>Definições do Documento</h2></div>
          <div className="new-document-setting-list">
            <SettingRow icon={<Package size={15} />} label="Empresa" summary={store} open={expandedSetting === "store"} onToggle={() => setSetting("store")}>
              <div className="new-document-choice-list">{["SoftmedSys (Ultracardio)", "Farmácia Ultracardio (Ultracardio)"].map(option => <label key={option}><input type="radio" name="store" checked={store === option} onChange={() => setStore(option)} />{option}</label>)}</div>
            </SettingRow>
            <SettingRow icon={<CalendarDays size={15} />} label="Data de Emissão" summary={dateLabel(issueDate)} open={expandedSetting === "issueDate"} onToggle={() => setSetting("issueDate")}>
              <Input type="date" value={issueDate} onChange={event => setIssueDate(event.target.value)} />
            </SettingRow>
            <SettingRow icon={<CalendarDays size={15} />} label="Data de Disponibilização" summary={dateLabel(availabilityDate)} open={expandedSetting === "availabilityDate"} onToggle={() => setSetting("availabilityDate")}>
              <Input type="date" value={availabilityDate} onChange={event => setAvailabilityDate(event.target.value)} />
            </SettingRow>
            <SettingRow icon={<CalendarDays size={15} />} label="Vencimento" summary={selectedDueSummary} open={expandedSetting === "dueDate"} onToggle={() => setSetting("dueDate")}>
              <div className="new-document-radio-list">{[["now", "Hoje"], ["1", "A prazo de 1 Dia"], ["7", "A prazo de 7 Dias"], ["15", "A prazo de 15 Dias"], ["30", "A prazo de 30 Dias"], ["45", "A prazo de 45 Dias"], ["60", "A prazo de 60 Dias"], ["90", "A prazo de 90 Dias"], ["date", "Data específica"]].map(([value, label]) => <label key={value}><input type="radio" name="due-mode" checked={dueMode === value} onChange={() => setDueMode(value as DueMode)} />{label}</label>)}</div>{dueMode === "date" && <Input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} />}
            </SettingRow>
            <SettingRow icon={<CreditCard size={15} />} label="Pagamentos" summary={paymentSummary} open={expandedSetting === "payments"} onToggle={() => setSetting("payments")}>
              <div className="new-document-payment-list">{PAYMENT_OPTIONS.map(option => <label key={option.key}><span><input type="checkbox" checked={paymentMethods[option.key]} onChange={event => setPaymentMethods(current => ({ ...current, [option.key]: event.target.checked }))} />{option.label}</span>{paymentMethods[option.key] && <Input type="number" min="0" step="0.01" value={paymentAmounts[option.key]} onChange={event => updatePayment(option.key, event.target.value)} placeholder="Montante em Kz" />}</label>)}</div>
            </SettingRow>
            <SettingRow icon={<Percent size={15} />} label="Desconto" summary={`${discountPercent.toFixed(2)}% · ${formatCurrency(discountAmount)}`} open={expandedSetting === "discount"} onToggle={() => setSetting("discount")}>
              <div className="new-document-discount-grid"><label>%<Input type="number" min="0" max="100" step="0.01" value={discountPercent} onChange={event => setDiscountPercent(Math.min(100, moneyNumber(event.target.value)))} /></label><label>Kz<Input type="number" min="0" step="0.01" value={discountAmount.toFixed(2)} onChange={event => setDiscountPercent(subtotalBeforeDiscount ? Math.min(100, moneyNumber(event.target.value) / subtotalBeforeDiscount * 100) : 0)} /></label></div>
            </SettingRow>
            <SettingRow icon={<Truck size={15} />} label="Transporte" summary={transportEnabled ? "Sim" : "Não"} open={expandedSetting === "transport"} onToggle={() => setSetting("transport")}>
              <div className="new-document-radio-list new-document-radio-inline"><label><input type="radio" name="transport-mode" checked={!transportEnabled} onChange={() => setTransportEnabled(false)} />Não</label><label><input type="radio" name="transport-mode" checked={transportEnabled} onChange={() => setTransportEnabled(true)} />Sim</label></div>
              {transportEnabled && <><div className="new-document-transport-tabs"><button type="button" className={transportTab === "load" ? "active" : ""} onClick={() => setTransportTab("load")}>Local de Carga</button><button type="button" className={transportTab === "land" ? "active" : ""} onClick={() => setTransportTab("land")}>Local de Descarga</button></div>{transportTab === "load" ? renderTransportPoint("load", loadpoint) : renderTransportPoint("land", landpoint)}<div className="new-document-checkbox-list"><label><input type="checkbox" checked={includePrices} onChange={event => setIncludePrices(event.target.checked)} />Incluir preços</label><label><input type="checkbox" checked={stockOperation} onChange={event => setStockOperation(event.target.checked)} />Saída de stock</label></div></>}
            </SettingRow>
            <SettingRow icon={<WalletCards size={15} />} label="Retenção IPU" summary={withholdingType === "IPU" ? `${withholdingRate}% · ${formatCurrency(withholdingAmount)}` : "Não"} open={expandedSetting === "withholding"} onToggle={() => setSetting("withholding")}>
              <div className="new-document-radio-list new-document-radio-inline"><label><input type="radio" name="withholding" checked={withholdingType === "none"} onChange={() => setWithholdingType("none")} />Não</label><label><input type="radio" name="withholding" checked={withholdingType === "IPU"} onChange={() => setWithholdingType("IPU")} />15% - Prédios Arrendados</label></div>
              {withholdingType === "IPU" && <Input type="number" min="0" max="100" step="0.01" value={withholdingRate} onChange={event => setWithholdingRate(Math.min(100, moneyNumber(event.target.value)))} />}
            </SettingRow>
            <SettingRow icon={<ReceiptText size={15} />} label="Tipo de Documento a Gerar" summary={generatedType === "FR" ? "Factura Recibo" : "Factura"} open={expandedSetting === "generatedType"} onToggle={() => setSetting("generatedType")}>
              <p className="new-document-setting-note">Quando o documento é pago, qual o tipo de documento a gerar?</p><div className="new-document-radio-list"><label><input type="radio" name="generated-type" checked={generatedType === "FT"} onChange={() => setGeneratedType("FT")} />Factura</label><label><input type="radio" name="generated-type" checked={generatedType === "FR"} onChange={() => setGeneratedType("FR")} />Factura Recibo</label></div>
            </SettingRow>
            <SettingRow icon={<ReceiptText size={15} />} label="Modo Formação" summary={trainingMode === "tests" ? "Sim" : "Não"} open={expandedSetting === "training"} onToggle={() => setSetting("training")}>
              <p className="new-document-setting-note">Utilize o Modo Formação para experimentar a emissão de documentos. Estes não têm validade fiscal.</p><div className="new-document-radio-list new-document-radio-inline"><label><input type="radio" name="training" checked={trainingMode === "normal"} onChange={() => setTrainingMode("normal")} />Não</label><label><input type="radio" name="training" checked={trainingMode === "tests"} onChange={() => setTrainingMode("tests")} />Sim</label></div>
            </SettingRow>
            <SettingRow icon={<Package size={15} />} label="Movimentar Stock" summary={stockControl === "yes" ? "Sim" : "Não"} open={expandedSetting === "stock"} onToggle={() => setSetting("stock")}>
              <p className="new-document-setting-note">Pretende que o stock seja atualizado após a emissão do documento?</p><div className="new-document-radio-list new-document-radio-inline"><label><input type="radio" name="stock-control" checked={stockControl === "yes"} onChange={() => setStockControl("yes")} />Sim</label><label><input type="radio" name="stock-control" checked={stockControl === "no"} onChange={() => setStockControl("no")} />Não</label></div>
            </SettingRow>
          </div>
          <div className="new-document-totals">
            <div><span>Subtotal</span><strong>{formatCurrency(subtotalBeforeDiscount)}</strong></div>
            <div><span>Desconto</span><strong>- {formatCurrency(discountAmount)}</strong></div>
            <div><span>IVA</span><strong>{formatCurrency(tax)}</strong></div>
            {withholdingAmount > 0 && <div><span>Retenção IPU</span><strong>- {formatCurrency(withholdingAmount)}</strong></div>}
            <div className="new-document-total-final"><span>Total a pagar</span><strong>{formatCurrency(payable)}</strong></div>
          </div>
          <div className="new-document-submit-area">
            <div className="new-document-create-actions">
              <Button className="new-document-create-main" disabled={saving} onClick={() => void save("emitido")}><ReceiptText size={16} /> {saving ? "A criar..." : "Criar"} <span>{selectedType.label}</span></Button>
              <Button className="new-document-create-toggle" disabled={saving} aria-label="Mais opções de criação" onClick={() => setCreateMenuOpen(current => !current)}><ChevronDown size={15} /></Button>
              {createMenuOpen && <div className="new-document-create-menu"><button type="button" onClick={() => { setCreateMenuOpen(false); void save("emitido"); }}>Emitir {selectedType.label}</button><button type="button" onClick={() => { setCreateMenuOpen(false); void save("rascunho"); }}>Guardar rascunho</button></div>}
            </div>
            <Button variant="ghost" disabled={saving} onClick={() => void save("rascunho")}>Guardar rascunho</Button>
          </div>
        </aside>
      </div>

      <Dialog open={newItemDialogOpen} onOpenChange={setNewItemDialogOpen}>
        <DialogContent className="new-document-item-dialog">
          <DialogHeader><DialogTitle>Criar novo item</DialogTitle><DialogDescription>Adicione um serviço ou produto que não esteja no catálogo.</DialogDescription></DialogHeader>
          <div className="new-document-item-form">
            <label>Tipo do item<select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newItemKind} onChange={event => setNewItemKind(event.target.value as "other" | "lab-exam")}><option value="other">Outro produto ou serviço</option><option value="lab-exam">Exame do LAB</option></select></label>
            {newItemKind === "lab-exam" && !selectedLabRequest && <p className="text-xs text-amber-700">Seleccione um pedido pendente na lista do LAB antes de adicionar este exame.</p>}
            <label>Descrição<Input autoFocus value={newItem.description} onChange={event => setNewItem(current => ({ ...current, description: event.target.value }))} placeholder="Ex.: Consulta de Cardiologia" /></label>
            <div className="new-document-item-form-grid">
              <label>Quantidade<Input type="number" min="0.001" step="0.001" value={newItem.quantity} onChange={event => setNewItem(current => ({ ...current, quantity: moneyNumber(event.target.value) }))} /></label>
              <label>Preço unitário<Input type="number" min="0" step="0.01" value={newItem.unitPrice} onChange={event => setNewItem(current => ({ ...current, unitPrice: moneyNumber(event.target.value) }))} /></label>
            </div>
            <div className="new-document-item-form-grid">
              <label>Desconto (%)<Input type="number" min="0" max="100" step="0.01" value={newItem.discount} onChange={event => setNewItem(current => ({ ...current, discount: Math.min(100, moneyNumber(event.target.value)) }))} /></label>
              <label>IVA (%)<Input type="number" min="0" max="100" step="0.01" value={newItem.taxRate} onChange={event => setNewItem(current => ({ ...current, taxRate: Math.min(100, moneyNumber(event.target.value)) }))} /></label>
            </div>
            <Button onClick={submitManualItem}>Adicionar item</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="new-document-type-dialog">
          <DialogHeader><DialogTitle>Alterar tipo de documento</DialogTitle><DialogDescription>Escolha o tipo de documento a criar, tal como no Vendus.</DialogDescription></DialogHeader>
          <div className="new-document-type-groups">{DOCUMENT_GROUPS.map(group => <div key={group.title}><h3>{group.title}</h3>{group.options.map(option => <label key={option.code} className={documentCode === option.code ? "selected" : ""}><input type="radio" name="document-type" checked={documentCode === option.code} onChange={() => { setDocumentCode(option.code); setTypeDialogOpen(false); }} /><span className={`new-document-code new-document-code-${option.code}`}>{option.code}</span><span>{option.label}</span></label>)}</div>)}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}