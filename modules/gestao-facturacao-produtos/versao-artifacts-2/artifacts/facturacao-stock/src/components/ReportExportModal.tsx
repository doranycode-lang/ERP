import React, { useState, useMemo } from "react";
import { Produto, MovimentoStock, ConfigSistema } from "../types";
import {
  generateEstoqueReportHTML,
  generateMovimentacoesReportHTML,
  printOrDownloadReport,
  downloadReportFile,
} from "../utils/reportPdfGenerator";
import {
  FileText, Download, Printer, X, Eye, Sliders, CheckCircle2,
  Package, History, Sparkles, Layout, ShieldCheck
} from "lucide-react";

export interface FiltroRelatorio {
  categoria?: string;
  apenasStockBaixo?: boolean;
  tipoMovimento?: string;
  dataMovimento?: string;
  termoBusca?: string;
}

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoRelatorio: "estoque" | "movimentacoes";
  produtos?: Produto[];
  movimentos?: MovimentoStock[];
  config: ConfigSistema;
  filtroAtual?: FiltroRelatorio;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  tipoRelatorio,
  produtos = [],
  movimentos = [],
  config,
  filtroAtual = {} as FiltroRelatorio,
}) => {
  const [titulo, setTitulo] = useState(
    tipoRelatorio === "estoque"
      ? "RELATÓRIO GERAL DE INVENTÁRIO E ESTOQUE"
      : "RELATÓRIO DE AUDITORIA E MOVIMENTAÇÃO DE ESTOQUE"
  );
  const [orientacao, setOrientacao] = useState<"portrait" | "landscape">("landscape");
  const [operador, setOperador] = useState(config.nomeClinica ? `${config.nomeClinica} - Direcção` : "Administrador");
  const [incluirApenasFiltrados, setIncluirApenasFiltrados] = useState(true);
  const [activeTab, setActiveTab] = useState<"preview" | "config">("preview");

  const categoriaFiltro = filtroAtual?.categoria;
  const apenasStockBaixoFiltro = filtroAtual?.apenasStockBaixo;
  const tipoMovimentoFiltro = filtroAtual?.tipoMovimento;
  const dataMovimentoFiltro = filtroAtual?.dataMovimento;
  const termoBuscaFiltro = filtroAtual?.termoBusca;

  // Determine filtered or full datasets
  const dataProdutos = useMemo(() => {
    if (!incluirApenasFiltrados) return produtos;
    return produtos.filter((p) => {
      const matchesCat = !categoriaFiltro || categoriaFiltro === "todas" || p.categoria === categoriaFiltro;
      const matchesLowStock = !apenasStockBaixoFiltro || (p.stockMinimo > 0 && p.stock <= p.stockMinimo);
      const matchesSearch = !termoBuscaFiltro ||
        p.nome.toLowerCase().includes(termoBuscaFiltro.toLowerCase()) ||
        p.codigo.toLowerCase().includes(termoBuscaFiltro.toLowerCase()) ||
        (p.codigoBarras && p.codigoBarras.toLowerCase().includes(termoBuscaFiltro.toLowerCase()));
      return matchesCat && matchesLowStock && matchesSearch;
    });
  }, [produtos, incluirApenasFiltrados, categoriaFiltro, apenasStockBaixoFiltro, termoBuscaFiltro]);

  const dataMovimentos = useMemo(() => {
    if (!incluirApenasFiltrados) return movimentos;
    return movimentos.filter((m) => {
      const matchesTipo = !tipoMovimentoFiltro || tipoMovimentoFiltro === "todos" || m.tipo === tipoMovimentoFiltro;
      const matchesData = !dataMovimentoFiltro || m.data === dataMovimentoFiltro;
      const matchesSearch = !termoBuscaFiltro ||
        m.produtoNome.toLowerCase().includes(termoBuscaFiltro.toLowerCase()) ||
        m.produtoCodigo.toLowerCase().includes(termoBuscaFiltro.toLowerCase()) ||
        (m.lote && m.lote.toLowerCase().includes(termoBuscaFiltro.toLowerCase())) ||
        m.motivo.toLowerCase().includes(termoBuscaFiltro.toLowerCase());
      return matchesTipo && matchesData && matchesSearch;
    });
  }, [movimentos, incluirApenasFiltrados, tipoMovimentoFiltro, dataMovimentoFiltro, termoBuscaFiltro]);

  // Generated HTML
  const reportHTML = useMemo(() => {
    if (tipoRelatorio === "estoque") {
      return generateEstoqueReportHTML(dataProdutos, config, {
        titulo,
        orientacao,
        operador,
        categoria: categoriaFiltro && categoriaFiltro !== "todas" ? categoriaFiltro : "Todas as Categorias",
        apenasStockBaixo: apenasStockBaixoFiltro,
      });
    } else {
      return generateMovimentacoesReportHTML(dataMovimentos, config, {
        titulo,
        orientacao,
        operador,
        tipoFiltro: tipoMovimentoFiltro && tipoMovimentoFiltro !== "todos" ? tipoMovimentoFiltro : undefined,
        dataFiltro: dataMovimentoFiltro || undefined,
        termoBusca: termoBuscaFiltro || undefined,
      });
    }
  }, [
    tipoRelatorio,
    dataProdutos,
    dataMovimentos,
    config,
    titulo,
    orientacao,
    operador,
    categoriaFiltro,
    apenasStockBaixoFiltro,
    tipoMovimentoFiltro,
    dataMovimentoFiltro,
    termoBuscaFiltro,
  ]);

  if (!isOpen) return null;

  const fileName = tipoRelatorio === "estoque"
    ? `Relatorio_Estoque_${new Date().toISOString().slice(0, 10)}`
    : `Relatorio_Movimentacoes_${new Date().toISOString().slice(0, 10)}`;

  const handlePrintPDF = () => {
    printOrDownloadReport(reportHTML, fileName);
  };

  const handleDownloadHTML = () => {
    downloadReportFile(reportHTML, fileName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-5xl h-[92vh] max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">
                  {tipoRelatorio === "estoque" ? "Exportação de Relatório de Estoque (PDF)" : "Exportação de Relatório de Movimentações (PDF)"}
                </h3>
                <span className="px-2 py-0.5 bg-sky-500/30 text-sky-300 text-[10px] font-bold rounded-full border border-sky-400/30">
                  Formato A4 Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {tipoRelatorio === "estoque"
                  ? `${dataProdutos.length} artigos selecionados para o relatório`
                  : `${dataMovimentos.length} movimentos registados para auditoria`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === "preview" ? "bg-sky-500 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Pré-visualizar
              </button>
              <button
                onClick={() => setActiveTab("config")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === "config" ? "bg-sky-500 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" /> Personalizar
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100">
          
          {/* Settings Sidebar (Visible on config tab or side) */}
          <div className={`${activeTab === "config" ? "block w-full" : "hidden md:block md:w-80"} bg-white border-r border-slate-200 p-5 overflow-y-auto space-y-4`}>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-500" /> Configurações do Relatório
            </div>

            {/* Custom Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Título do Documento</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Orientation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Orientação da Página A4</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientacao("landscape")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    orientacao === "landscape"
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Layout className="w-3.5 h-3.5 rotate-90" /> Paisagem (Recomendado)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientacao("portrait")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    orientacao === "portrait"
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" /> Retrato
                </button>
              </div>
            </div>

            {/* Operator Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Operador / Assinatura</label>
              <input
                type="text"
                value={operador}
                onChange={(e) => setOperador(e.target.value)}
                placeholder="Ex: João Silva - Auditor"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Filter Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirApenasFiltrados}
                  onChange={(e) => setIncluirApenasFiltrados(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                />
                <span className="text-xs font-medium text-slate-700">
                  Aplicar os filtros ativos no ecrã ({tipoRelatorio === "estoque" ? `${dataProdutos.length} de ${produtos.length}` : `${dataMovimentos.length} de ${movimentos.length}`})
                </span>
              </label>
            </div>

            {/* Info summary card */}
            <div className="bg-sky-50/60 p-3.5 rounded-2xl border border-sky-100 text-xs space-y-2">
              <div className="font-bold text-sky-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                Relatório Certificado
              </div>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                Este relatório gera uma tabela completa com valorizações de custo/venda, margens brutas, alertas de stock mínimo e termo de assinatura formal.
              </p>
            </div>

            {/* Quick Actions in Config Tab */}
            {activeTab === "config" && (
              <button
                onClick={() => setActiveTab("preview")}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition"
              >
                <Eye className="w-4 h-4" /> Ver Pré-visualização
              </button>
            )}
          </div>

          {/* Report Live Preview Area */}
          <div className={`${activeTab === "preview" ? "flex-1" : "hidden md:flex md:flex-1"} flex flex-col p-4 overflow-hidden`}>
            <div className="bg-white rounded-2xl shadow-inner border border-slate-200 flex-1 overflow-hidden flex flex-col">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Folha A4 ({orientacao === "landscape" ? "Horizontal" : "Vertical"}) - Pré-visualização do Documento</span>
                <span>Zoom 100%</span>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-slate-200/60 flex justify-center">
                <iframe
                  title="PDF Preview"
                  srcDoc={reportHTML}
                  className="bg-white shadow-xl rounded-lg w-full max-w-4xl min-h-[600px] border border-slate-300"
                  style={{ height: "100%", width: "100%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:px-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Dica: No diálogo de impressão, escolha <strong>"Guardar como PDF"</strong> para salvar o documento em formato digital.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadHTML}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              title="Descarregar ficheiro HTML autónomo"
            >
              <Download className="w-4 h-4" /> Descarregar Ficheiro
            </button>

            <button
              onClick={handlePrintPDF}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Descarregar / Imprimir PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
