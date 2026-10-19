# Importação isolada de gestão e facturação de produtos

**Não alterar a estrutura do ERP actual.** Esta branch de revisão é independente de `main`.

Origem: ficheiro `artifacts(2).zip` fornecido pelo proprietário. Contém **287 ficheiros**, organizados originalmente sob `artifacts/`, incluindo `api-server/`, `facturacao-stock/` e `mockup-sandbox/`.

Destino previsto:

```text
modules/gestao-facturacao-produtos/versao-artifacts-2/
  artifacts/
    api-server/
    facturacao-stock/
    mockup-sandbox/
    TS.tsx
  IMPORT_MANIFEST.json
```

**Preserva os nomes, componentes e caminhos internos sem os misturar com `artifacts/erp-app/` ou as rotas já existentes.** Não altera os serviços, a estrutura de base de dados, os ficheiros de configuração ou o frontend actual. O ficheiro `IMPORT_MANIFEST.json` valida os hashes individuais para comprovar integridade.

## Activar a importação

1. No GitHub seleccionar a branch **`import/facturacao-produtos-artifacts-2`**.
2. Abrir a pasta `imports/facturacao-produtos/` e usar **Add file → Upload files**.
3. Enviar o ZIP fornecido, renomeado para **`artifacts-2.zip`**, sem descompactar ou alterar os ficheiros.
4. Fazer commit **nessa branch**, nunca em `main`.
5. O workflow `Importar módulo de facturação de produtos` valida caminhos, impede sobrescritas, extrai todos os ficheiros e guarda hashes.
6. Revisar o commit da importação e testes antes de preparar a ligação ao módulo existente.

Se as definições do GitHub impedirem pushes automáticos do Actions, executar localmente `python3 scripts/import_facturacao_produtos.py` na branch, seguido de `git add modules/gestao-facturacao-produtos/versao-artifacts-2`, commit e push.

**Atenção:** este passo preserva a nova versão mas **não a activa** no ERP. A integração exige revisão dos contratos de produtos/stock, API, dependências e testes; não substituir o código antigo automaticamente. Não usar dados reais de pacientes ou facturas fiscais até à homologação.
