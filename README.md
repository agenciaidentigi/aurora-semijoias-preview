# Aurora Semijoias

Plataforma de semijoias com loja publica, cadastro de clientes, solicitacao de vendedores, painel do vendedor, painel administrativo protegido e redirecionamento rastreavel para links de afiliados.

A identidade visual e propria. O projeto nao usa textos, imagens, logotipos ou dados protegidos da Monte Carlo.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Neon Postgres
- Cloudinary para imagens
- Sessao persistente por cookie HTTP-only assinado
- Deploy preparado para Vercel

## Rotas principais

- `/` loja publica
- `/login` login unificado
- `/cadastro` cadastro de cliente
- `/minha-conta` painel do cliente
- `/seja-vendedor` solicitacao para vender
- `/vendedor` painel do vendedor aprovado
- `/loja/[slug]` pagina publica da loja
- `/admin` painel administrativo protegido
- `/r/[slug]` redirecionamento interno de afiliado
- `/carrinho` base para venda interna
- `/paginas/[slug]` paginas institucionais editaveis

## Usuarios e permissoes

Papeis em `user_roles`:

- `customer`
- `seller`
- `admin`
- `editor`
- `analyst`

Uma pessoa pode ter mais de um papel. O cabecalho publico mostra apenas `Entrar`; autenticado, mostra `Ola, [primeiro nome]` e libera menu conforme permissao.

`/admin` exige papel `admin`. O painel do vendedor exige papel `seller` e status `approved`.

## Contas demo

Senha para todas:

```text
Troque-Esta-Senha-123!
```

- Admin: `admin@aurora.local`
- Cliente: `cliente@aurora.local`
- Vendedor aprovado: `vendedor@aurora.local`

Troque essas senhas antes de qualquer uso real.

## Instalar

1. Instale Node.js 22.x.
2. Na pasta do projeto:

```bash
npm install
```

3. Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@host.neon.tech/neondb?sslmode=require
ADMIN_SESSION_SECRET=troque-por-um-segredo-longo-e-aleatorio
NEXT_PUBLIC_SITE_NAME=Aurora Semijoias
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret
CLOUDINARY_UPLOAD_FOLDER=aurora-semijoias
```

## Configurar Neon

1. Crie ou escolha um projeto Neon.
2. Aplique `neon/migrations/001_initial_schema.sql`.
3. Aplique `neon/migrations/002_platform_users_sellers_theme.sql`.
4. Aplique `neon/seed/demo.sql`.

O schema inclui relacionamentos, indices, timestamps, logs de auditoria e politicas RLS para dados de clientes, vendedores, pedidos, produtos, saques e notificacoes.

## Fluxos

Cliente:

1. Cria conta em `/cadastro`.
2. Recebe papel `customer`.
3. Acessa `/minha-conta`.
4. Gerencia dados, enderecos, favoritos, pedidos, cupons e notificacoes.

Vendedor:

1. Cliente acessa `/seja-vendedor`.
2. Envia solicitacao.
3. Status inicial: `pending`.
4. Admin aprova, recusa ou suspende pelo painel.
5. Quando `approved`, `/vendedor` libera loja, produtos, pedidos, afiliados, comissoes e saques.

Produto:

- `sale_type = internal`: botao mostra `Adicionar ao carrinho`.
- `sale_type = affiliate`: botao mostra `Comprar na loja parceira` e usa `/r/[slug]`.

Afiliado:

1. `/r/[slug]` localiza o produto.
2. Registra clique em `affiliate_clicks`.
3. Salva produto, vendedor, loja, parceiro, origem, referrer, UTM, user agent, hash de IP e destino.
4. Monta o link final com o codigo do parceiro.
5. Redireciona para a loja externa.

Comissao e saque:

- `commissions` registra pendente, disponivel e pago.
- `payout_requests` registra valor, Pix, status, observacao e comprovante.

Identidade visual:

- `theme_settings` controla logos, cores e tipografia.
- `header_settings` controla cabecalho.
- `footer_settings`, `footer_columns`, `footer_links`, `social_links` e `payment_methods` controlam o rodape.

## Cloudinary

O painel administrativo envia imagens pela rota protegida `/admin/upload`.

Limites:

- JPG, PNG ou WebP
- Ate 5 MB
- Segredos Cloudinary apenas no servidor

Como o segredo foi usado em ambiente de desenvolvimento, recomendo rotacionar a API secret antes de producao real.

## Rodar localmente

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Deploy na Vercel

1. Suba o projeto para o GitHub.
2. Importe o repositorio na Vercel.
3. Configure as variaveis do `.env.example`.
4. Aplique migrations e seed no Neon.
5. Execute deploy.

Build command:

```bash
npm run build
```

## Estrutura

```text
src/app                 rotas App Router
src/app/admin           painel administrativo
src/app/minha-conta     painel do cliente
src/app/vendedor        painel do vendedor
src/app/r/[slug]        redirecionamento afiliado
src/components/site     cabecalho e rodape publicos
src/components/admin    componentes do painel
src/lib                 Neon, auth, tipos e utilitarios
neon/migrations         schema e politicas
neon/seed               dados demo
```

## Seguranca

- Senhas com hash scrypt.
- Cookie HTTP-only assinado.
- Validacao de permissoes no servidor.
- Politicas RLS documentadas nas migrations.
- Upload restrito por tipo e tamanho.
- Alteracoes importantes registradas em `audit_logs`.
- Chaves privadas apenas em variaveis de ambiente.
