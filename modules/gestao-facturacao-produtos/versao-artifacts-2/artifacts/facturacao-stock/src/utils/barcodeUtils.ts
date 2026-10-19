import JsBarcode from "jsbarcode";

// Web Audio API beep synthesizer
class SoundManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playSuccessBeep() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio might be blocked by browser policy until interaction
    }
  }

  playErrorBeep() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(240, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio fallback
    }
  }
}

export const soundManager = new SoundManager();

/**
 * Render barcode to an SVG or Canvas element using JsBarcode
 */
export function renderBarcode(
  element: HTMLElement | SVGElement | HTMLCanvasElement,
  value: string,
  options?: {
    format?: "CODE128" | "EAN13" | "UPC" | "EAN8" | "pharmacode";
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    lineColor?: string;
  }
) {
  if (!element || !value) return;
  try {
    const opts = {
      format: options?.format || (value.length === 13 && /^\d+$/.test(value) ? "EAN13" : "CODE128"),
      width: options?.width || 1.8,
      height: options?.height || 50,
      displayValue: options?.displayValue ?? true,
      fontSize: options?.fontSize || 13,
      font: "monospace",
      margin: 8,
      lineColor: options?.lineColor || "#1e293b",
      background: "#ffffff",
    };
    JsBarcode(element, value, opts);
  } catch (err) {
    // If EAN13 format fails validation, fallback to CODE128
    try {
      JsBarcode(element, value, {
        format: "CODE128",
        width: options?.width || 1.8,
        height: options?.height || 50,
        displayValue: options?.displayValue ?? true,
        fontSize: options?.fontSize || 13,
        font: "monospace",
        margin: 8,
        lineColor: options?.lineColor || "#1e293b",
        background: "#ffffff",
      });
    } catch {
      console.warn("Could not render barcode for value:", value);
    }
  }
}

/**
 * Generate a standard 13-digit EAN/Internal Barcode
 */
export function generateRandomBarcode(prefix: string = "560"): string {
  // Generate a random 12-digit number (prefix + random digits) and calculate checksum
  const body = prefix + Math.floor(100000000 + Math.random() * 900000000).toString().substring(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(body[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checksum = (10 - (sum % 10)) % 10;
  return `${body}${checksum}`;
}
