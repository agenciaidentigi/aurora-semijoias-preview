import { randomBytes } from "crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getPostLoginRedirect, setUserSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import type { Profile, Role } from "@/lib/types";

export const dynamic = "force-dynamic";

function safeNext(value: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "";
  return value;
}

async function signIn(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));
  const sql = getDb();
  const rows = await sql.unsafe(
    "select id, email, full_name, phone, avatar_url, email_verified_at, role, is_active, password_hash from profiles where lower(email) = lower($1) and is_active = true limit 1",
    [email]
  );
  const profile = rows[0] as unknown as (Profile & { password_hash: string | null }) | undefined;

  if (!profile || !verifyPassword(password, profile.password_hash)) {
    redirect(`/login?error=${encodeURIComponent("E-mail ou senha invalidos.")}&next=${encodeURIComponent(next)}`);
  }

  const roleRows = await sql.unsafe("select role::text as role from user_roles where user_id = $1 and status = 'active'", [profile.id]);
  const roles = roleRows.map((row) => String((row as unknown as { role: string }).role) as Role);
  const sessionProfile = { ...profile, roles: roles.length ? roles : [profile.role] };

  await sql.unsafe("update profiles set last_login_at = now() where id = $1", [profile.id]);
  await setUserSession(sessionProfile);
  redirect(next || (await getPostLoginRedirect(sessionProfile)));
}

async function requestPasswordReset(formData: FormData) {
  "use server";
  const email = String(formData.get("reset_email") ?? "").trim();
  if (!email) redirect("/login?reset=Informe seu e-mail.");

  const sql = getDb();
  const token = randomBytes(32).toString("hex");
  await sql.unsafe(
    "update profiles set password_reset_token = $1, password_reset_expires_at = now() + interval '30 minutes' where lower(email) = lower($2)",
    [token, email]
  );

  redirect(`/login?reset=${encodeURIComponent("Se o e-mail estiver cadastrado, enviaremos as instrucoes de recuperacao.")}`);
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; reset?: string }> }) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen bg-ink p-6 text-ink lg:grid-cols-[1fr_520px]">
      <section
        className="hidden items-end bg-cover bg-center p-12 text-white lg:flex"
        style={{ backgroundImage: "linear-gradient(to top, rgba(25, 23, 20, 0.72), rgba(25, 23, 20, 0.2)), url('https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1400&q=85')" }}
      >
        <div className="max-w-xl">
          <Link href="/" className="font-serif text-4xl uppercase">Aurora</Link>
          <h1 className="mt-8 font-serif text-6xl leading-none">Sua conta, seus favoritos e seus painéis.</h1>
          <p className="mt-5 text-lg leading-8 text-white/85">Clientes, vendedores aprovados e administradores entram pelo mesmo acesso seguro.</p>
        </div>
      </section>
      <section className="grid place-items-center">
        <div className="grid w-full max-w-md gap-5 bg-paper p-8 shadow-2xl">
          <form action={signIn} className="grid gap-5">
            <div>
              <p className="text-xs font-bold uppercase text-gold">Conta Aurora</p>
              <h2 className="mt-2 font-serif text-4xl">Entrar</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600">Acesse sua conta, loja ou painel conforme suas permissoes.</p>
            </div>
            {params.error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{params.error}</p>}
            {params.reset && <p className="border border-green-200 bg-green-50 p-3 text-sm text-green-700">{params.reset}</p>}
            <input type="hidden" name="next" value={params.next ?? ""} />
            <label className="grid gap-2 text-sm font-bold">E-mail<input className="border border-line bg-white p-3 font-normal" name="email" type="email" required /></label>
            <label className="grid gap-2 text-sm font-bold">Senha<input className="border border-line bg-white p-3 font-normal" name="password" type="password" required /></label>
            <button className="bg-ink px-5 py-3 text-sm font-extrabold uppercase text-white">Entrar</button>
            <div className="flex flex-wrap justify-between gap-3 text-sm">
              <Link href="/cadastro" className="font-bold text-clay">Criar conta</Link>
              <a href="#recuperar" className="font-bold text-neutral-600">Esqueci minha senha</a>
            </div>
          </form>
          <form id="recuperar" action={requestPasswordReset} className="grid gap-3 border-t border-line pt-5">
            <strong className="text-sm">Recuperacao de senha</strong>
            <input className="border border-line bg-white p-3 text-sm" name="reset_email" type="email" placeholder="Seu e-mail" />
            <button className="border border-ink px-4 py-3 text-sm font-bold">Enviar instrucoes</button>
            <p className="text-xs leading-5 text-neutral-500">A arquitetura ja guarda o token de recuperacao com validade. O envio por e-mail fica pronto para ativar quando configurarmos o provedor transacional.</p>
          </form>
        </div>
      </section>
    </main>
  );
}
