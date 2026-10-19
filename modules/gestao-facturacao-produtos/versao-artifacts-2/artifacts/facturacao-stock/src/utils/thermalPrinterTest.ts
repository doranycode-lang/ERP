import { PerfilImpressoraTermica, ConfiguracaoFiscalAGT, ConfigSistema } from "../types";

/**
 * Generates formatted HTML for a realistic thermal ticket test print (80mm or 58mm)
 */
export function generateThermalTestTicketHTML(
  perfil: PerfilImpressoraTermica,
  config: ConfigSistema,
  fiscalConfig?: ConfiguracaoFiscalAGT
): string {
  const is58mm = perfil.larguraPapel === "58mm";
  const paperWidthPx = is58mm ? "240px" : "330px";
  const now = new Date();
  const dataFormatada = now.toLocaleDateString("pt-PT") + " " + now.toLocaleTimeString("pt-PT");
  const certNumero = fiscalConfig?.softwareCertificadoNumero || "PENDENTE_AGT";
  const terminal = fiscalConfig?.terminalCaixa || "POS-01";
  const moeda = config.moeda || "AOA";

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Teste de Impressão Térmica - ${perfil.nome}</title>
  <style>
    @page {
      margin: 0;
      size: ${perfil.larguraPapel === "58mm" ? "58mm" : "80mm"} auto;
    }
    *, *:before, *:after { box-sizing: border-box; }
    body {
      font-family: "Courier New", Courier, monospace, ui-monospace;
      font-size: ${is58mm ? "10px" : "11.5px"};
      line-height: 1.25;
      color: #000;
      background: #fff;
      margin: 0 auto;
      padding: 10px 8px;
      width: ${paperWidthPx};
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .double-divider {
      border-top: 2px solid #000;
      margin: 6px 0;
    }
    .grid-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .esc-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-weight: bold;
      padding: 1px 4px;
      font-size: 8.5px;
      margin-bottom: 4px;
    }
    .cut-line {
      border-top: 1px dotted #888;
      margin: 12px 0 6px 0;
      position: relative;
      text-align: center;
    }
    .cut-text {
      background: #fff;
      padding: 0 4px;
      font-size: 8px;
      color: #555;
      position: relative;
      top: -6px;
    }
    .qr-box {
      margin: 8px auto;
      width: 90px;
      height: 90px;
      border: 2px solid #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: bold;
      text-align: center;
      background: #fafafa;
    }
    .no-print {
      margin-bottom: 12px;
      background: #0f172a;
      color: #fff;
      padding: 8px;
      border-radius: 6px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
    }
    .btn-print {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 5px 12px;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 5px;
      font-size: 11px;
    }
    @media print {
      body { width: 100%; padding: 0 4px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <div class="no-print">
    <div><strong>Impressão Térmica ESC/POS</strong></div>
    <div style="font-size: 9.5px; opacity: 0.8; margin-bottom: 4px;">Perfil: ${perfil.nome} (${perfil.larguraPapel})</div>
    <button class="btn-print" onclick="window.print()">Imprimir na Térmica</button>
  </div>

  <div class="text-center">
    <div class="esc-badge">[TESTE DE COMUNICAÇÃO ESC/POS]</div>
    <div class="font-bold" style="font-size: ${is58mm ? "12px" : "14px"};">${config.nomeClinica || "EMPRESA COMERCIAL LDA"}</div>
    <div>NIF: ${config.nif || "5417082910"}</div>
    <div>${config.endereco || "Luanda - Angola"}</div>
    <div>Tel: ${config.telefone || "923 456 789"}</div>
  </div>

  <div class="double-divider"></div>

  <div class="text-center font-bold" style="font-size: 12px;">
    === PAGINA DE TESTE FISCAL ===
  </div>

  <div class="divider"></div>

  <div class="grid-row">
    <span>Data/Hora:</span>
    <span class="font-bold">${dataFormatada}</span>
  </div>
  <div class="grid-row">
    <span>Terminal / Caixa:</span>
    <span class="font-bold">${terminal}</span>
  </div>
  <div class="grid-row">
    <span>Perfil Activo:</span>
    <span>${perfil.nome}</span>
  </div>
  <div class="grid-row">
    <span>Modelo HW:</span>
    <span>${perfil.modelo}</span>
  </div>
  <div class="grid-row">
    <span>Interface:</span>
    <span class="font-bold">${perfil.tipoConexao.toUpperCase()}</span>
  </div>
  ${perfil.tipoConexao === "rede_tcp" ? `
  <div class="grid-row">
    <span>IP / Porta:</span>
    <span>${perfil.enderecoIp || "192.168.1.200"}:${perfil.portaTcp || 9100}</span>
  </div>` : ""}
  ${perfil.tipoConexao === "serial_com" ? `
  <div class="grid-row">
    <span>Porta COM / Baud:</span>
    <span>${perfil.portaSerial || "COM1"} @ ${perfil.baudRate || 9600}bps</span>
  </div>` : ""}
  <div class="grid-row">
    <span>Largura Papel:</span>
    <span>${perfil.larguraPapel} (${perfil.colunas} colunas)</span>
  </div>
  <div class="grid-row">
    <span>Protocolo:</span>
    <span>${perfil.protocolo.toUpperCase()}</span>
  </div>

  <div class="divider"></div>

  <div class="text-center font-bold">DADOS DE CERTIFICAÇÃO AGT</div>
  <div class="grid-row">
    <span>Nº Certificado:</span>
    <span class="font-bold">${certNumero}</span>
  </div>
  <div class="grid-row">
    <span>Software Fiscal:</span>
    <span>${fiscalConfig?.softwareNome || "PharmaStock Fiscal"} ${fiscalConfig?.softwareVersao || "v2.5"}</span>
  </div>
  <div class="grid-row">
    <span>Regime IVA:</span>
    <span>${fiscalConfig?.regimeIva || config.regimeIva || "Regime Geral (14%)"}</span>
  </div>
  <div class="grid-row">
    <span>Estado fiscal:</span>
    <span class="font-bold">Amostra — sem valor fiscal</span>
  </div>

  <div class="divider"></div>

  <!-- Teste de Linhas e Caracteres -->
  <div class="text-center font-bold">TESTE DE FONTE E MATRIZ</div>
  <div style="font-size: 9px; line-height: 1.1; margin: 4px 0;">
    ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>
    abcdefghijklmnopqrstuvwxyz<br>
    0123456789 !@#$%&*()-+=/?
  </div>

  <div class="divider"></div>

  <div class="grid-row">
    <span>Qtd Artigo Demo</span>
    <span>P.Unit</span>
    <span>Total</span>
  </div>
  <div class="grid-row">
    <span>1x Paracetamol 500mg</span>
    <span>1.200,00</span>
    <span>1.200,00</span>
  </div>
  <div class="grid-row">
    <span>1x Soro Fisiol. 500ml</span>
    <span>950,00</span>
    <span>950,00</span>
  </div>
  <div class="divider"></div>
  <div class="grid-row font-bold" style="font-size: 12px;">
    <span>TOTAL DEMO:</span>
    <span>2.150,00 ${moeda}</span>
  </div>

  ${perfil.imprimirQrCodeFiscal ? `
  <div class="text-center" style="margin-top: 8px;">
    <div class="qr-box">QR fiscal oficial indisponível nesta versão</div>
  </div>` : ""}

  <div class="double-divider"></div>

  <div class="text-center" style="font-size: 8.5px; line-height: 1.2;">
    <div>${config.mensagemRodape || "Software de facturação — certificação AGT pendente"}</div>
    ${perfil.rodapePersonalizado ? `<div style="margin-top:2px;">${perfil.rodapePersonalizado}</div>` : ""}
    <div style="margin-top: 4px; font-weight: bold;">-- FIM DO TESTE DE IMPRESSÃO --</div>
  </div>

  ${perfil.abrirGaveta ? `
  <div class="text-center" style="font-size: 8px; color: #555; margin-top: 4px;">
    [Comando ESC p: Impulso de Abertura de Gaveta OK]
  </div>` : ""}

  ${perfil.cortarPapel ? `
  <div class="cut-line">
    <span class="cut-text">✂ [Comando GS V 0: Corte Automático] ✂</span>
  </div>` : ""}

</body>
</html>`;
}

/**
 * Triggers printing of the thermal test ticket in a dedicated small popup window
 */
export function printThermalTestTicket(
  perfil: PerfilImpressoraTermica,
  config: ConfigSistema,
  fiscalConfig?: ConfiguracaoFiscalAGT
) {
  const html = generateThermalTestTicketHTML(perfil, config, fiscalConfig);
  const win = window.open("", "_blank", "width=420,height=680,scrollbars=yes");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 350);
  }
}
