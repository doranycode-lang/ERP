// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ArrowUp, 
  Coins, 
  CreditCard, 
  Factory, 
  Pill, 
  PlusCircle, 
  ShoppingCart, 
  TrendingUp, 
  UserPlus, 
  Users, 
  Warehouse 
} from 'lucide-react';
import { Product, Client, CashFlowEntry, AppConfig } from './types';
import { HERO_BANNER } from './data';

interface DashboardViewProps {
  products: Product[];
  clients: Client[];
  cashFlow: CashFlowEntry[];
  config: AppConfig;
  onNavigate: (pageId: string) => void;
  onOpenModal: (modalId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  clients,
  cashFlow,
  config,
  onNavigate,
  onOpenModal,
}) => {
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [hoveredSalesIdx, setHoveredSalesIdx] = useState<number | null>(null);
  const [hoveredProductIdx, setHoveredProductIdx] = useState<number | null>(null);

  useEffect(() => {
    // Show welcome modal once on initial mount
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
      sessionStorage.setItem('hasSeenWelcome', 'true');
    }
  }, []);

  // Calculate dynamic stats
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = products.filter(p => p.stockMinimo !== undefined ? p.stock < p.stockMinimo : p.stock < 50).length;

  // Calcule alertas de lote e validade (medicamentos a expirar nos próximos 90 dias com base no dia 11 de Julho de 2026)
  const dataReferencia = new Date('2026-07-11');
  const produtosAExpirar = products.filter(p => {
    if (!p.validade) return false;
    const dValidade = new Date(p.validade);
    const diffTime = dValidade.getTime() - dataReferencia.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= -10 && diffDays <= 90; // Exclude extremely old expired items but keep current/recently expired
  }).map(p => {
    const dValidade = new Date(p.validade!);
    const diffTime = dValidade.getTime() - dataReferencia.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { ...p, diasParaVencer: diffDays };
  });

  // Calcule stock mínimo crítico
  const produtosStockCritico = products.filter(p => p.stockMinimo !== undefined && p.stock < p.stockMinimo);
  
  // Calculate today's sales (filtering entries with type 'Entrada' and starting with 'Venda' or general sales)
  // Let's assume today is 2026-07-11
  const todaySales = cashFlow
    .filter(entry => entry.tipo === 'Entrada' && (entry.data.includes('22026-07-11') || entry.data.includes('2026-07-11')))
    .reduce((sum, entry) => sum + entry.valor, 0);

  // Fallback if no sales recorded for today specifically (sum of all entry values that are sales)
  const totalSalesOverall = cashFlow
    .filter(entry => entry.tipo === 'Entrada' && entry.descricao.startsWith('Venda'))
    .reduce((sum, entry) => sum + entry.valor, 0);

  // SVG Chart Calculation
  // Sales values for past 7 days (Seg, Ter, Qua, Qui, Sex, Sáb, Dom)
  const weeklySales = [1200, 1500, 980, 1750, 2100, 1890, 2340 + totalSalesOverall];
  const maxSale = Math.max(...weeklySales, 3000);
  const chartHeight = 160;
  const chartWidth = 500;
  const points = weeklySales.map((val, idx) => {
    const x = (idx / (weeklySales.length - 1)) * chartWidth;
    const y = chartHeight - (val / maxSale) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 animate-pulse" />
          <p className="text-sm">
            <strong>Atenção!</strong> Restam 7 dias para sua subscrição de licença expirar.
          </p>
        </div>
        <button 
          onClick={() => onOpenModal('modal-subscription')}
          className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
        >
          <CreditCard className="h-3.5 w-3.5" /> Subscrever Renovação
        </button>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden h-44 sm:h-52 shadow-xl border border-white/5">
        <img 
          src={HERO_BANNER} 
          alt="Farmácia" 
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.3]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/80 to-transparent flex flex-col justify-center p-6 sm:p-8">
          <span className="text-indigo-400 font-semibold tracking-wider text-xs uppercase mb-1">Painel FarmaGest Pro</span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white mb-2 tracking-tight">
            Bem-vindo ao FarmaGest Pro! 👋
          </h2>
          <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
            Gestão integrada para a sua farmácia por <strong>KuatelaSoft</strong>.
            Sábado, 11 de Julho de 2026.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-48 h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <span className="text-xs text-indigo-300 font-medium">Meta mensal de vendas: 75% concluída</span>
          </div>
        </div>
      </div>

      {/* ALERTA DE LOTES E STOCK CRÍTICO */}
      {(produtosAExpirar.length > 0 || produtosStockCritico.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Validade Alerts Card */}
          {produtosAExpirar.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-lg space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 animate-pulse" />
                <span>Medicamentos Próximos do Vencimento</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {produtosAExpirar.map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-amber-500/10 text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{p.nome}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Lote: {p.lote || 'N/D'} | Validade: {p.validade}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      p.diasParaVencer <= 15 ? 'bg-rose-500/20 text-rose-350' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {p.diasParaVencer <= 0 ? 'Expirou' : `Expira em ${p.diasParaVencer} dias`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock Alerts Card */}
          {produtosStockCritico.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 shadow-lg space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 animate-pulse" />
                <span>Nível de Stock Crítico (Abaixo do Mínimo)</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {produtosStockCritico.map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-rose-500/10 text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{p.nome}</p>
                      <p className="text-[10px] text-slate-500">Mínimo desejado: <span className="font-mono text-slate-400">{p.stockMinimo}</span> unidades</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-500/20 text-rose-300">
                        {p.stock} unidades
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-emerald-500/20 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Vendas Hoje</span>
          <h3 className="text-2xl font-bold text-white mt-1 font-display">
            {config.moeda}{todaySales > 0 ? todaySales.toFixed(2) : '215.40'}
          </h3>
          <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
            <ArrowUp className="h-3 w-3" /> 12% vs ontem
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-indigo-500/20 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Produtos em Stock</span>
          <h3 className="text-2xl font-bold text-white mt-1 font-display">
            {totalStock}
          </h3>
          <p className="text-xs text-indigo-300 flex items-center gap-1 mt-2">
            <TrendingUp className="h-3 w-3" /> {products.length} medicamentos ativos
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-amber-500/20 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Baixo Stock</span>
          <h3 className={`text-2xl font-bold mt-1 font-display ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            {lowStockCount}
          </h3>
          <p className="text-xs text-amber-300 flex items-center gap-1 mt-2">
            <AlertTriangle className="h-3 w-3" /> Requer atenção imediata
          </p>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-cyan-500/20 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Clientes Ativos</span>
          <h3 className="text-2xl font-bold text-white mt-1 font-display">
            {clients.length}
          </h3>
          <p className="text-xs text-cyan-400 flex items-center gap-1 mt-2">
            <ArrowUp className="h-3 w-3" /> 8% este mês
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Ações Rápidas</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button 
            onClick={() => onNavigate('pos')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/30 text-indigo-200 transition-all cursor-pointer group"
          >
            <ShoppingCart className="h-6 w-6 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Nova Venda (POS)</span>
          </button>
          <button 
            onClick={() => onOpenModal('modal-produto')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30 text-emerald-200 transition-all cursor-pointer group"
          >
            <Pill className="h-6 w-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Adicionar Produto</span>
          </button>
          <button 
            onClick={() => onOpenModal('modal-cliente')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/30 text-cyan-200 transition-all cursor-pointer group"
          >
            <UserPlus className="h-6 w-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Cadastrar Cliente</span>
          </button>
          <button 
            onClick={() => onNavigate('relatorios')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/30 text-amber-200 transition-all cursor-pointer group"
          >
            <TrendingUp className="h-6 w-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Ver Relatórios</span>
          </button>
        </div>
      </div>

      {/* Main Blocks: Chart & Process Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chart 1: Vendas Diárias */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                  <TrendingUp className="h-4 w-4 text-indigo-400" /> Vendas Diárias
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">7 Dias</span>
              </div>
              <div className="w-full h-52 relative bg-slate-950/20 rounded-xl border border-slate-800/40 p-2 flex flex-col justify-between">
                {/* Custom Interactive SVG Area Chart */}
                {(() => {
                  const salesData = [
                    { dia: 'Seg', valor: 1200 },
                    { dia: 'Ter', valor: 1500 },
                    { dia: 'Qua', valor: 980 },
                    { dia: 'Qui', valor: 1750 },
                    { dia: 'Sex', valor: 2100 },
                    { dia: 'Sáb', valor: 1890 },
                    { dia: 'Dom', valor: 2340 + totalSalesOverall }
                  ];
                  const maxSale = Math.max(...salesData.map(d => d.valor)) || 1;
                  const graphWidth = 340;
                  const graphHeight = 150;
                  const paddingLeft = 35;
                  const paddingRight = 15;
                  const paddingTop = 15;
                  const paddingBottom = 25;
                  const effWidth = graphWidth - paddingLeft - paddingRight;
                  const effHeight = graphHeight - paddingTop - paddingBottom;
                  
                  const salesPoints = salesData.map((d, i) => {
                    const x = paddingLeft + (i * effWidth) / (salesData.length - 1);
                    const y = paddingTop + effHeight - (d.valor / maxSale) * effHeight;
                    return { x, y, ...d };
                  });

                  const salesLineD = `M ${salesPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
                  const salesAreaD = `M ${salesPoints[0].x.toFixed(1)},${(paddingTop + effHeight).toFixed(1)} L ${salesPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')} L ${salesPoints[salesPoints.length - 1].x.toFixed(1)},${(paddingTop + effHeight).toFixed(1)} Z`;

                  return (
                    <>
                      <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="colorSalesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                          const y = paddingTop + ratio * effHeight;
                          const gridValue = maxSale * (1 - ratio);
                          return (
                            <g key={index}>
                              <line 
                                x1={paddingLeft} 
                                y1={y} 
                                x2={graphWidth - paddingRight} 
                                y2={y} 
                                stroke="rgba(255,255,255,0.04)" 
                                strokeDasharray="3 3" 
                              />
                              <text 
                                x={paddingLeft - 5} 
                                y={y + 3} 
                                fill="#475569" 
                                fontSize="7" 
                                fontFamily="monospace" 
                                textAnchor="end"
                              >
                                {config.moeda}{gridValue >= 1000 ? (gridValue / 1000).toFixed(1) + 'k' : Math.round(gridValue)}
                              </text>
                            </g>
                          );
                        })}

                        {/* Area Fill */}
                        <path d={salesAreaD} fill="url(#colorSalesGrad)" />
                        
                        {/* Line Stroke */}
                        <path d={salesLineD} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Point Circles & Hitbox */}
                        {salesPoints.map((pt, i) => {
                          const isHovered = hoveredSalesIdx === i;
                          return (
                            <g key={i} onMouseEnter={() => setHoveredSalesIdx(i)} onMouseLeave={() => setHoveredSalesIdx(null)}>
                              {/* Glowing background on hover */}
                              {isHovered && (
                                <circle cx={pt.x} cy={pt.y} r="8" fill="#6366f1" fillOpacity="0.25" />
                              )}
                              <circle 
                                cx={pt.x} 
                                cy={pt.y} 
                                r={isHovered ? "4" : "2.5"} 
                                fill={isHovered ? "#818cf8" : "#6366f1"} 
                                stroke="#0f172a" 
                                strokeWidth="1" 
                                className="transition-all"
                              />
                              <text 
                                x={pt.x} 
                                y={graphHeight - 5} 
                                fill={isHovered ? "#94a3b8" : "#475569"} 
                                fontSize="8" 
                                fontFamily="monospace" 
                                textAnchor="middle"
                                fontWeight={isHovered ? "bold" : "normal"}
                              >
                                {pt.dia}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                      
                      {/* Interactive Floating Tooltip */}
                      {hoveredSalesIdx !== null && (
                        <div className="absolute top-4 right-4 bg-slate-950/95 border border-slate-800 p-2 rounded-lg text-[10px] font-mono shadow-xl flex flex-col pointer-events-none z-10 animate-fade-in">
                          <span className="text-slate-400 font-bold">{salesData[hoveredSalesIdx].dia}feira</span>
                          <span className="text-indigo-400 font-extrabold text-xs mt-0.5">
                            {config.moeda}{salesData[hoveredSalesIdx].valor.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Chart 2: Produtos Mais Vendidos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                  <ShoppingCart className="h-4 w-4 text-emerald-400" /> Top Produtos
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Mais Vendidos</span>
              </div>
              <div className="w-full h-52 relative bg-slate-950/20 rounded-xl border border-slate-800/40 p-2 flex flex-col justify-between">
                {/* Custom Interactive SVG Bar Chart */}
                {(() => {
                  const topProducts = products
                    .map(p => ({
                      nome: p.nome.length > 12 ? p.nome.substring(0, 10) + '...' : p.nome,
                      vendas: p.vendas || Math.round((p.stockMinimo || 10) * 1.5 + (p.id % 25)),
                      rawName: p.nome
                    }))
                    .sort((a, b) => b.vendas - a.vendas)
                    .slice(0, 5);
                  
                  if (topProducts.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-full text-[11px] text-slate-500 italic">
                        Nenhum dado disponível
                      </div>
                    );
                  }

                  const maxVendas = Math.max(...topProducts.map(p => p.vendas)) || 1;
                  const graphWidth = 340;
                  const graphHeight = 150;
                  const paddingLeft = 30;
                  const paddingRight = 10;
                  const paddingTop = 15;
                  const paddingBottom = 25;
                  const effWidth = graphWidth - paddingLeft - paddingRight;
                  const effHeight = graphHeight - paddingTop - paddingBottom;

                  const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#3b82f6'];
                  const barWidth = 24;
                  const spacing = effWidth / topProducts.length;

                  return (
                    <>
                      <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-full overflow-visible">
                        {/* Horizontal Grid Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                          const y = paddingTop + ratio * effHeight;
                          const gridValue = maxVendas * (1 - ratio);
                          return (
                            <g key={index}>
                              <line 
                                x1={paddingLeft} 
                                y1={y} 
                                x2={graphWidth - paddingRight} 
                                y2={y} 
                                stroke="rgba(255,255,255,0.03)" 
                                strokeDasharray="3 3" 
                              />
                              <text 
                                x={paddingLeft - 5} 
                                y={y + 3} 
                                fill="#475569" 
                                fontSize="7" 
                                fontFamily="monospace" 
                                textAnchor="end"
                              >
                                {Math.round(gridValue)}
                              </text>
                            </g>
                          );
                        })}

                        {/* Bars rendering */}
                        {topProducts.map((pt, i) => {
                          const height = (pt.vendas / maxVendas) * effHeight;
                          const x = paddingLeft + (i * spacing) + (spacing - barWidth) / 2;
                          const y = paddingTop + effHeight - height;
                          const isHovered = hoveredProductIdx === i;
                          const color = colors[i % colors.length];

                          return (
                            <g 
                              key={i} 
                              onMouseEnter={() => setHoveredProductIdx(i)} 
                              onMouseLeave={() => setHoveredProductIdx(null)}
                              className="cursor-pointer"
                            >
                              {/* Background highlight pill */}
                              {isHovered && (
                                <rect 
                                  x={x - 4} 
                                  y={paddingTop - 5} 
                                  width={barWidth + 8} 
                                  height={effHeight + 10} 
                                  fill="rgba(255,255,255,0.02)" 
                                  rx="4"
                                />
                              )}
                              
                              {/* Bar */}
                              <rect 
                                x={x} 
                                y={y} 
                                width={barWidth} 
                                height={Math.max(2, height)} 
                                fill={color} 
                                fillOpacity={isHovered ? 1 : 0.8}
                                rx="3"
                                className="transition-all duration-200"
                              />

                              {/* Label */}
                              <text 
                                x={x + barWidth / 2} 
                                y={graphHeight - 5} 
                                fill={isHovered ? "#94a3b8" : "#475569"} 
                                fontSize="7.5" 
                                fontFamily="monospace" 
                                textAnchor="middle"
                                fontWeight={isHovered ? "bold" : "normal"}
                              >
                                {pt.nome}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                      
                      {/* Floating tooltip */}
                      {hoveredProductIdx !== null && (
                        <div className="absolute top-4 right-4 bg-slate-950/95 border border-slate-800 p-2 rounded-lg text-[10px] font-mono shadow-xl flex flex-col pointer-events-none z-10 animate-fade-in">
                          <span className="text-slate-400 font-bold max-w-[120px] truncate">{topProducts[hoveredProductIdx].rawName}</span>
                          <span className="text-emerald-400 font-extrabold text-xs mt-0.5">
                            {topProducts[hoveredProductIdx].vendas} unidades
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>

        {/* Process Flow / Fast Indicators */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-indigo-400" /> Logística Integrada
            </h3>
          </div>
          
          <div className="space-y-3.5 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Factory className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Capacidade Armazém 1</span>
                  <span className="text-slate-400">65%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Warehouse className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Capacidade Armazém 2</span>
                  <span className="text-slate-400">42%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '42%' }}></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                <Warehouse className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Capacidade Armazém 3</span>
                  <span className="text-slate-400">18%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: '18%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Sincronização: Tempo Real</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Ativo
            </span>
          </div>
        </div>
      </div>

      {/* Recent Transations list */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <Coins className="h-4 w-4 text-emerald-400" /> Últimas Movimentações de Caixa
          </h3>
          <button 
            onClick={() => onNavigate('caixa')}
            className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-all font-medium"
          >
            Ver Extrato Completo
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 font-mono">
                <th className="py-2.5 px-3">Data/Hora</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3">Responsável</th>
                <th className="py-2.5 px-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {cashFlow.slice(0, 5).map((entry) => (
                <tr key={entry.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-all text-sm text-slate-300">
                  <td className="py-3 px-3 font-mono text-xs">{entry.data}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      entry.tipo === 'Entrada' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {entry.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium">{entry.descricao}</td>
                  <td className="py-3 px-3 text-xs text-slate-400">{entry.responsavel}</td>
                  <td className={`py-3 px-3 text-right font-bold ${
                    entry.tipo === 'Entrada' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {entry.tipo === 'Entrada' ? '+' : '-'}{config.moeda}{entry.valor.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Welcome Screen Overlay */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center border border-indigo-500/25">
              <Pill className="h-8 w-8 animate-spin-slow" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold font-display text-white">👋 Bem-vindo, Administrador!</h1>
              <p className="text-xs text-slate-400">
                FarmaGest Pro — KuatelaSoft | Sábado, 11 Julho 2026
              </p>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-4 text-left divide-y divide-slate-800/40 text-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-300 py-1 first:pt-0">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span>Módulos de vendas e POS inicializados</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 py-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span>14 produtos carregados com imagens reais</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 py-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span>Logística multi-armazém ativa (3 armazéns)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 py-2 last:pb-0">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                <span>Caixa aberto e pronto para operações</span>
              </div>
            </div>

            <button
              onClick={() => setShowWelcome(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm tracking-wide shadow-lg active:scale-[0.98] transition-all cursor-pointer"
            >
              Começar a Trabalhar →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
