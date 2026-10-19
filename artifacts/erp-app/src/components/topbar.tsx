import React from "react";
import { useLocation, useRouter } from "wouter";
import { useGetSettings } from "@workspace/api-client-react";
import { Plus, HelpCircle, Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const PAGE_META: Record<string, { title: string; createHref?: string; createLabel?: string }> = {
  "/dashboard": { title: "Dashboard" },
  "/documentos": { title: "Documentos", createHref: "/documentos/novo", createLabel: "Novo Documento" },
  "/documentos/novo": { title: "Novo Documento" },
  "/documentos/faturacao": { title: "Facturas" },
  "/documentos/faturacao-lab": { title: "Novo Documento" },
  "/documentos/liquidar": { title: "Faturas por Liquidar" },
  "/documentos/transporte": { title: "Transporte" },
  "/documentos/avencas": { title: "Avenças" },
  "/documentos/formacao": { title: "Formação" },
  "/documentos/conta-corrente": { title: "Conta Corrente" },
  "/produtos": { title: "Produtos", createHref: "/produtos", createLabel: "Novo Produto" },
  "/produtos/stock": { title: "Análise de Stock" },
  "/produtos/movimentos": { title: "Movimentos de Stock" },
  "/clientes": { title: "Clientes", createHref: "/clientes", createLabel: "Novo Cliente" },
  "/configuracoes": { title: "Configurações" },
  "/lab/pacientes": { title: "Pacientes LAB", createHref: "/lab/pacientes", createLabel: "Novo Paciente" },
  "/lab/resultados": { title: "Resultados LAB", createHref: "/lab/resultados", createLabel: "Novo Resultado" },
  "/lab/exames": { title: "Catálogo de Exames", createHref: "/lab/exames", createLabel: "Novo Exame" },
};

function getPageMeta(location: string) {
  const routePath = location.split("?")[0];
  if (PAGE_META[routePath]) return PAGE_META[routePath];
  if (routePath.startsWith("/documentos/")) {
    return { title: "Detalhe do Documento" };
  }
  if (routePath.startsWith("/produtos/")) return { title: "Produto" };
  if (routePath.startsWith("/clientes/")) return { title: "Cliente" };
  return PAGE_META[location] ?? { title: "ERP" };
}

export default function Topbar() {
  const { data: settings } = useGetSettings();
  const [location, setLocation] = useLocation();
  const meta = getPageMeta(location);

  return (
    <div className="h-14 bg-white border-b flex items-center justify-between px-6 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-medium text-gray-800 tracking-tight">{meta.title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {meta.createHref && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
            onClick={() => {
              if (meta.createHref === location) {
                document.dispatchEvent(new CustomEvent("erp:open-create"));
              } else {
                setLocation(meta.createHref!);
              }
            }}
          >
            <Plus size={14} />
            <span>{meta.createLabel ?? "Criar"}</span>
          </Button>
        )}

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button className="text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <HelpCircle size={18} />
        </button>

        <button className="text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-xs font-medium text-gray-700">Admin</span>
            <span className="text-[10px] text-gray-500">{settings?.companyName || "A carregar..."}</span>
          </div>
          <Avatar className="h-8 w-8 border border-gray-200">
            <AvatarImage src={settings?.logoUrl || undefined} />
            <AvatarFallback className="bg-blue-50 text-blue-700 text-xs font-bold">
              {settings?.companyName?.substring(0, 2).toUpperCase() || "AD"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
