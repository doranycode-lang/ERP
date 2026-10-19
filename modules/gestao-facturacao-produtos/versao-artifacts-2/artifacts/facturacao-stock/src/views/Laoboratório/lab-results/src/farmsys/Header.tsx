// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, Clock, Bell, Mail, Sparkles, ShieldAlert, Lock, LogOut } from 'lucide-react';
import { BRAND_LOGO } from './data';
import { AppConfig, User } from './types';

interface HeaderProps {
  config: AppConfig;
  currentUser: User;
  onToggleSidebar: () => void;
  onShowNotification: (msg: string) => void;
  onLockScreen: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  currentUser,
  onToggleSidebar,
  onShowNotification,
  onLockScreen,
  onLogout,
}) => {
  const [time, setTime] = useState<string>('08:00:00');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-PT', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const initials = currentUser?.nome
    ? currentUser.nome
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'US';

  return (
    <header className="fixed top-0 left-0 right-0 h-[70px] bg-slate-950/80 backdrop-blur-md border-b border-slate-900 flex items-center justify-between px-4 z-50">
      {/* Left section: Logo & Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all hover:bg-slate-800"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/10 border border-white/5 shrink-0 bg-indigo-950">
            <img
              src={BRAND_LOGO}
              alt="FarmaGest Pro Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-white leading-tight tracking-tight">{config.empresa}</h1>
            <p className="text-[10px] text-indigo-400 font-medium">Gestão Farmacêutica Inteligente</p>
          </div>
        </div>
      </div>

      {/* Right section: Info, notifications, live clocks */}
      <div className="flex items-center gap-4">
        {/* Live clock */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-850 text-slate-300 font-mono text-xs">
          <Clock className="h-3.5 w-3.5 text-indigo-400" />
          <span>{time}</span>
        </div>

        {/* Online Status */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>Online</span>
        </div>

        {/* Notification alerts */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onShowNotification('Nenhuma nova notificação de sistema no momento.')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-indigo-400 hover:bg-slate-850 hover:border-slate-800 transition-all cursor-pointer relative"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
          </button>
          
          <button
            onClick={() => onShowNotification('Caixa de mensagens vazia.')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-indigo-400 hover:bg-slate-850 hover:border-slate-800 transition-all cursor-pointer relative"
          >
            <Mail className="h-4.5 w-4.5" />
          </button>

          {/* Bloquear Sessão */}
          <button
            onClick={onLockScreen}
            className="p-2 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-indigo-400 hover:bg-slate-850 hover:border-slate-800 transition-all cursor-pointer relative"
            title="Bloquear Ecrã"
          >
            <Lock className="h-4.5 w-4.5" />
          </button>

          {/* Sair / Logout */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-all cursor-pointer relative"
            title="Terminar Sessão"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-8 bg-slate-900" />

        {/* User profile details */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 border border-white/10 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
            {initials}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-white leading-tight">{currentUser?.nome || 'Operador'}</p>
            <p className="text-[9px] text-slate-500 leading-none">{currentUser?.email || 'geral@nvualasot.com'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
