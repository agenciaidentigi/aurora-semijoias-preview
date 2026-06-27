import Link from "next/link";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicHeader } from "@/components/site/PublicHeader";
import { getDb } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CartPage({ searchParams }: { searchParams: Promise<{ produto?: string }> }) {
  const params = await searchParams;
  let product: Record<string, any> | null = null;

  if (params.produto) {
    const sql = getDb();
    const rows = await sql.unsafe("select * from products where slug = $1 limit 1", [params.produto]);
    product = (rows[0] as unknown as Record<string, any> | undefined) ?? null;
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <section className="mx-auto max-w-4xl px-5 py-14 lg:px-14">
        <p className="text-xs font-extrabold uppercase text-gold">Venda interna</p>
        <h1 className="mt-3 font-serif text-6xl leading-none">Carrinho</h1>
        <div className="mt-8 border border-line bg-white p-6">
          {product ? (
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div>
                <h2 className="font-serif text-3xl">{product.name}</h2>
                <p className="mt-2 text-sm text-neutral-600">{product.short_description}</p>
                <p className="mt-3 text-sm text-neutral-500">Fluxo preparado para checkout, pagamento, pedido, comissao, repasse e entrega.</p>
              </div>
              <strong className="text-2xl text-clay">{formatCurrency(Number(product.current_price))}</strong>
            </div>
          ) : (
            <p className="text-neutral-600">Seu carrinho esta vazio.</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/#produtos" className="border border-ink px-5 py-3 text-sm font-bold">Continuar comprando</Link>
            <button className="bg-ink px-5 py-3 text-sm font-bold text-white" disabled>Finalizar compra em breve</button>
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
