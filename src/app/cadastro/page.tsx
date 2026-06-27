import { randomBytes } from "crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { setUserSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

function formError(message: string) {
  redirect(`/cadastro?error=${encodeURIComponent(message)}`);
}

async function registerCustomer(formData: FormData) {
  "use server";

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirmation = String(formData.get("password_confirmation") ?? "");
  const acceptedTerms = formData.get("accepted_terms") === "on";
  const acceptedPrivacy = formData.get("accepted_privacy") === "on";
  const acceptsOffers = formData.get("accepts_offers") === "on";

  if (!fullName || !email || !phone) formError("Preencha nome, e-mail e telefone.");
  if (password.length < 8) formError("A senha precisa ter pelo menos 8 caracteres.");
  if (password !== passwordConfirmation) formError("As senhas nao conferem.");
  if (!acceptedTerms || !acceptedPrivacy) formError("Aceite os termos e a politica de privacidade para continuar.");

  const sql = getDb();
  const emailVerificationToken = randomBytes(32).toString("hex");

  try {
    const rows = await sql.unsafe(
      `insert into profiles (email, full_name, phone, password_hash, role, email_verification_token, email_verification_sent_at, is_active)
       values ($1, $2, $3, $4, 'customer', $5, now(), true)
       returning id, email, full_name, phone, avatar_url, email_verified_at, role, is_active`,
      [email, fullName, phone, hashPassword(password), emailVerificationToken]
    );
    const profile = rows[0] as unknown as Profile;

    await sql.unsafe("insert into user_roles (user_id, role, status) values ($1, 'customer', 'active') on conflict (user_id, role) do nothing", [profile.id]);
    await sql.unsafe(
      `insert into customer_profiles (user_id, cpf, accepted_terms_at, accepted_privacy_at, accepts_offers, status)
       values ($1, $2, now(), now(), $3, 'active')
       on conflict (user_id) do update set cpf = excluded.cpf, accepts_offers = excluded.accepts_offers`,
      [profile.id, cpf || null, acceptsOffers]
    );
    await sql.unsafe(
      "insert into notifications (user_id, title, message, type) values ($1, $2, $3, 'success')",
      [profile.id, "Cadastro criado", "Sua conta de cliente foi criada com sucesso."]
    );

    await setUserSession({ ...profile, roles: ["customer"] });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("profiles_email_key")
      ? "Este e-mail ja esta cadastrado."
      : "Nao foi possivel criar sua conta agora.";
    formError(message);
  }

  redirect("/minha-conta?welcome=1");
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line px-5 py-5 lg:px-14">
        <Link href="/" className="font-serif text-4xl uppercase">Aurora</Link>
      </header>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-14">
        <div className="pt-4">
          <p className="text-xs font-extrabold uppercase text-gold">Cadastro de cliente</p>
          <h1 className="mt-3 font-serif text-5xl leading-none md:text-6xl">Crie sua conta Aurora</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-neutral-600">Salve favoritos, acompanhe pedidos, gerencie seus dados e solicite sua loja quando quiser vender na plataforma.</p>
          <div className="mt-8 grid gap-3 text-sm text-neutral-600">
            <span className="border-l-2 border-gold pl-4">Papel customer aplicado automaticamente.</span>
            <span className="border-l-2 border-gold pl-4">Arquitetura preparada para confirmacao de e-mail e login Google futuramente.</span>
          </div>
        </div>

        <form action={registerCustomer} className="grid gap-5 border border-line bg-white p-6">
          {params.error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{params.error}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold md:col-span-2">Nome completo<input className="border border-line p-3 font-normal" name="full_name" required /></label>
            <label className="grid gap-2 text-sm font-bold">E-mail<input className="border border-line p-3 font-normal" name="email" type="email" required /></label>
            <label className="grid gap-2 text-sm font-bold">Telefone<input className="border border-line p-3 font-normal" name="phone" required /></label>
            <label className="grid gap-2 text-sm font-bold">Senha<input className="border border-line p-3 font-normal" name="password" type="password" minLength={8} required /></label>
            <label className="grid gap-2 text-sm font-bold">Confirmar senha<input className="border border-line p-3 font-normal" name="password_confirmation" type="password" minLength={8} required /></label>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">CPF opcional<input className="border border-line p-3 font-normal" name="cpf" /></label>
          </div>

          <label className="flex gap-3 text-sm leading-6"><input className="mt-1 h-4 w-4" name="accepted_terms" type="checkbox" required /> Aceito os Termos de Uso.</label>
          <label className="flex gap-3 text-sm leading-6"><input className="mt-1 h-4 w-4" name="accepted_privacy" type="checkbox" required /> Aceito a Politica de Privacidade.</label>
          <label className="flex gap-3 text-sm leading-6"><input className="mt-1 h-4 w-4" name="accepts_offers" type="checkbox" /> Quero receber ofertas e novidades.</label>

          <button className="bg-ink px-5 py-4 text-sm font-extrabold uppercase text-white">Criar conta</button>
          <p className="text-center text-sm text-neutral-600">Ja tem conta? <Link className="font-bold text-clay" href="/login">Entrar</Link></p>
        </form>
      </section>
    </main>
  );
}
