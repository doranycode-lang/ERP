const $=selector=>document.querySelector(selector);
const money=cents=>new Intl.NumberFormat("pt-AO",{style:"currency",currency:"AOA"}).format(Number(cents||0)/100);
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const defs={
  patients:{title:"Pacientes",description:"Cadastro persistente de pacientes por unidade",permission:"patients",columns:["code","name","birth_date","phone","created_at"],
    fields:[["code","Código do paciente","text"],["name","Nome completo","text"],["birthDate","Nascimento","date",false],["phone","Telefone","text",false]]},
  partners:{title:"Seguradoras e parceiros",description:"Entidades pagadoras separadas do tipo de paciente",columns:["name","kind","reference","created_at"],
    fields:[["name","Nome da entidade","text"],["kind","Tipo","choice",true,["seguradora","empresa","instituicao"]],["reference","Contrato/referência","text",false]]},
  coverages:{title:"Assegurados e coberturas",description:"Relação contratual entre utente e entidade pagadora; não é um tipo de paciente",columns:["patient_id","partner_id","policy","percent","starts_on","ends_on"],
    fields:[["patientId","Paciente","patient"],["partnerId","Entidade pagadora","partner"],["policy","Apólice / convénio","text"],["percent","Cobertura (%)","int"],["startsOn","Início","date"],["endsOn","Fim","date"]]},
  encounters:{title:"Consultas e episódios",description:"Abertura e acompanhamento de episódios clínicos reais",columns:["patient_id","notes","status","created_at"],
    fields:[["patientId","Paciente","patient"],["notes","Nota clínica","textarea",false]]},
  appointments:{title:"Agenda e marcações",description:"Marcações persistentes por paciente, profissional e unidade",columns:["patient_id","professional","begins_at","status","created_at"],
    fields:[["patientId","Paciente","patient"],["professional","Profissional responsável","text"],["beginsAt","Data e hora","datetime-local"]]},
  triage:{title:"Triagem",description:"Registos clínicos de triagem associados a uma consulta",columns:["encounter_id","pressure","temperature","pulse","observations","created_at"],
    fields:[["encounterId","Consulta","encounter"],["pressure","Pressão arterial","text",false],["temperature","Temperatura","text",false],["pulse","Pulso","text",false],["observations","Observações","textarea",false]]},
  nursing:{title:"Enfermagem",description:"Registos de intervenções de enfermagem por episódio clínico",columns:["encounter_id","intervention","recorded_by","created_at"],
    fields:[["encounterId","Consulta","encounter"],["intervention","Intervenção realizada","textarea"]]},
  dispensations:{title:"Dispensa de produtos",description:"Saídas de stock vinculadas a pacientes, com controlo de quantidade",columns:["patient_id","item_id","quantity","reason","recorded_by","created_at"],
    fields:[["patientId","Paciente","patient"],["itemId","Produto","product"],["quantity","Quantidade","int"],["reason","Motivo da dispensa","text"]]},
  "lab-orders":{title:"Laboratório",description:"Pedidos de análises por consulta, com estados e validação",columns:["encounter_id","exam","status","result","created_at"],
    fields:[["encounterId","Consulta","encounter"],["exam","Exame solicitado","text"]]},
  products:{title:"Produtos e stock",description:"Inventário persistente com quantidade e preço",columns:["sku","name","quantity","unit","price_cents"],
    fields:[["sku","SKU","text"],["name","Produto","text"],["unit","Unidade","text"],["quantity","Quantidade inicial","int"],["priceCents","Preço (Kz)","money"]]},
  "stock-movements":{title:"Movimentos de stock",description:"Entradas e saídas auditadas; impedidas saídas com stock negativo",columns:["item_id","delta","reason","created_at"],
    fields:[["itemId","Produto","product"],["delta","Quantidade (+ entrada / - saída)","signed"],["reason","Motivo","text"]]},
  "service-entries":{title:"Serviços e encargos",description:"A parte da seguradora é calculada pelo contrato vigente; não é factura fiscal",columns:["patient_id","description","amount_cents","partner_cents","created_at"],
    fields:[["patientId","Paciente","patient"],["description","Serviço prestado","text"],["amountCents","Valor bruto (Kz)","money"],["coverageId","Cobertura (opcional)","coverage",false]]},
  "patient-payments":{title:"Pagamentos de pacientes",description:"Registo de recebimentos da responsabilidade do paciente",columns:["patient_id","amount_cents","reference","created_at"],
    fields:[["patientId","Paciente","patient"],["amountCents","Montante (Kz)","money"],["reference","Referência interna","text"]]},
  "partner-payments":{title:"Pagamentos de parceiros",description:"Conciliação de pagamentos por serviço prestado",columns:["service_id","amount_cents","reference","created_at"],
    fields:[["serviceId","Serviço a liquidar","service"],["amountCents","Montante (Kz)","money"],["reference","Referência do pagamento","text"]]},
  users:{title:"Utilizadores e permissões",description:"Contas administrativas e profissionais vinculadas ao hospital",columns:["email","role","active"],
    fields:[["email","Email do utilizador","email"],["password","Palavra-passe temporária (mínimo 12)","password"],["role","Função","choice",true,["admin","recepcao","medico","laboratorio","financeiro","farmacia","auditor"]]]},
  "audit-events":{title:"Auditoria de operações",description:"Registos de operações gravadas com identidade do utilizador",columns:["created_at","user_id","action","entity","entity_id"],fields:[]}
};
const nice={
 code:"Código",name:"Nome",begins_at:"Data e hora",professional:"Profissional",pressure:"Pressão arterial",temperature:"Temperatura",pulse:"Pulso",observations:"Observações",intervention:"Intervenção",recorded_by:"Registado por",birth_date:"Nascimento",phone:"Telefone",created_at:"Criado em",
 kind:"Tipo",reference:"Referência",patient_id:"Paciente",partner_id:"Parceiro",policy:"Apólice",
 percent:"%",starts_on:"Início",ends_on:"Fim",notes:"Notas",status:"Estado",exam:"Exame",
 result:"Resultado",encounter_id:"Consulta",sku:"SKU",quantity:"Qtd.",unit:"Unidade",
 price_cents:"Preço",item_id:"Produto",delta:"Movimento",reason:"Motivo",service_id:"Serviço",
 amount_cents:"Montante",partner_cents:"Parte do parceiro",email:"Email",role:"Função",
 active:"Activo",user_id:"Utilizador",action:"Acção",entity:"Entidade",entity_id:"Referência"};
const state={user:null,hospitalId:null,view:"dashboard",refs:new Map()};
let flashTimer;
async function api(path,{method="GET",data}={}){
 const res=await fetch("/api"+path,{method,credentials:"same-origin",headers:{
   "accept":"application/json",...(method!=="GET"?{"content-type":"application/json"}:{}),
   ...(state.hospitalId?{"x-hospital-id":state.hospitalId}:{})
 },...(method!=="GET"?{body:JSON.stringify(data??{})}:{})});
 let payload;
 try{payload=await res.json();}catch{throw Error("O servidor respondeu num formato inesperado.");}
 if(!res.ok)throw Error(payload.error||"Erro "+res.status);
 return payload;
}
function flash(message,ok=false){
 const el=$("#flash");el.hidden=false;el.classList.toggle("ok",ok);el.textContent=message;
 clearTimeout(flashTimer);flashTimer=setTimeout(()=>{el.hidden=true},6500);
}
const card=html=>'<section class="card"><div class="cardpad">'+html+'</div></section>';
function heading(title,description){
 $("#view-title").textContent=title;
 $("#view-description").textContent=description;
 $("#page-actions").replaceChildren();
}
function fillSelect(){
 const select=$("#hospital-select");
 select.replaceChildren(...state.user.memberships.map(m=>new Option(
   m.hospitalName||m.hospitalId.slice(0,8)+" · "+m.role,m.hospitalId)));
 if(!state.user.memberships.some(x=>x.hospitalId===state.hospitalId))
   state.hospitalId=state.user.memberships[0]?.hospitalId;
 select.value=state.hospitalId;
 $("#account").textContent=state.user.email;
}
async function login(email,password){
 const result=await api("/login",{method:"POST",data:{email,password}});
 state.user=result.user;
 await enter();
}
async function enter(){
 const hospitals=await api("/hospitals");
 if(!state.user)throw Error("Sessão inválida");
 state.user.memberships=state.user.memberships.map(m=>({...m,hospitalName:hospitals.find(x=>x.id===m.hospitalId)?.name}));
 if(!state.user.memberships.length)throw Error("Conta sem unidade atribuída");
 $("#login-screen").hidden=true;$("#workspace").hidden=false;$("#top-actions").hidden=false;
 fillSelect();await showView("dashboard");
}
async function reference(kind){
 const paths={patient:"patients",partner:"partners",encounter:"encounters",product:"products",coverage:"coverages",service:"service-entries"};
 const apiPath=paths[kind];if(!apiPath)return [];
 if(!state.refs.has(apiPath)){
   try{state.refs.set(apiPath,await api("/"+apiPath));}
   catch{state.refs.set(apiPath,[]);}
 }
 return state.refs.get(apiPath);
}
function selectLabel(kind,item){
 if(kind==="patient")return item.code+" — "+item.name;
 if(kind==="partner")return item.name+" ("+item.kind+")";
 if(kind==="encounter")return item.id.slice(0,8)+" · "+item.patient_id.slice(0,8);
 if(kind==="product")return item.sku+" — "+item.name;
 if(kind==="coverage")return item.policy+" · "+item.percent+"% · "+item.patient_id.slice(0,8);
 if(kind==="service")return item.description+" · "+money(item.partner_cents)+" / "+item.id.slice(0,8);
 return item.name||item.id;
}
async function fieldHtml(field){
 const [key,label,type,required=true,opts=[]]=field;
 const attrs='name="'+esc(key)+'" '+(required?'required ':'')+'aria-label="'+esc(label)+'"';
 if(["patient","partner","encounter","product","coverage","service"].includes(type)){
   const rows=await reference(type);
   return '<label>'+esc(label)+'<select '+attrs+'><option value="">'+(required?"Escolher":"Sem cobertura")+'</option>'
    +rows.map(x=>'<option value="'+esc(x.id)+'">'+esc(selectLabel(type,x))+'</option>').join("")+'</select></label>';
 }
 if(type==="choice")return '<label>'+esc(label)+'<select '+attrs+'>'+opts.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join("")+'</select></label>';
 if(type==="textarea")return '<label class="wide">'+esc(label)+'<textarea '+attrs+'></textarea></label>';
 const inputType=type==="money"||type==="int"||type==="signed"?"number":type;
 const extra=type==="money"?'min="0.01" step="0.01"':type==="int"?'min="0" step="1"':type==="signed"?'step="1"':type==="password"?'minlength="12"':'';
 return '<label>'+esc(label)+'<input type="'+inputType+'" '+attrs+' '+extra+'></label>';
}
function table(columns,rows){
 if(!rows.length)return '<div class="empty">Sem registos nesta unidade. Os dados serão apresentados assim que os criar.</div>';
 const head=columns.map(c=>'<th>'+esc(nice[c]||c)+'</th>').join("");
 const body=rows.map(row=>'<tr>'+columns.map(col=>{
  const value=row[col],isMoney=col.endsWith("_cents"),display=isMoney?money(value):value===null?"—":typeof value==="boolean"?value?"Sim":"Não":value;
  const abbreviated=typeof display==="string"&&display.length>175?display.slice(0,175)+"…":display;
  return '<td'+(isMoney?' class="money"':'')+'>'+esc(abbreviated)+'</td>';
 }).join("")+'</tr>').join("");
 return '<div class="table-wrap"><table><thead><tr>'+head+'</tr></thead><tbody>'+body+'</tbody></table></div>';
}
async function renderResource(view){
 const config=defs[view];heading(config.title,config.description);
 const target=$("#content");target.innerHTML=card('<p class="muted">A consultar o servidor...</p>');
 try{
  state.refs.clear();
  const rows=await api("/"+view);
  let form="";
  if(config.fields.length){
    const html=await Promise.all(config.fields.map(fieldHtml));
    form=card('<div class="form-card"><h2>Adicionar registo</h2><form id="resource-form" data-resource="'+view+'"><div class="form-grid">'+html.join("")+'</div><div class="form-actions"><button class="primary" type="submit">Gravar no sistema</button></div></form></div>');
  }
  target.innerHTML=form+'<section class="card"><div class="cardpad"><h2>'+rows.length+' registo(s) na unidade</h2></div>'+table(config.columns,rows)+'</section>';
  if(view==="lab-orders"&&rows.some(r=>["solicitado","colhido"].includes(r.status))){
    const actionRows=rows.filter(x=>["solicitado","colhido"].includes(x.status));
    target.innerHTML+=card('<h2>Validar etapas laboratoriais</h2><div class="form-grid"><label>Pedido<select id="order-id">'+actionRows.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.exam+" / "+x.id.slice(0,8))+'</option>').join("")+'</select></label><label>Próximo estado<select id="order-next"><option value="colhido">Colhido</option><option value="validado">Validado</option><option value="cancelado">Cancelado</option></select></label><label class="wide">Resultado validado (quando aplicável)<textarea id="order-result" placeholder="Ex.: resultado e unidades"></textarea></label></div><div class="form-actions"><button class="primary" id="apply-order" type="button">Guardar estado</button></div>');
  }
  $("#page-actions").innerHTML='<button class="secondary" id="refresh" type="button">↻ Actualizar</button>';
 }catch(error){target.innerHTML=card('<div class="warning">'+esc(error.message)+'</div>');}
}
async function renderDashboard(){
 heading("Painel operacional","Indicadores reais da unidade seleccionada, directamente da base persistente.");
 $("#content").innerHTML=card("A carregar indicadores...");
 try{
  const info=await api("/dashboard");
  const metrics=[
   ["Pacientes",info.counts.patients],["Parceiros",info.counts.partners],["Coberturas",info.counts.coverages],
   ["Consultas",info.counts.encounters],["Pedidos laboratoriais",info.counts.laboratory],["Produtos",info.counts.products],
   ["A receber de pacientes",money(info.patientReceivableCents)],["A receber de parceiros",money(info.partnerReceivableCents)]
  ];
  $("#content").innerHTML='<section class="metrics">'+metrics.map(([label,value])=>'<div class="metric"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>').join("")+'</section>'+
   card('<h2>Unidade activa</h2><p>Os valores apresentados são lidos da base de dados e restritos à unidade atribuída à sua conta.</p><div class="warning">Este sistema regista operações reais em disco persistente. O módulo de emissão fiscal da AGT permanece separado e não foi certificado nesta entrega.</div>');
 }catch(error){$("#content").innerHTML=card('<div class="warning">'+esc(error.message)+'</div>');}
}
async function renderReport(which){
 const isPatient=which==="patient-statement";
 heading(isPatient?"Extracto de conta do paciente":"Folha de cobrança do parceiro",
 isPatient?"Débitos, pagamentos e saldo cronológico por paciente.":"Serviços discriminados por utente, valor do parceiro, pagamento e saldo.");
 const source=isPatient?"patients":"partners";
 $("#content").innerHTML=card("A carregar...");
 try{
  const rows=await api("/"+source);
  const selector=rows.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.code?x.code+" · "+x.name:x.name)+'</option>').join("");
  $("#content").innerHTML=card('<h2>Escolha '+(isPatient?"o paciente":"a entidade pagadora")+'</h2><div class="form-actions"><select id="report-selector" aria-label="Escolha registo">'+selector+'</select><button id="load-report" class="primary">Gerar extracto</button><button id="print-report" class="secondary" type="button">Imprimir / PDF</button></div><p class="muted">Extractos administrativos internos; não são facturas nem documentos bancários.</p>')+'<div id="report-results"></div>';
  if(rows.length)await loadReport(which);
 }catch(error){$("#content").innerHTML=card('<div class="warning">'+esc(error.message)+'</div>');}
}
async function loadReport(which){
 const selected=$("#report-selector")?.value;
 if(!selected)return;
 try{
  if(which==="patient-statement"){
   const s=await api("/patients/"+selected+"/statement");
   $("#report-results").innerHTML=card('<div class="doc-head"><div><span class="kicker">EXTRACTO DE CONTA HOSPITALAR</span><h2>'+esc(s.patient.name)+'</h2><p class="muted">Processo: '+esc(s.patient.code)+'</p></div><span class="pill">Não fiscal</span></div>'+
     '<div class="metrics"><div class="metric"><span>Total débitos</span><strong>'+money(s.debitCents)+'</strong></div><div class="metric"><span>Pagamentos</span><strong>'+money(s.creditCents)+'</strong></div><div class="metric"><span>Saldo</span><strong>'+money(s.balanceCents)+'</strong></div></div>'+
     table(["date","description","debit_cents","credit_cents","balance_cents"],s.entries)+
     '<p class="footnote">'+esc(s.notice)+'</p>');
  }else{
   const s=await api("/partners/"+selected+"/collections");
   $("#report-results").innerHTML=card('<div class="doc-head"><div><span class="kicker">FOLHA DE COBRANÇA POR PACIENTE</span><h2>'+esc(s.partner.name)+'</h2></div><span class="pill">Não fiscal</span></div>'+
     '<div class="metrics"><div class="metric"><span>Total devido pelo parceiro</span><strong>'+money(s.billedCents)+'</strong></div><div class="metric"><span>Recebido</span><strong>'+money(s.receivedCents)+'</strong></div><div class="metric"><span>Por cobrar</span><strong>'+money(s.dueCents)+'</strong></div></div>'+
     table(["patient_code","patient_name","description","partner_cents","received_cents","due_cents"],s.entries)+
     '<p class="footnote">'+esc(s.notice)+'</p>');
  }
 }catch(error){flash(error.message);}
}
async function renderHospitals(){
 heading("Unidades hospitalares","Instituições e hospitais aos quais a sua conta tem acesso.");
 $("#content").innerHTML=card("A carregar unidades...");
 try{
  const units=await api("/hospitals");
  const rows=units.map(h=>({name:h.name,role:h.role,id:h.id}));
  const admin=units.some(h=>h.id===state.hospitalId&&h.role==="admin");
  $("#content").innerHTML=(admin?card('<h2>Registar nova unidade</h2><form id="hospital-form" class="form-grid"><label>Nome da unidade<input name="name" required maxlength="160" minlength="2" placeholder="Nome da unidade hospitalar"></label><div class="form-actions"><button class="primary" type="submit">Criar unidade</button></div></form>'):"")+
    '<section class="card"><div class="cardpad"><h2>Unidades atribuídas à conta</h2></div>'+table(["name","role","id"],rows)+'</section>';
 }catch(error){$("#content").innerHTML=card('<div class="warning">'+esc(error.message)+'</div>');}
}
async function showView(view){
 state.view=view;
 $("#navigation").querySelectorAll("button").forEach(x=>x.classList.toggle("active",x.dataset.view===view));
 if(view==="dashboard")return renderDashboard();
 if(view==="hospitals")return renderHospitals();
 if(["patient-statement","partner-collections"].includes(view))return renderReport(view);
 return renderResource(view);
}
$("#login-form").addEventListener("submit",async event=>{
 event.preventDefault();
 const form=new FormData(event.currentTarget);
 try{await login(String(form.get("email")),String(form.get("password")));event.currentTarget.reset();}
 catch(error){flash(error.message);}
});
$("#logout").addEventListener("click",async()=>{
 try{await api("/logout",{method:"POST",data:{}});}catch{}
 state.user=null;state.hospitalId=null;$("#workspace").hidden=true;$("#top-actions").hidden=true;$("#login-screen").hidden=false;
});
$("#hospital-select").addEventListener("change",async event=>{state.hospitalId=event.target.value;await showView(state.view);});
$("#navigation").addEventListener("click",event=>{const button=event.target.closest("button[data-view]");if(button)showView(button.dataset.view);});
$("#content").addEventListener("submit",async event=>{
 if(event.target.id==="hospital-form"){
  event.preventDefault();
  try{
   const name=String(new FormData(event.target).get("name")||"").trim();
   const newHospital=await api("/hospitals",{method:"POST",data:{name}});
   state.user=await api("/me");
   const hospitals=await api("/hospitals");
   state.user.memberships=state.user.memberships.map(m=>({...m,hospitalName:hospitals.find(h=>h.id===m.hospitalId)?.name}));
   state.hospitalId=newHospital.id;fillSelect();flash("Nova unidade criada.",true);await renderHospitals();
  }catch(error){flash(error.message);}return;
 }
 if(event.target.id!=="resource-form")return;
 event.preventDefault();
 const view=event.target.dataset.resource,config=defs[view],form=new FormData(event.target);
 const payload={};
 try{
  for(const [key,,type,required=true] of config.fields){
   const value=String(form.get(key)??"");
   if(!required&&!value)continue;
   if(type==="int"||type==="signed"){
     const n=Number(value);if(!Number.isSafeInteger(n))throw Error("Introduza um número inteiro válido.");
     payload[key]=n;
   }else if(type==="money"){
     const n=Number(value);if(!Number.isFinite(n)||n<=0)throw Error("Montante inválido.");
     payload[key]=Math.round(n*100);
   }else payload[key]=value;
  }
  await api("/"+view,{method:"POST",data:payload});
  flash("Registo gravado na base de dados.",true);await showView(view);
 }catch(error){flash(error.message);}
});
$("#content").addEventListener("click",async event=>{
 const id=event.target.id;
 if(id==="refresh")return showView(state.view);
 if(id==="load-report")return loadReport(state.view);
 if(id==="print-report")return window.print();
 if(id==="apply-order"){
  const orderId=$("#order-id").value,status=$("#order-next").value,result=$("#order-result").value;
  try{
   await api("/lab-orders/"+orderId,{method:"PATCH",data:{status,result}});
   flash("Estado laboratorial actualizado.",true);await showView("lab-orders");
  }catch(error){flash(error.message);}
 }
});
(async()=>{
 try{
  const user=await api("/me");state.user=user;
  await enter();
 }catch{ /* Not authenticated: display login form, never a simulated account. */ }
})();
