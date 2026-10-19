import { atomic } from "./db.mjs";
import { createUser } from "./auth.mjs";
import { id, bad, text, choice, whole, date, existing, audit } from "./validation.mjs";

const readSql={
  patients:"SELECT id,code,name,birth_date,phone,created_at FROM patients WHERE hospital_id=? ORDER BY created_at DESC,id DESC LIMIT 200",
  partners:"SELECT * FROM partners WHERE hospital_id=? ORDER BY created_at DESC,id DESC LIMIT 200",
  coverages:"SELECT * FROM coverages WHERE hospital_id=? ORDER BY created_at DESC,id DESC LIMIT 200",
  encounters:"SELECT * FROM encounters WHERE hospital_id=? ORDER BY created_at DESC,id DESC LIMIT 200",
  appointments:"SELECT * FROM appointments WHERE hospital_id=? ORDER BY begins_at DESC LIMIT 200",
  triage:"SELECT * FROM triage_notes WHERE hospital_id=? ORDER BY created_at DESC,id DESC LIMIT 200",
  nursing:"SELECT * FROM nursing_notes WHERE hospital_id=? ORDER BY created_at DESC,id DESC LIMIT 200",
  dispensations:"SELECT * FROM dispensations WHERE hospital_id=? ORDER BY created_at DESC,id DESC LIMIT 200",
  "lab-orders":"SELECT * FROM lab_orders WHERE hospital_id=? ORDER BY created_at DESC,id DESC LIMIT 200",
  products:"SELECT * FROM stock_items WHERE hospital_id=? ORDER BY name ASC LIMIT 200",
  "service-entries":"SELECT * FROM service_entries WHERE hospital_id=? ORDER BY created_at DESC,id DESC LIMIT 200",
  "patient-payments":"SELECT * FROM patient_payments WHERE hospital_id=? ORDER BY created_at DESC,id DESC LIMIT 200",
  "partner-payments":"SELECT * FROM partner_payments WHERE hospital_id=? ORDER BY created_at DESC,id DESC LIMIT 200",
  "stock-movements":"SELECT * FROM stock_movements WHERE hospital_id=? ORDER BY created_at DESC,id DESC LIMIT 200",
  "audit-events":"SELECT * FROM audit_events WHERE hospital_id=? ORDER BY created_at DESC,id DESC LIMIT 200"
};
export function list(db,scope,resource){
  if(!Object.hasOwn(readSql,resource))throw bad("Módulo desconhecido",404);
  return db.prepare(readSql[resource]).all(scope.hospitalId);
}
export function dashboard(db,scope){
  const counts={};
  for(const [key,table] of Object.entries({patients:"patients",partners:"partners",coverages:"coverages",encounters:"encounters",laboratory:"lab_orders",appointments:"appointments",triage:"triage_notes",nursing:"nursing_notes",dispensations:"dispensations",products:"stock_items",services:"service_entries"}))
    counts[key]=db.prepare("SELECT COUNT(*) AS total FROM "+table+" WHERE hospital_id=?").get(scope.hospitalId).total;
  const stock=db.prepare("SELECT COALESCE(SUM(quantity),0) AS quantity FROM stock_items WHERE hospital_id=?").get(scope.hospitalId);
  const service=db.prepare("SELECT COALESCE(SUM(amount_cents),0) AS total,COALESCE(SUM(partner_cents),0) AS partners FROM service_entries WHERE hospital_id=?").get(scope.hospitalId);
  const patientPayments=db.prepare("SELECT COALESCE(SUM(amount_cents),0) AS total FROM patient_payments WHERE hospital_id=?").get(scope.hospitalId).total;
  const partnerPayments=db.prepare("SELECT COALESCE(SUM(amount_cents),0) AS total FROM partner_payments WHERE hospital_id=?").get(scope.hospitalId).total;
  return {counts,stockQuantity:stock.quantity,
    patientReceivableCents:service.total-service.partners-patientPayments,
    partnerReceivableCents:service.partners-partnerPayments,
    warning:"Valores administrativos internos; NÃO são facturas fiscais"};
}
export function create(db,scope,resource,body){
  const h=scope.hospitalId;
  const newId=id();
  return atomic(db,()=>{
    let result;
    switch(resource){
      case "patients":{
        const code=text(body,"code",{max:40}),name=text(body,"name",{max:180});
        const birth=body.birthDate?date(body,"birthDate"):null;
        const phone=text(body,"phone",{optional:true,max:40});
        db.prepare("INSERT INTO patients(id,hospital_id,code,name,birth_date,phone) VALUES(?,?,?,?,?,?)").run(newId,h,code,name,birth,phone);
        result={id:newId,code,name,birthDate:birth,phone};break;
      }
      case "partners":{
        const name=text(body,"name",{max:180}),kind=choice(body,"kind",["seguradora","empresa","instituicao"]);
        const reference=text(body,"reference",{optional:true,max:80});
        db.prepare("INSERT INTO partners(id,hospital_id,name,kind,reference) VALUES(?,?,?,?,?)").run(newId,h,name,kind,reference);
        result={id:newId,name,kind,reference};break;
      }
      case "coverages":{
        const patientId=text(body,"patientId",{max:36}),partnerId=text(body,"partnerId",{max:36});
        existing(db,"patients",h,patientId);existing(db,"partners",h,partnerId);
        const policy=text(body,"policy",{max:90}),percent=whole(body,"percent",{max:100});
        const startsOn=date(body,"startsOn"),endsOn=date(body,"endsOn");
        if(endsOn<startsOn)throw bad("A data final precede a data inicial");
        db.prepare("INSERT INTO coverages(id,hospital_id,patient_id,partner_id,policy,percent,starts_on,ends_on) VALUES(?,?,?,?,?,?,?,?)")
          .run(newId,h,patientId,partnerId,policy,percent,startsOn,endsOn);
        result={id:newId,patientId,partnerId,policy,percent,startsOn,endsOn};break;
      }
      case "encounters":{
        const patientId=text(body,"patientId",{max:36});
        existing(db,"patients",h,patientId);
        const notes=text(body,"notes",{max:3000,min:0,optional:true})||"";
        db.prepare("INSERT INTO encounters(id,hospital_id,patient_id,notes) VALUES(?,?,?,?)").run(newId,h,patientId,notes);
        result={id:newId,patientId,notes,status:"aberta"};break;
      }
      case "lab-orders":{
        const encounterId=text(body,"encounterId",{max:36}),exam=text(body,"exam",{max:150});
        const encounter=existing(db,"encounters",h,encounterId);
        if(encounter.status!=="aberta")throw bad("Consulta encerrada");
        db.prepare("INSERT INTO lab_orders(id,hospital_id,encounter_id,exam) VALUES(?,?,?,?)").run(newId,h,encounterId,exam);
        result={id:newId,encounterId,exam,status:"solicitado"};break;
      }
      case "products":{
        const sku=text(body,"sku",{max:70}),name=text(body,"name",{max:180}),unit=text(body,"unit",{max:25});
        const quantity=whole(body,"quantity",{max:10000000}),price=whole(body,"priceCents");
        db.prepare("INSERT INTO stock_items(id,hospital_id,sku,name,unit,quantity,price_cents) VALUES(?,?,?,?,?,?,?)")
          .run(newId,h,sku,name,unit,quantity,price);
        result={id:newId,sku,name,quantity,unit,priceCents:price};break;
      }
      case "appointments":{
        const patientId=text(body,"patientId",{max:36}),professional=text(body,"professional",{max:160});
        const beginsAt=text(body,"beginsAt",{min:16,max:16});
        if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(beginsAt)||!Number.isFinite(Date.parse(beginsAt+":00Z")))throw bad("Data ou hora inválidas");
        existing(db,"patients",h,patientId);
        db.prepare("INSERT INTO appointments(id,hospital_id,patient_id,begins_at,professional) VALUES(?,?,?,?,?)")
          .run(newId,h,patientId,beginsAt,professional);
        result={id:newId,patientId,beginsAt,professional,status:"marcada"};break;
      }
      case "triage":{
        const encounterId=text(body,"encounterId",{max:36}),encounter=existing(db,"encounters",h,encounterId);
        if(encounter.status!=="aberta")throw bad("Consulta encerrada");
        const pressure=text(body,"pressure",{optional:true,max:35});
        const temperature=text(body,"temperature",{optional:true,max:35});
        const pulse=text(body,"pulse",{optional:true,max:35});
        const observations=text(body,"observations",{optional:true,max:1500})||"";
        db.prepare("INSERT INTO triage_notes(id,hospital_id,encounter_id,pressure,temperature,pulse,observations,recorded_by) VALUES(?,?,?,?,?,?,?,?)")
          .run(newId,h,encounterId,pressure,temperature,pulse,observations,scope.userId);
        result={id:newId,encounterId,pressure,temperature,pulse,observations};break;
      }
      case "nursing":{
        const encounterId=text(body,"encounterId",{max:36}),intervention=text(body,"intervention",{max:3000});
        const encounter=existing(db,"encounters",h,encounterId);
        if(encounter.status!=="aberta")throw bad("Consulta encerrada");
        db.prepare("INSERT INTO nursing_notes(id,hospital_id,encounter_id,intervention,recorded_by) VALUES(?,?,?,?,?)")
          .run(newId,h,encounterId,intervention,scope.userId);
        result={id:newId,encounterId,intervention};break;
      }
      case "dispensations":{
        const patientId=text(body,"patientId",{max:36}),itemId=text(body,"itemId",{max:36});
        const quantity=whole(body,"quantity",{min:1,max:1000000}),reason=text(body,"reason",{max:250});
        existing(db,"patients",h,patientId);existing(db,"stock_items",h,itemId);
        const stock=db.prepare("UPDATE stock_items SET quantity=quantity-? WHERE id=? AND hospital_id=? AND quantity>=? RETURNING quantity")
          .get(quantity,itemId,h,quantity);
        if(!stock)throw bad("Stock insuficiente",409);
        db.prepare("INSERT INTO dispensations(id,hospital_id,patient_id,item_id,quantity,reason,recorded_by) VALUES(?,?,?,?,?,?,?)")
          .run(newId,h,patientId,itemId,quantity,reason,scope.userId);
        db.prepare("INSERT INTO stock_movements(id,hospital_id,item_id,delta,reason) VALUES(?,?,?,?,?)")
          .run(id(),h,itemId,-quantity,"Dispensa ao paciente: "+reason);
        result={id:newId,patientId,itemId,quantity,remaining:stock.quantity};break;
      }
      case "stock-movements":{
        const itemId=text(body,"itemId",{max:36}),reason=text(body,"reason",{max:250});
        const delta=whole(body,"delta",{min:-10000000,max:10000000});
        if(delta===0)throw bad("Movimento nulo");
        existing(db,"stock_items",h,itemId);
        const updated=db.prepare("UPDATE stock_items SET quantity=quantity+? WHERE hospital_id=? AND id=? AND quantity+?>=0 RETURNING quantity")
          .get(delta,h,itemId,delta);
        if(!updated)throw bad("Stock insuficiente",409);
        db.prepare("INSERT INTO stock_movements(id,hospital_id,item_id,delta,reason) VALUES(?,?,?,?,?)")
          .run(newId,h,itemId,delta,reason);
        result={id:newId,itemId,delta,quantity:updated.quantity};break;
      }
      case "service-entries":{
        const patientId=text(body,"patientId",{max:36}),description=text(body,"description",{max:240});
        const amount=whole(body,"amountCents",{min:1});
        existing(db,"patients",h,patientId);
        let coverageId=null,partnerId=null,partnerCents=0;
        if(body.coverageId){
          const coverage=existing(db,"coverages",h,text(body,"coverageId",{max:36}));
          if(coverage.patient_id!==patientId||coverage.active!==1)throw bad("Cobertura não pertence ao paciente");
          const today=new Date().toISOString().slice(0,10);
          if(today<coverage.starts_on||today>coverage.ends_on)throw bad("Cobertura fora de validade");
          coverageId=coverage.id;partnerId=coverage.partner_id;
          partnerCents=Math.round(amount*coverage.percent/100);
        }
        db.prepare("INSERT INTO service_entries(id,hospital_id,patient_id,partner_id,coverage_id,description,amount_cents,partner_cents) VALUES(?,?,?,?,?,?,?,?)")
          .run(newId,h,patientId,partnerId,coverageId,description,amount,partnerCents);
        result={id:newId,patientId,description,amountCents:amount,partnerCents,patientCents:amount-partnerCents};break;
      }
      case "patient-payments":{
        const patientId=text(body,"patientId",{max:36}),reference=text(body,"reference",{max:90});
        const amount=whole(body,"amountCents",{min:1});
        existing(db,"patients",h,patientId);
        const due=patientStatement(db,scope,patientId).balanceCents;
        if(amount>due)throw bad("Pagamento superior ao saldo do paciente",409);
        db.prepare("INSERT INTO patient_payments(id,hospital_id,patient_id,amount_cents,reference) VALUES(?,?,?,?,?)")
          .run(newId,h,patientId,amount,reference);
        result={id:newId,patientId,amountCents:amount,reference};break;
      }
      case "partner-payments":{
        const serviceId=text(body,"serviceId",{max:36}),reference=text(body,"reference",{max:90});
        const amount=whole(body,"amountCents",{min:1});
        const service=existing(db,"service_entries",h,serviceId);
        if(!service.partner_id)throw bad("Serviço sem parceiro");
        const paid=db.prepare("SELECT COALESCE(SUM(amount_cents),0) AS total FROM partner_payments WHERE hospital_id=? AND service_id=?")
          .get(h,serviceId).total;
        if(paid+amount>service.partner_cents)throw bad("Pagamento superior à dívida do parceiro",409);
        db.prepare("INSERT INTO partner_payments(id,hospital_id,service_id,partner_id,amount_cents,reference) VALUES(?,?,?,?,?,?)")
          .run(newId,h,serviceId,service.partner_id,amount,reference);
        result={id:newId,serviceId,amountCents:amount,reference};break;
      }
      default:throw bad("Módulo não disponível",404);
    }
    audit(db,scope,"create",resource,newId);
    return result;
  });
}
export function labTransition(db,scope,orderId,body){
  return atomic(db,()=>{
    const order=existing(db,"lab_orders",scope.hospitalId,orderId);
    const next=choice(body,"status",["colhido","validado","cancelado"]);
    const valid=(order.status==="solicitado"&&["colhido","cancelado"].includes(next))||(order.status==="colhido"&&["validado","cancelado"].includes(next));
    if(!valid)throw bad("Transição de estado laboratorial inválida",409);
    const result=next==="validado"?text(body,"result",{max:2000}):null;
    db.prepare("UPDATE lab_orders SET status=?,result=? WHERE hospital_id=? AND id=?")
      .run(next,result,scope.hospitalId,orderId);
    audit(db,scope,"update","lab-orders",orderId);
    return {id:orderId,status:next,result};
  });
}
export function patientStatement(db,scope,patientId){
  const patient=existing(db,"patients",scope.hospitalId,patientId);
  const events=[
    ...db.prepare("SELECT id,created_at AS date,description,amount_cents-partner_cents AS debit_cents,0 AS credit_cents FROM service_entries WHERE hospital_id=? AND patient_id=?")
      .all(scope.hospitalId,patientId),
    ...db.prepare("SELECT id,created_at AS date,reference AS description,0 AS debit_cents,amount_cents AS credit_cents FROM patient_payments WHERE hospital_id=? AND patient_id=?")
      .all(scope.hospitalId,patientId)
  ].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  let balance=0,debits=0,credits=0;
  const entries=events.map(e=>{debits+=e.debit_cents;credits+=e.credit_cents;balance+=e.debit_cents-e.credit_cents;return {...e,balance_cents:balance};});
  return {patient:{id:patient.id,code:patient.code,name:patient.name},entries,
    debitCents:debits,creditCents:credits,balanceCents:balance,
    notice:"Extracto de conta hospitalar; não é extracto bancário nem documento fiscal."};
}
export function partnerCollections(db,scope,partnerId){
  const partner=existing(db,"partners",scope.hospitalId,partnerId);
  const services=db.prepare(`SELECT s.id,s.description,s.amount_cents,s.partner_cents,s.created_at,
    p.id AS patient_id,p.code AS patient_code,p.name AS patient_name
    FROM service_entries s JOIN patients p ON p.hospital_id=s.hospital_id AND p.id=s.patient_id
    WHERE s.hospital_id=? AND s.partner_id=? ORDER BY s.created_at,s.id`).all(scope.hospitalId,partnerId);
  let billed=0,paid=0;
  const entries=services.map(s=>{
    const received=db.prepare("SELECT COALESCE(SUM(amount_cents),0) AS total FROM partner_payments WHERE hospital_id=? AND service_id=?")
      .get(scope.hospitalId,s.id).total;
    billed+=s.partner_cents;paid+=received;
    return {...s,received_cents:received,due_cents:s.partner_cents-received};
  });
  return {partner:{id:partner.id,name:partner.name,kind:partner.kind},entries,
    billedCents:billed,receivedCents:paid,dueCents:billed-paid,
    notice:"Folha interna de cobrança discriminada por paciente; não é factura fiscal AGT."};
}
export function usersForHospital(db,scope){
  return db.prepare(`SELECT u.id,u.email,u.active,m.role FROM users u
    JOIN memberships m ON m.user_id=u.id WHERE m.hospital_id=? ORDER BY u.email`).all(scope.hospitalId);
}
export function newUser(db,scope,body){
  if(scope.role!=="admin")throw bad("Sem permissão",403);
  const account=createUser(db,{email:text(body,"email",{max:254}),
    password:text(body,"password",{min:12,max:256}),hospitalId:scope.hospitalId,
    role:choice(body,"role",["admin","recepcao","medico","enfermagem","laboratorio","financeiro","farmacia","auditor"])});
  audit(db,scope,"create","user",account.id);
  return account;
}
