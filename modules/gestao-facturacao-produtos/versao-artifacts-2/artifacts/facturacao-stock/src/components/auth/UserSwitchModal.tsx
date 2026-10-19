import React, { useState } from "react";
import { useApp } from "../../store/AppContext";
import {
  Users, UserCheck, ShieldCheck, KeyRound, Check, X,
  AlertTriangle, Lock, Shield, ArrowRight, UserPlus
} from "lucide-react";
import { UsuarioSistema } from "../../types";
import { getRoleBadgeInfo } from "../../utils/userPermissions";

interface UserSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewUserModal?: () => void;
}

export const UserSwitchModal: React.FC<UserSwitchModalProps> = ({
  isOpen,
  onClose,
  onOpenNewUserModal,
}) => {
  const { usuarios, currentUser, switchUser } = useApp();
  const [selectedUser, setSelectedUser] = useState<UsuarioSistema | null>(null);
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectUser = (user: UsuarioSistema) => {
    setSelectedUser(user);
    setPin("");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!pin.trim()) {
      setErrorMsg("Introduza o PIN do utilizador.");
      return;
    }

    const res = switchUser(selectedUser.id, pin.trim());
    if (res.success) {
      setSuccessMsg(`Sessão iniciada como ${selectedUser.nome}!`);
      setTimeout(() => {
        onClose();
        setSelectedUser(null);
        setPin("");
        setSuccessMsg(null);
      }, 500);
    } else {
      setErrorMsg(res.message || "PIN incorreto. Tente novamente.");
      setPin("");
    }
  };

  const handleQuickSwitchIfSame = (user: UsuarioSistema) => {
    if (user.id === currentUser.id) {
      onClose();
      return;
    }
    handleSelectUser(user);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/20 border border-sky-500/30 text-sky-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">Trocar de Operador / Utilizador</h3>
              <p className="text-xs text-slate-400">Selecione uma conta para iniciar sessão ou autenticar no terminal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* User List */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Contas Disponíveis
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {usuarios.map((u) => {
                const badge = getRoleBadgeInfo(u.role);
                const isCurrent = currentUser.id === u.id;
                const isSelected = selectedUser?.id === u.id;

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSwitchIfSame(u)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition group ${
                      isSelected
                        ? "border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20 shadow-xs"
                        : isCurrent
                        ? "border-emerald-500/50 bg-emerald-50/30"
                        : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${u.avatarColor || "bg-sky-600"} text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0`}>
                        {u.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-sm truncate">{u.nome}</p>
                          {isCurrent && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                              Ativo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{u.cargo}</p>
                        <p className="text-[10px] text-slate-400 font-mono">@{u.username} · PIN: {u.pin ? "••••" : "Sem PIN"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN input box if a user is selected */}
          {selectedUser && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Introduza o PIN de <span className="text-sky-600">{selectedUser.nome}</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  (Dica Demo: PIN é <strong>{selectedUser.pin}</strong>)
                </span>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      maxLength={6}
                      autoFocus
                      placeholder="PIN de 4 dígitos..."
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value);
                        setErrorMsg(null);
                      }}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    <span>Entrar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {errorMsg && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {errorMsg}
                  </p>
                )}

                {successMsg && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    {successMsg}
                  </p>
                )}
              </form>
            </div>
          )}

          {/* Footer note */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              Sessão protegida por perfis RBAC
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition text-xs"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
