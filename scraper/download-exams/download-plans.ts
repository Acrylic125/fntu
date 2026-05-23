import fs from "fs";

const MAIN_SUBMIT_URL =
  "https://wis.ntu.edu.sg/webexe/owa/exam_timetable_und.MainSubmit";

// Posts the first step of the NTU exam timetable form (`General Access`) and
// saves the response HTML, which contains the list of available exam plans
// (one radio input per AY/Semester/Special Term).
export async function downloadExamPlans(
  filepath: string,
  options?: { type?: string }
) {
  const type = options?.type ?? "UE";
  const body = new URLSearchParams({
    p_opt: "1",
    p_type: type,
    bOption: "Next",
  });
  const response = await fetch(MAIN_SUBMIT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) {
    throw new Error(`Failed to download exam plans: ${response.statusText}`);
  }
  const html = await response.text();
  fs.writeFileSync(filepath, html);
  return html;
}
