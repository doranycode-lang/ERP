import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  funcionariosTable,
  parceirosTable,
  solicitacoesTable,
} from "@workspace/db";
import {
  ListFuncionariosResponse,
  CreateFuncionarioBody,
  GetFuncionarioParams,
  GetFuncionarioResponse,
  UpdateFuncionarioParams,
  UpdateFuncionarioBody,
  UpdateFuncionarioResponse,
  DeleteFuncionarioParams,
  ListParceirosResponse,
  CreateParceiroBody,
  GetParceiroParams,
  GetParceiroResponse,
  UpdateParceiroParams,
  UpdateParceiroBody,
  UpdateParceiroResponse,
  DeleteParceiroParams,
  ListSolicitacoesResponse,
  CreateSolicitacaoBody,
  GetSolicitacaoParams,
  GetSolicitacaoResponse,
  UpdateSolicitacaoParams,
  UpdateSolicitacaoBody,
  UpdateSolicitacaoResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapFuncionario(row: typeof funcionariosTable.$inferSelect) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

function mapParceiro(row: typeof parceirosTable.$inferSelect) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

function mapSolicitacao(row: typeof solicitacoesTable.$inferSelect) {
  return { ...row, exames: row.exames as unknown[], createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

router.get("/funcionarios", async (_req, res): Promise<void> => {
  const rows = await db.select().from(funcionariosTable).orderBy(desc(funcionariosTable.createdAt));
  res.json(ListFuncionariosResponse.parse(rows.map(mapFuncionario)));
});

router.post("/funcionarios", async (req, res): Promise<void> => {
  const parsed = CreateFuncionarioBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(funcionariosTable).values(parsed.data as any).returning();
  res.status(201).json(GetFuncionarioResponse.parse(mapFuncionario(row)));
});

router.get("/funcionarios/:id", async (req, res): Promise<void> => {
  const params = GetFuncionarioParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [row] = await db.select().from(funcionariosTable).where(eq(funcionariosTable.id, params.data.id));
  if (!row) { res.status(404).json({ error: "Funcionário não encontrado" }); return; }
  res.json(GetFuncionarioResponse.parse(mapFuncionario(row)));
});

router.patch("/funcionarios/:id", async (req, res): Promise<void> => {
  const params = UpdateFuncionarioParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateFuncionarioBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(funcionariosTable).set(parsed.data as any).where(eq(funcionariosTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Funcionário não encontrado" }); return; }
  res.json(UpdateFuncionarioResponse.parse(mapFuncionario(row)));
});

router.delete("/funcionarios/:id", async (req, res): Promise<void> => {
  const params = DeleteFuncionarioParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [row] = await db.delete(funcionariosTable).where(eq(funcionariosTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Funcionário não encontrado" }); return; }
  res.sendStatus(204);
});

router.get("/parceiros", async (_req, res): Promise<void> => {
  const rows = await db.select().from(parceirosTable).orderBy(desc(parceirosTable.createdAt));
  res.json(ListParceirosResponse.parse(rows.map(mapParceiro)));
});

router.post("/parceiros", async (req, res): Promise<void> => {
  const parsed = CreateParceiroBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(parceirosTable).values(parsed.data as any).returning();
  res.status(201).json(GetParceiroResponse.parse(mapParceiro(row)));
});

router.get("/parceiros/:id", async (req, res): Promise<void> => {
  const params = GetParceiroParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [row] = await db.select().from(parceirosTable).where(eq(parceirosTable.id, params.data.id));
  if (!row) { res.status(404).json({ error: "Parceiro não encontrado" }); return; }
  res.json(GetParceiroResponse.parse(mapParceiro(row)));
});

router.patch("/parceiros/:id", async (req, res): Promise<void> => {
  const params = UpdateParceiroParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateParceiroBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(parceirosTable).set(parsed.data as any).where(eq(parceirosTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Parceiro não encontrado" }); return; }
  res.json(UpdateParceiroResponse.parse(mapParceiro(row)));
});

router.delete("/parceiros/:id", async (req, res): Promise<void> => {
  const params = DeleteParceiroParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [row] = await db.delete(parceirosTable).where(eq(parceirosTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Parceiro não encontrado" }); return; }
  res.sendStatus(204);
});

router.get("/solicitacoes", async (_req, res): Promise<void> => {
  const rows = await db.select().from(solicitacoesTable).orderBy(desc(solicitacoesTable.createdAt));
  res.json(ListSolicitacoesResponse.parse(rows.map(mapSolicitacao)));
});

router.post("/solicitacoes", async (req, res): Promise<void> => {
  const parsed = CreateSolicitacaoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(solicitacoesTable).values(parsed.data as any).returning();
  res.status(201).json(GetSolicitacaoResponse.parse(mapSolicitacao(row)));
});

router.get("/solicitacoes/:id", async (req, res): Promise<void> => {
  const params = GetSolicitacaoParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [row] = await db.select().from(solicitacoesTable).where(eq(solicitacoesTable.id, params.data.id));
  if (!row) { res.status(404).json({ error: "Solicitação não encontrada" }); return; }
  res.json(GetSolicitacaoResponse.parse(mapSolicitacao(row)));
});

router.patch("/solicitacoes/:id", async (req, res): Promise<void> => {
  const params = UpdateSolicitacaoParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateSolicitacaoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(solicitacoesTable).set(parsed.data as any).where(eq(solicitacoesTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Solicitação não encontrada" }); return; }
  res.json(UpdateSolicitacaoResponse.parse(mapSolicitacao(row)));
});

export default router;