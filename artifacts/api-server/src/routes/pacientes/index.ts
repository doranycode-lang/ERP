import { Router, type IRouter } from "express";
import { eq, ilike, desc } from "drizzle-orm";
import { db, pacientesTable } from "@workspace/db";
import {
  ListPacientesResponse,
  CreatePacienteBody,
  GetPacienteParams,
  GetPacienteResponse,
  UpdatePacienteParams,
  UpdatePacienteBody,
  UpdatePacienteResponse,
  DeletePacienteParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapPaciente(p: typeof pacientesTable.$inferSelect) {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/pacientes", async (req, res): Promise<void> => {
  const { search } = req.query as { search?: string };
  const pacientes = await db
    .select()
    .from(pacientesTable)
    .where(search ? ilike(pacientesTable.nome, `%${search}%`) : undefined)
    .orderBy(desc(pacientesTable.createdAt));
  res.json(ListPacientesResponse.parse(pacientes.map(mapPaciente)));
});

router.post("/pacientes", async (req, res): Promise<void> => {
  const parsed = CreatePacienteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [paciente] = await db.insert(pacientesTable).values(parsed.data).returning();
  res.status(201).json(GetPacienteResponse.parse(mapPaciente(paciente)));
});

router.get("/pacientes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPacienteParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [paciente] = await db.select().from(pacientesTable).where(eq(pacientesTable.id, params.data.id));
  if (!paciente) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  res.json(GetPacienteResponse.parse(mapPaciente(paciente)));
});

router.patch("/pacientes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePacienteParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdatePacienteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [paciente] = await db
    .update(pacientesTable)
    .set(parsed.data)
    .where(eq(pacientesTable.id, params.data.id))
    .returning();

  if (!paciente) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  res.json(UpdatePacienteResponse.parse(mapPaciente(paciente)));
});

router.delete("/pacientes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeletePacienteParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [paciente] = await db.delete(pacientesTable).where(eq(pacientesTable.id, params.data.id)).returning();
  if (!paciente) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  res.sendStatus(204);
});

export default router;
