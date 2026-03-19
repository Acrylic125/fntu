import { v } from "convex/values";
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

export const insertPrograms = mutation({
  args: { rows: v.array(keyedProgram) },
  handler: async (ctx, args) => {
    const inserted = [];
    for (const row of args.rows) {
      const id = await ctx.db.insert("programs", row.doc);
      inserted.push({ key: row.key, id });
    }
    return inserted;
  },
});

export const insertCourses = mutation({
  args: { rows: v.array(keyedCourse) },
  handler: async (ctx, args) => {
    const inserted = [];
    for (const row of args.rows) {
      const id = await ctx.db.insert("courses", row.doc);
      inserted.push({ key: row.key, id });
    }
    return inserted;
  },
});

export const insertCampuses = mutation({
  args: { rows: v.array(keyedCampus) },
  handler: async (ctx, args) => {
    const inserted = [];
    for (const row of args.rows) {
      const id = await ctx.db.insert("campuses", row.doc);
      inserted.push({ key: row.key, id });
    }
    return inserted;
  },
});

export const insertLocationTypes = mutation({
  args: { rows: v.array(keyedLocationType) },
  handler: async (ctx, args) => {
    const inserted = [];
    for (const row of args.rows) {
      const id = await ctx.db.insert("location_types", row.doc);
      inserted.push({ key: row.key, id });
    }
    return inserted;
  },
});

export const insertCourseIndexes = mutation({
  args: { rows: v.array(keyedCourseIndex) },
  handler: async (ctx, args) => {
    const inserted = [];
    for (const row of args.rows) {
      const id = await ctx.db.insert("course_index", row.doc);
      inserted.push({ key: row.key, id });
    }
    return inserted;
  },
});

export const insertLocations = mutation({
  args: { rows: v.array(keyedLocation) },
  handler: async (ctx, args) => {
    const inserted = [];
    for (const row of args.rows) {
      const id = await ctx.db.insert("locations", row.doc);
      inserted.push({ key: row.key, id });
    }
    return inserted;
  },
});

export const insertCourseIndexSources = mutation({
  args: { rows: v.array(courseIndexSource) },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      await ctx.db.insert("course_index_sources", row);
    }
    return { inserted: args.rows.length };
  },
});

export const insertCourseIndexClasses = mutation({
  args: { rows: v.array(courseIndexClass) },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      await ctx.db.insert("course_index_classes", row);
    }
    return { inserted: args.rows.length };
  },
});

export const insertLocationTypeLocations = mutation({
  args: { rows: v.array(locationTypeLocation) },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      await ctx.db.insert("location_type_locations", row);
    }
    return { inserted: args.rows.length };
  },
});

export const insertLocationImages = mutation({
  args: { rows: v.array(locationImage) },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      await ctx.db.insert("location_images", row);
    }
    return { inserted: args.rows.length };
  },
});

export const insertLocationAltNames = mutation({
  args: { rows: v.array(locationAltName) },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      await ctx.db.insert("location_alt_names", row);
    }
    return { inserted: args.rows.length };
  },
});
