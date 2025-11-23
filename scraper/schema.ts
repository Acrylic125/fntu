import { z } from "zod";

// Define the data structures
export const TimeSchema = z.object({
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
});

export const Days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
export const DaySchema = z.enum(Days);
export const TypeSchema = z.string(); // z.enum(["LAB", "LEC", "TUT", "LEC/STUDIO", "SEM"]);

export const ClassSchema = z.object({
  type: TypeSchema,
  day: DaySchema,
  timeFrom: TimeSchema,
  timeTo: TimeSchema,
  // forCourses: z
  //   .array(
  //     z.object({
  //       code: z.string(),
  //       subCode: z.string().optional(),
  //       years: z.array(z.number()).optional(),
  //     })
  //   )
  //   .optional(),
  venue: z.string(),
  weeks: z.array(z.number()),
  remarks: z.string(),
});

export const IndexSchema = z.object({
  index: z.string(),
  classes: z.array(ClassSchema),
  sources: z.array(
    z.object({
      // name: z.string(),
      code: z.string(),
      subCode: z.string().optional(),
      year: z.number().optional(),
      type: z.enum(["full_time", "part_time"]),
    })
  ),
});

export const ProgramCoursesSchema = z.object({
  course: z.object({
    code: z.string(),
    name: z.string(),
  }),
  au: z.number(),
  indices: z.array(IndexSchema),
});

export const ProgramCourseListSchema = z.array(ProgramCoursesSchema);

export const ProgramSchema = z.object({
  name: z.string(),
  code: z.string(),
  subCode: z.string().optional(),
  year: z.number().optional(),
  type: z.enum(["full_time", "part_time"]),
});

export const ProgramSourceSchema = z.object({
  name: z.string(),
  code: z.string(),
  subCode: z.string().optional().nullable(),
  year: z.number().optional().nullable(),
  type: z.enum(["full_time", "part_time"]),
  ref: z.string(),
});

export type ProgramSource = z.infer<typeof ProgramSourceSchema>;

export const MetadataEntrySchema = z.object({
  source: ProgramSourceSchema,
  path: z.string(),
});

export const MetadataSchema = z.array(MetadataEntrySchema);

export type Time = z.infer<typeof TimeSchema>;
export type Day = z.infer<typeof DaySchema>;
export type Class = z.infer<typeof ClassSchema>;
export type Index = z.infer<typeof IndexSchema>;
export type Course = z.infer<typeof ProgramCoursesSchema>;

export type Program = z.infer<typeof ProgramSchema>;
export type MetadataEntry = z.infer<typeof MetadataEntrySchema>;

export type CourseCode = string;
