# Autenticação própria

Não utiliza Supabase Auth nem serviços externos de identidade. O PostgreSQL já existente armazena as tabelas privadas `stoffels.users`, `sessions` e `auth_limits`. Executar `npm run db:migrate` antes de publicar.

- Cliente: `/minha-conta`; cadastro: `/minha-conta?cadastro=1`.
- Administração: `/admin`. As permissões são conferidas novamente no servidor a cada acesso.
- Senhas com scrypt N=32768, r=8, p=1, salt aleatório de 16 bytes, chave de 64 bytes; mínimo de 12 caracteres.
- Sessões de 7 dias, token aleatório de 32 bytes, somente SHA-256 no banco. Cookie HttpOnly, SameSite=Lax, Secure e prefixo `__Host-` na Vercel. Nenhum token em localStorage.
- Alterações exigem JSON e Origin da própria loja. Login, cadastro e troca de senha têm limites persistentes por origem de rede e e-mail.
- Cadastro público sempre cria `customer`; administradores só por comando local. Não há senha padrão.
- A troca ou recuperação de senha revoga todas as sessões anteriores.

## Administrador da Stoffels

E-mail definido pelo proprietário: `acesso@stoffels.com`. Na pasta do projeto, execute:

```bash
node --env-file=.env.local scripts/manage-user.mjs admin acesso@stoffels.com
```

Digite a senha quando solicitado. A entrada fica oculta. O comando cria/promove a conta e define uma nova senha; não passe senha como argumento nem a publique no GitHub.

Para recuperar o acesso de uma conta, após verificar a identidade do titular:

```bash
node --env-file=.env.local scripts/manage-user.mjs password email-do-cliente
```

Não há envio de e-mail, verificação de endereço de e-mail ou recuperação automática nesta etapa. O cliente pode trocar a senha enquanto conectado. A tela administrativa mostra contagens reais; edição de peças, gestão de pedidos e endereços ainda não estão implementados. O checkout continua em configuração.

## Verificação

`npm run test:auth` usa uma conta temporária `@example.invalid` no banco configurado e remove a conta e os limites de teste ao concluir. Não altera peças, pedidos nem contas existentes. A interface é exercitada com jsdom; isso não substitui inspeção visual em navegador.
