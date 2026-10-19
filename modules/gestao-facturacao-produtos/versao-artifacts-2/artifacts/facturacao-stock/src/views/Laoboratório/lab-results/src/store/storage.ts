export { defaultConfig } from "./defaults";
export type { Paciente, Resultado, LinhaFatura, Fatura, MovimentoCC, Config, Produto, ExamesCustom, AppData } from "./AppContext";

export interface ParametroResult {
  exame: string;
  parametro: string;
  resultado: string;
  unidade: string;
  referencia: string;
}

export function formatCurrency(valor: number, moeda: string = "AOA"): string {
  return `${moeda} ${valor.toLocaleString("pt-AO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
