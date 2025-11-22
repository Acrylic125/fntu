import { drizzle } from "drizzle-orm/node-postgres";
// import postgres from "postgres";
import dotenv from "dotenv";
import { Pool } from "pg";
dotenv.config();

// NOTE: Using cloudflare workers, we need to create a fresh connection to the database for each request.
// This is to avoid I/O restricitons caused by the workers environment.
//
// https://developers.cloudflare.com/workers/tutorials/postgres/
// TODO: Comment out this function if you aren't using a serverless environment.
export function getDb() {
  const client = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle({ client });
  return db;
}

// TODO: Comment out the lines below if you aren't in a serverless environment.
// const client = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });
// export const db = drizzle({ client });

// export function getDb() {
//   return db;
// }
