import { randomBytes, createHash, scryptSync, timingSafeEqual, randomUUID } from "node:crypto";
import { atomic } from "./db.mjs";

export const ROLES = Object.freeze(["admin","recepcao","medico","enfermagem","laboratorio","financeiro","farmacia","auditor"]);
const PERMS = Object.freeze({
  admin: ["*"],
  recepcao: ["patients.read","patients.write","encounters.read","encounters.write","appointments.read","appointments.write","partners.read","coverages.read"],
  medico: ["patients.read","encounters.read","encounters.write","lab.read","lab.write","appointments.read","triage.read","nursing.read"],
  enfermagem: ["patients.read","encounters.read","appointments.read","triage.read","triage.write","nursing.read","nursing.write","lab.read"],
  laboratorio: ["patients.read","encounters.read","lab.read","lab.write"],
  financeiro: ["patients.read","partners.read","partners.write","coverages.read","coverages.write","finance.read","finance.write","stock.read"],
  farmacia: ["patients.read","stock.read","stock.write","dispensations.read","dispensations.write"],
  auditor: ["patients.read","encounters.read","lab.read","appointments.read","triage.read","nursing.read","dispensations.read","partners.read","coverages.read","finance.read","stock.read","audit.read"]
});
export const can = (role, permission) => Array.isArray(PERMS[role]) &&
  (PERMS[role].includes("*") || PERMS[role].includes(permission));
export const digest = value => createHash("sha256").update(value).digest("hex");

export function passwordHash(password) {
  if (typeof password !== "string" || password.length < 12 || password.length > 256)
    throw Object.assign(new Error("A palavra-passe exige entre 12 e 256 caracteres."),{status:400});
  const salt=randomBytes(24);
  const hash=scryptSync(password,salt,64,{N:16384,r:8,p:1});
  return "scrypt$"+salt.toString("hex")+"$"+hash.toString("hex");
}
export function verifyPassword(password, record) {
  if (typeof password!=="string"||typeof record!=="string") return false;
  const [algorithm,salt,dig]=record.split("$");
  if (algorithm!=="scrypt"||!salt||!dig) return false;
  try {
    const expected=Buffer.from(dig,"hex");
    if(expected.length!==64) return false;
    const found=scryptSync(password,Buffer.from(salt,"hex"),expected.length,{N:16384,r:8,p:1});
    return timingSafeEqual(expected,found);
  }catch{return false;}
}
export function createUser(db,{email,password,hospitalId,role}) {
  email=String(email??"").trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254) throw Object.assign(new Error("Email inválido"),{status:400});
  if(!ROLES.includes(role))throw Object.assign(new Error("Função inválida"),{status:400});
  const hash=passwordHash(password),id=randomUUID();
  atomic(db,()=>{
    db.prepare("INSERT INTO users(id,email,password_hash) VALUES(?,?,?)").run(id,email,hash);
    db.prepare("INSERT INTO memberships(user_id,hospital_id,role) VALUES(?,?,?)").run(id,hospitalId,role);
  });
  return {id,email,hospitalId,role};
}
export function authenticate(db,email,password) {
  if(typeof email!=="string"||typeof password!=="string"||password.length>512)return null;
  const user=db.prepare("SELECT * FROM users WHERE email=? AND active=1").get(email.trim().toLowerCase());
  // Defend against user-enumeration timing with a dummy hash.
  const reference=user?.password_hash??"scrypt$"+Buffer.alloc(24).toString("hex")+"$"+Buffer.alloc(64).toString("hex");
  if(!verifyPassword(password,reference)||!user)return null;
  const memberships=db.prepare("SELECT hospital_id AS hospitalId,role FROM memberships WHERE user_id=? AND active=1 ORDER BY hospital_id").all(user.id);
  if(!memberships.length)return null;
  const token=randomBytes(32).toString("base64url"),expiresAt=Date.now()+8*3600_000;
  db.prepare("INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)").run(digest(token),user.id,expiresAt,Date.now());
  return {token,expiresAt,user:{id:user.id,email:user.email,memberships}};
}
export function cookie(token,{secure=false,maxAge=8*3600}={}){
  return "ultra_session="+(token??"")+"; HttpOnly; Path=/; SameSite=Strict; "+(secure?"Secure; ":"")+"Max-Age="+maxAge;
}
function sessionToken(header){
  if(typeof header!=="string")return null;
  for(const pair of header.split(";")){
    const [name,...tail]=pair.trim().split("=");
    const v=tail.join("=");
    if(name==="ultra_session"&&/^[a-zA-Z0-9_-]{43}$/.test(v))return v;
  }
  return null;
}
export function sessionActor(db,headers){
  const token=sessionToken(headers.cookie);
  if(!token)return null;
  const user=db.prepare(`SELECT u.id, u.email FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND u.active=1`).get(digest(token),Date.now());
  if(!user)return null;
  const memberships=db.prepare("SELECT hospital_id AS hospitalId,role FROM memberships WHERE user_id=? AND active=1 ORDER BY hospital_id").all(user.id);
  if(!memberships.length)return null;
  return {...user,memberships,token};
}
export function revoke(db,headers){
  const token=sessionToken(headers.cookie);
  if(token)db.prepare("UPDATE sessions SET revoked_at=? WHERE token_hash=?").run(Date.now(),digest(token));
}
export function scopeFor(actor,headers){
  const requested=headers["x-hospital-id"];
  if(typeof requested!=="string"||!requested) throw Object.assign(new Error("Seleccione uma unidade hospitalar"),{status:400});
  const assignment=actor?.memberships.find(m=>m.hospitalId===requested);
  if(!assignment)throw Object.assign(new Error("Acesso negado a esta unidade"),{status:403});
  return {hospitalId:requested,role:assignment.role,userId:actor.id};
}
