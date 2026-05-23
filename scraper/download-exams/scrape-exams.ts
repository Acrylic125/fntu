import * as cheerio from "cheerio";
import fs from "fs";
import { Exam, ExamSchema } from "./schema";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

function parseDate(raw: string): string {
  // NTU formats dates as `23 July 2026`.
  const parts = raw.replace(/\s+/g, " ").trim().split(" ");
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: "${raw}"`);
  }
  const day = parseInt(parts[0], 10);
  const month = MONTHS.indexOf(parts[1].toLowerCase()) + 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || month === 0 || isNaN(year)) {
    throw new Error(`Invalid date format: "${raw}"`);
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseTime(raw: string): { hour: number; minute: number } {
  // NTU formats times as `9.00 am`, `1.00 pm`, `12.00 pm`, `12.00 am`.
  const cleaned = raw.replace(/\s+/g, " ").trim().toLowerCase();
  const match = cleaned.match(/^(\d{1,2})\.(\d{2})\s*(am|pm)$/);
  if (!match) {
    throw new Error(`Invalid time format: "${raw}"`);
  }
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const meridian = match[3];
  if (meridian === "am") {
    if (hour === 12) hour = 0;
  } else if (hour !== 12) {
    hour += 12;
  }
  return { hour, minute };
}

function parseDuration(raw: string): number {
  // NTU formats durations as `2 hr`, `1.5 hr`, `2 hr 30 min`, `30 min`.
  const cleaned = raw.replace(/\s+/g, " ").trim().toLowerCase();
  const hrMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*hr/);
  const minMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*min/);
  let total = 0;
  if (hrMatch) total += parseFloat(hrMatch[1]);
  if (minMatch) total += parseFloat(minMatch[1]) / 60;
  if (!hrMatch && !minMatch) {
    throw new Error(`Invalid duration format: "${raw}"`);
  }
  return total;
}

// Matches `23 July 2026` so we can detect data rows without depending on the
// table's (un-quoted) HTML attributes.
const DATE_ROW_REGEX = /^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/;

export function scrapeExamsFromHtml(html: string): Exam[] {
  const $ = cheerio.load(html);
  const exams: Exam[] = [];

  $("table").each((_t, table) => {
    $(table)
      .find("tr")
      .each((_r, row) => {
        const cells = $(row).find("td");
        if (cells.length !== 6) return;

        const dateText = $(cells[0]).text().trim();
        if (!DATE_ROW_REGEX.test(dateText)) return;

        const dayText = $(cells[1]).text().trim();
        const timeText = $(cells[2]).text().trim();
        const courseCode = $(cells[3]).text().trim();
        const courseTitle = $(cells[4]).text().trim();
        const durationText = $(cells[5]).text().trim();

        try {
          const date = parseDate(dateText);
          const time = parseTime(timeText);
          const duration = parseDuration(durationText);
          const exam: Exam = {
            date,
            day: dayText,
            timeHour: time.hour,
            timeMinute: time.minute,
            courseCode,
            courseTitle,
            duration,
          };
          ExamSchema.parse(exam);
          exams.push(exam);
        } catch (err) {
          console.warn(
            `Failed to parse exam row [${dateText} | ${courseCode}]:`,
            err
          );
        }
      });
  });
  return exams;
}

export async function scrapeExams(htmlPath: string, outputPath: string) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const exams = scrapeExamsFromHtml(html);
  console.log(`Found ${exams.length} exam entries`);
  fs.writeFileSync(outputPath, JSON.stringify(exams, null, 2));
  return exams;
}
