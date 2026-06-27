import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicHeader } from "@/components/site/PublicHeader";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function submitSellerApplication(formData: FormData) {
  "use server";
  const profile = await requireAuth({ roles: ["customer", "seller", "admin"], next: "/seja-vendedor" });
  const acceptedTerms = formData.get("accepted_terms") === "on";
  if (!acceptedTerms) redirect("/seja-vendedor?error=Aceite os termos para vendedores.");

  const storeName = String(formData.get("store_name") ?? "").trim();
  const responsibleName = String(formData.get("responsible_name") ?? "").trim();
  if (!storeName || !responsibleName) redirect("/seja-vendedor?error=Informe o nome da loja e do responsavel.");

  const sql = getDb();
  const values = [
    profile.id,
    storeName,
    responsibleName,
    String(formData.get("document") ?? ""),
    String(formData.get("commercial_email") ?? ""),
    String(formData.get("phone") ?? ""),
    String(formData.get("whatsapp") ?? ""),
    String(formData.get("address") ?? ""),
    String(formData.get("description") ?? ""),
    String(formData.get("instagram") ?? ""),
    String(formData.get("website") ?? ""),
    String(formData.get("logo_url") ?? ""),
    String(formData.get("document_url") ?? ""),
    String(formData.get("product_type") ?? "")
  ];

  await sql.unsafe(
    `insert into seller_applications (
      user_id, store_name, responsible_name, document, commercial_email, phone, whatsapp, address,
      description, instagram, website, logo_url, document_url, product_type, accepted_terms_at, status, created_by
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now(),'pending',$1)`,
    values
  );
  await sql.unsafe(
    `insert into seller_profiles (user_id, status, created_by)
     values ($1, 'pending', $1)
     on conflict (user_id) do update set status = 'pending', updated_at = now()`,
    [profile.id]
  );
  await sql.unsafe("insert into user_roles (user_id, role, status) values ($1, 'seller', 'active') on conflict (user_id, role) do update set status = 'active'", [profile.id]);
  await sql.unsafe("insert into notifications (user_id, title, message, type) values ($1, 'Solicitacao enviada', 'Sua solicitacao para vender esta em analise.', 'info')", [profile.id]);
  await sql.unsafe("insert into audit_logs (actor_id, action, table_name) values ($1, 'seller_application_submitted', 'seller_applications')", [profile.id]);

  revalidatePath("/minha-conta");
  redirect("/vendedor?application=pending");
}

async function getApplication(userId: string) {
  const sql = getDb();
  const rows = await sql.unsafe("select status::text as status, rejection_reason from seller_applications where user_id = $1 order by created_at desc limit 1", [userId]);
  return rows[0] as unknown as { status?: string; rejection_reason?: string | null } | undefined;
}

export default async function SellerApplicationPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [profile, params] = await Promise.all([requireAuth({ roles: ["customer", "seller", "admin"], next: "/seja-vendedor" }), searchParams]);
  const application = await getApplication(profile.id);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-14">
        <div>
          <p className="text-xs font-extrabold uppercase text-gold">Quero vender</p>
          <h1 className="mt-3 font-serif text-6xl leading-none">Venda semijoias na Aurora</h1>
          <p className="mt-5 text-lg leading-8 text-neutral-600">Envie sua loja para analise. Enquanto o status estiver em avaliacao, voce vera uma mensagem de acompanhamento no painel do vendedor.</p>
          {application?.status && (
            <div className="mt-6 border border-line bg-white p-5">
              <strong>Status atual: {application.status}</strong>
              {application.rejection_reason && <p className="mt-2 text-sm text-red-700">Motivo: {application.rejection_reason}</p>}
              <Link href="/vendedor" className="mt-4 inline-block border border-ink px-4 py-2 text-sm font-bold">Ver painel</Link>
            </div>
          )}
        </div>

        <form action={submitSellerApplication} className="grid gap-4 border border-line bg-white p-6">
          {params.error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{params.error}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">Nome da loja<input name="store_name" className="border border-line p-3 font-normal" required /></label>
            <label className="grid gap-2 text-sm font-bold">Nome do responsavel<input name="responsible_name" defaultValue={profile.full_name ?? ""} className="border border-line p-3 font-normal" required /></label>
            <label className="grid gap-2 text-sm font-bold">CPF ou CNPJ<input name="document" className="border border-line p-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">E-mail comercial<input name="commercial_email" type="email" defaultValue={profile.email} className="border border-line p-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">Telefone<input name="phone" defaultValue={profile.phone ?? ""} className="border border-line p-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">WhatsApp<input name="whatsapp" className="border border-line p-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">Endereco<input name="address" className="border border-line p-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">Descricao da loja<textarea name="description" className="min-h-28 border border-line p-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">Instagram<input name="instagram" className="border border-line p-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">Site<input name="website" className="border border-line p-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">Logotipo URL<input name="logo_url" type="url" className="border border-line p-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">Documento URL opcional<input name="document_url" type="url" className="border border-line p-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">Tipo de produto vendido<input name="product_type" className="border border-line p-3 font-normal" placeholder="Semijoias, acessorios, prata, folheados..." /></label>
          </div>
          <label className="flex gap-3 text-sm leading-6"><input className="mt-1 h-4 w-4" name="accepted_terms" type="checkbox" required /> Aceito os termos para vendedores.</label>
          <button className="bg-ink px-5 py-4 text-sm font-extrabold uppercase text-white">Enviar solicitacao</button>
          <input type="hidden" name="store_slug_preview" value={slugify(profile.full_name ?? "loja")} />
        </form>
      </section>
      <PublicFooter />
    </main>
  );
}
