export const ANGOLA_VAT_RATE = 14;
export const INVOICE_SERIES = "A";

export async function createAgthash(payload: string) {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(payload);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  }
  return Array.from(payload).reduce((hash, char) => ((hash * 31 + char.charCodeAt(0)) >>> 0), 7).toString(16).padStart(8, "0").toUpperCase();
}