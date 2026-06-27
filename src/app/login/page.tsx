import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { setAdminSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

async function signIn(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const sql = getDb();
  const rows = await sql(
    "select id, email, full_name, role, is_active, password_hash from profiles where lower(email) = lower($1) and is_active = true limit 1",
    [email]
  );
  const profile = rows[0] as (Profile & { password_hash: string | null }) | undefined;

  if (!profile || !verifyPassword(password, profile.password_hash)) {
    redirect(`/login?error=${encodeURIComponent("E-mail ou senha invalidos.")}&next=${encodeURIComponent(next)}`);
  }

  await setAdminSession(profile);
  redirect(next);
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-ink p-6 text-ink">
      <form action={signIn} className="grid w-full max-w-md gap-5 bg-paper p-8 shadow-2xl">
        <div>
          <p className="text-xs font-bold uppercase text-gold">Painel protegido</p>
          <h1 className="mt-2 font-serif text-4xl">Entrar no admin</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">Acesso permitido apenas para administradores, editores e analistas cadastrados.</p>
        </div>
        {params.error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{params.error}</p>}
        <input type="hidden" name="next" value={params.next ?? "/admin"} />
        <label className="grid gap-2 text-sm font-bold">E-mail<input className="border border-line bg-white p-3 font-normal" name="email" type="email" required /></label>
        <label className="grid gap-2 text-sm font-bold">Senha<input className="border border-line bg-white p-3 font-normal" name="password" type="password" required /></label>
        <button className="bg-ink px-5 py-3 text-sm font-extrabold uppercase text-white">Entrar</button>
      </form>
    </main>
  );
}
