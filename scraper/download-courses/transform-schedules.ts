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
        if (new RegExp("EXAMHALL[A-Za-z0-9]+$").test(cls.venue)) {
          const [, room] = cls.venue.split("EXAMHALL");
          cls.venue = `Exam Hall ${room}`;
        }
        if (cls.venue.includes("EXAMHALL")) {
          cls.venue = cls.venue.replace("EXAMHALL", "Exam Hall");
        }
      });
    });
  }
  fs.writeFileSync(outputPath, JSON.stringify(scrapedSchedules, null, 2));
}
