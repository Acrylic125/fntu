import {
  ProgramCourseListSchema as ClassesSchema,
  MetadataSchema,
  Days,
} from "../schema";
import { db } from "../db";
import {
  courseIndexClassesTable,
  courseIndexSourcesTable,
  courseIndexTable,
  coursesTable,
  programsTable,
} from "../db/schema";
import fs from "fs";
import { and, eq } from "drizzle-orm";
import { extractCourseNameAndFlags } from "../utils";
import chalk from "chalk";

async function getMetadata(filepath: string) {
  const metadata = MetadataSchema.parse(
    JSON.parse(fs.readFileSync(filepath, "utf8"))
  );
  return metadata;
}

async function getScrapedResults(filepath: string) {
  const all = ClassesSchema.parse(
    JSON.parse(fs.readFileSync(filepath, "utf8"))
  );
  return all;
}

function* batchIteration(batchSize: number, total: number) {
  for (let i = 0; i < total; i += batchSize) {
    const batch = i;
    const end = Math.min(i + batchSize, total);
    yield { batch, end };
  }
}

async function doProgramsInsert(
  metadata: Awaited<ReturnType<typeof getMetadata>>
) {
  const programs = metadata.map((m) => m.source);
  const alreadyInsertedPrograms = await db
    .select({
      code: programsTable.code,
      subCode: programsTable.subCode,
      year: programsTable.year,
      type: programsTable.type,
    })
    .from(programsTable);
  const programsToInsert = programs.filter(
    (p) =>
      !alreadyInsertedPrograms.some(
        (ip) =>
          ip.code === p.code &&
          ip.subCode === p.subCode &&
          ip.year === p.year &&
          ip.type === p.type
      )
  );
  await db.insert(programsTable).values(programsToInsert);
  console.log("Programs inserted");
}

async function doCoursesInsert(
  ay: string,
  semester: string,
  all: Awaited<ReturnType<typeof getScrapedResults>>
) {
  const courses = all.map((c) => {
    const { name, flags } = extractCourseNameAndFlags(c.course.name);
    return {
      code: c.course.code,
      name,
      au: c.au,
      ay,
      semester,
      isAvailableUE: flags.isAvailableUE,
      isAvailableBD: flags.isAvailableBD,
      isSelfPaced: flags.isSelfPaced,
      isAvailableGEPE: flags.isAvailableGEPE,
    };
  });
  await db.insert(coursesTable).values(courses);
  console.log("Courses inserted");
}

async function doCoursesIndexInsert(
  ay: string,
  semester: string,
  all: Awaited<ReturnType<typeof getScrapedResults>>
) {
  const allCourses = await db
    .select()
    .from(coursesTable)
    .where(and(eq(coursesTable.ay, ay), eq(coursesTable.semester, semester)));

  const courseIndexMap = new Map<string, number>();
  for (const course of allCourses) {
    courseIndexMap.set(course.code, course.id);
  }

  const allIndexes = [];
  for (const course of all) {
    const courseId = courseIndexMap.get(course.course.code);
    if (!courseId) {
      throw new Error(`Course ${course.course.code} not found`);
    }
    for (const index of course.indices) {
      allIndexes.push({
        index: index.index,
        courseId,
      });
    }
  }
  await db.insert(courseIndexTable).values(allIndexes);
  console.log("Courses Indexes inserted");
}

async function doIndexClassesInsert(
  ay: string,
  semester: string,
  all: Awaited<ReturnType<typeof getScrapedResults>>
) {
  const allIndexesWithinAYSemester = await db
    .select()
    .from(courseIndexTable)
    .innerJoin(coursesTable, eq(courseIndexTable.courseId, coursesTable.id))
    .where(and(eq(coursesTable.ay, ay), eq(coursesTable.semester, semester)));

  const courseIndexMap = new Map<string, number>();
  for (const index of allIndexesWithinAYSemester) {
    courseIndexMap.set(
      `${index.courses.code}-${index.course_index.index}`,
      index.course_index.id
    );
  }

  const allIndexClasses = [];
  for (const course of all) {
    for (const index of course.indices) {
      const courseIndexId = courseIndexMap.get(
        `${course.course.code}-${index.index}`
      );
      if (!courseIndexId) {
        throw new Error(
          `Course index ${course.course.code}-${index.index} not found`
        );
      }
      for (const indexClass of index.classes) {
        const day = Days.indexOf(indexClass.day);
        if (day === -1) {
          throw new Error(`Invalid day: ${indexClass.day}`);
        }
        allIndexClasses.push({
          indexId: courseIndexId,
          timeFromHour: indexClass.timeFrom.hour,
          timeFromMinute: indexClass.timeFrom.minute,
          timeToHour: indexClass.timeTo.hour,
          timeToMinute: indexClass.timeTo.minute,
          venue: indexClass.venue,
          day,
          type: indexClass.type,
          remarks: indexClass.remarks,
          weeks: indexClass.weeks,
        });
      }
    }
  }

  for (const { batch, end } of batchIteration(1000, allIndexClasses.length)) {
    await db
      .insert(courseIndexClassesTable)
      .values(allIndexClasses.slice(batch, end));
  }

  console.log("Index Classes inserted");
}

function programToKey(program: {
  code: string;
  subCode?: string | null;
  year?: number | null;
  type: "full_time" | "part_time";
}) {
  return `${program.code}-${program.subCode ?? "__NULL__"}-${program.year ?? "__NULL__"}-${program.type}`;
}

async function doInsertIndexSources(
  ay: string,
  semester: string,
  all: Awaited<ReturnType<typeof getScrapedResults>>
) {
  const allIndexesWithinAYSemester = await db
    .select()
    .from(courseIndexTable)
    .innerJoin(coursesTable, eq(courseIndexTable.courseId, coursesTable.id))
    .where(and(eq(coursesTable.ay, ay), eq(coursesTable.semester, semester)));
  const allPrograms = await db.select().from(programsTable);

  const courseIndexMap = new Map<string, number>();
  for (const index of allIndexesWithinAYSemester) {
    courseIndexMap.set(
      `${index.courses.code}-${index.course_index.index}`,
      index.course_index.id
    );
  }

  const programMap = new Map<string, number>();
  for (const program of allPrograms) {
    const key = programToKey(program);
    programMap.set(key, program.id);
  }

  const allIndexSources = [];
  for (const course of all) {
    for (const index of course.indices) {
      for (const source of index.sources) {
        const key = programToKey(source);
        const programId = programMap.get(key);
        if (!programId) {
          throw new Error(
            `Program ${key} not found in ${JSON.stringify(allPrograms)}`
          );
        }
        const indexId = courseIndexMap.get(
          `${course.course.code}-${index.index}`
        );
        if (!indexId) {
          throw new Error(
            `Index ${course.course.code}-${index.index} not found`
          );
        }
        allIndexSources.push({
          indexId,
          source: programId,
        });
      }
    }
  }

  for (const { batch, end } of batchIteration(1000, allIndexSources.length)) {
    await db
      .insert(courseIndexSourcesTable)
      .values(allIndexSources.slice(batch, end));
  }
  console.log("Index Sources inserted");
}

export const COURSE_INSERTION_OPTIONS = [
  "Programs",
  "Courses",
  "Courses Index",
  "Index Classes",
  "Index Sources",
] as const;

export async function doInsert(
  ay: string,
  semester: string,
  options: {
    schedulesMetadataPath: string;
    allSchedulesPath: string;
    options: (typeof COURSE_INSERTION_OPTIONS)[number][];
  }
) {
  const metadata = await getMetadata(options.schedulesMetadataPath);
  const all = await getScrapedResults(options.allSchedulesPath);
  const successOptions = [];
  try {
    if (options.options.includes("Programs")) {
      await doProgramsInsert(metadata);
      successOptions.push("Programs");
    }
    if (options.options.includes("Courses")) {
      await doCoursesInsert(ay, semester, all);
      successOptions.push("Courses");
    }
    if (options.options.includes("Courses Index")) {
      await doCoursesIndexInsert(ay, semester, all);
      successOptions.push("Courses Index");
    }
    if (options.options.includes("Index Classes")) {
      await doIndexClassesInsert(ay, semester, all);
      successOptions.push("Index Classes");
    }
    if (options.options.includes("Index Sources")) {
      await doInsertIndexSources(ay, semester, all);
      successOptions.push("Index Sources");
    }
  } catch (error) {
    console.error(error);
    console.log(
      chalk.red("Insertion failed, please rectify and try again. Either:")
    );
    console.log(
      " - Delete what was already inserted and run the insertion again."
    );
    console.log(" - Only rerun those that were PREVIOUSLY not successful.");
    console.log("");
    console.log("Summary of insertion:");
    for (const option of options.options) {
      if (successOptions.includes(option)) {
        console.log(chalk.green(` - ${option} inserted successfully`));
      } else {
        console.log(chalk.red(` - ${option} insertion failed`));
      }
    }
    return;
  }
}

// (async () => {
//   const ay = "25/26";
//   const sem = "1";
//   await doProgramsInsert();
//   await doCoursesInsert(ay, sem);
//   await doCoursesIndexInsert(ay, sem);
//   await doIndexClassesInsert(ay, sem);
//   await doInsertIndexSources(ay, sem);
// })();
