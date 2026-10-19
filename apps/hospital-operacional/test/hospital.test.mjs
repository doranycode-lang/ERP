import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase } from "../src/db.mjs";
import { createUser, passwordHash, verifyPassword } from "../src/auth.mjs";
import { createApp } from "../src/http.mjs";
import { randomUUID } from "node:crypto";

test("scrypt passwords are salted and reject invalid credentials",()=>{
 const h=passwordHash("UmaSenhaSegura#2026");
 assert.ok(verifyPassword("UmaSenhaSegura#2026",h));
 assert.equal(verifyPassword("senhaerrada",h),false);
 assert.notEqual(passwordHash("UmaSenhaSegura#2026"),h);
 assert.throws(()=>passwordHash("curta"));
});

test("real HTTP + SQLite: hospital isolation, clinical journey, stock, and ledgers",async()=>{
 const folder=mkdtempSync(join(tmpdir(),"ultracardio-test-"));
 const dbPath=join(folder,"hospital.sqlite");
 const database=openDatabase(dbPath);
 const hospitalA=randomUUID();
 database.prepare("INSERT INTO hospitals(id,name) VALUES(?,?)").run(hospitalA,"Hospital Alfa");
 const email="admin@example.test",password="SenhaSegura#Ultracardio2026";
 createUser(database,{email,password,hospitalId:hospitalA,role:"admin"});
 const app=createApp(database,{origin:"http://test.local",production:false});
 await new Promise(resolve=>app.listen(0,"127.0.0.1",resolve));
 const base="http://127.0.0.1:"+app.address().port;
 const call=async(path,{method="GET",data,cookie,hospitalId=hospitalA,origin="http://test.local"}={})=>{
  const res=await fetch(base+path,{method,redirect:"manual",headers:{
   ...(cookie?{cookie}:{}),
   ...(hospitalId?{"x-hospital-id":hospitalId}:{}),
   ...(method!=="GET"?{origin,"content-type":"application/json"}:{})
  },...(method!=="GET"?{body:JSON.stringify(data??{})}:{})});
  return {status:res.status,body:await res.json(),cookie:res.headers.get("set-cookie")};
 };
 try{
  const page=await fetch(base);
  assert.equal(page.status,200);
  assert.match(await page.text(),/ULTRACARDIO/);
  assert.equal((await call("/api/patients")).status,401);
  assert.equal((await call("/api/login",{method:"POST",data:{email,password:"senhaerrada"}})).status,401);
  const log=await call("/api/login",{method:"POST",data:{email,password}});
  assert.equal(log.status,200);
  assert.match(log.cookie,/HttpOnly/);
  const adminCookie=log.cookie.split(";")[0];
  const me=await call("/api/me",{cookie:adminCookie});
  assert.equal(me.body.memberships.length,1);
  // CSRF/origin is checked for every POST, including authenticated actions.
  assert.equal((await call("/api/patients",{method:"POST",data:{code:"A1",name:"Teste"},cookie:adminCookie,origin:"http://attacker.test"})).status,403);
  const aPatient=await call("/api/patients",{method:"POST",cookie:adminCookie,data:{code:"A-001",name:"Pessoa apenas de testes"}});
  assert.equal(aPatient.status,201);
  const patientA=aPatient.body.id;
  assert.equal((await call("/api/patients",{cookie:adminCookie})).body.length,1);
  const bHospital=await call("/api/hospitals",{method:"POST",cookie:adminCookie,data:{name:"Hospital Beta"}});
  assert.equal(bHospital.status,201);
  const hospitalB=bHospital.body.id;
  const newBUser=await call("/api/users",{method:"POST",cookie:adminCookie,hospitalId:hospitalB,
    data:{email:"recepcao@example.test",password:"TesteRecepcao#2026",role:"recepcao"}});
  assert.equal(newBUser.status,201);
  const bLogin=await call("/api/login",{method:"POST",data:{email:"recepcao@example.test",password:"TesteRecepcao#2026"}});
  assert.equal(bLogin.status,200);
  const cookieB=bLogin.cookie.split(";")[0];
  assert.equal((await call("/api/patients",{cookie:cookieB,hospitalId:hospitalA})).status,403);
  assert.equal((await call("/api/partners",{method:"POST",cookie:cookieB,hospitalId:hospitalB,data:{name:"Indevida",kind:"empresa"}})).status,403);
  const patientB=await call("/api/patients",{method:"POST",cookie:cookieB,hospitalId:hospitalB,data:{code:"B-001",name:"Pessoa hospital Beta"}});
  assert.equal(patientB.status,201);
  assert.equal((await call("/api/patients",{cookie:adminCookie,hospitalId:hospitalA})).body.length,1);
  assert.equal((await call("/api/patients",{cookie:adminCookie,hospitalId:hospitalB})).body.length,1);
  // Hospital A cannot reference a patient from B in a consultation.
  assert.equal((await call("/api/encounters",{method:"POST",cookie:adminCookie,data:{patientId:patientB.body.id,notes:"Proibido"}})).status,404);
  const partner=await call("/api/partners",{method:"POST",cookie:adminCookie,data:{name:"Seguradora Fictícia",kind:"seguradora",reference:"CONV-A"}});
  assert.equal(partner.status,201);
  const coverage=await call("/api/coverages",{method:"POST",cookie:adminCookie,
    data:{patientId:patientA,partnerId:partner.body.id,policy:"POL-123",percent:80,startsOn:"2026-01-01",endsOn:"2030-12-31"}});
  assert.equal(coverage.status,201);
  const service=await call("/api/service-entries",{method:"POST",cookie:adminCookie,
    data:{patientId:patientA,description:"Consulta de homologação",amountCents:100000,coverageId:coverage.body.id}});
  assert.equal(service.status,201);
  assert.equal(service.body.partnerCents,80000);
  assert.equal(service.body.patientCents,20000);
  assert.equal((await call("/api/patients/"+patientA+"/statement",{cookie:adminCookie})).body.balanceCents,20000);
  assert.equal((await call("/api/patients/"+patientB.body.id+"/statement",{cookie:adminCookie})).status,404);
  const payPatient=await call("/api/patient-payments",{method:"POST",cookie:adminCookie,
    data:{patientId:patientA,amountCents:10000,reference:"CAIXA-001"}});
  assert.equal(payPatient.status,201);
  assert.equal((await call("/api/patients/"+patientA+"/statement",{cookie:adminCookie})).body.balanceCents,10000);
  assert.equal((await call("/api/patient-payments",{method:"POST",cookie:adminCookie,
    data:{patientId:patientA,amountCents:10001,reference:"EXCESSO"}})).status,409);
  const payPartner=await call("/api/partner-payments",{method:"POST",cookie:adminCookie,
    data:{serviceId:service.body.id,amountCents:50000,reference:"TRANSFERENCIA-001"}});
  assert.equal(payPartner.status,201);
  assert.equal((await call("/api/partners/"+partner.body.id+"/collections",{cookie:adminCookie})).body.dueCents,30000);
  assert.equal((await call("/api/partners/"+partner.body.id+"/collections",{cookie:adminCookie,hospitalId:hospitalB})).status,404);
  assert.equal((await call("/api/partner-payments",{method:"POST",cookie:adminCookie,
    data:{serviceId:service.body.id,amountCents:30001,reference:"EXCESSO"}})).status,409);
  const episode=await call("/api/encounters",{method:"POST",cookie:adminCookie,data:{patientId:patientA,notes:"Consulta teste"}});
  assert.equal(episode.status,201);
  const appointment=await call("/api/appointments",{method:"POST",cookie:adminCookie,
    data:{patientId:patientA,beginsAt:"2026-10-20T09:30",professional:"Dr. Exemplo"}});
  assert.equal(appointment.status,201);
  assert.equal((await call("/api/appointments",{method:"POST",cookie:adminCookie,
    data:{patientId:patientA,beginsAt:"2026-10-20T09:30",professional:"Dr. Exemplo"}})).status,409);
  assert.equal((await call("/api/appointments",{method:"POST",cookie:adminCookie,
    data:{patientId:patientB.body.id,beginsAt:"2026-10-21T09:30",professional:"Dr. Exemplo"}})).status,404);
  const nurseUser=await call("/api/users",{method:"POST",cookie:adminCookie,
    data:{email:"enfermagem@example.test",password:"Enfermeira#2026Teste",role:"enfermagem"}});
  assert.equal(nurseUser.status,201);
  const nurseLogin=await call("/api/login",{method:"POST",
    data:{email:"enfermagem@example.test",password:"Enfermeira#2026Teste"}});
  assert.equal(nurseLogin.status,200);
  const nurseCookie=nurseLogin.cookie.split(";")[0];
  assert.equal((await call("/api/patients",{method:"POST",cookie:nurseCookie,data:{code:"NEGADO",name:"Não permitido"}})).status,403);
  const triage=await call("/api/triage",{method:"POST",cookie:nurseCookie,
    data:{encounterId:episode.body.id,pressure:"120/80",temperature:"36.7",pulse:"78",observations:"Registo apenas técnico"}});
  assert.equal(triage.status,201);
  const note=await call("/api/nursing",{method:"POST",cookie:nurseCookie,
    data:{encounterId:episode.body.id,intervention:"Monitorização de enfermagem registada para testes"}});
  assert.equal(note.status,201);
  assert.equal((await call("/api/triage",{cookie:adminCookie})).body.length,1);
  assert.equal((await call("/api/nursing",{cookie:adminCookie})).body.length,1);
  const lab=await call("/api/lab-orders",{method:"POST",cookie:adminCookie,data:{encounterId:episode.body.id,exam:"Glicemia"}});
  assert.equal(lab.status,201);
  assert.equal((await call("/api/lab-orders/"+lab.body.id,{method:"PATCH",cookie:adminCookie,data:{status:"colhido"}})).status,200);
  assert.equal((await call("/api/lab-orders/"+lab.body.id,{method:"PATCH",cookie:adminCookie,data:{status:"validado",result:"Resultado fictício para teste técnico"}})).status,200);
  assert.equal((await call("/api/lab-orders/"+lab.body.id,{method:"PATCH",cookie:adminCookie,data:{status:"colhido"}})).status,409);
  const item=await call("/api/products",{method:"POST",cookie:adminCookie,data:{sku:"TEST-01",name:"Luvas",unit:"un",quantity:5,priceCents:200}});
  assert.equal(item.status,201);
  const movement=await call("/api/stock-movements",{method:"POST",cookie:adminCookie,data:{itemId:item.body.id,delta:-3,reason:"Consumo de teste"}});
  assert.equal(movement.body.quantity,2);
  assert.equal((await call("/api/stock-movements",{method:"POST",cookie:adminCookie,data:{itemId:item.body.id,delta:-3,reason:"Sem saldo"}})).status,409);
  const dispense=await call("/api/dispensations",{method:"POST",cookie:adminCookie,
    data:{patientId:patientA,itemId:item.body.id,quantity:1,reason:"Dispensa operacional de teste"}});
  assert.equal(dispense.status,201);
  assert.equal(dispense.body.remaining,1);
  assert.equal((await call("/api/dispensations",{method:"POST",cookie:adminCookie,
    data:{patientId:patientB.body.id,itemId:item.body.id,quantity:1,reason:"Outra unidade"}})).status,404);
  assert.equal((await call("/api/products",{cookie:adminCookie})).body[0].quantity,1);
  assert.equal((await call("/api/stock-movements",{cookie:adminCookie})).body.length,2);
  const dash=await call("/api/dashboard",{cookie:adminCookie});
  assert.equal(dash.body.counts.patients,1);
  assert.equal(dash.body.partnerReceivableCents,30000);
  assert.ok((await call("/api/audit-events",{cookie:adminCookie})).body.length>=8);
  const logout=await call("/api/logout",{method:"POST",cookie:adminCookie,data:{}});
  assert.equal(logout.status,200);
  assert.equal((await call("/api/me",{cookie:adminCookie})).status,401);
  assert.equal((await call("/api/signup",{method:"POST",data:{}})).status,401);
  assert.equal((await call("/api/patients",{cookie:cookieB,hospitalId:hospitalB})).body.length,1);
 }finally{
  await new Promise(resolve=>app.close(resolve));
  database.close();
  const reopened=openDatabase(dbPath);
  assert.equal(reopened.prepare("SELECT COUNT(*) AS n FROM patients").get().n,2);
  assert.equal(reopened.prepare("SELECT COUNT(*) AS n FROM partner_payments").get().n,1);
  reopened.close();
  rmSync(folder,{recursive:true,force:true});
 }
});
