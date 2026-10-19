import React, { useState, useEffect } from "react";
import {
  PerfilImpressoraTermica,
  TipoConexaoImpressora,
  LarguraPapelTermico,
  ProtocoloImpressora,
} from "../../types";
import {
  Printer, X, Check, Wifi, Usb, Cpu, Bluetooth, Globe,
  Scissors, DollarSign, QrCode, Barcode, Image as ImageIcon, Sliders
} from "lucide-react";

interface PrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (perfil: PerfilImpressoraTermica) => void;
  perfilParaEditar?: PerfilImpressoraTermica | null;
}

const MODELOS_SUGERIDOS = [
  { nome: "Epson TM-T20III / TM-T88VI", largura: "80mm", colunas: 48, conexao: "usb", protocolo: "esc_pos" },
  { nome: "Bixolon SRP-330II / SRP-350", largura: "80mm", colunas: 48, conexao: "rede_tcp", protocolo: "esc_pos" },
  { nome: "Xprinter XP-N160II / XP-80C", largura: "80mm", colunas: 48, conexao: "usb", protocolo: "esc_pos" },
  { nome: "Zebra ZD220 / ZD420 (Etiquetas/Talão)", largura: "58mm", colunas: 32, conexao: "usb", protocolo: "esc_pos" },
  { nome: "Datecs DP-50 / Bematech Fiscal AGT", largura: "80mm", colunas: 48, conexao: "serial_com", protocolo: "fiscal_agt_direto" },
  { nome: "Impressora Térmica Portátil 58mm Bluetooth", largura: "58mm", colunas: 32, conexao: "bluetooth", protocolo: "esc_pos" },
];

export const PrinterModal: React.FC<PrinterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  perfilParaEditar,
}) => {
  const [formData, setFormData] = useState<PerfilImpressoraTermica>({
    id: `term-${Date.now()}`,
    nome: "",
    modelo: "Epson ESC/POS 80mm",
    tipoConexao: "usb",
    enderecoIp: "192.168.1.200",
    portaTcp: 9100,
    portaSerial: "COM1",
    baudRate: 9600,
    larguraPapel: "80mm",
    colunas: 48,
    protocolo: "esc_pos",
    padrao: false,
    ativo: true,
    cortarPapel: true,
    abrirGaveta: true,
    imprimirLogotipo: true,
    imprimirQrCodeFiscal: true,
    imprimirCodigoBarras: true,
    viasImpressao: 1,
    densidadeImpressao: "normal",
    localizacaoSetor: "Caixa Principal",
    rodapePersonalizado: "Obrigado pela sua visita!",
  });

  useEffect(() => {
    if (perfilParaEditar) {
      setFormData({ ...perfilParaEditar });
    } else {
      setFormData({
        id: `term-${Date.now()}`,
        nome: "",
        modelo: "Epson ESC/POS 80mm",
        tipoConexao: "usb",
        enderecoIp: "192.168.1.200",
        portaTcp: 9100,
        portaSerial: "COM1",
        baudRate: 9600,
        larguraPapel: "80mm",
        colunas: 48,
        protocolo: "esc_pos",
        padrao: false,
        ativo: true,
        cortarPapel: true,
        abrirGaveta: true,
        imprimirLogotipo: true,
        imprimirQrCodeFiscal: true,
        imprimirCodigoBarras: true,
        viasImpressao: 1,
        densidadeImpressao: "normal",
        localizacaoSetor: "Caixa Principal",
        rodapePersonalizado: "Obrigado pela sua visita!",
      });
    }
  }, [perfilParaEditar, isOpen]);

  const handleApplyPreset = (preset: typeof MODELOS_SUGERIDOS[0]) => {
    setFormData((prev) => ({
      ...prev,
      modelo: preset.nome,
      larguraPapel: preset.largura as LarguraPapelTermico,
      colunas: preset.colunas,
      tipoConexao: preset.conexao as TipoConexaoImpressora,
      protocolo: preset.protocolo as ProtocoloImpressora,
      nome: prev.nome || preset.nome,
    }));
  };

  const handlePaperWidthChange = (largura: LarguraPapelTermico) => {
    const colunas = largura === "58mm" ? 32 : largura === "72mm" ? 42 : 48;
    setFormData((prev) => ({
      ...prev,
      larguraPapel: largura,
      colunas,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {perfilParaEditar ? "Editar Perfil de Impressora Térmica" : "Novo Perfil de Impressora Térmica"}
              </h3>
              <p className="text-xs text-slate-400">
                Parâmetros de comunicação, formato de papel e comandos ESC/POS / Fiscal AGT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Modelos e Predefinições Rápidas:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MODELOS_SUGERIDOS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-300 rounded-lg text-xs font-medium transition"
              >
                {preset.nome.split("/")[0]}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Nome de Identificação do Perfil *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Epson Balcão Principal, Bixolon Caixa 02..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Modelo / Fabricante
              </label>
              <input
                type="text"
                value={formData.modelo}
                onChange={(e) => setFormData((f) => ({ ...f, modelo: e.target.value }))}
                placeholder="Ex: Epson TM-T20III, Bixolon SRP-330..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Setor / Localização Física
              </label>
              <input
                type="text"
                value={formData.localizacaoSetor || ""}
                onChange={(e) => setFormData((f) => ({ ...f, localizacaoSetor: e.target.value }))}
                placeholder="Ex: Caixa 01, Balcão Farmácia, Armazém..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Protocolo de Comunicação
              </label>
              <select
                value={formData.protocolo}
                onChange={(e) => setFormData((f) => ({ ...f, protocolo: e.target.value as ProtocoloImpressora }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium focus:outline-none focus:border-sky-500"
              >
                <option value="esc_pos">ESC/POS Padrão (Epson/Bixolon/Xprinter)</option>
                <option value="fiscal_agt_direto">Protocolo Fiscal AGT Direto (Datecs/Bematech)</option>
                <option value="tspl_etiquetas">TSPL / ZPL (Etiquetas de Código de Barras)</option>
                <option value="generic_raw">Impressão Direta / RAW Web Spool</option>
              </select>
            </div>
          </div>

          {/* Connection Interface */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-sky-500" />
              Interface de Conexão e Comunicação
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { id: "usb", label: "USB / Plug&Play", icon: Usb },
                { id: "rede_tcp", label: "Rede TCP / IP", icon: Wifi },
                { id: "serial_com", label: "Serial COM/RS232", icon: Cpu },
                { id: "bluetooth", label: "Bluetooth", icon: Bluetooth },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = formData.tipoConexao === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData((f) => ({ ...f, tipoConexao: item.id as TipoConexaoImpressora }))}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                      isSelected
                        ? "bg-sky-500 text-white border-sky-500 font-bold shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-500"}`} />
                    <span className="text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Network parameters */}
            {formData.tipoConexao === "rede_tcp" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Endereço IP da Impressora</label>
                  <input
                    type="text"
                    value={formData.enderecoIp || ""}
                    onChange={(e) => setFormData((f) => ({ ...f, enderecoIp: e.target.value }))}
                    placeholder="192.168.1.200"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Porta TCP (Padrão: 9100)</label>
                  <input
                    type="number"
                    value={formData.portaTcp || 9100}
                    onChange={(e) => setFormData((f) => ({ ...f, portaTcp: parseInt(e.target.value) || 9100 }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}

            {/* Serial COM parameters */}
            {formData.tipoConexao === "serial_com" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Porta Serial</label>
                  <select
                    value={formData.portaSerial || "COM1"}
                    onChange={(e) => setFormData((f) => ({ ...f, portaSerial: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-mono focus:outline-none focus:border-sky-500"
                  >
                    <option value="COM1">COM1</option>
                    <option value="COM2">COM2</option>
                    <option value="COM3">COM3</option>
                    <option value="COM4">COM4</option>
                    <option value="/dev/ttyUSB0">Linux /dev/ttyUSB0</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Taxa Baud Rate</label>
                  <select
                    value={formData.baudRate || 9600}
                    onChange={(e) => setFormData((f) => ({ ...f, baudRate: parseInt(e.target.value) || 9600 }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-mono focus:outline-none focus:border-sky-500"
                  >
                    <option value="9600">9600 bps</option>
                    <option value="19200">19200 bps</option>
                    <option value="38400">38400 bps</option>
                    <option value="115200">115200 bps (Fiscal Homologada)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Paper Format & Density */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Largura da Bobina de Papel
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["80mm", "58mm", "72mm"] as LarguraPapelTermico[]).map((width) => (
                  <button
                    key={width}
                    type="button"
                    onClick={() => handlePaperWidthChange(width)}
                    className={`py-2 text-center rounded-xl border text-xs font-bold transition ${
                      formData.larguraPapel === width
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {width}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Colunas por Linha
              </label>
              <input
                type="number"
                min={24}
                max={64}
                value={formData.colunas}
                onChange={(e) => setFormData((f) => ({ ...f, colunas: parseInt(e.target.value) || 48 }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Vias de Impressão (Cópias)
              </label>
              <select
                value={formData.viasImpressao}
                onChange={(e) => setFormData((f) => ({ ...f, viasImpressao: parseInt(e.target.value) || 1 }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium focus:outline-none focus:border-sky-500"
              >
                <option value={1}>1 Via (Original)</option>
                <option value={2}>2 Vias (Original + Duplicado)</option>
                <option value={3}>3 Vias (Original + Duplicado + Triplicado)</option>
              </select>
            </div>
          </div>

          {/* ESC/POS Hardware Hardware Controls */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-purple-500" />
              Recursos de Hardware & Comandos ESC/POS
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.cortarPapel}
                  onChange={(e) => setFormData((f) => ({ ...f, cortarPapel: e.target.checked }))}
                  className="w-4 h-4 rounded text-sky-500 accent-sky-500"
                />
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="font-bold text-slate-900 block">Auto-Corte de Papel (GS V 0)</span>
                    <span className="text-[10px] text-slate-500">Aciona guilhotina ao fim do talão</span>
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.abrirGaveta}
                  onChange={(e) => setFormData((f) => ({ ...f, abrirGaveta: e.target.checked }))}
                  className="w-4 h-4 rounded text-sky-500 accent-sky-500"
                />
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-bold text-slate-900 block">Abrir Gaveta de Dinheiro (ESC p)</span>
                    <span className="text-[10px] text-slate-500">Pulso elétrico na porta RJ11/DK</span>
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.imprimirQrCodeFiscal}
                    disabled
                  className="w-4 h-4 rounded text-sky-500 accent-sky-500"
                />
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-slate-700" />
                  <div>
                    <span className="font-bold text-slate-900 block">QR fiscal oficial indisponível</span>
                    <span className="text-[10px] text-slate-500">Não existe integração/validação oficial configurada para gerar este código.</span>
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.imprimirCodigoBarras}
                  onChange={(e) => setFormData((f) => ({ ...f, imprimirCodigoBarras: e.target.checked }))}
                  className="w-4 h-4 rounded text-sky-500 accent-sky-500"
                />
                <div className="flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-slate-700" />
                  <div>
                    <span className="font-bold text-slate-900 block">Código de Barras do Documento</span>
                    <span className="text-[10px] text-slate-500">Code128 com número da factura</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Footer & Status */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Texto Personalizado no Rodapé do Talão
              </label>
              <input
                type="text"
                value={formData.rodapePersonalizado || ""}
                onChange={(e) => setFormData((f) => ({ ...f, rodapePersonalizado: e.target.value }))}
                placeholder="Ex: Obrigado pela sua preferência! Volte sempre."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.padrao}
                  onChange={(e) => setFormData((f) => ({ ...f, padrao: e.target.checked }))}
                  className="w-4 h-4 rounded text-sky-500 accent-sky-500"
                />
                <span className="text-xs font-bold text-slate-900">
                  Definir como Impressora Térmica Principal / Padrão
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData((f) => ({ ...f, ativo: e.target.checked }))}
                  className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
                />
                <span className="text-xs font-bold text-slate-900">
                  Perfil Ativo
                </span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {perfilParaEditar ? "Guardar Alterações" : "Criar Perfil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
