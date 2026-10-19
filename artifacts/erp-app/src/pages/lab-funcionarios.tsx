import { Link } from "wouter";
import { ClipboardCheck, FileText, LockKeyhole, Package, ShieldCheck, UsersRound } from "lucide-react";
import { useGetSettings, useListDocuments, useListPacientes, useListReagentes, useListResultados } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingRows, MetricCard, PageShell, QueryError, Section } from "./lab-ui";

export default function LabFuncionarios() {
  const settings = useGetSettings();
  const patients = useListPacientes();
  const results = useListResultados();
  const documents = useListDocuments();
  const reagents = useListReagentes();
  const loading = settings.isLoading || patients.isLoading || results.isLoading || documents.isLoading || reagents.isLoading;
  const error = settings.isError || patients.isError || results.isError || documents.isError || reagents.isError;
  const pending = (results.data ?? []).filter(result => result.estado !== "emitido").length;
  const stockAlerts = (reagents.data ?? []).filter(item => item.stockAtual !== null && item.stockAtual !== undefined && item.stockAtual <= (item.stockMinimo ?? 0)).length;
  const retry = () => { void settings.refetch(); void patients.refetch(); void results.refetch(); void documents.refetch(); void reagents.refetch(); };
  return <PageShell eyebrow="LAB / ACESSO OPERACIONAL" title="Funcionários" description="Centro de coordenação para a equipa do laboratório. Como não existe uma API dedicada de colaboradores, esta vista expõe o estado operacional da empresa, sem inventar utilizadores ou permissões." actions={<div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"><LockKeyhole size={14} /> Acesso ao nível da empresa</div>}>
    {error ? <QueryError onRetry={retry} /> : loading ? <LoadingRows count={4} columns={4} /> : <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><MetricCard label="Equipa operacional" value="API não disponível" detail="Sem diretório de funcionários" tone="amber" /><MetricCard label="Pacientes ativos" value={patients.data?.length ?? 0} detail="Base acessível à recepção" tone="blue" /><MetricCard label="Resultados em fila" value={pending} detail="Trabalho para a equipa técnica" tone={pending ? "amber" : "teal"} /><MetricCard label="Alertas técnicos" value={stockAlerts} detail="Inventário a acompanhar" tone={stockAlerts ? "red" : "teal"} /></div>
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900"><div className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0" /><div><p className="font-semibold">Limite de dados respeitado</p><p className="mt-1 text-xs leading-5 text-amber-800">Os cartões abaixo representam filas e responsabilidades do negócio, não pessoas. Nomes, cargos e permissões só devem ser adicionados quando existir uma API de funcionários.</p></div></div></div>
      <Section title="Frentes de trabalho" hint={`Contexto da operação em ${settings.data?.companyName ?? "ULTRACARDIO"}`}><div className="grid gap-px bg-[hsl(var(--border))] sm:grid-cols-3"><RoleCard icon={UsersRound} title="Recepção" description="Entrada, pesquisa e manutenção de pacientes." count={`${patients.data?.length ?? 0} pacientes`} href="/lab/pacientes" /><RoleCard icon={ClipboardCheck} title="Técnica" description="Lançamento, revisão e emissão de resultados." count={`${pending} pendentes`} href="/lab/resultados" /><RoleCard icon={Package} title="Inventário" description="Acompanhamento de reagentes e níveis mínimos." count={`${stockAlerts} alertas`} href="/lab/reagentes" /></div></Section>
      <Section title="Resumo de acesso" hint="Dados agregados disponíveis neste espaço"><div className="grid gap-4 p-4 md:grid-cols-3"><AccessRow icon={FileText} label="Documentos" value={`${documents.data?.length ?? 0} registos`} href="/lab/financeiro" /><AccessRow icon={UsersRound} label="Pacientes" value={`${patients.data?.length ?? 0} registos`} href="/lab/pacientes" /><AccessRow icon={ClipboardCheck} label="Resultados" value={`${results.data?.length ?? 0} registos`} href="/lab/historico" /></div></Section>
      <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]"><span>Última leitura feita diretamente nas APIs operacionais.</span><Button variant="ghost" size="sm" onClick={retry} data-testid="button-refresh-funcionarios">Atualizar</Button></div>
    </>}
  </PageShell>;
}

function RoleCard({ icon: Icon, title, description, count, href }: { icon: typeof UsersRound; title: string; description: string; count: string; href: string }) {
  return <Link href={href} className="group bg-[hsl(var(--card))] p-5 transition-colors hover:bg-[hsl(var(--accent))]" data-testid={`link-role-${title.toLowerCase()}`}><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--primary))]"><Icon size={17} /></span><p className="mt-4 text-sm font-semibold">{title}</p><p className="mt-1 min-h-10 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{description}</p><p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--primary))]">{count}</p></Link>;
}

function AccessRow({ icon: Icon, label, value, href }: { icon: typeof FileText; label: string; value: string; href: string }) {
  return <Link href={href} className="flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] p-3 transition-colors hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))]" data-testid={`link-access-${label.toLowerCase()}`}><Icon size={17} className="text-[hsl(var(--primary))]" /><span className="flex-1"><span className="block text-sm font-medium">{label}</span><span className="block text-xs text-[hsl(var(--muted-foreground))]">{value}</span></span><span className="text-xs text-[hsl(var(--primary))]">Abrir</span></Link>;
}