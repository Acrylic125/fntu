import fs from "fs";
import { CourseScheduleListSchema } from "../schema";

export function transformSchedules(
  scrapedSchedulesPath: string,
  outputPath: string
) {
  const scrapedSchedules = CourseScheduleListSchema.parse(
    JSON.parse(fs.readFileSync(scrapedSchedulesPath, "utf8"))
  );

  // Fix up venue names.
  for (const schedule of scrapedSchedules) {
    schedule.indices.forEach((index) => {
      index.classes.forEach((cls) => {
        // Remove starting and ending ', ", `, /
        cls.venue = cls.venue.replace(/^(`|'|"|\/)+|(`|'|"|\/)+$/g, "");
        // Replace EXAMHALL with Exam Hall.
        cls.venue = cls.venue.replace("EXAMHALL", "Exam Hall");
      });
    });
  }
  fs.writeFileSync(outputPath, JSON.stringify(scrapedSchedules, null, 2));
}
