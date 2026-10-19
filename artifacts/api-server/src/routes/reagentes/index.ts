import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, reagentesTable } from "@workspace/db";
import {
  ListReagentesResponse,
  CreateReagenteBody,
  GetReagenteParams,
  GetReagenteResponse,
  UpdateReagenteParams,
  UpdateReagenteBody,
  UpdateReagenteResponse,
  DeleteReagenteParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapReagente(r: typeof reagentesTable.$inferSelect) {
  return {
    ...r,
    precoUnitario: parseFloat(r.precoUnitario as unknown as string) || 0,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get("/reagentes", async (_req, res): Promise<void> => {
  const rows = await db.select().from(reagentesTable).orderBy(desc(reagentesTable.createdAt));
  res.json(ListReagentesResponse.parse(rows.map(mapReagente)));
});

router.post("/reagentes", async (req, res): Promise<void> => {
  const parsed = CreateReagenteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [reagente] = await db.insert(reagentesTable).values(parsed.data as any).returning();
  res.status(201).json(GetReagenteResponse.parse(mapReagente(reagente)));
});

router.get("/reagentes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetReagenteParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [reagente] = await db.select().from(reagentesTable).where(eq(reagentesTable.id, params.data.id));
  if (!reagente) { res.status(404).json({ error: "Reagente não encontrado" }); return; }
  res.json(GetReagenteResponse.parse(mapReagente(reagente)));
});

router.patch("/reagentes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateReagenteParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateReagenteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [reagente] = await db
    .update(reagentesTable)
    .set(parsed.data as any)
    .where(eq(reagentesTable.id, params.data.id))
    .returning();

  if (!reagente) { res.status(404).json({ error: "Reagente não encontrado" }); return; }
  res.json(UpdateReagenteResponse.parse(mapReagente(reagente)));
});

router.delete("/reagentes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteReagenteParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [reagente] = await db.delete(reagentesTable).where(eq(reagentesTable.id, params.data.id)).returning();
  if (!reagente) { res.status(404).json({ error: "Reagente não encontrado" }); return; }
  res.sendStatus(204);
});

export default router;
