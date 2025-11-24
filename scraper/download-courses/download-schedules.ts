import fs from "fs";
import seedrandom from "seedrandom";
import { z } from "zod";
import { MetadataSchema, ProgramSource, ProgramSourceSchema } from "../schema";

const SOURCE_BASE_URL =
  "https://wish.wis.ntu.edu.sg/webexe/owa/AUS_SCHEDULE.main_display1";

// const ACAD_SEM = "2025;1";

const rng = seedrandom("1234567890");

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createFormData(source: ProgramSource, acadsem: string) {
  return {
    acadsem: acadsem,
    r_subj_code: "Enter+Keywords+or+Course+Code",
    r_search_type: "F",
    boption: "CLoad",
    staff_access: "false",
    r_course_yr: source.ref,
  };
}

async function _downloadCourseSchedules(
  sources: ProgramSource[],
  options: {
    dir: string;
    gapBetweenRequests: [number, number];
    acadsem: string;
  }
) {
  const metadata: z.infer<typeof MetadataSchema> = [];
  const wait = async () => {
    const gapBetweenRequests =
      rng.quick() *
        (options.gapBetweenRequests[1] - options.gapBetweenRequests[0]) +
      options.gapBetweenRequests[0];
    await sleep(gapBetweenRequests);
  };

  let i = 0;
  console.log(
    `Downloading ${sources.length} course schedules. Will take ~${((sources.length * options.gapBetweenRequests[0]) / 1000).toFixed(2)} seconds.`
  );
  for (const source of sources) {
    const formData = createFormData(source, options.acadsem);
    const url = new URL(SOURCE_BASE_URL);
    url.search = new URLSearchParams(formData).toString();
    const response = await fetch(url, {
      method: "POST",
    });
    const html = await response.text();
    const filePath = `${options.dir}/${source.name} Year ${source.year}.html`;
    fs.writeFileSync(filePath, html);
    metadata.push({
      source,
      path: filePath,
    });
    await wait();
    i++;
    if (i % 20 === 0 || i === sources.length) {
      console.log(`Downloaded ${i} of ${sources.length} course schedules`);
    }
  }
  return metadata;
}

export async function downloadCourseSchedules(
  inputPath: string,
  outputDir: string,
  metadataPath: string,
  acadsem: string
) {
  const programSources = fs.readFileSync(inputPath, "utf8");
  const programSourcesJson = ProgramSourceSchema.array().parse(
    JSON.parse(programSources)
  );
  const metadata = await _downloadCourseSchedules(programSourcesJson, {
    gapBetweenRequests: [100, 1000],
    dir: outputDir,
    acadsem: acadsem,
  });
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

// // Create folder "raw-schedules" if not exist
// if (!fs.existsSync("raw-schedules")) {
//   fs.mkdirSync("raw-schedules");
// }

// // Do a fetch for each course source
// (async () => {
//   const PROGRAM_SOURCES: ProgramSource[] = [];
//   const programSources = fs.readFileSync("./out/program-sources.json", "utf8");
//   const programSourcesJson = JSON.parse(programSources);
//   for (const programSource of programSourcesJson) {
//     PROGRAM_SOURCES.push(programSource);
//   }

//   const metadata = await _downloadCourseSchedules(PROGRAM_SOURCES, {
//     // Dont dox NTU and raise suspicion lmao.
//     gapBetweenRequests: [500, 3000],
//     dir: "./out/raw-schedules",
//   });
//   fs.writeFileSync(
//     "./out/raw-schedules/metadata.json",
//     JSON.stringify(metadata, null, 2)
//   );
// })();
