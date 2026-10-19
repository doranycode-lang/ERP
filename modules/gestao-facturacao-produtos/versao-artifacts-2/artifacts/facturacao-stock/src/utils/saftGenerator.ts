import { Fatura, Produto, PacienteCliente, ConfigSistema, ConfiguracaoFiscalAGT } from "../types";

/**
 * Generates official SAF-T (AO) XML structure compliant with AGT (Angola)
 */
export function generateSaftAoXml(
  faturas: Fatura[],
  produtos: Produto[],
  clientes: PacienteCliente[],
  config: ConfigSistema,
  fiscalConfig?: ConfiguracaoFiscalAGT
): string {
  const now = new Date();
  const year = now.getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = now.toISOString().slice(0, 10);
  const certNum = fiscalConfig?.softwareCertificadoNumero || "PENDENTE_AGT";
  const softwareName = fiscalConfig?.softwareNome || "PharmaStock Fiscal Core";
  const softwareVersion = fiscalConfig?.softwareVersao || "v2.5.0-PRO";

  let totalCredit = 0;
  let totalDebit = 0;
  const officialFaturas = faturas.filter((f) => f.tipoDocumento !== "pro-forma");
  officialFaturas.forEach((f) => {
    if (f.tipoDocumento === "nota-credito") {
      totalDebit += f.total;
    } else {
      totalCredit += f.total;
    }
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Header>
    <AuditFileVersion>1.01_01</AuditFileVersion>
    <CompanyID>${config.nif || "5417082910"}</CompanyID>
    <TaxRegistrationNumber>${config.nif || "5417082910"}</TaxRegistrationNumber>
    <TaxAccountingBasis>F</TaxAccountingBasis>
    <CompanyName>${escapeXml(config.nomeClinica || "EMPRESA COMERCIAL LDA")}</CompanyName>
    <CompanyAddress>
      <AddressDetail>${escapeXml(config.endereco || "Luanda, Angola")}</AddressDetail>
      <City>Luanda</City>
      <Country>AO</Country>
    </CompanyAddress>
    <FiscalYear>${year}</FiscalYear>
    <StartDate>${startDate}</StartDate>
    <EndDate>${endDate}</EndDate>
    <CurrencyCode>${config.moeda || "AOA"}</CurrencyCode>
    <DateCreated>${now.toISOString().slice(0, 10)}</DateCreated>
    <TaxEntity>Global</TaxEntity>
    <ProductCompanyTaxID>${config.nif || "5417082910"}</ProductCompanyTaxID>
    <SoftwareCertificateNumber>${certNum}</SoftwareCertificateNumber>
    <ProductID>${escapeXml(softwareName)}/${escapeXml(softwareVersion)}</ProductID>
    <ProductVersion>${softwareVersion}</ProductVersion>
    <HeaderComment>Ficheiro SAF-T AO gerado nos termos do Decreto Presidencial n.º 292/18</HeaderComment>
    <Telephone>${escapeXml(config.telefone || "")}</Telephone>
    <Email>${escapeXml(config.email || "")}</Email>
  </Header>

  <MasterFiles>
    <!-- Clientes / Customer Master -->
    ${clientes.map(c => `
    <Customer>
      <CustomerID>${c.id}</CustomerID>
      <AccountID>Desconhecido</AccountID>
      <CustomerTaxID>${c.nif || "999999999"}</CustomerTaxID>
      <CompanyName>${escapeXml(c.nome)}</CompanyName>
      <BillingAddress>
        <AddressDetail>${escapeXml(c.endereco || "Luanda")}</AddressDetail>
        <City>Luanda</City>
        <Country>AO</Country>
      </BillingAddress>
      <SelfBillingIndicator>0</SelfBillingIndicator>
    </Customer>`).join("")}

    <!-- Produtos / Products Master -->
    ${produtos.map(p => `
    <Product>
      <ProductType>P</ProductType>
      <ProductCode>${escapeXml(p.codigo)}</ProductCode>
      <ProductGroup>${escapeXml(p.categoria || "Geral")}</ProductGroup>
      <ProductDescription>${escapeXml(p.nome)}</ProductDescription>
      <ProductNumberCode>${escapeXml(p.codigoBarras || p.codigo)}</ProductNumberCode>
    </Product>`).join("")}

    <!-- Tabela de Impostos / TaxTable -->
    <TaxTable>
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>AO</TaxCountryRegion>
        <TaxCode>NOR</TaxCode>
        <Description>Taxa Normal de IVA</Description>
        <TaxPercentage>${config.ivaTaxa || 14}</TaxPercentage>
      </TaxTableEntry>
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>AO</TaxCountryRegion>
        <TaxCode>ISE</TaxCode>
        <Description>Isento de IVA</Description>
        <TaxPercentage>0</TaxPercentage>
      </TaxTableEntry>
    </TaxTable>
  </MasterFiles>

  <SourceDocuments>
    <SalesInvoices>
        <NumberOfEntries>${officialFaturas.length}</NumberOfEntries>
      <TotalPartnerDebit>${totalDebit.toFixed(2)}</TotalPartnerDebit>
      <TotalPartnerCredit>${totalCredit.toFixed(2)}</TotalPartnerCredit>
        ${officialFaturas.map(f => `
      <Invoice>
        <InvoiceNo>${mapDocTypePrefix(f.tipoDocumento)} ${f.numero}</InvoiceNo>
        <DocumentStatus>
          <InvoiceStatus>${f.estado === "anulada" ? "A" : "N"}</InvoiceStatus>
          <InvoiceStatusDate>${formatIsoDate(f.data)}T12:00:00</InvoiceStatusDate>
          <SourceID>${escapeXml(f.emitidoPor || "Operador")}</SourceID>
          <SourceBilling>P</SourceBilling>
        </DocumentStatus>
        <Hash>${escapeXml(f.codigoHash || "0")}</Hash>
        <HashControl>1</HashControl>
        <Period>${f.data.split("/")[1] || "01"}</Period>
        <InvoiceDate>${formatIsoDate(f.data)}</InvoiceDate>
        <InvoiceType>${mapDocTypeSaft(f.tipoDocumento)}</InvoiceType>
        <SpecialRegimes>
          <SelfBillingIndicator>0</SelfBillingIndicator>
          <CashVATSchemeIndicator>0</CashVATSchemeIndicator>
          <ThirdPartiesBillingIndicator>0</ThirdPartiesBillingIndicator>
        </SpecialRegimes>
        <SourceID>${escapeXml(f.emitidoPor || "Operador")}</SourceID>
        <SystemEntryDate>${formatIsoDate(f.data)}T12:00:00</SystemEntryDate>
        <CustomerID>${f.pacienteId || 4}</CustomerID>
        ${f.linhas.map((l, idx) => `
        <Line>
          <LineNumber>${idx + 1}</LineNumber>
          <ProductCode>${escapeXml(l.codigo || "PROD")}</ProductCode>
          <ProductDescription>${escapeXml(l.descricao)}</ProductDescription>
          <Quantity>${l.quantidade}</Quantity>
          <UnitOfMeasure>${escapeXml(l.unidade || "un")}</UnitOfMeasure>
          <UnitPrice>${l.precoUnitario.toFixed(2)}</UnitPrice>
          <TaxPointDate>${formatIsoDate(f.data)}</TaxPointDate>
          <Description>${escapeXml(l.descricao)}</Description>
          <CreditAmount>${(l.quantidade * l.precoUnitario).toFixed(2)}</CreditAmount>
          <Tax>
            <TaxType>IVA</TaxType>
            <TaxCountryRegion>AO</TaxCountryRegion>
            <TaxCode>${l.ivaIsento ? "ISE" : "NOR"}</TaxCode>
            <TaxPercentage>${l.ivaIsento ? "0" : (f.ivaTaxa || 14)}</TaxPercentage>
          </Tax>
          ${l.ivaIsento ? `<TaxExemptionReason>Isento nos termos da alínea a) do nº 1 do art. 12º do CIVA</TaxExemptionReason><TaxExemptionCode>M02</TaxExemptionCode>` : ""}
          <SettlementAmount>0.00</SettlementAmount>
        </Line>`).join("")}
        <DocumentTotals>
          <TaxPayable>${f.totalIva.toFixed(2)}</TaxPayable>
          <NetTotal>${f.subtotalSemIva.toFixed(2)}</NetTotal>
          <GrossTotal>${f.total.toFixed(2)}</GrossTotal>
        </DocumentTotals>
      </Invoice>`).join("")}
    </SalesInvoices>
  </SourceDocuments>
</AuditFile>`;

  return xml.trim();
}

function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatIsoDate(ddmmyyyy: string): string {
  if (!ddmmyyyy) return new Date().toISOString().slice(0, 10);
  const parts = ddmmyyyy.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return ddmmyyyy;
}

function mapDocTypePrefix(tipo: string): string {
  switch (tipo) {
    case "factura": return "FT";
    case "factura-recibo": return "FR";
    case "pro-forma": return "FP";
    case "nota-credito": return "NC";
    case "recibo": return "RC";
    case "factura-global": return "FG";
    default: return "FT";
  }
}

function mapDocTypeSaft(tipo: string): string {
  switch (tipo) {
    case "factura": return "FT";
    case "factura-recibo": return "FR";
    case "pro-forma": return "FP";
    case "nota-credito": return "NC";
    case "recibo": return "RC";
    case "factura-global": return "FG";
    default: return "FT";
  }
}
