import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useApp } from "../store/AppContext";
import { formatCurrency } from "../store/storage";
import { generateFaturaHTML, downloadFatura, gerarHashFaturaAsync } from "../utils/faturaGenerator";

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════════════════════

function todayStr(): string {
  const d = new Date();
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${d.getFullYear()}`;
}

function nowTimeStr(): string {
  const n = new Date();
  const horas = String(n.getHours()).padStart(2, "0");
  const minutos = String(n.getMinutes()).padStart(2, "0");
  const segundos = String(n.getSeconds()).padStart(2, "0");
  return `${horas}:${minutos}:${segundos}`;
}

function addDays(dateStr: string, days: number): string {
  const p = dateStr.split("/");
  if (p.length !== 3) return dateStr;

  const d = new Date(`${p[2]}-${p[1]}-${p[0]}T00:00:00`);
  d.setDate(d.getDate() + days);

  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${d.getFullYear()}`;
}

function isVencida(dv: string, estado: string): boolean {
  if (estado !== "emitida") return false;
  const p = dv.split("/");
  if (p.length !== 3) return false;

  const venc = new Date(`${p[2]}-${p[1]}-${p[0]}T23:59:59`);
  return venc < new Date();
}

function calcTotals(ls: any[], taxa: number, desc: number) {
  let sub = 0;
  let iva = 0;

  for (const l of ls) {
    const s = l.quantidade * l.precoUnitario;
    sub += s;
    if (!l.ivaIsento) {
      iva += s * (taxa / 100);
    }
  }

  const descVal = sub * (desc / 100);
  return {
    subtotalSemIva: sub - descVal,
    totalIva: iva,
    total: sub - descVal + iva,
  };
}

// Estilos de Cor Premium para a Fatura Gerada (Visual Profissional e Elegante)
const faturaColorCSS = `
  .fatura-container, .invoice-box {
    border-top: 8px solid #0284c7 !important;
    font-family: 'Segoe UI', system-ui, sans-serif !important;
    padding: 24px !important;
    background: #ffffff !important;
  }
  .invoice-header {
    border-bottom: 2px solid #e2e8f0 !important;
    padding-bottom: 16px !important;
    margin-bottom: 20px !important;
  }
  .invoice-title {
    color: #0284c7 !important;
    font-size: 24px !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
  }
  th, .table-header {
    background-color: #0284c7 !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    font-size: 11px !important;
    padding: 10px !important;
  }
  td {
    padding: 10px !important;
    border-bottom: 1px solid #f1f5f9 !important;
  }
  .total-highlight {
    background-color: #f0f9ff !important;
    border: 2px solid #bae6fd !important;
    color: #0369a1 !important;
    font-weight: bold !important;
    padding: 12px !important;
    border-radius: 8px !important;
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

const TIPO_DOC_OPTS = [
  { value: "factura", label: "Factura", code: "FT" },
  { value: "factura-global", label: "Factura Global", code: "FG" },
  { value: "pro-forma", label: "Pró-Forma", code: "PF" },
];

const FORMA_PAG_OPTS = [
  "Numerário", "Transferência Bancária", "Multicaixa Express", "Multicaixa (TPA)",
  "Cheque", "Crédito", "Outro",
];

const ESTADO_CORES: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  rascunho: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500", border: "border-amber-300" },
  emitida: { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500", border: "border-blue-300" },
  paga: { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500", border: "border-emerald-300" },
  anulada: { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500", border: "border-rose-300" },
};

const ESTADO_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  emitida: "Emitida",
  paga: "Paga",
  anulada: "Anulada",
};

const TIPO_LABEL: Record<string, string> = {
  factura: "Factura",
  "factura-recibo": "Factura-Recibo",
  "factura-global": "Factura Global",
  "pro-forma": "Pró-Forma",
  "nota-credito": "Nota de Crédito",
  recibo: "Recibo",
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ═══════════════════════════════════════════════════════════════════════════════

// Mapeamento explícito de cores para evitar falhas de compilação dinâmica do Tailwind CSS
function FTAvatar({ tipo }: { tipo?: string }) {
  const t = tipo || "factura";
  let bgClass = "bg-gradient-to-br from-sky-400 to-sky-600 shadow-sky-200";
  let code = "FT";

  if (t === "factura-recibo") {
    bgClass = "bg-gradient-to-br from-teal-400 to-teal-600 shadow-teal-200";
    code = "FR";
  } else if (t === "factura-global") {
    bgClass = "bg-gradient-to-br from-purple-500 to-purple-700 shadow-purple-200";
    code = "FG";
  } else if (t === "pro-forma") {
    bgClass = "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-200";
    code = "PF";
  } else if (t === "nota-credito") {
    bgClass = "bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-200";
    code = "NC";
  } else if (t === "recibo") {
    bgClass = "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-200";
    code = "RB";
  }

  return (
    <div className={`w-12 h-12 rounded-2xl ${bgClass} flex flex-col items-center justify-center flex-shrink-0 shadow-lg transform hover:scale-105 transition-all duration-300 border border-white/20`}>
      <span className="text-white text-sm font-black tracking-widest leading-none">{code}</span>
    </div>
  );
}

function QRCodeAGT({ size = 80 }: { size?: number }) {
  return (
    <div className="p-1.5 bg-white rounded-xl shadow-inner border border-gray-100">
      <svg width={size} height={size} viewBox="0 0 80 80" className="mx-auto">
        <rect width="80" height="80" fill="white"/>
        <rect x="5" y="5" width="20" height="20" fill="black"/><rect x="8" y="8" width="14" height="14" fill="white"/><rect x="11" y="11" width="8" height="8" fill="black"/>
        <rect x="55" y="5" width="20" height="20" fill="black"/><rect x="58" y="8" width="14" height="14" fill="white"/><rect x="61" y="11" width="8" height="8" fill="black"/>
        <rect x="5" y="55" width="20" height="20" fill="black"/><rect x="8" y="58" width="14" height="14" fill="white"/><rect x="11" y="61" width="8" height="8" fill="black"/>
        <rect x="30" y="30" width="20" height="20" fill="black"/><rect x="33" y="33" width="14" height="14" fill="white"/><rect x="36" y="36" width="8" height="8" fill="black"/>
        <rect x="30" y="5" width="4" height="4" fill="black"/><rect x="38" y="5" width="4" height="4" fill="black"/><rect x="46" y="5" width="4" height="4" fill="black"/>
        <rect x="30" y="13" width="4" height="4" fill="black"/><rect x="42" y="13" width="4" height="4" fill="black"/>
        <rect x="5" y="30" width="4" height="4" fill="black"/><rect x="5" y="38" width="4" height="4" fill="black"/><rect x="13" y="30" width="4" height="4" fill="black"/><rect x="13" y="42" width="4" height="4" fill="black"/>
        <rect x="55" y="30" width="4" height="4" fill="black"/><rect x="63" y="38" width="4" height="4" fill="black"/><rect x="71" y="30" width="4" height="4" fill="black"/><rect x="55" y="42" width="4" height="4" fill="black"/>
        <rect x="30" y="55" width="4" height="4" fill="black"/><rect x="38" y="63" width="4" height="4" fill="black"/><rect x="46" y="55" width="4" height="4" fill="black"/><rect x="42" y="63" width="4" height="4" fill="black"/>
        <rect x="55" y="55" width="4" height="4" fill="black"/><rect x="63" y="63" width="4" height="4" fill="black"/><rect x="71" y="55" width="4" height="4" fill="black"/><rect x="55" y="71" width="4" height="4" fill="black"/><rect x="63" y="71" width="4" height="4" fill="black"/><rect x="71" y="71" width="4" height="4" fill="black"/>
      </svg>
    </div>
  );
}

function BarcodeSimples({ valor, refe }: { valor: number; refe: string }) {
  const pattern = refe.split("").map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join("");
  const barWidth = 2;
  let x = 0;
  const bars: any[] = [];

  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === "1") {
      bars.push(<rect key={i} x={x} y="0" width={barWidth} height="35" fill="black" />);
    }
    x += barWidth;
  }
  const totalWidth = pattern.length * barWidth;

  return (
    <div className="text-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
      <svg viewBox={`0 0 ${totalWidth} 50`} className="w-full max-w-[180px] mx-auto" preserveAspectRatio="xMidYMid meet">
        {bars}
        <text x={totalWidth / 2} y="48" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="black">{refe}</text>
      </svg>
      <p className="text-xs font-black text-sky-600 mt-1">{formatCurrency(valor, "AOA")}</p>
    </div>
  );
}

// ── Modal de Impressão Modernizado ──
function ModalImprimir({ fatura, config, onClose }: { fatura: any; config: any; onClose: () => void }) {
  const [formato, setFormato] = useState<string>("A4");

  if (!fatura) return null;

  const handlePrint = () => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:210mm;height:0;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;

    const configEstiloImpressao = formato === "termica"
      ? "@page { size: 80mm auto; margin: 0; } body { width: 80mm; font-family: monospace; padding: 5mm; }"
      : "@page { size: A4; margin: 10mm; } body { font-family: Arial, sans-serif; margin: 0; padding: 0; }";

    if (doc) {
      doc.open();
      doc.write(
        `<!DOCTYPE html><html><head><title>${fatura.numero}</title>` +
        `<style>${configEstiloImpressao} ${faturaColorCSS}</style>` +
        `</head><body>${generateFaturaHTML(fatura, config, { segundaVia: false, termica: formato === "termica" })}</body></html>`
      );
      doc.close();
      iframe.onload = () => {
        setTimeout(() => {
          if (iframe.contentWindow) iframe.contentWindow.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 300);
      };
    }
  };

  const handleDownloadPDF = () => {
    const htmlColorizado = `<style>${faturaColorCSS}</style>${generateFaturaHTML(fatura, config, { segundaVia: false, termica: formato === "termica" })}`;
    downloadFatura(htmlColorizado, `${fatura.numero}_${formato}`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100">
        <div className="px-6 py-5 bg-gradient-to-r from-sky-600 to-sky-700 text-white flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg flex items-center gap-2">🖨️ Opções de Emissão</h3>
            <p className="text-xs text-sky-100 mt-0.5">{fatura.numero} • {fatura.clienteNome}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all font-bold">✕</button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex gap-3 bg-slate-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setFormato("A4")}
              className={`flex-1 py-3 rounded-xl text-sm font-black tracking-wide transition-all duration-300 ${
                formato === "A4" 
                  ? "bg-white text-sky-600 shadow-md" 
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              📄 Formato A4
            </button>
            <button 
              onClick={() => setFormato("termica")}
              className={`flex-1 py-3 rounded-xl text-sm font-black tracking-wide transition-all duration-300 ${
                formato === "termica" 
                  ? "bg-white text-sky-600 shadow-md" 
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              🧾 Formato Térmica
            </button>
          </div>
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
            <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Pré-visualização do Documento</span>
              <span className="text-xs bg-sky-100 text-sky-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{formato}</span>
            </div>
            <div className={`p-4 overflow-auto max-h-72 transition-all duration-300 ${
              formato === "termica" ? "max-w-[290px] mx-auto border-x-2 border-dashed border-sky-200 bg-white shadow-lg" : "w-full"
            }`}>
              <div 
                className="bg-white shadow-sm mx-auto w-full text-xs"
                dangerouslySetInnerHTML={{ 
                  __html: `<style>${faturaColorCSS}</style>${generateFaturaHTML(fatura, config, { segundaVia: false, termica: formato === "termica" })}` 
                }} 
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-100 hover:text-slate-900 transition-all duration-200">Cancelar</button>
          <button onClick={handleDownloadPDF} className="flex-1 py-3 rounded-xl border-2 border-sky-500 text-sky-600 bg-white text-sm font-black hover:bg-sky-50 transition-all duration-200">⬇️ Baixar PDF</button>
          <button onClick={handlePrint} className="flex-1 py-3 rounded-xl bg-sky-500 text-white text-sm font-black hover:bg-sky-600 transition-all duration-200 shadow-lg shadow-sky-200">🖨️ Imprimir agora</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: useFaturaForm
// ═══════════════════════════════════════════════════════════════════════════════

function useFaturaForm(config: any, session: any) {
  const hoje = useMemo(() => todayStr(), []);

  const [clienteNome, setClienteNome] = useState("");
  const [clienteNif, setClienteNif] = useState("");
  const [clienteEndereco, setClienteEndereco] = useState("");
  const [pacienteId, setPacienteId] = useState("");
  const [linhas, setLinhas] = useState<any[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [estado, setEstado] = useState("emitida");
  const [dataEmissao, setDataEmissao] = useState(hoje);
  const [dataVenc, setDataVenc] = useState(() => addDays(hoje, 30));
  const [ivaTaxa, setIvaTaxa] = useState(config.ivaTaxa || 14);
  const [desconto, setDesconto] = useState(0);
  const [tipoDocumento, setTipoDocumento] = useState("factura");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [valorRecebido, setValorRecebido] = useState<any>("");
  const [nifError, setNifError] = useState("");
  const [facturaPremiada, setFacturaPremiada] = useState(false);

  const totals = useMemo(() => calcTotals(linhas, ivaTaxa, desconto), [linhas, ivaTaxa, desconto]);

  const troco = useMemo(() => {
    if (formaPagamento !== "Numerário" || valorRecebido === "") return 0;
    const rec = Number(valorRecebido);
    if (isNaN(rec)) return 0;
    return Math.max(0, rec - totals.total);
  }, [formaPagamento, valorRecebido, totals.total]);

  const trocoNegativo = useMemo(() => {
    if (formaPagamento !== "Numerário" || valorRecebido === "") return false;
    const rec = Number(valorRecebido);
    if (isNaN(rec)) return false;
    return rec < totals.total && rec > 0;
  }, [formaPagamento, valorRecebido, totals.total]);

  const resetForm = useCallback(() => {
    setClienteNome("");
    setClienteNif("");
    setClienteEndereco("");
    setPacienteId("");
    setLinhas([]);
    setObservacoes("");
    setEstado("emitida");
    setDataEmissao(hoje);
    setDataVenc(addDays(hoje, 30));
    setIvaTaxa(config.ivaTaxa || 14);
    setDesconto(0);
    setTipoDocumento("factura");
    setFormaPagamento("");
    setValorRecebido("");
    setNifError("");
    setFacturaPremiada(false);
  }, [config.ivaTaxa, hoje]);

  const loadFatura = useCallback((f: any) => {
    setClienteNome(f.clienteNome);
    setClienteNif(f.clienteNif);
    setClienteEndereco(f.clienteEndereco);
    setPacienteId(f.pacienteId ? String(f.pacienteId) : "");
    setLinhas(f.linhas.length > 0 ? f.linhas.map((l: any) => ({ ...l, unidade: l.unidade || "" })) : []);
    setObservacoes(f.observacoes);
    setEstado(f.estado);
    setDataEmissao(f.data);
    setDataVenc(f.dataVencimento);
    setIvaTaxa(f.ivaTaxa);
    setDesconto(0);
    setTipoDocumento(f.tipoDocumento || "factura");
    setFormaPagamento(f.formaPagamento || "");
    setFacturaPremiada(f.facturaPremiada || false);
    setNifError("");
  }, []);

  const buildDados = useCallback(() => {
    setNifError("");
    const nomeEfectivo = clienteNome.trim() || "Consumidor Final";
    if (nomeEfectivo !== "Consumidor Final" && !clienteNif.trim()) {
      setNifError("O NIF é obrigatório para clientes identificados.");
      return null;
    }
    const linhasValidas = linhas.filter(l => l.descricao.trim());
    const t = calcTotals(linhasValidas, ivaTaxa, desconto);

    return {
      serie: config.serie,
      data: dataEmissao,
      textHora: nowTimeStr(),
      dataVencimento: dataVenc,
      clienteNome: nomeEfectivo,
      clienteNif: clienteNif.trim(),
      clienteEndereco: clienteEndereco.trim(),
      linhas: linhasValidas,
      subtotalSemIva: t.subtotalSemIva,
      totalIva: t.totalIva,
      ivaTaxa,
      total: t.total,
      estado,
      observacoes: observacoes.trim(),
      pacienteId: pacienteId ? parseInt(pacienteId, 10) : undefined,
      emitidoPor: session.funcionarioNome || session.username,
      tipoDocumento,
      formaPagamento,
      facturaPremiada,
      emissaoContagem: 1,
    };
  }, [clienteNome, clienteNif, clienteEndereco, pacienteId, linhas, observacoes, estado, dataEmissao, dataVenc, ivaTaxa, desconto, tipoDocumento, formaPagamento, facturaPremiada, config.serie, session]);

  return {
    clienteNome, clienteNif, clienteEndereco, pacienteId, linhas, observacoes,
    estado, dataEmissao, dataVenc, ivaTaxa, desconto, tipoDocumento, formaPagamento,
    valorRecebido, nifError, facturaPremiada, totals, troco, trocoNegativo,
    setClienteNome, setClienteNif, setClienteEndereco, setPacienteId, setLinhas,
    setObservacoes, setEstado, setDataEmissao, setDataVenc, setIvaTaxa, setDesconto,
    setTipoDocumento, setFormaPagamento, setValorRecebido, setNifError, setFacturaPremiada,
    resetForm, loadFatura, buildDados,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Modal Novo Paciente
// ═══════════════════════════════════════════════════════════════════════════════

function ModalNovoPaciente({ onClose, onSave }: { onClose: () => void; onSave: (paciente: any) => void }) {
  const [nome, setNome] = useState("");
  const [nif, setNif] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [erro, setErro] = useState("");

  const handleSubmit = () => {
    if (!nome.trim()) {
      setErro("Nome é obrigatório");
      return;
    }
    onSave({
      nome: nome.trim(),
      nif: nif.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      endereco: endereco.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-sky-500 to-sky-600 text-white flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg">➕ Novo Cliente</h3>
            <p className="text-xs text-sky-100 mt-0.5">Cadastrar novo paciente</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {erro && <p className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded-xl border border-rose-100 font-bold">{erro}</p>}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Nome <span className="text-rose-500">*</span></label>
            <input value={nome} onChange={e => { setNome(e.target.value); setErro(""); }}
              placeholder="Nome completo" autoFocus
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">NIF</label>
            <input value={nif} onChange={e => setNif(e.target.value)}
              placeholder="NIF"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Telefone</label>
            <input value={telefone} onChange={e => setTelefone(e.target.value)}
              placeholder="+244 9XX XXX XXX"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email"
              placeholder="cliente@email.com"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Morada</label>
            <textarea value={endereco} onChange={e => setEndereco(e.target.value)} rows={2}
              placeholder="Rua, Bairro, Cidade"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-100 transition">Cancelar</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-bold hover:bg-sky-600 transition shadow-lg shadow-sky-200">💾 Guardar Cliente</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: Faturacao
// ═══════════════════════════════════════════════════════════════════════════════

export default function Faturacao({ session }: { session: any }) {
  const { data, addFatura, updateFatura, removeFatura, addMovimento, addPaciente } = useApp();

  const produtos = useMemo(() => (data.produtos || []).filter((p: any) => p.ativo), [data.produtos]);
  const moeda = data.config.moeda || "AOA";

  const config = useMemo(() => ({
    moeda: data.config.moeda || "AOA",
    ivaTaxa: data.config.ivaTaxa || 14,
    serie: data.config.serie,
    nif: data.config.nif || "",
    nomeClinica: data.config.nomeClinica || "Clínica",
    endereco: data.config.endereco,
    telefone: data.config.telefone,
  }), [data.config]);

  const [view, setView] = useState("lista");
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [showRascunhos, setShowRascunhos] = useState(true);
  const [produtoSearch, setProdutoSearch] = useState("");
  const [produtoQtd, setProdutoQtd] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(-1);
  const [showProdutosPanel, setShowProdutosPanel] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCat, setCatalogCat] = useState<string | null>(null);
  const [ncModal, setNcModal] = useState<any>(null);
  const [ncMotivo, setNcMotivo] = useState("");
  const [reciboModal, setReciboModal] = useState<any>(null);
  const [reciboFormaPag, setReciboFormaPag] = useState("");
  const [showNovoPaciente, setShowNovoPaciente] = useState(false);
  const [imprimirModal, setImprimirModal] = useState<any>(null);
  const [sucessoModal, setSucessoModal] = useState<any>(null);

  const form = useFaturaForm(config, session);
  const hoje = useMemo(() => todayStr(), []);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setDropdownIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Garantir que Pró-Forma é sempre Rascunho
  useEffect(() => {
    if (form.tipoDocumento === "pro-forma" && form.estado !== "rascunho") {
      form.setEstado("rascunho");
    }
  }, [form.tipoDocumento, form.estado]);

  const produtosFiltrados = useMemo(() => {
    const q = produtoSearch.trim().toLowerCase();
    if (!q) return [];
    return produtos.filter((p: any) => p.nome.toLowerCase().includes(q) || (p.codigo && p.codigo.toLowerCase().includes(q))).slice(0, 8);
  }, [produtoSearch, produtos]);

  useEffect(() => {
    if (produtosFiltrados.length > 0 && produtoSearch.trim()) {
      setShowDropdown(true);
      setDropdownIndex(-1);
    } else {
      setShowDropdown(false);
      setDropdownIndex(-1);
    }
  }, [produtosFiltrados, produtoSearch]);

  const catalogCats = useMemo(() => {
    const s = new Set<string>();
    for (const p of produtos) s.add(p.categoria || "Sem Categoria");
    return Array.from(s).sort();
  }, [produtos]);

  const produtosPorCategoria = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    const map: Record<string, any[]> = {};
    for (const p of produtos) {
      const cat = p.categoria || "Sem Categoria";
      if (catalogCat && cat !== catalogCat) continue;
      if (q && !p.nome.toLowerCase().includes(q) && !(p.codigo || "").toLowerCase().includes(q)) continue;
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }
    return map;
  }, [produtos, catalogSearch, catalogCat]);

  const catalogTotalFiltrados = useMemo(() => Object.values(produtosPorCategoria).reduce((s, arr) => s + arr.length, 0), [produtosPorCategoria]);

  const filtered = useMemo(() => {
    let items = [...data.faturas];
    if (filtroEstado !== "todos") items = items.filter(f => f.estado === filtroEstado);
    if (filtroTipo !== "todos") items = items.filter(f => (f.tipoDocumento || "factura") === filtroTipo);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(f => f.clienteNome.toLowerCase().includes(q) || f.numero.toLowerCase().includes(q) || (f.clienteNif || "").includes(q));
    }
    return items.sort((a, b) => b.id - a.id);
  }, [data.faturas, filtroEstado, filtroTipo, search]);

  const rascunhos = useMemo(() => filtered.filter(f => f.estado === "rascunho"), [filtered]);
  const outros = useMemo(() => filtered.filter(f => f.estado !== "rascunho"), [filtered]);

  const stats = useMemo(() => {
    const faturas = data.faturas;
    return {
      total: faturas.length,
      recebido: faturas.filter(f => f.estado === "paga").reduce((s, f) => s + f.total, 0),
      pendente: faturas.filter(f => f.estado === "emitida").reduce((s, f) => s + f.total, 0),
    };
  }, [data.faturas]);

  // HANDLERS
  const handleNovo = useCallback(() => {
    form.resetForm();
    setEditId(null);
    setView("form");
  }, [form]);

  const handleEdit = useCallback((f: any) => {
    form.loadFatura(f);
    setEditId(f.id);
    setView("form");
  }, [form]);

  const handleSave = useCallback(async () => {
    const dados = form.buildDados();
    if (!dados) return;
    try {
      if (editId !== null) {
        await updateFatura(editId, dados);
        form.resetForm();
        setEditId(null);
        setView("lista");
      } else {
        const nova = await addFatura(dados);
        if (!nova || !nova.id) {
          alert("Erro: servidor não retornou a fatura.");
          return;
        }
        const hash = await gerarHashFaturaAsync(nova, config.nif || "");
        await updateFatura(nova.id, { codigoHash: hash });

        if (form.estado === "paga") {
          await addMovimento({
            data: form.dataEmissao,
            descricao: `${TIPO_LABEL[form.tipoDocumento] || "Fatura"} ${nova.numero} — ${dados.clienteNome}`,
            tipo: "entrada",
            valor: nova.total,
            categoria: "Faturação",
            faturaId: nova.id,
            referencia: nova.numero,
            registadoPor: session.funcionarioNome || session.username,
          });
        }
        setSucessoModal({
          fatura: nova,
          mensagem: `${TIPO_LABEL[form.tipoDocumento] || "Fatura"} ${nova.numero} criada com sucesso!`,
        });
        form.resetForm();
        setEditId(null);
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("Erro ao guardar documento.");
    }
  }, [form, editId, updateFatura, addFatura, config.nif, addMovimento, session]);

  const handleMarcarPaga = useCallback(async (f: any) => {
    const hora = nowTimeStr();
    try {
      await updateFatura(f.id, { estado: "paga", horaOperacao: f.horaOperacao || hora });
      await addMovimento({
        data: hoje,
        descricao: `Recebimento ${f.numero} — ${f.clienteNome}`,
        tipo: "entrada",
        valor: f.total,
        categoria: "Faturação",
        faturaId: f.id,
        referencia: f.numero,
        registadoPor: session.funcionarioNome || session.username,
      });
      setReciboFormaPag(f.formaPagamento || "");
      setReciboModal({ fatura: { ...f, estado: "paga" } });
    } catch (err) {
      console.error("Erro ao marcar como paga:", err);
      alert("Erro ao registar pagamento.");
    }
  }, [updateFatura, addMovimento, hoje, session]);

  const handleRemover = useCallback((f: any) => {
    if (f.estado === "emitida" || f.estado === "paga") {
      alert(`Não é possível eliminar "${f.numero}". Anule primeiro.`);
      return;
    }
    if (confirm(`Eliminar ${f.numero}?`)) removeFatura(f.id);
  }, [removeFatura]);

  const handleNotaCredito = useCallback((f: any) => {
    setNcMotivo("");
    setNcModal({ fatura: f });
  }, []);

  const confirmarNotaCredito = useCallback((f: any, motivo: string) => {
    setNcModal(null);
    form.resetForm();
    form.setTipoDocumento("nota-credito");
    form.setClienteNome(f.clienteNome);
    form.setClienteNif(f.clienteNif);
    form.setClienteEndereco(f.clienteEndereco);
    form.setLinhas(f.linhas.map((l: any) => ({ ...l, quantidade: -Math.abs(l.quantidade) })));
    form.setObservacoes(`Nota de Crédito referente ao documento ${f.numero}${motivo ? ` — ${motivo}` : ""}`);
    form.setEstado("emitida");
    form.setIvaTaxa(f.ivaTaxa);
    setEditId(null);
    setView("form");
  }, [form]);

  const handleEmitirRecibo = useCallback((f: any) => {
    setReciboFormaPag(f.formaPagamento || "");
    setReciboModal({ fatura: f });
  }, []);

  const confirmarRecibo = useCallback(async (f: any, formaPag: string) => {
    setReciboModal(null);
    const hora = nowTimeStr();
    const recibo = {
      serie: f.serie,
      data: hoje,
      horaOperacao: hora,
      dataVencimento: hoje,
      clienteNome: f.clienteNome,
      clienteNif: f.clienteNif,
      clienteEndereco: f.clienteEndereco,
      linhas: f.linhas,
      subtotalSemIva: f.subtotalSemIva,
      totalIva: f.totalIva,
      ivaTaxa: f.ivaTaxa,
      total: f.total,
      estado: "paga",
      observacoes: `Recibo de pagamento da ${f.numero}`,
      pacienteId: f.pacienteId,
      emitidoPor: f.emitidoPor,
      tipoDocumento: "recibo",
      formaPagamento: formaPag,
      facturaPremiada: false,
    };

    try {
      const nova = await addFatura(recibo);
      const hash = await gerarHashFaturaAsync({ ...nova, numero: nova.numero }, config.nif || "");
      await updateFatura(nova.id, { codigoHash: hash });
      const htmlRecibo = generateFaturaHTML({ ...nova, tipoDocumento: "recibo" }, data.config, { segundaVia: false });
      downloadFatura(htmlRecibo, nova.numero);
    } catch (err) {
      console.error("Erro ao emitir recibo:", err);
      alert("Erro ao processar a emissão do recibo.");
    }
  }, [addFatura, updateFatura, config.nif, data.config, hoje]);

  const handleCriarPaciente = useCallback(async (paciente: any) => {
    try {
      const criado = await addPaciente({
        nome: paciente.nome,
        nif: paciente.nif || undefined,
        endereco: paciente.endereco || undefined,
        telefone: paciente.telefone || undefined,
        email: paciente.email || undefined,
        dataNascimento: undefined,
        genero: undefined,
        historico: undefined,
        ativo: true,
      });

      if (criado && criado.id) {
        form.setPacienteId(String(criado.id));
      } else {
        form.setPacienteId("");
      }

      form.setClienteNome(paciente.nome);
      form.setClienteNif(paciente.nif || "");
      form.setClienteEndereco(paciente.endereco || "");
      form.setNifError("");
      setShowNovoPaciente(false);
    } catch (err) {
      console.error("Erro ao criar paciente:", err);
      alert("Erro ao criar cliente.");
    }
  }, [addPaciente, form]);

  const handleAddProduto = useCallback((p?: any) => {
    if (p) {
      form.setLinhas(prev => [...prev, { descricao: p.nome, quantidade: produtoQtd, precoUnitario: p.preco, ivaIsento: !!p.ivaIsento, unidade: "" }]);
    } else if (produtoSearch.trim()) {
      form.setLinhas(prev => [...prev, { descricao: produtoSearch.trim(), quantidade: produtoQtd, precoUnitario: 0, ivaIsento: false, unidade: "" }]);
    }
    setProdutoSearch("");
    setProdutoQtd(1);
    setShowDropdown(false);
    setDropdownIndex(-1);
    setTimeout(() => searchInputRef.current && searchInputRef.current.focus(), 50);
  }, [form, produtoQtd, produtoSearch]);

  const handleAddProdutoFromPanel = useCallback((p: any) => {
    form.setLinhas(prev => [...prev, { descricao: p.nome, quantidade: 1, precoUnitario: p.preco, ivaIsento: !!p.ivaIsento, unidade: "" }]);
  }, [form]);

  const handleRemoverLinha = useCallback((i: number) => {
    form.setLinhas(prev => prev.filter((_, idx) => idx !== i));
  }, [form]);

  const handleUpdateLinha = useCallback((i: number, field: string, value: any) => {
    form.setLinhas(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  }, [form]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || produtosFiltrados.length === 0) {
      if (e.key === "Enter" && produtoSearch.trim()) {
        e.preventDefault();
        handleAddProduto();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDropdownIndex(i => Math.min(i + 1, produtosFiltrados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDropdownIndex(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (dropdownIndex >= 0) handleAddProduto(produtosFiltrados[dropdownIndex]);
      else handleAddProduto(produtosFiltrados[0]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setDropdownIndex(-1);
    }
  }, [showDropdown, produtosFiltrados, dropdownIndex, produtoSearch, handleAddProduto]);

  const handleClienteSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const p = data.pacientes.find((x: any) => x.id === parseInt(val, 10));
    form.setPacienteId(val);

    if (p) {
      form.setClienteNome(p.nome);
      form.setClienteNif(p.nif || "");
      form.setClienteEndereco(p.endereco || "");
    } else {
      form.setClienteNome("Consumidor Final");
      form.setClienteNif("");
      form.setClienteEndereco("");
    }
    form.setNifError("");
  }, [data.pacientes, form]);

  const handleLimparFiltros = useCallback(() => {
    setSearch("");
    setFiltroEstado("todos");
    setFiltroTipo("todos");
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: FORMULÁRIO
  // ═══════════════════════════════════════════════════════════════════════════════

  if (view === "form") {
    const tipoLabel = TIPO_DOC_OPTS.find(t => t.value === form.tipoDocumento)?.label || (form.tipoDocumento === "nota-credito" ? "Nota de Crédito" : "Factura");
    const isProforma = form.tipoDocumento === "pro-forma";

    return (
      <div className="min-h-full bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-2 text-sm">
          <button onClick={() => { form.resetForm(); setEditId(null); setView("lista"); }}
            className="text-sky-500 hover:underline font-extrabold">Documentos</button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-bold">{editId !== null ? `Editar ${tipoLabel}` : `Novo ${tipoLabel}`}</span>
        </div>

        <div className="px-6 py-5 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <FTAvatar tipo={form.tipoDocumento} />
              <div>
                <h1 className="text-2xl font-black text-slate-800">{tipoLabel}</h1>
                {isProforma && (
                  <span className="text-xs text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full font-bold mt-1 inline-block">
                    ⚠️ Não é documento fiscal — apenas orçamento
                  </span>
                )}
              </div>
            </div>
            {editId !== null && (
              <button onClick={() => {
                  const f = data.faturas.find((x: any) => x.id === editId);
                  if (f) setImprimirModal({ fatura: f });
                }}
                className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-lg">
                🖨️ Imprimir
              </button>
            )}
          </div>

          <div className="flex gap-5 items-start">
            <div className="flex-1 space-y-4 min-w-0">
              {/* CLIENTE */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-slate-700">Seleccione o Cliente</label>
                  <button onClick={() => setShowNovoPaciente(true)}
                    className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold transition flex items-center gap-1 shadow-lg shadow-emerald-100">
                    ➕ Novo Cliente
                  </button>
                </div>
                <select value={form.pacienteId} onChange={handleClienteSelect}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 bg-white text-slate-700 transition">
                  <option value="">Consumidor Final</option>
                  {data.pacientes.map((p: any) => (<option key={p.id} value={p.id}>{p.nome}</option>))}
                </select>

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      NIF {(form.clienteNome && form.clienteNome !== "Consumidor Final") && <span className="text-rose-500">*</span>}
                    </p>
                    <input value={form.clienteNif}
                      onChange={e => { form.setClienteNif(e.target.value); form.setNifError(""); }}
                      onBlur={() => {
                        if (form.clienteNome !== "Consumidor Final" && !form.clienteNif.trim()) {
                          form.setNifError("NIF obrigatório para clientes identificados");
                        }
                      }}
                      className={`mt-1.5 w-full border-0 border-b py-2 text-sm text-slate-800 focus:outline-none bg-transparent transition-colors ${form.nifError ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-sky-500"}`}
                      placeholder="NIF do cliente" />
                    {form.nifError && <p className="text-xs text-rose-500 mt-1 font-bold animate-pulse">{form.nifError}</p>}
                  </div>
                  {form.clienteNome && form.clienteNome !== "Consumidor Final" && (
                    <div>
                      <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Nome</p>
                      <input value={form.clienteNome} onChange={e => form.setClienteNome(e.target.value)}
                        className="mt-1.5 w-full border-0 border-b border-slate-200 py-2 text-sm text-slate-800 focus:outline-none focus:border-sky-500 bg-transparent" />
                    </div>
                  )}
                  {form.clienteEndereco && (
                    <div>
                      <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Morada</p>
                      <input value={form.clienteEndereco} onChange={e => form.setClienteEndereco(e.target.value)}
                        className="mt-1.5 w-full border-0 border-b border-slate-200 py-2 text-sm text-slate-800 focus:outline-none focus:border-sky-500 bg-transparent" />
                    </div>
                  )}
                </div>
              </div>

              {/* ITENS */}
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">Itens</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Adicione os produtos ou serviços faturados</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-sky-700 bg-sky-50 border border-sky-100 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                      {form.linhas.length} item{form.linhas.length !== 1 ? "s" : ""}
                    </span>
                    <button onClick={() => setShowProdutosPanel(v => !v)}
                      className={`text-xs px-4 py-2 rounded-xl font-bold border transition flex items-center gap-2 ${showProdutosPanel ? "bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-100" : "border-sky-500 text-sky-500 hover:bg-sky-50"}`}>
                      📦 Ver Catálogo
                    </button>
                  </div>
                </div>

                {form.linhas.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="text-left px-5 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Produto / Serviço</th>
                          <th className="text-center px-2 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider w-20">Unid.</th>
                          <th className="text-center px-2 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider">IVA</th>
                          <th className="text-right px-2 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider">P.Unit.</th>
                          <th className="text-center px-2 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Qtd.</th>
                          <th className="text-right px-5 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total</th>
                          <th className="w-8 px-2 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.linhas.map((l, i) => {
                          const sub = l.quantidade * l.precoUnitario;
                          return (
                            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3">
                                <input value={l.descricao} onChange={e => handleUpdateLinha(i, "descricao", e.target.value)}
                                  className="text-sm font-semibold text-slate-800 w-full border-0 border-b border-transparent hover:border-slate-200 focus:border-sky-500 focus:outline-none bg-transparent py-0.5 transition-all" />
                              </td>
                              <td className="px-2 py-3 text-center">
                                <input value={l.unidade || ""} onChange={e => handleUpdateLinha(i, "unidade", e.target.value)}
                                  placeholder="un" className="w-16 text-xs text-center border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:border-sky-500 font-bold" />
                              </td>
                              <td className="px-2 py-3 text-center">
                                <button onClick={() => handleUpdateLinha(i, "ivaIsento", !l.ivaIsento)}
                                  className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all ${l.ivaIsento ? "bg-slate-100 text-slate-500 border border-slate-200" : "bg-sky-50 text-sky-600 border border-sky-100"}`}>
                                  {l.ivaIsento ? "Isento" : `${form.ivaTaxa}%`}
                                </button>
                              </td>
                              <td className="px-2 py-3 text-right">
                                <input type="number" value={l.precoUnitario} min={0} step={0.01}
                                  onChange={e => handleUpdateLinha(i, "precoUnitario", Number(e.target.value))}
                                  className="w-24 border border-slate-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-sky-500 font-bold" />
                              </td>
                              <td className="px-2 py-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button onClick={() => handleUpdateLinha(i, "quantidade", Math.max(-999, l.quantidade - 1))}
                                    className="w-6 h-6 rounded-lg border border-slate-200 text-slate-400 hover:border-sky-500 hover:text-sky-500 flex items-center justify-center text-xs transition-colors font-black bg-white shadow-sm">−</button>
                                  <input type="number" value={l.quantidade}
                                    onChange={e => handleUpdateLinha(i, "quantidade", Number(e.target.value))}
                                    className="w-12 border border-slate-200 rounded px-1 py-1 text-xs text-center focus:outline-none focus:border-sky-500 font-bold" />
                                  <button onClick={() => handleUpdateLinha(i, "quantidade", l.quantidade + 1)}
                                    className="w-6 h-6 rounded-lg border border-slate-200 text-slate-400 hover:border-sky-500 hover:text-sky-500 flex items-center justify-center text-xs transition-colors font-black bg-white shadow-sm">+</button>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <span className="text-sm font-black text-slate-800">{formatCurrency(sub, moeda)}</span>
                              </td>
                              <td className="px-2 py-3 text-center">
                                <button onClick={() => handleRemoverLinha(i)} title="Remover linha"
                                  className="w-7 h-7 rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-400 flex items-center justify-center text-sm font-bold transition-all">×</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-6 bg-slate-50/50">
                      <div className="flex flex-col items-end gap-1 text-xs text-slate-500">
                        <div className="flex gap-4"><span>Subtotal s/IVA</span><span className="font-bold w-32 text-right">{formatCurrency(form.totals.subtotalSemIva, moeda)}</span></div>
                        <div className="flex gap-4"><span>IVA ({form.ivaTaxa}%)</span><span className="font-bold w-32 text-right">{formatCurrency(form.totals.totalIva, moeda)}</span></div>
                        <div className="flex gap-4 pt-1.5 border-t border-slate-200 mt-1">
                          <span className="text-sm font-bold text-slate-700">Total</span>
                          <span className="text-sm font-black text-sky-500 w-32 text-right">{formatCurrency(form.totals.total, moeda)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center text-slate-300">
                    <div className="text-5xl mb-3">📦</div>
                    <p className="text-sm font-bold text-slate-500">Nenhum item adicionado.</p>
                    <p className="text-xs text-slate-400 mt-1">Pesquise abaixo ou use o catálogo de produtos à direita.</p>
                  </div>
                )}

                <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/30">
                  <div className="relative">
                    <div className={`flex items-center gap-2 border rounded-xl bg-white px-3.5 py-3 transition-all ${showDropdown ? "border-sky-500 ring-4 ring-sky-500/10 shadow-sm" : "border-slate-200 hover:border-slate-300"}`}>
                      <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3 mr-1.5">
                        <button type="button" onClick={() => setProdutoQtd(q => Math.max(1, q - 1))}
                          className="w-7 h-7 rounded-full border border-sky-500 text-sky-500 flex items-center justify-center text-sm font-black hover:bg-sky-500 hover:text-white transition-all flex-shrink-0 bg-white shadow-sm">−</button>
                        <input type="number" value={produtoQtd} min={1}
                          onChange={e => setProdutoQtd(Math.max(1, Number(e.target.value)))}
                          className="w-10 text-center text-sm border-0 focus:outline-none font-bold text-slate-800" />
                        <button type="button" onClick={() => setProdutoQtd(q => q + 1)}
                          className="w-7 h-7 rounded-full border border-sky-500 text-sky-500 flex items-center justify-center text-sm font-black hover:bg-sky-500 hover:text-white transition-all flex-shrink-0 bg-white shadow-sm">+</button>
                      </div>
                      <span className="text-slate-400 text-lg">🔍</span>
                      <input ref={searchInputRef} value={produtoSearch}
                        onChange={e => setProdutoSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        onFocus={() => { if (produtosFiltrados.length > 0) setShowDropdown(true); }}
                        placeholder="Pesquisar produto por nome ou código..."
                        className="flex-1 text-sm focus:outline-none text-slate-800 placeholder-slate-400 bg-transparent font-medium" />
                      {produtoSearch && (
                        <button type="button" onClick={() => { setProdutoSearch(""); setShowDropdown(false); searchInputRef.current && searchInputRef.current.focus(); }}
                          className="text-slate-300 hover:text-slate-500 text-lg leading-none transition-colors flex-shrink-0">×</button>
                      )}
                    </div>
                    {showDropdown && produtosFiltrados.length > 0 && (
                      <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                          <span className="text-xs text-slate-400 font-bold">{produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? "s" : ""} encontrado{produtosFiltrados.length !== 1 ? "s" : ""}</span>
                        </div>
                        {produtosFiltrados.map((p, idx) => (
                          <button key={p.id} type="button" onMouseDown={e => e.preventDefault()} onClick={() => handleAddProduto(p)}
                            className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors text-left border-b border-slate-50 last:border-0 ${dropdownIndex === idx ? "bg-sky-50/80" : "hover:bg-slate-50"}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-sky-600 text-xs font-extrabold">{p.nome.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-slate-800 truncate">{p.nome}</div>
                                <div className="text-xs text-slate-400 font-medium">{p.codigo}</div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                              <div className="text-sm font-black text-sky-600">{formatCurrency(p.preco, moeda)}</div>
                              {p.ivaIsento && <div className="text-[10px] text-amber-600 font-extrabold uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 mt-0.5">IVA isento</div>}
                            </div>
                          </button>
                        ))}
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => handleAddProduto()}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-t border-slate-100 text-left">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-emerald-500 text-base font-bold">+</span>
                          </div>
                          <span className="text-sm text-slate-500 font-bold">Criar item <span className="font-extrabold text-slate-800">"{produtoSearch}"</span> manualmente</span>
                        </button>
                      </div>
                    )}
                    {produtoSearch.trim() && !showDropdown && produtosFiltrados.length === 0 && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                        <div className="px-5 py-4 flex items-center justify-between">
                          <span className="text-sm text-slate-500 font-semibold">Nenhum produto para <span className="font-bold text-slate-700">"{produtoSearch}"</span></span>
                          <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => handleAddProduto()}
                            className="text-xs text-sky-600 hover:underline font-extrabold ml-3 flex-shrink-0">+ Adicionar como item livre</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2.5 font-semibold">↑↓ para navegar · Enter para seleccionar · Esc para fechar</p>
                </div>
              </div>

              {/* OBSERVAÇÕES */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-800">Observações</h3>
                <div className="mt-3">
                  <textarea value={form.observacoes} onChange={e => form.setObservacoes(e.target.value)} rows={3}
                    placeholder="Escreva observações, notas ou termos de pagamento"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition resize-none placeholder-slate-400" />
                </div>
              </div>
            </div>

            {/* PAINEL LATERAL */}
            <div className="w-80 flex-shrink-0 space-y-4">
              {showProdutosPanel && (
                <div className="bg-white border border-sky-500/30 rounded-3xl overflow-hidden shadow-xl animate-in slide-in-from-right duration-300">
                  <div className="px-5 py-4 border-b border-slate-100 bg-sky-50 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-sky-900">Catálogo de Produtos</h3>
                      <p className="text-xs text-sky-700 font-semibold mt-0.5">{catalogTotalFiltrados} de {produtos.length} produtos</p>
                    </div>
                    <button onClick={() => { setShowProdutosPanel(false); setCatalogSearch(""); setCatalogCat(null); }}
                      className="text-sky-400 hover:text-sky-700 w-6 h-6 flex items-center justify-center rounded-full hover:bg-sky-100 transition text-lg leading-none font-bold">×</button>
                  </div>
                  <div className="px-4 pt-3.5 pb-2.5 border-b border-slate-100">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                      <input type="text" value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)}
                        placeholder="Filtrar catálogo…"
                        className="w-full pl-8 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 transition font-medium" autoFocus />
                      {catalogSearch && (
                        <button type="button" onClick={() => setCatalogSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm leading-none transition">×</button>
                      )}
                    </div>
                  </div>
                  {catalogCats.length > 1 && (
                    <div className="px-4 py-2 flex gap-1.5 flex-wrap border-b border-slate-100 bg-slate-50/50">
                      <button type="button" onClick={() => setCatalogCat(null)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${catalogCat === null ? "bg-sky-500 text-white shadow-sm shadow-sky-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Todas</button>
                      {catalogCats.map(cat => (
                        <button key={cat} type="button" onClick={() => setCatalogCat(catalogCat === cat ? null : cat)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${catalogCat === cat ? "bg-sky-500 text-white shadow-sm shadow-sky-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{cat}</button>
                      ))}
                    </div>
                  )}
                  <div className="max-h-80 overflow-y-auto">
                    {catalogTotalFiltrados === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-sm">Nenhum produto corresponde.</div>
                    ) : Object.entries(produtosPorCategoria).map(([cat, prods]) => (
                      <div key={cat}>
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 sticky top-0 flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-600 font-extrabold px-1.5 py-0.5 rounded-full">{prods.length}</span>
                        </div>
                        {prods.map(p => (
                          <button key={p.id} type="button" onClick={() => handleAddProdutoFromPanel(p)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-sky-50/50 transition-colors text-left border-b border-slate-50 last:border-0 group">
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="text-sm font-semibold text-slate-800 truncate group-hover:text-sky-600 transition-colors">{p.nome}</div>
                              {p.codigo && <div className="text-xs text-slate-400 font-medium">{p.codigo}</div>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-black text-sky-600">{formatCurrency(p.preco, moeda)}</div>
                              {p.ivaIsento && <div className="text-[9px] text-amber-600 font-bold uppercase bg-amber-50 border border-amber-100 px-1 mt-0.5 rounded">s/IVA</div>}
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DEFINIÇÕES */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-black text-slate-700">Definições do Documento</h3>
                </div>

                {/* Tipo de Documento */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 hover:bg-slate-50/40 transition">
                  <div className="flex items-center gap-3.5 flex-1">
                    <span className="text-slate-400 text-lg">📋</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Documento</div>
                      <select value={form.tipoDocumento}
                        onChange={e => {
                          const novoTipo = e.target.value;
                          form.setTipoDocumento(novoTipo);
                          if (novoTipo === "pro-forma") form.setEstado("rascunho");
                        }}
                        className="text-sm text-slate-800 border-0 focus:outline-none bg-transparent w-full mt-0.5 cursor-pointer font-black text-sky-600">
                        {TIPO_DOC_OPTS.map(t => (<option key={t.value} value={t.value}>{t.label} ({t.code})</option>))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Clinica */}
                <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/20">
                  <div className="flex items-center gap-3.5 mb-1">
                    <span className="text-slate-400 text-lg">🏥</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Emitente</div>
                      <div className="text-sm text-slate-800 font-extrabold mt-0.5">{config.nomeClinica}</div>
                      {config.nif && <div className="text-xs text-slate-400 mt-0.5 font-bold">NIF: {config.nif}</div>}
                      {config.endereco && <div className="text-xs text-slate-400 font-semibold">{config.endereco}</div>}
                    </div>
                  </div>
                </div>

                {/* Data de Emissão */}
                <div className="flex items-center px-5 py-4 border-b border-slate-50 hover:bg-slate-50/40 transition">
                  <div className="flex items-center gap-3.5 flex-1">
                    <span className="text-slate-400 text-lg">📅</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data de Emissão</div>
                      <input value={form.dataEmissao} onChange={e => form.setDataEmissao(e.target.value)}
                        className="text-sm text-slate-800 font-bold border-0 border-b border-slate-200 focus:outline-none focus:border-sky-500 bg-transparent w-full mt-1 transition" placeholder="DD/MM/AAAA" />
                    </div>
                  </div>
                </div>

                {/* Data de Vencimento */}
                <div className="flex items-center px-5 py-4 border-b border-slate-50 hover:bg-slate-50/40 transition">
                  <div className="flex items-center gap-3.5 flex-1">
                    <span className="text-slate-400 text-lg">⏳</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vencimento</div>
                      <input value={form.dataVenc} onChange={e => form.setDataVenc(e.target.value)}
                        className="text-sm text-slate-800 font-bold border-0 border-b border-slate-200 focus:outline-none focus:border-sky-500 bg-transparent w-full mt-1 transition" placeholder="DD/MM/AAAA" />
                    </div>
                  </div>
                </div>

                {/* Estado */}
                <div className="flex items-center px-5 py-4 border-b border-slate-50 hover:bg-slate-50/40 transition">
                  <div className="flex items-center gap-3.5 flex-1">
                    <span className="text-slate-400 text-lg">💎</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado do Documento</div>
                      <select value={form.estado} onChange={e => form.setEstado(e.target.value)}
                        disabled={isProforma}
                        className={`text-sm font-bold border-0 focus:outline-none bg-transparent w-full mt-0.5 ${isProforma ? "text-slate-400 cursor-not-allowed" : "text-slate-800 cursor-pointer"}`}>
                        <option value="emitida">Emitida</option>
                        <option value="paga">Paga</option>
                        <option value="rascunho">Rascunho</option>
                        <option value="anulada">Anulada</option>
                      </select>
                      {isProforma && <p className="text-[10px] text-amber-600 font-bold mt-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 w-max">📋 Pró-Forma é sempre Rascunho</p>}
                    </div>
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div className="flex items-center px-5 py-4 border-b border-slate-50 hover:bg-slate-50/40 transition">
                  <div className="flex items-center gap-3.5 flex-1">
                    <span className="text-slate-400 text-lg">💳</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Forma de Pagamento</div>
                      <select value={form.formaPagamento} onChange={e => { form.setFormaPagamento(e.target.value); form.setValorRecebido(""); }}
                        className="text-sm text-slate-800 font-bold border-0 focus:outline-none bg-transparent w-full mt-0.5 cursor-pointer">
                        <option value="">— Seleccionar —</option>
                        {FORMA_PAG_OPTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bloco de Numerário */}
                {form.formaPagamento === "Numerário" && (
                  <div className="mx-4 my-3 rounded-2xl bg-emerald-50 border border-emerald-200 overflow-hidden shadow-inner">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 border-b border-emerald-200 text-emerald-800 font-bold">
                      <span className="text-base">💵</span>
                      <span className="text-xs font-extrabold tracking-wide uppercase">Cálculo de Trocos</span>
                    </div>
                    <div className="px-4 py-4 space-y-3">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider mb-1 block">Total a Cobrar</label>
                        <div className="text-xl font-black text-emerald-800">{formatCurrency(form.totals.total, moeda)}</div>
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider mb-1 block">Valor Entregue</label>
                        <input type="number" min={0} step={0.01} value={form.valorRecebido}
                          onChange={e => form.setValorRecebido(e.target.value === "" ? "" : Number(e.target.value))}
                          onFocus={e => e.target.select()} placeholder="0.00"
                          className={`w-full border rounded-xl px-3 py-2 text-sm font-extrabold text-right focus:outline-none transition ${form.trocoNegativo ? "border-rose-300 bg-rose-50 focus:border-rose-400 text-rose-700" : "border-emerald-300 bg-white focus:border-emerald-500 text-slate-800"}`} />
                        {form.trocoNegativo && (
                          <p className="text-xs text-rose-600 mt-1.5 font-bold">⚠ Falta cobrar {formatCurrency(form.totals.total - Number(form.valorRecebido || 0), moeda)}</p>
                        )}
                      </div>
                      <div className={`rounded-xl p-3 border ${form.troco > 0 ? "bg-white border-emerald-300 shadow-sm" : "bg-emerald-100/30 border-emerald-200"}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-700">Troco a devolver</span>
                          <span className={`text-lg font-black ${form.troco > 0 ? "text-emerald-600" : "text-emerald-400"}`}>{formatCurrency(form.troco, moeda)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Desconto */}
                <div className="flex items-center px-5 py-4 border-b border-slate-50 hover:bg-slate-50/40 transition">
                  <div className="flex items-center gap-3.5 flex-1">
                    <span className="text-slate-400 text-lg">🏷️</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Desconto (%)</div>
                      <input type="number" value={form.desconto} min={0} max={100}
                        onChange={e => form.setDesconto(Number(e.target.value))}
                        className="text-sm text-slate-800 font-bold border-0 border-b border-slate-200 focus:outline-none focus:border-sky-500 bg-transparent w-full mt-1" placeholder="0%" />
                    </div>
                  </div>
                </div>

                {/* IVA */}
                <div className="flex items-center px-5 py-4 border-b border-slate-50 hover:bg-slate-50/40 transition">
                  <div className="flex items-center gap-3.5 flex-1">
                    <span className="text-slate-400 text-lg">💰</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taxa IVA (%)</div>
                      <input type="number" value={form.ivaTaxa} min={0} max={100}
                        onChange={e => form.setIvaTaxa(Number(e.target.value))}
                        className="text-sm text-slate-800 font-bold border-0 border-b border-slate-200 focus:outline-none focus:border-sky-500 bg-transparent w-full mt-1" />
                    </div>
                  </div>
                </div>

                {/* Sorteio AGT */}
                <div className="flex items-center px-5 py-4 border-b border-slate-50 hover:bg-slate-50/40 transition">
                  <label className="flex items-center gap-3.5 cursor-pointer flex-1 select-none">
                    <span className="text-slate-400 text-lg">🏆</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Factura Premiada</div>
                      <div className="text-xs text-slate-400 font-semibold">Participar automaticamente no sorteio AGT</div>
                    </div>
                    <button type="button" onClick={() => form.setFacturaPremiada(v => !v)} role="switch" aria-checked={form.facturaPremiada}
                      className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${form.facturaPremiada ? "bg-amber-400 shadow-md shadow-amber-100" : "bg-slate-200"}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all ${form.facturaPremiada ? "left-5" : "left-0.5"}`} />
                    </button>
                  </label>
                </div>

                {/* BOTÕES FIXOS NA BARRA LATERAL */}
                <div className="p-5 space-y-3 bg-white sticky bottom-0 border-t border-slate-100 shadow-2xl">
                  <button onClick={handleSave}
                    className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 active:scale-95 text-white py-3.5 rounded-2xl text-sm font-black transition-all shadow-xl shadow-sky-100 flex items-center justify-center gap-2">
                    ✅ {editId !== null ? "Guardar Alterações" : `Emitir ${tipoLabel}`}
                  </button>
                  {form.nifError && <p className="text-xs text-rose-500 font-bold text-center">{form.nifError}</p>}
                  <button onClick={() => { form.resetForm(); setEditId(null); setView("lista"); }}
                    className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-rose-500 hover:text-rose-700 hover:underline transition font-bold">
                    🗑️ {editId !== null ? "Cancelar Edição" : "Descartar Fatura"}
                  </button>
                </div>
              </div>

              {form.totals.total !== 0 && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-950 rounded-3xl p-5 shadow-xl text-white space-y-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Resumo Geral de Valores</p>
                  <div className="flex justify-between text-xs py-1 border-b border-white/5"><span className="text-slate-300 font-medium">Subtotal sem IVA</span><span className="font-extrabold">{formatCurrency(form.totals.subtotalSemIva, moeda)}</span></div>
                  <div className="flex justify-between text-xs py-1 border-b border-white/5"><span className="text-slate-300 font-medium">Impostos IVA ({form.ivaTaxa}%)</span><span className="font-extrabold">{formatCurrency(form.totals.totalIva, moeda)}</span></div>
                  <div className="flex justify-between text-sm font-black pt-1.5"><span>Total do Documento</span><span className="text-sky-400 text-lg font-black">{formatCurrency(form.totals.total, moeda)}</span></div>
                  {form.formaPagamento === "Numerário" && form.valorRecebido !== "" && Number(form.valorRecebido) > 0 && (
                    <>
                      <div className="flex justify-between text-xs pt-1 border-t border-white/5"><span className="text-slate-400">Total Pago</span><span className="font-bold text-slate-200">{formatCurrency(Number(form.valorRecebido), moeda)}</span></div>
                      <div className={`flex justify-between text-sm font-black pt-0.5 ${form.troco > 0 ? "text-emerald-400" : "text-rose-400"}`}><span>Troco calculado</span><span>{formatCurrency(form.troco, moeda)}</span></div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Novo Paciente */}
        {showNovoPaciente && <ModalNovoPaciente onClose={() => setShowNovoPaciente(false)} onSave={handleCriarPaciente} />}

        {/* Modal Imprimir */}
        {imprimirModal && (
          <ModalImprimir
            fatura={imprimirModal.fatura}
            config={data.config}
            onClose={() => setImprimirModal(null)}
          />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: LISTA DE DOCUMENTOS
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-full bg-slate-50/50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-sky-600 font-extrabold hover:underline cursor-pointer">Faturação</span>
          <span className="text-slate-300 font-black">/</span>
          <span className="text-slate-500 font-bold">Listagem de Documentos</span>
        </div>
        <button onClick={handleNovo}
          className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 active:scale-95 text-white px-5 py-2.5 rounded-2xl text-sm font-black transition-all flex items-center gap-2 shadow-lg shadow-sky-100">
          📄 Criar Documento
        </button>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto flex gap-5 items-start">
        <div className="flex-1 min-w-0 space-y-4">

          {/* Campo de Pesquisa Premium */}
          <form 
            onSubmit={(e) => e.preventDefault()}
            className="bg-white border border-slate-200 rounded-3xl p-3 flex gap-3 shadow-sm hover:border-slate-300 transition-all duration-300"
          >
            <div className="flex-1 flex items-center gap-3 border border-slate-100 rounded-2xl px-4 py-2.5 bg-slate-50">
              <span className="text-slate-400 text-lg">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar por número de documento, nome ou NIF do cliente..."
                className="flex-1 text-sm focus:outline-none text-slate-800 placeholder-slate-400 bg-transparent font-medium" />
            </div>
            <button 
              type="submit"
              className="bg-sky-500 text-white px-6 py-2.5 rounded-2xl text-sm font-black hover:bg-sky-600 transition-all shadow-md shadow-sky-100 active:scale-95"
            >
              Pesquisar
            </button>
          </form>

          {rascunhos.length > 0 && (
            <div className="border border-amber-200 rounded-3xl overflow-hidden bg-amber-50/50 shadow-sm animate-in fade-in duration-300">
              <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-amber-100/20 transition-all" onClick={() => setShowRascunhos(s => !s)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-200 border border-white/20">
                    <span className="text-white text-base">✏️</span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-amber-900">Rascunhos Pendentes</div>
                    <div className="text-xs text-amber-600 font-bold mt-0.5">{rascunhos.length} documento{rascunhos.length > 1 ? "s" : ""} em edição</div>
                  </div>
                </div>
                <span className="text-amber-500 font-black text-lg bg-white w-7 h-7 rounded-full shadow-sm flex items-center justify-center border border-amber-200">{showRascunhos ? "▲" : "▼"}</span>
              </button>
              {showRascunhos && rascunhos.map(f => (
                <div key={f.id} onClick={() => handleEdit(f)}
                  className="flex items-center gap-4 px-5 py-3.5 border-t border-amber-100 hover:bg-amber-100/40 transition cursor-pointer">
                  <FTAvatar tipo={f.tipoDocumento} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-slate-800">{f.numero}</div>
                    <div className="text-xs text-slate-500 font-bold truncate mt-0.5">{f.clienteNome}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-800">{formatCurrency(f.total, moeda)}</div>
                    <div className="text-[10px] text-slate-400 font-bold mt-0.5">{f.data}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleRemover(f); }}
                    className="text-xs text-rose-500 border border-rose-200 bg-white hover:bg-rose-50 w-8 h-8 rounded-xl flex items-center justify-center transition-all font-bold shadow-sm ml-2">🗑</button>
                </div>
              ))}
            </div>
          )}

          {/* Listagem de Documentos Emitidos */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            {outros.length === 0 && (
              <div className="py-20 text-center">
                <div className="text-5xl mb-4">📄</div>
                <p className="text-sm font-extrabold text-slate-500">Nenhum documento faturado ainda.</p>
                <button onClick={handleNovo} className="mt-4 text-xs text-sky-600 hover:underline font-black bg-sky-50 border border-sky-100 px-4 py-2 rounded-xl transition">Criar primeiro documento</button>
              </div>
            )}

            {outros.map(f => {
              const cores = ESTADO_CORES[f.estado] || ESTADO_CORES.rascunho;
              const vencida = isVencida(f.dataVencimento, f.estado);
              const podeDeletar = f.estado === "rascunho" || f.estado === "anulada";

              // Bordas e fundos dinâmicos baseados no estado para dar vida à página
              const rowBorder = f.estado === "paga" ? "border-l-emerald-500 bg-emerald-50/5 hover:bg-emerald-50/20"
                : f.estado === "anulada" ? "border-l-slate-300 bg-slate-50/20 hover:bg-slate-50/40 opacity-70"
                : f.estado === "rascunho" ? "border-l-amber-500 bg-amber-50/10 hover:bg-amber-50/20"
                : vencida ? "border-l-rose-500 bg-rose-50/10 hover:bg-rose-50/20 animate-pulse"
                : "border-l-sky-500 bg-white hover:bg-sky-50/10";

              return (
                <div key={f.id}
                  className={`flex items-center gap-4 px-5 py-4.5 border-b border-slate-100 last:border-0 transition cursor-pointer border-l-[6px] ${rowBorder}`}
                  onClick={() => handleEdit(f)}>
                  <FTAvatar tipo={f.tipoDocumento} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900">{f.numero}</span>
                      {f.tipoDocumento && f.tipoDocumento !== "factura" && (
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          f.tipoDocumento === "factura-global" ? "bg-purple-100 text-purple-700 border border-purple-200" :
                          f.tipoDocumento === "pro-forma" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                          f.tipoDocumento === "nota-credito" ? "bg-rose-100 text-rose-700 border border-rose-200" :
                          "bg-slate-100 text-slate-700"
                        }`}>{TIPO_LABEL[f.tipoDocumento] || f.tipoDocumento}</span>
                      )}
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${cores.bg} ${cores.text} border ${cores.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cores.dot}`}/>{ESTADO_LABEL[f.estado] || f.estado}
                      </span>
                      {vencida && <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black tracking-wide uppercase animate-bounce">⚠️ Vencida</span>}
                    </div>
                    <div className="text-xs text-slate-500 font-bold truncate mt-1">{f.clienteNome}</div>
                    {f.formaPagamento && <div className="text-[10px] text-slate-400 font-extrabold mt-0.5 uppercase">💳 {f.formaPagamento}</div>}
                  </div>
                  <div className="text-right flex-shrink-0 pr-2">
                    <div className={`text-base font-black ${f.estado === "paga" ? "text-emerald-600" : f.estado === "anulada" ? "text-slate-400" : "text-slate-950"}`}>
                      {formatCurrency(f.total, moeda)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-extrabold mt-0.5">{f.data}</div>
                  </div>

                  {/* Botões de Ação Dinâmicos e Coloridos */}
                  <div className="flex gap-2 ml-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setImprimirModal({ fatura: f })}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl transition font-black shadow-sm flex items-center gap-1" title="Imprimir">
                      🖨️ <span className="hidden md:inline">Imprimir</span>
                    </button>
                    <button onClick={() => downloadFatura(`<style>${faturaColorCSS}</style>${generateFaturaHTML(f, data.config, { segundaVia: false })}`, f.numero)}
                      className="text-xs bg-sky-50 hover:bg-sky-100 text-sky-600 px-3 py-2 rounded-xl transition font-black border border-sky-100 shadow-sm flex items-center gap-1">
                      PDF
                    </button>
                    {f.estado === "emitida" && (
                      <button onClick={() => handleMarcarPaga(f)}
                        className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl transition font-black shadow-lg shadow-emerald-100 active:scale-95">
                        Pagar
                      </button>
                    )}
                    {f.estado === "paga" && (
                      <button onClick={() => handleEmitirRecibo(f)}
                        className="text-xs bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-xl transition font-black shadow-lg shadow-teal-100">
                        Recibo
                      </button>
                    )}
                    {(f.estado === "emitida" || f.estado === "paga") && (
                      <button onClick={() => handleNotaCredito(f)}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl transition font-black shadow-md shadow-amber-100">
                        NC
                      </button>
                    )}
                    {f.estado !== "paga" && f.estado !== "anulada" && (
                      <button onClick={() => { if (confirm(`Anular ${f.numero}?`)) updateFatura(f.id, { estado: "anulada" }); }}
                        className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-500 px-3 py-2 rounded-xl transition font-black border border-rose-100 shadow-sm">
                        Anular
                      </button>
                    )}
                    <button onClick={() => handleRemover(f)} disabled={!podeDeletar}
                      title={!podeDeletar ? "Não é possível eliminar" : "Eliminar"}
                      className={`text-xs px-3 py-2 rounded-xl transition font-black shadow-sm ${podeDeletar ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-100" : "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100"}`}>
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PAINEL LATERAL PREMIUM */}
        <div className="w-80 flex-shrink-0 space-y-4">

          {/* Card de Filtro de Estados */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-black text-slate-700">Filtro de Documentos</h3>
            </div>
            <div className="px-5 py-4 border-b border-slate-50">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Filtrar por Estado</div>
              <div className="space-y-1.5">
                {[
                  { val: "todos", label: "Todos os Documentos", dot: "bg-slate-400", count: data.faturas.filter((f: any) => f.estado !== "rascunho").length },
                  { val: "emitida", label: "Emitidas", dot: "bg-blue-500", count: data.faturas.filter((f: any) => f.estado === "emitida").length },
                  { val: "paga", label: "Pagas", dot: "bg-emerald-500", count: data.faturas.filter((f: any) => f.estado === "paga").length },
                  { val: "rascunho", label: "Rascunhos", dot: "bg-amber-400", count: data.faturas.filter((f: any) => f.estado === "rascunho").length },
                  { val: "anulada", label: "Anuladas", dot: "bg-rose-400", count: data.faturas.filter((f: any) => f.estado === "anulada").length },
                ].map(o => (
                  <label key={o.val} className={`flex items-center gap-3 cursor-pointer text-xs rounded-xl px-3 py-2 transition ${filtroEstado === o.val ? "bg-sky-50/80 font-black text-sky-800" : "text-slate-600 hover:bg-slate-50 font-bold"}`}>
                    <input type="radio" name="filtroEstado" value={o.val} checked={filtroEstado === o.val} onChange={() => setFiltroEstado(o.val)} className="sr-only" />
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${o.dot}`} />
                    <span className="flex-1">{o.label}</span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${filtroEstado === o.val ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-400"}`}>{o.count}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button onClick={handleLimparFiltros}
                className="w-full text-center text-xs font-black py-2 rounded-xl bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 transition flex items-center justify-center gap-1 shadow-sm">
                🗑️ Limpar Filtros
              </button>
            </div>
          </div>

          {/* Card de Filtro de Tipos com Avatares Visuais */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipos de Documento</p>
            <div className="space-y-1.5 text-xs">
              {[
                { tipo: "todos", label: "Todos os tipos" },
                { tipo: "factura", label: "Faturas" },
                { tipo: "factura-global", label: "Faturas Globais" },
                { tipo: "pro-forma", label: "Orçamentos Pró-Forma" },
                { tipo: "nota-credito", label: "Notas de Crédito" },
              ].map(({ tipo, label }) => {
                const isActive = filtroTipo === tipo;
                const count = tipo === "todos" ? data.faturas.length : data.faturas.filter((f: any) => (f.tipoDocumento || "factura") === tipo).length;

                let miniBg = "bg-sky-500";
                let miniCode = "FT";
                if (tipo === "factura-global") { miniBg = "bg-purple-600"; miniCode = "FG"; }
                else if (tipo === "pro-forma") { miniBg = "bg-amber-500"; miniCode = "PF"; }
                else if (tipo === "nota-credito") { miniBg = "bg-rose-500"; miniCode = "NC"; }

                return (
                  <button key={tipo} onClick={() => setFiltroTipo(tipo)}
                    className={`w-full flex items-center gap-3 rounded-xl px-2 py-1.5 transition text-left ${isActive ? "bg-sky-50/80 font-black text-sky-700" : "text-slate-600 hover:bg-slate-50 font-bold"}`}>
                    {tipo === "todos" ? (
                      <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0"><span className="text-slate-500 text-xs font-black">·</span></div>
                    ) : (
                      <div className={`w-8 h-8 rounded-lg ${miniBg} flex items-center justify-center flex-shrink-0 shadow-sm`}><span className="text-white text-[10px] font-black">{miniCode}</span></div>
                    )}
                    <span className="flex-1 truncate">{label}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-400"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Widget de Resumo Executivo (KPI Dashboard) */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-950 rounded-3xl p-5 shadow-xl text-white space-y-3.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo Geral de Valores</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">📂 Total de documentos</span>
                <span className="font-extrabold text-slate-200 text-sm bg-white/10 px-2.5 py-0.5 rounded-full">{stats.total}</span>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-wide">Total Recebido</div>
                  <div className="text-base font-black text-emerald-300 mt-0.5">{formatCurrency(stats.recebido, moeda)}</div>
                </div>
                <span className="text-2xl">💰</span>
              </div>
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-black text-sky-400 uppercase tracking-wide">Valor Pendente</div>
                  <div className="text-base font-black text-sky-300 mt-0.5">{formatCurrency(stats.pendente, moeda)}</div>
                </div>
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL SUCESSO */}
      {sucessoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden transform scale-100 transition-all">
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-lg"><span className="text-xl">✅</span></div>
                <div>
                  <h3 className="font-extrabold text-lg">Documento Emitido!</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">{sucessoModal.mensagem}</p>
                </div>
              </div>
              <button onClick={() => { setSucessoModal(null); setView("lista"); }}
                className="text-white/80 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4 bg-slate-50/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cliente / Utente</p>
                  <p className="text-sm font-black text-slate-800 truncate mt-0.5">{sucessoModal.fatura.clienteNome}</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Faturado</p>
                  <p className="text-sm font-black text-sky-600 mt-0.5">{formatCurrency(sucessoModal.fatura.total, moeda)}</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Data de Registo</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{sucessoModal.fatura.data}</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Estado Atual</p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-black uppercase mt-1.5 inline-block ${
                    sucessoModal.fatura.estado === "paga" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                    sucessoModal.fatura.estado === "emitida" ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>{ESTADO_LABEL[sucessoModal.fatura.estado]}</span>
                </div>
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">📱 Validação AGT + Código de Barras</span>
                </div>
                <div className="p-4 flex items-center gap-4">
                  <QRCodeAGT size={80} />
                  <div className="flex-1">
                    <BarcodeSimples valor={sucessoModal.fatura.total} refe={sucessoModal.fatura.numero.replace(/\//g, "")} />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 bg-slate-100 border-t border-slate-200 space-y-2.5">
              <button onClick={() => { setImprimirModal({ fatura: sucessoModal.fatura }); setSucessoModal(null); }}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2">
                🖨️ Imprimir Documento Fiscal
              </button>
              <div className="flex gap-2.5">
                <button onClick={() => { setSucessoModal(null); setView("lista"); }}
                  className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold transition-all shadow-md shadow-sky-100">✓ Concluir</button>
                <button onClick={() => { setSucessoModal(null); handleNovo(); }}
                  className="flex-1 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-bold transition-all">➕ Nova Factura</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOTA DE CRÉDITO */}
      {ncModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-rose-500 to-rose-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg">Nota de Crédito (Anulação/Retificação)</h3>
                <p className="text-xs text-rose-100 mt-0.5">Referente a: <strong>{ncModal.fatura.numero}</strong></p>
              </div>
              <button onClick={() => setNcModal(null)} className="text-white/80 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Motivo de Retificação / Anulação <span className="text-rose-500">*</span></label>
                <textarea value={ncMotivo} onChange={e => setNcMotivo(e.target.value)} rows={3}
                  placeholder="Ex: Devolução de valores, erro de faturamento, duplicação de serviços..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-slate-300 resize-none font-medium" autoFocus />
                <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">Este campo é de preenchimento obrigatório nos termos da Lei n.º 2/22 (AGT) de Angola.</p>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 space-y-1 font-bold">
                <div><strong>Cliente:</strong> {ncModal.fatura.clienteNome}</div>
                <div className="pt-1"><strong>Total retificado:</strong> {formatCurrency(ncModal.fatura.total, moeda)}</div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={() => setNcModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-100 transition">Cancelar</button>
              <button onClick={() => {
                  if (!ncMotivo.trim()) {
                    alert("O motivo é de preenchimento obrigatório.");
                    return;
                  }
                  confirmarNotaCredito(ncModal.fatura, ncMotivo.trim());
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition shadow-lg shadow-rose-100">
                ✓ Emitir Nota de Crédito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECIBO */}
      {reciboModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-teal-600 to-teal-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg">Quitação de Fatura (Recibo)</h3>
                <p className="text-xs text-teal-100 mt-0.5">Liquidando o documento: <strong>{reciboModal.fatura.numero}</strong></p>
              </div>
              <button onClick={() => setReciboModal(null)} className="text-white/80 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 text-xs text-teal-800 space-y-1 font-bold">
                <div><strong>Cliente / Utente:</strong> {reciboModal.fatura.clienteNome}</div>
                <div className="pt-1"><strong>Total do pagamento:</strong> {formatCurrency(reciboModal.fatura.total, moeda)}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Meio de Pagamento Utilizado</label>
                <select value={reciboFormaPag} onChange={e => setReciboFormaPag(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 bg-white font-bold text-slate-700">
                  <option value="">— Seleccionar —</option>
                  {FORMA_PAG_OPTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={() => setReciboModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-100 transition">Agora Não</button>
              <button onClick={() => confirmarRecibo(reciboModal.fatura, reciboFormaPag)}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition shadow-lg shadow-teal-100">
                🧾 Emitir Recibo Oficial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPRIMIR (lista) */}
      {imprimirModal && (
        <ModalImprimir
          fatura={imprimirModal.fatura}
          config={data.config}
          onClose={() => setImprimirModal(null)}
        />
      )}
    </div>
  );
}
