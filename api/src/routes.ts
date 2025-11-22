import { Hono } from "hono";
import {
  openAPIRouteHandler,
  generateSpecs,
  describeRoute,
  resolver,
  validator,
} from "hono-openapi";
import { z } from "zod";
import { programsTable } from "./db/schema";
// import { db } from "./db";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { and, eq } from "drizzle-orm";

const GetProgramsSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(20).default(20),
});

export const programsRoute = new Hono();
programsRoute.get(
  "/",
  validator("query", GetProgramsSchema),
  describeRoute({
    parameters: [
      {
        name: "X-API-Key",
        in: "header",
        required: true,
        description:
          "The API key to use for the request. Please sign in and register for an API key.",
        schema: {
          type: "string",
        },
      },
    ],
  }),
  async (c) => {
    const query = c.req.valid("query");
    const whereConditions = [];
    if (query.search) {
      whereConditions.push(eq(programsTable.name, query.search));
    }
    const client = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const db = drizzle({ client });
    const programs = await db
      .select({
        id: programsTable.id,
        name: programsTable.name,
        code: programsTable.code,
        subCode: programsTable.subCode,
        year: programsTable.year,
        type: programsTable.type,
      })
      .from(programsTable)
      .where(and(...whereConditions))
      .limit(query.limit)
      .offset(query.page * query.limit);
    return c.json(programs);
  }
);
