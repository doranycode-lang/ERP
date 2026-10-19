import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Fatura, Produto, MovimentoStock, PacienteCliente, ConfigSistema } from "../types";
import { formatCurrency } from "./faturaGenerator";

/**
 * Universal Print Dispatcher: Prints HTML or PDF content reliably.
 * Uses a hidden iframe strategy first (guaranteed to work inside sandboxed iframes & PWAs),
 * with popup window and direct PDF download fallback.
 */
export function realPrintHTML(htmlContent: string, documentTitle: string = "Documento"): boolean {
  try {
    // 1. Try hidden iframe printing (Most reliable in web apps & iframes)
    const existingIframe = document.getElementById("universal-print-frame");
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "universal-print-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn("Iframe print caught exception, falling back to window.open", e);
          fallbackWindowPrint(htmlContent, documentTitle);
        }
      }, 350);
      return true;
    }
  } catch (err) {
    console.warn("Hidden iframe print failed:", err);
  }

  return fallbackWindowPrint(htmlContent, documentTitle);
}

function fallbackWindowPrint(htmlContent: string, documentTitle: string): boolean {
  try {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
      return true;
    }
  } catch {}

  // Fallback: download as printable HTML
  downloadBlob(htmlContent, `${documentTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}.html`, "text/html;charset=utf-8;");
  return false;
}

export function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * =========================================================================
 * 1. REAL VECTOR PDF GENERATOR: FATURA / RECIBO / NOTA DE CRÉDITO
 * =========================================================================
 */
export function exportFaturaPDF(
  fatura: Fatura,
  config: ConfigSistema,
  options: { segundaVia?: boolean; termica?: boolean } = {}
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const moeda = config.moeda || "AOA";
  const docTitleMap: Record<string, string> = {
    factura: "FACTURA",
    "factura-recibo": "FACTURA-RECIBO",
    "factura-global": "FACTURA GLOBAL",
    "pro-forma": "FACTURA PRÓ-FORMA",
    "nota-credito": "NOTA DE CRÉDITO",
    recibo: "RECIBO DE PAGAMENTO",
  };
  const docTitle = docTitleMap[fatura.tipoDocumento] || "FACTURA";
  const isProForma = fatura.tipoDocumento === "pro-forma";

  // Colors
  const primaryColor: [number, number, number] = [2, 132, 199]; // Sky 600
  const darkColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const grayText: [number, number, number] = [100, 116, 139]; // Slate 500

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 6, "F");

  // Company Details (Left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...darkColor);
  let companyTextX = 14;
  if (config.logoDataUrl) {
    try {
      doc.addImage(config.logoDataUrl, "PNG", 14, 10, 26, 26, undefined, "FAST");
      companyTextX = 44;
    } catch {
      console.warn("Não foi possível inserir o logótipo no PDF.");
    }
  }
  doc.text(config.nomeClinica || "EMPRESA COMERCIAL", companyTextX, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...grayText);
  let y = 26;
  doc.text(`NIF: ${config.nif || "999999999"} | Reg. Comercial: ${config.nif || "Conservatória Luanda"}`, companyTextX, y);
  y += 4.5;
  if (config.endereco) {
    doc.text(`Endereço: ${config.endereco}`, companyTextX, y);
    y += 4.5;
  }
  if (config.telefone || config.email) {
    doc.text(`Tel: ${config.telefone || "—"} | Email: ${config.email || "—"}`, companyTextX, y);
    y += 4.5;
  }

  // Document Title & Number Badge (Right)
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(120, 14, 76, 28, 3, 3, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(120, 14, 76, 28, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...primaryColor);
  doc.text(`${docTitle}`, 158, 22, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text(`N.º ${fatura.numero}`, 158, 28, { align: "center" });
  if (isProForma) {
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(8);
    doc.text("NÃO OFICIAL", 158, 32, { align: "center" });
    doc.text("NÃO SERVE COMO COMPROVATIVO", 158, 36, { align: "center" });
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  if (options.segundaVia) {
    doc.setTextColor(220, 38, 38);
    doc.text("*** 2ª VIA - DUPLICADO ***", 158, 35, { align: "center" });
  } else {
    doc.setTextColor(16, 185, 129);
    doc.text("ORIGINAL", 158, 35, { align: "center" });
  }

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 46, 196, 46);

  // 2. Client & Invoice Info Boxes
  // Client Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 50, 88, 32, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text("DADOS DO CLIENTE / ADQUIRENTE", 18, 56);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...darkColor);
  doc.text(fatura.clienteNome || "Consumidor Final", 18, 62);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...grayText);
  doc.text(`NIF: ${fatura.clienteNif || "Consumidor Final"}`, 18, 67);
  if (fatura.clienteTelefone) doc.text(`Tel: ${fatura.clienteTelefone}`, 18, 72);
  if (fatura.clienteEndereco) doc.text(`Morada: ${fatura.clienteEndereco.substring(0, 38)}`, 18, 77);

  // Meta Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(108, 50, 88, 32, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text("DETALHES DA OPERAÇÃO FISCAL", 112, 56);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text(`Data de Emissão: ${fatura.data} às ${fatura.horaOperacao || "12:00"}`, 112, 62);
  doc.text(`Data de Vencimento: ${fatura.dataVencimento || fatura.data}`, 112, 67);
  doc.text(`Forma de Pagamento: ${fatura.formaPagamento || "Pronto Pagamento"}`, 112, 72);
  doc.text(`Estado / Regime: ${fatura.estado.toUpperCase()} (${config.configuracaoFiscal?.regimeIva || "Regime Geral"})`, 112, 77);

  // 3. Table of Invoice Lines
  const tableRows = fatura.linhas.map((l, index) => [
    (index + 1).toString(),
    l.codigo ? `[${l.codigo}] ${l.descricao}` : l.descricao,
    l.lote ? `Lote: ${l.lote}${l.dataValidade ? ` (Val: ${l.dataValidade})` : ""}` : "—",
    l.ivaIsento ? "Isento (M02)" : `${fatura.ivaTaxa}%`,
    `${l.quantidade} ${l.unidade || "un"}`,
    formatCurrency(l.precoUnitario, moeda),
    formatCurrency(l.quantidade * l.precoUnitario, moeda),
  ]);

  autoTable(doc, {
    startY: 86,
    head: [["#", "Descrição do Artigo / Serviço", "Lote / Validade", "Taxa IVA", "Qtd", "Preço Unit.", "Total Líquido"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 8.5,
      fontStyle: "bold",
      halign: "left",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: darkColor,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 65 },
      2: { cellWidth: 32 },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 16, halign: "center" },
      5: { cellWidth: 24, halign: "right" },
      6: { cellWidth: 25, halign: "right", fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // 4. Totals and Banking Coordinates
  // Banking Coordinates (Left)
  const bankY = finalY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text("Coordenadas Bancárias para Liquidação:", 14, bankY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayText);
  let bY = bankY + 4.5;
  if (config.bancoNome) {
    doc.text(`Banco: ${config.bancoNome}`, 14, bY);
    bY += 4;
  }
  if (config.bancoIban) {
    doc.text(`IBAN: ${config.bancoIban}`, 14, bY);
    bY += 4;
  }
  if (config.bancoSwift) {
    doc.text(`SWIFT/BIC: ${config.bancoSwift}`, 14, bY);
    bY += 4;
  }
  if (fatura.observacoes) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkColor);
    doc.text(`Observações: ${fatura.observacoes.substring(0, 70)}`, 14, bY);
  }

  // Totals Box (Right)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(120, bankY - 3, 76, 34, 2, 2, "FD");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(120, bankY - 3, 76, 34, 2, 2, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...grayText);
  doc.text("Subtotal Ilíquido:", 124, bankY + 2);
  doc.text(formatCurrency(fatura.subtotalSemIva, moeda), 192, bankY + 2, { align: "right" });

  if (fatura.desconto) {
    doc.text(`Desconto Comercial (${fatura.desconto}%):`, 124, bankY + 7);
    doc.setTextColor(22, 163, 74);
    doc.text(`-${formatCurrency((fatura.subtotalSemIva * (fatura.desconto / 100)), moeda)}`, 192, bankY + 7, { align: "right" });
    doc.setTextColor(...grayText);
  }

  doc.text(`Incidência / Total IVA (${fatura.ivaTaxa}%):`, 124, bankY + 12);
  doc.text(formatCurrency(fatura.totalIva, moeda), 192, bankY + 12, { align: "right" });

  // Grand Total Line
  doc.setFillColor(2, 132, 199);
  doc.roundedRect(122, bankY + 16, 72, 11, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL A PAGAR:", 126, bankY + 23);
  doc.text(formatCurrency(fatura.total, moeda), 190, bankY + 23, { align: "right" });

  // 5. Fiscal Footer
  const footerY = 272;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY - 4, 196, footerY - 4);

  doc.setFont("courier", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(isProForma ? "DOCUMENTO NÃO OFICIAL — NÃO SERVE COMO COMPROVATIVO DE FACTURA" : fatura.codigoHash || "Hash SHA-256 não disponível", 14, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...grayText);
  doc.text("Os bens/serviços foram colocados à disposição do adquirente na data e local do documento.", 14, footerY + 4);
  doc.text("Documento processado por computador | Software de facturação — certificação AGT pendente", 14, footerY + 8);
  doc.text(`Emitido por: ${fatura.emitidoPor || "Operador"} | Página 1/1`, 196, footerY + 8, { align: "right" });

  // Save / Trigger Download
  const filename = `${docTitle}_${fatura.numero.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  doc.save(filename);
}

/**
 * =========================================================================
 * 2. REAL VECTOR PDF GENERATOR: RELATÓRIO GERAL DE ESTOQUE & INVENTÁRIO
 * =========================================================================
 */
export function exportEstoqueRelatorioPDF(
  produtos: Produto[],
  config: ConfigSistema,
  options: {
    titulo?: string;
    categoria?: string;
    apenasStockBaixo?: boolean;
    operador?: string;
    orientacao?: "portrait" | "landscape";
  } = {}
) {
  const orientacao = options.orientacao || "landscape";
  const doc = new jsPDF({
    orientation: orientacao,
    unit: "mm",
    format: "a4",
  });

  const moeda = config.moeda || "AOA";
  const primaryColor: [number, number, number] = [2, 132, 199];
  const darkColor: [number, number, number] = [15, 23, 42];
  const grayText: [number, number, number] = [100, 116, 139];

  // Aggregates
  let totalItems = 0;
  let totalUnidades = 0;
  let totalCusto = 0;
  let totalVenda = 0;
  let itensBaixo = 0;

  produtos.forEach((p) => {
    totalItems++;
    totalUnidades += p.stock;
    totalCusto += p.stock * (p.precoCusto || 0);
    totalVenda += p.stock * p.preco;
    if (p.stockMinimo > 0 && p.stock <= p.stockMinimo) itensBaixo++;
  });

  // Top header banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, orientacao === "landscape" ? 297 : 210, 5, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text(config.nomeClinica || "CLÍNICA & GESTÃO HOSPITALAR", 14, 15);

  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text(options.titulo || "RELATÓRIO GERAL DE INVENTÁRIO E ESTOQUE", 14, 21);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayText);
  const now = new Date();
  doc.text(`Data de Emissão: ${now.toLocaleDateString("pt-PT")} às ${now.toLocaleTimeString("pt-PT")} | NIF: ${config.nif || "999999999"}`, 14, 26);
  doc.text(`Filtro: ${options.categoria || "Todas as Categorias"} | Operador: ${options.operador || "Administrador"}`, 14, 30);

  // Summary Metrics Banner
  const startY = 36;
  const tableRows = produtos.map((p, idx) => [
    (idx + 1).toString(),
    p.codigo,
    p.nome,
    p.categoria,
    p.loteAtual || (p.lotes && p.lotes[0]?.numeroLote) || "—",
    p.dataValidade || (p.lotes && p.lotes[0]?.dataValidade) || "—",
    p.stock <= 0 ? "0 (ESGOTADO)" : `${p.stock} ${p.unidadeMedida}`,
    p.stockMinimo.toString(),
    formatCurrency(p.precoCusto || 0, moeda),
    formatCurrency(p.preco, moeda),
    formatCurrency(p.stock * p.preco, moeda),
  ]);

  autoTable(doc, {
    startY: startY,
    head: [["#", "Código", "Designação do Artigo", "Categoria", "Lote", "Validade", "Stock", "Mín.", "P. Custo", "P. Venda", "Total Venda"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: darkColor,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 18, fontStyle: "bold" },
      2: { cellWidth: orientacao === "landscape" ? 70 : 45 },
      3: { cellWidth: 26 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 20, halign: "center", fontStyle: "bold" },
      7: { cellWidth: 12, halign: "center" },
      8: { cellWidth: 22, halign: "right" },
      9: { cellWidth: 22, halign: "right" },
      10: { cellWidth: 26, halign: "right", fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const pageWidth = orientacao === "landscape" ? 297 : 210;

  // Totals Box
  if (finalY < (orientacao === "landscape" ? 180 : 250)) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, finalY, pageWidth - 28, 16, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...darkColor);
    doc.text(`TOTAL GERAL: ${totalItems} Produtos (${totalUnidades} Unidades)`, 20, finalY + 7);
    doc.text(`Valor Total Custo: ${formatCurrency(totalCusto, moeda)} | Valor Total Venda: ${formatCurrency(totalVenda, moeda)} | Artigos em Alerta: ${itensBaixo}`, 20, finalY + 12);
  }

  const filename = `Relatorio_Estoque_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * =========================================================================
 * 3. REAL VECTOR PDF GENERATOR: RELATÓRIO DE AUDITORIA DE MOVIMENTAÇÕES
 * =========================================================================
 */
export function exportMovimentacoesRelatorioPDF(
  movimentos: MovimentoStock[],
  config: ConfigSistema,
  options: {
    titulo?: string;
    tipoFiltro?: string;
    operador?: string;
    orientacao?: "portrait" | "landscape";
  } = {}
) {
  const orientacao = options.orientacao || "landscape";
  const doc = new jsPDF({
    orientation: orientacao,
    unit: "mm",
    format: "a4",
  });

  const moeda = config.moeda || "AOA";
  const primaryColor: [number, number, number] = [2, 132, 199];
  const darkColor: [number, number, number] = [15, 23, 42];
  const grayText: [number, number, number] = [100, 116, 139];

  // Top header banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, orientacao === "landscape" ? 297 : 210, 5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text(config.nomeClinica || "SISTEMA DE FACTURAÇÃO & ESTOQUE", 14, 15);

  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text(options.titulo || "RELATÓRIO DE AUDITORIA E MOVIMENTAÇÃO DE ESTOQUE", 14, 21);

  const now = new Date();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayText);
  doc.text(`Data: ${now.toLocaleDateString("pt-PT")} ${now.toLocaleTimeString("pt-PT")} | NIF: ${config.nif || "999999999"} | Total Registos: ${movimentos.length}`, 14, 26);

  const tableRows = movimentos.map((m, idx) => [
    (idx + 1).toString(),
    `${m.data} ${m.hora || ""}`,
    m.tipo.toUpperCase(),
    `[${m.produtoCodigo}] ${m.produtoNome}`,
    m.lote || "—",
    m.referenciaDocumento || "—",
    (m.tipo === "entrada" ||
    m.tipo === "devolucao" ||
    (m.tipo === "ajuste" && m.stockAtual >= m.stockAnterior)
      ? "+"
      : "-") + Math.abs(m.quantidade),
    `${m.stockAnterior} ➔ ${m.stockAtual}`,
    m.valorTotal ? formatCurrency(m.valorTotal, moeda) : "—",
    m.motivo,
    m.usuario,
  ]);

  autoTable(doc, {
    startY: 32,
    head: [["#", "Data / Hora", "Tipo", "Artigo", "Lote", "Ref. Doc", "Qtd", "Evolução", "Valor Total", "Motivo / Justificação", "Operador"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: darkColor,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 26 },
      2: { cellWidth: 20, fontStyle: "bold" },
      3: { cellWidth: orientacao === "landscape" ? 60 : 40 },
      4: { cellWidth: 20 },
      5: { cellWidth: 22 },
      6: { cellWidth: 14, halign: "center", fontStyle: "bold" },
      7: { cellWidth: 22, halign: "center" },
      8: { cellWidth: 24, halign: "right" },
      9: { cellWidth: orientacao === "landscape" ? 40 : 25 },
      10: { cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  });

  const filename = `Relatorio_Movimentacoes_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * =========================================================================
 * 4. EXPORT TO CSV / EXCEL FORMAT
 * =========================================================================
 */
export function exportToCSV(filename: string, rows: (string | number)[][], headers: string[]) {
  // UTF-8 BOM for Microsoft Excel Portuguese compatibility
  const BOM = "\uFEFF";
  const csvContent =
    BOM +
    [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(";"),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const str = cell !== undefined && cell !== null ? String(cell) : "";
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(";")
      ),
    ].join("\r\n");

  downloadBlob(csvContent, filename.endsWith(".csv") ? filename : `${filename}.csv`, "text/csv;charset=utf-8;");
}
