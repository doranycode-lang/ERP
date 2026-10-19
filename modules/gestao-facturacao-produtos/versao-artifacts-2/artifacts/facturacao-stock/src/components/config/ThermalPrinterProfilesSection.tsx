import React, { useState } from "react";
import { PerfilImpressoraTermica, ConfigSistema } from "../../types";
import { PrinterModal } from "./PrinterModal";
import { printThermalTestTicket } from "../../utils/thermalPrinterTest";
import {
  Printer, Plus, Check, Star, Trash2, Edit3, Copy, Play, Wifi,
  Usb, Cpu, Bluetooth, Scissors, DollarSign, QrCode, Barcode,
  AlertCircle, Sparkles, Terminal, FileText
} from "lucide-react";

interface ThermalPrinterProfilesSectionProps {
  config: ConfigSistema;
  onUpdateConfig: (newConfig: Partial<ConfigSistema>) => void;
}

export const ThermalPrinterProfilesSection: React.FC<ThermalPrinterProfilesSectionProps> = ({
  config,
  onUpdateConfig,
}) => {
  const perfis = config.perfisImpressoras || [];
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<PerfilImpressoraTermica | null>(null);
  const [hardwareTestFeedback, setHardwareTestFeedback] = useState<string | null>(null);
  const [showHexTerminal, setShowHexTerminal] = useState(false);

  const handleSavePerfil = (perfilSalvo: PerfilImpressoraTermica) => {
    let novosPerfis = [...perfis];
    const exists = novosPerfis.some((p) => p.id === perfilSalvo.id);

    if (perfilSalvo.padrao) {
      novosPerfis = novosPerfis.map((p) => ({ ...p, padrao: false }));
    }

    if (exists) {
      novosPerfis = novosPerfis.map((p) => (p.id === perfilSalvo.id ? perfilSalvo : p));
    } else {
      novosPerfis.push(perfilSalvo);
    }

    // If no default exists, set first active one as default
    if (!novosPerfis.some((p) => p.padrao) && novosPerfis.length > 0) {
      novosPerfis[0].padrao = true;
    }

    onUpdateConfig({ perfisImpressoras: novosPerfis });
    triggerFeedback(`Perfil "${perfilSalvo.nome}" guardado com sucesso!`);
  };

  const handleSetDefault = (id: string) => {
    const novosPerfis = perfis.map((p) => ({
      ...p,
      padrao: p.id === id,
    }));
    onUpdateConfig({ perfisImpressoras: novosPerfis });
    const nome = perfis.find((p) => p.id === id)?.nome;
    triggerFeedback(`"${nome}" definida como impressora térmica padrão!`);
  };

  const handleToggleActive = (id: string) => {
    const novosPerfis = perfis.map((p) => (p.id === id ? { ...p, ativo: !p.ativo } : p));
    onUpdateConfig({ perfisImpressoras: novosPerfis });
  };

  const handleDelete = (id: string) => {
    const perfil = perfis.find((p) => p.id === id);
    if (!perfil) return;
    if (confirm(`Tem a certeza que deseja eliminar o perfil "${perfil.nome}"?`)) {
      let novosPerfis = perfis.filter((p) => p.id !== id);
      if (perfil.padrao && novosPerfis.length > 0) {
        novosPerfis[0].padrao = true;
      }
      onUpdateConfig({ perfisImpressoras: novosPerfis });
      triggerFeedback(`Perfil "${perfil.nome}" removido.`);
    }
  };

  const handleDuplicate = (perfil: PerfilImpressoraTermica) => {
    const novo: PerfilImpressoraTermica = {
      ...perfil,
      id: `term-${Date.now()}`,
      nome: `${perfil.nome} (Cópia)`,
      padrao: false,
    };
    onUpdateConfig({ perfisImpressoras: [...perfis, novo] });
    triggerFeedback(`Perfil duplicado: "${novo.nome}".`);
  };

  const handleTestPrint = (perfil: PerfilImpressoraTermica) => {
    printThermalTestTicket(perfil, config, config.configuracaoFiscal);
    triggerFeedback(`Página de teste enviada para "${perfil.nome}" (${perfil.larguraPapel})`);
  };

  const triggerFeedback = (msg: string) => {
    setHardwareTestFeedback(msg);
    setTimeout(() => setHardwareTestFeedback(null), 3500);
  };

  const simulateCashDrawerPulse = () => {
    triggerFeedback("Comando ESC p 0 25 250 enviado: Gaveta de Dinheiro acionada!");
  };

  const simulatePaperCut = () => {
    triggerFeedback("Comando GS V 0 enviado: Guilhotina de auto-corte acionada!");
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Printer className="w-5 h-5 text-sky-500" />
            Perfis de Impressoras Térmicas & Dispositivos POS
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure impressoras térmicas de talões (80mm / 58mm), comandos ESC/POS, abertura de gaveta e corte automático
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingPerfil(null);
            setModalOpen(true);
          }}
          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Adicionar Impressora Térmica
        </button>
      </div>

      {/* Feedback banner */}
      {hardwareTestFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          {hardwareTestFeedback}
        </div>
      )}

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {perfis.map((perfil) => {
          const isNetwork = perfil.tipoConexao === "rede_tcp";
          const isSerial = perfil.tipoConexao === "serial_com";
          const isBluetooth = perfil.tipoConexao === "bluetooth";

          return (
            <div
              key={perfil.id}
              className={`bg-white rounded-2xl border transition shadow-sm p-5 flex flex-col justify-between space-y-4 ${
                perfil.padrao
                  ? "border-sky-400 ring-2 ring-sky-500/10"
                  : !perfil.ativo
                  ? "border-slate-200 opacity-60 bg-slate-50/50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* Profile Card Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        perfil.padrao
                          ? "bg-sky-500 text-white"
                          : perfil.ativo
                          ? "bg-slate-100 text-slate-700"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900">{perfil.nome}</h4>
                        {perfil.padrao && (
                          <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md text-[10px] font-extrabold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-sky-600 text-sky-600" /> PADRÃO
                          </span>
                        )}
                        {!perfil.ativo && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                            INATIVO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{perfil.modelo}</p>
                    </div>
                  </div>

                  {/* Toggle Active Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(perfil.id)}
                    title={perfil.ativo ? "Desativar perfil" : "Ativar perfil"}
                    className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                      perfil.ativo ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        perfil.ativo ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Location / Sector */}
                {perfil.localizacaoSetor && (
                  <div className="text-[11px] text-slate-500 font-medium">
                    📍 <span className="font-semibold text-slate-700">{perfil.localizacaoSetor}</span>
                  </div>
                )}

                {/* Technical Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {/* Interface badge */}
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                    {isNetwork && <Wifi className="w-3 h-3 text-sky-500" />}
                    {isSerial && <Cpu className="w-3 h-3 text-amber-500" />}
                    {isBluetooth && <Bluetooth className="w-3 h-3 text-indigo-500" />}
                    {!isNetwork && !isSerial && !isBluetooth && <Usb className="w-3 h-3 text-slate-600" />}
                    {perfil.tipoConexao.toUpperCase()}
                  </span>

                  {/* Width badge */}
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold">
                    📜 {perfil.larguraPapel} ({perfil.colunas} cols)
                  </span>

                  {/* Protocol badge */}
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold">
                    ⚡ {perfil.protocolo.toUpperCase()}
                  </span>

                  {/* Copies badge */}
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold">
                    📄 {perfil.viasImpressao} Via(s)
                  </span>
                </div>

                {/* Connection details */}
                {isNetwork && (
                  <div className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                    TCP: {perfil.enderecoIp || "192.168.1.200"}:{perfil.portaTcp || 9100}
                  </div>
                )}
                {isSerial && (
                  <div className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                    Serial: {perfil.portaSerial || "COM1"} @ {perfil.baudRate || 9600}bps
                  </div>
                )}

                {/* Hardware Feature Icons */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Scissors className={`w-3.5 h-3.5 ${perfil.cortarPapel ? "text-sky-600" : "text-slate-300"}`} />
                    <span>{perfil.cortarPapel ? "Auto-Corte Ativo" : "Sem Corte"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className={`w-3.5 h-3.5 ${perfil.abrirGaveta ? "text-emerald-600" : "text-slate-300"}`} />
                    <span>{perfil.abrirGaveta ? "Abertura de Gaveta" : "Sem Gaveta"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <QrCode className={`w-3.5 h-3.5 ${perfil.imprimirQrCodeFiscal ? "text-purple-600" : "text-slate-300"}`} />
                    <span>{perfil.imprimirQrCodeFiscal ? "QR fiscal indisponível" : "Sem QR Code"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Barcode className={`w-3.5 h-3.5 ${perfil.imprimirCodigoBarras ? "text-indigo-600" : "text-slate-300"}`} />
                    <span>{perfil.imprimirCodigoBarras ? "Código de Barras" : "Sem Barras"}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTestPrint(perfil)}
                    className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-sky-200"
                    title="Imprimir página de teste na impressora térmica"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Testar Impressão
                  </button>

                  {!perfil.padrao && perfil.ativo && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(perfil.id)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
                      title="Tornar esta a impressora principal de talões"
                    >
                      Definir Padrão
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicate(perfil)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    title="Duplicar perfil"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPerfil(perfil);
                      setModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                    title="Editar configurações deste perfil"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {perfis.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(perfil.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Eliminar este perfil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hardware Diagnostic Tools Box */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            <h4 className="text-sm font-bold">Diagnóstico & Teste Direto de Hardware POS</h4>
          </div>
          <button
            type="button"
            onClick={() => setShowHexTerminal(!showHexTerminal)}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
          >
            {showHexTerminal ? "Ocultar Comandos Raw" : "Ver Tabela de Comandos ESC/POS"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={simulateCashDrawerPulse}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Testar Pulso da Gaveta (ESC p)
          </button>

          <button
            type="button"
            onClick={simulatePaperCut}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <Scissors className="w-4 h-4 text-sky-400" />
            Testar Guilhotina (GS V 0)
          </button>

          <button
            type="button"
            onClick={() => {
              const defaultPerfil = perfis.find((p) => p.padrao) || perfis[0];
              if (defaultPerfil) handleTestPrint(defaultPerfil);
            }}
            className="p-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir Talão de Teste Completo
          </button>
        </div>

        {showHexTerminal && (
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1.5">
            <div className="text-slate-400 font-bold mb-1">Comandos de controlo ESC/POS:</div>
            <div>• <span className="text-sky-400">ESC @</span> (0x1B 0x40): Inicialização e Reset da Impressora</div>
            <div>• <span className="text-emerald-400">ESC p 0 25 250</span> (0x1B 0x70 0x00 0x19 0xFA): Impulso Elétrico Gaveta RJ11</div>
            <div>• <span className="text-purple-400">GS V 0</span> (0x1D 0x56 0x00): Corte Total de Papel / Guilhotina</div>
            <div>• <span className="text-amber-400">GS ( k</span> (0x1D 0x28 0x6B): Comando genérico para símbolos QR; QR fiscal oficial indisponível</div>
            <div>• <span className="text-pink-400">GS k 4</span> (0x1D 0x6B 0x04): Código de Barras Code128 / EAN-13 da Factura</div>
          </div>
        )}
      </div>

      {/* Printer Modal */}
      <PrinterModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPerfil(null);
        }}
        onSave={handleSavePerfil}
        perfilParaEditar={editingPerfil}
      />
    </div>
  );
};
