"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { slugify } from "@/lib/utils";

async function requireApprovedSeller() {
  const profile = await requireAuth({ roles: ["seller", "admin"], next: "/vendedor" });
  const sql = getDb();
  const rows = await sql.unsafe("select user_id, status::text as status from seller_profiles where user_id = $1 limit 1", [profile.id]);
  const seller = rows[0] as unknown as { user_id: string; status: string } | undefined;
  if (!seller || seller.status !== "approved") redirect("/vendedor?pending=1");
  return profile;
}

export async function saveStore(formData: FormData) {
  const profile = await requireApprovedSeller();
  const sql = getDb();
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  if (!name || !slug) redirect("/vendedor?error=Informe nome e slug da loja.");

  await sql.unsafe(
    `insert into stores (
      seller_id, name, slug, logo_url, cover_image_url, description, whatsapp, email, social_links,
      delivery_policy, exchange_policy, preparation_time, institutional_info, created_by, updated_by
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$1,$1)
    on conflict (slug) do update set
      name = excluded.name,
      logo_url = excluded.logo_url,
      cover_image_url = excluded.cover_image_url,
      description = excluded.description,
      whatsapp = excluded.whatsapp,
      email = excluded.email,
      social_links = excluded.social_links,
      delivery_policy = excluded.delivery_policy,
      exchange_policy = excluded.exchange_policy,
      preparation_time = excluded.preparation_time,
      institutional_info = excluded.institutional_info,
      updated_by = excluded.updated_by`,
    [
      profile.id,
      name,
      slug,
      String(formData.get("logo_url") ?? ""),
      String(formData.get("cover_image_url") ?? ""),
      String(formData.get("description") ?? ""),
      String(formData.get("whatsapp") ?? ""),
      String(formData.get("email") ?? ""),
      JSON.stringify({
        instagram: String(formData.get("instagram") ?? ""),
        facebook: String(formData.get("facebook") ?? ""),
        tiktok: String(formData.get("tiktok") ?? "")
      }),
      String(formData.get("delivery_policy") ?? ""),
      String(formData.get("exchange_policy") ?? ""),
      String(formData.get("preparation_time") ?? ""),
      String(formData.get("institutional_info") ?? "")
    ]
  );
  await sql.unsafe("insert into audit_logs (actor_id, action, table_name) values ($1, 'seller_store_saved', 'stores')", [profile.id]);
  revalidatePath("/vendedor");
  redirect("/vendedor?success=Loja atualizada");
}

export async function saveSellerProduct(formData: FormData) {
  const profile = await requireApprovedSeller();
  const sql = getDb();
  const storeRows = await sql.unsafe("select id from stores where seller_id = $1 order by created_at asc limit 1", [profile.id]);
  const store = storeRows[0] as unknown as { id: string } | undefined;
  if (!store) redirect("/vendedor?error=Cadastre sua loja antes de criar produtos.");

  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  if (!name || !slug) redirect("/vendedor?error=Informe nome e slug do produto.");

  const price = Number(formData.get("current_price") ?? 0);
  const saleType = String(formData.get("sale_type") ?? "affiliate") === "internal" ? "internal" : "affiliate";

  await sql.unsafe(
    `insert into products (
      seller_id, store_id, name, slug, sku, short_description, description, current_price, old_price,
      stock_quantity, main_image_url, original_url, affiliate_url, sale_type, status, created_by, updated_by
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending_review',$1,$1)`,
    [
      profile.id,
      store.id,
      name,
      slug,
      String(formData.get("sku") ?? ""),
      String(formData.get("short_description") ?? ""),
      String(formData.get("description") ?? ""),
      Number.isFinite(price) ? price : 0,
      Number(formData.get("old_price") ?? 0) || null,
      Number(formData.get("stock_quantity") ?? 0) || 0,
      String(formData.get("main_image_url") ?? ""),
      String(formData.get("original_url") ?? ""),
      String(formData.get("affiliate_url") ?? ""),
      saleType
    ]
  );
  await sql.unsafe("insert into audit_logs (actor_id, action, table_name) values ($1, 'seller_product_submitted', 'products')", [profile.id]);
  revalidatePath("/vendedor");
  redirect("/vendedor?success=Produto enviado para aprovacao");
}

export async function requestPayout(formData: FormData) {
  const profile = await requireApprovedSeller();
  const sql = getDb();
  const amount = Number(formData.get("amount") ?? 0);
  const pixKey = String(formData.get("pix_key") ?? "").trim();
  if (!amount || amount <= 0 || !pixKey) redirect("/vendedor?error=Informe valor e chave Pix.");

  await sql.unsafe(
    "insert into payout_requests (seller_id, amount, method, pix_key, status, created_by) values ($1,$2,'pix',$3,'requested',$1)",
    [profile.id, amount, pixKey]
  );
  await sql.unsafe("insert into audit_logs (actor_id, action, table_name) values ($1, 'payout_requested', 'payout_requests')", [profile.id]);
  revalidatePath("/vendedor");
  redirect("/vendedor?success=Saque solicitado");
}
