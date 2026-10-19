import {
  Produto,
  Fatura,
  MovimentoStock,
  PacienteCliente,
  ConfigSistema,
  UsuarioSistema,
  KitProduto,
} from "../types";

const DB_NAME = "FacturacaoEletromedicinaDB";
const DB_VERSION = 1;

export interface BackupSnapshot {
  id?: number;
  timestamp: string;
  label: string;
  nota?: string;
  tipo: "automatico" | "manual" | "agendado" | "pos_fatura";
  tamanhoKb: number;
  totalProdutos: number;
  totalFaturas: number;
  totalMovimentos: number;
  totalClientes: number;
  dados: {
    produtos: Produto[];
    faturas: Fatura[];
    movimentos: MovimentoStock[];
    pacientes: PacienteCliente[];
    config: ConfigSistema;
    usuarios: UsuarioSistema[];
    kits: KitProduto[];
  };
}

export interface IndexedDBStats {
  produtosCount: number;
  faturasCount: number;
  movimentosCount: number;
  pacientesCount: number;
  kitsCount: number;
  snapshotsCount: number;
  lastSyncTimestamp: string;
  storageEstimateMb: number;
}

let dbInstance: IDBDatabase | null = null;

export async function openIndexedDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB não suportado neste navegador."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("produtos")) {
        db.createObjectStore("produtos", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("faturas")) {
        db.createObjectStore("faturas", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pacientes")) {
        db.createObjectStore("pacientes", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("movimentos")) {
        db.createObjectStore("movimentos", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("kits")) {
        db.createObjectStore("kits", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("config")) {
        db.createObjectStore("config", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("usuarios")) {
        db.createObjectStore("usuarios", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("snapshots")) {
        const snapStore = db.createObjectStore("snapshots", { keyPath: "id", autoIncrement: true });
        snapStore.createIndex("timestamp", "timestamp", { unique: false });
      }
      if (!db.objectStoreNames.contains("backup_settings")) {
        db.createObjectStore("backup_settings", { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Synchronizes the entire App State to IndexedDB for real secondary database redundancy
 */
export async function syncAllToIndexedDB(state: {
  produtos: Produto[];
  faturas: Fatura[];
  movimentos: MovimentoStock[];
  pacientes: PacienteCliente[];
  config: ConfigSistema;
  usuarios: UsuarioSistema[];
  kits: KitProduto[];
}): Promise<boolean> {
  try {
    const db = await openIndexedDB();

    const tx = db.transaction(
      ["produtos", "faturas", "pacientes", "movimentos", "kits", "config", "usuarios"],
      "readwrite"
    );

    // Clear and put collections
    const putStore = (storeName: string, items: any[], singleId?: string) => {
      const store = tx.objectStore(storeName);
      store.clear();
      if (singleId) {
        store.put({ id: singleId, ...items });
      } else {
        items.forEach((item) => store.put(item));
      }
    };

    putStore("produtos", state.produtos);
    putStore("faturas", state.faturas);
    putStore("pacientes", state.pacientes);
    putStore("movimentos", state.movimentos);
    putStore("kits", state.kits);
    putStore("usuarios", state.usuarios);

    const configStore = tx.objectStore("config");
    configStore.clear();
    configStore.put({ id: "main_config", ...state.config });

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        try {
          localStorage.setItem("indexeddb_last_sync", new Date().toISOString());
        } catch {}
        resolve(true);
      };
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error("IndexedDB sync error:", err);
    return false;
  }
}

/**
 * Loads entire datasets from IndexedDB (fallback if LocalStorage is wiped)
 */
export async function loadAllFromIndexedDB(): Promise<{
  produtos?: Produto[];
  faturas?: Fatura[];
  movimentos?: MovimentoStock[];
  pacientes?: PacienteCliente[];
  config?: ConfigSistema;
  usuarios?: UsuarioSistema[];
  kits?: KitProduto[];
} | null> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(
      ["produtos", "faturas", "pacientes", "movimentos", "kits", "config", "usuarios"],
      "readonly"
    );

    const getAll = <T>(storeName: string): Promise<T[]> => {
      return new Promise((resolve, reject) => {
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    };

    const [produtos, faturas, pacientes, movimentos, kits, usuarios, configs] = await Promise.all([
      getAll<Produto>("produtos"),
      getAll<Fatura>("faturas"),
      getAll<PacienteCliente>("pacientes"),
      getAll<MovimentoStock>("movimentos"),
      getAll<KitProduto>("kits"),
      getAll<UsuarioSistema>("usuarios"),
      getAll<any>("config"),
    ]);

    let config: ConfigSistema | undefined = undefined;
    if (configs && configs.length > 0) {
      const cfg = { ...configs[0] };
      delete cfg.id;
      config = cfg as ConfigSistema;
    }

    if (produtos.length === 0 && faturas.length === 0) {
      return null;
    }

    return {
      produtos: produtos.length > 0 ? produtos : undefined,
      faturas: faturas.length > 0 ? faturas : undefined,
      pacientes: pacientes.length > 0 ? pacientes : undefined,
      movimentos: movimentos.length > 0 ? movimentos : undefined,
      kits: kits.length > 0 ? kits : undefined,
      usuarios: usuarios.length > 0 ? usuarios : undefined,
      config,
    };
  } catch (err) {
    console.error("IndexedDB load error:", err);
    return null;
  }
}

/**
 * Creates an immutable historical snapshot point in IndexedDB
 */
export async function saveIndexedDBSnapshot(
  label: string,
  tipo: "automatico" | "manual" | "agendado" | "pos_fatura",
  state: {
    produtos: Produto[];
    faturas: Fatura[];
    movimentos: MovimentoStock[];
    pacientes: PacienteCliente[];
    config: ConfigSistema;
    usuarios: UsuarioSistema[];
    kits: KitProduto[];
  },
  nota?: string
): Promise<number | null> {
  try {
    const db = await openIndexedDB();
    const rawJson = JSON.stringify(state);
    const tamanhoKb = Math.round(new Blob([rawJson]).size / 1024);

    const snapshot: BackupSnapshot = {
      timestamp: new Date().toISOString(),
      label: label || `Snapshot ${new Date().toLocaleString("pt-PT")}`,
      nota,
      tipo,
      tamanhoKb,
      totalProdutos: state.produtos.length,
      totalFaturas: state.faturas.length,
      totalMovimentos: state.movimentos.length,
      totalClientes: state.pacientes.length,
      dados: state,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction("snapshots", "readwrite");
      const store = tx.objectStore("snapshots");
      const req = store.add(snapshot);

      req.onsuccess = () => {
        resolve(Number(req.result));
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("Failed to save IndexedDB snapshot:", e);
    return null;
  }
}

/**
 * Lists all snapshots saved in IndexedDB
 */
export async function listIndexedDBSnapshots(): Promise<BackupSnapshot[]> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction("snapshots", "readonly");
      const store = tx.objectStore("snapshots");
      const req = store.getAll();

      req.onsuccess = () => {
        const res: BackupSnapshot[] = req.result || [];
        // Sort descending by timestamp
        res.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(res);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Deletes a snapshot by id
 */
export async function deleteIndexedDBSnapshot(id: number): Promise<boolean> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction("snapshots", "readwrite");
      const store = tx.objectStore("snapshots");
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Get comprehensive IndexedDB storage statistics
 */
export async function getIndexedDBStats(): Promise<IndexedDBStats> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(
      ["produtos", "faturas", "movimentos", "pacientes", "kits", "snapshots"],
      "readonly"
    );

    const countStore = (storeName: string): Promise<number> => {
      return new Promise((resolve) => {
        const req = tx.objectStore(storeName).count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      });
    };

    const [produtosCount, faturasCount, movimentosCount, pacientesCount, kitsCount, snapshotsCount] =
      await Promise.all([
        countStore("produtos"),
        countStore("faturas"),
        countStore("movimentos"),
        countStore("pacientes"),
        countStore("kits"),
        countStore("snapshots"),
      ]);

    let storageEstimateMb = 0;
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      storageEstimateMb = Number(((est.usage || 0) / (1024 * 1024)).toFixed(2));
    }

    const lastSyncTimestamp = localStorage.getItem("indexeddb_last_sync") || new Date().toISOString();

    return {
      produtosCount,
      faturasCount,
      movimentosCount,
      pacientesCount,
      kitsCount,
      snapshotsCount,
      lastSyncTimestamp,
      storageEstimateMb,
    };
  } catch {
    return {
      produtosCount: 0,
      faturasCount: 0,
      movimentosCount: 0,
      pacientesCount: 0,
      kitsCount: 0,
      snapshotsCount: 0,
      lastSyncTimestamp: new Date().toISOString(),
      storageEstimateMb: 0,
    };
  }
}
