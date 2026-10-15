# Checkout Stoffels — InfinitePay

Escolha do proprietário registrada em 14/10/2026: InfinitePay para Pix e cartão de crédito. A configuração está em `config/checkout.json` e permanece desativada até a implementação do fluxo de pedidos.

Documentação oficial: https://www.infinitepay.io/checkout-documentacao

O checkout é hospedado pela InfinitePay. O backend da Stoffels envia os itens para `POST /links` e recebe a URL de pagamento. A identificação do recebedor é a InfiniteTag, sem o símbolo `$`. Os valores dos itens são inteiros em centavos.

## Fluxo a implementar

1. Receber apenas IDs e quantidades do carrinho e conferir disponibilidade e preços no servidor.
2. Registrar o pedido e seu total no Supabase antes de criar o link; recuperar a cotação válida com `selectedShipping` (ID da cotação + serviço + CEP + carrinho). Usar o valor salvo no servidor em `shipping_cents`, somar ao subtotal e incluir a linha de frete no link da InfinitePay. Nunca aceitar valor de frete enviado pelo navegador.
3. Criar o link com `handle`, `items` e um `order_nsu` único associado ao pedido.
4. Encaminhar o comprador ao checkout hospedado da InfinitePay.
5. Tratar retorno e webhook como notificações; consultar `POST /payment_check` no servidor e conferir o pedido e os valores antes de marcar como pago. Processar notificações repetidas sem duplicar pedidos.

Não solicitar dados do cartão na Stoffels. Não considerar parâmetros da URL de retorno como confirmação de pagamento.

## Informações pendentes

- InfiniteTag da conta recebedora: `stoffels` (informada pelo proprietário; validação operacional pendente).
- Projeto Supabase configurado com tabelas de catálogo e pedidos; geração de pedidos e conciliação de pagamentos ainda não implementadas.
- URL pública da loja: https://stoffels.vercel.app; endpoints de retorno e notificações ainda serão implementados.
- Entrega definida: cobrar o frete calculado pelo Melhor Envio. Integração exclusivamente de consulta; não comprar etiquetas ou realizar pagamentos ao Melhor Envio. Exige token no servidor.

Não foram gerados links de pagamento reais nem realizadas cobranças nesta etapa. O carrinho atual continua local e sem finalização de pedidos.
