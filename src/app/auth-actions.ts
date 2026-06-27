"use server";

import { redirect } from "next/navigation";
import { clearAdminSession } from "@/lib/auth";

export async function signOut() {
  await clearAdminSession();
  redirect("/login");
}
