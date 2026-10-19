import React, { useState, useEffect } from "react";
import {
  WifiOff,
  Wifi,
  Download,
  CheckCircle2,
  HardDrive,
  Laptop,
  Smartphone,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import {
  subscribeToOnlineStatus,
  subscribeToInstallPrompt,
  promptPWAInstall,
  isAppStandalone,
} from "../../utils/pwaUtils";

interface OfflineStatusBarProps {
  onOpenInstallModal: () => void;
}

export const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({
  onOpenInstallModal,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [dismissBanner, setDismissBanner] = useState(false);

  useEffect(() => {
    const unsubOnline = subscribeToOnlineStatus((online) => setIsOnline(online));
    const unsubInstall = subscribeToInstallPrompt(({ isInstallable, isStandalone }) => {
      setIsInstallable(isInstallable);
      setIsStandalone(isStandalone);
    });

    setIsStandalone(isAppStandalone());

    return () => {
      unsubOnline();
      unsubInstall();
    };
  }, []);

  const handleQuickInstall = async () => {
    if (isInstallable) {
      const res = await promptPWAInstall();
      if (res.outcome !== "accepted") {
        onOpenInstallModal();
      }
    } else {
      onOpenInstallModal();
    }
  };

  return (
    <>
      {/* 1. Offline Mode Alert Banner (Highest Priority when disconnected) */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-bold transition-all border-b border-amber-600">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-extrabold uppercase tracking-wider text-[11px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded mr-2">
                  Modo Offline Ativo
                </span>
                <span className="text-slate-950 font-semibold">
                  Sem ligação à internet. Todas as operações de facturação, gestão de estoque e impressão térmica funcionam normalmente no dispositivo.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline text-[11px] bg-amber-600/30 px-2 py-1 rounded-lg border border-amber-600/40">
                💾 Armazenamento Local 100% Seguro
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Persistent PWA Install Requirement Banner (shown when running inside regular browser tab) */}
      {!isStandalone && !dismissBanner && (
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-sky-950 text-white px-4 py-2 text-xs border-b border-sky-800/40 shadow-inner">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center shrink-0">
                <Download className="w-3.5 h-3.5" />
              </div>
              <p className="truncate text-slate-200">
                <strong className="text-sky-400 mr-1.5">Instale o Aplicativo:</strong>
                Baixe para o seu computador ou telemóvel para ter acesso direto e funcionar sempre 100% offline.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleQuickInstall}
                className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-sky-500/30"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar App</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissBanner(true)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                title="Fechar aviso temporariamente"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
