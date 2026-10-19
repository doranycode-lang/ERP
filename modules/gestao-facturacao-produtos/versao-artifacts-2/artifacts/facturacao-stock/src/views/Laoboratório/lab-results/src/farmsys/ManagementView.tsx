// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Download, 
  Save, 
  Database, 
  Mail, 
  Shield, 
  Coins, 
  UserPlus, 
  Warehouse, 
  Pill, 
  Users, 
  Factory, 
  ArrowLeftRight, 
  Box, 
  TrendingUp, 
  Clock, 
  FileText,
  Plug,
  Lock,
  Key,
  Printer,
  Eye,
  Wallet,
  Calendar,
  DollarSign,
  CheckCircle
} from 'lucide-react';
import { 
  Product, 
  Client, 
  Supplier, 
  Warehouse as WarehouseType, 
  Transfer, 
  Order, 
  CashFlowEntry, 
  User, 
  Activity, 
  Backup, 
  AppConfig,
  Sale,
  Bill,
  CashRegisterClosure
} from './types';
import { jsPDF } from 'jspdf';

interface ManagementViewProps {
  activeTab: string;
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  warehouses: WarehouseType[];
  transfers: Transfer[];
  orders: Order[];
  cashFlow: CashFlowEntry[];
  users: User[];
  activities: Activity[];
  backups: Backup[];
  config: AppConfig;
  sales: Sale[];
  bills: Bill[];
  closures: CashRegisterClosure[];
  onSelectInvoice: (sale: Sale) => void;
  onDeleteProduct: (id: number) => void;
  onDeleteClient: (id: number) => void;
  onDeleteSupplier: (id: number) => void;
  onDeleteWarehouse: (id: number) => void;
  onDeleteUser: (id: number) => void;
  onSaveConfig: (cfg: AppConfig) => void;
  onCreateBackup: () => void;
  onOpenModal: (modalId: string) => void;
  onShowNotification: (msg: string) => void;
  onAddBill: (bill: Omit<Bill, 'id'>) => void;
  onPayBill: (id: string) => void;
  onCloseRegister: (valorFinal: number, obs: string) => void;
}

export const ManagementView: React.FC<ManagementViewProps> = ({
  activeTab,
  products,
  clients,
  suppliers,
  warehouses,
  transfers,
  orders,
  cashFlow,
  users,
  activities,
  backups,
  config,
  sales,
  bills,
  closures,
  onSelectInvoice,
  onDeleteProduct,
  onDeleteClient,
  onDeleteSupplier,
  onDeleteWarehouse,
  onDeleteUser,
  onSaveConfig,
  onCreateBackup,
  onOpenModal,
  onShowNotification,
  onAddBill,
  onPayBill,
  onCloseRegister,
}) => {
  const [localSearch, setLocalSearch] = useState<string>('');
  
  // Product list search & filter states
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  const productCategories = React.useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.categoria) {
        cats.add(p.categoria);
      }
    });
    return ['Todas', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      // Category filter
      if (selectedCategory !== 'Todas' && product.categoria !== selectedCategory) {
        return false;
      }
      
      // Search query filter (name, code, batch/lote)
      if (!productSearch) return true;
      const query = productSearch.toLowerCase().trim();
      return (
        product.nome?.toLowerCase().includes(query) ||
        product.codigo?.toLowerCase().includes(query) ||
        product.lote?.toLowerCase().includes(query) ||
        product.descricao?.toLowerCase().includes(query)
      );
    });
  }, [products, productSearch, selectedCategory]);

  const [reportTab, setReportTab] = useState<'vendas' | 'produtos' | 'clientes' | 'financeiro'>('vendas');
  
  // Local state for Bills Form
  const [showBillForm, setShowBillForm] = useState<boolean>(false);
  const [billForm, setBillForm] = useState({
    descricao: '',
    tipo: 'Pagar' as 'Pagar' | 'Receber',
    valor: '',
    dataVencimento: new Date().toISOString().split('T')[0],
  });

  // Local state for Register Closure Form
  const [showClosureForm, setShowClosureForm] = useState<boolean>(false);
  const [closureForm, setClosureForm] = useState({
    valorFinal: '',
    observacoes: '',
  });

  // Local states for updating configuration forms
  const [cfgForm, setCfgForm] = useState<AppConfig>({ ...config });

  // Update configuration form local states when config prop changes
  React.useEffect(() => {
    setCfgForm({ ...config });
  }, [config]);

  // Search Filter Handler
  const filterBySearch = <T extends { nome?: string; codigo?: string; titulo?: string; descricao?: string; [key: string]: any }>(list: T[]): T[] => {
    if (!localSearch) return list;
    const query = localSearch.toLowerCase();
    return list.filter(item => {
      return (
        item.nome?.toLowerCase().includes(query) ||
        item.codigo?.toLowerCase().includes(query) ||
        item.titulo?.toLowerCase().includes(query) ||
        item.descricao?.toLowerCase().includes(query) ||
        item.id?.toString().toLowerCase().includes(query) ||
        (item.clienteNome && item.clienteNome.toLowerCase().includes(query)) ||
        (item.metodoPagamento && item.metodoPagamento.toLowerCase().includes(query))
      );
    });
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(cfgForm);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      let pageNum = 1;

      const drawHeader = (isFirstPage: boolean) => {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 15, 'F');
        
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 15, 210, 1.5, 'F');

        if (isFirstPage) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.setTextColor(15, 23, 42);
          doc.text(config.empresa.toUpperCase(), 15, 28);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`NIF: ${config.nif}`, 15, 33);
          doc.text(`Endereço: ${config.endereco}`, 15, 37);
          doc.text(`Tel: ${config.telefone} | Email: ${config.email}`, 15, 41);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(99, 102, 241);
          doc.text("RELATÓRIO PARA A CONTABILIDADE", 195, 28, { align: 'right' });

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          const today = new Date().toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          doc.text(`Emitido em: ${today}`, 195, 33, { align: 'right' });
          doc.text("Foco: Listagem de Vendas & Inventário Geral", 195, 37, { align: 'right' });
          doc.text(`Moeda Padrão: ${config.moeda}`, 195, 41, { align: 'right' });

          doc.setDrawColor(226, 232, 240);
          doc.line(15, 46, 195, 46);
        } else {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text(`${config.empresa.toUpperCase()} - RELATÓRIO CONTABILÍSTICO`, 15, 23);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`Vendas & Inventário de Fármacos`, 195, 23, { align: 'right' });
          
          doc.setDrawColor(226, 232, 240);
          doc.line(15, 26, 195, 26);
        }
      };

      const drawFooter = (docInstance: any, pageNo: number) => {
        docInstance.setFont("helvetica", "normal");
        docInstance.setFontSize(7.5);
        docInstance.setTextColor(148, 163, 184);
        docInstance.text("FarmaGest Pro v2.6 | Processado por computador", 15, 287);
        docInstance.text(`Página ${pageNo}`, 195, 287, { align: 'right' });
      };

      drawHeader(true);

      let currentY = 52;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("1. RESUMO EXECUTIVO DO PERÍODO", 15, currentY);
      currentY += 5;

      const cardWidth = 55;
      const cardHeight = 16;
      const cardSpacing = 5;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("VOLUME TOTAL DE VENDAS", 18, currentY + 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${config.moeda} ${totalSalesRevenue.toFixed(2)}`, 18, currentY + 11);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15 + cardWidth + cardSpacing, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("TOTAL DE TRANSAÇÕES POS", 18 + cardWidth + cardSpacing, currentY + 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${totalSalesCount} transações`, 18 + cardWidth + cardSpacing, currentY + 11);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15 + (cardWidth + cardSpacing) * 2, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("VALOR TOTAL DO STOCK", 18 + (cardWidth + cardSpacing) * 2, currentY + 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(99, 102, 241);
      doc.text(`${config.moeda} ${totalStockItemsValue.toFixed(2)}`, 18 + (cardWidth + cardSpacing) * 2, currentY + 11);

      currentY += cardHeight + 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("2. LISTAGEM DETALHADA DO INVENTÁRIO (STOCK)", 15, currentY);
      currentY += 5;

      doc.setFillColor(241, 245, 249);
      doc.rect(15, currentY, 180, 7, 'F');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      doc.text("CÓDIGO", 17, currentY + 4.5);
      doc.text("NOME DO FÁRMACO", 42, currentY + 4.5);
      doc.text("CATEGORIA", 112, currentY + 4.5);
      doc.text("STOCK", 147, currentY + 4.5, { align: 'right' });
      doc.text("P. UNIT.", 167, currentY + 4.5, { align: 'right' });
      doc.text("VALOR TOTAL", 193, currentY + 4.5, { align: 'right' });

      currentY += 7;

      products.forEach((p, idx) => {
        if (currentY > 265) {
          drawFooter(doc, pageNum);
          doc.addPage();
          pageNum++;
          drawHeader(false);
          
          currentY = 32;
          doc.setFillColor(241, 245, 249);
          doc.rect(15, currentY, 180, 7, 'F');
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
          doc.text("CÓDIGO", 17, currentY + 4.5);
          doc.text("NOME DO FÁRMACO", 42, currentY + 4.5);
          doc.text("CATEGORIA", 112, currentY + 4.5);
          doc.text("STOCK", 147, currentY + 4.5, { align: 'right' });
          doc.text("P. UNIT.", 167, currentY + 4.5, { align: 'right' });
          doc.text("VALOR TOTAL", 193, currentY + 4.5, { align: 'right' });
          currentY += 7;
        }

        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, currentY, 180, 6.5, 'F');
        }

        doc.setDrawColor(241, 245, 249);
        doc.line(15, currentY + 6.5, 195, currentY + 6.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);

        doc.text(p.codigo || 'N/A', 17, currentY + 4.5);
        
        let name = p.nome || '';
        if (name.length > 38) name = name.substring(0, 35) + "...";
        doc.text(name, 42, currentY + 4.5);
        
        doc.text(p.categoria || 'Geral', 112, currentY + 4.5);
        doc.text(p.stock.toString(), 147, currentY + 4.5, { align: 'right' });
        doc.text(`${config.moeda} ${p.preco.toFixed(2)}`, 167, currentY + 4.5, { align: 'right' });
        doc.text(`${config.moeda} ${(p.stock * p.preco).toFixed(2)}`, 193, currentY + 4.5, { align: 'right' });

        currentY += 6.5;
      });

      doc.setDrawColor(158, 163, 184);
      doc.line(15, currentY, 195, currentY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("TOTAL INVENTARIADO", 17, currentY + 4.5);
      doc.text(totalStockQty.toString(), 147, currentY + 4.5, { align: 'right' });
      doc.text(`${config.moeda} ${totalStockItemsValue.toFixed(2)}`, 193, currentY + 4.5, { align: 'right' });
      currentY += 12;

      if (currentY > 230) {
        drawFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        drawHeader(false);
        currentY = 32;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("3. HISTÓRICO DE VENDAS E FACTURAÇÃO POS", 15, currentY);
      currentY += 5;

      doc.setFillColor(241, 245, 249);
      doc.rect(15, currentY, 180, 7, 'F');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      doc.text("ID DOCUMENTO", 17, currentY + 4.5);
      doc.text("DATA DE EMISSÃO", 47, currentY + 4.5);
      doc.text("CLIENTE", 82, currentY + 4.5);
      doc.text("MÉTODO PAG.", 132, currentY + 4.5);
      doc.text("SUBTOTAL", 162, currentY + 4.5, { align: 'right' });
      doc.text("VALOR TOTAL", 193, currentY + 4.5, { align: 'right' });

      currentY += 7;

      sales.forEach((s, idx) => {
        if (currentY > 265) {
          drawFooter(doc, pageNum);
          doc.addPage();
          pageNum++;
          drawHeader(false);
          
          currentY = 32;
          doc.setFillColor(241, 245, 249);
          doc.rect(15, currentY, 180, 7, 'F');
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
          doc.text("ID DOCUMENTO", 17, currentY + 4.5);
          doc.text("DATA DE EMISSÃO", 47, currentY + 4.5);
          doc.text("CLIENTE", 82, currentY + 4.5);
          doc.text("MÉTODO PAG.", 132, currentY + 4.5);
          doc.text("SUBTOTAL", 162, currentY + 4.5, { align: 'right' });
          doc.text("VALOR TOTAL", 193, currentY + 4.5, { align: 'right' });
          currentY += 7;
        }

        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, currentY, 180, 6.5, 'F');
        }

        doc.setDrawColor(241, 245, 249);
        doc.line(15, currentY + 6.5, 195, currentY + 6.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);

        doc.text(s.id || 'N/A', 17, currentY + 4.5);
        doc.text(s.data || 'N/A', 47, currentY + 4.5);
        
        let cliente = s.clienteNome || 'Consumidor Final';
        if (cliente.length > 25) cliente = cliente.substring(0, 22) + "...";
        doc.text(cliente, 82, currentY + 4.5);
        
        doc.text(s.metodoPagamento || 'N/A', 132, currentY + 4.5);
        doc.text(`${config.moeda} ${s.subtotal.toFixed(2)}`, 162, currentY + 4.5, { align: 'right' });
        doc.text(`${config.moeda} ${s.total.toFixed(2)}`, 193, currentY + 4.5, { align: 'right' });

        currentY += 6.5;
      });

      doc.setDrawColor(158, 163, 184);
      doc.line(15, currentY, 195, currentY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("TOTAL EM VENDAS REGISTADAS", 17, currentY + 4.5);
      doc.text(`${config.moeda} ${totalSalesRevenue.toFixed(2)}`, 193, currentY + 4.5, { align: 'right' });

      currentY += 12;

      if (currentY > 235) {
        drawFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        drawHeader(false);
        currentY = 32;
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, currentY, 180, 25, 2, 2, 'FD');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text("NOTAS DE AUDITORIA CONTABILÍSTICA", 19, currentY + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("1. Este documento resume todas as operacoes de venda concluidas no POS e o estado atual do inventario.", 19, currentY + 11);
      doc.text("2. Processado eletronicamente atraves do sistema certificado de gestao FarmaGest Pro v2.6.", 19, currentY + 15);
      doc.text("3. A integridade dos dados e as hashes de faturacao associadas estao em total conformidade com as regras fiscais vigentes.", 19, currentY + 19);

      drawFooter(doc, pageNum);

      doc.save(`relatorio_contabilidade_${new Date().toISOString().split('T')[0]}.pdf`);
      onShowNotification("Relatório contabilístico exportado para PDF com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      onShowNotification("Erro ao gerar relatório PDF. Contacte o suporte.");
    }
  };

  // Calculations for Reports page
  const totalSalesRevenue = cashFlow
    .filter(entry => entry.tipo === 'Entrada' && entry.descricao.startsWith('Venda'))
    .reduce((sum, entry) => sum + entry.valor, 0);

  const totalSalesCount = cashFlow.filter(entry => entry.tipo === 'Entrada' && entry.descricao.startsWith('Venda')).length;
  
  const totalStockItemsValue = products.reduce((sum, p) => sum + p.preco * p.stock, 0);
  const totalStockQty = products.reduce((sum, p) => sum + p.stock, 0);

  const totalClientPurchases = clients.reduce((sum, c) => sum + c.totalCompras, 0);

  const totalEntries = cashFlow.filter(entry => entry.tipo === 'Entrada').reduce((sum, entry) => sum + entry.valor, 0);
  const totalOutlays = cashFlow.filter(entry => entry.tipo === 'Saída').reduce((sum, entry) => sum + entry.valor, 0);
  const netBalance = totalEntries - totalOutlays;

  return (
    <div className="space-y-6">
      {/* Search Header for suitable lists */}
      {['produtos', 'clientes', 'fornecedores', 'armazens', 'atividades', 'facturas', 'contas'].includes(activeTab) && (
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          {activeTab !== 'produtos' ? (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Pesquisar em ${activeTab}...`}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-slate-100 placeholder:text-slate-500 text-sm"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Database className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
              <span className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Catálogo de Fármacos</span>
            </div>
          )}
          
          {/* List specific add buttons */}
          {activeTab === 'produtos' && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.print()} 
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer no-print"
                title="Imprimir stock de medicamentos"
              >
                <Printer className="h-4 w-4" /> Imprimir Stock
              </button>
              <button onClick={() => onOpenModal('modal-produto')} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer no-print">
                <Plus className="h-4 w-4" /> Novo Produto
              </button>
            </div>
          )}
          {activeTab === 'facturas' && (
            <button 
              onClick={() => window.print()} 
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer no-print"
              title="Imprimir relatório geral de facturação"
            >
              <Printer className="h-4 w-4" /> Imprimir Relatório
            </button>
          )}
          {activeTab === 'clientes' && (
            <button onClick={() => onOpenModal('modal-cliente')} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer">
              <Plus className="h-4 w-4" /> Novo Cliente
            </button>
          )}
          {activeTab === 'fornecedores' && (
            <button onClick={() => onOpenModal('modal-fornecedor')} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer">
              <Plus className="h-4 w-4" /> Novo Fornecedor
            </button>
          )}
          {activeTab === 'armazens' && (
            <button onClick={() => onOpenModal('modal-armazem')} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer">
              <Plus className="h-4 w-4" /> Novo Armazém
            </button>
          )}
        </div>
      )}

      {/* 1. PRODUCTS TAB */}
      {activeTab === 'produtos' && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Pill className="h-5 w-5 text-indigo-400" /> Tabela de Medicamentos e Produtos
            </h3>
            <span className="text-xs text-slate-400">Total: {products.length} itens</span>
          </div>

          {/* Interactive Search & Category Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 no-print">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por nome, código ou lote..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-14 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:border-indigo-500 text-slate-100 placeholder:text-slate-500 text-xs transition-all"
              />
              {productSearch && (
                <button
                  onClick={() => setProductSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-[10px] font-bold uppercase tracking-wider"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-xs font-mono text-slate-500 whitespace-nowrap">Categoria:</span>
              <div className="flex gap-1.5">
                {productCategories.map(cat => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-950/50'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 font-mono">
                  <th className="py-3 px-4">Imagem</th>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Preço</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                      Nenhum medicamento encontrado para os critérios de pesquisa atuais.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr key={product.id} className="border-b border-slate-850 hover:bg-white/5 transition-all text-sm text-slate-300">
                      <td className="py-2.5 px-4">
                        <div className="w-11 h-11 rounded-lg bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
                          <img 
                            src={product.imagem} 
                            alt={product.nome} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-400">{product.codigo}</td>
                      <td className="py-2.5 px-4">
                        <p className="font-semibold text-slate-200">{product.nome}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Lote: <span className="text-slate-400">{product.lote || 'N/D'}</span> | Validade: <span className={product.validade ? 'text-slate-400' : 'text-slate-500'}>{product.validade || 'N/D'}</span>
                        </p>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {product.categoria}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">
                        {config.moeda}{product.preco.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4">
                        {(() => {
                          const min = product.stockMinimo !== undefined ? product.stockMinimo : 50;
                          const isLow = product.stock < min;
                          return (
                            <>
                              <span className={`font-mono font-bold ${isLow ? 'text-rose-400 animate-pulse font-black' : 'text-slate-300'}`}>
                                {product.stock}
                              </span>
                              <p className="text-[10px] text-slate-500 font-mono">Mín: {min}</p>
                            </>
                          );
                        })()}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-400">{product.armazem}</td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                          title="Eliminar produto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CLIENTS TAB */}
      {activeTab === 'clientes' && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-400" /> Base de Dados CRM - Clientes
            </h3>
            <span className="text-xs text-slate-400">Total: {clients.length} clientes</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 font-mono">
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Telefone</th>
                  <th className="py-3 px-4">NIF</th>
                  <th className="py-3 px-4 text-right">Volume de Compras</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filterBySearch(clients).map(client => (
                  <tr key={client.id} className="border-b border-slate-850 hover:bg-white/5 transition-all text-sm text-slate-300">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{client.nome}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">{client.email}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">{client.telefone}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">{client.nif}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {config.moeda}{client.totalCompras.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onDeleteClient(client.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SUPPLIERS TAB */}
      {activeTab === 'fornecedores' && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Factory className="h-5 w-5 text-indigo-400" /> Fornecedores de Fármacos
            </h3>
            <span className="text-xs text-slate-400">Cadastrados: {suppliers.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 font-mono">
                  <th className="py-3 px-4">Empresa</th>
                  <th className="py-3 px-4">Telefone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">NIF</th>
                  <th className="py-3 px-4">Medicamentos Associados</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filterBySearch(suppliers).map(supplier => (
                  <tr key={supplier.id} className="border-b border-slate-850 hover:bg-white/5 transition-all text-sm text-slate-300">
                    <td className="py-3.5 px-4 font-bold text-slate-200">{supplier.nome}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">{supplier.contacto}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">{supplier.email}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">{supplier.nif}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                        {supplier.produtos} un.
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onDeleteSupplier(supplier.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                        title="Eliminar fornecedor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. WAREHOUSES TAB */}
      {activeTab === 'armazens' && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-indigo-400" /> Logística de Armazéns e Depósitos
            </h3>
            <span className="text-xs text-slate-400">Instalações ativas: {warehouses.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 font-mono">
                  <th className="py-3 px-4">Nome do Depósito</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4">Capacidade Limite</th>
                  <th className="py-3 px-4">Lotes Armazenados</th>
                  <th className="py-3 px-4">Gestor Responsável</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filterBySearch(warehouses).map(wh => (
                  <tr key={wh.id} className="border-b border-slate-850 hover:bg-white/5 transition-all text-sm text-slate-300">
                    <td className="py-3.5 px-4 font-bold text-slate-200">{wh.nome}</td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs">{wh.localizacao}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">{wh.capacidade}</td>
                    <td className="py-3.5 px-4 font-mono text-indigo-400 font-bold">{wh.produtos}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium text-xs">{wh.responsavel}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onDeleteWarehouse(wh.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                        title="Eliminar armazém"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TRANSFERS TAB */}
      {activeTab === 'transferencias' && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-indigo-400" /> Transferências de Stock Inter-Armazéns
            </h3>
            <button onClick={() => onOpenModal('modal-transferencia')} className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Nova Transferência
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 font-mono">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Origem</th>
                  <th className="py-3 px-4">Destino</th>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Qtd</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(tr => (
                  <tr key={tr.id} className="border-b border-slate-850 hover:bg-white/5 transition-all text-sm text-slate-300">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">#{tr.id}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{tr.data}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">{tr.origem}</td>
                    <td className="py-3.5 px-4 font-medium text-indigo-300">{tr.destino}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-300">{tr.produto}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100">{tr.quantidade}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tr.status === 'Concluída' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : tr.status === 'Em Trânsito'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {tr.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. ORDERS TAB (ENCOMENDAS) */}
      {activeTab === 'encomendas' && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Box className="h-5 w-5 text-indigo-400" /> Ordens de Encomenda de Medicamentos
            </h3>
            <button onClick={() => onOpenModal('modal-encomenda')} className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Registar Encomenda
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 font-mono">
                  <th className="py-3 px-4">Encomenda ID</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Fornecedor</th>
                  <th className="py-3 px-4">Medicamentos Ordenados</th>
                  <th className="py-3 px-4">Valor Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-slate-850 hover:bg-white/5 transition-all text-sm text-slate-300">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">#ENC{order.id}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{order.data}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-200">{order.fornecedor}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 max-w-xs truncate">{order.produtos}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{config.moeda}{order.valor.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'Recebida' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. CAIXA TAB */}
      {activeTab === 'caixa' && (
        <div className="space-y-6">
          {/* Caixa Specific Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-lg relative overflow-hidden">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Saldo Líquido em Caixa</span>
              <h3 className={`text-2xl font-bold mt-1 font-display ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {config.moeda}{netBalance.toFixed(2)}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">Fundo de maneio e vendas consolidadas</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-lg relative overflow-hidden">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Geral Entradas</span>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1 font-display">
                +{config.moeda}{totalEntries.toFixed(2)}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">PDV e injeções manuais de capital</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-lg relative overflow-hidden">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Geral Saídas</span>
              <h3 className="text-2xl font-bold text-rose-400 mt-1 font-display">
                -{config.moeda}{totalOutlays.toFixed(2)}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">Pagamentos e retiradas operacionais</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Coins className="h-5 w-5 text-indigo-400" /> Extrato de Caixa Completo
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onOpenModal('modal-entrada')} 
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600/15 border border-emerald-500/20 hover:bg-emerald-600/25 text-emerald-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-emerald-950/20 active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" /> Entrada Manual
                </button>
                <button 
                  onClick={() => onOpenModal('modal-saida')} 
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600/15 border border-rose-500/20 hover:bg-rose-600/25 text-rose-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-rose-950/20 active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Saída Manual
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 font-mono">
                    <th className="py-3 px-4">Data/Hora</th>
                    <th className="py-3 px-4">Tipo de Movimento</th>
                    <th className="py-3 px-4">Descrição da Operação</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4">Operador Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlow.map(entry => (
                    <tr key={entry.id} className="border-b border-slate-850 hover:bg-white/5 transition-all text-sm text-slate-300">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{entry.data}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          entry.tipo === 'Entrada' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {entry.tipo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">{entry.descricao}</td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                        entry.tipo === 'Entrada' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {entry.tipo === 'Entrada' ? '+' : '-'}{config.moeda}{entry.valor.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">{entry.responsavel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. REPORTS TAB */}
      {activeTab === 'relatorios' && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-400" /> Relatórios de Desempenho e Indicadores
            </h3>
            <button 
              onClick={handleExportPDF} 
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-500/10 active:scale-95 no-print"
              title="Exportar listagem de vendas e inventário para PDF"
            >
              <Download className="h-4 w-4" /> Exportar para Contabilidade (PDF)
            </button>
          </div>

          {/* Sub Navigation for Reports */}
          <div className="flex border-b border-slate-800 gap-1 overflow-x-auto">
            {(['vendas', 'produtos', 'clientes', 'financeiro'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setReportTab(tab)}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer capitalize ${
                  reportTab === tab
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content rendered depending on Report SubTab */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {reportTab === 'vendas' && (
              <>
                <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Faturação Total Vendas POS</span>
                  <h4 className="text-2xl font-extrabold text-white mt-2 font-display">{config.moeda}{totalSalesRevenue.toFixed(2)}</h4>
                </div>
                <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Número Total de Cupons POS</span>
                  <h4 className="text-2xl font-extrabold text-white mt-2 font-display">{totalSalesCount} v.</h4>
                </div>
                <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Ticket Médio por Cupom</span>
                  <h4 className="text-2xl font-extrabold text-white mt-2 font-display">
                    {config.moeda}{totalSalesCount > 0 ? (totalSalesRevenue / totalSalesCount).toFixed(2) : '0.00'}
                  </h4>
                </div>
              </>
            )}

            {reportTab === 'produtos' && (
              <>
                <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Total Lotes de Fármacos</span>
                  <h4 className="text-2xl font-extrabold text-white mt-2 font-display">{products.length} un.</h4>
                </div>
                <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Stock de Unidades Globais</span>
                  <h4 className="text-2xl font-extrabold text-white mt-2 font-display">{totalStockQty} un.</h4>
                </div>
                <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Valor Total de Inventário</span>
                  <h4 className="text-2xl font-extrabold text-white mt-2 font-display">{config.moeda}{totalStockItemsValue.toFixed(2)}</h4>
                </div>
              </>
            )}

            {reportTab === 'clientes' && (
              <>
                <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Clientes Ativos Registados</span>
                  <h4 className="text-2xl font-extrabold text-white mt-2 font-display">{clients.length} c.</h4>
                </div>
                <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Volume Total Acumulado compras</span>
                  <h4 className="text-2xl font-extrabold text-white mt-2 font-display">{config.moeda}{totalClientPurchases.toFixed(2)}</h4>
                </div>
                <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Faturação Média por Cliente</span>
                  <h4 className="text-2xl font-extrabold text-white mt-2 font-display">
                    {config.moeda}{clients.length > 0 ? (totalClientPurchases / clients.length).toFixed(2) : '0.00'}
                  </h4>
                </div>
              </>
            )}

            {reportTab === 'financeiro' && (
              <>
                <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Total Entradas Financeiras</span>
                  <h4 className="text-2xl font-extrabold text-white mt-2 font-display text-emerald-400">+{config.moeda}{totalEntries.toFixed(2)}</h4>
                </div>
                <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Total Saídas Financeiras</span>
                  <h4 className="text-2xl font-extrabold text-white mt-2 font-display text-rose-400">-{config.moeda}{totalOutlays.toFixed(2)}</h4>
                </div>
                <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Margem de Caixa Consolidada</span>
                  <h4 className={`text-2xl font-extrabold mt-2 font-display ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {config.moeda}{netBalance.toFixed(2)}
                  </h4>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 9. USERS TAB */}
      {activeTab === 'usuarios' && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-400" /> Utilizadores e Acessos ao Sistema
            </h3>
            <button onClick={() => onOpenModal('modal-usuario')} className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Novo Utilizador
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 font-mono">
                  <th className="py-3 px-4">Utilizador ID</th>
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Cargo / Função</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Último Acesso Registado</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-slate-850 hover:bg-white/5 transition-all text-sm text-slate-300">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">#USR{user.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-200">{user.nome}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">{user.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                        {user.cargo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${user.status === 'Ativo' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
                      <span className="text-xs text-slate-300">{user.status}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">{user.ultimoAcesso}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        disabled={user.cargo === 'Administrador'}
                        className={`p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 transition-all cursor-pointer ${
                          user.cargo === 'Administrador' ? 'opacity-30 pointer-events-none' : ''
                        }`}
                        title="Eliminar utilizador"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 10. PERMISSIONS TAB */}
      {activeTab === 'permissoes' && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-indigo-400" /> Permissões de Perfis (Acessos Rápidos)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Dashboard Principal', desc: 'Permite aceder ao resumo estatístico de vendas e logística.' },
              { name: 'POS (Ponto de Venda)', desc: 'Permite aceder e registar cupons fiscais no caixa POS.' },
              { name: 'Fármacos e Produtos', desc: 'Permite registar, alterar e eliminar medicamentos.' },
              { name: 'Gestão CRM de Clientes', desc: 'Permite aceder aos dados cadastrais dos clientes.' },
              { name: 'Gestão de Fornecedores', desc: 'Permite consultar e encomendar lotes de medicamentos.' },
              { name: 'Inventário e Armazéns', desc: 'Permite transferir medicamentos entre armazéns.' },
              { name: 'Caixa Financeiro', desc: 'Permite gerir fluxos de caixa e registar faturas manuais.' },
              { name: 'Relatórios Avançados', desc: 'Permite aceder a análises avançadas de balanço fiscal.' },
              { name: 'Configuração de Segurança', desc: 'Apenas Administradores podem gerir novos utilizadores.' },
            ].map((perm, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 flex items-start gap-3 justify-between">
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-white">{perm.name}</h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{perm.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input type="checkbox" defaultChecked={idx < 7} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button 
              onClick={() => onShowNotification('As configurações de permissões de perfil de segurança foram consolidadas com sucesso.')} 
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-500/10 active:scale-95"
            >
              <Save className="h-4 w-4" /> Salvar Definições de Perfis
            </button>
          </div>
        </div>
      )}

      {/* 11. ACTIVITIES TAB */}
      {activeTab === 'atividades' && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-400" /> Logs de Atividades de Auditoria do Sistema
            </h3>
            <span className="text-xs text-slate-400">Total: {activities.length} ações</span>
          </div>

          <div className="space-y-3">
            {filterBySearch(activities).map(act => (
              <div 
                key={act.id} 
                className="p-3 rounded-xl bg-slate-950/40 border border-slate-850 flex items-start gap-3 transition-all hover:border-slate-800"
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  act.tipo === 'venda' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : act.tipo === 'financeiro'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : act.tipo === 'logistica'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  {act.tipo === 'venda' && <Coins className="h-4 w-4" />}
                  {act.tipo === 'financeiro' && <Coins className="h-4 w-4" />}
                  {act.tipo === 'logistica' && <Warehouse className="h-4 w-4" />}
                  {act.tipo === 'sistema' && <Shield className="h-4 w-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-200 leading-normal">{act.titulo}</h5>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">{act.data} | Operador: {act.usuario}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 12. BACKUP TAB */}
      {activeTab === 'backup' && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-400" /> backups de Segurança (Hot Backup)
            </h3>
            <button 
              onClick={onCreateBackup} 
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-500/10 active:scale-95"
            >
              <Database className="h-4 w-4" /> Criar Cópia de Segurança
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Configure cópias automáticas ou realize um backup instantâneo da sua base de dados do 
            <strong> NVUALASOT</strong>. Todas as imagens e históricos de caixa são encriptados e compactados.
          </p>

          <div className="space-y-3">
            {backups.map(bk => (
              <div key={bk.id} className="p-4 rounded-xl bg-slate-950/50 border border-slate-850 flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">{bk.nome}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">{bk.data} | Dimensão: {bk.tamanho}</p>
                </div>
                <button 
                  onClick={() => onShowNotification(`Download do ficheiro ${bk.nome} iniciado com sucesso.`)} 
                  className="p-2 rounded-lg bg-slate-900 hover:bg-indigo-500/15 border border-slate-800 hover:border-indigo-500/30 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 13. INTEGRATIONS TAB */}
      {activeTab === 'integracoes' && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Plug className="h-5 w-5 text-indigo-400" /> Integrações e Módulos Cloud
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Faturação Eletrónica AGT', status: 'Desconectado', desc: 'Modulo de certificação com regras fiscais AGT Angola.' },
              { name: 'Cloud Sync Automatizado', status: 'Conectado', desc: 'Backup incremental em tempo real para servidores seguros da nuvem.' },
              { name: 'Servidor Email SMTP', status: 'Conectado', desc: 'Notificação automática de baixo stock e relatórios diários.' },
              { name: 'Gateway Pagamentos', status: 'Desconectado', desc: 'Suporte a pagamentos por Cartão de Crédito e Referência de Caixa.' },
              { name: 'Notificações SMS Ango', status: 'Conectado', desc: 'Envio de receitas e lembretes por SMS para clientes.' },
              { name: 'Leitor Código Barras', status: 'Conectado', desc: 'Integração nativa com leitores USB e Bluetooth.' },
            ].map((int, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 flex flex-col justify-between h-36">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-white">{int.name}</h4>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      int.status === 'Conectado'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {int.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">{int.desc}</p>
                </div>
                <button 
                  onClick={() => onShowNotification(`Configurações avançadas para ${int.name} requerem privilégios superiores de Administrador.`)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold text-left transition-colors cursor-pointer"
                >
                  Configurar Módulo →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 13.4 CONTAS A PAGAR / RECEBER & FECHAMENTO DE CAIXA */}
      {activeTab === 'contas' && (
        <div className="space-y-6">
          {/* Summary Dashboard for Accounts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 shadow-md">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider">Pendente a Pagar</span>
              <h4 className="text-xl font-bold text-rose-400 mt-1 font-display">
                {config.moeda}
                {bills
                  .filter(b => b.tipo === 'Pagar' && b.status === 'Pendente')
                  .reduce((sum, b) => sum + b.valor, 0)
                  .toFixed(2)}
              </h4>
              <p className="text-[10px] text-slate-500 mt-1">Compromissos financeiros futuros</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 shadow-md">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider">Pendente a Receber</span>
              <h4 className="text-xl font-bold text-emerald-400 mt-1 font-display">
                {config.moeda}
                {bills
                  .filter(b => b.tipo === 'Receber' && b.status === 'Pendente')
                  .reduce((sum, b) => sum + b.valor, 0)
                  .toFixed(2)}
              </h4>
              <p className="text-[10px] text-slate-500 mt-1">Valores a serem creditados</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-indigo-500/20 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <span className="text-[10px] uppercase font-mono text-indigo-400 font-bold tracking-wider">Fluxo de Caixa Projetado</span>
              <h4 className="text-xl font-bold text-white mt-1 font-display">
                {config.moeda}
                {(
                  netBalance +
                  bills.filter(b => b.tipo === 'Receber' && b.status === 'Pendente').reduce((sum, b) => sum + b.valor, 0) -
                  bills.filter(b => b.tipo === 'Pagar' && b.status === 'Pendente').reduce((sum, b) => sum + b.valor, 0)
                ).toFixed(2)}
              </h4>
              <p className="text-[10px] text-indigo-300/65 mt-1">Previsão de saldo líquida real</p>
            </div>
          </div>

          {/* Collapsible Actions Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Launch Account Form Card */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wallet className="text-indigo-400 h-4.5 w-4.5" /> Novo Lançamento Financeiro
                </h3>
                <button 
                  onClick={() => setShowBillForm(!showBillForm)}
                  className="px-2.5 py-1 text-[10px] font-bold rounded bg-slate-800 hover:bg-slate-750 text-slate-300 transition-all cursor-pointer"
                >
                  {showBillForm ? 'Ocultar' : 'Expandir'}
                </button>
              </div>

              {showBillForm && (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!billForm.descricao || !billForm.valor) {
                      onShowNotification('Por favor, preencha a descrição e o valor.');
                      return;
                    }
                    onAddBill({
                      descricao: billForm.descricao,
                      tipo: billForm.tipo,
                      valor: parseFloat(billForm.valor) || 0,
                      dataVencimento: billForm.dataVencimento,
                      status: 'Pendente'
                    });
                    setBillForm({
                      descricao: '',
                      tipo: 'Pagar',
                      valor: '',
                      dataVencimento: new Date().toISOString().split('T')[0],
                    });
                    setShowBillForm(false);
                    onShowNotification('Lançamento financeiro registrado com sucesso.');
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Descrição da Conta</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Fornecimento de Amoxicilina Medis"
                      value={billForm.descricao}
                      onChange={(e) => setBillForm({ ...billForm, descricao: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-slate-100 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Tipo de Conta</label>
                      <select
                        value={billForm.tipo}
                        onChange={(e) => setBillForm({ ...billForm, tipo: e.target.value as 'Pagar' | 'Receber' })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-slate-100 text-xs"
                      >
                        <option value="Pagar">A Pagar (Despesa)</option>
                        <option value="Receber">A Receber (Receita)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Valor ({config.moeda})</label>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={billForm.valor}
                        onChange={(e) => setBillForm({ ...billForm, valor: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-slate-100 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Data de Vencimento</label>
                    <input 
                      type="date" 
                      value={billForm.dataVencimento}
                      onChange={(e) => setBillForm({ ...billForm, dataVencimento: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-slate-100 text-xs"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Salvar Lançamento
                  </button>
                </form>
              )}
              {!showBillForm && (
                <p className="text-xs text-slate-500 leading-normal">
                  Crie previsões e compromissos de receitas ou despesas com vencimento programado. O sistema alerta automaticamente quando o vencimento estiver próximo.
                </p>
              )}
            </div>

            {/* Cash Register Closure Form Card */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Coins className="text-emerald-400 h-4.5 w-4.5" /> Fechamento de Caixa Diário
                </h3>
                <button 
                  onClick={() => setShowClosureForm(!showClosureForm)}
                  className="px-2.5 py-1 text-[10px] font-bold rounded bg-slate-800 hover:bg-slate-750 text-slate-300 transition-all cursor-pointer"
                >
                  {showClosureForm ? 'Ocultar' : 'Expandir'}
                </button>
              </div>

              {showClosureForm && (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!closureForm.valorFinal) {
                      onShowNotification('Por favor, indique o valor físico final contado em caixa.');
                      return;
                    }
                    const vFinal = parseFloat(closureForm.valorFinal) || 0;
                    onCloseRegister(vFinal, closureForm.observacoes);
                    setClosureForm({
                      valorFinal: '',
                      observacoes: '',
                    });
                    setShowClosureForm(false);
                    onShowNotification('Caixa fechado e auditado com sucesso!');
                  }}
                  className="space-y-3"
                >
                  <div className="p-2.5 rounded bg-slate-950/60 border border-slate-850 text-xs space-y-1">
                    <p className="text-slate-400">Saldo atual calculado no sistema:</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono">{config.moeda}{netBalance.toFixed(2)}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Valor Contado Físico ({config.moeda})</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="Indique o montante contado"
                      value={closureForm.valorFinal}
                      onChange={(e) => setBillForm({ ...billForm }) /* Avoid any type warning */ || setClosureForm({ ...closureForm, valorFinal: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-slate-100 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Observações / Justificativa de Diferença</label>
                    <textarea 
                      rows={2}
                      placeholder="Escreva divergências ou justificativas de quebras de caixa..."
                      value={closureForm.observacoes}
                      onChange={(e) => setClosureForm({ ...closureForm, observacoes: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-slate-100 text-xs resize-none"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Encerrar e Auditar Sessão de Caixa
                  </button>
                </form>
              )}
              {!showClosureForm && (
                <p className="text-xs text-slate-500 leading-normal">
                  Realize auditorias diárias do dinheiro em caixa. Compare o saldo teórico computado pelo sistema com o saldo real contado pelos operadores.
                </p>
              )}
            </div>
          </div>

          {/* Bills List Table */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-indigo-400" /> Agenda de Contas Pagar & Receber
              </h3>
              <span className="text-xs text-slate-400">Total: {bills.length} registros</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 font-mono">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Descrição</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Valor</th>
                    <th className="py-2.5 px-3">Vencimento</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filterBySearch(bills).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-500 font-mono">
                        Nenhum compromisso financeiro encontrado.
                      </td>
                    </tr>
                  ) : (
                    filterBySearch(bills).map(bill => (
                      <tr key={bill.id} className="border-b border-slate-850 hover:bg-white/5 transition-all text-sm text-slate-300">
                        <td className="py-2.5 px-3 font-mono text-xs text-slate-500">{bill.id}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-200">{bill.descricao}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            bill.tipo === 'Pagar' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {bill.tipo === 'Pagar' ? 'A Pagar' : 'A Receber'}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 font-bold font-mono ${bill.tipo === 'Pagar' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {config.moeda}{bill.valor.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-slate-400">{bill.dataVencimento}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bill.status === 'Pago' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-amber-500/10 text-amber-400 animate-pulse'
                          }`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {bill.status === 'Pendente' ? (
                            <button
                              onClick={() => onPayBill(bill.id)}
                              className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-all cursor-pointer"
                              title="Liquidar/Receber Valor"
                            >
                              Liquidar
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Liquidado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cash Register Closures History */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Coins className="h-4.5 w-4.5 text-indigo-400" /> Histórico de Fechamento de Caixa
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 font-mono">
                    <th className="py-2.5 px-3">Data/Hora</th>
                    <th className="py-2.5 px-3">Operador</th>
                    <th className="py-2.5 px-3 text-right">Saldo Previsto</th>
                    <th className="py-2.5 px-3 text-right">Saldo Contado</th>
                    <th className="py-2.5 px-3 text-right">Quebra/Diferença</th>
                    <th className="py-2.5 px-3">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {closures.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-500 font-mono">
                        Nenhuma auditoria de encerramento efetuada.
                      </td>
                    </tr>
                  ) : (
                    closures.map(closure => {
                      const diff = closure.valorInformado - closure.valorCalculado;
                      return (
                        <tr key={closure.id} className="border-b border-slate-850 hover:bg-white/5 transition-all text-sm text-slate-300">
                          <td className="py-3 px-3 font-mono text-xs">{closure.dataFechamento}</td>
                          <td className="py-3 px-3 font-semibold text-slate-300">{closure.operador}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-400">{config.moeda}{closure.valorCalculado.toFixed(2)}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-200 font-semibold">{config.moeda}{closure.valorInformado.toFixed(2)}</td>
                          <td className={`py-3 px-3 text-right font-mono font-bold ${
                            diff === 0 
                              ? 'text-emerald-400' 
                              : diff > 0 
                              ? 'text-indigo-400' 
                              : 'text-rose-400'
                          }`}>
                            {diff === 0 ? 'Sem quebras' : `${diff > 0 ? '+' : ''}${config.moeda}${diff.toFixed(2)}`}
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-500 max-w-xs truncate" title={closure.observacoes}>
                            {closure.observacoes || 'Sem notas explicativas.'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 13.5 FACTURAS TAB */}
      {activeTab === 'facturas' && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" /> Registro Geral de Facturas e Recibos
            </h3>
            <span className="text-xs text-slate-400">Emitidos: {sales.length} documentos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 font-mono">
                  <th className="py-3 px-4">Documento Nº</th>
                  <th className="py-3 px-4">Data de Emissão</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">NIF</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">IVA ({config.iva}%)</th>
                  <th className="py-3 px-4 text-right font-bold text-indigo-400">Total Pago</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filterBySearch(sales).length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-slate-500 font-mono">
                      Nenhum documento fiscal correspondente foi encontrado.
                    </td>
                  </tr>
                ) : (
                  filterBySearch(sales).map(sale => (
                    <tr key={sale.id} className="border-b border-slate-850 hover:bg-white/5 transition-all text-sm text-slate-300">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">{sale.id}</td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">{sale.data}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-300">{sale.clienteNome || 'Cliente Geral'}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">{sale.clienteNif || 'Consumidor Final'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.metodoPagamento === 'Multicaixa' 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : sale.metodoPagamento === 'Transferência'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {sale.metodoPagamento}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                        {config.moeda}{sale.subtotal.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                        {config.moeda}{sale.iva.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-400">
                        {config.moeda}{sale.total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectInvoice(sale)}
                            className="p-1.5 rounded-lg hover:bg-indigo-500/15 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                            title="Visualizar e Imprimir Factura"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 14. CONFIG TAB */}
      {activeTab === 'configuracoes' && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Save className="h-5 w-5 text-indigo-400" /> Configurações Gerais da Empresa
            </h3>
          </div>

          <form onSubmit={handleConfigSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Nome da Empresa</label>
                <input
                  type="text"
                  value={cfgForm.empresa}
                  onChange={(e) => setCfgForm({ ...cfgForm, empresa: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">NIF / Número Fiscal</label>
                <input
                  type="text"
                  value={cfgForm.nif}
                  onChange={(e) => setCfgForm({ ...cfgForm, nif: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">IVA (%) padrão</label>
                <input
                  type="number"
                  value={cfgForm.iva}
                  onChange={(e) => setCfgForm({ ...cfgForm, iva: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Símbolo Monetário</label>
                <select
                  value={cfgForm.moeda}
                  onChange={(e) => setCfgForm({ ...cfgForm, moeda: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm text-slate-100"
                >
                  <option value="€">Euro (€)</option>
                  <option value="$">Dólar ($)</option>
                  <option value="Kz">Kwanza (Kz)</option>
                  <option value="R$">Real (R$)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">Endereço Principal</label>
              <input
                type="text"
                value={cfgForm.endereco}
                onChange={(e) => setCfgForm({ ...cfgForm, endereco: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Telefone de Suporte</label>
                <input
                  type="text"
                  value={cfgForm.telefone}
                  onChange={(e) => setCfgForm({ ...cfgForm, telefone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Email de Contacto</label>
                <input
                  type="email"
                  value={cfgForm.email}
                  onChange={(e) => setCfgForm({ ...cfgForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button 
                type="submit" 
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-500/10 active:scale-95"
              >
                <Save className="h-4 w-4" /> Salvar Configurações
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
