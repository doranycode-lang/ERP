// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Pill, 
  Users, 
  Factory, 
  Warehouse, 
  ArrowLeftRight, 
  Box, 
  Coins, 
  User, 
  Key, 
  Clock, 
  Database, 
  Plug, 
  Cog,
  FileText,
  Wallet
} from 'lucide-react';
import { BRAND_LOGO } from './data';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tabId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  isOpen,
  onToggle,
}) => {
  const menuSections = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
        { id: 'pos', label: 'Ponto de Venda POS', icon: ShoppingCart, badge: 'Novo' },
        { id: 'faturacao', label: 'Facturação AGT', icon: FileText, badge: 'AGT' },
      ],
    },
    {
      title: 'Gestão',
      items: [
        { id: 'produtos', label: 'Produtos', icon: Pill },
        { id: 'clientes', label: 'Clientes CRM', icon: Users },
        { id: 'fornecedores', label: 'Fornecedores', icon: Factory },
      ],
    },
    {
      title: 'Logística',
      items: [
        { id: 'armazens', label: 'Armazéns', icon: Warehouse },
        { id: 'transferencias', label: 'Transferências', icon: ArrowLeftRight },
        { id: 'encomendas', label: 'Encomendas', icon: Box },
      ],
    },
    {
      title: 'Financeiro',
      items: [
        { id: 'caixa', label: 'Fluxo de Caixa', icon: Coins },
        { id: 'facturas', label: 'Facturas & Recibos', icon: FileText },
        { id: 'contas', label: 'Contas Pagar/Receber', icon: Wallet },
        { id: 'relatorios', label: 'Relatórios', icon: TrendingUp },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { id: 'usuarios', label: 'Usuários', icon: User },
        { id: 'permissoes', label: 'Permissões', icon: Key },
        { id: 'atividades', label: 'Atividades', icon: Clock },
        { id: 'backup', label: 'Backup de Dados', icon: Database },
        { id: 'integracoes', label: 'Integrações', icon: Plug },
        { id: 'configuracoes', label: 'Configurações', icon: Cog },
      ],
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside className={`fixed top-[70px] left-0 bottom-0 w-64 bg-slate-950 border-r border-slate-900 overflow-y-auto z-40 transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="py-4 px-3 space-y-6">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 block mb-2">
                {section.title}
              </span>
              <ul className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          onNavigate(item.id);
                          if (window.innerWidth < 1024) onToggle();
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-semibold tracking-wide transition-all group cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/15'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 transition-colors ${
                            isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                          }`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-indigo-500 text-white uppercase tracking-wider">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};
