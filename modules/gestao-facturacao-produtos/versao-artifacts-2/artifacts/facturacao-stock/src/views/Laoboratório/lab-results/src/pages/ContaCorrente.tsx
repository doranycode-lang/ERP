import { useState } from "react";
import { useApp } from "../store/AppContext";
import { formatCurrency } from "../store/storage";
import { Session } from "../store/auth";

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

const CATEGORIAS_ENTRADA = [
  "Faturação", "Consulta", "Análises", "Subsídio", "Transferência", "Outro",
];
const CATEGORIAS_SAIDA = [
  "Salários", "Fornecedores", "Material de Consumo", "Rendas", "Electricidade/Água",
  "Telecomunicações", "Equipamento", "Manutenção", "Impostos / AGT", "Seguros",
  "Publicidade", "Formação", "Limpeza", "Refeições / Representação", "Outro",
];

export default function ContaCorrente({ session }: { session: Session }) {
  const { data, addMovimento, removeMovimento } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "entrada" | "saida">("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const moeda = data.config.moeda || "AOA";
  const hoje = todayStr();

  const [form, setForm] = useState({
    data: hoje, descricao: "", tipo: "entrada" as "entrada" | "saida",
    valor: "", categoria: "", referencia: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.descricao.trim()) { alert("A descrição é obrigatória."); return; }
    const v = parseFloat(form.valor);
    if (!v || v <= 0) { alert("Insira um valor válido."); return; }
    addMovimento({
      data: form.data,
      descricao: form.descricao.trim(),
      tipo: form.tipo,
      valor: v,
      categoria: form.categoria.trim() || "Geral",
      referencia: form.referencia.trim(),
      registadoPor: session.funcionarioNome || session.username,
    });
    setForm({ data: hoje, descricao: "", tipo: "entrada", valor: "", categoria: "", referencia: "" });
    setShowForm(false);
  }

  const totalEntradas = data.movimentosCC.filter((m) => m.tipo === "entrada").reduce((s, m) => s + m.valor, 0);
  const totalSaidas = data.movimentosCC.filter((m) => m.tipo === "saida").reduce((s, m) => s + m.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  const allCategorias = [...new Set(data.movimentosCC.map((m) => m.categoria).filter(Boolean))].sort();

  const filtered = [...data.movimentosCC].reverse().filter((m) => {
    const matchSearch = !search || m.descricao.toLowerCase().includes(search.toLowerCase()) ||
      m.referencia.toLowerCase().includes(search.toLowerCase()) ||
      m.categoria.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filtroTipo === "todos" || m.tipo === filtroTipo;
    const matchCat = !filtroCategoria || m.categoria === filtroCategoria;
    return matchSearch && matchTipo && matchCat;
  });

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-primary">Conta Corrente</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="ml-auto bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition">
          {showForm ? "Fechar" : "+ Novo Movimento"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Total Entradas</div>
          <div className="text-2xl font-bold text-green-700">{formatCurrency(totalEntradas, moeda)}</div>
          <div className="text-xs text-green-600 mt-1">{data.movimentosCC.filter((m) => m.tipo === "entrada").length} movimentos</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Total Saídas</div>
          <div className="text-2xl font-bold text-red-700">{formatCurrency(totalSaidas, moeda)}</div>
          <div className="text-xs text-red-600 mt-1">{data.movimentosCC.filter((m) => m.tipo === "saida").length} movimentos</div>
        </div>
        <div className={`border rounded-xl p-5 ${saldo >= 0 ? "bg-primary/5 border-primary/20" : "bg-red-50 border-red-200"}`}>
          <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${saldo >= 0 ? "text-primary" : "text-red-700"}`}>Saldo</div>
          <div className={`text-2xl font-bold ${saldo >= 0 ? "text-primary" : "text-red-700"}`}>{formatCurrency(saldo, moeda)}</div>
          <div className="text-xs text-muted-foreground mt-1">{data.movimentosCC.length} movimentos no total</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">Registar Movimento</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tipo *</label>
              <div className="flex rounded-lg overflow-hidden border border-border">
                <button type="button" onClick={() => setForm({ ...form, tipo: "entrada", categoria: "" })}
                  className={`flex-1 py-2 text-sm font-semibold transition-colors ${form.tipo === "entrada" ? "bg-green-600 text-white" : "bg-white text-muted-foreground hover:bg-accent"}`}>
                  Entrada
                </button>
                <button type="button" onClick={() => setForm({ ...form, tipo: "saida", categoria: "" })}
                  className={`flex-1 py-2 text-sm font-semibold transition-colors ${form.tipo === "saida" ? "bg-red-600 text-white" : "bg-white text-muted-foreground hover:bg-accent"}`}>
                  Saída
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Data</label>
              <input value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="DD/MM/AAAA" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Valor ({moeda}) *</label>
              <input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="0.00" min={0} step="0.01" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Descrição *</label>
              <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Descrição do movimento" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Seleccionar...</option>
                {(form.tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Referência</label>
              <input value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ex: FAT-001, Cheque #..." />
            </div>
            <div className="sm:col-span-3 flex gap-3 pt-1">
              <button type="submit"
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition">
                Registar Movimento
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-slate-200 text-slate-700 hover:bg-slate-300 px-6 py-2.5 rounded-lg text-sm font-semibold transition">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-border rounded-xl p-4">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex rounded-lg overflow-hidden border border-border text-xs">
            {(["todos", "entrada", "saida"] as const).map((t) => (
              <button key={t} onClick={() => setFiltroTipo(t)}
                className={`px-3 py-1.5 font-semibold transition-colors ${filtroTipo === t
                  ? t === "entrada" ? "bg-green-600 text-white"
                    : t === "saida" ? "bg-red-600 text-white"
                    : "bg-primary text-white"
                  : "bg-white text-muted-foreground hover:bg-accent"}`}>
                {t === "todos" ? "Todos" : t === "entrada" ? "Entradas" : "Saídas"}
              </button>
            ))}
          </div>
          {allCategorias.length > 0 && (
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
              className="border border-border rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none">
              <option value="">Todas as categorias</option>
              {allCategorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar..."
            className="ml-auto border border-border rounded-lg px-3 py-1.5 text-xs w-44 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="text-sm font-bold">Movimentos ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-xs">Data</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs">Descrição</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs">Categoria</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs">Referência</th>
                <th className="text-center px-4 py-2.5 font-semibold text-xs">Tipo</th>
                <th className="text-right px-4 py-2.5 font-semibold text-xs">Valor</th>
                <th className="px-4 py-2.5 text-xs"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">Nenhum movimento encontrado.</td></tr>
              )}
              {filtered.map((m) => (
                <tr key={m.id} className="border-t border-border hover:bg-accent/20 transition-colors">
                  <td className="px-4 py-2.5 text-xs">{m.data}</td>
                  <td className="px-4 py-2.5 text-xs font-medium">{m.descricao}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{m.categoria}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{m.referencia || "—"}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${m.tipo === "entrada" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {m.tipo === "entrada" ? "Entrada" : "Saída"}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 text-xs text-right font-bold ${m.tipo === "entrada" ? "text-green-700" : "text-red-700"}`}>
                    {m.tipo === "entrada" ? "+" : "-"}{formatCurrency(m.valor, moeda)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => { if (window.confirm("Eliminar este movimento?")) removeMovimento(m.id); }}
                      className="text-destructive text-xs hover:underline font-medium">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 bg-secondary/50 border-t border-border flex justify-end gap-6 text-xs font-semibold">
            <span className="text-green-700">
              Entradas: {formatCurrency(filtered.filter((m) => m.tipo === "entrada").reduce((s, m) => s + m.valor, 0), moeda)}
            </span>
            <span className="text-red-700">
              Saídas: {formatCurrency(filtered.filter((m) => m.tipo === "saida").reduce((s, m) => s + m.valor, 0), moeda)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
