import React, { useState } from "react";
import { ConfigSistema, ConfiguracaoFiscalAGT } from "../../types";
import { useApp } from "../../store/AppContext";
import { generateSaftAoXml } from "../../utils/saftGenerator";
import {
  ShieldCheck, Award, FileCode, CheckCircle2, AlertCircle,
  Download, Eye, Copy, RefreshCw, Check, Building2, Hash, Terminal,
  HelpCircle, ExternalLink
} from "lucide-react";

interface AgtFiscalComplianceSectionProps {
  config: ConfigSistema;
  onUpdateConfig: (newConfig: Partial<ConfigSistema>) => void;
}

const MOTIVOS_ISENCAO_AGT = [
  { codigo: "M02", descricao: "M02 - Artigo 12.º alínea a) do CIVA (Medicamentos e Produtos Farmacêuticos)" },
  { codigo: "M04", descricao: "M04 - Isenção bens de primeira necessidade (Cesta Básica)" },
  { codigo: "M05", descricao: "M05 - Isenção de transmissões de bens e serviços de saúde" },
  { codigo: "M10", descricao: "M10 - Regime de Exclusão (Artigo 2.º do CIVA)" },
  { codigo: "M11", descricao: "M11 - Regime Simplificado (Artigo 53.º do CIVA)" },
  { codigo: "M16", descricao: "M16 - Isenção nos termos de acordos ou tratados internacionais" },
  { codigo: "M99", descricao: "M99 - Outras isenções previstas na lei fiscal angolana" },
];

export const AgtFiscalComplianceSection: React.FC<AgtFiscalComplianceSectionProps> = ({
  config,
  onUpdateConfig,
}) => {
  const { faturas, produtos, pacientes } = useApp();

  const fiscalData: ConfiguracaoFiscalAGT = config.configuracaoFiscal || {
    softwareCertificadoNumero: "PENDENTE_AGT",
    softwareVersao: "v2.5.0-PRO",
    softwareNome: "PharmaStock Fiscal Core",
    chaveVersao: "1.0",
    regimeIva: config.regimeIva || "Regime Geral",
    motivoIsencaoPadrao: "M02 - Artigo 12.º alínea a) do CIVA (Medicamentos e Produtos Farmacêuticos)",
    terminalCaixa: "POS-01",
    incluirMencaoDispensaAGT: true,
    exigirNifObrigatorioAcimaDe: 500000,
    validarHashAssinatura: true,
    comunicacaoSaftAtiva: false,
    emailContabilidadeSaft: "fiscal.angola@central-angola.ao",
    codigoValidacaoHash: "",
  };

  const [formData, setFormData] = useState<ConfiguracaoFiscalAGT>({ ...fiscalData });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showSaftModal, setShowSaftModal] = useState(false);
  const [saftXmlContent, setSaftXmlContent] = useState<string>("");
  const [copiedSaft, setCopiedSaft] = useState(false);

  const handleSaveFiscal = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      configuracaoFiscal: formData,
      regimeIva: formData.regimeIva,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleGenerateSaft = () => {
    const xml = generateSaftAoXml(faturas, produtos, pacientes, config, formData);
    setSaftXmlContent(xml);
    setShowSaftModal(true);
  };

  const handleDownloadSaftFile = () => {
    const xml = generateSaftAoXml(faturas, produtos, pacientes, config, formData);
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "_");
    link.download = `SAF-T_AO_${config.nif || "5417082910"}_${yearMonth}.xml`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(saftXmlContent);
    setCopiedSaft(true);
    setTimeout(() => setCopiedSaft(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner: AGT Compliance Status */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                EM PREPARAÇÃO PARA HOMOLOGAÇÃO
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Dec. Presidencial n.º 292/18
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-white">
              Parâmetros de Certificação Fiscal & Comunicação AGT
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl">
              Configuração fiscal, integridade dos documentos e exportação SAF-T (AO). O número de certificado e a assinatura oficial só devem ser preenchidos após validação da AGT.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handleGenerateSaft}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              <FileCode className="w-4 h-4" />
              Auditoria SAF-T (AO)
            </button>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          Parâmetros fiscais AGT atualizados com sucesso!
        </div>
      )}

      {/* Main Fiscal Settings Form */}
      <form onSubmit={handleSaveFiscal} className="space-y-6">
        {/* Section 1: Certificate & Software Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Award className="w-4 h-4 text-amber-500" />
            Certificação de Software Fiscal AGT
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Nº do Certificado AGT (após homologação)
              </label>
              <input
                type="text"
                required
                value={formData.softwareCertificadoNumero}
                onChange={(e) => setFormData((f) => ({ ...f, softwareCertificadoNumero: e.target.value }))}
                placeholder="Será atribuído pela AGT"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-sky-700 bg-sky-50/50 focus:outline-none focus:border-sky-500"
              />
              <p className="text-[10.5px] text-slate-400 mt-1">
                Enquanto estiver pendente, os documentos indicam “certificação AGT pendente”.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Nome do Motor Fiscal
              </label>
              <input
                type="text"
                value={formData.softwareNome}
                onChange={(e) => setFormData((f) => ({ ...f, softwareNome: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Versão do Software Homologado
              </label>
              <input
                type="text"
                value={formData.softwareVersao}
                onChange={(e) => setFormData((f) => ({ ...f, softwareVersao: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Identificador do Terminal / Caixa POS
              </label>
              <input
                type="text"
                value={formData.terminalCaixa}
                onChange={(e) => setFormData((f) => ({ ...f, terminalCaixa: e.target.value }))}
                placeholder="POS-01, CAIXA-CENTRAL"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Identificador da chave de assinatura
              </label>
              <input
                type="text"
                value={formData.chaveVersao}
                onChange={(e) => setFormData((f) => ({ ...f, chaveVersao: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Exigir NIF Obrigatório acima de:
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.exigirNifObrigatorioAcimaDe}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      exigirNifObrigatorioAcimaDe: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full border border-slate-200 rounded-xl pl-3 pr-12 py-2 text-sm font-bold focus:outline-none focus:border-sky-500"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  {config.moeda || "AOA"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Regime de IVA & Isenções */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-emerald-500" />
            Regime de IVA & Motivos de Isenção CIVA
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Regime de Tributação de IVA da Empresa
              </label>
              <select
                value={formData.regimeIva}
                onChange={(e) => setFormData((f) => ({ ...f, regimeIva: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-bold focus:outline-none focus:border-sky-500"
              >
                <option value="Regime Geral">Regime Geral (Taxa Padrão 14%)</option>
                <option value="Regime Simplificado">Regime Simplificado (Taxa Reduzida 7%)</option>
                <option value="Regime de Exclusão">Regime de Exclusão (Isenção Total Art. 2º CIVA)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Motivo de Isenção de IVA Padrão (Para Artigos Isentos)
              </label>
              <select
                value={formData.motivoIsencaoPadrao}
                onChange={(e) => setFormData((f) => ({ ...f, motivoIsencaoPadrao: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-sky-500"
              >
                {MOTIVOS_ISENCAO_AGT.map((m) => (
                  <option key={m.codigo} value={m.descricao}>
                    {m.descricao}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.incluirMencaoDispensaAGT}
                onChange={(e) => setFormData((f) => ({ ...f, incluirMencaoDispensaAGT: e.target.checked }))}
                className="w-4 h-4 rounded text-sky-500 accent-sky-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Menção Legal Obrigatória no Rodapé</span>
                <span className="text-[10.5px] text-slate-500">
                  "Os bens/serviços foram colocados à disposição do adquirente na data e local do documento"
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.validarHashAssinatura}
                onChange={(e) => setFormData((f) => ({ ...f, validarHashAssinatura: e.target.checked }))}
                className="w-4 h-4 rounded text-sky-500 accent-sky-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Validar cadeia de hash SHA-256</span>
                <span className="text-[10.5px] text-slate-500">
                  Validação sequencial de integridade entre documentos emitidos
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: SAF-T AO & Auditoria */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileCode className="w-4 h-4 text-purple-500" />
            Ficheiro de Auditoria Tributária SAF-T (AO)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Email da Contabilidade para Envio do SAF-T
              </label>
              <input
                type="email"
                value={formData.emailContabilidadeSaft || ""}
                onChange={(e) => setFormData((f) => ({ ...f, emailContabilidadeSaft: e.target.value }))}
                placeholder="contabilidade@empresa.ao"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleDownloadSaftFile}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descarregar SAF-T (AO) XML Mensal
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-xl text-sm font-bold transition shadow-sm flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Guardar Parâmetros Fiscais AGT
          </button>
        </div>
      </form>

      {/* SAF-T Preview Modal */}
      {showSaftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm">Ficheiro SAF-T (AO) - Angola</h3>
                  <p className="text-[11px] text-slate-400">
                    Estrutura XML em conformidade com o Decreto Presidencial n.º 292/18 da AGT
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyXml}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedSaft ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSaft ? "Copiado!" : "Copiar XML"}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSaftFile}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descarregar XML
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaftModal(false)}
                  className="px-2.5 py-1 text-slate-400 hover:text-white rounded-lg transition"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Faturas Auditadas</div>
                <div className="text-sm font-bold text-slate-900">{faturas.length}</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Clientes Cadastrados</div>
                <div className="text-sm font-bold text-slate-900">{pacientes.length}</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Produtos / Artigos</div>
                <div className="text-sm font-bold text-slate-900">{produtos.length}</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Estado AGT</div>
                <div className="text-sm font-bold text-sky-600 font-mono">{formData.softwareCertificadoNumero}</div>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs text-slate-200">
              <pre className="whitespace-pre overflow-x-auto text-[11px] leading-relaxed text-emerald-400">
                {saftXmlContent}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
