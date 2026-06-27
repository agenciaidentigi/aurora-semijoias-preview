import Link from "next/link";
import { getDb } from "@/lib/db";
import { adminModules } from "@/lib/admin-modules";

export const dynamic = "force-dynamic";

async function getMetrics() {
  const sql = getDb();
  const [products, clicks, leads, partners] = await Promise.all([
    sql.unsafe("select count(*)::int as total from products"),
    sql.unsafe("select count(*)::int as total from affiliate_clicks"),
    sql.unsafe("select count(*)::int as total from leads"),
    sql.unsafe("select count(*)::int as total from affiliate_partners")
  ]);
  return [
    ["Produtos", products[0]?.total ?? 0],
    ["Cliques", clicks[0]?.total ?? 0],
    ["Leads", leads[0]?.total ?? 0],
    ["Parceiros", partners[0]?.total ?? 0]
  ];
}

export default async function AdminDashboard() {
  const metrics = await getMetrics();
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="border border-line bg-white p-5">
            <p className="text-sm text-neutral-500">{label}</p>
            <strong className="mt-3 block font-serif text-4xl">{value}</strong>
          </div>
        ))}
      </section>
      <section className="border border-line bg-white p-6">
        <p className="text-xs font-bold uppercase text-gold">Fluxo operacional</p>
        <h2 className="mt-2 font-serif text-4xl">Gestao completa da vitrine afiliada</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {adminModules.map((module) => (
            <Link key={module.key} href={`/admin/${module.key}`} className="border border-line p-4 hover:border-ink">
              <strong>{module.title}</strong>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{module.description}</p>
            </Link>
          ))}
          <Link href="/admin/relatorios" className="border border-line p-4 hover:border-ink"><strong>Relatorios de cliques</strong><p className="mt-2 text-sm leading-6 text-neutral-600">Analise produtos, parceiros, origem, campanhas UTM e comissao estimada.</p></Link>
        </div>
      </section>
    </div>
  );
}
