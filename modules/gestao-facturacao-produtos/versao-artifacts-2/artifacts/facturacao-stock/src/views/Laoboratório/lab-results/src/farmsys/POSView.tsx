// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle, Package, User, CreditCard, Coins } from 'lucide-react';
import { Product, AppConfig, CartItem, Client } from './types';

interface POSViewProps {
  products: Product[];
  clients: Client[];
  config: AppConfig;
  onCompleteSale: (
    cart: CartItem[], 
    total: number, 
    clienteNome: string, 
    clienteNif: string, 
    pagamentos: { metodo: string; valor: number }[],
    valorPago: number,
    troco: number
  ) => void;
  onShowNotification: (msg: string) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  clients,
  config,
  onCompleteSale,
  onShowNotification,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout and invoicing states
  const METODOS_PAGAMENTO = [
    'Dinheiro',
    'Multicaixa (TPA)',
    'Multicaixa Express',
    'Transferência',
    'Cheque',
    'Crédito',
    'Outro'
  ];

  const [splitPayments, setSplitPayments] = useState<{ id: string; metodo: string; valor: number }[]>([
    { id: '1', metodo: 'Dinheiro', valor: 0 },
  ]);
  const [usarMultiplasFormas, setUsarMultiplasFormas] = useState<boolean>(false);
  const [formaPagamento, setFormaPagamento] = useState<string>('Dinheiro');
  const [valorRecebidoInput, setValorRecebidoInput] = useState<string>('');
  const [clienteNome, setClienteNome] = useState<string>('');
  const [clienteNif, setClienteNif] = useState<string>('');

  const categories = ['all', 'Medicamentos', 'Suplementos', 'Higiene', 'Cosméticos'];

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.categoria === selectedCategory;
    const matchesSearch = 
      p.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.codigo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      onShowNotification(`O produto ${product.nome} não tem stock disponível!`);
      return;
    }

    const existingIndex = cart.findIndex(item => item.id === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantidade;
      if (currentQty >= product.stock) {
        onShowNotification(`Stock insuficiente! Apenas restam ${product.stock} unidades de ${product.nome}.`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantidade += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          nome: product.nome,
          preco: product.preco,
          imagem: product.imagem,
          quantidade: 1,
          stock: product.stock,
        },
      ]);
    }
    onShowNotification(`${product.nome} adicionado ao carrinho!`);
  };

  const updateQty = (id: number, delta: number) => {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex === -1) return;

    const item = cart[itemIndex];
    const newQty = item.quantidade + delta;

    if (newQty <= 0) {
      // Remove from cart
      setCart(cart.filter(item => item.id !== id));
      onShowNotification(`${item.nome} removido do carrinho.`);
    } else {
      if (delta > 0 && newQty > item.stock) {
        onShowNotification(`Limite de stock atingido para ${item.nome}!`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[itemIndex].quantidade = newQty;
      setCart(updatedCart);
    }
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    onShowNotification('Carrinho limpo com sucesso.');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
  const ivaAmount = subtotal * (config.iva / 100);
  const total = subtotal + ivaAmount;

  const totalPago = splitPayments.reduce((sum, p) => sum + p.valor, 0);
  const saldoRemanescente = Math.max(0, total - totalPago);
  const troco = Math.max(0, totalPago - total);

  const singleTroco = formaPagamento === 'Dinheiro' ? Math.max(0, (parseFloat(valorRecebidoInput) || total) - total) : 0;

  // Synchronize single payment method's total if no multiple splits exist
  useEffect(() => {
    if (splitPayments.length === 1 && !usarMultiplasFormas) {
      setSplitPayments([{ id: '1', metodo: formaPagamento, valor: total }]);
    }
  }, [total, formaPagamento, usarMultiplasFormas]);

  const addSplitPayment = () => {
    const remaining = Math.max(0, total - totalPago);
    const existingMethods = splitPayments.map(p => p.metodo);
    const nextMethod = METODOS_PAGAMENTO.find(m => !existingMethods.includes(m)) || 'Multicaixa (TPA)';
    
    setSplitPayments([
      ...splitPayments,
      { id: Math.random().toString(36).substring(2, 9), metodo: nextMethod, valor: remaining }
    ]);
  };

  const removeSplitPayment = (id: string) => {
    if (splitPayments.length <= 1) return;
    setSplitPayments(splitPayments.filter(p => p.id !== id));
  };

  const updateSplitPayment = (id: string, field: 'metodo' | 'valor', val: any) => {
    setSplitPayments(splitPayments.map(p => {
      if (p.id === id) {
        if (field === 'valor') {
          return { ...p, valor: Math.max(0, parseFloat(val) || 0) };
        }
        return { ...p, metodo: val };
      }
      return p;
    }));
  };

  const distributeEvenly = () => {
    if (splitPayments.length === 0) return;
    const share = total / splitPayments.length;
    const roundedShare = parseFloat(share.toFixed(2));
    setSplitPayments(splitPayments.map((p, idx) => {
      if (idx === splitPayments.length - 1) {
        const sumOfOthers = roundedShare * (splitPayments.length - 1);
        return { ...p, valor: parseFloat((total - sumOfOthers).toFixed(2)) };
      }
      return { ...p, valor: roundedShare };
    }));
  };

  const handleFinishSale = () => {
    if (cart.length === 0) {
      onShowNotification('O carrinho está vazio!');
      return;
    }
    
    const finalValorPago = usarMultiplasFormas ? totalPago : (formaPagamento === 'Dinheiro' ? (parseFloat(valorRecebidoInput) || total) : total);
    const finalTroco = usarMultiplasFormas ? troco : (formaPagamento === 'Dinheiro' ? Math.max(0, finalValorPago - total) : 0);
    const finalPagamentos = usarMultiplasFormas 
      ? splitPayments.map(p => ({ metodo: p.metodo, valor: p.valor })).filter(p => p.valor > 0)
      : [{ metodo: formaPagamento, valor: total }];

    if (usarMultiplasFormas && totalPago < total) {
      onShowNotification(`O valor total alocado (${config.moeda}${totalPago.toFixed(2)}) é inferior ao total da venda (${config.moeda}${total.toFixed(2)})!`);
      return;
    }

    if (!usarMultiplasFormas && formaPagamento === 'Dinheiro' && finalValorPago < total) {
      onShowNotification(`O valor recebido (${config.moeda}${finalValorPago.toFixed(2)}) é inferior ao total da venda (${config.moeda}${total.toFixed(2)})!`);
      return;
    }

    const finalClienteNome = clienteNome.trim() || 'Consumidor Final';
    const finalClienteNif = clienteNif.trim() || '999999999';

    onCompleteSale(
      cart, 
      total, 
      finalClienteNome, 
      finalClienteNif, 
      finalPagamentos, 
      finalValorPago, 
      finalTroco
    );

    // Reset local state
    setCart([]);
    setClienteNome('');
    setClienteNif('');
    setValorRecebidoInput('');
    setFormaPagamento('Dinheiro');
    setUsarMultiplasFormas(false);
    setSplitPayments([
      { id: '1', metodo: 'Dinheiro', valor: 0 },
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Products Column */}
      <div className="lg:col-span-8 space-y-6">
        {/* Search & Category Filter Header */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou código de barras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-slate-100 placeholder:text-slate-500 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/20 border border-slate-800/50 text-slate-500 space-y-2">
            <Package className="h-10 w-10 mx-auto opacity-50" />
            <p className="text-sm">Nenhum produto encontrado nesta seleção.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className={`p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/70 transition-all cursor-pointer group flex flex-col justify-between ${
                  product.stock === 0 ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div className="space-y-2">
                  {/* Image wrapper with strict referrer policy for security/cors */}
                  <div className="aspect-square rounded-lg bg-slate-950 overflow-hidden relative flex items-center justify-center border border-slate-800/50">
                    <img
                      src={product.imagem}
                      alt={product.nome}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.stock <= 20 && product.stock > 0 && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Baixo Stock
                      </span>
                    )}
                    {product.stock === 0 && (
                      <span className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-xs font-bold text-slate-400">
                        Indisponível
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide">
                        {product.codigo}
                      </span>
                      {product.lote && (
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-950/40 px-1 py-0.2 rounded border border-slate-850/40">
                          {product.lote}
                        </span>
                      )}
                    </div>
                    <h5 className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                      {product.nome}
                    </h5>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {product.categoria}
                    </p>
                    
                    {product.validade && (() => {
                      const diffDays = Math.ceil((new Date(product.validade).getTime() - new Date('2026-07-11').getTime()) / (1000 * 60 * 60 * 24));
                      if (diffDays <= 0) {
                        return <span className="text-[9px] text-rose-400 font-bold block mt-0.5 animate-pulse">⚠️ VENCIDO ({product.validade})</span>;
                      } else if (diffDays <= 90) {
                        return <span className="text-[9px] text-amber-400 font-bold block mt-0.5">⏱️ Expira em {diffDays} dias</span>;
                      }
                      return <span className="text-[9px] text-slate-500 block mt-0.5">Val: {product.validade}</span>;
                    })()}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/40">
                  <span className="text-sm font-extrabold text-indigo-400">
                    {config.moeda}{product.preco.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold font-mono">
                    Stock: {product.stock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Column */}
      <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-5 flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <ShoppingCart className="h-4.5 w-4.5 text-indigo-400" /> Carrinho de Compras
          </h3>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-all"
            >
              <Trash2 className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>

        {/* Cart Items list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[320px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
              <ShoppingCart className="h-10 w-10 opacity-30" />
              <p className="text-xs font-medium">O carrinho está vazio no momento.</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-950/40 border border-slate-850"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
                  <img
                    src={item.imagem}
                    alt={item.nome}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h6 className="text-xs font-bold text-slate-200 truncate">{item.nome}</h6>
                  <span className="text-[10px] text-slate-400 font-mono font-medium">
                    {config.moeda}{item.preco.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-750 flex items-center justify-center text-slate-300 text-xs font-bold transition-all"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <span className="text-xs font-bold font-mono text-slate-200 w-5 text-center">
                    {item.quantidade}
                  </span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-750 flex items-center justify-center text-slate-300 text-xs font-bold transition-all"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer & Payment Options */}
        <div className="pt-4 border-t border-slate-850 space-y-3.5">
          <h5 className="text-xs font-bold text-white uppercase tracking-wider">Informações da Venda</h5>
          
          {/* Client Selection & Quick Fields */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Cliente Nome</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Consumidor Final"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs text-slate-100 placeholder:text-slate-600"
                  />
                  {clients.length > 0 && clienteNome === '' && (
                    <select
                      onChange={(e) => {
                        const cl = clients.find(c => c.nome === e.target.value);
                        if (cl) {
                          setClienteNome(cl.nome);
                          setClienteNif(cl.nif || '999999999');
                        }
                      }}
                      className="absolute right-1 top-1 text-[9px] bg-slate-900 border border-slate-850 text-slate-400 rounded px-1"
                    >
                      <option value="">Rápido</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.nome}>{c.nome}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">NIF do Cliente</label>
                <input
                  type="text"
                  placeholder="999999999"
                  value={clienteNif}
                  onChange={(e) => setClienteNif(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs text-slate-100 placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector & Multi-Payment Allocation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Forma de Pagamento</label>
            </div>

            {/* Toggle between Single and Multiple Payments */}
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950/60 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => {
                  setUsarMultiplasFormas(false);
                  setSplitPayments([{ id: '1', metodo: formaPagamento, valor: total }]);
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  !usarMultiplasFormas 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Forma Única
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsarMultiplasFormas(true);
                  setSplitPayments([{ id: '1', metodo: 'Dinheiro', valor: total }]);
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  usarMultiplasFormas 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Múltiplas Formas
              </button>
            </div>

            {!usarMultiplasFormas ? (
              /* SINGLE PAYMENT MODE */
              <div className="space-y-3">
                <select
                  value={formaPagamento}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setFormaPagamento(selected);
                    setSplitPayments([{ id: '1', metodo: selected, valor: total }]);
                    setValorRecebidoInput('');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs text-slate-100 font-bold cursor-pointer"
                >
                  {METODOS_PAGAMENTO.map(m => (
                    <option key={m} value={m} className="bg-slate-950">
                      {m}
                    </option>
                  ))}
                </select>

                {formaPagamento === 'Dinheiro' && (
                  <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-[10px] text-slate-400 font-bold uppercase shrink-0 font-sans">Valor Recebido</label>
                      <div className="relative flex-1 max-w-[130px]">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono font-bold">
                          {config.moeda}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={total.toFixed(2)}
                          value={valorRecebidoInput}
                          onChange={(e) => setValorRecebidoInput(e.target.value)}
                          className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-850 focus:outline-none focus:border-indigo-500 text-xs text-slate-200 font-mono text-right"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-900 font-sans">
                      <span className="text-slate-400 font-semibold">Troco a devolver:</span>
                      <span className={`font-mono font-bold text-sm ${singleTroco > 0 ? 'text-emerald-400 font-black' : 'text-slate-400'}`}>
                        {config.moeda}{singleTroco.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* MULTIPLE SPLITS MODE */
              <div className="space-y-3">
                <div className="space-y-2">
                  {splitPayments.map((p) => {
                    const Icon = p.metodo === 'Dinheiro' ? Coins : p.metodo.includes('Multicaixa') ? CreditCard : User;
                    const isSelected = p.valor > 0;
                    
                    // Calculate what would be the remaining balance if we filled this one
                    const otherPaymentsSum = splitPayments.filter(x => x.id !== p.id).reduce((sum, x) => sum + x.valor, 0);
                    const remainderForThis = Math.max(0, total - otherPaymentsSum);

                    return (
                      <div key={p.id} className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all ${
                        isSelected 
                          ? 'bg-slate-900/60 border-indigo-500/40 shadow-sm' 
                          : 'bg-slate-950/25 border-slate-850/60 hover:border-slate-800'
                      }`}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-900 text-slate-500'}`}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <select
                              value={p.metodo}
                              onChange={(e) => updateSplitPayment(p.id, 'metodo', e.target.value)}
                              className="w-full bg-transparent border-0 text-xs font-bold text-slate-200 focus:outline-none focus:ring-0 py-0.5 cursor-pointer"
                            >
                              {METODOS_PAGAMENTO.map(m => (
                                <option key={m} value={m} className="bg-slate-950 text-slate-200 font-sans">
                                  {m}
                                </option>
                              ))}
                            </select>
                            {remainderForThis > 0 && remainderForThis !== p.valor && (
                              <button
                                type="button"
                                onClick={() => updateSplitPayment(p.id, 'valor', remainderForThis)}
                                className="text-[9px] text-indigo-400/80 hover:text-indigo-400 font-semibold block text-left"
                              >
                                Atribuir {config.moeda}{remainderForThis.toFixed(2)}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="relative max-w-[110px]">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono font-bold">
                              {config.moeda}
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={p.valor || ''}
                              onChange={(e) => updateSplitPayment(p.id, 'valor', e.target.value)}
                              className="w-full pl-6 pr-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-850 focus:outline-none focus:border-indigo-500 text-xs text-slate-200 font-mono text-right"
                            />
                          </div>
                          
                          {splitPayments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSplitPayment(p.id)}
                              className="p-1 rounded hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 transition-all cursor-pointer flex-shrink-0"
                              title="Remover meio de pagamento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Actions for Split Payments */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addSplitPayment}
                    disabled={splitPayments.length >= METODOS_PAGAMENTO.length}
                    className="flex-1 py-2 rounded-lg bg-slate-950/60 border border-slate-850 hover:bg-slate-900/50 text-slate-300 font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3 w-3 text-indigo-400" /> Adicionar Método
                  </button>
                  {splitPayments.length > 1 && (
                    <button
                      type="button"
                      onClick={distributeEvenly}
                      className="flex-1 py-2 rounded-lg bg-slate-950/60 border border-slate-850 hover:bg-slate-900/50 text-slate-300 font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Dividir Igualmente
                    </button>
                  )}
                </div>

                {/* Split Summary Box */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 font-medium">
                    <span>Total Recebido:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {config.moeda}{totalPago.toFixed(2)}
                    </span>
                  </div>

                  {saldoRemanescente > 0 ? (
                    <div className="flex items-center justify-between text-amber-400 font-semibold animate-pulse">
                      <span>Saldo Remanescente:</span>
                      <span className="font-mono">
                        {config.moeda}{saldoRemanescente.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>Estado de Pagamento:</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">✓ Completo</span>
                    </div>
                  )}

                  {troco > 0 && (
                    <div className="flex items-center justify-between text-teal-400 font-bold border-t border-slate-900 pt-1.5">
                      <span>Troco a devolver:</span>
                      <span className="font-mono text-emerald-400">
                        {config.moeda}{troco.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart Totals */}
        <div className="pt-4 border-t border-slate-850 space-y-2 text-sm">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Subtotal</span>
            <span className="font-mono font-semibold text-slate-200">
              {config.moeda}{subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>IVA ({config.iva}%)</span>
            <span className="font-mono font-semibold text-slate-200">
              {config.moeda}{ivaAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-base pt-3 border-t border-indigo-500/20 font-bold text-white">
            <span>Total Geral</span>
            <span className="font-mono text-xl text-indigo-400">
              {config.moeda}{total.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={handleFinishSale}
          disabled={cart.length === 0}
          className={`w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.98] ${
            cart.length > 0
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-600/10'
              : 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed shadow-none'
          }`}
        >
          <CheckCircle className="h-4.5 w-4.5" /> Finalizar Venda POS
        </button>
      </div>
    </div>
  );
};
