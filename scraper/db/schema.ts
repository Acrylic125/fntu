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
  real,
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

export const locationsTable = pgTable("locations", {
  id: serial().notNull().primaryKey(),
  name: varchar({ length: 255 }),
  description: varchar({ length: 1024 }),
  building: varchar({ length: 255 }),
  floorName: varchar({ length: 64 }),
  campusId: integer()
    .notNull()
    .references(() => campusTable.id, { onDelete: "cascade" }),
  latitude: real().notNull(),
  longitude: real().notNull(),
  z: real(),
  mazeMapPoiId: integer().unique().notNull(),
  mazeMapIdentifier: varchar({ length: 64 }),
});

export const campusTable = pgTable(
  "campuses",
  {
    id: serial().notNull().primaryKey(),
    name: varchar({ length: 32 }).notNull(),
    mazeMapCampusId: integer().notNull(),
  },
  (t) => [unique("idx_campuses_name").on(t.name)]
);

export const locationTypesTable = pgTable(
  "location_types",
  {
    id: serial().notNull().primaryKey(),
    name: varchar({ length: 32 }).notNull(),
  },
  (t) => [unique("idx_location_types_name").on(t.name)]
);

export const locationTypeLocationsTable = pgTable(
  "location_type_locations",
  {
    id: serial().notNull().primaryKey(),
    locationId: integer()
      .notNull()
      .references(() => locationsTable.id, { onDelete: "cascade" }),
    typeId: integer()
      .notNull()
      .references(() => locationTypesTable.id, { onDelete: "cascade" }),
  },
  (t) => [
    unique("idx_location_type_locations_locationId_typeId").on(
      t.locationId,
      t.typeId
    ),
  ]
);

export const locationImagesTable = pgTable(
  "location_images",
  {
    id: serial().notNull().primaryKey(),
    locationId: integer()
      .notNull()
      .references(() => locationsTable.id, { onDelete: "cascade" }),
    imageUrl: varchar({ length: 256 }).notNull(),
  },
  (t) => [
    unique("idx_location_images_locationId_imageUrl").on(
      t.locationId,
      t.imageUrl
    ),
  ]
);

// Alt names for locations. We have tried using an array of varchar(255) but it was too slow.
export const locationAltNamesTable = pgTable(
  "location_alt_names",
  {
    id: serial().notNull().primaryKey(),
    locationId: integer()
      .notNull()
      .references(() => locationsTable.id, { onDelete: "cascade" }),
    altName: varchar({ length: 255 }).notNull(),
  },
  (t) => [index("idx_location_alt_names_altName").on(t.altName)]
);

// export const locationGeometryTable = pgTable(
//   "location_geometry",
//   {
//     id: serial().notNull().primaryKey(),
//     locationId: integer()
//       .notNull()
//       .references(() => locationsTable.id, { onDelete: "cascade" }),
//     // Low means first, high means last.
//     order: integer().notNull(),
//     longitude: real().notNull(),
//     latitude: real().notNull(),
//   },
//   (t) => [
//     unique("idx_location_geometry_locationId_order").on(t.locationId, t.order),
//   ]
// );
