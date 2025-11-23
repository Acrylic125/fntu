# Courses
Anything related to NTU's Courses.

## Terminology
```
Program = Major/Minor/MLOAD/GLOAD/Scholar's program + year
MLOAD = Minor Load
GLOAD = Global Load (i.e. BDE)

Source = Which program an index came from
Course = Course (duh)
Index = Course Index (duh)
Class = Some class time slot
```

## Getting the freshest data
1. Run `pnpm ts-node download-sources.ts`. This downloads the [Undergraduate Programs](https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main) page.
1. Run `pnpm ts-node scrape-sources.ts`. This scrapes the [Undergraduate Programs](https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main), consolidating all programs.
1. Run `pnpm ts-node download-programs.ts`.  This uses the result of the scraped sources to download the class schedule page for each program.
1. Run `pnpm ts-node scrape-programs.ts`. This scrapes the class schedule pages and consolidates all the class indexes.
1. (Optional) If you have Setup Drizzle, `pnpm ts-node insert.ts`. Inserts the transformed data to the database.

## Data Sources
How are we sourcing our data? 
1. Scrape all courses.
1. For each course, get the index schedules.

The [Undergraduate Programs](https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main) gives us a table of undergraduate programs. 

Each program does a POST request to `https://wish.wis.ntu.edu.sg/webexe/owa/AUS_SCHEDULE.main_display1`, providing a list of index class timings.
