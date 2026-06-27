import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 5 * 1024 * 1024;

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are missing.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
}

export async function POST(request: NextRequest) {
  await requireAdmin(["admin", "editor"]);
  configureCloudinary();

  const formData = await request.formData();
  const file = formData.get("file");
  const moduleKey = String(formData.get("module") ?? "admin");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Formato invalido. Use JPG, PNG ou WebP." }, { status: 400 });
  }

  if (file.size > maxBytes) {
    return NextResponse.json({ error: "Imagem acima de 5 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const folder = `${process.env.CLOUDINARY_UPLOAD_FOLDER ?? "aurora-semijoias"}/${moduleKey}`;

  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        transformation: [{ quality: "auto", fetch_format: "auto" }]
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error("Falha ao enviar imagem."));
          return;
        }

        resolve({ secure_url: uploadResult.secure_url, public_id: uploadResult.public_id });
      }
    );

    stream.end(buffer);
  });

  return NextResponse.json({
    publicUrl: result.secure_url,
    publicId: result.public_id
  });
}
