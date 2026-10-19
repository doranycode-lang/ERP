import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, documentsTable, documentItemsTable, clientsTable } from "@workspace/db";
import {
  ListDocumentsResponse,
  CreateDocumentBody,
  GetDocumentParams,
  GetDocumentResponse,
  UpdateDocumentParams,
  UpdateDocumentBody,
  UpdateDocumentResponse,
  DeleteDocumentParams,
  AddDocumentItemParams,
  AddDocumentItemBody,
  UpdateDocumentItemParams,
  UpdateDocumentItemBody,
  UpdateDocumentItemResponse,
  DeleteDocumentItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapDoc(d: typeof documentsTable.$inferSelect) {
  return {
    ...d,
    subtotal: Number(d.subtotal),
    tax: Number(d.tax),
    discount: Number(d.discount),
    total: Number(d.total),
    dueDate: d.dueDate?.toISOString() ?? null,
    issuedAt: d.issuedAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

function mapItem(i: typeof documentItemsTable.$inferSelect) {
  return {
    ...i,
    quantity: Number(i.quantity),
    unitPrice: Number(i.unitPrice),
    discount: Number(i.discount),
    taxRate: Number(i.taxRate),
    total: Number(i.total),
  };
}

async function recalcDocument(docId: number) {
  const items = await db.select().from(documentItemsTable).where(eq(documentItemsTable.documentId, docId));
  const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice) * (1 - Number(i.discount) / 100), 0);
  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, docId));
  const discountPct = doc ? Number(doc.discount) : 0;
  const afterDiscount = subtotal * (1 - discountPct / 100);
  const taxSum = items.reduce((s, i) => {
    const lineBase = Number(i.quantity) * Number(i.unitPrice) * (1 - Number(i.discount) / 100);
    return s + lineBase * (1 - discountPct / 100) * (Number(i.taxRate) / 100);
  }, 0);
  const total = afterDiscount + taxSum;
  await db.update(documentsTable).set({
    subtotal: String(subtotal.toFixed(2)),
    tax: String(taxSum.toFixed(2)),
    total: String(total.toFixed(2)),
  }).where(eq(documentsTable.id, docId));
}

router.get("/documents", async (req, res): Promise<void> => {
  const { type, status } = req.query as Record<string, string | undefined>;
  const clientIdRaw = req.query.clientId;
  const conditions = [];
  if (type) conditions.push(eq(documentsTable.type, type));
  if (status) conditions.push(eq(documentsTable.status, status));
  if (clientIdRaw) {
    const cid = parseInt(String(clientIdRaw), 10);
    if (!isNaN(cid)) conditions.push(eq(documentsTable.clientId, cid));
  }

  const docs = await db
    .select()
    .from(documentsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(documentsTable.createdAt);

  res.json(ListDocumentsResponse.parse(docs.map(mapDoc)));
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { clientId, discount, dueDate, ...rest } = parsed.data;

  let clientName: string | null = null;
  if (clientId) {
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, clientId));
    clientName = client?.name ?? null;
  }

  const doc = await db.transaction(async tx => {
    const [draft] = await tx.insert(documentsTable).values({
      ...rest,
      number: null,
      clientId: clientId ?? null,
      clientName,
      discount: discount != null ? String(discount) : "0",
      dueDate: dueDate ? new Date(dueDate) : null,
    }).returning();
    const [numbered] = await tx.update(documentsTable)
      .set({ number: `DOC-${String(draft.id).padStart(4, "0")}` })
      .where(eq(documentsTable.id, draft.id))
      .returning();
    return numbered;
  });

  res.status(201).json(GetDocumentResponse.parse({ ...mapDoc(doc), items: [] }));
});

router.get("/documents/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetDocumentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.id));
  if (!doc) { res.status(404).json({ error: "Documento não encontrado" }); return; }

  const items = await db.select().from(documentItemsTable).where(eq(documentItemsTable.documentId, doc.id));
  res.json(GetDocumentResponse.parse({ ...mapDoc(doc), items: items.map(mapItem) }));
});

router.patch("/documents/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateDocumentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateDocumentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existingDocument] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.id));
  if (!existingDocument) { res.status(404).json({ error: "Documento não encontrado" }); return; }
  const requestedKeys = Object.keys(parsed.data);
  const isAllowedDraftUpdate = existingDocument.status === "rascunho"
    && (parsed.data.status === undefined || parsed.data.status === "emitido" || parsed.data.status === "cancelado");
  const isPaymentOrCancellation = existingDocument.status === "emitido"
    && requestedKeys.length === 1
    && requestedKeys[0] === "status"
    && (parsed.data.status === "pago" || parsed.data.status === "cancelado");
  if (!isAllowedDraftUpdate && !isPaymentOrCancellation) {
    res.status(409).json({ error: "Documentos emitidos não podem ser alterados. Apenas marcar como pago ou cancelado é permitido." });
    return;
  }

  const { clientId, discount, dueDate, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };

  if (clientId != null) {
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, clientId));
    updateData.clientId = clientId;
    updateData.clientName = client?.name ?? null;
  }
  if (discount != null) updateData.discount = String(discount);
  if (dueDate != null) updateData.dueDate = new Date(dueDate);
  if (parsed.data.status === "emitido") updateData.issuedAt = new Date();

  const [doc] = await db.update(documentsTable).set(updateData).where(eq(documentsTable.id, params.data.id)).returning();
  if (!doc) { res.status(404).json({ error: "Documento não encontrado" }); return; }

  await recalcDocument(doc.id);
  const [updated] = await db.select().from(documentsTable).where(eq(documentsTable.id, doc.id));
  res.json(UpdateDocumentResponse.parse(mapDoc(updated!)));
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteDocumentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [existingDocument] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.id));
  if (!existingDocument) { res.status(404).json({ error: "Documento não encontrado" }); return; }
  if (existingDocument.status !== "rascunho") {
    res.status(409).json({ error: "Documentos emitidos, pagos ou cancelados não podem ser eliminados." });
    return;
  }
  await db.delete(documentItemsTable).where(eq(documentItemsTable.documentId, params.data.id));
  const [doc] = await db.delete(documentsTable).where(eq(documentsTable.id, params.data.id)).returning();
  if (!doc) { res.status(404).json({ error: "Documento não encontrado" }); return; }
  res.sendStatus(204);
});

router.post("/documents/:id/items", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AddDocumentItemParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.id));
  if (!doc) { res.status(404).json({ error: "Documento não encontrado" }); return; }
  if (doc.status !== "rascunho") {
    res.status(409).json({ error: "Só é possível adicionar itens a documentos em rascunho." });
    return;
  }

  const parsed = AddDocumentItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { quantity, unitPrice, discount = 0, taxRate = 0, productId, description } = parsed.data;
  const lineTotal = quantity * unitPrice * (1 - discount / 100);

  const [item] = await db.insert(documentItemsTable).values({
    documentId: params.data.id,
    productId: productId ?? null,
    description,
    quantity: String(quantity),
    unitPrice: String(unitPrice),
    discount: String(discount),
    taxRate: String(taxRate),
    total: String(lineTotal.toFixed(2)),
  }).returning();

  await recalcDocument(params.data.id);
  res.status(201).json(mapItem(item));
});

router.patch("/documents/:id/items/:itemId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawItemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const params = UpdateDocumentItemParams.safeParse({ id: parseInt(rawId, 10), itemId: parseInt(rawItemId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateDocumentItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existing] = await db.select().from(documentItemsTable).where(
    and(eq(documentItemsTable.id, params.data.itemId), eq(documentItemsTable.documentId, params.data.id))
  );
  if (!existing) { res.status(404).json({ error: "Item não encontrado" }); return; }
  const [parentDocument] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.id));
  if (!parentDocument) { res.status(404).json({ error: "Documento não encontrado" }); return; }
  if (parentDocument.status !== "rascunho") {
    res.status(409).json({ error: "Só é possível alterar itens de documentos em rascunho." });
    return;
  }

  const quantity = parsed.data.quantity ?? Number(existing.quantity);
  const unitPrice = parsed.data.unitPrice ?? Number(existing.unitPrice);
  const discount = parsed.data.discount ?? Number(existing.discount);
  const taxRate = parsed.data.taxRate ?? Number(existing.taxRate);
  const lineTotal = quantity * unitPrice * (1 - discount / 100);

  const updateData: Record<string, string> = {
    quantity: String(quantity),
    unitPrice: String(unitPrice),
    discount: String(discount),
    taxRate: String(taxRate),
    total: String(lineTotal.toFixed(2)),
  };
  if (parsed.data.description != null) updateData.description = parsed.data.description;

  const [item] = await db.update(documentItemsTable).set(updateData).where(eq(documentItemsTable.id, params.data.itemId)).returning();
  await recalcDocument(params.data.id);
  res.json(UpdateDocumentItemResponse.parse(mapItem(item)));
});

router.delete("/documents/:id/items/:itemId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawItemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const params = DeleteDocumentItemParams.safeParse({ id: parseInt(rawId, 10), itemId: parseInt(rawItemId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [parentDocument] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.id));
  if (!parentDocument) { res.status(404).json({ error: "Documento não encontrado" }); return; }
  if (parentDocument.status !== "rascunho") {
    res.status(409).json({ error: "Só é possível remover itens de documentos em rascunho." });
    return;
  }
  const [item] = await db.delete(documentItemsTable).where(
    and(eq(documentItemsTable.id, params.data.itemId), eq(documentItemsTable.documentId, params.data.id))
  ).returning();
  if (!item) { res.status(404).json({ error: "Item não encontrado" }); return; }

  await recalcDocument(params.data.id);
  res.sendStatus(204);
});

export default router;
