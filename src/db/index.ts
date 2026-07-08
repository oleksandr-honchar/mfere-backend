import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// prepare: false — обов'язково для transaction/session pooler режимів Supabase,
// інакше можуть падати prepared statements
const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  ssl: "require",
});

export const db = drizzle(client, { schema });