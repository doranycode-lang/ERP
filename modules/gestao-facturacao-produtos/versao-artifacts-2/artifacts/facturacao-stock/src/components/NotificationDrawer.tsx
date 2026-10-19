import React from "react";
import { useApp } from "../store/AppContext";
import { X, Bell, AlertTriangle, AlertOctagon, Clock, CheckCheck, PackageX, ShoppingBag } from "lucide-react";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const { notificacoes, marcarNotificacaoLida, limparNotificacoes } = useApp();

  if (!isOpen) return null;

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  Notificações & Alertas
                  {unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-300">Validades, níveis de estoque e documentos</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{notificacoes.length} alertas detetados</span>
            <button
              onClick={limparNotificacoes}
              className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 hover:underline"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todos como lidos
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notificacoes.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-semibold text-slate-600">Sem alertas pendentes</p>
                <p className="text-xs text-slate-400 mt-1">O seu estoque e documentos estão em dia!</p>
              </div>
            ) : (
              notificacoes.map((n) => {
                const isExpirada = n.tipo === "validade_expirada";
                const isValidadeProxima = n.tipo === "validade_proxima";
                const isStockBaixo = n.tipo === "stock_baixo";

                const icon = isExpirada ? (
                  <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                ) : isValidadeProxima ? (
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                ) : isStockBaixo ? (
                  <PackageX className="w-5 h-5 text-amber-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-sky-600 shrink-0" />
                );

                const cardBg = isExpirada
                  ? "bg-rose-50/70 border-rose-200"
                  : isValidadeProxima
                  ? "bg-amber-50/70 border-amber-200"
                  : isStockBaixo
                  ? "bg-orange-50/70 border-orange-200"
                  : "bg-sky-50/70 border-sky-200";

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      marcarNotificacaoLida(n.id);
                      if (isExpirada || isValidadeProxima) {
                        onNavigateTab?.("validade");
                        onClose();
                      } else if (isStockBaixo) {
                        onNavigateTab?.("estoque");
                        onClose();
                      } else {
                        onNavigateTab?.("facturacao");
                        onClose();
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${cardBg} ${
                      n.lida ? "opacity-60" : "shadow-sm ring-1 ring-black/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {icon}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{n.titulo}</h4>
                          <span className="text-[10px] text-slate-400">{n.hora}</span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed">{n.mensagem}</p>
                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500">{n.data}</span>
                          <span className="font-bold text-sky-700 hover:underline flex items-center gap-1">
                            Ver detalhes →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
            <button
              onClick={() => {
                onNavigateTab?.("validade");
                onClose();
              }}
              className="flex-1 py-2 text-xs font-bold bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition"
            >
              Alertas de Validade
            </button>
            <button
              onClick={() => {
                onNavigateTab?.("estoque");
                onClose();
              }}
              className="flex-1 py-2 text-xs font-bold bg-sky-100 text-sky-800 rounded-lg hover:bg-sky-200 transition"
            >
              Ver Estoque
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
