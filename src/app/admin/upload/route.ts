import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function POST() {
  await requireAdmin(["admin", "editor"]);

  return NextResponse.json(
    {
      error:
        "Upload direto desativado nesta previa com Neon. Use URLs de imagem no painel ou configure Vercel Blob/S3 para storage."
    },
    { status: 501 }
  );
}
