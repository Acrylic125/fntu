import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";
import {
  courseIndexClassesTable,
  courseIndexTable,
  coursesTable,
  programsTable,
} from "../db/schema";
// import { db } from "./db";
import { and, eq, gte, ilike, inArray } from "drizzle-orm";
import { API_PARAMS } from "../open-api";
import { getDb } from "../db";

export const coursesRoute = new Hono();

const AY_ENUM = ["25/26"] as const;
const AY_SEMESTER_VALUES = ["2", "1"] as const;

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
      ay: z.enum(AY_ENUM).default(AY_ENUM[0]),
      semester: z.enum(AY_SEMESTER_VALUES).default(AY_SEMESTER_VALUES[0]),
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

coursesRoute.get(
  "/:courseCode/index",
  validator("param", z.object({ courseCode: z.string() })),
  validator(
    "query",
    z.object({
      cursor: z.coerce.number().optional(),
      limit: z.coerce.number().min(1).max(20).default(20),
      ay: z.enum(AY_ENUM).default(AY_ENUM[0]),
      semester: z.enum(AY_SEMESTER_VALUES).default(AY_SEMESTER_VALUES[0]),
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
                courseIndices: z.array(
                  z.object({
                    id: z.number(),
                    index: z.string(),
                    classes: z.array(
                      z.object({
                        id: z.number(),
                        timeFromHour: z.number(),
                        timeFromMinute: z.number(),
                        timeToHour: z.number(),
                        timeToMinute: z.number(),
                        venue: z.string(),
                        day: z.number(),
                        type: z.string(),
                      })
                    ),
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
    const { courseCode } = c.req.valid("param");
    const query = c.req.valid("query");
    const courseIndices = await getDb()
      .select({
        id: courseIndexTable.id,
        index: courseIndexTable.index,
      })
      .from(courseIndexTable)
      .innerJoin(coursesTable, eq(courseIndexTable.courseId, coursesTable.id))
      .where(
        and(
          eq(coursesTable.code, courseCode),
          eq(coursesTable.ay, query.ay),
          eq(coursesTable.semester, query.semester)
        )
      )
      .limit(query.limit + 1)
      .orderBy(courseIndexTable.id);

    const courseIndexIds = courseIndices.map((courseIndex) => courseIndex.id);
    const courseIndexClasses = await getDb()
      .select({
        indexId: courseIndexClassesTable.indexId,
        timeFromHour: courseIndexClassesTable.timeFromHour,
        timeFromMinute: courseIndexClassesTable.timeFromMinute,
        timeToHour: courseIndexClassesTable.timeToHour,
        timeToMinute: courseIndexClassesTable.timeToMinute,
        venue: courseIndexClassesTable.venue,
        day: courseIndexClassesTable.day,
        type: courseIndexClassesTable.type,
      })
      .from(courseIndexClassesTable)
      .innerJoin(
        courseIndexTable,
        eq(courseIndexClassesTable.indexId, courseIndexTable.id)
      )
      .where(inArray(courseIndexTable.id, courseIndexIds));

    const courseIndexClassesMap = new Map<
      number,
      (typeof courseIndexClasses)[number][]
    >();
    for (const courseIndexClass of courseIndexClasses) {
      const currentClasses =
        courseIndexClassesMap.get(courseIndexClass.indexId) ?? [];
      currentClasses.push(courseIndexClass);
      courseIndexClassesMap.set(courseIndexClass.indexId, currentClasses);
    }

    const courseIndexClassesWithClasses = courseIndices.map((courseIndex) => {
      const classes = courseIndexClassesMap.get(courseIndex.id) ?? [];
      return {
        ...courseIndex,
        classes,
      };
    });
    return c.json({
      courseIndices: courseIndexClassesWithClasses,
      pagination: {
        nextCursor:
          courseIndices.length > query.limit
            ? courseIndices[courseIndices.length - 1].id
            : null,
      },
    });
  }
);
