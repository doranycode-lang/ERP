import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useApp } from "../store/AppContext";
import { Resultado } from "../store/AppContext";
import { ParametroResult } from "../store/storage";
import { generatePDFHTML, downloadPDF } from "../utils/pdfGenerator";

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

type LibraryItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  mimeType?: string;
  size?: number;
  parentId: string | null;
  favorite: boolean;
  trashed: boolean;
  createdAt: string;
  modifiedAt: string;
  owner: string;
};

// ===== IndexedDB para ficheiros (evita limite do localStorage) =====
const DB_NAME = "app_library_db";
const DB_VERSION = 1;
const STORE_FILES = "files";
const META_KEY = "app_library_meta_v1";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(id: string, dataUrl: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_FILES, "readwrite");
      tx.objectStore(STORE_FILES).put(dataUrl, id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.error("IndexedDB put error:", e);
    return false;
  }
}

async function idbGet(id: string): Promise<string | undefined> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, "readonly");
      const req = tx.objectStore(STORE_FILES).get(id);
      req.onsuccess = () => resolve(req.result as string | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("IndexedDB get error:", e);
    return undefined;
  }
}

async function idbDelete(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_FILES, "readwrite");
      tx.objectStore(STORE_FILES).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.error("IndexedDB delete error:", e);
    return false;
  }
}

async function idbGetAll(): Promise<Record<string, string>> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, "readonly");
      const store = tx.objectStore(STORE_FILES);
      const result: Record<string, string> = {};
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          result[cursor.key as string] = cursor.value as string;
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("IndexedDB getAll error:", e);
    return {};
  }
}

function loadMeta(): LibraryItem[] {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveMeta(items: LibraryItem[]) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("Falha ao guardar metadados:", e);
  }
}

function formatSize(bytes?: number) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return iso;
  }
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Otimização: algoritmo O(n) para encontrar descendentes
function getDescendants(itemId: string, allItems: LibraryItem[]): Set<string> {
  const descendants = new Set<string>();
  const childrenMap = new Map<string | null, LibraryItem[]>();

  // Construir mapa uma única vez
  allItems.forEach((item) => {
    if (!childrenMap.has(item.parentId)) {
      childrenMap.set(item.parentId, []);
    }
    childrenMap.get(item.parentId)!.push(item);
  });

  // BFS para encontrar todos os descendentes
  const queue = [itemId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = childrenMap.get(currentId) || [];
    for (const child of children) {
      if (!descendants.has(child.id)) {
        descendants.add(child.id);
        queue.push(child.id);
      }
    }
  }

  return descendants;
}

// Componente memoizado para item da biblioteca
const LibraryItemRow = memo(({ 
  item, 
  isSelected, 
  onToggleSelect, 
  onOpen, 
  onContextMenu,
  fileIcon 
}: {
  item: LibraryItem;
  isSelected: boolean;
  onToggleSelect: (id: string, multi: boolean) => void;
  onOpen: (item: LibraryItem) => void;
  onContextMenu: (e: React.MouseEvent, item: LibraryItem) => void;
  fileIcon: (item: LibraryItem) => JSX.Element;
}) => {
  return (
    <div
      onContextMenu={(e) => onContextMenu(e, item)}
      onClick={(e) => onToggleSelect(item.id, e.ctrlKey || e.metaKey)}
      onDoubleClick={() => onOpen(item)}
      className={`grid grid-cols-12 gap-2 px-5 py-2.5 items-center text-sm cursor-pointer transition ${
        isSelected ? "bg-primary/10" : "hover:bg-accent/10"
      }`}
    >
      <div className="col-span-6 flex items-center gap-3 min-w-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(item.id, false)}
          onClick={(e) => e.stopPropagation()}
          className="accent-primary"
        />
        {fileIcon(item)}
        <span className="truncate font-medium text-slate-800">{item.name}</span>
        {item.favorite && <span className="text-amber-500 text-xs">★</span>}
      </div>
      <div className="col-span-2 text-xs text-muted-foreground truncate">para mim</div>
      <div className="col-span-2 text-xs text-muted-foreground truncate">
        {formatDateTime(item.modifiedAt)}
      </div>
      <div className="col-span-2 text-xs text-muted-foreground text-right">
        {item.type === "folder" ? "—" : formatSize(item.size)}
      </div>
    </div>
  );
});

export default function Historico() {
  const { data, removeResultado, updateResultado } = useApp();
  const [activeTab, setActiveTab] = useState<"historico" | "biblioteca">("historico");

  // ====== Histórico state ======
  const [search, setSearch] = useState("");
  const [editando, setEditando] = useState<Resultado | null>(null);
  const [editParams, setEditParams] = useState<ParametroResult[]>([]);
  const [editData, setEditData] = useState("");
  const [editTecnico, setEditTecnico] = useState("");

  const filtered = [...data.resultados]
    .reverse()
    .filter((r) => !search || r.pacienteNome.toLowerCase().includes(search.toLowerCase()));

  function handlePDF(id: number) {
    const resultado = data.resultados.find((r) => r.id === id);
    if (!resultado) return;
    const paciente = data.pacientes.find((p) => p.id === resultado.pacienteId);
    const html = generatePDFHTML(resultado, paciente, data.config);
    const filename = `${resultado.pacienteNome.replace(/\s+/g, "_")}_${resultado.data.replace(/\//g, "-")}.pdf`;
    downloadPDF(html, filename);
  }

  function handleRemove(id: number) {
    if (window.confirm(`Remover registo ID ${id}?`)) removeResultado(id);
  }

  function handleEditar(r: Resultado) {
    setEditando(r);
    setEditParams(r.parametros.map((p) => ({ ...p })));
    setEditData(r.data);
    setEditTecnico(r.tecnicoNome || "");
  }

  function handleFecharEdit() {
    setEditando(null);
  }

  async function handleSaveEdit() {
    if (!editando) return;
    await updateResultado(editando.id, {
      ...editando,
      data: editData,
      tecnicoNome: editTecnico,
      parametros: editParams,
    });
    setEditando(null);
  }

  // ====== Biblioteca state ======
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [libReady, setLibReady] = useState(false);
  const [libView, setLibView] = useState<"inicio" | "minha" | "recentes" | "favoritos" | "lixo">("minha");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [libSearch, setLibSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: LibraryItem } | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [moveOpen, setMoveOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<LibraryItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [previewItem, setPreviewItem] = useState<(LibraryItem & { dataUrl?: string }) | null>(null);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar metadados ao iniciar
  useEffect(() => {
    const meta = loadMeta();
    setLibrary(meta);
    setLibReady(true);
  }, []);

  // Guardar metadados com debounce (300ms)
  useEffect(() => {
    if (!libReady) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveMeta(library);
    }, 300);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [library, libReady]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const nowIso = () => new Date().toISOString();

  function showToast(msg: string) {
    setToast(msg);
  }

  const currentFolderItems = library.filter((i) => !i.trashed && i.parentId === currentFolderId);

  const breadcrumb: { id: string | null; name: string }[] = [{ id: null, name: "Minha Biblioteca" }];
  {
    let cur = currentFolderId;
    const chain: { id: string; name: string }[] = [];
    while (cur) {
      const f = library.find((i) => i.id === cur);
      if (!f) break;
      chain.unshift({ id: f.id, name: f.name });
      cur = f.parentId;
    }
    breadcrumb.push(...chain);
  }

  function getViewItems(): LibraryItem[] {
    if (libView === "lixo") return library.filter((i) => i.trashed);
    if (libView === "favoritos") return library.filter((i) => i.favorite && !i.trashed);
    if (libView === "recentes")
      return [...library]
        .filter((i) => !i.trashed && i.type === "file")
        .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
        .slice(0, 30);
    if (libView === "inicio")
      return [...library]
        .filter((i) => !i.trashed)
        .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
        .slice(0, 20);
    return currentFolderItems;
  }

  let viewItems = getViewItems();
  if (libSearch.trim()) {
    const q = libSearch.toLowerCase();
    viewItems = library
      .filter((i) => !i.trashed && i.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  viewItems = [...viewItems].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  // ====== Library actions ======
  function createFolder() {
    const name = newFolderName.trim() || "Nova pasta";
    const item: LibraryItem = {
      id: uid(),
      name,
      type: "folder",
      parentId: libView === "minha" ? currentFolderId : null,
      favorite: false,
      trashed: false,
      createdAt: nowIso(),
      modifiedAt: nowIso(),
      owner: "eu",
    };
    setLibrary((prev) => [...prev, item]);
    setNewFolderName("");
    setNewFolderOpen(false);
    showToast(`Pasta "${name}" criada`);
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const targetParentId = libView === "minha" ? currentFolderId : null;
    let count = 0;

    for (const file of Array.from(files)) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const id = uid();
      const success = await idbPut(id, dataUrl);

      if (!success) {
        showToast("Erro ao guardar ficheiro");
        continue;
      }

      const item: LibraryItem = {
        id,
        name: file.name,
        type: "file",
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        parentId: targetParentId,
        favorite: false,
        trashed: false,
        createdAt: nowIso(),
        modifiedAt: nowIso(),
        owner: "eu",
      };

      setLibrary((prev) => [...prev, item]);
      count++;
    }

    showToast(`${count} arquivo(s) carregado(s)`);
  }

  async function handleOpen(item: LibraryItem) {
    if (item.type === "folder") {
      setLibView("minha");
      setCurrentFolderId(item.id);
      setSelectedIds([]);
    } else {
      // Carregar dataUrl on-demand
      const dataUrl = await idbGet(item.id);
      setPreviewItem({ ...item, dataUrl });
    }
  }

  function handleDownload(item: LibraryItem & { dataUrl?: string }) {
    if (!item.dataUrl) {
      showToast("Ficheiro não disponível");
      return;
    }
    const a = document.createElement("a");
    a.href = item.dataUrl;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleCopyLink(item: LibraryItem) {
    const fakeLink = `https://drive.app/file/${item.id}`;
    navigator.clipboard?.writeText(fakeLink).then(
      () => showToast("Link copiado"),
      () => showToast("Link: " + fakeLink)
    );
  }

  function handleToggleFavorite(item: LibraryItem) {
    setLibrary((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, favorite: !i.favorite } : i))
    );
  }

  function handleTrash(item: LibraryItem) {
    const descendants = getDescendants(item.id, library);
    const idsToTrash = new Set([item.id, ...descendants]);

    setLibrary((prev) =>
      prev.map((i) =>
        idsToTrash.has(i.id) ? { ...i, trashed: true, modifiedAt: nowIso() } : i
      )
    );
    setSelectedIds([]);
    showToast(`"${item.name}" movido para o lixo`);
  }

  function handleRestore(item: LibraryItem) {
    const descendants = getDescendants(item.id, library);
    const idsToRestore = new Set([item.id, ...descendants]);

    setLibrary((prev) =>
      prev.map((i) =>
        idsToRestore.has(i.id) ? { ...i, trashed: false, modifiedAt: nowIso() } : i
      )
    );
    showToast(`"${item.name}" restaurado`);
  }

  async function handleDeleteForever(item: LibraryItem) {
    const descendants = getDescendants(item.id, library);
    const idsToDelete = new Set([item.id, ...descendants]);

    if (!window.confirm(`Eliminar permanentemente "${item.name}" e todo o seu conteúdo?`)) return;

    for (const id of idsToDelete) {
      await idbDelete(id);
    }

    setLibrary((prev) => prev.filter((i) => !idsToDelete.has(i.id)));
    showToast(`"${item.name}" eliminado`);
  }

  async function handleEmptyTrash() {
    if (!window.confirm("Esvaziar lixeira? Esta ação é irreversível.")) return;

    const trashedIds = library.filter((i) => i.trashed).map((i) => i.id);
    for (const id of trashedIds) {
      await idbDelete(id);
    }

    setLibrary((prev) => prev.filter((i) => !i.trashed));
    showToast("Lixeira esvaziada");
  }

  function openRename(item: LibraryItem) {
    setRenameTarget(item);
    setRenameValue(item.name);
    setRenameOpen(true);
  }

  function saveRename() {
    if (!renameTarget) return;
    const newName = renameValue.trim() || renameTarget.name;
    setLibrary((prev) =>
      prev.map((i) =>
        i.id === renameTarget.id ? { ...i, name: newName, modifiedAt: nowIso() } : i
      )
    );
    setRenameOpen(false);
    setRenameTarget(null);
    showToast("Nome atualizado");
  }

  function openMove() {
    if (selectedIds.length === 0) return;
    setMoveOpen(true);
  }

  function moveSelected(targetFolderId: string | null) {
    if (targetFolderId) {
      for (const id of selectedIds) {
        const it = library.find((i) => i.id === id);
        if (it && it.type === "folder") {
          const descendants = getDescendants(id, library);
          if (descendants.has(targetFolderId)) {
            showToast("Não é possível mover uma pasta para dentro de si mesma");
            return;
          }
        }
      }
    }

    setLibrary((prev) =>
      prev.map((i) =>
        selectedIds.includes(i.id) ? { ...i, parentId: targetFolderId, modifiedAt: nowIso() } : i
      )
    );
    setMoveOpen(false);
    setSelectedIds([]);
    showToast("Movido com sucesso");
  }

  function getFoldersForMove(excludeIds: string[]): LibraryItem[] {
    return library.filter((i) => i.type === "folder" && !i.trashed && !excludeIds.includes(i.id));
  }

  function onContextMenu(e: React.MouseEvent, item: LibraryItem) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }

  function toggleSelect(id: string, multi: boolean) {
    setSelectedIds((prev) => {
      if (multi) {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        return [...prev, id];
      }
      if (prev.length === 1 && prev[0] === id) return [];
      return [id];
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (libView === "minha") handleFileUpload(e.dataTransfer.files);
  }

  // Export/Import
  async function handleExport() {
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      metadata: library,
      files: {} as Record<string, string>,
    };

    for (const item of library) {
      if (item.type === "file") {
        const dataUrl = await idbGet(item.id);
        if (dataUrl) {
          exportData.files[item.id] = dataUrl;
        }
      }
    }

    const blob = new Blob([JSON.stringify(exportData)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biblioteca_backup_${todayStr().replace(/\//g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Backup exportado com sucesso");
    setExportOpen(false);
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.metadata || !importData.files) {
        throw new Error("Formato inválido");
      }

      // Importar ficheiros para IndexedDB
      for (const [id, dataUrl] of Object.entries(importData.files)) {
        await idbPut(id, dataUrl as string);
      }

      // Importar metadados
      setLibrary(importData.metadata);
      showToast("Backup importado com sucesso");
      setImportOpen(false);
    } catch (e) {
      console.error("Import error:", e);
      showToast("Erro ao importar backup");
    }
  }

  function fileIcon(item: LibraryItem) {
    if (item.type === "folder")
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-amber-500" fill="currentColor">
          <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z" />
        </svg>
      );
    const mt = item.mimeType || "";
    if (mt.startsWith("image/"))
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-emerald-500" fill="currentColor">
          <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z" />
        </svg>
      );
    if (mt === "application/pdf")
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-red-500" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 9v4h-2v-4H9V9h6v2h-2z" />
        </svg>
      );
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6 text-slate-500" fill="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
      </svg>
    );
  }

  return (
    <div className="p-5 space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("historico")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === "historico"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-primary"
          }`}
        >
          📋 Histórico
        </button>
        <button
          onClick={() => setActiveTab("biblioteca")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === "biblioteca"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-primary"
          }`}
        >
          📁 Biblioteca
        </button>
      </div>

      {activeTab === "historico" && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-primary">Histórico / PDF</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar paciente..."
              className="border border-border rounded-lg px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {editando && (
            <div className="bg-white border border-primary/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary text-sm">
                  Editar Resultado — {editando.pacienteNome}
                </h3>
                <button
                  onClick={handleFecharEdit}
                  className="text-xs text-muted-foreground hover:text-destructive font-semibold"
                >
                  ✕ Fechar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Data de Colheita</label>
                  <input
                    value={editData}
                    onChange={(e) => setEditData(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Técnico Responsável</label>
                  <input
                    value={editTecnico}
                    onChange={(e) => setEditTecnico(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Parâmetros</div>
                <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-muted-foreground px-1">
                  <div>Exame</div>
                  <div>Parâmetro</div>
                  <div>Resultado</div>
                  <div>Unidade</div>
                  <div>Referência</div>
                </div>
                {editParams.map((p, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2">
                    {(["exame", "parametro", "resultado", "unidade", "referencia"] as const).map((field) => (
                      <input
                        key={field}
                        value={p[field]}
                        onChange={(e) => {
                          const ps = [...editParams];
                          ps[i] = { ...p, [field]: e.target.value };
                          setEditParams(ps);
                        }}
                        className="border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition"
                >
                  Guardar
                </button>
                <button
                  onClick={handleFecharEdit}
                  className="bg-gray-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border text-xs text-muted-foreground">
              {filtered.length} resultado(s) encontrado(s)
            </div>
            {filtered.length === 0 ? (
              <div className="py-14 text-center text-muted-foreground text-sm">Nenhum resultado encontrado.</div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((r) => (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/10">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{r.pacienteNome}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.data} · {r.parametros.length} parâmetro(s)
                        {r.tecnicoNome && ` · Téc: ${r.tecnicoNome}`}
                      </div>
                    </div>
                    <div className="flex gap-1.5 text-xs flex-shrink-0">
                      <button
                        onClick={() => handlePDF(r.id)}
                        className="bg-indigo-500 text-white px-3 py-1.5 rounded font-semibold hover:bg-indigo-600 transition"
                      >
                        📄 PDF
                      </button>
                      <button
                        onClick={() => handleEditar(r)}
                        className="bg-blue-500 text-white px-2.5 py-1.5 rounded font-semibold hover:bg-blue-600 transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleRemove(r.id)}
                        className="bg-red-500 text-white px-2.5 py-1.5 rounded font-semibold hover:bg-red-600 transition"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "biblioteca" && (
        <div className="flex gap-5 items-start">
          {/* Sidebar */}
          <aside className="w-60 flex-shrink-0 bg-white border border-border rounded-xl p-3 space-y-3 sticky top-4">
            <div className="relative">
              <button
                onClick={() => setNewMenuOpen((v) => !v)}
                className="w-full bg-white border border-border hover:bg-accent/20 text-primary font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition"
              >
                <span className="text-lg leading-none">＋</span>
                Novo
              </button>
              {newMenuOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                  <button
                    onClick={() => {
                      setNewFolderOpen(true);
                      setNewMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-accent/20 flex items-center gap-2"
                  >
                    <span>📁</span> Nova pasta
                  </button>
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setNewMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-accent/20 flex items-center gap-2 border-t border-border"
                  >
                    <span>📤</span> Upload de arquivo
                  </button>
                  <button
                    onClick={() => {
                      setExportOpen(true);
                      setNewMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-accent/20 flex items-center gap-2 border-t border-border"
                  >
                    <span>💾</span> Exportar backup
                  </button>
                  <button
                    onClick={() => {
                      setImportOpen(true);
                      setNewMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-accent/20 flex items-center gap-2 border-t border-border"
                  >
                    <span>📥</span> Importar backup
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>

            <nav className="space-y-0.5 text-sm">
              {[
                { key: "inicio", label: "Início", icon: "🏠" },
                { key: "minha", label: "Minha Biblioteca", icon: "📁" },
                { key: "recentes", label: "Recentes", icon: "🕒" },
                { key: "favoritos", label: "Favoritos", icon: "⭐" },
                { key: "lixo", label: "Lixo", icon: "🗑️" },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => {
                    setLibView(m.key as any);
                    setCurrentFolderId(null);
                    setSelectedIds([]);
                    setLibSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition ${
                    libView === m.key && !(m.key === "minha" && currentFolderId)
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-700 hover:bg-accent/20"
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-xl font-bold text-primary truncate">
                  {libView === "lixo"
                    ? "Lixo"
                    : libView === "favoritos"
                    ? "Favoritos"
                    : libView === "recentes"
                    ? "Recentes"
                    : libView === "inicio"
                    ? "Início"
                    : breadcrumb[breadcrumb.length - 1].name}
                </h2>
                {libView === "lixo" && library.some((i) => i.trashed) && (
                  <button
                    onClick={handleEmptyTrash}
                    className="text-xs text-destructive font-semibold hover:underline ml-2"
                  >
                    Esvaziar lixeira
                  </button>
                )}
              </div>
              <input
                value={libSearch}
                onChange={(e) => setLibSearch(e.target.value)}
                placeholder="Pesquisar na biblioteca..."
                className="border border-border rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Breadcrumb */}
            {libView === "minha" && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3 flex-wrap">
                {breadcrumb.map((b, idx) => (
                  <div key={b.id ?? "root"} className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentFolderId(b.id)}
                      className={`hover:text-primary font-medium ${
                        idx === breadcrumb.length - 1 ? "text-slate-700" : ""
                      }`}
                    >
                      {b.name}
                    </button>
                    {idx < breadcrumb.length - 1 && <span>›</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Selection bar */}
            {selectedIds.length > 0 && libView !== "lixo" && (
              <div className="bg-primary/5 border border-primary/30 rounded-lg px-3 py-2 mb-3 flex items-center gap-3 text-xs">
                <span className="font-semibold text-primary">{selectedIds.length} selecionado(s)</span>
                <button onClick={openMove} className="text-slate-700 hover:text-primary font-semibold">
                  Mover para
                </button>
                <button
                  onClick={() => {
                    selectedIds.forEach((id) => {
                      const it = library.find((i) => i.id === id);
                      if (it) handleTrash(it);
                    });
                  }}
                  className="text-destructive font-semibold"
                >
                  Mover para lixo
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="ml-auto text-muted-foreground hover:text-slate-700"
                >
                  Cancelar seleção
                </button>
              </div>
            )}

            <div
              className={`bg-white border border-border rounded-xl overflow-hidden transition ${
                dragOver ? "ring-2 ring-primary bg-primary/5" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                if (libView === "minha") setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-slate-50/60">
                <div className="col-span-6">Nome</div>
                <div className="col-span-2">Proprietário</div>
                <div className="col-span-2">Última modificação</div>
                <div className="col-span-2 text-right">Tamanho</div>
              </div>

              {viewItems.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-5xl mb-3">📂</div>
                  <div className="text-muted-foreground text-sm">
                    {libView === "lixo"
                      ? "Lixeira vazia"
                      : libView === "favoritos"
                      ? "Sem favoritos"
                      : "Solte os arquivos aqui para fazer upload"}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {viewItems.map((item) => (
                    <LibraryItemRow
                      key={item.id}
                      item={item}
                      isSelected={selectedIds.includes(item.id)}
                      onToggleSelect={toggleSelect}
                      onOpen={handleOpen}
                      onContextMenu={onContextMenu}
                      fileIcon={fileIcon}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-border rounded-lg shadow-xl z-50 py-1 w-56 text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item.trashed ? (
            <>
              <button
                onClick={() => {
                  handleRestore(contextMenu.item);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-accent/20"
              >
                ♻️ Restaurar
              </button>
              <button
                onClick={() => {
                  handleDeleteForever(contextMenu.item);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-accent/20 text-destructive"
              >
                🗑️ Eliminar permanentemente
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  handleOpen(contextMenu.item);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-accent/20"
              >
                📂 Abrir
              </button>
              {contextMenu.item.type === "file" && (
                <button
                  onClick={async () => {
                    const dataUrl = await idbGet(contextMenu.item.id);
                    if (dataUrl) {
                      handleDownload({ ...contextMenu.item, dataUrl });
                    } else {
                      showToast("Ficheiro não disponível");
                    }
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-accent/20"
                >
                  ⬇️ Fazer download
                </button>
              )}
              <button
                onClick={() => {
                  handleCopyLink(contextMenu.item);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-accent/20"
              >
                🔗 Obter link
              </button>
              <button
                onClick={() => {
                  openRename(contextMenu.item);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-accent/20"
              >
                ✏️ Renomear
              </button>
              <button
                onClick={() => {
                  setSelectedIds([contextMenu.item.id]);
                  setMoveOpen(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-accent/20"
              >
                📦 Mover para
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => {
                  handleToggleFavorite(contextMenu.item);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-accent/20"
              >
                {contextMenu.item.favorite ? "★ Remover dos favoritos" : "☆ Adicionar aos favoritos"}
              </button>
              <button
                onClick={() => {
                  handleTrash(contextMenu.item);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-accent/20 text-destructive"
              >
                🗑️ Remover
              </button>
            </>
          )}
        </div>
      )}

      {/* Modal: Nova pasta */}
      {newFolderOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-bold text-primary">Nova pasta</h3>
              {currentFolderId && libView === "minha" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Será criada dentro de:{" "}
                  <span className="font-semibold">{breadcrumb[breadcrumb.length - 1].name}</span>
                </p>
              )}
            </div>
            <div className="p-5">
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createFolder()}
                placeholder="Nome da pasta"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => {
                  setNewFolderOpen(false);
                  setNewFolderName("");
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-accent/20 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={createFolder}
                className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Renomear */}
      {renameOpen && renameTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-bold text-primary">Renomear</h3>
            </div>
            <div className="p-5">
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveRename()}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => {
                  setRenameOpen(false);
                  setRenameTarget(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-accent/20 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={saveRename}
                className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mover para */}
      {moveOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-bold text-primary">Mover para</h3>
            </div>
            <div className="p-5 max-h-80 overflow-y-auto">
              <button
                onClick={() => moveSelected(null)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/20 flex items-center gap-2 text-sm font-medium"
              >
                <span>🏠</span> Minha Biblioteca (raiz)
              </button>
              {getFoldersForMove(selectedIds).length === 0 && (
                <div className="text-xs text-muted-foreground py-3 text-center">Nenhuma pasta disponível</div>
              )}
              {getFoldersForMove(selectedIds).map((f) => (
                <button
                  key={f.id}
                  onClick={() => moveSelected(f.id)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/20 flex items-center gap-2 text-sm"
                >
                  <span>📁</span> {f.name}
                </button>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border flex justify-end">
              <button
                onClick={() => setMoveOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-accent/20 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Preview */}
      {previewItem && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {fileIcon(previewItem)}
                <span className="font-semibold truncate">{previewItem.name}</span>
                <span className="text-xs text-muted-foreground">· {formatSize(previewItem.size)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewItem)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  ⬇️ Download
                </button>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="text-muted-foreground hover:text-destructive font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-5 bg-slate-50 flex items-center justify-center">
              {previewItem.mimeType?.startsWith("image/") ? (
                <img
                  src={previewItem.dataUrl}
                  alt={previewItem.name}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : previewItem.mimeType === "application/pdf" ? (
                <iframe
                  src={previewItem.dataUrl}
                  title={previewItem.name}
                  className="w-full h-[70vh] border border-border rounded"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <div className="text-5xl mb-3">📄</div>
                  <div className="text-sm">Pré-visualização não disponível para este tipo de arquivo.</div>
                  <button
                    onClick={() => handleDownload(previewItem)}
                    className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Fazer download
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Exportar */}
      {exportOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-bold text-primary">Exportar Backup</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Exportar toda a biblioteca (metadados + ficheiros) para um ficheiro JSON
              </p>
            </div>
            <div className="p-5">
              <div className="text-sm text-slate-700">
                <p className="mb-2">Serão exportados:</p>
                <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
                  <li>{library.filter((i) => !i.trashed).length} itens (pastas e ficheiros)</li>
                  <li>{library.filter((i) => i.type === "file" && !i.trashed).length} ficheiros</li>
                </ul>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setExportOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-accent/20 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Importar */}
      {importOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-bold text-primary">Importar Backup</h3>
              <p className="text-xs text-muted-foreground mt-1">
                ⚠️ Atenção: Isto substituirá toda a biblioteca atual
              </p>
            </div>
            <div className="p-5">
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImport(file);
                }}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
              />
            </div>
            <div className="px-5 py-3 border-t border-border flex justify-end">
              <button
                onClick={() => setImportOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-accent/20 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
