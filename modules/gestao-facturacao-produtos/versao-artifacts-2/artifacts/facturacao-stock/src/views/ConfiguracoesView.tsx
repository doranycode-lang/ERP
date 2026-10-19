import React, { useState } from "react";
import { useApp } from "../store/AppContext";
import { ConfigSistema } from "../types";
import { soundManager } from "../utils/barcodeUtils";
import { ThermalPrinterProfilesSection } from "../components/config/ThermalPrinterProfilesSection";
import { AgtFiscalComplianceSection } from "../components/config/AgtFiscalComplianceSection";
import { UserManagementSection } from "../components/config/UserManagementSection";
import { PwaOfflineSettingsSection } from "../components/config/PwaOfflineSettingsSection";
import {
  Settings, Building2, Receipt, ShieldCheck, Database, Volume2, Image, X,
  Printer, Download, Upload, RotateCcw, Check, AlertTriangle,
  Sliders, Award, Sparkles, Layers, Users, WifiOff
} from "lucide-react";

type ConfigTab = "utilizadores" | "impressoras" | "fiscal" | "empresa" | "estoque" | "backup" | "pwa";

export const ConfiguracoesView: React.FC = () => {
  const { config, updateConfig, exportBackupJson, importBackupJson, resetToDefaults } = useApp();

  const [activeTab, setActiveTab] = useState<ConfigTab>("impressoras");
  const [formData, setFormData] = useState<ConfigSistema>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveEmpresa = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formData);
    setSavedSuccess(true);
    if (formData.sonsScanner) {
      soundManager.playSuccessBeep();
    }
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImportStatus("Seleccione um ficheiro de imagem válido.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImportStatus("O logótipo deve ter no máximo 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((current) => ({ ...current, logoDataUrl: String(reader.result) }));
      setImportStatus(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportBackupJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Backup_Facturacao_Stock_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackupJson(content);
        if (success) {
          setImportStatus("Base de dados restaurada com sucesso!");
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus("Erro ao importar ficheiro JSON. Formato inválido.");
        }
      }
    };
    reader.readAsText(file);
  };

  const perfisCount = config.perfisImpressoras?.length || 0;

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            ⚙️ Painel de Configurações do Sistema
          </h2>
          <p className="text-xs text-slate-500">
            Perfis de impressoras térmicas, conformidade fiscal AGT, identificação da empresa e cópias de segurança
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold animate-in fade-in shadow-sm">
            <Check className="w-4 h-4" />
            Configurações Guardadas!
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("utilizadores")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "utilizadores"
              ? "bg-white text-purple-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Users className="w-4 h-4 text-purple-600" />
          <span>Utilizadores & Acesso</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("impressoras")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "impressoras"
              ? "bg-white text-sky-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Impressoras Térmicas POS</span>
          <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded-full text-[10px] font-extrabold">
            {perfisCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("fiscal")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "fiscal"
              ? "bg-white text-sky-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Conformidade Fiscal AGT</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold">
            CERT
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("empresa")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "empresa"
              ? "bg-white text-sky-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Empresa & Facturação</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("estoque")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "estoque"
              ? "bg-white text-sky-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Settings className="w-4 h-4 text-purple-500" />
          <span>Estoque & Leitor de Barras</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pwa")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "pwa"
              ? "bg-white text-sky-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Download className="w-4 h-4 text-sky-600" />
          <span>Aplicação Offline & PWA</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold">
            100% OFF
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("backup")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "backup"
              ? "bg-white text-sky-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Database className="w-4 h-4 text-amber-500" />
          <span>Cópias de Segurança</span>
        </button>
      </div>

      {/* TAB 0: User Management & Access */}
      {activeTab === "utilizadores" && (
        <UserManagementSection />
      )}

      {/* TAB 1: Thermal Printer Profiles */}
      {activeTab === "impressoras" && (
        <ThermalPrinterProfilesSection
          config={config}
          onUpdateConfig={updateConfig}
        />
      )}

      {/* TAB 2: AGT Fiscal Parameters */}
      {activeTab === "fiscal" && (
        <AgtFiscalComplianceSection
          config={config}
          onUpdateConfig={updateConfig}
        />
      )}

      {/* TAB 3: Company & Invoicing */}
      {activeTab === "empresa" && (
        <form onSubmit={handleSaveEmpresa} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-sky-500" />
              Identificação da Empresa (Dados Fiscais AGT)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 rounded-2xl border border-dashed border-sky-300 bg-sky-50/60 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-28 h-28 shrink-0 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                    {formData.logoDataUrl ? (
                      <img src={formData.logoDataUrl} alt="Logótipo da empresa" className="max-w-full max-h-full object-contain p-2" />
                    ) : (
                      <Image className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-bold text-slate-900 mb-1 block">Logótipo da empresa</label>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Será exibido no cabeçalho das facturas A4, talões térmicos e PDFs. PNG transparente recomendado (máx. 2 MB).
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer transition">
                        <Image className="w-4 h-4" />
                        {formData.logoDataUrl ? "Substituir logótipo" : "Carregar logótipo"}
                        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} className="sr-only" />
                      </label>
                      {formData.logoDataUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData((current) => ({ ...current, logoDataUrl: undefined }))}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 text-xs font-bold transition"
                        >
                          <X className="w-4 h-4" /> Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Nome Comercial / Denominação</label>
                <input
                  type="text"
                  required
                  value={formData.nomeClinica}
                  onChange={(e) => setFormData((f) => ({ ...f, nomeClinica: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">NIF da Empresa *</label>
                <input
                  type="text"
                  required
                  value={formData.nif}
                  onChange={(e) => setFormData((f) => ({ ...f, nif: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-700 mb-1 block">Endereço Completo</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData((f) => ({ ...f, endereco: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Telefone(s)</label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData((f) => ({ ...f, telefone: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Receipt className="w-4 h-4 text-emerald-500" />
              Parâmetros de Facturação e Coordenadas Bancárias
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Série de Facturação</label>
                <input
                  type="text"
                  value={formData.serie}
                  onChange={(e) => setFormData((f) => ({ ...f, serie: e.target.value.toUpperCase() }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-sky-500 uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Moeda Principal</label>
                <select
                  value={formData.moeda}
                  onChange={(e) => setFormData((f) => ({ ...f, moeda: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-bold focus:outline-none focus:border-sky-500"
                >
                  <option value="AOA">Kwanza Angolano (AOA)</option>
                  <option value="USD">Dólar Americano (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Taxa de IVA Padrão (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.ivaTaxa}
                  onChange={(e) => setFormData((f) => ({ ...f, ivaTaxa: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Regime Fiscal de IVA</label>
                <select
                  value={formData.regimeIva || "Regime Geral"}
                  onChange={(e) => setFormData((f) => ({ ...f, regimeIva: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Regime Geral">Regime Geral (14%)</option>
                  <option value="Regime Simplificado">Regime Simplificado (7%)</option>
                  <option value="Regime de Exclusão">Regime de Exclusão</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Banco Principal</label>
                <input
                  type="text"
                  value={formData.bancoNome || ""}
                  onChange={(e) => setFormData((f) => ({ ...f, bancoNome: e.target.value }))}
                  placeholder="Ex: Banco BAI, BFA, BIC..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">IBAN de Pagamento</label>
                <input
                  type="text"
                  value={formData.bancoIban || ""}
                  onChange={(e) => setFormData((f) => ({ ...f, bancoIban: e.target.value }))}
                  placeholder="AO06.0040.0000.xxxx.xxxx.xxxx.x"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-xl text-sm font-bold transition shadow-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Guardar Identificação & Facturação
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: Stock & Scanner Preferences */}
      {activeTab === "estoque" && (
        <form onSubmit={handleSaveEmpresa} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Settings className="w-4 h-4 text-purple-500" />
              Preferências de Validade, Alertas e Leitor de Barras
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Alerta de Validade Antecipada (Dias antes de expirar)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={formData.alertaDiasValidade}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, alertaDiasValidade: parseInt(e.target.value) || 30 }))
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Gera alertas amarelos e notificações na barra superior para lotes nesta margem.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Formato de Impressão Padrão</label>
                <select
                  value={formData.formatoImpressaoPadrao}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, formatoImpressaoPadrao: e.target.value as any }))
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium focus:outline-none focus:border-sky-500"
                >
                  <option value="a4">Folha A4 Completa (Oficial com Timbre)</option>
                  <option value="termica">Talão Térmico 80mm (POS / Impressora Térmica)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sonsScanner}
                  onChange={(e) => setFormData((f) => ({ ...f, sonsScanner: e.target.checked }))}
                  className="w-4 h-4 rounded text-sky-500 accent-sky-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Sons de Bip no Leitor de Código de Barras</span>
                  <span className="text-[10px] text-slate-500">Feedback sonoro ao ler com pistola USB ou câmera</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.alertaStockBaixo}
                  onChange={(e) => setFormData((f) => ({ ...f, alertaStockBaixo: e.target.checked }))}
                  className="w-4 h-4 rounded text-sky-500 accent-sky-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Alertas de Stock Mínimo</span>
                  <span className="text-[10px] text-slate-500">Avisar quando produtos atingirem limite de reposição</span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-xl text-sm font-bold transition shadow-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Guardar Preferências
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: Backup & Security */}
      {activeTab === "backup" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Database className="w-4 h-4 text-amber-500" />
            Cópias de Segurança e Restauro de Dados
          </h3>

          {importStatus && (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-800">
              {importStatus}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-xs text-slate-900">Exportar Backup Completo</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Descarrega um ficheiro JSON com todas as facturas, produtos, lotes, perfis de impressoras e histórico de movimentos.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" />
                Descarregar Backup (.JSON)
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-xs text-slate-900">Restaurar de Ficheiro</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Carregue um ficheiro de backup previamente exportado para recuperar toda a base de dados.
                </p>
              </div>
              <label className="w-full py-2 bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer text-center">
                <Upload className="w-4 h-4" />
                <span>Importar Backup JSON</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-xs text-rose-900">Repor Dados de Demonstração</h4>
                <p className="text-[11px] text-rose-700 mt-1">
                  Restaura os dados originais com exemplos de facturas, lotes a expirar e produtos farmacêuticos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Tem a certeza que deseja repor os dados padrão? Todos os dados atuais serão substituídos.")) {
                    resetToDefaults();
                  }
                }}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-4 h-4" />
                Repor Dados Padrão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PWA & Offline Engine */}
      {activeTab === "pwa" && (
        <PwaOfflineSettingsSection />
      )}
    </div>
  );
};
