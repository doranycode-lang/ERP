import { useState } from "react";

/* ─── Eva outline icons (inline SVG paths from source HTML) ─── */
const EvaShoppingBag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.12 6.71l-2.83-2.83A3 3 0 0 0 15.17 3H8.83a3 3 0 0 0-2.12.88L3.88 6.71A3 3 0 0 0 3 8.83V18a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8.83a3 3 0 0 0-.88-2.12zm-12-1.42A1.05 1.05 0 0 1 8.83 5h6.34a1.05 1.05 0 0 1 .71.29L17.59 7H6.41zM18 19H6a1 1 0 0 1-1-1V9h14v9a1 1 0 0 1-1 1z"/>
    <path d="M15 11a1 1 0 0 0-1 1 2 2 0 0 1-4 0 1 1 0 0 0-2 0 4 4 0 0 0 8 0 1 1 0 0 0-1-1z"/>
  </svg>
);

const EvaPeople = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0-6a2 2 0 1 1-2 2 2 2 0 0 1 2-2z"/>
    <path d="M17 13a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0-4a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"/>
    <path d="M21 20a1 1 0 0 1-2 0 4 4 0 0 0-8 0 1 1 0 0 1-2 0 6 6 0 0 1 3.92-5.6A5 5 0 0 1 4 19a1 1 0 0 1-2 0 7 7 0 0 1 14 0z"/>
  </svg>
);

const EvaBarChart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <rect x="2" y="10" width="4" height="11" rx="1"/>
    <rect x="9" y="6" width="4" height="15" rx="1"/>
    <rect x="16" y="2" width="4" height="19" rx="1"/>
  </svg>
);

const EvaSettings = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.9 12.66a1 1 0 0 1 0-1.32l1.28-1.44a1 1 0 0 0 .12-1.17l-2-3.46a1 1 0 0 0-1.07-.48l-1.88.38a1 1 0 0 1-1.15-.66l-.61-1.83a1 1 0 0 0-.95-.68h-4a1 1 0 0 0-1 .68l-.56 1.83a1 1 0 0 1-1.15.66L5 4.79a1 1 0 0 0-1 .48L2 8.73a1 1 0 0 0 .1 1.17l1.27 1.44a1 1 0 0 1 0 1.32L2.1 14.1a1 1 0 0 0-.1 1.17l2 3.46a1 1 0 0 0 1.07.48l1.88-.38a1 1 0 0 1 1.15.66l.61 1.83a1 1 0 0 0 1 .68h4a1 1 0 0 0 .95-.68l.61-1.83a1 1 0 0 1 1.15-.66l1.88.38a1 1 0 0 0 1.07-.48l2-3.46a1 1 0 0 0-.12-1.17zM12 15a3 3 0 1 1 3-3 3 3 0 0 1-3 3z"/>
  </svg>
);

const EvaFileText = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.71 4.29l-2-2A1 1 0 0 0 13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a1 1 0 0 0-.29-.71zM13 5.41L15.59 8H13zM18 20H6V4h5v5a1 1 0 0 0 1 1h6z"/>
    <path d="M8 12h8v2H8zm0 4h5v2H8z"/>
  </svg>
);

const EvaCash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12a2 2 0 1 0 2 2 2 2 0 0 0-2-2z"/>
    <path d="M20 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 11H4V9h16z"/>
    <circle cx="6" cy="12" r="1.5"/>
    <circle cx="18" cy="12" r="1.5"/>
  </svg>
);

const EvaLayers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.49 7.52a.34.34 0 0 0 0-.08.33.33 0 0 0 0-.08.29.29 0 0 0-.05-.07l-.06-.06a.31.31 0 0 0-.08-.05L12.5 3.23a.5.5 0 0 0-.5 0L4.16 7.18l-.06.06a.31.31 0 0 0-.05.07.36.36 0 0 0 0 .16v8.66a.5.5 0 0 0 .25.43l7.84 4.39a.5.5 0 0 0 .5 0l7.84-4.39a.5.5 0 0 0 .25-.43V7.52zM12 4.24l6.84 3.83L12 11.9 5.16 8.07zm-7 4.9l6.5 3.64v7.24L5 15.78zm7.5 10.88V12l6.5-3.64v7.46z"/>
  </svg>
);

const EvaShoppingCart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 7h-1.32l-1.28-4.29A1 1 0 0 0 18.44 2H5.56a1 1 0 0 0-1 .71L3.32 7H2a1 1 0 0 0 0 2h.67L4 17.29A2 2 0 0 0 6 19h12a2 2 0 0 0 2-1.71L21.33 9H22a1 1 0 0 0 0-2zm-4.12 0H6.12l1-3.33h9.76zM18 17H6l-1.2-8h14.4z"/>
    <circle cx="9" cy="21" r="1"/><circle cx="15" cy="21" r="1"/>
  </svg>
);

/* ─── Real tab data from HTML ─── */
const tabs = [
  {
    id: "backoffice",
    label: "Gestão",
    icon: (
      <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.40899 0H1.59084C0.713608 0 0 0.784967 0 1.74993V6.24989C0 7.21503 0.713608 8 1.59084 8H8.40899C9.28639 8 10 7.21503 10 6.24989V1.74993C10 0.784967 9.28639 0 8.40899 0Z" fill="#1577EB"/>
        <path d="M8.40899 10H1.59084C0.713608 10 0 10.7289 0 11.6251V21.3751C0 22.2711 0.713608 23 1.59084 23H8.40899C9.28639 23 10 22.2711 10 21.3751V11.6251C10 10.7289 9.28639 10 8.40899 10Z" fill="#9CBEE8"/>
        <path d="M21.4092 16H14.591C13.7136 16 13 16.6868 13 17.5313V21.4688C13 22.3132 13.7136 23 14.591 23H21.4092C22.2864 23 23 22.3132 23 21.4688V17.5313C23 16.6868 22.2864 16 21.4092 16Z" fill="#1577EB"/>
        <path d="M21.4092 0H14.591C13.7136 0 13 0.78497 13 1.74993V12.2499C13 13.215 13.7136 14 14.591 14H21.4092C22.2864 14 23 13.215 23 12.2499V1.74993C23 0.78497 22.2864 0 21.4092 0Z" fill="#9CBEE8"/>
      </svg>
    ),
  },
  {
    id: "go",
    label: "GO",
    icon: (
      <svg width="23" height="24" viewBox="0 0 23 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.226 2h14.548V1L21 0H2l2.226 1v1z" fill="#9CBEE8"/>
        <path d="M22.998 22.384L21.925 2H1.075L.002 22.384A1.54 1.54 0 001.546 24h19.908a1.54 1.54 0 001.544-1.616zM6.308 4.681c.39 0 .706.314.706.7 0 .22-.104.413-.262.541v4.364c0 2.6 2.13 4.716 4.748 4.716 2.618 0 4.748-2.116 4.748-4.716V5.922a.694.694 0 01-.262-.54c0-.387.316-.7.705-.7.39 0 .705.313.705.7 0 .219-.103.412-.262.54v4.567c0 3.202-2.527 5.808-5.634 5.808s-5.634-2.606-5.634-5.808V5.922a.694.694 0 01-.262-.54c0-.387.315-.7.705-.7z" fill="#2F8EFF"/>
      </svg>
    ),
  },
];

/* ─── Real backoffice menu items from source HTML ─── */
const backofficeItems = [
  {
    id: "products",
    label: "Produtos",
    icon: <EvaShoppingBag />,
    children: [
      { label: "Produtos", href: "/app/products/index/" },
      { label: "Análise de Stock", href: "/app/stock/" },
      { label: "Movimentos de Stock", href: "/app/stock/movements/" },
      { label: "Transferências", href: "/app/stock/transfers/" },
      { label: "Inventário", href: "/app/stock/inventory/" },
    ],
  },
  {
    id: "clients",
    label: "Clientes",
    icon: <EvaPeople />,
    children: [
      { label: "Clientes", href: "/app/clients/" },
      { label: "Grupos de Clientes", href: "/app/clients/groups/" },
      { label: "Cartões de Fidelidade", href: "/app/loyalty/" },
    ],
  },
  {
    id: "sales",
    label: "Vendas",
    icon: <EvaShoppingCart />,
    children: [
      { label: "Documentos de Venda", href: "/app/sales/" },
      { label: "Devoluções", href: "/app/sales/returns/" },
      { label: "Encomendas", href: "/app/orders/" },
    ],
  },
  {
    id: "finance",
    label: "Financeiro",
    icon: <EvaCash />,
    children: [
      { label: "Pagamentos", href: "/app/payments/" },
      { label: "Recibos", href: "/app/receipts/" },
      { label: "Contas Correntes", href: "/app/accounts/" },
    ],
  },
  {
    id: "reports",
    label: "Relatórios",
    icon: <EvaBarChart />,
    children: [
      { label: "Vendas", href: "/app/reports/sales/" },
      { label: "Stock", href: "/app/reports/stock/" },
      { label: "Clientes", href: "/app/reports/clients/" },
    ],
  },
  {
    id: "docs",
    label: "Documentos",
    icon: <EvaFileText />,
    children: [
      { label: "Facturas", href: "/app/invoices/" },
      { label: "Notas de Crédito", href: "/app/credit-notes/" },
    ],
  },
  {
    id: "catalog",
    label: "Catálogo",
    icon: <EvaLayers />,
    children: [
      { label: "Categorias", href: "/app/categories/" },
      { label: "Marcas", href: "/app/brands/" },
      { label: "Atributos", href: "/app/attributes/" },
    ],
  },
  {
    id: "settings",
    label: "Configurações",
    icon: <EvaSettings />,
    children: [],
  },
];

const menusByTab: Record<string, typeof backofficeItems> = {
  backoffice: backofficeItems,
  go: [
    { id: "go-sales", label: "Vendas GO", icon: <EvaShoppingCart />, children: [] },
    { id: "go-stock", label: "Stock GO", icon: <EvaLayers />, children: [] },
  ],
};

/* ─── Chevron icon ─── */
const Chevron = ({ open }: { open: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0, opacity: 0.45 }}
  >
    <path d="M12 15.5a1 1 0 0 1-.71-.29l-4-4a1 1 0 1 1 1.42-1.42L12 13.1l3.3-3.18a1 1 0 1 1 1.38 1.44l-4 3.86a1 1 0 0 1-.68.28z"/>
  </svg>
);

export function SidebarNav() {
  const [activeTab, setActiveTab] = useState("backoffice");
  const [activeItem, setActiveItem] = useState("products");
  const [expandedItem, setExpandedItem] = useState<string | null>("products");
  const [isOpen, setIsOpen] = useState(true);
  const [companyOpen, setCompanyOpen] = useState(false);

  const items = menusByTab[activeTab] ?? [];

  return (
    <div
      style={{ display: "flex", minHeight: "100vh", fontFamily: "'Roboto', sans-serif", fontSize: 14, lineHeight: "1.42857143" }}
      onClick={() => companyOpen && setCompanyOpen(false)}
    >
      {/* ── Left icon rail (menu3-tabs) ── */}
      <div
        style={{
          background: "#131924",
          width: 56,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 0,
          borderRight: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 0 12px" }}>
          <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4C11.163 4 4 11.163 4 20C4 28.837 11.163 36 20 36C24.117 36 27.876 34.456 30.716 31.892L27.138 28.314C25.218 30.016 22.726 31 20 31C13.925 31 9 26.075 9 20C9 13.925 13.925 9 20 9C22.726 9 25.218 9.984 27.138 11.686L30.716 8.108C27.876 5.544 24.117 4 20 4Z" fill="#0091DA"/>
            <path d="M36 20C36 24.117 34.456 27.876 31.892 30.716L28.314 27.138C30.016 25.218 31 22.726 31 20H36Z" fill="#0091DA"/>
          </svg>
        </div>

        {/* Tab list */}
        <ul style={{ listStyle: "none", margin: 0, padding: "4px 0", width: "100%" }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <li key={tab.id} style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  style={{
                    width: 44,
                    height: 48,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    borderRadius: 6,
                    cursor: "pointer",
                    border: "none",
                    background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
                    position: "relative",
                    transition: "background 0.15s",
                  }}
                >
                  {isActive && (
                    <span style={{
                      position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                      width: 3, height: 28, borderRadius: "0 3px 3px 0", background: "#1577EB",
                    }} />
                  )}
                  {tab.icon}
                  <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.02em", lineHeight: 1 }}>
                    {tab.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Main sidebar panel (menu3) ── */}
      <div
        style={{
          background: "#131924",
          width: isOpen ? 221 : 0,
          overflow: "hidden",
          transition: "width 250ms cubic-bezier(0.42, 0, 1, 1)",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: isOpen ? "1px solid rgba(255,255,255,0.07)" : "none",
        }}
      >
        <div style={{ width: 221, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

          {/* Company row (menu3-hulk-company) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              height: 65,
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              flexShrink: 0,
              position: "relative",
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setCompanyOpen(!companyOpen); }}
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
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 13, fontWeight: 500 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  ULTRACARDIO...
                </span>
                {/* eva-chevron-down */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#fff" style={{ flexShrink: 0, transition: "transform 0.2s", transform: companyOpen ? "rotate(180deg)" : "none" }}>
                  <path d="M12 15.5a1 1 0 0 1-.71-.29l-4-4a1 1 0 1 1 1.42-1.42L12 13.1l3.3-3.18a1 1 0 1 1 1.38 1.44l-4 3.86a1 1 0 0 1-.68.28z"/>
                </svg>
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                NIF: 5000809187
              </span>
            </button>

            {/* fa-bars / fa-angle-left toggle */}
            <button
              onClick={() => setIsOpen(false)}
              title="Fechar menu"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
                padding: "4px 6px",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
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
                {["ULTRACARDIO SP", "ULTRACARDIO RJ", "ULTRACARDIO MG"].map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setCompanyOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      padding: "9px 12px",
                      color: i === 0 ? "#1577EB" : "rgba(255,255,255,0.7)",
                      background: "transparent",
                      border: "none",
                      borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                      cursor: "pointer",
                      fontSize: 12,
                      textAlign: "left",
                      gap: 8,
                    }}
                  >
                    {i === 0 && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="#1577EB">
                        <circle cx="5" cy="5" r="5"/>
                      </svg>
                    )}
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Menu items (menu3-submenu) */}
          <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 0" }}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {items.map((item) => {
                const isActive = activeItem === item.id;
                const isExpanded = expandedItem === item.id;
                const hasChildren = item.children.length > 0;

                return (
                  <li key={item.id}>
                    {/* menu3-submenu-item */}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveItem(item.id);
                        if (hasChildren) setExpandedItem(isExpanded ? null : item.id);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 16px",
                        color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
                        textDecoration: "none",
                        fontSize: 13,
                        fontWeight: isActive ? 500 : 400,
                        background: isActive ? "rgba(21,119,235,0.12)" : "transparent",
                        borderLeft: isActive ? "3px solid #1577EB" : "3px solid transparent",
                        transition: "background 0.15s, color 0.15s",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ flexShrink: 0, display: "flex", color: isActive ? "#1577EB" : "rgba(255,255,255,0.4)" }}>
                        {item.icon}
                      </span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {hasChildren && <Chevron open={isExpanded} />}
                    </a>

                    {/* menu3-submenu-level */}
                    {hasChildren && isExpanded && (
                      <ul style={{ listStyle: "none", margin: 0, padding: "2px 0 4px 0", background: "rgba(0,0,0,0.15)" }}>
                        {item.children.map((child) => (
                          <li key={child.label}>
                            <a
                              href={child.href}
                              onClick={(e) => e.preventDefault()}
                              style={{
                                display: "block",
                                padding: "8px 16px 8px 50px",
                                color: "rgba(255,255,255,0.5)",
                                textDecoration: "none",
                                fontSize: 12,
                                transition: "color 0.15s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                            >
                              {child.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* ── Expand button when closed ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "absolute",
            left: 56,
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
        >
          <svg width="8" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
          </svg>
        </button>
      )}

      {/* ── Content area placeholder ── */}
      <div style={{ flex: 1, background: "#1a2436", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.12)" }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: 12 }}>
            <rect x="6" y="6" width="36" height="36" rx="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M6 18H42" stroke="currentColor" strokeWidth="2"/>
            <path d="M18 18V42" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <p style={{ fontSize: 12, margin: 0, fontFamily: "'Roboto', sans-serif" }}>Área de conteúdo</p>
        </div>
      </div>
    </div>
  );
}
