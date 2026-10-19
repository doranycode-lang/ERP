import React from "react";
import { useApp } from "../store/AppContext";
import { formatCurrency } from "../store/storage";
import { Session } from "../store/auth";

function StatCard({
  label, value, sub, color, icon, trend,
}: {
  label: string; value: string | number; sub?: string;
  color: string; icon: React.ReactElement; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{label}</div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-4 w-1 rounded-full bg-primary" />
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{children}</h3>
    </div>
  );
}

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function Dashboard({ session }: { session: Session }) {
  const { data } = useApp();
  const today = todayStr();

  const resultadosHoje = data.resultados.filter((r) => r.data === today || r.dataEmissao === today).length;
  const pacientesTotal = data.pacientes.length;
  const resultadosTotal = data.resultados.length;

  const faturasEmitidas = data.faturas.filter((f) => f.estado === "emitida" || f.estado === "paga");
  const totalFaturado = faturasEmitidas.reduce((s, f) => s + f.total, 0);
  const faturasHoje = data.faturas.filter((f) => f.data === today).length;
  const faturasPendentes = data.faturas.filter((f) => f.estado === "emitida").length;
  const faturasPagas = data.faturas.filter((f) => f.estado === "paga").length;

  const totalEntradas = data.movimentosCC.filter((m) => m.tipo === "entrada").reduce((s, m) => s + m.valor, 0);
  const totalSaidas = data.movimentosCC.filter((m) => m.tipo === "saida").reduce((s, m) => s + m.valor, 0);
  const saldoCC = totalEntradas - totalSaidas;
  const moeda = data.config.moeda || "AOA";

  const ultimosResultados = [...data.resultados].reverse().slice(0, 5);
  const ultimasFaturas = [...data.faturas].reverse().slice(0, 5);

  const estadoBadge = (estado: string) => {
    const cfg: Record<string, { cls: string; label: string }> = {
      rascunho: { cls: "bg-slate-100 text-slate-600", label: "Rascunho" },
      emitida:  { cls: "bg-blue-50 text-blue-700 border border-blue-200", label: "Emitida" },
      paga:     { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", label: "Paga" },
      anulada:  { cls: "bg-red-50 text-red-600 border border-red-200", label: "Anulada" },
    };
    const { cls, label } = cfg[estado] ?? { cls: "bg-slate-100 text-slate-600", label: estado };
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {today} · Bem-vindo, <span className="font-semibold text-foreground">{session.funcionarioNome || session.username}</span>
          </p>
        </div>
        {faturasHoje > 0 && (
          <div className="flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
            {faturasHoje} fatura{faturasHoje > 1 ? "s" : ""} hoje
          </div>
        )}
      </div>

      {/* Clinical stats */}
      <div>
        <SectionTitle>Actividade Clínica</SectionTitle>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Pacientes" value={pacientesTotal} sub="Total registados" color="bg-primary/10 text-primary"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
          />
          <StatCard
            label="Resultados Hoje" value={resultadosHoje} sub={`${resultadosTotal} no total`} color="bg-blue-50 text-blue-600"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>}
          />
          <StatCard
            label="Exames Custom" value={Object.values(data.examesCustom).reduce((acc, cat) => acc + Object.keys(cat).length, 0)} sub="Catálogo personalizado" color="bg-violet-50 text-violet-600"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3v11a6 6 0 006-6V3"/><line x1="6" y1="3" x2="18" y2="3"/><path d="M5 21h14"/></svg>}
          />
          <StatCard
            label="Total Resultados" value={resultadosTotal} sub="Desde o início" color="bg-amber-50 text-amber-600"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
          />
        </div>
      </div>

      {/* Financial stats */}
      <div>
        <SectionTitle>Financeiro</SectionTitle>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Faturado" value={formatCurrency(totalFaturado, moeda)} sub={`${faturasEmitidas.length} faturas`} color="bg-primary/10 text-primary"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h3"/></svg>}
          />
          <StatCard
            label="Pendentes" value={faturasPendentes} sub="Por liquidar" color="bg-amber-50 text-amber-600"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          />
          <StatCard
            label="Pagas" value={faturasPagas} sub="Liquidadas" color="bg-emerald-50 text-emerald-600"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
          />
          <StatCard
            label="Saldo CC" value={formatCurrency(saldoCC, moeda)}
            sub={`Ent: ${formatCurrency(totalEntradas, moeda)}`}
            color={saldoCC >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
          />
        </div>
      </div>

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
            </svg>
            <h3 className="text-sm font-bold text-foreground">Últimos Resultados</h3>
          </div>
          {ultimosResultados.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-30">
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
              </svg>
              Nenhum resultado registado
            </div>
          ) : (
            <div className="divide-y divide-border">
              {ultimosResultados.map((r) => (
                <div key={r.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {r.pacienteNome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{r.pacienteNome}</div>
                    <div className="text-xs text-muted-foreground">{r.parametros?.filter((p: any) => p.resultado).length ?? 0} parâm. · {r.data}</div>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono flex-shrink-0">#{r.id}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h3"/>
            </svg>
            <h3 className="text-sm font-bold text-foreground">Últimas Faturas</h3>
          </div>
          {ultimasFaturas.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-30">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>
              </svg>
              Nenhuma fatura emitida
            </div>
          ) : (
            <div className="divide-y divide-border">
              {ultimasFaturas.map((f) => (
                <div key={f.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{f.clienteNome || "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{f.numero} · {f.data}</div>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <div className="text-sm font-bold text-primary">{formatCurrency(f.total, moeda)}</div>
                    {estadoBadge(f.estado)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System info */}
      <div className="rounded-xl border border-primary/20 overflow-hidden">
        <div className="px-5 py-3 border-b border-primary/15" style={{ background: "hsl(var(--primary) / 0.06)" }}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Configuração Activa
          </div>
        </div>
        <div className="bg-white px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Série de Faturas", value: data.config.serie || "—" },
            { label: "Próximo Nº",       value: data.config.proximoNumeroFatura || "—" },
            { label: "Moeda",            value: data.config.moeda || "AOA" },
            { label: "Taxa IVA",         value: `${data.config.ivaTaxa ?? 14}%` },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
              <div className="text-sm font-bold text-foreground">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
