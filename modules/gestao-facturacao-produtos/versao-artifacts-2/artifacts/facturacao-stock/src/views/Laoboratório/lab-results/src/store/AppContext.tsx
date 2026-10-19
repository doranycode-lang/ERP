// @refresh reset
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { api } from "./api";
import { gerarProdutosDosCatalogo } from "../utils/seedProdutos";
import { defaultConfig } from "./defaults";

export interface ParametroResult {
  exame: string;
  parametro: string;
  resultado: string;
  unidade: string;
  referencia: string;
}

export interface Paciente {
  id: number;
  nome: string;
  nasc: string;
  sexo: string;
  idade: string;
  bi?: string;
  nif?: string;
  nacionalidade?: string;
  estadoCivil?: string;
  profissao?: string;
  telefone?: string;
  telefone2?: string;
  email?: string;
  endereco?: string;
  grupoSanguineo?: string;
  fatorRh?: string;
  alergias?: string;
  patologiasCronicas?: string;
  medicacaoHabitual?: string;
  contactoEmergenciaNome?: string;
  contactoEmergenciaTel?: string;
  empresa: string;
  processo: string;
  medico: string;
  nAmostra: string;
  recolha: string;
}

export interface Resultado {
  id: number;
  pacienteId: number;
  pacienteNome: string;
  data: string;
  dataEmissao: string;
  parametros: ParametroResult[];
  tecnicoNome?: string;
}

export interface LinhaFatura {
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  ivaIsento: boolean;
  unidade?: string;
}

export interface Fatura {
  id: number;
  numero: string;
  serie: string;
  data: string;
  horaOperacao?: string;
  dataVencimento: string;
  clienteNome: string;
  clienteNif: string;
  clienteEndereco: string;
  linhas: LinhaFatura[];
  subtotalSemIva: number;
  totalIva: number;
  ivaTaxa: number;
  total: number;
  estado: "rascunho" | "emitida" | "paga" | "anulada";
  observacoes: string;
  pacienteId?: number;
  resultadoId?: number;
  emitidoPor?: string;
  codigoHash?: string;
  emissaoContagem?: number;
  facturaPremiada?: boolean;
  notaCreditoMotivo?: string;
  tipoDocumento?: string;
  formaPagamento?: string;
}

export interface MovimentoCC {
  id: number;
  data: string;
  descricao: string;
  tipo: "entrada" | "saida";
  valor: number;
  categoria: string;
  faturaId?: number;
  referencia: string;
  registadoPor?: string;
}

export interface Config {
  nomeClinica: string;
  nif: string;
  endereco: string;
  telefone: string;
  email: string;
  directorTecnico: string;
  logoData: string;
  assinaturaData: string;
  serie: string;
  proximoNumeroFatura: number;
  ivaTaxa: number;
  moeda: string;
  website: string;
}

export interface Produto {
  id: number;
  codigo: string;
  nome: string;
  categoria: string;
  preco: number;
  ivaIsento: boolean;
  descricao?: string;
  ativo: boolean;
}

export type ExamesCustom = Record<string, Record<string, { param: string; unidade: string; referencia: string }[]>>;

export interface AppData {
  pacientes: Paciente[];
  resultados: Resultado[];
  config: Config;
  examesCustom: ExamesCustom;
  faturas: Fatura[];
  movimentosCC: MovimentoCC[];
  produtos: Produto[];
}


interface AppContextType {
  data: AppData;
  loading: boolean;
  reload: () => Promise<void>;
  addPaciente: (p: Omit<Paciente, "id">) => Promise<void>;
  removePaciente: (id: number) => Promise<void>;
  updatePaciente: (id: number, p: Omit<Paciente, "id">) => Promise<void>;
  addResultado: (r: Omit<Resultado, "id">) => Promise<void>;
  updateResultado: (id: number, r: Omit<Resultado, "id">) => Promise<void>;
  removeResultado: (id: number) => Promise<void>;
  updateConfig: (cfg: Partial<Config>) => Promise<void>;
  addExameCustom: (categoria: string, nome: string, params: { param: string; unidade: string; referencia: string }[]) => Promise<void>;
  updateExameCustom: (oldId: number, newCat: string, newNome: string, params: { param: string; unidade: string; referencia: string }[]) => Promise<void>;
  removeExameCustom: (id: number) => Promise<void>;
  addFatura: (f: Omit<Fatura, "id" | "numero">) => Promise<Fatura>;
  updateFatura: (id: number, f: Partial<Fatura>) => Promise<void>;
  removeFatura: (id: number) => Promise<void>;
  addMovimento: (m: Omit<MovimentoCC, "id">) => Promise<void>;
  removeMovimento: (id: number) => Promise<void>;
  addProduto: (p: Omit<Produto, "id">) => Promise<void>;
  updateProduto: (id: number, p: Omit<Produto, "id">) => Promise<void>;
  removeProduto: (id: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function normalizeNum(v: any): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function normalizeFatura(f: any): Fatura {
  return {
    ...f,
    subtotalSemIva: normalizeNum(f.subtotalSemIva),
    totalIva: normalizeNum(f.totalIva),
    ivaTaxa: normalizeNum(f.ivaTaxa),
    total: normalizeNum(f.total),
    linhas: Array.isArray(f.linhas) ? f.linhas : [],
  };
}

function normalizeMovimento(m: any): MovimentoCC {
  return { ...m, valor: normalizeNum(m.valor) };
}

function normalizeProduto(p: any): Produto {
  return { ...p, preco: normalizeNum(p.preco) };
}

function normalizeResultado(r: any): Resultado {
  return { ...r, parametros: Array.isArray(r.parametros) ? r.parametros : [] };
}

function normalizeConfig(c: any): Config {
  return {
    nomeClinica: c.nomeClinica ?? defaultConfig.nomeClinica,
    nif: c.nif ?? "",
    endereco: c.endereco ?? defaultConfig.endereco,
    telefone: c.telefone ?? defaultConfig.telefone,
    email: c.email ?? defaultConfig.email,
    directorTecnico: c.directorTecnico ?? defaultConfig.directorTecnico,
    logoData: c.logoData ?? "",
    assinaturaData: c.assinaturaData ?? "",
    serie: c.serie ?? "A",
    proximoNumeroFatura: normalizeNum(c.proximoNumeroFatura) || 1,
    ivaTaxa: normalizeNum(c.ivaTaxa) || 14,
    moeda: c.moeda ?? "AOA",
    website: c.website ?? "",
  };
}

function examesCustomFromList(list: any[]): ExamesCustom {
  const result: ExamesCustom = {};
  for (const e of list) {
    if (!result[e.categoria]) result[e.categoria] = {};
    result[e.categoria][e.nome] = Array.isArray(e.parametros) ? e.parametros : [];
  }
  return result;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>({
    pacientes: [], resultados: [], config: { ...defaultConfig },
    examesCustom: {}, faturas: [], movimentosCC: [], produtos: [],
  });
  const [loading, setLoading] = useState(true);
  const examesListRef = useRef<any[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [pacientes, resultados, cfg, examesList, faturas, movimentos, produtos] = await Promise.all([
        api.pacientes.list(),
        api.resultados.list(),
        api.config.get(),
        api.examesCustom.list(),
        api.faturas.list(),
        api.movimentos.list(),
        api.produtos.list(),
      ]);
      examesListRef.current = examesList;
      let prodList = produtos.map(normalizeProduto);
      if (prodList.length === 0) {
        const seeds = gerarProdutosDosCatalogo();
        await Promise.all(seeds.map((s: any) => api.produtos.create({ ...s, ivaIsento: s.ivaIsento ?? false, ativo: true })));
        const fresh = await api.produtos.list();
        prodList = fresh.map(normalizeProduto);
      }
      setData({
        pacientes,
        resultados: resultados.map(normalizeResultado),
        config: normalizeConfig(cfg),
        examesCustom: examesCustomFromList(examesList),
        faturas: faturas.map(normalizeFatura),
        movimentosCC: movimentos.map(normalizeMovimento),
        produtos: prodList,
      });
    } catch (err: any) {
      if (err?.message === "Não autenticado" || err?.message?.includes("401") || err?.message?.includes("autenticad")) {
        window.dispatchEvent(new CustomEvent("lab:unauthenticated"));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const addPaciente = useCallback(async (p: Omit<Paciente, "id">) => {
    await api.pacientes.create(p);
    const list = await api.pacientes.list();
    setData((d) => ({ ...d, pacientes: list }));
  }, []);

  const removePaciente = useCallback(async (id: number) => {
    await api.pacientes.delete(id);
    setData((d) => ({ ...d, pacientes: d.pacientes.filter((x) => x.id !== id) }));
  }, []);

  const updatePaciente = useCallback(async (id: number, p: Omit<Paciente, "id">) => {
    const updated = await api.pacientes.update(id, p);
    setData((d) => ({ ...d, pacientes: d.pacientes.map((x) => x.id === id ? updated : x) }));
  }, []);

  const addResultado = useCallback(async (r: Omit<Resultado, "id">) => {
    await api.resultados.create(r);
    const list = await api.resultados.list();
    setData((d) => ({ ...d, resultados: list.map(normalizeResultado) }));
  }, []);

  const updateResultado = useCallback(async (id: number, r: Omit<Resultado, "id">) => {
    const updated = await api.resultados.update(id, r);
    setData((d) => ({ ...d, resultados: d.resultados.map((x) => x.id === id ? normalizeResultado(updated) : x) }));
  }, []);

  const removeResultado = useCallback(async (id: number) => {
    await api.resultados.delete(id);
    setData((d) => ({ ...d, resultados: d.resultados.filter((x) => x.id !== id) }));
  }, []);

  const updateConfig = useCallback(async (cfg: Partial<Config>) => {
    const merged = { ...data.config, ...cfg };
    const updated = await api.config.update(merged);
    setData((d) => ({ ...d, config: normalizeConfig(updated) }));
  }, [data.config]);

  const addExameCustom = useCallback(async (categoria: string, nome: string, params: { param: string; unidade: string; referencia: string }[]) => {
    await api.examesCustom.create({ categoria, nome, parametros: params });
    const list = await api.examesCustom.list();
    examesListRef.current = list;
    setData((d) => ({ ...d, examesCustom: examesCustomFromList(list) }));
  }, []);

  const updateExameCustom = useCallback(async (oldId: number, newCat: string, newNome: string, params: { param: string; unidade: string; referencia: string }[]) => {
    await api.examesCustom.update(oldId, { categoria: newCat, nome: newNome, parametros: params });
    const list = await api.examesCustom.list();
    examesListRef.current = list;
    setData((d) => ({ ...d, examesCustom: examesCustomFromList(list) }));
  }, []);

  const removeExameCustom = useCallback(async (id: number) => {
    await api.examesCustom.delete(id);
    const list = await api.examesCustom.list();
    examesListRef.current = list;
    setData((d) => ({ ...d, examesCustom: examesCustomFromList(list) }));
  }, []);

  const addFatura = useCallback(async (f: Omit<Fatura, "id" | "numero">): Promise<Fatura> => {
    const nova = await api.faturas.create(f);
    const normalizada = normalizeFatura(nova);
    setData((d) => ({ ...d, faturas: [...d.faturas, normalizada] }));
    return normalizada;
  }, []);

  const updateFatura = useCallback(async (id: number, f: Partial<Fatura>) => {
    const updated = await api.faturas.update(id, f);
    setData((d) => ({ ...d, faturas: d.faturas.map((x) => x.id === id ? normalizeFatura(updated) : x) }));
  }, []);

  const removeFatura = useCallback(async (id: number) => {
    await api.faturas.delete(id);
    setData((d) => ({ ...d, faturas: d.faturas.filter((x) => x.id !== id) }));
  }, []);

  const addMovimento = useCallback(async (m: Omit<MovimentoCC, "id">) => {
    const novo = await api.movimentos.create(m);
    setData((d) => ({ ...d, movimentosCC: [...d.movimentosCC, normalizeMovimento(novo)] }));
  }, []);

  const removeMovimento = useCallback(async (id: number) => {
    await api.movimentos.delete(id);
    setData((d) => ({ ...d, movimentosCC: d.movimentosCC.filter((x) => x.id !== id) }));
  }, []);

  const addProduto = useCallback(async (p: Omit<Produto, "id">) => {
    const novo = await api.produtos.create(p);
    setData((d) => ({ ...d, produtos: [...d.produtos, normalizeProduto(novo)] }));
  }, []);

  const updateProduto = useCallback(async (id: number, p: Omit<Produto, "id">) => {
    const updated = await api.produtos.update(id, p);
    setData((d) => ({ ...d, produtos: d.produtos.map((x) => x.id === id ? normalizeProduto(updated) : x) }));
  }, []);

  const removeProduto = useCallback(async (id: number) => {
    await api.produtos.delete(id);
    setData((d) => ({ ...d, produtos: d.produtos.filter((x) => x.id !== id) }));
  }, []);

  return (
    <AppContext.Provider value={{
      data, loading, reload,
      addPaciente, removePaciente, updatePaciente,
      addResultado, updateResultado, removeResultado,
      updateConfig, addExameCustom, updateExameCustom, removeExameCustom,
      addFatura, updateFatura, removeFatura,
      addMovimento, removeMovimento,
      addProduto, updateProduto, removeProduto,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
