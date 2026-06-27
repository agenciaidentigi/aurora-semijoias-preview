import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Bell, Heart, Home, Lock, Package, RotateCcw, ShieldCheck, Ticket, UserRound } from "lucide-react";
import { revalidatePath } from "next/cache";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function updatePersonalData(formData: FormData) {
  "use server";
  const profile = await requireAuth({ roles: ["customer", "seller", "admin"], next: "/minha-conta" });
  const sql = getDb();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").trim();
  const birthDate = String(formData.get("birth_date") ?? "") || null;
  const acceptsOffers = formData.get("accepts_offers") === "on";

  await sql.unsafe("update profiles set full_name = $1, phone = $2, updated_by = $3 where id = $3", [fullName, phone, profile.id]);
  await sql.unsafe(
    `insert into customer_profiles (user_id, cpf, birth_date, accepts_offers, status)
     values ($1, $2, $3, $4, 'active')
     on conflict (user_id) do update set cpf = excluded.cpf, birth_date = excluded.birth_date, accepts_offers = excluded.accepts_offers, updated_at = now()`,
    [profile.id, cpf || null, birthDate, acceptsOffers]
  );
  await sql.unsafe("insert into audit_logs (actor_id, action, table_name, record_id) values ($1, 'update_profile', 'profiles', $1)", [profile.id]);
  revalidatePath("/minha-conta");
  redirect("/minha-conta?success=Dados atualizados");
}

async function addAddress(formData: FormData) {
  "use server";
  const profile = await requireAuth({ roles: ["customer", "seller", "admin"], next: "/minha-conta" });
  const sql = getDb();
  const values = [
    profile.id,
    String(formData.get("name") ?? "Principal"),
    String(formData.get("postal_code") ?? ""),
    String(formData.get("street") ?? ""),
    String(formData.get("number") ?? ""),
    String(formData.get("complement") ?? ""),
    String(formData.get("neighborhood") ?? ""),
    String(formData.get("city") ?? ""),
    String(formData.get("state") ?? ""),
    String(formData.get("reference_point") ?? ""),
    formData.get("is_primary") === "on"
  ];

  await sql.unsafe(
    `insert into addresses (user_id, name, postal_code, street, number, complement, neighborhood, city, state, reference_point, is_primary, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$1)`,
    values
  );
  await sql.unsafe("insert into audit_logs (actor_id, action, table_name) values ($1, 'create_address', 'addresses')", [profile.id]);
  revalidatePath("/minha-conta");
  redirect("/minha-conta?success=Endereco cadastrado");
}

async function getAccountData(userId: string) {
  const sql = getDb();
  const [customerRows, addressRows, orderRows, favoriteRows, couponRows, notificationRows] = await Promise.all([
    sql.unsafe("select * from customer_profiles where user_id = $1 limit 1", [userId]),
    sql.unsafe("select * from addresses where user_id = $1 order by is_primary desc, created_at desc", [userId]),
    sql.unsafe("select * from orders where customer_id = $1 order by created_at desc limit 5", [userId]),
    sql.unsafe(
      `select f.id, p.name, p.slug, p.current_price, p.main_image_url
       from favorites f join products p on p.id = f.product_id
       where f.user_id = $1 and f.status = 'active'
       order by f.created_at desc limit 8`,
      [userId]
    ),
    sql.unsafe("select * from coupons where is_active = true order by created_at desc limit 4"),
    sql.unsafe("select * from notifications where user_id = $1 order by created_at desc limit 6", [userId])
  ]);

  return {
    customer: customerRows[0] as unknown as { cpf?: string; birth_date?: string; accepts_offers?: boolean } | undefined,
    addresses: addressRows as unknown as Record<string, any>[],
    orders: orderRows as unknown as Record<string, any>[],
    favorites: favoriteRows as unknown as Record<string, any>[],
    coupons: couponRows as unknown as Record<string, any>[],
    notifications: notificationRows as unknown as Record<string, any>[]
  };
}

const statusLabels: Record<string, string> = {
  awaiting_payment: "Aguardando pagamento",
  payment_approved: "Pagamento aprovado",
  preparing: "Em preparacao",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  exchange_requested: "Troca solicitada",
  returned: "Devolvido"
};

const accountNavItems = [
  ["Visao geral", "#visao-geral", UserRound],
  ["Meus pedidos", "#pedidos", Package],
  ["Favoritos", "#favoritos", Heart],
  ["Enderecos", "#enderecos", Home],
  ["Dados pessoais", "#dados", ShieldCheck],
  ["Seguranca", "#seguranca", Lock]
] as const;

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ success?: string; welcome?: string }> }) {
  const [profile, params] = await Promise.all([requireAuth({ roles: ["customer", "seller", "admin"], next: "/minha-conta" }), searchParams]);
  const data = await getAccountData(profile.id);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <section className="grid gap-8 px-5 py-8 lg:grid-cols-[260px_1fr] lg:px-14">
        <aside className="h-max border border-line bg-white p-4">
          <p className="text-xs font-extrabold uppercase text-gold">Minha conta</p>
          <h1 className="mt-2 font-serif text-3xl">{profile.full_name ?? profile.email}</h1>
          <nav className="mt-5 grid gap-1 text-sm">
            {accountNavItems.map(([label, href, Icon]) => (
              <Link key={String(label)} href={String(href)} className="flex items-center gap-2 px-3 py-2 hover:bg-ivory">
                <Icon size={16} /> {String(label)}
              </Link>
            ))}
            <Link href="/seja-vendedor" className="mt-3 bg-ink px-3 py-3 text-center text-xs font-extrabold uppercase text-white">Quero vender</Link>
          </nav>
        </aside>

        <div className="grid gap-8">
          {params.success && <p className="border border-green-200 bg-green-50 p-3 text-sm text-green-700">{params.success}</p>}
          {params.welcome && <p className="border border-green-200 bg-green-50 p-3 text-sm text-green-700">Conta criada. Confira seus dados e complete seu perfil.</p>}

          <section id="visao-geral" className="grid gap-4 md:grid-cols-4">
            <Metric icon={<Package size={18} />} label="Pedidos" value={data.orders.length} />
            <Metric icon={<Heart size={18} />} label="Favoritos" value={data.favorites.length} />
            <Metric icon={<Ticket size={18} />} label="Cupons" value={data.coupons.length} />
            <Metric icon={<Bell size={18} />} label="Notificacoes" value={data.notifications.length} />
          </section>

          <section id="pedidos" className="border border-line bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-4xl">Meus pedidos</h2>
              <Link href="/#produtos" className="inline-flex items-center gap-2 border border-ink px-4 py-2 text-sm font-bold"><RotateCcw size={16} /> Comprar novamente</Link>
            </div>
            <div className="mt-5 grid gap-3">
              {data.orders.map((order) => (
                <article key={order.id} className="grid gap-2 border border-line p-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <strong>{order.order_number}</strong>
                    <p className="mt-1 text-sm text-neutral-600">{statusLabels[order.status] ?? order.status} | Pagamento: {order.payment_status} | Entrega: {order.delivery_status}</p>
                    {order.tracking_code && <p className="text-sm text-neutral-600">Rastreamento: {order.tracking_code}</p>}
                  </div>
                  <strong>{formatCurrency(order.total)}</strong>
                </article>
              ))}
              {!data.orders.length && <p className="text-sm text-neutral-500">Nenhum pedido ainda. Quando houver compra interna, ela aparecera aqui.</p>}
            </div>
          </section>

          <section id="favoritos" className="border border-line bg-white p-6">
            <h2 className="font-serif text-4xl">Favoritos</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {data.favorites.map((favorite) => (
                <article key={favorite.id} className="border border-line p-4">
                  <strong>{favorite.name}</strong>
                  <p className="mt-2 text-sm text-clay">{formatCurrency(favorite.current_price)}</p>
                  <div className="mt-4 flex gap-2 text-xs font-bold">
                    <Link href={`/r/${favorite.slug}`}>Abrir</Link>
                    <Link href={`/carrinho?produto=${favorite.slug}`}>Mover para carrinho</Link>
                  </div>
                </article>
              ))}
              {!data.favorites.length && <p className="text-sm text-neutral-500">Salve produtos para encontrar rapido depois.</p>}
            </div>
          </section>

          <section id="enderecos" className="grid gap-5 border border-line bg-white p-6">
            <h2 className="font-serif text-4xl">Enderecos</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {data.addresses.map((address) => (
                <article key={address.id} className="border border-line p-4 text-sm leading-6">
                  <strong>{address.name}{address.is_primary ? " | Principal" : ""}</strong>
                  <p>{address.street}, {address.number} {address.complement}</p>
                  <p>{address.neighborhood} - {address.city}/{address.state}</p>
                  <p>{address.postal_code}</p>
                </article>
              ))}
            </div>
            <form action={addAddress} className="grid gap-3 border-t border-line pt-5 md:grid-cols-3">
              <input name="name" className="border border-line p-3" placeholder="Nome do endereco" />
              <input name="postal_code" className="border border-line p-3" placeholder="CEP" />
              <input name="street" className="border border-line p-3" placeholder="Rua" />
              <input name="number" className="border border-line p-3" placeholder="Numero" />
              <input name="complement" className="border border-line p-3" placeholder="Complemento" />
              <input name="neighborhood" className="border border-line p-3" placeholder="Bairro" />
              <input name="city" className="border border-line p-3" placeholder="Cidade" />
              <input name="state" className="border border-line p-3" placeholder="Estado" />
              <input name="reference_point" className="border border-line p-3" placeholder="Ponto de referencia" />
              <label className="flex items-center gap-2 text-sm"><input name="is_primary" type="checkbox" /> Endereco principal</label>
              <button className="bg-ink px-4 py-3 text-sm font-bold text-white md:col-span-2">Cadastrar endereco</button>
            </form>
          </section>

          <section id="dados" className="border border-line bg-white p-6">
            <h2 className="font-serif text-4xl">Dados pessoais</h2>
            <form action={updatePersonalData} className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">Nome<input name="full_name" defaultValue={profile.full_name ?? ""} className="border border-line p-3 font-normal" /></label>
              <label className="grid gap-2 text-sm font-bold">Telefone<input name="phone" defaultValue={profile.phone ?? ""} className="border border-line p-3 font-normal" /></label>
              <label className="grid gap-2 text-sm font-bold">Data de nascimento<input name="birth_date" type="date" defaultValue={data.customer?.birth_date?.slice(0, 10) ?? ""} className="border border-line p-3 font-normal" /></label>
              <label className="grid gap-2 text-sm font-bold">CPF<input name="cpf" defaultValue={data.customer?.cpf ?? ""} className="border border-line p-3 font-normal" /></label>
              <label className="flex items-center gap-2 text-sm md:col-span-2"><input name="accepts_offers" type="checkbox" defaultChecked={Boolean(data.customer?.accepts_offers)} /> Receber ofertas por e-mail/WhatsApp</label>
              <p className="text-sm text-neutral-500 md:col-span-2">Para alterar e-mail, sera exigida confirmacao do novo endereco.</p>
              <button className="bg-ink px-5 py-3 text-sm font-extrabold uppercase text-white md:col-span-2">Salvar dados</button>
            </form>
          </section>

          <section id="seguranca" className="border border-line bg-white p-6">
            <h2 className="font-serif text-4xl">Seguranca</h2>
            <div className="mt-5 grid gap-3 text-sm text-neutral-600 md:grid-cols-3">
              <span className="border border-line p-4">Alteracao de senha via recuperacao segura.</span>
              <span className="border border-line p-4">Sessoes persistentes com cookie HTTP-only.</span>
              <span className="border border-line p-4">Autenticacao de dois fatores preparada para fase futura.</span>
            </div>
          </section>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="border border-line bg-white p-5">
      <div className="flex items-center gap-2 text-sm text-neutral-500">{icon}{label}</div>
      <strong className="mt-3 block font-serif text-4xl">{value}</strong>
    </div>
  );
}
