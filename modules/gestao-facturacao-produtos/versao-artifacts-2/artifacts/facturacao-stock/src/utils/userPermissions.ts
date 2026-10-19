import { UsuarioSistema, NivelAcesso, PermissaoMatrizItem } from "../types";

export const defaultUsuarios: UsuarioSistema[] = [
  {
    id: "usr-admin-01",
    nome: "Dr. Alberto Silva",
    username: "admin",
    email: "alberto.silva@pharma-angola.ao",
    cargo: "Administrador Geral & Responsável Técnico",
    role: "admin",
    pin: "1234",
    ativo: true,
    avatarColor: "bg-purple-600",
    criadoEm: "2026-01-10",
    ultimoAcesso: "Hoje, 08:30",
  },
  {
    id: "usr-op-01",
    nome: "Carla Fernandes",
    username: "carla.caixa",
    email: "carla.f@pharma-angola.ao",
    cargo: "Operadora de Caixa & Farmacêutica",
    role: "operador",
    pin: "0000",
    ativo: true,
    avatarColor: "bg-sky-600",
    criadoEm: "2026-01-15",
    ultimoAcesso: "Hoje, 09:15",
  },
  {
    id: "usr-audit-01",
    nome: "Dra. Maria Domingos",
    username: "auditoria.agt",
    email: "maria.domingos@contabilidade.ao",
    cargo: "Auditora Fiscal & Contabilista",
    role: "auditor",
    pin: "9999",
    ativo: true,
    avatarColor: "bg-amber-600",
    criadoEm: "2026-02-01",
    ultimoAcesso: "Ontem, 16:45",
  },
];

export const PERMISSOES_MATRIZ: PermissaoMatrizItem[] = [
  {
    modulo: "Emissão de Faturas & Recibos",
    descricao: "Emitir faturas, faturas-recibo, notas de crédito e talões térmicos",
    admin: true,
    operador: true,
    auditor: false,
  },
  {
    modulo: "Consulta de Estoque & Artigos",
    descricao: "Consultar preços, lotes, códigos de barras e níveis de estoque",
    admin: true,
    operador: true,
    auditor: true,
  },
  {
    modulo: "Entrada / Saída / Baixa de Estoque",
    descricao: "Registar movimentos manuais de inventário e descartes por validade",
    admin: true,
    operador: true,
    auditor: false,
  },
  {
    modulo: "Cadastro / Edição de Produtos",
    descricao: "Cadastrar novos medicamentos, alterar preços de venda e lotes",
    admin: true,
    operador: false,
    auditor: false,
  },
  {
    modulo: "Gestão de Clientes / Pacientes",
    descricao: "Adicionar, editar e consultar ficha cadastral com NIF/BI",
    admin: true,
    operador: true,
    auditor: true,
  },
  {
    modulo: "Relatórios & Gráficos de Vendas",
    descricao: "Analisar faturamento mensal, curva de consumo e margens de lucro",
    admin: true,
    operador: false,
    auditor: true,
  },
  {
    modulo: "Exportação de SAF-T (AO) Fiscal",
    descricao: "Gerar e descarregar ficheiro XML oficial de auditoria da AGT",
    admin: true,
    operador: false,
    auditor: true,
  },
  {
    modulo: "Configurações do Sistema & AGT",
    descricao: "Alterar dados fiscais, NIF, série, certificado e regimes de IVA",
    admin: true,
    operador: false,
    auditor: false,
  },
  {
    modulo: "Perfis de Impressoras Térmicas",
    descricao: "Configurar conexões USB/TCP, gavetas de dinheiro e comandos ESC/POS",
    admin: true,
    operador: false,
    auditor: false,
  },
  {
    modulo: "Gestão de Utilizadores & Permissões",
    descricao: "Criar utilizadores, redefinir PINs de segurança e alterar perfis",
    admin: true,
    operador: false,
    auditor: false,
  },
  {
    modulo: "Backups & Restauro da Base de Dados",
    descricao: "Exportar/Importar backups em JSON e reposição de dados padrão",
    admin: true,
    operador: false,
    auditor: false,
  },
];

export function getRoleBadgeInfo(role: NivelAcesso) {
  switch (role) {
    case "admin":
      return {
        label: "Administrador",
        bg: "bg-purple-100",
        text: "text-purple-800",
        border: "border-purple-200",
        ring: "ring-purple-500",
        badgeBg: "bg-purple-600",
        descricao: "Acesso total irrestrito a configurações, finanças e utilizadores",
      };
    case "operador":
      return {
        label: "Operador de Caixa",
        bg: "bg-sky-100",
        text: "text-sky-800",
        border: "border-sky-200",
        ring: "ring-sky-500",
        badgeBg: "bg-sky-600",
        descricao: "Emissão de faturas, consultas e movimentações diárias de balcão",
      };
    case "auditor":
      return {
        label: "Auditor / Fiscal",
        bg: "bg-amber-100",
        text: "text-amber-800",
        border: "border-amber-200",
        ring: "ring-amber-500",
        badgeBg: "bg-amber-600",
        descricao: "Acesso de consulta analítica, auditoria fiscal AGT e relatórios",
      };
  }
}
