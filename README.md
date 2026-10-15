# Stoffels Autopeças

Loja em https://stoffels.vercel.app, adaptada do catálogo autorizado da Sportcar, com a marca e as cores da Stoffels.

- Vitrine mobile, busca, filtros, categorias, detalhes, galeria e carrinho.
- `/admin`: peças, fotos, preços, saldo de estoque, embalagem, categorias, clientes, pedidos, rastreio, mensagens e dados da loja.
- `/minha-conta`: cadastro e login próprios, dados pessoais, endereços, pedidos, mensagens e troca de senha. Sem Supabase Auth.
- `/checkout`: endereço, cotação pelo Melhor Envio, reserva de estoque, pedido e redirecionamento para pagar com Pix/cartão na InfinitePay.
- `/pagamento` e webhook conferem pagamentos no servidor antes de registrar o pedido como pago.

## Desenvolvimento

Node.js 22. Configure `.env.local` a partir de `.env.example`, sem publicar credenciais.

```bash
npm ci
npm run dev
```

Abra http://localhost:3001. Não abra o HTML diretamente pelo gerenciador de arquivos.

```bash
npm run verify
npm run test:auth
npm run test:shipping
npm run test:commerce
npm run build
```

Os testes de comércio usam o banco configurado. Dados de produtos/pedidos são testados dentro de uma transação revertida; os testes de APIs criam contas, um pedido e uma foto temporários, removidos ao terminar. As integrações de pagamento são simuladas nos testes automatizados. jsdom verifica fluxos e DOM; não substitui inspeção visual em navegador.

## Catálogo e estoque

Importados 7.963 produtos, 201 categorias e 35.612 referências de fotos. A cópia estática fica em `public/data/`, mas a loja publicada usa o PostgreSQL como fonte dos produtos. Não há sincronização automática com a loja de origem. Não execute importação/reseed sobre a loja em operação sem planejar a atualização, pois os dados do proprietário passam a ser a referência.

O proprietário autorizou saldo inicial de 10 unidades em cada peça disponível; peças indisponíveis receberam zero. O saldo fica oculto na vitrine e só aparece no painel administrativo. Uma unidade fica reservada no pedido técnico de criação de link, ainda sem pagamento. A observação desse pedido identifica o teste.

Alguns preços da origem são anormalmente altos. O checkout recusa preço unitário inválido/acima de R$ 1 milhão e pedidos acima desse total; o administrador pode corrigir o preço no painel. Nenhum preço importado foi reduzido arbitrariamente.

Todas as peças receberam estimativas de peso bruto e embalagem identificadas como estimativas. Confira os itens com marcação de revisão no painel; as inferências não são medições físicas. Veja [frete e embalagens](docs/shipping.md).

## Banco e segurança

PostgreSQL hospedado no Supabase, Drizzle + `pg`, TLS com certificado CA validado. As tabelas ficam no schema privado `stoffels`, com RLS e sem acesso dos papéis públicos. Autenticação própria com scrypt e sessões HttpOnly. Clientes acessam apenas os pedidos e endereços vinculados à sua conta, nunca por simples coincidência de e-mail.

```bash
npm run db:migrate
```

`DIRECT_URL` é usada apenas nas migrações. A aplicação usa o pooler transacional em `DATABASE_URL`. Senhas, tokens e segredos ficam no ambiente do servidor.

Administração: `acesso@stoffels.com`. Para definir uma senha localmente com entrada oculta:

```bash
node --env-file=.env.local scripts/manage-user.mjs admin acesso@stoffels.com
```

Para gerar um link privado de uso único, válido por 24 horas:

```bash
node --env-file=.env.local scripts/create-access-link.mjs acesso@stoffels.com
```

Nunca publique esse link no repositório. O painel de clientes também permite gerar um link de recuperação de 1 hora, após conferir a identidade do titular. Veja [autenticação](docs/authentication.md).

## Fotos

As fotos importadas são servidas pela base pública `STOFFELS_IMAGE_BASE_URL`, atualmente o repositório GitHub. Os arquivos originais locais ficam em `public/images/products/` e não entram no upload da Vercel.

Novas fotos são enviadas pelo painel, reprocessadas para WebP com até 1600px e guardadas de forma persistente no PostgreSQL. JPEG, PNG ou WebP de até 4 MB; o processamento remove metadados. Há uma proteção de espaço que interrompe novos uploads quando o banco ultrapassa 400 MiB. As fotos publicadas são públicas; somente administradores podem enviar arquivos.

## Pagamento, entrega e operação

Consulte [InfinitePay](docs/checkout-infinitepay.md) e [frete](docs/shipping.md). O Melhor Envio é usado só para consulta. Etiquetas, postagem, emissão fiscal e estornos são operados pela loja nos respectivos serviços; o site não paga etiquetas nem realiza estornos automaticamente.

O pedido reserva estoque antes da geração do link. Um link ativo não tem sua reserva liberada só por passar tempo: a API pública consultada não documenta cancelamento/expiração de links. Falhas ambíguas ficam em conferência para evitar duplicar cobranças. Veja o procedimento de recuperação e cancelamento no documento do checkout.

CNPJ informado: 04.966.153/0001-49. WhatsApp: (55) 99671-2043. Esses dados e o prazo de preparação podem ser editados em Configurações.

## Publicação

Repositório público: https://github.com/stoffelsautopecas/Stoffels. Publicação manual na Vercel:

```bash
node scripts/prepare-deploy.mjs
cd .deploy
npx vercel deploy --prod --yes --archive=tgz
```

O pacote exclui credenciais, Git, arquivos pessoais da raiz e as fotos importadas. Variáveis de produção: `DATABASE_URL`, `STOFFELS_IMAGE_BASE_URL`, `INFINITEPAY_HANDLE=stoffels`, `CHECKOUT_ENABLED=true`, `CHECKOUT_WEBHOOK_SECRET`, `STOREFRONT_URL=https://stoffels.vercel.app`, `MELHOR_ENVIO_TOKEN` e `SHIPPING_ORIGIN_CEP=97950000`. Novo deploy é necessário após alterar o ambiente.

Confira os termos e limites do plano de hospedagem escolhido: https://vercel.com/docs/plans/hobby e https://vercel.com/docs/limits. A conexão automática GitHub → Vercel não foi ativada; um push por si só não publica as mudanças.
