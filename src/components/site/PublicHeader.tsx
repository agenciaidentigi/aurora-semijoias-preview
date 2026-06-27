import Link from "next/link";
import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import { getCurrentProfile, getSellerStatusForUser, firstName, hasRole } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { signOut } from "@/app/auth-actions";

type HeaderSettings = {
  promo_text?: string | null;
  promo_coupon?: string | null;
  promo_link?: string | null;
  show_search?: boolean;
  show_cart?: boolean;
  show_favorites?: boolean;
  show_login?: boolean;
  menu_items?: { title: string; url: string; active?: boolean }[];
};

async function getHeaderData() {
  const fallbackMenu = [
    { title: "Aneis", url: "/#produtos" },
    { title: "Brincos", url: "/#produtos" },
    { title: "Colares", url: "/#produtos" },
    { title: "Pulseiras", url: "/#produtos" },
    { title: "Seja vendedor", url: "/seja-vendedor" }
  ];

  try {
    const sql = getDb();
    const [settingsRows, categoryRows] = await Promise.all([
      sql.unsafe("select * from header_settings where is_published = true order by updated_at desc limit 1"),
      sql.unsafe("select name, slug from categories where is_active = true order by display_order asc limit 5")
    ]);
    const settings = (settingsRows[0] as unknown as HeaderSettings | undefined) ?? {};
    const categoryMenu = categoryRows.map((row) => {
      const category = row as unknown as { name: string; slug: string };
      return { title: category.name, url: `/#produtos` };
    });

    return {
      settings,
      menu: settings.menu_items?.length ? settings.menu_items.filter((item) => item.active !== false) : categoryMenu.length ? categoryMenu : fallbackMenu
    };
  } catch {
    return { settings: {}, menu: fallbackMenu };
  }
}

export async function PublicHeader() {
  const [profile, headerData] = await Promise.all([getCurrentProfile(), getHeaderData()]);
  const sellerStatus = profile ? await getSellerStatusForUser(profile.id) : null;
  const { settings, menu } = headerData;
  const showLogin = settings.show_login !== false;
  const canSeeSellerPanel = profile?.roles.includes("seller") && sellerStatus === "approved";
  const canSeeAdminPanel = hasRole(profile, "admin");
  const canSwitchPanel = Boolean(profile && profile.roles.length > 1);

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-3 bg-ink px-5 py-2 text-center text-sm text-white">
        <span>{settings.promo_text ?? "10% off em escolhas selecionadas | compra segura nos parceiros"}</span>
        {settings.promo_coupon && <strong className="text-[#f2d9a2]">{settings.promo_coupon}</strong>}
        <Link className="font-bold text-[#f2d9a2]" href={settings.promo_link ?? "/#produtos"}>Ver curadoria</Link>
      </div>

      <header className="sticky top-0 z-30 grid gap-4 border-b border-line bg-paper/95 px-5 py-5 backdrop-blur lg:grid-cols-[auto_1fr_auto] lg:px-14">
        <Link href="/" className="font-serif text-4xl uppercase">Aurora</Link>
        <nav className="flex gap-6 overflow-x-auto text-sm uppercase text-muted-foreground lg:justify-center">
          {menu.map((item) => <Link key={`${item.title}-${item.url}`} href={item.url}>{item.title}</Link>)}
        </nav>
        <div className="flex items-center gap-2 justify-self-start lg:justify-self-end">
          {settings.show_search !== false && <Link href="/#produtos" className="grid h-10 w-10 place-items-center border border-line bg-white" aria-label="Buscar"><Search size={18} /></Link>}
          {settings.show_favorites !== false && <Link href="/minha-conta?tab=favoritos" className="grid h-10 w-10 place-items-center border border-line bg-white" aria-label="Favoritos"><Heart size={18} /></Link>}
          {settings.show_cart !== false && <Link href="/carrinho" className="grid h-10 w-10 place-items-center border border-line bg-white" aria-label="Carrinho"><ShoppingBag size={18} /></Link>}
          {showLogin && !profile && (
            <Link href="/login" className="inline-flex h-10 items-center gap-2 border border-ink bg-white px-4 text-sm font-bold">
              <UserRound size={18} /> Entrar
            </Link>
          )}
          {showLogin && profile && (
            <details className="relative">
              <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 border border-ink bg-white px-4 text-sm font-bold">
                <UserRound size={18} /> Ola, {firstName(profile)}
              </summary>
              <div className="absolute right-0 z-40 mt-2 grid w-64 gap-1 border border-line bg-white p-2 text-sm shadow-xl">
                <Link className="px-3 py-2 hover:bg-ivory" href="/minha-conta">Minha conta</Link>
                <Link className="px-3 py-2 hover:bg-ivory" href="/minha-conta?tab=pedidos">Meus pedidos</Link>
                <Link className="px-3 py-2 hover:bg-ivory" href="/minha-conta?tab=favoritos">Meus favoritos</Link>
                {canSeeSellerPanel && <Link className="px-3 py-2 hover:bg-ivory" href="/vendedor">Painel do vendedor</Link>}
                {canSeeAdminPanel && <Link className="px-3 py-2 hover:bg-ivory" href="/admin">Painel administrativo</Link>}
                {canSwitchPanel && <Link className="px-3 py-2 hover:bg-ivory" href={canSeeSellerPanel ? "/vendedor" : "/minha-conta"}>Alternar painel</Link>}
                <form action={signOut}>
                  <button className="w-full px-3 py-2 text-left font-bold text-red-700 hover:bg-red-50">Sair</button>
                </form>
              </div>
            </details>
          )}
        </div>
      </header>
    </>
  );
}
