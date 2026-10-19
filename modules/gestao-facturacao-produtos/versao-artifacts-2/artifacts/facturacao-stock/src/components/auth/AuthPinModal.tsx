import React, { useState, useEffect } from "react";
import { useApp } from "../../store/AppContext";
import {
  ShieldAlert, Lock, KeyRound, Check, X, AlertTriangle,
  UserCheck, ShieldCheck, ArrowRight, RefreshCw
} from "lucide-react";
import { getRoleBadgeInfo } from "../../utils/userPermissions";

interface AuthPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  requiredRole?: "admin" | "operador" | "auditor";
}

export const AuthPinModal: React.FC<AuthPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Autenticação de Administrador",
  description = "A secção que está a tentar aceder contém parâmetros fiscais e configurações sensíveis. Por favor, introduza o PIN de um Administrador para autorizar.",
  requiredRole = "admin",
}) => {
  const { usuarios, currentUser, switchUser } = useApp();
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedAdminId, setSelectedAdminId] = useState<string>(() => {
    const admin = usuarios.find((u) => u.ativo && u.role === "admin");
    return admin ? admin.id : "";
  });

  const admins = usuarios.filter((u) => u.ativo && u.role === "admin");

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setErrorMsg(null);
      const defaultAdmin = usuarios.find((u) => u.ativo && u.role === "admin");
      if (defaultAdmin) setSelectedAdminId(defaultAdmin.id);
    }
  }, [isOpen, usuarios]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
      setErrorMsg(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPin("");
    setErrorMsg(null);
  };

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg("Introduza o código PIN de 4 dígitos.");
      return;
    }

    // Find target admin or any matching admin
    const targetAdmin = usuarios.find((u) => u.id === selectedAdminId && u.ativo && u.role === "admin");
    const matchingAdmin = usuarios.find((u) => u.ativo && u.role === "admin" && u.pin === pin.trim());

    if (targetAdmin && targetAdmin.pin === pin.trim()) {
      // Direct success with chosen admin
      switchUser(targetAdmin.id, pin.trim());
      onSuccess();
      onClose();
    } else if (matchingAdmin) {
      // PIN matched another admin user
      switchUser(matchingAdmin.id, pin.trim());
      onSuccess();
      onClose();
    } else {
      setErrorMsg("Código PIN de Administrador incorreto. Tente novamente.");
      setPin("");
    }
  };

  const selectedAdmin = admins.find((a) => a.id === selectedAdminId) || admins[0];
  const currentRoleBadge = getRoleBadgeInfo(currentUser.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400">Verificação de Segurança & Controlo de Acesso</p>
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
          {/* Current User Alert */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full ${currentUser.avatarColor || "bg-sky-600"} text-white font-bold flex items-center justify-center text-xs shadow-sm`}>
                {currentUser.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{currentUser.nome}</p>
                <p className="text-[11px] text-slate-500">{currentUser.cargo}</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${currentRoleBadge.bg} ${currentRoleBadge.text} ${currentRoleBadge.border}`}>
              {currentRoleBadge.label}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-amber-900">
            {description}
          </p>

          {/* Admin selector if multiple admins exist */}
          {admins.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Selecione o Administrador para Autorização:</label>
              <div className="grid grid-cols-2 gap-2">
                {admins.map((adm) => (
                  <button
                    key={adm.id}
                    type="button"
                    onClick={() => {
                      setSelectedAdminId(adm.id);
                      setErrorMsg(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs transition ${
                      selectedAdminId === adm.id
                        ? "border-purple-600 bg-purple-50 text-purple-900 font-semibold ring-2 ring-purple-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full ${adm.avatarColor || "bg-purple-600"} text-white font-bold flex items-center justify-center text-[10px]`}>
                      {adm.nome.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="truncate font-medium">{adm.nome.split(" ")[0]}</p>
                      <p className="text-[10px] text-slate-500 font-mono">@{adm.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PIN Display */}
          <form onSubmit={handleVerify} className="space-y-3">
            <div className="space-y-1 text-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Introduzir PIN de Administrador
              </label>
              
              <div className="flex items-center justify-center gap-3 py-2">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold font-mono transition-all ${
                      pin.length > index
                        ? "border-purple-600 bg-purple-50 text-purple-900 shadow-sm scale-105"
                        : "border-slate-300 bg-white text-slate-400"
                    }`}
                  >
                    {pin.length > index ? "•" : ""}
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num.toString())}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-lg transition flex items-center justify-center shadow-xs"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition flex items-center justify-center"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-lg transition flex items-center justify-center shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-11 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm transition flex items-center justify-center"
              >
                ⌫
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pin.length < 4}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm ${
                  pin.length >= 4
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Autorizar Acesso</span>
              </button>
            </div>
          </form>

          {/* Quick Demo Help */}
          <div className="text-[11px] text-slate-400 text-center bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
            PIN Padrão de Admin: <strong className="text-slate-700">1234</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
