type JsonRecord = Record<string, unknown>;

export interface FiscalWriteViolation {
  code: string;
  error: string;
  status: 400 | 409;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function documentKey(document: JsonRecord, index: number): string {
  const identifier = document.id ?? document.numero;
  return identifier == null ? `index:${index}` : String(identifier);
}

function canonicalJson(value: unknown, omitRootState = false, root = true): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (isRecord(value)) {
    const entries = Object.keys(value)
      .filter((key) => !(root && omitRootState && key === "estado"))
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key], false, false)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

export function isValidIssuerNif(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.replace(/[\s.-]/g, "").toUpperCase();
  if (!normalized || /^0+$/.test(normalized)) return false;
  return /^[0-9]{9,14}$/.test(normalized) || /^[0-9]{9,12}[A-Z]{2,3}$/.test(normalized);
}

export function isOfficialDocument(document: JsonRecord): boolean {
  return document.tipoDocumento !== "pro-forma" && document.estado !== "rascunho";
}

export function validateAppStateFiscalWrites(
  previousData: unknown,
  nextData: unknown,
): FiscalWriteViolation | null {
  const previous = isRecord(previousData) ? previousData : {};
  const next = isRecord(nextData) ? nextData : {};
  const previousDocuments = Array.isArray(previous.faturas)
    ? previous.faturas.filter(isRecord)
    : [];
  const nextDocuments = Array.isArray(next.faturas)
    ? next.faturas.filter(isRecord)
    : [];
  const previousByKey = new Map(
    previousDocuments.map((document, index) => [documentKey(document, index), document]),
  );
  const nextByKey = new Map(
    nextDocuments.map((document, index) => [documentKey(document, index), document]),
  );

  for (const [key, oldDocument] of previousByKey) {
    if (!isOfficialDocument(oldDocument)) continue;
    const updatedDocument = nextByKey.get(key);
    if (!updatedDocument) {
      return {
        code: "ISSUED_DOCUMENT_IMMUTABLE",
        error: "Um documento emitido não pode ser apagado. Utilize uma nota de crédito para o corrigir.",
        status: 409,
      };
    }
    if (canonicalJson(oldDocument, true) !== canonicalJson(updatedDocument, true)) {
      return {
        code: "ISSUED_DOCUMENT_IMMUTABLE",
        error: "Os dados de um documento emitido não podem ser alterados por esta operação.",
        status: 409,
      };
    }
    if (
      oldDocument.estado !== updatedDocument.estado &&
      !(oldDocument.estado === "emitida" && updatedDocument.estado === "paga")
    ) {
      return {
        code: "INVALID_DOCUMENT_STATE_TRANSITION",
        error: "O estado deste documento não pode ser alterado por esta operação.",
        status: 409,
      };
    }
  }

  const previousStateExists = previousData != null;
  for (const [index, document] of nextDocuments.entries()) {
    if (!isOfficialDocument(document)) continue;
    const oldDocument = previousByKey.get(documentKey(document, index));
    if (oldDocument && isOfficialDocument(oldDocument)) continue;

    const config = isRecord(next.config) ? next.config : {};
    if (!isValidIssuerNif(config.nif)) {
      return {
        code: "ISSUER_NIF_REQUIRED",
        error: "Configure um NIF do emitente válido antes de emitir um documento oficial.",
        status: 400,
      };
    }

    // A first sync may contain pre-existing offline records. Once a server
    // snapshot exists, new emissions must use the locked transaction endpoint.
    if (previousStateExists) {
      return {
        code: "DOCUMENT_COMMIT_REQUIRED",
        error: "Emita este documento através da operação transaccional de documentos.",
        status: 409,
      };
    }
  }

  return null;
}