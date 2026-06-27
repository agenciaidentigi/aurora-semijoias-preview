import Link from "next/link";
import Image from "next/image";
import { getDb } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";

const fallbackProducts: Partial<Product>[] = [
  { name: "Anel solitario zirconia cristal", slug: "anel-solitario-zirconia-cristal", current_price: 89.9, badge: "Destaque", main_image_url: "https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=900&q=85" },
  { name: "Colar ponto de luz banho ouro 18k", slug: "colar-ponto-de-luz", current_price: 119.9, badge: "Lancamento", main_image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85" },
  { name: "Argola media acabamento polido", slug: "argola-media-acabamento-polido", current_price: 74.9, badge: "Mais clicado", main_image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85" },
  { name: "Pulseira riviera com zirconias", slug: "pulseira-riviera-zirconias", current_price: 139.9, badge: "Promocao", main_image_url: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85" }
];

async function getHomeData() {
  try {
    const sql = getDb();
    const [products, banners] = await Promise.all([
      sql("select * from products where status = 'published' order by display_order asc limit 8"),
      sql("select * from banners where is_active = true order by display_order asc limit 3")
    ]);
    return { products: (products.length ? products : fallbackProducts) as Partial<Product>[], banners };
  } catch {
    return { products: fallbackProducts, banners: [] };
  }
}

export default async function HomePage() {
  const { products } = await getHomeData();

  return (
    <main className="bg-paper text-ink">
      <div className="flex flex-wrap items-center justify-center gap-4 bg-ink px-5 py-2 text-sm text-white">
        <span>10% off em escolhas selecionadas | compra segura nos parceiros</span>
        <Link className="font-bold text-[#f2d9a2]" href="#produtos">Ver curadoria</Link>
      </div>

      <header className="sticky top-0 z-20 grid gap-4 border-b border-line bg-paper/95 px-5 py-5 backdrop-blur lg:grid-cols-[auto_1fr_auto] lg:px-14">
        <Link href="/" className="font-serif text-4xl uppercase">Aurora</Link>
        <nav className="flex gap-6 overflow-x-auto text-sm uppercase text-muted-foreground lg:justify-center">
          {["Aneis", "Brincos", "Colares", "Pulseiras", "Presentes"].map((item) => <a key={item} href="#produtos">{item}</a>)}
        </nav>
        <Link href="/admin" className="border border-ink px-4 py-2 text-center text-xs font-bold uppercase">Admin</Link>
      </header>

      <section className="relative flex min-h-[70vh] items-center overflow-hidden px-6 py-24 text-white lg:px-24">
        <Image src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1800&q=85" alt="Semijoias delicadas" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 to-ink/20" />
        <div className="relative max-w-2xl">
          <p className="mb-3 text-xs font-extrabold uppercase text-gold">Nova curadoria</p>
          <h1 className="font-serif text-5xl leading-none md:text-7xl">Semijoias para iluminar todos os dias</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/90">Pecas selecionadas em lojas parceiras, com rastreamento de cliques e links de afiliado protegidos por redirecionamento interno.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#produtos" className="bg-white px-6 py-4 text-xs font-extrabold uppercase text-ink">Comprar agora</a>
            <a href="#colecoes" className="border border-white px-6 py-4 text-xs font-extrabold uppercase">Colecoes</a>
          </div>
        </div>
      </section>

      <section id="colecoes" className="grid border-b border-line bg-white md:grid-cols-4">
        {["Aneis", "Brincos", "Colares", "Pulseiras"].map((category) => (
          <a href="#produtos" key={category} className="border-b border-line p-7 md:border-r">
            <span className="block font-serif text-3xl">{category}</span>
            <small className="mt-3 block text-neutral-500">Curadoria por estilo, ocasiao e acabamento</small>
          </a>
        ))}
      </section>

      <section id="produtos" className="px-5 py-14 lg:px-14">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-xs font-extrabold uppercase text-gold">Mais buscadas</p>
          <h2 className="font-serif text-4xl md:text-6xl">Selecao com links de afiliados</h2>
          <p className="mt-4 leading-7 text-neutral-600">Todos os botoes usam a rota interna /r/[slug] para registrar cliques antes de enviar para a loja parceira.</p>
        </div>
        <div className="grid gap-px md:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <article key={product.slug} className="bg-white">
              <div className="relative aspect-[4/5] bg-ivory">
                {product.main_image_url && <Image src={product.main_image_url} alt={product.name ?? "Produto"} fill className="object-cover" />}
              </div>
              <div className="grid gap-3 p-5">
                <span className="text-xs font-bold uppercase text-neutral-500">{product.badge ?? "Semijoia"}</span>
                <h3 className="min-h-14 font-serif text-2xl">{product.name}</h3>
                <strong className="text-clay">{formatCurrency(product.current_price)}</strong>
                <Link href={`/r/${product.slug}`} className="bg-ink px-4 py-3 text-center text-xs font-extrabold uppercase text-white">Comprar no parceiro</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
