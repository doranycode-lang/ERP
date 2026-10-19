import { createHash } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { eq, sql } from "drizzle-orm";
import { db, appStateTable } from "@workspace/db";
import { CommitDocumentBody, CommitSaleBody, SaveAppStateBody } from "@workspace/api-zod";
import { isOfficialDocument, isValidIssuerNif, validateAppStateFiscalWrites } from "../lib/fiscalGuard.js";

const router = Router();

function requireUserId(req: Request, res: Response) {
  const auth = getAuth(req);
  // Clerk organizations are the shared workspace boundary. In installations
  // without organizations, keep the signed-in user as the workspace owner.
  const userId = auth?.orgId ?? auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return userId;
}

router.get("/app-state", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const [record] = await db
    .select()
    .from(appStateTable)
    .where(eq(appStateTable.userId, userId))
    .limit(1);

  res.json({ data: record?.data ?? null, updatedAt: record?.updatedAt?.toISOString() ?? null });
});

router.put("/app-state", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = SaveAppStateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const expectedUpdatedAt = parsed.data.expectedUpdatedAt ?? null;
  const result = await db.transaction(async (tx) => {
    const lockedRows = await tx.execute(
      sql`SELECT data, updated_at FROM app_state WHERE user_id = ${userId} FOR UPDATE`,
    );
    const lockedRow = lockedRows.rows[0] as { data?: JsonObject; updated_at?: Date } | undefined;

    if (expectedUpdatedAt) {
      const currentTime = lockedRow?.updated_at ? new Date(lockedRow.updated_at).getTime() : NaN;
      if (currentTime !== new Date(expectedUpdatedAt).getTime()) return null;
    } else if (lockedRow) {
      return null;
    }

    const violation = validateAppStateFiscalWrites(lockedRow?.data ?? null, parsed.data.data);
    if (violation) return { violation };

    if (lockedRow) {
      const [updated] = await tx
        .update(appStateTable)
        .set({ data: parsed.data.data, updatedAt: new Date() })
        .where(
          sql`${appStateTable.userId} = ${userId} AND ${appStateTable.updatedAt} = ${new Date(expectedUpdatedAt!)}`,
        )
        .returning();
      return updated ? { record: updated } : null;
    }

    const [inserted] = await tx
      .insert(appStateTable)
      .values({ userId, data: parsed.data.data })
      .onConflictDoNothing({ target: appStateTable.userId })
      .returning();
    return inserted ? { record: inserted } : null;
  });

  if (!result) {
    res.status(409).json({
      code: "STALE_STATE",
      error: "O estado local está desactualizado; a alteração não foi guardada.",
    });
    return;
  }

  if ("violation" in result && result.violation) {
    res.status(result.violation.status).json({
      code: result.violation.code,
      error: result.violation.error,
    });
    return;
  }

  res.json({ data: result.record.data, updatedAt: result.record.updatedAt.toISOString() });
});

type JsonObject = Record<string, any>;

const STOCK_SALE_TYPES = new Set(["factura", "factura-recibo", "factura-global"]);
const DOCUMENT_CODES: Record<string, string> = {
  factura: "FT",
  "factura-recibo": "FR",
  "factura-global": "FG",
  "pro-forma": "PF",
  "nota-credito": "NC",
  recibo: "RC",
};

function isStockProduct(product: JsonObject): boolean {
  const unit = String(product.unidadeMedida || "").toLowerCase();
  return unit !== "serv" && unit !== "exame";
}

function parseDateValue(value?: string): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const parts = value.split("/");
  const parsed = parts.length === 3
    ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
    : new Date(value);
  return Number.isNaN(parsed.getTime()) ? Number.POSITIVE_INFINITY : parsed.getTime();
}

function formatDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}

function generateHash(document: JsonObject, nif: string, previousHash: string): string {
  const raw = [
    nif,
    document.clienteNif || "999999999",
    document.data || "",
    Number(document.total || 0).toFixed(2),
    document.tipoDocumento || "",
    document.serie || "",
    document.numero || "",
    previousHash,
  ].join(";");
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

function maxDocumentId(invoices: JsonObject[]): number {
  return invoices.reduce((max, invoice) => Math.max(max, Number(invoice.id) || 0), 0);
}

function findProduct(snapshot: JsonObject, line: JsonObject): JsonObject | undefined {
  const products = Array.isArray(snapshot.produtos) ? snapshot.produtos : [];
  return line.produtoId
    ? products.find((product: JsonObject) => Number(product.id) === Number(line.produtoId))
    : products.find((product: JsonObject) => String(product.nome).toLowerCase() === String(line.descricao).toLowerCase());
}

function allocateStock(product: JsonObject, quantity: number, requestedLot?: string): { lots: JsonObject[]; allocatedLots: string[] } | null {
  const sourceLots = Array.isArray(product.lotes) ? product.lotes : [];
  if (sourceLots.length === 0) {
    return quantity <= Number(product.stock || 0)
      ? { lots: [], allocatedLots: [] }
      : null;
  }

  const eligible = sourceLots
    .filter((lot: JsonObject) => !requestedLot || lot.numeroLote === requestedLot)
    .sort((left: JsonObject, right: JsonObject) => parseDateValue(left.dataValidade) - parseDateValue(right.dataValidade));
  const available = Math.min(
    Number(product.stock || 0),
    eligible.reduce((sum, lot) => sum + Number(lot.quantidade || 0), 0),
  );
  if (available < quantity) return null;

  let remaining = quantity;
  const allocations = new Map<string, number>();
  const allocatedLots: string[] = [];
  for (const lot of eligible) {
    if (remaining <= 0) break;
    const take = Math.min(Number(lot.quantidade || 0), remaining);
    if (take > 0) {
      allocations.set(String(lot.id), take);
      allocatedLots.push(String(lot.numeroLote));
      remaining -= take;
    }
  }

  return {
    allocatedLots,
    lots: sourceLots.map((lot: JsonObject) => ({
      ...lot,
      quantidade: Math.max(0, Number(lot.quantidade || 0) - (allocations.get(String(lot.id)) || 0)),
    })),
  };
}

function creditLineKey(line: JsonObject): string {
  return line.produtoId
    ? `id:${line.produtoId}`
    : `desc:${String(line.descricao || "").trim().toLowerCase()}`;
}

function validateCreditNote(invoices: JsonObject[], draft: JsonObject, existingDocumentId?: number): string | null {
  if (!draft.documentoOrigem) return "A Nota de Crédito deve indicar o documento de origem.";
  if (!String(draft.motivoAnulacaoOuCredito || "").trim()) {
    return "A Nota de Crédito deve indicar o motivo da correcção.";
  }

  const origin = invoices.find((invoice) => invoice.numero === draft.documentoOrigem);
  if (
    !origin ||
    origin.tipoDocumento === "pro-forma" ||
    origin.tipoDocumento === "nota-credito" ||
    origin.estado === "rascunho" ||
    origin.estado === "anulada"
  ) {
    return "O documento de origem da Nota de Crédito não é válido.";
  }

  const originQuantities = new Map<string, number>();
  for (const line of Array.isArray(origin.linhas) ? origin.linhas as JsonObject[] : []) {
    const key = creditLineKey(line);
    originQuantities.set(key, (originQuantities.get(key) || 0) + Math.abs(Number(line.quantidade || 0)));
  }

  const alreadyCredited = new Map<string, number>();
  for (const invoice of invoices) {
    if (
      Number(invoice.id) === existingDocumentId ||
      invoice.tipoDocumento !== "nota-credito" ||
      invoice.documentoOrigem !== origin.numero ||
      invoice.estado === "anulada" ||
      invoice.estado === "rascunho"
    ) continue;
    for (const line of Array.isArray(invoice.linhas) ? invoice.linhas as JsonObject[] : []) {
      const key = creditLineKey(line);
      alreadyCredited.set(key, (alreadyCredited.get(key) || 0) + Math.abs(Number(line.quantidade || 0)));
    }
  }

  const requested = new Map<string, number>();
  for (const line of Array.isArray(draft.linhas) ? draft.linhas as JsonObject[] : []) {
    const key = creditLineKey(line);
    if (!originQuantities.has(key)) {
      return `O artigo "${String(line.descricao || "")}" não existe no documento de origem.`;
    }
    requested.set(key, (requested.get(key) || 0) + Math.abs(Number(line.quantidade || 0)));
  }

  for (const [key, quantity] of requested) {
    if ((alreadyCredited.get(key) || 0) + quantity > (originQuantities.get(key) || 0)) {
      return "A quantidade creditada ultrapassa a quantidade facturada no documento de origem.";
    }
  }
  return null;
}

function commitSnapshot(
  snapshot: JsonObject,
  input: JsonObject,
  existingDocumentId?: number,
): { data: JsonObject; fatura: JsonObject } | { conflict: string; code?: string; status?: 400 | 409 } {
  const invoices = Array.isArray(snapshot.faturas) ? snapshot.faturas : [];
  const products = Array.isArray(snapshot.produtos) ? snapshot.produtos : [];
  const movements = Array.isArray(snapshot.movimentos) ? snapshot.movimentos : [];
  const config = snapshot.config && typeof snapshot.config === "object" ? snapshot.config : {};
  const existingDraft = existingDocumentId === undefined
    ? undefined
    : invoices.find((invoice: JsonObject) => Number(invoice.id) === existingDocumentId);
  if (existingDocumentId !== undefined && (!existingDraft || existingDraft.estado !== "rascunho")) {
    return {
      code: "DRAFT_NOT_FOUND",
      conflict: "O rascunho já não existe ou deixou de poder ser emitido.",
      status: 409,
    };
  }
  const draft = existingDraft ? { ...existingDraft, ...input } : input;
  const type = String(draft.tipoDocumento || "");
  const state = String(draft.estado || "");
  if (!type || !Array.isArray(draft.linhas) || draft.linhas.length === 0) {
    return { code: "INVALID_DOCUMENT", conflict: "O documento é inválido.", status: 400 };
  }
  if (!isOfficialDocument({ tipoDocumento: type, estado: state })) {
    return {
      code: "OFFICIAL_DOCUMENT_REQUIRED",
      conflict: "Esta operação só pode emitir documentos oficiais; rascunhos e Pró-Forma não têm valor fiscal.",
      status: 400,
    };
  }
  if (!["emitida", "paga"].includes(state)) {
    return {
      code: "INVALID_DOCUMENT_STATE",
      conflict: "O estado inicial do documento oficial deve ser emitida ou paga.",
      status: 400,
    };
  }
  if (!isValidIssuerNif(config.nif)) {
    return {
      code: "ISSUER_NIF_REQUIRED",
      conflict: "Configure um NIF do emitente válido antes de emitir um documento oficial.",
      status: 400,
    };
  }
  const customerNif = String(draft.clienteNif || "").replace(/[\s.-]/g, "").toUpperCase();
  if (
    customerNif &&
    customerNif !== "999999999" &&
    !(/^[0-9]{9,14}$/.test(customerNif) || /^[0-9]{9,12}[A-Z]{2,3}$/.test(customerNif))
  ) {
    return { code: "INVALID_CUSTOMER_NIF", conflict: "O NIF do adquirente não tem um formato válido.", status: 400 };
  }
  if (draft.linhas.some((line: JsonObject) => {
    const quantity = Number(line.quantidade);
    return !Number.isFinite(quantity) || quantity <= 0;
  })) {
    return { code: "INVALID_QUANTITY", conflict: "O documento contém uma quantidade inválida.", status: 400 };
  }
  if (type === "nota-credito") {
    const creditNoteError = validateCreditNote(invoices, draft, existingDocumentId);
    if (creditNoteError) {
      return { code: "INVALID_CREDIT_NOTE", conflict: creditNoteError, status: 400 };
    }
  }

  const now = new Date();
  const series = String(draft.serie || config.serie || "A");
  const code = DOCUMENT_CODES[type] || "FT";
  const fiscalInvoices = invoices.filter((invoice: JsonObject) =>
    Number(invoice.id) !== existingDocumentId &&
    invoice.tipoDocumento === type &&
    invoice.serie === series &&
    invoice.estado !== "rascunho"
  );
  const sequence = fiscalInvoices.reduce((max, invoice) => {
    const match = String(invoice.numero || "").match(/\/(\d+)$/);
    return Math.max(max, match ? Number(match[1]) : 0);
  }, 0) + 1;
  const numero = `${code} ${series}/${now.getFullYear()}/${String(sequence).padStart(3, "0")}`;
  const previousOfficial = invoices
    .filter((invoice: JsonObject) =>
      isOfficialDocument(invoice) &&
      Number(invoice.id) !== existingDocumentId &&
      invoice.codigoHash
    )
    .sort((left, right) => Number(right.id || 0) - Number(left.id || 0))[0];
  const hashAnterior = previousOfficial?.codigoHash || "0";
  const productUpdates = new Map<number, JsonObject>();
  const movementDrafts: JsonObject[] = [];
  if (STOCK_SALE_TYPES.has(type) && state !== "rascunho") {
    const requested = new Map<number, number>();
    for (const line of draft.linhas) {
      const product = findProduct(snapshot, line);
      if (product && isStockProduct(product)) {
        requested.set(Number(product.id), (requested.get(Number(product.id)) || 0) + Number(line.quantidade || 0));
      }
    }

    for (const [productId, quantity] of requested) {
      const product = products.find((candidate: JsonObject) => Number(candidate.id) === productId);
      if (!product || quantity <= 0) continue;
      const allocation = allocateStock(product, quantity, undefined);
      if (!allocation) {
        return {
          code: "STOCK_CONFLICT",
          conflict: `Conflito de stock: "${product.nome}" já não tem quantidade suficiente para esta venda. Actualize o carrinho e tente novamente.`,
          status: 409,
        };
      }
      const remainingLot = allocation.lots.find((lot) => Number(lot.quantidade || 0) > 0);
      productUpdates.set(productId, {
        ...product,
        stock: Number(product.stock || 0) - quantity,
        ...(allocation.lots.length > 0
          ? {
              lotes: allocation.lots,
              loteAtual: remainingLot?.numeroLote || product.loteAtual,
              dataValidade: remainingLot?.dataValidade || product.dataValidade,
            }
          : {}),
      });
      const line = draft.linhas.find((candidate: JsonObject) =>
        Number(findProduct(snapshot, candidate)?.id) === productId
      ) || {};
      movementDrafts.push({
        produtoId: productId,
        produtoNome: product.nome,
        produtoCodigo: product.codigo,
        tipo: "saida",
        quantidade: quantity,
        stockAnterior: Number(product.stock || 0),
        stockAtual: Number(product.stock || 0) - quantity,
        lote: allocation.allocatedLots.join(", ") || line.lote || product.loteAtual,
        dataValidade: product.dataValidade,
        motivo: line.lote
          ? `Saída do lote ${line.lote} na emissão do documento`
          : "Saída FEFO automática na emissão do documento",
        usuario: draft.emitidoPor || "Sistema de Facturação",
        valorUnitario: Number(line.precoUnitario || 0),
        valorTotal: quantity * Number(line.precoUnitario || 0),
      });
    }
  }

  if (type === "nota-credito") {
    for (const line of draft.linhas) {
      const originalProduct = findProduct(snapshot, line);
      if (!originalProduct || !isStockProduct(originalProduct)) continue;
      const productId = Number(originalProduct.id);
      const product = productUpdates.get(productId) || originalProduct;
      const quantity = Math.abs(Number(line.quantidade));
      const lote = String(line.lote || `DEV-${numero.replace(/\s+/g, "-")}`);
      const sourceLots = Array.isArray(product.lotes) ? product.lotes : [];
      const lotExists = sourceLots.some((lot: JsonObject) => lot.numeroLote === lote);
      const lotes = sourceLots.length === 0
        ? sourceLots
        : lotExists
          ? sourceLots.map((item: JsonObject) =>
              item.numeroLote === lote
                ? { ...item, quantidade: Number(item.quantidade || 0) + quantity }
                : item
            )
          : [{
              id: `lot-${now.getTime()}-${movementDrafts.length}`,
              numeroLote: lote,
              dataValidade: line.dataValidade || "31/12/2099",
              quantidade: quantity,
              precoCusto: product.precoCusto,
            }, ...sourceLots];
      productUpdates.set(productId, {
        ...product,
        stock: Number(product.stock || 0) + quantity,
        ...(sourceLots.length > 0 ? { lotes, loteAtual: lote } : { loteAtual: line.lote || product.loteAtual }),
        dataValidade: line.dataValidade || product.dataValidade,
      });
      movementDrafts.push({
        produtoId: productId,
        produtoNome: product.nome,
        produtoCodigo: product.codigo,
        tipo: "devolucao",
        quantidade: quantity,
        stockAnterior: Number(product.stock || 0),
        stockAtual: Number(product.stock || 0) + quantity,
        lote: line.lote || product.loteAtual,
        dataValidade: line.dataValidade || product.dataValidade,
        motivo: `Reposição por Nota de Crédito ${numero}`,
        usuario: draft.emitidoPor || "Sistema de Facturação",
        valorUnitario: Number(line.precoUnitario || 0),
        valorTotal: quantity * Number(line.precoUnitario || 0),
      });
    }
  }

  const fatura = {
    ...draft,
    id: maxDocumentId(invoices) + 1,
    numero,
    serie: series,
    horaOperacao: draft.horaOperacao || formatTime(now),
    hashAnterior,
    codigoHash: generateHash({ ...draft, numero, serie: series }, String(config.nif), hashAnterior),
  };

  const updatedProducts = products.map((product: JsonObject) => productUpdates.get(Number(product.id)) || product);
  const updatedMovements = movementDrafts.map((movement, index) => ({
    ...movement,
    id: `mov-${now.getTime()}-${index}`,
    data: draft.data || formatDate(now),
    hora: fatura.horaOperacao,
    referenciaDocumento: numero,
  }));
  const invoicesWithoutPromotedDraft = existingDocumentId === undefined
    ? invoices
    : invoices.filter((invoice: JsonObject) => Number(invoice.id) !== existingDocumentId);
  return {
    fatura,
    data: {
      ...snapshot,
      faturas: [fatura, ...invoicesWithoutPromotedDraft],
      produtos: updatedProducts,
      movimentos: [...updatedMovements, ...movements],
    },
  };
}

type CommitRouteResult =
  | { error: string; status: number; code: string; data?: JsonObject; updatedAt?: string }
  | { record: { data: unknown; updatedAt: Date }; fatura: JsonObject };

async function commitForUser(
  userId: string,
  document: JsonObject,
  existingDocumentId?: number,
): Promise<CommitRouteResult> {
  return db.transaction(async (tx): Promise<CommitRouteResult> => {
    const lockedRows = await tx.execute(
      sql`SELECT data, updated_at FROM app_state WHERE user_id = ${userId} FOR UPDATE`,
    );
    const lockedRow = lockedRows.rows[0] as { data?: JsonObject; updated_at?: Date } | undefined;
    if (!lockedRow?.data || typeof lockedRow.data !== "object") {
      return {
        code: "STATE_NOT_SYNCED",
        error: "O estado partilhado ainda não está sincronizado neste terminal.",
        status: 409,
      };
    }

    const committed = commitSnapshot(lockedRow.data, document, existingDocumentId);
    if ("conflict" in committed) {
      return {
        code: committed.code || "DOCUMENT_CONFLICT",
        error: committed.conflict,
        status: committed.status || 409,
        data: lockedRow.data,
        updatedAt: lockedRow.updated_at?.toISOString(),
      };
    }

    const [record] = await tx
      .update(appStateTable)
      .set({ data: committed.data, updatedAt: new Date() })
      .where(eq(appStateTable.userId, userId))
      .returning();
    if (!record) {
      return {
        code: "STATE_WRITE_FAILED",
        error: "O documento foi validado, mas o estado partilhado não foi actualizado.",
        status: 409,
      };
    }
    return { record, fatura: committed.fatura };
  });
}

function sendCommitResponse(res: Response, result: CommitRouteResult): void {
  if ("error" in result) {
    res.status(result.status).json({
      code: result.code,
      error: result.error,
      ...(result.data ? { data: result.data, updatedAt: result.updatedAt } : {}),
    });
    return;
  }
  res.json({
    fatura: result.fatura,
    data: result.record.data,
    updatedAt: result.record.updatedAt.toISOString(),
  });
}

router.post("/sales/commit", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = CommitSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  sendCommitResponse(
    res,
    await commitForUser(userId, parsed.data.document as JsonObject),
  );
});

router.post("/documents/commit", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = CommitDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  sendCommitResponse(
    res,
    await commitForUser(
      userId,
      parsed.data.document as JsonObject,
      parsed.data.existingDocumentId,
    ),
  );
});

export default router;