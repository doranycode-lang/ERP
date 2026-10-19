import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, resultadosTable } from "@workspace/db";
import {
  ListResultadosResponse,
  CreateResultadoBody,
  GetResultadoParams,
  GetResultadoResponse,
  UpdateResultadoParams,
  UpdateResultadoBody,
  UpdateResultadoResponse,
  DeleteResultadoParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapResultado(r: typeof resultadosTable.$inferSelect) {
  return {
    ...r,
    parametros: r.parametros as unknown[],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get("/resultados", async (req, res): Promise<void> => {
  const { pacienteId } = req.query as { pacienteId?: string };
  const rows = await db
    .select()
    .from(resultadosTable)
    .where(pacienteId ? eq(resultadosTable.pacienteId, parseInt(pacienteId, 10)) : undefined)
    .orderBy(desc(resultadosTable.createdAt));
  res.json(ListResultadosResponse.parse(rows.map(mapResultado)));
});

router.post("/resultados", async (req, res): Promise<void> => {
  const parsed = CreateResultadoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [resultado] = await db.insert(resultadosTable).values(parsed.data as any).returning();
  res.status(201).json(GetResultadoResponse.parse(mapResultado(resultado)));
});

router.get("/resultados/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetResultadoParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [resultado] = await db.select().from(resultadosTable).where(eq(resultadosTable.id, params.data.id));
  if (!resultado) { res.status(404).json({ error: "Resultado não encontrado" }); return; }
  res.json(GetResultadoResponse.parse(mapResultado(resultado)));
});

router.patch("/resultados/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateResultadoParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateResultadoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [resultado] = await db
    .update(resultadosTable)
    .set(parsed.data as any)
    .where(eq(resultadosTable.id, params.data.id))
    .returning();

  if (!resultado) { res.status(404).json({ error: "Resultado não encontrado" }); return; }
  res.json(UpdateResultadoResponse.parse(mapResultado(resultado)));
});

router.delete("/resultados/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteResultadoParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [resultado] = await db.delete(resultadosTable).where(eq(resultadosTable.id, params.data.id)).returning();
  if (!resultado) { res.status(404).json({ error: "Resultado não encontrado" }); return; }
  res.sendStatus(204);
});

export default router;
