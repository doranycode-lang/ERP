import React, { useEffect, useState } from "react";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save } from "lucide-react";

export default function Configuracoes() {
  const { data: settings, isLoading } = useGetSettings();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    companyName: "", nif: "", email: "", phone: "", address: "", currency: "AOA", country: "Angola", taxRate: "14",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        companyName: settings.companyName ?? "",
        nif: settings.nif ?? "",
        email: settings.email ?? "",
        phone: settings.phone ?? "",
        address: settings.address ?? "",
        currency: settings.currency ?? "AOA",
        country: settings.country ?? "Angola",
        taxRate: settings.taxRate != null ? String(settings.taxRate) : "14",
      });
    }
  }, [settings]);

  const updateSettings = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        toast({ title: "Configurações guardadas com sucesso" });
      },
      onError: () => toast({ title: "Erro ao guardar configurações", variant: "destructive" }),
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateSettings.mutate({
      data: {
        companyName: form.companyName,
        nif: form.nif,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        currency: form.currency,
        country: form.country,
        taxRate: parseFloat(form.taxRate) || 14,
      },
    });
  }

  if (isLoading) {
    return <div className="p-6 text-gray-500">A carregar configurações...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Settings size={20} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Configurações</h2>
          <p className="text-sm text-gray-500">Informações da empresa e preferências do sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informações da Empresa</CardTitle>
            <CardDescription>Estes dados aparecem nos documentos emitidos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Nome da Empresa *</Label>
                <Input required value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Ex: ULTRACARDIO, LDA" />
              </div>
              <div className="space-y-1">
                <Label>NIF *</Label>
                <Input required value={form.nif} onChange={e => setForm(f => ({ ...f, nif: e.target.value }))} placeholder="000000000" />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+244 ..." />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="geral@empresa.com" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Morada</Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Morada da empresa" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preferências Fiscais</CardTitle>
            <CardDescription>Configurações de moeda e impostos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Moeda</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="AOA">AOA — Kwanza</option>
                  <option value="USD">USD — Dólar</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>País</Label>
                <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Taxa IVA Padrão (%)</Label>
                <Input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateSettings.isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-6">
            <Save size={16} className="mr-2" />
            {updateSettings.isPending ? "A guardar..." : "Guardar Configurações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
