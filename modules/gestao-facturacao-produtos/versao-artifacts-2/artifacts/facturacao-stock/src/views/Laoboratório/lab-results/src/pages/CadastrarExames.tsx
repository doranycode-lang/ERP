import { useState, useMemo, useEffect } from "react";
import { useApp } from "../store/AppContext";
import { EXAMES_BUILTIN } from "../data/exames";
import { EXAMES_PDF_CONTENT } from "../data/examesPDFContent";
import { parseExamsFromPDF } from "../utils/examesPDFParser";
import { downloadExamesPDF } from "../utils/listPdfGenerator";
import { api } from "../store/api";

interface ParamInput {
  param: string;
  unidade: string;
  referencia: string;
}

interface SyncProd {
  key: string;
  codigo: string;
  nome: string;
  categoria: string;
}

interface ParsedExam {
  categoria: string;
  nome: string;
  parametros: ParamInput[];
}

function emptyParam(): ParamInput {
  return { param: "", unidade: "", referencia: "" };
}

type ViewMode = "lista" | "editor";

export default function CadastrarExames() {
  const { data, addExameCustom, updateExameCustom, removeExameCustom, reload } = useApp();

  const [view, setView] = useState<ViewMode>("lista");
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<"todos" | "padrao" | "custom">("todos");
  const [filterCat, setFilterCat] = useState("");
  const [editCat, setEditCat] = useState("");
  const [editCatCustom, setEditCatCustom] = useState("");
  const [editNome, setEditNome] = useState("");
  const [editParams, setEditParams] = useState<ParamInput[]>([emptyParam(), emptyParam(), emptyParam()]);
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [produtos, setProdutos] = useState<any[]>([]);
  useEffect(() => {
    api.produtos.list().then(setProdutos).catch(() => {});
  }, []);

  const refByNome = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of produtos) {
      if (p.nome && p.codigo) m.set(p.nome.toLowerCase().trim(), p.codigo);
    }
    return m;
  }, [produtos]);

  const [syncOpen, setSyncOpen] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncItems, setSyncItems] = useState<SyncProd[]>([]);
  const [syncSelected, setSyncSelected] = useState<Set<string>>(new Set());
  const [syncSaving, setSyncSaving] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const [importOpen, setImportOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importExams, setImportExams] = useState<ParsedExam[]>([]);
  const [importSelected, setImportSelected] = useState<Set<number>>(new Set());
  const [importSaving, setImportSaving] = useState(false);
  const [importError, setImportError] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [importStep, setImportStep] = useState<"choice" | "parsing" | "review">("choice");
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState("");

  const allBuiltin = useMemo(() => {
    const items: { cat: string; nome: string; params: ParamInput[]; tipo: "Padrão"; id?: number }[] = [];
    for (const [cat, sub] of Object.entries(EXAMES_BUILTIN)) {
      for (const [nome, ps] of Object.entries(sub)) {
        items.push({ cat, nome, params: (ps as any[]).map((p: any) => ({ param: p[0], unidade: p[1], referencia: p[2] })), tipo: "Padrão" });
      }
    }
    return items;
  }, []);

  const allCustomRaw = useMemo(() => {
    const items: { cat: string; nome: string; params: ParamInput[]; tipo: "Personalizado"; id?: number }[] = [];
    for (const [cat, sub] of Object.entries(data.examesCustom)) {
      for (const [nome, ps] of Object.entries(sub)) {
        const rawRow = data.examesCustomRaw.find((r: any) => r.categoria === cat && r.nome === nome);
        items.push({ cat, nome, id: rawRow?.id, params: (ps as any[]).map((p: any) => ({ param: p.param, unidade: p.unidade, referencia: p.referencia })), tipo: "Personalizado" });
      }
    }
    return items;
  }, [data.examesCustom, data.examesCustomRaw]);

  const allItems = useMemo(() => {
    let items = [...allBuiltin, ...allCustomRaw];
    if (filterTipo === "padrao") items = items.filter(i => i.tipo === "Padrão");
    if (filterTipo === "custom") items = items.filter(i => i.tipo === "Personalizado");
    if (filterCat) items = items.filter(i => i.cat === filterCat);
    if (search) items = items.filter(i =>
      i.nome.toLowerCase().includes(search.toLowerCase()) ||
      i.cat.toLowerCase().includes(search.toLowerCase()) ||
      (refByNome.get(i.nome.toLowerCase().trim()) || "").includes(search)
    );
    return items;
  }, [allBuiltin, allCustomRaw, filterTipo, filterCat, search, refByNome]);

  const allCats = useMemo(() => {
    return [...new Set([...allBuiltin, ...allCustomRaw].map(i => i.cat))].sort();
  }, [allBuiltin, allCustomRaw]);

  function handleNovo() {
    setEditCat(""); setEditCatCustom(""); setEditNome("");
    setEditParams([emptyParam(), emptyParam(), emptyParam()]);
    setIsEditingCustom(false); setEditingId(null); setMsg(null); setView("editor");
  }

  function handleEditar(item: typeof allItems[0]) {
    const params = item.params.length > 0 ? [...item.params] : [emptyParam()];
    setEditCat(item.cat); setEditCatCustom(""); setEditNome(item.nome); setEditParams(params);
    setIsEditingCustom(item.tipo === "Personalizado");
    setEditingId(item.tipo === "Personalizado" && item.id != null ? item.id : null);
    setMsg(null); setView("editor");
  }

  async function handleSave() {
    const cat = editCatCustom.trim() || editCat.trim();
    const nome = editNome.trim();
    if (!cat || !nome) { setMsg({ text: "Preencha a categoria e o nome do exame.", ok: false }); return; }
    const params = editParams.filter(p => p.param.trim());
    if (params.length === 0) { setMsg({ text: "Adicione pelo menos um parâmetro.", ok: false }); return; }
    try {
      if (isEditingCustom && editingId !== null) {
        await updateExameCustom(editingId, cat, nome, params);
        setMsg({ text: "Exame actualizado com sucesso.", ok: true });
      } else {
        await addExameCustom(cat, nome, params);
        setMsg({ text: `Exame "${nome}" criado com sucesso.`, ok: true });
      }
      setTimeout(() => setView("lista"), 1200);
    } catch (err: any) {
      setMsg({ text: err.message || "Erro ao guardar exame.", ok: false });
    }
  }

  async function handleRemover(item: typeof allItems[0]) {
    if (item.tipo !== "Personalizado") { alert("Só é possível eliminar exames personalizados."); return; }
    if (item.id == null) { alert("Não foi possível encontrar o ID do exame."); return; }
    if (!window.confirm(`Remover o exame "${item.nome}"?`)) return;
    try {
      await removeExameCustom(item.id);
      setView("lista");
    } catch (err: any) {
      alert(err.message || "Erro ao remover exame.");
    }
  }

  async function openSincronizar() {
    setSyncOpen(true);
    setSyncLoading(true);
    setSyncMsg("");
    try {
      const prods = await api.produtos.list();
      setProdutos(prods);
      const nomesExistentes = new Set([...allBuiltin, ...allCustomRaw].map(i => i.nome.toLowerCase().trim()));
      const items: SyncProd[] = [];
      const seen = new Set<string>();
      for (const p of prods) {
        if (!p.nome) continue;
        const key = p.nome.toLowerCase().trim();
        if (!nomesExistentes.has(key) && !seen.has(key)) {
          seen.add(key);
          items.push({ key: String(p.id), codigo: p.codigo || "", nome: p.nome, categoria: p.categoria || "Geral" });
        }
      }
      setSyncItems(items);
      setSyncSelected(new Set(items.map(i => i.key)));
    } catch {
      setSyncItems([]);
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleImportar() {
    const toImport = syncItems.filter(i => syncSelected.has(i.key));
    if (toImport.length === 0) return;
    setSyncSaving(true);
    const results = await Promise.allSettled(
      toImport.map(item =>
        api.examesCustom.create({ categoria: item.categoria, nome: item.nome, parametros: [{ param: item.nome, unidade: "", referencia: "" }] })
      )
    );
    const count = results.filter(r => r.status === "fulfilled").length;
    await reload();
    setSyncSaving(false);
    setSyncOpen(false);
    setSyncMsg(`${count} exame(s) importado(s) com sucesso.`);
    setTimeout(() => setSyncMsg(""), 4000);
  }

  function openImportModal() {
    setImportOpen(true);
    setImportExams([]);
    setImportSelected(new Set());
    setImportError("");
    setImportProgress(0);
    setImportStatus("");
    setImportStep("choice");
    setPasteMode(false);
    setPastedText("");
  }

  function closeImportModal() {
    if (importSaving || importLoading) return;
    setImportOpen(false);
    setImportExams([]);
    setImportSelected(new Set());
    setImportError("");
    setImportProgress(0);
    setImportStatus("");
    setImportStep("choice");
    setPasteMode(false);
    setPastedText("");
  }

  async function processText(text: string) {
    setImportLoading(true);
    setImportError("");
    setImportProgress(0);
    setImportExams([]);
    setImportStep("parsing");
    setImportStatus("A analisar texto...");

    try {
      if (!text.trim() || text.length < 50) {
        setImportError("Texto muito curto ou vazio.");
        setImportLoading(false);
        setImportStep("choice");
        return;
      }

      setImportProgress(50);
      setImportStatus("A detectar exames e categorias...");

      const exams = parseExamsFromPDF(text);
      setImportProgress(100);

      if (exams.length === 0) {
        setImportError("Nenhum exame foi detectado. Verifica o formato do texto.");
        setImportLoading(false);
        setImportStep("choice");
      } else {
        setImportExams(exams);
        setImportSelected(new Set(exams.map((_, i) => i)));
        const cats = [...new Set(exams.map(e => e.categoria))];
        setImportStatus(`${exams.length} exame(s) detectado(s) em ${cats.length} categoria(s).`);
        setImportStep("review");
      }
    } catch (err: any) {
      console.error("Erro ao processar texto:", err);
      setImportError(`Erro ao processar: ${err.message || "Erro desconhecido"}`);
      setImportLoading(false);
      setImportStep("choice");
    } finally {
      setImportLoading(false);
    }
  }

  async function loadBuiltinPDF() {
    setImportLoading(true);
    setImportProgress(10);
    setImportStatus("A carregar conteúdo do PDF...");

    await new Promise(r => setTimeout(r, 300));
    setImportProgress(40);
    setImportStatus("A processar exames...");

    await new Promise(r => setTimeout(r, 300));
    setImportProgress(70);
    setImportStatus("A organizar por categorias...");

    const exams = parseExamsFromPDF(EXAMES_PDF_CONTENT);
    setImportProgress(100);

    await new Promise(r => setTimeout(r, 300));

    if (exams.length === 0) {
      setImportError("Erro ao processar o conteúdo do PDF.");
      setImportLoading(false);
      setImportStep("choice");
    } else {
      setImportExams(exams);
      setImportSelected(new Set(exams.map((_, i) => i)));
      const cats = [...new Set(exams.map(e => e.categoria))];
      setImportStatus(`${exams.length} exame(s) em ${cats.length} categorias.`);
      setImportStep("review");
      setImportLoading(false);
    }
  }

  async function handlePasteImport() {
    if (!pastedText.trim()) {
      setImportError("Cola o texto primeiro.");
      return;
    }
    await processText(pastedText);
  }

  async function handleImportExams() {
    const toImport = importExams.filter((_, i) => importSelected.has(i));
    if (toImport.length === 0) return;

    setImportSaving(true);
    setImportError("");

    try {
      const batchSize = 20;
      let successCount = 0;
      for (let i = 0; i < toImport.length; i += batchSize) {
        const batch = toImport.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(exam =>
            api.examesCustom.create({
              categoria: exam.categoria,
              nome: exam.nome,
              parametros: exam.parametros.length > 0
                ? exam.parametros
                : [{ param: exam.nome, unidade: "", referencia: "" }]
            })
          )
        );
        successCount += results.filter(r => r.status === "fulfilled").length;
      }

      await reload();

      setImportSaving(false);
      setImportOpen(false);
      setMsg({
        text: `${successCount} exame(s) importado(s) com sucesso.`,
        ok: true
      });
      setTimeout(() => setMsg(null), 5000);
    } catch (err: any) {
      setImportError(`Erro ao importar: ${err.message || "Erro desconhecido"}`);
      setImportSaving(false);
    }
  }

  const CATS_BUILTIN = [...new Set(allBuiltin.map(i => i.cat))].sort();

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-primary">Cadastrar Exames</h2>
        <div className="flex items-center gap-2">
          {view === "lista" && (
            <>
              <button
                onClick={openImportModal}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-sm whitespace-nowrap"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Importar Exames
              </button>
              <button
                onClick={() => downloadExamesPDF(allItems, data.config)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-sm whitespace-nowrap"
              >
                 Baixar PDF
              </button>
              <button
                onClick={openSincronizar}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border border-border bg-white hover:bg-secondary/60 transition text-foreground whitespace-nowrap"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
                Sincronizar Produtos
              </button>
            </>
          )}
          {view === "lista" ? (
            <button onClick={handleNovo} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition">
              + Novo Exame
            </button>
          ) : (
            <button onClick={() => setView("lista")} className="text-sm text-primary hover:underline font-semibold">
              ← Voltar à lista
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 text-sm font-medium">
          ✓ {msg.text}
        </div>
      )}

      {view === "lista" && (
        <>
          <div className="flex flex-wrap gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar exame ou código..."
              className="border border-border rounded-lg px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value as any)}
              className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="todos">Todos os tipos</option>
              <option value="padrao">Padrão</option>
              <option value="custom">Personalizado</option>
            </select>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
              className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Todas as categorias</option>
              {allCats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-foreground">{allItems.length} exame(s)</span>
                <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                  ✦ {allCustomRaw.length} personalizado(s)
                </span>
              </div>
              {produtos.length > 0 && (
                <span className="text-xs text-primary/60 font-medium">{refByNome.size} código(s) de produto ligados</span>
              )}
            </div>
            {allItems.length === 0 ? (
              <div className="py-14 text-center text-muted-foreground text-sm">Nenhum exame encontrado.</div>
            ) : (() => {
              const bycat = allItems.reduce<Record<string, typeof allItems>>((acc, item) => {
                if (!acc[item.cat]) acc[item.cat] = [];
                acc[item.cat].push(item);
                return acc;
              }, {});
              return (
                <div>
                  {Object.entries(bycat).map(([cat, items]) => (
                    <div key={cat}>
                      <div className="flex items-center gap-2 px-5 py-2 bg-primary/5 border-y border-primary/10">
                        <span className="text-xs font-bold text-primary uppercase tracking-wide">{cat}</span>
                        <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{items.length}</span>
                      </div>
                      {items.map((item, i) => {
                        const codigo = refByNome.get(item.nome.toLowerCase().trim());
                        return (
                          <div key={i} className="flex items-center gap-3 px-5 py-2.5 border-b border-border/50 hover:bg-accent/20 transition-colors last:border-b-0">
                            <div className="w-16 shrink-0 text-right">
                              {codigo ? (
                                <span className="inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                  {codigo}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground/30">—</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <span className="font-semibold text-sm truncate">{item.nome}</span>
                              <span className="text-[10px] text-muted-foreground bg-secondary rounded px-1.5 py-0.5 shrink-0">{item.params.length} param.</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${item.tipo === "Padrão" ? "bg-blue-600 text-white" : "bg-amber-500 text-white"}`}>
                              {item.tipo}
                            </span>
                            <div className="flex gap-1.5 flex-shrink-0">
                              <button onClick={() => handleEditar(item)}
                                className={`text-xs px-3 py-1 rounded font-semibold transition text-white ${item.tipo === "Personalizado" ? "bg-indigo-500 hover:bg-indigo-600" : "bg-primary hover:opacity-90"}`}>
                                {item.tipo === "Personalizado" ? "Editar" : "Ver"}
                              </button>
                              {item.tipo === "Personalizado" && (
                                <button onClick={() => handleRemover(item)}
                                  className="text-xs bg-red-500 text-white px-3 py-1 rounded font-semibold hover:bg-red-600 transition">
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </>
      )}

      {view === "editor" && (
        <div className="bg-white border border-border rounded-xl p-6 space-y-5 max-w-2xl">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wide">
            {isEditingCustom ? "Editar Exame" : "Novo Exame Personalizado"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Categoria *</label>
              <select value={editCat} onChange={(e) => { setEditCat(e.target.value); setEditCatCustom(""); }}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">— Nova categoria —</option>
                {CATS_BUILTIN.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {!editCat && (
                <input value={editCatCustom} onChange={(e) => setEditCatCustom(e.target.value)}
                  placeholder="Nome da nova categoria"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nome do Exame *</label>
              <input value={editNome} onChange={(e) => setEditNome(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Ex: Glicemia em Jejum" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Parâmetros</div>
            <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-muted-foreground px-1">
              <div>Parâmetro</div><div>Unidade</div><div>Referência</div>
            </div>
            {editParams.map((p, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <input value={p.param} onChange={(e) => { const ps = [...editParams]; ps[i] = { ...p, param: e.target.value }; setEditParams(ps); }}
                  className="border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ex: Glicose" />
                <input value={p.unidade} onChange={(e) => { const ps = [...editParams]; ps[i] = { ...p, unidade: e.target.value }; setEditParams(ps); }}
                  className="border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="mg/dL" />
                <input value={p.referencia} onChange={(e) => { const ps = [...editParams]; ps[i] = { ...p, referencia: e.target.value }; setEditParams(ps); }}
                  className="border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="70-110" />
              </div>
            ))}
            <button type="button" onClick={() => setEditParams([...editParams, emptyParam()])}
              className="text-xs text-primary hover:underline font-semibold mt-1">+ Adicionar parâmetro</button>
          </div>

          {msg && (
            <div className={`text-xs rounded-lg px-3 py-2 ${msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>{msg.text}</div>
          )}

          <div className="flex gap-3">
            <button onClick={handleSave} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition">
              {isEditingCustom ? "Guardar Alterações" : "Criar Exame"}
            </button>
            <button onClick={() => setView("lista")} className="bg-gray-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {syncOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !syncSaving && setSyncOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold">Sincronizar com Lista de Produtos</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Importar produtos como exames personalizados (apenas os que ainda não existem)</p>
              </div>
              <button onClick={() => setSyncOpen(false)} disabled={syncSaving} className="p-1.5 rounded-lg hover:bg-secondary transition text-muted-foreground disabled:opacity-40">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {syncLoading ? (
              <div className="flex-1 flex items-center justify-center py-16 text-sm text-muted-foreground">A carregar produtos...</div>
            ) : syncItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
                <p className="text-sm text-muted-foreground font-medium">Tudo sincronizado — todos os produtos já existem como exames.</p>
                <button onClick={() => setSyncOpen(false)} className="text-sm px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition font-semibold">Fechar</button>
              </div>
            ) : (
              <>
                <div className="px-6 py-3 border-b border-border shrink-0 flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-muted-foreground">{syncItems.length} produto(s) disponíveis para importar</span>
                  <div className="ml-auto flex gap-2 items-center">
                    <button onClick={() => setSyncSelected(new Set(syncItems.map(i => i.key)))}
                      className="text-xs text-primary hover:underline font-medium">Seleccionar todos</button>
                    <span className="text-muted-foreground/40">|</span>
                    <button onClick={() => setSyncSelected(new Set())}
                      className="text-xs text-muted-foreground hover:underline font-medium">Desmarcar todos</button>
                    <span className="text-xs font-semibold text-primary ml-2">{syncSelected.size} seleccionados</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-border">
                  {syncItems.map((item) => {
                    const checked = syncSelected.has(item.key);
                    return (
                      <label key={item.key} className={`flex items-center gap-3 px-6 py-2.5 cursor-pointer hover:bg-secondary/30 transition ${checked ? "" : "opacity-50"}`}>
                        <input type="checkbox" checked={checked}
                          onChange={() => setSyncSelected(prev => {
                            const next = new Set(prev);
                            if (next.has(item.key)) next.delete(item.key); else next.add(item.key);
                            return next;
                          })}
                          className="w-4 h-4 accent-primary shrink-0" />
                        <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0 w-14 text-center">
                          {item.codigo || "—"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.nome}</div>
                          <div className="text-xs text-muted-foreground">{item.categoria}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">Importados como exames personalizados — podes editar os parâmetros depois.</p>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setSyncOpen(false)} disabled={syncSaving}
                      className="text-sm font-semibold px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition disabled:opacity-50">
                      Cancelar
                    </button>
                    <button onClick={handleImportar} disabled={syncSaving || syncSelected.size === 0}
                      className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50">
                      {syncSaving ? "A importar..." : `Importar ${syncSelected.size} exame(s)`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {importOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => closeImportModal()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold">Importar Exames</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Carrega os exames do PDF ou cola texto personalizado</p>
              </div>
              <button onClick={closeImportModal} disabled={importSaving || importLoading} className="p-1.5 rounded-lg hover:bg-secondary transition text-muted-foreground disabled:opacity-40">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {importStep === "choice" && !importLoading && !pasteMode && (
              <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                  <button
                    onClick={loadBuiltinPDF}
                    className="border-2 border-purple-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all group"
                  >
                    <div className="mx-auto w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-200 transition">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-foreground mb-1">Lista Completa de Exames</p>
                    <p className="text-xs text-purple-700 font-semibold mb-2">PDF Embutido</p>
                    <p className="text-[11px] text-muted-foreground">Carrega directamente o conteúdo do PDF "Lista_Exames_Laboratoriais_Valores_Referencia_EXPANDIDA_v3"</p>
                  </button>

                  <button
                    onClick={() => setPasteMode(true)}
                    className="border-2 border-blue-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                  >
                    <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-foreground mb-1">Colar Texto Personalizado</p>
                    <p className="text-xs text-blue-700 font-semibold mb-2">Qualquer formato</p>
                    <p className="text-[11px] text-muted-foreground">Copia e cola texto de outro PDF, DOCX ou documento</p>
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 max-w-2xl">
                  <p className="text-xs text-amber-800 font-semibold mb-1">ℹ️ Como funciona:</p>
                  <ul className="text-xs text-amber-700 space-y-0.5">
                    <li>• Os exames serão adicionados como <strong>Personalizados</strong> — nada do que já existe será apagado</li>
                    <li>• Cada exame inclui: nome, categoria, parâmetro, unidade e valor de referência</li>
                    <li>• Podes seleccionar/deseleccionar exames antes de importar</li>
                    <li>• Podes editar qualquer exame depois de importado</li>
                  </ul>
                </div>

                {importError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm font-medium max-w-md">
                    ✗ {importError}
                  </div>
                )}
              </div>
            )}

            {pasteMode && importStep === "choice" && !importLoading && (
              <div className="flex-1 flex flex-col p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Cola o texto aqui:</h4>
                  <button onClick={() => setPasteMode(false)} className="text-xs text-muted-foreground hover:text-foreground">
                    ← Voltar
                  </button>
                </div>

                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Cola aqui o conteúdo...&#10;&#10;Formato esperado:&#10;CATEGORIA- SUBCATEGORIA&#10;NomeDoExame(subtipo) valor unidade&#10;Hemácias(homens) 4,5- 5,9 milhões/mm³&#10;Glicemia de jejum 70- 99 mg/dL"
                  className="flex-1 min-h-[300px] border border-border rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setPasteMode(false)}
                    className="text-sm font-semibold px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handlePasteImport}
                    disabled={!pastedText.trim()}
                    className="text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Processar Texto
                  </button>
                </div>

                {importError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm font-medium">
                    ✗ {importError}
                  </div>
                )}
              </div>
            )}

            {importLoading && (
              <div className="flex-1 flex flex-col items-center justify-center p-10">
                <div className="w-full max-w-md space-y-4">
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-6 w-6 text-purple-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span className="text-sm font-semibold">{importStatus}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {!importLoading && importStep === "review" && importExams.length > 0 && (
              <>
                <div className="px-6 py-3 border-b border-border shrink-0 flex items-center gap-3 flex-wrap bg-purple-50/50">
                  <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                    ✓ {importStatus}
                  </span>
                  <div className="ml-auto flex gap-2 items-center">
                    <button onClick={() => setImportSelected(new Set(importExams.map((_, i) => i)))}
                      className="text-xs text-purple-600 hover:underline font-medium">Seleccionar todos</button>
                    <span className="text-muted-foreground/40">|</span>
                    <button onClick={() => setImportSelected(new Set())}
                      className="text-xs text-muted-foreground hover:underline font-medium">Desmarcar todos</button>
                    <span className="text-xs font-semibold text-purple-600 ml-2">{importSelected.size} seleccionados</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-border">
                  {importExams.map((exam, idx) => {
                    const checked = importSelected.has(idx);
                    return (
                      <label key={idx} className={`flex items-start gap-3 px-6 py-2.5 cursor-pointer hover:bg-purple-50/30 transition ${checked ? "" : "opacity-50"}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setImportSelected(prev => {
                            const next = new Set(prev);
                            if (next.has(idx)) next.delete(idx); else next.add(idx);
                            return next;
                          })}
                          className="w-4 h-4 accent-purple-600 mt-1 shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{exam.nome}</span>
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">{exam.categoria}</span>
                          </div>
                          {exam.parametros.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">{exam.parametros[0].param}:</span>{" "}
                              <span className="text-foreground font-medium">{exam.parametros[0].referencia}</span>
                              {exam.parametros[0].unidade && <span className="text-muted-foreground"> {exam.parametros[0].unidade}</span>}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Os exames serão <strong>adicionados</strong> — nada do que já existe será apagado.
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setImportExams([]);
                        setImportSelected(new Set());
                        setImportError("");
                        setImportStatus("");
                        setImportStep("choice");
                        setPasteMode(false);
                      }}
                      disabled={importSaving}
                      className="text-sm font-semibold px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition disabled:opacity-50"
                    >
                      ← Voltar
                    </button>
                    <button
                      onClick={handleImportExams}
                      disabled={importSaving || importSelected.size === 0}
                      className="text-sm font-semibold px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      {importSaving ? "A importar..." : `Importar ${importSelected.size} exame(s)`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
