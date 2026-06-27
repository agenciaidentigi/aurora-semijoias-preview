# Aurora Semijoias

Loja afiliada de semijoias com vitrine publica, redirecionamento rastreavel de afiliados e painel administrativo protegido em `/admin`.

A identidade visual e propria. O projeto nao usa textos, imagens, logotipos ou dados protegidos da Monte Carlo.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Neon Postgres
- Cloudinary para imagens
- Autenticacao administrativa propria por cookie assinado
- Deploy preparado para Vercel

## Rotas principais

- `/` loja publica
- `/login` login administrativo por e-mail e senha
- `/admin` dashboard protegido
- `/admin/produtos` gestao de produtos
- `/admin/categorias` gestao de categorias
- `/admin/subcategorias` gestao de subcategorias
- `/admin/colecoes` gestao de colecoes
- `/admin/parceiros` gestao de parceiros afiliados
- `/admin/banners` gestao de banners
- `/admin/home` gestao das secoes da home
- `/admin/paginas` gestao de paginas institucionais
- `/admin/leads` leads e newsletter
- `/admin/relatorios` relatorios de cliques
- `/admin/usuarios` usuarios e permissoes
- `/admin/configuracoes` configuracoes gerais
- `/r/[slug]` redirecionamento interno com registro de clique

## Permissoes

- Administrador: acesso completo.
- Editor: cria e edita produtos, categorias, colecoes, banners, home e paginas.
- Analista: visualiza dashboard e relatorios, sem alterar dados.

## Instalar

1. Instale Node.js 20.9 ou superior.
2. Na pasta do projeto, execute:

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
3. Aplique `neon/seed/demo.sql` para carregar dados de demonstracao e a conta admin inicial.

Conta inicial documentada:

- E-mail: `admin@aurora.local`
- Senha: `Troque-Esta-Senha-123!`

Troque a senha imediatamente depois da primeira aprovacao/implantacao real.

## Imagens com Cloudinary

O painel administrativo envia imagens para o Cloudinary pela rota protegida `/admin/upload`.

Campos como `Imagem principal`, `Imagem`, `Logotipo` e `Imagem da colecao` exibem um botao de upload. O arquivo e enviado ao Cloudinary e a URL final e preenchida automaticamente no formulario.

Limites da previa:

- JPG, PNG ou WebP;
- ate 5 MB por imagem;
- acesso permitido para `admin` e `editor`.

## Links de afiliados

O botao publico nunca aponta diretamente para o parceiro. Ele usa:

```text
/r/[slug-do-produto]
```

Essa rota:

1. Localiza o produto publicado.
2. Registra o clique em `affiliate_clicks`.
3. Salva data, produto, parceiro, origem, referrer, user agent e parametros UTM.
4. Monta o link final usando `affiliate_partners.url_template`.
5. Redireciona para a loja parceira.

Modelo aceito por parceiro:

```text
https://loja.com/produto/{product_id}?ref={affiliate_code}
```

Tambem estao disponiveis `{product_slug}` e `{affiliate_code}`.

## Rodar localmente

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Deploy na Vercel

1. Suba o projeto para um repositorio Git.
2. Crie um novo projeto na Vercel.
3. Configure as variaveis de ambiente iguais ao `.env.example`.
4. Garanta que a migration e o seed foram aplicados no Neon.
5. Faca deploy.

Build command: `npm run build`

## Estrutura

```text
src/app                 rotas App Router
src/app/admin           painel protegido
src/app/r/[slug]        redirecionamento afiliado
src/components/admin    componentes do painel
src/lib                 Neon, auth, tipos e utilitarios
neon/migrations         schema, indices e triggers
neon/seed               dados demo e admin inicial
```

## Observacoes de seguranca

- A senha fica armazenada com hash scrypt.
- Sessao administrativa usa cookie HTTP-only assinado.
- Rotas administrativas validam usuario e papel.
- Exclusoes pedem confirmacao no painel.
- Alteracoes importantes gravam `audit_logs`.
- `DATABASE_URL` e `ADMIN_SESSION_SECRET` devem existir apenas no servidor/Vercel.
