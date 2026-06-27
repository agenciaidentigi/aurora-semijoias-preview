import Image from "next/image";
import { notFound } from "next/navigation";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicHeader } from "@/components/site/PublicHeader";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function InstitutionalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sql = getDb();
  const rows = await sql.unsafe("select * from pages where slug = $1 and status = 'published' limit 1", [slug]);
  const page = rows[0] as unknown as Record<string, any> | undefined;
  if (!page) notFound();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <article className="mx-auto max-w-4xl px-5 py-12 lg:px-14">
        {page.image_url && (
          <div className="relative mb-8 aspect-[16/7] overflow-hidden bg-ivory">
            <Image src={page.image_url} alt={page.title} fill className="object-cover" />
          </div>
        )}
        <p className="text-xs font-extrabold uppercase text-gold">Institucional</p>
        <h1 className="mt-3 font-serif text-6xl leading-none">{page.title}</h1>
        <div className="mt-8 whitespace-pre-line text-lg leading-8 text-neutral-700">{page.body}</div>
      </article>
      <PublicFooter />
    </main>
  );
}
