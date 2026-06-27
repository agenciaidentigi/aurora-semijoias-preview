"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { findAdminModule } from "@/lib/admin-modules";
import { createSupabaseServerClient } from "@/lib/supabase";
import { slugify } from "@/lib/utils";

const idSchema = z.string().uuid();

function parseValue(value: FormDataEntryValue | null, type?: string) {
  if (type === "checkbox") return value === "on";
  if (type === "number") return value === null || value === "" ? null : Number(value);
  return value === null ? null : String(value);
}

async function assertModuleAccess(moduleKey: string, write = true) {
  const module = findAdminModule(moduleKey);
  if (!module) throw new Error("Modulo administrativo inexistente.");
  const profile = await requireAdmin(write ? module.writeRoles : ["admin", "editor", "analyst"]);
  return { module, profile };
}

export async function saveAdminRecord(moduleKey: string, formData: FormData) {
  const { module, profile } = await assertModuleAccess(moduleKey);
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("id") ?? "");
  const payload: Record<string, unknown> = {};

  for (const column of module.columns) {
    payload[column.key] = parseValue(formData.get(column.key), column.type);
  }

  if ("name" in payload && !payload.slug) payload.slug = slugify(String(payload.name));
  if (module.table === "products" && !payload.status) payload.status = "draft";

  const result = id
    ? await supabase.from(module.table).update(payload).eq("id", idSchema.parse(id)).select("id").single()
    : await supabase.from(module.table).insert(payload).select("id").single();

  if (result.error) redirect(`/admin/${moduleKey}?error=${encodeURIComponent(result.error.message)}`);

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: id ? "update" : "create",
    table_name: module.table,
    record_id: result.data?.id,
    changes: payload
  });

  revalidatePath(`/admin/${moduleKey}`);
  redirect(`/admin/${moduleKey}?success=Registro salvo com sucesso`);
}

export async function deleteAdminRecord(moduleKey: string, id: string) {
  const { module, profile } = await assertModuleAccess(moduleKey);
  const supabase = await createSupabaseServerClient();
  const parsedId = idSchema.parse(id);
  const { error } = await supabase.from(module.table).delete().eq("id", parsedId);
  if (error) redirect(`/admin/${moduleKey}?error=${encodeURIComponent(error.message)}`);
  await supabase.from("audit_logs").insert({ actor_id: profile.id, action: "delete", table_name: module.table, record_id: parsedId });
  revalidatePath(`/admin/${moduleKey}`);
}

export async function duplicateProduct(id: string) {
  const { profile } = await assertModuleAccess("produtos");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", idSchema.parse(id)).single();
  if (error || !data) redirect(`/admin/produtos?error=${encodeURIComponent(error?.message ?? "Produto nao encontrado")}`);
  const copy = { ...data, id: undefined, name: `${data.name} copia`, slug: `${data.slug}-copia-${Date.now()}`, status: "draft", created_at: undefined, updated_at: undefined };
  const { data: created, error: insertError } = await supabase.from("products").insert(copy).select("id").single();
  if (insertError) redirect(`/admin/produtos?error=${encodeURIComponent(insertError.message)}`);
  await supabase.from("audit_logs").insert({ actor_id: profile.id, action: "duplicate", table_name: "products", record_id: created?.id });
  revalidatePath("/admin/produtos");
}

export async function archiveProduct(id: string) {
  const { profile } = await assertModuleAccess("produtos");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").update({ status: "archived" }).eq("id", idSchema.parse(id));
  if (error) redirect(`/admin/produtos?error=${encodeURIComponent(error.message)}`);
  await supabase.from("audit_logs").insert({ actor_id: profile.id, action: "archive", table_name: "products", record_id: id });
  revalidatePath("/admin/produtos");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}