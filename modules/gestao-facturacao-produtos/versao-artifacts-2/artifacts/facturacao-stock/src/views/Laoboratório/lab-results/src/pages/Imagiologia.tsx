import { useState, useEffect, useCallback } from "react";
import { api } from "../store/api";
import { Session } from "../store/auth";

const TIPOS_EXAME = [
  "Radiografia (RX)", "Tomografia Computorizada (TC)", "Ressonância Magnética (RM)",
  "Ecografia", "Mamografia", "Densitometria Óssea (DEXA)",
  "Radioscopia", "Angiografia", "PET-CT",
];

const REGIOES = [
  "Tórax", "Abdómen", "Pélvis", "Crânio / Encéfalo", "Coluna Vertebral",
  "Membros Superiores", "Membros Inferiores", "Pescoço", "Face / Seios Perinasais",
  "Coração / Cardiovascular", "Mama", "Obstétrica", "Renal / Urinário",
];

type EstadoImg = "pendente" | "em_curso" | "realizado" | "relatado";

const ESTADO_IMG: Record<EstadoImg, { label: string; badge: string; icon: string }> = {
  pendente:  { label: "Pendente",  badge: "bg-blue-100 text-blue-700",   icon: "⏳" },
  em_curso:  { label: "Em curso",  badge: "bg-amber-100 text-amber-700", icon: "🔄" },
  realizado: { label: "Realizado", badge: "bg-teal-100 text-teal-700",   icon: "✅" },
  relatado:  { label: "Relatado",  badge: "bg-green-100 text-green-700", icon: "📋" },
};

const emptyForm = {
  pacienteNome: "", pacienteIdade: "", medicoSolicitante: "",
  tipoExame: TIPOS_EXAME[0], regiao: REGIOES[0], indicacao: "",
  urgente: false, data: new Date().toISOString().slice(0, 10),
  hora: new Date().toTimeString().slice(0, 5),
};

const emptyLaudo = { resultado: "", conclusao: "" };
const inp = "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export default function Imagiologia({ session }: { session: Session }) {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showLaudo, setShowLaudo] = useState(false);
  const [laudoForm, setLaudoForm] = useState(emptyLaudo);
  const [laudoId, setLaudoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [detalhe, setDetalhe] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPedidos(await api.imagiologia.list()); } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setForm({ ...emptyForm, data: new Date().toISOString().slice(0, 10), hora: new Date().toTimeString().slice(0, 5) });
    setEditId(null); setMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pacienteNome.trim() || !form.tipoExame || !form.indicacao.trim()) {
      setMsg({ text: "Nome do paciente, tipo de exame e indicação clínica são obrigatórios.", ok: false }); return;
    }
    try {
      const payload = { ...form, registadoPor: session.funcionarioNome || session.username };
      if (editId) { await api.imagiologia.update(editId, payload); setMsg({ text: "Pedido actualizado.", ok: true }); }
      else { await api.imagiologia.create(payload); setMsg({ text: `Pedido de "${form.tipoExame}" registado.`, ok: true }); }
      resetForm(); setShowForm(false); await load();
    } catch (err: any) { setMsg({ text: err.message || "Erro ao guardar.", ok: false }); }
  }

  async function submitLaudo(e: React.FormEvent) {
    e.preventDefault();
    if (!laudoId) return;
    await api.imagiologia.update(laudoId, { ...laudoForm, estado: "relatado" });
    setShowLaudo(false); setLaudoId(null); setLaudoForm(emptyLaudo);
    setDetalhe((d: any) => d?.id === laudoId ? { ...d, ...laudoForm, estado: "relatado" } : d);
    await load();
  }

  async function updateEstado(id: number, estado: EstadoImg) {
    await api.imagiologia.update(id, { estado });
    setDetalhe((d: any) => d?.id === id ? { ...d, estado } : d);
    await load();
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Eliminar este pedido?")) return;
    await api.imagiologia.delete(id); setDetalhe(null); await load();
  }

  const filtered = pedidos.filter(p =>
    (!search || p.pacienteNome.toLowerCase().includes(search.toLowerCase()) || p.tipoExame.toLowerCase().includes(search.toLowerCase())) &&
    (!filterEstado || p.estado === filterEstado)
  );

  const counts = pedidos.reduce((a, p) => ({
    total: a.total + 1,
    pendente: a.pendente + (p.estado === "pendente" ? 1 : 0),
    urgente: a.urgente + (p.urgente ? 1 : 0),
    relatado: a.relatado + (p.estado === "relatado" ? 1 : 0),
  }), { total: 0, pendente: 0, urgente: 0, relatado: 0 });

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-primary">Imagiologia</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Pedidos de exames imagiológicos e laudos (RX, TC, RM, Eco...)</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition shadow-sm">
          🩻 Novo Pedido
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.total, cor: "text-primary" },
          { label: "Pendentes", value: counts.pendente, cor: "text-blue-600" },
          { label: "Urgentes", value: counts.urgente, cor: "text-red-600" },
          { label: "Relatados", value: counts.relatado, cor: "text-green-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-border rounded-xl p-4 text-center shadow-sm">
            <div className={`text-2xl font-black ${s.cor}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-3 text-sm ${msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* Modal Pedido */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold">{editId ? "✏️ Editar Pedido" : "🩻 Novo Pedido de Imagiologia"}</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-lg">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Nome do Paciente *</label>
                  <input value={form.pacienteNome} onChange={e => setForm(f => ({ ...f, pacienteNome: e.target.value }))} className={inp} placeholder="Nome completo" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Idade</label>
                  <input value={form.pacienteIdade} onChange={e => setForm(f => ({ ...f, pacienteIdade: e.target.value }))} className={inp} placeholder="Ex: 45 anos" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Médico Solicitante</label>
                  <input value={form.medicoSolicitante} onChange={e => setForm(f => ({ ...f, medicoSolicitante: e.target.value }))} className={inp} placeholder="Dr. Nome" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Tipo de Exame *</label>
                  <select value={form.tipoExame} onChange={e => setForm(f => ({ ...f, tipoExame: e.target.value }))} className={inp + " bg-white"}>
                    {TIPOS_EXAME.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Região Anatómica</label>
                  <select value={form.regiao} onChange={e => setForm(f => ({ ...f, regiao: e.target.value }))} className={inp + " bg-white"}>
                    {REGIOES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Data</label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Hora</label>
                  <input type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} className={inp} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Indicação Clínica *</label>
                  <textarea value={form.indicacao} onChange={e => setForm(f => ({ ...f, indicacao: e.target.value }))} className={inp + " resize-none"} rows={2} placeholder="Justificação clínica do exame" />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input type="checkbox" checked={form.urgente} onChange={e => setForm(f => ({ ...f, urgente: e.target.checked }))}
                      style={{ accentColor: "hsl(var(--primary))" }} />
                    <span className="text-red-600 font-semibold">🚨 Exame urgente</span>
                  </label>
                </div>
              </div>

              {msg && !msg.ok && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">{msg.text}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition">
                  {editId ? "Guardar Alterações" : "✅ Registar Pedido"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 border border-border rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Laudo */}
      {showLaudo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold">📋 Elaborar Laudo / Relatório</h3>
              <button onClick={() => setShowLaudo(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-lg">✕</button>
            </div>
            <form onSubmit={submitLaudo} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Descrição / Resultado do Exame</label>
                <textarea value={laudoForm.resultado} onChange={e => setLaudoForm(f => ({ ...f, resultado: e.target.value }))}
                  className={inp + " resize-none"} rows={5} placeholder="Descreva os achados imagiológicos em detalhe..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Conclusão / Impressão Diagnóstica</label>
                <textarea value={laudoForm.conclusao} onChange={e => setLaudoForm(f => ({ ...f, conclusao: e.target.value }))}
                  className={inp + " resize-none"} rows={3} placeholder="Conclusão clínica e diagnóstico diferencial..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition">
                  ✅ Guardar Laudo
                </button>
                <button type="button" onClick={() => setShowLaudo(false)}
                  className="px-5 border border-border rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Lista */}
        <div className="lg:col-span-2 bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold">Pedidos ({filtered.length})</span>
            <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="border border-border rounded-lg px-2 py-1 text-xs bg-white">
              <option value="">Todos os estados</option>
              {Object.entries(ESTADO_IMG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..."
              className="ml-auto border border-border rounded-lg px-3 py-1 text-xs w-40" />
          </div>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground text-sm">A carregar…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {pedidos.length === 0 ? "Nenhum pedido registado." : "Nenhum resultado."}</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(p => {
                const ec = ESTADO_IMG[p.estado as EstadoImg];
                return (
                  <button key={p.id} onClick={() => setDetalhe(p)}
                    className={`w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-accent/20 transition-colors ${detalhe?.id === p.id ? "bg-primary/5 border-l-4 border-primary" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{p.pacienteNome}</span>
                        {p.urgente && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">URGENTE</span>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{p.tipoExame} — {p.regiao}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ec?.badge}`}>{ec?.icon} {ec?.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{p.hora}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalhe */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          {!detalhe ? (
            <div className="py-16 text-center text-muted-foreground text-sm px-4">
              <div className="text-4xl mb-2">🩻</div>
              <p>Seleccione um pedido para ver os detalhes</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">{detalhe.pacienteNome}</div>
                  <div className="text-xs text-muted-foreground">{detalhe.data} · {detalhe.hora}</div>
                </div>
                <button onClick={() => setDetalhe(null)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-280px)]">
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ESTADO_IMG[detalhe.estado as EstadoImg]?.badge}`}>
                    {ESTADO_IMG[detalhe.estado as EstadoImg]?.icon} {ESTADO_IMG[detalhe.estado as EstadoImg]?.label}
                  </span>
                  {detalhe.urgente && <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-red-100 text-red-700">🚨 Urgente</span>}
                  {detalhe.pacienteIdade && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold">{detalhe.pacienteIdade}</span>}
                </div>

                <div className="space-y-2">
                  {[
                    { label: "Tipo de Exame", value: detalhe.tipoExame },
                    { label: "Região", value: detalhe.regiao },
                    { label: "Médico Solicitante", value: detalhe.medicoSolicitante },
                    { label: "Indicação Clínica", value: detalhe.indicacao },
                  ].map(item => item.value && (
                    <div key={item.label}>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{item.label}</div>
                      <p className="text-sm text-gray-700">{item.value}</p>
                    </div>
                  ))}
                </div>

                {detalhe.resultado && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                    <div className="text-xs font-bold text-teal-800 mb-1">📋 Resultado do Exame</div>
                    <p className="text-xs text-teal-700">{detalhe.resultado}</p>
                    {detalhe.conclusao && (
                      <>
                        <div className="text-xs font-bold text-teal-800 mt-2 mb-1">Conclusão</div>
                        <p className="text-xs text-teal-700">{detalhe.conclusao}</p>
                      </>
                    )}
                  </div>
                )}

                {/* Estado */}
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Actualizar Estado</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {(Object.keys(ESTADO_IMG) as EstadoImg[]).map(e => (
                      <button key={e} onClick={() => updateEstado(detalhe.id, e)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${detalhe.estado === e ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {ESTADO_IMG[e].icon} {ESTADO_IMG[e].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border flex-wrap">
                  <button onClick={() => {
                    setLaudoId(detalhe.id);
                    setLaudoForm({ resultado: detalhe.resultado || "", conclusao: detalhe.conclusao || "" });
                    setShowLaudo(true);
                  }} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs py-2 font-semibold transition min-w-[80px]">📋 Laudo</button>
                  <button onClick={() => {
                    setForm({
                      pacienteNome: detalhe.pacienteNome, pacienteIdade: detalhe.pacienteIdade || "",
                      medicoSolicitante: detalhe.medicoSolicitante || "", tipoExame: detalhe.tipoExame,
                      regiao: detalhe.regiao, indicacao: detalhe.indicacao, urgente: detalhe.urgente,
                      data: detalhe.data, hora: detalhe.hora,
                    });
                    setEditId(detalhe.id); setShowForm(true);
                  }} className="flex-1 border border-border rounded-lg text-xs py-2 text-gray-600 hover:bg-gray-50 font-semibold min-w-[60px]">Editar</button>
                  <button onClick={() => handleDelete(detalhe.id)}
                    className="flex-1 border border-red-200 rounded-lg text-xs py-2 text-red-600 hover:bg-red-50 font-semibold min-w-[70px]">Eliminar</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
