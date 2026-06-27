import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  return <AdminShell profile={profile}>{children}</AdminShell>;
}
