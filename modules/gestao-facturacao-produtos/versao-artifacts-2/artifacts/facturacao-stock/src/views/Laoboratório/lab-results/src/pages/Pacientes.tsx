import { useState, useMemo } from "react";
import { useApp } from "../store/AppContext";
import { Paciente } from "../store/storage";

const GRUPOS_SANGUINEOS = ["A", "B", "AB", "O"];
const FATORES_RH = ["Positivo (+)", "Negativo (−)"];
const ESTADOS_CIVIS = [
  "Solteiro(a)",
  "Casado(a)",
  "União de Facto",
  "Divorciado(a)",
  "Viúvo(a)",
];

const emptyForm: Omit<Paciente, "id"> = {
  nome: "",
  nasc: "",
  sexo: "",
  idade: "",
  bi: "",
  nif: "",
  nacionalidade: "Angolana",
  estadoCivil: "",
  profissao: "",
  telefone: "",
  telefone2: "",
  email: "",
  endereco: "",
  grupoSanguineo: "",
  fatorRh: "",
  alergias: "",
  patologiasCronicas: "",
  medicacaoHabitual: "",
  contactoEmergenciaNome: "",
  contactoEmergenciaTel: "",
  empresa: "",
  processo: "",
  medico: "",
  nAmostra: "",
  recolha: "",
};

type ViewMode = "lista" | "form" | "perfil";

function getInitials(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getSexoColor(sexo: string) {
  if (sexo === "M")
    return { bg: "bg-blue-100", text: "text-blue-700", label: "Masculino" };
  if (sexo === "F")
    return { bg: "bg-pink-100", text: "text-pink-700", label: "Feminino" };
  return { bg: "bg-slate-100", text: "text-slate-600", label: "Indeterminado" };
}

function calcIdade(nasc: string): string {
  if (!nasc) return "";
  const parts = nasc.split("/");
  if (parts.length !== 3) return "";
  const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  if (isNaN(d.getTime())) return "";
  const anos = new Date().getFullYear() - d.getFullYear();
  return `${anos} anos`;
}

export default function Pacientes() {
  const { data, addPaciente, updatePaciente, removePaciente } = useApp();
  const [view, setView] = useState<ViewMode>("lista");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [perfilId, setPerfilId] = useState<number | null>(null);
  const [section, setSection] = useState<
    "identificacao" | "clinico" | "laboratorial"
  >("identificacao");
  const [search, setSearch] = useState("");
  const [filtroSexo, setFiltroSexo] = useState("");
  const [viewStyle, setViewStyle] = useState<"cards" | "tabela">("cards");

  function f(field: keyof typeof emptyForm, val: string) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  function handleNovo() {
    setForm(emptyForm);
    setEditId(null);
    setSection("identificacao");
    setView("form");
  }

  function handleEdit(p: Paciente) {
    const { id, ...rest } = p;
    setForm({ ...emptyForm, ...rest });
    setEditId(id);
    setSection("identificacao");
    setView("form");
  }

  function handlePerfil(p: Paciente) {
    setPerfilId(p.id);
    setView("perfil");
  }

  function handleSubmit() {
    if (!form.nome.trim()) {
      alert("O nome do paciente é obrigatório.");
      return;
    }
    if (editId !== null) {
      updatePaciente(editId, form);
    } else {
      addPaciente(form);
    }
    setView("lista");
    setEditId(null);
    setForm(emptyForm);
  }

  function handleRemove(id: number, nome: string) {
    if (
      window.confirm(
        `Remover o paciente "${nome}"? Esta acção não pode ser desfeita.`,
      )
    ) {
      removePaciente(id);
      if (view === "perfil") setView("lista");
    }
  }

  const filtered = useMemo(() => {
    return data.pacientes.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        p.nome.toLowerCase().includes(q) ||
        (p.processo || "").toLowerCase().includes(q) ||
        (p.bi || "").toLowerCase().includes(q) ||
        (p.telefone || "").includes(q) ||
        String(p.id).includes(q);
      const matchSexo = !filtroSexo || p.sexo === filtroSexo;
      return matchSearch && matchSexo;
    });
  }, [data.pacientes, search, filtroSexo]);

  const inp =
    "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background";
  const sel = inp + " cursor-pointer";

  const perfilPaciente =
    perfilId !== null ? data.pacientes.find((p) => p.id === perfilId) : null;

  // ── VISTA: PERFIL DO PACIENTE ──────────────────────────────────────────
  if (view === "perfil" && perfilPaciente) {
    const p = perfilPaciente;
    const sexoInfo = getSexoColor(p.sexo);
    const idadeCalc = calcIdade(p.nasc) || p.idade;
    const grupoCompleto = p.grupoSanguineo
      ? `${p.grupoSanguineo}${p.fatorRh?.includes("+") ? "+" : p.fatorRh?.includes("−") ? "−" : ""}`
      : null;
    const resultados =
      data.resultados?.filter((r) => r.pacienteId === p.id) || [];

    return (
      <div className="p-4 space-y-4 max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("lista")}
            className="text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 px-3 py-1.5 rounded-lg font-medium transition"
          >
            ← Voltar
          </button>
          <h2 className="text-lg font-bold text-primary">Perfil do Paciente</h2>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleEdit(p)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition"
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => handleRemove(p.id, p.nome)}
              className="border border-destructive text-destructive px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition"
            >
              🗑 Remover
            </button>
          </div>
        </div>

        {/* Card de identidade */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-emerald-600 p-6">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg flex-shrink-0`}
                style={{ background: "rgba(255,255,255,0.25)" }}
              >
                {getInitials(p.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-black text-white truncate">
                  {p.nome}
                </h3>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {p.sexo && (
                    <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                      {p.sexo === "M"
                        ? "♂ Masculino"
                        : p.sexo === "F"
                          ? "♀ Feminino"
                          : "Indeterminado"}
                    </span>
                  )}
                  {idadeCalc && (
                    <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                      🎂 {idadeCalc}
                    </span>
                  )}
                  {grupoCompleto && (
                    <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-black">
                      🩸 {grupoCompleto}
                    </span>
                  )}
                  {p.alergias && p.alergias !== "NKDA" && (
                    <span className="bg-amber-400 text-amber-900 text-xs px-2.5 py-1 rounded-full font-semibold">
                      ⚠️ Alergias
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-white/60 text-xs">ID do Paciente</div>
                <div className="text-white text-3xl font-black">#{p.id}</div>
                {p.processo && (
                  <div className="text-white/80 text-xs mt-1">
                    Proc: {p.processo}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-border divide-x divide-border">
            {[
              { label: "Resultados", value: resultados.length, icon: "🔬" },
              { label: "Telefone", value: p.telefone || "—", icon: "📞" },
              { label: "Nascimento", value: p.nasc || "—", icon: "📅" },
              { label: "Médico", value: p.medico || "—", icon: "👨‍⚕️" },
            ].map((s, i) => (
              <div key={i} className="p-4 text-center">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-sm font-bold text-foreground truncate">
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid de detalhes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Identificação */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
              <span className="text-sm">🪪</span>
              <span className="text-sm font-bold text-foreground">
                Identificação
              </span>
            </div>
            <div className="p-4 space-y-2.5">
              {[
                ["BI / Passaporte", p.bi],
                ["NIF", p.nif],
                ["Nacionalidade", p.nacionalidade],
                ["Estado Civil", p.estadoCivil],
                ["Profissão", p.profissao],
                ["Morada", p.endereco],
              ].map(([label, val]) =>
                val ? (
                  <div key={label} className="flex gap-3">
                    <span className="text-xs text-muted-foreground w-32 flex-shrink-0 pt-0.5">
                      {label}
                    </span>
                    <span className="text-xs font-semibold text-foreground flex-1">
                      {val}
                    </span>
                  </div>
                ) : null,
              )}
            </div>
          </div>

          {/* Contactos */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
              <span className="text-sm">📱</span>
              <span className="text-sm font-bold text-foreground">
                Contactos
              </span>
            </div>
            <div className="p-4 space-y-2.5">
              {[
                ["Telemóvel", p.telefone],
                ["Telefone 2", p.telefone2],
                ["Email", p.email],
                ["Emergência", p.contactoEmergenciaNome],
                ["Tel. Emergência", p.contactoEmergenciaTel],
              ].map(([label, val]) =>
                val ? (
                  <div key={label} className="flex gap-3">
                    <span className="text-xs text-muted-foreground w-32 flex-shrink-0 pt-0.5">
                      {label}
                    </span>
                    <span className="text-xs font-semibold text-foreground flex-1">
                      {val}
                    </span>
                  </div>
                ) : null,
              )}
            </div>
          </div>

          {/* Clínico */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
              <span className="text-sm">🏥</span>
              <span className="text-sm font-bold text-foreground">
                Dados Clínicos
              </span>
            </div>
            <div className="p-4 space-y-3">
              {grupoCompleto && (
                <div className="flex items-center gap-3">
                  <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full font-black text-base">
                    🩸 {grupoCompleto}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Grupo Sanguíneo
                  </span>
                </div>
              )}
              {p.alergias && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Alergias
                  </div>
                  <div
                    className={`text-xs font-semibold px-3 py-2 rounded-lg ${p.alergias === "NKDA" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800 border border-amber-200"}`}
                  >
                    {p.alergias !== "NKDA" && "⚠️ "}
                    {p.alergias}
                  </div>
                </div>
              )}
              {p.patologiasCronicas && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Patologias Crónicas
                  </div>
                  <div className="text-xs font-semibold bg-blue-50 text-blue-800 px-3 py-2 rounded-lg">
                    {p.patologiasCronicas}
                  </div>
                </div>
              )}
              {p.medicacaoHabitual && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Medicação Habitual
                  </div>
                  <div className="text-xs bg-secondary/50 px-3 py-2 rounded-lg text-foreground">
                    {p.medicacaoHabitual}
                  </div>
                </div>
              )}
              {!grupoCompleto &&
                !p.alergias &&
                !p.patologiasCronicas &&
                !p.medicacaoHabitual && (
                  <p className="text-xs text-muted-foreground italic">
                    Sem dados clínicos registados.
                  </p>
                )}
            </div>
          </div>

          {/* Laboratorial */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
              <span className="text-sm">🔬</span>
              <span className="text-sm font-bold text-foreground">
                Dados Laboratoriais
              </span>
            </div>
            <div className="p-4 space-y-2.5">
              {[
                ["Empresa/Entidade", p.empresa],
                ["N.º Processo", p.processo],
                ["Médico Requisitante", p.medico],
                ["N.º Amostra", p.nAmostra],
                ["Local de Recolha", p.recolha],
              ].map(([label, val]) =>
                val ? (
                  <div key={label} className="flex gap-3">
                    <span className="text-xs text-muted-foreground w-36 flex-shrink-0 pt-0.5">
                      {label}
                    </span>
                    <span className="text-xs font-semibold text-foreground flex-1">
                      {val}
                    </span>
                  </div>
                ) : null,
              )}
              {resultados.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-2">
                    Últimos Resultados
                  </div>
                  {resultados
                    .slice(-3)
                    .reverse()
                    .map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs py-1"
                      >
                        <span className="font-semibold">
                          {(r as any).exameNome || "Exame"}
                        </span>
                        <span className="text-muted-foreground">{r.data}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── VISTA: FORMULÁRIO ─────────────────────────────────────────────────
  if (view === "form") {
    const sections = [
      { id: "identificacao" as const, label: "Identificação", icon: "🪪" },
      { id: "clinico" as const, label: "Dados Clínicos", icon: "🏥" },
      { id: "laboratorial" as const, label: "Laboratorial", icon: "🔬" },
    ];

    return (
      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setView("lista");
              setForm(emptyForm);
              setEditId(null);
            }}
            className="text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 px-3 py-1.5 rounded-lg font-medium transition"
          >
            ← Voltar
          </button>
          <h2 className="text-lg font-bold text-primary">
            {editId !== null ? "Editar Paciente" : "Novo Paciente"}
          </h2>
          {editId !== null && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">
              ID #{editId}
            </span>
          )}
        </div>

        <div className="bg-white border border-border rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {sections.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  section === s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/30 text-muted-foreground hover:bg-secondary"
                }`}
              >
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* ── Identificação ─────────────────────────────────────── */}
            {section === "identificacao" && (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wide mb-3 pb-2 border-b border-border flex items-center gap-2">
                    <span>👤</span> Dados Pessoais
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1 lg:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Nome Completo *
                      </label>
                      <input
                        value={form.nome}
                        onChange={(e) => f("nome", e.target.value)}
                        className={inp}
                        placeholder="Nome completo do paciente"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        value={(() => {
                          if (!form.nasc) return "";
                          const p = form.nasc.split("/");
                          if (p.length !== 3) return "";
                          return `${p[2]}-${p[1]}-${p[0]}`;
                        })()}
                        onChange={(e) => {
                          const iso = e.target.value;
                          if (!iso) {
                            setForm((prev) => ({ ...prev, nasc: "", idade: "" }));
                            return;
                          }
                          const [y, m, d] = iso.split("-");
                          const display = `${d}/${m}/${y}`;
                          const idadeCalc = calcIdade(display);
                          setForm((prev) => ({ ...prev, nasc: display, idade: idadeCalc }));
                        }}
                        className={inp}
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Sexo
                      </label>
                      <select
                        value={form.sexo}
                        onChange={(e) => f("sexo", e.target.value)}
                        className={sel}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="M">♂ Masculino</option>
                        <option value="F">♀ Feminino</option>
                        <option value="I">Indeterminado</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Idade (calculada automaticamente)
                      </label>
                      <input
                        value={form.idade}
                        readOnly
                        className={inp + " bg-secondary/40 cursor-default"}
                        placeholder="Preenchida automaticamente"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Estado Civil
                      </label>
                      <select
                        value={form.estadoCivil}
                        onChange={(e) => f("estadoCivil", e.target.value)}
                        className={sel}
                      >
                        <option value="">Seleccionar...</option>
                        {ESTADOS_CIVIS.map((ec) => (
                          <option key={ec} value={ec}>
                            {ec}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wide mb-3 pb-2 border-b border-border flex items-center gap-2">
                    <span>🪪</span> Documentos
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Bilhete de Identidade (BI)
                      </label>
                      <input
                        value={form.bi}
                        onChange={(e) => f("bi", e.target.value)}
                        className={inp}
                        placeholder="N.º de BI"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        NIF
                      </label>
                      <input
                        value={form.nif}
                        onChange={(e) => f("nif", e.target.value)}
                        className={inp}
                        placeholder="NIF (faturação)"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Nacionalidade
                      </label>
                      <input
                        value={form.nacionalidade}
                        onChange={(e) => f("nacionalidade", e.target.value)}
                        className={inp}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Profissão
                      </label>
                      <input
                        value={form.profissao}
                        onChange={(e) => f("profissao", e.target.value)}
                        className={inp}
                        placeholder="Ex: Professor"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wide mb-3 pb-2 border-b border-border flex items-center gap-2">
                    <span>📱</span> Contactos
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Telemóvel Principal
                      </label>
                      <input
                        value={form.telefone}
                        onChange={(e) => f("telefone", e.target.value)}
                        className={inp}
                        placeholder="9XX XXX XXX"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Telefone Alternativo
                      </label>
                      <input
                        value={form.telefone2}
                        onChange={(e) => f("telefone2", e.target.value)}
                        className={inp}
                        placeholder="9XX XXX XXX"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Email
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => f("email", e.target.value)}
                        className={inp}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="space-y-1 lg:col-span-3">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Morada Completa
                      </label>
                      <input
                        value={form.endereco}
                        onChange={(e) => f("endereco", e.target.value)}
                        className={inp}
                        placeholder="Rua, bairro, município, província"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Contacto de Emergência
                      </label>
                      <input
                        value={form.contactoEmergenciaNome}
                        onChange={(e) =>
                          f("contactoEmergenciaNome", e.target.value)
                        }
                        className={inp}
                        placeholder="Nome do responsável"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Tel. Emergência
                      </label>
                      <input
                        value={form.contactoEmergenciaTel}
                        onChange={(e) =>
                          f("contactoEmergenciaTel", e.target.value)
                        }
                        className={inp}
                        placeholder="9XX XXX XXX"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Clínico ─────────────────────────────────────────── */}
            {section === "clinico" && (
              <div className="space-y-5">
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800">
                  <strong>ℹ️ MINSA/OMS:</strong> Campos obrigatórios pela ficha
                  clínica do MINSA e boas práticas laboratoriais da OMS.
                </div>

                <div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wide mb-3 pb-2 border-b border-border">
                    🩸 Grupo Sanguíneo
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Grupo ABO
                      </label>
                      <select
                        value={form.grupoSanguineo}
                        onChange={(e) => f("grupoSanguineo", e.target.value)}
                        className={sel}
                      >
                        <option value="">Desconhecido</option>
                        {GRUPOS_SANGUINEOS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Fator Rh
                      </label>
                      <select
                        value={form.fatorRh}
                        onChange={(e) => f("fatorRh", e.target.value)}
                        className={sel}
                      >
                        <option value="">Desconhecido</option>
                        {FATORES_RH.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    {form.grupoSanguineo && (
                      <div className="col-span-2 flex items-center">
                        <span className="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-black text-lg">
                          🩸 {form.grupoSanguineo}
                          {form.fatorRh?.includes("+")
                            ? "+"
                            : form.fatorRh?.includes("−")
                              ? "−"
                              : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wide mb-3 pb-2 border-b border-border">
                    📋 Antecedentes Clínicos
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Alergias Conhecidas
                      </label>
                      <textarea
                        value={form.alergias}
                        onChange={(e) => f("alergias", e.target.value)}
                        className={inp + " resize-none"}
                        rows={3}
                        placeholder="Ex: Penicilina, látex..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Escreva "NKDA" se sem alergias conhecidas.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Patologias Crónicas
                      </label>
                      <textarea
                        value={form.patologiasCronicas}
                        onChange={(e) =>
                          f("patologiasCronicas", e.target.value)
                        }
                        className={inp + " resize-none"}
                        rows={3}
                        placeholder="Ex: HTA, DM2, Asma..."
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Medicação Habitual
                      </label>
                      <textarea
                        value={form.medicacaoHabitual}
                        onChange={(e) => f("medicacaoHabitual", e.target.value)}
                        className={inp + " resize-none"}
                        rows={2}
                        placeholder="Ex: Metformina 850mg 2x/dia..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Laboratorial ──────────────────────────────────── */}
            {section === "laboratorial" && (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wide mb-3 pb-2 border-b border-border">
                    🏢 Entidade Requisitante
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1 lg:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Empresa / Hospital / Clínica
                      </label>
                      <input
                        value={form.empresa}
                        onChange={(e) => f("empresa", e.target.value)}
                        className={inp}
                        placeholder="Ex: Hospital Josina Machel"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Médico Requisitante
                      </label>
                      <input
                        value={form.medico}
                        onChange={(e) => f("medico", e.target.value)}
                        className={inp}
                        placeholder="Nome do médico"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wide mb-3 pb-2 border-b border-border">
                    🧪 Identificação da Amostra
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        N.º Processo
                      </label>
                      <input
                        value={form.processo}
                        onChange={(e) => f("processo", e.target.value)}
                        className={inp}
                        placeholder="Ex: 2026/0001"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        N.º Amostra / Espécime
                      </label>
                      <input
                        value={form.nAmostra}
                        onChange={(e) => f("nAmostra", e.target.value)}
                        className={inp}
                        placeholder="Ex: A-0042"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Local de Recolha
                      </label>
                      <input
                        value={form.recolha}
                        onChange={(e) => f("recolha", e.target.value)}
                        className={inp}
                        placeholder="Ex: Lab. Central"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navegação */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              {section !== "identificacao" && (
                <button
                  type="button"
                  onClick={() =>
                    setSection(
                      section === "laboratorial" ? "clinico" : "identificacao",
                    )
                  }
                  className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 px-5 py-2 rounded-lg text-sm font-semibold transition"
                >
                  ← Anterior
                </button>
              )}
              <div className="flex gap-1 mx-auto">
                {sections.map((s, i) => (
                  <div
                    key={s.id}
                    className={`w-2 h-2 rounded-full transition-all ${section === s.id ? "bg-primary w-6" : "bg-border"}`}
                  />
                ))}
              </div>
              {section !== "laboratorial" ? (
                <button
                  type="button"
                  onClick={() =>
                    setSection(
                      section === "identificacao" ? "clinico" : "laboratorial",
                    )
                  }
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition ml-auto"
                >
                  Próximo →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition ml-auto"
                >
                  {editId !== null
                    ? "💾 Guardar Alterações"
                    : "✅ Registar Paciente"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── VISTA: LISTA ───────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-primary">Pacientes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data.pacientes.length} registado
            {data.pacientes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleNovo}
          className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Novo Paciente
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-border rounded-xl p-3 flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Nome, processo, BI ou telefone..."
          className="border border-border rounded-lg px-3 py-2 text-xs w-60 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <div className="flex gap-1">
          {[
            { val: "", label: "Todos" },
            { val: "M", label: "♂ Masc." },
            { val: "F", label: "♀ Fem." },
          ].map((o) => (
            <button
              key={o.val}
              onClick={() => setFiltroSexo(o.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filtroSexo === o.val ? "bg-primary text-primary-foreground" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => setViewStyle("cards")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${viewStyle === "cards" ? "bg-primary text-primary-foreground" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}
          >
            ⊞ Cartões
          </button>
          <button
            onClick={() => setViewStyle("tabela")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${viewStyle === "tabela" ? "bg-primary text-primary-foreground" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}
          >
            ☰ Tabela
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-border rounded-xl py-20 text-center">
          <div className="text-5xl mb-4">👥</div>
          <div className="text-sm font-semibold text-muted-foreground">
            {data.pacientes.length === 0
              ? "Nenhum paciente registado."
              : "Nenhum resultado para a pesquisa."}
          </div>
          {data.pacientes.length === 0 && (
            <button
              onClick={handleNovo}
              className="mt-4 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition"
            >
              Registar primeiro paciente
            </button>
          )}
        </div>
      )}

      {/* ── Vista Cartões ─────────────────────────────────────── */}
      {viewStyle === "cards" && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const sexoInfo = getSexoColor(p.sexo);
            const grupoCompleto = p.grupoSanguineo
              ? `${p.grupoSanguineo}${p.fatorRh?.includes("+") ? "+" : p.fatorRh?.includes("−") ? "−" : ""}`
              : null;
            const idadeStr =
              calcIdade(p.nasc) || (p.idade ? `${p.idade} anos` : "");
            return (
              <div
                key={p.id}
                className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                onClick={() => handlePerfil(p)}
              >
                {/* Topo colorido */}
                <div className="bg-gradient-to-r from-primary/10 to-emerald-50 px-4 pt-4 pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                      {getInitials(p.nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-foreground truncate">
                        {p.nome}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {p.sexo && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sexoInfo.bg} ${sexoInfo.text}`}
                          >
                            {p.sexo === "M"
                              ? "♂"
                              : p.sexo === "F"
                                ? "♀"
                                : "?"}{" "}
                            {p.sexo === "M"
                              ? "Masc."
                              : p.sexo === "F"
                                ? "Fem."
                                : ""}
                          </span>
                        )}
                        {idadeStr && (
                          <span className="text-xs text-muted-foreground">
                            {idadeStr}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-muted-foreground">ID</div>
                      <div className="text-lg font-black text-primary">
                        #{p.id}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="px-4 py-3 space-y-1.5">
                  {p.telefone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>📞</span>
                      <span className="font-semibold text-foreground">
                        {p.telefone}
                      </span>
                    </div>
                  )}
                  {p.processo && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>📋</span>
                      <span>
                        Proc:{" "}
                        <strong className="text-foreground">
                          {p.processo}
                        </strong>
                      </span>
                    </div>
                  )}
                  {p.medico && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>👨‍⚕️</span>
                      <span className="truncate">{p.medico}</span>
                    </div>
                  )}
                </div>

                {/* Tags e acções */}
                <div className="px-4 pb-3 flex items-center justify-between gap-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {grupoCompleto && (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-black">
                        🩸 {grupoCompleto}
                      </span>
                    )}
                    {p.alergias && p.alergias !== "NKDA" && (
                      <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                        ⚠️ Alergias
                      </span>
                    )}
                  </div>
                  <div
                    className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-semibold hover:bg-primary/20 transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleRemove(p.id, p.nome)}
                      className="text-xs bg-red-50 text-destructive px-2.5 py-1 rounded-lg font-semibold hover:bg-red-100 transition"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Vista Tabela ──────────────────────────────────────── */}
      {viewStyle === "tabela" && filtered.length > 0 && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Nome
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">
                    Nasc.
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground">
                    Sexo
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">
                    BI
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">
                    Telefone
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground">
                    Grupo
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">
                    Processo
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground">
                    Acções
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const sexoInfo = getSexoColor(p.sexo);
                  const grupoCompleto = p.grupoSanguineo
                    ? `${p.grupoSanguineo}${p.fatorRh?.includes("+") ? "+" : p.fatorRh?.includes("−") ? "−" : ""}`
                    : null;
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-border hover:bg-accent/20 transition-colors cursor-pointer"
                      onClick={() => handlePerfil(p)}
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-primary">
                          #{p.id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-black flex-shrink-0">
                            {getInitials(p.nome)}
                          </div>
                          <div>
                            <div className="text-xs font-bold">{p.nome}</div>
                            {p.alergias && p.alergias !== "NKDA" && (
                              <span className="text-xs text-amber-600">
                                ⚠️ Alergias
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {p.nasc || "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {p.sexo && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sexoInfo.bg} ${sexoInfo.text}`}
                          >
                            {p.sexo === "M" ? "♂" : "♀"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground hidden md:table-cell">
                        {p.bi || "—"}
                      </td>
                      <td className="px-3 py-3 text-xs">{p.telefone || "—"}</td>
                      <td className="px-3 py-3 text-center">
                        {grupoCompleto ? (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-black text-xs">
                            🩸 {grupoCompleto}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {p.processo || "—"}
                      </td>
                      <td
                        className="px-3 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-2 text-xs">
                          <button
                            onClick={() => handleEdit(p)}
                            className="text-primary font-semibold hover:underline"
                          >
                            Editar
                          </button>
                          <span className="text-border">|</span>
                          <button
                            onClick={() => handleRemove(p.id, p.nome)}
                            className="text-destructive font-semibold hover:underline"
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
