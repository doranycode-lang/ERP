import React, { useState, useEffect } from "react";
import {
  Download,
  Smartphone,
  Laptop,
  CheckCircle2,
  WifiOff,
  Wifi,
  HardDrive,
  Share2,
  PlusSquare,
  ShieldCheck,
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
  Database
} from "lucide-react";
import {
  promptPWAInstall,
  isAppStandalone,
  downloadDesktopLauncher,
  getOfflineStorageStats,
} from "../../utils/pwaUtils";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
}) => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [storageStats, setStorageStats] = useState<{
    localStorageKb: number;
    cachesKb: number;
    totalProducts: number;
    totalInvoices: number;
  } | null>(null);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    setIsStandalone(isAppStandalone());

    // Detect user platform
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform("ios");
    } else if (/android/.test(ua)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    if (isOpen) {
      getOfflineStorageStats().then(setStorageStats);
    }
  }, [isOpen]);

  const handleInstallClick = async () => {
    const res = await promptPWAInstall();
    if (res.outcome === "accepted") {
      setInstallSuccess(true);
      setTimeout(() => {
        setIsStandalone(true);
        onClose();
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between border-b border-sky-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-400 flex items-center justify-center shadow-inner">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-wide">
                  Instalar Aplicação & Modo 100% Offline
                </h3>
                <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  PWA Nativo
                </span>
              </div>
              <p className="text-xs text-sky-200/80">
                Instale no computador ou telemóvel para acesso imediato sem internet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50">
          {/* Main Hero Callout */}
          <div className="bg-gradient-to-br from-sky-500 to-sky-700 text-white p-5 rounded-2xl shadow-md space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                  Requisito de Operação Local
                </span>
                <h4 className="text-base font-black">
                  Trabalhe Sempre, Mesmo Sem Sinal de Internet
                </h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-white" />
              </div>
            </div>

            <p className="text-xs text-sky-100 leading-relaxed">
              O sistema de facturação e estoque foi desenvolvido com tecnologia <b>Offline-First (PWA)</b>. 
              Ao instalar o aplicativo no seu dispositivo, todos os 999 produtos, lotes, clientes e faturas 
              funcionam em ecrã inteiro sem depender de conexões externas.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-5 py-2.5 bg-white hover:bg-sky-50 text-sky-900 rounded-xl text-xs font-black transition shadow-md flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-sky-600" />
                Instalar Aplicativo Oficial
              </button>

              <button
                type="button"
                onClick={() => downloadDesktopLauncher("Facturacao_Eletromedicina")}
                className="px-4 py-2.5 bg-sky-900/40 hover:bg-sky-900/60 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Laptop className="w-3.5 h-3.5" />
                Baixar Atalho de Ambiente de Trabalho (.url)
              </button>
            </div>
          </div>

          {/* Device Tabs for Step-by-Step Installation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-sky-600" />
                Instruções de Instalação por Dispositivo:
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPlatform("desktop")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    platform === "desktop"
                      ? "bg-white text-sky-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  💻 PC / Mac
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("android")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    platform === "android"
                      ? "bg-white text-sky-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🤖 Android
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("ios")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    platform === "ios"
                      ? "bg-white text-sky-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🍏 iPhone / iPad
                </button>
              </div>
            </div>

            {/* Desktop Instructions */}
            {platform === "desktop" && (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">No Google Chrome, Microsoft Edge ou Brave</span>
                    <span>Clique no ícone de <b>Instalar (⊕ ou 📥)</b> localizado no canto direito da barra de endereço URL do navegador.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">Confirme a Instalação</span>
                    <span>Clique em <b>"Instalar"</b>. O aplicativo abrirá imediatamente como um software nativo e criará um atalho no seu Ambiente de Trabalho.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Android Instructions */}
            {platform === "android" && (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">Abra no Google Chrome</span>
                    <span>Toque no botão de menu de <b>três pontinhos (⋮)</b> no canto superior direito do ecrã.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">Adicionar ao Ecrã Inicial</span>
                    <span>Selecione a opção <b>"Instalar aplicação"</b> ou <b>"Adicionar ao ecrã principal"</b>.</span>
                  </div>
                </div>
              </div>
            )}

            {/* iOS Instructions */}
            {platform === "ios" && (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-sky-600" />
                      Toque no botão Partilhar do Safari
                    </span>
                    <span>Na barra inferior do Safari no iPhone/iPad, toque no ícone de Partilhar (quadrado com seta a apontar para cima).</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <PlusSquare className="w-3.5 h-3.5 text-sky-600" />
                      Adicionar ao Ecrã Principal
                    </span>
                    <span>Role para baixo e selecione <b>"Adicionar ao Ecrã Principal"</b> ➔ Toque em <b>Adicionar</b>.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Offline Storage Status */}
          {storageStats && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-emerald-600" />
                  Estado do Armazenamento Local Seguro
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  100% Operacional Offline
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-sm font-black text-slate-900">
                    {storageStats.totalProducts}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">Produtos Locais</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-sm font-black text-slate-900">
                    {storageStats.totalInvoices}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">Facturas Emitidas</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-sm font-black text-slate-900">
                    {storageStats.localStorageKb} KB
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">Base de Dados</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-sm font-black text-emerald-600 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    Ativo
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">Service Worker</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Dados e configurações são preservados automaticamente no armazenamento do navegador.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
