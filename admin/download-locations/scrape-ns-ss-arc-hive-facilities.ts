import * as cheerio from "cheerio";
import path from "path";
import fs from "fs";
import z from "zod";

export const FacilitySchema = z.object({
  venue: z.string(), // Facility
  area: z.string(), // Spine
  capacity: z.number(), // Capacity
  location: z.string(), // Location
  bookableByStaff: z.boolean(), // Bookable by staff
  bookableByStudentOrganizations: z.boolean(), // Bookable by student organizations
  remarks: z.string().optional(), // Remarks
  locationRemarks: z.string().optional(), // Location Remarks
});

export const FacilityArraySchema = z.array(FacilitySchema);

export type Facility = z.infer<typeof FacilitySchema>;

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

function scrapeFacilitiesFromHTML(html: string): Facility[] {
  const venues: Facility[] = [];
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
              const venueData: Facility = {
                venue,
                area,
                capacity: isNaN(capacity) ? 0 : capacity,
                location,
                bookableByStaff,
                bookableByStudentOrganizations,
                remarks,
              };

              // Validate with Zod schema
              FacilitySchema.parse(venueData);
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

// function stripLocationRemarks(location: string) {
//   const splitLocation = location.split(" ");
//   if (splitLocation.length === 0) {
//     return null;
//   }
//   const realLocation = splitLocation[0].replace(",", "");
//   const locationRemarks = splitLocation.slice(1).join(" ");
//   return { realLocation, locationRemarks };
// }

function transformFacility(facility: Facility): Facility {
  let location = facility.location;
  let locationRemarks = "";
  const splitLocation = location.split(" ");
  if (splitLocation.length > 1) {
    location = splitLocation[0].replace(",", "");
    locationRemarks = splitLocation.slice(1).join(" ");
  }

  return { ...facility, location, locationRemarks };
}

// Main execution
(async () => {
  const workDir = `${__dirname}/out`;
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir);
  }

  const url = "https://wis.ntu.edu.sg/pls/webexe88/FBSDOCU.FBSLOCATN";
  const response = await fetch(url);
  const html = await response.text();

  console.log("Writing HTML to file...");
  // Only used for a reference.
  fs.writeFileSync(
    path.resolve(workDir, "mappings-raw_scrape-ns-ss-arc-hive-facilities.html"),
    html
  );

  const rawOutputPath = path.resolve(
    workDir,
    "mappings-raw_facilities-ns-ss-arc-hive.json"
  );
  const mappingsOutputPath = path.resolve(
    workDir,
    "mappings_facilities-ns-ss-arc-hive.json"
  );

  console.log("Scraping facilities data...");
  const facilities = scrapeFacilitiesFromHTML(html);

  console.log(`Found ${facilities.length} venues`);
  // Strip location remarks
  const transformedFacilities = facilities.map(transformFacility);

  // Write to JSON file
  fs.writeFileSync(
    rawOutputPath,
    JSON.stringify(transformedFacilities, null, 2)
  );

  console.log(`Raw facilotoes data written to ${rawOutputPath}`);

  let mappings: Record<string, string> = {};
  for (const facility of transformedFacilities) {
    mappings[facility.location] = facility.venue;
  }
  fs.writeFileSync(mappingsOutputPath, JSON.stringify(mappings, null, 2));

  console.log(`Mappings data written to ${mappingsOutputPath}`);
})();
