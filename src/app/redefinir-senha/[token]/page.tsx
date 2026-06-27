import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

async function resetPassword(token: string, formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("password_confirmation") ?? "");

  if (password.length < 8 || password !== confirmation) {
    redirect(`/redefinir-senha/${token}?error=${encodeURIComponent("Confira a senha e a confirmacao.")}`);
  }

  const sql = getDb();
  const rows = await sql.unsafe(
    `update profiles
     set password_hash = $1, password_reset_token = null, password_reset_expires_at = null
     where password_reset_token = $2 and password_reset_expires_at > now()
     returning id`,
    [hashPassword(password), token]
  );

  if (!rows.length) {
    redirect(`/redefinir-senha/${token}?error=${encodeURIComponent("Link expirado ou invalido.")}`);
  }

  redirect(`/login?reset=${encodeURIComponent("Senha atualizada. Entre com sua nova senha.")}`);
}

export default async function ResetPasswordPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const query = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-paper p-6 text-ink">
      <form action={resetPassword.bind(null, token)} className="grid w-full max-w-md gap-5 border border-line bg-white p-8">
        <div>
          <p className="text-xs font-extrabold uppercase text-gold">Seguranca</p>
          <h1 className="mt-2 font-serif text-4xl">Redefinir senha</h1>
        </div>
        {query.error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{query.error}</p>}
        <label className="grid gap-2 text-sm font-bold">Nova senha<input className="border border-line p-3 font-normal" name="password" type="password" minLength={8} required /></label>
        <label className="grid gap-2 text-sm font-bold">Confirmar senha<input className="border border-line p-3 font-normal" name="password_confirmation" type="password" minLength={8} required /></label>
        <button className="bg-ink px-5 py-3 text-sm font-extrabold uppercase text-white">Salvar senha</button>
        <Link href="/login" className="text-center text-sm font-bold text-clay">Voltar para login</Link>
      </form>
    </main>
  );
}
