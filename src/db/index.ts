import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Supabase connection via Transaction Mode pooler (port 6543 = PgBouncer)
// prepare: false required for transaction-mode pooler (no prepared statements)
// search_path: ensures tables in the "public" schema are found
const client = postgres(process.env.DATABASE_URL!, {
  max: 1,
  ssl: "require",
  prepare: false,
  connection: { search_path: "public" },
});

export const db = drizzle(client, { schema });

export * from "./schema";
