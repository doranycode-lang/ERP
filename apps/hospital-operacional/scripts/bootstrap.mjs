import { openDatabase, atomic } from "../src/db.mjs";
import { createUser } from "../src/auth.mjs";
import { randomUUID } from "node:crypto";

const name=process.env.HOSPITAL_NAME;
const email=process.env.HOSPITAL_ADMIN_EMAIL;
const password=process.env.HOSPITAL_ADMIN_PASSWORD;
if(!name||name.trim().length<2||name.length>160||!email||!password) {
 console.error("Configure HOSPITAL_NAME, HOSPITAL_ADMIN_EMAIL, HOSPITAL_ADMIN_PASSWORD (mínimo 12 caracteres).");
 process.exit(1);
}
const db=openDatabase();
try{
 const existing=db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
 if(existing!==0)throw Error("Bootstrap só é permitido com a base de dados sem utilizadores.");
 const hospitalId=randomUUID();
 db.prepare("INSERT INTO hospitals(id,name) VALUES(?,?)").run(hospitalId,name.trim());
 const user=createUser(db,{email,password,hospitalId,role:"admin"});
 console.log("Hospital criado:",hospitalId,"; administrador:",user.email,"; nenhuma palavra-passe foi impressa.");
}finally{db.close();}
