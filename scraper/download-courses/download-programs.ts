import fs from "fs";
import path from "path";

const SOURCE_BASE_URL =
  "https://wish.wis.ntu.edu.sg/webexe/owa/AUS_SCHEDULE.main_display";

function createFormData(acadsem: string) {
  return {
    acadsem: acadsem,
    r_subj_code: "Enter+Keywords+or+Course+Code",
    r_search_type: "F",
    boption: "x",
    staff_access: "false",
  };
}

export async function downloadDataSources(acadsem: string, filepath: string) {
  const formData = createFormData(acadsem);
  const url = new URL(SOURCE_BASE_URL);
  url.search = new URLSearchParams(formData).toString();
  const response = await fetch(url, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Failed to download sources: ${response.statusText}`);
  }
  const html = await response.text();
  fs.writeFileSync(filepath, html);
  return html;
}

// async function loadCourseSources(
//   sources: ProgramSource[],
//   options: {
//     dir: string;
//     gapBetweenRequests: [number, number];
//   }
// ) {
//   const metadata: z.infer<typeof MetadataSchema> = [];
//   const wait = async () => {
//     const gapBetweenRequests =
//       rng.quick() *
//         (options.gapBetweenRequests[1] - options.gapBetweenRequests[0]) +
//       options.gapBetweenRequests[0];
//     await sleep(gapBetweenRequests);
//   };

//   for (const source of sources) {
//     const formData = createFormData(source);
//     const url = new URL(SOURCE_BASE_URL);
//     url.search = new URLSearchParams(formData).toString();
//     const response = await fetch(url, {
//       method: "POST",
//     });
//     const html = await response.text();
//     const filePath = `${options.dir}/${source.name} Year ${source.year}.html`;
//     fs.writeFileSync(filePath, html);
//     metadata.push({
//       source,
//       path: filePath,
//     });
//     await wait();
//   }
//   return metadata;
// }

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

//   const metadata = await loadCourseSources(PROGRAM_SOURCES, {
//     // Dont dox NTU and raise suspicion lmao.
//     gapBetweenRequests: [500, 3000],
//     dir: "./out/raw-schedules",
//   });
//   fs.writeFileSync(
//     "./out/raw-schedules/metadata.json",
//     JSON.stringify(metadata, null, 2)
//   );
// })();
