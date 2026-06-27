import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import type { Profile, Role, SellerStatus } from "@/lib/types";

const cookieName = "aurora_session";
const legacyAdminCookieName = "aurora_admin_session";
const sessionMaxAge = 60 * 60 * 24 * 30;

type SessionPayload = {
  id: string;
  email: string;
  role: Role;
  roles: Role[];
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
  const roles = profile.roles?.length ? profile.roles : [profile.role];
  const payload = base64Url(
    JSON.stringify({
      id: profile.id,
      email: profile.email,
      role: profile.role,
      roles,
      exp: Date.now() + 1000 * sessionMaxAge
    })
  );

  return `${payload}.${signPayload(payload)}`;
}

export async function setUserSession(profile: Profile) {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, createSessionToken(profile), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAge
  });
}

export const setAdminSession = setUserSession;

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
  cookieStore.delete(legacyAdminCookieName);
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value ?? cookieStore.get(legacyAdminCookieName)?.value;
  if (!token) return null;

  const session = verifyToken(token);
  if (!session) return null;

  const sql = getDb();
  const profileRows = await sql.unsafe(
    "select id, email, full_name, phone, avatar_url, email_verified_at, role, is_active from profiles where id = $1 and is_active = true limit 1",
    [session.id]
  );
  const profile = profileRows[0] as unknown as Profile | undefined;
  if (!profile) return null;

  const roleRows = await sql.unsafe(
    "select role::text as role from user_roles where user_id = $1 and status = 'active' order by role",
    [profile.id]
  );
  const roles = roleRows.map((row) => String((row as unknown as { role: string }).role) as Role);

  return {
    ...profile,
    role: profile.role,
    roles: roles.length ? roles : session.roles?.length ? session.roles : [profile.role]
  };
}

export async function requireAuth(options: { roles?: Role[]; next?: string } = {}) {
  const profile = await getCurrentProfile();
  const roles = options.roles ?? [];

  if (!profile || !profile.is_active || (roles.length > 0 && !roles.some((role) => profile.roles.includes(role)))) {
    redirect(`/login?next=${encodeURIComponent(options.next ?? "/minha-conta")}`);
  }

  return profile;
}

export async function requireAdmin(allowedRoles: Role[] = ["admin"]) {
  const profile = await requireAuth({ roles: allowedRoles, next: "/admin" });
  if (!allowedRoles.some((role) => profile.roles.includes(role))) {
    redirect("/login?next=/admin");
  }

  return profile;
}

export function canWrite(profileOrRole: Profile | Role, allowed: Role[]) {
  if (typeof profileOrRole === "string") return allowed.includes(profileOrRole);
  return allowed.some((role) => profileOrRole.roles.includes(role));
}

export function hasRole(profile: Profile | null, role: Role) {
  return Boolean(profile?.roles.includes(role));
}

export function firstName(profile: Profile) {
  return profile.full_name?.trim().split(/\s+/)[0] ?? profile.email.split("@")[0];
}

export async function getSellerStatusForUser(userId: string): Promise<SellerStatus | null> {
  const sql = getDb();
  const rows = await sql.unsafe(
    "select status::text as status from seller_profiles where user_id = $1 union all select status::text from seller_applications where user_id = $1 order by status limit 1",
    [userId]
  );
  const status = (rows[0] as unknown as { status?: SellerStatus } | undefined)?.status;
  return status ?? null;
}

export async function getPostLoginRedirect(profile: Profile) {
  if (profile.roles.includes("admin")) return "/admin";
  if (profile.roles.includes("seller") && (await getSellerStatusForUser(profile.id)) === "approved") return "/vendedor";
  return "/minha-conta";
}
