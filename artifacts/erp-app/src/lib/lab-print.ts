export interface PrintSettings {
  companyName: string;
  nif: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
}

export interface PrintPaciente {
  nome: string;
  nasc?: string;
  sexo?: string;
  bi?: string;
  nif?: string;
  nacionalidade?: string;
  profissao?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  grupoSanguineo?: string;
  fatorRh?: string;
  alergias?: string;
  patologiasCronicas?: string;
  medicacaoHabitual?: string;
  processo?: string;
  medico?: string;
  nAmostra?: string;
}

export interface PrintParametro {
  nome: string;
  valor: string;
  unidade?: string;
  refMin?: string;
  refMax?: string;
  tipo?: string;
}

export interface PrintResultado {
  id: number;
  pacienteNome: string;
  data?: string;
  dataEmissao?: string;
  tecnicoNome?: string;
  observacoes?: string;
  estado: string;
  parametros: PrintParametro[];
}

function formatDate(d?: string | null): string {
  if (!d) return "";
  try {
    const [y, m, day] = d.split("-");
    if (y && m && day) return `${day}/${m}/${y}`;
  } catch {}
  return d;
}

function flagValue(p: PrintParametro): { flag: string; color: string } {
  if (!p.valor || p.tipo === "texto" || p.tipo === "selecao") return { flag: "", color: "#374151" };
  const v = parseFloat(p.valor);
  if (isNaN(v)) return { flag: "", color: "#374151" };
  if (p.refMin && p.refMax) {
    const lo = parseFloat(p.refMin);
    const hi = parseFloat(p.refMax);
    if (!isNaN(lo) && !isNaN(hi)) {
      if (v < lo) return { flag: "↓", color: "#dc2626" };
      if (v > hi) return { flag: "↑", color: "#dc2626" };
      return { flag: "N", color: "#16a34a" };
    }
  }
  if (p.refMin && !p.refMax) {
    const lo = parseFloat(p.refMin);
    if (!isNaN(lo) && v < lo) return { flag: "↓", color: "#dc2626" };
  }
  if (!p.refMin && p.refMax) {
    const hi = parseFloat(p.refMax);
    if (!isNaN(hi) && v > hi) return { flag: "↑", color: "#dc2626" };
  }
  return { flag: "", color: "#374151" };
}

function infoRow(label: string, value: string | undefined | null): string {
  if (!value || value.trim() === "") return "";
  return `<tr>
    <td style="padding:3px 10px 3px 0;font-size:11px;color:#6b7280;white-space:nowrap;vertical-align:top;font-weight:500;">${label}</td>
    <td style="padding:3px 0;font-size:11px;color:#111827;vertical-align:top;">${value}</td>
  </tr>`;
}

export function generateLabReportHTML(
  resultado: PrintResultado,
  paciente: PrintPaciente | null,
  settings: PrintSettings
): string {
  const filledParams = resultado.parametros.filter((p) => p.valor && p.valor.trim() !== "");
  const logoBlock = settings.logoUrl
    ? `<img src="${settings.logoUrl}" alt="Logo" style="height:52px;max-width:160px;object-fit:contain;" />`
    : `<div style="width:52px;height:52px;border-radius:50%;background:#0091DA;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:700;">${(settings.companyName || "U").substring(0, 1).toUpperCase()}</div>`;

  const pacInfoRows = paciente ? [
    infoRow("Nome completo:", paciente.nome),
    infoRow("Data de nasc.:", paciente.nasc ? formatDate(paciente.nasc) : ""),
    infoRow("Sexo:", paciente.sexo),
    infoRow("BI / Passaporte:", paciente.bi),
    infoRow("NIF:", paciente.nif),
    infoRow("Nacionalidade:", paciente.nacionalidade),
    infoRow("Profissão:", paciente.profissao),
    infoRow("Telefone:", paciente.telefone),
    infoRow("Email:", paciente.email),
    infoRow("Endereço:", paciente.endereco),
    infoRow("Grupo sanguíneo:", paciente.grupoSanguineo ? `${paciente.grupoSanguineo}${paciente.fatorRh?.includes("+") ? " Rh+" : paciente.fatorRh?.includes("-") ? " Rh-" : ""}` : ""),
    infoRow("Alergias:", paciente.alergias),
    infoRow("Patologias crónicas:", paciente.patologiasCronicas),
    infoRow("Medicação habitual:", paciente.medicacaoHabitual),
    infoRow("Nº processo:", paciente.processo),
    infoRow("Médico referente:", paciente.medico),
    infoRow("Nº amostra:", paciente.nAmostra),
  ].filter(Boolean).join("") : infoRow("Nome:", resultado.pacienteNome);

  const paramsRows = filledParams.map((p) => {
    const { flag, color } = flagValue(p);
    const refStr = (p.refMin || p.refMax)
      ? `${p.refMin || ""}${p.refMin && p.refMax ? " – " : ""}${p.refMax || ""}`
      : "—";
    const flagLabel = flag === "N" ? "Normal" : flag === "↓" ? "Baixo" : flag === "↑" ? "Alto" : "";
    return `<tr style="border-bottom:1px solid #f3f4f6;">
      <td style="padding:7px 10px;font-size:11px;color:#1f2937;">${p.nome}</td>
      <td style="padding:7px 10px;font-size:12px;font-weight:600;color:${color};">${p.valor}${p.unidade ? `<span style="font-size:10px;font-weight:400;color:#9ca3af;margin-left:3px;">${p.unidade}</span>` : ""}</td>
      <td style="padding:7px 10px;font-size:10px;color:#9ca3af;text-align:center;">${refStr}${p.unidade && refStr !== "—" ? ` ${p.unidade}` : ""}</td>
      <td style="padding:7px 10px;font-size:10px;font-weight:600;color:${color};text-align:center;">${flagLabel}</td>
    </tr>`;
  }).join("");

  const companyAddr = [settings.address, settings.phone, settings.email].filter(Boolean).join(" · ");

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Relatório de Resultado — ${resultado.pacienteNome}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: #fff; }
    @page { size: A4; margin: 18mm 18mm 20mm 18mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 2px solid #0091DA; margin-bottom: 18px; }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .company-name { font-size: 16px; font-weight: 700; color: #1f2937; line-height: 1.2; }
    .company-sub { font-size: 10px; color: #6b7280; margin-top: 3px; line-height: 1.5; }
    .report-title { text-align: right; }
    .report-title h2 { font-size: 13px; font-weight: 700; color: #0091DA; text-transform: uppercase; letter-spacing: 0.05em; }
    .report-title .report-meta { font-size: 10px; color: #6b7280; margin-top: 4px; line-height: 1.6; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0091DA; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
    table.params { width: 100%; border-collapse: collapse; }
    table.params thead { background: #f0f7ff; }
    table.params thead th { padding: 7px 10px; font-size: 10px; font-weight: 700; color: #374151; text-align: left; text-transform: uppercase; letter-spacing: 0.05em; }
    table.params thead th:nth-child(2) { text-align: left; }
    table.params thead th:nth-child(3),
    table.params thead th:nth-child(4) { text-align: center; }
    .obs-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px 12px; font-size: 11px; color: #374151; line-height: 1.6; }
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-sig { text-align: center; }
    .footer-sig .sig-line { width: 180px; border-top: 1px solid #9ca3af; margin: 0 auto 4px; }
    .footer-sig .sig-label { font-size: 9px; color: #9ca3af; }
    .footer-date { font-size: 10px; color: #9ca3af; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; }
    .status-emitido { background: #dcfce7; color: #15803d; }
    .status-rascunho { background: #fef9c3; color: #854d0e; }
    .print-btn { position: fixed; bottom: 24px; right: 24px; background: #0091DA; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(0,145,218,0.4); z-index: 999; }
    .print-btn:hover { background: #0077b6; }
  </style>
</head>
<body>
  <button class="no-print print-btn" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      ${logoBlock}
      <div>
        <div class="company-name">${settings.companyName}</div>
        <div class="company-sub">
          ${settings.nif ? `NIF: ${settings.nif}` : ""}
          ${companyAddr ? `<br/>${companyAddr}` : ""}
        </div>
      </div>
    </div>
    <div class="report-title">
      <h2>Resultado Laboratorial</h2>
      <div class="report-meta">
        Nº Resultado: <strong>#${String(resultado.id).padStart(4, "0")}</strong><br/>
        Data colheita: <strong>${formatDate(resultado.data) || "—"}</strong><br/>
        Data emissão: <strong>${formatDate(resultado.dataEmissao) || "—"}</strong><br/>
        Estado: <span class="status-badge ${resultado.estado === "emitido" ? "status-emitido" : "status-rascunho"}">${resultado.estado === "emitido" ? "Emitido" : "Rascunho"}</span>
      </div>
    </div>
  </div>

  <!-- PATIENT INFO -->
  <div class="section">
    <div class="section-title">Dados do Paciente</div>
    <table style="width:100%;border-collapse:collapse;">
      <tbody>
        <tr>
          <td style="vertical-align:top;width:50%;padding-right:16px;">
            <table style="border-collapse:collapse;width:100%;">
              ${pacInfoRows}
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- RESULTS TABLE -->
  ${filledParams.length > 0 ? `
  <div class="section">
    <div class="section-title">Parâmetros Analisados (${filledParams.length} resultados)</div>
    <table class="params">
      <thead>
        <tr>
          <th>Parâmetro</th>
          <th>Resultado</th>
          <th>Valores de Referência</th>
          <th>Interpretação</th>
        </tr>
      </thead>
      <tbody>
        ${paramsRows}
      </tbody>
    </table>
  </div>
  ` : `<div class="section"><div class="obs-box" style="color:#9ca3af;">Nenhum parâmetro preenchido neste resultado.</div></div>`}

  <!-- OBSERVATIONS -->
  ${resultado.observacoes ? `
  <div class="section">
    <div class="section-title">Observações</div>
    <div class="obs-box">${resultado.observacoes}</div>
  </div>
  ` : ""}

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-date">
      Documento gerado em ${new Date().toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric" })}<br/>
      ${settings.companyName} · NIF ${settings.nif}
    </div>
    <div class="footer-sig">
      <div class="sig-line"></div>
      <div class="sig-label">${resultado.tecnicoNome ? `Técnico: ${resultado.tecnicoNome}` : "Assinatura do Técnico"}</div>
    </div>
    <div class="footer-sig">
      <div class="sig-line"></div>
      <div class="sig-label">Director de Laboratório</div>
    </div>
  </div>
</body>
</html>`;
}

export function printExameTemplate(
  exameNome: string,
  categoria: string,
  parametros: Parametro[],
  settings: PrintSettings
): void {
  const logoBlock = settings.logoUrl
    ? `<img src="${settings.logoUrl}" alt="Logo" style="height:52px;max-width:160px;object-fit:contain;" />`
    : `<div style="width:52px;height:52px;border-radius:50%;background:#0091DA;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:700;">${(settings.companyName || "U").substring(0, 1).toUpperCase()}</div>`;

  const companyAddr = [settings.address, settings.phone, settings.email].filter(Boolean).join(" · ");

  const rows = parametros.map((p) => {
    const refStr = (p.refMin || p.refMax)
      ? `${p.refMin ?? ""}${p.refMin && p.refMax ? " – " : ""}${p.refMax ?? ""}${p.unidade ? ` ${p.unidade}` : ""}`
      : "—";
    return `<tr style="border-bottom:1px solid #f3f4f6;">
      <td style="padding:9px 10px;font-size:11.5px;color:#1f2937;">${p.nome}</td>
      <td style="padding:9px 10px;font-size:11.5px;color:#6b7280;">${p.unidade || ""}</td>
      <td style="padding:9px 10px;font-size:10px;color:#9ca3af;text-align:center;">${refStr}</td>
      <td style="padding:9px 40px 9px 10px;border-bottom:1px solid #d1d5db;min-width:120px;">&nbsp;</td>
      <td style="padding:9px 10px;text-align:center;font-size:11px;color:#d1d5db;">○</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <title>Modelo — ${exameNome}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: #fff; }
    @page { size: A4; margin: 18mm 18mm 20mm 18mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 2px solid #0091DA; margin-bottom: 18px; }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .company-name { font-size: 16px; font-weight: 700; color: #1f2937; }
    .company-sub { font-size: 10px; color: #6b7280; margin-top: 3px; line-height: 1.5; }
    .report-title { text-align: right; }
    .report-title h2 { font-size: 13px; font-weight: 700; color: #0091DA; text-transform: uppercase; letter-spacing: 0.05em; }
    .report-title .sub { font-size: 10px; color: #6b7280; margin-top: 4px; }
    .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px 16px; background: #f9fafb; }
    .field-row { display: flex; flex-direction: column; gap: 2px; }
    .field-label { font-size: 9px; font-weight: 600; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.06em; }
    .field-line { border-bottom: 1px solid #d1d5db; min-height: 20px; }
    .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0091DA; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; }
    table.params { width: 100%; border-collapse: collapse; }
    table.params thead { background: #f0f7ff; }
    table.params thead th { padding: 7px 10px; font-size: 10px; font-weight: 700; color: #374151; text-align: left; text-transform: uppercase; letter-spacing: 0.05em; }
    table.params thead th:nth-child(3),
    table.params thead th:nth-child(4),
    table.params thead th:nth-child(5) { text-align: center; }
    .footer { margin-top: 32px; padding-top: 10px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-sig { text-align: center; }
    .footer-sig .sig-line { width: 180px; border-top: 1px solid #9ca3af; margin: 0 auto 4px; }
    .footer-sig .sig-label { font-size: 9px; color: #9ca3af; }
    .footer-date { font-size: 10px; color: #9ca3af; }
    .print-btn { position: fixed; bottom: 24px; right: 24px; background: #0091DA; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(0,145,218,0.4); z-index: 999; }
  </style>
</head>
<body>
  <button class="no-print print-btn" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>

  <div class="header">
    <div class="header-left">
      ${logoBlock}
      <div>
        <div class="company-name">${settings.companyName}</div>
        <div class="company-sub">
          ${settings.nif ? `NIF: ${settings.nif}` : ""}
          ${companyAddr ? `<br/>${companyAddr}` : ""}
        </div>
      </div>
    </div>
    <div class="report-title">
      <h2>${exameNome}</h2>
      <div class="sub">${categoria} · Modelo em branco<br/>Data: ___/___/________&nbsp;&nbsp;Nº amostra: ___________</div>
    </div>
  </div>

  <div class="section-title" style="margin-bottom:12px;">Dados do Paciente</div>
  <div class="patient-grid">
    <div class="field-row"><div class="field-label">Nome completo</div><div class="field-line"></div></div>
    <div class="field-row"><div class="field-label">Data de nascimento</div><div class="field-line"></div></div>
    <div class="field-row"><div class="field-label">BI / Passaporte</div><div class="field-line"></div></div>
    <div class="field-row"><div class="field-label">Sexo</div><div class="field-line"></div></div>
    <div class="field-row"><div class="field-label">Telefone</div><div class="field-line"></div></div>
    <div class="field-row"><div class="field-label">Médico referente</div><div class="field-line"></div></div>
  </div>

  <div class="section-title">Parâmetros a Analisar (${parametros.length})</div>
  <table class="params">
    <thead>
      <tr>
        <th>Parâmetro</th>
        <th>Unidade</th>
        <th>Valores de Referência</th>
        <th>Resultado</th>
        <th>Flag</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div style="margin-top:16px;border:1px solid #e5e7eb;border-radius:4px;padding:10px 12px;background:#f9fafb;">
    <div class="section-title" style="margin-bottom:6px;">Observações</div>
    <div style="min-height:40px;"></div>
  </div>

  <div class="footer">
    <div class="footer-date">
      ${settings.companyName} · NIF ${settings.nif}<br/>
      ${new Date().toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric" })}
    </div>
    <div class="footer-sig">
      <div class="sig-line"></div>
      <div class="sig-label">Assinatura do Técnico</div>
    </div>
    <div class="footer-sig">
      <div class="sig-line"></div>
      <div class="sig-label">Director de Laboratório</div>
    </div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("O browser bloqueou a janela popup. Por favor, permita popups para este site.");
    return;
  }
  win.document.write(html);
  win.document.close();
}

interface Parametro {
  nome: string;
  unidade: string;
  refMin?: string;
  refMax?: string;
  tipo: string;
}

export function printLabReport(
  resultado: PrintResultado,
  paciente: PrintPaciente | null,
  settings: PrintSettings
): void {
  const html = generateLabReportHTML(resultado, paciente, settings);
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("O browser bloqueou a janela popup. Por favor, permita popups para este site.");
    return;
  }
  win.document.write(html);
  win.document.close();
}
