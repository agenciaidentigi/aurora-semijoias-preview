# Aurora Semijoias

Loja afiliada de semijoias com vitrine publica, redirecionamento rastreavel de afiliados e painel administrativo protegido em `/admin`.

A identidade visual e propria. O projeto nao usa textos, imagens, logotipos ou dados protegidos da Monte Carlo.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security
- Preparado para deploy na Vercel

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

A protecao acontece no layout de `/admin`, nas Server Actions e nas politicas RLS do Supabase.

## Instalar

1. Instale Node.js 20.9 ou superior.
2. Na pasta do projeto, execute:

```bash
npm install
```

3. Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXT_PUBLIC_SITE_NAME=Aurora Semijoias
```

Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend. Ela deve existir apenas no ambiente do servidor.

## Configurar Supabase

1. Crie um projeto no Supabase.
2. Ative Auth por e-mail e senha.
3. Execute `supabase/migrations/001_initial_schema.sql` no SQL Editor.
4. Execute `supabase/seed/demo.sql` para carregar dados de demonstracao.
5. Para criar a conta inicial, execute `supabase/seed/admin-user.sql` em um ambiente novo.

Conta inicial documentada:

- E-mail: `admin@aurora.local`
- Senha: `Troque-Esta-Senha-123!`

Troque a senha imediatamente apos o primeiro acesso. Em producao, prefira criar o usuario pelo painel do Supabase Auth e depois inserir/atualizar o registro correspondente em `profiles` com `role = 'admin'`.

## Storage

A migracao cria os buckets publicos:

- `product-images`
- `banners`

Uploads administrativos passam por `/admin/upload`, que valida:

- JPG, PNG ou WebP;
- tamanho maximo de 4 MB;
- usuario com papel `admin` ou `editor`.

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
4. Garanta que o Supabase tenha as migrations e seeds aplicadas.
5. Faça deploy.

Build command: `npm run build`  
Output: automatico do Next.js

## Estrutura

```text
src/app                 rotas App Router
src/app/admin           painel protegido
src/app/r/[slug]        redirecionamento afiliado
src/components/admin    componentes do painel
src/lib                 Supabase, auth, tipos e utilitarios
supabase/migrations     schema, RLS, indices e storage
supabase/seed           dados demo e admin inicial
```

## Observacoes de seguranca

- RLS esta ativo em todas as tabelas publicas.
- `service role key` so e usada em rotas de servidor.
- Rotas administrativas validam usuario e papel.
- Exclusoes pedem confirmacao no painel.
- Alteracoes importantes gravam `audit_logs`.
- Dados de formulario sao tratados no servidor e o schema do banco reforca tipos e relacionamentos.