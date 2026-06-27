import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  await requireAdmin(["admin", "editor"]);
  const formData = await request.formData();
  const file = formData.get("file");
  const bucket = String(formData.get("bucket") ?? "product-images");

  if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
  if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Formato invalido. Use JPG, PNG ou WebP." }, { status: 400 });
  if (file.size > maxBytes) return NextResponse.json({ error: "Imagem acima de 4 MB." }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const extension = file.name.split(".").pop() || "webp";
  const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ path, publicUrl: data.publicUrl });
}