import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config();

export const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client);

// import { neon } from "@neondatabase/serverless";
// import { drizzle } from "drizzle-orm/neon-http";

// const sql = neon(process.env.DATABASE_URL!);
// export const db = drizzle({ client: sql });
