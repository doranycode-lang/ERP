---
name: Faturação LAB / AGT
description: Regra fiscal e de impressão usada pelo módulo de faturação laboratorial.
---

O BillingModule trata a faturação laboratorial como documento fiscal angolano: aplica IVA de 14% aos serviços, apresenta o NIF do emitente e gera o hash a partir de NIF, data, série, número e total para o QR Code.

**Why:** A emissão laboratorial precisa manter os valores fiscais e a informação verificável consistentes entre pré-visualização, impressão e documento persistido.

**How to apply:** Qualquer alteração ao resumo, impressão ou integração de solicitações deve preservar a taxa de 14%, a composição do hash e a ocultação dos controlos de interface no modo `@media print`.

O total persistido pelo servidor deve ser a fonte do valor incluído no hash final, em vez de depender apenas do cálculo intermédio do navegador.

**Why:** O recálculo e o arredondamento monetário acontecem no servidor; em combinações de linhas ou descontos, o valor local pode divergir do documento fiscal guardado.

**How to apply:** Primeiro concluir o recálculo/emissão do documento, depois gerar o hash com o número definitivo e o total devolvido pelo servidor, e só então persistir a nota/hash.

O utilizador definiu que existe um único fluxo de criação de documentos: as facturas de exames são emitidas em “Novo Documento” a partir de uma solicitação pendente da lista de espera do LAB; não manter um ecrã separado de emissão LAB.

**Why:** O utilizador pediu para evitar dois fluxos de facturação e ligar cada factura de exame à solicitação que a originou.

**How to apply:** Integrar a selecção do pedido, o vínculo ao documento e a actualização do estado no fluxo único “Novo Documento”; redireccionar rotas antigas em vez de expor uma segunda página de emissão.