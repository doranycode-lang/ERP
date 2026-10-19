import React, { useState } from "react";
import { useListPacientes, useCreatePaciente, useUpdatePaciente, useDeletePaciente } from "@workspace/api-client-react";
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
import { Search, Plus, User, Phone, Mail, Trash2, Edit, FlaskConical } from "lucide-react";
import { useLocation } from "wouter";

const SEXO_OPTS = ["Masculino", "Feminino", "Outro"];
const ESTADO_CIVIL_OPTS = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União de Facto"];
const GRUPO_SANGUINEO_OPTS = ["A", "B", "AB", "O"];
const FATOR_RH_OPTS = ["Positivo (+)", "Negativo (-)"];

const EMPTY_FORM = {
  nome: "",
  nasc: "",
  sexo: "",
  bi: "",
  nif: "",
  nacionalidade: "Angolana",
  estadoCivil: "",
  profissao: "",
  telefone: "",
  telefone2: "",
  email: "",
  endereco: "",
  grupoSanguineo: "",
  fatorRh: "",
  alergias: "",
  patologiasCronicas: "",
  medicacaoHabitual: "",
  contactoEmergenciaNome: "",
  contactoEmergenciaTel: "",
  empresa: "",
  processo: "",
  medico: "",
  nAmostra: "",
  recolha: "",
};

export default function LabPacientes() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [tab, setTab] = useState<"pessoal" | "clinico" | "laboratorial">("pessoal");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: pacientes = [], refetch } = useListPacientes({ search: search || undefined });
  const createMut = useCreatePaciente();
  const updateMut = useUpdatePaciente();
  const deleteMut = useDeletePaciente();

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setTab("pessoal");
    setOpen(true);
  }

  function openEdit(p: (typeof pacientes)[0]) {
    setEditId(p.id);
    setForm({
      nome: p.nome ?? "",
      nasc: p.nasc ?? "",
      sexo: p.sexo ?? "",
      bi: p.bi ?? "",
      nif: p.nif ?? "",
      nacionalidade: p.nacionalidade ?? "Angolana",
      estadoCivil: p.estadoCivil ?? "",
      profissao: p.profissao ?? "",
      telefone: p.telefone ?? "",
      telefone2: p.telefone2 ?? "",
      email: p.email ?? "",
      endereco: p.endereco ?? "",
      grupoSanguineo: p.grupoSanguineo ?? "",
      fatorRh: p.fatorRh ?? "",
      alergias: p.alergias ?? "",
      patologiasCronicas: p.patologiasCronicas ?? "",
      medicacaoHabitual: p.medicacaoHabitual ?? "",
      contactoEmergenciaNome: p.contactoEmergenciaNome ?? "",
      contactoEmergenciaTel: p.contactoEmergenciaTel ?? "",
      empresa: p.empresa ?? "",
      processo: p.processo ?? "",
      medico: p.medico ?? "",
      nAmostra: p.nAmostra ?? "",
      recolha: p.recolha ?? "",
    });
    setTab("pessoal");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    try {
      if (editId) {
        await updateMut.mutateAsync({ id: editId, data: form });
        toast({ title: "Paciente actualizado" });
      } else {
        await createMut.mutateAsync({ data: form });
        toast({ title: "Paciente criado" });
      }
      setOpen(false);
      refetch();
    } catch {
      toast({ title: "Erro ao guardar paciente", variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync({ id: deleteId });
      toast({ title: "Paciente eliminado" });
      setDeleteId(null);
      refetch();
    } catch {
      toast({ title: "Erro ao eliminar", variant: "destructive" });
    }
  }

  const F = (field: keyof typeof EMPTY_FORM) => (
    <Input
      value={form[field]}
      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
    />
  );

  const Sel = (field: keyof typeof EMPTY_FORM, opts: string[]) => (
    <select
      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={form[field]}
      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
    >
      <option value="">— Seleccionar —</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Pesquisar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
          <Plus size={14} /> Novo Paciente
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {pacientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
            <User size={48} className="opacity-30" />
            <p className="text-sm">{search ? "Nenhum paciente encontrado" : "Nenhum paciente registado"}</p>
            {!search && (
              <Button size="sm" variant="outline" onClick={openCreate}>
                <Plus size={14} className="mr-2" /> Registar primeiro paciente
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pacientes.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-lg border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{p.nome}</span>
                    {p.sexo && (
                      <Badge variant="outline" className="text-[10px] py-0">
                        {p.sexo}
                      </Badge>
                    )}
                    {p.grupoSanguineo && (
                      <Badge className="text-[10px] py-0 bg-red-50 text-red-700 border-red-200">
                        {p.grupoSanguineo}{p.fatorRh?.includes("+") ? "+" : p.fatorRh?.includes("-") ? "-" : ""}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    {p.nasc && <span className="text-xs text-gray-500">Nasc.: {p.nasc}</span>}
                    {p.bi && <span className="text-xs text-gray-500">BI: {p.bi}</span>}
                    {p.processo && <span className="text-xs text-gray-500">Processo: {p.processo}</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-0.5">
                    {p.telefone && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Phone size={10} /> {p.telefone}
                      </span>
                    )}
                    {p.email && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Mail size={10} /> {p.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => setLocation(`/lab/resultados?pacienteId=${p.id}&pacienteNome=${encodeURIComponent(p.nome)}`)}
                  >
                    <FlaskConical size={12} /> Resultados
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                    <Edit size={14} className="text-gray-500" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:text-red-600"
                    onClick={() => setDeleteId(p.id)}
                  >
                    <Trash2 size={14} className="text-gray-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Paciente" : "Novo Paciente"}</DialogTitle>
            <DialogDescription className="sr-only">
              {editId ? "Editar dados do paciente" : "Registar novo paciente no sistema"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-1 border-b pb-3 mb-4">
            {(["pessoal", "clinico", "laboratorial"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  tab === t
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {t === "pessoal" ? "Dados Pessoais" : t === "clinico" ? "Dados Clínicos" : "Dados Lab"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "pessoal" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <Label>Nome Completo *</Label>
                    <Input
                      value={form.nome}
                      onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                      placeholder="Nome completo do paciente"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Data de Nascimento</Label>
                    <Input type="date" value={form.nasc} onChange={(e) => setForm((f) => ({ ...f, nasc: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Sexo</Label>
                    {Sel("sexo", SEXO_OPTS)}
                  </div>
                  <div className="space-y-1">
                    <Label>BI / Passaporte</Label>
                    {F("bi")}
                  </div>
                  <div className="space-y-1">
                    <Label>NIF</Label>
                    {F("nif")}
                  </div>
                  <div className="space-y-1">
                    <Label>Nacionalidade</Label>
                    {F("nacionalidade")}
                  </div>
                  <div className="space-y-1">
                    <Label>Estado Civil</Label>
                    {Sel("estadoCivil", ESTADO_CIVIL_OPTS)}
                  </div>
                  <div className="space-y-1">
                    <Label>Profissão</Label>
                    {F("profissao")}
                  </div>
                  <div className="space-y-1">
                    <Label>Empresa</Label>
                    {F("empresa")}
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone</Label>
                    {F("telefone")}
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone 2</Label>
                    {F("telefone2")}
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Email</Label>
                    {F("email")}
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Endereço</Label>
                    {F("endereco")}
                  </div>
                  <div className="space-y-1">
                    <Label>Contacto de Emergência (Nome)</Label>
                    {F("contactoEmergenciaNome")}
                  </div>
                  <div className="space-y-1">
                    <Label>Contacto de Emergência (Tel.)</Label>
                    {F("contactoEmergenciaTel")}
                  </div>
                </div>
              </>
            )}

            {tab === "clinico" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Grupo Sanguíneo</Label>
                  {Sel("grupoSanguineo", GRUPO_SANGUINEO_OPTS)}
                </div>
                <div className="space-y-1">
                  <Label>Fator Rh</Label>
                  {Sel("fatorRh", FATOR_RH_OPTS)}
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Alergias</Label>
                  <textarea
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    value={form.alergias}
                    onChange={(e) => setForm((f) => ({ ...f, alergias: e.target.value }))}
                    placeholder="Alergias conhecidas..."
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Patologias Crónicas</Label>
                  <textarea
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    value={form.patologiasCronicas}
                    onChange={(e) => setForm((f) => ({ ...f, patologiasCronicas: e.target.value }))}
                    placeholder="Doenças crónicas conhecidas..."
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Medicação Habitual</Label>
                  <textarea
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    value={form.medicacaoHabitual}
                    onChange={(e) => setForm((f) => ({ ...f, medicacaoHabitual: e.target.value }))}
                    placeholder="Medicação habitual..."
                  />
                </div>
                <div className="space-y-1">
                  <Label>Médico Referente</Label>
                  {F("medico")}
                </div>
              </div>
            )}

            {tab === "laboratorial" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Nº Processo</Label>
                  {F("processo")}
                </div>
                <div className="space-y-1">
                  <Label>Nº Amostra</Label>
                  {F("nAmostra")}
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Local/Tipo de Recolha</Label>
                  {F("recolha")}
                </div>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMut.isPending || updateMut.isPending}>
                {editId ? "Guardar Alterações" : "Criar Paciente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acção é irreversível. O paciente e todos os seus dados serão eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
