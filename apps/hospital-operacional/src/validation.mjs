import { randomUUID } from "node:crypto";
export const id = () => randomUUID();
export function bad(message,status=400){return Object.assign(new Error(message),{status});}
export function text(body,key,{min=1,max=180,optional=false}={}){
  const value=body?.[key];
  if(optional&&(value===undefined||value===null||value===""))return null;
  if(typeof value!=="string")throw bad("Campo "+key+" inválido");
  const result=value.trim();
  if(result.length<min||result.length>max)throw bad("Campo "+key+" deve ter entre "+min+" e "+max+" caracteres");
  return result;
}
export function choice(body,key,values){
  const value=body?.[key];
  if(!values.includes(value))throw bad("Opção "+key+" inválida");
  return value;
}
export function whole(body,key,{min=0,max=100000000000}={}){
  const n=body?.[key];
  if(!Number.isSafeInteger(n)||n<min||n>max)throw bad("Valor inteiro de "+key+" inválido");
  return n;
}
export function date(body,key){
  const value=text(body,key,{min:10,max:10});
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+"T00:00:00Z")))throw bad("Data inválida: "+key);
  return value;
}
export function existing(db,table,hospitalId,identifier){
  const allowed=["patients","partners","coverages","encounters","lab_orders","stock_items","service_entries"];
  if(!allowed.includes(table)||typeof identifier!=="string")throw bad("Referência inválida");
  const row=db.prepare("SELECT * FROM "+table+" WHERE hospital_id=? AND id=?").get(hospitalId,identifier);
  if(!row)throw bad("Registo inexistente nesta unidade",404);
  return row;
}
export function audit(db,scope,action,entity,entityId){
  db.prepare("INSERT INTO audit_events(id,hospital_id,user_id,action,entity,entity_id) VALUES(?,?,?,?,?,?)")
    .run(id(),scope.hospitalId,scope.userId,action,entity,entityId);
}
