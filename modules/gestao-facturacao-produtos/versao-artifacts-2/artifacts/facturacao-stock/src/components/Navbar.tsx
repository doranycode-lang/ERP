import React, { useState, useEffect } from "react";
import { useApp } from "../store/AppContext";
import {
  FileText, Package, History, Clock, BarChart3, Users, Settings, ShoppingCart,
  QrCode, Bell, CheckCircle2, ShieldCheck, Sparkles, Lock,
  Download, Wifi, WifiOff
} from "lucide-react";
import { UserBadgeMenu } from "./auth/UserBadgeMenu";
import { subscribeToOnlineStatus, isAppStandalone } from "../utils/pwaUtils";

export type NavTab = "pos" | "faturacao" | "estoque" | "movimentacoes" | "validade" | "graficos" | "clientes" | "configuracoes";

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenScanner: () => void;
  onOpenNotifications: () => void;
  onOpenUserSwitch: () => void;
  onOpenAdminAuth: (targetTab?: NavTab) => void;
  onOpenInstallApp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenScanner,
  onOpenNotifications,
  onOpenUserSwitch,
  onOpenAdminAuth,
  onOpenInstallApp,
}) => {
  const { config, notificacoes, currentUser } = useApp();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    isAppStandalone();
    const unsub = subscribeToOnlineStatus((online) => setIsOnline(online));
    return () => unsub();
  }, []);

  const naoLidasCount = notificacoes.filter((n) => !n.lida).length;
  const expiradosCount = notificacoes.filter((n) => n.tipo === "validade_expirada").length;

  const handleTabClick = (tabId: NavTab) => {
    // Check permission for sensitive "configuracoes" tab
    if (tabId === "configuracoes" && currentUser.role !== "admin") {
      onOpenAdminAuth("configuracoes");
      return;
    }
    onTabChange(tabId);
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string; isRestricted?: boolean }[] = [
    {
      id: "pos",
      label: "Caixa POS",
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    {
      id: "faturacao",
      label: "Facturação",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "estoque",
      label: "Estoque",
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: "movimentacoes",
      label: "Movimentações",
      icon: <History className="w-4 h-4" />,
    },
    {
      id: "validade",
      label: "Validades",
      icon: <Clock className="w-4 h-4" />,
      badge: expiradosCount > 0 ? expiradosCount : undefined,
      badgeColor: "bg-rose-500 text-white",
    },
    {
      id: "graficos",
      label: "Gráficos de Consumo",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: "clientes",
      label: "Clientes",
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "configuracoes",
      label: "Definições",
      icon: <Settings className="w-4 h-4" />,
      isRestricted: currentUser.role !== "admin",
    },
  ];

  const sidebarItems = [
    { id: "pos" as NavTab, label: "Bem-vindo", icon: <Sparkles className="h-4 w-4" /> },
    { id: "graficos" as NavTab, label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "estoque" as NavTab, label: "Produtos", icon: <Package className="h-4 w-4" /> },
    { id: "faturacao" as NavTab, label: "Documentos", icon: <FileText className="h-4 w-4" /> },
    { id: "clientes" as NavTab, label: "Clientes", icon: <Users className="h-4 w-4" /> },
    { id: "movimentacoes" as NavTab, label: "Movimentos", icon: <History className="h-4 w-4" /> },
    { id: "validade" as NavTab, label: "Validades", icon: <Clock className="h-4 w-4" />, badge: expiradosCount || undefined },
    { id: "configuracoes" as NavTab, label: "Configuração", icon: <Settings className="h-4 w-4" />, restricted: currentUser.role !== "admin" },
  ];

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[190px] flex-col bg-[#111b2b] text-slate-300 shadow-xl lg:flex">
        <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="NV Digital" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-white">{config.nomeClinica}</p>
            <p className="truncate text-[9px] font-mono text-slate-500">NIF: {config.nif}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleTabClick(item.id)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition ${
                activeTab === item.id
                  ? "bg-[#1577eb] text-white shadow-sm"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
              data-testid={`nav-sidebar-${item.id}`}
            >
              <span className={activeTab === item.id ? "text-white" : "text-slate-500 group-hover:text-slate-300"}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && <span className="rounded-full bg-rose-500 px-1.5 text-[9px] font-black text-white">{item.badge}</span>}
              {item.restricted && <Lock className="h-3 w-3 text-amber-400" />}
            </button>
          ))}
          <div className="my-4 border-t border-white/10" />
          <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">Fiscal</p>
          <div className="space-y-1 px-3 text-[10px] text-slate-500">
            <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-sky-500" /> AGT em preparação</div>
            <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`} /> {isOnline ? "Online" : "Offline"}</div>
          </div>
        </nav>
        <button type="button" onClick={() => handleTabClick("configuracoes")} className="flex items-center gap-3 border-t border-white/10 px-5 py-4 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white">
          <Settings className="h-4 w-4" /> Definições
        </button>
      </aside>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white lg:ml-[190px]">
        <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-slate-900">
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="NV Digital" className="h-full w-full object-cover" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">NV Digital · Gestão</p>
              <h1 className="text-base font-black tracking-tight text-slate-900">{navItems.find((item) => item.id === activeTab)?.label || "Sistema"}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`hidden items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-bold sm:flex ${isOnline ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-amber-100 bg-amber-50 text-amber-700"}`}>
              {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {isOnline ? "Online" : "Offline"}
            </div>
            <button type="button" onClick={onOpenScanner} title="Scanner de código de barras" className="rounded-lg p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-sky-600">
              <QrCode className="h-4 w-4" />
            </button>
            <button type="button" onClick={onOpenNotifications} title="Notificações" className="relative rounded-lg p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-sky-600">
              <Bell className="h-4 w-4" />
              {naoLidasCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">{naoLidasCount > 9 ? "9+" : naoLidasCount}</span>}
            </button>
            {onOpenInstallApp && <button type="button" onClick={onOpenInstallApp} title="Instalar aplicação" className="hidden rounded-lg p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-sky-600 sm:block"><Download className="h-4 w-4" /></button>}
            <UserBadgeMenu onOpenSwitchModal={onOpenUserSwitch} onOpenAdminAuthModal={() => onOpenAdminAuth()} />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
          {sidebarItems.map((item) => (
            <button key={item.label} type="button" onClick={() => handleTabClick(item.id)} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold ${activeTab === item.id ? "bg-sky-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
      </header>
    </>
  );
};
