# Arquitectura de recuperação e implementação — ULTRACARDIO

Referência do utilizador: `Ultracardio_Tree_Completo_Gestao_Hospitalar.txt`, que contém uma proposta de **88 módulos** organizados em `domain/application/infrastructure/interfaces/contracts/tests`. A existência dessa árvore de pastas não comprova implementação.

## Decisões técnicas

- Preservar o repositório original (React/Vite + Express + Drizzle + PostgreSQL).
- Preservar os 287 ficheiros do ZIP `artifacts-2.zip` exactamente sob a pasta de importação.
- Criar `apps/hospital-operacional` como aplicação **separada e real**, com frontend e API acoplados, que não interfere com o serviço original.
- Usar SQLite apenas nesta etapa operacional **de uma instância**, para disponibilizar instalação sem depender de serviços externos. Evolução nacional exige PostgreSQL transaccional, RLS, segregação de organizações e testes de carga.
- Sem registo público: contas apenas pelo bootstrap inicial ou administrador autenticado.
- Identificação de pacientes separada de entidades pagadoras e coberturas; lançamento de serviços com separação de dívida paciente/parceiro.
- Facturação fiscal AGT bloqueada: apenas documentos internos de gestão e cobrança.

## Mapa por área do TREE

| Área da arquitectura | Código recuperado | Implementado no novo app | Por integrar |
|---|---|---|---|
| Plataforma/identidade | API e frontend anteriores (sem autenticação validada) | Login, sessões, funções por unidade | IAM institucional, MFA, RLS, privilégios mínimos DB |
| Cadastros/utentes | lab-pacientes, routes/pacientes | Pacientes persistentes | Processos unificados e deduplicação |
| Assegurados/parceiros | Clientes/facturação importados | Parceiros, apólices, vigência e co-pagamento | Autorizações, limites, regras contratuais complexas |
| Percurso/recepção | Lab pacientes, frontend original | Agenda de marcações, episódios e consultas | Referenciação, urgência e internamento |
| Clínica | Fontes laboratoriais legadas | Episódios, triagem e registos de enfermagem | Prescrições e especialidades |
| Diagnóstico | Lab resultados/exames existentes | Pedidos laboratoriais e estados | Instrumentos LIS, validação analítica e biosegurança |
| Farmácia/logística | Produtos/stock, app facturação-stock | Produtos, movimentos atómicos e dispensa por paciente | Lotes, validades, farmacovigilância e fornecedores |
| Financeiro | Documents, Conta Corrente, AGT guard legados | Serviços, pagamentos, extractos e cobrança por paciente | Fiscal oficial, tesouraria e contabilidade |
| RH | Funcionários em lab original | Gestão de contas/perfis | Contratos, turnos, salários |
| Governação | Código básico de auditoria | Audit events de operações de escrita | SIEM, retenção, controlo de acessos RLS |
| Interoperabilidade | API specification + clients | Rotas HTTP locais | HL7 FHIR, DICOM, MINSA, AGT certificado |
| Inteligência | Dashboard antigo | Indicadores de base real | BI provincial/nacional |

## Limites e critérios de aceite

**Entregue após CI:** processo web executável e testado, com base persistente, API e interface; isolamento lógico por hospital, sem operações fictícias pré-carregadas.

**Não entregue ainda:** 88 implementações completas, API fiscal AGT, prontuário electrónico completo, migração a PostgreSQL/RLS, implantação pública e auditoria independente. Não anunciar essas funcionalidades como prontas.

**Caminho de evolução:** implementar novos domínios no código original via contratos e testes, e migrar as funções validadas do app operacional; não misturar automaticamente ficheiros importados nem eliminar código original.
