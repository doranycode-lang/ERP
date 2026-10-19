import React from "react";
import { useGetDashboard } from "@workspace/api-client-react";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Package, DollarSign } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard();
  const formatCurrency = useFormatCurrency();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-8 w-40 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-8 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 h-[340px] flex items-end gap-2 pb-8 px-8">
            {[40,65,30,80,50,90].map((h, i) => (
              <div key={i} className="flex-1 bg-gray-200 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            {[0,1,2,3,4].map((i) => <div key={i} className="h-10 bg-gray-100 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800">Resumo</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Receita Total
            </CardTitle>
            <DollarSign size={16} className="text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {formatCurrency(dashboard.totalRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Valor acumulado</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Documentos
            </CardTitle>
            <FileText size={16} className="text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {dashboard.totalDocuments}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(dashboard.pendingAmount || 0)} pendente
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Clientes
            </CardTitle>
            <Users size={16} className="text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {dashboard.totalClients}
            </div>
            <p className="text-xs text-gray-500 mt-1">Registados</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Produtos
            </CardTitle>
            <Package size={16} className="text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {dashboard.totalProducts}
            </div>
            <p className="text-xs text-gray-500 mt-1">No catálogo</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Vendas Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(value) =>
                      `Kz ${Intl.NumberFormat("pt-AO", { notation: "compact" }).format(value)}`
                    }
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.topProducts?.map((product) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">
                      {product.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {product.totalSold} un. vendidas
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              ))}
              {(!dashboard.topProducts ||
                dashboard.topProducts.length === 0) && (
                <div className="text-sm text-gray-500 text-center py-4">
                  Sem dados suficientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
