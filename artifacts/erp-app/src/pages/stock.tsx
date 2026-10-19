import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQueries } from "@tanstack/react-query";
import { getGetDocumentQueryOptions, useListDocuments, useListProducts } from "@workspace/api-client-react";
import { Search, Boxes, ArrowDownToLine, FileText, Package, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { EmptyState, LoadingRows, MetricCard, PageShell, QueryError, Section, formatDate } from "./lab-ui";

function StockNav({ current }: { current: "analise" | "movimentos" }) {
  return <div className="flex flex-wrap gap-2">
    <Link href="/produtos/stock"><Button size="sm" variant={current === "analise" ? "default" : "outline"}><Boxes size={14} className="mr-2" /> Análise de Stock</Button></Link>
    <Link href="/produtos/movimentos"><Button size="sm" variant={current === "movimentos" ? "default" : "outline"}><ArrowRightLeft size={14} className="mr-2" /> Movimentos de Stock</Button></Link>
    <Link href="/produtos"><Button size="sm" variant="outline"><Package size={14} className="mr-2" /> Produtos</Button></Link>
  </div>;
}

export function StockAnalysis() {
  const products = useListProducts();
  const [search, setSearch] = useState("");
  const formatCurrency = useFormatCurrency();
  const activeProducts = (products.data ?? []).filter(product => product.active !== false);
  const filtered = activeProducts.filter(product => `${product.name} ${product.sku ?? ""} ${product.category ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const outOfStock = activeProducts.filter(product => product.stock <= 0).length;
  const inStock = activeProducts.filter(product => product.stock > 0).length;
  const estimatedValue = activeProducts.reduce((sum, product) => sum + product.stock * (product.costPrice ?? product.price), 0);

  return <PageShell eyebrow="GESTÃO / PRODUTOS" title="Análise de Stock" description="Consulte disponibilidade e valor estimado do inventário com base nos produtos activos." actions={<StockNav current="analise" />}>
    {products.isError ? <QueryError onRetry={() => void products.refetch()} /> : products.isLoading ? <LoadingRows count={5} columns={4} /> : <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Produtos activos" value={activeProducts.length} detail="No catálogo de Gestão" tone="blue" />
        <MetricCard label="Com stock" value={inStock} detail="Quantidade superior a zero" tone="teal" />
        <MetricCard label="Sem stock" value={outOfStock} detail="Requer reposição ou revisão" tone={outOfStock ? "amber" : "teal"} />
        <MetricCard label="Valor estimado" value={formatCurrency(estimatedValue)} detail="Custo registado; usa preço de venda quando não existe custo" tone="blue" />
      </div>
      <Section title="Posição de stock" hint={`${filtered.length} produto(s)`} action={<Link href="/produtos"><Button size="sm" variant="outline"><Package size={14} className="mr-2" /> Gerir catálogo</Button></Link>}>
        <div className="border-b border-[hsl(var(--border))] p-3"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" /><Input className="pl-9" placeholder="Pesquisar produto, código ou categoria..." value={search} onChange={event => setSearch(event.target.value)} /></div></div>
        {filtered.length === 0 ? <EmptyState title="Sem produtos nesta pesquisa" description="Altere a pesquisa ou crie produtos no catálogo de Gestão." /> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
          <thead className="bg-[hsl(var(--muted))] text-left text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]"><tr><th className="px-4 py-3">Produto</th><th className="px-4 py-3">Código</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3 text-right">Preço</th><th className="px-4 py-3 text-right">Stock</th><th className="px-4 py-3 text-right">Estado</th></tr></thead>
          <tbody>{filtered.map(product => <tr key={product.id} className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]"><td className="px-4 py-3 font-medium">{product.name}</td><td className="px-4 py-3 font-mono text-xs text-[hsl(var(--muted-foreground))]">{product.sku || "—"}</td><td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{product.category || "—"}</td><td className="px-4 py-3 text-right">{formatCurrency(product.price)}</td><td className="px-4 py-3 text-right font-semibold">{product.stock} {product.unit}</td><td className="px-4 py-3 text-right"><span className={`rounded-full border px-2 py-1 text-[10px] font-medium ${product.stock <= 0 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{product.stock <= 0 ? "Sem stock" : "Disponível"}</span></td></tr>)}</tbody>
        </table></div>}
      </Section>
    </>}
  </PageShell>;
}

export function StockMovements() {
  const documents = useListDocuments();
  const [search, setSearch] = useState("");
  const eligibleDocuments = useMemo(() => (documents.data ?? [])
    .filter(document => (document.status === "emitido" || document.status === "pago") && /(?:Movimentar stock|Saída de stock):\s*Sim/i.test(document.notes ?? ""))
    .sort((a, b) => new Date(b.issuedAt ?? b.createdAt).getTime() - new Date(a.issuedAt ?? a.createdAt).getTime())
    .slice(0, 100), [documents.data]);
  const details = useQueries({ queries: eligibleDocuments.map(document => getGetDocumentQueryOptions(document.id)) });
  const movements = eligibleDocuments.flatMap((document, index) => (details[index]?.data?.items ?? [])
    .filter(item => item.productId != null)
    .map(item => ({
      key: `${document.id}-${item.id}`,
      document,
      item,
      date: document.issuedAt ?? document.createdAt,
    })))
    .filter(movement => `${movement.document.number ?? ""} ${movement.document.clientName ?? ""} ${movement.item.description}`.toLowerCase().includes(search.toLowerCase()));
  const isLoading = documents.isLoading || details.some(detail => detail.isLoading);
  const isError = documents.isError || details.some(detail => detail.isError);

  return <PageShell eyebrow="GESTÃO / PRODUTOS" title="Movimentos de Stock" description="Saídas ligadas a produtos em documentos emitidos que indicam movimentação de stock." actions={<StockNav current="movimentos" />}>
    {isError ? <QueryError onRetry={() => { void documents.refetch(); details.forEach(detail => void detail.refetch()); }} /> : isLoading ? <LoadingRows count={5} columns={5} /> : <>
      <div className="grid gap-3 sm:grid-cols-2"><MetricCard label="Linhas de saída" value={movements.length} detail="Itens de documentos emitidos" tone="blue" /><MetricCard label="Documentos associados" value={new Set(movements.map(movement => movement.document.id)).size} detail="Com saída de stock assinalada" tone="teal" /></div>
      <Section title="Histórico de saídas" hint="Dados obtidos dos documentos do ERP">
        <div className="border-b border-[hsl(var(--border))] p-3"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" /><Input className="pl-9" placeholder="Pesquisar documento, cliente ou produto..." value={search} onChange={event => setSearch(event.target.value)} /></div></div>
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">Esta vista recupera linhas de produto de documentos emitidos com a opção de saída de stock marcada. Documentos antigos sem essa opção ou itens sem ligação ao catálogo não aparecem como movimentos.</div>
        {movements.length === 0 ? <EmptyState title="Sem saídas registadas" description="Ainda não existem documentos emitidos com itens de produto e movimentação de stock assinalada." /> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm">
          <thead className="bg-[hsl(var(--muted))] text-left text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]"><tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Documento</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Produto / Serviço</th><th className="px-4 py-3 text-right">Quantidade</th><th className="px-4 py-3 text-right">Movimento</th></tr></thead>
          <tbody>{movements.map(movement => <tr key={movement.key} className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]"><td className="px-4 py-3">{formatDate(movement.date)}</td><td className="px-4 py-3"><Link className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[hsl(var(--primary))]" href={`/documentos/${movement.document.id}`}><FileText size={13} />{movement.document.number ?? `#${movement.document.id}`}</Link></td><td className="px-4 py-3">{movement.document.clientName || "Consumidor Final"}</td><td className="px-4 py-3">{movement.item.description}</td><td className="px-4 py-3 text-right font-semibold">{movement.item.quantity}</td><td className="px-4 py-3 text-right"><span className="inline-flex items-center gap-1 text-rose-700"><ArrowDownToLine size={14} /> Saída</span></td></tr>)}</tbody>
        </table></div>}
        {eligibleDocuments.length === 100 && <p className="border-t border-[hsl(var(--border))] px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">A consulta mostra os 100 documentos elegíveis mais recentes.</p>}
      </Section>
    </>}
  </PageShell>;
}