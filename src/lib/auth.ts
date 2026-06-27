import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import type { Profile, Role } from "@/lib/types";

const cookieName = "aurora_admin_session";

type SessionPayload = {
  id: string;
  email: string;
  role: Role;
  exp: number;
};

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("ADMIN_SESSION_SECRET must be at least 24 characters.");
  }

  return secret;
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function signPayload(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function verifyToken(token: string): SessionPayload | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = signPayload(payload);
  const isValid =
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  if (!isValid) return null;

  let parsed: SessionPayload;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }

  if (parsed.exp < Date.now()) return null;

  return parsed;
}

export function createSessionToken(profile: Profile) {
  const payload = base64Url(
    JSON.stringify({
      id: profile.id,
      email: profile.email,
      role: profile.role,
      exp: Date.now() + 1000 * 60 * 60 * 8
    })
  );

  return `${payload}.${signPayload(payload)}`;
}

export async function setAdminSession(profile: Profile) {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, createSessionToken(profile), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return null;

  const session = verifyToken(token);
  if (!session) return null;

  const sql = getDb();
  const rows = await sql.unsafe(
    "select id, email, full_name, role, is_active from profiles where id = $1 and is_active = true limit 1",
    [session.id]
  );

  return (rows[0] as Profile | undefined) ?? null;
}

export async function requireAdmin(allowedRoles: Role[] = ["admin", "editor", "analyst"]) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active || !allowedRoles.includes(profile.role)) {
    redirect("/login?next=/admin");
  }

  return profile;
}

export function canWrite(role: Role, allowed: Role[]) {
  return allowed.includes(role);
}
