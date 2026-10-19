# ULTRACARDIO ERP — Sistema Hospitalar Web

Este repositório recebe a versão operacional recuperada de `doranycode-lang/ultracardio-erp`.

## Aplicação operacional

`apps/hospital-operacional/`: frontend, API Node.js, autenticação, pacientes, hospitais, consultas, laboratório, seguradoras/coberturas, stock, enfermagem, cobranças, extractos e SQLite persistente.

### Arranque e testes

```bash
cd apps/hospital-operacional
npm test
# Configurar HOSPITAL_NAME, HOSPITAL_ADMIN_EMAIL e HOSPITAL_ADMIN_PASSWORD
npm run bootstrap
APP_ORIGIN=http://127.0.0.1:3000 npm start
```

Ver `apps/hospital-operacional/README.md` para detalhes, Docker e requisitos.

**Segurança:** não utilizar dados clínicos reais antes de concluir segurança, backups, RLS/PostgreSQL e aprovação aplicável. Os extractos internos não são facturas certificadas pela AGT.
