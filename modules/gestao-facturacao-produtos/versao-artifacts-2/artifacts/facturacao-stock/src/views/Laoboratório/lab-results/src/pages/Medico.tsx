import { Session } from "../store/auth";
import { api as mainApi } from "../store/api";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";

interface Props {
  session?: Session;
  onNav?: (tab: string) => void;
}

// ==================== MOCK API (localStorage) ====================
const store = {
  get: (k: string) => JSON.parse(localStorage.getItem(k) || "[]"),
  set: (k: string, v: any) => localStorage.setItem(k, JSON.stringify(v)),
};
let idCounter = Date.now();
const nextId = () => ++idCounter;

const mockApi = {
  consultas: {
    list: () => Promise.resolve(store.get("consultas")),
    create: (d: any) => { const all = store.get("consultas"); const item = { ...d, id: nextId(), estado: d.estado || "agendada" }; all.push(item); store.set("consultas", all); return Promise.resolve(item); },
    update: (id: number, d: any) => { const all = store.get("consultas").map((x: any) => x.id === id ? { ...x, ...d } : x); store.set("consultas", all); return Promise.resolve(); },
    delete: (id: number) => { store.set("consultas", store.get("consultas").filter((x: any) => x.id !== id)); return Promise.resolve(); },
  },
  prescricoesMed: {
    list: () => Promise.resolve(store.get("prescricoesMed")),
    create: (d: any) => { const all = store.get("prescricoesMed"); const item = { ...d, id: nextId() }; all.push(item); store.set("prescricoesMed", all); return Promise.resolve(item); },
    update: (id: number, d: any) => { const all = store.get("prescricoesMed").map((x: any) => x.id === id ? { ...x, ...d } : x); store.set("prescricoesMed", all); return Promise.resolve(); },
    delete: (id: number) => { store.set("prescricoesMed", store.get("prescricoesMed").filter((x: any) => x.id !== id)); return Promise.resolve(); },
  },
  actosClinicos: {
    list: () => Promise.resolve(store.get("actosClinicos")),
    create: (d: any) => { const all = store.get("actosClinicos"); const item = { ...d, id: nextId() }; all.push(item); store.set("actosClinicos", all); return Promise.resolve(item); },
    delete: (id: number) => { store.set("actosClinicos", store.get("actosClinicos").filter((x: any) => x.id !== id)); return Promise.resolve(); },
  },
  pacientes: {
    list: () => Promise.resolve(store.get("pacientes")),
    create: (d: any) => { const all = store.get("pacientes"); const item = { ...d, id: nextId() }; all.push(item); store.set("pacientes", all); return Promise.resolve(item); },
  },
  triagem: { list: () => Promise.resolve(store.get("triagem")) },
  imagiologia: {
    list: () => Promise.resolve(store.get("imagiologia")),
    update: (id: number, d: any) => { const all = store.get("imagiologia").map((x: any) => x.id === id ? { ...x, ...d } : x); store.set("imagiologia", all); return Promise.resolve(); },
  },
  solicitacoes: {
    list: () => Promise.resolve(store.get("solicitacoes")),
    update: (id: string, d: any) => { const all = store.get("solicitacoes").map((x: any) => x.id === id ? { ...x, ...d } : x); store.set("solicitacoes", all); return Promise.resolve(); },
  },
};
const api = { ...mockApi, pacientes: mainApi.pacientes };

// ==================== SEED DATA ====================
function seedData() {
  if (store.get("pacientes").length === 0) {
    store.set("pacientes", [
      { id: 1, nome: "Maria Silva", idade: 45, sexo: "F", telefone: "912345678", bi: "12345678", grupoSanguineo: "A+", alergias: "Penicilina", patologiasCronicas: "Hipertensão", medicacaoHabitual: "Losartana 50mg" },
      { id: 2, nome: "João Santos", idade: 62, sexo: "M", telefone: "923456789", bi: "23456789", grupoSanguineo: "O+", alergias: "", patologiasCronicas: "Diabetes Tipo 2", medicacaoHabitual: "Metformina 850mg" },
      { id: 3, nome: "Ana Costa", idade: 28, sexo: "F", telefone: "934567890", bi: "34567890", grupoSanguineo: "B-", alergias: "Látex", patologiasCronicas: "", medicacaoHabitual: "" },
      { id: 4, nome: "Carlos Pereira", idade: 55, sexo: "M", telefone: "945678901", bi: "45678901", grupoSanguineo: "AB+", alergias: "AAS", patologiasCronicas: "Asma, Hipertensão", medicacaoHabitual: "Salbutamol, Enalapril" },
    ]);
  }
}

// ==================== TYPES ====================
type Tab = "dashboard" | "consultas" | "pacientes" | "prescricoes" | "laudos" | "actos" | "relatorios";

const ESTADO_CONSULTA: Record<string, { label: string; badge: string; icon: string }> = {
  agendada: { label: "Agendada", badge: "bg-blue-100 text-blue-700", icon: "⏳" },
  em_curso: { label: "Em curso", badge: "bg-amber-100 text-amber-700", icon: "🔄" },
  concluida: { label: "Concluída", badge: "bg-green-100 text-green-700", icon: "✓" },
  cancelada: { label: "Cancelada", badge: "bg-red-100 text-red-700", icon: "✕" },
  ausente: { label: "Ausente", badge: "bg-gray-100 text-gray-700", icon: "🚫" },
};

const TIPO_CONSULTA: Record<string, { label: string; icon: string; color: string }> = {
  primeira: { label: "1ª Consulta", icon: "🆕", color: "bg-blue-100 text-blue-700" },
  seguimento: { label: "Seguimento", icon: "🔄", color: "bg-green-100 text-green-700" },
  urgencia: { label: "Urgência", icon: "🚨", color: "bg-red-100 text-red-700" },
  retorno: { label: "Retorno", icon: "↩️", color: "bg-amber-100 text-amber-700" },
  intercalar: { label: "Intercalar", icon: "📋", color: "bg-purple-100 text-purple-700" },
};

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "consultas", label: "Consultas", icon: "🩺" },
  { id: "pacientes", label: "Pacientes", icon: "👥" },
  { id: "prescricoes", label: "Prescrições", icon: "📝" },
  { id: "laudos", label: "Validar Laudos", icon: "✍️" },
  { id: "actos", label: "Actos Clínicos", icon: "📄" },
  { id: "relatorios", label: "Relatórios", icon: "📈" },
];

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toTimeString().slice(0, 5);
const num = (v: any) => v ? parseFloat(v) : null;
const numI = (v: any) => v ? parseInt(v) : null;

const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all bg-white";
const lbl = "text-xs font-medium text-gray-600";

const FLUXO = [
  { passo: "1", label: "Solicitação", desc: "Médico pede exame", icon: "📋" },
  { passo: "2", label: "Realização", desc: "Lab / Imagiologia executa", icon: "🔬" },
  { passo: "3", label: "Resultados", desc: "Resultados disponíveis", icon: "📊" },
  { passo: "4", label: "Laudo", desc: "Médico assina laudo", icon: "✍️" },
  { passo: "5", label: "Conduta", desc: "Diagnóstico & terapêutica", icon: "💊" },
];

// ==================== MAIN COMPONENT ====================
export default function Medico({ session, onNav }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => { seedData(); }, []);
  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  const props = { session, setMsg, onNav };

  return (
    <div className="p-5 space-y-5 max-w-[1600px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4 flex-wrap">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-3xl flex-shrink-0 shadow-lg">
          🩺
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-blue-700">Módulo Médico</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Consulta, diagnóstico, prescrição e validação de laudos laboratoriais e imagiológicos
          </p>
          {session && (
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
              👨‍⚕️ {session.funcionarioNome ?? session.username}
            </span>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-gray-200 pb-2 overflow-x-auto">
        {TABS.map(tab => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Message */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}
          >
            <span className="text-lg">{msg.ok ? "✓" : "⚠️"}</span>
            <span className="flex-1">{msg.text}</span>
            <button onClick={() => setMsg(null)} className="text-current opacity-60 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "dashboard" && <DashboardMedico {...props} />}
          {activeTab === "consultas" && <ConsultasModule {...props} />}
          {activeTab === "pacientes" && <PacientesModule {...props} />}
          {activeTab === "prescricoes" && <PrescricoesMedModule {...props} />}
          {activeTab === "laudos" && <LaudosModule {...props} />}
          {activeTab === "actos" && <ActosClinicosModule {...props} />}
          {activeTab === "relatorios" && <RelatoriosMedicoModule {...props} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

type ModuleProps = { session?: Session; setMsg: (m: { text: string; ok: boolean } | null) => void; onNav?: (tab: string) => void };

// ==================== MODAL WRAPPER ====================
function Modal({ open, onClose, title, icon, children, maxWidth = "max-w-2xl" }: {
  open: boolean; onClose: () => void; title: string; icon: string; children: React.ReactNode; maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-200 z-10">
          <h3 className="text-base font-bold flex items-center gap-2">
            <span>{icon}</span> {title}
          </h3>
          <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
            onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-lg">✕</motion.button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function ConfirmDelete({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Confirmar Eliminação" icon="⚠️" maxWidth="max-w-sm">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">⚠️</div>
        <p className="text-sm text-gray-600 mt-2">Tem certeza? Esta acção não pode ser desfeita.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Eliminar</button>
      </div>
    </Modal>
  );
}

// ==================== DASHBOARD MÉDICO ====================
function DashboardMedico({ session, setMsg, onNav }: ModuleProps) {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [c, p, pr, a, t, i, s] = await Promise.all([
        api.consultas.list(), api.pacientes.list(), api.prescricoesMed.list(),
        api.actosClinicos.list(), api.triagem.list(), api.imagiologia.list(),
        api.solicitacoes.list()
      ]);
      const todayStr = today();
      setStats({
        consultas: c, pacientes: p, prescricoes: pr, actos: a,
        triagens: t, imagiologia: i, solicitacoes: s,
        hoje: {
          consultas: c.filter((x: any) => x.data === todayStr).length,
          concluidas: c.filter((x: any) => x.data === todayStr && x.estado === "concluida").length,
          agendadas: c.filter((x: any) => x.data === todayStr && x.estado === "agendada").length,
        },
        pendentesLaudos: [
          ...i.filter((x: any) => x.estado === "concluido" && !x.laudoMedico),
          ...s.filter((x: any) => x.estado === "concluido" && !x.laudoMedico),
        ].length,
      });
      setLoading(false);
    })();
  }, []);

  const dados7dias = useMemo(() => {
    if (!stats.consultas) return [];
    const dias = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      dias.push({
        dia: d.toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit" }),
        consultas: stats.consultas.filter((c: any) => c.data === ds).length,
        prescricoes: stats.prescricoes.filter((p: any) => p.data === ds).length,
      });
    }
    return dias;
  }, [stats.consultas, stats.prescricoes]);

  const dadosTipo = useMemo(() => {
    if (!stats.consultas) return [];
    const c: any = {};
    stats.consultas.forEach((x: any) => { c[x.tipo] = (c[x.tipo] || 0) + 1; });
    return Object.entries(TIPO_CONSULTA).map(([k, v]) => ({
      name: v.label, value: c[k] || 0, fill: k === "urgencia" ? "#ef4444" : k === "primeira" ? "#3b82f6" : k === "seguimento" ? "#22c55e" : k === "retorno" ? "#f59e0b" : "#a855f7"
    }));
  }, [stats.consultas]);

  if (loading) return <div className="py-20 text-center text-gray-500">A carregar dashboard...</div>;

  const proximasConsultas = (stats.consultas || [])
    .filter((c: any) => c.estado === "agendada" && c.data >= today())
    .sort((a: any, b: any) => (a.data + a.hora).localeCompare(b.data + b.hora))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs opacity-80">Bom dia, Doutor(a)</div>
            <div className="text-2xl font-bold">{session?.funcionarioNome ?? session?.username}</div>
            <div className="text-xs opacity-80 mt-1">{new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-black">{stats.hoje?.consultas || 0}</div>
              <div className="text-[10px] opacity-80">Consultas Hoje</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-black">{stats.hoje?.agendadas || 0}</div>
              <div className="text-[10px] opacity-80">A Aguardar</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-black text-amber-300">{stats.pendentesLaudos || 0}</div>
              <div className="text-[10px] opacity-80">Laudos Pendentes</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Pacientes", value: stats.pacientes?.length || 0, icon: "👥", cor: "text-blue-600", bg: "from-blue-50 to-blue-100/50" },
          { label: "Consultas Hoje", value: stats.hoje?.consultas || 0, icon: "🩺", cor: "text-primary", bg: "from-blue-50 to-blue-100/50" },
          { label: "Concluídas", value: stats.hoje?.concluidas || 0, icon: "✓", cor: "text-green-600", bg: "from-green-50 to-green-100/50" },
          { label: "Prescrições", value: stats.prescricoes?.length || 0, icon: "📝", cor: "text-purple-600", bg: "from-purple-50 to-purple-100/50" },
          { label: "Actos Clínicos", value: stats.actos?.length || 0, icon: "📄", cor: "text-amber-600", bg: "from-amber-50 to-amber-100/50" },
          { label: "Laudos Pendentes", value: stats.pendentesLaudos || 0, icon: "✍️", cor: "text-red-600", bg: "from-red-50 to-red-100/50" },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} border border-gray-200 rounded-xl p-4 shadow-sm`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-black ${s.cor}`}>{s.value}</div>
            <div className="text-[10px] text-gray-600 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">📈 Actividade - Últimos 7 dias</h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dados7dias}>
              <defs>
                <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="consultas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorC)" name="Consultas" />
              <Area type="monotone" dataKey="prescricoes" stroke="#a855f7" fillOpacity={1} fill="url(#colorP)" name="Prescrições" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">🩺 Consultas por Tipo</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dadosTipo} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                {dadosTipo.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Próximas consultas + Acesso Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">⏰ Próximas Consultas</h4>
          {proximasConsultas.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">Sem consultas agendadas</div>
          ) : (
            <div className="space-y-2">
              {proximasConsultas.map((c: any) => {
                const tc = TIPO_CONSULTA[c.tipo] || TIPO_CONSULTA.primeira;
                return (
                  <div key={c.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <div className="text-center flex-shrink-0 w-14">
                      <div className="text-lg font-black text-blue-600">{c.hora}</div>
                      <div className="text-[10px] text-gray-500">{c.data.slice(5)}</div>
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tc.color}`}>
                      <span className="text-lg">{tc.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{c.pacienteNome}</div>
                      <div className="text-xs text-gray-500 truncate">{tc.label} · {c.motivo || "Consulta"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">⚡ Acesso Rápido</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "🩺", label: "Nova Consulta", tab: "consultas" },
              { icon: "📝", label: "Nova Prescrição", tab: "prescricoes" },
              { icon: "✍️", label: "Validar Laudos", tab: "laudos" },
              { icon: "📄", label: "Acto Clínico", tab: "actos" },
              { icon: "👥", label: "Pacientes", tab: "pacientes" },
              { icon: "📈", label: "Relatórios", tab: "relatorios" },
            ].map(a => (
              <button key={a.tab} onClick={() => {
                if (onNav && ["pacientes", "laudos"].includes(a.tab)) onNav(a.tab);
                else {
                  const el = document.querySelector(`[data-tab="${a.tab}"]`) as HTMLButtonElement;
                  el?.click();
                }
              }}
                className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-blue-300 hover:shadow-md rounded-lg p-3 text-center transition-all">
                <div className="text-2xl mb-1">{a.icon}</div>
                <div className="text-xs font-semibold text-gray-700">{a.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fluxo Clínico */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-blue-700 mb-4 uppercase tracking-wide">
          📊 Fluxo Clínico — Laboratório & Imagiologia
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {FLUXO.map((f, i) => (
            <div key={f.passo} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-lg flex items-center justify-center shadow">
                  {f.icon}
                </div>
                <div className="text-xs font-semibold text-blue-700 mt-1 text-center whitespace-nowrap">{f.label}</div>
                <div className="text-[10px] text-gray-500 text-center max-w-[80px] leading-tight">{f.desc}</div>
              </div>
              {i < FLUXO.length - 1 && (
                <span className="text-gray-400 text-lg mb-6">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== CONSULTAS ====================
function ConsultasModule({ session, setMsg }: ModuleProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAtendimento, setShowAtendimento] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [filterData, setFilterData] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [detalhe, setDetalhe] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const emptyForm = {
    pacienteNome: "", pacienteIdade: "", pacienteSexo: "", pacienteTelefone: "",
    tipo: "primeira" as string, motivo: "", data: today(), hora: "09:00",
    duracao: 30, sala: "", observacoes: "",
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.consultas.list()); } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm({ ...emptyForm, data: today(), hora: "09:00" }); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pacienteNome.trim()) { setMsg({ text: "Paciente obrigatório.", ok: false }); return; }
    try {
      await api.consultas.create({ ...form, medico: session?.funcionarioNome ?? session?.username });
      setMsg({ text: "Consulta agendada.", ok: true });
      resetForm(); setShowForm(false); await load();
    } catch (err: any) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function updateEstado(id: number, estado: string) {
    try {
      await api.consultas.update(id, { estado });
      setMsg({ text: `Estado: ${ESTADO_CONSULTA[estado].label}`, ok: true });
      await load();
    } catch { setMsg({ text: "Erro.", ok: false }); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await api.consultas.delete(deleteId); setDeleteId(null); setDetalhe(null); setMsg({ text: "Eliminada.", ok: true }); await load(); }
    catch { setMsg({ text: "Erro.", ok: false }); }
  }

  const filtered = useMemo(() => items.filter(r =>
    (!search || r.pacienteNome.toLowerCase().includes(search.toLowerCase())) &&
    (!filterData || r.data === filterData) &&
    (!filterEstado || r.estado === filterEstado)
  ).sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora)), [items, search, filterData, filterEstado]);

  const statsDia = useMemo(() => ({
    total: items.length,
    hoje: items.filter(i => i.data === today()).length,
    agendadas: items.filter(i => i.estado === "agendada").length,
    concluidas: items.filter(i => i.estado === "concluida").length,
  }), [items]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total", value: statsDia.total, cor: "text-blue-600", icon: "🩺", bg: "from-blue-50 to-blue-100/50" },
          { label: "Hoje", value: statsDia.hoje, cor: "text-indigo-600", icon: "📅", bg: "from-indigo-50 to-indigo-100/50" },
          { label: "Agendadas", value: statsDia.agendadas, cor: "text-amber-600", icon: "⏳", bg: "from-amber-50 to-amber-100/50" },
          { label: "Concluídas", value: statsDia.concluidas, cor: "text-green-600", icon: "✓", bg: "from-green-50 to-green-100/50" },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} border border-gray-200 rounded-xl p-4 text-center shadow-sm`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-black ${s.cor}`}>{s.value}</div>
            <div className="text-xs text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={filterData} onChange={e => setFilterData(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white">
            <option value="">Todos estados</option>
            {Object.entries(ESTADO_CONSULTA).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48" />
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700">
          <span>🩺</span> Nova Consulta
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-10 text-center text-gray-500">A carregar…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Nenhuma consulta.</div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {filtered.map(r => {
                const tc = TIPO_CONSULTA[r.tipo] || TIPO_CONSULTA.primeira;
                const ec = ESTADO_CONSULTA[r.estado];
                return (
                  <button key={r.id} onClick={() => setDetalhe(r)}
                    className={`w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-blue-50/50 transition-colors ${detalhe?.id === r.id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}>
                    <div className="text-center flex-shrink-0 w-14">
                      <div className="text-lg font-black text-blue-600">{r.hora}</div>
                      <div className="text-[10px] text-gray-500">{r.data.slice(5)}</div>
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tc.color}`}>
                      <span className="text-lg">{tc.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{r.pacienteNome}</div>
                      <div className="text-xs text-gray-500 truncate">{tc.label} · {r.motivo || "Consulta"}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ec?.badge}`}>{ec?.icon} {ec?.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {!detalhe ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              <div className="text-4xl mb-2">🩺</div>
              <p>Seleccione uma consulta</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-transparent">
                <div className="font-bold text-sm">{detalhe.pacienteNome}</div>
                <div className="text-xs text-gray-500">{detalhe.data} · {detalhe.hora} ({detalhe.duracao}min)</div>
                <div className="text-xs text-gray-500 mt-1">Sala {detalhe.sala || "-"}</div>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-500">Idade</div>
                    <div className="font-semibold">{detalhe.pacienteIdade || "-"}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-500">Sexo</div>
                    <div className="font-semibold">{detalhe.pacienteSexo || "-"}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-500">Telefone</div>
                    <div className="font-semibold">{detalhe.pacienteTelefone || "-"}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-500">Tipo</div>
                    <div className="font-semibold">{(TIPO_CONSULTA[detalhe.tipo] || TIPO_CONSULTA.primeira).label}</div>
                  </div>
                </div>
                {detalhe.motivo && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Motivo</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{detalhe.motivo}</p>
                  </div>
                )}
                {detalhe.observacoes && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Observações</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-line">{detalhe.observacoes}</p>
                  </div>
                )}
                {detalhe.diagnostico && (
                  <div>
                    <div className="text-xs font-bold text-blue-600 uppercase mb-1">🔍 Diagnóstico</div>
                    <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-3">{detalhe.diagnostico}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-2">🔄 Estado</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {Object.keys(ESTADO_CONSULTA).map(e => (
                      <button key={e} onClick={() => updateEstado(detalhe.id, e)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${detalhe.estado === e ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {ESTADO_CONSULTA[e].icon} {ESTADO_CONSULTA[e].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  {detalhe.estado === "agendada" && (
                    <button onClick={() => setShowAtendimento(detalhe)}
                      className="flex-1 bg-green-600 text-white rounded-lg text-xs py-2 font-semibold hover:bg-green-700">
                      ▶️ Iniciar Atendimento
                    </button>
                  )}
                  <button onClick={() => setDeleteId(detalhe.id)}
                    className="flex-1 border border-red-200 rounded-lg text-xs py-2 text-red-600 hover:bg-red-50 font-semibold">🗑️ Eliminar</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Nova Consulta */}
      <AnimatePresence>
        {showForm && (
          <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova Consulta" icon="🩺">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Paciente *</label>
                  <input value={form.pacienteNome} onChange={e => setForm(f => ({ ...f, pacienteNome: e.target.value }))} className={inp} required />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Idade</label>
                  <input value={form.pacienteIdade} onChange={e => setForm(f => ({ ...f, pacienteIdade: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Sexo</label>
                  <select value={form.pacienteSexo} onChange={e => setForm(f => ({ ...f, pacienteSexo: e.target.value }))} className={inp}>
                    <option value="">-</option><option>M</option><option>F</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Telefone</label>
                  <input value={form.pacienteTelefone} onChange={e => setForm(f => ({ ...f, pacienteTelefone: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Tipo *</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inp}>
                    {Object.entries(TIPO_CONSULTA).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Data *</label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} className={inp} required />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Hora *</label>
                  <input type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} className={inp} required />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Duração (min)</label>
                  <input type="number" value={form.duracao} onChange={e => setForm(f => ({ ...f, duracao: parseInt(e.target.value) || 30 }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Sala</label>
                  <input value={form.sala} onChange={e => setForm(f => ({ ...f, sala: e.target.value }))} className={inp} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Motivo da Consulta</label>
                  <textarea value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} className={inp + " resize-none"} rows={2} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Observações</label>
                  <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} className={inp + " resize-none"} rows={2} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700">✅ Agendar</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 border border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal Atendimento */}
      <AtendimentoModal open={!!showAtendimento} consulta={showAtendimento} onClose={() => setShowAtendimento(null)}
        onSaved={async () => { setShowAtendimento(null); await load(); }} session={session} setMsg={setMsg} />

      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
    </>
  );
}

// ==================== ATENDIMENTO (consulta em curso) ====================
function AtendimentoModal({ open, consulta, onClose, onSaved, session, setMsg }: any) {
  const [form, setForm] = useState({
    queixaPrincipal: "", historiaDoenca: "", antecedentesPessoais: "", antecedentesFamiliares: "",
    exameFisico: "", tensaoArterial: "", frequenciaCardiaca: "", temperatura: "",
    peso: "", altura: "", inspecaoGeral: "",
    hipotesesDiagnosticas: "", diagnostico: "",
    examesSolicitados: "", conduta: "", orientacoes: "",
    proximaConsulta: "",
  });

  useEffect(() => {
    if (consulta) {
      setForm(f => ({ ...f, queixaPrincipal: consulta.motivo || "" }));
    }
  }, [consulta]);

  if (!open || !consulta) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.consultas.update(consulta.id, {
        ...form, estado: "concluida",
        dataAtendimento: today(), horaAtendimento: now(),
        medico: session?.funcionarioNome ?? session?.username,
      });
      // Registar acto clínico
      await api.actosClinicos.create({
        pacienteNome: consulta.pacienteNome,
        data: today(), hora: now(),
        tipo: "consulta",
        diagnostico: form.diagnostico,
        resumo: form.queixaPrincipal,
        detalhes: JSON.stringify(form),
        medico: session?.funcionarioNome ?? session?.username,
      });
      setMsg({ text: "Atendimento concluído.", ok: true });
      onSaved();
    } catch (err: any) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Atendimento - ${consulta.pacienteNome}`} icon="🩺" maxWidth="max-w-4xl">
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">📋 Anamnese</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className={lbl}>Queixa Principal *</label>
              <textarea value={form.queixaPrincipal} onChange={e => setForm(f => ({ ...f, queixaPrincipal: e.target.value }))} className={inp + " resize-none"} rows={2} required />
            </div>
            <div className="col-span-2 space-y-1">
              <label className={lbl}>História da Doença Actual</label>
              <textarea value={form.historiaDoenca} onChange={e => setForm(f => ({ ...f, historiaDoenca: e.target.value }))} className={inp + " resize-none"} rows={3} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Antecedentes Pessoais</label>
              <textarea value={form.antecedentesPessoais} onChange={e => setForm(f => ({ ...f, antecedentesPessoais: e.target.value }))} className={inp + " resize-none"} rows={2} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Antecedentes Familiares</label>
              <textarea value={form.antecedentesFamiliares} onChange={e => setForm(f => ({ ...f, antecedentesFamiliares: e.target.value }))} className={inp + " resize-none"} rows={2} />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">❤️ Exame Físico</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className={lbl}>TA (mmHg)</label>
              <input value={form.tensaoArterial} onChange={e => setForm(f => ({ ...f, tensaoArterial: e.target.value }))} className={inp} placeholder="120/80" />
            </div>
            <div className="space-y-1">
              <label className={lbl}>FC (bpm)</label>
              <input value={form.frequenciaCardiaca} onChange={e => setForm(f => ({ ...f, frequenciaCardiaca: e.target.value }))} className={inp} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Temp (°C)</label>
              <input value={form.temperatura} onChange={e => setForm(f => ({ ...f, temperatura: e.target.value }))} className={inp} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Peso (kg)</label>
              <input value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))} className={inp} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Altura (cm)</label>
              <input value={form.altura} onChange={e => setForm(f => ({ ...f, altura: e.target.value }))} className={inp} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Inspeção Geral</label>
              <input value={form.inspecaoGeral} onChange={e => setForm(f => ({ ...f, inspecaoGeral: e.target.value }))} className={inp} />
            </div>
            <div className="col-span-3 space-y-1">
              <label className={lbl}>Exame Físico Dirigido</label>
              <textarea value={form.exameFisico} onChange={e => setForm(f => ({ ...f, exameFisico: e.target.value }))} className={inp + " resize-none"} rows={3} />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">🔍 Diagnóstico & Conduta</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className={lbl}>Hipóteses Diagnósticas</label>
              <textarea value={form.hipotesesDiagnosticas} onChange={e => setForm(f => ({ ...f, hipotesesDiagnosticas: e.target.value }))} className={inp + " resize-none"} rows={2} />
            </div>
            <div className="col-span-2 space-y-1">
              <label className={lbl}>Diagnóstico Final *</label>
              <textarea value={form.diagnostico} onChange={e => setForm(f => ({ ...f, diagnostico: e.target.value }))} className={inp + " resize-none"} rows={2} required />
            </div>
            <div className="col-span-2 space-y-1">
              <label className={lbl}>Exames Solicitados</label>
              <textarea value={form.examesSolicitados} onChange={e => setForm(f => ({ ...f, examesSolicitados: e.target.value }))} className={inp + " resize-none"} rows={2} placeholder="Análises clínicas, imagiologia..." />
            </div>
            <div className="col-span-2 space-y-1">
              <label className={lbl}>Conduta Terapêutica</label>
              <textarea value={form.conduta} onChange={e => setForm(f => ({ ...f, conduta: e.target.value }))} className={inp + " resize-none"} rows={3} />
            </div>
            <div className="col-span-2 space-y-1">
              <label className={lbl}>Orientações ao Paciente</label>
              <textarea value={form.orientacoes} onChange={e => setForm(f => ({ ...f, orientacoes: e.target.value }))} className={inp + " resize-none"} rows={2} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Próxima Consulta</label>
              <input type="date" value={form.proximaConsulta} onChange={e => setForm(f => ({ ...f, proximaConsulta: e.target.value }))} className={inp} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-200">
          <button type="submit" className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700">
            ✅ Concluir Atendimento
          </button>
          <button type="button" onClick={onClose} className="px-5 border border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
        </div>
      </form>
    </Modal>
  );
}

// ==================== PACIENTES ====================
function PacientesModule({ session, setMsg }: ModuleProps) {
  const [items, setItems] = useState<any[]>([]);
  const [triagens, setTriagens] = useState<any[]>([]);
  const [consultas, setConsultas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  const emptyForm = {
    nome: "", idade: "", sexo: "", telefone: "", bi: "",
    grupoSanguineo: "", alergias: "", patologiasCronicas: "", medicacaoHabitual: "",
    profissao: "", endereco: "", contactoEmergencia: "",
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t, c] = await Promise.all([api.pacientes.list(), api.triagem.list(), api.consultas.list()]);
      setItems(p); setTriagens(t); setConsultas(c);
    } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { setMsg({ text: "Nome obrigatório.", ok: false }); return; }
    try {
      await api.pacientes.create({ ...form, idade: numI(form.idade) });
      setMsg({ text: "Paciente registado.", ok: true });
      setForm(emptyForm); setShowForm(false); await load();
    } catch (err: any) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  const filtered = useMemo(() => items.filter(p =>
    !search || p.nome.toLowerCase().includes(search.toLowerCase()) || p.bi?.includes(search)
  ), [items, search]);

  function getHistorico(nome: string) {
    const ts = triagens.filter(t => t.pacienteNome.toLowerCase() === nome.toLowerCase());
    const cs = consultas.filter(c => c.pacienteNome.toLowerCase() === nome.toLowerCase());
    return [...ts.map(t => ({ ...t, tipoReg: "triagem" })), ...cs.map(c => ({ ...c, tipoReg: "consulta" }))]
      .sort((a, b) => ((b.data || "") + (b.hora || "")).localeCompare((a.data || "") + (a.hora || "")));
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-2xl font-black text-blue-600">{items.length}</div>
          <div className="text-xs text-gray-600">Pacientes</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">🩺</div>
          <div className="text-2xl font-black text-green-600">{consultas.filter(c => c.estado === "concluida").length}</div>
          <div className="text-xs text-gray-600">Consultas Concluídas</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">💉</div>
          <div className="text-2xl font-black text-purple-600">{triagens.length}</div>
          <div className="text-xs text-gray-600">Triagens</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">⚠️</div>
          <div className="text-2xl font-black text-amber-600">{items.filter(p => p.alergias).length}</div>
          <div className="text-xs text-gray-600">Com Alergias</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar por nome ou BI..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700">
          <span>👤</span> Novo Paciente
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-10 text-center text-gray-500">A carregar…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Nenhum paciente.</div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {filtered.map(p => {
                const hist = getHistorico(p.nome);
                return (
                  <button key={p.id} onClick={() => setSelected(p)}
                    className={`w-full text-left px-5 py-3 hover:bg-blue-50/50 transition-colors ${selected?.id === p.id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                        {p.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {p.nome}
                          {p.alergias && <span title="Alergias" className="text-red-500">⚠️</span>}
                        </div>
                        <div className="text-xs text-gray-500">{p.idade || "-"} · {p.sexo || "-"} · {p.telefone || "-"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-blue-600">{hist.length} registos</div>
                        {p.grupoSanguineo && <div className="text-[10px] text-gray-500">{p.grupoSanguineo}</div>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {!selected ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              <div className="text-4xl mb-2">👥</div>
              <p>Seleccione um paciente</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center font-bold text-white text-lg">
                    {selected.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{selected.nome}</div>
                    <div className="text-xs text-gray-500">{selected.idade} anos · {selected.sexo}</div>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-500">BI</div>
                    <div className="font-semibold">{selected.bi || "-"}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-500">Telefone</div>
                    <div className="font-semibold">{selected.telefone || "-"}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-500">Grupo Sanguíneo</div>
                    <div className="font-semibold">{selected.grupoSanguineo || "-"}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-500">Profissão</div>
                    <div className="font-semibold">{selected.profissao || "-"}</div>
                  </div>
                </div>
                {selected.alergias && (
                  <div>
                    <div className="text-xs font-bold text-red-600 uppercase mb-1">⚠️ Alergias</div>
                    <p className="text-xs text-red-700 bg-red-50 rounded-lg p-2">{selected.alergias}</p>
                  </div>
                )}
                {selected.patologiasCronicas && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">🏥 Patologias Crónicas</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{selected.patologiasCronicas}</p>
                  </div>
                )}
                {selected.medicacaoHabitual && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">💊 Medicação Habitual</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{selected.medicacaoHabitual}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-2">📋 Histórico Clínico</div>
                  {getHistorico(selected.nome).length === 0 ? (
                    <div className="text-xs text-center py-4 text-gray-500">Sem registos</div>
                  ) : (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {getHistorico(selected.nome).map((h, i) => (
                        <div key={i} className={`rounded-lg p-2 text-xs ${h.tipoReg === "consulta" ? "bg-blue-50 border-l-2 border-blue-500" : "bg-amber-50 border-l-2 border-amber-500"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{h.data} {h.hora}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${h.tipoReg === "consulta" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                              {h.tipoReg === "consulta" ? "🩺 Consulta" : "💉 Triagem"}
                            </span>
                          </div>
                          <div className="text-gray-600 truncate">{h.queixa || h.motivo || h.diagnostico || "Registo"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <Modal open={showForm} onClose={() => setShowForm(false)} title="Novo Paciente" icon="👤">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Nome Completo *</label>
                  <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inp} required />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Idade</label>
                  <input type="number" value={form.idade} onChange={e => setForm(f => ({ ...f, idade: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Sexo</label>
                  <select value={form.sexo} onChange={e => setForm(f => ({ ...f, sexo: e.target.value }))} className={inp}>
                    <option value="">-</option><option>M</option><option>F</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Telefone</label>
                  <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>BI</label>
                  <input value={form.bi} onChange={e => setForm(f => ({ ...f, bi: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Grupo Sanguíneo</label>
                  <select value={form.grupoSanguineo} onChange={e => setForm(f => ({ ...f, grupoSanguineo: e.target.value }))} className={inp}>
                    <option value="">-</option>
                    <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                    <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Profissão</label>
                  <input value={form.profissao} onChange={e => setForm(f => ({ ...f, profissao: e.target.value }))} className={inp} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Endereço</label>
                  <input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} className={inp} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>⚠️ Alergias</label>
                  <input value={form.alergias} onChange={e => setForm(f => ({ ...f, alergias: e.target.value }))} className={inp} placeholder="Ex: Penicilina, Látex" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>🏥 Patologias Crónicas</label>
                  <textarea value={form.patologiasCronicas} onChange={e => setForm(f => ({ ...f, patologiasCronicas: e.target.value }))} className={inp + " resize-none"} rows={2} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>💊 Medicação Habitual</label>
                  <textarea value={form.medicacaoHabitual} onChange={e => setForm(f => ({ ...f, medicacaoHabitual: e.target.value }))} className={inp + " resize-none"} rows={2} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Contacto de Emergência</label>
                  <input value={form.contactoEmergencia} onChange={e => setForm(f => ({ ...f, contactoEmergencia: e.target.value }))} className={inp} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700">✅ Registar</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 border border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

// ==================== PRESCRIÇÕES MÉDICAS ====================
function PrescricoesMedModule({ session, setMsg }: ModuleProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<any | null>(null);

  const emptyForm = {
    pacienteNome: "", pacienteIdade: "", diagnostico: "", alergias: "", peso: "", data: today(),
  };
  const [form, setForm] = useState(emptyForm);
  const [meds, setMeds] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.prescricoesMed.list()); } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function addMed() {
    setMeds([...meds, { nome: "", dosagem: "", frequencia: "", duracao: "", via: "Oral", observacoes: "" }]);
  }

  function updateMed(idx: number, field: string, value: any) {
    setMeds(meds.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pacienteNome.trim() || meds.length === 0) {
      setMsg({ text: "Preencha paciente e medicamentos.", ok: false }); return;
    }
    try {
      await api.prescricoesMed.create({
        ...form, medicamentos: meds,
        prescritor: session?.funcionarioNome ?? session?.username,
      });
      setMsg({ text: "Prescrição emitida.", ok: true });
      setForm({ ...emptyForm, data: today() }); setMeds([]); setShowForm(false); await load();
    } catch (err: any) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await api.prescricoesMed.delete(deleteId); setDeleteId(null); setDetalhe(null); setMsg({ text: "Eliminada.", ok: true }); await load(); }
    catch { setMsg({ text: "Erro.", ok: false }); }
  }

  function handlePrint(p: any) {
    const w = window.open("", "_blank");
    w?.document.write(`
      <html><head><title>Prescrição - ${p.pacienteNome}</title>
      <style>body{font-family:Arial;padding:40px;max-width:800px;margin:auto}
      h1{color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:10px}
      .info{background:#f3f4f6;padding:15px;border-radius:8px;margin:15px 0}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      th,td{border:1px solid #ddd;padding:10px;text-align:left}
      th{background:#1e40af;color:white}
      .footer{margin-top:40px;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#666}
      .signature{margin-top:60px;border-top:1px solid #000;width:300px;padding-top:5px}</style></head>
      <body>
      <h1>🩺 Prescrição Médica</h1>
      <div class="info">
        <strong>Paciente:</strong> ${p.pacienteNome} ${p.pacienteIdade ? `(${p.pacienteIdade} anos)` : ""}<br>
        <strong>Data:</strong> ${p.data}<br>
        <strong>Diagnóstico:</strong> ${p.diagnostico || "N/A"}<br>
        <strong>Alergias:</strong> ${p.alergias || "Nenhuma conhecida"}<br>
        <strong>Peso:</strong> ${p.peso ? p.peso + " kg" : "N/A"}
      </div>
      <h2>Medicamentos Prescritos</h2>
      <table>
        <tr><th>Medicamento</th><th>Dosagem</th><th>Frequência</th><th>Duração</th><th>Via</th></tr>
        ${p.medicamentos.map((m: any) => `<tr><td>${m.nome}</td><td>${m.dosagem}</td><td>${m.frequencia}</td><td>${m.duracao}</td><td>${m.via}</td></tr>`).join("")}
      </table>
      <div class="footer">
        <strong>Médico:</strong> ${p.prescritor}<br>
        <em>Documento gerado em ${new Date().toLocaleString("pt-PT")}</em>
        <div class="signature">Assinatura do Médico</div>
      </div>
      </body></html>
    `);
    w?.document.close();
    w?.print();
  }

  const filtered = useMemo(() => items.filter(r =>
    !search || r.pacienteNome.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">📝</div>
          <div className="text-2xl font-black text-blue-600">{items.length}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">📅</div>
          <div className="text-2xl font-black text-green-600">{items.filter(i => i.data === today()).length}</div>
          <div className="text-xs text-gray-600">Hoje</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">💊</div>
          <div className="text-2xl font-black text-purple-600">{items.reduce((a, i) => a + (i.medicamentos?.length || 0), 0)}</div>
          <div className="text-xs text-gray-600">Meds prescritos</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar paciente..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700">
          <span>📝</span> Nova Prescrição
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-10 text-center text-gray-500">A carregar…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Nenhuma prescrição.</div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {filtered.map(r => (
                <button key={r.id} onClick={() => setDetalhe(r)}
                  className={`w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-blue-50/50 transition-colors ${detalhe?.id === r.id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}>
                  <div className="text-2xl">📝</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{r.pacienteNome}</div>
                    <div className="text-xs text-gray-500">{r.diagnostico || "Sem diagnóstico"} · {r.medicamentos?.length || 0} meds</div>
                  </div>
                  <div className="text-xs text-gray-500">{r.data}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {!detalhe ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              <div className="text-4xl mb-2">📝</div>
              <p>Seleccione uma prescrição</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-transparent">
                <div className="font-bold text-sm">{detalhe.pacienteNome}</div>
                <div className="text-xs text-gray-500">{detalhe.data}</div>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
                {detalhe.diagnostico && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Diagnóstico</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{detalhe.diagnostico}</p>
                  </div>
                )}
                {detalhe.alergias && (
                  <div>
                    <div className="text-xs font-bold text-red-600 uppercase mb-1">⚠️ Alergias</div>
                    <p className="text-xs text-red-700 bg-red-50 rounded-lg p-2">{detalhe.alergias}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-2">💊 Medicamentos</div>
                  <div className="space-y-2">
                    {(detalhe.medicamentos || []).map((m: any, i: number) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3 text-xs">
                        <div className="font-bold text-sm">{m.nome}</div>
                        <div className="text-gray-600 mt-1">
                          {m.dosagem} · {m.frequencia} · {m.duracao} · Via: {m.via}
                        </div>
                        {m.observacoes && <div className="text-gray-500 mt-1 italic">{m.observacoes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button onClick={() => handlePrint(detalhe)}
                    className="flex-1 bg-blue-600 text-white rounded-lg text-xs py-2 font-semibold hover:bg-blue-700">🖨️ Imprimir</button>
                  <button onClick={() => setDeleteId(detalhe.id)}
                    className="flex-1 border border-red-200 rounded-lg text-xs py-2 text-red-600 hover:bg-red-50 font-semibold">🗑️ Eliminar</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova Prescrição Médica" icon="📝" maxWidth="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Paciente *</label>
                  <input value={form.pacienteNome} onChange={e => setForm(f => ({ ...f, pacienteNome: e.target.value }))} className={inp} required />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Idade</label>
                  <input value={form.pacienteIdade} onChange={e => setForm(f => ({ ...f, pacienteIdade: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Peso (kg)</label>
                  <input type="number" step="0.1" value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))} className={inp} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Diagnóstico</label>
                  <input value={form.diagnostico} onChange={e => setForm(f => ({ ...f, diagnostico: e.target.value }))} className={inp} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Alergias Conhecidas</label>
                  <input value={form.alergias} onChange={e => setForm(f => ({ ...f, alergias: e.target.value }))} className={inp} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-blue-600 uppercase">💊 Medicamentos</p>
                  <button type="button" onClick={addMed} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">+ Adicionar</button>
                </div>
                {meds.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg">Clique em "+ Adicionar"</div>
                ) : (
                  <div className="space-y-2">
                    {meds.map((m, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-4 space-y-1">
                            <label className={lbl}>Medicamento *</label>
                            <input value={m.nome} onChange={e => updateMed(idx, "nome", e.target.value)} className={inp} required />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className={lbl}>Dosagem</label>
                            <input value={m.dosagem} onChange={e => updateMed(idx, "dosagem", e.target.value)} className={inp} placeholder="500mg" />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className={lbl}>Frequência</label>
                            <input value={m.frequencia} onChange={e => updateMed(idx, "frequencia", e.target.value)} className={inp} placeholder="8/8h" />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className={lbl}>Duração</label>
                            <input value={m.duracao} onChange={e => updateMed(idx, "duracao", e.target.value)} className={inp} placeholder="7 dias" />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className={lbl}>Via</label>
                            <select value={m.via} onChange={e => updateMed(idx, "via", e.target.value)} className={inp}>
                              <option>Oral</option><option>Sublingual</option><option>Intravenosa</option>
                              <option>Intramuscular</option><option>Subcutânea</option><option>Tópica</option>
                              <option>Retal</option><option>Inalatória</option><option>Oftálmica</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-11 space-y-1">
                            <label className={lbl}>Observações</label>
                            <input value={m.observacoes} onChange={e => updateMed(idx, "observacoes", e.target.value)} className={inp} placeholder="Tomar após refeição..." />
                          </div>
                          <div className="col-span-1 flex items-end">
                            <button type="button" onClick={() => setMeds(meds.filter((_, i) => i !== idx))} className="text-red-600 hover:bg-red-50 w-full py-2 rounded">✕</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700">✅ Prescrever</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 border border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
    </>
  );
}

// ==================== VALIDAÇÃO DE LAUDOS ====================
function LaudosModule({ session, setMsg }: ModuleProps) {
  const [imagiologia, setImagiologia] = useState<any[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"imagiologia" | "lab">("imagiologia");
  const [selected, setSelected] = useState<any | null>(null);
  const [laudo, setLaudo] = useState({ conclusao: "", observacoes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [i, s] = await Promise.all([api.imagiologia.list(), api.solicitacoes.list()]);
      setImagiologia(i); setSolicitacoes(s);
    } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const pendentesImg = imagiologia.filter(i => i.estado === "concluido" && !i.laudoMedico);
  const pendentesLab = solicitacoes.filter(s => s.estado === "concluido" && !s.laudoMedico);
  const validadosImg = imagiologia.filter(i => i.laudoMedico);
  const validadosLab = solicitacoes.filter(s => s.laudoMedico);

  async function validarLaudo() {
    if (!selected || !laudo.conclusao.trim()) {
      setMsg({ text: "Conclusão obrigatória.", ok: false }); return;
    }
    try {
      if (tab === "imagiologia") {
        await api.imagiologia.update(selected.id, {
          laudoMedico: laudo.conclusao,
          observacoesLaudo: laudo.observacoes,
          dataValidacao: today(),
          medicoValidador: session?.funcionarioNome ?? session?.username,
        });
      } else {
        await api.solicitacoes.update(selected.id, {
          laudoMedico: laudo.conclusao,
          observacoesLaudo: laudo.observacoes,
          dataValidacao: today(),
          medicoValidador: session?.funcionarioNome ?? session?.username,
        });
      }
      setMsg({ text: "Laudo validado com sucesso.", ok: true });
      setSelected(null); setLaudo({ conclusao: "", observacoes: "" });
      await load();
    } catch (err: any) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  const pendentes = tab === "imagiologia" ? pendentesImg : pendentesLab;
  const validados = tab === "imagiologia" ? validadosImg : validadosLab;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">⏳</div>
          <div className="text-2xl font-black text-red-600">{pendentesImg.length + pendentesLab.length}</div>
          <div className="text-xs text-gray-600">Laudos Pendentes</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">✓</div>
          <div className="text-2xl font-black text-green-600">{validadosImg.length + validadosLab.length}</div>
          <div className="text-xs text-gray-600">Validados</div>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">🩻</div>
          <div className="text-2xl font-black text-violet-600">{pendentesImg.length}</div>
          <div className="text-xs text-gray-600">Imagiologia</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">🧪</div>
          <div className="text-2xl font-black text-blue-600">{pendentesLab.length}</div>
          <div className="text-xs text-gray-600">Laboratório</div>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button onClick={() => setTab("imagiologia")} className={`px-4 py-2 text-xs font-semibold ${tab === "imagiologia" ? "bg-blue-600 text-white" : "bg-white"}`}>
            🩻 Imagiologia ({pendentesImg.length})
          </button>
          <button onClick={() => setTab("lab")} className={`px-4 py-2 text-xs font-semibold ${tab === "lab" ? "bg-blue-600 text-white" : "bg-white"}`}>
            🧪 Laboratório ({pendentesLab.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-10 text-center text-gray-500">A carregar…</div>
          ) : pendentes.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <p>Sem laudos pendentes de validação</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {pendentes.map((r: any) => (
                <button key={r.id} onClick={() => { setSelected(r); setLaudo({ conclusao: "", observacoes: "" }); }}
                  className={`w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-blue-50/50 transition-colors ${selected?.id === r.id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}>
                  <div className="text-2xl">{tab === "imagiologia" ? "🩻" : "🧪"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{r.pacienteNome}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {tab === "imagiologia" ? r.tipoExame : `${r.examesSolicitados?.length || 0} exames`}
                      {" · "}Dr. {r.medicoSolicitante || "-"}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{r.data}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {!selected ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              <div className="text-4xl mb-2">✍️</div>
              <p>Seleccione um exame para validar</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-transparent">
                <div className="font-bold text-sm">{selected.pacienteNome}</div>
                <div className="text-xs text-gray-500">{selected.data}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {tab === "imagiologia" ? `🩻 ${selected.tipoExame}` : `🧪 ${selected.examesSolicitados?.length || 0} exames`}
                </div>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
                {tab === "imagiologia" ? (
                  <>
                    {selected.indicacao && (
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Indicação</div>
                        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{selected.indicacao}</p>
                      </div>
                    )}
                    {selected.resultado && (
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Resultado Técnico</div>
                        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-line">{selected.resultado}</p>
                      </div>
                    )}
                    {selected.conclusao && (
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Conclusão Técnica</div>
                        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{selected.conclusao}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">🧪 Exames</div>
                    <div className="space-y-2">
                      {(selected.examesSolicitados || []).map((ex: any, i: number) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3 text-xs">
                          <div className="font-bold">{ex.nome}</div>
                          {ex.resultado && <div className="text-gray-600 mt-1">{ex.resultado}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3 space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xs font-bold text-blue-700 uppercase mb-2">✍️ Validação Médica</div>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className={lbl}>Conclusão / Laudo Médico *</label>
                        <textarea value={laudo.conclusao} onChange={e => setLaudo(l => ({ ...l, conclusao: e.target.value }))}
                          className={inp + " resize-none"} rows={3} placeholder="Interpretação clínica e conclusão..." required />
                      </div>
                      <div className="space-y-1">
                        <label className={lbl}>Observações Adicionais</label>
                        <textarea value={laudo.observacoes} onChange={e => setLaudo(l => ({ ...l, observacoes: e.target.value }))}
                          className={inp + " resize-none"} rows={2} placeholder="Recomendações, seguimento..." />
                      </div>
                    </div>
                  </div>
                  <button onClick={validarLaudo}
                    className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700">
                    ✅ Validar e Assinar Laudo
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ==================== ACTOS CLÍNICOS ====================
function ActosClinicosModule({ session, setMsg }: ModuleProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<any | null>(null);

  const emptyForm = {
    pacienteNome: "", data: today(), hora: now(),
    tipo: "consulta", diagnostico: "", resumo: "",
    procedimentos: "", materiais: "", observacoes: "",
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.actosClinicos.list()); } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pacienteNome.trim()) { setMsg({ text: "Paciente obrigatório.", ok: false }); return; }
    try {
      await api.actosClinicos.create({
        ...form, medico: session?.funcionarioNome ?? session?.username,
      });
      setMsg({ text: "Acto clínico registado.", ok: true });
      setForm({ ...emptyForm, data: today(), hora: now() }); setShowForm(false); await load();
    } catch (err: any) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await api.actosClinicos.delete(deleteId); setDeleteId(null); setDetalhe(null); setMsg({ text: "Eliminado.", ok: true }); await load(); }
    catch { setMsg({ text: "Erro.", ok: false }); }
  }

  function handlePrint(a: any) {
    const w = window.open("", "_blank");
    w?.document.write(`
      <html><head><title>Acto Clínico - ${a.pacienteNome}</title>
      <style>body{font-family:Arial;padding:40px;max-width:800px;margin:auto}
      h1{color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:10px}
      .info{background:#f3f4f6;padding:15px;border-radius:8px;margin:15px 0}
      .section{margin:20px 0}
      .section h3{color:#1e40af;margin-bottom:5px}
      .footer{margin-top:40px;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#666}
      .signature{margin-top:60px;border-top:1px solid #000;width:300px;padding-top:5px}</style></head>
      <body>
      <h1>📄 Relatório de Acto Clínico</h1>
      <div class="info">
        <strong>Paciente:</strong> ${a.pacienteNome}<br>
        <strong>Data:</strong> ${a.data} ${a.hora}<br>
        <strong>Tipo:</strong> ${a.tipo}<br>
        <strong>Médico:</strong> ${a.medico}
      </div>
      ${a.diagnostico ? `<div class="section"><h3>Diagnóstico</h3><p>${a.diagnostico}</p></div>` : ""}
      ${a.resumo ? `<div class="section"><h3>Resumo</h3><p>${a.resumo}</p></div>` : ""}
      ${a.procedimentos ? `<div class="section"><h3>Procedimentos</h3><p>${a.procedimentos}</p></div>` : ""}
      ${a.materiais ? `<div class="section"><h3>Materiais Utilizados</h3><p>${a.materiais}</p></div>` : ""}
      ${a.observacoes ? `<div class="section"><h3>Observações</h3><p>${a.observacoes}</p></div>` : ""}
      <div class="footer">
        <em>Documento gerado em ${new Date().toLocaleString("pt-PT")}</em>
        <div class="signature">Assinatura do Médico</div>
      </div>
      </body></html>
    `);
    w?.document.close();
    w?.print();
  }

  const filtered = useMemo(() => items.filter(r =>
    !search || r.pacienteNome.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora)), [items, search]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">📄</div>
          <div className="text-2xl font-black text-blue-600">{items.length}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">📅</div>
          <div className="text-2xl font-black text-green-600">{items.filter(i => i.data === today()).length}</div>
          <div className="text-xs text-gray-600">Hoje</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-2xl font-black text-purple-600">{new Set(items.map(i => i.pacienteNome)).size}</div>
          <div className="text-xs text-gray-600">Pacientes</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700">
          <span>📄</span> Novo Acto Clínico
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-10 text-center text-gray-500">A carregar…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Nenhum acto clínico.</div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {filtered.map(r => (
                <button key={r.id} onClick={() => setDetalhe(r)}
                  className={`w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-blue-50/50 transition-colors ${detalhe?.id === r.id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}>
                  <div className="text-2xl">📄</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{r.pacienteNome}</div>
                    <div className="text-xs text-gray-500 truncate">{r.diagnostico || r.resumo || "Acto clínico"}</div>
                  </div>
                  <div className="text-xs text-gray-500">{r.data}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {!detalhe ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              <div className="text-4xl mb-2">📄</div>
              <p>Seleccione um acto clínico</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-transparent">
                <div className="font-bold text-sm">{detalhe.pacienteNome}</div>
                <div className="text-xs text-gray-500">{detalhe.data} {detalhe.hora}</div>
                <div className="text-xs text-gray-500 mt-1">👨‍⚕️ {detalhe.medico}</div>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
                {detalhe.diagnostico && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Diagnóstico</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{detalhe.diagnostico}</p>
                  </div>
                )}
                {detalhe.resumo && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Resumo</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-line">{detalhe.resumo}</p>
                  </div>
                )}
                {detalhe.procedimentos && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Procedimentos</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-line">{detalhe.procedimentos}</p>
                  </div>
                )}
                {detalhe.materiais && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Materiais</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{detalhe.materiais}</p>
                  </div>
                )}
                {detalhe.observacoes && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Observações</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-line">{detalhe.observacoes}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button onClick={() => handlePrint(detalhe)}
                    className="flex-1 bg-blue-600 text-white rounded-lg text-xs py-2 font-semibold hover:bg-blue-700">🖨️ Imprimir</button>
                  <button onClick={() => setDeleteId(detalhe.id)}
                    className="flex-1 border border-red-200 rounded-lg text-xs py-2 text-red-600 hover:bg-red-50 font-semibold">🗑️ Eliminar</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <Modal open={showForm} onClose={() => setShowForm(false)} title="Novo Acto Clínico" icon="📄">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Paciente *</label>
                  <input value={form.pacienteNome} onChange={e => setForm(f => ({ ...f, pacienteNome: e.target.value }))} className={inp} required />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inp}>
                    <option value="consulta">🩺 Consulta</option>
                    <option value="procedimento">✂️ Procedimento</option>
                    <option value="cirurgia">🏥 Cirurgia</option>
                    <option value="urgencia">🚨 Urgência</option>
                    <option value="outro">📋 Outro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Data</label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} className={inp} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Diagnóstico</label>
                  <textarea value={form.diagnostico} onChange={e => setForm(f => ({ ...f, diagnostico: e.target.value }))} className={inp + " resize-none"} rows={2} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Resumo Clínico</label>
                  <textarea value={form.resumo} onChange={e => setForm(f => ({ ...f, resumo: e.target.value }))} className={inp + " resize-none"} rows={3} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Procedimentos Realizados</label>
                  <textarea value={form.procedimentos} onChange={e => setForm(f => ({ ...f, procedimentos: e.target.value }))} className={inp + " resize-none"} rows={2} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Materiais Utilizados</label>
                  <input value={form.materiais} onChange={e => setForm(f => ({ ...f, materiais: e.target.value }))} className={inp} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Observações</label>
                  <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} className={inp + " resize-none"} rows={2} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700">✅ Registar</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 border border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
    </>
  );
}

// ==================== RELATÓRIOS MÉDICO ====================
function RelatoriosMedicoModule({ session, setMsg }: ModuleProps) {
  const [consultas, setConsultas] = useState<any[]>([]);
  const [prescricoes, setPrescricoes] = useState<any[]>([]);
  const [actos, setActos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState<"hoje" | "semana" | "mes" | "todos">("mes");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p, a, pac] = await Promise.all([
        api.consultas.list(), api.prescricoesMed.list(),
        api.actosClinicos.list(), api.pacientes.list()
      ]);
      setConsultas(c); setPrescricoes(p); setActos(a); setPacientes(pac);
    } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function filterByPeriod(items: any[], dateField = "data") {
    if (periodo === "todos") return items;
    const now = new Date();
    return items.filter(i => {
      const d = new Date(i[dateField]);
      if (periodo === "hoje") return d.toDateString() === now.toDateString();
      if (periodo === "semana") {
        const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      }
      if (periodo === "mes") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true;
    });
  }

  const c = filterByPeriod(consultas);
  const p = filterByPeriod(prescricoes);
  const a = filterByPeriod(actos);

  const dados7dias = useMemo(() => {
    const dias = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      dias.push({
        dia: d.toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit" }),
        consultas: consultas.filter(x => x.data === ds).length,
        prescricoes: prescricoes.filter(x => x.data === ds).length,
        actos: actos.filter(x => x.data === ds).length,
      });
    }
    return dias;
  }, [consultas, prescricoes, actos]);

  const porTipo = useMemo(() => {
    const ct: any = {};
    c.forEach(r => { ct[r.tipo] = (ct[r.tipo] || 0) + 1; });
    return Object.entries(TIPO_CONSULTA).map(([k, v]) => ({
      name: v.label, value: ct[k] || 0,
      fill: k === "urgencia" ? "#ef4444" : k === "primeira" ? "#3b82f6" : k === "seguimento" ? "#22c55e" : k === "retorno" ? "#f59e0b" : "#a855f7"
    }));
  }, [c]);

  function exportCSV() {
    const rows = [["Tipo", "Data", "Paciente", "Detalhes"]];
    consultas.forEach(r => rows.push(["Consulta", r.data, r.pacienteNome, r.diagnostico || r.motivo || ""]));
    prescricoes.forEach(r => rows.push(["Prescrição", r.data, r.pacienteNome, `${r.medicamentos?.length || 0} meds`]));
    actos.forEach(r => rows.push(["Acto Clínico", r.data, r.pacienteNome, r.diagnostico || ""]));
    const csv = rows.map(r => r.map(c => `"${(c || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `relatorio_medico_${today()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setMsg({ text: "Relatório exportado.", ok: true });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-bold flex items-center gap-2">📈 Relatórios Médicos</h3>
        <div className="flex gap-2">
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            {(["hoje", "semana", "mes", "todos"] as const).map(p => (
              <button key={p} onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 text-xs font-semibold capitalize ${periodo === p ? "bg-blue-600 text-white" : "bg-white"}`}>
                {p === "hoje" ? "Hoje" : p === "semana" ? "Semana" : p === "mes" ? "Mês" : "Todos"}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700">
            📥 Exportar CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-500">A carregar…</div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Consultas", value: c.length, icon: "🩺", cor: "text-blue-600", bg: "bg-blue-50" },
              { label: "Prescrições", value: p.length, icon: "📝", cor: "text-purple-600", bg: "bg-purple-50" },
              { label: "Actos Clínicos", value: a.length, icon: "📄", cor: "text-amber-600", bg: "bg-amber-50" },
              { label: "Pacientes", value: pacientes.length, icon: "👥", cor: "text-green-600", bg: "bg-green-50" },
              { label: "Meds Prescritos", value: p.reduce((a, x) => a + (x.medicamentos?.length || 0), 0), icon: "💊", cor: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Concluídas", value: c.filter(x => x.estado === "concluida").length, icon: "✓", cor: "text-emerald-600", bg: "bg-emerald-50" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border border-gray-200 rounded-xl p-3 text-center`}>
                <div className="text-xl mb-1">{s.icon}</div>
                <div className={`text-xl font-black ${s.cor}`}>{s.value}</div>
                <div className="text-[10px] text-gray-600">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">📊 Actividade - 7 dias</h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dados7dias}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="consultas" stroke="#3b82f6" strokeWidth={2} name="Consultas" />
                  <Line type="monotone" dataKey="prescricoes" stroke="#a855f7" strokeWidth={2} name="Prescrições" />
                  <Line type="monotone" dataKey="actos" stroke="#f59e0b" strokeWidth={2} name="Actos" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">🩺 Consultas por Tipo</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porTipo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Quantidade">
                    {porTipo.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm lg:col-span-2">
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">📋 Resumo de Produtividade</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">👥</div>
                  <div className="text-xl font-black text-blue-600">{new Set(c.map(x => x.pacienteNome)).size}</div>
                  <div className="text-[10px] text-gray-600">Pacientes atendidos</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">⏱️</div>
                  <div className="text-xl font-black text-green-600">
                    {c.length > 0 ? Math.round(c.reduce((a, x) => a + (x.duracao || 30), 0) / c.length) : 0}min
                  </div>
                  <div className="text-[10px] text-gray-600">Tempo médio</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">💊</div>
                  <div className="text-xl font-black text-purple-600">
                    {p.length > 0 ? (p.reduce((a, x) => a + (x.medicamentos?.length || 0), 0) / p.length).toFixed(1) : 0}
                  </div>
                  <div className="text-[10px] text-gray-600">Meds/prescrição</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">📈</div>
                  <div className="text-xl font-black text-amber-600">
                    {c.length > 0 ? Math.round((c.filter(x => x.estado === "concluida").length / c.length) * 100) : 0}%
                  </div>
                  <div className="text-[10px] text-gray-600">Taxa conclusão</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
