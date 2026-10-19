import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetSettings } from "@workspace/api-client-react";

/* ── SVG Icons (matching the mockup exactly) ── */
const IconGestao = () => (
  <svg width="20" height="20" viewBox="0 0 23 23" fill="none">
    <path d="M8.40899 0H1.59084C0.713608 0 0 0.784967 0 1.74993V6.24989C0 7.21503 0.713608 8 1.59084 8H8.40899C9.28639 8 10 7.21503 10 6.24989V1.74993C10 0.784967 9.28639 0 8.40899 0Z" fill="#1577EB"/>
    <path d="M8.40899 10H1.59084C0.713608 10 0 10.7289 0 11.6251V21.3751C0 22.2711 0.713608 23 1.59084 23H8.40899C9.28639 23 10 22.2711 10 21.3751V11.6251C10 10.7289 9.28639 10 8.40899 10Z" fill="#9CBEE8"/>
    <path d="M21.4092 16H14.591C13.7136 16 13 16.6868 13 17.5313V21.4688C13 22.3132 13.7136 23 14.591 23H21.4092C22.2864 23 23 22.3132 23 21.4688V17.5313C23 16.6868 22.2864 16 21.4092 16Z" fill="#1577EB"/>
    <path d="M21.4092 0H14.591C13.7136 0 13 0.78497 13 1.74993V12.2499C13 13.215 13.7136 14 14.591 14H21.4092C22.2864 14 23 13.215 23 12.2499V1.74993C23 0.78497 22.2864 0 21.4092 0Z" fill="#9CBEE8"/>
  </svg>
);

const IconLab = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 3v10.55A4 4 0 1 0 15 13.55V3H9zm4 0v2H11V3h2zm0 4H11V5h2v2zm1.5 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
    <path d="M7 2v1H5v2h2v8.81A6 6 0 1 0 19 13.81V5h2V3h-2V2H7zm10 12.5a4 4 0 1 1-8 0V5h8v9.5z" opacity=".3"/>
  </svg>
);

const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 13h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1zm-1 7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v4zm10 0a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v7zm1-10h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1z"/>
  </svg>
);

const IconDocs = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.71 4.29l-2-2A1 1 0 0 0 13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a1 1 0 0 0-.29-.71zM13 5.41L15.59 8H13zM18 20H6V4h5v5a1 1 0 0 0 1 1h6z"/>
    <path d="M8 12h8v2H8zm0 4h5v2H8z"/>
  </svg>
);

const IconProducts = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.12 6.71l-2.83-2.83A3 3 0 0 0 15.17 3H8.83a3 3 0 0 0-2.12.88L3.88 6.71A3 3 0 0 0 3 8.83V18a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8.83a3 3 0 0 0-.88-2.12zm-12-1.42A1.05 1.05 0 0 1 8.83 5h6.34a1.05 1.05 0 0 1 .71.29L17.59 7H6.41zM18 19H6a1 1 0 0 1-1-1V9h14v9a1 1 0 0 1-1 1z"/>
    <path d="M15 11a1 1 0 0 0-1 1 2 2 0 0 1-4 0 1 1 0 0 0-2 0 4 4 0 0 0 8 0 1 1 0 0 0-1-1z"/>
  </svg>
);

const IconClients = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.9 12.66a1 1 0 0 1 0-1.32l1.28-1.44a1 1 0 0 0 .12-1.17l-2-3.46a1 1 0 0 0-1.07-.48l-1.88.38a1 1 0 0 1-1.15-.66l-.61-1.83a1 1 0 0 0-.95-.68h-4a1 1 0 0 0-1 .68l-.56 1.83a1 1 0 0 1-1.15.66L5 4.79a1 1 0 0 0-1 .48L2 8.73a1 1 0 0 0 .1 1.17l1.27 1.44a1 1 0 0 1 0 1.32L2.1 14.1a1 1 0 0 0-.1 1.17l2 3.46a1 1 0 0 0 1.07.48l1.88-.38a1 1 0 0 1 1.15.66l.61 1.83a1 1 0 0 0 1 .68h4a1 1 0 0 0 .95-.68l.61-1.83a1 1 0 0 1 1.15-.66l1.88.38a1 1 0 0 0 1.07-.48l2-3.46a1 1 0 0 0-.12-1.17zM12 15a3 3 0 1 1 3-3 3 3 0 0 1-3 3z"/>
  </svg>
);

const IconPacientes = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8V21h19.2v-1.8c0-3.2-6.4-4.8-9.6-4.8z"/>
  </svg>
);

const IconResultados = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/>
  </svg>
);

const IconExames = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 3v10.55A4 4 0 1 0 15 13.55V3H9zm4 2h-2V3h2v2zm0 2h-2V7h2v2zm2.5 11a2.5 2.5 0 1 1 2.5-2.5 2.5 2.5 0 0 1-2.5 2.5z"/>
  </svg>
);

const IconReagentes = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 3H4v2l4.86 4.86A2 2 0 0 1 9.5 11.41V20h5v-8.59a2 2 0 0 1 .64-1.55L20 5V3zm-5 9.41V20h-2v-7.59a4 4 0 0 0-1.17-2.83L7.9 5h8.2l-3.93 3.93A4 4 0 0 0 15 12.41z"/>
  </svg>
);

const ChevronDown = ({ open }: { open: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{
      transition: "transform 0.2s",
      transform: open ? "rotate(180deg)" : "none",
      flexShrink: 0,
      opacity: 0.45,
    }}
  >
    <path d="M12 15.5a1 1 0 0 1-.71-.29l-4-4a1 1 0 1 1 1.42-1.42L12 13.1l3.3-3.18a1 1 0 1 1 1.38 1.44l-4 3.86a1 1 0 0 1-.68.28z"/>
  </svg>
);

type Section = "gestao" | "lab";

interface NavChild {
  label: string;
  href: string;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: NavChild[];
}

const GESTAO_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: <IconDashboard /> },
  {
    id: "documentos",
    label: "Documentos",
    href: "/documentos",
    icon: <IconDocs />,
    children: [
      { label: "Todos os Documentos", href: "/documentos" },
      { label: "Novo Documento", href: "/documentos/novo" },
      { label: "Facturas", href: "/documentos/faturacao" },
      { label: "Transporte", href: "/documentos/transporte" },
      { label: "Avenças", href: "/documentos/avencas" },
      { label: "Formação", href: "/documentos/formacao" },
      { label: "Faturas por Liquidar", href: "/documentos/liquidar" },
    ],
  },
  {
    id: "produtos",
    label: "Produtos / Exames",
    href: "/produtos",
    icon: <IconProducts />,
    children: [
      { label: "Produtos e Serviços", href: "/produtos" },
      { label: "Análise de Stock", href: "/produtos/stock" },
      { label: "Movimentos de Stock", href: "/produtos/movimentos" },
    ],
  },
  {
    id: "clientes",
    label: "Clientes / Pacientes",
    href: "/clientes",
    icon: <IconClients />,
    children: [
      { label: "Clientes", href: "/clientes" },
      { label: "Conta Corrente", href: "/documentos/conta-corrente" },
    ],
  },
  { id: "configuracoes", label: "Configurações", href: "/configuracoes", icon: <IconSettings /> },
];

const LAB_NAV: NavItem[] = [
  { id: "lab-dashboard", label: "Dashboard do Laboratório", href: "/lab/dashboard", icon: <IconDashboard /> },
  { id: "pacientes", label: "Pacientes", href: "/lab/pacientes", icon: <IconPacientes /> },
  {
    id: "resultados",
    label: "Resultados",
    href: "/lab/resultados",
    icon: <IconResultados />,
    children: [
      { label: "Lançar Resultados", href: "/lab/lancamento" },
      { label: "Histórico / PDF", href: "/lab/historico" },
    ],
  },
  {
    id: "exames",
    label: "Exames e Produtos",
    href: "/lab/exames",
    icon: <IconExames />,
    children: [
      { label: "Catálogo de Exames", href: "/lab/exames" },
      { label: "Gestão de Produtos", href: "/lab/produtos" },
      { label: "Gestão de Reagentes", href: "/lab/reagentes" },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    href: "/lab/financeiro",
    icon: <IconDocs />,
    children: [
      { label: "Visão financeira", href: "/lab/financeiro" },
      { label: "Conta corrente", href: "/lab/conta-corrente" },
    ],
  },
  {
    id: "operacao",
    label: "Operação",
    href: "/lab/funcionarios",
    icon: <IconClients />,
    children: [
      { label: "Funcionários", href: "/lab/funcionarios" },
      { label: "Portal parceiro", href: "/lab/portal-parceiro" },
    ],
  },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const routeLocation = location.split("?")[0];
  const { data: settings } = useGetSettings();
  const [isOpen, setIsOpen] = useState(true);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const inLab = routeLocation.startsWith("/lab");
  const [activeSection, setActiveSection] = useState<Section>(inLab ? "lab" : "gestao");
  const navItems = activeSection === "gestao" ? GESTAO_NAV : LAB_NAV;

  useEffect(() => {
    if (routeLocation === "/documentos/novo") setIsOpen(false);
  }, [routeLocation]);

  function isActive(item: NavItem) {
    return routeLocation === item.href || routeLocation.startsWith(item.href + "/") ||
      (item.children?.some((c) => routeLocation === c.href || routeLocation.startsWith(c.href + "/")));
  }

  function handleTabSwitch(section: Section) {
    setActiveSection(section);
    setExpandedItem(null);
    if (section === "lab") setLocation("/lab/pacientes");
    else setLocation("/dashboard");
  }

  const RAIL_BG = "#131924";
  const PANEL_BG = "#131924";
  const BORDER = "rgba(255,255,255,0.07)";
  const ACTIVE_BG = "rgba(21,119,235,0.12)";
  const ACTIVE_COLOR = "#1577EB";
  const TEXT_DIM = "rgba(255,255,255,0.55)";
  const TEXT_BRIGHT = "#fff";
  const SUBMENU_BG = "rgba(0,0,0,0.15)";

  const LAB_ACTIVE_BG = "rgba(0,188,212,0.10)";
  const LAB_ACTIVE_COLOR = "#00BCD4";

  const activeBg = activeSection === "lab" ? LAB_ACTIVE_BG : ACTIVE_BG;
  const activeColor = activeSection === "lab" ? LAB_ACTIVE_COLOR : ACTIVE_COLOR;

  return (
    <div className="erp-sidebar" style={{ display: "flex", height: "100%", fontFamily: "'Inter', 'Roboto', sans-serif" }} onClick={() => companyOpen && setCompanyOpen(false)}>

      {/* ── Icon Rail ── */}
      <div style={{
        background: RAIL_BG,
        width: 56,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 0,
        borderRight: `1px solid ${BORDER}`,
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 0 12px" }}>
          <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
            <path d="M20 4C11.163 4 4 11.163 4 20C4 28.837 11.163 36 20 36C24.117 36 27.876 34.456 30.716 31.892L27.138 28.314C25.218 30.016 22.726 31 20 31C13.925 31 9 26.075 9 20C9 13.925 13.925 9 20 9C22.726 9 25.218 9.984 27.138 11.686L30.716 8.108C27.876 5.544 24.117 4 20 4Z" fill="#0091DA"/>
            <path d="M36 20C36 24.117 34.456 27.876 31.892 30.716L28.314 27.138C30.016 25.218 31 22.726 31 20H36Z" fill="#0091DA"/>
          </svg>
        </div>

        {/* Section tabs */}
        {(["gestao", "lab"] as Section[]).map((section) => {
          const isTabActive = activeSection === section;
          const tabColor = section === "lab" ? LAB_ACTIVE_COLOR : ACTIVE_COLOR;
          return (
            <button
              key={section}
              onClick={() => handleTabSwitch(section)}
              title={section === "gestao" ? "Gestão" : "Lab"}
              style={{
                width: 44,
                height: 52,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                borderRadius: 6,
                cursor: "pointer",
                border: "none",
                background: isTabActive ? "rgba(255,255,255,0.08)" : "transparent",
                color: isTabActive ? "#fff" : "rgba(255,255,255,0.4)",
                position: "relative",
                transition: "background 0.15s, color 0.15s",
                marginBottom: 4,
              }}
            >
              {isTabActive && (
                <span style={{
                  position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                  width: 3, height: 28, borderRadius: "0 3px 3px 0", background: tabColor,
                }} />
              )}
              {section === "gestao" ? <IconGestao /> : <IconLab />}
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.03em", lineHeight: 1, color: isTabActive ? tabColor : "rgba(255,255,255,0.4)" }}>
                {section === "gestao" ? "GESTÃO" : "LAB"}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Main Sidebar Panel ── */}
      <div style={{
        background: PANEL_BG,
        width: isOpen ? 221 : 0,
        overflow: "hidden",
        transition: "width 250ms cubic-bezier(0.42, 0, 1, 1)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: isOpen ? `1px solid ${BORDER}` : "none",
      }}>
        <div style={{ width: 221, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

          {/* Company header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              height: 65,
              borderBottom: `1px solid ${BORDER}`,
              flexShrink: 0,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setCompanyOpen(!companyOpen)}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                textAlign: "left",
                overflow: "hidden",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: TEXT_BRIGHT, fontSize: 13, fontWeight: 500 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                  {settings?.companyName || "A carregar..."}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#fff" style={{ flexShrink: 0, transition: "transform 0.2s", transform: companyOpen ? "rotate(180deg)" : "none" }}>
                  <path d="M12 15.5a1 1 0 0 1-.71-.29l-4-4a1 1 0 1 1 1.42-1.42L12 13.1l3.3-3.18a1 1 0 1 1 1.38 1.44l-4 3.86a1 1 0 0 1-.68.28z"/>
                </svg>
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                NIF: {settings?.nif || "..."}
              </span>
            </button>

            <button
              onClick={() => setIsOpen(false)}
              title="Recolher menu"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.45)",
                padding: "4px 6px",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/>
              </svg>
            </button>

            {/* Company dropdown */}
            {companyOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 2px)",
                  left: 8,
                  right: 8,
                  background: "#1e2b40",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  zIndex: 50,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {[settings?.companyName || "ULTRACARDIO"].map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setCompanyOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      padding: "10px 12px",
                      color: ACTIVE_COLOR,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      textAlign: "left",
                      gap: 8,
                    }}
                  >
                    <svg width="8" height="8" viewBox="0 0 10 10" fill={ACTIVE_COLOR}>
                      <circle cx="5" cy="5" r="5"/>
                    </svg>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 0" }}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {navItems.map((item) => {
                const active = isActive(item);
                const expanded = expandedItem === item.id;
                const hasChildren = !!(item.children && item.children.length > 0);

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        if (hasChildren) {
                          e.preventDefault();
                          setExpandedItem(expanded ? null : item.id);
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 16px",
                        color: active ? TEXT_BRIGHT : TEXT_DIM,
                        textDecoration: "none",
                        fontSize: 13,
                        fontWeight: active ? 500 : 400,
                        background: active ? activeBg : "transparent",
                        borderLeft: active ? `3px solid ${activeColor}` : "3px solid transparent",
                        transition: "background 0.15s, color 0.15s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = TEXT_BRIGHT; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = TEXT_DIM; }}
                    >
                      <span style={{ flexShrink: 0, display: "flex", color: active ? activeColor : "rgba(255,255,255,0.38)" }}>
                        {item.icon}
                      </span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {hasChildren && <ChevronDown open={expanded} />}
                    </Link>

                    {/* Sub-items */}
                    {hasChildren && expanded && (
                      <ul style={{ listStyle: "none", margin: 0, padding: "2px 0 4px 0", background: SUBMENU_BG }}>
                        {item.children!.map((child) => {
                          const childActive = routeLocation === child.href;
                          return (
                            <li key={child.label}>
                              <Link
                                href={child.href}
                                style={{
                                  display: "block",
                                  padding: "8px 16px 8px 50px",
                                  color: childActive ? TEXT_BRIGHT : "rgba(255,255,255,0.5)",
                                  textDecoration: "none",
                                  fontSize: 12,
                                  fontWeight: childActive ? 500 : 400,
                                  transition: "color 0.15s",
                                  borderLeft: childActive ? `3px solid ${activeColor}` : "3px solid transparent",
                                  background: childActive ? activeBg : "transparent",
                                }}
                                onMouseEnter={(e) => { if (!childActive) e.currentTarget.style.color = TEXT_BRIGHT; }}
                                onMouseLeave={(e) => { if (!childActive) e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* ── Expand button when collapsed ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "absolute",
            left: 57,
            top: "50%",
            transform: "translateY(-50%)",
            width: 16,
            height: 40,
            background: "#1e2b40",
            border: "1px solid rgba(255,255,255,0.1)",
            borderLeft: "none",
            borderRadius: "0 6px 6px 0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.5)",
            zIndex: 5,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
        >
          <svg width="8" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
          </svg>
        </button>
      )}
    </div>
  );
}
