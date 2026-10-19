import { ReactNode } from "react";
import { Link } from "wouter";
import { AlertCircle, ArrowUpRight, FileDown, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const cx = (...items: Array<string | false | null | undefined>) => items.filter(Boolean).join(" ");

export function formatKz(value: number | null | undefined, currency = "AOA") {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency, maximumFractionDigits: 0 }).format(value ?? 0);
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-PT");
}

export function PageShell({
  eyebrow = "LAB / CONTROLO OPERACIONAL",
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[100dvh] bg-[hsl(var(--background))] px-4 py-5 text-[hsl(var(--foreground))] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col justify-between gap-5 border-b border-[hsl(var(--border))] pb-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--primary))]" data-testid="text-page-eyebrow">{eyebrow}</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" data-testid="text-page-title">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]" data-testid="text-page-description">{description}</p>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
        {children}
      </div>
    </main>
  );
}

export function MetricCard({ label, value, detail, tone = "teal" }: { label: string; value: string | number; detail: string; tone?: "teal" | "amber" | "blue" | "red" }) {
  const colors = {
    teal: "border-teal-200/80 bg-teal-50/70 text-teal-800",
    amber: "border-amber-200/80 bg-amber-50/70 text-amber-800",
    blue: "border-sky-200/80 bg-sky-50/70 text-sky-800",
    red: "border-rose-200/80 bg-rose-50/70 text-rose-800",
  };
  return (
    <article className={cx("rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md", colors[tone])} data-testid={`metric-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.13em] opacity-70">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs opacity-70">{detail}</p>
    </article>
  );
}

export function Section({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm" data-testid={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex flex-col gap-2 border-b border-[hsl(var(--border))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function LoadingRows({ count = 5, columns = 4 }: { count?: number; columns?: number }) {
  return <div className="space-y-2 p-4" data-testid="loading-state">{Array.from({ length: count }, (_, row) => <div className="flex gap-3" key={row}>{Array.from({ length: columns }, (_, col) => <Skeleton className={cx("h-9 flex-1", col === 0 && "max-w-[30%]")} key={col} />)}</div>)}</div>;
}

export function QueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-5 py-14 text-center" data-testid="error-state">
      <AlertCircle className="text-rose-500" size={25} />
      <div><p className="text-sm font-semibold">Não foi possível carregar esta vista</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Verifique a ligação e tente novamente.</p></div>
      <Button variant="outline" size="sm" onClick={onRetry} data-testid="button-retry"><RefreshCw size={14} className="mr-2" /> Tentar novamente</Button>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="px-5 py-14 text-center" data-testid="empty-state"><div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--primary))]"><span className="font-mono text-sm">∅</span></div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{description}</p></div>;
}

export function StatusPill({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    emitido: "border-teal-200 bg-teal-50 text-teal-700",
    pago: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rascunho: "border-amber-200 bg-amber-50 text-amber-700",
    cancelado: "border-rose-200 bg-rose-50 text-rose-700",
  };
  const labels: Record<string, string> = { emitido: "Emitido", pago: "Pago", rascunho: "Rascunho", cancelado: "Cancelado" };
  return <Badge variant="outline" className={cx("font-medium", map[status ?? ""] ?? "border-slate-200 bg-slate-50 text-slate-600")} data-testid={`status-${status ?? "unknown"}`}>{labels[status ?? ""] ?? status ?? "Sem estado"}</Badge>;
}

export function ExportButton({ onClick, label = "Exportar CSV" }: { onClick: () => void; label?: string }) {
  return <Button variant="outline" size="sm" onClick={onClick} data-testid="button-export-csv"><FileDown size={14} className="mr-2" />{label}</Button>;
}

export function PrintButton({ onClick, label = "Imprimir" }: { onClick: () => void; label?: string }) {
  return <Button variant="outline" size="sm" onClick={onClick} data-testid="button-print"><Printer size={14} className="mr-2" />{label}</Button>;
}

export function OpenLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--primary))] transition-colors hover:text-[hsl(var(--foreground))]" data-testid={`link-${href.replace(/\//g, "-").replace(/^-/, "")}`}>{children}<ArrowUpRight size={13} /></Link>;
}

export function downloadCsv(filename: string, rows: Array<Array<string | number | null | undefined>>) {
  const csv = rows.map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function openPrintWindow(title: string, content: string) {
  const win = window.open("", "_blank", "width=1000,height=720");
  if (!win) return;
  win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;color:#12313d;padding:32px}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:9px;border-bottom:1px solid #d8e6e8;text-align:left;font-size:12px}th{background:#eaf6f6;text-transform:uppercase;font-size:10px}button{padding:8px 12px;border:0;background:#137e83;color:#fff;border-radius:4px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Imprimir</button><h1>${title}</h1>${content}</body></html>`);
  win.document.close();
}