import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Produtos from "@/pages/produtos";
import Clientes from "@/pages/clientes";
import Documentos from "@/pages/documentos";
import DocumentoNovo from "@/pages/documento-novo";
import DocumentoDetalhe from "@/pages/documento-detalhe";
import Configuracoes from "@/pages/configuracoes";
import LabPacientes from "@/pages/lab-pacientes";
import LabResultados from "@/pages/lab-resultados";
import LabExames from "@/pages/lab-exames";
import LabReagentes from "@/pages/lab-reagentes";
import LabDashboard from "@/pages/lab-dashboard";
import LabHistorico from "@/pages/lab-historico";
import LabFinanceiro from "@/pages/lab-financeiro";
import LabContaCorrente from "@/pages/lab-conta-corrente";
import LabFuncionarios from "@/pages/lab-funcionarios";
import LabPortalParceiro from "@/pages/lab-portal-parceiro";
import { StockAnalysis, StockMovements } from "@/pages/stock";
import Layout from "@/components/layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/documentos/novo" component={DocumentoNovo} />
        <Route path="/documentos/faturacao-lab">{() => <Redirect to="/documentos/novo?origem=lab" />}</Route>
        <Route path="/documentos/faturacao">{() => <Documentos view="faturacao" />}</Route>
        <Route path="/documentos/liquidar">{() => <Documentos view="liquidar" />}</Route>
        <Route path="/documentos/transporte">{() => <Documentos view="transporte" />}</Route>
        <Route path="/documentos/avencas">{() => <Documentos view="avencas" />}</Route>
        <Route path="/documentos/formacao">{() => <Documentos view="formacao" />}</Route>
        <Route path="/documentos/conta-corrente" component={LabContaCorrente} />
        <Route path="/documentos/:id" component={DocumentoDetalhe} />
        <Route path="/documentos">{() => <Documentos />}</Route>
        <Route path="/produtos/stock" component={StockAnalysis} />
        <Route path="/produtos/movimentos" component={StockMovements} />
        <Route path="/produtos/:id">{() => <Produtos />}</Route>
        <Route path="/produtos" component={Produtos} />
        <Route path="/clientes/:id">{() => <Clientes />}</Route>
        <Route path="/clientes" component={Clientes} />
        <Route path="/configuracoes" component={Configuracoes} />
        <Route path="/lab/dashboard" component={LabDashboard} />
        <Route path="/lab/pacientes" component={LabPacientes} />
        <Route path="/lab/resultados" component={LabResultados} />
        <Route path="/lab/lancamento" component={LabResultados} />
        <Route path="/lab/historico" component={LabHistorico} />
        <Route path="/lab/exames" component={LabExames} />
        <Route path="/lab/cadastrar-exames" component={LabExames} />
        <Route path="/lab/reagentes" component={LabReagentes} />
        <Route path="/lab/produtos" component={Produtos} />
        <Route path="/lab/faturacao">{() => <Redirect to="/documentos/novo?origem=lab" />}</Route>
        <Route path="/lab/financeiro" component={LabFinanceiro} />
        <Route path="/lab/conta-corrente" component={LabContaCorrente} />
        <Route path="/lab/funcionarios" component={LabFuncionarios} />
        <Route path="/lab/portal-parceiro" component={LabPortalParceiro} />
        <Route path="/lab">
          <Redirect to="/lab/dashboard" />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
