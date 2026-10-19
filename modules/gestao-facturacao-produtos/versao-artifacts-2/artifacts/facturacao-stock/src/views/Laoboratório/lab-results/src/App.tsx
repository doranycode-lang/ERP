import React, { useState, useCallback, useEffect } from "react";
import fundoImg from "./pages/FUNDO.png";
import logoImg from "./pages/Logo.png";
import { AppProvider, useApp } from "./store/AppContext";
import { loadSession, saveSession, Session, FuncaoFuncionario, canAccess } from "./store/auth";
import { api } from "./store/api";
import Login from "./pages/Login";
import AdminEmpresas from "./pages/AdminEmpresas";
import PortalParceiro from "./pages/PortalParceiro";
import Dashboard from "./pages/Dashboard";
import Pacientes from "./pages/Pacientes";
import LancarResultados from "./pages/LancarResultados";
import Historico from "./pages/Historico";
import CadastrarExames from "./pages/CadastrarExames";
import Configuracoes from "./pages/Configuracoes";
import AdminFuncionarios from "./pages/AdminFuncionarios";
import Faturacao from "./pages/Faturacao";
import ContaCorrente from "./pages/ContaCorrente";
import GestaProdutos from "./pages/GestaProdutos";
import GestaParceiros from "./pages/GestaParceiros";
import GestaStock from "./pages/GestaStock";
import Enfermagem from "./pages/Enfermagem";
import Imagiologia from "./pages/Imagiologia";
import Farmacia from "./pages/Farmacia";
import Medico from "./pages/Medico";

type Tab =
  | "dashboard" | "pacientes" | "lancamento" | "historico"
  | "exames" | "produtos" | "faturacao" | "contacorrente"
  | "funcionarios" | "parceiros" | "config" | "stock"
  | "enfermagem" | "imagiologia" | "farmacia" | "medico";

interface TabDef {
  id: Tab;
  label: string;
  group: "clinico" | "financeiro" | "gestao";
  roles: FuncaoFuncionario[];
}

const ALL_ROLES: FuncaoFuncionario[] = [
  "admin","gestor","diretor_clinico","medico","enfermeiro","tecnico",
  "imagiologista","farmaceutico","rececionista","financeiro","administrativo","auxiliar",
];

const ALL_TABS: TabDef[] = [
  { id: "dashboard",     label: "Dashboard",          group: "clinico",    roles: ALL_ROLES },
  { id: "pacientes",     label: "Pacientes",           group: "clinico",    roles: ["admin","gestor","diretor_clinico","medico","enfermeiro","tecnico","rececionista","imagiologista","farmaceutico","administrativo","auxiliar"] },
  { id: "enfermagem",    label: "Enfermagem",          group: "clinico",    roles: ["admin","gestor","diretor_clinico","medico","enfermeiro","auxiliar"] },
  { id: "lancamento",    label: "Lançar Resultados",   group: "clinico",    roles: ["admin","gestor","diretor_clinico","tecnico","medico"] },
  { id: "historico",     label: "Histórico / PDF",     group: "clinico",    roles: ["admin","gestor","diretor_clinico","tecnico","rececionista","medico","enfermeiro","imagiologista"] },
  { id: "imagiologia",   label: "Imagiologia",         group: "clinico",    roles: ["admin","gestor","diretor_clinico","medico","imagiologista"] },
  { id: "farmacia",      label: "Farmácia",            group: "clinico",    roles: ["admin","gestor","diretor_clinico","farmaceutico","medico"] },
  { id: "medico",        label: "Médico",              group: "clinico",    roles: ["admin","gestor","diretor_clinico","medico"] },
  { id: "exames",        label: "Catálogo de Exames",  group: "clinico",    roles: ["admin","gestor","diretor_clinico"] },
  { id: "faturacao",     label: "Faturação",           group: "financeiro", roles: ["admin","gestor","diretor_clinico","rececionista","financeiro","administrativo"] },
  { id: "contacorrente", label: "Conta Corrente",      group: "financeiro", roles: ["admin","gestor","diretor_clinico","financeiro"] },
  { id: "produtos",      label: "Produtos / Serviços", group: "financeiro", roles: ["admin","gestor","diretor_clinico","financeiro"] },
  { id: "stock",         label: "Stock de Reagentes",  group: "gestao",     roles: ["admin","gestor","diretor_clinico","tecnico","farmaceutico"] },
  { id: "funcionarios",  label: "Funcionários",        group: "gestao",     roles: ["admin","diretor_clinico"] },
  { id: "parceiros",     label: "Parceiros",           group: "gestao",     roles: ["admin","gestor","diretor_clinico"] },
  { id: "config",        label: "Configurações",       group: "gestao",     roles: ["admin","diretor_clinico"] },
];

const FUNCAO_LABEL: Record<FuncaoFuncionario, string> = {
  admin: "Administrador", gestor: "Gestor", diretor_clinico: "Director Clínico",
  medico: "Médico(a)", enfermeiro: "Enfermeiro(a)", tecnico: "Técnico Lab.",
  imagiologista: "Imagiologista", farmaceutico: "Farmacêutico(a)",
  rececionista: "Recepcionista", financeiro: "Financeiro(a)",
  administrativo: "Administrativo(a)", auxiliar: "Auxiliar",
};

function TabIcon({ id, size = 18 }: { id: Tab; size?: number }) {
  const s = size;
  const icons: Record<Tab, React.ReactElement> = {
    dashboard:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    pacientes:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    enfermagem:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    lancamento:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>,
    historico:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    imagiologia:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="11" r="4"/><path d="M12 7v1M12 14v1M9 11H8M16 11h-1M10.17 8.76l-.7-.7M15.24 13.83l-.7-.7M10.17 13.24l-.7.7M15.24 8.17l-.7.7"/></svg>,
    farmacia:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v6H3z"/><path d="M3 9v12h18V9"/><path d="M9 14h6M12 11v6"/></svg>,
    exames:        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3v11a6 6 0 006-6V3"/><line x1="6" y1="3" x2="18" y2="3"/><path d="M5 21h14"/></svg>,
    faturacao:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h3"/></svg>,
    contacorrente: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    produtos:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
    stock:         <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3v11a6 6 0 006-6V3"/><line x1="6" y1="3" x2="18" y2="3"/><path d="M5 21h14"/><line x1="12" y1="16" x2="12" y2="21"/></svg>,
    funcionarios:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><circle cx="19" cy="11" r="2"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>,
    parceiros:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    config:        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M20 12h2M2 12h2M12 20v2M12 2v2"/></svg>,
    medico:        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/><circle cx="12" cy="12" r="0"/><path d="M8 12h8"/></svg>,
  };
  return icons[id];
}

function Sidebar({ session, tab, setTab, onLogout, allowedTabs, open, onClose }: {
  session: Session; tab: Tab; setTab: (t: Tab) => void; onLogout: () => void;
  allowedTabs: TabDef[]; open: boolean; onClose: () => void;
}) {
  const { data } = useApp();
  const groups: { key: string; label: string; tabs: TabDef[] }[] = [
    { key: "clinico",    label: "Clínico",    tabs: allowedTabs.filter(t => t.group === "clinico") },
    { key: "financeiro", label: "Financeiro", tabs: allowedTabs.filter(t => t.group === "financeiro") },
    { key: "gestao",     label: "Gestão",     tabs: allowedTabs.filter(t => t.group === "gestao") },
  ].filter(g => g.tabs.length > 0);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed top-0 left-0 h-full z-30 flex flex-col transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} w-[220px]`}
        style={{ background: "hsl(var(--sidebar))" }}
      >
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {data.config.logoData ? (
              <img src={data.config.logoData} alt="" className="h-9 w-9 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm"
                style={{ background: "hsl(var(--primary))", color: "white" }}>
                {(data.config.nomeClinica || session.empresaNome || "L").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-white text-sm font-semibold leading-tight truncate">
                {data.config.nomeClinica || session.empresaNome || "Laboratório"}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "hsl(var(--sidebar-foreground))" }}>Sistema de Gestão</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
          {groups.map((g) => (
            <div key={g.key}>
              <div className="text-[10px] uppercase tracking-widest font-semibold px-3 mb-1.5" style={{ color: "hsl(215 16% 38%)" }}>{g.label}</div>
              <div className="space-y-0.5">
                {g.tabs.map((t) => (
                  <button key={t.id} onClick={() => { setTab(t.id); onClose(); }}
                    className={`nav-item w-full text-left ${tab === t.id ? "active" : ""}`}>
                    <TabIcon id={t.id} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "hsl(var(--primary) / 0.3)", color: "hsl(var(--primary))" }}>
              {(session.funcionarioNome || session.username).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate leading-tight">{session.funcionarioNome || session.username}</div>
              <div className="text-xs leading-tight truncate" style={{ color: "hsl(var(--sidebar-foreground))" }}>
                {session.funcao ? FUNCAO_LABEL[session.funcao] : ""}
              </div>
            </div>
          </div>
          <button onClick={onLogout}
            className="mt-1.5 w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
            style={{ color: "hsl(var(--sidebar-foreground))" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Terminar Sessão
          </button>
        </div>
      </aside>
    </>
  );
}

function MobileHeader({ onOpenSidebar, session }: { onOpenSidebar: () => void; session: Session }) {
  const { data } = useApp();
  return (
    <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-white shadow-sm flex-shrink-0">
      <button onClick={onOpenSidebar} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div className="text-sm font-bold text-foreground flex-1 truncate">{data.config.nomeClinica || session.empresaNome}</div>
      <div className="text-xs text-muted-foreground">{session.funcionarioNome || session.username}</div>
    </header>
  );
}

function Shell({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const { loading } = useApp();
  const funcao = session.funcao ?? "admin";
  const allowedTabs = ALL_TABS.filter((t) => canAccess(funcao, t.roles));
  const [tab, setTab] = useState<Tab>(allowedTabs[0]?.id ?? "dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentTab = allowedTabs.find((t) => t.id === tab) ? tab : (allowedTabs[0]?.id ?? "dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--sidebar))" }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/50 text-sm">A carregar dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background" style={{ position: 'relative' }}>
      <img src={logoImg} alt="Logo" style={{
        position: 'fixed', bottom: 18, right: 18, zIndex: 50,
        height: 54, width: 'auto', opacity: 0.85, pointerEvents: 'none',
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))',
      }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `url(${fundoImg})`,
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
        opacity: 0.06,
      }} />
      <Sidebar session={session} tab={currentTab} setTab={setTab} onLogout={onLogout}
        allowedTabs={allowedTabs} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-[220px]" style={{ position: 'relative', zIndex: 1 }}>
        <MobileHeader onOpenSidebar={() => setSidebarOpen(true)} session={session} />
        <main className="flex-1 overflow-auto">
          {currentTab === "dashboard"     && <Dashboard session={session} />}
          {currentTab === "pacientes"     && <Pacientes />}
          {currentTab === "enfermagem"    && <Enfermagem session={session} />}
          {currentTab === "lancamento"    && <LancarResultados session={session} />}
          {currentTab === "historico"     && <Historico />}
          {currentTab === "imagiologia"   && <Imagiologia session={session} />}
          {currentTab === "farmacia"      && <Farmacia session={session} />}
          {currentTab === "medico"        && <Medico session={session} onNav={(t) => setTab(t as Tab)} />}
          {currentTab === "exames"        && <CadastrarExames />}
          {currentTab === "produtos"      && <GestaProdutos />}
          {currentTab === "faturacao"     && <Faturacao session={session} />}
          {currentTab === "contacorrente" && <ContaCorrente session={session} />}
          {currentTab === "funcionarios"  && <AdminFuncionarios session={session} />}
          {currentTab === "parceiros"     && <GestaParceiros session={session} />}
          {currentTab === "stock"         && <GestaStock />}
          {currentTab === "config"        && <Configuracoes />}
        </main>
      </div>
    </div>
  );
}

function getPortalMode(): "admin" | "parceiro" | "empresa" {
  const path = window.location.pathname;
  if (path.includes("/admin")) return "admin";
  if (path.includes("/parceiro")) return "parceiro";
  return "empresa";
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [checkingSession, setCheckingSession] = useState(true);
  const mode = getPortalMode();

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.auth.me().then((me) => {
        const s: Session = {
          role: me.role as any, empresaId: me.empresaId, empresaNome: me.empresaNome,
          username: me.username, funcao: me.funcao as any,
          funcionarioId: me.funcionarioId, funcionarioNome: me.funcionarioNome,
          parceiroId: me.parceiroId, parceiroNome: me.parceiroNome,
          parceiroInstituicao: me.parceiroInstituicao,
        };
        saveSession(s);
        setSession(s);
      }).catch(() => {
        api.setToken(null);
        saveSession(null);
        setSession(null);
      }).finally(() => setCheckingSession(false));
    } else {
      setCheckingSession(false);
    }
  }, []);

  const handleLogin = useCallback((s: Session) => { saveSession(s); setSession(s); }, []);
  const handleLogout = useCallback(async () => {
    await api.auth.logout().catch(() => {});
    api.setToken(null);
    saveSession(null);
    setSession(null);
  }, []);

  useEffect(() => {
    const onUnauth = () => {
      api.setToken(null);
      saveSession(null);
      setSession(null);
    };
    window.addEventListener("lab:unauthenticated", onUnauth);
    return () => window.removeEventListener("lab:unauthenticated", onUnauth);
  }, []);

  const fixedLogo = (
    <img src={logoImg} alt="Logo" style={{
      position: 'fixed', bottom: 18, right: 18, zIndex: 9999,
      height: 54, width: 'auto', opacity: 0.88, pointerEvents: 'none',
      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.22))',
    }} />
  );

  if (checkingSession) {
    return (
      <>
        {fixedLogo}
        <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--sidebar))" }}>
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-white/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/40 text-sm">A verificar sessão...</p>
          </div>
        </div>
      </>
    );
  }

  if (!session) {
    return <><Login onLogin={handleLogin} mode={mode} />{fixedLogo}</>;
  }

  if (session.role === "developer") {
    return <><AdminEmpresas onLogout={handleLogout} />{fixedLogo}</>;
  }

  if (session.role === "parceiro") {
    return <><PortalParceiro session={session} onLogout={handleLogout} />{fixedLogo}</>;
  }

  return (
    <AppProvider>
      <Shell session={session} onLogout={handleLogout} />
    </AppProvider>
  );
}
