import * as cheerio from "cheerio";
import fs from "fs";
import { ExamHiddenFields, ExamHiddenFieldsSchema } from "./schema";

const QUERY_PAGE_URL =
  "https://wis.ntu.edu.sg/webexe/owa/exam_timetable_und.query_page";
const GET_DETAIL_URL =
  "https://wis.ntu.edu.sg/webexe/owa/exam_timetable_und.Get_detail";

function readHiddenFields(html: string): ExamHiddenFields {
  const $ = cheerio.load(html);
  const hidden: Record<string, string> = {};
  $('input[type="hidden"]').each((_, el) => {
    const name = $(el).attr("name");
    if (!name) return;
    hidden[name] = $(el).attr("value") ?? "";
  });
  return ExamHiddenFieldsSchema.parse({
    academicSession: hidden["academic_session"] ?? "",
    planNo: hidden["p_plan_no"] ?? "",
    examYear: hidden["p_exam_yr"] ?? "",
    semester: hidden["p_semester"] ?? "",
    type: hidden["p_type"] ?? "",
  });
}

// Walks the NTU exam timetable form for a given plan and downloads the
// resulting `Get_detail` HTML (with all filters set to "All"). Optionally
// persists the intermediate hidden fields for debugging.
export async function downloadExamTimetable(options: {
  planNo: string;
  type: string;
  filepath: string;
  hiddenFieldsFilepath?: string;
}) {
  const queryPageRes = await fetch(QUERY_PAGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      p_plan_no: options.planNo,
      p1: "",
      p2: "",
      p_type: options.type,
      bOption: "Next",
    }).toString(),
  });
  if (!queryPageRes.ok) {
    throw new Error(
      `Failed to fetch exam query page for plan ${options.planNo}: ${queryPageRes.statusText}`
    );
  }
  const hidden = readHiddenFields(await queryPageRes.text());
  if (options.hiddenFieldsFilepath) {
    fs.writeFileSync(
      options.hiddenFieldsFilepath,
      JSON.stringify(hidden, null, 2)
    );
  }

  const detailRes = await fetch(GET_DETAIL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      p_exam_dt: "",
      p_start_time: "",
      p_dept: "",
      p_subj: "",
      p_venue: "",
      p_matric: "",
      academic_session: hidden.academicSession,
      p_plan_no: hidden.planNo,
      p_exam_yr: hidden.examYear,
      p_semester: hidden.semester,
      p_type: hidden.type,
      bOption: "Next",
    }).toString(),
  });
  if (!detailRes.ok) {
    throw new Error(
      `Failed to fetch exam details for plan ${options.planNo}: ${detailRes.statusText}`
    );
  }
  const html = await detailRes.text();
  fs.writeFileSync(options.filepath, html);
  return { html, hidden };
}
