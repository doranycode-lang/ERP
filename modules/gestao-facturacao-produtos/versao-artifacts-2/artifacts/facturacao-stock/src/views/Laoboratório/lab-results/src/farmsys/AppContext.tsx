import React, { createContext, useContext } from "react";
import { Fatura } from "./storage";

interface AppContextType {
  data: {
    produtos: any[];
    pacientes: any[];
    config: any;
    faturas: Fatura[];
  };
  addFatura: (dados: Omit<Fatura, "id" | "numero">) => Promise<Fatura>;
  updateFatura: (id: number, dados: Partial<Fatura>) => Promise<void>;
  removeFatura: (id: number) => Promise<void>;
  addMovimento: (movimento: any) => Promise<void>;
  addProduto: (produto: any) => Promise<void>;
  updateProduto: (id: number, produto: any) => Promise<void>;
  addPaciente: (paciente: any) => Promise<any>;
  updatePaciente: (id: number, paciente: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

interface AppProviderProps {
  products: any[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  clients: any[];
  setClients: React.Dispatch<React.SetStateAction<any[]>>;
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
  cashFlow: any[];
  setCashFlow: React.Dispatch<React.SetStateAction<any[]>>;
  faturas: any[];
  setFaturas: React.Dispatch<React.SetStateAction<any[]>>;
  addActivity: (title: string, tipo: any) => void;
  showNotification: (msg: string) => void;
  children: React.ReactNode;
}

export function AppProvider({
  products,
  setProducts,
  clients,
  setClients,
  config,
  setConfig,
  cashFlow,
  setCashFlow,
  faturas,
  setFaturas,
  addActivity,
  showNotification,
  children,
}: AppProviderProps) {

  const addFatura = async (dados: Omit<Fatura, "id" | "numero">): Promise<Fatura> => {
    const nextId = faturas.length > 0 ? Math.max(...faturas.map(f => f.id)) + 1 : 1;
    const docCode = dados.tipoDocumento === "pro-forma" ? "PP" : dados.tipoDocumento === "nota-credito" ? "NC" : "FT";
    const numero = `${docCode}-${config.serie || 'A'}/${new Date().getFullYear()}/${String(nextId).padStart(4, "0")}`;
    const novaFatura: Fatura = { ...dados, id: nextId, numero };
    setFaturas(prev => [novaFatura, ...prev]);
    if (novaFatura.estado === "paga") {
      await addMovimento({
        data: novaFatura.data,
        descricao: `Venda Factura #${novaFatura.numero}`,
        tipo: "entrada",
        valor: novaFatura.total,
      });
    }
    return novaFatura;
  };

  const updateFatura = async (id: number, dados: Partial<Fatura>): Promise<void> => {
    setFaturas(prev => prev.map(f => f.id === id ? { ...f, ...dados } as Fatura : f));
  };

  const removeFatura = async (id: number): Promise<void> => {
    setFaturas(prev => prev.filter(f => f.id !== id));
  };

  const addMovimento = async (movimento: any): Promise<void> => {
    const newEntry = {
      id: Date.now(),
      data: movimento.data || new Date().toLocaleDateString('pt-PT'),
      tipo: movimento.tipo === "entrada" || movimento.tipo === "Entrada" ? "Entrada" as const : "Saída" as const,
      descricao: movimento.descricao,
      valor: movimento.valor,
      responsavel: movimento.registadoPor || "Admin",
    };
    setCashFlow(prev => [newEntry, ...prev]);
    if (addActivity) addActivity(`Movimento de caixa: ${movimento.descricao}`, 'financeiro');
  };

  const addProduto = async (produto: any): Promise<void> => {
    const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const novo = { ...produto, id: nextId, armazem: produto.armazem || "Geral", imagem: produto.imagem || "" };
    setProducts(prev => [...prev, novo]);
    if (addActivity) addActivity(`Produto adicionado: ${produto.nome}`, 'sistema');
  };

  const updateProduto = async (id: number, produto: any): Promise<void> => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...produto } : p));
    if (addActivity) addActivity(`Produto atualizado: ${produto.nome || id}`, 'sistema');
  };

  const addPaciente = async (paciente: any): Promise<any> => {
    const nextId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
    const novo = { ...paciente, id: nextId, totalCompras: paciente.totalCompras || 0 };
    setClients(prev => [...prev, novo]);
    if (addActivity) addActivity(`Cliente adicionado: ${paciente.nome}`, 'sistema');
    return novo;
  };

  const updatePaciente = async (id: number, paciente: any): Promise<void> => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...paciente } : c));
    if (addActivity) addActivity(`Cliente atualizado: ${paciente.nome || id}`, 'sistema');
  };

  const mappedConfig = {
    ...config,
    nomeClinica: config.empresa || "FarmaGest Pro",
    ivaTaxa: config.iva !== undefined ? config.iva : 14,
    serie: config.serie || "A",
  };

  return (
    <AppContext.Provider
      value={{
        data: { produtos: products, pacientes: clients, config: mappedConfig, faturas },
        addFatura, updateFatura, removeFatura, addMovimento,
        addProduto, updateProduto, addPaciente, updatePaciente,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
