import { drizzle } from "drizzle-orm/node-postgres";
// import postgres from "postgres";
import dotenv from "dotenv";
import { Client, Pool } from "pg";
dotenv.config();

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });
// const client = new Client({
//   connectionString: process.env.DATABASE_URL,
// });
// export const db = drizzle({ client });
