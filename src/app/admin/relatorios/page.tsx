import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requireAdmin(["admin", "analyst"]);
  const params = await searchParams;
  const sql = getDb();
  const filters: string[] = [];
  const values: string[] = [];

  if (params.from) {
    values.push(params.from);
    filters.push(`c.clicked_at >= $${values.length}`);
  }
  if (params.to) {
    values.push(params.to);
    filters.push(`c.clicked_at <= $${values.length}`);
  }

  const where = filters.length ? `where ${filters.join(" and ")}` : "";
  const clicks = await sql.unsafe(
    `select c.*, p.name as product_name, p.slug as product_slug, ap.name as partner_name, ap.commission_rate
     from affiliate_clicks c
     left join products p on p.id = c.product_id
     left join affiliate_partners ap on ap.id = c.affiliate_partner_id
     ${where}
     order by c.clicked_at desc
     limit 500`,
    values
  );
  const total = clicks?.length ?? 0;
  const estimated = (clicks ?? []).reduce((sum: number, row: any) => sum + Number(row.estimated_commission ?? 0), 0);
  const byProduct = Object.entries((clicks ?? []).reduce((acc: Record<string, number>, row: any) => { const key = row.product_name ?? "Sem produto"; acc[key] = (acc[key] ?? 0) + 1; return acc; }, {})).sort((a: any, b: any) => b[1] - a[1]);

  return (
    <div className="grid gap-6">
      <div><p className="text-xs font-bold uppercase text-gold">Relatorios</p><h2 className="font-serif text-4xl">Cliques e comissoes</h2></div>
      <form className="flex flex-wrap gap-3 border border-line bg-white p-4">
        <input name="from" type="date" defaultValue={params.from} className="border border-line px-3 py-2" />
        <input name="to" type="date" defaultValue={params.to} className="border border-line px-3 py-2" />
        <button className="bg-ink px-5 py-2 font-bold text-white">Filtrar</button>
      </form>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="border border-line bg-white p-5"><p>Total de cliques</p><strong className="font-serif text-4xl">{total}</strong></div>
        <div className="border border-line bg-white p-5"><p>Comissao estimada</p><strong className="font-serif text-4xl">R$ {estimated.toFixed(2)}</strong></div>
        <div className="border border-line bg-white p-5"><p>Produtos clicados</p><strong className="font-serif text-4xl">{byProduct.length}</strong></div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-line bg-white p-5"><h3 className="font-serif text-2xl">Produtos mais clicados</h3><ul className="mt-4 grid gap-2">{byProduct.slice(0, 10).map(([name, count]) => <li key={name} className="flex justify-between border-b border-line py-2"><span>{name}</span><strong>{count}</strong></li>)}</ul></section>
        <section className="border border-line bg-white p-5"><h3 className="font-serif text-2xl">Ultimos cliques</h3><div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><tbody>{(clicks ?? []).slice(0, 20).map((click: any) => <tr key={click.id} className="border-b border-line"><td className="py-2">{click.product_name ?? "Produto"}</td><td>{click.partner_name ?? "Parceiro"}</td><td>{new Date(click.clicked_at).toLocaleString("pt-BR")}</td></tr>)}</tbody></table></div></section>
      </div>
    </div>
  );
}
