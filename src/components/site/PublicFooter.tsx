import Link from "next/link";
import { getDb } from "@/lib/db";

type FooterSettings = {
  logo_url?: string | null;
  about_text?: string | null;
  slogan?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  link_color?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  business_hours?: string | null;
  newsletter?: { title?: string; text?: string; placeholder?: string; button?: string };
  legal_info?: { company_name?: string; cnpj?: string; copyright?: string };
  show_newsletter?: boolean;
  show_socials?: boolean;
  show_payment_methods?: boolean;
  show_legal_info?: boolean;
};

async function getFooterData() {
  try {
    const sql = getDb();
    const [settingsRows, columnRows, linkRows, socialRows, paymentRows] = await Promise.all([
      sql.unsafe("select * from footer_settings where is_published = true order by updated_at desc limit 1"),
      sql.unsafe("select * from footer_columns where is_active = true order by display_order asc"),
      sql.unsafe("select * from footer_links where is_active = true order by display_order asc"),
      sql.unsafe("select * from social_links where is_active = true order by display_order asc"),
      sql.unsafe("select * from payment_methods where is_active = true order by display_order asc")
    ]);

    return {
      settings: (settingsRows[0] as unknown as FooterSettings | undefined) ?? {},
      columns: columnRows as unknown as { id: string; title: string }[],
      links: linkRows as unknown as { column_id: string; title: string; url: string; open_in_new_tab: boolean }[],
      socials: socialRows as unknown as { platform: string; url: string | null }[],
      payments: paymentRows as unknown as { name: string }[]
    };
  } catch {
    return {
      settings: {},
      columns: [
        { id: "institucional", title: "Institucional" },
        { id: "atendimento", title: "Atendimento" },
        { id: "conta", title: "Minha conta" }
      ],
      links: [
        { column_id: "institucional", title: "Quem somos", url: "/paginas/quem-somos", open_in_new_tab: false },
        { column_id: "institucional", title: "Seja vendedor", url: "/seja-vendedor", open_in_new_tab: false },
        { column_id: "atendimento", title: "Trocas e devolucoes", url: "/paginas/trocas-e-devolucoes", open_in_new_tab: false },
        { column_id: "conta", title: "Entrar", url: "/login", open_in_new_tab: false }
      ],
      socials: [],
      payments: [{ name: "Pix" }, { name: "Visa" }, { name: "Mastercard" }, { name: "Boleto" }]
    };
  }
}

export async function PublicFooter() {
  const { settings, columns, links, socials, payments } = await getFooterData();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink px-5 py-12 text-white lg:px-14" style={{ backgroundColor: settings.background_color ?? undefined, color: settings.text_color ?? undefined }}>
      <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
        <section>
          <Link href="/" className="font-serif text-4xl uppercase" style={{ color: settings.link_color ?? undefined }}>Aurora</Link>
          <p className="mt-4 max-w-md leading-7 text-white/70">{settings.about_text ?? "Curadoria de semijoias e lojas parceiras com experiencia sofisticada para clientes e vendedores."}</p>
          <p className="mt-3 text-sm font-bold text-[#f2d9a2]">{settings.slogan ?? "Brilho leve, todos os dias."}</p>
          <div className="mt-6 grid gap-1 text-sm text-white/70">
            {settings.phone && <span>{settings.phone}</span>}
            {settings.whatsapp && <span>WhatsApp: {settings.whatsapp}</span>}
            {settings.email && <span>{settings.email}</span>}
            {(settings.city || settings.state) && <span>{settings.city}{settings.city && settings.state ? " - " : ""}{settings.state}</span>}
            {settings.business_hours && <span>{settings.business_hours}</span>}
          </div>
        </section>

        <div className="grid gap-8 md:grid-cols-3">
          {columns.map((column) => (
            <section key={column.id}>
              <h2 className="text-sm font-extrabold uppercase text-[#f2d9a2]">{column.title}</h2>
              <nav className="mt-4 grid gap-3 text-sm text-white/70">
                {links.filter((link) => link.column_id === column.id).map((link) => (
                  <Link key={`${column.id}-${link.title}`} href={link.url} target={link.open_in_new_tab ? "_blank" : undefined} style={{ color: settings.link_color ?? undefined }}>
                    {link.title}
                  </Link>
                ))}
              </nav>
            </section>
          ))}
        </div>
      </div>

      {settings.show_newsletter !== false && (
        <section className="mt-10 grid gap-4 border-t border-white/10 pt-8 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-serif text-3xl">{settings.newsletter?.title ?? "Receba novidades"}</h2>
            <p className="mt-2 text-sm text-white/65">{settings.newsletter?.text ?? "Curadorias, ofertas e novidades para sua caixa de entrada."}</p>
          </div>
          <form className="flex min-w-0 gap-2">
            <input className="min-w-0 border border-white/20 bg-white px-4 py-3 text-ink" placeholder={settings.newsletter?.placeholder ?? "Seu e-mail"} type="email" />
            <button className="bg-white px-5 py-3 text-sm font-extrabold uppercase text-ink">{settings.newsletter?.button ?? "Assinar"}</button>
          </form>
        </section>
      )}

      <section className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60">
        <div className="flex flex-wrap gap-2">
          {settings.show_payment_methods !== false && payments.map((method) => <span key={method.name} className="border border-white/15 px-3 py-2">{method.name}</span>)}
        </div>
        {settings.show_socials !== false && socials.length > 0 && <div className="flex flex-wrap gap-3">{socials.map((social) => social.url && <Link key={social.platform} href={social.url}>{social.platform}</Link>)}</div>}
        {settings.show_legal_info !== false && <p>{settings.legal_info?.copyright ?? `Copyright ${year} Aurora Semijoias. Todos os direitos reservados.`}</p>}
      </section>
    </footer>
  );
}
