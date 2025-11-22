import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";
import { coursesTable, programsTable } from "../db/schema";
// import { db } from "./db";
import { and, eq, gte, ilike } from "drizzle-orm";
import { API_PARAMS } from "../open-api";
import { getDb } from "../db";

export const coursesRoute = new Hono();

coursesRoute.get(
  "/ay",
  describeRoute({
    parameters: API_PARAMS,
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(
              z.array(
                z.object({
                  ay: z.string(),
                  semester: z.string(),
                })
              )
            ),
          },
        },
      },
    },
  }),
  async (c) => {
    const acadYears = await getDb()
      .select({
        ay: coursesTable.ay,
        semester: coursesTable.semester,
      })
      .from(coursesTable)
      .groupBy(coursesTable.ay, coursesTable.semester);
    return c.json(acadYears);
  }
);

coursesRoute.get(
  "/",
  validator(
    "query",
    z.object({
      search: z.string().optional(),
      ay: z.enum(["25/26"]).optional(),
      semester: z.enum(["1", "2"]).optional(),
      cursor: z.coerce.number().optional(),
      limit: z.coerce.number().min(1).max(20).default(20),
    })
  ),
  describeRoute({
    parameters: API_PARAMS,
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                courses: z.array(
                  z.object({
                    id: z.number(),
                    name: z.string(),
                    code: z.string(),
                    subCode: z.string(),
                    year: z.number(),
                  })
                ),
              })
            ),
          },
        },
      },
    },
  }),
  async (c) => {
    const query = c.req.valid("query");
    const whereConditions = [];
    if (query.search) {
      whereConditions.push(ilike(coursesTable.name, `%${query.search}%`));
    }
    if (query.cursor) {
      whereConditions.push(gte(coursesTable.id, query.cursor));
    }
    if (query.ay) {
      whereConditions.push(eq(coursesTable.ay, query.ay));
    }
    if (query.semester) {
      whereConditions.push(eq(coursesTable.semester, query.semester));
    }
    const courses = await getDb()
      .select({
        id: coursesTable.id,
        name: coursesTable.name,
        code: coursesTable.code,
        au: coursesTable.au,
        ay: coursesTable.ay,
        semester: coursesTable.semester,
      })
      .from(coursesTable)
      .where(and(...whereConditions))
      .limit(query.limit + 1)
      .orderBy(coursesTable.id);
    // .offset(query.page * query.limit);
    return c.json({
      courses,
      pagination: {
        nextCursor:
          courses.length > query.limit ? courses[courses.length - 1].id : null,
      },
    });
  }
);

coursesRoute.get(
  "/:id",
  validator("param", z.object({ id: z.coerce.number() })),
  describeRoute({
    parameters: API_PARAMS,
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                id: z.number(),
                name: z.string(),
                code: z.string(),
                au: z.number(),
                ay: z.string(),
                semester: z.string(),
              })
            ),
          },
        },
      },
      404: {
        description: "Course not found",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                error: z.literal("Course not found"),
              })
            ),
          },
        },
      },
    },
  }),
  async (c) => {
    const params = c.req.valid("param");

    const course = await getDb()
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, params.id));
    if (course.length === 0) {
      return c.json({ error: "Course not found" }, 404);
    }
    return c.json(course[0]);
  }
);
