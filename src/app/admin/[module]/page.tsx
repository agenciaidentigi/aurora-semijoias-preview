import { notFound } from "next/navigation";
import { findAdminModule } from "@/lib/admin-modules";
import { createSupabaseServerClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { AdminModuleView } from "@/components/admin/AdminModuleView";

export const dynamic = "force-dynamic";

export default async function AdminModulePage({ params, searchParams }: { params: Promise<{ module: string }>; searchParams: Promise<{ success?: string; error?: string }> }) {
  const [{ module: moduleKey }, query] = await Promise.all([params, searchParams]);
  const module = findAdminModule(moduleKey);
  if (!module) notFound();
  const profile = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from(module.table).select("*").order("updated_at", { ascending: false }).limit(100);
  return <AdminModuleView module={module} rows={(data ?? []) as Record<string, any>[]} role={profile.role} message={query.success} error={query.error ?? error?.message} />;
}
