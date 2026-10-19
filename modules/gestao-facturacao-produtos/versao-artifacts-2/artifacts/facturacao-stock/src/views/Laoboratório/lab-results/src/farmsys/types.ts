export interface Product {
  id: number;
  codigo: string;
  nome: string;
  categoria: string;
  preco: number;
  stock: number;
  armazem: string;
  imagem: string;
  lote?: string;
  validade?: string;
  stockMinimo?: number;
}

export interface Client {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  nif: string;
  totalCompras: number;
}

export interface Supplier {
  id: number;
  nome: string;
  contacto: string;
  email: string;
  nif: string;
  produtos: number;
}

export interface Warehouse {
  id: number;
  nome: string;
  localizacao: string;
  capacidade: number;
  produtos: number;
  responsavel: string;
}

export interface Transfer {
  id: number;
  data: string;
  origem: string;
  destino: string;
  produto: string;
  quantidade: number;
  status: 'Concluída' | 'Em Trânsito' | 'Pendente';
}

export interface Order {
  id: number;
  data: string;
  fornecedor: string;
  produtos: string;
  valor: number;
  status: 'Pendente' | 'Recebida' | 'Cancelada';
}

export interface CashFlowEntry {
  id: number;
  data: string;
  tipo: 'Entrada' | 'Saída';
  descricao: string;
  valor: number;
  responsavel: string;
}

export interface User {
  id: number;
  companyId?: string;
  nome: string;
  email: string;
  cargo: 'Administrador' | 'Gerente' | 'Operador' | 'Caixa';
  status: 'Ativo' | 'Inativo';
  ultimoAcesso: string;
  pin?: string;
  password?: string;
}

export interface Activity {
  id: number;
  titulo: string;
  data: string;
  tipo: 'venda' | 'sistema' | 'financeiro' | 'logistica';
  usuario: string;
}

export interface CartItem {
  id: number;
  nome: string;
  preco: number;
  imagem: string;
  quantidade: number;
  stock: number;
}

export interface AppConfig {
  empresa: string;
  nif: string;
  iva: number;
  moeda: string;
  endereco: string;
  telefone: string;
  email: string;
  serie?: string;
}

export interface Backup {
  id: number;
  nome: string;
  data: string;
  tamanho: string;
}

export interface Sale {
  id: string;
  data: string;
  items: CartItem[];
  subtotal: number;
  iva: number;
  total: number;
  clienteNome?: string;
  clienteNif?: string;
  metodoPagamento: string;
  valorPago: number;
  troco: number;
  pagamentoDetalhado?: { metodo: string; valor: number }[];
}

export interface Bill {
  id: string;
  tipo: 'Receber' | 'Pagar';
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: 'Pendente' | 'Pago';
}

export interface CashRegisterClosure {
  id: string;
  dataFechamento: string;
  operador: string;
  valorCalculado: number;
  valorInformado: number;
  observacoes: string;
  status: 'Fechado';
}
