import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const getDb = (dbUrl: string) => {
  const client = postgres(dbUrl, { prepare: false });
  const db = drizzle(client);
  return db;
};
