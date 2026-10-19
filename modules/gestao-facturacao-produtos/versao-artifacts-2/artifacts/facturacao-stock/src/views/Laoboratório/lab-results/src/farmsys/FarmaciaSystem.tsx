import React, { useState, useEffect } from 'react';
import {
  X, Pill, Users, Factory, Warehouse as WarehouseIcon, ArrowLeftRight,
  Box, Coins, UserCog, CheckCircle, HelpCircle, CreditCard,
} from 'lucide-react';

import {
  Product, Client, Supplier, Warehouse, Transfer, Order,
  CashFlowEntry, User, Activity, Backup, AppConfig, CartItem, Sale, Bill, CashRegisterClosure
} from './types';

import {
  INITIAL_PRODUCTS, INITIAL_CLIENTS, INITIAL_SUPPLIERS, INITIAL_WAREHOUSES,
  INITIAL_TRANSFERS, INITIAL_ORDERS, INITIAL_CASH_FLOW, INITIAL_USERS,
  INITIAL_ACTIVITIES, INITIAL_CONFIG, INITIAL_BACKUPS, INITIAL_SALES,
  INITIAL_BILLS, INITIAL_REGISTERS
} from './data';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DashboardView } from './DashboardView';
import { POSView } from './POSView';
import { ManagementView } from './ManagementView';
import Faturacao from './Faturacao';
import { AppProvider } from './AppContext';
import { Session } from '../store/auth';

interface Props {
  session: Session;
}

function safeParse<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved || saved === 'undefined' || saved === 'null') return fallback;
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

function compressImage(file: File, maxW: number, maxH: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No canvas context'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function FarmaciaSystem({ session }: Props) {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>(() => safeParse('fg_products', INITIAL_PRODUCTS));
  const [clients, setClients] = useState<Client[]>(() => safeParse('fg_clients', INITIAL_CLIENTS));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => safeParse('fg_suppliers', INITIAL_SUPPLIERS));
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => safeParse('fg_warehouses', INITIAL_WAREHOUSES));
  const [transfers, setTransfers] = useState<Transfer[]>(() => safeParse('fg_transfers', INITIAL_TRANSFERS));
  const [orders, setOrders] = useState<Order[]>(() => safeParse('fg_orders', INITIAL_ORDERS));
  const [cashFlow, setCashFlow] = useState<CashFlowEntry[]>(() => safeParse('fg_cashflow', INITIAL_CASH_FLOW));
  const [users, setUsers] = useState<User[]>(() => safeParse('fg_users', INITIAL_USERS));
  const [activities, setActivities] = useState<Activity[]>(() => safeParse('fg_activities', INITIAL_ACTIVITIES));
  const [backups, setBackups] = useState<Backup[]>(() => safeParse('fg_backups', INITIAL_BACKUPS));
  const [config, setConfig] = useState<AppConfig>(() => safeParse('fg_config', INITIAL_CONFIG));
  const [sales, setSales] = useState<Sale[]>(() => safeParse('fg_sales', INITIAL_SALES));
  const [bills, setBills] = useState<Bill[]>(() => safeParse('fg_bills', INITIAL_BILLS));
  const [closures, setClosures] = useState<CashRegisterClosure[]>(() => safeParse('fg_closures', INITIAL_REGISTERS));
  const [faturas, setFaturas] = useState<any[]>(() => safeParse('fg_faturas', []));
  const [currentInvoice, setCurrentInvoice] = useState<Sale | null>(null);
  const [uploadedProdImage, setUploadedProdImage] = useState<string | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState<boolean>(false);
  const [imageCompressionInfo, setImageCompressionInfo] = useState<{ originalSize: string; compressedSize: string; percentage: string } | null>(null);

  const currentUser: User = {
    id: 0,
    nome: session.funcionarioNome || session.username,
    email: session.username || 'utilizador@hospital.ao',
    cargo: 'Administrador',
    status: 'Ativo',
    ultimoAcesso: new Date().toLocaleString('pt-PT', { hour12: false }),
  };

  useEffect(() => { localStorage.setItem('fg_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('fg_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('fg_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('fg_warehouses', JSON.stringify(warehouses)); }, [warehouses]);
  useEffect(() => { localStorage.setItem('fg_transfers', JSON.stringify(transfers)); }, [transfers]);
  useEffect(() => { localStorage.setItem('fg_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('fg_cashflow', JSON.stringify(cashFlow)); }, [cashFlow]);
  useEffect(() => { localStorage.setItem('fg_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('fg_activities', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem('fg_backups', JSON.stringify(backups)); }, [backups]);
  useEffect(() => { localStorage.setItem('fg_config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('fg_sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('fg_bills', JSON.stringify(bills)); }, [bills]);
  useEffect(() => { localStorage.setItem('fg_closures', JSON.stringify(closures)); }, [closures]);
  useEffect(() => { localStorage.setItem('fg_faturas', JSON.stringify(faturas)); }, [faturas]);

  useEffect(() => {
    const handleSyncStorage = (e: StorageEvent) => {
      if (e.key === 'fg_products' && e.newValue) { try { setProducts(JSON.parse(e.newValue)); } catch {} }
      if (e.key === 'fg_clients' && e.newValue) { try { setClients(JSON.parse(e.newValue)); } catch {} }
      if (e.key === 'fg_faturas' && e.newValue) { try { setFaturas(JSON.parse(e.newValue)); } catch {} }
    };
    window.addEventListener('storage', handleSyncStorage);
    return () => window.removeEventListener('storage', handleSyncStorage);
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const addActivity = (title: string, tipo: Activity['tipo']) => {
    const newAct: Activity = {
      id: Date.now(),
      titulo: title,
      data: new Date().toLocaleString('pt-PT', { hour12: false }),
      tipo,
      usuario: session.funcionarioNome || session.username,
    };
    setActivities(prev => [newAct, ...prev]);
  };

  const handleDeleteProduct = (id: number) => {
    const p = products.find(x => x.id === id);
    if (p && confirm(`Eliminar o produto ${p.nome}?`)) {
      setProducts(prev => prev.filter(x => x.id !== id));
      addActivity(`Produto eliminado: ${p.nome}`, 'sistema');
      showNotification(`Produto ${p.nome} removido.`);
    }
  };

  const handleDeleteClient = (id: number) => {
    const c = clients.find(x => x.id === id);
    if (c && confirm(`Eliminar o cliente ${c.nome}?`)) {
      setClients(prev => prev.filter(x => x.id !== id));
      addActivity(`Cliente removido: ${c.nome}`, 'sistema');
      showNotification(`Cliente ${c.nome} removido.`);
    }
  };

  const handleDeleteSupplier = (id: number) => {
    const s = suppliers.find(x => x.id === id);
    if (s && confirm(`Eliminar o fornecedor ${s.nome}?`)) {
      setSuppliers(prev => prev.filter(x => x.id !== id));
      addActivity(`Fornecedor eliminado: ${s.nome}`, 'sistema');
      showNotification(`Fornecedor ${s.nome} removido.`);
    }
  };

  const handleDeleteWarehouse = (id: number) => {
    const w = warehouses.find(x => x.id === id);
    if (w && confirm(`Eliminar o armazém ${w.nome}?`)) {
      setWarehouses(prev => prev.filter(x => x.id !== id));
      addActivity(`Armazém removido: ${w.nome}`, 'logistica');
      showNotification(`Armazém ${w.nome} removido.`);
    }
  };

  const handleDeleteUser = async (id: number) => {
    const u = users.find(x => x.id === id);
    if (u && confirm(`Revogar o utilizador ${u.nome}?`)) {
      setUsers(prev => prev.filter(x => x.id !== id));
      addActivity(`Utilizador removido: ${u.nome}`, 'sistema');
      showNotification(`Utilizador ${u.nome} removido.`);
    }
  };

  const handleSaveConfig = (newCfg: AppConfig) => {
    setConfig(newCfg);
    addActivity('Configurações atualizadas', 'sistema');
    showNotification('Configurações guardadas.');
  };

  const handleCreateBackup = () => {
    const size = (2.0 + Math.random() * 0.9).toFixed(1);
    const newBk: Backup = {
      id: Date.now(),
      nome: `Backup Manual ${new Date().toISOString().split('T')[0]}`,
      data: new Date().toLocaleString('pt-PT', { hour12: false }),
      tamanho: `${size} MB`,
    };
    setBackups(prev => [newBk, ...prev]);
    addActivity('Backup manual criado com sucesso', 'sistema');
    showNotification('Cópia de segurança criada!');
  };

  const handleAddBill = (newBillData: Omit<Bill, 'id'>) => {
    const id = `BILL-${Math.floor(1000 + Math.random() * 9000)}`;
    const bill: Bill = { ...newBillData, id };
    setBills(prev => [bill, ...prev]);
    addActivity(`Lançamento financeiro: ${bill.descricao}`, 'financeiro');
  };

  const handlePayBill = (id: string) => {
    setBills(prev => prev.map(b => {
      if (b.id === id) {
        const flowEntry: CashFlowEntry = {
          id: Date.now(),
          data: new Date().toLocaleString('pt-PT', { hour12: false }),
          tipo: b.tipo === 'Pagar' ? 'Saída' : 'Entrada',
          descricao: `Liquidação: ${b.descricao}`,
          valor: b.valor,
          responsavel: session.funcionarioNome || session.username,
        };
        setCashFlow(prevCash => [flowEntry, ...prevCash]);
        addActivity(`Conta liquidada: ${b.descricao}`, 'financeiro');
        showNotification(`Conta "${b.descricao}" marcada como Paga!`);
        return { ...b, status: 'Pago' as const };
      }
      return b;
    }));
  };

  const handleCloseRegister = (valorFinal: number, obs: string) => {
    const totalIn = cashFlow.filter(e => e.tipo === 'Entrada').reduce((s, e) => s + e.valor, 0);
    const totalOut = cashFlow.filter(e => e.tipo === 'Saída').reduce((s, e) => s + e.valor, 0);
    const netCalc = totalIn - totalOut;
    const newClosure: CashRegisterClosure = {
      id: `FECH-${Date.now()}`,
      dataFechamento: new Date().toLocaleString('pt-PT', { hour12: false }),
      operador: `${session.funcionarioNome || session.username}`,
      valorCalculado: netCalc,
      valorInformado: valorFinal,
      observacoes: obs,
      status: 'Fechado',
    };
    setClosures(prev => [newClosure, ...prev]);
    addActivity(`Caixa encerrada. Diferença: ${config.moeda} ${(valorFinal - netCalc).toFixed(2)}`, 'financeiro');
    showNotification('Sessão de caixa encerrada!');
  };

  const handleCompleteSale = (
    cartItems: CartItem[], total: number, clienteNome: string,
    clienteNif: string, pagamentos: { metodo: string; valor: number }[],
    valorPago: number, troco: number
  ) => {
    setProducts(prev => prev.map(p => {
      const ci = cartItems.find(item => item.id === p.id);
      return ci ? { ...p, stock: Math.max(0, p.stock - ci.quantidade) } : p;
    }));
    const saleId = `FT-${Math.floor(100000 + Math.random() * 900000)}`;
    const timeStr = new Date().toLocaleString('pt-PT', { hour12: false });
    const subtotalValue = cartItems.reduce((s, item) => s + item.preco * item.quantidade, 0);
    const ivaValue = subtotalValue * (config.iva / 100);
    const metodosStr = pagamentos.map(p => `${p.metodo} (${config.moeda} ${p.valor.toFixed(2)})`).join(' + ');
    const newSale: Sale = {
      id: saleId, data: timeStr, items: cartItems,
      subtotal: subtotalValue, iva: ivaValue, total,
      metodoPagamento: metodosStr || 'Dinheiro',
      clienteNome, clienteNif, valorPago, troco,
      pagamentoDetalhado: pagamentos,
    };
    setSales(prev => [newSale, ...prev]);
    setCashFlow(prev => [{
      id: Date.now(), data: timeStr, tipo: 'Entrada',
      descricao: `Venda POS #${saleId}`, valor: total, responsavel: session.funcionarioNome || session.username,
    }, ...prev]);
    addActivity(`Venda POS #${saleId} — Total: ${config.moeda} ${total.toFixed(2)}`, 'venda');
    showNotification(`Transação concluída! Factura ${saleId} gerada.`);
    setCurrentInvoice(newSale);
    setActiveTab('facturas');
  };

  // Modal submit handlers
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const newProd: Product = {
      id: Date.now(),
      codigo: fd.get('codigo') as string,
      nome: fd.get('nome') as string,
      categoria: fd.get('categoria') as string,
      preco: parseFloat(fd.get('preco') as string),
      stock: parseInt(fd.get('stock') as string),
      armazem: fd.get('armazem') as string,
      lote: fd.get('lote') as string || undefined,
      validade: fd.get('validade') as string || undefined,
      stockMinimo: fd.get('stockMinimo') ? parseInt(fd.get('stockMinimo') as string) : undefined,
      imagem: uploadedProdImage || '',
    };
    setProducts(prev => [...prev, newProd]);
    addActivity(`Produto adicionado: ${newProd.nome}`, 'sistema');
    showNotification(`Produto ${newProd.nome} registado!`);
    setUploadedProdImage(null);
    setImageCompressionInfo(null);
    setActiveModal(null);
  };

  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const newClient: Client = {
      id: Date.now(),
      nome: fd.get('nome') as string,
      email: fd.get('email') as string,
      telefone: fd.get('telefone') as string,
      nif: fd.get('nif') as string,
      totalCompras: 0,
    };
    setClients(prev => [...prev, newClient]);
    addActivity(`Cliente registado: ${newClient.nome}`, 'sistema');
    showNotification(`Cliente ${newClient.nome} cadastrado!`);
    setActiveModal(null);
  };

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const newSupplier: Supplier = {
      id: Date.now(),
      nome: fd.get('nome') as string,
      contacto: fd.get('contacto') as string,
      email: fd.get('email') as string,
      nif: fd.get('nif') as string,
      produtos: 0,
    };
    setSuppliers(prev => [...prev, newSupplier]);
    addActivity(`Fornecedor cadastrado: ${newSupplier.nome}`, 'sistema');
    showNotification(`Fornecedor ${newSupplier.nome} adicionado!`);
    setActiveModal(null);
  };

  const handleAddWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const newWh: Warehouse = {
      id: Date.now(),
      nome: fd.get('nome') as string,
      localizacao: fd.get('localizacao') as string,
      capacidade: parseInt(fd.get('capacidade') as string),
      produtos: 0,
      responsavel: fd.get('responsavel') as string,
    };
    setWarehouses(prev => [...prev, newWh]);
    addActivity(`Armazém criado: ${newWh.nome}`, 'logistica');
    showNotification(`Armazém ${newWh.nome} cadastrado!`);
    setActiveModal(null);
  };

  const handleAddTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const origem = fd.get('origem') as string;
    const destino = fd.get('destino') as string;
    if (origem === destino) { alert('Origem e destino não podem ser idênticos!'); return; }
    const newTr: Transfer = {
      id: Date.now(),
      data: new Date().toISOString().split('T')[0],
      origem, destino,
      produto: fd.get('produto') as string,
      quantidade: parseInt(fd.get('quantidade') as string),
      status: 'Pendente',
    };
    setTransfers(prev => [newTr, ...prev]);
    addActivity(`Transferência criada: ${newTr.quantidade} un. de ${newTr.produto}`, 'logistica');
    showNotification('Ordem de transferência emitida!');
    setActiveModal(null);
  };

  const handleAddOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const newOrder: Order = {
      id: Date.now(),
      data: new Date().toISOString().split('T')[0],
      fornecedor: fd.get('fornecedor') as string,
      produtos: fd.get('produtos') as string,
      valor: parseFloat(fd.get('valor') as string),
      status: 'Pendente',
    };
    setOrders(prev => [newOrder, ...prev]);
    addActivity(`Ordem de compra criada para ${newOrder.fornecedor}`, 'logistica');
    showNotification(`Pedido para ${newOrder.fornecedor} registado!`);
    setActiveModal(null);
  };

  const handleAddCashEntrySubmit = (e: React.FormEvent, tipo: 'Entrada' | 'Saída') => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const newFlow: CashFlowEntry = {
      id: Date.now(),
      data: new Date().toLocaleString('pt-PT', { hour12: false }),
      tipo,
      descricao: fd.get('descricao') as string,
      valor: parseFloat(fd.get('valor') as string),
      responsavel: session.funcionarioNome || session.username,
    };
    setCashFlow(prev => [newFlow, ...prev]);
    addActivity(`${tipo} manual de caixa: ${newFlow.descricao}`, 'financeiro');
    showNotification(`Movimento de ${tipo} registado.`);
    setActiveModal(null);
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const newUser: User = {
      id: Date.now(),
      nome: fd.get('nome') as string,
      email: fd.get('email') as string,
      cargo: fd.get('cargo') as User['cargo'],
      status: 'Ativo',
      ultimoAcesso: '-',
      pin: fd.get('pin') as string || '1234',
      password: fd.get('password') as string || '1234',
    };
    setUsers(prev => [...prev, newUser]);
    addActivity(`Utilizador criado: ${newUser.nome}`, 'sistema');
    showNotification(`Utilizador ${newUser.nome} registado!`);
    setActiveModal(null);
  };

  return (
    <AppProvider
      products={products} setProducts={setProducts}
      clients={clients} setClients={setClients}
      config={config} setConfig={setConfig}
      cashFlow={cashFlow} setCashFlow={setCashFlow}
      faturas={faturas} setFaturas={setFaturas}
      addActivity={(title, tipo) => addActivity(title, tipo)}
      showNotification={showNotification}
    >
      <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">

        {/* HEADER */}
        <Header
          config={config}
          currentUser={currentUser}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onShowNotification={showNotification}
          onLockScreen={() => {}}
          onLogout={() => {}}
        />

        <div className="flex flex-1 pt-[70px]">
          {/* SIDEBAR */}
          <Sidebar
            activeTab={activeTab}
            onNavigate={setActiveTab}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* MAIN CONTENT */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-64 overflow-x-hidden min-h-[calc(100vh-70px)] bg-slate-950/20">

            {activeTab === 'dashboard' ? (
              <DashboardView
                products={products} clients={clients} cashFlow={cashFlow}
                config={config} onNavigate={setActiveTab} onOpenModal={setActiveModal}
              />
            ) : activeTab === 'pos' ? (
              <POSView
                products={products} clients={clients} config={config}
                onCompleteSale={handleCompleteSale} onShowNotification={showNotification}
              />
            ) : activeTab === 'faturacao' ? (
              <Faturacao
                session={{ funcionarioNome: session.funcionarioNome || session.username, username: session.username || '', cargo: session.funcao || "farmaceutico" } as any}
              />
            ) : (
              <ManagementView
                activeTab={activeTab}
                products={products} clients={clients} suppliers={suppliers}
                warehouses={warehouses} transfers={transfers} orders={orders}
                cashFlow={cashFlow} users={users} activities={activities}
                backups={backups} config={config} sales={sales} bills={bills} closures={closures}
                onSelectInvoice={setCurrentInvoice}
                onDeleteProduct={handleDeleteProduct}
                onDeleteClient={handleDeleteClient}
                onDeleteSupplier={handleDeleteSupplier}
                onDeleteWarehouse={handleDeleteWarehouse}
                onDeleteUser={handleDeleteUser}
                onSaveConfig={handleSaveConfig}
                onCreateBackup={handleCreateBackup}
                onOpenModal={setActiveModal}
                onShowNotification={showNotification}
                onAddBill={handleAddBill}
                onPayBill={handlePayBill}
                onCloseRegister={handleCloseRegister}
              />
            )}

            {/* FOOTER */}
            <footer className="mt-12 pt-8 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs text-slate-500">
              <div className="space-y-2">
                <h5 className="font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Pill className="h-4 w-4 text-indigo-400" /> {config.empresa}
                </h5>
                <p>© {config.empresa} — Software de Gestão Certificado.</p>
              </div>
              <div className="space-y-1.5">
                <h5 className="font-bold text-slate-400 uppercase tracking-wide">Contactos</h5>
                <p>Luanda, Angola</p>
                <p>Tel: {config.telefone}</p>
                <p>Email: {config.email}</p>
              </div>
              <div className="space-y-1.5">
                <h5 className="font-bold text-slate-400 uppercase tracking-wide">Legislação</h5>
                <p>Faturação Eletrónica Homologada AGT</p>
                <p className="font-semibold text-slate-400">NIF: {config.nif}</p>
              </div>
            </footer>
          </main>
        </div>

        {/* SUPPORT BUTTON */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => showNotification('Suporte: (+244) 941 70 70 61')}
            className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-500 transition-all hover:scale-105 cursor-pointer"
            title="Suporte"
          >
            <HelpCircle className="h-6 w-6" />
          </button>
        </div>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className="fixed bottom-6 left-6 z-50 p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm shadow-2xl flex items-center gap-3 max-w-sm">
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* MODALS */}
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {activeModal === 'modal-produto' && <><Pill className="h-4 w-4 text-indigo-400" /> Registar Novo Produto</>}
                  {activeModal === 'modal-cliente' && <><Users className="h-4 w-4 text-indigo-400" /> Cadastrar Novo Cliente</>}
                  {activeModal === 'modal-fornecedor' && <><Factory className="h-4 w-4 text-indigo-400" /> Registar Novo Fornecedor</>}
                  {activeModal === 'modal-armazem' && <><WarehouseIcon className="h-4 w-4 text-indigo-400" /> Criar Novo Armazém</>}
                  {activeModal === 'modal-transferencia' && <><ArrowLeftRight className="h-4 w-4 text-indigo-400" /> Ordem de Transferência</>}
                  {activeModal === 'modal-encomenda' && <><Box className="h-4 w-4 text-indigo-400" /> Nova Ordem de Compra</>}
                  {activeModal === 'modal-entrada' && <><Coins className="h-4 w-4 text-emerald-400" /> Entrada Manual de Caixa</>}
                  {activeModal === 'modal-saida' && <><Coins className="h-4 w-4 text-rose-400" /> Saída Manual de Caixa</>}
                  {activeModal === 'modal-usuario' && <><UserCog className="h-4 w-4 text-indigo-400" /> Criar Utilizador</>}
                  {activeModal === 'modal-subscription' && <><CreditCard className="h-4 w-4 text-indigo-400" /> Subscrição</>}
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg bg-slate-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6">
                {activeModal === 'modal-produto' && (
                  <form onSubmit={handleAddProductSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Código de Barras</label>
                        <input name="codigo" required placeholder="PAR500" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Nome do Medicamento</label>
                        <input name="nome" required placeholder="Paracetamol 500mg" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Categoria</label>
                        <select name="categoria" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500">
                          <option>Medicamentos</option>
                          <option>Suplementos</option>
                          <option>Higiene</option>
                          <option>Cosméticos</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Preço Unitário ({config.moeda})</label>
                        <input type="number" step="0.01" name="preco" required placeholder="350" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Stock Inicial</label>
                        <input type="number" name="stock" required placeholder="100" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Armazém Destino</label>
                        <select name="armazem" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500">
                          {warehouses.map(w => <option key={w.id} value={w.nome}>{w.nome}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Nº Lote</label>
                        <input name="lote" placeholder="LT-3240" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Validade</label>
                        <input type="date" name="validade" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Stock Mínimo</label>
                        <input type="number" name="stockMinimo" placeholder="50" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <label className="text-xs text-slate-400 font-semibold block">Imagem do Produto (compressão automática)</label>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                          {uploadedProdImage ? <img src={uploadedProdImage} alt="Preview" className="w-full h-full object-cover" /> : <Pill className="h-5 w-5 text-slate-600" />}
                        </div>
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              setIsCompressingImage(true);
                              const original = formatBytes(file.size);
                              const compressed = await compressImage(file, 200, 200, 0.65);
                              const headLen = compressed.indexOf(',') + 1;
                              const compBytes = Math.round((compressed.length - headLen) * 3 / 4);
                              const pct = ((1 - compBytes / file.size) * 100).toFixed(1);
                              setUploadedProdImage(compressed);
                              setImageCompressionInfo({ originalSize: original, compressedSize: formatBytes(compBytes), percentage: pct });
                              showNotification(`Imagem otimizada em ${pct}%`);
                            } catch { } finally { setIsCompressingImage(false); }
                          }
                        }} className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-400 cursor-pointer" />
                        {uploadedProdImage && !isCompressingImage && (
                          <button type="button" onClick={() => { setUploadedProdImage(null); setImageCompressionInfo(null); }} className="text-xs text-rose-400 font-bold">Remover</button>
                        )}
                      </div>
                      {isCompressingImage && <p className="text-xs text-indigo-400 animate-pulse">A comprimir imagem...</p>}
                      {imageCompressionInfo && !isCompressingImage && (
                        <p className="text-xs text-emerald-400">{imageCompressionInfo.originalSize} → {imageCompressionInfo.compressedSize} (−{imageCompressionInfo.percentage}%)</p>
                      )}
                    </div>
                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                      <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer">Registar Produto</button>
                    </div>
                  </form>
                )}

                {activeModal === 'modal-cliente' && (
                  <form onSubmit={handleAddClientSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Nome Completo</label>
                        <input name="nome" required placeholder="Lucas Ferreira" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">NIF</label>
                        <input name="nif" required placeholder="999999999" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Email</label>
                        <input type="email" name="email" required placeholder="lucas@email.com" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Telefone</label>
                        <input name="telefone" required placeholder="941707061" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                      <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer">Registar Cliente</button>
                    </div>
                  </form>
                )}

                {activeModal === 'modal-fornecedor' && (
                  <form onSubmit={handleAddSupplierSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Nome da Distribuidora</label>
                        <input name="nome" required placeholder="Pfizer SA" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">NIF Comercial</label>
                        <input name="nif" required placeholder="540112345" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Contacto</label>
                        <input name="contacto" required placeholder="222123456" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Email Comercial</label>
                        <input type="email" name="email" required placeholder="geral@pfizer.ao" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                      <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer">Registar Fornecedor</button>
                    </div>
                  </form>
                )}

                {activeModal === 'modal-armazem' && (
                  <form onSubmit={handleAddWarehouseSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Nome do Armazém</label>
                        <input name="nome" required placeholder="Armazém Norte" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Localização</label>
                        <input name="localizacao" required placeholder="Luanda, Angola" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Capacidade de Lotes</label>
                        <input type="number" name="capacidade" required placeholder="8000" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Responsável</label>
                        <input name="responsavel" required placeholder="Joaquim Santos" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                      <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer">Criar Armazém</button>
                    </div>
                  </form>
                )}

                {activeModal === 'modal-transferencia' && (
                  <form onSubmit={handleAddTransferSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Armazém de Origem</label>
                        <select name="origem" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500">
                          {warehouses.map(w => <option key={w.id} value={w.nome}>{w.nome}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Armazém de Destino</label>
                        <select name="destino" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500">
                          {warehouses.map(w => <option key={w.id} value={w.nome}>{w.nome}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Medicamento</label>
                        <select name="produto" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500">
                          {products.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Quantidade</label>
                        <input type="number" name="quantidade" required placeholder="50" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                      <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer">Emitir Guia</button>
                    </div>
                  </form>
                )}

                {activeModal === 'modal-encomenda' && (
                  <form onSubmit={handleAddOrderSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Fornecedor</label>
                        <select name="fornecedor" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500">
                          {suppliers.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Valor ({config.moeda})</label>
                        <input type="number" step="0.01" name="valor" required placeholder="150000" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Resumo dos Produtos</label>
                      <textarea name="produtos" required placeholder="100x Paracetamol 500mg, 50x Ibuprofeno 400mg" rows={3} className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                      <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer">Registar Encomenda</button>
                    </div>
                  </form>
                )}

                {activeModal === 'modal-entrada' && (
                  <form onSubmit={(e) => handleAddCashEntrySubmit(e, 'Entrada')} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Descrição</label>
                      <input name="descricao" required placeholder="Suprimento manual de caixa" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Valor ({config.moeda})</label>
                      <input type="number" step="0.01" name="valor" required placeholder="10000" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                      <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all cursor-pointer">Submeter Entrada</button>
                    </div>
                  </form>
                )}

                {activeModal === 'modal-saida' && (
                  <form onSubmit={(e) => handleAddCashEntrySubmit(e, 'Saída')} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Descrição</label>
                      <input name="descricao" required placeholder="Pagamento de despesas" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Valor ({config.moeda})</label>
                      <input type="number" step="0.01" name="valor" required placeholder="5000" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                      <button type="submit" className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all cursor-pointer">Registar Saída</button>
                    </div>
                  </form>
                )}

                {activeModal === 'modal-usuario' && (
                  <form onSubmit={handleAddUserSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Nome do Colaborador</label>
                        <input name="nome" required placeholder="Rui Abreu" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Cargo</label>
                        <select name="cargo" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500">
                          <option value="Administrador">Administrador</option>
                          <option value="Gerente">Gerente</option>
                          <option value="Operador">Operador/Farmacêutico</option>
                          <option value="Caixa">Operador de Caixa</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Email de Acesso</label>
                      <input type="email" name="email" required placeholder="rui@hospital.ao" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">PIN (4 dígitos)</label>
                        <input name="pin" maxLength={4} pattern="\d{4}" required placeholder="1234" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">Palavra-passe</label>
                        <input type="password" name="password" required placeholder="••••••••" className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                      <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer">Criar Utilizador</button>
                    </div>
                  </form>
                )}

                {activeModal === 'modal-subscription' && (
                  <div className="space-y-4 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-white">Renovação de Licença</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">A sua licença profissional expira em breve. Contacte o suporte para renovar.</p>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer">
                      Fechar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* INVOICE PRINT PREVIEW MODAL */}
        {currentInvoice && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
            <div className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <span className="font-bold text-sm tracking-wider uppercase">Visualização da Factura</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
                    <CheckCircle className="h-4 w-4" /> Imprimir
                  </button>
                  <button onClick={() => setCurrentInvoice(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div id="printable-invoice" className="p-8 space-y-6 bg-white select-text">
                <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black uppercase text-indigo-700 tracking-tight">{config.empresa}</h2>
                    <p className="text-xs text-slate-500">{config.endereco}</p>
                    <p className="text-xs text-slate-500 font-mono">NIF: {config.nif}</p>
                    <p className="text-xs text-slate-500 font-mono">Tel: {config.telefone} | {config.email}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="inline-block px-2.5 py-1 rounded bg-indigo-50 text-xs font-bold text-indigo-800 border border-indigo-100">REPÚBLICA DE ANGOLA</span>
                    <h3 className="text-lg font-bold text-slate-900 font-mono pt-1">{currentInvoice.id}</h3>
                    <p className="text-xs text-slate-500">{currentInvoice.data}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Cliente</p>
                    <p className="font-semibold">{currentInvoice.clienteNome || 'Consumidor Final'}</p>
                    <p className="text-xs text-slate-500">NIF: {currentInvoice.clienteNif || '999999999'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Pagamento</p>
                    <p className="font-semibold">{currentInvoice.metodoPagamento}</p>
                    <p className="text-xs text-slate-500">Pago: {config.moeda} {currentInvoice.valorPago?.toFixed(2)} | Troco: {config.moeda} {currentInvoice.troco?.toFixed(2)}</p>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 font-bold text-slate-600">Produto</th>
                      <th className="text-center py-2 font-bold text-slate-600">Qtd</th>
                      <th className="text-right py-2 font-bold text-slate-600">P.Unit</th>
                      <th className="text-right py-2 font-bold text-slate-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInvoice.items.map((item, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-2">{item.nome}</td>
                        <td className="py-2 text-center">{item.quantidade}</td>
                        <td className="py-2 text-right">{config.moeda} {item.preco.toFixed(2)}</td>
                        <td className="py-2 text-right">{config.moeda} {(item.preco * item.quantidade).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-slate-200 pt-4 space-y-1 text-sm text-right">
                  <p>Subtotal: <span className="font-semibold">{config.moeda} {currentInvoice.subtotal.toFixed(2)}</span></p>
                  <p>IVA ({config.iva}%): <span className="font-semibold">{config.moeda} {currentInvoice.iva.toFixed(2)}</span></p>
                  <p className="text-lg font-black text-indigo-700">Total: {config.moeda} {currentInvoice.total.toFixed(2)}</p>
                </div>
                <div className="text-center text-xs text-slate-400 border-t border-slate-200 pt-4">
                  Processado por programa validado nº 00/AGT/2026 · Obrigado pela preferência!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppProvider>
  );
}
