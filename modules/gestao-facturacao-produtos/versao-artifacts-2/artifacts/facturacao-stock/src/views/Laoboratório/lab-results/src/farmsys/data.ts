import { Product, Client, Supplier, Warehouse, Transfer, Order, CashFlowEntry, User, Activity, AppConfig, Backup, Sale, Bill, CashRegisterClosure } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 1, codigo: 'PAR500', nome: 'Paracetamol 500mg', categoria: 'Medicamentos', preco: 350, stock: 150, armazem: 'Armazém Principal', imagem: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&q=80', lote: 'L-1102A', validade: '2027-12-31', stockMinimo: 50 },
  { id: 2, codigo: 'AMO500', nome: 'Amoxicilina 500mg', categoria: 'Medicamentos', preco: 890, stock: 80, armazem: 'Armazém Principal', imagem: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&q=80', lote: 'L-8822B', validade: '2026-08-15', stockMinimo: 40 },
  { id: 3, codigo: 'VIT1000', nome: 'Vitamina C 1000mg', categoria: 'Suplementos', preco: 1250, stock: 200, armazem: 'Armazém 2', imagem: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=100&q=80', lote: 'L-9901C', validade: '2028-03-20', stockMinimo: 30 },
  { id: 4, codigo: 'IBU400', nome: 'Ibuprofeno 400mg', categoria: 'Medicamentos', preco: 420, stock: 120, armazem: 'Armazém Principal', imagem: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&q=80', lote: 'L-7744D', validade: '2026-07-25', stockMinimo: 100 },
  { id: 5, codigo: 'AZI500', nome: 'Azitromicina 500mg', categoria: 'Medicamentos', preco: 1580, stock: 45, armazem: 'Armazém 3', imagem: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&q=80', lote: 'L-3311E', validade: '2027-05-18', stockMinimo: 50 },
  { id: 6, codigo: 'LOR10', nome: 'Loratadina 10mg', categoria: 'Medicamentos', preco: 630, stock: 90, armazem: 'Armazém 2', imagem: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&q=80', lote: 'L-5522F', validade: '2027-10-12', stockMinimo: 20 },
  { id: 7, codigo: 'OME20', nome: 'Omeprazol 20mg', categoria: 'Medicamentos', preco: 940, stock: 110, armazem: 'Armazém Principal', imagem: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&q=80', lote: 'L-1212G', validade: '2026-11-30', stockMinimo: 45 },
  { id: 8, codigo: 'SAL100', nome: 'Salbutamol 100mcg', categoria: 'Medicamentos', preco: 1890, stock: 35, armazem: 'Armazém 3', imagem: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&q=80', lote: 'L-4499H', validade: '2027-02-14', stockMinimo: 15 },
  { id: 9, codigo: 'DIP500', nome: 'Dipirona 500mg', categoria: 'Medicamentos', preco: 560, stock: 100, armazem: 'Armazém Principal', imagem: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&q=80', lote: 'L-6611J', validade: '2027-08-19', stockMinimo: 30 },
  { id: 10, codigo: 'GEL1', nome: 'Gel Antisséptico', categoria: 'Higiene', preco: 600, stock: 150, armazem: 'Armazém Principal', imagem: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&q=80', lote: 'L-0012A', validade: '2028-06-30', stockMinimo: 20 },
];

export const INITIAL_CLIENTS: Client[] = [
  { id: 1, nome: 'João Silva', email: 'joao@email.com', telefone: '912345678', nif: '123456789', totalCompras: 125050 },
  { id: 2, nome: 'Maria Santos', email: 'maria@email.com', telefone: '923456789', nif: '987654321', totalCompras: 89030 },
  { id: 3, nome: 'Pedro Costa', email: 'pedro@email.com', telefone: '934567890', nif: '456789123', totalCompras: 210000 }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 1, nome: 'Pfizer Angola', contacto: '222123456', email: 'pfizer@angola.ao', nif: '111222333', produtos: 45 },
  { id: 2, nome: 'Novartis Angola', contacto: '222234567', email: 'novartis@angola.ao', nif: '444555666', produtos: 38 },
  { id: 3, nome: 'Roche Angola', contacto: '222345678', email: 'roche@angola.ao', nif: '777888999', produtos: 52 }
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  { id: 1, nome: 'Armazém Principal', localizacao: 'Luanda, Angola', capacidade: 10000, produtos: 250, responsavel: 'Carlos Mendes' },
  { id: 2, nome: 'Armazém 2', localizacao: 'Viana, Angola', capacidade: 8000, produtos: 180, responsavel: 'Ana Rodrigues' },
  { id: 3, nome: 'Armazém 3', localizacao: 'Talatona, Angola', capacidade: 6000, produtos: 120, responsavel: 'Rui Ferreira' }
];

export const INITIAL_TRANSFERS: Transfer[] = [
  { id: 1, data: '2026-07-10', origem: 'Armazém Principal', destino: 'Armazém 2', produto: 'Paracetamol 500mg', quantidade: 50, status: 'Concluída' },
  { id: 2, data: '2026-07-09', origem: 'Armazém 2', destino: 'Armazém 3', produto: 'Amoxicilina 500mg', quantidade: 30, status: 'Em Trânsito' }
];

export const INITIAL_ORDERS: Order[] = [
  { id: 1, data: '2026-07-11', fornecedor: 'Pfizer Angola', produtos: 'Paracetamol, Amoxicilina', valor: 250000, status: 'Pendente' },
  { id: 2, data: '2026-07-10', fornecedor: 'Novartis Angola', produtos: 'Ibuprofeno, Omeprazol', valor: 180000, status: 'Recebida' }
];

export const INITIAL_CASH_FLOW: CashFlowEntry[] = [
  { id: 1, data: '2026-07-11 09:30', tipo: 'Entrada', descricao: 'Venda #001', valor: 12550, responsavel: 'Admin' },
  { id: 2, data: '2026-07-11 10:15', tipo: 'Entrada', descricao: 'Venda #002', valor: 8990, responsavel: 'Admin' },
  { id: 3, data: '2026-07-11 11:00', tipo: 'Saída', descricao: 'Pagamento Fornecedor', valor: 50000, responsavel: 'Admin' }
];

export const INITIAL_USERS: User[] = [
  { id: 1, nome: 'Administrador', email: 'admin@hospital.ao', cargo: 'Administrador', status: 'Ativo', ultimoAcesso: '2026-07-11 08:00' },
  { id: 2, nome: 'João Farmacêutico', email: 'joao@hospital.ao', cargo: 'Operador', status: 'Ativo', ultimoAcesso: '2026-07-10 14:30' }
];

export const INITIAL_ACTIVITIES: Activity[] = [
  { id: 1, titulo: 'Sistema de Farmácia iniciado', data: '2026-07-11 08:00', tipo: 'sistema', usuario: 'Admin' },
  { id: 2, titulo: 'Venda #001 registrada com sucesso — 12.550 Kz', data: '2026-07-11 09:30', tipo: 'venda', usuario: 'Admin' },
  { id: 3, titulo: 'Saída de caixa — 50.000 Kz (Pagamento Fornecedor)', data: '2026-07-11 11:00', tipo: 'financeiro', usuario: 'Admin' }
];

export const INITIAL_CONFIG: AppConfig = {
  empresa: 'Farmácia Hospitalar',
  nif: '5401123456',
  iva: 14,
  moeda: 'Kz',
  endereco: 'Luanda, Angola',
  telefone: '(+244) 941 70 70 61',
  email: 'farmacia@hospital.ao',
  serie: 'A'
};

export const INITIAL_BACKUPS: Backup[] = [
  { id: 1, nome: 'Backup Automático Diário', data: '2026-07-11 03:00', tamanho: '2.4 MB' },
  { id: 2, nome: 'Backup Automático Diário', data: '2026-07-10 03:00', tamanho: '2.3 MB' },
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'FT-001',
    data: '2026-07-11 09:30',
    items: [{ id: 1, nome: 'Paracetamol 500mg', preco: 350, imagem: '', quantidade: 2, stock: 148 }],
    subtotal: 700,
    iva: 98,
    total: 798,
    clienteNome: 'João Silva',
    clienteNif: '123456789',
    metodoPagamento: 'Dinheiro',
    valorPago: 1000,
    troco: 202
  }
];

export const INITIAL_BILLS: Bill[] = [
  { id: 'BILL-1001', tipo: 'Receber', descricao: 'Fornecimento de Vacinas — Hospital Geral', valor: 350000, dataVencimento: '2026-07-20', status: 'Pendente' },
  { id: 'BILL-1002', tipo: 'Pagar', descricao: 'Fatura de Medicamentos Pfizer', valor: 120000, dataVencimento: '2026-07-15', status: 'Pendente' },
  { id: 'BILL-1003', tipo: 'Pagar', descricao: 'Aluguer das Instalações da Farmácia', valor: 85000, dataVencimento: '2026-07-05', status: 'Pago' },
];

export const INITIAL_REGISTERS: CashRegisterClosure[] = [
  {
    id: 'FECH-1783429381920',
    dataFechamento: '2026-07-10 18:00:00',
    operador: 'Administrador (AD)',
    valorCalculado: 192000,
    valorInformado: 192000,
    observacoes: 'Fechamento perfeito sem divergências de caixa.',
    status: 'Fechado'
  }
];

export const BRAND_LOGO = '';

export const HERO_BANNER = '';
