import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import {
  GetSettingsResponse,
  UpdateSettingsBody,
  UpdateSettingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/settings", async (req, res): Promise<void> => {
  let [settings] = await db.select().from(settingsTable).limit(1);
  if (!settings) {
    [settings] = await db
      .insert(settingsTable)
      .values({ companyName: "Minha Empresa", nif: "000000000", currency: "AOA", country: "Angola", taxRate: "14" })
      .returning();
  }
  res.json(GetSettingsResponse.parse({
    ...settings,
    taxRate: Number(settings.taxRate),
    updatedAt: settings.updatedAt.toISOString(),
  }));
});

router.patch("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let [existing] = await db.select().from(settingsTable).limit(1);
  if (!existing) {
    [existing] = await db.insert(settingsTable).values({}).returning();
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.companyName != null) updateData.companyName = parsed.data.companyName;
  if (parsed.data.nif != null) updateData.nif = parsed.data.nif;
  if (parsed.data.currency != null) updateData.currency = parsed.data.currency;
  if (parsed.data.country != null) updateData.country = parsed.data.country;
  if (parsed.data.email != null) updateData.email = parsed.data.email;
  if (parsed.data.phone != null) updateData.phone = parsed.data.phone;
  if (parsed.data.address != null) updateData.address = parsed.data.address;
  if (parsed.data.logoUrl != null) updateData.logoUrl = parsed.data.logoUrl;
  if (parsed.data.taxRate != null) updateData.taxRate = String(parsed.data.taxRate);

  const [updated] = await db
    .update(settingsTable)
    .set(updateData)
    .where(eq(settingsTable.id, existing.id))
    .returning();

  res.json(UpdateSettingsResponse.parse({
    ...updated,
    taxRate: Number(updated.taxRate),
    updatedAt: updated.updatedAt.toISOString(),
  }));
});

export default router;
