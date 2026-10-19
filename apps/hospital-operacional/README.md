# ULTRACARDIO — Gestão Hospitalar Operacional (Web + API + BD real)

Esta aplicação é **código executável**, sem pacientes de demonstração ou respostas simuladas. A interface faz pedidos HTTPS/HTTP à API e cada operação confirmada é gravada numa base SQLite persistente no servidor.

## Código recuperado e preservado

A branch `feat/hospital-web-operacional` inclui o repositório ERP React e a versão anterior escolhida de facturação e stock (287 ficheiros) em `modules/gestao-facturacao-produtos/versao-artifacts-2/artifacts/`, **sem substituir ficheiros ou alterar as rotas da versão existente**.

| Original encontrado | Situação |
|---|---|
| `artifacts/erp-app/` | Frontend React original preservado |
| `artifacts/api-server/` | API Express original preservada |
| `lib/db/` | Esquemas Drizzle/PostgreSQL originais preservados |
| `modules/gestao-facturacao-produtos/versao-artifacts-2/` | 287 ficheiros de facturação/stock preservados |
| `apps/hospital-operacional/` | Nova base web operacional, isolada e testável |

**Não ligar directamente** a API antiga não autenticada a hospitais reais. A recuperação do seu código não constitui validação da sua segurança.

## Módulos que estão implementados NESTA aplicação web

- Sessões com tokens aleatórios, hashes SHA-256 em base, expiração e revogação.
- Utilizadores administrativos e profissionais criados por administrador; papel por unidade.
- Gestão de múltiplas unidades hospitalares e controlo de acesso por unidade em cada pedido.
- Cadastros persistentes: pacientes; parceiros e seguradoras; apólices e coberturas.
- Agenda e marcações por profissional, com conflito de horários verificado.
- Consultas e pedidos laboratoriais com estados e validação.
- Triagem e registos de intervenções de enfermagem vinculados ao episódio.
- Dispensa de produtos a pacientes com baixa de stock e movimento auditável.
- Produtos, quantidades de stock, entradas e saídas transaccionais.
- Serviços com responsabilidade financeira repartida segundo cobertura vigente.
- Recebimentos dos pacientes e parceiros, limites contra pagamentos acima do devido.
- Extracto cronológico por paciente e folha de cobrança por parceiro/paciente, com impressão PDF pelo navegador.
- Indicadores reais da base de dados e auditoria de alterações registadas.

O sistema inicia **sem qualquer paciente, empresa, produto ou seguradora**. Não existe botão de “simular sucesso”.

## Executar localmente

Requisitos: Node.js **22.16 ou superior**, com `node:sqlite` disponível. Não requer `npm install`, nem serviços externos.

```bash
cd apps/hospital-operacional
export HOSPITAL_DATABASE_FILE=./data/hospital.sqlite
export HOSPITAL_NAME="Hospital de Homologação"
export HOSPITAL_ADMIN_EMAIL="admin@exemplo.local"
export HOSPITAL_ADMIN_PASSWORD="SubstituirPorSenhaLonga#2026"
npm run bootstrap
unset HOSPITAL_ADMIN_PASSWORD
APP_ORIGIN=http://127.0.0.1:3000 npm start
```

Abra **http://127.0.0.1:3000**. Faça login com a conta criada pelo bootstrap. O bootstrap **não pode ser repetido** depois de criar utilizadores e nunca imprime a senha.

Para testar o funcionamento:

```bash
npm run check
npm test
```

## Publicação web: servidor persistente, HTTPS e volume de dados

O `Dockerfile` e o `compose.yaml` permitem hospedar o processo num servidor que suporte Docker **e armazenamento persistente**, por exemplo uma VPS com proxy TLS. Configure `APP_ORIGIN=https://seu-dominio` exactamente com a origem pública e configure HTTPS no proxy. O serviço está ligado apenas ao localhost do anfitrião no compose; nunca exponha o porto 3000 directamente à Internet sem TLS.

**Netlify e Vercel, em deploy apenas estático ou funções efémeras, não fornecem persistência para este SQLite.** Não publicar este servidor nessas plataformas sem alterar a arquitectura de armazenamento. Faça backups consistentes da base e do volume, incluindo WAL e os ficheiros que lhe pertencem, usando procedimento SQLite seguro.

## Bloqueios para utilização institucional de dados reais

Esta é uma base **web operacional para homologação, com persistência**, **não** um ERP nacional terminado ou autorizado a trabalhar com dados clínicos reais. Antes de uso real, faltam:

1. PostgreSQL, RLS e papéis com privilégio mínimo por organização/unidade, testes de concorrência e dimensão, e migração da base operacional;
2. Gestão de consentimento, privacidade, perfis clínicos granulares, logs e reversões auditáveis, backups cifrados e recuperação;
3. Autorização formal do MINSA onde aplicável, interoperabilidade, testes de segurança externos, e procedimentos de protecção de dados;
4. Mecanismo fiscal angolano efectivamente certificado; as folhas de cobrança **NÃO são facturas AGT**;
5. Integração progressiva de enfermagem, prescrição, internamento, farmácia, RH, compras e as restantes áreas do TREE.

Não colocar pacientes, instituições ou credenciais reais até concluir esses bloqueios. A segurança de uma role na aplicação não substitui RLS na base PostgreSQL.

## Próximos módulos do TREE

Consultar `ARQUITECTURA-E-INVENTARIO.md`. O ficheiro `Ultracardio_Tree_Completo_Gestao_Hospitalar.txt` é a referência de arquitectura, com 88 módulos propostos; não indica código pronto.

A branch será submetida como pull request **separado**, com teste automático. O projecto original permanece intacto enquanto a revisão não for aprovada.
