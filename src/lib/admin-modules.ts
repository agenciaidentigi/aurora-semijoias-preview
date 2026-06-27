import type { AdminModule } from "@/lib/types";

const adminOnly = ["admin"] as const;
const editorial = ["admin", "editor"] as const;

export const adminModules: AdminModule[] = [
  {
    key: "clientes",
    title: "Clientes",
    table: "customer_profiles",
    description: "Visualize perfis de clientes, preferencias, aceite de termos e observacoes internas.",
    writeRoles: [...adminOnly],
    columns: [
      { key: "user_id", label: "Usuario ID" },
      { key: "cpf", label: "CPF" },
      { key: "birth_date", label: "Nascimento", type: "date" },
      { key: "communication_preferences", label: "Preferencias JSON", type: "textarea" },
      { key: "accepts_offers", label: "Recebe ofertas", type: "checkbox" },
      { key: "notes", label: "Observacoes internas", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["active", "blocked", "inactive"] }
    ]
  },
  {
    key: "vendedores",
    title: "Vendedores",
    table: "seller_profiles",
    description: "Aprove, suspenda, reative, defina comissao, limites e observacoes de vendedores.",
    writeRoles: [...adminOnly],
    columns: [
      { key: "user_id", label: "Usuario ID" },
      { key: "application_id", label: "Solicitacao ID" },
      { key: "status", label: "Status", type: "select", options: ["pending", "under_review", "approved", "rejected", "suspended"] },
      { key: "commission_rate", label: "Comissao %", type: "number" },
      { key: "payout_minimum", label: "Saque minimo", type: "number" },
      { key: "limits", label: "Limites JSON", type: "textarea" },
      { key: "internal_notes", label: "Observacoes internas", type: "textarea" }
    ]
  },
  {
    key: "solicitacoes-vendedores",
    title: "Solicitacoes de vendedores",
    table: "seller_applications",
    description: "Analise solicitacoes, registre recusa, altere status e acompanhe documentos enviados.",
    writeRoles: [...adminOnly],
    columns: [
      { key: "user_id", label: "Usuario ID" },
      { key: "store_name", label: "Nome da loja" },
      { key: "responsible_name", label: "Responsavel" },
      { key: "document", label: "CPF/CNPJ" },
      { key: "commercial_email", label: "E-mail comercial", type: "email" },
      { key: "phone", label: "Telefone" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "address", label: "Endereco", type: "textarea" },
      { key: "description", label: "Descricao", type: "textarea" },
      { key: "instagram", label: "Instagram", type: "url" },
      { key: "website", label: "Site", type: "url" },
      { key: "logo_url", label: "Logotipo", type: "url" },
      { key: "document_url", label: "Documento", type: "url" },
      { key: "product_type", label: "Tipo de produto" },
      { key: "status", label: "Status", type: "select", options: ["pending", "under_review", "approved", "rejected", "suspended"] },
      { key: "rejection_reason", label: "Motivo da recusa", type: "textarea" }
    ]
  },
  {
    key: "lojas",
    title: "Lojas",
    table: "stores",
    description: "Gerencie lojas publicas, dados de contato, politicas e identidade do vendedor.",
    writeRoles: [...adminOnly],
    columns: [
      { key: "seller_id", label: "Vendedor ID" },
      { key: "name", label: "Nome" },
      { key: "slug", label: "Slug" },
      { key: "logo_url", label: "Logotipo", type: "url" },
      { key: "cover_image_url", label: "Capa", type: "url" },
      { key: "description", label: "Descricao", type: "textarea" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "email", label: "E-mail", type: "email" },
      { key: "social_links", label: "Redes JSON", type: "textarea" },
      { key: "delivery_policy", label: "Politica de entrega", type: "textarea" },
      { key: "exchange_policy", label: "Politica de troca", type: "textarea" },
      { key: "preparation_time", label: "Prazo de preparo" },
      { key: "institutional_info", label: "Institucional", type: "textarea" },
      { key: "rating", label: "Avaliacao", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["active", "inactive", "suspended"] }
    ]
  },
  {
    key: "produtos",
    title: "Produtos",
    table: "products",
    description: "Cadastre, publique, duplique, arquive, importe e exporte produtos internos ou afiliados.",
    writeRoles: [...editorial],
    columns: [
      { key: "name", label: "Nome" },
      { key: "slug", label: "Slug" },
      { key: "sku", label: "SKU" },
      { key: "seller_id", label: "Vendedor ID" },
      { key: "store_id", label: "Loja ID" },
      { key: "sale_type", label: "Tipo de venda", type: "select", options: ["internal", "affiliate"] },
      { key: "short_description", label: "Descricao curta", type: "textarea" },
      { key: "description", label: "Descricao completa", type: "textarea" },
      { key: "current_price", label: "Preco atual", type: "number" },
      { key: "old_price", label: "Preco anterior", type: "number" },
      { key: "installments", label: "Parcelamento" },
      { key: "discount_percent", label: "Desconto %", type: "number" },
      { key: "stock_quantity", label: "Estoque", type: "number" },
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
      { key: "status", label: "Status", type: "select", options: ["draft", "pending_review", "approved", "rejected", "published", "archived"] },
      { key: "rejection_reason", label: "Motivo de recusa", type: "textarea" },
      { key: "is_featured", label: "Destaque", type: "checkbox" },
      { key: "is_new", label: "Lancamento", type: "checkbox" },
      { key: "is_promo", label: "Promocao", type: "checkbox" },
      { key: "display_order", label: "Ordem", type: "number" }
    ]
  },
  { key: "pedidos", title: "Pedidos", table: "orders", description: "Acompanhe pedidos internos, pagamento, entrega, suporte, troca e comprovantes.", writeRoles: [...adminOnly], columns: [{ key: "order_number", label: "Numero" }, { key: "customer_id", label: "Cliente ID" }, { key: "seller_id", label: "Vendedor ID" }, { key: "store_id", label: "Loja ID" }, { key: "status", label: "Status", type: "select", options: ["awaiting_payment", "payment_approved", "preparing", "shipped", "delivered", "cancelled", "exchange_requested", "returned"] }, { key: "payment_status", label: "Pagamento" }, { key: "delivery_status", label: "Entrega" }, { key: "tracking_code", label: "Rastreamento" }, { key: "subtotal", label: "Subtotal", type: "number" }, { key: "discount_total", label: "Descontos", type: "number" }, { key: "shipping_total", label: "Frete", type: "number" }, { key: "total", label: "Total", type: "number" }, { key: "receipt_url", label: "Comprovante", type: "url" }, { key: "notes", label: "Notas", type: "textarea" }] },
  { key: "categorias", title: "Categorias", table: "categories", description: "Organize a navegacao publica por linhas e tipos de semijoia.", writeRoles: [...editorial], columns: [{ key: "name", label: "Nome" }, { key: "slug", label: "Slug" }, { key: "description", label: "Descricao", type: "textarea" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "is_active", label: "Ativa", type: "checkbox" }] },
  { key: "subcategorias", title: "Subcategorias", table: "subcategories", description: "Detalhe categorias com argolas, solitarios, chokers e outras vitrines.", writeRoles: [...editorial], columns: [{ key: "name", label: "Nome" }, { key: "slug", label: "Slug" }, { key: "description", label: "Descricao", type: "textarea" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "is_active", label: "Ativa", type: "checkbox" }] },
  { key: "colecoes", title: "Colecoes", table: "collections", description: "Crie colecoes sazonais e editoriais para destacar na loja.", writeRoles: [...editorial], columns: [{ key: "name", label: "Nome" }, { key: "slug", label: "Slug" }, { key: "description", label: "Descricao", type: "textarea" }, { key: "hero_image_url", label: "Imagem", type: "url" }, { key: "is_active", label: "Ativa", type: "checkbox" }] },
  { key: "cupons", title: "Cupons", table: "coupons", description: "Configure cupons globais, por vendedor ou por loja.", writeRoles: [...adminOnly], columns: [{ key: "code", label: "Codigo" }, { key: "description", label: "Descricao", type: "textarea" }, { key: "discount_type", label: "Tipo", type: "select", options: ["percent", "fixed"] }, { key: "discount_value", label: "Valor", type: "number" }, { key: "seller_id", label: "Vendedor ID" }, { key: "store_id", label: "Loja ID" }, { key: "usage_limit", label: "Limite", type: "number" }, { key: "is_active", label: "Ativo", type: "checkbox" }, { key: "status", label: "Status", type: "select", options: ["active", "inactive", "expired"] }] },
  { key: "comissoes", title: "Comissoes", table: "commissions", description: "Controle comissao pendente, disponivel, paga e vinculada a pedidos ou cliques.", writeRoles: [...adminOnly], columns: [{ key: "seller_id", label: "Vendedor ID" }, { key: "store_id", label: "Loja ID" }, { key: "product_id", label: "Produto ID" }, { key: "source", label: "Origem" }, { key: "base_amount", label: "Base", type: "number" }, { key: "commission_rate", label: "Comissao %", type: "number" }, { key: "commission_amount", label: "Valor", type: "number" }, { key: "status", label: "Status", type: "select", options: ["pending", "available", "paid", "cancelled"] }] },
  { key: "saques", title: "Saques", table: "payout_requests", description: "Analise, aprove, pague ou recuse solicitacoes de saque dos vendedores.", writeRoles: [...adminOnly], columns: [{ key: "seller_id", label: "Vendedor ID" }, { key: "amount", label: "Valor", type: "number" }, { key: "method", label: "Metodo" }, { key: "pix_key", label: "Chave Pix" }, { key: "status", label: "Status", type: "select", options: ["requested", "under_review", "approved", "paid", "rejected"] }, { key: "observation", label: "Observacao", type: "textarea" }, { key: "receipt_url", label: "Comprovante", type: "url" }] },
  { key: "parceiros", title: "Parceiros de afiliados", table: "affiliate_partners", description: "Configure codigos, parametros e modelos de URL dos parceiros.", writeRoles: [...adminOnly], columns: [{ key: "name", label: "Nome" }, { key: "logo_url", label: "Logotipo", type: "url" }, { key: "domain", label: "Dominio" }, { key: "affiliate_code", label: "Codigo de afiliado" }, { key: "affiliate_param", label: "Parametro" }, { key: "url_template", label: "Modelo de URL", type: "url" }, { key: "commission_rate", label: "Comissao %", type: "number" }, { key: "cookie_duration_days", label: "Cookie dias", type: "number" }, { key: "status", label: "Status", type: "select", options: ["active", "inactive"] }, { key: "notes", label: "Observacoes", type: "textarea" }] },
  { key: "banners", title: "Banners", table: "banners", description: "Gerencie hero, slides, campanhas e chamadas da home.", writeRoles: [...editorial], columns: [{ key: "title", label: "Titulo" }, { key: "subtitle", label: "Subtitulo" }, { key: "image_url", label: "Imagem", type: "url" }, { key: "button_label", label: "Botao" }, { key: "button_url", label: "URL", type: "url" }, { key: "placement", label: "Posicao" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "is_active", label: "Ativo", type: "checkbox" }] },
  { key: "home", title: "Secoes da home", table: "homepage_sections", description: "Edite barra promocional, textos, categorias, produtos, depoimentos, newsletter e redes sociais.", writeRoles: [...editorial], columns: [{ key: "section_key", label: "Chave" }, { key: "title", label: "Titulo" }, { key: "subtitle", label: "Subtitulo" }, { key: "content", label: "Conteudo JSON", type: "textarea" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "is_active", label: "Ativa", type: "checkbox" }] },
  { key: "aparencia", title: "Aparencia e identidade visual", table: "theme_settings", description: "Configure logotipos, cores, tipografia, rascunhos e publicacao visual.", writeRoles: [...adminOnly], columns: [{ key: "name", label: "Nome" }, { key: "mode", label: "Modo", type: "select", options: ["draft", "published"] }, { key: "logos", label: "Logotipos JSON", type: "textarea" }, { key: "colors", label: "Cores JSON", type: "textarea" }, { key: "typography", label: "Tipografia JSON", type: "textarea" }, { key: "is_published", label: "Publicado", type: "checkbox" }, { key: "status", label: "Status", type: "select", options: ["draft", "published", "archived"] }] },
  { key: "cabecalho", title: "Configuracao do cabecalho", table: "header_settings", description: "Controle logo, barra promocional, menus, busca, carrinho, favoritos e login.", writeRoles: [...adminOnly], columns: [{ key: "logo_url", label: "Logotipo", type: "url" }, { key: "promo_text", label: "Barra promocional" }, { key: "promo_coupon", label: "Cupom" }, { key: "promo_link", label: "Link promocional", type: "url" }, { key: "menu_items", label: "Menu JSON", type: "textarea" }, { key: "show_search", label: "Exibir busca", type: "checkbox" }, { key: "show_cart", label: "Exibir carrinho", type: "checkbox" }, { key: "show_favorites", label: "Exibir favoritos", type: "checkbox" }, { key: "show_login", label: "Exibir Entrar", type: "checkbox" }, { key: "social_links", label: "Redes JSON", type: "textarea" }, { key: "is_published", label: "Publicado", type: "checkbox" }] },
  { key: "rodape", title: "Configuracao do rodape", table: "footer_settings", description: "Edite identidade, contato, newsletter, legal, pagamentos e layout do rodape.", writeRoles: [...adminOnly], columns: [{ key: "logo_url", label: "Logo rodape", type: "url" }, { key: "about_text", label: "Texto sobre", type: "textarea" }, { key: "slogan", label: "Slogan" }, { key: "background_color", label: "Cor fundo", type: "color" }, { key: "text_color", label: "Cor texto", type: "color" }, { key: "link_color", label: "Cor links", type: "color" }, { key: "phone", label: "Telefone" }, { key: "whatsapp", label: "WhatsApp" }, { key: "email", label: "E-mail", type: "email" }, { key: "address", label: "Endereco", type: "textarea" }, { key: "city", label: "Cidade" }, { key: "state", label: "Estado" }, { key: "postal_code", label: "CEP" }, { key: "business_hours", label: "Horario" }, { key: "newsletter", label: "Newsletter JSON", type: "textarea" }, { key: "legal_info", label: "Legal JSON", type: "textarea" }, { key: "layout", label: "Layout JSON", type: "textarea" }, { key: "show_newsletter", label: "Newsletter", type: "checkbox" }, { key: "show_socials", label: "Redes", type: "checkbox" }, { key: "show_payment_methods", label: "Pagamentos", type: "checkbox" }, { key: "show_legal_info", label: "Dados legais", type: "checkbox" }, { key: "show_whatsapp_button", label: "Botao WhatsApp", type: "checkbox" }, { key: "is_published", label: "Publicado", type: "checkbox" }] },
  { key: "colunas-rodape", title: "Colunas do rodape", table: "footer_columns", description: "Crie, edite e reordene colunas de links do rodape.", writeRoles: [...adminOnly], columns: [{ key: "title", label: "Titulo" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "is_active", label: "Ativa", type: "checkbox" }, { key: "status", label: "Status", type: "select", options: ["active", "inactive"] }] },
  { key: "links-rodape", title: "Links do rodape", table: "footer_links", description: "Gerencie titulo, URL, ordem, nova aba e status de cada link.", writeRoles: [...adminOnly], columns: [{ key: "column_id", label: "Coluna ID" }, { key: "title", label: "Titulo" }, { key: "url", label: "URL" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "open_in_new_tab", label: "Nova aba", type: "checkbox" }, { key: "is_active", label: "Ativo", type: "checkbox" }, { key: "status", label: "Status", type: "select", options: ["active", "inactive"] }] },
  { key: "redes-sociais", title: "Redes sociais", table: "social_links", description: "Ative Instagram, Facebook, TikTok, YouTube, Pinterest, LinkedIn e X/Twitter.", writeRoles: [...adminOnly], columns: [{ key: "platform", label: "Rede" }, { key: "url", label: "URL", type: "url" }, { key: "is_active", label: "Ativa", type: "checkbox" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "status", label: "Status", type: "select", options: ["active", "inactive"] }] },
  { key: "pagamentos", title: "Formas de pagamento", table: "payment_methods", description: "Ative Pix, Visa, Mastercard, Elo, Amex, Boleto e outros icones.", writeRoles: [...adminOnly], columns: [{ key: "name", label: "Nome" }, { key: "icon_url", label: "Icone", type: "url" }, { key: "is_active", label: "Ativo", type: "checkbox" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "status", label: "Status", type: "select", options: ["active", "inactive"] }] },
  { key: "paginas", title: "Paginas institucionais", table: "pages", description: "Edite paginas como Sobre, Politica de Privacidade, Termos e Trocas.", writeRoles: [...editorial], columns: [{ key: "title", label: "Titulo" }, { key: "slug", label: "Slug" }, { key: "body", label: "Conteudo", type: "textarea" }, { key: "image_url", label: "Imagem", type: "url" }, { key: "seo_title", label: "Titulo SEO" }, { key: "seo_description", label: "Descricao SEO", type: "textarea" }, { key: "status", label: "Status", type: "select", options: ["draft", "published", "archived"] }] },
  { key: "leads", title: "Leads e newsletter", table: "leads", description: "Acompanhe capturas de e-mail e origens.", writeRoles: [...adminOnly], columns: [{ key: "email", label: "E-mail", type: "email" }, { key: "name", label: "Nome" }, { key: "source", label: "Origem" }, { key: "status", label: "Status", type: "select", options: ["new", "subscribed", "unsubscribed"] }] },
  { key: "usuarios", title: "Usuarios e permissoes", table: "profiles", description: "Controle usuarios, bloqueios e dados basicos. Senhas nao sao exibidas.", writeRoles: [...adminOnly], columns: [{ key: "email", label: "E-mail", type: "email" }, { key: "full_name", label: "Nome" }, { key: "phone", label: "Telefone" }, { key: "avatar_url", label: "Foto", type: "url" }, { key: "role", label: "Papel principal", type: "select", options: ["customer", "seller", "admin", "editor", "analyst"] }, { key: "is_active", label: "Ativo", type: "checkbox" }, { key: "status", label: "Status", type: "select", options: ["active", "blocked", "inactive"] }] },
  { key: "permissoes", title: "Permissoes", table: "user_roles", description: "Atribua multiplos papeis a uma pessoa sem duplicar cadastro.", writeRoles: [...adminOnly], columns: [{ key: "user_id", label: "Usuario ID" }, { key: "role", label: "Papel", type: "select", options: ["customer", "seller", "admin", "editor", "analyst"] }, { key: "status", label: "Status", type: "select", options: ["active", "inactive"] }] },
  { key: "notificacoes", title: "Notificacoes", table: "notifications", description: "Envie e acompanhe notificacoes para clientes e vendedores.", writeRoles: [...adminOnly], columns: [{ key: "user_id", label: "Usuario ID" }, { key: "title", label: "Titulo" }, { key: "message", label: "Mensagem", type: "textarea" }, { key: "type", label: "Tipo", type: "select", options: ["info", "success", "warning", "error"] }, { key: "status", label: "Status", type: "select", options: ["unread", "read", "archived"] }] },
  { key: "logs-auditoria", title: "Logs de auditoria", table: "audit_logs", description: "Registros de produtos, precos, vendedores, contas, comissoes, saques e identidade visual.", writeRoles: [...adminOnly], columns: [{ key: "actor_id", label: "Usuario ID" }, { key: "action", label: "Acao" }, { key: "table_name", label: "Tabela" }, { key: "record_id", label: "Registro ID" }, { key: "changes", label: "Alteracoes JSON", type: "textarea" }] },
  { key: "configuracoes", title: "Configuracoes gerais", table: "site_settings", description: "Ajuste nome, contatos, SEO, regras de aprovacao, comissoes e aviso de afiliados.", writeRoles: [...adminOnly], columns: [{ key: "key", label: "Chave" }, { key: "value", label: "Valor JSON", type: "textarea" }, { key: "description", label: "Descricao", type: "textarea" }, { key: "status", label: "Status", type: "select", options: ["active", "inactive"] }] }
];

export function findAdminModule(key: string) {
  return adminModules.find((module) => module.key === key);
}
