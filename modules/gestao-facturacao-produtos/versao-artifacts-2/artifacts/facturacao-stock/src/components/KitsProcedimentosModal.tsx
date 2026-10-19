import React, { useState, useMemo } from "react";
import { useApp } from "../store/AppContext";
import { KitProduto, KitItemComponente, Produto } from "../types";
import { formatCurrency } from "../utils/faturaGenerator";
import {
  Boxes,
  Plus,
  Search,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Package,
  Layers,
  CheckCircle2,
  Trash2,
  Tag,
  Info,
  Sliders,
  ListPlus,
  Percent,
  Check,
  AlertCircle
} from "lucide-react";

interface KitsProcedimentosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertKit: (kit: KitProduto, mode: "detalhado" | "linha_unica") => void;
  currency: string;
}

export const KitsProcedimentosModal: React.FC<KitsProcedimentosModalProps> = ({
  isOpen,
  onClose,
  onInsertKit,
  currency,
}) => {
  const { kits, produtos, addKit, deleteKit } = useApp();

  // Search and filter
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("todas");
  const [expandedKitId, setExpandedKitId] = useState<string | null>(null);

  // Mode create kit
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [novoCodigo, setNovoCodigo] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoDescricao, setNovoDescricao] = useState("");
  const [novoCategoria, setNovoCategoria] = useState("Manutenção & Calibração");
  const [novoPrecoVenda, setNovoPrecoVenda] = useState<number | "">("");
  const [novoItens, setNovoItens] = useState<KitItemComponente[]>([]);

  // Product search within creator
  const [searchProdutoParaKit, setSearchProdutoParaKit] = useState("");
  const [qtdParaAdicionar, setQtdParaAdicionar] = useState(1);
  const [formError, setFormError] = useState("");

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    kits.forEach((k) => {
      if (k.categoria) set.add(k.categoria);
    });
    return Array.from(set);
  }, [kits]);

  // Filtered kits
  const filteredKits = useMemo(() => {
    const q = search.trim().toLowerCase();
    return kits.filter((k) => {
      const matchesSearch =
        !q ||
        k.nome.toLowerCase().includes(q) ||
        k.codigo.toLowerCase().includes(q) ||
        k.descricao.toLowerCase().includes(q) ||
        k.itens.some(
          (i) =>
            i.produtoNome.toLowerCase().includes(q) ||
            i.produtoCodigo.toLowerCase().includes(q)
        );

      const matchesCat = selectedCat === "todas" || k.categoria === selectedCat;

      return matchesSearch && matchesCat;
    });
  }, [kits, search, selectedCat]);

  // Autocomplete products when building a new kit
  const produtosDisponiveis = useMemo(() => {
    const q = searchProdutoParaKit.trim().toLowerCase();
    if (!q) return [];
    return produtos
      .filter(
        (p) =>
          p.ativo &&
          (p.nome.toLowerCase().includes(q) ||
            p.codigo.toLowerCase().includes(q) ||
            (p.categoria && p.categoria.toLowerCase().includes(q)))
      )
      .slice(0, 10);
  }, [produtos, searchProdutoParaKit]);

  // Subtotal calculation for new kit
  const novoKitSubtotalCalculado = useMemo(() => {
    return novoItens.reduce((sum, item) => sum + item.precoUnitario * item.quantidade, 0);
  }, [novoItens]);

  // Handle adding product to kit builder
  const handleAddItemToNovoKit = (p: Produto) => {
    const existingIdx = novoItens.findIndex((i) => i.produtoCodigo === p.codigo);
    if (existingIdx >= 0) {
      setNovoItens((prev) => {
        const updated = [...prev];
        updated[existingIdx].quantidade += qtdParaAdicionar;
        return updated;
      });
    } else {
      setNovoItens((prev) => [
        ...prev,
        {
          produtoId: p.id,
          produtoCodigo: p.codigo,
          produtoNome: p.nome,
          quantidade: qtdParaAdicionar,
          precoUnitario: p.preco,
          unidade: p.unidadeMedida,
          categoria: p.categoria,
          ivaIsento: p.ivaIsento,
        },
      ]);
    }
    setSearchProdutoParaKit("");
    setQtdParaAdicionar(1);
    setFormError("");
  };

  const handleRemoveItemFromNovoKit = (idx: number) => {
    setNovoItens((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveNovoKit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCodigo.trim()) {
      setFormError("Informe o código SKU do Kit (Ex: KIT-LAB-01)");
      return;
    }
    if (!novoNome.trim()) {
      setFormError("Informe o nome do Kit / Procedimento");
      return;
    }
    if (novoItens.length === 0) {
      setFormError("Adicione pelo menos 1 serviço ou consumível ao Kit");
      return;
    }

    const finalPreco =
      typeof novoPrecoVenda === "number" && novoPrecoVenda > 0
        ? novoPrecoVenda
        : novoKitSubtotalCalculado;

    addKit({
      codigo: novoCodigo.trim().toUpperCase(),
      nome: novoNome.trim(),
      descricao: novoDescricao.trim() || `Procedimento composto de eletromedicina com ${novoItens.length} itens.`,
      categoria: novoCategoria,
      itens: novoItens,
      precoTotalCalculado: novoKitSubtotalCalculado,
      precoVendaKit: finalPreco,
      ativo: true,
    });

    // Reset and close form
    setShowCreateForm(false);
    setNovoCodigo("");
    setNovoNome("");
    setNovoDescricao("");
    setNovoPrecoVenda("");
    setNovoItens([]);
    setFormError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-purple-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-inner">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-wide">
                  Kits de Produtos & Procedimentos
                </h3>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {kits.length} Kits Disponíveis
                </span>
              </div>
              <p className="text-xs text-purple-200/80">
                Agrupe serviços, peças e consumíveis médicos em um único código de venda
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!showCreateForm && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Criar Novo Kit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {showCreateForm ? (
          /* Form to create custom Kit */
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Montar Novo Kit / Procedimento Composto
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                ← Voltar aos Kits
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNovoKit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Código SKU do Kit *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoCodigo}
                    onChange={(e) => setNovoCodigo(e.target.value.toUpperCase())}
                    placeholder="Ex: KIT-LAB-01"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nome do Procedimento / Kit *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: Kit Calibração e Validação de Analisador Bioquímico"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Categoria do Procedimento
                  </label>
                  <select
                    value={novoCategoria}
                    onChange={(e) => setNovoCategoria(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-500"
                  >
                    <option value="Manutenção & Calibração">Manutenção & Calibração</option>
                    <option value="Procedimentos Laboratoriais">Procedimentos Laboratoriais</option>
                    <option value="Instalação & Revisão">Instalação & Revisão</option>
                    <option value="Bloco Cirúrgico">Bloco Cirúrgico</option>
                    <option value="Treinamento & Protocolos">Treinamento & Protocolos</option>
                    <option value="Personalizado">Personalizado</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Descrição Técnica / Procedimento
                  </label>
                  <input
                    type="text"
                    value={novoDescricao}
                    onChange={(e) => setNovoDescricao(e.target.value)}
                    placeholder="Ex: Inclui alinhamento óptico, lubrificação, substituição de lâmpada e emissão de laudo..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Add items to kit builder */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ListPlus className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Componentes do Kit (Serviços, Peças e Consumíveis)
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {novoItens.length} itens adicionados
                  </span>
                </div>

                {/* Product search box */}
                <div className="relative">
                  <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-purple-500">
                    <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
                      <button
                        type="button"
                        onClick={() => setQtdParaAdicionar((q) => Math.max(1, q - 1))}
                        className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={qtdParaAdicionar}
                        onChange={(e) => setQtdParaAdicionar(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-8 text-center text-xs font-bold border-0 bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQtdParaAdicionar((q) => q + 1)}
                        className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700"
                      >
                        +
                      </button>
                    </div>

                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={searchProdutoParaKit}
                      onChange={(e) => setSearchProdutoParaKit(e.target.value)}
                      placeholder="Pesquise produtos no catálogo (999 itens) para adicionar ao Kit..."
                      className="w-full bg-transparent border-0 text-xs focus:outline-none placeholder-slate-400"
                    />
                  </div>

                  {/* Autocomplete dropdown */}
                  {produtosDisponiveis.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {produtosDisponiveis.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleAddItemToNovoKit(p)}
                          className="w-full p-2.5 text-left hover:bg-purple-50 flex items-center justify-between text-xs transition"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{p.nome}</span>
                            <span className="text-[10px] text-slate-500 font-mono ml-2">
                              [{p.codigo}] · {p.categoria}
                            </span>
                          </div>
                          <span className="font-black text-purple-700">
                            {formatCurrency(p.preco, currency)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Items in kit table */}
                {novoItens.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs">Nenhum componente incluído ainda.</p>
                    <p className="text-[11px] text-slate-400">
                      Busque no catálogo acima para adicionar serviços técnicos, lâmpadas, filtros ou reagentes.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Código / Item</th>
                          <th className="p-2.5 text-center w-16">Qtd</th>
                          <th className="p-2.5 text-right">P. Unitário</th>
                          <th className="p-2.5 text-right">Subtotal</th>
                          <th className="p-2.5 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {novoItens.map((item, idx) => {
                          const sub = item.quantidade * item.precoUnitario;
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5">
                                <span className="font-mono text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 mr-2">
                                  {item.produtoCodigo}
                                </span>
                                <span className="font-semibold text-slate-800">
                                  {item.produtoNome}
                                </span>
                              </td>
                              <td className="p-2.5 text-center font-bold">
                                {item.quantidade} {item.unidade || "un"}
                              </td>
                              <td className="p-2.5 text-right text-slate-600">
                                {formatCurrency(item.precoUnitario, currency)}
                              </td>
                              <td className="p-2.5 text-right font-bold text-slate-900">
                                {formatCurrency(sub, currency)}
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemFromNovoKit(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Price & Summary */}
              <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-purple-900 font-medium">
                    Soma Individual dos Itens: <b>{formatCurrency(novoKitSubtotalCalculado, currency)}</b>
                  </div>
                  <div className="text-[11px] text-purple-700/80">
                    Defina um preço promocional para o Kit ou mantenha a soma exata.
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-purple-950 block mb-0.5">
                      Preço de Venda do Kit ({currency})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={novoPrecoVenda}
                      onChange={(e) =>
                        setNovoPrecoVenda(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)
                      }
                      placeholder={`Ex: ${novoKitSubtotalCalculado}`}
                      className="w-40 border border-purple-300 rounded-xl px-3 py-1.5 text-xs font-black text-purple-900 bg-white focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 self-end"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Gravar Kit
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* Kits Browser and Selection */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter and Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative md:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Pesquisar Kit por código (ex: KIT-MIC-PREV, KIT-AUTOCLAVE), nome ou componentes..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 shadow-sm"
                    autoFocus
                  />
                </div>

                <div>
                  <select
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-500 shadow-sm"
                  >
                    <option value="todas">Todas as Categorias</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick filter badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Categorias:
                </span>
                {["todas", ...categories].map((c) => {
                  const active = selectedCat === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCat(c)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        active
                          ? "bg-purple-700 text-white shadow-sm"
                          : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      {c === "todas" ? "Todos os Kits" : c}
                    </button>
                  );
                })}
                <span className="text-xs text-slate-400 ml-auto">
                  {filteredKits.length} kit(s) encontrado(s)
                </span>
              </div>
            </div>

            {/* Kits Cards Grid */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredKits.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-400" />
                  <h4 className="text-sm font-bold text-slate-700">Nenhum Kit encontrado</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Tente buscar por outro termo ou clique em "Criar Novo Kit" para cadastrar um pacote personalizado.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredKits.map((kit) => {
                    const isExpanded = expandedKitId === kit.id;
                    const discount = kit.descontoPercentual || 0;

                    return (
                      <div
                        key={kit.id}
                        className="bg-white rounded-2xl border border-slate-200 hover:border-purple-300 transition shadow-sm overflow-hidden"
                      >
                        {/* Kit Card Main Row */}
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-800 font-mono text-xs font-black">
                                {kit.codigo}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                {kit.categoria}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                {kit.itens.length} componentes
                              </span>
                              {discount > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-0.5">
                                  <Percent className="w-3 h-3" />
                                  {discount}% Economia
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                              {kit.nome}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {kit.descricao}
                            </p>
                          </div>

                          {/* Price and Insertion Actions */}
                          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                            <div className="text-right">
                              {discount > 0 && (
                                <div className="text-[10px] text-slate-400 line-through">
                                  {formatCurrency(kit.precoTotalCalculado, currency)}
                                </div>
                              )}
                              <div className="text-base font-black text-purple-700">
                                {formatCurrency(kit.precoVendaKit, currency)}
                              </div>
                              <div className="text-[10px] text-slate-400">Preço do Pacote</div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setExpandedKitId(isExpanded ? null : kit.id)}
                                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                                title="Ver itens componentes"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>

                              {/* Action 1: Inserir Itens Detalhados */}
                              <button
                                type="button"
                                onClick={() => onInsertKit(kit, "detalhado")}
                                className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                                title="Insere todos os serviços e consumíveis como linhas individuais na fatura"
                              >
                                <ListPlus className="w-3.5 h-3.5 text-purple-600" />
                                Inserir Detalhado
                              </button>

                              {/* Action 2: Inserir como Linha Única de Kit */}
                              <button
                                type="button"
                                onClick={() => onInsertKit(kit, "linha_unica")}
                                className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                                title="Insere uma única linha na fatura com o código e valor total do Kit"
                              >
                                <Package className="w-3.5 h-3.5" />
                                Inserir Linha Única
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Details: Components List */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 bg-slate-50/80 border-t border-slate-100 animate-in fade-in">
                            <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-purple-600" />
                              Itens incluídos no procedimento ({kit.itens.length}):
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {kit.itens.map((item, i) => (
                                <div
                                  key={i}
                                  className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                                >
                                  <div className="min-w-0 pr-2">
                                    <span className="font-mono text-[10px] font-bold text-slate-500">
                                      {item.produtoCodigo}
                                    </span>
                                    <div className="font-semibold text-slate-800 truncate" title={item.produtoNome}>
                                      {item.produtoNome}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 font-bold text-[10px]">
                                      {item.quantidade} {item.unidade || "un"}
                                    </span>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                      {formatCurrency(item.precoUnitario, currency)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {kit.observacoes && (
                              <p className="text-[11px] text-slate-500 mt-2 italic">
                                Nota: {kit.observacoes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Escolha <b>Inserir Detalhado</b> para descriminar todos os itens ou <b>Linha Única</b> para agrupar num só SKU.
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
