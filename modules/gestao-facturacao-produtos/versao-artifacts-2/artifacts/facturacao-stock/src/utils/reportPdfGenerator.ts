import { Produto, MovimentoStock, ConfigSistema } from "../types";
import { formatCurrency } from "./faturaGenerator";

export interface EstoqueReportOptions {
  titulo?: string;
  categoria?: string;
  apenasStockBaixo?: boolean;
  incluirValores?: boolean;
  operador?: string;
  dataEmissao?: string;
  orientacao?: "portrait" | "landscape";
}

export interface MovimentacoesReportOptions {
  titulo?: string;
  tipoFiltro?: string;
  dataFiltro?: string;
  termoBusca?: string;
  operador?: string;
  dataEmissao?: string;
  orientacao?: "portrait" | "landscape";
}

/**
 * Generates formatted HTML for printable/downloadable Stock Inventory PDF Report
 */
export function generateEstoqueReportHTML(
  produtos: Produto[],
  config: ConfigSistema,
  options: EstoqueReportOptions = {}
): string {
  const moeda = config.moeda || "AOA";
  const orientacao = options.orientacao || "landscape";
  const now = new Date();
  const dataFormatada = options.dataEmissao || now.toLocaleDateString("pt-PT") + " às " + now.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  const operador = options.operador || config.nomeClinica ? `${config.nomeClinica} - Sistema` : "Operador do Sistema";

  // Aggregates
  let totalItems = 0;
  let totalUnidades = 0;
  let totalCusto = 0;
  let totalVenda = 0;
  let itensBaixo = 0;
  let itensEsgotados = 0;

  produtos.forEach((p) => {
    totalItems++;
    totalUnidades += p.stock;
    totalCusto += p.stock * (p.precoCusto || 0);
    totalVenda += p.stock * p.preco;
    if (p.stock <= 0) {
      itensEsgotados++;
    } else if (p.stockMinimo > 0 && p.stock <= p.stockMinimo) {
      itensBaixo++;
    }
  });

  const margemBruta = totalVenda - totalCusto;
  const margemPerc = totalCusto > 0 ? ((margemBruta / totalCusto) * 100).toFixed(1) : "0.0";

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>${options.titulo || "Relatório de Estoque e Inventário"} - ${config.nomeClinica || "Empresa"}</title>
  <style>
    @page {
      size: A4 ${orientacao};
      margin: 12mm 10mm 15mm 10mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 10px;
      font-size: 11px;
      line-height: 1.4;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .company-title {
      font-size: 18px;
      font-weight: 800;
      color: #0369a1;
      letter-spacing: -0.5px;
      margin-bottom: 2px;
    }
    .company-sub {
      color: #475569;
      font-size: 10.5px;
    }
    .report-title-box {
      text-align: right;
    }
    .report-badge {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 800;
      font-size: 13px;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #bae6fd;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .meta-line {
      font-size: 10px;
      color: #64748b;
    }
    
    /* KPI Summary Cards */
    .kpi-grid {
      display: table;
      width: 100%;
      margin-bottom: 16px;
      border-spacing: 6px 0;
      table-layout: fixed;
    }
    .kpi-card {
      display: table-cell;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      text-align: center;
    }
    .kpi-label {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi-val.highlight {
      color: #0284c7;
    }
    .kpi-val.success {
      color: #16a34a;
    }
    .kpi-val.warning {
      color: #ea580c;
    }

    /* Filter Tag bar */
    .filter-summary {
      background: #f1f5f9;
      border-left: 3px solid #0284c7;
      padding: 6px 10px;
      font-size: 10px;
      color: #334155;
      margin-bottom: 12px;
      border-radius: 0 6px 6px 0;
    }

    /* Data Table */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    table.data-table th {
      background: #f8fafc;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 2px solid #94a3b8;
      white-space: nowrap;
    }
    table.data-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    table.data-table tr:nth-child(even) td {
      background: #fafafa;
    }
    table.data-table tr.row-low-stock td {
      background: #fffbeb;
    }
    table.data-table tr.row-out-of-stock td {
      background: #fef2f2;
    }
    
    .status-pill {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 8.5px;
      text-transform: uppercase;
    }
    .status-ok { background: #dcfce7; color: #15803d; }
    .status-low { background: #fef3c7; color: #b45309; }
    .status-out { background: #fee2e2; color: #b91c1c; }

    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

    /* Totals Footer row */
    table.data-table tfoot td {
      background: #f1f5f9;
      font-weight: 800;
      border-top: 2px solid #94a3b8;
      border-bottom: 2px solid #64748b;
      padding: 8px;
    }

    /* Signatures & Footer */
    .footer-section {
      margin-top: 25px;
      page-break-inside: avoid;
    }
    .signature-grid {
      display: table;
      width: 100%;
      margin-top: 25px;
      margin-bottom: 20px;
    }
    .signature-box {
      display: table-cell;
      width: 48%;
      text-align: center;
      padding: 0 15px;
    }
    .signature-line {
      border-top: 1px solid #94a3b8;
      margin-top: 35px;
      padding-top: 4px;
      font-size: 10px;
      font-weight: 700;
      color: #334155;
    }
    .doc-meta-footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 8px;
      font-size: 9px;
      color: #64748b;
      display: table;
      width: 100%;
    }
    .no-print {
      margin-bottom: 12px;
      background: #0284c7;
      color: #fff;
      padding: 10px 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn-print {
      background: #ffffff;
      color: #0284c7;
      border: none;
      padding: 6px 16px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
    }

    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      table.data-table tr {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>

  <div class="no-print">
    <div>
      <strong>Visualização de Impressão (A4 ${orientacao === "landscape" ? "Horizontal" : "Vertical"})</strong>
      <span style="opacity: 0.85; margin-left: 8px; font-size: 11px;">Prima o botão ao lado para salvar como PDF ou imprimir.</span>
    </div>
    <button class="btn-print" onclick="window.print()">📥 Imprimir / Guardar em PDF</button>
  </div>

  <table class="header-table">
    <tr>
      <td style="vertical-align: top; width: 60%;">
        <div class="company-title">${config.nomeClinica || "EMPRESA COMERCIAL"}</div>
        <div class="company-sub"><strong>NIF:</strong> ${config.nif || "Consulte a gerência"} | <strong>Tel:</strong> ${config.telefone || "N/D"}</div>
        <div class="company-sub">${config.endereco || ""}${config.email ? ` | ${config.email}` : ""}</div>
      </td>
      <td class="report-title-box" style="vertical-align: top; width: 40%;">
        <div class="report-badge">${options.titulo || "RELATÓRIO DE INVENTÁRIO"}</div>
        <div class="meta-line"><strong>Data/Hora Emissão:</strong> ${dataFormatada}</div>
        <div class="meta-line"><strong>Emitido por:</strong> ${operador}</div>
        <div class="meta-line"><strong>Registos Listados:</strong> ${produtos.length} artigos</div>
      </td>
    </tr>
  </table>

  <!-- KPI Cards -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Artigos (SKUs)</div>
      <div class="kpi-val highlight">${totalItems}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Unidades em Armazém</div>
      <div class="kpi-val">${totalUnidades}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Valorização a Custo</div>
      <div class="kpi-val font-mono">${formatCurrency(totalCusto, moeda)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Valorização a Venda</div>
      <div class="kpi-val font-mono success">${formatCurrency(totalVenda, moeda)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Margem Bruta Teórica</div>
      <div class="kpi-val font-mono">${formatCurrency(margemBruta, moeda)} <span style="font-size: 10px; color:#16a34a;">(+${margemPerc}%)</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Alertas de Reposição</div>
      <div class="kpi-val warning">${itensBaixo + itensEsgotados} <span style="font-size: 10px; color: #b91c1c;">(${itensEsgotados} esgot.)</span></div>
    </div>
  </div>

  <!-- Filter summary description -->
  <div class="filter-summary">
    <strong>Parâmetros do Relatório:</strong> Categoria: <strong>${options.categoria || "Todas as Categorias"}</strong> | Filtro de Stock: <strong>${options.apenasStockBaixo ? "Apenas Artigos com Stock Crítico/Baixo" : "Todos os Artigos Activos"}</strong> | Moeda: <strong>${moeda}</strong>
  </div>

  <!-- Main Table -->
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th>Código</th>
        <th>Código Barras</th>
        <th>Designação do Artigo</th>
        <th>Categoria</th>
        <th>Lote / Validade</th>
        <th>Localização</th>
        <th class="text-right">Stock Qtd</th>
        <th class="text-center">Mínimo</th>
        <th class="text-center">Estado</th>
        <th class="text-right">P. Custo</th>
        <th class="text-right">P. Venda</th>
        <th class="text-right">Total Custo</th>
        <th class="text-right">Total Venda</th>
      </tr>
    </thead>
    <tbody>
      ${produtos.length === 0 ? `
        <tr>
          <td colspan="14" style="text-align:center; padding: 25px; color:#64748b;">
            Nenhum produto encontrado com os filtros selecionados.
          </td>
        </tr>
      ` : produtos.map((p, idx) => {
        const isOutOfStock = p.stock <= 0;
        const isLowStock = p.stockMinimo > 0 && p.stock <= p.stockMinimo;
        const rowClass = isOutOfStock ? "row-out-of-stock" : (isLowStock ? "row-low-stock" : "");
        const statusBadge = isOutOfStock
          ? '<span class="status-pill status-out">Esgotado</span>'
          : (isLowStock ? '<span class="status-pill status-low">Baixo</span>' : '<span class="status-pill status-ok">Normal</span>');

        const itemTotalCusto = p.stock * (p.precoCusto || 0);
        const itemTotalVenda = p.stock * p.preco;

        return `
          <tr class="${rowClass}">
            <td style="color:#64748b;">${idx + 1}</td>
            <td class="font-mono font-bold" style="color:#0369a1;">${p.codigo}</td>
            <td class="font-mono" style="color:#64748b; font-size:9.5px;">${p.codigoBarras || "—"}</td>
            <td>
              <strong>${p.nome}</strong>
              ${p.descricao ? `<div style="font-size:9px; color:#64748b;">${p.descricao}</div>` : ""}
            </td>
            <td>${p.categoria || "Geral"}</td>
            <td>
              ${p.loteAtual ? `<span class="font-mono font-bold">${p.loteAtual}</span>` : "—"}
              ${p.dataValidade ? `<div style="font-size:9px; color:#475569;">Val: ${p.dataValidade}</div>` : ""}
            </td>
            <td>${p.localizacao || "Geral"}</td>
            <td class="text-right font-bold" style="font-size: 11px;">${p.stock} <span style="font-size:9px; font-weight:normal; color:#64748b;">${p.unidadeMedida || "un"}</span></td>
            <td class="text-center font-mono">${p.stockMinimo}</td>
            <td class="text-center">${statusBadge}</td>
            <td class="text-right font-mono">${formatCurrency(p.precoCusto || 0, moeda)}</td>
            <td class="text-right font-mono font-bold">${formatCurrency(p.preco, moeda)}</td>
            <td class="text-right font-mono" style="color:#475569;">${formatCurrency(itemTotalCusto, moeda)}</td>
            <td class="text-right font-mono font-bold" style="color:#0f172a;">${formatCurrency(itemTotalVenda, moeda)}</td>
          </tr>
        `;
      }).join("")}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="7" style="text-align: right; text-transform: uppercase;">Totais Gerais (${produtos.length} Artigos):</td>
        <td class="text-right font-mono" style="font-size: 12px; color:#0284c7;">${totalUnidades}</td>
        <td colspan="2"></td>
        <td colspan="2" class="text-right" style="font-size:9.5px; color:#475569;">Subtotais:</td>
        <td class="text-right font-mono" style="font-size: 11px;">${formatCurrency(totalCusto, moeda)}</td>
        <td class="text-right font-mono" style="font-size: 12px; color:#16a34a;">${formatCurrency(totalVenda, moeda)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Signature & Verification -->
  <div class="footer-section">
    <div class="signature-grid">
      <div class="signature-box">
        <div class="signature-line">
          Responsável pelo Inventário e Armazém<br>
          <span style="font-size:8.5px; font-weight:normal; color:#64748b;">Assinatura e Data</span>
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-line">
          Direcção Financeira / Gerência Comercial<br>
          <span style="font-size:8.5px; font-weight:normal; color:#64748b;">Visto / Carimbo Oficial</span>
        </div>
      </div>
    </div>

    <div class="doc-meta-footer">
      <div style="display:table-cell; width:60%;">
        Documento de controlo interno gerado automaticamente pelo Sistema de Gestão e Facturação Certificado.<br>
        Relatório emitido em conformidade com as boas práticas de rastreabilidade de inventário.
      </div>
      <div style="display:table-cell; width:40%; text-align:right;">
        <strong>Identificador de Auditoria:</strong> INV-${now.getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}<br>
        Página 1 de 1
      </div>
    </div>
  </div>

</body>
</html>`;
}

/**
 * Generates formatted HTML for printable/downloadable Stock Movements History PDF Report
 */
export function generateMovimentacoesReportHTML(
  movimentos: MovimentoStock[],
  config: ConfigSistema,
  options: MovimentacoesReportOptions = {}
): string {
  const moeda = config.moeda || "AOA";
  const orientacao = options.orientacao || "landscape";
  const now = new Date();
  const dataFormatada = options.dataEmissao || now.toLocaleDateString("pt-PT") + " às " + now.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  const operador = options.operador || config.nomeClinica ? `${config.nomeClinica} - Auditoria` : "Auditor de Estoque";

  // Movement Statistics
  let totalEntradasQtd = 0;
  let totalSaidasQtd = 0;
  let totalValorSaidas = 0;
  let totalPerdasQtd = 0;
  let totalAjustesCount = 0;

  movimentos.forEach((m) => {
    if (m.tipo === "entrada" || m.tipo === "devolucao") {
      totalEntradasQtd += m.quantidade;
    } else if (m.tipo === "saida") {
      totalSaidasQtd += m.quantidade;
      totalValorSaidas += m.valorTotal || 0;
    } else if (m.tipo === "perda" || m.tipo === "validade") {
      totalPerdasQtd += m.quantidade;
    } else if (m.tipo === "ajuste") {
      totalAjustesCount++;
    }
  });

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>${options.titulo || "Relatório de Movimentações de Estoque"} - ${config.nomeClinica || "Empresa"}</title>
  <style>
    @page {
      size: A4 ${orientacao};
      margin: 12mm 10mm 15mm 10mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 10px;
      font-size: 11px;
      line-height: 1.4;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .company-title {
      font-size: 18px;
      font-weight: 800;
      color: #0369a1;
      letter-spacing: -0.5px;
      margin-bottom: 2px;
    }
    .company-sub {
      color: #475569;
      font-size: 10.5px;
    }
    .report-title-box {
      text-align: right;
    }
    .report-badge {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 800;
      font-size: 13px;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #bae6fd;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .meta-line {
      font-size: 10px;
      color: #64748b;
    }

    /* KPI Summary Cards */
    .kpi-grid {
      display: table;
      width: 100%;
      margin-bottom: 16px;
      border-spacing: 6px 0;
      table-layout: fixed;
    }
    .kpi-card {
      display: table-cell;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      text-align: center;
    }
    .kpi-label {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi-val.highlight { color: #0284c7; }
    .kpi-val.success { color: #16a34a; }
    .kpi-val.danger { color: #dc2626; }
    .kpi-val.warning { color: #d97706; }

    /* Filter Summary */
    .filter-summary {
      background: #f1f5f9;
      border-left: 3px solid #0284c7;
      padding: 6px 10px;
      font-size: 10px;
      color: #334155;
      margin-bottom: 12px;
      border-radius: 0 6px 6px 0;
    }

    /* Data Table */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    table.data-table th {
      background: #f8fafc;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 2px solid #94a3b8;
      white-space: nowrap;
    }
    table.data-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    table.data-table tr:nth-child(even) td {
      background: #fafafa;
    }

    .badge-mov {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .badge-entrada { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .badge-saida { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-ajuste { background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
    .badge-perda { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .badge-validade { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge-devolucao { background: #ccfbf1; color: #115e59; border: 1px solid #99f6e4; }

    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

    /* Totals Footer */
    table.data-table tfoot td {
      background: #f1f5f9;
      font-weight: 800;
      border-top: 2px solid #94a3b8;
      border-bottom: 2px solid #64748b;
      padding: 8px;
    }

    /* Signatures */
    .footer-section {
      margin-top: 25px;
      page-break-inside: avoid;
    }
    .signature-grid {
      display: table;
      width: 100%;
      margin-top: 25px;
      margin-bottom: 20px;
    }
    .signature-box {
      display: table-cell;
      width: 48%;
      text-align: center;
      padding: 0 15px;
    }
    .signature-line {
      border-top: 1px solid #94a3b8;
      margin-top: 35px;
      padding-top: 4px;
      font-size: 10px;
      font-weight: 700;
      color: #334155;
    }
    .doc-meta-footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 8px;
      font-size: 9px;
      color: #64748b;
      display: table;
      width: 100%;
    }

    .no-print {
      margin-bottom: 12px;
      background: #0284c7;
      color: #fff;
      padding: 10px 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn-print {
      background: #ffffff;
      color: #0284c7;
      border: none;
      padding: 6px 16px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
    }

    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      table.data-table tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <div class="no-print">
    <div>
      <strong>Visualização de Impressão (A4 ${orientacao === "landscape" ? "Horizontal" : "Vertical"})</strong>
      <span style="opacity: 0.85; margin-left: 8px; font-size: 11px;">Prima o botão ao lado para salvar como PDF ou imprimir.</span>
    </div>
    <button class="btn-print" onclick="window.print()">📥 Imprimir / Guardar em PDF</button>
  </div>

  <table class="header-table">
    <tr>
      <td style="vertical-align: top; width: 60%;">
        <div class="company-title">${config.nomeClinica || "EMPRESA COMERCIAL"}</div>
        <div class="company-sub"><strong>NIF:</strong> ${config.nif || "Consulte a gerência"} | <strong>Tel:</strong> ${config.telefone || "N/D"}</div>
        <div class="company-sub">${config.endereco || ""}${config.email ? ` | ${config.email}` : ""}</div>
      </td>
      <td class="report-title-box" style="vertical-align: top; width: 40%;">
        <div class="report-badge">${options.titulo || "AUDITORIA DE MOVIMENTAÇÕES"}</div>
        <div class="meta-line"><strong>Data/Hora Emissão:</strong> ${dataFormatada}</div>
        <div class="meta-line"><strong>Operador/Auditor:</strong> ${operador}</div>
        <div class="meta-line"><strong>Total de Registos:</strong> ${movimentos.length} movimentos</div>
      </td>
    </tr>
  </table>

  <!-- KPI Cards -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Movimentos Listados</div>
      <div class="kpi-val highlight">${movimentos.length}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Entradas (Compras)</div>
      <div class="kpi-val success">+${totalEntradasQtd} un</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Saídas (Vendas)</div>
      <div class="kpi-val font-mono" style="color: #2563eb;">-${totalSaidasQtd} un</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Volume Financeiro Saídas</div>
      <div class="kpi-val font-mono success">${formatCurrency(totalValorSaidas, moeda)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Perdas / Validades</div>
      <div class="kpi-val danger">${totalPerdasQtd} un</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Ajustes Manuais</div>
      <div class="kpi-val warning">${totalAjustesCount} ops</div>
    </div>
  </div>

  <!-- Filter Summary -->
  <div class="filter-summary">
    <strong>Parâmetros de Auditoria:</strong> Tipo de Movimento: <strong>${options.tipoFiltro ? options.tipoFiltro.toUpperCase() : "TODOS OS TIPOS"}</strong> | Data Filtrada: <strong>${options.dataFiltro || "Todo o Histórico"}</strong> ${options.termoBusca ? `| Pesquisa: "<strong>${options.termoBusca}</strong>"` : ""}
  </div>

  <!-- Data Table -->
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25px;">#</th>
        <th>Data & Hora</th>
        <th>Tipo Operação</th>
        <th>Cód. Produto</th>
        <th>Designação do Artigo</th>
        <th>Lote</th>
        <th>Doc. Ref.</th>
        <th class="text-center">Qtd</th>
        <th class="text-center">Stock Antes ➔ Depois</th>
        <th class="text-right">Valor Total</th>
        <th>Motivo / Descrição</th>
        <th>Operador</th>
      </tr>
    </thead>
    <tbody>
      ${movimentos.length === 0 ? `
        <tr>
          <td colspan="12" style="text-align:center; padding: 25px; color:#64748b;">
            Nenhum movimento registrado com os filtros selecionados.
          </td>
        </tr>
      ` : movimentos.map((m, idx) => {
        let badgeClass = "badge-entrada";
        let labelTipo = "Entrada";
        let sinalQtd = "+";

        if (m.tipo === "saida") {
          badgeClass = "badge-saida";
          labelTipo = "Saída (Venda)";
          sinalQtd = "-";
        } else if (m.tipo === "ajuste") {
          badgeClass = "badge-ajuste";
          labelTipo = "Ajuste";
          sinalQtd = m.quantidade >= 0 ? "+" : "";
        } else if (m.tipo === "perda") {
          badgeClass = "badge-perda";
          labelTipo = "Quebra / Perda";
          sinalQtd = "-";
        } else if (m.tipo === "validade") {
          badgeClass = "badge-validade";
          labelTipo = "Validade Exp.";
          sinalQtd = "-";
        } else if (m.tipo === "devolucao") {
          badgeClass = "badge-devolucao";
          labelTipo = "Devolução";
          sinalQtd = "+";
        }

        return `
          <tr>
            <td style="color:#64748b;">${idx + 1}</td>
            <td style="white-space:nowrap;">
              <strong>${m.data}</strong>
              <div style="font-size:9px; color:#64748b;">${m.hora}</div>
            </td>
            <td>
              <span class="badge-mov ${badgeClass}">${labelTipo}</span>
            </td>
            <td class="font-mono font-bold" style="color:#0369a1;">${m.produtoCodigo}</td>
            <td><strong>${m.produtoNome}</strong></td>
            <td class="font-mono">${m.lote || "—"}</td>
            <td>
              ${m.referenciaDocumento ? `<span class="font-mono font-bold" style="background:#e2e8f0; padding:1px 4px; border-radius:3px; font-size:9px;">${m.referenciaDocumento}</span>` : "—"}
            </td>
            <td class="text-center font-bold font-mono" style="font-size: 11px; ${sinalQtd === '+' ? 'color:#15803d;' : 'color:#b91c1c;'}">
              ${sinalQtd}${Math.abs(m.quantidade)}
            </td>
            <td class="text-center font-mono" style="font-size: 9.5px; color:#475569;">
              ${m.stockAnterior} ➔ <strong style="color:#0f172a;">${m.stockAtual}</strong>
            </td>
            <td class="text-right font-mono font-bold">
              ${m.valorTotal ? formatCurrency(m.valorTotal, moeda) : "—"}
            </td>
            <td style="font-size: 9.5px; color:#334155; max-width: 160px;">${m.motivo}</td>
            <td style="font-size: 9.5px; color:#64748b; white-space:nowrap;">${m.usuario}</td>
          </tr>
        `;
      }).join("")}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="7" style="text-align: right; text-transform: uppercase;">Totalização do Período (${movimentos.length} Registos):</td>
        <td class="text-center font-mono font-bold" style="color:#0284c7;">
          +${totalEntradasQtd} / -${totalSaidasQtd}
        </td>
        <td colspan="1"></td>
        <td class="text-right font-mono" style="font-size: 11px; color:#16a34a;">
          ${formatCurrency(totalValorSaidas, moeda)}
        </td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>

  <!-- Signature Section -->
  <div class="footer-section">
    <div class="signature-grid">
      <div class="signature-box">
        <div class="signature-line">
          Encarregado de Estoque / Auditor<br>
          <span style="font-size:8.5px; font-weight:normal; color:#64748b;">Assinatura</span>
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-line">
          Gerência Geral / Fiscalização<br>
          <span style="font-size:8.5px; font-weight:normal; color:#64748b;">Visto de Conformidade</span>
        </div>
      </div>
    </div>

    <div class="doc-meta-footer">
      <div style="display:table-cell; width:60%;">
        Registo de auditoria imutável gerado pelo software de facturação e estoque.
      </div>
      <div style="display:table-cell; width:40%; text-align:right;">
        <strong>Hash de Rastreio:</strong> MOV-${now.getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}<br>
        Página 1 de 1
      </div>
    </div>
  </div>

</body>
</html>`;
}

/**
 * Triggers instant printing / PDF download via popup window or fallback blob
 */
export function printOrDownloadReport(htmlContent: string, fileName: string) {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  } else {
    // Fallback: download as formatted standalone HTML file
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(/[^a-zA-Z0-9_-]/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Downloads report as an autonomous HTML file that opens and prints cleanly on any device
 */
export function downloadReportFile(htmlContent: string, fileName: string) {
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName.replace(/[^a-zA-Z0-9_-]/g, "_")}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
