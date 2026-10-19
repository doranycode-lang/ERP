import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, examesCustomTable } from "@workspace/db";
import {
  ListExamesCustomResponse,
  CreateExameCustomBody,
  GetExameCustomParams,
  GetExameCustomResponse,
  UpdateExameCustomParams,
  UpdateExameCustomBody,
  UpdateExameCustomResponse,
  DeleteExameCustomParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapExame(e: typeof examesCustomTable.$inferSelect) {
  return {
    ...e,
    parametros: e.parametros as unknown[],
    createdAt: e.createdAt.toISOString(),
  };
}

router.get("/exames-custom", async (_req, res): Promise<void> => {
  const rows = await db.select().from(examesCustomTable).orderBy(desc(examesCustomTable.createdAt));
  res.json(ListExamesCustomResponse.parse(rows.map(mapExame)));
});

router.post("/exames-custom", async (req, res): Promise<void> => {
  const parsed = CreateExameCustomBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [exame] = await db.insert(examesCustomTable).values(parsed.data as any).returning();
  res.status(201).json(GetExameCustomResponse.parse(mapExame(exame)));
});

router.get("/exames-custom/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetExameCustomParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [exame] = await db.select().from(examesCustomTable).where(eq(examesCustomTable.id, params.data.id));
  if (!exame) { res.status(404).json({ error: "Exame não encontrado" }); return; }
  res.json(GetExameCustomResponse.parse(mapExame(exame)));
});

router.patch("/exames-custom/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateExameCustomParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateExameCustomBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [exame] = await db
    .update(examesCustomTable)
    .set(parsed.data as any)
    .where(eq(examesCustomTable.id, params.data.id))
    .returning();

  if (!exame) { res.status(404).json({ error: "Exame não encontrado" }); return; }
  res.json(UpdateExameCustomResponse.parse(mapExame(exame)));
});

router.delete("/exames-custom/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteExameCustomParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [exame] = await db.delete(examesCustomTable).where(eq(examesCustomTable.id, params.data.id)).returning();
  if (!exame) { res.status(404).json({ error: "Exame não encontrado" }); return; }
  res.sendStatus(204);
});

export default router;
