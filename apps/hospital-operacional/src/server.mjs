import { openDatabase } from "./db.mjs";
import { createApp } from "./http.mjs";
const port=Number(process.env.PORT||3000);
if(!Number.isInteger(port)||port<1||port>65535)throw Error("PORT inválida");
const db=openDatabase();
const server=createApp(db,{origin:process.env.APP_ORIGIN||"http://127.0.0.1:"+port});
server.listen(port,"0.0.0.0",()=>console.log("ULTRACARDIO Hospital Operacional listening on port "+port));
function shutdown(){server.close(()=>{db.close();process.exit(0)});}
process.once("SIGTERM",shutdown);
process.once("SIGINT",shutdown);
