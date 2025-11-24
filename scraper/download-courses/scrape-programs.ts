import * as cheerio from "cheerio";
import path from "path";
import fs from "fs";

export type ProgramSource = {
  code: string;
  name: string;
  subCode?: string | null;
  year: number | null;
  type: "full_time" | "part_time";
  ref: string;
};

function scrapeProgramOptions(html: string): ProgramSource[] {
  const results: ProgramSource[] = [];
  const $ = cheerio.load(html);

  // Find the select element with name="r_course_yr" which contains all program options
  const $select = $('select[name="r_course_yr"]');

  if ($select.length === 0) {
    console.warn("Could not find program options select element");
    return results;
  }

  // Iterate through all option elements
  $select.find("option").each((index: number, element: any) => {
    const $option = $(element);
    const value = $option.attr("value");
    const text = $option.text().trim();

    // Skip empty values, headers, and non-program options
    if (
      !value ||
      value === "" ||
      text.includes("---") ||
      text === "---Select an Option---"
    ) {
      return;
    }

    // Parse the value format: "<code>;<subcode>;<year>;<type>"
    const parts = value.split(";");
    if (parts.length !== 4) {
      console.warn(`Invalid option value format: ${value}`);
      return;
    }

    const [code, subCode, yearStr, typeStr] = parts;

    // Parse year - if it's "X", set to null
    let year: number | null = null;
    if (yearStr !== "X") {
      const parsedYear = parseInt(yearStr);
      if (!isNaN(parsedYear)) {
        year = parsedYear;
      }
    }

    // Parse type - F = full_time, P = part_time
    let type: "full_time" | "part_time";
    if (typeStr === "F") {
      type = "full_time";
    } else if (typeStr === "P") {
      type = "part_time";
    } else {
      console.warn(`Invalid type: ${typeStr} for option ${value}`);
      return;
    }

    // Handle empty subCode (when it's just two semicolons)
    const finalSubCode = subCode === "" ? null : subCode;

    const programSource: ProgramSource = {
      code,
      name: text
        .replace("\n                              ", "")
        .replace(`Year ${year}`, "")
        .trim(),
      subCode: finalSubCode,
      year,
      type,
      ref: value,
    };

    results.push(programSource);
  });

  return results;
}

export async function scrapePrograms(htmlPath: string, outputPath: string) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const programs = scrapeProgramOptions(html);

  console.log(`Found ${programs.length} program options`);

  // Save results to file
  fs.writeFileSync(outputPath, JSON.stringify(programs, null, 2));

  // console.log(`\nResults saved to program-sources.json`);
}
