/**
 * PWA & Offline Support Utilities
 * Manages Service Worker registration, Install Prompts (beforeinstallprompt),
 * standalone display mode detection and offline storage sync.
 */

export interface PWAInstallState {
  isInstallable: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  hasServiceWorker: boolean;
  installPrompt: any | null;
}

let deferredPrompt: any = null;
const installListeners = new Set<(state: { isInstallable: boolean; isStandalone: boolean }) => void>();
const onlineListeners = new Set<(online: boolean) => void>();

export function isAppStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[PWA] Service Worker registado com sucesso (Âmbito:", registration.scope, ")");
        
        // Check for updates periodically
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  console.log("[PWA] Nova versão disponível para funcionamento offline.");
                } else {
                  console.log("[PWA] Conteúdo em cache para funcionamento offline.");
                }
              }
            };
          }
        };
      })
      .catch((error) => {
        console.warn("[PWA] Falha ao registar Service Worker:", error);
      });
  });

  // Listen for beforeinstallprompt
  window.addEventListener("beforeinstallprompt", (e: any) => {
    e.preventDefault();
    deferredPrompt = e;
    installListeners.forEach((listener) =>
      listener({ isInstallable: true, isStandalone: isAppStandalone() })
    );
  });

  // Listen for appinstalled
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    console.log("[PWA] Aplicação instalada com sucesso no dispositivo.");
    installListeners.forEach((listener) =>
      listener({ isInstallable: false, isStandalone: true })
    );
  });

  // Online / Offline listeners
  window.addEventListener("online", () => {
    onlineListeners.forEach((fn) => fn(true));
  });

  window.addEventListener("offline", () => {
    onlineListeners.forEach((fn) => fn(false));
  });
}

export function subscribeToInstallPrompt(
  callback: (state: { isInstallable: boolean; isStandalone: boolean }) => void
): () => void {
  installListeners.add(callback);
  callback({
    isInstallable: !!deferredPrompt,
    isStandalone: isAppStandalone(),
  });
  return () => {
    installListeners.delete(callback);
  };
}

export function subscribeToOnlineStatus(callback: (online: boolean) => void): () => void {
  onlineListeners.add(callback);
  callback(typeof navigator !== "undefined" ? navigator.onLine : true);
  return () => {
    onlineListeners.delete(callback);
  };
}

export async function promptPWAInstall(): Promise<{ outcome: "accepted" | "dismissed" | "unavailable" }> {
  if (!deferredPrompt) {
    return { outcome: "unavailable" };
  }

  try {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    deferredPrompt = null;
    installListeners.forEach((listener) =>
      listener({ isInstallable: false, isStandalone: isAppStandalone() })
    );
    return { outcome: choiceResult.outcome };
  } catch (err) {
    console.error("[PWA] Erro ao invocar prompt de instalação:", err);
    return { outcome: "unavailable" };
  }
}

/**
 * Generates and triggers download of a standalone desktop launcher (.url or .html)
 * for desktop environments where PWA install is not natively triggered.
 */
export function downloadDesktopLauncher(appName = "Facturação & Estoque Eletromedicina") {
  const currentUrl = window.location.origin;
  const content = `[InternetShortcut]
URL=${currentUrl}
IconIndex=0
IconFile=${currentUrl}/icon-192.png
HotKey=0
IDList=
[{000214A0-0000-0000-C000-000000000046}]
Prop3=19,11
`;
  const blob = new Blob([content], { type: "application/internet-shortcut" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${appName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Offline.url`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Calculates current offline storage usage (LocalStorage + Caches)
 */
export async function getOfflineStorageStats(): Promise<{
  localStorageKb: number;
  cachesKb: number;
  totalProducts: number;
  totalInvoices: number;
}> {
  let localStorageBytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        localStorageBytes += (key.length + (localStorage.getItem(key)?.length || 0)) * 2;
      }
    }
  } catch {}

  let cachesBytes = 0;
  try {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      cachesBytes = estimate.usage || 0;
    }
  } catch {}

  let productsCount = 0;
  let invoicesCount = 0;
  try {
    const prods = localStorage.getItem("facturacao_produtos_v3_eletromedicina");
    if (prods) productsCount = JSON.parse(prods).length;
    const invs = localStorage.getItem("facturacao_faturas_v3_eletromedicina");
    if (invs) invoicesCount = JSON.parse(invs).length;
  } catch {}

  return {
    localStorageKb: Math.round(localStorageBytes / 1024),
    cachesKb: Math.round(cachesBytes / 1024),
    totalProducts: productsCount || 999,
    totalInvoices: invoicesCount,
  };
}
