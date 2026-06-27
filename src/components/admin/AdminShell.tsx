import Link from "next/link";
import { BarChart3, Boxes, Image, Layers, LayoutDashboard, LogOut, Mail, Settings, Shield, Tags, Users } from "lucide-react";
import { adminModules } from "@/lib/admin-modules";
import type { Profile } from "@/lib/types";
import { signOut } from "@/app/admin/actions";

const icons: Record<string, React.ReactNode> = {
  produtos: <Boxes size={18} />,
  categorias: <Tags size={18} />,
  subcategorias: <Layers size={18} />,
  colecoes: <Layers size={18} />,
  parceiros: <Shield size={18} />,
  banners: <Image size={18} />,
  home: <LayoutDashboard size={18} />,
  paginas: <Layers size={18} />,
  leads: <Mail size={18} />,
  usuarios: <Users size={18} />,
  configuracoes: <Settings size={18} />
};

export function AdminShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f2ec] text-ink lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-line bg-ink text-white">
        <div className="border-b border-white/10 p-6">
          <Link href="/" className="font-serif text-3xl uppercase">Aurora</Link>
          <p className="mt-2 text-sm text-white/60">Painel administrativo</p>
        </div>
        <nav className="grid gap-1 p-3 text-sm">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-3 text-white/85 hover:bg-white/10"><LayoutDashboard size={18} /> Dashboard</Link>
          {adminModules.map((module) => (
            <Link key={module.key} href={`/admin/${module.key}`} className="flex items-center gap-3 px-3 py-3 text-white/85 hover:bg-white/10">
              {icons[module.key] ?? <Layers size={18} />} {module.title}
            </Link>
          ))}
          <Link href="/admin/relatorios" className="flex items-center gap-3 px-3 py-3 text-white/85 hover:bg-white/10"><BarChart3 size={18} /> Relatorios de cliques</Link>
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-paper px-5 py-4 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase text-gold">Logado como {profile.role}</p>
            <h1 className="font-serif text-3xl">Administracao</h1>
          </div>
          <div className="flex items-center gap-3">
            <input className="hidden border border-line bg-white px-4 py-2 md:block" placeholder="Buscar no painel" />
            <form action={signOut}><button className="inline-flex items-center gap-2 bg-ink px-4 py-2 text-sm font-bold text-white"><LogOut size={16} /> Sair</button></form>
          </div>
        </header>
        <main className="p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}