import { useState, useEffect, useCallback } from "react";
import { api } from "../store/api";
import { Session, FuncaoFuncionario, FUNCAO_LABELS } from "../store/auth";

const FUNCOES: FuncaoFuncionario[] = [
  "diretor_clinico", "medico", "enfermeiro", "tecnico",
  "imagiologista", "farmaceutico", "rececionista",
  "financeiro", "administrativo", "auxiliar", "gestor",
];

const FUNCAO_DESC: Record<FuncaoFuncionario, string> = {
  admin:           "Acesso total ao sistema e configurações",
  gestor:          "Gestão geral da clínica e relatórios",
  diretor_clinico: "Todas as funções clínicas + gestão de qualidade",
  medico:          "Consultas, prescrições, resultados e imagiologia",
  enfermeiro:      "Triagem, sinais vitais, notas de enfermagem",
  tecnico:         "Lançar resultados laboratoriais e histórico",
  imagiologista:   "Pedidos e laudos de imagiologia (RX, TC, RM, Eco)",
  farmaceutico:    "Dispensação de medicamentos e stock farmacêutico",
  rececionista:    "Recepção de pacientes, histórico e faturação",
  financeiro:      "Faturação e conta corrente",
  administrativo:  "Administrativo geral, sem acesso financeiro",
  auxiliar:        "Funções básicas de apoio operacional",
};

const FUNCAO_COR: Record<string, string> = {
  admin:           "bg-purple-100 text-purple-700",
  gestor:          "bg-blue-100 text-blue-700",
  diretor_clinico: "bg-indigo-100 text-indigo-700",
  medico:          "bg-rose-100 text-rose-700",
  enfermeiro:      "bg-teal-100 text-teal-700",
  tecnico:         "bg-cyan-100 text-cyan-700",
  imagiologista:   "bg-violet-100 text-violet-700",
  farmaceutico:    "bg-lime-100 text-lime-700",
  rececionista:    "bg-amber-100 text-amber-700",
  financeiro:      "bg-green-100 text-green-700",
  administrativo:  "bg-slate-100 text-slate-700",
  auxiliar:        "bg-orange-100 text-orange-700",
};

const DEPT_GROUPS: { label: string; icon: string; funcoes: FuncaoFuncionario[] }[] = [
  { label: "Direcção Clínica", icon: "🏥", funcoes: ["diretor_clinico", "gestor"] },
  { label: "Medicina", icon: "⚕️", funcoes: ["medico"] },
  { label: "Enfermagem", icon: "💉", funcoes: ["enfermeiro", "auxiliar"] },
  { label: "Laboratório", icon: "🔬", funcoes: ["tecnico"] },
  { label: "Imagiologia", icon: "🩻", funcoes: ["imagiologista"] },
  { label: "Farmácia", icon: "💊", funcoes: ["farmaceutico"] },
  { label: "Administrativo / Financeiro", icon: "📋", funcoes: ["rececionista", "financeiro", "administrativo"] },
];

const emptyForm = { nome: "", username: "", password: "", funcao: "enfermeiro" as FuncaoFuncionario, ativo: true };

export default function AdminFuncionarios({ session }: { session: Session }) {
  const empresaId = session.empresaId!;
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [filterFuncao, setFilterFuncao] = useState<string>("");

  const load = useCallback(async () => {
    try {
      const list = await api.empresas.listFuncionarios(empresaId);
      setFuncionarios(list);
    } catch { /* ignore */ }
  }, [empresaId]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.username.trim() || !form.password.trim()) {
      setMsg({ text: "Preencha todos os campos obrigatórios.", ok: false }); return;
    }
    try {
      if (editId) {
        await api.empresas.updateFuncionario(empresaId, editId, form);
        setMsg({ text: "Funcionário actualizado.", ok: true });
      } else {
        await api.empresas.createFuncionario(empresaId, form);
        setMsg({ text: `"${form.nome}" criado com sucesso.`, ok: true });
      }
      setForm(emptyForm); setEditId(null);
      await load();
    } catch (err: any) {
      setMsg({ text: err.message || "Erro ao guardar funcionário.", ok: false });
    }
  }

  async function handleToggle(f: any) {
    await api.empresas.updateFuncionario(empresaId, f.id, { ...f, ativo: !f.ativo });
    await load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Eliminar este funcionário?")) return;
    await api.empresas.deleteFuncionario(empresaId, id);
    await load();
  }

  const filtered = funcionarios.filter((f) => {
    const matchSearch = !search || f.nome.toLowerCase().includes(search.toLowerCase()) || f.username.toLowerCase().includes(search.toLowerCase());
    const matchFuncao = !filterFuncao || f.funcao === filterFuncao;
    return matchSearch && matchFuncao;
  });

  const countByFuncao = funcionarios.reduce((acc: Record<string, number>, f) => {
    acc[f.funcao] = (acc[f.funcao] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-primary">Gestão de Funcionários</h2>
        <div className="text-sm text-muted-foreground bg-white border border-border rounded-lg px-3 py-1.5">
          {funcionarios.length} funcionário{funcionarios.length !== 1 ? "s" : ""} registados
        </div>
      </div>

      {/* Departamentos overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {DEPT_GROUPS.map((g) => {
          const count = g.funcoes.reduce((acc, f) => acc + (countByFuncao[f] || 0), 0);
          return (
            <button
              key={g.label}
              onClick={() => setFilterFuncao(filterFuncao === g.funcoes[0] && g.funcoes.length === 1 ? "" : filterFuncao === g.funcoes.join(",") ? "" : g.funcoes[0])}
              className="bg-white border border-border rounded-xl p-3 text-center hover:border-primary/40 transition-colors"
            >
              <div className="text-2xl mb-1">{g.icon}</div>
              <div className="text-lg font-black text-primary">{count}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">{g.label}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Form */}
        <div className="bg-white border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wide">
            {editId ? "✏️ Editar Funcionário" : "➕ Novo Funcionário"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nome Completo *</label>
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Ex: Dr. João Silva" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Utilizador (login) *</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.replace(/\s/g, "").toLowerCase() })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Ex: dr_joao" autoComplete="off" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Palavra-passe *</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Palavra-passe segura" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">{showPass ? "🙈" : "👁"}</button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Função / Departamento *</label>
              <select value={form.funcao} onChange={(e) => setForm({ ...form, funcao: e.target.value as FuncaoFuncionario })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                {FUNCOES.map((f) => <option key={f} value={f}>{FUNCAO_LABELS[f]}</option>)}
              </select>
              <div className={`text-xs rounded-lg px-2.5 py-1.5 mt-1 font-medium ${FUNCAO_COR[form.funcao] || "bg-gray-100 text-gray-700"}`}>
                {FUNCAO_DESC[form.funcao]}
              </div>
            </div>
            {editId && (
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  style={{ accentColor: "hsl(var(--primary))" }} />
                Conta activa
              </label>
            )}
            {msg && (
              <div className={`text-xs rounded-lg px-3 py-2 ${msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                {msg.text}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition">
                {editId ? "Guardar Alterações" : "Criar Funcionário"}
              </button>
              {editId && (
                <button type="button" onClick={() => { setForm(emptyForm); setEditId(null); setMsg(null); }}
                  className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300 py-2 rounded-lg text-sm font-semibold transition">Cancelar</button>
              )}
            </div>
          </form>

          {/* Permissões */}
          <div className="border-t border-border pt-4">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Departamentos e Permissões</div>
            <div className="space-y-2">
              {DEPT_GROUPS.map((g) => (
                <div key={g.label}>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70 mb-1">{g.icon} {g.label}</div>
                  {g.funcoes.map((f) => (
                    <div key={f} className="flex items-start gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 mt-0.5 whitespace-nowrap ${FUNCAO_COR[f]}`}>
                        {FUNCAO_LABELS[f].split("(")[0].trim()}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-relaxed">{FUNCAO_DESC[f]}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-3 flex-wrap">
            <h3 className="text-sm font-bold">Funcionários ({filtered.length})</h3>
            <select value={filterFuncao} onChange={(e) => setFilterFuncao(e.target.value)}
              className="border border-border rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Todos os departamentos</option>
              {FUNCOES.map((f) => <option key={f} value={f}>{FUNCAO_LABELS[f]}</option>)}
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar nome..."
              className="ml-auto border border-border rounded-lg px-3 py-1.5 text-xs w-40 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {funcionarios.length === 0 ? "Nenhum funcionário criado. Use o formulário ao lado." : "Nenhum resultado."}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/20 transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: f.ativo ? "hsl(var(--primary))" : "#9ca3af" }}>
                    {f.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{f.nome}</div>
                    <div className="text-xs text-muted-foreground">@{f.username}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${FUNCAO_COR[f.funcao] || "bg-gray-100 text-gray-700"}`}>
                      {FUNCAO_LABELS[f.funcao as FuncaoFuncionario] || f.funcao}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${f.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {f.ativo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="flex gap-1.5 text-xs flex-shrink-0">
                    <button onClick={() => { setForm({ nome: f.nome, username: f.username, password: f.password, funcao: f.funcao, ativo: f.ativo }); setEditId(f.id); setMsg(null); }}
                      className="text-primary hover:underline font-semibold">Editar</button>
                    <span className="text-border">|</span>
                    <button onClick={() => handleToggle(f)} className="text-amber-600 hover:underline font-semibold">
                      {f.ativo ? "Desactivar" : "Activar"}
                    </button>
                    <span className="text-border">|</span>
                    <button onClick={() => handleDelete(f.id)} className="text-destructive hover:underline font-semibold">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
