import * as cheerio from "cheerio";
import fs from "fs";
import { ExamPlan } from "./schema";

export function scrapeExamPlansFromHtml(html: string): ExamPlan[] {
  const $ = cheerio.load(html);
  const plans: ExamPlan[] = [];

  // The hidden input `p_type` carries the program type used elsewhere in the
  // form (e.g. `UE` for undergrad).
  const type = $('input[name="p_type"]').attr("value") ?? "UE";

  $('input[name="p_plan_no"]').each((_, el) => {
    const planNo = $(el).attr("value");
    if (!planNo) return;

    // The label is the bare text node sibling next to the radio input in
    // each <td>. Walking the parent's contents lets us pick up just the
    // text-node label without also pulling in any nested elements.
    const parent = $(el).parent();
    let label = "";
    parent.contents().each((_i, node) => {
      if (node.type === "text") {
        label += (node as { data?: string }).data ?? "";
      }
    });
    label = label.replace(/\s+/g, " ").trim();

    plans.push({ planNo, name: label, type });
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
