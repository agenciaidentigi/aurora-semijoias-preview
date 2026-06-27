do $$
begin
  alter type user_role add value if not exists 'customer';
  alter type user_role add value if not exists 'seller';
exception when undefined_object then
  create type user_role as enum ('customer', 'seller', 'admin', 'editor', 'analyst');
end $$;

do $$
begin
  alter type content_status add value if not exists 'pending_review';
  alter type content_status add value if not exists 'approved';
  alter type content_status add value if not exists 'rejected';
exception when undefined_object then
  create type content_status as enum ('draft', 'pending_review', 'approved', 'rejected', 'published', 'archived');
end $$;

do $$
begin
  create type sale_type as enum ('internal', 'affiliate');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type seller_application_status as enum ('pending', 'under_review', 'approved', 'rejected', 'suspended');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type order_status as enum (
    'awaiting_payment',
    'payment_approved',
    'preparing',
    'shipped',
    'delivered',
    'cancelled',
    'exchange_requested',
    'returned'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type payout_status as enum ('requested', 'under_review', 'approved', 'paid', 'rejected');
exception when duplicate_object then null;
end $$;

alter table profiles
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists email_verified_at timestamptz,
  add column if not exists email_verification_token text,
  add column if not exists email_verification_sent_at timestamptz,
  add column if not exists password_reset_token text,
  add column if not exists password_reset_expires_at timestamptz,
  add column if not exists last_login_at timestamptz,
  add column if not exists created_by uuid references profiles(id) on delete set null,
  add column if not exists updated_by uuid references profiles(id) on delete set null,
  add column if not exists status text not null default 'active';

alter table profiles alter column role set default 'customer';

create unique index if not exists idx_profiles_email_verification_token on profiles(email_verification_token) where email_verification_token is not null;
create unique index if not exists idx_profiles_password_reset_token on profiles(password_reset_token) where password_reset_token is not null;

create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null,
  unique (user_id, role)
);

insert into user_roles (user_id, role, status)
select id, role, 'active'
from profiles
on conflict (user_id, role) do nothing;

create table if not exists customer_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  cpf text,
  birth_date date,
  communication_preferences jsonb not null default '{"email":true,"sms":false,"whatsapp":true,"offers":true}'::jsonb,
  accepted_terms_at timestamptz,
  accepted_privacy_at timestamptz,
  accepts_offers boolean not null default false,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null default 'Principal',
  postal_code text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  reference_point text,
  is_primary boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists seller_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  store_name text not null,
  responsible_name text not null,
  document text,
  commercial_email text,
  phone text,
  whatsapp text,
  address text,
  description text,
  instagram text,
  website text,
  logo_url text,
  document_url text,
  product_type text,
  accepted_terms_at timestamptz,
  status seller_application_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists seller_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  application_id uuid references seller_applications(id) on delete set null,
  status seller_application_status not null default 'pending',
  commission_rate numeric(8,2),
  payout_minimum numeric(12,2),
  limits jsonb not null default '{}'::jsonb,
  internal_notes text,
  approved_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references seller_profiles(user_id) on delete cascade,
  name text not null,
  slug text not null unique,
  logo_url text,
  cover_image_url text,
  description text,
  whatsapp text,
  email text,
  social_links jsonb not null default '{}'::jsonb,
  delivery_policy text,
  exchange_policy text,
  preparation_time text,
  institutional_info text,
  rating numeric(3,2) not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

alter table products
  add column if not exists seller_id uuid references seller_profiles(user_id) on delete set null,
  add column if not exists store_id uuid references stores(id) on delete set null,
  add column if not exists sale_type sale_type not null default 'affiliate',
  add column if not exists stock_quantity int not null default 0,
  add column if not exists approval_status text,
  add column if not exists rejection_reason text,
  add column if not exists approved_by uuid references profiles(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists created_by uuid references profiles(id) on delete set null,
  add column if not exists updated_by uuid references profiles(id) on delete set null;

alter table product_variants
  add column if not exists stock_quantity int not null default 0,
  add column if not exists status text not null default 'active',
  add column if not exists created_by uuid references profiles(id) on delete set null,
  add column if not exists updated_by uuid references profiles(id) on delete set null;

alter table affiliate_clicks
  add column if not exists seller_id uuid references seller_profiles(user_id) on delete set null,
  add column if not exists store_id uuid references stores(id) on delete set null,
  add column if not exists destination_url text,
  add column if not exists status text not null default 'tracked';

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null,
  unique (user_id, product_id)
);

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  session_id text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  quantity int not null default 1,
  unit_price numeric(12,2),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references profiles(id) on delete restrict,
  store_id uuid references stores(id) on delete set null,
  seller_id uuid references seller_profiles(user_id) on delete set null,
  status order_status not null default 'awaiting_payment',
  payment_status text not null default 'pending',
  delivery_status text not null default 'not_started',
  tracking_code text,
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  shipping_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  support_requested_at timestamptz,
  exchange_requested_at timestamptz,
  receipt_url text,
  notes text,
  status_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  seller_id uuid references seller_profiles(user_id) on delete set null,
  store_id uuid references stores(id) on delete set null,
  product_name text not null,
  sku text,
  quantity int not null default 1,
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  commission_amount numeric(12,2) not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text,
  method text,
  amount numeric(12,2) not null default 0,
  status text not null default 'pending',
  transaction_id text,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists commissions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references seller_profiles(user_id) on delete set null,
  store_id uuid references stores(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  order_item_id uuid references order_items(id) on delete set null,
  affiliate_click_id uuid references affiliate_clicks(id) on delete set null,
  source text not null default 'order',
  base_amount numeric(12,2) not null default 0,
  commission_rate numeric(8,2) not null default 0,
  commission_amount numeric(12,2) not null default 0,
  status text not null default 'pending',
  available_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists payout_requests (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references seller_profiles(user_id) on delete cascade,
  amount numeric(12,2) not null,
  method text not null default 'pix',
  pix_key text,
  status payout_status not null default 'requested',
  observation text,
  receipt_url text,
  requested_at timestamptz not null default now(),
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null default 'percent',
  discount_value numeric(12,2) not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int,
  seller_id uuid references seller_profiles(user_id) on delete set null,
  store_id uuid references stores(id) on delete set null,
  is_active boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists theme_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Principal',
  mode text not null default 'draft',
  logos jsonb not null default '{}'::jsonb,
  colors jsonb not null default '{}'::jsonb,
  typography jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists header_settings (
  id uuid primary key default gen_random_uuid(),
  logo_url text,
  promo_text text,
  promo_coupon text,
  promo_link text,
  menu_items jsonb not null default '[]'::jsonb,
  show_search boolean not null default true,
  show_cart boolean not null default true,
  show_favorites boolean not null default true,
  show_login boolean not null default true,
  icons jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists footer_settings (
  id uuid primary key default gen_random_uuid(),
  logo_url text,
  about_text text,
  slogan text,
  background_color text,
  text_color text,
  link_color text,
  phone text,
  whatsapp text,
  email text,
  address text,
  city text,
  state text,
  postal_code text,
  business_hours text,
  newsletter jsonb not null default '{}'::jsonb,
  legal_info jsonb not null default '{}'::jsonb,
  layout jsonb not null default '{}'::jsonb,
  show_newsletter boolean not null default true,
  show_socials boolean not null default true,
  show_payment_methods boolean not null default true,
  show_legal_info boolean not null default true,
  show_whatsapp_button boolean not null default true,
  is_published boolean not null default true,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists footer_columns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  display_order int not null default 0,
  is_active boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists footer_links (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references footer_columns(id) on delete cascade,
  title text not null,
  url text not null,
  display_order int not null default 0,
  open_in_new_tab boolean not null default false,
  is_active boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text,
  is_active boolean not null default false,
  display_order int not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null,
  unique(platform)
);

create table if not exists payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon_url text,
  is_active boolean not null default true,
  display_order int not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text,
  type text not null default 'info',
  read_at timestamptz,
  status text not null default 'unread',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

alter table categories add column if not exists created_by uuid references profiles(id) on delete set null, add column if not exists updated_by uuid references profiles(id) on delete set null, add column if not exists status text not null default 'active';
alter table subcategories add column if not exists created_by uuid references profiles(id) on delete set null, add column if not exists updated_by uuid references profiles(id) on delete set null, add column if not exists status text not null default 'active';
alter table collections add column if not exists created_by uuid references profiles(id) on delete set null, add column if not exists updated_by uuid references profiles(id) on delete set null, add column if not exists status text not null default 'active';
alter table banners add column if not exists created_by uuid references profiles(id) on delete set null, add column if not exists updated_by uuid references profiles(id) on delete set null, add column if not exists status text not null default 'active';
alter table pages add column if not exists image_url text, add column if not exists published_at timestamptz, add column if not exists created_by uuid references profiles(id) on delete set null, add column if not exists updated_by uuid references profiles(id) on delete set null;
alter table site_settings add column if not exists created_by uuid references profiles(id) on delete set null, add column if not exists updated_by uuid references profiles(id) on delete set null, add column if not exists status text not null default 'active';

create index if not exists idx_user_roles_user on user_roles(user_id, role);
create index if not exists idx_addresses_user on addresses(user_id);
create index if not exists idx_seller_applications_user_status on seller_applications(user_id, status);
create index if not exists idx_seller_profiles_status on seller_profiles(status);
create index if not exists idx_stores_seller on stores(seller_id);
create index if not exists idx_stores_slug on stores(slug);
create index if not exists idx_products_seller_store on products(seller_id, store_id);
create index if not exists idx_products_sale_type on products(sale_type);
create index if not exists idx_favorites_user on favorites(user_id);
create index if not exists idx_orders_customer_date on orders(customer_id, created_at desc);
create index if not exists idx_orders_seller_date on orders(seller_id, created_at desc);
create index if not exists idx_commissions_seller_status on commissions(seller_id, status);
create index if not exists idx_payout_requests_seller_status on payout_requests(seller_id, status);
create index if not exists idx_coupons_status on coupons(is_active, status);
create index if not exists idx_notifications_user_status on notifications(user_id, status);

create or replace function app_current_user_id()
returns uuid language sql stable as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;

create or replace function app_has_role(required_role text)
returns boolean language sql stable as $$
  select required_role = any(regexp_split_to_array(coalesce(current_setting('app.current_user_roles', true), ''), ','));
$$;

create or replace function app_is_admin()
returns boolean language sql stable as $$
  select app_has_role('admin');
$$;

alter table user_roles enable row level security;
alter table profiles enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table customer_profiles enable row level security;
alter table addresses enable row level security;
alter table seller_applications enable row level security;
alter table seller_profiles enable row level security;
alter table stores enable row level security;
alter table favorites enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table commissions enable row level security;
alter table payout_requests enable row level security;
alter table notifications enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'customer_profiles' and policyname = 'customer_profiles_owner_or_admin') then
    create policy customer_profiles_owner_or_admin on customer_profiles
      using (user_id = app_current_user_id() or app_is_admin())
      with check (user_id = app_current_user_id() or app_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_owner_or_admin') then
    create policy profiles_owner_or_admin on profiles
      using (id = app_current_user_id() or app_is_admin())
      with check (id = app_current_user_id() or app_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_roles' and policyname = 'user_roles_owner_or_admin') then
    create policy user_roles_owner_or_admin on user_roles
      using (user_id = app_current_user_id() or app_is_admin())
      with check (app_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'addresses' and policyname = 'addresses_owner_or_admin') then
    create policy addresses_owner_or_admin on addresses
      using (user_id = app_current_user_id() or app_is_admin())
      with check (user_id = app_current_user_id() or app_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'seller_applications' and policyname = 'seller_applications_owner_or_admin') then
    create policy seller_applications_owner_or_admin on seller_applications
      using (user_id = app_current_user_id() or app_is_admin())
      with check (user_id = app_current_user_id() or app_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'seller_profiles' and policyname = 'seller_profiles_owner_or_admin') then
    create policy seller_profiles_owner_or_admin on seller_profiles
      using (user_id = app_current_user_id() or app_is_admin())
      with check (user_id = app_current_user_id() or app_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'stores' and policyname = 'stores_seller_or_admin') then
    create policy stores_seller_or_admin on stores
      using (seller_id = app_current_user_id() or app_is_admin())
      with check (seller_id = app_current_user_id() or app_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'products_public_seller_or_admin') then
    create policy products_public_seller_or_admin on products
      using (status = 'published' or seller_id = app_current_user_id() or app_is_admin())
      with check (seller_id = app_current_user_id() or app_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'favorites' and policyname = 'favorites_owner_or_admin') then
    create policy favorites_owner_or_admin on favorites
      using (user_id = app_current_user_id() or app_is_admin())
      with check (user_id = app_current_user_id() or app_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_customer_seller_or_admin') then
    create policy orders_customer_seller_or_admin on orders
      using (customer_id = app_current_user_id() or seller_id = app_current_user_id() or app_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payout_requests' and policyname = 'payouts_seller_or_admin') then
    create policy payouts_seller_or_admin on payout_requests
      using (seller_id = app_current_user_id() or app_is_admin())
      with check (seller_id = app_current_user_id() or app_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_owner_or_admin') then
    create policy notifications_owner_or_admin on notifications
      using (user_id = app_current_user_id() or app_is_admin())
      with check (user_id = app_current_user_id() or app_is_admin());
  end if;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'user_roles',
    'customer_profiles',
    'addresses',
    'seller_applications',
    'seller_profiles',
    'stores',
    'favorites',
    'carts',
    'cart_items',
    'orders',
    'order_items',
    'payments',
    'commissions',
    'payout_requests',
    'coupons',
    'theme_settings',
    'header_settings',
    'footer_settings',
    'footer_columns',
    'footer_links',
    'social_links',
    'payment_methods',
    'notifications'
  ] loop
    execute format('drop trigger if exists %I on %I', 'set_' || table_name || '_updated_at', table_name);
    execute format('create trigger %I before update on %I for each row execute function set_updated_at()', 'set_' || table_name || '_updated_at', table_name);
  end loop;
end $$;
