import { useState, useCallback, useMemo, useEffect } from "react";
import { useApp } from "../store/AppContext";
import { EXAMES_BUILTIN } from "../data/exames";
import { Session } from "../store/auth";
import { Fatura } from "../store/AppContext";
import { api } from "../store/api";

interface ParamRow {
  exame: string;
  parametro: string;
  resultado: string;
  unidade: string;
  referencia: string;
}

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

interface FilaItem {
  fatura: Fatura;
  pacienteNome: string;
  pacienteId?: number;
  temResultados: boolean;
}

type Solicitacao = {
  id: number;
  parceiroNome: string;
  parceiroInstituicao: string;
  pacienteNome: string;
  pacienteNascimento: string;
  pacienteSexo: string;
  pacienteTelefone: string;
  pacienteBi: string;
  examesSolicitados: string[];
  observacoes: string;
  urgente: boolean;
  estado: string;
  data: string;
  hora: string;
};

const ESTADO_CFG: Record<string, { label: string; cls: string }> = {
  pendente:    { label: "Pendente",    cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  em_processo: { label: "Em Processo", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  concluido:   { label: "Concluído",   cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  cancelado:   { label: "Cancelado",   cls: "bg-red-50 text-red-600 border border-red-200" },
};

function PrintSolicitacao({ sol }: { sol: Solicitacao }) {
  return (
    <div className="pdf-preview" style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#000", padding: "40px", maxWidth: "700px" }}>
      <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "16px", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "18px" }}>PEDIDO DE EXAMES</h2>
        <p style={{ margin: "4px 0", color: "#555", fontSize: "12px" }}>Solicitação Externa nº {sol.id}</p>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>PARCEIRO / MÉDICO SOLICITANTE</div>
          <div style={{ fontWeight: "bold" }}>{sol.parceiroNome}</div>
          {sol.parceiroInstituicao && <div style={{ color: "#555" }}>{sol.parceiroInstituicao}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>DATA DO PEDIDO</div>
          <div style={{ fontWeight: "bold" }}>{sol.data}</div>
          {sol.hora && <div style={{ color: "#555" }}>{sol.hora}</div>}
        </div>
      </div>
      <div style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "14px", marginBottom: "16px" }}>
        <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold", marginBottom: "8px" }}>DADOS DO PACIENTE</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div><span style={{ color: "#555" }}>Nome:</span> <strong>{sol.pacienteNome}</strong></div>
          {sol.pacienteNascimento && <div><span style={{ color: "#555" }}>Nascimento:</span> {sol.pacienteNascimento}</div>}
          {sol.pacienteSexo && <div><span style={{ color: "#555" }}>Sexo:</span> {sol.pacienteSexo === "M" ? "Masculino" : "Feminino"}</div>}
          {sol.pacienteTelefone && <div><span style={{ color: "#555" }}>Telefone:</span> {sol.pacienteTelefone}</div>}
          {sol.pacienteBi && <div><span style={{ color: "#555" }}>BI:</span> {sol.pacienteBi}</div>}
        </div>
      </div>
      <div style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "14px", marginBottom: "16px" }}>
        <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold", marginBottom: "8px" }}>EXAMES SOLICITADOS</div>
        {sol.urgente && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "4px 10px", borderRadius: "4px", marginBottom: "8px", fontSize: "11px", fontWeight: "bold" }}>⚠ PEDIDO URGENTE</div>}
        {(sol.examesSolicitados || []).map((e, i) => (
          <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #f0f0f0", display: "flex", gap: "10px" }}>
            <div style={{ width: "16px", height: "16px", border: "1px solid #999", borderRadius: "3px", flexShrink: 0, marginTop: "1px" }} />
            <span>{e}</span>
          </div>
        ))}
      </div>
      {sol.observacoes && (
        <div style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "14px", marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold", marginBottom: "6px" }}>OBSERVAÇÕES CLÍNICAS</div>
          <p style={{ margin: 0 }}>{sol.observacoes}</p>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "50px", paddingTop: "16px", borderTop: "1px solid #ddd" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #333", width: "180px", marginBottom: "4px" }} />
          <div style={{ fontSize: "11px", color: "#555" }}>Assinatura do Técnico</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #333", width: "180px", marginBottom: "4px" }} />
          <div style={{ fontSize: "11px", color: "#555" }}>Carimbo do Laboratório</div>
        </div>
      </div>
    </div>
  );
}

interface AIExame {
  categoria?: string;
  exame?: string;
  parametro?: string;
  resultado?: string;
  unidade?: string;
  referencia?: string;
}

interface AIResultado {
  pacienteNome?: string;
  pacienteNasc?: string;
  pacienteSexo?: string;
  dataColheita?: string;
  tecnico?: string;
  exames?: AIExame[];
  observacoes?: string;
  raw?: string;
  parseError?: boolean;
}

export default function LancarResultados({ session }: { session?: Session }) {
  const { data, addResultado } = useApp();
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>("");
  const [selectedFaturaNum, setSelectedFaturaNum] = useState<string>("");
  const [pacienteSearch, setPacienteSearch] = useState("");
  const [dataColheita, setDataColheita] = useState(todayStr);
  const [tecnicoNome, setTecnicoNome] = useState(session?.funcionarioNome || session?.username || "");
  const [selectedExames, setSelectedExames] = useState<Set<string>>(new Set());
  const [params, setParams] = useState<ParamRow[]>([]);
  const [exameSearch, setExameSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [produtos, setProdutos] = useState<any[]>([]);
  useEffect(() => { api.produtos.list().then(setProdutos).catch(() => {}); }, []);
  const [view, setView] = useState<"fila" | "entrada" | "externos" | "lançar_externo">("fila");

  // AI import state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResultado | null>(null);
  const [aiError, setAiError] = useState<string>("");
  const [aiFileName, setAiFileName] = useState<string>("");

  // Partner requests
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loadingSols, setLoadingSols] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [printSol, setPrintSol] = useState<Solicitacao | null>(null);
  const [lancandoSol, setLancandoSol] = useState<Solicitacao | null>(null);
  const [guardandoExterno, setGuardandoExterno] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [successMsg, setSuccessMsg] = useState("");

  const loadSolicitacoes = useCallback(async () => {
    setLoadingSols(true);
    try {
      const list = await api.solicitacoes.listLab();
      setSolicitacoes(list);
    } catch { /* ignore */ }
    finally { setLoadingSols(false); }
  }, []);

  useEffect(() => { loadSolicitacoes(); }, [loadSolicitacoes]);

  const pendentesCount = solicitacoes.filter((s) => s.estado === "pendente").length;

  // Build patient queue from invoices (emitida or paga)
  const fila = useMemo<FilaItem[]>(() => {
    const itens: FilaItem[] = [];
    const faturasFiltradas = [...data.faturas]
      .filter((f) => f.estado === "paga" || f.estado === "emitida")
      .sort((a, b) => b.id - a.id);

    for (const fatura of faturasFiltradas) {
      const pacienteId = fatura.pacienteId;
      const pacienteNome = pacienteId
        ? data.pacientes.find((p) => p.id === pacienteId)?.nome || fatura.clienteNome
        : fatura.clienteNome;
      const temResultados = pacienteId
        ? data.resultados.some((r) => r.pacienteId === pacienteId)
        : false;
      itens.push({ fatura, pacienteNome, pacienteId, temResultados });
    }
    return itens;
  }, [data.faturas, data.pacientes, data.resultados]);

  const allExames = useMemo(() => {
    const merged: Record<string, Record<string, [string, string, string][]>> = {};
    for (const [cat, sub] of Object.entries(EXAMES_BUILTIN)) {
      merged[cat] = {};
      for (const [nome, ps] of Object.entries(sub)) {
        merged[cat][nome] = ps as [string, string, string][];
      }
    }
    for (const [cat, sub] of Object.entries(data.examesCustom)) {
      if (!merged[cat]) merged[cat] = {};
      for (const [nome, ps] of Object.entries(sub)) {
        merged[cat][nome] = ps.map((p) => [p.param, p.unidade, p.referencia] as [string, string, string]);
      }
    }
    return merged;
  }, [data.examesCustom]);

  const refByNome = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of produtos) {
      if (p.nome && p.codigo) m.set(p.nome.toLowerCase().trim(), p.codigo);
    }
    return m;
  }, [produtos]);

  const filteredExames = useMemo(() => {
    const q = exameSearch.toLowerCase().trim();
    if (!q) return allExames;
    const result: typeof allExames = {};
    for (const [cat, sub] of Object.entries(allExames)) {
      const matchedSub: typeof sub = {};
      for (const [nome, ps] of Object.entries(sub)) {
        const codigo = refByNome.get(nome.toLowerCase().trim()) || "";
        if (nome.toLowerCase().includes(q) || cat.toLowerCase().includes(q) || codigo.toLowerCase().includes(q)) matchedSub[nome] = ps;
      }
      if (Object.keys(matchedSub).length > 0) result[cat] = matchedSub;
    }
    return result;
  }, [allExames, exameSearch, refByNome]);

  const filteredPacientes = useMemo(() => {
    const q = pacienteSearch.toLowerCase().trim();
    if (!q) return data.pacientes;
    return data.pacientes.filter((p) =>
      p.nome.toLowerCase().includes(q) || p.processo.toLowerCase().includes(q) || String(p.id).includes(q)
    );
  }, [data.pacientes, pacienteSearch]);

  function toggleCat(cat: string) {
    setExpandedCats((prev) => { const n = new Set(prev); if (n.has(cat)) n.delete(cat); else n.add(cat); return n; });
  }
  function isCatExpanded(cat: string) { return exameSearch.trim() ? true : expandedCats.has(cat); }

  const buildRows = useCallback((next: Set<string>): ParamRow[] => {
    const rows: ParamRow[] = [];
    for (const [_cat, sub] of Object.entries(allExames)) {
      for (const [exameNome, ps] of Object.entries(sub)) {
        if (next.has(exameNome)) {
          for (const [param, unidade, referencia] of ps) {
            rows.push({ exame: exameNome, parametro: param, resultado: "", unidade, referencia });
          }
        }
      }
    }
    return rows;
  }, [allExames]);

  const toggleExame = useCallback((nome: string) => {
    setSelectedExames((prev) => { const n = new Set(prev); if (n.has(nome)) n.delete(nome); else n.add(nome); setParams(buildRows(n)); return n; });
  }, [buildRows]);

  function toggleAllInCat(cat: string, examNames: string[]) {
    setSelectedExames((prev) => {
      const n = new Set(prev);
      const allSelected = examNames.every((x) => n.has(x));
      if (allSelected) examNames.forEach((x) => n.delete(x)); else examNames.forEach((x) => n.add(x));
      setParams(buildRows(n)); return n;
    });
  }

  function updateResultado(idx: number, value: string) {
    setParams((prev) => prev.map((p, i) => i === idx ? { ...p, resultado: value } : p));
  }

  function selectFromFila(item: FilaItem) {
    if (item.pacienteId) setSelectedPacienteId(String(item.pacienteId));
    else setSelectedPacienteId("");
    setSelectedFaturaNum(item.fatura.numero);
    setPacienteSearch("");
    setDataColheita(todayStr());
    setTecnicoNome(session?.funcionarioNome || session?.username || "");

    // Pre-load exams from invoice lines
    const examNames = (item.fatura.linhas || [])
      .map((l) => l.descricao?.trim())
      .filter(Boolean) as string[];

    const next = new Set<string>();
    for (const nomeExame of examNames) {
      let matched = false;
      for (const [_cat, sub] of Object.entries(allExames)) {
        for (const nome of Object.keys(sub)) {
          if (nome.toLowerCase() === nomeExame.toLowerCase()) {
            next.add(nome);
            matched = true;
          }
        }
      }
      // If not in catalog, keep as free-text so a generic row is created
      if (!matched) next.add(nomeExame);
    }
    setSelectedExames(next);

    // Build parameter rows (same logic as handleIniciarLançamento)
    const rows: ParamRow[] = [];
    for (const nomeExame of next) {
      let found = false;
      for (const [_cat, sub] of Object.entries(allExames)) {
        if (sub[nomeExame]) {
          for (const [param, unidade, referencia] of sub[nomeExame]) {
            rows.push({ exame: nomeExame, parametro: param, resultado: "", unidade, referencia });
          }
          found = true;
          break;
        }
      }
      if (!found) {
        rows.push({ exame: nomeExame, parametro: "Resultado", resultado: "", unidade: "", referencia: "" });
      }
    }
    setParams(rows);
    setView("entrada");
  }

  const [guardando, setGuardando] = useState(false);

  async function handleGuardar() {
    if (!selectedPacienteId) { alert("Seleccione um paciente."); return; }
    const pacId = parseInt(selectedPacienteId, 10);
    const pac = data.pacientes.find((p) => p.id === pacId);
    if (!pac) { alert("Paciente não encontrado."); return; }
    if (!params.some((p) => p.resultado.trim())) { alert("Insira pelo menos um resultado."); return; }
    setGuardando(true);
    try {
      await addResultado({
        pacienteId: pacId,
        pacienteNome: pac.nome,
        data: dataColheita,
        dataEmissao: todayStr(),
        parametros: params,
        tecnicoNome: tecnicoNome.trim() || undefined,
      });
      setSelectedExames(new Set()); setParams([]); setDataColheita(todayStr());
      setSelectedPacienteId(""); setSelectedFaturaNum(""); setPacienteSearch("");
      setView("fila");
      alert("Resultados guardados com sucesso!");
    } catch {
      alert("Erro ao guardar resultados. Verifique a ligação e tente novamente.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleUpdateEstado(sol: Solicitacao, estado: string) {
    setUpdatingId(sol.id);
    try {
      await api.solicitacoes.updateEstado(sol.id, estado);
      await loadSolicitacoes();
    } finally { setUpdatingId(null); }
  }

  async function handleIniciarLançamento(sol: Solicitacao) {
    // Se pendente → marcar como Em Processo imediatamente antes de abrir o formulário
    if (sol.estado === "pendente") {
      setUpdatingId(sol.id);
      try {
        await api.solicitacoes.updateEstado(sol.id, "em_processo");
        await loadSolicitacoes();
        // Actualizar o objecto local para reflectir o novo estado
        sol = { ...sol, estado: "em_processo" };
      } finally {
        setUpdatingId(null);
      }
    }
    setLancandoSol(sol);
    setDataColheita(todayStr());
    setTecnicoNome(session?.funcionarioNome || session?.username || "");
    // Pre-load the exams requested in this solicitação
    const examesSol = sol.examesSolicitados || [];
    const next = new Set<string>();
    for (const nomeExame of examesSol) {
      // Look for a match in the catalog (case-insensitive)
      for (const [_cat, sub] of Object.entries(allExames)) {
        for (const nome of Object.keys(sub)) {
          if (nome.toLowerCase() === nomeExame.toLowerCase() || nome === nomeExame) {
            next.add(nome);
          }
        }
      }
      // If not found in catalog, still add it (will create a free-text row)
      if (![...next].some((n) => n.toLowerCase() === nomeExame.toLowerCase())) {
        next.add(nomeExame);
      }
    }
    setSelectedExames(next);
    // Build parameter rows — for exames not in catalog, create a generic row
    const rows: ParamRow[] = [];
    for (const nomeExame of next) {
      let found = false;
      for (const [_cat, sub] of Object.entries(allExames)) {
        if (sub[nomeExame]) {
          for (const [param, unidade, referencia] of sub[nomeExame]) {
            rows.push({ exame: nomeExame, parametro: param, resultado: "", unidade, referencia });
          }
          found = true;
          break;
        }
      }
      if (!found) {
        rows.push({ exame: nomeExame, parametro: "Resultado", resultado: "", unidade: "", referencia: "" });
      }
    }
    setParams(rows);
    setFiltroEstado("em_processo");
    setView("lançar_externo");
  }

  async function handleGuardarExterno() {
    if (!lancandoSol) return;
    if (!params.some((p) => p.resultado.trim())) {
      alert("Insira pelo menos um resultado antes de guardar.");
      return;
    }
    setGuardandoExterno(true);
    try {
      const resultado = await api.resultados.create({
        pacienteId: null,
        pacienteNome: lancandoSol.pacienteNome,
        data: dataColheita,
        dataEmissao: todayStr(),
        parametros: params,
        tecnicoNome: tecnicoNome.trim() || undefined,
        solicitacaoId: lancandoSol.id,
      });
      await api.solicitacoes.updateEstado(lancandoSol.id, "concluido", resultado?.id);
      await loadSolicitacoes();
      const nomePac = lancandoSol.pacienteNome;
      setLancandoSol(null);
      setSelectedExames(new Set());
      setParams([]);
      setFiltroEstado("concluido");
      setSuccessMsg(`✓ Resultados de ${nomePac} lançados com sucesso. Pedido concluído e disponível para o parceiro.`);
      setView("externos");
    } catch (e) {
      alert("Erro ao guardar resultados. Tente novamente.");
    } finally {
      setGuardandoExterno(false);
    }
  }

  function handlePrintSol(sol: Solicitacao) {
    setPrintSol(sol);
    setTimeout(() => { window.print(); setPrintSol(null); }, 200);
  }

  async function handleAnalisarDocumento(file: File) {
    setAiLoading(true);
    setAiError("");
    setAiResult(null);
    setAiFileName(file.name);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const mimeType = file.type || "image/jpeg";
      const token = localStorage.getItem("lab_token_emp_v4") || "";
      const res = await fetch("/api/ai/analisar-documento", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      const json = await res.json();
      if (!res.ok) { setAiError(json.error || "Erro desconhecido"); return; }
      setAiResult(json as AIResultado);
    } catch (e: any) {
      setAiError(e?.message || "Erro ao enviar documento");
    } finally {
      setAiLoading(false);
    }
  }

  function handleAplicarAI() {
    if (!aiResult) return;
    if (aiResult.dataColheita) setDataColheita(aiResult.dataColheita);
    if (aiResult.tecnico) setTecnicoNome(aiResult.tecnico);
    const exames = aiResult.exames || [];
    if (exames.length > 0) {
      const newParams: ParamRow[] = exames
        .filter((e) => e.parametro || e.exame)
        .map((e) => ({
          exame: e.exame || e.categoria || "Análise",
          parametro: e.parametro || "Resultado",
          resultado: e.resultado || "",
          unidade: e.unidade || "",
          referencia: e.referencia || "",
        }));
      if (newParams.length > 0) {
        const exameNames = new Set(newParams.map((p) => p.exame));
        setSelectedExames(exameNames);
        setParams(newParams);
      }
    }
    setAiModalOpen(false);
    setAiResult(null);
  }

  const groupedParams: Record<string, ParamRow[]> = {};
  for (const p of params) {
    if (!groupedParams[p.exame]) groupedParams[p.exame] = [];
    groupedParams[p.exame].push(p);
  }
  const selectedPaciente = data.pacientes.find((p) => p.id === parseInt(selectedPacienteId, 10));
  const estadoCores: Record<string, string> = {
    emitida: "bg-blue-100 text-blue-700 border-blue-200",
    paga: "bg-green-100 text-green-700 border-green-200",
  };
  const estadoLabels: Record<string, string> = { emitida: "Aguarda Pagamento", paga: "Pago" };

  // ── PRINT OVERLAY ─────────────────────────────────────────────────────────
  if (printSol) {
    return <PrintSolicitacao sol={printSol} />;
  }

  // ── LANÇAR EXTERNO VIEW ──────────────────────────────────────────────────
  if (view === "lançar_externo" && lancandoSol) {
    const solGrouped: Record<string, ParamRow[]> = {};
    for (const p of params) {
      if (!solGrouped[p.exame]) solGrouped[p.exame] = [];
      solGrouped[p.exame].push(p);
    }

    return (
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => { setFiltroEstado("em_processo"); setView("externos"); setLancandoSol(null); setSelectedExames(new Set()); setParams([]); }}
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
            ← Pedidos de Parceiros
          </button>
          <h2 className="text-xl font-bold" style={{ color: "hsl(258 70% 55%)" }}>Lançar Resultados</h2>
          {lancandoSol.urgente && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">URGENTE</span>
          )}
          <button
            onClick={() => { setAiModalOpen(true); setAiResult(null); setAiError(""); setAiFileName(""); }}
            className="ml-auto flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Importar Documento IA
          </button>
        </div>

        {/* AI Import Modal */}
        {aiModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base" style={{ color: "hsl(258 70% 55%)" }}>Importar Documento com IA</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Fotografia, PDF ou imagem de resultados → preenchimento automático</p>
                </div>
                <button onClick={() => { setAiModalOpen(false); setAiResult(null); setAiError(""); }} className="text-muted-foreground hover:text-foreground">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="p-5 flex-1 overflow-auto space-y-4">
                {!aiResult && !aiLoading && (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-violet-200 rounded-xl p-8 text-center hover:bg-violet-50 transition">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-violet-400">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <p className="text-sm font-semibold text-violet-700">Clique para seleccionar ficheiro</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF (max 20 MB)</p>
                      {aiFileName && <p className="text-xs text-violet-600 mt-2 font-medium">📎 {aiFileName}</p>}
                    </div>
                    <input type="file" accept="image/*,application/pdf" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAnalisarDocumento(f); }} />
                  </label>
                )}
                {aiLoading && (
                  <div className="py-12 text-center">
                    <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-semibold text-violet-700">A analisar documento com IA...</p>
                    <p className="text-xs text-muted-foreground mt-1">Pode demorar alguns segundos</p>
                  </div>
                )}
                {aiError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                    <strong>Erro:</strong> {aiError}
                    {aiError.includes("OPENAI_API_KEY") && (
                      <p className="mt-1 text-xs">Configure a variável <code className="bg-red-100 px-1 rounded">OPENAI_API_KEY</code> nos Secrets do Replit.</p>
                    )}
                    <button className="mt-2 text-xs underline" onClick={() => { setAiError(""); setAiFileName(""); }}>Tentar novamente</button>
                  </div>
                )}
                {aiResult && !aiLoading && (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-xs text-green-800">
                      ✓ Documento analisado. Reveja antes de aplicar.
                    </div>
                    {aiResult.parseError ? (
                      <pre className="bg-secondary rounded-lg p-3 text-xs overflow-auto max-h-40">{aiResult.raw}</pre>
                    ) : (
                      <div className="space-y-2">
                        {(aiResult.pacienteNome || aiResult.dataColheita || aiResult.tecnico) && (
                          <div className="bg-secondary/50 rounded-lg p-3 text-xs space-y-1">
                            {aiResult.pacienteNome && <div><span className="text-muted-foreground">Paciente:</span> <strong>{aiResult.pacienteNome}</strong></div>}
                            {aiResult.dataColheita && <div><span className="text-muted-foreground">Data Colheita:</span> {aiResult.dataColheita}</div>}
                            {aiResult.tecnico && <div><span className="text-muted-foreground">Técnico:</span> {aiResult.tecnico}</div>}
                          </div>
                        )}
                        {(aiResult.exames || []).length > 0 && (
                          <div className="rounded-lg border border-border overflow-hidden">
                            <div className="bg-secondary/50 px-3 py-2 text-xs font-bold text-muted-foreground border-b border-border">
                              {aiResult.exames!.length} parâmetro(s) extraído(s)
                            </div>
                            <div className="max-h-48 overflow-auto">
                              <table className="w-full text-xs">
                                <thead className="bg-secondary sticky top-0">
                                  <tr>
                                    <th className="text-left px-3 py-1.5 font-semibold">Parâmetro</th>
                                    <th className="text-center px-3 py-1.5 font-semibold w-24">Resultado</th>
                                    <th className="text-center px-3 py-1.5 font-semibold w-20">Unidade</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {aiResult.exames!.map((e, i) => (
                                    <tr key={i} className="border-t border-border">
                                      <td className="px-3 py-1.5">{e.exame && <span className="font-semibold text-primary">{e.exame} · </span>}{e.parametro}</td>
                                      <td className="px-3 py-1.5 text-center font-medium">{e.resultado}</td>
                                      <td className="px-3 py-1.5 text-center text-muted-foreground">{e.unidade}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {aiResult && !aiLoading && (
                <div className="px-5 py-4 border-t border-border flex gap-3 justify-end">
                  <button onClick={() => { setAiResult(null); setAiFileName(""); }} className="text-sm px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition font-semibold">
                    Novo Ficheiro
                  </button>
                  <button onClick={handleAplicarAI} className="text-sm px-5 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition" style={{ background: "hsl(258 70% 55%)" }}>
                    ✓ Aplicar Resultados
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Patient info banner */}
        <div className="bg-white border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 text-white"
              style={{ background: "hsl(258 70% 55%)" }}>
              {lancandoSol.pacienteNome.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-base">{lancandoSol.pacienteNome}</div>
              <div className="text-xs text-muted-foreground">
                Pedido por <strong>{lancandoSol.parceiroNome}</strong>
                {lancandoSol.parceiroInstituicao ? ` · ${lancandoSol.parceiroInstituicao}` : ""}
                {" · "}{lancandoSol.data}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {lancandoSol.pacienteNascimento && (
              <div><span className="text-muted-foreground block">Nascimento</span><strong>{lancandoSol.pacienteNascimento}</strong></div>
            )}
            {lancandoSol.pacienteSexo && (
              <div><span className="text-muted-foreground block">Sexo</span><strong>{lancandoSol.pacienteSexo === "M" ? "Masculino" : "Feminino"}</strong></div>
            )}
            {lancandoSol.pacienteBi && (
              <div><span className="text-muted-foreground block">BI</span><strong>{lancandoSol.pacienteBi}</strong></div>
            )}
            {lancandoSol.pacienteTelefone && (
              <div><span className="text-muted-foreground block">Telefone</span><strong>{lancandoSol.pacienteTelefone}</strong></div>
            )}
          </div>
          {lancandoSol.observacoes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
              <span className="font-semibold">Observações clínicas: </span>{lancandoSol.observacoes}
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground font-semibold">Exames solicitados:</span>
            {(lancandoSol.examesSolicitados || []).map((e, ei) => (
              <span key={`${e}-${ei}`} className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ background: "hsl(258 70% 55% / 0.12)", color: "hsl(258 70% 55%)" }}>{e}</span>
            ))}
          </div>
        </div>

        {/* Date & technician */}
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Data de Colheita</label>
              <input value={dataColheita} onChange={(e) => setDataColheita(e.target.value)}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="DD/MM/AAAA" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Técnico Responsável</label>
              <input value={tecnicoNome} onChange={(e) => setTecnicoNome(e.target.value)}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Nome do técnico..." />
            </div>
          </div>
        </div>

        {/* Results table — renders inline, page scrolls naturally */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-secondary/30 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-foreground">Parâmetros e Resultados</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{params.length} parâmetros a preencher</p>
            </div>
            <button onClick={handleGuardarExterno} disabled={guardandoExterno || !params.some((p) => p.resultado.trim())}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg text-white hover:opacity-90 transition disabled:opacity-40"
              style={{ background: "hsl(258 70% 55%)" }}>
              {guardandoExterno
                ? <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
              {guardandoExterno ? "A guardar..." : "Guardar e Concluir"}
            </button>
          </div>
          {params.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground text-sm gap-2 py-12">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/30">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/>
              </svg>
              <span className="text-center px-4">Exames solicitados não encontrados no catálogo.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold text-xs">Parâmetro</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-xs w-40">Resultado *</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-xs w-28 hidden sm:table-cell">Unidade</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-xs w-44 hidden sm:table-cell">Ref.</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(solGrouped).map(([exame, exameParams]) => {
                    const startIdx = params.findIndex((p) => p.exame === exame);
                    return (
                      <>
                        <tr key={`h-${exame}`} className="bg-primary/5">
                          <td colSpan={4} className="px-4 py-2 text-xs font-bold border-t border-primary/20"
                            style={{ color: "hsl(258 70% 55%)" }}>{exame}</td>
                        </tr>
                        {exameParams.map((p, localIdx) => {
                          const globalIdx = startIdx + localIdx;
                          return (
                            <tr key={`${exame}-${localIdx}`} className="border-t border-border hover:bg-accent/10">
                              <td className="px-4 py-2 text-xs">
                                <div>{p.parametro}</div>
                                <div className="sm:hidden text-[10px] text-muted-foreground mt-0.5">{p.unidade} {p.referencia ? `· Ref: ${p.referencia}` : ""}</div>
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <input value={p.resultado} onChange={(e) => updateResultado(globalIdx, e.target.value)}
                                  className="w-full border border-border rounded px-2 py-1.5 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                  placeholder="—" />
                              </td>
                              <td className="px-4 py-2 text-xs text-center text-muted-foreground hidden sm:table-cell">{p.unidade}</td>
                              <td className="px-4 py-2 text-xs text-center text-muted-foreground hidden sm:table-cell">{p.referencia}</td>
                            </tr>
                          );
                        })}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="flex gap-3 justify-end pb-6">
          <button onClick={() => { setFiltroEstado("em_processo"); setView("externos"); setLancandoSol(null); setSelectedExames(new Set()); setParams([]); }}
            className="text-sm font-semibold px-5 py-2.5 rounded-lg border border-border hover:bg-secondary transition">
            ← Voltar à Lista
          </button>
          <button onClick={handleGuardarExterno} disabled={guardandoExterno || !params.some((p) => p.resultado.trim())}
            className="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-lg text-white hover:opacity-90 transition disabled:opacity-40"
            style={{ background: "hsl(258 70% 55%)" }}>
            {guardandoExterno
              ? <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
            {guardandoExterno ? "A guardar..." : "✓ Guardar e Concluir Pedido"}
          </button>
        </div>
      </div>
    );
  }

  // ── EXTERNOS VIEW ────────────────────────────────────────────────────────
  if (view === "externos") {
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setView("fila")} className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
            ← Fila de Atendimento
          </button>
          <h2 className="text-xl font-bold" style={{ color: "hsl(258 70% 55%)" }}>Pedidos de Parceiros</h2>
          {pendentesCount > 0 && (
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "hsl(258 70% 55% / 0.15)", color: "hsl(258 70% 55%)" }}>
              {pendentesCount} pendente{pendentesCount > 1 ? "s" : ""}
            </span>
          )}
          <button onClick={loadSolicitacoes}
            className="ml-auto text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg font-semibold hover:opacity-80 transition">
            Actualizar
          </button>
        </div>

        {successMsg && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 shrink-0 text-emerald-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span className="flex-1">{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700 ml-2 shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}

        {loadingSols ? (
          <div className="py-16 text-center text-muted-foreground text-sm">A carregar pedidos...</div>
        ) : solicitacoes.length === 0 ? (
          <div className="bg-white border border-border rounded-xl py-16 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-muted-foreground/30">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
            <p className="text-muted-foreground text-sm">Nenhum pedido de parceiros.</p>
            <p className="text-xs text-muted-foreground mt-1">Os pedidos aparecem aqui quando os parceiros os submetem em /parceiro</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "todos",       label: "Todos",       activeCls: "bg-foreground text-background", inactiveCls: "bg-secondary text-secondary-foreground hover:bg-secondary/80" },
                { key: "pendente",    label: "Pendente",    activeCls: "bg-amber-500 text-white border-amber-500",     inactiveCls: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" },
                { key: "em_processo", label: "Em Processo", activeCls: "bg-blue-600 text-white border-blue-600",       inactiveCls: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100" },
                { key: "concluido",   label: "Concluído",   activeCls: "bg-emerald-600 text-white border-emerald-600", inactiveCls: "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" },
                { key: "cancelado",   label: "Cancelado",   activeCls: "bg-red-500 text-white border-red-500",         inactiveCls: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" },
              ].map(({ key, label, activeCls, inactiveCls }) => {
                const count = key === "todos" ? solicitacoes.length : solicitacoes.filter((s) => s.estado === key).length;
                const isActive = filtroEstado === key;
                return (
                  <button key={key} onClick={() => setFiltroEstado(key)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${isActive ? activeCls : inactiveCls}`}>
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            {solicitacoes.filter((s) => filtroEstado === "todos" || s.estado === filtroEstado).map((sol) => {
              const estadoCfg = ESTADO_CFG[sol.estado] ?? { label: sol.estado, cls: "bg-gray-100 text-gray-600" };
              return (
                <div key={sol.id} className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                  <div className="px-4 py-4 flex flex-col gap-3">
                    {/* Top row: avatar + info */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{ background: "hsl(258 70% 55% / 0.15)", color: "hsl(258 70% 55%)" }}>
                        {sol.pacienteNome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">{sol.pacienteNome}</span>
                          {sol.urgente && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">URGENTE</span>
                          )}
                          <span className={`badge text-xs ${estadoCfg.cls}`}>{estadoCfg.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Solicitado por: <strong>{sol.parceiroNome}</strong>
                          {sol.parceiroInstituicao ? ` · ${sol.parceiroInstituicao}` : ""}
                          {" · "}{sol.data} {sol.hora}
                        </div>
                        {sol.pacienteNascimento && (
                          <div className="text-xs text-muted-foreground">
                            Nasc.: {sol.pacienteNascimento}
                            {sol.pacienteSexo ? ` · ${sol.pacienteSexo === "M" ? "Masculino" : "Feminino"}` : ""}
                            {sol.pacienteBi ? ` · BI: ${sol.pacienteBi}` : ""}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(sol.examesSolicitados || []).map((e) => (
                            <span key={e} className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium">{e}</span>
                          ))}
                        </div>
                        {sol.observacoes && (
                          <p className="text-xs text-muted-foreground mt-1.5 italic">"{sol.observacoes}"</p>
                        )}
                      </div>
                    </div>
                    {/* Action buttons row — always visible, wraps on small screens */}
                    <div className="flex flex-wrap gap-2 justify-end border-t border-border/50 pt-3">
                      <button onClick={() => handlePrintSol(sol)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:opacity-80 transition">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                          <rect x="6" y="14" width="12" height="8"/>
                        </svg>
                        Imprimir
                      </button>
                      {(sol.estado === "pendente" || sol.estado === "em_processo") && (
                        <button onClick={() => handleIniciarLançamento(sol)}
                          disabled={updatingId === sol.id}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition disabled:opacity-50"
                          style={{ background: "hsl(258 70% 55%)" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>
                          {sol.estado === "pendente" ? "Iniciar e Lançar" : "Lançar Resultados"}
                        </button>
                      )}
                      {sol.estado === "concluido" && (
                        <button onClick={() => handleIniciarLançamento(sol)}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Editar Resultados
                        </button>
                      )}
                      {(sol.estado === "pendente" || sol.estado === "em_processo") && (
                        <button onClick={() => handleUpdateEstado(sol, "cancelado")}
                          disabled={updatingId === sol.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg text-destructive border border-destructive/30 hover:bg-red-50 transition disabled:opacity-50">
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── FILA VIEW ─────────────────────────────────────────────────────────────
  if (view === "fila") {
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-primary">Fila de Atendimento</h2>
          <button onClick={() => { setView("externos"); loadSolicitacoes(); }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition hover:opacity-90"
            style={{ borderColor: "hsl(258 70% 55%)", color: "hsl(258 70% 55%)", background: "hsl(258 70% 55% / 0.08)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
            Pedidos Externos
            {pendentesCount > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "hsl(258 70% 55%)" }}>
                {pendentesCount}
              </span>
            )}
          </button>
          <button onClick={() => { setSelectedPacienteId(""); setSelectedFaturaNum(""); setView("entrada"); }}
            className="ml-auto bg-secondary text-secondary-foreground px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition">
            + Lançar sem fatura
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800">
          Pacientes com fatura emitida ou paga aguardam lançamento de resultados. Clique para iniciar.
        </div>

        {fila.length === 0 ? (
          <div className="bg-white border border-border rounded-xl py-16 text-center">
            <div className="text-4xl mb-3 text-muted-foreground/30">🔬</div>
            <div className="text-muted-foreground font-medium">Nenhum paciente na fila.</div>
            <div className="text-xs text-muted-foreground mt-1">
              Emita uma fatura em <strong>Faturação</strong> para que o paciente apareça aqui.
            </div>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-secondary/30 flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">Pacientes aguardando exames</span>
              <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                {fila.filter((i) => !i.temResultados).length} pendentes
              </span>
              <span className="text-xs text-muted-foreground">{fila.length} no total</span>
            </div>
            <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-secondary/20 text-xs font-semibold text-muted-foreground border-b border-border">
              <div className="col-span-4">Paciente</div>
              <div className="col-span-2">N.º Fatura</div>
              <div className="col-span-2 text-center">Data</div>
              <div className="col-span-2 text-center">Estado Fatura</div>
              <div className="col-span-1 text-center">Resultados</div>
              <div className="col-span-1 text-center">Acção</div>
            </div>
            <div className="divide-y divide-border">
              {fila.map((item) => (
                <div key={item.fatura.id}
                  className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-accent/20 transition-colors ${item.temResultados ? "opacity-70" : ""}`}>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${item.temResultados ? "bg-gray-200 text-gray-500" : "bg-primary text-primary-foreground"}`}>
                      {item.pacienteNome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{item.pacienteNome}</div>
                      {item.fatura.clienteNif && <div className="text-xs text-muted-foreground">NIF: {item.fatura.clienteNif}</div>}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="font-mono text-xs font-bold text-primary">{item.fatura.numero}</span>
                  </div>
                  <div className="col-span-2 text-xs text-center text-muted-foreground">{item.fatura.data}</div>
                  <div className="col-span-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${estadoCores[item.fatura.estado] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {estadoLabels[item.fatura.estado] || item.fatura.estado}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    {item.temResultados
                      ? <span className="text-xs text-green-600 font-semibold">✓ Tem</span>
                      : <span className="text-xs text-amber-500 font-semibold">Pendente</span>
                    }
                  </div>
                  <div className="col-span-1 text-center">
                    <button onClick={() => selectFromFila(item)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${item.temResultados ? "bg-secondary text-secondary-foreground hover:opacity-80" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
                      {item.temResultados ? "Re-lançar" : "Iniciar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── ENTRY VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => setView("fila")} className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
          ← Voltar à Fila
        </button>
        <h2 className="text-xl font-bold text-primary">Lançar Resultados</h2>
        {selectedFaturaNum && (
          <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">Fatura: {selectedFaturaNum}</span>
        )}
        <button
          onClick={() => { setAiModalOpen(true); setAiResult(null); setAiError(""); setAiFileName(""); }}
          className="ml-auto flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Importar Documento IA
        </button>
      </div>

      {/* AI Import Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base" style={{ color: "hsl(258 70% 55%)" }}>Importar Documento com IA</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Fotografia, PDF ou imagem de resultados → preenchimento automático</p>
              </div>
              <button onClick={() => { setAiModalOpen(false); setAiResult(null); setAiError(""); }} className="text-muted-foreground hover:text-foreground">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-5 flex-1 overflow-auto space-y-4">
              {!aiResult && !aiLoading && (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-violet-200 rounded-xl p-8 text-center hover:bg-violet-50 transition">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-violet-400">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p className="text-sm font-semibold text-violet-700">Clique para seleccionar ficheiro</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF (max 20 MB)</p>
                    {aiFileName && <p className="text-xs text-violet-600 mt-2 font-medium">📎 {aiFileName}</p>}
                  </div>
                  <input type="file" accept="image/*,application/pdf" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAnalisarDocumento(f); }} />
                </label>
              )}
              {aiLoading && (
                <div className="py-12 text-center">
                  <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm font-semibold text-violet-700">A analisar documento com IA...</p>
                  <p className="text-xs text-muted-foreground mt-1">Pode demorar alguns segundos</p>
                </div>
              )}
              {aiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  <strong>Erro:</strong> {aiError}
                  {aiError.includes("OPENAI_API_KEY") && (
                    <p className="mt-1 text-xs">Configure a variável <code className="bg-red-100 px-1 rounded">OPENAI_API_KEY</code> no painel de Secrets do Replit.</p>
                  )}
                  <button className="mt-2 text-xs underline" onClick={() => { setAiError(""); setAiFileName(""); }}>Tentar novamente</button>
                </div>
              )}
              {aiResult && !aiLoading && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-xs text-green-800">
                    ✓ Documento analisado com sucesso. Reveja os dados extraídos antes de aplicar.
                  </div>
                  {aiResult.parseError ? (
                    <pre className="bg-secondary rounded-lg p-3 text-xs overflow-auto max-h-40">{aiResult.raw}</pre>
                  ) : (
                    <div className="space-y-2">
                      {(aiResult.pacienteNome || aiResult.dataColheita || aiResult.tecnico) && (
                        <div className="bg-secondary/50 rounded-lg p-3 text-xs space-y-1">
                          {aiResult.pacienteNome && <div><span className="text-muted-foreground">Paciente:</span> <strong>{aiResult.pacienteNome}</strong></div>}
                          {aiResult.dataColheita && <div><span className="text-muted-foreground">Data Colheita:</span> {aiResult.dataColheita}</div>}
                          {aiResult.tecnico && <div><span className="text-muted-foreground">Técnico:</span> {aiResult.tecnico}</div>}
                          {aiResult.observacoes && <div><span className="text-muted-foreground">Observações:</span> {aiResult.observacoes}</div>}
                        </div>
                      )}
                      {(aiResult.exames || []).length > 0 && (
                        <div className="rounded-lg border border-border overflow-hidden">
                          <div className="bg-secondary/50 px-3 py-2 text-xs font-bold text-muted-foreground border-b border-border">
                            {aiResult.exames!.length} parâmetro(s) extraído(s)
                          </div>
                          <div className="max-h-48 overflow-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-secondary sticky top-0">
                                <tr>
                                  <th className="text-left px-3 py-1.5 font-semibold">Exame / Parâmetro</th>
                                  <th className="text-center px-3 py-1.5 font-semibold w-24">Resultado</th>
                                  <th className="text-center px-3 py-1.5 font-semibold w-20">Unidade</th>
                                </tr>
                              </thead>
                              <tbody>
                                {aiResult.exames!.map((e, i) => (
                                  <tr key={i} className="border-t border-border">
                                    <td className="px-3 py-1.5">
                                      {e.exame && <span className="font-semibold text-primary">{e.exame} · </span>}
                                      {e.parametro}
                                    </td>
                                    <td className="px-3 py-1.5 text-center font-medium">{e.resultado}</td>
                                    <td className="px-3 py-1.5 text-center text-muted-foreground">{e.unidade}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            {aiResult && !aiLoading && (
              <div className="px-5 py-4 border-t border-border flex gap-3 justify-end">
                <button onClick={() => { setAiResult(null); setAiFileName(""); }} className="text-sm px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition font-semibold">
                  Novo Ficheiro
                </button>
                <button onClick={handleAplicarAI}
                  className="text-sm px-5 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition"
                  style={{ background: "hsl(258 70% 55%)" }}>
                  ✓ Aplicar Resultados
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-border rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Pesquisar Paciente</label>
            <input value={pacienteSearch} onChange={(e) => { setPacienteSearch(e.target.value); setSelectedPacienteId(""); }}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Nome, processo ou ID..." />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Paciente *</label>
            <select value={selectedPacienteId} onChange={(e) => { setSelectedPacienteId(e.target.value); setPacienteSearch(""); }}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
              <option value="">{filteredPacientes.length === 0 ? "Nenhum encontrado" : "Seleccionar..."}</option>
              {filteredPacientes.map((p) => (
                <option key={p.id} value={p.id}>{p.id} — {p.nome} {p.processo ? `(Proc: ${p.processo})` : ""}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Data de Colheita</label>
            <input value={dataColheita} onChange={(e) => setDataColheita(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="DD/MM/AAAA" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Técnico Responsável</label>
            <input value={tecnicoNome} onChange={(e) => setTecnicoNome(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Nome do técnico..." />
          </div>
        </div>
        {selectedPaciente && (
          <div className="border border-primary/25 rounded-xl overflow-hidden" style={{ background: "hsl(258 70% 55% / 0.04)" }}>
            {/* Header strip */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-primary/15" style={{ background: "hsl(258 70% 55% / 0.08)" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: "hsl(258 70% 55%)" }}>
                {selectedPaciente.nome.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-foreground">{selectedPaciente.nome}</div>
                <div className="flex flex-wrap gap-3 mt-0.5">
                  {selectedPaciente.sexo && (
                    <span className="text-xs text-muted-foreground">{selectedPaciente.sexo === "M" ? "Masculino" : "Feminino"}</span>
                  )}
                  {selectedPaciente.nasc && (
                    <span className="text-xs text-muted-foreground">Nasc: {selectedPaciente.nasc}</span>
                  )}
                  {selectedPaciente.idade && (
                    <span className="text-xs text-muted-foreground">{selectedPaciente.idade} anos</span>
                  )}
                </div>
              </div>
              {selectedPaciente.grupoSanguineo && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 flex-shrink-0">
                  {selectedPaciente.grupoSanguineo}{selectedPaciente.fatorRh || ""}
                </span>
              )}
            </div>
            {/* Details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 px-4 py-3 text-xs">
              {selectedPaciente.processo && (
                <div><span className="text-muted-foreground">Processo:</span> <strong className="ml-1">{selectedPaciente.processo}</strong></div>
              )}
              {selectedPaciente.nAmostra && (
                <div><span className="text-muted-foreground">N.º Amostra:</span> <strong className="ml-1">{selectedPaciente.nAmostra}</strong></div>
              )}
              {selectedPaciente.medico && (
                <div><span className="text-muted-foreground">Médico Req.:</span> <strong className="ml-1">{selectedPaciente.medico}</strong></div>
              )}
              {selectedPaciente.recolha && (
                <div><span className="text-muted-foreground">Data Recolha:</span> <strong className="ml-1">{selectedPaciente.recolha}</strong></div>
              )}
              {selectedPaciente.bi && (
                <div><span className="text-muted-foreground">BI:</span> <strong className="ml-1">{selectedPaciente.bi}</strong></div>
              )}
              {selectedPaciente.nif && (
                <div><span className="text-muted-foreground">NIF:</span> <strong className="ml-1">{selectedPaciente.nif}</strong></div>
              )}
              {selectedPaciente.telefone && (
                <div><span className="text-muted-foreground">Telefone:</span> <strong className="ml-1">{selectedPaciente.telefone}</strong></div>
              )}
              {selectedPaciente.empresa && (
                <div><span className="text-muted-foreground">Empresa:</span> <strong className="ml-1">{selectedPaciente.empresa}</strong></div>
              )}
              {selectedPaciente.alergias && (
                <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                  <span className="text-amber-600 font-semibold">⚠ Alergias:</span>
                  <strong className="ml-1 text-amber-700">{selectedPaciente.alergias}</strong>
                </div>
              )}
              {selectedPaciente.patologiasCronicas && (
                <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                  <span className="text-muted-foreground">Patologias Crónicas:</span>
                  <strong className="ml-1">{selectedPaciente.patologiasCronicas}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4" style={{ minHeight: "520px" }}>
        {/* Exam selector */}
        <div className="w-64 flex-shrink-0 bg-white border border-border rounded-lg flex flex-col" style={{ maxHeight: "600px" }}>
          <div className="p-3 border-b border-border flex-shrink-0">
            <div className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Seleccionar Exames</div>
            <input value={exameSearch} onChange={(e) => setExameSearch(e.target.value)}
              className="w-full border border-border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Pesquisar exame..." />
            {selectedExames.size > 0 && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-primary font-semibold">{selectedExames.size} seleccionado(s)</span>
                <button onClick={() => { setSelectedExames(new Set()); setParams([]); }} className="text-xs text-muted-foreground hover:text-destructive">Limpar</button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {Object.keys(filteredExames).length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-6">Nenhum exame encontrado.</div>
            )}
            {Object.entries(filteredExames).map(([cat, sub]) => {
              const examNames = Object.keys(sub);
              const allSel = examNames.every((n) => selectedExames.has(n));
              const someSel = examNames.some((n) => selectedExames.has(n));
              const expanded = isCatExpanded(cat);
              return (
                <div key={cat} className="rounded-lg overflow-hidden border border-border/60">
                  <button type="button" onClick={() => toggleCat(cat)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-bold transition-colors ${someSel ? "bg-primary/10 text-primary" : "bg-secondary/70 text-secondary-foreground hover:bg-secondary"}`}>
                    <span className="flex-1 truncate">{cat}</span>
                    {someSel && <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">{examNames.filter((n) => selectedExames.has(n)).length}</span>}
                    <span className="text-muted-foreground flex-shrink-0" style={{ display: "inline-block", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                  </button>
                  {expanded && (
                    <div className="bg-white">
                      <label className="flex items-center gap-2 px-3 py-1.5 border-b border-border/40 cursor-pointer hover:bg-accent/30 text-xs text-muted-foreground">
                        <input type="checkbox" checked={allSel} ref={(el) => { if (el) el.indeterminate = someSel && !allSel; }} onChange={() => toggleAllInCat(cat, examNames)} style={{ accentColor: "hsl(var(--primary))" }} />
                        <span className="italic">Seleccionar todos</span>
                      </label>
                      {examNames.map((nome) => {
                        const codigo = refByNome.get(nome.toLowerCase().trim());
                        return (
                          <label key={nome} className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs transition-colors ${selectedExames.has(nome) ? "bg-primary/5 text-primary font-semibold" : "hover:bg-accent/30 text-foreground"}`}>
                            <input type="checkbox" checked={selectedExames.has(nome)} onChange={() => toggleExame(nome)} style={{ accentColor: "hsl(var(--primary))" }} />
                            {codigo && (
                              <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0 leading-none">
                                {codigo}
                              </span>
                            )}
                            <span className="truncate">{nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Results panel */}
        <div className="flex-1 bg-white border border-border rounded-lg flex flex-col" style={{ maxHeight: "600px" }}>
          <div className="p-3 border-b border-border flex-shrink-0">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wide">Parâmetros e Resultados</h3>
            {params.length > 0 && <p className="text-xs text-muted-foreground mt-0.5">{params.length} parâmetros a preencher</p>}
          </div>
          {params.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground text-sm gap-2 py-16">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/30">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/>
              </svg>
              <span>Seleccione exames na lista à esquerda</span>
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-secondary sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold text-xs">Parâmetro</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-xs w-36">Resultado</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-xs w-28">Unidade</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-xs w-40">Referência</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedParams).map(([exame, exameParams]) => {
                    const startIdx = params.findIndex((p) => p.exame === exame);
                    return (
                      <>
                        <tr key={`h-${exame}`} className="bg-primary/5">
                          <td colSpan={4} className="px-4 py-2 text-xs font-bold text-primary border-t border-primary/20">{exame}</td>
                        </tr>
                        {exameParams.map((p, localIdx) => {
                          const globalIdx = startIdx + localIdx;
                          return (
                            <tr key={`${exame}-${localIdx}`} className="border-t border-border hover:bg-accent/10">
                              <td className="px-4 py-1.5 text-xs">{p.parametro}</td>
                              <td className="px-2 py-1 text-center">
                                <input value={p.resultado} onChange={(e) => updateResultado(globalIdx, e.target.value)}
                                  className="w-full border border-border rounded px-2 py-1 text-center text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="—" />
                              </td>
                              <td className="px-4 py-1.5 text-xs text-center text-muted-foreground">{p.unidade}</td>
                              <td className="px-4 py-1.5 text-xs text-center text-muted-foreground">{p.referencia}</td>
                            </tr>
                          );
                        })}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Action bar — always visible */}
      <div className="bg-white border border-border rounded-lg px-5 py-3 flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground">
            {!selectedPacienteId && <span className="text-amber-600 font-semibold">⚠ Seleccione um paciente</span>}
            {selectedPacienteId && params.length === 0 && <span className="text-amber-600 font-semibold">⚠ Seleccione exames na lista à esquerda</span>}
            {selectedPacienteId && params.length > 0 && !params.some(p => p.resultado.trim()) && <span className="text-amber-600 font-semibold">⚠ Preencha pelo menos um resultado</span>}
            {selectedPacienteId && params.some(p => p.resultado.trim()) && <span className="text-emerald-600 font-semibold">✓ Pronto para guardar</span>}
          </div>
          {params.length > 0 && (
            <button
              onClick={() => setParams(ps => ps.map(p => ({ ...p, resultado: "" })))}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 bg-gray-50 px-3 py-1.5 rounded hover:bg-gray-100 transition">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
              </svg>
              Limpar Campos
            </button>
          )}
        </div>
        <button
          onClick={handleGuardar}
          disabled={guardando || !selectedPacienteId || !params.some(p => p.resultado.trim())}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-2.5 rounded text-sm font-bold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed">
          {guardando
            ? <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg> A guardar...</>
            : "✓ Guardar Resultados"}
        </button>
      </div>
    </div>
  );
}
