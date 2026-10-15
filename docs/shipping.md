# Frete calculado por CEP

Integração exclusiva de consulta: o sistema só chama `POST https://www.melhorenvio.com.br/api/v2/me/shipment/calculate`. Não cria carrinho no Melhor Envio, não compra etiquetas, não realiza checkout nem pagamentos ao Melhor Envio. Cobrar do cliente o frete selecionado é uma operação separada, no pedido da Stoffels.

## Configuração

No `.env.local` (nunca em `public/` ou no GitHub):

```dotenv
MELHOR_ENVIO_TOKEN=token_da_conta
SHIPPING_ORIGIN_CEP=97950000
```

O CEP inicial corresponde à loja física. Configure as mesmas variáveis protegidas na Vercel e faça novo deploy. O token deve permitir apenas cotação (`shipping-calculate`); renove-o quando expirar. Não conceda escopos de compra. Nunca exiba o token em logs ou no navegador.

Documentação oficial: https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos e https://docs.melhorenvio.com.br/docs/cotacao-de-fretes.

## Estimativas das peças

`products.shipping` guarda peso bruto estimado em gramas e comprimento/largura/altura em cm. `estimated=true` identifica uma inferência, não uma medição. A regra é escolhida pelo nome antes da categoria, pois o catálogo contém categorias misturadas. Os perfis estão em `lib/shipping-estimates.js`.

Os perfis usam um peso típico escolhido como aproximação, 10% de margem de embalagem e 200 g adicionais; peças mecânicas pesadas usam 12 kg adicionais para proteção/engradado. As dimensões recebem 4 cm de folga total em cada eixo. Pares dobram o peso e a altura; jogos de rodas/pneus/calotas usam quatro unidades. Alguns motores diesel/V6/V8 recebem fator 1,25. Estes números são hipóteses operacionais, sem ficha técnica ou medição por modelo. Eles não garantem proximidade ao peso real de cada exemplar.

Todas as 7.963 peças receberam dados estimados; 28 ficaram com baixa confiança. Itens grandes/pesados e baixa confiança têm `reviewRequired=true`. 19 itens de transporte potencialmente restrito, como airbags e tanques usados, têm `restricted=true` e não são cotados automaticamente. A confirmação do estado e das condições aceitas pela transportadora é necessária nesses casos.

Para refazer o relatório local sem gravar no banco:

```bash
npm run shipping:estimate
```

Para atualizar estimativas:

```bash
npm run shipping:estimate -- --apply
```

O relatório completo fica em `reports/shipping-estimates.json` (ignorado pelo Git). Dados corrigidos e marcados com `estimated=false` são preservados. O editor de peças no painel permite conferir e corrigir peso, dimensões e a marcação de estimativa/restrição.

## Carrinho e checkout

O cliente informa o CEP e escolhe uma opção. Os valores retornados em `custom_price`/`custom_delivery_time` têm preferência sobre os campos base. Serviços com erro são removidos. Por autorização do proprietário, se uma resposta válida do Melhor Envio não trouxer nenhuma opção utilizável, a loja oferece frete grátis: opção `free-no-quote`, valor zero e transporte organizado pela Stoffels. O prazo fica a combinar, sem prazo fictício. Falhas de autenticação, conexão, HTTP ou formato inválido continuam sendo erros e não geram frete grátis.

As cotações ficam no banco por 15 minutos, vinculadas ao CEP e ao conteúdo do carrinho, preços e medidas. O total da tela soma produtos + frete escolhido. Trocar produtos/quantidades ou vencer a cotação invalida a escolha. Não enviar valores do navegador diretamente para cobranças: o checkout precisa usar `selectedShipping` do servidor e voltar a conferir os preços e o estoque.

O checkout usa `selectedShipping` no servidor e inclui o frete no total enviado à InfinitePay. A integração de consulta foi validada com o token real e publicada. Ela não compra etiquetas; a compra e a organização do transporte são feitas manualmente pela loja. Sem token válido, a API retorna uma mensagem de indisponibilidade.

Testes: `npm run test:shipping`. As respostas do Melhor Envio são simuladas nesses testes; nenhuma etiqueta ou cobrança é criada.
