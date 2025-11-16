import * as cheerio from "cheerio";
import path from "path";
import fs from "fs";
import {
  Time,
  Day,
  Class,
  Index,
  Course,
  ClassSchema,
  ProgramCoursesSchema,
  MetadataSchema,
  CourseCode,
} from "./schema";
import { parseTeachingWeeks } from "./utils";

// Helper function to parse time string (e.g., "1830" -> { hour: 18, minute: 30 })
function parseTime(timeStr: string): Time {
  const hour = parseInt(timeStr.substring(0, 2));
  const minute = parseInt(timeStr.substring(2, 4));
  return { hour, minute };
}

// Helper function to parse time range (e.g., "1830-2220" -> { timeFrom: { hour: 18, minute: 30 }, timeTo: { hour: 22, minute: 20 } })
function parseTimeRange(timeRange: string): { timeFrom: Time; timeTo: Time } {
  const [from, to] = timeRange.split("-");
  return {
    timeFrom: parseTime(from),
    timeTo: parseTime(to),
  };
}

function scrapePageForCourses(html: string) {
  const results: Course[] = [];
  // Find all course sections
  const $ = cheerio.load(html);
  $("table").each((tableIndex: number, table: any) => {
    const $table = $(table);

    // Look for course code in the first table (course info table)
    const courseCodeElement = $table.find(
      "td:first-child b font[color='#0000FF']"
    );
    if (courseCodeElement.length > 0) {
      const courseCode = courseCodeElement.text().trim();

      // Extract course name from the second td with blue font
      const courseNameElement = $table.find(
        "td:nth-child(2) b font[color='#0000FF']"
      );
      const courseName = courseNameElement.text().trim();

      // Extract AU from the third td with blue font
      const auElement = $table.find("td:nth-child(3) b font[color='#0000FF']");
      const auText = auElement.text().trim();
      const _au = auText.replace(" AU", ""); // Remove " AU" suffix
      let au = parseInt(_au);
      if (isNaN(au)) {
        console.warn(
          `Invalid AU for ${courseCode}: ${auText} will default to 0`
        );
        au = 0;
      }

      // Find the next table which contains the schedule
      const nextTable = $table.next("table");
      if (nextTable.length > 0) {
        const $scheduleTable = $(nextTable);
        const indexMap: Record<string, Class[]> = {};
        let lastIndex = "";

        // Parse schedule rows
        $scheduleTable.find("tr").each((rowIndex: number, row: any) => {
          const $row = $(row);
          const cells = $row.find("td");

          // Skip header row and rows without enough cells
          if (rowIndex === 0 || cells.length < 7) return;

          let index = $row.find("td:first-child b").text().trim();
          if (index) {
            lastIndex = index;
          } else {
            index = lastIndex;
          }
          const type = $row.find("td:nth-child(2) b").text().trim();
          const day = $row.find("td:nth-child(4) b").text().trim();
          const time = $row.find("td:nth-child(5) b").text().trim();
          const venue = $row.find("td:nth-child(6) b").text().trim();
          const remarks = $row.find("td:nth-child(7) b").text().trim();
          const weeks = parseTeachingWeeks(remarks);

          // Only process rows with valid data
          if (
            index &&
            type &&
            day &&
            time &&
            day.match(/^(MON|TUE|WED|THU|FRI|SAT|SUN)$/)
          ) {
            try {
              const timeRange = parseTimeRange(time);
              const classData: Class = {
                type: type as Class["type"],
                day: day as Day,
                timeFrom: timeRange.timeFrom,
                timeTo: timeRange.timeTo,
                venue,
                weeks: weeks ?? Array.from({ length: 14 }, (_, i) => i + 1),
                remarks,
              };

              // Validate with Zod
              ClassSchema.parse(classData);
              if (!indexMap[index]) indexMap[index] = [];
              indexMap[index].push(classData);
            } catch (error) {
              console.warn(`Failed to parse class for index ${index}:`, error);
            }
          }
        });

        const indices: Index[] = Object.entries(indexMap).map(
          ([index, classes]: [string, Class[]]) => ({
            index,
            classes,
            sources: [],
          })
        );

        if (indices.length > 0) {
          const courseData: Course = {
            course: {
              code: courseCode,
              name: courseName,
            },
            au: au,
            indices,
          };

          // Validate with Zod
          try {
            ProgramCoursesSchema.parse(courseData);
            results.push(courseData);
          } catch (error) {
            console.warn(
              `Failed to validate course data for ${courseCode}:`,
              error
            );
          }
        }
      }
    }
  });
  return results;
}

const rawSchedulesDir = path.resolve("./out/raw-schedules");
const metadata = MetadataSchema.parse(
  JSON.parse(
    fs.readFileSync(path.resolve(rawSchedulesDir, "metadata.json"), "utf8")
  )
);
console.log(metadata);

const courseSchedules = new Map<CourseCode, Course>();
// course code -> serialized course
// const checkDuplicates = new Map<string, string>();
for (let i = 0; i < metadata.length; i++) {
  if (i % 20 === 0) {
    console.log(`Processing ${i} of ${metadata.length}`);
  }
  const entry = metadata[i];
  const html = fs.readFileSync(path.resolve("./out", entry.path), "utf8");
  const courses = scrapePageForCourses(html);
  for (const course of courses) {
    const cur = courseSchedules.get(course.course.code);
    if (cur) {
      const curIndexPositions = new Map<string, number>(
        cur.indices.map((index: Index, i: number) => {
          return [index.index, i];
        })
      );
      for (const index of course.indices) {
        const i = curIndexPositions.get(index.index);
        if (i !== undefined) {
          // console.log(`Already have index, ${index.index}. Adding source`);
          const curIndex = cur.indices[i];
          curIndex.sources.push({
            code: entry.source.code,
            subCode: entry.source.subCode ?? undefined,
            year: entry.source.year ?? undefined,
            type: entry.source.type,
          });
          continue;
        }
        cur.indices.push(index);
      }
      continue;
    }
    for (const index of course.indices) {
      index.sources.push({
        code: entry.source.code,
        subCode: entry.source.subCode ?? undefined,
        year: entry.source.year ?? undefined,
        type: entry.source.type,
      });
    }
    courseSchedules.set(course.course.code, course);
  }
}

const results = Array.from(courseSchedules.values());
// console.log(results)
fs.writeFileSync(
  path.resolve("./out/classes.json"),
  JSON.stringify(results, null, 2)
);
