/// <reference types="node" />

import { ConvexHttpClient } from "convex/browser";
import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import z from "zod";
import type { Id, TableNames } from "./convex/_generated/dataModel.js";

const Days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const courseFlags = ["*", "~", "^", "#"];

const ProgramTypeSchema = z.enum(["full_time", "part_time"]);

const BundleSchema = z.object({
  version: z.literal("1"),
  locationsFilePath: z.string(),
  coursesPaths: z
    .object({
      allSchedulesPath: z.string(),
      programsPath: z.string(),
      aySem: z.object({
        ay: z.string(),
        sem: z.string(),
      }),
    })
    .array(),
});

const ProgramSchema = z.object({
  code: z.string(),
  name: z.string(),
  subCode: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  type: ProgramTypeSchema,
  ref: z.string().nullable().optional(),
});

const CourseClassSchema = z.object({
  type: z.string(),
  day: z.string(),
  timeFrom: z.object({
    hour: z.number(),
    minute: z.number(),
  }),
  timeTo: z.object({
    hour: z.number(),
    minute: z.number(),
  }),
  venue: z.string(),
  weeks: z.number().array(),
  remarks: z.string(),
});

const CourseSourceSchema = z.object({
  code: z.string(),
  subCode: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  type: ProgramTypeSchema,
  ref: z.string().nullable().optional(),
});

const CourseIndexSchema = z.object({
  index: z.string(),
  classes: CourseClassSchema.array(),
  sources: CourseSourceSchema.array(),
});

const CourseScheduleSchema = z.object({
  course: z.object({
    code: z.string(),
    name: z.string(),
  }),
  au: z.number(),
  indices: CourseIndexSchema.array(),
});

const LocationTypeSchema = z
  .object({
    name: z.string(),
  })
  .passthrough();

const LocationImageSchema = z.union([
  z.string(),
  z
    .object({
      url: z.string().optional(),
      imageUrl: z.string().optional(),
      src: z.string().optional(),
    })
    .passthrough(),
]);

const LocationSchema = z.object({
  poiId: z.number(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  floorName: z.string().nullable().optional(),
  buildingName: z.string().nullable().optional(),
  identifier: z.string().nullable().optional(),
  z: z.number().nullable().optional(),
  point: z.object({
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  campus: z.object({
    campusId: z.number(),
    name: z.string(),
  }),
  infos: z
    .object({
      name: z.string().nullable().optional(),
    })
    .array()
    .optional(),
  types: LocationTypeSchema.array(),
  images: LocationImageSchema.array().default([]),
  altNames: z.string().array().default([]),
});

type Program = z.infer<typeof ProgramSchema>;
type CourseSchedule = z.infer<typeof CourseScheduleSchema>;
type Location = z.infer<typeof LocationSchema>;

type ProgramDoc = {
  name: string;
  code: string;
  subCode?: string;
  year?: number;
  type: z.infer<typeof ProgramTypeSchema>;
};

type CourseDoc = {
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
};

type CampusDoc = {
  name: string;
  mazeMapCampusId: number;
};

type LocationTypeDoc = {
  name: string;
};

type CourseIndexDoc = {
  index: string;
};

type LocationDoc = {
  name?: string;
  description?: string;
  building?: string;
  floorName?: string;
  latitude: number;
  longitude: number;
  z?: number;
  mazeMapPoiId: number;
  mazeMapIdentifier?: string;
};

type CourseIndexClassDoc = {
  timeFromHour: number;
  timeFromMinute: number;
  timeToHour: number;
  timeToMinute: number;
  venue: string;
  day: number;
  type: string;
  remarks: string;
  weeks: number[];
};

type PendingProgram = {
  key: string;
  doc: ProgramDoc;
};

type PendingCourse = {
  key: string;
  doc: CourseDoc;
};

type PendingCampus = {
  key: string;
  doc: CampusDoc;
};

type PendingLocationType = {
  key: string;
  doc: LocationTypeDoc;
};

type PendingCourseIndex = {
  key: string;
  courseKey: string;
  doc: CourseIndexDoc;
};

type PendingLocation = {
  key: string;
  campusKey: string;
  doc: LocationDoc;
};

type PendingCourseIndexSource = {
  key: string;
  indexKey: string;
  programKey: string;
};

type PendingCourseIndexClass = {
  key: string;
  indexKey: string;
  doc: CourseIndexClassDoc;
};

type PendingLocationTypeLocation = {
  key: string;
  locationKey: string;
  typeKey: string;
};

type PendingLocationImage = {
  key: string;
  locationKey: string;
  imageUrl: string;
};

type PendingLocationAltName = {
  key: string;
  locationKey: string;
  altName: string;
};

type UploadPlan = {
  programs: PendingProgram[];
  courses: PendingCourse[];
  campuses: PendingCampus[];
  locationTypes: PendingLocationType[];
  courseIndexes: PendingCourseIndex[];
  locations: PendingLocation[];
  courseIndexSources: PendingCourseIndexSource[];
  courseIndexClasses: PendingCourseIndexClass[];
  locationTypeLocations: PendingLocationTypeLocation[];
  locationImages: PendingLocationImage[];
  locationAltNames: PendingLocationAltName[];
};

const seedFunctions = {
  insertPrograms: "seed:insertPrograms",
  insertCourses: "seed:insertCourses",
  insertCampuses: "seed:insertCampuses",
  insertLocationTypes: "seed:insertLocationTypes",
  insertCourseIndexes: "seed:insertCourseIndexes",
  insertLocations: "seed:insertLocations",
  insertCourseIndexSources: "seed:insertCourseIndexSources",
  insertCourseIndexClasses: "seed:insertCourseIndexClasses",
  insertLocationTypeLocations: "seed:insertLocationTypeLocations",
  insertLocationImages: "seed:insertLocationImages",
  insertLocationAltNames: "seed:insertLocationAltNames",
} as const;

function readJsonFile<T>(filePath: string, schema: z.ZodType<T>): T {
  return schema.parse(JSON.parse(fs.readFileSync(filePath, "utf8")));
}

function* batchIteration(batchSize: number, total: number) {
  for (let start = 0; start < total; start += batchSize) {
    yield { start, end: Math.min(start + batchSize, total) };
  }
}

function normalizeOptionalString(
  value: string | null | undefined
): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function extractCourseNameAndFlags(name: string) {
  const flags: string[] = [];
  let firstFlagIndex = -1;

  for (let i = name.length - 1; i >= 0; i--) {
    const char = name[i];
    if (courseFlags.includes(char)) {
      firstFlagIndex = i;
      flags.push(char);
    } else {
      break;
    }
  }

  return {
    name: firstFlagIndex === -1 ? name : name.slice(0, firstFlagIndex),
    flags: {
      isAvailableUE: flags.includes("*"),
      isAvailableBD: flags.includes("~"),
      isSelfPaced: flags.includes("^"),
      isAvailableGEPE: flags.includes("#"),
    },
  };
}

function mercatorToLatLon(
  x: number,
  y: number
): { latitude: number; longitude: number } {
  const R = 6378137;
  const longitude = (x / R) * (180 / Math.PI);
  const latitude =
    (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
  return { latitude, longitude };
}

function dayToIndex(day: string): number {
  const normalized = day.trim().toUpperCase();
  const index = Days.indexOf(normalized as (typeof Days)[number]);
  if (index === -1) {
    throw new Error(`Invalid day: ${day}`);
  }
  return index;
}

function programToKey(program: {
  code: string;
  subCode?: string | null;
  year?: number | null;
  type: z.infer<typeof ProgramTypeSchema>;
}) {
  return `${program.code}-${program.subCode ?? "__NULL__"}-${program.year ?? "__NULL__"}-${program.type}`;
}

function courseToKey(code: string, ay: string, semester: string) {
  return `${code}|${ay}|${semester}`;
}

function courseIndexToKey(courseKey: string, index: string) {
  return `${courseKey}|${index}`;
}

function campusToKey(campusId: number, name: string) {
  return `${campusId}|${name}`;
}

function locationTypeToKey(name: string) {
  return name.trim().toLowerCase();
}

function locationToKey(poiId: number) {
  return String(poiId);
}

function getImageUrl(
  image: z.infer<typeof LocationImageSchema>
): string | undefined {
  if (typeof image === "string") {
    return image;
  }
  return image.url ?? image.imageUrl ?? image.src;
}

function getLocationName(location: {
  title?: string | null;
  infos?: { name?: string | null }[];
  altNames?: string[];
}): string | undefined {
  const infoName = (location.infos ?? [])
    .map((info) => normalizeOptionalString(info.name))
    .find((value): value is string => Boolean(value));
  const altName = (location.altNames ?? [])
    .map((value) => normalizeOptionalString(value))
    .find((value): value is string => Boolean(value));

  return normalizeOptionalString(location.title) ?? infoName ?? altName;
}

function buildUploadPlan(downloadDir: string): UploadPlan {
  const bundlePath = path.resolve(downloadDir, "bundle.json");
  if (!fs.existsSync(bundlePath)) {
    throw new Error(`Bundle file not found at ${bundlePath}`);
  }

  const bundle = readJsonFile(bundlePath, BundleSchema);

  const programs = new Map<string, PendingProgram>();
  const courses = new Map<string, PendingCourse>();
  const campuses = new Map<string, PendingCampus>();
  const locationTypes = new Map<string, PendingLocationType>();
  const courseIndexes = new Map<string, PendingCourseIndex>();
  const locations = new Map<string, PendingLocation>();
  const courseIndexSources = new Map<string, PendingCourseIndexSource>();
  const courseIndexClasses = new Map<string, PendingCourseIndexClass>();
  const locationTypeLocations = new Map<string, PendingLocationTypeLocation>();
  const locationImages = new Map<string, PendingLocationImage>();
  const locationAltNames = new Map<string, PendingLocationAltName>();

  const programLookupKeyToNaturalKey = new Map<string, string>();

  for (const coursePath of bundle.coursesPaths) {
    const programsPath = path.resolve(downloadDir, coursePath.programsPath);
    const schedulesPath = path.resolve(
      downloadDir,
      coursePath.allSchedulesPath
    );

    const sourcePrograms = readJsonFile(programsPath, ProgramSchema.array());
    const schedules = readJsonFile(schedulesPath, CourseScheduleSchema.array());

    for (const program of sourcePrograms) {
      const key = programToKey(program);
      programs.set(key, {
        key,
        doc: {
          name: program.name,
          code: program.code,
          ...(normalizeOptionalString(program.subCode)
            ? { subCode: normalizeOptionalString(program.subCode) }
            : {}),
          ...(program.year != null ? { year: program.year } : {}),
          type: program.type,
        },
      });

      programLookupKeyToNaturalKey.set(key, key);
      if (program.ref) {
        programLookupKeyToNaturalKey.set(program.ref, key);
      }
    }

    for (const course of schedules) {
      const { name, flags } = extractCourseNameAndFlags(course.course.name);
      const courseKey = courseToKey(
        course.course.code,
        coursePath.aySem.ay,
        coursePath.aySem.sem
      );

      courses.set(courseKey, {
        key: courseKey,
        doc: {
          code: course.course.code,
          name,
          au: course.au,
          ay: coursePath.aySem.ay,
          semester: coursePath.aySem.sem,
          searchText: `${course.course.code} ${name}`,
          isAvailableUE: flags.isAvailableUE,
          isAvailableBD: flags.isAvailableBD,
          isAvailableGEPE: flags.isAvailableGEPE,
          isSelfPaced: flags.isSelfPaced,
        },
      });

      for (const index of course.indices) {
        const indexKey = courseIndexToKey(courseKey, index.index);
        courseIndexes.set(indexKey, {
          key: indexKey,
          courseKey,
          doc: {
            index: index.index,
          },
        });

        for (const source of index.sources) {
          const sourceLookupKeys = [source.ref, programToKey(source)].filter(
            (value): value is string => Boolean(value)
          );
          const programKey = sourceLookupKeys
            .map((lookupKey) => programLookupKeyToNaturalKey.get(lookupKey))
            .find((value): value is string => Boolean(value));

          if (!programKey) {
            throw new Error(
              `Program ${JSON.stringify(source)} not found while preparing index sources`
            );
          }

          const sourceKey = `${indexKey}|${programKey}`;
          courseIndexSources.set(sourceKey, {
            key: sourceKey,
            indexKey,
            programKey,
          });
        }

        for (const courseClass of index.classes) {
          const classKey = [
            indexKey,
            courseClass.type,
            courseClass.day,
            courseClass.timeFrom.hour,
            courseClass.timeFrom.minute,
            courseClass.timeTo.hour,
            courseClass.timeTo.minute,
            courseClass.venue,
            courseClass.remarks,
            courseClass.weeks.join(","),
          ].join("|");

          courseIndexClasses.set(classKey, {
            key: classKey,
            indexKey,
            doc: {
              timeFromHour: courseClass.timeFrom.hour,
              timeFromMinute: courseClass.timeFrom.minute,
              timeToHour: courseClass.timeTo.hour,
              timeToMinute: courseClass.timeTo.minute,
              venue: courseClass.venue,
              day: dayToIndex(courseClass.day),
              type: courseClass.type,
              remarks: courseClass.remarks,
              weeks: courseClass.weeks,
            },
          });
        }
      }
    }
  }

  const locationsPath = path.resolve(downloadDir, bundle.locationsFilePath);
  const rawLocations = readJsonFile(locationsPath, LocationSchema.array());

  for (const location of rawLocations) {
    const campusKey = campusToKey(
      location.campus.campusId,
      location.campus.name
    );
    campuses.set(campusKey, {
      key: campusKey,
      doc: {
        name: location.campus.name,
        mazeMapCampusId: location.campus.campusId,
      },
    });

    const { latitude, longitude } = mercatorToLatLon(
      location.point.coordinates[0],
      location.point.coordinates[1]
    );
    const locationKey = locationToKey(location.poiId);
    const locationName = getLocationName(location);

    locations.set(locationKey, {
      key: locationKey,
      campusKey,
      doc: {
        ...(locationName ? { name: locationName } : {}),
        ...(normalizeOptionalString(location.description)
          ? {
              description: normalizeOptionalString(location.description),
            }
          : {}),
        ...(normalizeOptionalString(location.buildingName)
          ? {
              building: normalizeOptionalString(location.buildingName),
            }
          : {}),
        ...(normalizeOptionalString(location.floorName)
          ? {
              floorName: normalizeOptionalString(location.floorName),
            }
          : {}),
        latitude,
        longitude,
        ...(location.z != null ? { z: location.z } : {}),
        mazeMapPoiId: location.poiId,
        ...(normalizeOptionalString(location.identifier)
          ? {
              mazeMapIdentifier: normalizeOptionalString(location.identifier),
            }
          : {}),
      },
    });

    for (const type of location.types) {
      const typeKey = locationTypeToKey(type.name);
      locationTypes.set(typeKey, {
        key: typeKey,
        doc: { name: type.name },
      });
      locationTypeLocations.set(`${locationKey}|${typeKey}`, {
        key: `${locationKey}|${typeKey}`,
        locationKey,
        typeKey,
      });
    }

    for (const image of location.images ?? []) {
      const imageUrl = getImageUrl(image);
      if (!imageUrl) {
        continue;
      }
      locationImages.set(`${locationKey}|${imageUrl}`, {
        key: `${locationKey}|${imageUrl}`,
        locationKey,
        imageUrl,
      });
    }

    for (const altName of location.altNames ?? []) {
      locationAltNames.set(`${locationKey}|${altName.toLowerCase()}`, {
        key: `${locationKey}|${altName.toLowerCase()}`,
        locationKey,
        altName,
      });
    }
  }

  return {
    programs: Array.from(programs.values()),
    courses: Array.from(courses.values()),
    campuses: Array.from(campuses.values()),
    locationTypes: Array.from(locationTypes.values()),
    courseIndexes: Array.from(courseIndexes.values()),
    locations: Array.from(locations.values()),
    courseIndexSources: Array.from(courseIndexSources.values()),
    courseIndexClasses: Array.from(courseIndexClasses.values()),
    locationTypeLocations: Array.from(locationTypeLocations.values()),
    locationImages: Array.from(locationImages.values()),
    locationAltNames: Array.from(locationAltNames.values()),
  };
}

function requireId<T extends TableNames>(
  cache: Map<string, Id<T>>,
  key: string,
  label: string
): Id<T> {
  const id = cache.get(key);
  if (!id) {
    throw new Error(`${label} not found in cache: ${key}`);
  }
  return id;
}

function resolveConvexUrl(url: string | undefined): string {
  const resolved = url ?? process.env.CONVEX_URL;
  if (!resolved) {
    throw new Error(
      "Missing Convex URL. Pass --url <convex-url> or set CONVEX_URL in your shell."
    );
  }
  return resolved;
}

async function insertKeyedRows<TDoc, TTable extends TableNames>(
  client: ConvexHttpClient,
  functionReference: string,
  label: string,
  rows: { key: string; doc: TDoc }[],
  batchSize: number
): Promise<Map<string, Id<TTable>>> {
  const inserted = new Map<string, Id<TTable>>();

  if (rows.length === 0) {
    console.log(`${label}: nothing to insert`);
    return inserted;
  }

  for (const { start, end } of batchIteration(batchSize, rows.length)) {
    const result = (await client.mutation(
      functionReference as never,
      {
        rows: rows.slice(start, end),
      } as never
    )) as { key: string; id: Id<TTable> }[];

    for (const entry of result) {
      inserted.set(entry.key, entry.id);
    }

    console.log(`${label}: ${end}/${rows.length}`);
  }

  return inserted;
}

async function insertUnkeyedRows<TDoc>(
  client: ConvexHttpClient,
  functionReference: string,
  label: string,
  rows: TDoc[],
  batchSize: number
) {
  if (rows.length === 0) {
    console.log(`${label}: nothing to insert`);
    return;
  }

  for (const { start, end } of batchIteration(batchSize, rows.length)) {
    await client.mutation(
      functionReference as never,
      {
        rows: rows.slice(start, end),
      } as never
    );
    console.log(`${label}: ${end}/${rows.length}`);
  }
}

async function insertDownloadBundle(
  downloadDir: string,
  convexUrl: string,
  batchSize: number
) {
  const client = new ConvexHttpClient(convexUrl);
  const plan = buildUploadPlan(downloadDir);

  console.log(chalk.blue("Uploading data to Convex"));
  console.log(`Source bundle: ${downloadDir}`);
  console.log(`Convex URL: ${convexUrl}`);
  console.log("");

  const programIds = await insertKeyedRows<ProgramDoc, "programs">(
    client,
    seedFunctions.insertPrograms,
    "Programs",
    plan.programs,
    batchSize
  );

  const courseIds = await insertKeyedRows<CourseDoc, "courses">(
    client,
    seedFunctions.insertCourses,
    "Courses",
    plan.courses,
    batchSize
  );

  const campusIds = await insertKeyedRows<CampusDoc, "campuses">(
    client,
    seedFunctions.insertCampuses,
    "Campuses",
    plan.campuses,
    batchSize
  );

  const locationTypeIds = await insertKeyedRows<
    LocationTypeDoc,
    "location_types"
  >(
    client,
    seedFunctions.insertLocationTypes,
    "Location types",
    plan.locationTypes,
    batchSize
  );

  const courseIndexRows = plan.courseIndexes.map((row) => ({
    key: row.key,
    doc: {
      index: row.doc.index,
      courseId: requireId(courseIds, row.courseKey, "Course"),
    },
  }));
  const courseIndexIds = await insertKeyedRows<
    { index: string; courseId: Id<"courses"> },
    "course_index"
  >(
    client,
    seedFunctions.insertCourseIndexes,
    "Course indexes",
    courseIndexRows,
    batchSize
  );

  const locationRows = plan.locations.map((row) => ({
    key: row.key,
    doc: {
      ...row.doc,
      campusId: requireId(campusIds, row.campusKey, "Campus"),
    },
  }));
  const locationIds = await insertKeyedRows<
    LocationDoc & { campusId: Id<"campuses"> },
    "locations"
  >(
    client,
    seedFunctions.insertLocations,
    "Locations",
    locationRows,
    batchSize
  );

  await insertUnkeyedRows(
    client,
    seedFunctions.insertCourseIndexSources,
    "Course index sources",
    plan.courseIndexSources.map((row) => ({
      indexId: requireId(courseIndexIds, row.indexKey, "Course index"),
      source: requireId(programIds, row.programKey, "Program"),
    })),
    batchSize
  );

  await insertUnkeyedRows(
    client,
    seedFunctions.insertCourseIndexClasses,
    "Course index classes",
    plan.courseIndexClasses.map((row) => ({
      indexId: requireId(courseIndexIds, row.indexKey, "Course index"),
      ...row.doc,
    })),
    batchSize
  );

  await insertUnkeyedRows(
    client,
    seedFunctions.insertLocationTypeLocations,
    "Location type links",
    plan.locationTypeLocations.map((row) => ({
      locationId: requireId(locationIds, row.locationKey, "Location"),
      typeId: requireId(locationTypeIds, row.typeKey, "Location type"),
    })),
    batchSize
  );

  await insertUnkeyedRows(
    client,
    seedFunctions.insertLocationImages,
    "Location images",
    plan.locationImages.map((row) => ({
      locationId: requireId(locationIds, row.locationKey, "Location"),
      imageUrl: row.imageUrl,
    })),
    batchSize
  );

  await insertUnkeyedRows(
    client,
    seedFunctions.insertLocationAltNames,
    "Location alt names",
    plan.locationAltNames.map((row) => ({
      locationId: requireId(locationIds, row.locationKey, "Location"),
      altName: row.altName,
    })),
    batchSize
  );

  console.log("");
  console.log(chalk.green("Convex upload completed."));
}

const program = new Command();

program.name("fntu").description("Upload bundled NTU data into Convex");

program
  .command("download-to-convex")
  .description("Insert out/download data directly into Convex")
  .option(
    "--download-dir <path>",
    "Path to the bundled download directory",
    "out/download"
  )
  .option(
    "--url <convex-url>",
    "Convex deployment URL. Falls back to CONVEX_URL if omitted."
  )
  .option(
    "--batch-size <number>",
    "Number of documents to insert per mutation",
    "200"
  )
  .action(async ({ downloadDir, url, batchSize }) => {
    try {
      const parsedBatchSize = Number(batchSize);
      if (!Number.isInteger(parsedBatchSize) || parsedBatchSize <= 0) {
        throw new Error("batch-size must be a positive integer");
      }

      await insertDownloadBundle(
        path.resolve(downloadDir),
        resolveConvexUrl(url),
        parsedBatchSize
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown insertion error";
      console.error(chalk.red(message));
      process.exitCode = 1;
    }
  });

program.parse(process.argv);
