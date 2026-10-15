# Stoffels Autopeças

Vitrine local adaptada do visual e do catálogo público da Sportcar, com autorização do proprietário. Marca Stoffels com o logo fornecido e paleta preta, vermelha e branca, cabeçalho branco, navegação por categorias, banners do catálogo, vitrines, busca, filtros, páginas de produto, galeria de fotos e carrinho local.

## Abrir o projeto

Requer Node.js 20 ou superior. O site não precisa de dependências de produção.

```bash
cd "$HOME/Área de trabalho/Stoffels"
npm run dev
```

Abra http://localhost:3001. Não abra `index.html` diretamente pelo gerenciador de arquivos: o catálogo é carregado por HTTP.

```bash
npm ci
npm run verify
npm run build
npm run preview
```

`verify` usa jsdom para validar os dados, referências das fotos, busca, paginação, detalhes e carrinho. Essa verificação de DOM não substitui inspeção visual em um navegador.

## Conteúdo importado

Importação de 14/10/2026: 7.963 produtos, 7.526 disponíveis, 201 categorias/subcategorias e 35.612 fotos locais. Não houve falha de download. Os 25 produtos sem fotos na origem usam uma imagem provisória na vitrine. As fotos WebP ocupam aproximadamente 878 MiB (920 MB decimais), perto da cota de 1 GB do Supabase Free; reservar margem para novos produtos antes de migrar.

- `public/data/catalog.json`: índice de produtos com preços e disponibilidade.
- `public/data/categories.json`: categorias reconstruídas a partir do catálogo.
- `public/data/products/`: descrições sanitizadas e galerias de cada produto.
- `public/images/products/`: todas as fotos importadas, convertidas para WebP, com até 1.100 pixels e qualidade 83.
- `source/import-report.json`: totais, data da importação e eventuais falhas.
- `source/products/` e `source/pages/`: cache da API de origem, para retomar a importação.

Os produtos indisponíveis são mantidos para consulta, identificados na vitrine e impedidos de entrar no carrinho. A importação é uma fotografia do catálogo; estoque e preços não são sincronizados em tempo real. O preço não representa uma oferta de pagamento válida antes da abertura das vendas.

O carrinho fica apenas no navegador. Não há checkout, processamento de pagamentos, criação de pedidos, cadastro de clientes ou integração ativa com Supabase. O logotipo original `logo.png` é exibido no cabeçalho e no rodapé, carregando o PNG diretamente e enquadrando a área visível com CSS, sem alterar o arquivo original. Telefones, redes sociais e a história da Sportcar não foram atribuídos à Stoffels. Os banners com referências à Sportcar estão somente no arquivo de origem, fora da vitrine.

## Importar novamente

Requer Python 3 com `requests`, `beautifulsoup4`, `pillow` e `lxml`.

```bash
npm run import:catalog
```

A importação é resumível: reusa páginas, detalhes e imagens existentes. Para atualizar os dados, mova `source/pages/` e `source/products/` para um backup antes de executar. Só são consultados dados públicos, sem autenticação ou acesso a clientes/pedidos. A disponibilidade de compra é lida da API de listagem; na API de detalhes, o campo homônimo contém o ID do produto.

## Hospedagem futura

`vercel.json` contém o comando de build, a saída `dist/` e o retorno de rotas de catálogo/produto para a aplicação. O site é estático e pode ser hospedado em qualquer provedor compatível.

A Vercel informa que o plano Hobby gratuito é restrito a uso pessoal não comercial: https://vercel.com/docs/plans/hobby. Para operar uma loja, escolher um plano/provedor que permita uso comercial. O upload pela CLI também tem limites de 15 mil arquivos e 100 MB no Hobby: https://vercel.com/docs/limits. Esta cópia completa, com todas as galerias, não deve ser enviada diretamente pela CLI sem reorganizar a entrega das imagens.

O Supabase Free inclui 1 GB de Storage: https://supabase.com/docs/guides/storage/pricing. O volume total de fotos deve ser avaliado antes da migração, junto com os limites de transferência. A cópia local mantém as fotos independentes do site original. A hospedagem dessas fotos e a integração de dados serão configuradas em uma próxima etapa, com a conta e o provedor definidos.

O build também aceita `STOFFELS_IMAGE_BASE_URL`, com a URL HTTPS de uma pasta pública contendo os arquivos WebP de `public/images/products/`. Ao definir essa variável, o build exclui as fotos de produtos de `dist/` e aponta as galerias para essa URL. Isso permite separar as fotos em um serviço de armazenamento quando a hospedagem for escolhida. Sem essa variável, tudo funciona com as fotos locais. Nunca use uma chave secreta nessa configuração pública.

Não foi feita publicação nem utilizado qualquer segredo de outro projeto da Área de Trabalho.

## Experiência mobile

O CSS usa o layout mobile como base e amplia a interface com regras `min-width` para tablet (640px) e desktop (960px). No celular há cabeçalho fixo, busca, navegação inferior (Início, Categorias, Buscar, Carrinho, Conta), vitrines horizontais, página de categorias, filtros recolhíveis, diálogos em painel inferior e barra de compra acima da navegação. Os espaçamentos respeitam as áreas seguras do aparelho.

O banner `banner.png` fornecido, com 2172 × 724 pixels, é exibido na home inteiro em qualquer largura. O logo é o PNG fornecido; a referência anterior a um SVG com imagem externa foi substituída. Os recursos têm uma nova versão na URL para evitar o cache antigo. Não há funcionamento offline nem sincronização de estoque.

O servidor local comprime respostas textuais com gzip. Depois de atualizar, reinicie `npm run dev` para usar esse novo servidor. A infraestrutura de navegador desta sessão não estava disponível para inspeção visual: foram verificados os fluxos por DOM e os arquivos/rotas por HTTP.

## Supabase e ORM

O backend usa Drizzle ORM com `pg`, o pooler de transações do Supabase e validação TLS por CA. A estrutura da loja fica no schema `stoffels`, separado dos schemas de autenticação e armazenamento do Supabase. Há tabelas de categorias, produtos, imagens, pedidos, itens de pedido e eventos de pagamento. Todas têm RLS ativado e nenhum acesso direto para os papéis públicos `anon` e `authenticated`. As credenciais ficam somente em `.env.local` e nas variáveis do servidor da hospedagem.

```bash
npm run db:migrate
npm run db:seed
```

`DATABASE_URL` usa o pooler na porta 6543; `DIRECT_URL` usa o pooler de sessão na porta 5432 para migrações e importação. As migrações são idempotentes e não apagam outros schemas. O certificado CA é público e fica em `config/certs/supabase-ca.crt`.

`GET /api/catalog` e `GET /api/product?id=...` consultam o banco pelo ORM e retornam somente conteúdo público do catálogo. Não há endpoints públicos para pedidos ou dados pessoais. A variável `databaseApi` do build seleciona esses endpoints quando `DATABASE_URL` está presente. Sem essa variável, o build estático continua disponível. `npm run dev` carrega `.env.local` automaticamente.

Os preços são registrados em centavos com tipo `bigint` para preservar os valores importados. Existem preços extremamente altos na própria origem; devem ser conferidos antes da abertura das vendas. A quantidade real de estoque não é inventada: `stock_quantity` permanece nula até a conferência do proprietário.

## Publicação

Repositório público: https://github.com/stoffelsautopecas/Stoffels

As fotos WebP de produtos ficam no repositório público. Para respeitar os limites de upload da Vercel, `.vercelignore` as exclui do pacote enviado, e `STOFFELS_IMAGE_BASE_URL` aponta para a pasta pública do GitHub. O build usa essa base nas galerias. Logos, banners e arte da Stoffels continuam no site. Nenhuma senha é necessária para servir essas imagens.

Variáveis do servidor: `DATABASE_URL`, `INFINITEPAY_HANDLE=stoffels`, `CHECKOUT_ENABLED=false` e `STOFFELS_IMAGE_BASE_URL`. Não publicar `DIRECT_URL` no frontend; ela serve apenas às migrações. Ao trocar a senha, atualizar `.env.local` e `DATABASE_URL` na hospedagem e fazer novo deploy. Frete grátis para todo o Brasil em todos os produtos, sem pedido mínimo (`config/checkout.json`). O checkout ainda aguarda implementação de geração e confirmação de pagamentos e confirmação dos estoques.

### Site publicado

Produção: https://stoffels.vercel.app

Banco importado e verificado: 7.963 produtos, 35.612 referências de fotos e 201 categorias; seis tabelas no schema `stoffels`. O banco ocupava aproximadamente 33 MB após a importação.

A publicação inicial foi feita via CLI. A conexão automática GitHub → Vercel não foi concluída; por enquanto, depois de atualizar o código, publique usando um pacote limpo:

```bash
node scripts/prepare-deploy.mjs
cd .deploy
npx vercel deploy --prod --yes --archive=tgz
```

O pacote `.deploy/` é ignorado pelo Git, contém o código e o catálogo necessários ao site e exclui `.env.local`, caches, Git e as fotos de produtos. As variáveis protegidas já foram cadastradas na Vercel. A publicação foi conferida por HTTP, incluindo as consultas reais do ORM ao Supabase; não houve inspeção visual por navegador conectado nesta sessão.

## Contas e autenticação

Autenticação própria, sem Supabase Auth: cadastro e login em `/minha-conta`, acesso restrito em `/admin`, troca de senha e sessões HttpOnly armazenadas como hash no PostgreSQL. Veja [configuração e recuperação de acesso](docs/authentication.md).

Administrador: `acesso@stoffels.com`. Defina a senha localmente com `node --env-file=.env.local scripts/manage-user.mjs admin acesso@stoffels.com` (entrada oculta). Não existe senha padrão.

As telas de acesso estão prontas; edição de peças, pedidos, endereços e finalização do checkout continuam como próximas etapas.
