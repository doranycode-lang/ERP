import { Link } from "wouter";
import { Activity, ArrowRight, ClipboardList, FlaskConical, PackageCheck, Users, WalletCards } from "lucide-react";
import { useGetDashboard, useGetSettings, useListDocuments, useListPacientes, useListReagentes, useListResultados } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { MetricCard, PageShell, Section, LoadingRows, QueryError, EmptyState, StatusPill, formatDate, formatKz, OpenLink } from "./lab-ui";

export default function LabDashboard() {
  const dashboard = useGetDashboard();
  const settings = useGetSettings();
  const patients = useListPacientes();
  const results = useListResultados();
  const documents = useListDocuments();
  const reagents = useListReagentes();
  const loading = dashboard.isLoading || patients.isLoading || results.isLoading || documents.isLoading || reagents.isLoading;
  const hasError = dashboard.isError || patients.isError || results.isError || documents.isError || reagents.isError;
  const refetch = () => { void dashboard.refetch(); void patients.refetch(); void results.refetch(); void documents.refetch(); void reagents.refetch(); };
  const pendingResults = (results.data ?? []).filter(result => result.estado !== "emitido").length;
  const lowStock = (reagents.data ?? []).filter(item => item.stockAtual !== null && item.stockAtual !== undefined && item.stockAtual <= (item.stockMinimo ?? 0)).length;
  const pendingDocs = (documents.data ?? []).filter(doc => doc.status === "emitido" || doc.status === "rascunho");
  const recentDocs = dashboard.data?.recentDocuments ?? documents.data?.slice(0, 5) ?? [];

  return (
    <PageShell title="Centro de comando" description={`Operação laboratorial da ${settings.data?.companyName ?? "ULTRACARDIO"}. Uma leitura rápida do que precisa de atenção agora.`} actions={<Link href="/lab/resultados" className="inline-flex h-9 items-center gap-2 rounded-md bg-[hsl(var(--primary))] px-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5" data-testid="link-open-results"><FlaskConical size={15} /> Abrir resultados</Link>}>
      {hasError ? <QueryError onRetry={refetch} /> : loading ? <LoadingRows count={4} columns={4} /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <MetricCard label="Receita acumulada" value={formatKz(dashboard.data?.totalRevenue, settings.data?.currency)} detail="Visão do dashboard financeiro" tone="teal" />
            <MetricCard label="Pacientes" value={patients.data?.length ?? 0} detail="Registos clínicos disponíveis" tone="blue" />
            <MetricCard label="Resultados pendentes" value={pendingResults} detail="Rascunhos por concluir" tone={pendingResults ? "amber" : "teal"} />
            <MetricCard label="Documentos em curso" value={pendingDocs.length} detail="Emitidos ou em rascunho" tone="blue" />
            <MetricCard label="Reagentes em alerta" value={lowStock} detail="Abaixo do stock mínimo" tone={lowStock ? "red" : "teal"} />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
            <Section title="Fila de operação" hint="Atalhos para os pontos onde a equipa trabalha agora">
              <div className="grid divide-y divide-[hsl(var(--border))] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {[
                  { href: "/lab/pacientes", icon: Users, title: "Recepção e pacientes", text: `${patients.data?.length ?? 0} registos no sistema`, tone: "bg-sky-50 text-sky-700" },
                  { href: "/lab/resultados", icon: ClipboardList, title: "Resultados laboratoriais", text: `${pendingResults} aguardam emissão`, tone: "bg-amber-50 text-amber-700" },
                  { href: "/lab/reagentes", icon: PackageCheck, title: "Inventário técnico", text: `${lowStock} alertas de stock`, tone: "bg-teal-50 text-teal-700" },
                  { href: "/lab/financeiro", icon: WalletCards, title: "Financeiro do laboratório", text: `${pendingDocs.length} documentos em curso`, tone: "bg-indigo-50 text-indigo-700" },
                ].map(item => {
                  const Icon = item.icon;
                  return <Link key={item.href} href={item.href} className="group flex items-center gap-3 p-4 transition-colors hover:bg-[hsl(var(--accent))]" data-testid={`link-operation-${item.href.split("/").pop()}`}><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.tone}`}><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.title}</span><span className="mt-1 block truncate text-xs text-[hsl(var(--muted-foreground))]">{item.text}</span></span><ArrowRight size={16} className="text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-1" /></Link>;
                })}
              </div>
            </Section>
            <Section title="Pulso do laboratório" hint="Resultados criados mais recentemente">
              <div className="divide-y divide-[hsl(var(--border))]">
                {(results.data ?? []).slice(0, 5).map(result => <div className="flex items-center gap-3 px-4 py-3" key={result.id} data-testid={`row-dashboard-result-${result.id}`}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--primary))]"><Activity size={15} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{result.pacienteNome ?? `Paciente #${result.pacienteId}`}</p><p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{formatDate(result.data)}{result.tecnicoNome ? ` · ${result.tecnicoNome}` : ""}</p></div><StatusPill status={result.estado} /></div>)}
                {(results.data ?? []).length === 0 && <EmptyState title="Sem resultados registados" description="A fila de resultados aparece aqui à medida que a equipa trabalha." />}
              </div>
            </Section>
          </div>
          <Section title="Documentos recentes" hint="Atividade documental que pode afetar o fecho financeiro" action={<OpenLink href="/lab/financeiro">Ver financeiro</OpenLink>}>
            {recentDocs.length === 0 ? <EmptyState title="Sem documentos recentes" description="Não há documentos devolvidos pela API neste momento." /> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="bg-[hsl(var(--muted))] text-left text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]"><tr><th className="px-4 py-3">Documento</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Data</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Estado</th></tr></thead><tbody>{recentDocs.map(doc => <tr className="border-t border-[hsl(var(--border))] transition-colors hover:bg-[hsl(var(--accent))]" key={doc.id} data-testid={`row-dashboard-document-${doc.id}`}><td className="px-4 py-3 font-mono text-xs font-bold text-[hsl(var(--primary))]">{doc.number ?? `#${doc.id}`}</td><td className="px-4 py-3">{doc.clientName ?? "Consumidor final"}</td><td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{formatDate(doc.createdAt)}</td><td className="px-4 py-3 text-right font-semibold">{formatKz(doc.total, settings.data?.currency)}</td><td className="px-4 py-3 text-right"><StatusPill status={doc.status} /></td></tr>)}</tbody></table></div>}
          </Section>
          <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]"><Activity size={14} className="text-[hsl(var(--primary))]" /><span>Dados sincronizados a partir das APIs de pacientes, resultados, documentos e inventário. A atualização automática segue a política do ERP.</span><Button variant="ghost" size="sm" className="ml-auto h-7" onClick={refetch} data-testid="button-refresh-dashboard">Atualizar</Button></div>
        </>
      )}
    </PageShell>
  );
}