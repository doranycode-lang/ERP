import assert from "node:assert/strict";
import test from "node:test";
import {
  isOfficialDocument,
  isValidIssuerNif,
  validateAppStateFiscalWrites,
} from "./fiscalGuard.ts";

test("issuer NIF rejects blank and placeholder values and accepts configured formats", () => {
  assert.equal(isValidIssuerNif(""), false);
  assert.equal(isValidIssuerNif("   "), false);
  assert.equal(isValidIssuerNif("000.000.000"), false);
  assert.equal(isValidIssuerNif("0000000000"), false);
  assert.equal(isValidIssuerNif("5417082910"), true);
  assert.equal(isValidIssuerNif("006781290LA"), true);
});

test("drafts and pro-forma documents do not require an issuer NIF", () => {
  assert.equal(isOfficialDocument({ tipoDocumento: "factura", estado: "rascunho" }), false);
  assert.equal(isOfficialDocument({ tipoDocumento: "pro-forma", estado: "emitida" }), false);
  assert.equal(
    validateAppStateFiscalWrites(null, {
      config: { nif: "" },
      faturas: [
        { id: 1, tipoDocumento: "factura", estado: "rascunho" },
        { id: 2, tipoDocumento: "pro-forma", estado: "emitida" },
      ],
    }),
    null,
  );
});

test("new official documents in an existing snapshot require the transaction endpoint", () => {
  const violation = validateAppStateFiscalWrites(
    { config: { nif: "5417082910" }, faturas: [] },
    {
      config: { nif: "5417082910" },
      faturas: [{ id: 1, tipoDocumento: "factura", estado: "emitida" }],
    },
  );
  assert.equal(violation?.code, "DOCUMENT_COMMIT_REQUIRED");
  assert.equal(violation?.status, 409);
});

test("new official documents without a valid issuer NIF are rejected", () => {
  const violation = validateAppStateFiscalWrites(
    { faturas: [] },
    {
      config: { nif: "000000000" },
      faturas: [{ id: 1, tipoDocumento: "factura-recibo", estado: "paga" }],
    },
  );
  assert.equal(violation?.code, "ISSUER_NIF_REQUIRED");
  assert.equal(violation?.status, 400);
});

test("first sync preserves legacy issued records when the configured NIF is valid", () => {
  const legacyInvoice = { id: 1, numero: "FT A/2026/001", tipoDocumento: "factura", estado: "emitida" };
  assert.equal(
    validateAppStateFiscalWrites(
      null,
      { config: { nif: "5417082910" }, faturas: [legacyInvoice] },
    ),
    null,
  );
});

test("existing issued documents remain readable when the issuer NIF is now invalid", () => {
  const invoice = { id: 1, numero: "FT A/2026/001", tipoDocumento: "factura", estado: "emitida", total: 1200 };
  assert.equal(
    validateAppStateFiscalWrites(
      { config: { nif: "5417082910" }, faturas: [invoice] },
      { config: { nif: "" }, faturas: [invoice] },
    ),
    null,
  );
});

test("payment status may change, but issued fiscal data cannot be edited or deleted", () => {
  const invoice = { id: 1, numero: "FT A/2026/001", tipoDocumento: "factura", estado: "emitida", total: 1200 };
  assert.equal(
    validateAppStateFiscalWrites(
      { faturas: [invoice] },
      { faturas: [{ ...invoice, estado: "paga" }] },
    ),
    null,
  );
  assert.equal(
    validateAppStateFiscalWrites(
      { faturas: [invoice] },
      { faturas: [{ ...invoice, total: 1 }] },
    )?.code,
    "ISSUED_DOCUMENT_IMMUTABLE",
  );
  assert.equal(
    validateAppStateFiscalWrites(
      { faturas: [{ ...invoice, linhas: [{ descricao: "Serviço", estado: "original" }] }] },
      { faturas: [{ ...invoice, linhas: [{ descricao: "Serviço", estado: "alterado" }] }] },
    )?.code,
    "ISSUED_DOCUMENT_IMMUTABLE",
  );
  assert.equal(
    validateAppStateFiscalWrites({ faturas: [invoice] }, { faturas: [] })?.code,
    "ISSUED_DOCUMENT_IMMUTABLE",
  );
});