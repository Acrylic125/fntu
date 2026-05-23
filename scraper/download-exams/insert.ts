import fs from "fs";
import { and, eq, inArray } from "drizzle-orm";
import chalk from "chalk";

import { coursesTable, examsTable } from "../db/schema";
import { getDb } from "../db";
import { Exam, ExamListSchema } from "./schema";

type Db = ReturnType<typeof getDb>;

function* batchIteration(batchSize: number, total: number) {
  for (let i = 0; i < total; i += batchSize) {
    yield { batch: i, end: Math.min(i + batchSize, total) };
  }
}

async function getExamsData(filePath: string): Promise<Exam[]> {
  return ExamListSchema.parse(JSON.parse(fs.readFileSync(filePath, "utf8")));
}

async function doExamsInsert(
  db: Db,
  ay: string,
  semester: string,
  exams: Exam[]
) {
  const courseCodes = Array.from(new Set(exams.map((e) => e.courseCode)));
  if (courseCodes.length === 0) {
    console.log("No exams to insert");
    return;
  }

  const courses = await db
    .select({ id: coursesTable.id, code: coursesTable.code })
    .from(coursesTable)
    .where(
      and(
        eq(coursesTable.ay, ay),
        eq(coursesTable.semester, semester),
        inArray(coursesTable.code, courseCodes)
      )
    );

  const codeToCourseId = new Map<string, number>();
  for (const c of courses) {
    codeToCourseId.set(c.code, c.id);
  }

  const missing: string[] = [];
  const toInsert: {
    courseId: number;
    date: string;
    timeHour: number;
    timeMinute: number;
    duration: number;
  }[] = [];
  for (const exam of exams) {
    const courseId = codeToCourseId.get(exam.courseCode);
    if (!courseId) {
      missing.push(exam.courseCode);
      continue;
    }
    toInsert.push({
      courseId,
      date: exam.date,
      timeHour: exam.timeHour,
      timeMinute: exam.timeMinute,
      duration: exam.duration,
    });
  }

  if (missing.length > 0) {
    const unique = Array.from(new Set(missing));
    console.log(
      chalk.yellow(
        `Skipped ${missing.length} exam(s) - matching course not found for AY ${ay} S${semester}: ${unique.join(", ")}`
      )
    );
  }
  if (toInsert.length === 0) {
    console.log("No exams to insert (no matching courses)");
    return;
  }

  for (const { batch, end } of batchIteration(1000, toInsert.length)) {
    await db.insert(examsTable).values(toInsert.slice(batch, end));
  }
  console.log(`Exams inserted (${toInsert.length})`);
}

export const EXAMS_INSERTION_OPTIONS = ["Exams"] as const;

export async function insertExams(
  db: Db,
  ay: string,
  semester: string,
  options: {
    examsPath: string;
    options: (typeof EXAMS_INSERTION_OPTIONS)[number][];
  }
) {
  const exams = await getExamsData(options.examsPath);
  const successOptions: (typeof EXAMS_INSERTION_OPTIONS)[number][] = [];
  try {
    if (options.options.includes("Exams")) {
      await doExamsInsert(db, ay, semester, exams);
      successOptions.push("Exams");
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
  }
}
