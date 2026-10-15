# Checkout InfinitePay

Conta recebedora: `stoffels`. Pagamento hospedado pela InfinitePay, por Pix ou cartão. Nenhum dado de cartão passa pelo servidor da Stoffels.

Documentação consultada: https://www.infinitepay.io/checkout-documentacao e https://www.infinitepay.io/checkout.

## Fluxo

1. O comprador entra/cria uma conta, preenche o endereço e escolhe o frete cotado.
2. `POST /api/checkout` valida conta, origem da requisição, IDs e quantidades, preços atuais, disponibilidade e cotação ainda válida para aquele carrinho/CEP.
3. Em transação, o sistema bloqueia as peças, reserva o estoque e salva pedido e itens com seus preços. O identificador da tentativa é exclusivo por cliente e impede pedidos duplicados em reenvios. Cada conta pode ter até 3 pedidos pendentes simultaneamente.
4. `POST https://api.checkout.infinitepay.io/links` recebe itens e frete em centavos, `handle`, UUID do pedido em `order_nsu`, dados de contato e URLs de retorno/webhook. A URL de resposta precisa ser HTTPS em um domínio de checkout permitido.
5. O cliente paga na InfinitePay. O retorno não é prova de pagamento: o servidor consulta `POST /payment_check` e exige `success=true`, `paid=true`, método Pix/cartão e `amount` igual ao total do pedido. `paid_amount` pode diferir do valor da venda e não é usado para substituir o total.
6. A notificação inclui um segredo HMAC específico daquele pedido na URL; além disso, todos os pagamentos são conferidos com o provedor. `transaction_nsu` é único e notificações repetidas não descontam estoque novamente.
7. O pedido pago fica em preparação. A equipe informa rastreio e atualiza para enviado/entregue no painel. Cliente acompanha pela própria conta e pode enviar mensagens sobre o pedido.

## Ambiente

- `INFINITEPAY_HANDLE=stoffels`
- `CHECKOUT_ENABLED=true`
- `CHECKOUT_WEBHOOK_SECRET`: segredo aleatório privado de pelo menos 32 bytes.
- `STOREFRONT_URL=https://stoffels.vercel.app`
- Banco e Melhor Envio configurados conforme os outros documentos.

Não trocar o segredo enquanto links antigos aguardarem pagamento: o webhook desses links carrega a assinatura gerada com o segredo anterior. Se precisar fazer rotação, planeje a aceitação das assinaturas antigas até encerrar os pedidos pendentes.

## Falhas, reservas e cancelamentos

Uma tentativa repetida com o mesmo identificador retorna o mesmo pedido. O sistema não cria outro link automaticamente se houve timeout, resposta inválida ou falha ambígua: o provedor pode ter criado o link antes da interrupção. O pedido fica visível como em conferência, com a reserva mantida. O administrador pode recuperar o link existente após conferi-lo na InfinitePay.

Uma rejeição definitiva do endpoint de criação libera a reserva e marca o pedido como falho. A cotação expira em 15 minutos, mas isso não implica que um link já criado expirou. Não há garantia documentada de cancelamento, expiração de links ou idempotência por `order_nsu` na API pública consultada.

O botão Cancelar não realiza estorno. Pedidos pagos devem ser tratados no aplicativo InfinitePay. Em pedidos não pagos com link ativo/estado incerto, o cancelamento mantém a reserva: desative o link na InfinitePay e só então ajuste o saldo livre pelo editor de produto. Se ocorrer uma confirmação tardia, ela é registrada e o pedido pode voltar a pago; divergências recebem sinalização de conferência.

Reembolsos, emissão de notas fiscais e postagem são operações da equipe, fora da automação deste site. Não há compra de etiqueta no Melhor Envio.

## Verificação realizada

- Testes de banco revertidos: criação de pedido, totais canônicos, reserva, duplicidade, falha definitiva e ambígua, pagamento repetido e tardio, rastreio e mensagens.
- Testes de permissões: clientes não acessam endereços/pedidos de outros e não acessam administração.
- Testes de interface: endereço, seleção de frete, total, criação de pedido e indicação de pagamento somente após resposta do servidor.
- Criado um link real aceito pela InfinitePay para o pedido técnico `a4d3812e-7dac-4ef0-9148-c734e2844ea1`, com produto e frete reais. Pedido identificado como teste, com uma unidade reservada e sem pagamento. A observação interna orienta o encerramento.
- Não foi efetuado pagamento real. A aprovação e o webhook foram exercitados com respostas simuladas; não se deve apresentar isso como uma transação financeira aprovada de ponta a ponta.
