"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { findAdminModule } from "@/lib/admin-modules";
import { assertIdentifier, getDb } from "@/lib/db";
import { slugify } from "@/lib/utils";

const idSchema = z.string().uuid();

function parseValue(value: FormDataEntryValue | null, type?: string) {
  if (type === "checkbox") return value === "on";
  if (type === "number") return value === null || value === "" ? null : Number(value);
  if (type === "textarea" && value) {
    const raw = String(value);
    if (raw.trim().startsWith("{") || raw.trim().startsWith("[")) {
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    }
  }
  return value === null ? null : String(value);
}

async function assertModuleAccess(moduleKey: string, write = true) {
  const module = findAdminModule(moduleKey);
  if (!module) throw new Error("Modulo administrativo inexistente.");
  const profile = await requireAdmin(write ? module.writeRoles : ["admin", "editor", "analyst"]);
  return { module, profile };
}

function buildPayload(moduleKey: string, formData: FormData) {
  const module = findAdminModule(moduleKey);
  if (!module) throw new Error("Modulo administrativo inexistente.");
  const payload: Record<string, unknown> = {};

  for (const column of module.columns) {
    payload[column.key] = parseValue(formData.get(column.key), column.type);
  }

  if ("name" in payload && !payload.slug) payload.slug = slugify(String(payload.name));
  if (module.table === "products" && !payload.status) payload.status = "draft";
  return payload;
}

export async function saveAdminRecord(moduleKey: string, formData: FormData) {
  const { module, profile } = await assertModuleAccess(moduleKey);
  const sql = getDb();
  const table = assertIdentifier(module.table);
  const id = String(formData.get("id") ?? "");
  const payload = buildPayload(moduleKey, formData);
  const columns = Object.keys(payload).map(assertIdentifier);
  const values = Object.values(payload);
  let savedId = id;

  try {
    if (id) {
      const assignments = columns.map((column, index) => `${column} = $${index + 1}`).join(", ");
      const rows = await sql.unsafe(`update ${table} set ${assignments} where id = $${columns.length + 1} returning id`, [
        ...values,
        idSchema.parse(id)
      ]);
      savedId = rows[0]?.id ?? id;
    } else {
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
      const rows = await sql.unsafe(`insert into ${table} (${columns.join(", ")}) values (${placeholders}) returning id`, values);
      savedId = rows[0]?.id;
    }

    await sql.unsafe(
      "insert into audit_logs (actor_id, action, table_name, record_id, changes) values ($1, $2, $3, $4, $5::jsonb)",
      [profile.id, id ? "update" : "create", table, savedId, JSON.stringify(payload)]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar registro.";
    redirect(`/admin/${moduleKey}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/admin/${moduleKey}`);
  redirect(`/admin/${moduleKey}?success=Registro salvo com sucesso`);
}

export async function deleteAdminRecord(moduleKey: string, id: string) {
  const { module, profile } = await assertModuleAccess(moduleKey);
  const sql = getDb();
  const table = assertIdentifier(module.table);
  const parsedId = idSchema.parse(id);

  try {
    await sql.unsafe(`delete from ${table} where id = $1`, [parsedId]);
    await sql.unsafe("insert into audit_logs (actor_id, action, table_name, record_id) values ($1, $2, $3, $4)", [
      profile.id,
      "delete",
      table,
      parsedId
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir registro.";
    redirect(`/admin/${moduleKey}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/admin/${moduleKey}`);
}

export async function duplicateProduct(id: string) {
  const { profile } = await assertModuleAccess("produtos");
  const sql = getDb();
  const parsedId = idSchema.parse(id);

  try {
    const rows = await sql.unsafe("select * from products where id = $1 limit 1", [parsedId]);
    const product = rows[0];
    if (!product) throw new Error("Produto nao encontrado.");

    const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...copy } = product;
    copy.name = `${product.name} copia`;
    copy.slug = `${product.slug}-copia-${Date.now()}`;
    copy.status = "draft";

    const columns = Object.keys(copy).map(assertIdentifier);
    const values = Object.values(copy);
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
    const created = await sql.unsafe(`insert into products (${columns.join(", ")}) values (${placeholders}) returning id`, values);

    await sql.unsafe("insert into audit_logs (actor_id, action, table_name, record_id) values ($1, $2, $3, $4)", [
      profile.id,
      "duplicate",
      "products",
      created[0]?.id
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao duplicar produto.";
    redirect(`/admin/produtos?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/produtos");
}

export async function archiveProduct(id: string) {
  const { profile } = await assertModuleAccess("produtos");
  const sql = getDb();
  const parsedId = idSchema.parse(id);

  try {
    await sql.unsafe("update products set status = 'archived' where id = $1", [parsedId]);
    await sql.unsafe("insert into audit_logs (actor_id, action, table_name, record_id) values ($1, $2, $3, $4)", [
      profile.id,
      "archive",
      "products",
      parsedId
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao arquivar produto.";
    redirect(`/admin/produtos?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/produtos");
}

export async function signOut() {
  const { clearAdminSession } = await import("@/lib/auth");
  await clearAdminSession();
  redirect("/login");
}
