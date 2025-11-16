import { SQL, sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  unique,
  varchar,
  index,
  customType,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

export const tsvector = customType<{
  data: string;
}>({
  dataType() {
    return `tsvector`;
  },
});

export const programType = pgEnum("program_type", ["full_time", "part_time"]);

export const programsTable = pgTable(
  "programs",
  {
    id: serial().notNull().primaryKey(),
    name: varchar({ length: 128 }).notNull(),
    code: varchar({ length: 32 }).notNull(),
    subCode: varchar({ length: 32 }), //.notNull().default(""),
    year: integer(),
    type: programType().notNull(),
  },
  (t) => [unique("idx_code_subcode_year").on(t.code, t.subCode, t.year)]
);

export const coursesTable = pgTable(
  "courses",
  {
    id: serial().notNull().primaryKey(),
    code: varchar({ length: 32 }).notNull(),
    name: varchar({ length: 128 }).notNull(),
    au: integer().notNull(),
    ay: varchar({ length: 16 }).notNull(),
    semester: varchar({ length: 16 }).notNull(),
    searchText: tsvector("search_text")
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`setweight(to_tsvector('english', ${coursesTable.code}), 'A')
          ||
          setweight(to_tsvector('english', ${coursesTable.name}), 'B')`
      ),
    //  * Course is available as Unrestricted Elective
    isAvailableUE: boolean().notNull().default(false),
    //  ~ Course is available as Broadening and Deepening Elective
    isAvailableBD: boolean().notNull().default(false),
    //  # Course is available as General Education Prescribed Elective
    isAvailableGEPE: boolean().notNull().default(false),
    //  ^ Self - Paced Course
    isSelfPaced: boolean().notNull().default(false),
  },
  (t) => [
    unique("idx_code_ay_semester").on(t.code, t.ay, t.semester),
    index("idx_courses_search_text").using("gin", t.searchText),
  ]
);

export const courseIndexTable = pgTable(
  "course_index",
  {
    id: serial().notNull().primaryKey(),
    index: varchar({ length: 32 }).notNull(),
    courseId: integer()
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
  },
  (t) => [unique("idx_index_course").on(t.index, t.courseId)]
);

export const courseIndexSourcesTable = pgTable(
  "course_index_sources",
  {
    id: serial().notNull().primaryKey(),
    indexId: integer()
      .notNull()
      .references(() => courseIndexTable.id, { onDelete: "cascade" }),
    source: integer()
      .notNull()
      .references(() => programsTable.id, { onDelete: "cascade" }),
  },
  (t) => [unique("idx_index_source").on(t.indexId, t.source)]
);

export const courseIndexClassesTable = pgTable("course_index_classes", {
  id: serial().notNull().primaryKey(),
  indexId: integer()
    .notNull()
    .references(() => courseIndexTable.id, { onDelete: "cascade" }),
  timeFromHour: integer().notNull(),
  timeFromMinute: integer().notNull(),
  timeToHour: integer().notNull(),
  timeToMinute: integer().notNull(),
  venue: varchar({ length: 128 }).notNull(),
  day: integer().notNull(),
  type: varchar({ length: 32 }).notNull(),
  remarks: varchar({ length: 128 }).notNull(),
  weeks: integer().array().notNull(),
});

export const venuesTable = pgTable("venues", {
  id: serial().notNull().primaryKey(),
  venue: varchar({ length: 128 }).notNull(),
  area: varchar({ length: 128 }).notNull(),
  capacity: integer().notNull(),
  location: varchar({ length: 128 }).notNull(),
  bookableByStaff: boolean().notNull().default(false),
  bookableByStudentOrganizations: boolean().notNull().default(false),
  remarks: varchar({ length: 128 }),
});
