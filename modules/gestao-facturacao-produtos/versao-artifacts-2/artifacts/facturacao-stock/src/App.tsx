import React, { useState, useEffect } from "react";
import {
  ClerkProvider,
  RedirectToSignIn,
  Show,
  SignIn,
  SignUp,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Redirect, Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import { AppProvider, useApp } from "./store/AppContext";
import { Navbar, NavTab } from "./components/Navbar";
import { FaturacaoView } from "./views/FaturacaoView";
import { POSView } from "./views/POSView";
import { EstoqueView } from "./views/EstoqueView";
import { MovimentacoesView } from "./views/MovimentacoesView";
import { ValidadeAlertasView } from "./views/ValidadeAlertasView";
import { GraficosConsumoView } from "./views/GraficosConsumoView";
import { ClientesView } from "./views/ClientesView";
import { ConfiguracoesView } from "./views/ConfiguracoesView";
import { BarcodeScannerModal } from "./components/BarcodeScannerModal";
import { BarcodeLabelModal } from "./components/BarcodeLabelModal";
import { StockMovementModal } from "./components/StockMovementModal";
import { NotificationDrawer } from "./components/NotificationDrawer";
import { AuthPinModal } from "./components/auth/AuthPinModal";
import { UserSwitchModal } from "./components/auth/UserSwitchModal";
import { InstallAppModal } from "./components/pwa/InstallAppModal";
import { OfflineStatusBar } from "./components/pwa/OfflineStatusBar";
import { Produto, PacienteCliente } from "./types";
import { soundManager } from "./utils/barcodeUtils";
import { subscribeToInstallPrompt, isAppStandalone } from "./utils/pwaUtils";
import { Download, ShieldCheck } from "lucide-react";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.png`,
  },
  variables: {
    colorPrimary: "#0284c7",
    colorForeground: "#0f172a",
    colorMutedForeground: "#64748b",
    colorDanger: "#e11d48",
    colorBackground: "#ffffff",
    colorInput: "#f8fafc",
    colorInputForeground: "#0f172a",
    colorNeutral: "#cbd5e1",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.9rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-slate-950",
    headerSubtitle: "text-slate-500",
    socialButtonsBlockButtonText: "text-slate-800",
    formFieldLabel: "text-slate-700",
    footerActionLink: "text-sky-700",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-500",
    identityPreviewEditButton: "text-sky-700",
    formFieldSuccessText: "text-emerald-700",
    alertText: "text-rose-700",
    logoBox: "rounded-xl overflow-hidden",
    logoImage: "object-contain",
    socialButtonsBlockButton: "border-slate-200 bg-white hover:bg-slate-50",
    formButtonPrimary: "bg-sky-600 hover:bg-sky-700",
    formFieldInput: "border-slate-200 bg-slate-50 text-slate-900",
    footerAction: "bg-transparent",
    dividerLine: "bg-slate-200",
    alert: "bg-rose-50 border-rose-200",
    otpCodeFieldInput: "border-slate-200 bg-slate-50 text-slate-900",
    formFieldRow: "text-slate-900",
    main: "bg-transparent",
  },
};

const LandingPage: React.FC = () => {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_.9fr] gap-12 items-center">
        <div>
          <img src={`${basePath}/logo.png`} alt="NV Digital" className="w-28 h-28 rounded-3xl object-cover bg-white mb-8" />
          <p className="text-sky-300 text-sm font-bold uppercase tracking-[0.3em]">NV Digital · Gestão profissional</p>
          <h1 className="mt-4 text-4xl md:text-6xl font-black tracking-tight">Facturação e stock, com controlo real.</h1>
          <p className="mt-6 max-w-xl text-slate-300 text-lg leading-8">
            Gere facturas, clientes, lotes, validade e movimentos de stock num único espaço seguro.
          </p>
          <button
            type="button"
            onClick={() => setLocation("/sign-in")}
            className="mt-8 rounded-2xl bg-sky-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-400 transition"
          >
            Entrar no sistema
          </button>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="text-sm font-bold text-sky-300">Área protegida</div>
          <h2 className="mt-3 text-2xl font-black">Os seus dados ficam associados à sua conta.</h2>
          <p className="mt-4 text-slate-300 leading-7">
            A aplicação sincroniza os dados na base de dados e continua a permitir trabalho offline no dispositivo.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            {["Facturas", "Stock por lote", "Relatórios", "Cópias de segurança"].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-slate-200">{item}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SignInPage: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
    <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
  </div>
);

const SignUpPage: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
    <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
  </div>
);

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("pos");

  // Global Modals State
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerCustomCallback, setScannerCustomCallback] = useState<((p: Produto) => void) | null>(null);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementTargetProduct, setMovementTargetProduct] = useState<Produto | undefined>(undefined);

  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [labelTargetProduct, setLabelTargetProduct] = useState<Produto | null>(null);

  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState<PacienteCliente | null>(null);

  // RBAC & User Session Modals
  const [authPinModalOpen, setAuthPinModalOpen] = useState(false);
  const [userSwitchModalOpen, setUserSwitchModalOpen] = useState(false);
  const [targetTabPendingAuth, setTargetTabPendingAuth] = useState<NavTab | null>(null);

  // PWA & Offline Modal
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  const { produtos, config, currentUser } = useApp();

  useEffect(() => {
    const unsub = subscribeToInstallPrompt((state) => {
      setIsInstallable(state.isInstallable);
    });
    return () => unsub();
  }, []);

  // Listen for hardware USB barcode scanner keystrokes globally
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 150) {
        buffer = "";
      }
      lastKeyTime = now;

      if (e.key === "Enter") {
        if (buffer.length >= 3) {
          const barcode = buffer.trim();
          const found = produtos.find(
            (p) => p.codigoBarras === barcode || p.codigo === barcode
          );

          if (found) {
            if (config.sonsScanner) soundManager.playSuccessBeep();
            // If we are on Faturação, could pass it along; or open label/details
            if (activeTab !== "faturacao" && activeTab !== "pos") {
              setLabelTargetProduct(found);
              setLabelModalOpen(true);
            }
          } else {
            if (config.sonsScanner) soundManager.playErrorBeep();
          }
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [produtos, config.sonsScanner, activeTab]);

  const handleOpenScanner = (callback?: (p: Produto) => void) => {
    if (callback) {
      setScannerCustomCallback(() => callback);
    } else {
      setScannerCustomCallback(null);
    }
    setScannerOpen(true);
  };

  const handleScannerSelect = (p: Produto) => {
    if (scannerCustomCallback) {
      scannerCustomCallback(p);
    } else {
      // Default: Open Label Modal or Show info
      setLabelTargetProduct(p);
      setLabelModalOpen(true);
    }
    setScannerOpen(false);
  };

  const handleOpenMovement = (p?: Produto) => {
    setMovementTargetProduct(p);
    setMovementModalOpen(true);
  };

  const handleOpenLabel = (p: Produto) => {
    setLabelTargetProduct(p);
    setLabelModalOpen(true);
  };

  const handleFaturarCliente = (cliente: PacienteCliente) => {
    setSelectedClientForInvoice(cliente);
    setActiveTab("faturacao");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-sky-500 selection:text-white">
      {/* Offline Alert & Persistent PWA Install Requirement Banner */}
      <OfflineStatusBar onOpenInstallModal={() => setInstallModalOpen(true)} />

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenScanner={() => handleOpenScanner()}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenUserSwitch={() => setUserSwitchModalOpen(true)}
        onOpenInstallApp={() => setInstallModalOpen(true)}
        onOpenAdminAuth={(targetTab) => {
          setTargetTabPendingAuth(targetTab || "configuracoes");
          setAuthPinModalOpen(true);
        }}
      />

      {/* Main Views Container */}
      <main className="flex-1 w-full space-y-6 bg-[#eef3f8] p-4 sm:p-6 lg:ml-[190px] lg:p-6">
        {activeTab === "pos" && (
          <POSView onOpenScanner={handleOpenScanner} />
        )}

        {activeTab === "faturacao" && (
          <FaturacaoView
            onOpenScanner={handleOpenScanner}
            preselectedClient={selectedClientForInvoice}
            onClearPreselectedClient={() => setSelectedClientForInvoice(null)}
          />
        )}

        {activeTab === "estoque" && (
          <EstoqueView
            onOpenMovementModal={handleOpenMovement}
            onOpenLabelModal={handleOpenLabel}
            onOpenScanner={(cb) => handleOpenScanner(cb)}
          />
        )}

        {activeTab === "movimentacoes" && (
          <MovimentacoesView onOpenMovementModal={() => handleOpenMovement()} />
        )}

        {activeTab === "validade" && (
          <ValidadeAlertasView
            onOpenMovementModal={handleOpenMovement}
            onOpenLabelModal={handleOpenLabel}
          />
        )}

        {activeTab === "graficos" && <GraficosConsumoView />}

        {activeTab === "clientes" && (
          <ClientesView onFaturarCliente={handleFaturarCliente} />
        )}

        {activeTab === "configuracoes" && <ConfiguracoesView />}
      </main>

      {/* Footer with Offline & AGT Certification info */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 lg:ml-[190px]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <span>{config.nomeClinica} · Facturação & Gestão de Estoque</span>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              100% Offline-First
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Preparação para certificação AGT</span>
            <span>·</span>
            <button
              onClick={() => setInstallModalOpen(true)}
              className="text-sky-600 hover:text-sky-800 font-bold hover:underline flex items-center gap-1"
              title="Instalar Aplicação PWA"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar App (PWA)
            </button>
            <span>·</span>
            <span>v2.5.0 Pro</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        isInstallable={isInstallable}
      />
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSelectProduct={handleScannerSelect}
      />

      {movementModalOpen && (
        <StockMovementModal
          isOpen={movementModalOpen}
          onClose={() => setMovementModalOpen(false)}
          produto={movementTargetProduct}
        />
      )}

      {labelModalOpen && labelTargetProduct && (
        <BarcodeLabelModal
          isOpen={labelModalOpen}
          onClose={() => setLabelModalOpen(false)}
          produto={labelTargetProduct}
        />
      )}

      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab as NavTab);
          setNotificationsOpen(false);
        }}
      />

      {/* RBAC Modals */}
      <AuthPinModal
        isOpen={authPinModalOpen}
        onClose={() => {
          setAuthPinModalOpen(false);
          setTargetTabPendingAuth(null);
        }}
        onSuccess={() => {
          if (targetTabPendingAuth) {
            setActiveTab(targetTabPendingAuth);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          setTargetTabPendingAuth(null);
        }}
        title="Autenticação de Administrador"
        description="Aceder a 'Definições' e configurações fiscais/impressoras requer autorização de Administrador. Introduza o PIN de segurança para continuar."
      />

      <UserSwitchModal
        isOpen={userSwitchModalOpen}
        onClose={() => setUserSwitchModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProvider
        publishableKey={clerkPubKey}
        proxyUrl={clerkProxyUrl}
        appearance={clerkAppearance}
        signInUrl={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        routerPush={(to) => (window.location.href = to)}
        routerReplace={(to) => (window.location.replace(to))}
        localization={{
          signIn: { start: { title: "Entrar no sistema", subtitle: "Aceda à sua facturação e gestão de stock" } },
          signUp: { start: { title: "Criar acesso", subtitle: "Comece a gerir a sua operação com segurança" } },
        }}
      >
        <Switch>
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/app">
            <Show when="signed-in">
              <AppProvider>
                <MainContent />
              </AppProvider>
            </Show>
            <Show when="signed-out">
              <RedirectToSignIn />
            </Show>
          </Route>
          <Route path="/">
            <Show when="signed-in"><Redirect to="/app" /></Show>
            <Show when="signed-out"><LandingPage /></Show>
          </Route>
          <Route>
            <Show when="signed-out"><LandingPage /></Show>
            <Show when="signed-in"><Redirect to="/app" /></Show>
          </Route>
        </Switch>
      </ClerkProvider>
    </WouterRouter>
  );
}
