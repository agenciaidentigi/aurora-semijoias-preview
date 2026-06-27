import { notFound } from "next/navigation";
import { findAdminModule } from "@/lib/admin-modules";
import { assertIdentifier, getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { AdminModuleView } from "@/components/admin/AdminModuleView";

export const dynamic = "force-dynamic";

export default async function AdminModulePage({ params, searchParams }: { params: Promise<{ module: string }>; searchParams: Promise<{ success?: string; error?: string }> }) {
  const [{ module: moduleKey }, query] = await Promise.all([params, searchParams]);
  const module = findAdminModule(moduleKey);
  if (!module) notFound();
  const profile = await requireAdmin();
  const sql = getDb();
  let data: Record<string, any>[] = [];
  let error: string | undefined;

  try {
    data = (await sql.unsafe(`select * from ${assertIdentifier(module.table)} order by updated_at desc limit 100`)) as Record<string, any>[];
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Erro ao carregar registros.";
  }

  return <AdminModuleView module={module} rows={data} role={profile.role} message={query.success} error={query.error ?? error} />;
}
