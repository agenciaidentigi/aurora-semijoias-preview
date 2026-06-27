import postgres from "postgres";

let db: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing.");
  }

  if (!db) {
    db = postgres(process.env.DATABASE_URL, {
      max: 3,
      idle_timeout: 20,
      connect_timeout: 10
    });
  }

  return db;
}

export function assertIdentifier(value: string) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) {
    throw new Error("Invalid database identifier.");
  }

  return value;
}
