import React, { useState, useEffect } from "react";
import { UsuarioSistema, NivelAcesso } from "../../types";
import {
  User, Shield, KeyRound, Mail, Briefcase, Check, X,
  Sparkles, Eye, EyeOff, AlertCircle
} from "lucide-react";
import { getRoleBadgeInfo } from "../../utils/userPermissions";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Omit<UsuarioSistema, "id" | "criadoEm">, id?: string) => void;
  userToEdit?: UsuarioSistema | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userToEdit,
}) => {
  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState("");
  const [role, setRole] = useState<NivelAcesso>("operador");
  const [pin, setPin] = useState("1234");
  const [ativo, setAtivo] = useState(true);
  const [showPin, setShowPin] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (userToEdit) {
      setNome(userToEdit.nome);
      setUsername(userToEdit.username);
      setEmail(userToEdit.email || "");
      setCargo(userToEdit.cargo);
      setRole(userToEdit.role);
      setPin(userToEdit.pin || "1234");
      setAtivo(userToEdit.ativo);
    } else {
      setNome("");
      setUsername("");
      setEmail("");
      setCargo("Operador de Caixa");
      setRole("operador");
      setPin(Math.floor(1000 + Math.random() * 9000).toString());
      setAtivo(true);
    }
    setErrors({});
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleGeneratePin = () => {
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(random);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!nome.trim()) newErrors.nome = "Nome é obrigatório.";
    if (!username.trim()) newErrors.username = "Nome de utilizador é obrigatório.";
    if (!cargo.trim()) newErrors.cargo = "Cargo é obrigatório.";
    if (!pin.trim() || pin.length < 4) newErrors.pin = "O PIN deve conter pelo menos 4 dígitos numéricos.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(
      {
        nome: nome.trim(),
        username: username.trim().toLowerCase().replace(/\s+/g, "."),
        email: email.trim() || undefined,
        cargo: cargo.trim(),
        role,
        pin: pin.trim(),
        ativo,
      },
      userToEdit?.id
    );

    onClose();
  };

  const roleInfo = getRoleBadgeInfo(role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-xl">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">
                {userToEdit ? "Editar Utilizador" : "Novo Utilizador do Sistema"}
              </h3>
              <p className="text-xs text-slate-400">Definição de perfil, cargo e credenciais de acesso</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Role selector cards */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nível de Permissão (Role) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Admin */}
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  role === "admin"
                    ? "border-purple-600 bg-purple-50/80 text-purple-950 ring-2 ring-purple-500/20 shadow-xs"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">👑 Admin</span>
                  {role === "admin" && <Check className="w-4 h-4 text-purple-600 font-bold" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Acesso total (fiscais, definições, utilizadores)
                </p>
              </button>

              {/* Operador */}
              <button
                type="button"
                onClick={() => setRole("operador")}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  role === "operador"
                    ? "border-sky-600 bg-sky-50/80 text-sky-950 ring-2 ring-sky-500/20 shadow-xs"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">🛒 Operador</span>
                  {role === "operador" && <Check className="w-4 h-4 text-sky-600 font-bold" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Facturação, balcão, caixa e consultas
                </p>
              </button>

              {/* Auditor */}
              <button
                type="button"
                onClick={() => setRole("auditor")}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  role === "auditor"
                    ? "border-amber-600 bg-amber-50/80 text-amber-950 ring-2 ring-amber-500/20 shadow-xs"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">🔍 Auditor</span>
                  {role === "auditor" && <Check className="w-4 h-4 text-amber-600 font-bold" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Consulta, relatórios, SAF-T e auditoria
                </p>
              </button>
            </div>
          </div>

          {/* Nome Completo */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Nome Completo *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Ex: Dra. Ana Paula Baptista"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                  errors.nome ? "border-rose-400 bg-rose-50/30" : "border-slate-300 focus:border-sky-500"
                }`}
              />
            </div>
            {errors.nome && <p className="text-xs text-rose-600">{errors.nome}</p>}
          </div>

          {/* Username & Cargo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Nome de Utilizador (Login) *</label>
              <div className="relative">
                <span className="text-slate-400 absolute left-3 top-2 text-xs font-mono font-bold">@</span>
                <input
                  type="text"
                  placeholder="ana.baptista"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                    errors.username ? "border-rose-400 bg-rose-50/30" : "border-slate-300 focus:border-sky-500"
                  }`}
                />
              </div>
              {errors.username && <p className="text-xs text-rose-600">{errors.username}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Cargo / Função *</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ex: Farmacêutica Responsável"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                    errors.cargo ? "border-rose-400 bg-rose-50/30" : "border-slate-300 focus:border-sky-500"
                  }`}
                />
              </div>
              {errors.cargo && <p className="text-xs text-rose-600">{errors.cargo}</p>}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Correio Electrónico (Email)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="ana.baptista@farmacia.ao"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* PIN de Segurança & Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Código PIN (4 Dígitos) *</label>
                <button
                  type="button"
                  onClick={handleGeneratePin}
                  className="text-[11px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Gerar</span>
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPin ? "text" : "password"}
                  maxLength={6}
                  placeholder="Ex: 4892"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className={`w-full pl-9 pr-10 py-2 bg-white border rounded-xl text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                    errors.pin ? "border-rose-400 bg-rose-50/30" : "border-slate-300 focus:border-sky-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.pin && <p className="text-xs text-rose-600">{errors.pin}</p>}
            </div>

            {/* Ativo Checkbox */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Estado da Conta</label>
              <div className="flex items-center h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-800 select-none w-full">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <span>Utilizador Activo no Sistema</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-sky-600/30 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{userToEdit ? "Salvar Alterações" : "Criar Utilizador"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
