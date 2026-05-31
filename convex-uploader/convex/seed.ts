import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation } from "./_generated/server";

const programType = v.union(v.literal("full_time"), v.literal("part_time"));

const keyedProgram = v.object({
  key: v.string(),
  doc: v.object({
    name: v.string(),
    code: v.string(),
    subCode: v.optional(v.string()),
    year: v.optional(v.number()),
    type: programType,
  }),
});

const keyedCourse = v.object({
  key: v.string(),
  doc: v.object({
    code: v.string(),
    name: v.string(),
    au: v.number(),
    ay: v.string(),
    semester: v.string(),
    searchText: v.string(),
    isAvailableUE: v.boolean(),
    isAvailableBD: v.boolean(),
    isAvailableGEPE: v.boolean(),
    isSelfPaced: v.boolean(),
  }),
});

const keyedCampus = v.object({
  key: v.string(),
  doc: v.object({
    name: v.string(),
    mazeMapCampusId: v.number(),
  }),
});

const keyedLocationType = v.object({
  key: v.string(),
  doc: v.object({
    name: v.string(),
  }),
});

const keyedCourseIndex = v.object({
  key: v.string(),
  doc: v.object({
    index: v.string(),
    courseId: v.id("courses"),
  }),
});

const keyedLocation = v.object({
  key: v.string(),
  doc: v.object({
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    building: v.optional(v.string()),
    floorName: v.optional(v.string()),
    campusId: v.id("campuses"),
    latitude: v.number(),
    longitude: v.number(),
    z: v.optional(v.number()),
    mazeMapPoiId: v.number(),
    mazeMapIdentifier: v.optional(v.string()),
  }),
});

const courseIndexSource = v.object({
  indexId: v.id("course_index"),
  source: v.id("programs"),
});

const courseIndexClass = v.object({
  indexId: v.id("course_index"),
  timeFromHour: v.number(),
  timeFromMinute: v.number(),
  timeToHour: v.number(),
  timeToMinute: v.number(),
  venue: v.string(),
  day: v.number(),
  type: v.string(),
  remarks: v.string(),
  weeks: v.array(v.number()),
});

const locationTypeLocation = v.object({
  locationId: v.id("locations"),
  typeId: v.id("location_types"),
});

const locationImage = v.object({
  locationId: v.id("locations"),
  imageUrl: v.string(),
});

const locationAltName = v.object({
  locationId: v.id("locations"),
  altName: v.string(),
});

const keyedInsertResult = <T extends string>(table: T) =>
  v.array(
    v.object({
      key: v.string(),
      id: v.id(table),
    })
  );

function weeksEqual(left: number[], right: number[]): boolean {
  return (
    left.length === right.length &&
    left.every((week, index) => week === right[index])
  );
}

function courseIndexClassMatches(
  existing: Doc<"course_index_classes">,
  row: {
    indexId: Id<"course_index">;
    timeFromHour: number;
    timeFromMinute: number;
    timeToHour: number;
    timeToMinute: number;
    venue: string;
    day: number;
    type: string;
    remarks: string;
    weeks: number[];
  }
): boolean {
  return (
    existing.indexId === row.indexId &&
    existing.timeFromHour === row.timeFromHour &&
    existing.timeFromMinute === row.timeFromMinute &&
    existing.timeToHour === row.timeToHour &&
    existing.timeToMinute === row.timeToMinute &&
    existing.venue === row.venue &&
    existing.day === row.day &&
    existing.type === row.type &&
    existing.remarks === row.remarks &&
    weeksEqual(existing.weeks, row.weeks)
  );
}

async function findOrInsertProgram(
  ctx: MutationCtx,
  doc: {
    name: string;
    code: string;
    subCode?: string;
    year?: number;
    type: "full_time" | "part_time";
  }
): Promise<Id<"programs">> {
  const matches = await ctx.db
    .query("programs")
    .withIndex("by_code_subCode_year", (q) =>
      q.eq("code", doc.code).eq("subCode", doc.subCode).eq("year", doc.year)
    )
    .collect();
  const existing = matches.find((row) => row.type === doc.type);
  return existing?._id ?? (await ctx.db.insert("programs", doc));
}

async function findOrInsertCourse(
  ctx: MutationCtx,
  doc: {
    code: string;
    name: string;
    au: number;
    ay: string;
    semester: string;
    searchText: string;
    isAvailableUE: boolean;
    isAvailableBD: boolean;
    isAvailableGEPE: boolean;
    isSelfPaced: boolean;
  }
): Promise<Id<"courses">> {
  const existing = await ctx.db
    .query("courses")
    .withIndex("by_code_ay_semester", (q) =>
      q.eq("code", doc.code).eq("ay", doc.ay).eq("semester", doc.semester)
    )
    .first();
  return existing?._id ?? (await ctx.db.insert("courses", doc));
}

async function findOrInsertCampus(
  ctx: MutationCtx,
  doc: { name: string; mazeMapCampusId: number }
): Promise<Id<"campuses">> {
  const existing = await ctx.db
    .query("campuses")
    .withIndex("by_name", (q) => q.eq("name", doc.name))
    .first();
  return existing?._id ?? (await ctx.db.insert("campuses", doc));
}

async function findOrInsertLocationType(
  ctx: MutationCtx,
  doc: { name: string }
): Promise<Id<"location_types">> {
  const existing = await ctx.db
    .query("location_types")
    .withIndex("by_name", (q) => q.eq("name", doc.name))
    .first();
  return existing?._id ?? (await ctx.db.insert("location_types", doc));
}

async function findOrInsertCourseIndex(
  ctx: MutationCtx,
  doc: { index: string; courseId: Id<"courses"> }
): Promise<Id<"course_index">> {
  const existing = await ctx.db
    .query("course_index")
    .withIndex("by_index_courseId", (q) =>
      q.eq("index", doc.index).eq("courseId", doc.courseId)
    )
    .first();
  return existing?._id ?? (await ctx.db.insert("course_index", doc));
}

async function findOrInsertLocation(
  ctx: MutationCtx,
  doc: {
    name?: string;
    description?: string;
    building?: string;
    floorName?: string;
    campusId: Id<"campuses">;
    latitude: number;
    longitude: number;
    z?: number;
    mazeMapPoiId: number;
    mazeMapIdentifier?: string;
  }
): Promise<Id<"locations">> {
  const existing = await ctx.db
    .query("locations")
    .withIndex("by_mazeMapPoiId", (q) => q.eq("mazeMapPoiId", doc.mazeMapPoiId))
    .first();
  return existing?._id ?? (await ctx.db.insert("locations", doc));
}

async function insertCourseIndexClassIfMissing(
  ctx: MutationCtx,
  row: {
    indexId: Id<"course_index">;
    timeFromHour: number;
    timeFromMinute: number;
    timeToHour: number;
    timeToMinute: number;
    venue: string;
    day: number;
    type: string;
    remarks: string;
    weeks: number[];
  }
): Promise<boolean> {
  const candidates = await ctx.db
    .query("course_index_classes")
    .withIndex("by_indexId", (q) => q.eq("indexId", row.indexId))
    .collect();
  if (candidates.some((existing) => courseIndexClassMatches(existing, row))) {
    return false;
  }
  await ctx.db.insert("course_index_classes", row);
  return true;
}

async function insertLocationTypeLocationIfMissing(
  ctx: MutationCtx,
  row: { locationId: Id<"locations">; typeId: Id<"location_types"> }
): Promise<boolean> {
  const existing = await ctx.db
    .query("location_type_locations")
    .withIndex("by_locationId_typeId", (q) =>
      q.eq("locationId", row.locationId).eq("typeId", row.typeId)
    )
    .first();
  if (existing) {
    return false;
  }
  await ctx.db.insert("location_type_locations", row);
  return true;
}

async function insertLocationImageIfMissing(
  ctx: MutationCtx,
  row: { locationId: Id<"locations">; imageUrl: string }
): Promise<boolean> {
  const existing = await ctx.db
    .query("location_images")
    .withIndex("by_locationId_imageUrl", (q) =>
      q.eq("locationId", row.locationId).eq("imageUrl", row.imageUrl)
    )
    .first();
  if (existing) {
    return false;
  }
  await ctx.db.insert("location_images", row);
  return true;
}

async function insertLocationAltNameIfMissing(
  ctx: MutationCtx,
  row: { locationId: Id<"locations">; altName: string }
): Promise<boolean> {
  const candidates = await ctx.db
    .query("location_alt_names")
    .withIndex("by_locationId", (q) => q.eq("locationId", row.locationId))
    .collect();
  if (candidates.some((existing) => existing.altName === row.altName)) {
    return false;
  }
  await ctx.db.insert("location_alt_names", row);
  return true;
}

export const insertPrograms = mutation({
  args: { rows: v.array(keyedProgram) },
  returns: keyedInsertResult("programs"),
  handler: async (ctx, args) => {
    const inserted: { key: string; id: Id<"programs"> }[] = [];
    for (const row of args.rows) {
      const id = await findOrInsertProgram(ctx, row.doc);
      inserted.push({ key: row.key, id });
    }
    return inserted;
  },
});

export const insertCourses = mutation({
  args: { rows: v.array(keyedCourse) },
  returns: keyedInsertResult("courses"),
  handler: async (ctx, args) => {
    const inserted: { key: string; id: Id<"courses"> }[] = [];
    for (const row of args.rows) {
      const id = await findOrInsertCourse(ctx, row.doc);
      inserted.push({ key: row.key, id });
    }
    return inserted;
  },
});

export const insertCampuses = mutation({
  args: { rows: v.array(keyedCampus) },
  returns: keyedInsertResult("campuses"),
  handler: async (ctx, args) => {
    const inserted: { key: string; id: Id<"campuses"> }[] = [];
    for (const row of args.rows) {
      const id = await findOrInsertCampus(ctx, row.doc);
      inserted.push({ key: row.key, id });
    }
    return inserted;
  },
});

export const insertLocationTypes = mutation({
  args: { rows: v.array(keyedLocationType) },
  returns: keyedInsertResult("location_types"),
  handler: async (ctx, args) => {
    const inserted: { key: string; id: Id<"location_types"> }[] = [];
    for (const row of args.rows) {
      const id = await findOrInsertLocationType(ctx, row.doc);
      inserted.push({ key: row.key, id });
    }
    return inserted;
  },
});

export const insertCourseIndexes = mutation({
  args: { rows: v.array(keyedCourseIndex) },
  returns: keyedInsertResult("course_index"),
  handler: async (ctx, args) => {
    const inserted: { key: string; id: Id<"course_index"> }[] = [];
    for (const row of args.rows) {
      const id = await findOrInsertCourseIndex(ctx, row.doc);
      inserted.push({ key: row.key, id });
    }
    return inserted;
  },
});

export const insertLocations = mutation({
  args: { rows: v.array(keyedLocation) },
  returns: keyedInsertResult("locations"),
  handler: async (ctx, args) => {
    const inserted: { key: string; id: Id<"locations"> }[] = [];
    for (const row of args.rows) {
      const id = await findOrInsertLocation(ctx, row.doc);
      inserted.push({ key: row.key, id });
    }
    return inserted;
  },
});

const insertCountResult = v.object({ inserted: v.number() });

export const insertCourseIndexSources = mutation({
  args: { rows: v.array(courseIndexSource) },
  returns: insertCountResult,
  handler: async () => {
    return { inserted: 0 };
  },
});

export const insertCourseIndexClasses = mutation({
  args: { rows: v.array(courseIndexClass) },
  returns: insertCountResult,
  handler: async (ctx, args) => {
    let inserted = 0;
    for (const row of args.rows) {
      if (await insertCourseIndexClassIfMissing(ctx, row)) {
        inserted += 1;
      }
    }
    return { inserted };
  },
});

export const insertLocationTypeLocations = mutation({
  args: { rows: v.array(locationTypeLocation) },
  returns: insertCountResult,
  handler: async (ctx, args) => {
    let inserted = 0;
    for (const row of args.rows) {
      if (await insertLocationTypeLocationIfMissing(ctx, row)) {
        inserted += 1;
      }
    }
    return { inserted };
  },
});

export const insertLocationImages = mutation({
  args: { rows: v.array(locationImage) },
  returns: insertCountResult,
  handler: async (ctx, args) => {
    let inserted = 0;
    for (const row of args.rows) {
      if (await insertLocationImageIfMissing(ctx, row)) {
        inserted += 1;
      }
    }
    return { inserted };
  },
});

export const insertLocationAltNames = mutation({
  args: { rows: v.array(locationAltName) },
  returns: insertCountResult,
  handler: async (ctx, args) => {
    let inserted = 0;
    for (const row of args.rows) {
      if (await insertLocationAltNameIfMissing(ctx, row)) {
        inserted += 1;
      }
    }
    return { inserted };
  },
});
