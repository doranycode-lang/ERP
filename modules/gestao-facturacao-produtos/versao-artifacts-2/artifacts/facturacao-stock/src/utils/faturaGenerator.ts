import { Fatura, ConfigSistema } from "../types";

export function formatCurrency(amount: number, currency: string = "AOA"): string {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: currency || "AOA",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function validarNifAngola(nif: string | undefined, allowConsumer = false): boolean {
  if (!nif) return allowConsumer;
  const normalized = nif.replace(/[\s.-]/g, "").toUpperCase();
  return /^[0-9]{9,14}$/.test(normalized) || /^[0-9]{9,12}[A-Z]{2,3}$/.test(normalized);
}

export function validarNifEmitente(nif: string | undefined): boolean {
  if (!nif) return false;
  const normalized = nif.replace(/[\s.-]/g, "").toUpperCase();
  return normalized !== "000000000" && validarNifAngola(nif);
}

/**
 * Generate cryptographic hash representation (Standard Angolan AGT format simulation)
 */
export async function gerarHashFaturaAsync(
  fatura: Partial<Fatura>,
  nifEmpresa: string,
  hashAnterior = "0",
): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("A geração do hash criptográfico não está disponível neste ambiente.");
  }
  const rawString = [
    nifEmpresa,
    fatura.clienteNif || "999999999",
    fatura.data || "",
    fatura.total?.toFixed(2) || "0.00",
    fatura.tipoDocumento || "",
    fatura.serie || "",
    fatura.numero || "",
    hashAnterior,
  ].join(";");
  const data = new TextEncoder().encode(rawString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function validarCadeiaHashes(
  faturas: Fatura[],
  nifEmpresa: string,
): Promise<{ valido: boolean; erros: string[] }> {
  const erros: string[] = [];
  const oficiais = faturas
    .filter((f) => f.tipoDocumento !== "pro-forma" && f.codigoHash)
    .slice()
    .sort((a, b) => {
      const aNumber = Number(a.numero.match(/\/(\d+)$/)?.[1] || 0);
      const bNumber = Number(b.numero.match(/\/(\d+)$/)?.[1] || 0);
      return aNumber - bNumber;
    });

  let hashAnterior = "0";
  for (const fatura of oficiais) {
    const esperado = await gerarHashFaturaAsync(fatura, nifEmpresa, hashAnterior);
    if (fatura.hashAnterior !== hashAnterior) {
      erros.push(`${fatura.numero}: hash anterior divergente`);
    }
    if (fatura.codigoHash !== esperado) {
      erros.push(`${fatura.numero}: hash do documento inválido`);
    }
    hashAnterior = fatura.codigoHash || "";
  }

  return { valido: erros.length === 0, erros };
}

export function gerarHashFatura(fatura: Partial<Fatura>, nifEmpresa: string): string {
  throw new Error("Use gerarHashFaturaAsync para gerar hashes SHA-256.");
}

export function generateFaturaHTML(
  fatura: Fatura,
  config: ConfigSistema,
  options: { segundaVia?: boolean; termica?: boolean } = {}
): string {
  const moeda = config.moeda || "AOA";
  const isTermica = options.termica ?? config.formatoImpressaoPadrao === "termica";
  const docTitleMap: Record<string, string> = {
    "factura": "FACTURA",
    "factura-recibo": "FACTURA-RECIBO",
    "factura-global": "FACTURA GLOBAL",
    "pro-forma": "FACTURA PRÓ-FORMA",
    "nota-credito": "NOTA DE CRÉDITO",
    "recibo": "RECIBO DE PAGAMENTO",
  };
  const docTitle = docTitleMap[fatura.tipoDocumento] || "FACTURA";
  const isProForma = fatura.tipoDocumento === "pro-forma";
  const logoMarkup = config.logoDataUrl
    ? `<img src="${config.logoDataUrl}" alt="Logótipo" style="width: 88px; height: 60px; object-fit: contain; margin: 0 auto 5px;" />`
    : "";
  const proFormaNotice = isProForma
    ? '<div class="proforma-notice"><strong>DOCUMENTO NÃO OFICIAL</strong><br>Não serve como comprovativo de factura nem de pagamento.</div>'
    : "";

  const defaultPerfil = config.perfisImpressoras?.find(p => p.padrao) || config.perfisImpressoras?.[0];
  const is58mm = defaultPerfil?.larguraPapel === "58mm";
  const paperWidth = is58mm ? "54mm" : "76mm";

  if (isTermica) {
    // Thermal Receipt Format (80mm or 58mm based on active printer profile)
    return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>${docTitle} - ${fatura.numero}</title>
  <style>
    @page { size: ${is58mm ? "58mm" : "80mm"} auto; margin: 0; }
    body {
      font-family: 'Courier New', Courier, monospace, sans-serif;
      width: ${paperWidth};
      margin: 2mm auto;
      padding: 0;
      color: #000;
      font-size: ${is58mm ? "10px" : "11px"};
      line-height: 1.25;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .double-divider { border-top: 1px solid #000; border-bottom: 1px solid #000; height: 2px; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; font-size: ${is58mm ? "9.5px" : "10.5px"}; }
    th { text-align: left; border-bottom: 1px solid #000; padding: 2px 0; }
    td { padding: 2px 0; vertical-align: top; }
    .badge-via { font-size: 9px; text-align: center; margin-bottom: 4px; }
     .proforma-notice { border: 2px solid #dc2626; color: #b91c1c; padding: 6px; margin: 7px 0; text-align: center; font-weight: bold; font-size: 9px; }
    .qr-box {
      margin: 6px auto;
      width: 70px;
      height: 70px;
      border: 1px solid #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 7.5px;
      font-weight: bold;
      text-align: center;
    }
    @media print {
      body { width: ${paperWidth}; margin: 0 auto; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="text-center">
    ${logoMarkup}
    <div class="font-bold" style="font-size: 13px;">${config.nomeClinica || "EMPRESA COMERCIAL"}</div>
    <div>NIF: ${config.nif || "Consulte a gerência"}</div>
    <div>${config.endereco || ""}</div>
    <div>Tel: ${config.telefone || ""}</div>
    ${config.email ? `<div>${config.email}</div>` : ""}
  </div>

  <div class="divider"></div>

  <div class="text-center font-bold" style="font-size: 12px;">
    ${docTitle} N.º ${fatura.numero}
  </div>
  ${options.segundaVia ? '<div class="badge-via font-bold">*** 2ª VIA - DUPLICADO ***</div>' : '<div class="badge-via">ORIGINAL</div>'}
  ${proFormaNotice}

  <div class="divider"></div>

  <div><strong>Data:</strong> ${fatura.data} ${fatura.horaOperacao || ""}</div>
  <div><strong>Vencimento:</strong> ${fatura.dataVencimento}</div>
  <div><strong>Cliente:</strong> ${fatura.clienteNome}</div>
  <div><strong>NIF/Doc:</strong> ${fatura.clienteNif || "Consumidor Final"}</div>
  ${fatura.clienteEndereco ? `<div><strong>Morada:</strong> ${fatura.clienteEndereco}</div>` : ""}
  ${fatura.documentoOrigem ? `<div><strong>Doc. Origem:</strong> ${fatura.documentoOrigem}</div>` : ""}

  <div class="divider"></div>

  <table>
    <thead>
      <tr>
        <th>DESC</th>
        <th class="text-right">QTD</th>
        <th class="text-right">P.UNIT</th>
        <th class="text-right">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${fatura.linhas.map(l => `
        <tr>
          <td colspan="4" class="font-bold">${l.descricao}</td>
        </tr>
        <tr>
          <td>${l.ivaIsento ? '(Isento)' : `${fatura.ivaTaxa}% IVA`}</td>
          <td class="text-right">${l.quantidade} ${l.unidade || ""}</td>
          <td class="text-right">${formatCurrency(l.precoUnitario, moeda)}</td>
          <td class="text-right font-bold">${formatCurrency(l.quantidade * l.precoUnitario, moeda)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="divider"></div>

  <div style="font-size: 11px;">
    <div style="display:flex; justify-content:space-between;">
      <span>Subtotal s/IVA:</span>
      <span>${formatCurrency(fatura.subtotalSemIva, moeda)}</span>
    </div>
    ${fatura.desconto ? `
    <div style="display:flex; justify-content:space-between;">
      <span>Desconto:</span>
      <span>-${fatura.desconto}%</span>
    </div>` : ""}
    <div style="display:flex; justify-content:space-between;">
      <span>Total IVA (${fatura.ivaTaxa}%):</span>
      <span>${formatCurrency(fatura.totalIva, moeda)}</span>
    </div>
    <div class="double-divider"></div>
    <div style="display:flex; justify-content:space-between; font-size: 13px; font-weight: bold;">
      <span>TOTAL:</span>
      <span>${formatCurrency(fatura.total, moeda)}</span>
    </div>
  </div>

  <div class="divider"></div>

  <div><strong>Forma Pagamento:</strong> ${fatura.formaPagamento || "Não especificado"}</div>
  <div><strong>Estado:</strong> ${fatura.estado.toUpperCase()}</div>
  <div><strong>Operador:</strong> ${fatura.emitidoPor || "Sistema"}</div>

  ${fatura.observacoes ? `<div class="divider"></div><div><strong>Obs:</strong> ${fatura.observacoes}</div>` : ""}

  <div class="divider"></div>

  <div class="text-center" style="font-size: 9px; margin-top: 8px;">
     ${isProForma ? '<div style="color:#b91c1c; font-weight:bold;">DOCUMENTO NÃO OFICIAL — NÃO SERVE COMO COMPROVATIVO DE FACTURA</div>' : `<div>${fatura.codigoHash || "Hash não registado"}</div><div style="margin-top: 4px;">Os bens/serviços foram colocados à disposição do adquirente na data do documento.</div>`}
    <div style="margin-top: 4px; font-weight: bold;">${defaultPerfil?.rodapePersonalizado || config.mensagemRodape || "Obrigado pela sua preferência!"}</div>
  </div>
</body>
</html>`;
  }

  // Standard A4 Format
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>${docTitle} - ${fatura.numero}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #1e293b;
      background: #fff;
      font-size: 13px;
      line-height: 1.4;
    }
     .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #00AEEF; padding-bottom: 16px; }
     .company-logo { width: 112px; height: 82px; object-fit: contain; object-position: left center; margin-bottom: 8px; }
    .company-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    .company-details { font-size: 12px; color: #475569; }
    .doc-badge {
      text-align: right;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 18px;
    }
    .doc-type { font-size: 18px; font-weight: 800; color: #00AEEF; margin-bottom: 2px; }
    .doc-number { font-size: 14px; font-weight: 700; color: #0f172a; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .box-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
    .client-name { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead th { background: #00AEEF; color: #fff; text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    thead th:last-child, thead th:nth-child(3), thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
    tbody td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    tbody td:last-child, tbody td:nth-child(3), tbody td:nth-child(4), tbody td:nth-child(5) { text-align: right; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .totals-wrapper { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10px; }
    .bank-info { max-width: 50%; font-size: 11px; color: #475569; }
    .totals-table { width: 280px; border-collapse: collapse; }
    .totals-table td { padding: 5px 8px; font-size: 12px; }
    .totals-table tr.grand-total { border-top: 2px solid #00AEEF; font-size: 15px; font-weight: 800; color: #00AEEF; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; text-align: center; }
    .watermark {
      position: absolute;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 60px;
      font-weight: 900;
      color: rgba(239, 68, 68, 0.08);
      pointer-events: none;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .proforma-notice { border: 2px solid #dc2626; background: #fef2f2; color: #b91c1c; padding: 10px 14px; margin: -8px 0 20px; text-align: center; font-weight: 800; font-size: 12px; letter-spacing: .2px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  ${fatura.estado === "anulada" ? '<div class="watermark">ANULADA</div>' : isProForma ? '<div class="watermark">NÃO OFICIAL</div>' : options.segundaVia ? '<div class="watermark">2ª VIA</div>' : ""}

  <div class="header">
    <div>
      ${config.logoDataUrl ? `<img src="${config.logoDataUrl}" alt="Logótipo" class="company-logo" />` : ""}
      <div class="company-title">${config.nomeClinica || "EMPRESA COMERCIAL"}</div>
      <div class="company-details">
        <div><strong>NIF:</strong> ${config.nif || "—"}</div>
        <div>${config.endereco || ""}</div>
        <div><strong>Tel:</strong> ${config.telefone || "—"} | <strong>Email:</strong> ${config.email || "—"}</div>
        ${config.regimeIva ? `<div><strong>Regime Fiscal:</strong> ${config.regimeIva}</div>` : ""}
      </div>
    </div>
    <div class="doc-badge">
      <div class="doc-type">${docTitle}</div>
      <div class="doc-number">${fatura.numero}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
        ${options.segundaVia ? '<strong>2ª Via</strong>' : 'Original'}
      </div>
    </div>
  </div>
  ${proFormaNotice}

  <div class="grid-2">
    <div class="box">
      <div class="box-title">Dados do Cliente</div>
      <div class="client-name">${fatura.clienteNome}</div>
      <div><strong>NIF / BI:</strong> ${fatura.clienteNif || "Consumidor Final"}</div>
      ${fatura.clienteEndereco ? `<div><strong>Morada:</strong> ${fatura.clienteEndereco}</div>` : ""}
      ${fatura.clienteTelefone ? `<div><strong>Telefone:</strong> ${fatura.clienteTelefone}</div>` : ""}
      ${fatura.clienteEmail ? `<div><strong>Email:</strong> ${fatura.clienteEmail}</div>` : ""}
    </div>
    <div class="box">
      <div class="box-title">Detalhes do Documento</div>
      <div><strong>Data de Emissão:</strong> ${fatura.data} ${fatura.horaOperacao || ""}</div>
      <div><strong>Data de Vencimento:</strong> ${fatura.dataVencimento}</div>
      <div><strong>Forma de Pagamento:</strong> ${fatura.formaPagamento || "A combinar"}</div>
      <div><strong>Estado:</strong> <span style="font-weight:700; text-transform:uppercase;">${fatura.estado}</span></div>
      ${fatura.documentoOrigem ? `<div><strong>Documento Origem:</strong> ${fatura.documentoOrigem}</div>` : ""}
      ${fatura.facturaPremiada ? `<div><strong>Factura Premiada AGT:</strong> Sim ✓</div>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 45%;">Descrição / Item</th>
        <th style="width: 12%; text-align: center;">IVA</th>
        <th style="width: 13%;">Qtd</th>
        <th style="width: 15%;">Preço Unit.</th>
        <th style="width: 15%;">Total Líquido</th>
      </tr>
    </thead>
    <tbody>
      ${fatura.linhas.map(l => `
        <tr>
          <td>
            <strong>${l.descricao}</strong>
            ${l.codigo ? `<div style="font-size:10px; color:#64748b;">Ref: ${l.codigo}</div>` : ""}
            ${l.lote ? `<div style="font-size:10px; color:#0284c7;">Lote: ${l.lote}${l.dataValidade ? ` (Val: ${l.dataValidade})` : ""}</div>` : ""}
          </td>
          <td style="text-align: center;">${l.ivaIsento ? '<span style="color:#64748b;">Isento (M04)</span>' : `${fatura.ivaTaxa}%`}</td>
          <td>${l.quantidade} ${l.unidade || "un"}</td>
          <td>${formatCurrency(l.precoUnitario, moeda)}</td>
          <td><strong>${formatCurrency(l.quantidade * l.precoUnitario, moeda)}</strong></td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="totals-wrapper">
    <div class="bank-info">
      ${config.bancoNome || config.bancoIban ? `
        <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">Coordenadas Bancárias:</div>
        ${config.bancoNome ? `<div><strong>Banco:</strong> ${config.bancoNome}</div>` : ""}
        ${config.bancoIban ? `<div><strong>IBAN:</strong> ${config.bancoIban}</div>` : ""}
        ${config.bancoSwift ? `<div><strong>SWIFT/BIC:</strong> ${config.bancoSwift}</div>` : ""}
      ` : ""}
      ${fatura.observacoes ? `
        <div style="margin-top: 8px;">
          <div style="font-weight: 700; color: #0f172a;">Observações:</div>
          <div>${fatura.observacoes}</div>
        </div>
      ` : ""}
    </div>

    <table class="totals-table">
      <tr>
        <td>Subtotal sem IVA:</td>
        <td style="text-align: right; font-weight: 600;">${formatCurrency(fatura.subtotalSemIva, moeda)}</td>
      </tr>
      ${fatura.desconto ? `
      <tr>
        <td>Desconto (${fatura.desconto}%):</td>
        <td style="text-align: right; color: #16a34a;">-${formatCurrency((fatura.subtotalSemIva * (fatura.desconto / 100)), moeda)}</td>
      </tr>` : ""}
      <tr>
        <td>Total de IVA (${fatura.ivaTaxa}%):</td>
        <td style="text-align: right; font-weight: 600;">${formatCurrency(fatura.totalIva, moeda)}</td>
      </tr>
      <tr class="grand-total">
        <td>TOTAL A PAGAR:</td>
        <td style="text-align: right;">${formatCurrency(fatura.total, moeda)}</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <div style="font-family: monospace; font-size: 11px; margin-bottom: 4px; color: #334155;">
      ${isProForma ? "DOCUMENTO NÃO OFICIAL — NÃO SERVE COMO COMPROVATIVO DE FACTURA" : fatura.codigoHash || "Hash SHA-256 não disponível"}
    </div>
    <div>Os bens/serviços foram colocados à disposição do adquirente na data e local do documento.</div>
      <div>Documento processado por computador | Software de facturação</div>
  </div>
</body>
</html>`;
}

export function downloadFatura(htmlContent: string, fileName: string) {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  } else {
    // Fallback to blob download
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Factura_${fileName.replace(/[^a-zA-Z0-9_-]/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
