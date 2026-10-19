import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../../store/AppContext";
import {
  Users, KeyRound, ShieldCheck, ShieldAlert, LogOut,
  ChevronDown, CheckCircle2, Lock, Shield, Sparkles
} from "lucide-react";
import { getRoleBadgeInfo } from "../../utils/userPermissions";

interface UserBadgeMenuProps {
  onOpenSwitchModal: () => void;
  onOpenAdminAuthModal: () => void;
}

export const UserBadgeMenu: React.FC<UserBadgeMenuProps> = ({
  onOpenSwitchModal,
  onOpenAdminAuthModal,
}) => {
  const { currentUser } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const badgeInfo = getRoleBadgeInfo(currentUser.role);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 transition text-left group shadow-xs"
        title="Perfil de Utilizador & Gestão de Sessão"
      >
        <div className={`w-7 h-7 rounded-lg ${currentUser.avatarColor || "bg-sky-600"} text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0`}>
          {currentUser.nome.charAt(0).toUpperCase()}
        </div>

        <div className="hidden sm:block text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white group-hover:text-sky-300 transition truncate max-w-[110px]">
              {currentUser.nome.split(" ")[0]} {currentUser.nome.split(" ")[1] ? currentUser.nome.split(" ")[1].charAt(0) + "." : ""}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider ${badgeInfo.bg} ${badgeInfo.text}`}>
              {currentUser.role}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
            @{currentUser.username}
          </p>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition duration-200 ${menuOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${currentUser.avatarColor || "bg-sky-600"} text-white font-black flex items-center justify-center text-sm shadow-xs`}>
                {currentUser.nome.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-slate-900 truncate">{currentUser.nome}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser.cargo}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold border ${badgeInfo.bg} ${badgeInfo.text} ${badgeInfo.border}`}>
                  {badgeInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="p-3 bg-slate-50/40 text-[11px] text-slate-600 border-b border-slate-100">
            <p className="leading-snug">{badgeInfo.descricao}</p>
          </div>

          {/* Actions */}
          <div className="p-1 space-y-0.5">
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenSwitchModal();
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center gap-2.5 transition"
            >
              <Users className="w-4 h-4 text-sky-600" />
              <span>Trocar de Operador / Conta</span>
            </button>

            {currentUser.role !== "admin" && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenAdminAuthModal();
                }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-xl flex items-center gap-2.5 transition"
              >
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <span>Autenticar como Administrador</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
