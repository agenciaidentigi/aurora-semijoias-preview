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
  const profile = await requireAdmin(["admin"]);
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
  const values = Object.values(payload) as any[];
  let savedId = id;

  try {
    if (id) {
      const assignments = columns.map((column, index) => `${column} = $${index + 1}`).join(", ");
      const rows = await sql.unsafe(`update ${table} set ${assignments} where id = $${columns.length + 1} returning id`, [
        ...values,
        idSchema.parse(id)
      ]);
      savedId = (rows[0] as unknown as { id?: string } | undefined)?.id ?? id;
    } else {
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
      const rows = await sql.unsafe(`insert into ${table} (${columns.join(", ")}) values (${placeholders}) returning id`, values);
      savedId = (rows[0] as unknown as { id?: string } | undefined)?.id ?? "";
    }

    if (moduleKey === "solicitacoes-vendedores" && savedId) {
      await syncSellerApplication(savedId, profile.id);
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

async function syncSellerApplication(applicationId: string, actorId: string) {
  const sql = getDb();
  const rows = await sql.unsafe("select * from seller_applications where id = $1 limit 1", [applicationId]);
  const application = rows[0] as unknown as Record<string, any> | undefined;
  if (!application) return;

  const status = String(application.status ?? "pending");
  await sql.unsafe(
    `insert into seller_profiles (user_id, application_id, status, approved_at, created_by, updated_by)
     values ($1, $2, $3::seller_application_status, case when $3 = 'approved' then now() else null end, $4, $4)
     on conflict (user_id) do update set
       application_id = excluded.application_id,
       status = excluded.status,
       approved_at = case when excluded.status = 'approved' then coalesce(seller_profiles.approved_at, now()) else seller_profiles.approved_at end,
       suspended_at = case when excluded.status = 'suspended' then now() else seller_profiles.suspended_at end,
       updated_by = excluded.updated_by`,
    [application.user_id, application.id, status, actorId]
  );

  await sql.unsafe("insert into user_roles (user_id, role, status) values ($1, 'seller', 'active') on conflict (user_id, role) do update set status = 'active'", [application.user_id]);

  if (status === "approved") {
    const slug = `${slugify(String(application.store_name ?? "loja"))}-${String(application.user_id).slice(0, 6)}`;
    await sql.unsafe(
      `insert into stores (seller_id, name, slug, logo_url, description, whatsapp, email, social_links, status, created_by, updated_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,'active',$9,$9)
       on conflict (slug) do nothing`,
      [
        application.user_id,
        application.store_name,
        slug,
        application.logo_url,
        application.description,
        application.whatsapp,
        application.commercial_email,
        JSON.stringify({ instagram: application.instagram, website: application.website }),
        actorId
      ]
    );
    await sql.unsafe("insert into notifications (user_id, title, message, type) values ($1, 'Loja aprovada', 'Sua loja foi aprovada. O painel do vendedor esta liberado.', 'success')", [application.user_id]);
  }

  if (status === "rejected") {
    await sql.unsafe("insert into notifications (user_id, title, message, type) values ($1, 'Solicitacao recusada', $2, 'warning')", [
      application.user_id,
      application.rejection_reason || "Sua solicitacao de vendedor foi recusada."
    ]);
  }
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
    const product = rows[0] as unknown as Record<string, any> | undefined;
    if (!product) throw new Error("Produto nao encontrado.");

    const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...copy } = product;
    copy.name = `${product.name} copia`;
    copy.slug = `${product.slug}-copia-${Date.now()}`;
    copy.status = "draft";

    const columns = Object.keys(copy).map(assertIdentifier);
    const values = Object.values(copy) as any[];
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
    const created = await sql.unsafe(`insert into products (${columns.join(", ")}) values (${placeholders}) returning id`, values);

    await sql.unsafe("insert into audit_logs (actor_id, action, table_name, record_id) values ($1, $2, $3, $4)", [
      profile.id,
      "duplicate",
      "products",
      (created[0] as unknown as { id?: string } | undefined)?.id
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
