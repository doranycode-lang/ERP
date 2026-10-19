import React, { useState, useEffect } from "react";
import {
  useListClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  getListClientsQueryKey,
  getGetClientQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";

type FormState = {
  name: string; nif: string; email: string; phone: string;
  address: string; city: string; country: string; notes: string;
};

const EMPTY_FORM: FormState = {
  name: "", nif: "", email: "", phone: "", address: "", city: "", country: "Angola", notes: "",
};

export default function Clientes() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    const handler = () => setShowCreate(true);
    document.addEventListener("erp:open-create", handler);
    return () => document.removeEventListener("erp:open-create", handler);
  }, []);

  const { data: clients = [], isLoading } = useListClients({ search: search || undefined });

  const createClient = useCreateClient({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListClientsQueryKey() });
        setShowCreate(false);
        setForm(EMPTY_FORM);
        toast({ title: "Cliente criado com sucesso" });
      },
      onError: () => toast({ title: "Erro ao criar cliente", variant: "destructive" }),
    },
  });

  const updateClient = useUpdateClient({
    mutation: {
      onSuccess: (_, vars) => {
        qc.invalidateQueries({ queryKey: getListClientsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetClientQueryKey(vars.id) });
        setEditId(null);
        setForm(EMPTY_FORM);
        toast({ title: "Cliente atualizado" });
      },
      onError: () => toast({ title: "Erro ao atualizar cliente", variant: "destructive" }),
    },
  });

  const deleteClient = useDeleteClient({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListClientsQueryKey() });
        toast({ title: "Cliente eliminado" });
      },
      onError: () => toast({ title: "Erro ao eliminar", variant: "destructive" }),
    },
  });

  function openEdit(c: (typeof clients)[0]) {
    setForm({
      name: c.name,
      nif: c.nif ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      city: c.city ?? "",
      country: c.country ?? "Angola",
      notes: c.notes ?? "",
    });
    setEditId(c.id);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createClient.mutate({
      data: {
        name: form.name,
        nif: form.nif || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        notes: form.notes || undefined,
      },
    });
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    updateClient.mutate({
      id: editId,
      data: {
        name: form.name,
        nif: form.nif || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        notes: form.notes || undefined,
      },
    });
  }

  function handleDelete(id: number) {
    if (confirm("Eliminar este cliente?")) deleteClient.mutate({ id });
  }

  const FormFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 space-y-1">
        <Label>Nome *</Label>
        <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do cliente" />
      </div>
      <div className="space-y-1">
        <Label>NIF</Label>
        <Input value={form.nif} onChange={e => setForm(f => ({ ...f, nif: e.target.value }))} placeholder="NIF fiscal" />
      </div>
      <div className="space-y-1">
        <Label>Telefone</Label>
        <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+244 ..." />
      </div>
      <div className="col-span-2 space-y-1">
        <Label>Email</Label>
        <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
      </div>
      <div className="col-span-2 space-y-1">
        <Label>Morada</Label>
        <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Morada completa" />
      </div>
      <div className="space-y-1">
        <Label>Cidade</Label>
        <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Ex: Luanda" />
      </div>
      <div className="space-y-1">
        <Label>País</Label>
        <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
      </div>
      <div className="col-span-2 space-y-1">
        <Label>Notas</Label>
        <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observações..." />
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Clientes</h2>
        <Button onClick={() => { setForm(EMPTY_FORM); setShowCreate(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus size={16} className="mr-2" /> Novo Cliente
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input className="pl-9" placeholder="Pesquisar clientes..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">NIF</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Telefone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Cidade</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">A carregar...</td></tr>
            )}
            {!isLoading && clients.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center py-16 text-gray-400">
                    <Users size={40} className="mb-3 opacity-40" />
                    <p className="font-medium">Nenhum cliente encontrado</p>
                    <p className="text-sm mt-1">Adicione o primeiro cliente</p>
                  </div>
                </td>
              </tr>
            )}
            {clients.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.nif || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.email || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.city || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600" onClick={() => openEdit(c)}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(c.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={v => { setShowCreate(v); if (!v) setForm(EMPTY_FORM); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <FormFields />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button type="submit" disabled={createClient.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                {createClient.isPending ? "A criar..." : "Criar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editId !== null} onOpenChange={v => { if (!v) { setEditId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <FormFields />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setEditId(null); setForm(EMPTY_FORM); }}>Cancelar</Button>
              <Button type="submit" disabled={updateClient.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                {updateClient.isPending ? "A guardar..." : "Guardar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
