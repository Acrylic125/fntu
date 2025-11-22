import { Hono } from "hono";
import {
  openAPIRouteHandler,
  generateSpecs,
  describeRoute,
  resolver,
  validator,
  describeResponse,
} from "hono-openapi";
import { z } from "zod";
import { programsTable } from "../db/schema";
// import { db } from "./db";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { and, eq, gt, gte, ilike, like } from "drizzle-orm";
import { API_PARAMS } from "../open-api";
import { getDb } from "../db";

export const programsRoute = new Hono();

const GetProgramsSchema = z.object({
  search: z.string().optional(),
  cursor: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(20).default(20),
});

const GetProgramsResponseSchema = z.object({
  programs: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      code: z.string(),
      subCode: z.string(),
      year: z.number(),
    })
  ),
  pagination: z.object({
    nextCursor: z.string().nullable(),
  }),
});

programsRoute.get(
  "/",
  validator("query", GetProgramsSchema),
  describeRoute({
    parameters: API_PARAMS,
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(GetProgramsResponseSchema),
          },
        },
      },
    },
  }),
  async (c) => {
    const query = c.req.valid("query");
    const whereConditions = [];
    if (query.search) {
      whereConditions.push(ilike(programsTable.name, `%${query.search}%`));
    }
    if (query.cursor) {
      whereConditions.push(gte(programsTable.id, query.cursor));
    }
    const programs = await getDb()
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
      .limit(query.limit + 1)
      .orderBy(programsTable.id);
    // .offset(query.page * query.limit);
    return c.json({
      programs,
      pagination: {
        nextCursor:
          programs.length > query.limit
            ? programs[programs.length - 1].id
            : null,
      },
    });
  }
);

const GetProgramSchema = z.object({
  id: z.coerce.number(),
});

const GetProgramResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  subCode: z.string(),
  year: z.number(),
  type: z.string(),
});

programsRoute.get(
  "/:id",
  validator("param", GetProgramSchema),
  describeRoute({
    parameters: API_PARAMS,
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(GetProgramResponseSchema),
          },
        },
      },
      404: {
        description: "Program not found",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                error: z.literal("Program not found"),
              })
            ),
          },
        },
      },
    },
  }),
  async (c) => {
    const params = c.req.valid("param");

    const program = await getDb()
      .select()
      .from(programsTable)
      .where(eq(programsTable.id, params.id));
    if (program.length === 0) {
      return c.json({ error: "Program not found" }, 404);
    }
    return c.json(program[0]);
  }
);
