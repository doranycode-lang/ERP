import { Session } from "../store/auth";

interface Props {
  session?: Session;
  onNav?: (tab: string) => void;
}

const RESPONSABILIDADES = [
  {
    icon: "👤",
    cor: "bg-amber-50 border-amber-200",
    corIcon: "bg-amber-100 text-amber-700",
    titulo: "Cadastro do Paciente",
    desc: "Registo e actualização dos dados pessoais, contactos e informações clínicas do paciente.",
    acoes: [
      "Registar novo paciente",
      "Actualizar dados cadastrais",
      "Verificar documentos de identificação",
      "Registar contacto de emergência",
      "Confirmar dados do segurador / convénio",
    ],
  },
  {
    icon: "📅",
    cor: "bg-orange-50 border-orange-200",
    corIcon: "bg-orange-100 text-orange-700",
    titulo: "Agendamento & Triagem",
    desc: "Organização da fila de atendimento, marcação de consultas e priorização de casos urgentes.",
    acoes: [
      "Agendar consultas e exames",
      "Registar hora de chegada",
      "Encaminhar para triagem de enfermagem",
      "Gerir sala de espera",
      "Contactar pacientes para confirmação",
    ],
  },
  {
    icon: "📄",
    cor: "bg-teal-50 border-teal-200",
    corIcon: "bg-teal-100 text-teal-700",
    titulo: "Faturação & Convénios",
    desc: "Emissão de facturas, validação de seguros e controlo de pagamentos dos serviços prestados.",
    acoes: [
      "Emitir facturas (IVA Angola)",
      "Verificar cobertura do seguro",
      "Registar pagamentos efectuados",
      "Entregar resultados ao paciente",
      "Gerir autorizações de convénio",
    ],
  },
];

const FLUXO = [
  { passo: "1", label: "Chegada", desc: "Paciente regista-se" },
  { passo: "2", label: "Cadastro", desc: "Dados e convénio" },
  { passo: "3", label: "Agendamento", desc: "Fila & prioridade" },
  { passo: "4", label: "Atendimento", desc: "Encaminhamento clínico" },
  { passo: "5", label: "Faturação", desc: "Emissão e pagamento" },
];

export default function Recepcao({ session, onNav }: Props) {
  return (
    <div className="p-5 space-y-6 max-w-5xl">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl flex-shrink-0">
          🗂️
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">Módulo de Recepção</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cadastro de pacientes, agendamento, triagem e gestão da faturação
          </p>
          {session && (
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
              📞 {session.funcionarioNome ?? session.username}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {RESPONSABILIDADES.map((r) => (
          <div key={r.titulo} className={`border rounded-xl p-4 space-y-3 ${r.cor}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${r.corIcon}`}>
              {r.icon}
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary">{r.titulo}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
            </div>
            <ul className="space-y-1">
              {r.acoes.map((a) => (
                <li key={a} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">✓</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-wide">
          📊 Fluxo de Atendimento — Recepção Hospitalar
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {FLUXO.map((f, i) => (
            <div key={f.passo} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                  {f.passo}
                </div>
                <div className="text-xs font-semibold text-primary mt-1 text-center whitespace-nowrap">{f.label}</div>
                <div className="text-[10px] text-muted-foreground text-center max-w-[80px] leading-tight">{f.desc}</div>
              </div>
              {i < FLUXO.length - 1 && (
                <span className="text-muted-foreground text-lg mb-6">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {onNav && (
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-wide">⚡ Acesso Rápido</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onNav("pacientes")}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition">
              👤 Pacientes
            </button>
            <button onClick={() => onNav("historico")}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition">
              📄 Histórico / PDF
            </button>
            <button onClick={() => onNav("financeiro")}
              className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition">
              🧾 Faturação
            </button>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="text-xs font-bold text-amber-800 mb-1">💡 Nota Operacional</div>
        <p className="text-xs text-amber-700 leading-relaxed">
          A recepção é o primeiro ponto de contacto do paciente com o laboratório. Um registo correcto e
          completo dos dados garante uma faturação sem erros e um atendimento clínico mais eficiente.
        </p>
      </div>
    </div>
  );
}
