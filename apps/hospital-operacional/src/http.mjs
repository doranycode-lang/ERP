import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { atomic } from "./db.mjs";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { authenticate, cookie, sessionActor, revoke, scopeFor, can } from "./auth.mjs";
import { bad, text, audit } from "./validation.mjs";
import { list, create, dashboard, patientStatement, partnerCollections, labTransition, newUser, usersForHospital } from "./domain.mjs";

const root=join(dirname(fileURLToPath(import.meta.url)),"../public");
const staticPaths=Object.freeze({"/":"index.html","/app.js":"app.js","/style.css":"style.css"});
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8"};
const permission={
 appointments:"appointments",triage:"triage",nursing:"nursing",dispensations:"dispensations",
 patients:"patients",partners:"partners",coverages:"coverages",encounters:"encounters",
 "lab-orders":"lab",products:"stock","stock-movements":"stock",
 "service-entries":"finance","patient-payments":"finance","partner-payments":"finance","audit-events":"audit"
};
function respond(res,status,body,headers={}){
 res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers});
 res.end(JSON.stringify(body));
}
async function parseBody(req){
 if(!/^application\/json(?:;|$)/i.test(req.headers["content-type"]||""))throw bad("É obrigatório enviar JSON",415);
 let bytes=0,parts=[];
 for await(const buf of req){
   bytes+=buf.length;
   if(bytes>65536)throw bad("Pedido demasiado grande",413);
   parts.push(buf);
 }
 try{
  const value=JSON.parse(Buffer.concat(parts).toString("utf8"));
  if(value===null||typeof value!=="object"||Array.isArray(value))throw Error();
  return value;
 }catch{throw bad("JSON inválido");}
}
const attempts=new Map();
function throttle(key){
 const now=Date.now(),limit=15*60_000;
 if(attempts.size>10000)attempts.clear();
 const a=attempts.get(key);
 if(!a||now-a.start>limit){attempts.set(key,{count:1,start:now});return;}
 if(++a.count>6)throw bad("Muitas tentativas. Aguarde 15 minutos.",429);
}
function publicMe(actor){
 return {id:actor.id,email:actor.email,memberships:actor.memberships};
}
export function createApp(db,{origin=process.env.APP_ORIGIN,production=process.env.NODE_ENV==="production"}={}){
 if(production&&(!origin||!origin.startsWith("https://")))throw Error("APP_ORIGIN HTTPS obrigatório em produção");
 const allowedOrigin=origin||"http://127.0.0.1:3000";
 return createServer(async(req,res)=>{
   res.setHeader("x-content-type-options","nosniff");
   res.setHeader("referrer-policy","no-referrer");
   res.setHeader("x-frame-options","DENY");
   res.setHeader("permissions-policy","camera=(), microphone=(), geolocation=()");
   res.setHeader("content-security-policy","default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
   try{
     const url=new URL(req.url||"/","http://internal");
     const path=url.pathname;
     if(path==="/api/health"&&req.method==="GET")
       return respond(res,200,{status:"ready",app:"ULTRACARDIO Hospital Operacional"});
     if(!path.startsWith("/api/")){
       if(req.method!=="GET"||!Object.hasOwn(staticPaths,path))return respond(res,404,{error:"pagina_nao_encontrada"});
       const filename=staticPaths[path];
       const file=await readFile(join(root,filename));
       const ext=filename.slice(filename.lastIndexOf("."));
       res.writeHead(200,{"content-type":mime[ext],"cache-control":"no-store"});
       return res.end(file);
     }
     if(!["GET","POST","PATCH"].includes(req.method))return respond(res,405,{error:"metodo_nao_permitido"});
     // Strict request origin on all mutating actions; never rely on cookies alone.
     if(req.method!=="GET"&&req.headers.origin!==allowedOrigin)throw bad("Origem não autorizada",403);
     if(path==="/api/login"&&req.method==="POST"){
       const payload=await parseBody(req);
       throttle(String(req.socket.remoteAddress)+":"+String(payload.email).toLowerCase().slice(0,150));
       const value=authenticate(db,payload.email,payload.password);
       if(!value)return respond(res,401,{error:"Credenciais inválidas"});
       return respond(res,200,{user:value.user}, {"set-cookie":cookie(value.token,{secure:production})});
     }
     if(path==="/api/logout"&&req.method==="POST"){
       revoke(db,req.headers);
       return respond(res,200,{ok:true},{"set-cookie":cookie("",{secure:production,maxAge:0})});
     }
     const actor=sessionActor(db,req.headers);
     if(!actor)return respond(res,401,{error:"Sessão inexistente ou expirada"});
     if(path==="/api/me"&&req.method==="GET")return respond(res,200,publicMe(actor));
     if(path==="/api/hospitals"&&req.method==="GET"){
       const hospitals=actor.memberships.map(m=>{
         const hospital=db.prepare("SELECT id,name FROM hospitals WHERE id=?").get(m.hospitalId);
         return {...hospital,role:m.role};
       });
       return respond(res,200,hospitals);
     }
     if(path==="/api/hospitals"&&req.method==="POST"){
       const scope=scopeFor(actor,req.headers);
       if(scope.role!=="admin")throw bad("Apenas administradores podem criar unidades",403);
       const data=await parseBody(req),name=text(data,"name",{max:160}),hospitalId=randomUUID();
       atomic(db,()=>{
         db.prepare("INSERT INTO hospitals(id,name) VALUES(?,?)").run(hospitalId,name);
         db.prepare("INSERT INTO memberships(user_id,hospital_id,role) VALUES(?,?,'admin')").run(actor.id,hospitalId);
         audit(db,scope,"create","hospital",hospitalId);
       });
       return respond(res,201,{id:hospitalId,name,role:"admin"});
     }
     const scope=scopeFor(actor,req.headers);
     if(path==="/api/dashboard"&&req.method==="GET"){
       if(!can(scope.role,"patients.read")&&!can(scope.role,"stock.read"))throw bad("Acesso negado",403);
       return respond(res,200,dashboard(db,scope));
     }
     if(path==="/api/users"){
       if(scope.role!=="admin")throw bad("Acesso negado",403);
       if(req.method==="GET")return respond(res,200,usersForHospital(db,scope));
       if(req.method==="POST")return respond(res,201,newUser(db,scope,await parseBody(req)));
     }
     const statement=path.match(/^\/api\/patients\/([0-9a-f-]{36})\/statement$/i);
     if(statement&&req.method==="GET"){
       if(!can(scope.role,"finance.read"))throw bad("Acesso negado",403);
       return respond(res,200,patientStatement(db,scope,statement[1]));
     }
     const collections=path.match(/^\/api\/partners\/([0-9a-f-]{36})\/collections$/i);
     if(collections&&req.method==="GET"){
       if(!can(scope.role,"finance.read"))throw bad("Acesso negado",403);
       return respond(res,200,partnerCollections(db,scope,collections[1]));
     }
     const orderTransition=path.match(/^\/api\/lab-orders\/([0-9a-f-]{36})$/i);
     if(orderTransition&&req.method==="PATCH"){
       if(!can(scope.role,"lab.write"))throw bad("Acesso negado",403);
       return respond(res,200,labTransition(db,scope,orderTransition[1],await parseBody(req)));
     }
     const match=path.match(/^\/api\/([a-z-]+)$/);
     if(!match||!Object.hasOwn(permission,match[1]))return respond(res,404,{error:"rota_desconhecida"});
     const resource=match[1],base=permission[resource];
     if(req.method==="GET"){
       if(!can(scope.role,base+".read"))throw bad("Acesso negado",403);
       return respond(res,200,list(db,scope,resource));
     }
     if(req.method==="POST"){
       if(!can(scope.role,base+".write"))throw bad("Acesso negado",403);
       return respond(res,201,create(db,scope,resource,await parseBody(req)));
     }
     return respond(res,405,{error:"metodo_nao_permitido"});
   }catch(error){
     let status=Number.isInteger(error.status)?error.status:500;
     if(status===500&&typeof error.message==="string"){
       if(/UNIQUE constraint failed/.test(error.message))status=409;
       else if(/FOREIGN KEY constraint failed/.test(error.message))status=422;
       else if(/CHECK constraint failed/.test(error.message))status=400;
     }
     const safe=status===500?"Erro interno do servidor":error.status?error.message:
       status===409?"Registo duplicado":status===422?"Referência inválida":status===400?"Dados inválidos":"Operação rejeitada";
     if(status===500)console.error("hospital_app_error",error.stack);
     return respond(res,status,{error:safe});
   }
 });
}
