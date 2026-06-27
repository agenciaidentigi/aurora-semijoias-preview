import { neon } from "@neondatabase/serverless";

let db: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing.");
  }

  if (!db) {
    db = neon(process.env.DATABASE_URL);
  }

  return db;
}

export function assertIdentifier(value: string) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) {
    throw new Error("Invalid database identifier.");
  }

  return value;
}
