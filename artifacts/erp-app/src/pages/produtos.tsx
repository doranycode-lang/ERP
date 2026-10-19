import React, { useState, useEffect } from "react";
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getListProductsQueryKey,
  getGetProductQueryKey,
} from "@workspace/api-client-react";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";

const UNITS = ["un", "kg", "L", "m", "cx", "pc"];

type FormState = {
  name: string; sku: string; description: string; category: string;
  price: string; costPrice: string; stock: string; unit: string; taxRate: string; active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "", sku: "", description: "", category: "",
  price: "", costPrice: "", stock: "0", unit: "un", taxRate: "", active: true,
};

export default function Produtos() {
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

  const { data: products = [], isLoading } = useListProducts({ search: search || undefined });

  const createProduct = useCreateProduct({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setShowCreate(false);
        setForm(EMPTY_FORM);
        toast({ title: "Produto criado com sucesso" });
      },
      onError: () => toast({ title: "Erro ao criar produto", variant: "destructive" }),
    },
  });

  const updateProduct = useUpdateProduct({
    mutation: {
      onSuccess: (_, vars) => {
        qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetProductQueryKey(vars.id) });
        setEditId(null);
        setForm(EMPTY_FORM);
        toast({ title: "Produto atualizado" });
      },
      onError: () => toast({ title: "Erro ao atualizar produto", variant: "destructive" }),
    },
  });

  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Produto eliminado" });
      },
      onError: () => toast({ title: "Erro ao eliminar", variant: "destructive" }),
    },
  });

  function openEdit(p: (typeof products)[0]) {
    setForm({
      name: p.name,
      sku: p.sku ?? "",
      description: "",
      category: p.category ?? "",
      price: String(p.price),
      costPrice: p.costPrice != null ? String(p.costPrice) : "",
      stock: String(p.stock),
      unit: p.unit,
      taxRate: p.taxRate != null ? String(p.taxRate) : "",
      active: p.active ?? true,
    });
    setEditId(p.id);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createProduct.mutate({
      data: {
        name: form.name,
        sku: form.sku || undefined,
        description: form.description || undefined,
        category: form.category || undefined,
        price: parseFloat(form.price) || 0,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        stock: parseFloat(form.stock) || 0,
        unit: form.unit,
        taxRate: form.taxRate ? parseFloat(form.taxRate) : undefined,
        active: form.active,
      },
    });
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    updateProduct.mutate({
      id: editId,
      data: {
        name: form.name,
        sku: form.sku || undefined,
        description: form.description || undefined,
        category: form.category || undefined,
        price: parseFloat(form.price) || 0,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        stock: parseFloat(form.stock) || 0,
        unit: form.unit,
        taxRate: form.taxRate ? parseFloat(form.taxRate) : undefined,
        active: form.active,
      },
    });
  }

  function handleDelete(id: number) {
    if (confirm("Eliminar este produto?")) deleteProduct.mutate({ id });
  }

  const formatCurrency = useFormatCurrency();

  const FormFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 space-y-1">
        <Label>Nome *</Label>
        <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do produto" />
      </div>
      <div className="space-y-1">
        <Label>SKU</Label>
        <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="SKU" />
      </div>
      <div className="space-y-1">
        <Label>Categoria</Label>
        <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Exames" />
      </div>
      <div className="space-y-1">
        <Label>Preço *</Label>
        <Input required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
      </div>
      <div className="space-y-1">
        <Label>Preço de Custo</Label>
        <Input type="number" min="0" step="0.01" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} placeholder="0.00" />
      </div>
      <div className="space-y-1">
        <Label>Stock</Label>
        <Input type="number" min="0" step="0.001" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
      </div>
      <div className="space-y-1">
        <Label>Unidade</Label>
        <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label>Taxa IVA (%)</Label>
        <Input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} placeholder="14" />
      </div>
      <div className="col-span-2 space-y-1">
        <Label>Descrição</Label>
        <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição do produto" />
      </div>
      <div className="col-span-2 flex items-center gap-2">
        <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
        <Label htmlFor="active" className="cursor-pointer">Produto ativo</Label>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Produtos</h2>
        <Button onClick={() => { setForm(EMPTY_FORM); setShowCreate(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus size={16} className="mr-2" /> Novo Produto
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input className="pl-9" placeholder="Pesquisar produtos..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">SKU</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Categoria</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Preço</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Stock</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">A carregar...</td></tr>
            )}
            {!isLoading && products.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center py-16 text-gray-400">
                    <Package size={40} className="mb-3 opacity-40" />
                    <p className="font-medium">Nenhum produto encontrado</p>
                    <p className="text-sm mt-1">Crie o primeiro produto para começar</p>
                  </div>
                </td>
              </tr>
            )}
            {products.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{p.category || "—"}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.price)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{p.stock} {p.unit}</td>
                <td className="px-4 py-3 text-center">
                  <Badge className={p.active ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" : "bg-gray-100 text-gray-600"}>
                    {p.active ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600" onClick={() => openEdit(p)}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(p.id)}>
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
          <DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <FormFields />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button type="submit" disabled={createProduct.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                {createProduct.isPending ? "A criar..." : "Criar Produto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editId !== null} onOpenChange={v => { if (!v) { setEditId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Produto</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <FormFields />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setEditId(null); setForm(EMPTY_FORM); }}>Cancelar</Button>
              <Button type="submit" disabled={updateProduct.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                {updateProduct.isPending ? "A guardar..." : "Guardar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
