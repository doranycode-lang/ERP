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
  clienteNif?: string;
  clienteEndereco?: string;
  linhas: LinhaFatura[];
  subtotalSemIva: number;
  totalIva: number;
  ivaTaxa: number;
  total: number;
  estado: 'rascunho' | 'emitida' | 'paga' | 'anulada';
  observacoes: string;
  pacienteId?: number;
  emitidoPor?: string;
  tipoDocumento: string;
  formaPagamento: string;
  facturaPremiada?: boolean;
  emissaoContagem?: number;
  codigoHash?: string;
}

export function formatCurrency(value: number, currency: string = "AOA"): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: currency === "EUR" ? "EUR" : currency === "USD" ? "USD" : "AOA",
    minimumFractionDigits: 2
  }).format(value).replace("AOA", "Kz");
}
