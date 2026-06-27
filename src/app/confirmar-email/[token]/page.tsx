import Link from "next/link";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ConfirmEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sql = getDb();
  const rows = await sql.unsafe(
    `update profiles
     set email_verified_at = now(), email_verification_token = null
     where email_verification_token = $1
     returning email`,
    [token]
  );
  const confirmed = rows.length > 0;

  return (
    <main className="grid min-h-screen place-items-center bg-paper p-6 text-ink">
      <section className="max-w-md border border-line bg-white p-8 text-center">
        <p className="text-xs font-extrabold uppercase text-gold">Confirmacao de e-mail</p>
        <h1 className="mt-3 font-serif text-4xl">{confirmed ? "E-mail confirmado" : "Link invalido"}</h1>
        <p className="mt-4 leading-7 text-neutral-600">
          {confirmed ? "Seu e-mail foi confirmado com sucesso." : "O link de confirmacao expirou ou ja foi utilizado."}
        </p>
        <Link href="/login" className="mt-6 inline-block bg-ink px-5 py-3 text-sm font-bold uppercase text-white">Entrar</Link>
      </section>
    </main>
  );
}
