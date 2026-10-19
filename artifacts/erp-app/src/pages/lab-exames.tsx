import React, { useState } from "react";
import { useListExamesCustom, useCreateExameCustom, useDeleteExameCustom, useGetSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Plus, FlaskConical, Trash2, ChevronDown, ChevronRight,
  Lock, Eye, Printer, Pencil, AlertTriangle, X, List,
} from "lucide-react";
import { EXAMES_BUILTIN, type ExameBuiltin, type Parametro } from "@/data/exames";
import { printExameTemplate } from "@/lib/lab-print";

const CATEGORIAS = [...new Set(EXAMES_BUILTIN.map((e) => e.categoria))];

/* ── types for custom exam rows ──────────────────────────── */
interface CustomExame {
  id: number;
  nome: string;
  categoria: string;
  ativo: boolean;
  parametros?: unknown;
}

/* ── compact action-button strip ─────────────────────────── */
function ActionButtons({
  onView,
  onPrint,
  onEdit,
  onDelete,
  isCustom = false,
}: {
  onView: () => void;
  onPrint: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isCustom?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
        title="Ver detalhes"
        onClick={(e) => { e.stopPropagation(); onView(); }}
      >
        <Eye size={13} />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-gray-400 hover:text-teal-600 hover:bg-teal-50"
        title="Imprimir modelo em branco"
        onClick={(e) => { e.stopPropagation(); onPrint(); }}
      >
        <Printer size={13} />
      </Button>
      {isCustom && onEdit && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-gray-400 hover:text-amber-600 hover:bg-amber-50"
          title="Editar exame"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
        >
          <Pencil size={13} />
        </Button>
      )}
      {isCustom && onDelete && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
          title="Eliminar exame"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 size={13} />
        </Button>
      )}
    </div>
  );
}

/* ── main component ───────────────────────────────────────── */
export default function LabExames() {
  const [search, setSearch] = useState("");
  const [openCateg, setOpenCateg] = useState<string | null>(CATEGORIAS[0] ?? null);
  const { toast } = useToast();

  /* dialog states */
  const [createOpen, setCreateOpen] = useState(false);
  const [viewExame, setViewExame] = useState<{ nome: string; categoria: string; parametros: Parametro[] } | null>(null);
  const [editExame, setEditExame] = useState<CustomExame | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CustomExame | null>(null);

  /* api */
  const { data: custom = [], refetch } = useListExamesCustom();
  const createMut = useCreateExameCustom();
  const deleteMut = useDeleteExameCustom();
  const { data: settingsData } = useGetSettings();

  /* forms */
  const [createForm, setCreateForm] = useState({ categoria: "", nome: "", parametrosRaw: "" });
  const [editForm, setEditForm] = useState({ categoria: "", nome: "", parametrosRaw: "" });

  /* helpers */
  const settings = {
    companyName: settingsData?.companyName ?? "ULTRACARDIO",
    nif: settingsData?.nif ?? "",
    email: settingsData?.email ?? null,
    phone: settingsData?.phone ?? null,
    address: settingsData?.address ?? null,
    logoUrl: settingsData?.logoUrl ?? null,
  };

  function parseParamsRaw(raw: string): Parametro[] {
    return raw.split("\n").map((l) => l.trim()).filter(Boolean).map((nome) => ({
      nome,
      unidade: "",
      tipo: "numerico" as const,
    }));
  }

  /* filtered lists */
  const filteredBuiltin = EXAMES_BUILTIN.filter(
    (e) => !search || e.nome.toLowerCase().includes(search.toLowerCase()) || e.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCustom = (custom as CustomExame[]).filter(
    (e) => !search || e.nome.toLowerCase().includes(search.toLowerCase()) || e.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const builtinByCateg = CATEGORIAS.reduce<Record<string, ExameBuiltin[]>>((acc, cat) => {
    acc[cat] = filteredBuiltin.filter((e) => e.categoria === cat);
    return acc;
  }, {});

  /* ── print price list ───────────────────────────────────── */
  function handlePrintLista() {
    const categorias = [...new Set(filteredBuiltin.map(e => e.categoria))];
    const companyName = settings.companyName;
    const nif = settings.nif;
    const now = new Date().toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric" });

    const rows = categorias.map(cat => {
      const items = filteredBuiltin.filter(e => e.categoria === cat);
      const rowsHtml = items.map(e => `
        <tr>
          <td class="code">${e.codigo ?? ""}</td>
          <td class="name">${e.nome}</td>
          <td class="prazo">${e.prazo ?? "—"}</td>
          <td class="price">${e.preco !== undefined ? new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 2 }).format(e.preco) : "—"}</td>
        </tr>`).join("");
      return `
        <tr class="cat-header">
          <td colspan="4">${cat}</td>
        </tr>
        ${rowsHtml}`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<title>Tabela de Preços — ${companyName}</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", Arial, sans-serif; font-size: 10px; color: #111; background: #fff; }

  header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 2.5px solid #1e40af; }
  header .brand { display: flex; flex-direction: column; gap: 2px; }
  header .brand h1 { font-size: 18px; font-weight: 800; color: #1e40af; letter-spacing: -0.3px; }
  header .brand p { font-size: 9px; color: #64748b; }
  header .meta { text-align: right; font-size: 9px; color: #64748b; line-height: 1.7; }
  header .meta strong { color: #111; }

  h2.title { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 10px; }

  table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  th { background: #1e3a8a; color: #fff; padding: 5px 7px; text-align: left; font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
  th.right { text-align: right; }
  td { padding: 4px 7px; vertical-align: top; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }

  tr.cat-header td { background: #dbeafe; color: #1e40af; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; padding: 5px 7px; border-bottom: 1px solid #bfdbfe; page-break-after: avoid; }
  td.code { color: #2563eb; font-family: "Courier New", monospace; font-size: 9px; width: 60px; white-space: nowrap; }
  td.name { color: #1e293b; }
  td.prazo { color: #64748b; width: 72px; text-align: center; white-space: nowrap; }
  td.price { text-align: right; font-family: "Courier New", monospace; font-weight: 600; color: #065f46; width: 100px; white-space: nowrap; }

  footer { margin-top: 14px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 8px; color: #94a3b8; }
  .page-break { page-break-before: always; }
</style>
</head>
<body>
<header>
  <div class="brand">
    <h1>${companyName}</h1>
    <p>NIF: ${nif}</p>
    <p>TABELA DE PREÇOS — ANÁLISES CLÍNICAS</p>
  </div>
  <div class="meta">
    <div>Data de emissão: <strong>${now}</strong></div>
    <div>Total de exames: <strong>${filteredBuiltin.length}</strong></div>
    <div>IVA incluído nos preços indicados</div>
  </div>
</header>

<table>
  <thead>
    <tr>
      <th style="width:60px">Código</th>
      <th>Designação do Exame</th>
      <th style="width:72px;text-align:center">Prazo</th>
      <th class="right" style="width:100px">Preço (Kz)</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>

<footer>
  <span>${companyName} · NIF ${nif}</span>
  <span>Tabela de preços emitida em ${now} · Preços sujeitos a alteração sem aviso prévio</span>
</footer>

<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) { toast({ title: "Active o pop-up para imprimir", variant: "destructive" }); return; }
    w.document.write(html);
    w.document.close();
  }

  /* handlers */
  function handlePrintBuiltin(exame: ExameBuiltin) {
    printExameTemplate(exame.nome, exame.categoria, exame.parametros, settings);
  }

  function handlePrintCustom(exame: CustomExame) {
    const params = Array.isArray(exame.parametros)
      ? (exame.parametros as Parametro[])
      : [];
    printExameTemplate(exame.nome, exame.categoria, params, settings);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.categoria.trim() || !createForm.nome.trim()) {
      toast({ title: "Categoria e nome são obrigatórios", variant: "destructive" });
      return;
    }
    try {
      await createMut.mutateAsync({
        data: {
          categoria: createForm.categoria,
          nome: createForm.nome,
          parametros: parseParamsRaw(createForm.parametrosRaw),
        },
      });
      toast({ title: "Exame personalizado criado" });
      setCreateForm({ categoria: "", nome: "", parametrosRaw: "" });
      setCreateOpen(false);
      refetch();
    } catch {
      toast({ title: "Erro ao criar exame", variant: "destructive" });
    }
  }

  function openEditDialog(exame: CustomExame) {
    const params = Array.isArray(exame.parametros)
      ? (exame.parametros as Parametro[]).map((p) => p.nome).join("\n")
      : "";
    setEditForm({ categoria: exame.categoria, nome: exame.nome, parametrosRaw: params });
    setEditExame(exame);
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await deleteMut.mutateAsync({ id: deleteConfirm.id });
      toast({ title: "Exame eliminado" });
      setDeleteConfirm(null);
      refetch();
    } catch {
      toast({ title: "Erro ao eliminar", variant: "destructive" });
    }
  }

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full">
      {/* toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white gap-4">
        <div className="relative w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Pesquisar exame ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setSearch("")}>
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{filteredBuiltin.length} exames standard</span>
          <span>·</span>
          <span>{filteredCustom.length} personalizados</span>
        </div>
        <Button size="sm" variant="outline" className="gap-2 ml-auto" onClick={handlePrintLista}>
          <Printer size={14} /> Imprimir Lista
        </Button>
        <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Novo Exame
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* ── BUILT-IN ─── */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Lock size={12} /> Catálogo Standard ({filteredBuiltin.length} exames em {CATEGORIAS.filter((c) => (builtinByCateg[c]?.length ?? 0) > 0).length} categorias)
          </h3>
          <div className="space-y-1.5">
            {CATEGORIAS.map((cat) => {
              const items = builtinByCateg[cat] ?? [];
              if (items.length === 0) return null;
              const isOpen = openCateg === cat;
              return (
                <div key={cat} className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                  <button
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenCateg(isOpen ? null : cat)}
                  >
                    <div className="flex items-center gap-3">
                      <FlaskConical size={14} className="text-blue-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-800">{cat}</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">{items.length}</Badge>
                    </div>
                    {isOpen
                      ? <ChevronDown size={13} className="text-gray-400" />
                      : <ChevronRight size={13} className="text-gray-400" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {items.map((exame) => (
                        <div key={exame.codigo ?? exame.nome} className="group flex items-center justify-between px-4 py-2 hover:bg-gray-50/60 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {exame.codigo && (
                              <span className="text-[10px] font-mono text-blue-500 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 flex-shrink-0">{exame.codigo}</span>
                            )}
                            <span className="text-sm text-gray-700 font-medium truncate">{exame.nome}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">{exame.parametros.length} parâm.</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {exame.prazo && (
                              <span className="text-[10px] text-gray-400 flex-shrink-0 hidden md:block">⏱ {exame.prazo}</span>
                            )}
                            {exame.preco !== undefined && (
                              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 flex-shrink-0 hidden sm:block">
                                {new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(exame.preco)}
                              </span>
                            )}
                            <div className="hidden sm:flex gap-1">
                              {exame.parametros.slice(0, 2).map((p) => (
                                <Badge key={p.nome} variant="outline" className="text-[10px] py-0 px-1.5 text-gray-400 hidden lg:inline-flex">
                                  {p.nome}
                                </Badge>
                              ))}
                              {exame.parametros.length > 2 && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-gray-300">
                                  +{exame.parametros.length - 2}
                                </Badge>
                              )}
                            </div>
                            <ActionButtons
                              onView={() => setViewExame(exame)}
                              onPrint={() => handlePrintBuiltin(exame)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CUSTOM ─── */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Plus size={12} /> Exames Personalizados ({filteredCustom.length})
          </h3>
          {filteredCustom.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-lg p-8 text-center">
              <FlaskConical size={24} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nenhum exame personalizado criado ainda.</p>
              <Button size="sm" variant="outline" className="mt-3 text-xs" onClick={() => setCreateOpen(true)}>
                <Plus size={12} className="mr-1" /> Criar primeiro exame
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredCustom.map((exame) => (
                <div key={exame.id} className="group bg-white border border-gray-100 rounded-lg flex items-center px-4 py-2.5 gap-3 shadow-sm hover:bg-gray-50/60 transition-colors">
                  <FlaskConical size={14} className="text-purple-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-800">{exame.nome}</span>
                    <span className="ml-2 text-xs text-gray-400">{exame.categoria}</span>
                  </div>
                  <Badge
                    variant={exame.ativo ? "default" : "outline"}
                    className={`text-[10px] flex-shrink-0 ${exame.ativo ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" : ""}`}
                  >
                    {exame.ativo ? "Activo" : "Inactivo"}
                  </Badge>
                  <ActionButtons
                    isCustom
                    onView={() => {
                      const params = Array.isArray(exame.parametros) ? (exame.parametros as Parametro[]) : [];
                      setViewExame({ nome: exame.nome, categoria: exame.categoria, parametros: params });
                    }}
                    onPrint={() => handlePrintCustom(exame)}
                    onEdit={() => openEditDialog(exame)}
                    onDelete={() => setDeleteConfirm(exame)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DIALOG — VIEW DETAILS
      ══════════════════════════════════════════════════════ */}
      <Dialog open={!!viewExame} onOpenChange={(o) => !o && setViewExame(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical size={16} className="text-blue-500" />
              {viewExame?.nome}
              <Badge variant="outline" className="text-xs ml-1">{viewExame?.categoria}</Badge>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detalhes e parâmetros do exame {viewExame?.nome}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-50 text-left">
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Parâmetro</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unidade</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Referência</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {viewExame?.parametros.map((p, i) => {
                  const ref = p.refMin && p.refMax
                    ? `${p.refMin} – ${p.refMax}`
                    : p.refMin
                      ? `≥ ${p.refMin}`
                      : p.refMax
                        ? `≤ ${p.refMax}`
                        : p.refTexto ?? "—";
                  return (
                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/40"}`}>
                      <td className="px-3 py-2 text-gray-800 font-medium">{p.nome}</td>
                      <td className="px-3 py-2 text-gray-500">{p.unidade || "—"}</td>
                      <td className="px-3 py-2 text-gray-500 text-center font-mono text-xs">{ref}</td>
                      <td className="px-3 py-2 text-center">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                          p.tipo === "numerico" ? "text-blue-600 border-blue-200" :
                          p.tipo === "selecao" ? "text-purple-600 border-purple-200" :
                          "text-gray-500 border-gray-200"
                        }`}>
                          {p.tipo === "numerico" ? "Numérico" : p.tipo === "selecao" ? "Selecção" : "Texto"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <DialogFooter className="pt-2 border-t">
            <span className="text-xs text-gray-400 mr-auto">{viewExame?.parametros.length} parâmetros</span>
            <Button variant="outline" size="sm" onClick={() => setViewExame(null)}>
              <X size={13} className="mr-1" /> Fechar
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-teal-600 hover:bg-teal-700"
              onClick={() => viewExame && printExameTemplate(viewExame.nome, viewExame.categoria, viewExame.parametros, settings)}
            >
              <Printer size={13} /> Imprimir Modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════
          DIALOG — CREATE EXAM
      ══════════════════════════════════════════════════════ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus size={16} className="text-blue-500" /> Novo Exame Personalizado
            </DialogTitle>
            <DialogDescription className="sr-only">
              Criar um novo exame personalizado com categoria, nome e parâmetros
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Input
                value={createForm.categoria}
                onChange={(e) => setCreateForm((f) => ({ ...f, categoria: e.target.value }))}
                placeholder="Ex: Hematologia, Bioquímica..."
                list="categorias-list"
              />
              <datalist id="categorias-list">
                {CATEGORIAS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label>Nome do Exame</Label>
              <Input
                value={createForm.nome}
                onChange={(e) => setCreateForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Nome do exame"
              />
            </div>
            <div className="space-y-1">
              <Label>Parâmetros <span className="text-gray-400 font-normal">(um por linha)</span></Label>
              <textarea
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={5}
                value={createForm.parametrosRaw}
                onChange={(e) => setCreateForm((f) => ({ ...f, parametrosRaw: e.target.value }))}
                placeholder={"Hemoglobina\nLeucocitos\nPlaquetas"}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMut.isPending}>
                {createMut.isPending ? "A criar..." : "Criar Exame"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════
          DIALOG — EDIT CUSTOM EXAM
      ══════════════════════════════════════════════════════ */}
      <Dialog open={!!editExame} onOpenChange={(o) => !o && setEditExame(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil size={16} className="text-amber-500" /> Editar Exame
            </DialogTitle>
            <DialogDescription className="sr-only">
              Editar categoria, nome e parâmetros do exame personalizado
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!editExame) return;
              if (!editForm.categoria.trim() || !editForm.nome.trim()) {
                toast({ title: "Categoria e nome são obrigatórios", variant: "destructive" });
                return;
              }
              try {
                /* We delete + recreate since there is no PATCH endpoint yet */
                await deleteMut.mutateAsync({ id: editExame.id });
                await createMut.mutateAsync({
                  data: {
                    categoria: editForm.categoria,
                    nome: editForm.nome,
                    parametros: parseParamsRaw(editForm.parametrosRaw),
                  },
                });
                toast({ title: "Exame actualizado" });
                setEditExame(null);
                refetch();
              } catch {
                toast({ title: "Erro ao actualizar exame", variant: "destructive" });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Input
                value={editForm.categoria}
                onChange={(e) => setEditForm((f) => ({ ...f, categoria: e.target.value }))}
                list="categorias-list-edit"
              />
              <datalist id="categorias-list-edit">
                {CATEGORIAS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label>Nome do Exame</Label>
              <Input
                value={editForm.nome}
                onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Parâmetros <span className="text-gray-400 font-normal">(um por linha)</span></Label>
              <textarea
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                rows={6}
                value={editForm.parametrosRaw}
                onChange={(e) => setEditForm((f) => ({ ...f, parametrosRaw: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditExame(null)}>Cancelar</Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600" disabled={createMut.isPending || deleteMut.isPending}>
                {(createMut.isPending || deleteMut.isPending) ? "A guardar..." : "Guardar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════
          DIALOG — DELETE CONFIRMATION
      ══════════════════════════════════════════════════════ */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={16} /> Eliminar Exame
            </DialogTitle>
            <DialogDescription className="sr-only">
              Confirmar eliminação do exame personalizado — acção irreversível
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Tem a certeza que pretende eliminar o exame{" "}
            <strong className="text-gray-800">"{deleteConfirm?.nome}"</strong>?
            Esta acção não pode ser revertida.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "A eliminar..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
