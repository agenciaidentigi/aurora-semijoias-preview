import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase";

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
  const supabase = createSupabaseServiceClient();
  const { data: product, error } = await supabase
    .from("products")
    .select("*, affiliate_partners(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !product) return NextResponse.redirect(new URL("/", request.url));

  const url = new URL(request.url);
  const partner = product.affiliate_partners;
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

  await supabase.from("affiliate_clicks").insert({
    product_id: product.id,
    affiliate_partner_id: product.affiliate_partner_id,
    source: url.searchParams.get("source") || url.searchParams.get("utm_source"),
    referrer: request.headers.get("referer"),
    utm_source: url.searchParams.get("utm_source"),
    utm_medium: url.searchParams.get("utm_medium"),
    utm_campaign: url.searchParams.get("utm_campaign"),
    utm_content: url.searchParams.get("utm_content"),
    utm_term: url.searchParams.get("utm_term"),
    user_agent: request.headers.get("user-agent"),
    ip_hash: request.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
    clicked_url: finalUrl,
    estimated_commission: product.estimated_commission
  });

  return NextResponse.redirect(finalUrl, 302);
}