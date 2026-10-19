import React, { useState } from "react";
import { useApp } from "../../store/AppContext";
import {
  Users, UserPlus, Shield, ShieldCheck, ShieldAlert, KeyRound,
  Edit2, Trash2, CheckCircle2, XCircle, Lock, Eye, EyeOff,
  Check, Info, Sparkles, UserCheck, AlertTriangle
} from "lucide-react";
import { UsuarioSistema, NivelAcesso } from "../../types";
import { UserModal } from "./UserModal";
import { PERMISSOES_MATRIZ, getRoleBadgeInfo } from "../../utils/userPermissions";

export const UserManagementSection: React.FC = () => {
  const { usuarios, currentUser, addUsuario, updateUsuario, deleteUsuario, switchUser } = useApp();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UsuarioSistema | null>(null);
  const [visiblePins, setVisiblePins] = useState<{ [id: string]: boolean }>({});
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"utilizadores" | "matriz">("utilizadores");

  const totalUsers = usuarios.length;
  const totalAdmins = usuarios.filter((u) => u.role === "admin").length;
  const totalOperadores = usuarios.filter((u) => u.role === "operador").length;
  const totalAuditores = usuarios.filter((u) => u.role === "auditor").length;

  const togglePinVisibility = (id: string) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAddModal = () => {
    setUserToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (user: UsuarioSistema) => {
    setUserToEdit(user);
    setModalOpen(true);
  };

  const handleSaveUser = (data: Omit<UsuarioSistema, "id" | "criadoEm">, id?: string) => {
    if (id) {
      updateUsuario(id, data);
      setFeedbackMsg({ type: "success", text: `Utilizador "${data.nome}" atualizado com sucesso.` });
    } else {
      const created = addUsuario(data);
      setFeedbackMsg({ type: "success", text: `Novo utilizador "${created.nome}" criado com sucesso.` });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDeleteUser = (user: UsuarioSistema) => {
    if (window.confirm(`Tem certeza que deseja remover o utilizador "${user.nome}" (@${user.username})?`)) {
      const res = deleteUsuario(user.id);
      if (res.success) {
        setFeedbackMsg({ type: "success", text: `Utilizador "${user.nome}" eliminado com sucesso.` });
      } else {
        setFeedbackMsg({ type: "error", text: res.message || "Erro ao eliminar utilizador." });
      }
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleToggleStatus = (user: UsuarioSistema) => {
    // Check if it's the only admin
    if (user.role === "admin" && user.ativo) {
      const otherActiveAdmins = usuarios.filter((u) => u.id !== user.id && u.ativo && u.role === "admin");
      if (otherActiveAdmins.length === 0) {
        setFeedbackMsg({ type: "error", text: "Não é possível desativar o único Administrador ativo." });
        setTimeout(() => setFeedbackMsg(null), 4000);
        return;
      }
    }
    updateUsuario(user.id, { ativo: !user.ativo });
    setFeedbackMsg({
      type: "success",
      text: `Utilizador ${user.nome} marcado como ${!user.ativo ? "Ativo" : "Inativo"}.`,
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in duration-150 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-600 text-xs underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Overview Cards & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Gestão de Utilizadores & Permissões</h2>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                  RBAC
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Controlo de níveis de acesso (Admin, Operador, Auditor) e proteção de módulos sensíveis com PIN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-purple-600/30 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Utilizador</span>
            </button>
          </div>
        </div>

        {/* Metric summary counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-slate-500">Total Utilizadores</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{totalUsers}</div>
          </div>
          <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-purple-700">👑 Administradores</span>
            <div className="text-xl font-black text-purple-900 mt-0.5">{totalAdmins}</div>
          </div>
          <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-sky-700">🛒 Operadores de Caixa</span>
            <div className="text-xl font-black text-sky-900 mt-0.5">{totalOperadores}</div>
          </div>
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-amber-700">🔍 Auditores Fiscais</span>
            <div className="text-xl font-black text-amber-900 mt-0.5">{totalAuditores}</div>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pt-2">
          <button
            onClick={() => setActiveSubTab("utilizadores")}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 ${
              activeSubTab === "utilizadores"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Lista de Utilizadores ({usuarios.length})
          </button>
          <button
            onClick={() => setActiveSubTab("matriz")}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeSubTab === "matriz"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Matriz de Permissões por Nível</span>
          </button>
        </div>

        {/* SubTab 1: Users List */}
        {activeSubTab === "utilizadores" && (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                    <th className="py-3 px-3">Utilizador & Cargo</th>
                    <th className="py-3 px-3">Nível (Role)</th>
                    <th className="py-3 px-3">Código PIN</th>
                    <th className="py-3 px-3">Último Acesso</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuarios.map((user) => {
                    const badge = getRoleBadgeInfo(user.role);
                    const isCurrentUser = currentUser.id === user.id;
                    const isPinVisible = visiblePins[user.id];

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-50/80 transition ${
                          !user.ativo ? "opacity-60 bg-slate-50/40" : ""
                        }`}
                      >
                        {/* Name & Avatar */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl ${user.avatarColor || "bg-sky-600"} text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0`}>
                              {user.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{user.nome}</span>
                                {isCurrentUser && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                                    Você
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">{user.cargo}</p>
                              <p className="text-[10px] text-slate-400 font-mono">@{user.username} {user.email && `· ${user.email}`}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* PIN */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold text-slate-700">
                              {isPinVisible ? user.pin : "••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePinVisibility(user.id)}
                              title={isPinVisible ? "Ocultar PIN" : "Ver PIN"}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                            >
                              {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        {/* Last Access */}
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {user.ultimoAcesso || "Nunca"}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                              user.ativo
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${user.ativo ? "bg-emerald-500" : "bg-slate-400"}`} />
                            <span>{user.ativo ? "Activo" : "Inactivo"}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              title="Editar Utilizador"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              title="Eliminar Utilizador"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SubTab 2: Permissions Matrix */}
        {activeSubTab === "matriz" && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
              <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Sobre o Controlo de Acesso Baseado em Funções (RBAC):</strong>
                <p className="mt-0.5">
                  Os utilizadores com nível <strong>Operador</strong> têm acesso às operações de balcão e faturação diária. Áreas sensíveis como <strong>Configurações do Sistema</strong>, <strong>Parâmetros AGT</strong> e <strong>Gestão de Contas</strong> exigem autenticação prévia de um <strong>Administrador</strong> via código PIN.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                    <th className="py-3 px-3">Módulo / Funcionalidade do Sistema</th>
                    <th className="py-3 px-3 text-center w-28 text-purple-700">👑 Admin</th>
                    <th className="py-3 px-3 text-center w-28 text-sky-700">🛒 Operador</th>
                    <th className="py-3 px-3 text-center w-28 text-amber-700">🔍 Auditor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PERMISSOES_MATRIZ.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{item.modulo}</p>
                        <p className="text-[11px] text-slate-500">{item.descricao}</p>
                      </td>

                      {/* Admin */}
                      <td className="py-2.5 px-3 text-center">
                        {item.admin ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                            <XCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>

                      {/* Operador */}
                      <td className="py-2.5 px-3 text-center">
                        {item.operador ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-50 text-rose-400">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </td>

                      {/* Auditor */}
                      <td className="py-2.5 px-3 text-center">
                        {item.auditor ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                            <XCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
      />
    </div>
  );
};
