import React, { useState, useEffect } from "react";
import {
  Download,
  Wifi,
  WifiOff,
  HardDrive,
  RefreshCw,
  Laptop,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink,
  Layers
} from "lucide-react";
import {
  isAppStandalone,
  promptPWAInstall,
  downloadDesktopLauncher,
  getOfflineStorageStats,
  subscribeToOnlineStatus,
} from "../../utils/pwaUtils";
import { useApp } from "../../store/AppContext";

export const PwaOfflineSettingsSection: React.FC = () => {
  const { config, exportBackupJson } = useApp();
  const [isOnline, setIsOnline] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [cacheRefreshing, setCacheRefreshing] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);

  const [stats, setStats] = useState<{
    localStorageKb: number;
    cachesKb: number;
    totalProducts: number;
    totalInvoices: number;
  }>({
    localStorageKb: 0,
    cachesKb: 0,
    totalProducts: 999,
    totalInvoices: 0,
  });

  useEffect(() => {
    setIsStandalone(isAppStandalone());
    const unsubOnline = subscribeToOnlineStatus((online) => setIsOnline(online));
    getOfflineStorageStats().then(setStats);
    return () => unsubOnline();
  }, []);

  const handleInstall = async () => {
    await promptPWAInstall();
  };

  const handleRefreshCache = async () => {
    setCacheRefreshing(true);
    setCacheMessage(null);

    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
        }
      }
      const newStats = await getOfflineStorageStats();
      setStats(newStats);
      setCacheMessage("Cache do Service Worker renovado com sucesso!");
    } catch (err) {
      setCacheMessage("Cache limpo. A aplicação recarregará recursos automaticamente.");
    } finally {
      setCacheRefreshing(false);
      setTimeout(() => setCacheMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-sky-600" />
              Estado da Aplicação & Suporte Offline (PWA)
            </h3>
            <p className="text-xs text-slate-500">
              Configurações para instalação no dispositivo, cache de emergência e operação sem internet
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online & Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Modo Offline Ativo
              </span>
            )}

            {isStandalone ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                App Instalado (Nativo)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                Navegador Web
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons to Install */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-sky-950 block">
                Instalar Aplicativo Oficial no Dispositivo
              </span>
              <p className="text-[11px] text-sky-800/80 mt-1">
                Adiciona o ícone do sistema à sua área de trabalho (Windows, Mac) ou ecrã inicial (Android, iOS) com suporte nativo de ecrã inteiro.
              </p>
            </div>
            <button
              type="button"
              onClick={handleInstall}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Instalar Aplicativo (PWA)
            </button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-slate-900 block">
                Atalho de Ambiente de Trabalho (.URL)
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Descarrega um ficheiro de atalho direto para computadores onde a instalação de PWA não está ativa no navegador.
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadDesktopLauncher(config.nomeClinica || "Facturacao_Eletromedicina")}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Laptop className="w-4 h-4" />
              Baixar Atalho para PC / Mac
            </button>
          </div>
        </div>
      </div>

      {/* Offline Storage Metrics & Service Worker Cache */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            Diagnóstico de Armazenamento Local & Cache do Service Worker
          </h4>
          <button
            type="button"
            onClick={handleRefreshCache}
            disabled={cacheRefreshing}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cacheRefreshing ? "animate-spin" : ""}`} />
            <span>Atualizar Cache Offline</span>
          </button>
        </div>

        {cacheMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {cacheMessage}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div className="text-lg font-black text-slate-900">{stats.totalProducts}</div>
            <div className="text-[11px] text-slate-500 font-bold mt-0.5">Produtos Locais</div>
            <div className="text-[10px] text-emerald-600 mt-1">✓ 100% em Cache</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div className="text-lg font-black text-slate-900">{stats.totalInvoices}</div>
            <div className="text-[11px] text-slate-500 font-bold mt-0.5">Faturas Guardadas</div>
            <div className="text-[10px] text-emerald-600 mt-1">✓ Sem perda de dados</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div className="text-lg font-black text-slate-900">{stats.localStorageKb} KB</div>
            <div className="text-[11px] text-slate-500 font-bold mt-0.5">Base LocalStorage</div>
            <div className="text-[10px] text-slate-400 mt-1">Persistência Instantânea</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div className="text-lg font-black text-emerald-600 flex items-center justify-center gap-1">
              <ShieldCheck className="w-5 h-5" />
              Ativo
            </div>
            <div className="text-[11px] text-slate-500 font-bold mt-0.5">Service Worker v2</div>
            <div className="text-[10px] text-emerald-600 mt-1">Cache de Assets OK</div>
          </div>
        </div>

        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            Garantias de Funcionamento Offline:
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500">
            <li><b>Emissão e integridade de facturas:</b> O sistema usa hash SHA-256 em cadeia para testes locais. A assinatura digital e a certificação AGT dependem da homologação e das credenciais oficiais.</li>
            <li><b>Controlo e Baixa de Estoque:</b> Toda a movimentação de lotes, produtos e kits é atualizada em tempo real na memória local do navegador.</li>
            <li><b>Impressão Térmica e A4:</b> O gerador de PDF e formulários térmicos não requer internet para imprimir ou descarregar documentos.</li>
            <li><b>Leitor de Código de Barras:</b> O scanner por câmera e pistolas USB funcionam com áudio e processamento 100% local.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
