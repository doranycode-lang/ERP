export function generateFaturaHTML(fatura: any, config: any, options: { segundaVia: boolean } = { segundaVia: false }): string {
  return `
    <html>
      <head>
        <title>${fatura.numero || 'Factura'}</title>
        <style>
          body { font-family: monospace; padding: 20px; color: #000; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .title { font-size: 18px; font-weight: bold; }
          .details { margin: 10px 0; }
          .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .table th, .table td { text-align: left; padding: 5px; }
          .total { text-align: right; font-weight: bold; font-size: 16px; border-top: 1px dashed #000; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${config.nomeClinica || config.empresa || 'CLÍNICA / FARMÁCIA'}</div>
          <div>NIF: ${config.nif || ''}</div>
          <div>Tel: ${config.telefone || ''}</div>
          <div>Email: ${config.email || ''}</div>
          <div>Endereço: ${config.endereco || ''}</div>
        </div>
        <div class="details">
          <strong>Documento:</strong> ${fatura.tipoDocumento?.toUpperCase() || 'FACTURA'} ${fatura.numero}<br/>
          <strong>Data Emissão:</strong> ${fatura.data}<br/>
          <strong>Cliente:</strong> ${fatura.clienteNome || 'Consumidor Final'}<br/>
          <strong>Cliente NIF:</strong> ${fatura.clienteNif || '999999999'}<br/>
          ${options.segundaVia ? '<strong>SEGUNDA VIA</strong>' : ''}
        </div>
        <table class="table">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th>Descrição</th><th>Qtd</th><th>P.Unit</th><th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${(fatura.linhas || []).map((l: any) => `
              <tr>
                <td>${l.descricao}</td>
                <td>${l.quantidade}</td>
                <td>${l.precoUnitario} Kz</td>
                <td>${(l.quantidade * l.precoUnitario).toFixed(2)} Kz</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          Subtotal: ${fatura.subtotalSemIva?.toFixed(2) || '0.00'} Kz<br/>
          IVA (${fatura.ivaTaxa || 14}%): ${fatura.totalIva?.toFixed(2) || '0.00'} Kz<br/>
          <strong>Total Geral: ${fatura.total?.toFixed(2) || '0.00'} Kz</strong>
        </div>
        <div style="margin-top: 30px; text-align: center; font-size: 10px;">
          Processado por programa validado nº 00/AGT/2026<br/>
          Hash: ${fatura.codigoHash || 'N/A'}<br/>
          Obrigado pela sua preferência!
        </div>
      </body>
    </html>
  `;
}

export function downloadFatura(html: string, numero: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 500);
  }
}

export function gerarHashFatura(fatura: any, nif: string): string {
  const dataStr = `${fatura.data};${fatura.horaOperacao || '00:00:00'};${fatura.numero};${fatura.total};`;
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    hash = (hash << 5) - hash + dataStr.charCodeAt(i);
    hash |= 0;
  }
  return 'agt-' + Math.abs(hash).toString(36).toUpperCase();
}

export async function gerarHashFaturaAsync(fatura: any, nif: string): Promise<string> {
  return gerarHashFatura(fatura, nif);
}
