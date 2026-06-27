import { cookies } from "next/headers";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function assertPublicEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase public environment variables are missing.");
  }
}

export function createSupabaseBrowserClient() {
  assertPublicEnv();
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}

export async function createSupabaseServerClient() {
  assertPublicEnv();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always write cookies; Server Actions and Route Handlers can.
        }
      }
    }
  });
}

export function createSupabaseServiceClient() {
  assertPublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing on the server.");
  }
  return createClient(supabaseUrl!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
