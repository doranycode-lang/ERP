import { useState, useEffect, useCallback } from "react";
import { api } from "../store/api";

type FuncaoFuncionario = "gestor" | "tecnico" | "rececionista" | "financeiro" | "medico";
const FUNCAO_LABELS: Record<FuncaoFuncionario, string> = {
  gestor: "Gestor", tecnico: "Técnico de Laboratório",
  rececionista: "Recepcionista", financeiro: "Financeiro", medico: "Médico / Director Técnico",
};
const FUNCOES: FuncaoFuncionario[] = ["gestor", "tecnico", "rececionista", "financeiro", "medico"];

const emptyEmpForm = { nome: "", nif: "", username: "", password: "", ativo: true };
const emptyFncForm = { nome: "", username: "", password: "", funcao: "tecnico" as FuncaoFuncionario };
const emptyParForm = { nome: "", instituicao: "", username: "", password: "", email: "", telefone: "" };

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`text-xs px-2 py-1 rounded font-semibold transition flex-shrink-0 ${copied ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
      {copied ? "✓ Copiado" : "Copiar"}
    </button>
  );
}

function UrlBox({ label, url, color }: { label: string; url: string; color: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 text-xs bg-gray-50 border border-border rounded-lg px-3 py-2 font-mono break-all select-all text-gray-700 truncate">
          {url}
        </div>
        <CopyButton value={url} />
      </div>
    </div>
  );
}

const inp = "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white";

export default function AdminEmpresas({ onLogout }: { onLogout: () => void }) {
  const origin = window.location.origin;

  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empForm, setEmpForm] = useState(emptyEmpForm);
  const [editEmpId, setEditEmpId] = useState<string | null>(null);
  const [showEmpPass, setShowEmpPass] = useState(false);
  const [empMsg, setEmpMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loadingEmps, setLoadingEmps] = useState(true);

  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | null>(null);
  const [empTab, setEmpTab] = useState<"funcionarios" | "parceiros">("funcionarios");

  // Funcionários
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [fncForm, setFncForm] = useState(emptyFncForm);
  const [editFncId, setEditFncId] = useState<string | null>(null);
  const [showFncPass, setShowFncPass] = useState(false);
  const [fncMsg, setFncMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Parceiros
  const [parceiros, setParceiros] = useState<any[]>([]);
  const [parForm, setParForm] = useState(emptyParForm);
  const [editParId, setEditParId] = useState<string | null>(null);
  const [showParPass, setShowParPass] = useState(false);
  const [parMsg, setParMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const loadEmpresas = useCallback(async () => {
    setLoadingEmps(true);
    try { const list = await api.empresas.list(); setEmpresas(list); }
    finally { setLoadingEmps(false); }
  }, []);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);

  async function handleEmpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!empForm.nome.trim() || !empForm.username.trim() || !empForm.password.trim()) {
      setEmpMsg({ text: "Preencha todos os campos obrigatórios.", ok: false }); return;
    }
    try {
      if (editEmpId) {
        await api.empresas.update(editEmpId, empForm);
        setEmpMsg({ text: "Empresa actualizada.", ok: true });
      } else {
        await api.empresas.create(empForm);
        setEmpMsg({ text: `Empresa "${empForm.nome}" criada.`, ok: true });
      }
      setEmpForm(emptyEmpForm); setEditEmpId(null);
      await loadEmpresas();
    } catch (err: any) { setEmpMsg({ text: err.message || "Erro ao guardar empresa.", ok: false }); }
  }

  async function openEmpresa(empresa: any) {
    setSelectedEmpresaId(empresa.id);
    setEmpTab("funcionarios");
    setFncForm(emptyFncForm); setEditFncId(null); setFncMsg(null);
    setParForm(emptyParForm); setEditParId(null); setParMsg(null);
    const [fncs, pars] = await Promise.all([
      api.empresas.listFuncionarios(empresa.id),
      api.empresas.listParceiros(empresa.id),
    ]);
    setFuncionarios(fncs);
    setParceiros(pars);
  }

  async function handleFncSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fncForm.nome.trim() || !fncForm.username.trim() || !fncForm.password.trim()) {
      setFncMsg({ text: "Preencha todos os campos.", ok: false }); return;
    }
    try {
      if (editFncId) {
        await api.empresas.updateFuncionario(selectedEmpresaId!, editFncId, fncForm);
        setFncMsg({ text: "Funcionário actualizado.", ok: true });
      } else {
        await api.empresas.createFuncionario(selectedEmpresaId!, fncForm);
        setFncMsg({ text: `"${fncForm.nome}" criado.`, ok: true });
      }
      setFncForm(emptyFncForm); setEditFncId(null);
      setFuncionarios(await api.empresas.listFuncionarios(selectedEmpresaId!));
    } catch (err: any) { setFncMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function handleParSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parForm.nome.trim() || !parForm.username.trim() || !parForm.password.trim()) {
      setParMsg({ text: "Nome, utilizador e palavra-passe são obrigatórios.", ok: false }); return;
    }
    try {
      if (editParId) {
        await api.empresas.updateParceiro(selectedEmpresaId!, editParId, parForm);
        setParMsg({ text: "Parceiro actualizado.", ok: true });
      } else {
        await api.empresas.createParceiro(selectedEmpresaId!, parForm);
        setParMsg({ text: `Parceiro "${parForm.nome}" criado. Link: ${origin}/parceiro`, ok: true });
      }
      setParForm(emptyParForm); setEditParId(null);
      setParceiros(await api.empresas.listParceiros(selectedEmpresaId!));
    } catch (err: any) { setParMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function toggleEmpresa(emp: any) {
    await api.empresas.update(emp.id, { ...emp, ativo: !emp.ativo });
    await loadEmpresas();
  }

  async function deleteEmpresa(id: string) {
    if (!window.confirm("Eliminar empresa e todos os seus dados?")) return;
    await api.empresas.delete(id);
    if (selectedEmpresaId === id) setSelectedEmpresaId(null);
    await loadEmpresas();
  }

  async function toggleFuncionario(f: any) {
    await api.empresas.updateFuncionario(selectedEmpresaId!, f.id, { ...f, ativo: !f.ativo });
    setFuncionarios(await api.empresas.listFuncionarios(selectedEmpresaId!));
  }
  async function deleteFuncionario(fid: string) {
    if (!window.confirm("Eliminar funcionário?")) return;
    await api.empresas.deleteFuncionario(selectedEmpresaId!, fid);
    setFuncionarios(await api.empresas.listFuncionarios(selectedEmpresaId!));
  }

  async function toggleParceiro(p: any) {
    await api.empresas.updateParceiro(selectedEmpresaId!, p.id, { ...p, ativo: !p.ativo });
    setParceiros(await api.empresas.listParceiros(selectedEmpresaId!));
  }
  async function deleteParceiro(pid: string) {
    if (!window.confirm("Eliminar parceiro?")) return;
    await api.empresas.deleteParceiro(selectedEmpresaId!, pid);
    setParceiros(await api.empresas.listParceiros(selectedEmpresaId!));
  }

  const selectedEmpresa = empresas.find((e) => e.id === selectedEmpresaId);
  const funcaoCor: Record<string, string> = {
    gestor: "bg-blue-100 text-blue-700", tecnico: "bg-cyan-100 text-cyan-700",
    rececionista: "bg-amber-100 text-amber-700", financeiro: "bg-green-100 text-green-700",
    medico: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-4 px-6 py-4 shadow-sm" style={{ background: "hsl(220 70% 25%)" }}>
        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
          </svg>
        </div>
        <div>
          <div className="text-white font-bold text-base">Painel do Desenvolvedor</div>
          <div className="text-white/70 text-xs">Gestão de Empresas / Laboratórios</div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <a href="/" className="text-white/70 hover:text-white text-xs font-semibold transition">Portal Empresas</a>
          <a href="/parceiro" className="text-white/70 hover:text-white text-xs font-semibold transition">Portal Parceiros</a>
          <button onClick={onLogout} className="bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-2 rounded-lg font-semibold transition">Sair</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-border rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-primary">{empresas.length}</div>
            <div className="text-xs text-muted-foreground">Empresas Registadas</div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-600">{empresas.filter((e) => e.ativo).length}</div>
            <div className="text-xs text-muted-foreground">Activas</div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-gray-400">{empresas.filter((e) => !e.ativo).length}</div>
            <div className="text-xs text-muted-foreground">Inactivas</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Create empresa form */}
          <div className="lg:col-span-2 bg-white border border-border rounded-xl shadow-sm p-6 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">
                {editEmpId ? "Editar Empresa" : "Nova Empresa / Laboratório"}
              </h2>
              <form onSubmit={handleEmpSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Nome da Empresa *</label>
                  <input value={empForm.nome} onChange={(e) => setEmpForm({ ...empForm, nome: e.target.value })} className={inp} placeholder="Ex: Laboratório Central" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">NIF da Empresa</label>
                  <input value={empForm.nif} onChange={(e) => setEmpForm({ ...empForm, nif: e.target.value })} className={inp} placeholder="NIF para faturação AGT" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Utilizador (login admin) *</label>
                  <input value={empForm.username} onChange={(e) => setEmpForm({ ...empForm, username: e.target.value })} className={inp} placeholder="Ex: labcentral" autoComplete="off" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Palavra-passe *</label>
                  <div className="relative">
                    <input type={showEmpPass ? "text" : "password"} value={empForm.password}
                      onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })}
                      className={inp + " pr-9"} placeholder="Palavra-passe segura" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowEmpPass(!showEmpPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {showEmpPass ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>
                {editEmpId && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={empForm.ativo} onChange={(e) => setEmpForm({ ...empForm, ativo: e.target.checked })} style={{ accentColor: "hsl(var(--primary))" }} />
                    Conta activa
                  </label>
                )}
                {empMsg && (
                  <div className={`text-xs rounded-lg px-3 py-2 ${empMsg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>{empMsg.text}</div>
                )}
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition">
                    {editEmpId ? "Guardar" : "Criar Empresa"}
                  </button>
                  {editEmpId && (
                    <button type="button" onClick={() => { setEmpForm(emptyEmpForm); setEditEmpId(null); setEmpMsg(null); }}
                      className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300 py-2 rounded-lg text-sm font-semibold transition">Cancelar</button>
                  )}
                </div>
              </form>
            </div>

            {/* URLs to share */}
            <div className="border-t border-border pt-5 space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Links para Partilhar</h3>
              <UrlBox label="Portal das Empresas (partilhe com o laboratório)" url={`${origin}/`} color="hsl(162 60% 38%)" />
              <UrlBox label="Portal de Parceiros (clínicas / médicos)" url={`${origin}/parceiro`} color="hsl(258 70% 55%)" />
              <UrlBox label="Painel do Desenvolvedor (uso interno)" url={`${origin}/admin`} color="hsl(215 80% 50%)" />
            </div>
          </div>

          {/* Empresa list */}
          <div className="lg:col-span-3 bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold">Empresas Registadas ({empresas.length})</h2>
            </div>
            {loadingEmps ? (
              <div className="py-14 text-center text-muted-foreground text-sm">A carregar...</div>
            ) : empresas.length === 0 ? (
              <div className="py-14 text-center text-muted-foreground text-sm">Nenhuma empresa registada. Crie a primeira ao lado.</div>
            ) : (
              <div className="divide-y divide-border">
                {empresas.map((emp) => (
                  <div key={emp.id}
                    className={`flex items-center gap-3 px-5 py-4 hover:bg-accent/20 transition-colors ${selectedEmpresaId === emp.id ? "bg-primary/5 border-l-4 border-primary" : ""}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: emp.ativo ? "hsl(var(--primary))" : "#9ca3af" }}>
                      {emp.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{emp.nome}</div>
                      <div className="text-xs text-muted-foreground">@{emp.username} {emp.nif ? `· NIF: ${emp.nif}` : ""}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${emp.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {emp.ativo ? "Activa" : "Inactiva"}
                    </span>
                    <div className="flex gap-1.5 text-xs flex-shrink-0 flex-wrap justify-end">
                      <button onClick={() => openEmpresa(emp)}
                        className="bg-primary/10 text-primary px-2.5 py-1 rounded font-semibold hover:bg-primary/20 transition">
                        Gerir
                      </button>
                      <button onClick={() => { setEmpForm({ nome: emp.nome, nif: emp.nif || "", username: emp.username, password: emp.password, ativo: emp.ativo }); setEditEmpId(emp.id); setEmpMsg(null); }}
                        className="text-primary hover:underline font-semibold px-1">Editar</button>
                      <button onClick={() => toggleEmpresa(emp)}
                        className="text-amber-600 hover:underline font-semibold px-1">{emp.ativo ? "Desact." : "Activar"}</button>
                      <button onClick={() => deleteEmpresa(emp.id)}
                        className="text-destructive hover:underline font-semibold px-1">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Empresa detail panel */}
        {selectedEmpresa && (
          <div className="bg-white border border-primary/30 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3" style={{ background: "hsl(var(--primary) / 0.06)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: "hsl(var(--primary))" }}>
                {selectedEmpresa.nome.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-primary">{selectedEmpresa.nome}</div>
                <div className="text-xs text-muted-foreground">
                  {funcionarios.length} funcionário(s) · {parceiros.length} parceiro(s)
                </div>
              </div>
              <button onClick={() => { setSelectedEmpresaId(null); setFncMsg(null); setParMsg(null); }}
                className="text-xs text-muted-foreground hover:text-destructive font-semibold">✕ Fechar</button>
            </div>

            {/* Tab selector */}
            <div className="flex border-b border-border">
              {([
                { id: "funcionarios" as const, label: `Funcionários (${funcionarios.length})` },
                { id: "parceiros" as const, label: `Parceiros / Clínicas (${parceiros.length})` },
              ]).map((t) => (
                <button key={t.id} onClick={() => setEmpTab(t.id)}
                  className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${empTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Funcionários tab */}
            {empTab === "funcionarios" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-x divide-border">
                <div className="p-5">
                  <h3 className="text-sm font-bold text-primary mb-4">{editFncId ? "Editar Funcionário" : "Novo Funcionário"}</h3>
                  <form onSubmit={handleFncSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Nome Completo *</label>
                      <input value={fncForm.nome} onChange={(e) => setFncForm({ ...fncForm, nome: e.target.value })} className={inp} placeholder="Nome do funcionário" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Utilizador (login) *</label>
                      <input value={fncForm.username} onChange={(e) => setFncForm({ ...fncForm, username: e.target.value })} className={inp} placeholder="Ex: tecnico01" autoComplete="off" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Palavra-passe *</label>
                      <div className="relative">
                        <input type={showFncPass ? "text" : "password"} value={fncForm.password}
                          onChange={(e) => setFncForm({ ...fncForm, password: e.target.value })}
                          className={inp + " pr-9"} autoComplete="new-password" />
                        <button type="button" onClick={() => setShowFncPass(!showFncPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          {showFncPass ? "🙈" : "👁"}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Função / Perfil *</label>
                      <select value={fncForm.funcao} onChange={(e) => setFncForm({ ...fncForm, funcao: e.target.value as FuncaoFuncionario })}
                        className={inp + " cursor-pointer"}>
                        {FUNCOES.map((f) => <option key={f} value={f}>{FUNCAO_LABELS[f]}</option>)}
                      </select>
                    </div>
                    {fncMsg && (
                      <div className={`text-xs rounded-lg px-3 py-2 ${fncMsg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>{fncMsg.text}</div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition">
                        {editFncId ? "Guardar" : "Criar Funcionário"}
                      </button>
                      {editFncId && (
                        <button type="button" onClick={() => { setFncForm(emptyFncForm); setEditFncId(null); setFncMsg(null); }}
                          className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300 py-2 rounded-lg text-sm font-semibold transition">Cancelar</button>
                      )}
                    </div>
                  </form>
                </div>
                <div className="lg:col-span-2 divide-y divide-border">
                  {funcionarios.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">Nenhum funcionário criado.</div>
                  ) : funcionarios.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-accent/10">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: f.ativo ? "hsl(var(--primary))" : "#9ca3af" }}>
                        {f.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{f.nome}</div>
                        <div className="text-xs text-muted-foreground">@{f.username}</div>
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${funcaoCor[f.funcao] || "bg-gray-100 text-gray-700"}`}>
                        {FUNCAO_LABELS[f.funcao as FuncaoFuncionario] || f.funcao}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${f.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {f.ativo ? "Activo" : "Inactivo"}
                      </span>
                      <div className="flex gap-2 text-xs flex-shrink-0">
                        <button onClick={() => { setFncForm({ nome: f.nome, username: f.username, password: f.password, funcao: f.funcao }); setEditFncId(f.id); setFncMsg(null); }}
                          className="text-primary hover:underline font-semibold">Editar</button>
                        <span className="text-border">|</span>
                        <button onClick={() => toggleFuncionario(f)} className="text-amber-600 hover:underline font-semibold">{f.ativo ? "Desact." : "Activar"}</button>
                        <span className="text-border">|</span>
                        <button onClick={() => deleteFuncionario(f.id)} className="text-destructive hover:underline font-semibold">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parceiros tab */}
            {empTab === "parceiros" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-x divide-border">
                <div className="p-5">
                  <h3 className="text-sm font-bold mb-1" style={{ color: "hsl(258 70% 55%)" }}>{editParId ? "Editar Parceiro" : "Novo Parceiro"}</h3>
                  <p className="text-xs text-muted-foreground mb-4">Os parceiros acedem ao sistema em <strong>/parceiro</strong></p>
                  <form onSubmit={handleParSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Nome do Médico / Responsável *</label>
                      <input value={parForm.nome} onChange={(e) => setParForm({ ...parForm, nome: e.target.value })} className={inp} placeholder="Dr. João Silva" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Clínica / Instituição</label>
                      <input value={parForm.instituicao} onChange={(e) => setParForm({ ...parForm, instituicao: e.target.value })} className={inp} placeholder="Ex: Clínica Saúde Viva" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Utilizador (login) *</label>
                      <input value={parForm.username} onChange={(e) => setParForm({ ...parForm, username: e.target.value })} className={inp} placeholder="Ex: djoaosilva" autoComplete="off" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Palavra-passe *</label>
                      <div className="relative">
                        <input type={showParPass ? "text" : "password"} value={parForm.password}
                          onChange={(e) => setParForm({ ...parForm, password: e.target.value })}
                          className={inp + " pr-9"} autoComplete="new-password" />
                        <button type="button" onClick={() => setShowParPass(!showParPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          {showParPass ? "🙈" : "👁"}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Email</label>
                      <input type="email" value={parForm.email} onChange={(e) => setParForm({ ...parForm, email: e.target.value })} className={inp} placeholder="email@clinica.ao" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Telefone</label>
                      <input value={parForm.telefone} onChange={(e) => setParForm({ ...parForm, telefone: e.target.value })} className={inp} placeholder="9XX XXX XXX" />
                    </div>
                    {parMsg && (
                      <div className={`text-xs rounded-lg px-3 py-2 ${parMsg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>{parMsg.text}</div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button type="submit" className="flex-1 text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition" style={{ background: "hsl(258 70% 55%)" }}>
                        {editParId ? "Guardar" : "Criar Parceiro"}
                      </button>
                      {editParId && (
                        <button type="button" onClick={() => { setParForm(emptyParForm); setEditParId(null); setParMsg(null); }}
                          className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300 py-2 rounded-lg text-sm font-semibold transition">Cancelar</button>
                      )}
                    </div>
                  </form>
                </div>
                <div className="lg:col-span-2 divide-y divide-border">
                  {parceiros.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="text-muted-foreground text-sm mb-2">Nenhum parceiro registado.</div>
                      <div className="text-xs text-muted-foreground">Crie parceiros (clínicas, médicos) que podem solicitar exames ao laboratório.</div>
                      <div className="mt-2 text-xs font-mono bg-muted rounded px-3 py-1.5 inline-block">Link: {window.location.origin}/parceiro</div>
                    </div>
                  ) : parceiros.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-accent/10">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: p.ativo ? "hsl(258 70% 55%)" : "#9ca3af" }}>
                        {p.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{p.nome}</div>
                        <div className="text-xs text-muted-foreground">
                          @{p.username}
                          {p.instituicao ? ` · ${p.instituicao}` : ""}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${p.ativo ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.ativo ? "Activo" : "Inactivo"}
                      </span>
                      <div className="flex gap-2 text-xs flex-shrink-0">
                        <button onClick={() => { setParForm({ nome: p.nome, instituicao: p.instituicao || "", username: p.username, password: p.password, email: p.email || "", telefone: p.telefone || "" }); setEditParId(p.id); setParMsg(null); }}
                          className="text-primary hover:underline font-semibold">Editar</button>
                        <span className="text-border">|</span>
                        <button onClick={() => toggleParceiro(p)} className="text-amber-600 hover:underline font-semibold">{p.ativo ? "Desact." : "Activar"}</button>
                        <span className="text-border">|</span>
                        <button onClick={() => deleteParceiro(p.id)} className="text-destructive hover:underline font-semibold">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
