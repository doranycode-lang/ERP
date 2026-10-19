import { useState, useMemo } from "react";
import { useListReagentes, useCreateReagente, useUpdateReagente, useDeleteReagente } from "@workspace/api-client-react";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { EXAMES_BUILTIN } from "@/data/exames";

type Reagente = {
  id: number;
  nome: string;
  exameCodigo: string | null;
  exameNome: string | null;
  fornecedor: string | null;
  unidade: string | null;
  stockAtual: number | null;
  stockMinimo: number | null;
  precoUnitario: number;
  lote: string | null;
  dataValidade: string | null;
  observacoes: string | null;
  ativo: boolean | null;
  createdAt: string;
  updatedAt: string;
};

type ReagenteForm = {
  nome: string;
  exameCodigo: string;
  exameNome: string;
  fornecedor: string;
  unidade: string;
  stockAtual: string;
  stockMinimo: string;
  precoUnitario: string;
  lote: string;
  dataValidade: string;
  observacoes: string;
  ativo: boolean;
};

const EMPTY_FORM: ReagenteForm = {
  nome: "",
  exameCodigo: "",
  exameNome: "",
  fornecedor: "",
  unidade: "",
  stockAtual: "",
  stockMinimo: "",
  precoUnitario: "",
  lote: "",
  dataValidade: "",
  observacoes: "",
  ativo: true,
};


function formatDate(str: string | null | undefined) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString("pt-AO");
}

function stockBadge(atual: number | null, minimo: number | null) {
  if (atual === null) return null;
  const min = minimo ?? 0;
  if (atual === 0) return <span style={chip("crimson")}>Esgotado</span>;
  if (atual <= min) return <span style={chip("#c97400")}>Stock baixo</span>;
  return <span style={chip("#1d7e4a")}>OK</span>;
}

function chip(color: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    background: color + "22",
    color,
    whiteSpace: "nowrap",
  };
}

const EXAMES_LOOKUP = EXAMES_BUILTIN.filter(e => e.codigo).map(e => ({
  codigo: e.codigo!,
  nome: e.nome,
  categoria: e.categoria,
}));

export default function LabReagentes() {
  const { toast } = useToast();
  const formatKz = useFormatCurrency();
  const { data: reagentes = [], refetch } = useListReagentes();
  const createMut = useCreateReagente();
  const updateMut = useUpdateReagente();
  const deleteMut = useDeleteReagente();

  const [search, setSearch] = useState("");
  const [filterAtivo, setFilterAtivo] = useState<"todos" | "ativo" | "inativo">("todos");
  const [filterStock, setFilterStock] = useState<"todos" | "baixo" | "esgotado">("todos");
  const [modal, setModal] = useState<"none" | "create" | "edit" | "delete">("none");
  const [selected, setSelected] = useState<Reagente | null>(null);
  const [form, setForm] = useState<ReagenteForm>(EMPTY_FORM);
  const [exameQuery, setExameQuery] = useState("");
  const [showExameSug, setShowExameSug] = useState(false);

  const exameSuggestions = useMemo(() => {
    if (!exameQuery || exameQuery.length < 2) return [];
    const q = exameQuery.toLowerCase();
    return EXAMES_LOOKUP.filter(
      e => e.nome.toLowerCase().includes(q) || e.codigo.includes(q) || e.categoria.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [exameQuery]);

  const filtered = useMemo(() => {
    let list = (reagentes as Reagente[]);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.nome.toLowerCase().includes(q) ||
        (r.fornecedor ?? "").toLowerCase().includes(q) ||
        (r.exameNome ?? "").toLowerCase().includes(q) ||
        (r.exameCodigo ?? "").toLowerCase().includes(q) ||
        (r.lote ?? "").toLowerCase().includes(q)
      );
    }
    if (filterAtivo !== "todos") {
      list = list.filter(r => (r.ativo ?? true) === (filterAtivo === "ativo"));
    }
    if (filterStock === "esgotado") {
      list = list.filter(r => r.stockAtual === 0);
    } else if (filterStock === "baixo") {
      list = list.filter(r => r.stockAtual !== null && r.stockAtual > 0 && r.stockAtual <= (r.stockMinimo ?? 0));
    }
    return list;
  }, [reagentes, search, filterAtivo, filterStock]);

  const stockCritical = (reagentes as Reagente[]).filter(r => r.stockAtual !== null && r.stockAtual <= (r.stockMinimo ?? 0)).length;
  const stockEsgotado = (reagentes as Reagente[]).filter(r => r.stockAtual === 0).length;

  function openCreate() {
    setForm(EMPTY_FORM);
    setExameQuery("");
    setModal("create");
  }

  function openEdit(r: Reagente) {
    setSelected(r);
    setForm({
      nome: r.nome,
      exameCodigo: r.exameCodigo ?? "",
      exameNome: r.exameNome ?? "",
      fornecedor: r.fornecedor ?? "",
      unidade: r.unidade ?? "",
      stockAtual: r.stockAtual?.toString() ?? "",
      stockMinimo: r.stockMinimo?.toString() ?? "",
      precoUnitario: r.precoUnitario?.toString() ?? "",
      lote: r.lote ?? "",
      dataValidade: r.dataValidade ? r.dataValidade.slice(0, 10) : "",
      observacoes: r.observacoes ?? "",
      ativo: r.ativo ?? true,
    });
    setExameQuery(r.exameNome ?? "");
    setModal("edit");
  }

  function openDelete(r: Reagente) {
    setSelected(r);
    setModal("delete");
  }

  function closeModal() {
    setModal("none");
    setSelected(null);
    setExameQuery("");
    setShowExameSug(false);
  }

  function handleExameSelect(e: typeof EXAMES_LOOKUP[number]) {
    setForm(f => ({ ...f, exameCodigo: e.codigo, exameNome: e.nome }));
    setExameQuery(e.nome);
    setShowExameSug(false);
  }

  function buildPayload() {
    return {
      nome: form.nome.trim(),
      exameCodigo: form.exameCodigo || null,
      exameNome: form.exameNome || null,
      fornecedor: form.fornecedor || null,
      unidade: form.unidade || null,
      stockAtual: form.stockAtual !== "" ? parseInt(form.stockAtual, 10) : null,
      stockMinimo: form.stockMinimo !== "" ? parseInt(form.stockMinimo, 10) : null,
      precoUnitario: form.precoUnitario !== "" ? parseFloat(form.precoUnitario) : 0,
      lote: form.lote || null,
      dataValidade: form.dataValidade || null,
      observacoes: form.observacoes || null,
      ativo: form.ativo,
    };
  }

  async function handleCreate() {
    if (!form.nome.trim()) { toast({ title: "Campo obrigatório", description: "O nome do reagente é obrigatório.", variant: "destructive" }); return; }
    try {
      await createMut.mutateAsync({ data: buildPayload() as any });
      toast({ title: "Reagente criado com sucesso." });
      refetch();
      closeModal();
    } catch {
      toast({ title: "Erro ao criar reagente", variant: "destructive" });
    }
  }

  async function handleEdit() {
    if (!selected) return;
    if (!form.nome.trim()) { toast({ title: "Campo obrigatório", description: "O nome do reagente é obrigatório.", variant: "destructive" }); return; }
    try {
      await updateMut.mutateAsync({ id: selected.id, data: buildPayload() as any });
      toast({ title: "Reagente actualizado." });
      refetch();
      closeModal();
    } catch {
      toast({ title: "Erro ao actualizar reagente", variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!selected) return;
    try {
      await deleteMut.mutateAsync({ id: selected.id });
      toast({ title: "Reagente eliminado." });
      refetch();
      closeModal();
    } catch {
      toast({ title: "Erro ao eliminar reagente", variant: "destructive" });
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "#111827",
    border: "1px solid #2a3344",
    color: "#e2e8f0",
    borderRadius: 6,
    padding: "7px 10px",
    fontSize: 13,
    width: "100%",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = { fontSize: 12, color: "#94a3b8", marginBottom: 4, display: "block", fontWeight: 500 };

  function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        {children}
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Gestão de Reagentes</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            {(reagentes as Reagente[]).length} reagente{(reagentes as Reagente[]).length !== 1 ? "s" : ""} registado{(reagentes as Reagente[]).length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 7, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Novo Reagente
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total", value: (reagentes as Reagente[]).length, color: "#3b82f6" },
          { label: "Activos", value: (reagentes as Reagente[]).filter(r => r.ativo !== false).length, color: "#1d7e4a" },
          { label: "Stock baixo", value: stockCritical, color: "#c97400" },
          { label: "Esgotados", value: stockEsgotado, color: "crimson" },
        ].map(k => (
          <div key={k.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: k.color, marginTop: 4 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          placeholder="Pesquisar reagente, fornecedor, exame, lote…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 340, flex: "none" }}
        />
        {(["todos", "ativo", "inativo"] as const).map(v => (
          <button
            key={v}
            onClick={() => setFilterAtivo(v)}
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #2a3344", fontSize: 12, fontWeight: 600, cursor: "pointer", background: filterAtivo === v ? "#1e40af" : "#0f172a", color: filterAtivo === v ? "#fff" : "#94a3b8" }}
          >
            {v === "todos" ? "Todos" : v === "ativo" ? "Activos" : "Inactivos"}
          </button>
        ))}
        <div style={{ width: 1, background: "#1e293b", alignSelf: "stretch" }} />
        {(["todos", "baixo", "esgotado"] as const).map(v => (
          <button
            key={v}
            onClick={() => setFilterStock(v)}
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #2a3344", fontSize: 12, fontWeight: 600, cursor: "pointer", background: filterStock === v ? "#7c2d12" : "#0f172a", color: filterStock === v ? "#fff" : "#94a3b8" }}
          >
            {v === "todos" ? "Todo stock" : v === "baixo" ? "Stock baixo" : "Esgotados"}
          </button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#64748b", alignSelf: "center" }}>
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#070d1a", borderBottom: "1px solid #1e293b" }}>
                {["Reagente", "Exame Associado", "Fornecedor", "Lote / Validade", "Stock", "Preço Unit.", "Estado", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 0", textAlign: "center", color: "#475569", fontSize: 14 }}>
                    {(reagentes as Reagente[]).length === 0 ? "Nenhum reagente registado. Clique em «Novo Reagente» para começar." : "Sem resultados para os filtros seleccionados."}
                  </td>
                </tr>
              )}
              {filtered.map((r, i) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: "1px solid #1e293b", background: i % 2 === 0 ? "transparent" : "#0a1120" }}
                >
                  <td style={{ padding: "11px 14px", color: "#e2e8f0", fontWeight: 600 }}>
                    <div>{r.nome}</div>
                    {r.unidade && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{r.unidade}</div>}
                  </td>
                  <td style={{ padding: "11px 14px", color: "#94a3b8" }}>
                    {r.exameCodigo && <span style={{ fontSize: 11, color: "#3b82f6", fontFamily: "monospace", marginRight: 5 }}>{r.exameCodigo}</span>}
                    <span>{r.exameNome ?? "—"}</span>
                  </td>
                  <td style={{ padding: "11px 14px", color: "#94a3b8" }}>{r.fornecedor ?? "—"}</td>
                  <td style={{ padding: "11px 14px", color: "#94a3b8" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 12 }}>{r.lote ?? "—"}</div>
                    <div style={{ fontSize: 11, color: r.dataValidade && new Date(r.dataValidade) < new Date() ? "crimson" : "#64748b", marginTop: 2 }}>
                      {r.dataValidade ? `Val: ${formatDate(r.dataValidade)}` : ""}
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ color: "#e2e8f0", fontWeight: 600 }}>
                      {r.stockAtual ?? "—"}
                      {r.stockMinimo !== null && <span style={{ fontSize: 11, color: "#64748b" }}> / mín {r.stockMinimo}</span>}
                    </div>
                    <div style={{ marginTop: 4 }}>{stockBadge(r.stockAtual, r.stockMinimo)}</div>
                  </td>
                  <td style={{ padding: "11px 14px", color: "#94a3b8", fontFamily: "monospace" }}>{formatKz(r.precoUnitario)}</td>
                  <td style={{ padding: "11px 14px" }}>
                    {(r.ativo ?? true)
                      ? <span style={chip("#1d7e4a")}>Activo</span>
                      : <span style={chip("#64748b")}>Inactivo</span>}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => openEdit(r)}
                        style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid #2a3344", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}
                      >Editar</button>
                      <button
                        onClick={() => openDelete(r)}
                        style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid #3d1515", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 12 }}
                      >Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal overlay */}
      {modal !== "none" && (
        <div
          onClick={closeModal}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, width: "100%", maxWidth: modal === "delete" ? 420 : 640, maxHeight: "90vh", overflow: "auto", padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
          >
            {modal === "delete" && selected && (
              <>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#ef4444", margin: "0 0 12px" }}>Eliminar Reagente</h2>
                <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 20px" }}>
                  Tem a certeza que pretende eliminar <strong style={{ color: "#e2e8f0" }}>{selected.nome}</strong>? Esta acção não pode ser revertida.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={closeModal} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #2a3344", background: "transparent", color: "#94a3b8", cursor: "pointer" }}>Cancelar</button>
                  <button onClick={handleDelete} disabled={deleteMut.isPending} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                    {deleteMut.isPending ? "A eliminar…" : "Eliminar"}
                  </button>
                </div>
              </>
            )}

            {(modal === "create" || modal === "edit") && (
              <>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", margin: "0 0 20px" }}>
                  {modal === "create" ? "Novo Reagente" : "Editar Reagente"}
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {/* Nome */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <FormField label="Nome do Reagente *">
                      <input
                        style={inputStyle}
                        value={form.nome}
                        onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                        placeholder="Ex: Anti-HBs (Beckman Coulter)"
                      />
                    </FormField>
                  </div>

                  {/* Exame Associado */}
                  <div style={{ gridColumn: "1 / -1", position: "relative" }}>
                    <FormField label="Exame Associado">
                      <input
                        style={inputStyle}
                        value={exameQuery}
                        onChange={e => { setExameQuery(e.target.value); setForm(f => ({ ...f, exameCodigo: "", exameNome: e.target.value })); setShowExameSug(true); }}
                        onFocus={() => setShowExameSug(true)}
                        placeholder="Pesquisar exame por nome ou código…"
                        autoComplete="off"
                      />
                      {showExameSug && exameSuggestions.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e293b", border: "1px solid #2a3344", borderRadius: 8, zIndex: 100, maxHeight: 220, overflow: "auto", marginTop: 2 }}>
                          {exameSuggestions.map(e => (
                            <div
                              key={e.codigo}
                              onClick={() => handleExameSelect(e)}
                              style={{ padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid #1a2535", display: "flex", alignItems: "center", gap: 8 }}
                              onMouseEnter={ev => (ev.currentTarget.style.background = "#273046")}
                              onMouseLeave={ev => (ev.currentTarget.style.background = "transparent")}
                            >
                              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#3b82f6", background: "#1e293b", padding: "2px 6px", borderRadius: 4 }}>{e.codigo}</span>
                              <div>
                                <div style={{ fontSize: 13, color: "#e2e8f0" }}>{e.nome}</div>
                                <div style={{ fontSize: 11, color: "#64748b" }}>{e.categoria}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </FormField>
                    {form.exameCodigo && (
                      <div style={{ fontSize: 11, color: "#3b82f6", marginTop: 4 }}>
                        Código: <strong>{form.exameCodigo}</strong>
                      </div>
                    )}
                  </div>

                  {/* Fornecedor */}
                  <FormField label="Fornecedor">
                    <input style={inputStyle} value={form.fornecedor} onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))} placeholder="Nome do fornecedor" />
                  </FormField>

                  {/* Unidade */}
                  <FormField label="Unidade de Medida">
                    <input style={inputStyle} value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} placeholder="Ex: frascos, kits, mL…" />
                  </FormField>

                  {/* Stock Actual */}
                  <FormField label="Stock Actual">
                    <input style={inputStyle} type="number" min="0" value={form.stockAtual} onChange={e => setForm(f => ({ ...f, stockAtual: e.target.value }))} placeholder="0" />
                  </FormField>

                  {/* Stock Mínimo */}
                  <FormField label="Stock Mínimo (alerta)">
                    <input style={inputStyle} type="number" min="0" value={form.stockMinimo} onChange={e => setForm(f => ({ ...f, stockMinimo: e.target.value }))} placeholder="0" />
                  </FormField>

                  {/* Preço Unitário */}
                  <FormField label="Preço Unitário (Kz)">
                    <input style={inputStyle} type="number" min="0" step="0.01" value={form.precoUnitario} onChange={e => setForm(f => ({ ...f, precoUnitario: e.target.value }))} placeholder="0.00" />
                  </FormField>

                  {/* Lote */}
                  <FormField label="Número de Lote">
                    <input style={inputStyle} value={form.lote} onChange={e => setForm(f => ({ ...f, lote: e.target.value }))} placeholder="Lote do fabricante" />
                  </FormField>

                  {/* Data de Validade */}
                  <FormField label="Data de Validade">
                    <input style={{ ...inputStyle, colorScheme: "dark" }} type="date" value={form.dataValidade} onChange={e => setForm(f => ({ ...f, dataValidade: e.target.value }))} />
                  </FormField>

                  {/* Activo */}
                  <FormField label="Estado">
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      {(["Activo", "Inactivo"] as const).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, ativo: s === "Activo" }))}
                          style={{ padding: "6px 16px", borderRadius: 6, border: `1px solid ${form.ativo === (s === "Activo") ? "#1d7e4a" : "#2a3344"}`, background: form.ativo === (s === "Activo") ? "#14532d" : "transparent", color: form.ativo === (s === "Activo") ? "#4ade80" : "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                        >{s}</button>
                      ))}
                    </div>
                  </FormField>

                  {/* Observações */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <FormField label="Observações">
                      <textarea
                        style={{ ...inputStyle, minHeight: 64, resize: "vertical" }}
                        value={form.observacoes}
                        onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                        placeholder="Notas sobre conservação, uso, fornecedor…"
                      />
                    </FormField>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                  <button onClick={closeModal} style={{ padding: "9px 18px", borderRadius: 6, border: "1px solid #2a3344", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
                  <button
                    onClick={modal === "create" ? handleCreate : handleEdit}
                    disabled={createMut.isPending || updateMut.isPending}
                    style={{ padding: "9px 18px", borderRadius: 6, border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                  >
                    {(createMut.isPending || updateMut.isPending) ? "A guardar…" : modal === "create" ? "Criar Reagente" : "Guardar Alterações"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
