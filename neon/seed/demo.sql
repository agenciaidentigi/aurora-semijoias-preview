insert into profiles (id, email, full_name, phone, password_hash, role, is_active, email_verified_at)
values
(
  '00000000-0000-0000-0000-000000000001',
  'admin@aurora.local',
  'Administrador Aurora',
  '+55 11 90000-0001',
  'scrypt:aurora-preview-salt:a4c39fb09b1a42dff1e2c9b202c8f50b04c42ed961cb98f2f90e1ec05c028d211023e27b0892bbc320ae6918660ecdad3eaf4a3a57db75c6ef62c438bf3f38fa',
  'admin',
  true,
  now()
),
(
  '00000000-0000-0000-0000-000000000002',
  'cliente@aurora.local',
  'Cliente Aurora',
  '+55 11 90000-0002',
  'scrypt:aurora-preview-salt:a4c39fb09b1a42dff1e2c9b202c8f50b04c42ed961cb98f2f90e1ec05c028d211023e27b0892bbc320ae6918660ecdad3eaf4a3a57db75c6ef62c438bf3f38fa',
  'customer',
  true,
  now()
),
(
  '00000000-0000-0000-0000-000000000003',
  'vendedor@aurora.local',
  'Vendedor Aurora',
  '+55 11 90000-0003',
  'scrypt:aurora-preview-salt:a4c39fb09b1a42dff1e2c9b202c8f50b04c42ed961cb98f2f90e1ec05c028d211023e27b0892bbc320ae6918660ecdad3eaf4a3a57db75c6ef62c438bf3f38fa',
  'seller',
  true,
  now()
)
on conflict (id) do update set role = excluded.role, is_active = true, email_verified_at = now();

insert into user_roles (user_id, role, status) values
('00000000-0000-0000-0000-000000000001', 'admin', 'active'),
('00000000-0000-0000-0000-000000000001', 'customer', 'active'),
('00000000-0000-0000-0000-000000000002', 'customer', 'active'),
('00000000-0000-0000-0000-000000000003', 'customer', 'active'),
('00000000-0000-0000-0000-000000000003', 'seller', 'active')
on conflict (user_id, role) do update set status = 'active';

insert into customer_profiles (user_id, cpf, accepted_terms_at, accepted_privacy_at, accepts_offers, status)
values
('00000000-0000-0000-0000-000000000002', '000.000.000-00', now(), now(), true, 'active'),
('00000000-0000-0000-0000-000000000003', '111.111.111-11', now(), now(), true, 'active')
on conflict (user_id) do update set accepts_offers = excluded.accepts_offers;

insert into seller_applications (id, user_id, store_name, responsible_name, document, commercial_email, phone, whatsapp, address, description, instagram, website, product_type, accepted_terms_at, status, reviewed_by, reviewed_at)
values (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000003',
  'Atelier Aurora Demo',
  'Vendedor Aurora',
  '12.345.678/0001-90',
  'vendedor@aurora.local',
  '+55 11 90000-0003',
  '+55 11 90000-0003',
  'Rua das Joias, 100',
  'Loja demo aprovada para apresentar o painel do vendedor.',
  'https://instagram.com/',
  'https://example.com',
  'Semijoias folheadas',
  now(),
  'approved',
  '00000000-0000-0000-0000-000000000001',
  now()
) on conflict (id) do update set status = 'approved';

insert into seller_profiles (user_id, application_id, status, commission_rate, payout_minimum, approved_at)
values ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000101', 'approved', 12.5, 50.00, now())
on conflict (user_id) do update set status = 'approved', commission_rate = 12.5, payout_minimum = 50.00;

insert into stores (id, seller_id, name, slug, logo_url, cover_image_url, description, whatsapp, email, social_links, delivery_policy, exchange_policy, preparation_time, institutional_info, rating, status)
values (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000003',
  'Atelier Aurora Demo',
  'atelier-aurora-demo',
  null,
  'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1600&q=85',
  'Semijoias delicadas para uso diario, presentes e composicoes sofisticadas.',
  '+55 11 90000-0003',
  'vendedor@aurora.local',
  '{"instagram":"https://instagram.com/"}',
  'Envio em ate 3 dias uteis apos confirmacao.',
  'Trocas conforme politica da plataforma.',
  '3 dias uteis',
  'Loja demonstrativa para validacao do marketplace Aurora.',
  4.8,
  'active'
) on conflict (slug) do update set status = 'active';

insert into categories (name, slug, description, display_order) values
('Aneis', 'aneis', 'Solitarios, aparadores e mixes delicados.', 1),
('Brincos', 'brincos', 'Argolas, pontos de luz e pecas para festa.', 2),
('Colares', 'colares', 'Correntes, chokers e pingentes.', 3),
('Pulseiras', 'pulseiras', 'Rivieras, braceletes e correntes.', 4)
on conflict (slug) do nothing;

insert into collections (name, slug, description, hero_image_url) values
('Brilho leve', 'brilho-leve', 'Pecas delicadas para combinar todos os dias.', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1300&q=85')
on conflict (slug) do nothing;

insert into affiliate_partners (name, domain, affiliate_code, affiliate_param, url_template, commission_rate, cookie_duration_days, status, notes)
values ('Parceiro Demo', 'loja-demo.com', 'AURORA10', 'ref', 'https://loja-demo.com/produto/{product_slug}?ref={affiliate_code}', 8.5, 30, 'active', 'Troque pelo parceiro real.')
on conflict do nothing;

with partner as (select id from affiliate_partners where name = 'Parceiro Demo' limit 1),
cat as (select id from categories where slug = 'aneis' limit 1)
insert into products (name, slug, sku, seller_id, store_id, sale_type, short_description, description, current_price, old_price, installments, discount_percent, category_id, material, plating, stone, color, stock_quantity, main_image_url, badge, is_featured, is_new, is_promo, display_order, original_url, affiliate_partner_id, estimated_commission, seo_title, seo_description, status)
select 'Anel solitario zirconia cristal', 'anel-solitario-zirconia-cristal', 'AUR-001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000201', 'affiliate', 'Anel delicado com ponto de luz.', 'Semijoia de acabamento polido para uso diario e presente.', 89.90, 109.90, '3x de R$ 29,97', 18, cat.id, 'Liga metalica', 'Ouro 18k', 'Zirconia', 'Dourado', 12, 'https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=900&q=85', 'Destaque', true, true, false, 1, 'https://loja-demo.com/produto/anel-solitario-zirconia-cristal', partner.id, 7.64, 'Anel solitario zirconia cristal', 'Anel solitario banhado a ouro com link de afiliado.', 'published'
from partner, cat
on conflict (slug) do nothing;

insert into products (name, slug, sku, seller_id, store_id, sale_type, short_description, description, current_price, old_price, stock_quantity, main_image_url, badge, is_featured, display_order, seo_title, seo_description, status)
values ('Colar ponto de luz interno', 'colar-ponto-de-luz-interno', 'AUR-INT-001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000201', 'internal', 'Produto demo para fluxo de carrinho.', 'Colar delicado preparado para venda interna futura.', 129.90, 149.90, 8, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85', 'Venda interna', true, 2, 'Colar ponto de luz', 'Colar para demonstrar fluxo interno.', 'published')
on conflict (slug) do nothing;

insert into favorites (user_id, product_id)
select '00000000-0000-0000-0000-000000000002', id from products where slug = 'anel-solitario-zirconia-cristal'
on conflict (user_id, product_id) do nothing;

insert into coupons (code, description, discount_type, discount_value, is_active, status)
values ('AURORA10', 'Cupom demo de boas-vindas.', 'percent', 10, true, 'active')
on conflict (code) do nothing;

insert into banners (title, subtitle, image_url, button_label, button_url, placement, display_order) values
('Semijoias para iluminar todos os dias', 'Curadoria sofisticada com compra em lojas parceiras.', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1800&q=85', 'Comprar agora', '#produtos', 'hero', 1)
on conflict do nothing;

insert into homepage_sections (section_key, title, subtitle, content, display_order) values
('topbar', '10% off em escolhas selecionadas', 'Compra segura nos parceiros', '{"enabled":true}', 1),
('benefits', 'Beneficios', 'Curadoria, compra no parceiro e atualizacao simples', '{"items":["Curadoria elegante","Compra nos parceiros","Atualizacao simples"]}', 2)
on conflict (section_key) do nothing;

insert into theme_settings (name, mode, logos, colors, typography, is_published, status)
values (
  'Tema Aurora',
  'published',
  '{"primary":"Aurora","footer":"Aurora"}',
  '{"primary":"#191714","secondary":"#b08968","accent":"#d6a84f","header":"#fbfaf7","footer":"#191714","background":"#fbfaf7","text":"#191714","button":"#191714","buttonText":"#ffffff"}',
  '{"heading":"Georgia","body":"Arial","baseSize":"16px","buttonStyle":"uppercase"}',
  true,
  'published'
) on conflict do nothing;

insert into header_settings (promo_text, promo_coupon, promo_link, menu_items, show_search, show_cart, show_favorites, show_login, is_published)
values ('10% off em escolhas selecionadas', 'AURORA10', '/#produtos', '[{"title":"Aneis","url":"/#produtos","active":true},{"title":"Brincos","url":"/#produtos","active":true},{"title":"Colares","url":"/#produtos","active":true},{"title":"Pulseiras","url":"/#produtos","active":true},{"title":"Seja vendedor","url":"/seja-vendedor","active":true}]', true, true, true, true, true)
on conflict do nothing;

insert into footer_settings (about_text, slogan, phone, whatsapp, email, city, state, business_hours, newsletter, legal_info, layout, is_published)
values ('Marketplace e curadoria de semijoias com identidade propria.', 'Brilho leve, todos os dias.', '+55 11 3000-0000', '+55 11 90000-0000', 'contato@aurora.local', 'Sao Paulo', 'SP', 'Segunda a sexta, 9h as 18h', '{"title":"Receba novidades","text":"Curadorias e ofertas selecionadas.","placeholder":"Seu e-mail","button":"Assinar"}', '{"company_name":"Aurora Semijoias Demo","cnpj":"00.000.000/0001-00"}', '{"columns":4,"alignment":"left"}', true)
on conflict do nothing;

insert into footer_columns (id, title, display_order, is_active) values
('00000000-0000-0000-0000-000000000301', 'Institucional', 1, true),
('00000000-0000-0000-0000-000000000302', 'Atendimento', 2, true),
('00000000-0000-0000-0000-000000000303', 'Minha conta', 3, true),
('00000000-0000-0000-0000-000000000304', 'Politicas', 4, true)
on conflict (id) do nothing;

insert into footer_links (column_id, title, url, display_order, open_in_new_tab, is_active) values
('00000000-0000-0000-0000-000000000301', 'Quem somos', '/paginas/quem-somos', 1, false, true),
('00000000-0000-0000-0000-000000000301', 'Seja vendedor', '/seja-vendedor', 2, false, true),
('00000000-0000-0000-0000-000000000302', 'Trocas e devolucoes', '/paginas/trocas-e-devolucoes', 1, false, true),
('00000000-0000-0000-0000-000000000303', 'Entrar', '/login', 1, false, true),
('00000000-0000-0000-0000-000000000303', 'Meus pedidos', '/minha-conta?tab=pedidos', 2, false, true),
('00000000-0000-0000-0000-000000000304', 'Privacidade', '/paginas/politica-de-privacidade', 1, false, true),
('00000000-0000-0000-0000-000000000304', 'Termos de Uso', '/paginas/termos-de-uso', 2, false, true)
on conflict do nothing;

insert into social_links (platform, url, is_active, display_order) values
('Instagram', 'https://instagram.com/', true, 1),
('Facebook', 'https://facebook.com/', false, 2),
('TikTok', 'https://tiktok.com/', false, 3),
('YouTube', 'https://youtube.com/', false, 4),
('Pinterest', 'https://pinterest.com/', false, 5),
('LinkedIn', 'https://linkedin.com/', false, 6),
('X/Twitter', 'https://x.com/', false, 7)
on conflict (platform) do update set url = excluded.url;

insert into payment_methods (name, is_active, display_order) values
('Pix', true, 1),
('Visa', true, 2),
('Mastercard', true, 3),
('Elo', true, 4),
('American Express', true, 5),
('Boleto', true, 6),
('Mercado Pago', false, 7)
on conflict (name) do update set is_active = excluded.is_active;

insert into pages (title, slug, body, seo_title, seo_description, status, published_at) values
('Quem somos', 'quem-somos', 'A Aurora e uma plataforma demo de semijoias, lojas parceiras e links de afiliados com identidade propria.', 'Quem somos | Aurora', 'Conheca a Aurora Semijoias.', 'published', now()),
('Politica de Privacidade', 'politica-de-privacidade', 'Esta pagina demonstra onde a politica de privacidade sera publicada e editada pelo painel.', 'Politica de Privacidade | Aurora', 'Politica de privacidade da Aurora.', 'published', now()),
('Termos de Uso', 'termos-de-uso', 'Termos de uso demonstrativos para validacao do projeto.', 'Termos de Uso | Aurora', 'Termos de uso da Aurora.', 'published', now()),
('Trocas e devolucoes', 'trocas-e-devolucoes', 'As regras de troca e devolucao serao configuradas pela administracao e lojas parceiras.', 'Trocas e devolucoes | Aurora', 'Politica de trocas e devolucoes.', 'published', now())
on conflict (slug) do update set status = 'published';

insert into site_settings (key, value, description) values
('site', '{"name":"Aurora Semijoias","instagram":"https://instagram.com/","affiliateDisclosure":"Compras externas sao realizadas em lojas parceiras.","productApproval":"manual","globalCommissionRate":12.5,"minimumPayout":50}', 'Configuracoes gerais da loja')
on conflict (key) do update set value = excluded.value;
