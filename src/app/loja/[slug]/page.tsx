import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicHeader } from "@/components/site/PublicHeader";
import { getDb } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sql = getDb();
  const storeRows = await sql.unsafe("select * from stores where slug = $1 and status = 'active' limit 1", [slug]);
  const store = storeRows[0] as unknown as Record<string, any> | undefined;
  if (!store) notFound();

  const products = (await sql.unsafe(
    "select * from products where store_id = $1 and status = 'published' order by display_order asc, created_at desc limit 24",
    [store.id]
  )) as unknown as Record<string, any>[];

  return (
    <main className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <section className="relative min-h-[42vh] overflow-hidden px-5 py-16 text-white lg:px-14">
        {store.cover_image_url ? <Image src={store.cover_image_url} alt={store.name} fill priority className="object-cover" /> : <div className="absolute inset-0 bg-ink" />}
        <div className="absolute inset-0 bg-ink/65" />
        <div className="relative flex max-w-5xl flex-col gap-5">
          {store.logo_url && <Image src={store.logo_url} alt={`Logotipo ${store.name}`} width={96} height={96} className="h-24 w-24 bg-white object-contain p-2" />}
          <div>
            <p className="text-xs font-extrabold uppercase text-gold">Loja parceira</p>
            <h1 className="mt-2 font-serif text-6xl leading-none">{store.name}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/85">{store.description}</p>
            <p className="mt-3 text-sm text-white/75">Avaliacao: {Number(store.rating ?? 0).toFixed(1)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 px-5 py-12 lg:grid-cols-[1fr_320px] lg:px-14">
        <div>
          <div className="mb-6">
            <p className="text-xs font-extrabold uppercase text-gold">Produtos</p>
            <h2 className="font-serif text-5xl">Vitrine da loja</h2>
          </div>
          <div className="grid gap-px md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article key={product.id} className="bg-white">
                <div className="relative aspect-[4/5] bg-ivory">
                  {product.main_image_url && <Image src={product.main_image_url} alt={product.name} fill className="object-cover" />}
                </div>
                <div className="grid gap-3 p-5">
                  <span className="text-xs font-bold uppercase text-neutral-500">{product.sale_type === "internal" ? "Venda interna" : "Afiliado"}</span>
                  <h3 className="font-serif text-2xl">{product.name}</h3>
                  <strong className="text-clay">{formatCurrency(Number(product.current_price))}</strong>
                  <Link href={product.sale_type === "internal" ? `/carrinho?produto=${product.slug}` : `/r/${product.slug}`} className="bg-ink px-4 py-3 text-center text-xs font-extrabold uppercase text-white">
                    {product.sale_type === "internal" ? "Adicionar ao carrinho" : "Comprar na loja parceira"}
                  </Link>
                </div>
              </article>
            ))}
            {!products.length && <p className="text-sm text-neutral-500">Esta loja ainda nao possui produtos publicados.</p>}
          </div>
        </div>

        <aside className="h-max border border-line bg-white p-6">
          <h2 className="font-serif text-3xl">Informacoes</h2>
          <div className="mt-5 grid gap-4 text-sm leading-6 text-neutral-600">
            {store.whatsapp && <p><strong className="text-ink">WhatsApp:</strong> {store.whatsapp}</p>}
            {store.email && <p><strong className="text-ink">E-mail:</strong> {store.email}</p>}
            {store.preparation_time && <p><strong className="text-ink">Prazo:</strong> {store.preparation_time}</p>}
            {store.delivery_policy && <p><strong className="text-ink">Entrega:</strong><br />{store.delivery_policy}</p>}
            {store.exchange_policy && <p><strong className="text-ink">Trocas:</strong><br />{store.exchange_policy}</p>}
            {store.institutional_info && <p><strong className="text-ink">Institucional:</strong><br />{store.institutional_info}</p>}
          </div>
        </aside>
      </section>
      <PublicFooter />
    </main>
  );
}
