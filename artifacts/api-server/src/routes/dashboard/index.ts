import { Router, type IRouter } from "express";
import { db, documentsTable, clientsTable, productsTable, documentItemsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { GetDashboardResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard", async (req, res): Promise<void> => {
  const [allDocs, allClients, allProducts, allItems] = await Promise.all([
    db.select().from(documentsTable).orderBy(desc(documentsTable.createdAt)),
    db.select().from(clientsTable),
    db.select().from(productsTable),
    db.select().from(documentItemsTable),
  ]);

  const paidDocs = allDocs.filter(d => d.status === "pago" || d.status === "emitido");
  const totalRevenue = paidDocs.reduce((s, d) => s + Number(d.total), 0);
  const pendingAmount = allDocs
    .filter(d => d.status === "emitido")
    .reduce((s, d) => s + Number(d.total), 0);

  const recentDocuments = allDocs.slice(0, 5).map(d => ({
    ...d,
    subtotal: Number(d.subtotal),
    tax: Number(d.tax),
    discount: Number(d.discount),
    total: Number(d.total),
    dueDate: d.dueDate?.toISOString() ?? null,
    issuedAt: d.issuedAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  const monthlyMap: Record<string, { total: number; count: number }> = {};
  for (const doc of paidDocs) {
    const m = doc.createdAt.toISOString().slice(0, 7);
    if (!monthlyMap[m]) monthlyMap[m] = { total: 0, count: 0 };
    monthlyMap[m].total += Number(doc.total);
    monthlyMap[m].count += 1;
  }

  // Build last 6 months, filling zeros for months without data
  const PT_MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const now = new Date();
  const last6Months: { month: string; label: string; total: number; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${PT_MONTHS[d.getMonth()]} ${d.getFullYear() !== now.getFullYear() ? String(d.getFullYear()).slice(2) : ""}`.trim();
    const data = monthlyMap[key] ?? { total: 0, count: 0 };
    last6Months.push({ month: label, label, total: data.total, count: data.count });
  }
  const monthlySales = last6Months.map(({ month, total, count }) => ({ month, total, count }));

  const productRevMap: Record<number, { name: string; totalSold: number; revenue: number }> = {};
  for (const item of allItems) {
    if (!item.productId) continue;
    const prod = allProducts.find(p => p.id === item.productId);
    if (!prod) continue;
    if (!productRevMap[item.productId]) {
      productRevMap[item.productId] = { name: prod.name, totalSold: 0, revenue: 0 };
    }
    productRevMap[item.productId].totalSold += Number(item.quantity);
    productRevMap[item.productId].revenue += Number(item.total);
  }
  const topProducts = Object.entries(productRevMap)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(([productId, data]) => ({ productId: parseInt(productId), ...data }));

  res.json(GetDashboardResponse.parse({
    totalRevenue,
    totalClients: allClients.length,
    totalProducts: allProducts.length,
    totalDocuments: allDocs.length,
    pendingAmount,
    recentDocuments,
    monthlySales,
    topProducts,
  }));
});

export default router;
