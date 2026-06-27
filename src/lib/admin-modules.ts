import type { AdminModule } from "@/lib/types";

export const adminModules: AdminModule[] = [
  {
    key: "produtos",
    title: "Produtos",
    table: "products",
    description: "Cadastre, publique, duplique, arquive, importe e exporte produtos com links de afiliados.",
    writeRoles: ["admin", "editor"],
    columns: [
      { key: "name", label: "Nome" },
      { key: "slug", label: "Slug" },
      { key: "sku", label: "SKU" },
      { key: "short_description", label: "Descricao curta", type: "textarea" },
      { key: "description", label: "Descricao completa", type: "textarea" },
      { key: "current_price", label: "Preco atual", type: "number" },
      { key: "old_price", label: "Preco anterior", type: "number" },
      { key: "installments", label: "Parcelamento" },
      { key: "discount_percent", label: "Desconto %", type: "number" },
      { key: "material", label: "Material" },
      { key: "plating", label: "Tipo de banho" },
      { key: "stone", label: "Pedra" },
      { key: "color", label: "Cor" },
      { key: "badge", label: "Selo" },
      { key: "main_image_url", label: "Imagem principal", type: "url" },
      { key: "original_url", label: "Link original", type: "url" },
      { key: "affiliate_url", label: "Link de afiliado", type: "url" },
      { key: "estimated_commission", label: "Comissao estimada", type: "number" },
      { key: "seo_title", label: "Titulo SEO" },
      { key: "seo_description", label: "Descricao SEO", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["draft", "published", "archived"] },
      { key: "is_featured", label: "Destaque", type: "checkbox" },
      { key: "is_new", label: "Lancamento", type: "checkbox" },
      { key: "is_promo", label: "Promocao", type: "checkbox" },
      { key: "display_order", label: "Ordem", type: "number" }
    ]
  },
  { key: "categorias", title: "Categorias", table: "categories", description: "Organize a navegacao publica por linhas e tipos de semijoia.", writeRoles: ["admin", "editor"], columns: [{ key: "name", label: "Nome" }, { key: "slug", label: "Slug" }, { key: "description", label: "Descricao", type: "textarea" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "is_active", label: "Ativa", type: "checkbox" }] },
  { key: "subcategorias", title: "Subcategorias", table: "subcategories", description: "Detalhe categorias com argolas, solitarios, chokers e outras vitrines.", writeRoles: ["admin", "editor"], columns: [{ key: "name", label: "Nome" }, { key: "slug", label: "Slug" }, { key: "description", label: "Descricao", type: "textarea" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "is_active", label: "Ativa", type: "checkbox" }] },
  { key: "colecoes", title: "Colecoes", table: "collections", description: "Crie colecoes sazonais e editoriais para destacar na loja.", writeRoles: ["admin", "editor"], columns: [{ key: "name", label: "Nome" }, { key: "slug", label: "Slug" }, { key: "description", label: "Descricao", type: "textarea" }, { key: "hero_image_url", label: "Imagem", type: "url" }, { key: "is_active", label: "Ativa", type: "checkbox" }] },
  { key: "parceiros", title: "Parceiros de afiliados", table: "affiliate_partners", description: "Configure codigos, parametros e modelos de URL dos parceiros.", writeRoles: ["admin"], columns: [{ key: "name", label: "Nome" }, { key: "logo_url", label: "Logotipo", type: "url" }, { key: "domain", label: "Dominio" }, { key: "affiliate_code", label: "Codigo de afiliado" }, { key: "affiliate_param", label: "Parametro" }, { key: "url_template", label: "Modelo de URL", type: "url" }, { key: "commission_rate", label: "Comissao %", type: "number" }, { key: "cookie_duration_days", label: "Cookie dias", type: "number" }, { key: "status", label: "Status", type: "select", options: ["active", "inactive"] }, { key: "notes", label: "Observacoes", type: "textarea" }] },
  { key: "banners", title: "Banners", table: "banners", description: "Gerencie hero, slides, campanhas e chamadas da home.", writeRoles: ["admin", "editor"], columns: [{ key: "title", label: "Titulo" }, { key: "subtitle", label: "Subtitulo" }, { key: "image_url", label: "Imagem", type: "url" }, { key: "button_label", label: "Botao" }, { key: "button_url", label: "URL", type: "url" }, { key: "placement", label: "Posicao" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "is_active", label: "Ativo", type: "checkbox" }] },
  { key: "home", title: "Secoes da home", table: "homepage_sections", description: "Edite barra promocional, textos, categorias, produtos, depoimentos, newsletter e redes sociais.", writeRoles: ["admin", "editor"], columns: [{ key: "section_key", label: "Chave" }, { key: "title", label: "Titulo" }, { key: "subtitle", label: "Subtitulo" }, { key: "content", label: "Conteudo JSON", type: "textarea" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "is_active", label: "Ativa", type: "checkbox" }] },
  { key: "paginas", title: "Paginas institucionais", table: "pages", description: "Edite paginas como Sobre, Politica de Privacidade e Termos.", writeRoles: ["admin", "editor"], columns: [{ key: "title", label: "Titulo" }, { key: "slug", label: "Slug" }, { key: "body", label: "Conteudo", type: "textarea" }, { key: "seo_title", label: "Titulo SEO" }, { key: "seo_description", label: "Descricao SEO", type: "textarea" }, { key: "status", label: "Status", type: "select", options: ["draft", "published"] }] },
  { key: "leads", title: "Leads e newsletter", table: "leads", description: "Acompanhe capturas de e-mail e origens.", writeRoles: ["admin"], columns: [{ key: "email", label: "E-mail", type: "email" }, { key: "name", label: "Nome" }, { key: "source", label: "Origem" }, { key: "status", label: "Status", type: "select", options: ["new", "subscribed", "unsubscribed"] }] },
  { key: "usuarios", title: "Usuarios e permissoes", table: "profiles", description: "Controle papeis: Administrador, Editor e Analista.", writeRoles: ["admin"], columns: [{ key: "email", label: "E-mail", type: "email" }, { key: "full_name", label: "Nome" }, { key: "role", label: "Papel", type: "select", options: ["admin", "editor", "analyst"] }, { key: "is_active", label: "Ativo", type: "checkbox" }] },
  { key: "configuracoes", title: "Configuracoes gerais", table: "site_settings", description: "Ajuste nome, contatos, SEO, redes sociais e aviso de afiliados.", writeRoles: ["admin"], columns: [{ key: "key", label: "Chave" }, { key: "value", label: "Valor JSON", type: "textarea" }, { key: "description", label: "Descricao", type: "textarea" }] }
];

export function findAdminModule(key: string) {
  return adminModules.find((module) => module.key === key);
}