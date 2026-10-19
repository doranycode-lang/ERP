import React, { useState, useMemo } from "react";
import {
  useListResultados,
  useListPacientes,
  useCreateResultado,
  useUpdateResultado,
  useDeleteResultado,
  useGetSettings,
} from "@workspace/api-client-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  FlaskConical,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  FileText,
  Search,
  Printer,
} from "lucide-react";
import { useLocation } from "wouter";
import { EXAMES_BUILTIN } from "@/data/exames";
import { useListExamesCustom } from "@workspace/api-client-react";
import { printLabReport } from "@/lib/lab-print";

interface ParametroValor {
  nome: string;
  valor: string;
  unidade?: string;
  refMin?: string;
  refMax?: string;
  tipo?: string;
  opcoes?: string[];
}

interface ResultadoItem {
  id: number;
  pacienteId: number;
  pacienteNome?: string | null;
  data?: string | null;
  dataEmissao?: string | null;
  tecnicoNome?: string | null;
  observacoes?: string | null;
  estado?: string | null;
  parametros?: unknown;
}

function ResultadosList({
  resultados,
  filterEstado,
  searchText,
  onEmitir,
  onPrint,
  onView,
  onDelete,
  onOpenCreate,
}: {
  resultados: ResultadoItem[];
  filterEstado: "" | "rascunho" | "emitido";
  searchText: string;
  onEmitir: (id: number) => void;
  onPrint: (r: ResultadoItem) => void;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
  onOpenCreate: () => void;
}) {
  const filtered = resultados.filter((r) => {
    if (filterEstado && r.estado !== filterEstado) return false;
    if (searchText && !(r.pacienteNome ?? "").toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });
  const rascunhos = resultados.filter((r) => r.estado === "rascunho").length;
  const emitidos = resultados.filter((r) => r.estado === "emitido").length;

  if (resultados.length === 0) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
          <FlaskConical size={48} className="opacity-30" />
          <p className="text-sm">Nenhum resultado registado</p>
          <Button size="sm" variant="outline" onClick={onOpenCreate}>
            <Plus size={14} className="mr-2" /> Lançar primeiro resultado
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <span className="font-medium text-gray-700">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </span>
        {rascunhos > 0 && (
          <span className="text-amber-600">{rascunhos} rascunho{rascunhos !== 1 ? "s" : ""}</span>
        )}
        {emitidos > 0 && (
          <span className="text-green-600">{emitidos} emitido{emitidos !== 1 ? "s" : ""}</span>
        )}
        {filtered.length === 0 && (
          <span className="text-gray-400 ml-2">Nenhum resultado corresponde aos filtros</span>
        )}
      </div>
      <div className="space-y-3">
        {filtered.map((r) => {
          const params = (r.parametros as ParametroValor[]) ?? [];
          const filled = params.filter((p) => p.valor).length;
          return (
            <div
              key={r.id}
              className="bg-white border border-gray-100 rounded-lg p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FlaskConical size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm">
                    {r.pacienteNome || "Paciente #" + r.pacienteId}
                  </span>
                  <Badge
                    variant={r.estado === "emitido" ? "default" : "outline"}
                    className={`text-[10px] py-0 ${
                      r.estado === "emitido"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "text-amber-600 border-amber-200"
                    }`}
                  >
                    {r.estado === "emitido" ? "Emitido" : "Rascunho"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-gray-500">Data: {r.data || "—"}</span>
                  <span className="text-xs text-gray-500">
                    {filled}/{params.length} parâmetros preenchidos
                  </span>
                  {r.tecnicoNome && (
                    <span className="text-xs text-gray-500">Técnico: {r.tecnicoNome}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {r.estado === "rascunho" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs text-green-700 border-green-200 hover:bg-green-50"
                    onClick={() => onEmitir(r.id)}
                  >
                    <CheckCircle size={12} /> Emitir
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                  onClick={() => onPrint(r)}
                  title="Gerar PDF"
                >
                  <Printer size={12} /> PDF
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => onView(r.id)}
                >
                  <Eye size={14} className="text-gray-500" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:text-red-600"
                  onClick={() => onDelete(r.id)}
                >
                  <Trash2 size={14} className="text-gray-400" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LabResultados() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const prefilledPacienteId = searchParams.get("pacienteId")
    ? parseInt(searchParams.get("pacienteId")!, 10)
    : undefined;
  const prefilledPacienteNome = searchParams.get("pacienteNome")
    ? decodeURIComponent(searchParams.get("pacienteNome")!)
    : "";

  const [filterPacienteId, setFilterPacienteId] = useState<number | undefined>(prefilledPacienteId);
  const [filterEstado, setFilterEstado] = useState<"" | "rascunho" | "emitido">("");
  const [searchText, setSearchText] = useState("");
  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchPac, setSearchPac] = useState(prefilledPacienteNome);
  const { toast } = useToast();

  const { data: resultados = [], refetch } = useListResultados({
    pacienteId: filterPacienteId,
  });
  const { data: pacientes = [] } = useListPacientes();
  const { data: examesCustom = [] } = useListExamesCustom();
  const { data: settings } = useGetSettings();
  const createMut = useCreateResultado();
  const updateMut = useUpdateResultado();
  const deleteMut = useDeleteResultado();

  function handlePrint(resultado: typeof resultados[0]) {
    const pac = pacientes.find((p) => p.id === resultado.pacienteId) ?? null;
    printLabReport(
      {
        id: resultado.id,
        pacienteNome: resultado.pacienteNome ?? pac?.nome ?? `Paciente #${resultado.pacienteId}`,
        data: resultado.data ?? undefined,
        dataEmissao: resultado.dataEmissao ?? undefined,
        tecnicoNome: resultado.tecnicoNome ?? undefined,
        observacoes: resultado.observacoes ?? undefined,
        estado: resultado.estado ?? "rascunho",
        parametros: (resultado.parametros as ParametroValor[]) ?? [],
      },
      pac ? {
        nome: pac.nome,
        nasc: pac.nasc ?? undefined,
        sexo: pac.sexo ?? undefined,
        bi: pac.bi ?? undefined,
        nif: pac.nif ?? undefined,
        nacionalidade: pac.nacionalidade ?? undefined,
        profissao: pac.profissao ?? undefined,
        telefone: pac.telefone ?? undefined,
        email: pac.email ?? undefined,
        endereco: pac.endereco ?? undefined,
        grupoSanguineo: pac.grupoSanguineo ?? undefined,
        fatorRh: pac.fatorRh ?? undefined,
        alergias: pac.alergias ?? undefined,
        patologiasCronicas: pac.patologiasCronicas ?? undefined,
        medicacaoHabitual: pac.medicacaoHabitual ?? undefined,
      } : null,
      {
        companyName: settings?.companyName ?? "ULTRACARDIO",
        nif: settings?.nif ?? "",
        email: settings?.email,
        phone: settings?.phone,
        address: settings?.address,
      }
    );
  }

  const allExames = useMemo(() => {
    const custom = examesCustom
      .filter((e) => e.ativo)
      .map((e) => ({
        categoria: e.categoria,
        nome: e.nome,
        parametros: (e.parametros as ParametroValor[]) ?? [],
      }));
    return [...EXAMES_BUILTIN, ...custom];
  }, [examesCustom]);

  const [form, setForm] = useState({
    pacienteId: prefilledPacienteId ?? 0,
    pacienteNome: prefilledPacienteNome,
    data: new Date().toISOString().slice(0, 10),
    dataEmissao: new Date().toISOString().slice(0, 10),
    tecnicoNome: "",
    observacoes: "",
    estado: "rascunho" as "rascunho" | "emitido",
    parametros: [] as ParametroValor[],
  });
  const [selectedExame, setSelectedExame] = useState<string>("");
  const [openCateg, setOpenCateg] = useState<string | null>(null);
  const [exameSearch, setExameSearch] = useState("");

  const categorias = useMemo(
    () => [...new Set(allExames.map((e) => e.categoria))],
    [allExames]
  );

  function openCreate() {
    setForm({
      pacienteId: prefilledPacienteId ?? 0,
      pacienteNome: prefilledPacienteNome,
      data: new Date().toISOString().slice(0, 10),
      dataEmissao: new Date().toISOString().slice(0, 10),
      tecnicoNome: "",
      observacoes: "",
      estado: "rascunho",
      parametros: [],
    });
    setSelectedExame("");
    setExameSearch("");
    setOpenCateg(null);
    setOpen(true);
  }

  function addExame(exame: (typeof allExames)[0]) {
    const newParams: ParametroValor[] = exame.parametros.map((p) => ({
      nome: p.nome,
      valor: "",
      unidade: p.unidade,
      refMin: p.refMin,
      refMax: p.refMax,
      tipo: p.tipo,
      opcoes: p.opcoes,
    }));
    setForm((f) => ({
      ...f,
      parametros: [
        ...f.parametros,
        ...newParams.filter(
          (np) => !f.parametros.some((ep) => ep.nome === np.nome)
        ),
      ],
    }));
    setSelectedExame(exame.nome);
    toast({ title: `${exame.nome} adicionado` });
  }

  function updateParam(nome: string, valor: string) {
    setForm((f) => ({
      ...f,
      parametros: f.parametros.map((p) =>
        p.nome === nome ? { ...p, valor } : p
      ),
    }));
  }

  function removeParam(nome: string) {
    setForm((f) => ({
      ...f,
      parametros: f.parametros.filter((p) => p.nome !== nome),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pacienteId) {
      toast({ title: "Seleccione um paciente", variant: "destructive" });
      return;
    }
    try {
      await createMut.mutateAsync({
        data: {
          pacienteId: form.pacienteId,
          pacienteNome: form.pacienteNome,
          data: form.data,
          dataEmissao: form.dataEmissao,
          tecnicoNome: form.tecnicoNome,
          observacoes: form.observacoes,
          estado: form.estado,
          parametros: form.parametros as unknown[],
        },
      });
      toast({ title: "Resultado registado" });
      setOpen(false);
      refetch();
    } catch {
      toast({ title: "Erro ao guardar resultado", variant: "destructive" });
    }
  }

  async function emitir(id: number) {
    try {
      await updateMut.mutateAsync({ id, data: { estado: "emitido" } });
      toast({ title: "Resultado emitido" });
      refetch();
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync({ id: deleteId });
      toast({ title: "Resultado eliminado" });
      setDeleteId(null);
      refetch();
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  }

  const viewResultado = resultados.find((r) => r.id === viewId);

  const filteredExames = allExames.filter(
    (e) =>
      !exameSearch ||
      e.nome.toLowerCase().includes(exameSearch.toLowerCase()) ||
      e.categoria.toLowerCase().includes(exameSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="border border-gray-200 rounded-md pl-8 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
              placeholder="Pesquisar paciente..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
            value={filterPacienteId ?? ""}
            onChange={(e) => {
              const id = e.target.value ? parseInt(e.target.value, 10) : undefined;
              setFilterPacienteId(id);
            }}
          >
            <option value="">Todos os pacientes</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as "" | "rascunho" | "emitido")}
          >
            <option value="">Todos os estados</option>
            <option value="rascunho">Rascunho</option>
            <option value="emitido">Emitido</option>
          </select>
        </div>
        <Button
          size="sm"
          className="gap-2 bg-blue-600 hover:bg-blue-700"
          onClick={openCreate}
        >
          <Plus size={14} /> Novo Resultado
        </Button>
      </div>

      <ResultadosList
        resultados={resultados}
        filterEstado={filterEstado}
        searchText={searchText}
        onEmitir={emitir}
        onPrint={handlePrint}
        onView={(id) => setViewId(id)}
        onDelete={(id) => setDeleteId(id)}
        onOpenCreate={openCreate}
      />

      {/* Create Result Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Lançar Resultado</DialogTitle>
            <DialogDescription className="sr-only">
              Lançar novo resultado laboratorial para um paciente
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-hidden flex flex-col gap-4"
          >
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Paciente *</Label>
                <select
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.pacienteId || ""}
                  onChange={(e) => {
                    const id = parseInt(e.target.value, 10);
                    const pac = pacientes.find((p) => p.id === id);
                    setForm((f) => ({
                      ...f,
                      pacienteId: id,
                      pacienteNome: pac?.nome ?? "",
                    }));
                  }}
                >
                  <option value="">— Seleccionar paciente —</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Data Colheita</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Data Emissão</Label>
                <Input
                  type="date"
                  value={form.dataEmissao}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dataEmissao: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Técnico</Label>
                <Input
                  value={form.tecnicoNome}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tecnicoNome: e.target.value }))
                  }
                  placeholder="Nome do técnico"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Observações</Label>
                <Input
                  value={form.observacoes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, observacoes: e.target.value }))
                  }
                  placeholder="Observações gerais..."
                />
              </div>
              <div className="space-y-1">
                <Label>Estado</Label>
                <select
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.estado}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      estado: e.target.value as "rascunho" | "emitido",
                    }))
                  }
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="emitido">Emitido</option>
                </select>
              </div>
            </div>

            {/* Exame selector + params panel */}
            <div className="flex-1 overflow-hidden flex gap-4 min-h-0">
              {/* Left: catalog */}
              <div className="w-64 flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                <div className="p-2 border-b bg-gray-50">
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      className="pl-8 h-7 text-xs"
                      placeholder="Pesquisar exame..."
                      value={exameSearch}
                      onChange={(e) => setExameSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {categorias.map((cat) => {
                    const items = filteredExames.filter(
                      (e) => e.categoria === cat
                    );
                    if (items.length === 0) return null;
                    const isOpen = openCateg === cat;
                    return (
                      <div key={cat}>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 border-b border-gray-100"
                          onClick={() =>
                            setOpenCateg(isOpen ? null : cat)
                          }
                        >
                          <span>{cat}</span>
                          {isOpen ? (
                            <ChevronDown size={12} />
                          ) : (
                            <ChevronRight size={12} />
                          )}
                        </button>
                        {isOpen &&
                          items.map((exame) => (
                            <button
                              key={exame.nome}
                              type="button"
                              onClick={() => addExame(exame)}
                              className={`w-full text-left px-4 py-2 text-xs hover:bg-blue-50 transition-colors border-b border-gray-50 ${
                                selectedExame === exame.nome
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-700"
                              }`}
                            >
                              {exame.nome}
                            </button>
                          ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: params */}
              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                <div className="px-4 py-2 border-b bg-gray-50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">
                    Parâmetros ({form.parametros.filter((p) => p.valor).length}/
                    {form.parametros.length} preenchidos)
                  </span>
                  {form.parametros.length > 0 && (
                    <button
                      type="button"
                      className="text-xs text-red-500 hover:text-red-700"
                      onClick={() =>
                        setForm((f) => ({ ...f, parametros: [] }))
                      }
                    >
                      Limpar tudo
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  {form.parametros.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                      <FlaskConical size={32} className="opacity-30" />
                      <p className="text-xs text-center">
                        Seleccione exames do catálogo à esquerda para adicionar parâmetros
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {form.parametros.map((p) => (
                        <div
                          key={p.nome}
                          className="flex items-center gap-3 bg-gray-50 rounded-md px-3 py-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-700 truncate">
                                {p.nome}
                              </span>
                              {p.unidade && (
                                <span className="text-[10px] text-gray-400">
                                  ({p.unidade})
                                </span>
                              )}
                            </div>
                            {(p.refMin || p.refMax) && (
                              <span className="text-[10px] text-gray-400">
                                Ref: {p.refMin || ""}
                                {p.refMin && p.refMax ? " – " : ""}
                                {p.refMax || ""}
                              </span>
                            )}
                          </div>
                          <div className="w-36">
                            {p.tipo === "selecao" && p.opcoes ? (
                              <select
                                className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={p.valor}
                                onChange={(e) =>
                                  updateParam(p.nome, e.target.value)
                                }
                              >
                                <option value="">— Selec. —</option>
                                {p.opcoes.map((o) => (
                                  <option key={o} value={o}>
                                    {o}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Input
                                className="h-7 text-xs"
                                value={p.valor}
                                onChange={(e) =>
                                  updateParam(p.nome, e.target.value)
                                }
                                placeholder={p.tipo === "texto" ? "Resultado..." : "Valor..."}
                              />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeParam(p.nome)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createMut.isPending}
              >
                Guardar Resultado
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewResultado && (
        <Dialog open={!!viewId} onOpenChange={() => setViewId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-3 pr-6">
                <DialogTitle className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  Resultado — {viewResultado.pacienteNome || "Paciente #" + viewResultado.pacienteId}
                </DialogTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs text-blue-700 border-blue-200 hover:bg-blue-50 flex-shrink-0"
                  onClick={() => handlePrint(viewResultado)}
                >
                  <Printer size={13} /> Gerar PDF
                </Button>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm border-b pb-4">
                <div>
                  <span className="text-gray-500">Data Colheita:</span>{" "}
                  <span className="font-medium">{viewResultado.data || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Data Emissão:</span>{" "}
                  <span className="font-medium">{viewResultado.dataEmissao || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Técnico:</span>{" "}
                  <span className="font-medium">{viewResultado.tecnicoNome || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Estado:</span>{" "}
                  <Badge
                    variant={viewResultado.estado === "emitido" ? "default" : "outline"}
                    className={`text-[10px] ${viewResultado.estado === "emitido" ? "bg-green-100 text-green-700" : "text-amber-600"}`}
                  >
                    {viewResultado.estado === "emitido" ? "Emitido" : "Rascunho"}
                  </Badge>
                </div>
                {viewResultado.observacoes && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Observações:</span>{" "}
                    <span className="font-medium">{viewResultado.observacoes}</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Parâmetros{" "}
                  <span className="font-normal text-gray-400 text-xs">
                    (apenas preenchidos no PDF)
                  </span>
                </h4>
                <div className="space-y-1">
                  {((viewResultado.parametros as ParametroValor[]) ?? [])
                    .filter((p) => p.valor)
                    .map((p) => {
                      const v = parseFloat(p.valor);
                      const lo = p.refMin ? parseFloat(p.refMin) : null;
                      const hi = p.refMax ? parseFloat(p.refMax) : null;
                      let flag = "";
                      let flagColor = "";
                      if (!isNaN(v) && lo !== null && hi !== null) {
                        if (v < lo) { flag = "↓ Baixo"; flagColor = "text-red-600"; }
                        else if (v > hi) { flag = "↑ Alto"; flagColor = "text-red-600"; }
                        else { flag = "Normal"; flagColor = "text-green-600"; }
                      }
                      return (
                        <div
                          key={p.nome}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700">{p.nome}</span>
                            {p.unidade && (
                              <span className="text-gray-400 text-xs">({p.unidade})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{p.valor}</span>
                            {(p.refMin || p.refMax) && (
                              <span className="text-gray-400 text-xs">
                                ref: {p.refMin || ""}
                                {p.refMin && p.refMax ? "–" : ""}
                                {p.refMax || ""}
                              </span>
                            )}
                            {flag && (
                              <span className={`text-xs font-semibold ${flagColor}`}>{flag}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {((viewResultado.parametros as ParametroValor[]) ?? []).filter((p) => !p.valor).length > 0 && (
                    <p className="text-xs text-gray-400 pt-1 pl-1">
                      + {((viewResultado.parametros as ParametroValor[]) ?? []).filter((p) => !p.valor).length} parâmetros sem valor (não aparecem no PDF)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Resultado</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acção é irreversível. O resultado será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
