create extension if not exists "pgcrypto";

do $$
begin
  create type user_role as enum ('admin', 'editor', 'analyst');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type content_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type partner_status as enum ('active', 'inactive');
exception when duplicate_object then null;
end $$;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  password_hash text,
  role user_role not null default 'analyst',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  hero_image_url text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists affiliate_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  domain text,
  affiliate_code text not null,
  affiliate_param text not null default 'ref',
  url_template text,
  commission_rate numeric(8,2) default 0,
  cookie_duration_days int default 30,
  status partner_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text unique,
  short_description text,
  description text,
  current_price numeric(12,2),
  old_price numeric(12,2),
  installments text,
  discount_percent numeric(5,2),
  category_id uuid references categories(id) on delete set null,
  subcategory_id uuid references subcategories(id) on delete set null,
  collection_id uuid references collections(id) on delete set null,
  material text,
  plating text,
  stone text,
  color text,
  sizes text[] default '{}',
  main_image_url text,
  badge text,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_promo boolean not null default false,
  display_order int not null default 0,
  original_url text,
  affiliate_url text,
  affiliate_partner_id uuid references affiliate_partners(id) on delete set null,
  estimated_commission numeric(12,2) default 0,
  seo_title text,
  seo_description text,
  status content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  display_order int not null default 0,
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  sku text,
  size text,
  color text,
  price numeric(12,2),
  stock_status text default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  affiliate_partner_id uuid references affiliate_partners(id) on delete set null,
  clicked_at timestamptz not null default now(),
  source text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  user_agent text,
  ip_hash text,
  clicked_url text,
  estimated_commission numeric(12,2) default 0
);

create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  button_label text,
  button_url text,
  placement text not null default 'home',
  display_order int not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title text,
  subtitle text,
  content jsonb not null default '{}'::jsonb,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  source text,
  status text not null default 'new',
  consent_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  body text,
  seo_title text,
  seo_description text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  changes jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_status_order on products(status, display_order);
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_clicks_product_date on affiliate_clicks(product_id, clicked_at desc);
create index if not exists idx_clicks_partner_date on affiliate_clicks(affiliate_partner_id, clicked_at desc);
create index if not exists idx_clicks_utm on affiliate_clicks(utm_source, utm_campaign);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on profiles;
create trigger set_profiles_updated_at before update on profiles for each row execute function set_updated_at();
drop trigger if exists set_products_updated_at on products;
create trigger set_products_updated_at before update on products for each row execute function set_updated_at();
drop trigger if exists set_categories_updated_at on categories;
create trigger set_categories_updated_at before update on categories for each row execute function set_updated_at();
drop trigger if exists set_subcategories_updated_at on subcategories;
create trigger set_subcategories_updated_at before update on subcategories for each row execute function set_updated_at();
drop trigger if exists set_collections_updated_at on collections;
create trigger set_collections_updated_at before update on collections for each row execute function set_updated_at();
drop trigger if exists set_partners_updated_at on affiliate_partners;
create trigger set_partners_updated_at before update on affiliate_partners for each row execute function set_updated_at();
drop trigger if exists set_banners_updated_at on banners;
create trigger set_banners_updated_at before update on banners for each row execute function set_updated_at();
drop trigger if exists set_home_updated_at on homepage_sections;
create trigger set_home_updated_at before update on homepage_sections for each row execute function set_updated_at();
drop trigger if exists set_pages_updated_at on pages;
create trigger set_pages_updated_at before update on pages for each row execute function set_updated_at();
drop trigger if exists set_settings_updated_at on site_settings;
create trigger set_settings_updated_at before update on site_settings for each row execute function set_updated_at();
