import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Глобальна зміна для збереження з'єднання між оновленнями коду
const globalForDb = global as unknown as {
  conn: postgres.Sql<Record<string, unknown>> | undefined;
};

// Створюємо клієнт лише один раз
const conn = globalForDb.conn ?? postgres(connectionString, { 
  prepare: false, 
  ssl: "require",
  max: 15 // Ліміт на рівні клієнта
});

// Зберігаємо в глобальному об'єкті в dev
if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, { schema });