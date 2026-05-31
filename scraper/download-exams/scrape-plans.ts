import * as cheerio from "cheerio";
import fs from "fs";
import { ExamPlan } from "./schema";

type HtmlNode = {
  type: string;
  name?: string;
  attribs?: Record<string, string | undefined>;
  data?: string;
  next: HtmlNode | null;
};

function labelAfterRadioInput(el: HtmlNode): string {
  let label = "";
  let node: HtmlNode | null = el.next;
  while (node) {
    if (node.type === "tag") {
      if (node.name === "br") break;
      if (node.name === "input" && node.attribs?.name === "p_plan_no") break;
    }
    if (node.type === "text") {
      label += node.data ?? "";
    }
    node = node.next;
  }
  return label.replace(/\s+/g, " ").trim();
}

export function scrapeExamPlansFromHtml(html: string): ExamPlan[] {
  const $ = cheerio.load(html);
  const plans: ExamPlan[] = [];

  // The hidden input `p_type` carries the program type used elsewhere in the
  // form (e.g. `UE` for undergrad).
  const type = $('input[name="p_type"]').attr("value") ?? "UE";

  $('input[name="p_plan_no"]').each((_, el) => {
    const planNo = $(el).attr("value");
    if (!planNo) return;

    // Each plan is `<input name="p_plan_no" …>LABEL<br>`. Labels are text
    // nodes immediately after the radio, not inside the input's parent alone.
    const name = labelAfterRadioInput(el as HtmlNode);

    plans.push({ planNo, name, type });
  });
  return plans;
}

export async function scrapeExamPlans(htmlPath: string, outputPath: string) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const plans = scrapeExamPlansFromHtml(html);

  console.log(`Found ${plans.length} exam plan option(s)`);
  fs.writeFileSync(outputPath, JSON.stringify(plans, null, 2));
  return plans;
}
