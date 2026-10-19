import React, { useState, useEffect, useRef } from "react";
import { Produto } from "../types";
import { useApp } from "../store/AppContext";
import { renderBarcode } from "../utils/barcodeUtils";
import { formatCurrency } from "../utils/faturaGenerator";
import { Printer, X, Tag, Copy, Sliders, Check } from "lucide-react";

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
}

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  isOpen,
  onClose,
  produto,
}) => {
  const { config } = useApp();
  const [copias, setCopias] = useState(6);
  const [mostrarPreco, setMostrarPreco] = useState(true);
  const [mostrarValidade, setMostrarValidade] = useState(true);
  const [mostrarLote, setMostrarLote] = useState(true);
  const [mostrarEmpresa, setMostrarEmpresa] = useState(true);
  const [tamanhoEtiqueta, setTamanhoEtiqueta] = useState<"pequena" | "media" | "grande">("media");
  const [copied, setCopied] = useState(false);

  const previewSvgRef = useRef<SVGSVGElement | null>(null);

  const barcodeValue = produto?.codigoBarras || produto?.codigo || "5600000000000";

  useEffect(() => {
    if (isOpen && previewSvgRef.current && barcodeValue) {
      renderBarcode(previewSvgRef.current, barcodeValue, {
        width: tamanhoEtiqueta === "pequena" ? 1.4 : tamanhoEtiqueta === "media" ? 1.7 : 2.0,
        height: tamanhoEtiqueta === "pequena" ? 35 : tamanhoEtiqueta === "media" ? 45 : 60,
        fontSize: tamanhoEtiqueta === "pequena" ? 10 : 12,
      });
    }
  }, [isOpen, barcodeValue, tamanhoEtiqueta]);

  if (!isOpen || !produto) return null;

  const handlePrintLabels = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const labelWidth = tamanhoEtiqueta === "pequena" ? "40mm" : tamanhoEtiqueta === "media" ? "50mm" : "60mm";
    const labelHeight = tamanhoEtiqueta === "pequena" ? "25mm" : tamanhoEtiqueta === "media" ? "30mm" : "40mm";

    // Generate label HTML items
    let labelsHtml = "";
    for (let i = 0; i < copias; i++) {
      labelsHtml += `
        <div class="label-item">
          ${mostrarEmpresa ? `<div class="company">${config.nomeClinica || "FARMÁCIA"}</div>` : ""}
          <div class="product-name">${produto.nome}</div>
          <div class="barcode-container">
            <svg id="barcode-${i}"></svg>
          </div>
          <div class="bottom-row">
            ${mostrarLote && produto.loteAtual ? `<span>Lote: ${produto.loteAtual}</span>` : "<span></span>"}
            ${mostrarValidade && produto.dataValidade ? `<span>Val: ${produto.dataValidade}</span>` : ""}
          </div>
          ${mostrarPreco ? `<div class="price">${formatCurrency(produto.preco, config.moeda)}</div>` : ""}
        </div>
      `;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Etiquetas - ${produto.nome}</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
  <style>
    @page { size: auto; margin: 5mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 6mm;
      justify-content: flex-start;
      background: #fff;
    }
    .label-item {
      width: ${labelWidth};
      height: ${labelHeight};
      border: 1px dashed #cbd5e1;
      padding: 2mm 3mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      background: #fff;
      page-break-inside: avoid;
    }
    .company { font-size: 7.5pt; font-weight: bold; color: #475569; text-transform: uppercase; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .product-name { font-size: 8.5pt; font-weight: 700; color: #0f172a; line-height: 1.1; max-height: 2.2em; overflow: hidden; }
    .barcode-container { margin: 1mm 0; }
    .barcode-container svg { width: 100%; max-height: 14mm; }
    .bottom-row { width: 100%; display: flex; justify-content: space-between; font-size: 7pt; color: #64748b; font-weight: 600; }
    .price { font-size: 10.5pt; font-weight: 900; color: #0f172a; margin-top: 1mm; }
    @media print {
      body { padding: 0; }
      .label-item { border: none; }
    }
  </style>
</head>
<body>
  ${labelsHtml}
  <script>
    window.onload = function() {
      for (let i = 0; i < ${copias}; i++) {
        JsBarcode("#barcode-" + i, "${barcodeValue}", {
          format: "${barcodeValue.length === 13 && /^\d+$/.test(barcodeValue) ? "EAN13" : "CODE128"}",
          width: ${tamanhoEtiqueta === "pequena" ? 1.3 : 1.6},
          height: ${tamanhoEtiqueta === "pequena" ? 30 : 40},
          displayValue: true,
          fontSize: 10,
          margin: 0
        });
      }
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(barcodeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Impressão de Etiquetas de Código de Barras</h3>
              <p className="text-xs text-slate-300">Etiquetas adesivas para prateleiras e embalagens</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Label Preview Card */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Pré-visualização da Etiqueta
            </div>
            <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 flex items-center justify-center">
              <div className="w-72 bg-white rounded-xl shadow-md border border-slate-300 p-4 flex flex-col items-center text-center space-y-1.5">
                {mostrarEmpresa && (
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate max-w-full">
                    {config.nomeClinica || "FARMÁCIA"}
                  </div>
                )}
                <div className="font-bold text-slate-900 text-sm line-clamp-2 leading-tight">
                  {produto.nome}
                </div>

                <div className="my-1 py-1">
                  <svg ref={previewSvgRef} className="max-w-full"></svg>
                </div>

                <div className="w-full flex justify-between text-[10px] text-slate-500 font-semibold px-1">
                  {mostrarLote && produto.loteAtual && <span>Lote: {produto.loteAtual}</span>}
                  {mostrarValidade && produto.dataValidade && (
                    <span className="text-amber-600">Val: {produto.dataValidade}</span>
                  )}
                </div>

                {mostrarPreco && (
                  <div className="text-base font-black text-slate-900 pt-1 border-t border-slate-100 w-full">
                    {formatCurrency(produto.preco, config.moeda)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Número de Cópias</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={copias}
                  onChange={(e) => setCopias(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Tamanho da Etiqueta</label>
              <select
                value={tamanhoEtiqueta}
                onChange={(e) => setTamanhoEtiqueta(e.target.value as any)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium focus:outline-none focus:border-sky-500"
              >
                <option value="pequena">Pequena (40x25 mm)</option>
                <option value="media">Média Padrão (50x30 mm)</option>
                <option value="grande">Grande (60x40 mm)</option>
              </select>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-700 mb-1">Elementos Visíveis:</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mostrarPreco}
                  onChange={(e) => setMostrarPreco(e.target.checked)}
                  className="rounded text-sky-500 accent-sky-500"
                />
                <span>Exibir Preço de Venda</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mostrarValidade}
                  onChange={(e) => setMostrarValidade(e.target.checked)}
                  className="rounded text-sky-500 accent-sky-500"
                />
                <span>Exibir Data de Validade</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mostrarLote}
                  onChange={(e) => setMostrarLote(e.target.checked)}
                  className="rounded text-sky-500 accent-sky-500"
                />
                <span>Exibir Número de Lote</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mostrarEmpresa}
                  onChange={(e) => setMostrarEmpresa(e.target.checked)}
                  className="rounded text-sky-500 accent-sky-500"
                />
                <span>Nome da Empresa</span>
              </label>
            </div>
          </div>

          {/* Barcode Info */}
          <div className="flex items-center justify-between text-xs text-slate-600 bg-sky-50 border border-sky-200 px-3.5 py-2.5 rounded-xl">
            <div className="flex items-center gap-2">
              <span>Código:</span>
              <strong className="font-mono text-sky-900">{barcodeValue}</strong>
            </div>
            <button
              onClick={handleCopyBarcode}
              className="text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 hover:underline"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handlePrintLabels}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir {copias} Etiqueta{copias > 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
};
