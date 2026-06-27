import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function applyAffiliateTemplate(template: string | null, product: Record<string, any>, partner: Record<string, any> | null) {
  const fallback = product.affiliate_url || product.original_url || "/";
  const url = template || fallback;
  return url
    .replaceAll("{product_id}", product.sku || product.id)
    .replaceAll("{product_slug}", product.slug)
    .replaceAll("{affiliate_code}", partner?.affiliate_code || "");
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sql = getDb();
  const products = await sql(
    `select p.*, ap.name as partner_name, ap.affiliate_code, ap.affiliate_param, ap.url_template
     from products p
     left join affiliate_partners ap on ap.id = p.affiliate_partner_id
     where p.slug = $1 and p.status = 'published'
     limit 1`,
    [slug]
  );
  const product = products[0];

  if (!product) return NextResponse.redirect(new URL("/", request.url));

  const url = new URL(request.url);
  const partner = product.affiliate_code
    ? {
        affiliate_code: product.affiliate_code,
        affiliate_param: product.affiliate_param,
        url_template: product.url_template
      }
    : null;
  let finalUrl = applyAffiliateTemplate(partner?.url_template, product, partner);

  try {
    const destination = new URL(finalUrl);
    if (partner?.affiliate_param && partner?.affiliate_code && !destination.searchParams.has(partner.affiliate_param)) {
      destination.searchParams.set(partner.affiliate_param, partner.affiliate_code);
    }
    finalUrl = destination.toString();
  } catch {
    finalUrl = product.original_url || "/";
  }

  await sql(
    `insert into affiliate_clicks (
      product_id, affiliate_partner_id, source, referrer, utm_source, utm_medium,
      utm_campaign, utm_content, utm_term, user_agent, ip_hash, clicked_url, estimated_commission
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      product.id,
      product.affiliate_partner_id,
      url.searchParams.get("source") || url.searchParams.get("utm_source"),
      request.headers.get("referer"),
      url.searchParams.get("utm_source"),
      url.searchParams.get("utm_medium"),
      url.searchParams.get("utm_campaign"),
      url.searchParams.get("utm_content"),
      url.searchParams.get("utm_term"),
      request.headers.get("user-agent"),
      request.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
      finalUrl,
      product.estimated_commission
    ]
  );

  return NextResponse.redirect(finalUrl, 302);
}
