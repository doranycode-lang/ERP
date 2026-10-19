import { useState, useEffect, useCallback, useMemo } from "react";
import { Session } from "../store/auth";
import { api } from "../store/api";
import { EXAMES_BUILTIN } from "../data/exames";
import { generatePDFHTML, downloadPDF } from "../utils/pdfGenerator";

interface Props { session: Session; onLogout: () => void; }

type Tab = "externo" | "interno" | "resultados" | "pacientes";

type ParceiroPaciente = {
  id: string; codigo: string; nome: string;
  nascimento: string; sexo: string; telefone: string; bi: string;
};

type Solicitacao = {
  id: string; pacienteNome: string; pacienteNascimento: string; pacienteSexo: string;
  pacienteTelefone: string; pacienteBi: string; examesSolicitados: string[];
  observacoes: string; urgente: boolean; estado: string; data: string; hora: string;
  resultadoId?: string; medicoSolicitante?: string; tipoPedido?: string;
};

type ExameItem = { codigo: string; designacao: string };

const ESTADOS: Record<string, { label: string; cls: string }> = {
  pendente:    { label: "Pendente",    cls: "bg-amber-100 text-amber-700 border border-amber-200" },
  em_processo: { label: "Em Processo", cls: "bg-blue-100 text-blue-700 border border-blue-200" },
  concluido:   { label: "Concluído",   cls: "bg-green-100 text-green-700 border border-green-200" },
  cancelado:   { label: "Cancelado",   cls: "bg-red-100 text-red-700 border border-red-200" },
};

const PURPLE = "#6941c6";
const PURPLE_LIGHT = "#f4f0ff";
const PURPLE_MID = "#ede9fe";

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}
function nowTime() { return new Date().toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}); }

// Build flat exam list with codes
const EXAMES_FLAT: ExameItem[] = [];
let _code = 1;
for (const [, subs] of Object.entries(EXAMES_BUILTIN)) {
  for (const nome of Object.keys(subs)) {
    EXAMES_FLAT.push({ codigo: String(_code).padStart(4,"0"), designacao: nome });
    _code++;
  }
}

// ── Resultado Modal ──────────────────────────────────────────────────────────
function ResultadoModal({ solId, onClose }: { solId: string; onClose: () => void }) {
  const [data, setData] = useState<{ resultado: any; paciente: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.solicitacoes.getResultado(solId).then(setData)
      .catch((e) => setErr(e.message || "Erro ao carregar resultado"))
      .finally(() => setLoading(false));
  }, [solId]);

  const byExame = useMemo(() => {
    if (!data?.resultado?.parametros) return {};
    const r: Record<string, any[]> = {};
    for (const p of data.resultado.parametros) {
      if (!p.resultado?.trim()) continue;
      if (!r[p.exame]) r[p.exame] = [];
      r[p.exame].push(p);
    }
    return r;
  }, [data]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] flex flex-col border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <div className="font-bold text-gray-800">Resultado do Exame</div>
            {data?.resultado && <div className="text-xs text-gray-400">Emitido em {data.resultado.dataEmissao || data.resultado.data}</div>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {loading && <div className="py-12 text-center text-gray-400">A carregar...</div>}
          {err && <div className="py-12 text-center text-red-500 text-sm">{err}</div>}
          {data && !loading && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Paciente</div>
                <div className="font-bold text-gray-800">{data.resultado.pacienteNome}</div>
                {data.paciente && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    {[data.paciente.nasc, data.paciente.sexo === "M" ? "Masculino" : data.paciente.sexo === "F" ? "Feminino" : "", data.paciente.bi].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
              {Object.keys(byExame).length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">Resultados ainda não preenchidos</div>
              ) : Object.entries(byExame).map(([exame, params]) => (
                <div key={exame} className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="px-4 py-2 bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wide">{exame}</div>
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left px-4 py-2 font-semibold">Parâmetro</th>
                      <th className="text-center px-2 py-2 font-semibold">Resultado</th>
                      <th className="text-center px-2 py-2 font-semibold">Unidade</th>
                      <th className="text-center px-2 py-2 font-semibold">Referência</th>
                    </tr></thead>
                    <tbody>
                      {params.map((p, i) => (
                        <tr key={i} className="border-t border-gray-50">
                          <td className="px-4 py-2 text-gray-700">{p.parametro}</td>
                          <td className="px-2 py-2 text-center font-bold text-gray-900">{p.resultado}</td>
                          <td className="px-2 py-2 text-center text-gray-400 text-xs">{p.unidade}</td>
                          <td className="px-2 py-2 text-center text-gray-400 text-xs">{p.referencia}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              {data.resultado.tecnicoNome && (
                <div className="text-xs text-center text-gray-400">Técnico: {data.resultado.tecnicoNome}</div>
              )}
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {data && !loading && Object.keys(byExame).length > 0 && (
            <button
              onClick={() => {
                const config = {
                  nomeClinica: "Laboratório", nif: "", endereco: "", telefone: "",
                  email: "", directorTecnico: "", logoData: "", assinaturaData: "",
                  serie: "A", proximoNumeroFatura: 1, ivaTaxa: 14, moeda: "AOA", website: "",
                };
                const resultado = data.resultado;
                const paciente = data.paciente ?? undefined;
                downloadPDF(generatePDFHTML(resultado, paciente, config), `Resultado_${resultado.pacienteNome}`);
              }}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition"
              style={{ background: "#6941c6" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/><line x1="12" y1="15" x2="12" y2="3"/><rect x="3" y="17" width="18" height="4" rx="1"/>
              </svg>
              Imprimir PDF
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 border border-gray-200 transition">Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ── Novo Paciente Modal ──────────────────────────────────────────────────────
function NovoPacienteModal({ onSave, onClose, initial }: {
  onSave: (p: Omit<ParceiroPaciente, "id">) => Promise<void>;
  onClose: () => void;
  initial?: ParceiroPaciente;
}) {
  const [form, setForm] = useState({
    codigo: initial?.codigo || "", nome: initial?.nome || "",
    nascimento: initial?.nascimento || "", sexo: initial?.sexo || "",
    telefone: initial?.telefone || "", bi: initial?.bi || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { setErr("Nome é obrigatório"); return; }
    setSaving(true); setErr("");
    try { await onSave(form); onClose(); }
    catch (ex: any) { setErr(ex.message || "Erro"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="font-bold text-gray-800">{initial ? "Editar Paciente" : "Novo Paciente"}</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100">✕</button>
        </div>
        <form onSubmit={handle} className="p-6 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Código</label>
              <input value={form.codigo} onChange={e => set("codigo", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Nome *</label>
              <input value={form.nome} onChange={e => set("nome", e.target.value)} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Nascimento</label>
              <input value={form.nascimento} onChange={e => set("nascimento", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="dd/mm/aaaa" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Sexo</label>
              <select value={form.sexo} onChange={e => set("sexo", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white">
                <option value="">—</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Telefone</label>
              <input value={form.telefone} onChange={e => set("telefone", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">BI / Passaporte</label>
              <input value={form.bi} onChange={e => set("bi", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
            </div>
          </div>
          {err && <div className="text-xs text-red-500">{err}</div>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-semibold transition">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg text-white text-sm font-semibold transition disabled:opacity-60"
              style={{ background: PURPLE }}>
              {saving ? "A guardar..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Print Component ──────────────────────────────────────────────────────────
function PrintPedido({ sol, session }: { sol: Solicitacao; session: Session }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#000", maxWidth: "700px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "16px", marginBottom: "16px" }}>
        <h2 style={{ margin: 0, fontSize: "18px" }}>REQUISIÇÃO DE EXAMES LABORATORIAIS</h2>
        <p style={{ margin: "4px 0", color: "#555" }}>{session.empresaNome}</p>
        <p style={{ margin: "2px 0", fontSize: "10px", color: "#888" }}>
          {sol.tipoPedido === "interno" ? "PEDIDO INTERNO (MÉDICO)" : "PEDIDO EXTERNO"}
        </p>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>MÉDICO / PARCEIRO SOLICITANTE</div>
          <div style={{ fontWeight: "bold" }}>{sol.medicoSolicitante || session.parceiroNome}</div>
          {session.parceiroInstituicao && <div style={{ color: "#555" }}>{session.parceiroInstituicao}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>DATA E HORA</div>
          <div style={{ fontWeight: "bold" }}>{sol.data}</div>
          <div style={{ color: "#555" }}>{sol.hora}</div>
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
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead><tr style={{ borderBottom: "1px solid #ddd" }}>
            <th style={{ textAlign: "left", padding: "4px 8px", color: "#888" }}>Código</th>
            <th style={{ textAlign: "left", padding: "4px 8px", color: "#888" }}>Designação</th>
          </tr></thead>
          <tbody>
            {(sol.examesSolicitados || []).map((e, i) => {
              const found = EXAMES_FLAT.find(x => x.designacao === e);
              return (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "4px 8px", color: "#555" }}>{found?.codigo || String(i+1).padStart(4,"0")}</td>
                  <td style={{ padding: "4px 8px" }}>{e}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sol.observacoes && (
        <div style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "14px", marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold", marginBottom: "6px" }}>OBSERVAÇÕES</div>
          <p style={{ margin: 0 }}>{sol.observacoes}</p>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "50px", paddingTop: "16px", borderTop: "1px solid #ddd" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #333", width: "200px", marginBottom: "4px" }} />
          <div style={{ fontSize: "11px", color: "#555" }}>Assinatura do Médico / Parceiro</div>
          <div style={{ fontSize: "11px", fontWeight: "bold" }}>{sol.medicoSolicitante || session.parceiroNome}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #333", width: "200px", marginBottom: "4px" }} />
          <div style={{ fontSize: "11px", color: "#555" }}>Carimbo do Laboratório</div>
        </div>
      </div>
      <p style={{ textAlign: "center", fontSize: "10px", color: "#aaa", marginTop: "30px" }}>
        Ref: {sol.id} · {session.empresaNome} · {new Date().toLocaleString("pt-PT")}
      </p>
    </div>
  );
}

// ── Requisição Form ──────────────────────────────────────────────────────────
function RequisicaoForm({
  tipoPedido, pacientes, session, onSaved,
}: {
  tipoPedido: "externo" | "interno";
  pacientes: ParceiroPaciente[];
  session: Session;
  onSaved: () => void;
}) {
  const [selectedPacienteId, setSelectedPacienteId] = useState("");
  const [medicoSolicitante, setMedicoSolicitante] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [urgente, setUrgente] = useState(false);
  const [exameTable, setExameTable] = useState<ExameItem[]>([]);
  const [selectedExameNome, setSelectedExameNome] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState("");

  const selectedPaciente = pacientes.find(p => p.id === selectedPacienteId);

  const examesFiltered = useMemo(() => {
    if (!search) return EXAMES_FLAT;
    return EXAMES_FLAT.filter(e => e.designacao.toLowerCase().includes(search.toLowerCase()) || e.codigo.includes(search));
  }, [search]);

  function adicionarExame() {
    if (!selectedExameNome) return;
    const found = EXAMES_FLAT.find(e => e.designacao === selectedExameNome);
    if (!found) return;
    if (exameTable.some(e => e.designacao === found.designacao)) return;
    setExameTable(t => [...t, found]);
    setSelectedExameNome("");
    setSearch("");
  }

  function removerSelecionados() {
    if (selectedRows.size === 0) {
      setExameTable([]);
    } else {
      setExameTable(t => t.filter((_, i) => !selectedRows.has(i)));
      setSelectedRows(new Set());
    }
  }

  function toggleRow(i: number) {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  async function handleSalvar() {
    if (!selectedPacienteId) { setMsg({ text: "Seleccione um paciente.", ok: false }); return; }
    if (exameTable.length === 0) { setMsg({ text: "Adicione pelo menos um exame.", ok: false }); return; }
    setSaving(true); setMsg(null);
    try {
      const pac = pacientes.find(p => p.id === selectedPacienteId)!;
      await api.solicitacoes.create({
        pacienteNome: pac.nome,
        pacienteNascimento: pac.nascimento,
        pacienteSexo: pac.sexo,
        pacienteTelefone: pac.telefone,
        pacienteBi: pac.bi,
        examesSolicitados: exameTable.map(e => e.designacao),
        observacoes,
        urgente,
        medicoSolicitante,
        tipoPedido,
        data: todayStr(),
        hora: nowTime(),
      });
      setMsg({ text: "✓ Requisição enviada com sucesso!", ok: true });
      setSelectedPacienteId(""); setExameTable([]); setSelectedRows(new Set());
      setMedicoSolicitante(""); setObservacoes(""); setUrgente(false);
      onSaved();
    } catch (ex: any) {
      setMsg({ text: ex.message || "Erro ao enviar.", ok: false });
    } finally { setSaving(false); }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Section title */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
            Requisição de Exames — {tipoPedido === "interno" ? "Pedido Interno (Médico(a))" : "Pedido Externo"}
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Patient row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-red-600 mb-1 block">Código</label>
              <input value={selectedPaciente?.codigo || ""} readOnly
                className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Nome</label>
              <input value={selectedPaciente?.nome || ""} readOnly
                className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Paciente *</label>
              <select value={selectedPacienteId} onChange={e => setSelectedPacienteId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200">
                <option value="">— Seleccionar Paciente —</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome}{p.codigo ? ` (${p.codigo})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exam picker row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Código</label>
              <input value={EXAMES_FLAT.find(e => e.designacao === selectedExameNome)?.codigo || ""} readOnly
                className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Nome</label>
              <input value={selectedExameNome} readOnly
                className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Exames</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    value={search || selectedExameNome}
                    onChange={e => { setSearch(e.target.value); setSelectedExameNome(""); }}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
                    placeholder="Pesquisar exame..."
                    list="exames-list"
                  />
                  <datalist id="exames-list">
                    {examesFiltered.slice(0, 100).map(e => (
                      <option key={e.codigo} value={e.designacao} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          </div>

          {/* Exame select + buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <select value={selectedExameNome} onChange={e => { setSelectedExameNome(e.target.value); setSearch(""); }}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200">
                <option value="">— Seleccionar Exame —</option>
                {examesFiltered.slice(0, 150).map(e => (
                  <option key={e.codigo} value={e.designacao}>{e.codigo} – {e.designacao}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={adicionarExame} disabled={!selectedExameNome}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded text-white text-sm font-semibold transition disabled:opacity-40"
              style={{ background: PURPLE }}>
              <span className="text-base leading-none">◆</span> Adicionar
            </button>
            <button type="button" onClick={() => { setSelectedExameNome(""); setSearch(""); }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-semibold border border-gray-300 bg-white hover:bg-gray-50 transition text-gray-700">
              🗑 Limpar
            </button>
          </div>

          {/* Médico row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Médico Solicitante</label>
              <input value={medicoSolicitante} onChange={e => setMedicoSolicitante(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Nome do médico (opcional)" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Observações</label>
              <input value={observacoes} onChange={e => setObservacoes(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Observações clínicas..." />
            </div>
          </div>

          {/* Urgente checkbox */}
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none w-fit">
            <input type="checkbox" checked={urgente} onChange={e => setUrgente(e.target.checked)}
              className="w-4 h-4 rounded accent-purple-600" />
            <span className="font-semibold text-red-600">Pedido Urgente</span>
          </label>

          {/* Exams table */}
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-8 px-3 py-2"></th>
                  <th className="text-left px-3 py-2 text-xs font-bold text-gray-500 uppercase">Código</th>
                  <th className="text-left px-3 py-2 text-xs font-bold text-gray-500 uppercase">Designação</th>
                  <th className="w-8 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {exameTable.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                    Nenhum exame adicionado. Seleccione um exame e clique em Adicionar.
                  </td></tr>
                ) : exameTable.map((e, i) => (
                  <tr key={i} onClick={() => toggleRow(i)} className={`border-t border-gray-100 cursor-pointer transition-colors ${selectedRows.has(i) ? "bg-purple-50" : "hover:bg-gray-50"}`}>
                    <td className="px-3 py-2 text-center">
                      <input type="checkbox" checked={selectedRows.has(i)} onChange={() => toggleRow(i)}
                        className="accent-purple-600" onClick={ev => ev.stopPropagation()} />
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-500">{e.codigo}</td>
                    <td className="px-3 py-2 text-gray-800">{e.designacao}</td>
                    <td className="px-3 py-2 text-center">
                      <button type="button" onClick={ev => { ev.stopPropagation(); setExameTable(t => t.filter((_, j) => j !== i)); selectedRows.delete(i); }}
                        className="text-gray-300 hover:text-red-400 transition text-xs">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Message */}
          {msg && (
            <div className={`text-sm px-4 py-2 rounded-lg ${msg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
              {msg.text}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 justify-between pt-1">
            <button type="button" onClick={removerSelecionados}
              disabled={exameTable.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded border border-red-200 text-red-600 text-sm font-semibold bg-red-50 hover:bg-red-100 transition disabled:opacity-40">
              <span>✕</span> {selectedRows.size > 0 ? `Remover ${selectedRows.size} seleccionado(s)` : "Remover Todos"}
            </button>
            <button type="button" onClick={handleSalvar} disabled={saving}
              className="flex items-center gap-2 px-6 py-2 rounded text-white text-sm font-semibold transition disabled:opacity-60"
              style={{ background: PURPLE }}>
              {saving ? "A guardar..." : "💾 Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Portal ──────────────────────────────────────────────────────────────
export default function PortalParceiro({ session, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("externo");
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [pacientes, setPacientes] = useState<ParceiroPaciente[]>([]);
  const [loadingSol, setLoadingSol] = useState(false);
  const [loadingPac, setLoadingPac] = useState(false);
  const [resultadoModal, setResultadoModal] = useState<string | null>(null);
  const [printTarget, setPrintTarget] = useState<Solicitacao | null>(null);
  const [novoPacModal, setNovoPacModal] = useState(false);
  const [editPac, setEditPac] = useState<ParceiroPaciente | null>(null);
  const [pacSearch, setPacSearch] = useState("");

  const loadSolicitacoes = useCallback(async () => {
    setLoadingSol(true);
    try { setSolicitacoes(await api.solicitacoes.listMinhas()); }
    catch { /* ignore */ }
    finally { setLoadingSol(false); }
  }, []);

  const loadPacientes = useCallback(async () => {
    setLoadingPac(true);
    try { setPacientes(await api.parceiroPacientes.list()); }
    catch { /* ignore */ }
    finally { setLoadingPac(false); }
  }, []);

  useEffect(() => { loadSolicitacoes(); loadPacientes(); }, [loadSolicitacoes, loadPacientes]);

  async function savePaciente(data: Omit<ParceiroPaciente, "id">) {
    if (editPac) {
      await api.parceiroPacientes.update(editPac.id, data);
    } else {
      await api.parceiroPacientes.create(data);
    }
    await loadPacientes();
    setEditPac(null);
  }

  async function deletePaciente(id: string) {
    if (!confirm("Eliminar este paciente?")) return;
    await api.parceiroPacientes.delete(id);
    await loadPacientes();
  }

  function handlePrint(sol: Solicitacao) {
    setPrintTarget(sol);
    setTimeout(() => { window.print(); setPrintTarget(null); }, 200);
  }

  const concluidos = solicitacoes.filter(s => s.estado === "concluido");
  const emAberto = solicitacoes.filter(s => s.estado === "pendente" || s.estado === "em_processo");

  const pacientesFiltrados = useMemo(() => {
    if (!pacSearch.trim()) return pacientes;
    return pacientes.filter(p =>
      p.nome.toLowerCase().includes(pacSearch.toLowerCase()) ||
      p.codigo.includes(pacSearch) ||
      p.bi.includes(pacSearch)
    );
  }, [pacientes, pacSearch]);

  const TABS: { key: Tab; label: string }[] = [
    { key: "externo",    label: "Pedido Externo" },
    { key: "interno",    label: "Pedido Interno (Médico(a))" },
    { key: "resultados", label: "Resultado Prontos" },
    { key: "pacientes",  label: "Pacientes" },
  ];

  return (
    <>
      {/* Print overlay */}
      {printTarget && (
        <div className="pdf-preview fixed inset-0 bg-white z-50 p-10">
          <PrintPedido sol={printTarget} session={session} />
        </div>
      )}

      {resultadoModal && <ResultadoModal solId={resultadoModal} onClose={() => setResultadoModal(null)} />}

      {(novoPacModal || editPac) && (
        <NovoPacienteModal
          initial={editPac || undefined}
          onSave={savePaciente}
          onClose={() => { setNovoPacModal(false); setEditPac(null); }}
        />
      )}

      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* ── Header ── */}
        <header className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 text-sm font-bold" style={{ background: PURPLE }}>
              {(session.parceiroNome || session.username || "P").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-800 text-sm leading-tight truncate">{session.parceiroNome || session.username}</div>
              <div className="text-xs text-gray-400 leading-tight">
                {session.parceiroInstituicao ? `${session.parceiroInstituicao} · ` : ""}{session.empresaNome}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs">
              {emAberto.length > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-semibold">
                  {emAberto.length} em aberto
                </span>
              )}
              {concluidos.length > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-200 font-semibold">
                  {concluidos.length} concluídos
                </span>
              )}
            </div>
            <button onClick={onLogout}
              className="text-xs text-gray-400 hover:text-red-500 font-semibold px-3 py-1.5 rounded border border-gray-200 hover:border-red-200 transition flex-shrink-0">
              Sair
            </button>
          </div>

          {/* Tab bar */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex border-b-0 gap-0 overflow-x-auto">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                    tab === t.key
                      ? "border-purple-600 text-purple-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}>
                  {t.key === "resultados" && concluidos.length > 0 && tab !== "resultados" ? (
                    <span className="flex items-center gap-1.5">
                      {t.label}
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-xs font-bold" style={{ background: PURPLE, fontSize: "10px" }}>
                        {concluidos.length}
                      </span>
                    </span>
                  ) : t.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <main className="flex-1 max-w-6xl mx-auto w-full">

          {/* Pedido Externo */}
          {tab === "externo" && (
            <RequisicaoForm tipoPedido="externo" pacientes={pacientes} session={session} onSaved={loadSolicitacoes} />
          )}

          {/* Pedido Interno */}
          {tab === "interno" && (
            <RequisicaoForm tipoPedido="interno" pacientes={pacientes} session={session} onSaved={loadSolicitacoes} />
          )}

          {/* Resultados Prontos */}
          {tab === "resultados" && (
            <div className="p-4 sm:p-6">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Resultados Prontos</span>
                  <span className="text-xs text-gray-400">{concluidos.length} resultado(s)</span>
                </div>
                {loadingSol ? (
                  <div className="py-12 text-center text-gray-400 text-sm">A carregar...</div>
                ) : concluidos.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="text-gray-300 text-5xl mb-3">📋</div>
                    <div className="text-gray-500 font-semibold">Sem resultados disponíveis</div>
                    <div className="text-gray-400 text-sm mt-1">Os resultados aparecem aqui quando o laboratório os emitir</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Paciente</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase hidden sm:table-cell">Exames</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase hidden md:table-cell">Médico</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Data</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase">Acções</th>
                        </tr>
                      </thead>
                      <tbody>
                        {concluidos.map(sol => (
                          <tr key={sol.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-800">{sol.pacienteNome}</div>
                              {sol.pacienteBi && <div className="text-xs text-gray-400">{sol.pacienteBi}</div>}
                              {sol.tipoPedido === "interno" && <span className="text-xs text-purple-500 font-semibold">Interno</span>}
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <div className="text-xs text-gray-500 max-w-xs">
                                {(sol.examesSolicitados || []).slice(0,3).join(", ")}
                                {(sol.examesSolicitados || []).length > 3 && ` +${(sol.examesSolicitados || []).length - 3}`}
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">{sol.medicoSolicitante || "—"}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{sol.data}<br/>{sol.hora}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => setResultadoModal(sol.id)}
                                  className="px-3 py-1.5 rounded text-xs font-semibold text-white transition"
                                  style={{ background: PURPLE }}>
                                  Ver Resultado
                                </button>
                                <button onClick={() => handlePrint(sol)}
                                  className="px-3 py-1.5 rounded text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                                  Imprimir
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Em aberto section */}
              {emAberto.length > 0 && (
                <div className="mt-4 border border-amber-100 rounded-lg overflow-hidden bg-white">
                  <div className="bg-amber-50 border-b border-amber-100 px-4 py-2">
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Em Processamento ({emAberto.length})</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {emAberto.map(sol => {
                      const cfg = ESTADOS[sol.estado] ?? { label: sol.estado, cls: "bg-gray-100 text-gray-500 border border-gray-200" };
                      return (
                        <div key={sol.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-800">{sol.pacienteNome}</div>
                            <div className="text-xs text-gray-400">{sol.data} {sol.hora}</div>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.cls}`}>{cfg.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pacientes */}
          {tab === "pacientes" && (
            <div className="p-4 sm:p-6 space-y-4">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Os Meus Pacientes ({pacientes.length})</span>
                  <button onClick={() => setNovoPacModal(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded text-white transition"
                    style={{ background: PURPLE }}>
                    + Novo Paciente
                  </button>
                </div>

                <div className="px-4 py-3 border-b border-gray-100">
                  <input value={pacSearch} onChange={e => setPacSearch(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                    placeholder="Pesquisar por nome, código ou BI..." />
                </div>

                {loadingPac ? (
                  <div className="py-12 text-center text-gray-400 text-sm">A carregar...</div>
                ) : pacientesFiltrados.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="text-gray-300 text-5xl mb-3">👤</div>
                    <div className="text-gray-500 font-semibold">{pacSearch ? "Nenhum resultado" : "Nenhum paciente registado"}</div>
                    {!pacSearch && (
                      <div className="text-gray-400 text-sm mt-1">Registe os seus pacientes para agilizar as requisições</div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Cód.</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Nome</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase hidden sm:table-cell">Nascimento</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase hidden sm:table-cell">Sexo</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase hidden md:table-cell">Telefone</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase hidden md:table-cell">BI</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase">Acções</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pacientesFiltrados.map(p => (
                          <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-gray-500 text-xs">{p.codigo || "—"}</td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-800">{p.nome}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{p.nascimento || "—"}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{p.sexo === "M" ? "Masc." : p.sexo === "F" ? "Fem." : "—"}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{p.telefone || "—"}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{p.bi || "—"}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => {
                                  setEditPac(p);
                                }}
                                  className="text-xs font-semibold text-purple-600 hover:underline">Editar</button>
                                <span className="text-gray-200">|</span>
                                <button onClick={() => deletePaciente(p.id)}
                                  className="text-xs font-semibold text-red-400 hover:underline">Eliminar</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
