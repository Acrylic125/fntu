import { z } from "zod";

// A single plan option on the NTU exam timetable AY page (e.g. `SPECIAL TERM
// AY2025-26`). The `planNo` is the value of the radio input named `p_plan_no`.
export const ExamPlanSchema = z.object({
  planNo: z.string(),
  name: z.string(),
  type: z.string(),
});

export type ExamPlan = z.infer<typeof ExamPlanSchema>;

// Hidden form fields that the NTU `query_page` step exposes for the chosen
// plan. We forward them as-is to the final `Get_detail` POST.
export const ExamHiddenFieldsSchema = z.object({
  academicSession: z.string(),
  planNo: z.string(),
  examYear: z.string(),
  semester: z.string(),
  type: z.string(),
});

export type ExamHiddenFields = z.infer<typeof ExamHiddenFieldsSchema>;

// A single scraped exam row. `date` is an ISO date string (YYYY-MM-DD),
// `timeHour`/`timeMinute` are in 24h, and `duration` is in hours (e.g. 2 or
// 2.5).
export const ExamSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  day: z.string(),
  timeHour: z.number().int().min(0).max(23),
  timeMinute: z.number().int().min(0).max(59),
  courseCode: z.string(),
  courseTitle: z.string(),
  duration: z.number().positive(),
});

export type Exam = z.infer<typeof ExamSchema>;

export const ExamListSchema = z.array(ExamSchema);
