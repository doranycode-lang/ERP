import { api as mainApi } from "../store/api";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";

// ==================== MOCK API (localStorage) ====================
const store = {
  get: (k) => JSON.parse(localStorage.getItem(k) || "[]"),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};
let idCounter = Date.now();
const nextId = () => ++idCounter;

const mockApi = {
  triagem: {
    list: () => Promise.resolve(store.get("triagem")),
    create: (d) => { const all = store.get("triagem"); const item = { ...d, id: nextId(), estado: d.estado || "aguarda" }; all.push(item); store.set("triagem", all); return Promise.resolve(item); },
    update: (id, d) => { const all = store.get("triagem").map(x => x.id === id ? { ...x, ...d } : x); store.set("triagem", all); return Promise.resolve(); },
    delete: (id) => { store.set("triagem", store.get("triagem").filter(x => x.id !== id)); return Promise.resolve(); },
  },
  medicamentos: {
    list: () => Promise.resolve(store.get("medicamentos")),
    create: (d) => { const all = store.get("medicamentos"); const item = { ...d, id: nextId() }; all.push(item); store.set("medicamentos", all); return Promise.resolve(item); },
    update: (id, d) => { const all = store.get("medicamentos").map(x => x.id === id ? { ...x, ...d } : x); store.set("medicamentos", all); return Promise.resolve(); },
    delete: (id) => { store.set("medicamentos", store.get("medicamentos").filter(x => x.id !== id)); return Promise.resolve(); },
  },
  dispensacoes: {
    list: () => Promise.resolve(store.get("dispensacoes")),
    create: (d) => { const all = store.get("dispensacoes"); const item = { ...d, id: nextId() }; all.push(item); store.set("dispensacoes", all); return Promise.resolve(item); },
    delete: (id) => { store.set("dispensacoes", store.get("dispensacoes").filter(x => x.id !== id)); return Promise.resolve(); },
  },
  imagiologia: {
    list: () => Promise.resolve(store.get("imagiologia")),
    create: (d) => { const all = store.get("imagiologia"); const item = { ...d, id: nextId(), estado: d.estado || "pendente" }; all.push(item); store.set("imagiologia", all); return Promise.resolve(item); },
    update: (id, d) => { const all = store.get("imagiologia").map(x => x.id === id ? { ...x, ...d } : x); store.set("imagiologia", all); return Promise.resolve(); },
    delete: (id) => { store.set("imagiologia", store.get("imagiologia").filter(x => x.id !== id)); return Promise.resolve(); },
  },
  solicitacoes: {
    list: () => Promise.resolve(store.get("solicitacoes")),
    create: (d) => { const all = store.get("solicitacoes"); const item = { ...d, id: String(nextId()), estado: d.estado || "pendente" }; all.push(item); store.set("solicitacoes", all); return Promise.resolve(item); },
    update: (id, d) => { const all = store.get("solicitacoes").map(x => x.id === id ? { ...x, ...d } : x); store.set("solicitacoes", all); return Promise.resolve(); },
    delete: (id) => { store.set("solicitacoes", store.get("solicitacoes").filter(x => x.id !== id)); return Promise.resolve(); },
  },
  reagentes: {
    list: () => Promise.resolve(store.get("reagentes")),
    create: (d) => { const all = store.get("reagentes"); const item = { ...d, id: nextId() }; all.push(item); store.set("reagentes", all); return Promise.resolve(item); },
    update: (id, d) => { const all = store.get("reagentes").map(x => x.id === id ? { ...x, ...d } : x); store.set("reagentes", all); return Promise.resolve(); },
    delete: (id) => { store.set("reagentes", store.get("reagentes").filter(x => x.id !== id)); return Promise.resolve(); },
  },
  stockMovimentos: {
    list: () => Promise.resolve(store.get("stockMovimentos")),
    create: (d) => { const all = store.get("stockMovimentos"); const item = { ...d, id: nextId() }; all.push(item); store.set("stockMovimentos", all); return Promise.resolve(item); },
  },
  pacientes: {
    list: () => Promise.resolve(store.get("pacientes")),
    create: (d) => { const all = store.get("pacientes"); const item = { ...d, id: nextId() }; all.push(item); store.set("pacientes", all); return Promise.resolve(item); },
  },
  agenda: {
    list: () => Promise.resolve(store.get("agenda")),
    create: (d) => { const all = store.get("agenda"); const item = { ...d, id: nextId() }; all.push(item); store.set("agenda", all); return Promise.resolve(item); },
    update: (id, d) => { const all = store.get("agenda").map(x => x.id === id ? { ...x, ...d } : x); store.set("agenda", all); return Promise.resolve(); },
    delete: (id) => { store.set("agenda", store.get("agenda").filter(x => x.id !== id)); return Promise.resolve(); },
  },
  prescricoes: {
    list: () => Promise.resolve(store.get("prescricoes")),
    create: (d) => { const all = store.get("prescricoes"); const item = { ...d, id: nextId() }; all.push(item); store.set("prescricoes", all); return Promise.resolve(item); },
    delete: (id) => { store.set("prescricoes", store.get("prescricoes").filter(x => x.id !== id)); return Promise.resolve(); },
  },
  transferencias: {
    list: () => Promise.resolve(store.get("transferencias")),
    create: (d) => { const all = store.get("transferencias"); const item = { ...d, id: nextId() }; all.push(item); store.set("transferencias", all); return Promise.resolve(item); },
  },
  notificacoes: {
    list: () => Promise.resolve(store.get("notificacoes")),
    create: (d) => { const all = store.get("notificacoes"); const item = { ...d, id: nextId(), lida: false }; all.push(item); store.set("notificacoes", all); return Promise.resolve(item); },
    update: (id, d) => { const all = store.get("notificacoes").map(x => x.id === id ? { ...x, ...d } : x); store.set("notificacoes", all); return Promise.resolve(); },
  },
};
const api = { ...mockApi, pacientes: mainApi.pacientes };

// ==================== SEED DATA ====================
function seedData() {
  if (store.get("medicamentos").length === 0) {
    store.set("medicamentos", [
      { id: 1, nome: "Paracetamol", dci: "Paracetamol", forma: "comprimido", dosagem: "500mg", unidade: "comprimidos", stock: 250, stockMinimo: 50, lote: "L2024-001", validade: "2026-12-31", fornecedor: "Pharma SA", preco: 0.15, controlado: false, ativo: true },
      { id: 2, nome: "Amoxicilina", dci: "Amoxicilina", forma: "capsula", dosagem: "500mg", unidade: "cápsulas", stock: 80, stockMinimo: 30, lote: "L2024-002", validade: "2026-08-15", fornecedor: "MediPlus", preco: 0.35, controlado: false, ativo: true },
      { id: 3, nome: "Morfina", dci: "Morfina sulfato", forma: "injetavel", dosagem: "10mg/ml", unidade: "ampolas", stock: 15, stockMinimo: 20, lote: "L2024-003", validade: "2025-11-20", fornecedor: "ControlPharma", preco: 5.50, controlado: true, ativo: true },
      { id: 4, nome: "Ibuprofeno", dci: "Ibuprofeno", forma: "comprimido", dosagem: "400mg", unidade: "comprimidos", stock: 180, stockMinimo: 40, lote: "L2024-004", validade: "2027-03-10", fornecedor: "Pharma SA", preco: 0.20, controlado: false, ativo: true },
    ]);
  }
  if (store.get("pacientes").length === 0) {
    store.set("pacientes", [
      { id: 1, nome: "Maria Silva", idade: 45, sexo: "F", telefone: "912345678", bi: "12345678", grupoSanguineo: "A+", alergias: "Penicilina", patologiasCronicas: "Hipertensão", medicacaoHabitual: "Losartana 50mg" },
      { id: 2, nome: "João Santos", idade: 62, sexo: "M", telefone: "923456789", bi: "23456789", grupoSanguineo: "O+", alergias: "", patologiasCronicas: "Diabetes Tipo 2", medicacaoHabitual: "Metformina 850mg" },
      { id: 3, nome: "Ana Costa", idade: 28, sexo: "F", telefone: "934567890", bi: "34567890", grupoSanguineo: "B-", alergias: "Látex", patologiasCronicas: "", medicacaoHabitual: "" },
    ]);
  }
  if (store.get("reagentes").length === 0) {
    store.set("reagentes", [
      { id: 1, codigo: "MAT-001", nome: "Seringas 5ml", categoria: "Material", tipo: "material", unidade: "unidades", quantidadeAtual: 500, quantidadeMinima: 100, lote: "L2024-S1", validade: "2027-06-30", fornecedor: "MedSupply", localizacao: "Armazém A", ativo: true },
      { id: 2, codigo: "MAT-002", nome: "Luvas descartáveis M", categoria: "Consumível", tipo: "material", unidade: "pares", quantidadeAtual: 45, quantidadeMinima: 100, lote: "L2024-L1", validade: "2026-12-31", fornecedor: "MedSupply", localizacao: "Armazém A", ativo: true },
      { id: 3, codigo: "REA-001", nome: "Reagente Glicemia", categoria: "Reagente", tipo: "reagente", unidade: "testes", quantidadeAtual: 200, quantidadeMinima: 50, lote: "L2024-R1", validade: "2026-09-15", fornecedor: "LabSupply", localizacao: "Laboratório", ativo: true },
    ]);
  }
}

// ==================== TYPES ====================
const PRIORIDADE = {
  emergencia:  { label: "Emergência",  dot: "bg-red-500",    badge: "bg-red-100 text-red-700 border border-red-300", icon: "🚨" },
  urgente:     { label: "Urgente",     dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700 border border-orange-300", icon: "⚠️" },
  normal:      { label: "Normal",      dot: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-700 border border-yellow-300", icon: "📋" },
  nao_urgente: { label: "Não urgente", dot: "bg-green-500",  badge: "bg-green-100 text-green-700 border border-green-300", icon: "✅" },
};
const ESTADO_TRIAGEM = {
  aguarda:        { label: "Aguarda",        badge: "bg-blue-100 text-blue-700", icon: "⏳" },
  em_atendimento: { label: "Em atendimento", badge: "bg-amber-100 text-amber-700", icon: "🏥" },
  concluido:      { label: "Concluído",      badge: "bg-green-100 text-green-700", icon: "✓" },
};
const ESTADO_IMAGIOLOGIA = {
  pendente:      { label: "Pendente",      badge: "bg-gray-100 text-gray-700", icon: "⏸️" },
  em_progresso:  { label: "Em progresso",  badge: "bg-blue-100 text-blue-700", icon: "🔄" },
  concluido:     { label: "Concluído",     badge: "bg-green-100 text-green-700", icon: "✓" },
  cancelado:     { label: "Cancelado",     badge: "bg-red-100 text-red-700", icon: "✕" },
};
const ESTADO_SOLICITACAO = {
  pendente:         { label: "Pendente",         badge: "bg-gray-100 text-gray-700", icon: "⏸️" },
  em_processamento: { label: "Em processamento", badge: "bg-blue-100 text-blue-700", icon: "🔄" },
  concluido:        { label: "Concluído",        badge: "bg-green-100 text-green-700", icon: "✓" },
  cancelado:        { label: "Cancelado",        badge: "bg-red-100 text-red-700", icon: "✕" },
};
const TIPOS_PROCEDIMENTO = {
  curativo:         { label: "Curativo",         icon: "🩹" },
  inalacao:         { label: "Inalação",         icon: "💨" },
  nebulizacao:      { label: "Nebulização",      icon: "🌫️" },
  retirada_pontos:  { label: "Retirada de Pontos", icon: "🪡" },
  pensamento:       { label: "Pensamento",       icon: "💉" },
  colheita:         { label: "Colheita",         icon: "🧪" },
  outro:            { label: "Outro",            icon: "📋" },
};
const TIPOS_VACINA = {
  bcg: "BCG", hepatite_b: "Hepatite B", pentavalente: "Pentavalente", vip: "VIP",
  rotavirus: "Rotavírus", pneumo: "Pneumocócica", mena: "Meningocócica", sarampo: "Sarampo",
  covid19: "COVID-19", gripe: "Gripe", td: "Td/Tdap", hpv: "HPV", outra: "Outra",
};
const TIPOS_VISITA = {
  rotina: { label: "Rotina", icon: "🏠" },
  urgencia: { label: "Urgência", icon: "🚑" },
  pos_operatorio: { label: "Pós-Operatório", icon: "🛏️" },
  cronicos: { label: "Crónicos", icon: "📋" },
  puerperio: { label: "Puerpério", icon: "🤱" },
  outro: { label: "Outro", icon: "📝" },
};
const TIPOS_AGENDA = {
  consulta: { label: "Consulta", icon: "🩺", color: "bg-blue-100 text-blue-700" },
  curativo: { label: "Curativo", icon: "🩹", color: "bg-green-100 text-green-700" },
  vacina: { label: "Vacina", icon: "💉", color: "bg-purple-100 text-purple-700" },
  exame: { label: "Exame", icon: "🧪", color: "bg-amber-100 text-amber-700" },
  retorno: { label: "Retorno", icon: "🔄", color: "bg-orange-100 text-orange-700" },
  outro: { label: "Outro", icon: "📋", color: "bg-gray-100 text-gray-700" },
};

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "triagem", label: "Triagem", icon: "💉" },
  { id: "medicamentos", label: "Medicamentos", icon: "💊" },
  { id: "dispensacoes", label: "Dispensações", icon: "📦" },
  { id: "procedimentos", label: "Procedimentos", icon: "🩹" },
  { id: "vacinas", label: "Vacinação", icon: "💉" },
  { id: "imagiologia", label: "Imagiologia", icon: "🩻" },
  { id: "solicitacoes", label: "Solicitações", icon: "📋" },
  { id: "stock", label: "Stock", icon: "📊" },
  { id: "agenda", label: "Agenda", icon: "📅" },
  { id: "prescricoes", label: "Prescrições", icon: "📝" },
  { id: "transferencias", label: "Transferências", icon: "🚑" },
  { id: "acompanhamento", label: "Acompanhamento", icon: "👥" },
  { id: "visitas", label: "Visitas", icon: "🏠" },
  { id: "relatorios", label: "Relatórios", icon: "📈" },
];

const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all bg-white";
const lbl = "text-xs font-medium text-gray-600";

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toTimeString().slice(0, 5);
const num = (v) => v ? parseFloat(v) : null;
const numI = (v) => v ? parseInt(v) : null;

// ==================== MAIN COMPONENT ====================
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [msg, setMsg] = useState(null);
  const [session] = useState({ funcionarioNome: "Enf. Maria Lopes", username: "enfermagem" });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => { seedData(); }, []);
  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  const props = { session, setMsg };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 70 }}
        className="bg-white border-r border-gray-200 shadow-sm flex flex-col sticky top-0 h-screen overflow-hidden"
      >
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">🏥</div>
          {sidebarOpen && <div>
            <div className="font-bold text-sm text-gray-800">Enfermagem</div>
            <div className="text-[10px] text-gray-500">Sistema de Gestão</div>
          </div>}
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-base flex-shrink-0">{tab.icon}</span>
              {sidebarOpen && <span className="truncate">{tab.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-200">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                <span>🏥</span> {TABS.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Gestão completa de cuidados de enfermagem</p>
            </div>
            <div className="flex items-center gap-2">
              <NotificacoesBell />
              <div className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                👤 {session.funcionarioNome}
              </div>
            </div>
          </motion.div>

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

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "dashboard" && <DashboardModule {...props} />}
              {activeTab === "triagem" && <TriagemModule {...props} />}
              {activeTab === "medicamentos" && <MedicamentosModule {...props} />}
              {activeTab === "dispensacoes" && <DispensacoesModule {...props} />}
              {activeTab === "procedimentos" && <ProcedimentosModule {...props} />}
              {activeTab === "vacinas" && <VacinasModule {...props} />}
              {activeTab === "imagiologia" && <ImagiologiaModule {...props} />}
              {activeTab === "solicitacoes" && <SolicitacoesModule {...props} />}
              {activeTab === "stock" && <StockModule {...props} />}
              {activeTab === "agenda" && <AgendaModule {...props} />}
              {activeTab === "prescricoes" && <PrescricoesModule {...props} />}
              {activeTab === "transferencias" && <TransferenciasModule {...props} />}
              {activeTab === "acompanhamento" && <AcompanhamentoModule {...props} />}
              {activeTab === "visitas" && <VisitasModule {...props} />}
              {activeTab === "relatorios" && <RelatoriosModule {...props} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ==================== NOTIFICAÇÕES BELL (NOVO) ====================
function NotificacoesBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    const meds = await api.medicamentos.list();
    const reag = await api.reagentes.list();
    const agenda = await api.agenda.list();
    const todayStr = today();
    const alerts = [];
    meds.filter(m => m.ativo && m.stock <= m.stockMinimo).forEach(m => {
      alerts.push({ id: "med-" + m.id, tipo: "stock", icon: "💊", titulo: "Stock Baixo", msg: `${m.nome}: ${m.stock}/${m.stockMinimo}`, cor: "text-amber-600 bg-amber-50" });
    });
    reag.filter(r => r.ativo && r.quantidadeAtual <= r.quantidadeMinima).forEach(r => {
      alerts.push({ id: "rea-" + r.id, tipo: "stock", icon: "📦", titulo: "Stock Crítico", msg: `${r.nome}: ${r.quantidadeAtual}/${r.quantidadeMinima}`, cor: "text-red-600 bg-red-50" });
    });
    agenda.filter(a => a.data === todayStr && a.estado === "agendada").forEach(a => {
      alerts.push({ id: "age-" + a.id, tipo: "agenda", icon: "📅", titulo: "Hoje", msg: `${a.hora} - ${a.pacienteNome} (${a.tipo})`, cor: "text-blue-600 bg-blue-50" });
    });
    setItems(alerts);
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 shadow-sm">
        🔔
        {items.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{items.length}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div className="font-bold text-sm">Notificações</div>
              <div className="text-[10px] text-gray-500">{items.length} alertas activos</div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">✅ Sem alertas</div>
              ) : items.map(a => (
                <div key={a.id} className={`px-4 py-2.5 border-b border-gray-100 ${a.cor}`}>
                  <div className="flex items-center gap-2">
                    <span>{a.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold">{a.titulo}</div>
                      <div className="text-[11px] opacity-80">{a.msg}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== MODAL WRAPPER ====================
function Modal({ open, onClose, title, icon, children, maxWidth = "max-w-2xl" }) {
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

function ConfirmDelete({ open, onClose, onConfirm }) {
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

// ==================== DASHBOARD (NOVO) ====================
function DashboardModule({ session, setMsg }) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [t, m, d, i, s, r, a, p, ag] = await Promise.all([
        api.triagem.list(), api.medicamentos.list(), api.dispensacoes.list(),
        api.imagiologia.list(), api.solicitacoes.list(), api.reagentes.list(),
        api.pacientes.list(), api.prescricoes.list(), api.agenda.list()
      ]);
      const todayStr = today();
      setStats({
        triagens: t, medicamentos: m, dispensacoes: d, imagiologia: i,
        solicitacoes: s, reagentes: r, pacientes: p, prescricoes: p2 => p2,
        hoje: {
          triagens: t.filter(x => x.data === todayStr).length,
          dispensacoes: d.filter(x => x.data === todayStr).length,
          agenda: ag.filter(x => x.data === todayStr).length,
        },
        aguarda: t.filter(x => x.estado === "aguarda").length,
        emergencia: t.filter(x => x.prioridade === "emergencia" && x.estado !== "concluido").length,
        stockCritico: r.filter(x => x.ativo && x.quantidadeAtual <= x.quantidadeMinima).length,
        medsBaixo: m.filter(x => x.ativo && x.stock <= x.stockMinimo).length,
        totalPacientes: p.length,
      });
      setLoading(false);
    })();
  }, []);

  const dadosPrioridade = useMemo(() => {
    if (!stats.triagens) return [];
    const c = {};
    stats.triagens.forEach(t => { c[t.prioridade] = (c[t.prioridade] || 0) + 1; });
    return Object.entries(PRIORIDADE).map(([k, v]) => ({ name: v.label, value: c[k] || 0, color: k === "emergencia" ? "#ef4444" : k === "urgente" ? "#f97316" : k === "normal" ? "#facc15" : "#22c55e" }));
  }, [stats.triagens]);

  const dados7dias = useMemo(() => {
    if (!stats.triagens) return [];
    const dias = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      dias.push({
        dia: d.toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit" }),
        triagens: stats.triagens.filter(t => t.data === ds).length,
      });
    }
    return dias;
  }, [stats.triagens]);

  if (loading) return <div className="py-20 text-center text-gray-500">A carregar dashboard...</div>;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs opacity-80">Bom dia,</div>
            <div className="text-2xl font-bold">{session.funcionarioNome}</div>
            <div className="text-xs opacity-80 mt-1">{new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-black">{stats.hoje?.triagens || 0}</div>
              <div className="text-[10px] opacity-80">Triagens Hoje</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-black">{stats.aguarda}</div>
              <div className="text-[10px] opacity-80">A Aguardar</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-black text-red-300">{stats.emergencia}</div>
              <div className="text-[10px] opacity-80">Emergências</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Pacientes", value: stats.totalPacientes, icon: "👥", cor: "text-blue-600", bg: "from-blue-50 to-blue-100/50" },
          { label: "Triagens Hoje", value: stats.hoje?.triagens || 0, icon: "💉", cor: "text-primary", bg: "from-primary/5 to-primary/10" },
          { label: "Dispensações", value: stats.hoje?.dispensacoes || 0, icon: "📦", cor: "text-purple-600", bg: "from-purple-50 to-purple-100/50" },
          { label: "Agenda Hoje", value: stats.hoje?.agenda || 0, icon: "📅", cor: "text-green-600", bg: "from-green-50 to-green-100/50" },
          { label: "Stock Crítico", value: stats.stockCritico, icon: "⚠️", cor: "text-red-600", bg: "from-red-50 to-red-100/50" },
          { label: "Meds Stock Baixo", value: stats.medsBaixo, icon: "💊", cor: "text-amber-600", bg: "from-amber-50 to-amber-100/50" },
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
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">📈 Triagens - Últimos 7 dias</h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dados7dias}>
              <defs>
                <linearGradient id="colorT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="triagens" stroke="#3b82f6" fillOpacity={1} fill="url(#colorT)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">🚦 Distribuição por Prioridade</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dadosPrioridade} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                {dadosPrioridade.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h4 className="text-sm font-bold mb-3">⚡ Acções Rápidas</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {[
            { icon: "💉", label: "Nova Triagem", tab: "triagem" },
            { icon: "📦", label: "Dispensar", tab: "dispensacoes" },
            { icon: "📅", label: "Agendar", tab: "agenda" },
            { icon: "💊", label: "Medicamentos", tab: "medicamentos" },
            { icon: "🩻", label: "Imagiologia", tab: "imagiologia" },
            { icon: "📋", label: "Solicitar Exame", tab: "solicitacoes" },
          ].map(a => (
            <button key={a.tab} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-blue-300 hover:shadow-md rounded-lg p-3 text-center transition-all">
              <div className="text-2xl mb-1">{a.icon}</div>
              <div className="text-xs font-semibold text-gray-700">{a.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== 1. TRIAGEM ====================
function TriagemModule({ session, setMsg }) {
  const [registos, setRegistos] = useState([]);
  const emptyForm = {
    pacienteNome: "", pacienteIdade: "", queixa: "",
    temperatura: "", pressaoSistolica: "", pressaoDiastolica: "",
    frequenciaCardiaca: "", frequenciaRespiratoria: "",
    saturacaoO2: "", glicemia: "", peso: "", altura: "",
    prioridade: "normal", notas: "", data: today(), hora: now(),
  };
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterPrioridade, setFilterPrioridade] = useState("");
  const [detalhe, setDetalhe] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRegistos(await api.triagem.list()); } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm({ ...emptyForm, data: today(), hora: now() }); setEditId(null); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.pacienteNome.trim() || !form.queixa.trim()) { setMsg({ text: "Nome e queixa são obrigatórios.", ok: false }); return; }
    try {
      const payload = {
        ...form, registadoPor: session.funcionarioNome || session.username,
        temperatura: num(form.temperatura), pressaoSistolica: numI(form.pressaoSistolica),
        pressaoDiastolica: numI(form.pressaoDiastolica), frequenciaCardiaca: numI(form.frequenciaCardiaca),
        frequenciaRespiratoria: numI(form.frequenciaRespiratoria), saturacaoO2: num(form.saturacaoO2),
        glicemia: num(form.glicemia), peso: num(form.peso), altura: num(form.altura),
      };
      if (editId) { await api.triagem.update(editId, payload); setMsg({ text: "Triagem actualizada.", ok: true }); }
      else { await api.triagem.create(payload); setMsg({ text: "Triagem registada.", ok: true }); }
      resetForm(); setShowForm(false); await load();
    } catch (err) { setMsg({ text: err.message || "Erro ao guardar.", ok: false }); }
  }

  async function updateEstado(id, estado) {
    try {
      await api.triagem.update(id, { estado });
      setMsg({ text: `Estado: ${ESTADO_TRIAGEM[estado].label}`, ok: true });
      await load();
    } catch { setMsg({ text: "Erro ao actualizar.", ok: false }); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await api.triagem.delete(deleteId); setDetalhe(null); setDeleteId(null); setMsg({ text: "Registo eliminado.", ok: true }); await load(); }
    catch { setMsg({ text: "Erro ao eliminar.", ok: false }); }
  }

  const filtered = useMemo(() => registos.filter(r =>
    (!search || r.pacienteNome.toLowerCase().includes(search.toLowerCase())) &&
    (!filterEstado || r.estado === filterEstado) &&
    (!filterPrioridade || r.prioridade === filterPrioridade)
  ), [registos, search, filterEstado, filterPrioridade]);

  const counts = useMemo(() => registos.reduce((a, r) => ({
    ...a, total: a.total + 1,
    emergencia: a.emergencia + (r.prioridade === "emergencia" ? 1 : 0),
    urgente: a.urgente + (r.prioridade === "urgente" ? 1 : 0),
    aguarda: a.aguarda + (r.estado === "aguarda" ? 1 : 0),
  }), { total: 0, emergencia: 0, urgente: 0, aguarda: 0 }), [registos]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total", value: counts.total, cor: "text-blue-600", icon: "📊", bg: "from-blue-50 to-blue-100/50" },
          { label: "A aguardar", value: counts.aguarda, cor: "text-blue-600", icon: "⏳", bg: "from-blue-50 to-blue-100/50" },
          { label: "Urgentes", value: counts.urgente, cor: "text-orange-600", icon: "⚠️", bg: "from-orange-50 to-orange-100/50" },
          { label: "Emergências", value: counts.emergencia, cor: "text-red-600", icon: "🚨", bg: "from-red-50 to-red-100/50" },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} border border-gray-200 rounded-xl p-4 text-center shadow-sm`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-black ${s.cor}`}>{s.value}</div>
            <div className="text-xs text-gray-600 mt-0.5 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-3">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
          <span>💉</span> Nova Triagem
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-2 flex-wrap bg-gradient-to-r from-gray-50 to-white">
            <span className="text-sm font-bold">📋 Registos ({filtered.length})</span>
            <select value={filterPrioridade} onChange={e => setFilterPrioridade(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white">
              <option value="">Todas prioridades</option>
              {Object.entries(PRIORIDADE).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white">
              <option value="">Todos estados</option>
              {Object.entries(ESTADO_TRIAGEM).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..."
              className="ml-auto border border-gray-300 rounded-lg px-3 py-1 text-xs w-36" />
          </div>
          {loading ? (
            <div className="py-10 text-center text-gray-500 text-sm">A carregar…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              {registos.length === 0 ? "Nenhuma triagem registada." : "Nenhum resultado."}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
              {filtered.map(r => {
                const pc = PRIORIDADE[r.prioridade];
                const ec = ESTADO_TRIAGEM[r.estado];
                return (
                  <button key={r.id} onClick={() => setDetalhe(r)}
                    className={`w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-blue-50/50 transition-colors ${detalhe?.id === r.id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${pc?.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{r.pacienteNome}</div>
                      <div className="text-xs text-gray-500 truncate">{r.queixa}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${pc?.badge}`}>{pc?.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ec?.badge}`}>{ec?.label}</span>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{r.hora}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {!detalhe ? (
            <div className="py-16 text-center text-gray-500 text-sm px-4">
              <div className="text-4xl mb-2">💉</div>
              <p>Seleccione um registo</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-transparent">
                <div>
                  <div className="font-bold text-sm">{detalhe.pacienteNome}</div>
                  <div className="text-xs text-gray-500">{detalhe.data} · {detalhe.hora}</div>
                </div>
                <button onClick={() => setDetalhe(null)} className="text-gray-400 hover:text-gray-700">✕</button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto max-h-[600px]">
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${PRIORIDADE[detalhe.prioridade]?.badge}`}>
                    {PRIORIDADE[detalhe.prioridade]?.icon} {PRIORIDADE[detalhe.prioridade]?.label}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ESTADO_TRIAGEM[detalhe.estado]?.badge}`}>
                    {ESTADO_TRIAGEM[detalhe.estado]?.icon} {ESTADO_TRIAGEM[detalhe.estado]?.label}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">💬 Queixa Principal</div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detalhe.queixa}</p>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">❤️ Sinais Vitais</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Temperatura", value: detalhe.temperatura, unit: "°C" },
                      { label: "Pressão", value: detalhe.pressaoSistolica ? `${detalhe.pressaoSistolica}/${detalhe.pressaoDiastolica}` : null, unit: "mmHg" },
                      { label: "FC", value: detalhe.frequenciaCardiaca, unit: "bpm" },
                      { label: "FR", value: detalhe.frequenciaRespiratoria, unit: "rpm" },
                      { label: "SpO₂", value: detalhe.saturacaoO2, unit: "%" },
                      { label: "Glicemia", value: detalhe.glicemia, unit: "mg/dL" },
                      { label: "Peso", value: detalhe.peso, unit: "kg" },
                      { label: "Altura", value: detalhe.altura, unit: "cm" },
                    ].map(sv => sv.value != null && sv.value !== "" && sv.value !== 0 && (
                      <div key={sv.label} className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-sm font-black text-gray-800">{sv.value}{sv.unit}</div>
                        <div className="text-[9px] font-semibold text-blue-600">{sv.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {detalhe.notas && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">📝 Notas</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-line">{detalhe.notas}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">🔄 Actualizar Estado</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {Object.keys(ESTADO_TRIAGEM).map(e => (
                      <button key={e} onClick={() => updateEstado(detalhe.id, e)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${detalhe.estado === e ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {ESTADO_TRIAGEM[e].icon} {ESTADO_TRIAGEM[e].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button onClick={() => {
                    setForm({
                      pacienteNome: detalhe.pacienteNome, pacienteIdade: detalhe.pacienteIdade || "", queixa: detalhe.queixa,
                      temperatura: detalhe.temperatura ?? "", pressaoSistolica: detalhe.pressaoSistolica ?? "",
                      pressaoDiastolica: detalhe.pressaoDiastolica ?? "", frequenciaCardiaca: detalhe.frequenciaCardiaca ?? "",
                      frequenciaRespiratoria: detalhe.frequenciaRespiratoria ?? "", saturacaoO2: detalhe.saturacaoO2 ?? "",
                      glicemia: detalhe.glicemia ?? "", peso: detalhe.peso ?? "", altura: detalhe.altura ?? "",
                      prioridade: detalhe.prioridade, notas: detalhe.notas || "", data: detalhe.data, hora: detalhe.hora,
                    });
                    setEditId(detalhe.id); setShowForm(true);
                  }} className="flex-1 border border-gray-300 rounded-lg text-xs py-2 text-gray-600 hover:bg-gray-50 font-semibold">✏️ Editar</button>
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
          <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Editar Triagem" : "Nova Triagem"} icon={editId ? "✏️" : "💉"}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">👤 Identificação</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className={lbl}>Nome do Paciente *</label>
                    <input value={form.pacienteNome} onChange={e => setForm(f => ({ ...f, pacienteNome: e.target.value }))} className={inp} required />
                  </div>
                  <div className="space-y-1">
                    <label className={lbl}>Idade</label>
                    <input value={form.pacienteIdade} onChange={e => setForm(f => ({ ...f, pacienteIdade: e.target.value }))} className={inp} />
                  </div>
                  <div className="space-y-1">
                    <label className={lbl}>Prioridade</label>
                    <select value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))} className={inp}>
                      {Object.entries(PRIORIDADE).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className={lbl}>Queixa Principal *</label>
                    <textarea value={form.queixa} onChange={e => setForm(f => ({ ...f, queixa: e.target.value }))} className={inp + " resize-none"} rows={2} required />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">❤️ Sinais Vitais</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Temp (°C)", key: "temperatura", step: "0.1" },
                    { label: "PA Sist (mmHg)", key: "pressaoSistolica" },
                    { label: "PA Dia (mmHg)", key: "pressaoDiastolica" },
                    { label: "FC (bpm)", key: "frequenciaCardiaca" },
                    { label: "FR (rpm)", key: "frequenciaRespiratoria" },
                    { label: "SpO₂ (%)", key: "saturacaoO2", step: "0.1" },
                    { label: "Glicemia", key: "glicemia" },
                    { label: "Peso (kg)", key: "peso", step: "0.1" },
                    { label: "Altura (cm)", key: "altura" },
                  ].map(({ label, key, step }) => (
                    <div key={key} className="space-y-1">
                      <label className={lbl}>{label}</label>
                      <input type="number" step={step || "1"} value={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inp} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className={lbl}>📝 Notas</label>
                <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} className={inp + " resize-none"} rows={3} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700">
                  {editId ? "💾 Guardar" : "✅ Registar"}
                </button>
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

// ==================== 2. MEDICAMENTOS ====================
function MedicamentosModule({ session, setMsg }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const emptyForm = {
    nome: "", dci: "", forma: "", dosagem: "", unidade: "unidades",
    stock: "", stockMinimo: "", lote: "", validade: "",
    fornecedor: "", preco: "", controlado: false, ativo: true,
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.medicamentos.list()); } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm(emptyForm); setEditId(null); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) { setMsg({ text: "Nome obrigatório.", ok: false }); return; }
    try {
      const payload = { ...form, stock: num(form.stock) ?? 0, stockMinimo: num(form.stockMinimo) ?? 0, preco: num(form.preco) ?? 0 };
      if (editId) { await api.medicamentos.update(editId, payload); setMsg({ text: "Medicamento actualizado.", ok: true }); }
      else { await api.medicamentos.create(payload); setMsg({ text: "Medicamento registado.", ok: true }); }
      resetForm(); setShowForm(false); await load();
    } catch (err) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await api.medicamentos.delete(deleteId); setDeleteId(null); setMsg({ text: "Eliminado.", ok: true }); await load(); }
    catch { setMsg({ text: "Erro.", ok: false }); }
  }

  const filtered = useMemo(() => items.filter(m =>
    !search || m.nome.toLowerCase().includes(search.toLowerCase()) || m.dci?.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  const stockBaixo = items.filter(m => m.ativo && m.stock <= m.stockMinimo).length;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">💊</div>
          <div className="text-2xl font-black text-blue-600">{items.filter(m => m.ativo).length}</div>
          <div className="text-xs text-gray-600">Activos</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">⚠️</div>
          <div className="text-2xl font-black text-red-600">{stockBaixo}</div>
          <div className="text-xs text-gray-600">Stock Baixo</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">🔒</div>
          <div className="text-2xl font-black text-amber-600">{items.filter(m => m.controlado).length}</div>
          <div className="text-xs text-gray-600">Controlados</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">📦</div>
          <div className="text-2xl font-black text-green-600">{items.length}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar medicamentos..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700">
          <span>💊</span> Novo Medicamento
        </motion.button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-gray-500">A carregar…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nenhum medicamento.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600">Nome</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600">DCI</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600">Forma</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs text-gray-600">Stock</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs text-gray-600">Validade</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs text-gray-600">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold text-xs text-gray-600">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(m => {
                  const baixo = m.ativo && m.stock <= m.stockMinimo;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold flex items-center gap-1">
                          {m.controlado && <span title="Controlado">🔒</span>}
                          {m.nome}
                        </div>
                        <div className="text-xs text-gray-500">{m.dosagem}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{m.dci || "-"}</td>
                      <td className="px-4 py-3 text-xs">{m.forma || "-"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${baixo ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {m.stock} {m.unidade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs">{m.validade || "-"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${m.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {m.ativo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setForm({
                          nome: m.nome, dci: m.dci || "", forma: m.forma || "", dosagem: m.dosagem || "",
                          unidade: m.unidade || "unidades", stock: m.stock?.toString() || "", stockMinimo: m.stockMinimo?.toString() || "",
                          lote: m.lote || "", validade: m.validade || "", fornecedor: m.fornecedor || "",
                          preco: m.preco?.toString() || "", controlado: m.controlado, ativo: m.ativo,
                        }); setEditId(m.id); setShowForm(true); }}
                          className="text-xs text-blue-600 hover:underline mr-2">✏️</button>
                        <button onClick={() => setDeleteId(m.id)} className="text-xs text-red-600 hover:underline">🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Editar Medicamento" : "Novo Medicamento"} icon={editId ? "✏️" : "💊"}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Nome *</label>
                  <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inp} required />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>DCI</label>
                  <input value={form.dci} onChange={e => setForm(f => ({ ...f, dci: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Dosagem</label>
                  <input value={form.dosagem} onChange={e => setForm(f => ({ ...f, dosagem: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Forma</label>
                  <select value={form.forma} onChange={e => setForm(f => ({ ...f, forma: e.target.value }))} className={inp}>
                    <option value="">-</option>
                    <option value="comprimido">Comprimido</option>
                    <option value="capsula">Cápsula</option>
                    <option value="xarope">Xarope</option>
                    <option value="injetavel">Injectável</option>
                    <option value="pomada">Pomada</option>
                    <option value="gotas">Gotas</option>
                    <option value="supositorio">Supositório</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Unidade</label>
                  <input value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Stock Actual</label>
                  <input type="number" step="0.01" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Stock Mínimo</label>
                  <input type="number" step="0.01" value={form.stockMinimo} onChange={e => setForm(f => ({ ...f, stockMinimo: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Lote</label>
                  <input value={form.lote} onChange={e => setForm(f => ({ ...f, lote: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Validade</label>
                  <input type="date" value={form.validade} onChange={e => setForm(f => ({ ...f, validade: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Fornecedor</label>
                  <input value={form.fornecedor} onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Preço</label>
                  <input type="number" step="0.01" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} className={inp} />
                </div>
                <div className="col-span-2 flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.controlado} onChange={e => setForm(f => ({ ...f, controlado: e.target.checked }))} />
                    🔒 Medicamento Controlado
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} />
                    Activo
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700">
                  {editId ? "💾 Guardar" : "✅ Registar"}
                </button>
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

// ==================== 3. DISPENSAÇÕES ====================
function DispensacoesModule({ session, setMsg }) {
  const [items, setItems] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const emptyForm = { pacienteNome: "", medico: "", observacoes: "", data: today(), hora: now() };
  const [form, setForm] = useState(emptyForm);
  const [itens, setItens] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, m] = await Promise.all([api.dispensacoes.list(), api.medicamentos.list()]);
      setItems(d); setMedicamentos(m.filter(x => x.ativo));
    } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm({ ...emptyForm, data: today(), hora: now() }); setItens([]); }
  function addItem() {
    if (medicamentos.length === 0) { setMsg({ text: "Sem medicamentos disponíveis.", ok: false }); return; }
    setItens([...itens, { medicamentoId: medicamentos[0].id, nome: medicamentos[0].nome, quantidade: 1, posologia: "" }]);
  }
  function updateItem(idx, field, value) {
    setItens(itens.map((it, i) => {
      if (i !== idx) return it;
      if (field === "medicamentoId") {
        const med = medicamentos.find(m => m.id === value);
        return { ...it, medicamentoId: value, nome: med?.nome || "" };
      }
      return { ...it, [field]: value };
    }));
  }
  function removeItem(idx) { setItens(itens.filter((_, i) => i !== idx)); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.pacienteNome.trim()) { setMsg({ text: "Nome obrigatório.", ok: false }); return; }
    if (itens.length === 0) { setMsg({ text: "Adicione pelo menos um medicamento.", ok: false }); return; }
    try {
      await api.dispensacoes.create({ ...form, itens, dispensadoPor: session.funcionarioNome || session.username });
      setMsg({ text: "Dispensação registada.", ok: true });
      resetForm(); setShowForm(false); await load();
    } catch (err) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await api.dispensacoes.delete(deleteId); setDeleteId(null); setMsg({ text: "Eliminada.", ok: true }); await load(); }
    catch { setMsg({ text: "Erro.", ok: false }); }
  }

  const filtered = useMemo(() => items.filter(r =>
    !search || r.pacienteNome.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">📦</div>
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
          <div className="text-2xl font-black text-purple-600">{items.reduce((a, i) => a + (i.itens?.length || 0), 0)}</div>
          <div className="text-xs text-gray-600">Itens dispensados</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700">
          <span>📦</span> Nova Dispensação
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-10 text-center text-gray-500">A carregar…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Nenhuma dispensação.</div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
              {filtered.map(r => (
                <button key={r.id} onClick={() => setDetalhe(r)}
                  className={`w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-blue-50/50 transition-colors ${detalhe?.id === r.id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}>
                  <div className="text-2xl">📦</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{r.pacienteNome}</div>
                    <div className="text-xs text-gray-500 truncate">Dr. {r.medico || "-"} · {r.itens?.length || 0} itens</div>
                  </div>
                  <div className="text-xs text-gray-500">{r.data} {r.hora}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {!detalhe ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              <div className="text-4xl mb-2">📦</div>
              <p>Seleccione uma dispensação</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-transparent">
                <div className="font-bold text-sm">{detalhe.pacienteNome}</div>
                <div className="text-xs text-gray-500">{detalhe.data} {detalhe.hora}</div>
                <div className="text-xs text-gray-500 mt-1">👨‍⚕️ Dr. {detalhe.medico || "-"}</div>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-2">💊 Medicamentos</div>
                  <div className="space-y-2">
                    {(detalhe.itens || []).map((it, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <div className="font-semibold text-sm">{it.nome}</div>
                        <div className="text-xs text-gray-500">Qtd: {it.quantidade} · {it.posologia || "Sem posologia"}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {detalhe.observacoes && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">📝 Observações</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{detalhe.observacoes}</p>
                  </div>
                )}
                <button onClick={() => setDeleteId(detalhe.id)}
                  className="w-full border border-red-200 rounded-lg text-xs py-2 text-red-600 hover:bg-red-50 font-semibold">🗑️ Eliminar</button>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova Dispensação" icon="📦" maxWidth="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Paciente *</label>
                  <input value={form.pacienteNome} onChange={e => setForm(f => ({ ...f, pacienteNome: e.target.value }))} className={inp} required />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Médico</label>
                  <input value={form.medico} onChange={e => setForm(f => ({ ...f, medico: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Data</label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} className={inp} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-blue-600 uppercase">💊 Medicamentos</p>
                  <button type="button" onClick={addItem} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">+ Adicionar</button>
                </div>
                {itens.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg">
                    Clique em "+ Adicionar" para incluir medicamentos
                  </div>
                ) : (
                  <div className="space-y-2">
                    {itens.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-gray-50 p-2 rounded-lg">
                        <div className="col-span-5 space-y-1">
                          <label className={lbl}>Medicamento</label>
                          <select value={it.medicamentoId} onChange={e => updateItem(idx, "medicamentoId", parseInt(e.target.value))} className={inp}>
                            {medicamentos.map(m => <option key={m.id} value={m.id}>{m.nome} (Stock: {m.stock})</option>)}
                          </select>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className={lbl}>Qtd</label>
                          <input type="number" min="1" value={it.quantidade} onChange={e => updateItem(idx, "quantidade", parseInt(e.target.value) || 1)} className={inp} />
                        </div>
                        <div className="col-span-4 space-y-1">
                          <label className={lbl}>Posologia</label>
                          <input value={it.posologia} onChange={e => updateItem(idx, "posologia", e.target.value)} className={inp} placeholder="Ex: 1 comp 8/8h" />
                        </div>
                        <div className="col-span-1">
                          <button type="button" onClick={() => removeItem(idx)} className="text-red-600 hover:bg-red-50 w-full py-2 rounded">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className={lbl}>📝 Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} className={inp + " resize-none"} rows={2} />
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

// ==================== 4. PROCEDIMENTOS ====================
function ProcedimentosModule({ session, setMsg }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const emptyForm = {
    pacienteNome: "", tipo: "curativo", descricao: "", localizacao: "", material: "", observacoes: "", data: today(), hora: now(),
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await api.triagem.list();
      setItems(all.filter(r => r.queixa?.startsWith("[PROC]")));
    } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm({ ...emptyForm, data: today(), hora: now() }); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.pacienteNome.trim()) { setMsg({ text: "Paciente obrigatório.", ok: false }); return; }
    try {
      const queixa = `[PROC] ${TIPOS_PROCEDIMENTO[form.tipo].label}: ${form.descricao}`;
      const notas = `Local: ${form.localizacao}\nMaterial: ${form.material}\nObs: ${form.observacoes}`;
      await api.triagem.create({
        pacienteNome: form.pacienteNome, pacienteIdade: "", queixa,
        prioridade: "normal", estado: "concluido", notas,
        data: form.data, hora: form.hora,
        registadoPor: session.funcionarioNome || session.username,
      });
      setMsg({ text: "Procedimento registado.", ok: true });
      resetForm(); setShowForm(false); await load();
    } catch (err) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await api.triagem.delete(deleteId); setDeleteId(null); setMsg({ text: "Eliminado.", ok: true }); await load(); }
    catch { setMsg({ text: "Erro.", ok: false }); }
  }

  const filtered = useMemo(() => items.filter(r =>
    !search || r.pacienteNome.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">🩹</div>
          <div className="text-2xl font-black text-blue-600">{items.length}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        {Object.entries(TIPOS_PROCEDIMENTO).slice(0, 3).map(([k, v]) => {
          const count = items.filter(i => i.queixa?.includes(v.label)).length;
          return (
            <div key={k} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl mb-1">{v.icon}</div>
              <div className="text-2xl font-black text-gray-700">{count}</div>
              <div className="text-xs text-gray-600">{v.label}</div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700">
          <span>🩹</span> Novo Procedimento
        </motion.button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-gray-500">A carregar…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nenhum procedimento.</div>
        ) : (
          <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
            {filtered.map(r => {
              const tipo = Object.keys(TIPOS_PROCEDIMENTO).find(t => r.queixa?.includes(TIPOS_PROCEDIMENTO[t].label)) || "outro";
              const tp = TIPOS_PROCEDIMENTO[tipo];
              return (
                <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="text-2xl">{tp.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{r.pacienteNome}</div>
                    <div className="text-xs text-gray-500">{tp.label} · {r.data} {r.hora}</div>
                    <div className="text-xs text-gray-600 mt-1 whitespace-pre-line">{r.notas}</div>
                  </div>
                  <button onClick={() => setDeleteId(r.id)} className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded">🗑️</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <Modal open={showForm} onClose={() => setShowForm(false)} title="Novo Procedimento" icon="🩹">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Paciente *</label>
                  <input value={form.pacienteNome} onChange={e => setForm(f => ({ ...f, pacienteNome: e.target.value }))} className={inp} required />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Tipo *</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inp}>
                    {Object.entries(TIPOS_PROCEDIMENTO).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Localização</label>
                  <input value={form.localizacao} onChange={e => setForm(f => ({ ...f, localizacao: e.target.value }))} className={inp} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Descrição *</label>
                  <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} className={inp + " resize-none"} rows={2} required />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Material Utilizado</label>
                  <input value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} className={inp} />
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

// ==================== 5. VACINAÇÃO ====================
function VacinasModule({ session, setMsg }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const emptyForm = {
    pacienteNome: "", pacienteIdade: "", tipo: "covid19", lote: "", localAplicacao: "",
    dose: "1ª dose", dataRetorno: "", observacoes: "", data: today(), hora: now(),
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await api.triagem.list();
      setItems(all.filter(r => r.queixa?.startsWith("[VAC]")));
    } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm({ ...emptyForm, data: today(), hora: now() }); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.pacienteNome.trim()) { setMsg({ text: "Paciente obrigatório.", ok: false }); return; }
    try {
      const queixa = `[VAC] ${TIPOS_VACINA[form.tipo]} - ${form.dose}`;
      const notas = `Lote: ${form.lote}\nLocal: ${form.localAplicacao}\nRetorno: ${form.dataRetorno || "N/A"}\nObs: ${form.observacoes}`;
      await api.triagem.create({
        pacienteNome: form.pacienteNome, pacienteIdade: form.pacienteIdade, queixa,
        prioridade: "nao_urgente", estado: "concluido", notas,
        data: form.data, hora: form.hora,
        registadoPor: session.funcionarioNome || session.username,
      });
      setMsg({ text: "Vacinação registada.", ok: true });
      resetForm(); setShowForm(false); await load();
    } catch (err) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await api.triagem.delete(deleteId); setDeleteId(null); setMsg({ text: "Eliminado.", ok: true }); await load(); }
    catch { setMsg({ text: "Erro.", ok: false }); }
  }

  const filtered = useMemo(() => items.filter(r =>
    !search || r.pacienteNome.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">💉</div>
          <div className="text-2xl font-black text-purple-600">{items.length}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">📅</div>
          <div className="text-2xl font-black text-green-600">{items.filter(i => i.data === today()).length}</div>
          <div className="text-xs text-gray-600">Hoje</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">🔔</div>
          <div className="text-2xl font-black text-amber-600">
            {items.filter(i => i.notas?.includes("Retorno:") && !i.notas?.includes("Retorno: N/A")).length}
          </div>
          <div className="text-xs text-gray-600">Com Retorno</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-2xl font-black text-blue-600">{new Set(items.map(i => i.pacienteNome)).size}</div>
          <div className="text-xs text-gray-600">Pacientes</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700">
          <span>💉</span> Registar Vacinação
        </motion.button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-gray-500">A carregar…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nenhuma vacinação.</div>
        ) : (
          <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
            {filtered.map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                <div className="text-2xl">💉</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{r.pacienteNome}</div>
                  <div className="text-xs text-gray-500">{r.queixa?.replace("[VAC] ", "")} · {r.data}</div>
                </div>
                <button onClick={() => setDeleteId(r.id)} className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded">🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <Modal open={showForm} onClose={() => setShowForm(false)} title="Registar Vacinação" icon="💉">
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
                  <label className={lbl}>Tipo de Vacina *</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inp}>
                    {Object.entries(TIPOS_VACINA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Dose</label>
                  <select value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} className={inp}>
                    <option>1ª dose</option><option>2ª dose</option><option>3ª dose</option>
                    <option>Reforço</option><option>Dose única</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Lote</label>
                  <input value={form.lote} onChange={e => setForm(f => ({ ...f, lote: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Local de Aplicação</label>
                  <select value={form.localAplicacao} onChange={e => setForm(f => ({ ...f, localAplicacao: e.target.value }))} className={inp}>
                    <option value="">-</option>
                    <option>Braço esquerdo</option><option>Braço direito</option>
                    <option>Coxa esquerda</option><option>Coxa direita</option>
                    <option>Oral</option><option>Nasal</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Data Retorno</label>
                  <input type="date" value={form.dataRetorno} onChange={e => setForm(f => ({ ...f, dataRetorno: e.target.value }))} className={inp} />
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

// ==================== 6. IMAGIOLOGIA ====================
function ImagiologiaModule({ session, setMsg }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [detalhe, setDetalhe] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const emptyForm = {
    pacienteNome: "", pacienteIdade: "", medicoSolicitante: "",
    tipoExame: "", regiao: "", indicacao: "", urgente: false,
    resultado: "", conclusao: "", data: today(), hora: now(),
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.imagiologia.list()); } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm({ ...emptyForm, data: today(), hora: now() }); setEditId(null); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.pacienteNome.trim() || !form.tipoExame.trim()) { setMsg({ text: "Paciente e tipo obrigatórios.", ok: false }); return; }
    try {
      const payload = { ...form, estado: editId ? (detalhe?.estado || "pendente") : "pendente", registadoPor: session.funcionarioNome || session.username };
      if (editId) { await api.imagiologia.update(editId, payload); setMsg({ text: "Actualizado.", ok: true }); }
      else { await api.imagiologia.create(payload); setMsg({ text: "Solicitação registada.", ok: true }); }
      resetForm(); setShowForm(false); await load();
    } catch (err) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function updateEstado(id, estado) {
    try {
      await api.imagiologia.update(id, { estado });
      setMsg({ text: `Estado: ${ESTADO_IMAGIOLOGIA[estado].label}`, ok: true });
      await load();
    } catch { setMsg({ text: "Erro.", ok: false }); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await api.imagiologia.delete(deleteId); setDeleteId(null); setDetalhe(null); setMsg({ text: "Eliminado.", ok: true }); await load(); }
    catch { setMsg({ text: "Erro.", ok: false }); }
  }

  const filtered = useMemo(() => items.filter(r =>
    (!search || r.pacienteNome.toLowerCase().includes(search.toLowerCase())) &&
    (!filterEstado || r.estado === filterEstado)
  ), [items, search, filterEstado]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total", value: items.length, cor: "text-blue-600", icon: "🩻", bg: "from-blue-50 to-blue-100/50" },
          { label: "Pendentes", value: items.filter(i => i.estado === "pendente").length, cor: "text-gray-600", icon: "⏸️", bg: "from-gray-50 to-gray-100/50" },
          { label: "Em progresso", value: items.filter(i => i.estado === "em_progresso").length, cor: "text-blue-600", icon: "🔄", bg: "from-blue-50 to-blue-100/50" },
          { label: "Urgentes", value: items.filter(i => i.urgente).length, cor: "text-red-600", icon: "🚨", bg: "from-red-50 to-red-100/50" },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} border border-gray-200 rounded-xl p-4 text-center shadow-sm`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-black ${s.cor}`}>{s.value}</div>
            <div className="text-xs text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48" />
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white">
            <option value="">Todos estados</option>
            {Object.entries(ESTADO_IMAGIOLOGIA).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700">
          <span>🩻</span> Nova Solicitação
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-10 text-center text-gray-500">A carregar…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Nenhuma solicitação.</div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
              {filtered.map(r => {
                const ec = ESTADO_IMAGIOLOGIA[r.estado];
                return (
                  <button key={r.id} onClick={() => setDetalhe(r)}
                    className={`w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-blue-50/50 transition-colors ${detalhe?.id === r.id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}>
                    <div className="text-2xl">🩻</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm flex items-center gap-2">
                        {r.pacienteNome}
                        {r.urgente && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">URGENTE</span>}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{r.tipoExame} · {r.regiao}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ec?.badge}`}>{ec?.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {!detalhe ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              <div className="text-4xl mb-2">🩻</div>
              <p>Seleccione uma solicitação</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-transparent">
                <div className="font-bold text-sm flex items-center gap-2">
                  {detalhe.pacienteNome}
                  {detalhe.urgente && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">🚨 URGENTE</span>}
                </div>
                <div className="text-xs text-gray-500">{detalhe.data} {detalhe.hora}</div>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-500">Tipo</div>
                    <div className="text-sm font-bold">{detalhe.tipoExame}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-500">Região</div>
                    <div className="text-sm font-bold">{detalhe.regiao || "-"}</div>
                  </div>
                </div>
                {detalhe.indicacao && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Indicação</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{detalhe.indicacao}</p>
                  </div>
                )}
                {detalhe.resultado && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Resultado</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{detalhe.resultado}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-2">🔄 Estado</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {Object.keys(ESTADO_IMAGIOLOGIA).map(e => (
                      <button key={e} onClick={() => updateEstado(detalhe.id, e)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${detalhe.estado === e ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {ESTADO_IMAGIOLOGIA[e].icon} {ESTADO_IMAGIOLOGIA[e].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button onClick={() => {
                    setForm({
                      pacienteNome: detalhe.pacienteNome, pacienteIdade: detalhe.pacienteIdade || "",
                      medicoSolicitante: detalhe.medicoSolicitante || "", tipoExame: detalhe.tipoExame,
                      regiao: detalhe.regiao || "", indicacao: detalhe.indicacao || "",
                      urgente: detalhe.urgente, resultado: detalhe.resultado || "",
                      conclusao: detalhe.conclusao || "", data: detalhe.data, hora: detalhe.hora,
                    });
                    setEditId(detalhe.id); setShowForm(true);
                  }} className="flex-1 border border-gray-300 rounded-lg text-xs py-2 text-gray-600 hover:bg-gray-50 font-semibold">✏️ Editar</button>
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
          <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Editar" : "Nova Solicitação"} icon={editId ? "✏️" : "🩻"}>
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
                  <label className={lbl}>Médico Solicitante</label>
                  <input value={form.medicoSolicitante} onChange={e => setForm(f => ({ ...f, medicoSolicitante: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Tipo de Exame *</label>
                  <select value={form.tipoExame} onChange={e => setForm(f => ({ ...f, tipoExame: e.target.value }))} className={inp} required>
                    <option value="">-</option>
                    <option>Raio-X</option><option>Ecografia</option><option>TAC</option>
                    <option>Ressonância Magnética</option><option>Mamografia</option>
                    <option>Densitometria</option><option>Outro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Região</label>
                  <input value={form.regiao} onChange={e => setForm(f => ({ ...f, regiao: e.target.value }))} className={inp} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Indicação Clínica</label>
                  <textarea value={form.indicacao} onChange={e => setForm(f => ({ ...f, indicacao: e.target.value }))} className={inp + " resize-none"} rows={2} />
                </div>
                {editId && (
                  <>
                    <div className="col-span-2 space-y-1">
                      <label className={lbl}>Resultado</label>
                      <textarea value={form.resultado} onChange={e => setForm(f => ({ ...f, resultado: e.target.value }))} className={inp + " resize-none"} rows={2} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className={lbl}>Conclusão</label>
                      <textarea value={form.conclusao} onChange={e => setForm(f => ({ ...f, conclusao: e.target.value }))} className={inp + " resize-none"} rows={2} />
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.urgente} onChange={e => setForm(f => ({ ...f, urgente: e.target.checked }))} />
                    🚨 Urgente
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700">
                  {editId ? "💾 Guardar" : "✅ Registar"}
                </button>
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

// ==================== 7. SOLICITAÇÕES ====================
function SolicitacoesModule({ session, setMsg }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [detalhe, setDetalhe] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const emptyForm = {
    pacienteNome: "", pacienteNascimento: "", pacienteSexo: "",
    pacienteTelefone: "", pacienteBi: "", medicoSolicitante: "",
    observacoes: "", urgente: false, data: today(), hora: now(),
  };
  const [form, setForm] = useState(emptyForm);
  const [exames, setExames] = useState([]);
  const [novoExame, setNovoExame] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.solicitacoes.list()); } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm({ ...emptyForm, data: today(), hora: now() }); setExames([]); setNovoExame(""); }
  function addExame() {
    if (novoExame.trim() && !exames.includes(novoExame.trim())) {
      setExames([...exames, novoExame.trim()]);
      setNovoExame("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.pacienteNome.trim()) { setMsg({ text: "Paciente obrigatório.", ok: false }); return; }
    if (exames.length === 0) { setMsg({ text: "Adicione pelo menos um exame.", ok: false }); return; }
    try {
      await api.solicitacoes.create({
        ...form,
        examesSolicitados: exames.map(e => ({ nome: e, resultado: "" })),
      });
      setMsg({ text: "Solicitação registada.", ok: true });
      resetForm(); setShowForm(false); await load();
    } catch (err) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function updateEstado(id, estado) {
    try {
      await api.solicitacoes.update(id, { estado });
      setMsg({ text: `Estado: ${ESTADO_SOLICITACAO[estado].label}`, ok: true });
      await load();
    } catch { setMsg({ text: "Erro.", ok: false }); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await api.solicitacoes.delete(deleteId); setDeleteId(null); setDetalhe(null); setMsg({ text: "Eliminada.", ok: true }); await load(); }
    catch { setMsg({ text: "Erro.", ok: false }); }
  }

  const filtered = useMemo(() => items.filter(r =>
    (!search || r.pacienteNome.toLowerCase().includes(search.toLowerCase())) &&
    (!filterEstado || r.estado === filterEstado)
  ), [items, search, filterEstado]);

  const examesSugestoes = [
    "Hemograma", "Glicemia", "Colesterol", "Triglicerídeos", "Ureia", "Creatinina",
    "Ácido Úrico", "TGO/TGP", "Sumária de Urina", "TSH", "T4", "PSA", "PCR", "VDRL", "VIH",
  ];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total", value: items.length, cor: "text-blue-600", icon: "📋", bg: "from-blue-50 to-blue-100/50" },
          { label: "Pendentes", value: items.filter(i => i.estado === "pendente").length, cor: "text-gray-600", icon: "⏸️", bg: "from-gray-50 to-gray-100/50" },
          { label: "Em processo", value: items.filter(i => i.estado === "em_processamento").length, cor: "text-blue-600", icon: "🔄", bg: "from-blue-50 to-blue-100/50" },
          { label: "Urgentes", value: items.filter(i => i.urgente).length, cor: "text-red-600", icon: "🚨", bg: "from-red-50 to-red-100/50" },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} border border-gray-200 rounded-xl p-4 text-center shadow-sm`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-black ${s.cor}`}>{s.value}</div>
            <div className="text-xs text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48" />
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white">
            <option value="">Todos estados</option>
            {Object.entries(ESTADO_SOLICITACAO).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700">
          <span>📋</span> Nova Solicitação
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-10 text-center text-gray-500">A carregar…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Nenhuma solicitação.</div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
              {filtered.map(r => {
                const ec = ESTADO_SOLICITACAO[r.estado];
                return (
                  <button key={r.id} onClick={() => setDetalhe(r)}
                    className={`w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-blue-50/50 transition-colors ${detalhe?.id === r.id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}>
                    <div className="text-2xl">📋</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm flex items-center gap-2">
                        {r.pacienteNome}
                        {r.urgente && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">URGENTE</span>}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {r.examesSolicitados?.length || 0} exames · Dr. {r.medicoSolicitante || "-"}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ec?.badge}`}>{ec?.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {!detalhe ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              <div className="text-4xl mb-2">📋</div>
              <p>Seleccione uma solicitação</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-transparent">
                <div className="font-bold text-sm">{detalhe.pacienteNome}</div>
                <div className="text-xs text-gray-500">{detalhe.data} {detalhe.hora}</div>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-2">🧪 Exames</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(detalhe.examesSolicitados || []).map((ex, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full">
                        {ex.nome}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-2">🔄 Estado</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {Object.keys(ESTADO_SOLICITACAO).map(e => (
                      <button key={e} onClick={() => updateEstado(detalhe.id, e)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${detalhe.estado === e ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {ESTADO_SOLICITACAO[e].icon} {ESTADO_SOLICITACAO[e].label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setDeleteId(detalhe.id)}
                  className="w-full border border-red-200 rounded-lg text-xs py-2 text-red-600 hover:bg-red-50 font-semibold mt-2">🗑️ Eliminar</button>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova Solicitação Laboratorial" icon="📋" maxWidth="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Paciente *</label>
                  <input value={form.pacienteNome} onChange={e => setForm(f => ({ ...f, pacienteNome: e.target.value }))} className={inp} required />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Data Nasc.</label>
                  <input type="date" value={form.pacienteNascimento} onChange={e => setForm(f => ({ ...f, pacienteNascimento: e.target.value }))} className={inp} />
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
                  <label className={lbl}>BI</label>
                  <input value={form.pacienteBi} onChange={e => setForm(f => ({ ...f, pacienteBi: e.target.value }))} className={inp} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Médico Solicitante</label>
                  <input value={form.medicoSolicitante} onChange={e => setForm(f => ({ ...f, medicoSolicitante: e.target.value }))} className={inp} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-blue-600 uppercase">🧪 Exames</p>
                </div>
                <div className="flex gap-2 mb-2">
                  <input value={novoExame} onChange={e => setNovoExame(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addExame(); } }}
                    className={inp} placeholder="Nome do exame" />
                  <button type="button" onClick={addExame} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Add</button>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {examesSugestoes.filter(e => !exames.includes(e)).slice(0, 10).map(e => (
                    <button key={e} type="button" onClick={() => setExames([...exames, e])}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full">{e}</button>
                  ))}
                </div>
                {exames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg">
                    {exames.map((e, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full flex items-center gap-1">
                        {e}
                        <button type="button" onClick={() => setExames(exames.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className={lbl}>📝 Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} className={inp + " resize-none"} rows={2} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.urgente} onChange={e => setForm(f => ({ ...f, urgente: e.target.checked }))} />
                🚨 Urgente
              </label>
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

// ==================== 8. STOCK ====================
function StockModule({ session, setMsg }) {
  const [items, setItems] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showMovForm, setShowMovForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [tab, setTab] = useState("stock");
  const emptyForm = {
    codigo: "", nome: "", categoria: "", tipo: "material",
    unidade: "unidades", quantidadeAtual: "", quantidadeMinima: "",
    lote: "", validade: "", fornecedor: "", localizacao: "", observacoes: "", ativo: true,
  };
  const [form, setForm] = useState(emptyForm);
  const [movForm, setMovForm] = useState({
    reagenteId: "", tipo: "entrada", quantidade: "", lote: "", validade: "", motivo: "", data: today(),
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, m] = await Promise.all([api.reagentes.list(), api.stockMovimentos.list()]);
      setItems(r); setMovimentos(m);
    } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm(emptyForm); setEditId(null); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) { setMsg({ text: "Nome obrigatório.", ok: false }); return; }
    try {
      const payload = { ...form, quantidadeAtual: num(form.quantidadeAtual) ?? 0, quantidadeMinima: num(form.quantidadeMinima) ?? 0 };
      if (editId) { await api.reagentes.update(editId, payload); setMsg({ text: "Actualizado.", ok: true }); }
      else { await api.reagentes.create(payload); setMsg({ text: "Registado.", ok: true }); }
      resetForm(); setShowForm(false); await load();
    } catch (err) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function handleMovSubmit(e) {
    e.preventDefault();
    if (!movForm.reagenteId || !movForm.quantidade) { setMsg({ text: "Preencha todos os campos.", ok: false }); return; }
    try {
      await api.stockMovimentos.create({
        ...movForm, reagenteId: parseInt(movForm.reagenteId), quantidade: parseFloat(movForm.quantidade),
        registadoPor: session.funcionarioNome || session.username,
      });
      const reagente = items.find(r => r.id === parseInt(movForm.reagenteId));
      if (reagente) {
        const delta = movForm.tipo === "entrada" || movForm.tipo === "devolucao"
          ? parseFloat(movForm.quantidade) : -parseFloat(movForm.quantidade);
        await api.reagentes.update(reagente.id, { quantidadeAtual: reagente.quantidadeAtual + delta });
      }
      setMsg({ text: "Movimento registado.", ok: true });
      setMovForm({ reagenteId: "", tipo: "entrada", quantidade: "", lote: "", validade: "", motivo: "", data: today() });
      setShowMovForm(false); await load();
    } catch (err) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await api.reagentes.delete(deleteId); setDeleteId(null); setMsg({ text: "Eliminado.", ok: true }); await load(); }
    catch { setMsg({ text: "Erro.", ok: false }); }
  }

  const filtered = useMemo(() => items.filter(r =>
    !search || r.nome.toLowerCase().includes(search.toLowerCase()) || r.codigo?.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  const stockBaixo = items.filter(r => r.ativo && r.quantidadeAtual <= r.quantidadeMinima).length;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">📦</div>
          <div className="text-2xl font-black text-blue-600">{items.filter(i => i.ativo).length}</div>
          <div className="text-xs text-gray-600">Itens activos</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">⚠️</div>
          <div className="text-2xl font-black text-red-600">{stockBaixo}</div>
          <div className="text-xs text-gray-600">Stock baixo</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">🔄</div>
          <div className="text-2xl font-black text-green-600">{movimentos.length}</div>
          <div className="text-xs text-gray-600">Movimentos</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">📅</div>
          <div className="text-2xl font-black text-amber-600">
            {items.filter(r => {
              if (!r.validade) return false;
              const diff = (new Date(r.validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
              return diff <= 90 && diff > 0;
            }).length}
          </div>
          <div className="text-xs text-gray-600">Vence em 90 dias</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
        <div className="flex gap-2">
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button onClick={() => setTab("stock")} className={`px-3 py-1.5 text-xs font-semibold ${tab === "stock" ? "bg-blue-600 text-white" : "bg-white"}`}>📦 Stock</button>
            <button onClick={() => setTab("mov")} className={`px-3 py-1.5 text-xs font-semibold ${tab === "mov" ? "bg-blue-600 text-white" : "bg-white"}`}>🔄 Movimentos</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48" />
        </div>
        <div className="flex gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowMovForm(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-green-700">
            <span>🔄</span> Movimento
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700">
            <span>📦</span> Novo Item
          </motion.button>
        </div>
      </div>

      {tab === "stock" ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-10 text-center text-gray-500">A carregar…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Nenhum item.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600">Código</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600">Nome</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600">Categoria</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs text-gray-600">Qtd Actual</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs text-gray-600">Qtd Mín</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs text-gray-600">Validade</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs text-gray-600">Acções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map(r => {
                    const baixo = r.ativo && r.quantidadeAtual <= r.quantidadeMinima;
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs font-mono">{r.codigo || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{r.nome}</div>
                          <div className="text-xs text-gray-500">{r.localizacao || "-"}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">{r.categoria || "-"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${baixo ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                            {r.quantidadeAtual} {r.unidade}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs">{r.quantidadeMinima}</td>
                        <td className="px-4 py-3 text-center text-xs">{r.validade || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => { setForm({
                            codigo: r.codigo || "", nome: r.nome, categoria: r.categoria || "",
                            tipo: r.tipo || "material", unidade: r.unidade || "unidades",
                            quantidadeAtual: r.quantidadeAtual?.toString() || "", quantidadeMinima: r.quantidadeMinima?.toString() || "",
                            lote: r.lote || "", validade: r.validade || "", fornecedor: r.fornecedor || "",
                            localizacao: r.localizacao || "", observacoes: r.observacoes || "", ativo: r.ativo,
                          }); setEditId(r.id); setShowForm(true); }}
                            className="text-xs text-blue-600 hover:underline mr-2">✏️</button>
                          <button onClick={() => setDeleteId(r.id)} className="text-xs text-red-600 hover:underline">🗑️</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {movimentos.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Nenhum movimento.</div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
              {movimentos.slice().reverse().map(m => {
                const reagente = items.find(r => r.id === m.reagenteId);
                const isEntrada = m.tipo === "entrada" || m.tipo === "devolucao";
                return (
                  <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                    <div className={`text-2xl ${isEntrada ? "text-green-600" : "text-red-600"}`}>
                      {isEntrada ? "📥" : "📤"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{reagente?.nome || "Item #" + m.reagenteId}</div>
                      <div className="text-xs text-gray-500">
                        {m.tipo.toUpperCase()} · {m.quantidade} un. · {m.data}
                      </div>
                      {m.motivo && <div className="text-xs text-gray-600 mt-1">{m.motivo}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Editar Item" : "Novo Item de Stock"} icon={editId ? "✏️" : "📦"}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={lbl}>Código</label>
                  <input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Nome *</label>
                  <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inp} required />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Categoria</label>
                  <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className={inp}>
                    <option value="">-</option>
                    <option>Material</option><option>Reagente</option>
                    <option>Equipamento</option><option>Consumível</option><option>Medicamento</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Unidade</label>
                  <input value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Qtd Actual</label>
                  <input type="number" step="0.01" value={form.quantidadeAtual} onChange={e => setForm(f => ({ ...f, quantidadeAtual: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Qtd Mínima</label>
                  <input type="number" step="0.01" value={form.quantidadeMinima} onChange={e => setForm(f => ({ ...f, quantidadeMinima: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Lote</label>
                  <input value={form.lote} onChange={e => setForm(f => ({ ...f, lote: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Validade</label>
                  <input type="date" value={form.validade} onChange={e => setForm(f => ({ ...f, validade: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Fornecedor</label>
                  <input value={form.fornecedor} onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Localização</label>
                  <input value={form.localizacao} onChange={e => setForm(f => ({ ...f, localizacao: e.target.value }))} className={inp} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700">
                  {editId ? "💾 Guardar" : "✅ Registar"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 border border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMovForm && (
          <Modal open={showMovForm} onClose={() => setShowMovForm(false)} title="Registar Movimento" icon="🔄">
            <form onSubmit={handleMovSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Item *</label>
                  <select value={movForm.reagenteId} onChange={e => setMovForm(f => ({ ...f, reagenteId: e.target.value }))} className={inp} required>
                    <option value="">Seleccione...</option>
                    {items.map(r => <option key={r.id} value={r.id}>{r.nome} (Stock: {r.quantidadeAtual})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Tipo *</label>
                  <select value={movForm.tipo} onChange={e => setMovForm(f => ({ ...f, tipo: e.target.value }))} className={inp}>
                    <option value="entrada">📥 Entrada</option>
                    <option value="saida">📤 Saída</option>
                    <option value="ajuste">🔧 Ajuste</option>
                    <option value="devolucao">↩️ Devolução</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Quantidade *</label>
                  <input type="number" step="0.01" value={movForm.quantidade} onChange={e => setMovForm(f => ({ ...f, quantidade: e.target.value }))} className={inp} required />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Lote</label>
                  <input value={movForm.lote} onChange={e => setMovForm(f => ({ ...f, lote: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Data</label>
                  <input type="date" value={movForm.data} onChange={e => setMovForm(f => ({ ...f, data: e.target.value }))} className={inp} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Motivo</label>
                  <input value={movForm.motivo} onChange={e => setMovForm(f => ({ ...f, motivo: e.target.value }))} className={inp} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700">✅ Registar</button>
                <button type="button" onClick={() => setShowMovForm(false)} className="px-5 border border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
    </>
  );
}

// ==================== 9. AGENDA (NOVO) ====================
function AgendaModule({ session, setMsg }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterData, setFilterData] = useState(today());
  const [deleteId, setDeleteId] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const emptyForm = {
    pacienteNome: "", pacienteTelefone: "", tipo: "consulta",
    profissional: "", sala: "", data: today(), hora: "09:00",
    duracao: 30, observacoes: "", estado: "agendada",
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.agenda.list()); } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm({ ...emptyForm, data: today(), hora: "09:00" }); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.pacienteNome.trim()) { setMsg({ text: "Paciente obrigatório.", ok: false }); return; }
    try {
      await api.agenda.create({ ...form, registadoPor: session.funcionarioNome || session.username });
      setMsg({ text: "Agendamento registado.", ok: true });
      resetForm(); setShowForm(false); await load();
    } catch (err) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function updateEstado(id, estado) {
    try {
      await api.agenda.update(id, { estado });
      setMsg({ text: `Estado: ${estado}`, ok: true });
      await load();
    } catch { setMsg({ text: "Erro.", ok: false }); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await api.agenda.delete(deleteId); setDeleteId(null); setDetalhe(null); setMsg({ text: "Eliminado.", ok: true }); await load(); }
    catch { setMsg({ text: "Erro.", ok: false }); }
  }

  const filtered = useMemo(() => items.filter(r =>
    (!search || r.pacienteNome.toLowerCase().includes(search.toLowerCase())) &&
    r.data === filterData
  ).sort((a, b) => a.hora.localeCompare(b.hora)), [items, search, filterData]);

  const statsDia = useMemo(() => ({
    total: filtered.length,
    realizadas: filtered.filter(i => i.estado === "realizada").length,
    canceladas: filtered.filter(i => i.estado === "cancelada").length,
    pendentes: filtered.filter(i => i.estado === "agendada").length,
  }), [filtered]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">📅</div>
          <div className="text-2xl font-black text-blue-600">{statsDia.total}</div>
          <div className="text-xs text-gray-600">Total do dia</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">✓</div>
          <div className="text-2xl font-black text-green-600">{statsDia.realizadas}</div>
          <div className="text-xs text-gray-600">Realizadas</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">⏳</div>
          <div className="text-2xl font-black text-amber-600">{statsDia.pendentes}</div>
          <div className="text-xs text-gray-600">Pendentes</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">✕</div>
          <div className="text-2xl font-black text-red-600">{statsDia.canceladas}</div>
          <div className="text-xs text-gray-600">Canceladas</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
        <div className="flex gap-2">
          <input type="date" value={filterData} onChange={e => setFilterData(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48" />
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700">
          <span>📅</span> Novo Agendamento
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-10 text-center text-gray-500">A carregar…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              Nenhum agendamento para {new Date(filterData).toLocaleDateString("pt-PT")}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {filtered.map(r => {
                const tipo = TIPOS_AGENDA[r.tipo] || TIPOS_AGENDA.outro;
                const estadoCor = r.estado === "realizada" ? "bg-green-100 text-green-700" :
                  r.estado === "cancelada" ? "bg-red-100 text-red-700" :
                  r.estado === "em_curso" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700";
                return (
                  <button key={r.id} onClick={() => setDetalhe(r)}
                    className={`w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-blue-50/50 transition-colors ${detalhe?.id === r.id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}>
                    <div className="text-center flex-shrink-0 w-14">
                      <div className="text-lg font-black text-blue-600">{r.hora}</div>
                      <div className="text-[10px] text-gray-500">{r.duracao}min</div>
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tipo.color}`}>
                      <span className="text-lg">{tipo.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{r.pacienteNome}</div>
                      <div className="text-xs text-gray-500 truncate">{tipo.label} · {r.profissional || "N/A"} · Sala {r.sala || "-"}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${estadoCor}`}>
                      {r.estado === "agendada" ? "⏳" : r.estado === "em_curso" ? "🔄" : r.estado === "realizada" ? "✓" : "✕"} {r.estado}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {!detalhe ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              <div className="text-4xl mb-2">📅</div>
              <p>Seleccione um agendamento</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-transparent">
                <div className="font-bold text-sm">{detalhe.pacienteNome}</div>
                <div className="text-xs text-gray-500">{detalhe.data} · {detalhe.hora} ({detalhe.duracao}min)</div>
                <div className="text-xs text-gray-500 mt-1">{detalhe.profissional || "N/A"} · Sala {detalhe.sala || "-"}</div>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-500">Telefone</div>
                    <div className="font-semibold">{detalhe.pacienteTelefone || "-"}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-500">Tipo</div>
                    <div className="font-semibold">{(TIPOS_AGENDA[detalhe.tipo] || TIPOS_AGENDA.outro).label}</div>
                  </div>
                </div>
                {detalhe.observacoes && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">📝 Observações</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{detalhe.observacoes}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-2">🔄 Estado</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {["agendada", "em_curso", "realizada", "cancelada"].map(e => (
                      <button key={e} onClick={() => updateEstado(detalhe.id, e)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${detalhe.estado === e ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {e.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setDeleteId(detalhe.id)}
                  className="w-full border border-red-200 rounded-lg text-xs py-2 text-red-600 hover:bg-red-50 font-semibold">🗑️ Eliminar</button>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <Modal open={showForm} onClose={() => setShowForm(false)} title="Novo Agendamento" icon="📅">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Paciente *</label>
                  <input value={form.pacienteNome} onChange={e => setForm(f => ({ ...f, pacienteNome: e.target.value }))} className={inp} required />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Telefone</label>
                  <input value={form.pacienteTelefone} onChange={e => setForm(f => ({ ...f, pacienteTelefone: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Tipo *</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inp}>
                    {Object.entries(TIPOS_AGENDA).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
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
                  <label className={lbl}>Profissional</label>
                  <input value={form.profissional} onChange={e => setForm(f => ({ ...f, profissional: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Sala</label>
                  <input value={form.sala} onChange={e => setForm(f => ({ ...f, sala: e.target.value }))} className={inp} />
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
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
    </>
  );
}

// ==================== 10. PRESCRIÇÕES (NOVO) ====================
function PrescricoesModule({ session, setMsg }) {
  const [items, setItems] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const emptyForm = {
    pacienteNome: "", pacienteIdade: "", diagnostico: "",
    alergias: "", peso: "", data: today(),
  };
  const [form, setForm] = useState(emptyForm);
  const [meds, setMeds] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([api.prescricoes.list(), api.medicamentos.list()]);
      setItems(p); setMedicamentos(m.filter(x => x.ativo));
    } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setForm({ ...emptyForm, data: today() });
    setMeds([]);
  }

  function addMed() {
    if (medicamentos.length === 0) { setMsg({ text: "Sem medicamentos.", ok: false }); return; }
    setMeds([...meds, { medicamentoId: medicamentos[0].id, nome: medicamentos[0].nome, dosagem: "", frequencia: "", duracao: "", via: "Oral", observacoes: "" }]);
  }

  function updateMed(idx, field, value) {
    setMeds(meds.map((m, i) => {
      if (i !== idx) return m;
      if (field === "medicamentoId") {
        const med = medicamentos.find(x => x.id === value);
        return { ...m, medicamentoId: value, nome: med?.nome || "" };
      }
      return { ...m, [field]: value };
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.pacienteNome.trim()) { setMsg({ text: "Paciente obrigatório.", ok: false }); return; }
    if (meds.length === 0) { setMsg({ text: "Adicione pelo menos um medicamento.", ok: false }); return; }
    try {
      await api.prescricoes.create({
        ...form, medicamentos: meds,
        prescritor: session.funcionarioNome || session.username,
      });
      setMsg({ text: "Prescrição registada.", ok: true });
      resetForm(); setShowForm(false); await load();
    } catch (err) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await api.prescricoes.delete(deleteId); setDeleteId(null); setDetalhe(null); setMsg({ text: "Eliminada.", ok: true }); await load(); }
    catch { setMsg({ text: "Erro.", ok: false }); }
  }

  function handlePrint(p) {
    const w = window.open("", "_blank");
    w.document.write(`
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
      <h1>🏥 Prescrição de Enfermagem</h1>
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
        ${p.medicamentos.map(m => `<tr><td>${m.nome}</td><td>${m.dosagem}</td><td>${m.frequencia}</td><td>${m.duracao}</td><td>${m.via}</td></tr>`).join("")}
      </table>
      <div class="footer">
        <strong>Prescritor:</strong> ${p.prescritor}<br>
        <em>Documento gerado em ${new Date().toLocaleString("pt-PT")}</em>
        <div class="signature">Assinatura do Enfermeiro</div>
      </div>
      </body></html>
    `);
    w.document.close();
    w.print();
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
          onClick={() => { resetForm(); setShowForm(true); }}
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
                    {(detalhe.medicamentos || []).map((m, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3 text-xs">
                        <div className="font-bold text-sm">{m.nome}</div>
                        <div className="text-gray-600 mt-1">
                          {m.dosagem} · {m.frequencia} · {m.duracao} · Via: {m.via}
                        </div>
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
          <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova Prescrição" icon="📝" maxWidth="max-w-3xl">
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
                  <input value={form.alergias} onChange={e => setForm(f => ({ ...f, alergias: e.target.value }))} className={inp} placeholder="Ex: Penicilina, Látex" />
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
                            <label className={lbl}>Medicamento</label>
                            <select value={m.medicamentoId} onChange={e => updateMed(idx, "medicamentoId", parseInt(e.target.value))} className={inp}>
                              {medicamentos.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
                            </select>
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
                              <option>Retal</option><option>Inalatória</option>
                            </select>
                          </div>
                        </div>
                        <button type="button" onClick={() => setMeds(meds.filter((_, i) => i !== idx))} className="text-xs text-red-600 hover:underline">✕ Remover</button>
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

// ==================== 11. TRANSFERÊNCIAS (NOVO) ====================
function TransferenciasModule({ session, setMsg }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const emptyForm = {
    pacienteNome: "", pacienteIdade: "", diagnostico: "",
    unidadeOrigem: "", unidadeDestino: "", motivo: "",
    tipo: "interna", acompanhante: "", contactoDestino: "",
    condicaoClinica: "estavel", recursos: "", observacoes: "",
    data: today(), hora: now(),
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.transferencias.list()); } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm({ ...emptyForm, data: today(), hora: now() }); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.pacienteNome.trim() || !form.unidadeDestino.trim()) {
      setMsg({ text: "Paciente e unidade destino obrigatórios.", ok: false }); return;
    }
    try {
      await api.transferencias.create({ ...form, registadoPor: session.funcionarioNome || session.username });
      setMsg({ text: "Transferência registada.", ok: true });
      resetForm(); setShowForm(false); await load();
    } catch (err) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  const condicaoCor = {
    estavel: "bg-green-100 text-green-700",
    observado: "bg-amber-100 text-amber-700",
    critico: "bg-red-100 text-red-700",
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">🚑</div>
          <div className="text-2xl font-black text-blue-600">{items.length}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">🏥</div>
          <div className="text-2xl font-black text-green-600">{items.filter(i => i.tipo === "interna").length}</div>
          <div className="text-xs text-gray-600">Internas</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">🏨</div>
          <div className="text-2xl font-black text-purple-600">{items.filter(i => i.tipo === "externa").length}</div>
          <div className="text-xs text-gray-600">Externas</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">🚨</div>
          <div className="text-2xl font-black text-red-600">{items.filter(i => i.condicaoClinica === "critico").length}</div>
          <div className="text-xs text-gray-600">Críticos</div>
        </div>
      </div>

      <div className="flex justify-end mb-3">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700">
          <span>🚑</span> Nova Transferência
        </motion.button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-gray-500">A carregar…</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nenhuma transferência.</div>
        ) : (
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {items.slice().reverse().map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                <div className="text-2xl">🚑</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {r.pacienteNome}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${condicaoCor[r.condicaoClinica] || "bg-gray-100"}`}>
                      {r.condicaoClinica}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {r.unidadeOrigem || "N/A"} → <strong>{r.unidadeDestino}</strong>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {r.tipo === "interna" ? "🏥 Interna" : "🏨 Externa"} · {r.data} {r.hora}
                  </div>
                  {r.motivo && <div className="text-xs text-gray-600 mt-1">Motivo: {r.motivo}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova Transferência" icon="🚑" maxWidth="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">👤 Paciente</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className={lbl}>Nome *</label>
                    <input value={form.pacienteNome} onChange={e => setForm(f => ({ ...f, pacienteNome: e.target.value }))} className={inp} required />
                  </div>
                  <div className="space-y-1">
                    <label className={lbl}>Idade</label>
                    <input value={form.pacienteIdade} onChange={e => setForm(f => ({ ...f, pacienteIdade: e.target.value }))} className={inp} />
                  </div>
                  <div className="space-y-1">
                    <label className={lbl}>Condição Clínica</label>
                    <select value={form.condicaoClinica} onChange={e => setForm(f => ({ ...f, condicaoClinica: e.target.value }))} className={inp}>
                      <option value="estavel">🟢 Estável</option>
                      <option value="observado">🟡 Observação</option>
                      <option value="critico">🔴 Crítico</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className={lbl}>Diagnóstico</label>
                    <textarea value={form.diagnostico} onChange={e => setForm(f => ({ ...f, diagnostico: e.target.value }))} className={inp + " resize-none"} rows={2} />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">🏥 Transferência</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={lbl}>Tipo *</label>
                    <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inp}>
                      <option value="interna">🏥 Interna</option>
                      <option value="externa">🏨 Externa</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={lbl}>Unidade Origem</label>
                    <input value={form.unidadeOrigem} onChange={e => setForm(f => ({ ...f, unidadeOrigem: e.target.value }))} className={inp} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className={lbl}>Unidade Destino *</label>
                    <input value={form.unidadeDestino} onChange={e => setForm(f => ({ ...f, unidadeDestino: e.target.value }))} className={inp} required />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className={lbl}>Motivo</label>
                    <textarea value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} className={inp + " resize-none"} rows={2} />
                  </div>
                  <div className="space-y-1">
                    <label className={lbl}>Acompanhante</label>
                    <input value={form.acompanhante} onChange={e => setForm(f => ({ ...f, acompanhante: e.target.value }))} className={inp} />
                  </div>
                  <div className="space-y-1">
                    <label className={lbl}>Contacto Destino</label>
                    <input value={form.contactoDestino} onChange={e => setForm(f => ({ ...f, contactoDestino: e.target.value }))} className={inp} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className={lbl}>Recursos Necessários</label>
                    <input value={form.recursos} onChange={e => setForm(f => ({ ...f, recursos: e.target.value }))} className={inp} placeholder="Ex: Maca, Oxigénio, Monitor" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className={lbl}>Observações</label>
                    <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} className={inp + " resize-none"} rows={2} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700">✅ Registar Transferência</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 border border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

// ==================== 12. ACOMPANHAMENTO ====================
function AcompanhamentoModule({ session, setMsg }) {
  const [pacientes, setPacientes] = useState([]);
  const [triagens, setTriagens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showEvolucao, setShowEvolucao] = useState(false);
  const [evolucao, setEvolucao] = useState({ observacoes: "", sinais: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([api.pacientes.list(), api.triagem.list()]);
      setPacientes(p); setTriagens(t);
    } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => pacientes.filter(p =>
    !search || p.nome.toLowerCase().includes(search.toLowerCase())
  ), [pacientes, search]);

  function getHistorico(pacienteNome) {
    return triagens.filter(t => t.pacienteNome.toLowerCase() === pacienteNome.toLowerCase())
      .sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora));
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-2xl font-black text-blue-600">{pacientes.length}</div>
          <div className="text-xs text-gray-600">Pacientes</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">📋</div>
          <div className="text-2xl font-black text-green-600">{triagens.length}</div>
          <div className="text-xs text-gray-600">Registos</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">✓</div>
          <div className="text-2xl font-black text-purple-600">{triagens.filter(t => t.estado === "concluido").length}</div>
          <div className="text-xs text-gray-600">Concluídos</div>
        </div>
      </div>

      <div className="mb-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar paciente..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-md" />
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
                const ultima = hist[0];
                return (
                  <button key={p.id} onClick={() => setSelected(p)}
                    className={`w-full text-left px-5 py-3 hover:bg-blue-50/50 transition-colors ${selected?.id === p.id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                        {p.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{p.nome}</div>
                        <div className="text-xs text-gray-500">{p.idade || "-"} · {p.sexo || "-"} · {p.telefone || "-"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-blue-600">{hist.length} registos</div>
                        {ultima && <div className="text-[10px] text-gray-500">Último: {ultima.data}</div>}
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
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-lg">
                    {selected.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{selected.nome}</div>
                    <div className="text-xs text-gray-500">{selected.idade} · {selected.sexo}</div>
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
                    <div className="font-semibold">{selected.grupoSanguineo || "-"} {selected.fatorRh || ""}</div>
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
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">🏥 Patologias</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{selected.patologiasCronicas}</p>
                  </div>
                )}
                {selected.medicacaoHabitual && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">💊 Medicação</div>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{selected.medicacaoHabitual}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-2">📋 Histórico</div>
                  {getHistorico(selected.nome).length === 0 ? (
                    <div className="text-xs text-center py-4 text-gray-500">Sem registos</div>
                  ) : (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {getHistorico(selected.nome).map(t => {
                        const pc = PRIORIDADE[t.prioridade];
                        return (
                          <div key={t.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold">{t.data} {t.hora}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${pc?.badge}`}>{pc?.label}</span>
                            </div>
                            <div className="text-gray-500 truncate">{t.queixa}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button onClick={() => setShowEvolucao(true)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-blue-700">
                  📝 Registar Evolução
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showEvolucao && selected && (
          <Modal open={showEvolucao} onClose={() => setShowEvolucao(false)} title="Registar Evolução" icon="📝">
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.triagem.create({
                  pacienteNome: selected.nome, pacienteIdade: selected.idade || "",
                  queixa: `[EVOLUÇÃO] ${evolucao.observacoes.slice(0, 50)}`,
                  notas: evolucao.observacoes + (evolucao.sinais ? "\nSinais: " + evolucao.sinais : ""),
                  prioridade: "normal", estado: "concluido",
                  data: today(), hora: now(),
                  registadoPor: session.funcionarioNome || session.username,
                });
                setMsg({ text: "Evolução registada.", ok: true });
                setShowEvolucao(false); setEvolucao({ observacoes: "", sinais: "" });
                await load();
              } catch (err) { setMsg({ text: err.message || "Erro.", ok: false }); }
            }} className="space-y-4">
              <div className="space-y-1">
                <label className={lbl}>Observações Clínicas *</label>
                <textarea value={evolucao.observacoes} onChange={e => setEvolucao(ev => ({ ...ev, observacoes: e.target.value }))}
                  className={inp + " resize-none"} rows={4} required placeholder="Evolução do paciente..." />
              </div>
              <div className="space-y-1">
                <label className={lbl}>Sinais Vitais (opcional)</label>
                <input value={evolucao.sinais} onChange={e => setEvolucao(ev => ({ ...ev, sinais: e.target.value }))}
                  className={inp} placeholder="TA: 120/80, FC: 72, Temp: 36.8" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700">✅ Registar</button>
                <button type="button" onClick={() => setShowEvolucao(false)} className="px-5 border border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

// ==================== 13. VISITAS ====================
function VisitasModule({ session, setMsg }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const emptyForm = {
    pacienteNome: "", pacienteTelefone: "", endereco: "",
    tipo: "rotina", motivo: "", observacoes: "", data: today(), hora: now(),
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await api.triagem.list();
      setItems(all.filter(r => r.queixa?.startsWith("[VISITA]")));
    } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm({ ...emptyForm, data: today(), hora: now() }); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.pacienteNome.trim()) { setMsg({ text: "Paciente obrigatório.", ok: false }); return; }
    try {
      const queixa = `[VISITA] ${TIPOS_VISITA[form.tipo].label}`;
      const notas = `Endereço: ${form.endereco}\nTel: ${form.pacienteTelefone}\nMotivo: ${form.motivo}\nObs: ${form.observacoes}`;
      await api.triagem.create({
        pacienteNome: form.pacienteNome, pacienteIdade: "", queixa,
        prioridade: "normal", estado: "concluido", notas,
        data: form.data, hora: form.hora,
        registadoPor: session.funcionarioNome || session.username,
      });
      setMsg({ text: "Visita registada.", ok: true });
      resetForm(); setShowForm(false); await load();
    } catch (err) { setMsg({ text: err.message || "Erro.", ok: false }); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await api.triagem.delete(deleteId); setDeleteId(null); setMsg({ text: "Eliminada.", ok: true }); await load(); }
    catch { setMsg({ text: "Erro.", ok: false }); }
  }

  const filtered = useMemo(() => items.filter(r =>
    !search || r.pacienteNome.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">🏠</div>
          <div className="text-2xl font-black text-blue-600">{items.length}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        {Object.entries(TIPOS_VISITA).slice(0, 3).map(([k, v]) => (
          <div key={k} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl mb-1">{v.icon}</div>
            <div className="text-2xl font-black text-gray-700">{items.filter(i => i.queixa?.includes(v.label)).length}</div>
            <div className="text-xs text-gray-600">{v.label}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700">
          <span>🏠</span> Nova Visita
        </motion.button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-gray-500">A carregar…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nenhuma visita.</div>
        ) : (
          <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
            {filtered.map(r => {
              const tipo = Object.keys(TIPOS_VISITA).find(t => r.queixa?.includes(TIPOS_VISITA[t].label)) || "outro";
              const tv = TIPOS_VISITA[tipo];
              return (
                <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="text-2xl">{tv.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{r.pacienteNome}</div>
                    <div className="text-xs text-gray-500">{tv.label} · {r.data} {r.hora}</div>
                    <div className="text-xs text-gray-600 mt-1 whitespace-pre-line">{r.notas}</div>
                  </div>
                  <button onClick={() => setDeleteId(r.id)} className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded">🗑️</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova Visita Domiciliar" icon="🏠">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Paciente *</label>
                  <input value={form.pacienteNome} onChange={e => setForm(f => ({ ...f, pacienteNome: e.target.value }))} className={inp} required />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Telefone</label>
                  <input value={form.pacienteTelefone} onChange={e => setForm(f => ({ ...f, pacienteTelefone: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inp}>
                    {Object.entries(TIPOS_VISITA).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Endereço</label>
                  <input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} className={inp} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Motivo</label>
                  <textarea value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} className={inp + " resize-none"} rows={2} />
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

// ==================== 14. RELATÓRIOS (MELHORADO com recharts) ====================
function RelatoriosModule({ session, setMsg }) {
  const [triagens, setTriagens] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [dispensacoes, setDispensacoes] = useState([]);
  const [imagiologia, setImagiologia] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [reagentes, setReagentes] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState("hoje");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, m, d, i, s, r, a] = await Promise.all([
        api.triagem.list(), api.medicamentos.list(), api.dispensacoes.list(),
        api.imagiologia.list(), api.solicitacoes.list(), api.reagentes.list(),
        api.agenda.list()
      ]);
      setTriagens(t); setMedicamentos(m); setDispensacoes(d);
      setImagiologia(i); setSolicitacoes(s); setReagentes(r); setAgenda(a);
    } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function filterByPeriod(items, dateField = "data") {
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

  const t = filterByPeriod(triagens);
  const d = filterByPeriod(dispensacoes);
  const img = filterByPeriod(imagiologia);
  const sol = filterByPeriod(solicitacoes);
  const ag = filterByPeriod(agenda);

  const porPrioridade = useMemo(() => {
    const c = {};
    t.forEach(r => { c[r.prioridade] = (c[r.prioridade] || 0) + 1; });
    return Object.entries(PRIORIDADE).map(([k, v]) => ({ name: v.label, value: c[k] || 0, fill: k === "emergencia" ? "#ef4444" : k === "urgente" ? "#f97316" : k === "normal" ? "#facc15" : "#22c55e" }));
  }, [t]);

  const porEstado = useMemo(() => {
    const c = {};
    t.forEach(r => { c[r.estado] = (c[r.estado] || 0) + 1; });
    return Object.entries(ESTADO_TRIAGEM).map(([k, v]) => ({ name: v.label, value: c[k] || 0, fill: k === "aguarda" ? "#3b82f6" : k === "em_atendimento" ? "#f59e0b" : "#22c55e" }));
  }, [t]);

  const dados7dias = useMemo(() => {
    const dias = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const ds = dt.toISOString().slice(0, 10);
      dias.push({
        dia: dt.toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit" }),
        triagens: triagens.filter(x => x.data === ds).length,
        dispensacoes: dispensacoes.filter(x => x.data === ds).length,
      });
    }
    return dias;
  }, [triagens, dispensacoes]);

  const stockCritico = reagentes.filter(r => r.ativo && r.quantidadeAtual <= r.quantidadeMinima);
  const medsStockBaixo = medicamentos.filter(m => m.ativo && m.stock <= m.stockMinimo);

  function exportCSV() {
    const rows = [["Tipo", "Data", "Paciente", "Detalhes"]];
    triagens.forEach(r => rows.push(["Triagem", r.data, r.pacienteNome, r.queixa]));
    dispensacoes.forEach(r => rows.push(["Dispensação", r.data, r.pacienteNome, `${r.itens?.length || 0} itens`]));
    imagiologia.forEach(r => rows.push(["Imagiologia", r.data, r.pacienteNome, r.tipoExame]));
    const csv = rows.map(r => r.map(c => `"${(c || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `relatorio_enfermagem_${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ text: "Relatório exportado.", ok: true });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-bold flex items-center gap-2">📈 Relatórios e Estatísticas</h3>
        <div className="flex gap-2">
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            {["hoje", "semana", "mes", "todos"].map(p => (
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
              { label: "Triagens", value: t.length, icon: "💉", cor: "text-blue-600", bg: "bg-blue-50" },
              { label: "Dispensações", value: d.length, icon: "📦", cor: "text-purple-600", bg: "bg-purple-50" },
              { label: "Imagiologia", value: img.length, icon: "🩻", cor: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Solicitações", value: sol.length, icon: "📋", cor: "text-green-600", bg: "bg-green-50" },
              { label: "Agendamentos", value: ag.length, icon: "📅", cor: "text-amber-600", bg: "bg-amber-50" },
              { label: "Stock Crítico", value: stockCritico.length + medsStockBaixo.length, icon: "⚠️", cor: "text-red-600", bg: "bg-red-50" },
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
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">📊 Evolução - 7 dias</h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dados7dias}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="triagens" stroke="#3b82f6" strokeWidth={2} name="Triagens" />
                  <Line type="monotone" dataKey="dispensacoes" stroke="#a855f7" strokeWidth={2} name="Dispensações" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">🚦 Triagens por Prioridade</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porPrioridade}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Quantidade">
                    {porPrioridade.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">📋 Triagens por Estado</h4>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={porEstado} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                    {porEstado.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">⚠️ Alertas de Stock</h4>
              {(stockCritico.length === 0 && medsStockBaixo.length === 0) ? (
                <div className="text-center py-6 text-gray-500 text-sm">✅ Sem alertas</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {stockCritico.map(r => (
                    <div key={"r" + r.id} className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs">
                      <div className="font-semibold text-red-700">📦 {r.nome}</div>
                      <div className="text-red-600">Stock: {r.quantidadeAtual} / Mín: {r.quantidadeMinima} {r.unidade}</div>
                    </div>
                  ))}
                  {medsStockBaixo.map(m => (
                    <div key={"m" + m.id} className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs">
                      <div className="font-semibold text-amber-700">💊 {m.nome}</div>
                      <div className="text-amber-600">Stock: {m.stock} / Mín: {m.stockMinimo} {m.unidade}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm lg:col-span-2">
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">📋 Resumo de Actividade</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">👥</div>
                  <div className="text-xl font-black text-blue-600">{new Set(t.map(x => x.pacienteNome)).size}</div>
                  <div className="text-[10px] text-gray-600">Pacientes únicos</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">🚨</div>
                  <div className="text-xl font-black text-red-600">{t.filter(x => x.prioridade === "emergencia").length}</div>
                  <div className="text-[10px] text-gray-600">Emergências</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">💊</div>
                  <div className="text-xl font-black text-purple-600">{d.reduce((a, x) => a + (x.itens?.length || 0), 0)}</div>
                  <div className="text-[10px] text-gray-600">Itens dispensados</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">🧪</div>
                  <div className="text-xl font-black text-amber-600">{sol.reduce((a, x) => a + (x.examesSolicitados?.length || 0), 0)}</div>
                  <div className="text-[10px] text-gray-600">Exames solicitados</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
