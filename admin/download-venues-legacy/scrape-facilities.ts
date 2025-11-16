import * as cheerio from "cheerio";
import path from "path";
import fs from "fs";
import { VenueSchema, Venue } from "../schema";

const remarksInVenue = [
  "dedicated to students' use",
  "booked by TUM Asia",
  "Derek Goh Bak Heng Tutorial Room",
  "(Booked by TUM Asia)",
  "to be repurposed",
  "Lee Kong Chian Lecture Theatre",
  "Lee Foundation Lecture Theatre (CS-LT1)",
  "(Von Lee Yong Miang Lecture Theatre)",
  "Tan Chin Tuan Lecture Theatre (LT2)",
  "Dr Elsie Yu Chen Chee (1999)",
];

function scrapeFacilitiesFromHTML(html: string): Venue[] {
  const venues: Venue[] = [];
  const $ = cheerio.load(html);

  // Find the main table containing facility data
  $("table").each((tableIndex: number, table: any) => {
    const $table = $(table);

    // Look for the table with the header row containing "SPINES", "FACILITY", etc.
    const headerRow = $table.find("tr").first();
    const headerCells = headerRow.find("td");

    // Check if this is the facilities table by looking for the expected headers
    if (headerCells.length >= 6) {
      const firstHeader = headerCells.eq(0).text().trim();
      const secondHeader = headerCells.eq(1).text().trim();

      if (firstHeader === "SPINES" && secondHeader === "FACILITY") {
        console.log("Found facilities table");

        // Process each data row (skip header row)
        $table
          .find("tr")
          .slice(1)
          .each((rowIndex: number, row: any) => {
            const $row = $(row);
            const cells = $row.find("td");

            // Skip rows without enough cells
            if (cells.length < 6) return;

            const area = cells.eq(0).text().trim();
            let venue = cells.eq(1).find("b").text().trim();
            const capacityText = cells.eq(2).text().trim();
            const location = cells.eq(3).text().trim();
            const bookableByStaffText = cells.eq(4).text().trim();
            const bookableByStudentOrgsText = cells.eq(5).text().trim();

            // Skip empty rows
            if (!venue || !area) return;

            let remarks = undefined;
            for (const remark of remarksInVenue) {
              if (venue.includes(remark)) {
                venue = venue.replace(`${remark}`, "").trim();
                remarks = remark;
                break;
              }
            }

            // Parse capacity
            const capacity = parseInt(capacityText);
            if (isNaN(capacity)) {
              console.warn(
                `Invalid capacity for ${venue}: ${capacityText}, defaulting to 0`
              );
            }

            // Parse boolean values
            const bookableByStaff = bookableByStaffText.toUpperCase() === "YES";
            const bookableByStudentOrganizations =
              bookableByStudentOrgsText.toUpperCase() === "YES";

            try {
              const venueData: Venue = {
                venue,
                area,
                capacity: isNaN(capacity) ? 0 : capacity,
                location,
                bookableByStaff,
                bookableByStudentOrganizations,
                remarks,
              };

              // Validate with Zod schema
              VenueSchema.parse(venueData);
              venues.push(venueData);
            } catch (error) {
              console.warn(`Failed to parse venue data for ${venue}:`, error);
            }
          });
      }
    }
  });

  return venues;
}

// Main execution
const htmlPath = path.resolve("./out/scrape-facilities.html");
const outputPath = path.resolve("./out/venues.json");

console.log("Reading HTML file...");
const html = fs.readFileSync(htmlPath, "utf8");

console.log("Scraping facilities data...");
const venues = scrapeFacilitiesFromHTML(html);

console.log(`Found ${venues.length} venues`);

// Write to JSON file
fs.writeFileSync(outputPath, JSON.stringify(venues, null, 2));

console.log(`Venues data written to ${outputPath}`);
