import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import z from "zod";

export const FacilitySchema = z.object({
  venue: z.string(), // Venue
  area: z.string(), // Spine
  capacity: z.number(), // Capacity
  location: z.string(), // Address
});

export type Facility = z.infer<typeof FacilitySchema>;

function scrapeFacilitiesFromHTML(html: string): Facility[] {
  const venues: Facility[] = [];
  const $ = cheerio.load(html);

  // Find the main table containing facility data
  $("table").each((tableIndex: number, table: any) => {
    const $table = $(table);
    const rows = $table.find("tr");

    // Find the header row that contains "Spine", "Venue", "Capacity", "Address"
    let headerRowIndex = -1;
    rows.each((rowIndex: number, row: any) => {
      const $row = $(row);
      const cells = $row.find("td");

      if (cells.length >= 4) {
        const firstHeader = cells.eq(0).text().trim();
        const secondHeader = cells.eq(1).text().trim();
        const thirdHeader = cells.eq(2).text().trim();
        const fourthHeader = cells.eq(3).text().trim();

        if (
          firstHeader === "Spine" &&
          secondHeader === "Venue" &&
          thirdHeader === "Capacity" &&
          fourthHeader === "Address"
        ) {
          headerRowIndex = rowIndex;
          console.log("Found facilities table");
          return false; // Break the loop
        }
      }
    });

    // If we found the header row, process data rows after it
    if (headerRowIndex >= 0) {
      rows.each((rowIndex: number, row: any) => {
        // Skip header row and rows before it
        if (rowIndex <= headerRowIndex) return;

        const $row = $(row);
        const cells = $row.find("td");

        // Skip rows without enough cells
        if (cells.length < 4) return;

        const area = cells.eq(0).text().trim();
        const venue = cells.eq(1).find("b").text().trim();
        const capacityText = cells.eq(2).text().trim();
        const location = cells.eq(3).text().trim();

        // Skip empty rows
        if (!venue || !area) return;

        // Parse capacity
        const capacity = parseInt(capacityText);
        if (isNaN(capacity)) {
          console.warn(
            `Invalid capacity for ${venue}: ${capacityText}, defaulting to 0`
          );
        }

        try {
          const venueData: Facility = {
            venue,
            area,
            capacity: isNaN(capacity) ? 0 : capacity,
            location,
          };

          // Validate with Zod schema
          FacilitySchema.parse(venueData);
          venues.push(venueData);
        } catch (error) {
          console.warn(`Failed to parse venue data for ${venue}:`, error);
        }
      });
    }
  });

  return venues;
}

(async () => {
  const workDir = `${__dirname}/out`;
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir);
  }
  const schools = ["HSS", "NBS"];

  for (const school of schools) {
    const url = `https://wis.ntu.edu.sg/pls/webexe88/LADOCU.FBSLOCATN?w_sch=${school}`;
    const response = await fetch(url);
    const html = await response.text();
    console.log(
      `Written HTML to ${path.resolve(workDir, `mappings-raw_facilities-${school}.html`)}`
    );
    fs.writeFileSync(
      path.resolve(workDir, `mappings-raw_facilities-${school}.html`),
      html
    );

    const facilities = scrapeFacilitiesFromHTML(html);
    console.log(
      `Written facilities to ${path.resolve(workDir, `mappings-raw_facilities-${school}.json`)}`
    );
    fs.writeFileSync(
      path.resolve(workDir, `mappings-raw_facilities-${school}.json`),
      JSON.stringify(facilities, null, 2)
    );

    let mappings: Record<string, string> = {};
    for (const facility of facilities) {
      mappings[facility.location] = facility.venue;
    }
    console.log(
      `Written mappings to ${path.resolve(workDir, `mappings_facilities-${school}.json`)}`
    );
    fs.writeFileSync(
      path.resolve(workDir, `mappings_facilities-${school}.json`),
      JSON.stringify(mappings, null, 2)
    );
  }
})();
