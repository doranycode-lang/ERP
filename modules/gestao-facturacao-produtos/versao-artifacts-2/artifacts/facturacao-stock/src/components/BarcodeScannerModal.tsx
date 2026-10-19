import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useApp } from "../store/AppContext";
import { Produto } from "../types";
import { soundManager } from "../utils/barcodeUtils";
import { formatCurrency } from "../utils/faturaGenerator";
import { Camera, QrCode, X, CheckCircle2, AlertTriangle, Zap, Volume2, Plus, ArrowRight } from "lucide-react";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (produto: Produto, quantidade?: number) => void;
  mode?: "lookup" | "pos" | "inventory";
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  mode = "lookup",
}) => {
  const { produtos, findProdutoByBarcodeOrCode, config } = useApp();
  const [manualCode, setManualCode] = useState("");
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<Produto | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(mode === "pos");
  const [scanCount, setScanCount] = useState(0);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "barcode-scanner-video-region";

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setManualCode("");
      setLastScanned(null);
      setScannedProduct(null);
      setCameraError(null);
    } else {
      // Auto-start camera when modal opens
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleBarcodeDetected = (code: string) => {
    if (!code) return;
    setLastScanned(code);
    setScanCount((prev) => prev + 1);

    const found = findProdutoByBarcodeOrCode(code);
    if (found) {
      setScannedProduct(found);
      if (config.sonsScanner) {
        soundManager.playSuccessBeep();
      }

      if (onSelectProduct) {
        onSelectProduct(found, 1);
        if (!continuousMode) {
          onClose();
        }
      }
    } else {
      setScannedProduct(null);
      if (config.sonsScanner) {
        soundManager.playErrorBeep();
      }
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {});
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const qrCodeSuccessCallback = (decodedText: string) => {
        handleBarcodeDetected(decodedText);
      };

      const configQr = {
        fps: 15,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.777778,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        configQr,
        qrCodeSuccessCallback,
        () => {
          // Frame without code, ignore silently
        }
      );

      setCameraActive(true);
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      setCameraActive(false);
      setCameraError(
        "Acesso à câmera bloqueado ou indisponível. Pode utilizar a entrada manual ou um leitor USB de código de barras."
      );
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.warn("Error stopping camera", e);
      }
    }
    setCameraActive(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeDetected(manualCode.trim());
    setManualCode("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-sky-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-inner">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Leitor de Código de Barras
                {continuousMode && (
                  <span className="text-[10px] bg-sky-500 text-white px-2 py-0.5 rounded-full font-semibold">
                    Modo Contínuo
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300">
                Suporta Câmera, Leitor Laser USB ou Entrada Manual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Scanner Viewfinder / Camera Container */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-inner min-h-[220px] flex items-center justify-center">
            <div
              id={scannerContainerId}
              className="w-full h-[220px] bg-slate-950 flex items-center justify-center"
            />

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-white space-y-3">
                <Camera className="w-10 h-10 text-sky-400 animate-pulse" />
                <p className="text-xs text-slate-300 max-w-xs">
                  {cameraError || "A inicializar câmera do dispositivo..."}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-lg"
                >
                  Tentar Ativar Câmera
                </button>
              </div>
            )}

            {/* Target Laser Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-64 h-32 border-2 border-sky-400/80 rounded-xl relative flex items-center justify-center">
                  <div className="absolute inset-x-0 h-0.5 bg-red-500/90 shadow-[0_0_8px_#ef4444] animate-pulse"></div>
                  <div className="absolute -top-6 text-[10px] font-mono text-sky-300 font-semibold bg-slate-950/70 px-2 py-0.5 rounded">
                    Alinhe o código na moldura
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manual / USB Input Field */}
          <div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                  ⌨️
                </span>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Digitar código / Use a pistola leitora USB..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition-all font-mono"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4" />
                Buscar
              </button>
            </form>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
              <span>💡 Dica: Os leitores USB funcionam automaticamente em qualquer ecrã.</span>
              <span className="font-semibold text-slate-500">Leituras: {scanCount}</span>
            </p>
          </div>

          {/* Scan Results Card */}
          {lastScanned && (
            <div className="animate-in slide-in-from-bottom duration-200">
              {scannedProduct ? (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <div>{scannedProduct.nome}</div>
                        <div className="text-[11px] text-emerald-600 font-mono font-normal">
                          Código: {scannedProduct.codigo} · EAN: {scannedProduct.codigoBarras || "—"}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-black text-emerald-700">
                      {formatCurrency(scannedProduct.preco, config.moeda)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200 text-xs">
                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-slate-500 block">Stock Atual</span>
                      <span className={`font-bold ${scannedProduct.stock <= scannedProduct.stockMinimo ? "text-amber-600" : "text-slate-800"}`}>
                        {scannedProduct.stock} {scannedProduct.unidadeMedida}
                      </span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-slate-500 block">Lote Ativo</span>
                      <span className="font-bold text-slate-800">
                        {scannedProduct.loteAtual || "Padrão"}
                      </span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-slate-500 block">Validade</span>
                      <span className="font-bold text-slate-800">
                        {scannedProduct.dataValidade || "Sem validade"}
                      </span>
                    </div>
                  </div>

                  {onSelectProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProduct(scannedProduct, 1);
                        if (!continuousMode) onClose();
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar à Factura / Lista
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-rose-900 text-sm">Produto não cadastrado</div>
                    <div className="mt-0.5">
                      Nenhum produto encontrado com o código: <strong className="font-mono">{lastScanned}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Mock Sample Barcodes for Easy Testing */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-600 flex items-center justify-between">
              <span>Testar com Produtos Rápidos:</span>
              <span className="text-[10px] text-slate-400 font-normal">Clique para simular scan</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {produtos.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleBarcodeDetected(p.codigoBarras || p.codigo)}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 rounded-lg text-[11px] text-slate-700 font-medium transition flex items-center gap-1"
                >
                  <span className="font-mono text-[10px] text-sky-600 font-bold">
                    {p.codigoBarras || p.codigo}
                  </span>
                  <span className="truncate max-w-[120px]">{p.nome}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={continuousMode}
              onChange={(e) => setContinuousMode(e.target.checked)}
              className="w-4 h-4 rounded text-sky-500 accent-sky-500"
            />
            <span>Modo Contínuo (Não fechar após leitura)</span>
          </label>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
