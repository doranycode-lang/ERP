# ULTRACARDIO ERP — Sistema de Gestão Hospitalar

**Repositório oficial de desenvolvimento:** [doranycode-lang/ERP](https://github.com/doranycode-lang/ERP)

Este repositório contém o código original recuperado do `ultracardio-erp`, a aplicação hospitalar web operacional e a versão de Gestão e Facturação de Produtos escolhida, **sem alterar os caminhos e ficheiros importados**.

## Organização dos ficheiros

```text
ERP/
├── apps/
│   └── hospital-operacional/
│       ├── src/                  # API HTTP, autenticação, regras e SQLite
│       ├── public/               # interface HTML/CSS/JavaScript ligada à API
│       ├── scripts/              # criação inicial do hospital/administrador
│       ├── test/                 # testes HTTP, permissões, persistência e movimentos
│       ├── Dockerfile
│       ├── compose.yaml
│       └── README.md
├── artifacts/
│   ├── erp-app/                  # frontend React/Vite original (preservado)
│   └── api-server/               # API original (preservada)
├── lib/db/                       # esquemas e contratos do ERP original
├── modules/
│   └── gestao-facturacao-produtos/
│       └── versao-artifacts-2/
│           ├── artifacts/        # os 287 ficheiros originais com caminhos intactos
│           ├── IMPORT_MANIFEST.json
│           ├── TREE.md
│           └── TREE.txt
├── imports/facturacao-produtos/
├── docs/
│   ├── TRANSFERENCIA-ULTRACARDIO-ERP.md
│   └── README-ERP-ANTERIOR.md
└── .github/workflows/
```

Os **617 ficheiros originais** foram comparados com `doranycode-lang/ultracardio-erp` na branch `main`: **617/617 possuem o mesmo hash Git**. Três ficheiros adicionais no destino documentam a transferência e mantêm a configuração de build do frontend React original.

## Executar a aplicação hospitalar web com persistência

A aplicação operacional é **Node.js 22.16+**, com API HTTP própria, autenticação, sessões revogáveis, papéis por unidade e SQLite persistente. Não utiliza respostas fictícias em lugar de gravações.

```sh
cd apps/hospital-operacional
# Defina estas variáveis de ambiente com valores exclusivos para TESTES:
export HOSPITAL_NAME="Hospital de Homologação"
export HOSPITAL_ADMIN_EMAIL="admin@exemplo.local"
export HOSPITAL_ADMIN_PASSWORD="SubstituaPorUmaSenhaForte#2026"
npm run bootstrap
unset HOSPITAL_ADMIN_PASSWORD
APP_ORIGIN=http://127.0.0.1:3000 npm start
```

Abra `http://127.0.0.1:3000` no computador. Para instalação online, utilize servidor com **HTTPS e armazenamento persistente**; consulte [instruções completas](apps/hospital-operacional/README.md). O frontend original React e o serviço hospitalar operacional **não são o mesmo processo**.

**Verificação do código:**
```sh
cd apps/hospital-operacional
npm run check
npm test
```

## Funcionalidades efectivamente implementadas na aplicação operacional

Pacientes; unidades e utilizadores; convénios e segurados; marcações; episódios; triagem; enfermagem; laboratório; produtos e movimentos de stock; dispensa; registos financeiros internos; extracto cronológico do paciente e folha de cobrança por parceiro/paciente. A versão anterior completa de gestão e facturação de produtos continua **preservada em separado** e não foi substituída ou activada automaticamente.

## Segurança e homologação

**Esta aplicação não está pronta para utilização clínica ou fiscal de produção.** Faltam PostgreSQL/RLS comprovado, testes de segurança externos, políticas completas de dados de saúde, infraestrutura de alta disponibilidade e certificação fiscal AGT. Extractos e folhas de cobrança são documentos administrativos **sem validade fiscal**. Não introduza dados reais de pacientes, empresas ou instituições até validação e autorização explícitas.

A configuração `vercel.json` na raiz referencia o **frontend React original**, não hospeda o servidor hospitalar com SQLite. Uma publicação estática na Vercel ou Netlify não oferece persistência para esta aplicação.

**Arquitectura-alvo:** o TREE completo de gestão hospitalar é um plano de evolução. Não representa 88 módulos já concluídos.
