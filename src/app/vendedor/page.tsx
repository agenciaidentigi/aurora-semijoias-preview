import Link from "next/link";
import { BarChart3, Boxes, Building2, ClipboardList, CreditCard, HandCoins, Link2, MessageSquare, PackageCheck, Settings, ShoppingBag, Star, Ticket, Users } from "lucide-react";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { getSellerStatusForUser, requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { requestPayout, saveSellerProduct, saveStore } from "@/app/vendedor/actions";

export const dynamic = "force-dynamic";

async function getSellerData(userId: string) {
  const sql = getDb();
  const [storeRows, productRows, orderRows, clickRows, commissionRows, payoutRows] = await Promise.all([
    sql.unsafe("select * from stores where seller_id = $1 order by created_at asc limit 1", [userId]),
    sql.unsafe("select * from products where seller_id = $1 order by created_at desc limit 10", [userId]),
    sql.unsafe("select * from orders where seller_id = $1 order by created_at desc limit 8", [userId]),
    sql.unsafe("select count(*)::int as total from affiliate_clicks where seller_id = $1", [userId]),
    sql.unsafe(
      `select
        coalesce(sum(commission_amount) filter (where status = 'pending'), 0)::numeric as pending,
        coalesce(sum(commission_amount) filter (where status = 'available'), 0)::numeric as available,
        coalesce(sum(commission_amount) filter (where status = 'paid'), 0)::numeric as paid
       from commissions where seller_id = $1`,
      [userId]
    ),
    sql.unsafe("select * from payout_requests where seller_id = $1 order by created_at desc limit 5", [userId])
  ]);

  const products = productRows as unknown as Record<string, any>[];
  const orders = orderRows as unknown as Record<string, any>[];
  const commissions = commissionRows[0] as unknown as { pending: string; available: string; paid: string };

  return {
    store: storeRows[0] as unknown as Record<string, any> | undefined,
    products,
    orders,
    clicks: Number((clickRows[0] as unknown as { total: number }).total ?? 0),
    commissions,
    payouts: payoutRows as unknown as Record<string, any>[],
    metrics: {
      totalProducts: products.length,
      publishedProducts: products.filter((product) => product.status === "published").length,
      pendingProducts: products.filter((product) => product.status === "pending_review").length,
      totalSales: orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0),
      totalOrders: orders.length,
      averageTicket: orders.length ? orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0) / orders.length : 0
    }
  };
}

const menuItems = [
  ["Visao geral", "#visao-geral", BarChart3],
  ["Minha loja", "#loja", Building2],
  ["Produtos", "#produtos", Boxes],
  ["Pedidos", "#pedidos", ClipboardList],
  ["Links de afiliado", "#afiliados", Link2],
  ["Clientes", "#clientes", Users],
  ["Cupons", "#cupons", Ticket],
  ["Comissoes", "#comissoes", HandCoins],
  ["Saques", "#saques", CreditCard],
  ["Relatorios", "#relatorios", BarChart3],
  ["Avaliacoes", "#avaliacoes", Star],
  ["Configuracoes", "#configuracoes", Settings],
  ["Suporte", "#suporte", MessageSquare]
] as const;

export default async function SellerDashboard({ searchParams }: { searchParams: Promise<{ success?: string; error?: string; pending?: string; application?: string }> }) {
  const [profile, params] = await Promise.all([requireAuth({ roles: ["seller", "admin"], next: "/vendedor" }), searchParams]);
  const status = await getSellerStatusForUser(profile.id);

  if (status !== "approved") {
    return (
      <main className="min-h-screen bg-paper text-ink">
        <PublicHeader />
        <section className="mx-auto max-w-3xl px-5 py-16 text-center lg:px-14">
          <p className="text-xs font-extrabold uppercase text-gold">Painel do vendedor</p>
          <h1 className="mt-3 font-serif text-5xl">Sua solicitacao esta sendo analisada.</h1>
          <p className="mt-5 leading-7 text-neutral-600">Assim que o administrador aprovar sua loja, o painel completo de produtos, pedidos, comissoes e saques sera liberado.</p>
          {status === "rejected" && <p className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700">Sua solicitacao foi recusada. Consulte o motivo em Minha conta ou envie uma nova solicitacao.</p>}
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/minha-conta" className="border border-ink px-5 py-3 text-sm font-bold">Minha conta</Link>
            <Link href="/seja-vendedor" className="bg-ink px-5 py-3 text-sm font-bold text-white">Atualizar solicitacao</Link>
          </div>
        </section>
        <PublicFooter />
      </main>
    );
  }

  const data = await getSellerData(profile.id);
  const store = data.store;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <section className="grid gap-8 px-5 py-8 lg:grid-cols-[280px_1fr] lg:px-14">
        <aside className="h-max border border-line bg-white p-4">
          <p className="text-xs font-extrabold uppercase text-gold">Painel do vendedor</p>
          <h1 className="mt-2 font-serif text-3xl">{store?.name ?? "Minha loja"}</h1>
          <nav className="mt-5 grid gap-1 text-sm">
            {menuItems.map(([label, href, Icon]) => (
              <Link key={label} href={href} className="flex items-center gap-2 px-3 py-2 hover:bg-ivory">
                <Icon size={16} /> {label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="grid gap-8">
          {params.success && <p className="border border-green-200 bg-green-50 p-3 text-sm text-green-700">{params.success}</p>}
          {params.error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{params.error}</p>}

          <section id="visao-geral" className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <Metric label="Total de produtos" value={data.metrics.totalProducts} />
            <Metric label="Publicados" value={data.metrics.publishedProducts} />
            <Metric label="Aguardando aprovacao" value={data.metrics.pendingProducts} />
            <Metric label="Pedidos" value={data.metrics.totalOrders} />
            <Metric label="Cliques" value={data.clicks} />
            <Metric label="Total de vendas" value={formatCurrency(data.metrics.totalSales)} />
            <Metric label="Ticket medio" value={formatCurrency(data.metrics.averageTicket)} />
            <Metric label="Comissao pendente" value={formatCurrency(Number(data.commissions.pending))} />
            <Metric label="Saldo disponivel" value={formatCurrency(Number(data.commissions.available))} />
            <Metric label="Comissao paga" value={formatCurrency(Number(data.commissions.paid))} />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="border border-line bg-white p-6">
              <h2 className="font-serif text-4xl">Grafico de vendas</h2>
              <div className="mt-5 flex h-48 items-end gap-2 border-b border-line">
                {[30, 70, 45, 95, 55, 120, 84].map((height, index) => <span key={index} className="flex-1 bg-clay" style={{ height }} />)}
              </div>
            </div>
            <div className="border border-line bg-white p-6">
              <h2 className="font-serif text-4xl">Grafico de cliques</h2>
              <div className="mt-5 flex h-48 items-end gap-2 border-b border-line">
                {[80, 42, 110, 60, 90, 48, 130].map((height, index) => <span key={index} className="flex-1 bg-moss" style={{ height }} />)}
              </div>
            </div>
          </section>

          <section id="loja" className="border border-line bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-serif text-4xl">Minha loja</h2>
              {store?.slug && <Link href={`/loja/${store.slug}`} className="border border-ink px-4 py-2 text-sm font-bold">Abrir loja publica</Link>}
            </div>
            <form action={saveStore} className="mt-5 grid gap-4 md:grid-cols-2">
              <input name="name" defaultValue={store?.name ?? ""} className="border border-line p-3" placeholder="Nome da loja" />
              <input name="slug" defaultValue={store?.slug ?? ""} className="border border-line p-3" placeholder="Slug da loja" />
              <input name="logo_url" defaultValue={store?.logo_url ?? ""} className="border border-line p-3" placeholder="Logotipo URL" />
              <input name="cover_image_url" defaultValue={store?.cover_image_url ?? ""} className="border border-line p-3" placeholder="Imagem de capa URL" />
              <input name="whatsapp" defaultValue={store?.whatsapp ?? ""} className="border border-line p-3" placeholder="WhatsApp" />
              <input name="email" defaultValue={store?.email ?? ""} className="border border-line p-3" placeholder="E-mail" />
              <input name="instagram" className="border border-line p-3" placeholder="Instagram" />
              <input name="facebook" className="border border-line p-3" placeholder="Facebook" />
              <textarea name="description" defaultValue={store?.description ?? ""} className="min-h-24 border border-line p-3 md:col-span-2" placeholder="Descricao" />
              <textarea name="delivery_policy" defaultValue={store?.delivery_policy ?? ""} className="min-h-20 border border-line p-3" placeholder="Politica de entrega" />
              <textarea name="exchange_policy" defaultValue={store?.exchange_policy ?? ""} className="min-h-20 border border-line p-3" placeholder="Politica de troca" />
              <input name="preparation_time" defaultValue={store?.preparation_time ?? ""} className="border border-line p-3" placeholder="Prazo de preparacao" />
              <input name="institutional_info" defaultValue={store?.institutional_info ?? ""} className="border border-line p-3" placeholder="Informacoes institucionais" />
              <button className="bg-ink px-5 py-3 text-sm font-bold text-white md:col-span-2">Salvar loja</button>
            </form>
          </section>

          <section id="produtos" className="border border-line bg-white p-6">
            <h2 className="font-serif text-4xl">Produtos</h2>
            <form action={saveSellerProduct} className="mt-5 grid gap-3 md:grid-cols-3">
              <input name="name" className="border border-line p-3" placeholder="Nome do produto" />
              <input name="slug" className="border border-line p-3" placeholder="Slug" />
              <input name="sku" className="border border-line p-3" placeholder="SKU" />
              <input name="current_price" type="number" step="0.01" className="border border-line p-3" placeholder="Preco" />
              <input name="old_price" type="number" step="0.01" className="border border-line p-3" placeholder="Preco promocional anterior" />
              <input name="stock_quantity" type="number" className="border border-line p-3" placeholder="Estoque" />
              <select name="sale_type" className="border border-line p-3"><option value="affiliate">Venda externa ou afiliada</option><option value="internal">Venda interna</option></select>
              <input name="main_image_url" className="border border-line p-3" placeholder="Imagem principal URL" />
              <input name="affiliate_url" className="border border-line p-3" placeholder="Link de afiliado" />
              <textarea name="short_description" className="min-h-20 border border-line p-3 md:col-span-3" placeholder="Descricao curta" />
              <textarea name="description" className="min-h-24 border border-line p-3 md:col-span-3" placeholder="Descricao completa" />
              <button className="bg-ink px-5 py-3 text-sm font-bold text-white md:col-span-3">Enviar produto para aprovacao</button>
            </form>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-ivory text-xs uppercase text-neutral-500"><tr><th className="p-3">Produto</th><th className="p-3">Status</th><th className="p-3">Tipo</th><th className="p-3">Preco</th><th className="p-3">Cliques/Vendas</th></tr></thead>
                <tbody>
                  {data.products.map((product) => (
                    <tr key={product.id} className="border-t border-line"><td className="p-3">{product.name}</td><td className="p-3">{product.status}</td><td className="p-3">{product.sale_type}</td><td className="p-3">{formatCurrency(product.current_price)}</td><td className="p-3">0 / 0</td></tr>
                  ))}
                  {!data.products.length && <tr><td colSpan={5} className="p-5 text-center text-neutral-500">Nenhum produto cadastrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section id="pedidos" className="border border-line bg-white p-6">
            <h2 className="font-serif text-4xl">Ultimos pedidos</h2>
            <div className="mt-5 grid gap-3">
              {data.orders.map((order) => <div key={order.id} className="flex justify-between border border-line p-4 text-sm"><span>{order.order_number} | {order.status}</span><strong>{formatCurrency(order.total)}</strong></div>)}
              {!data.orders.length && <p className="text-sm text-neutral-500">Pedidos internos relacionados aos seus produtos aparecerao aqui.</p>}
            </div>
          </section>

          <section id="comissoes" className="grid gap-4 md:grid-cols-3">
            <Metric label="Pendente" value={formatCurrency(Number(data.commissions.pending))} />
            <Metric label="Disponivel" value={formatCurrency(Number(data.commissions.available))} />
            <Metric label="Paga" value={formatCurrency(Number(data.commissions.paid))} />
          </section>

          <section id="saques" className="border border-line bg-white p-6">
            <h2 className="font-serif text-4xl">Saques</h2>
            <form action={requestPayout} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input name="amount" type="number" step="0.01" className="border border-line p-3" placeholder="Valor" />
              <input name="pix_key" className="border border-line p-3" placeholder="Chave Pix" />
              <button className="bg-ink px-5 py-3 text-sm font-bold text-white">Solicitar</button>
            </form>
            <div className="mt-5 grid gap-2 text-sm">
              {data.payouts.map((payout) => <div key={payout.id} className="flex justify-between border border-line p-3"><span>{payout.status}</span><strong>{formatCurrency(payout.amount)}</strong></div>)}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              ["afiliados", "Links de afiliado", "Produtos externos registram cliques, origem, campanha e destino."],
              ["clientes", "Clientes", "Clientes dos pedidos internos serao exibidos conforme privacidade e permissao."],
              ["cupons", "Cupons", "Cupons por loja estao na estrutura e podem ser gerenciados pelo admin."],
              ["relatorios", "Relatorios", "Resumo de vendas, cliques e comissoes por periodo."],
              ["avaliacoes", "Avaliacoes", "Espaco preparado para reviews e reputacao da loja."],
              ["configuracoes", "Configuracoes", "Preferencias da loja e limites definidos pelo administrador."],
              ["suporte", "Suporte", "Canal para solicitar ajuda operacional."]
            ].map(([id, title, text]) => (
              <article id={id} key={id} className="border border-line bg-white p-5">
                <h2 className="font-serif text-3xl">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{text}</p>
              </article>
            ))}
          </section>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-line bg-white p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <strong className="mt-3 block font-serif text-3xl">{value}</strong>
    </div>
  );
}
