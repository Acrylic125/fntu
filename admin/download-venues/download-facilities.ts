import fs from "fs";
import { ALL_CATEGORIES, MapsindoorsLocationSchema } from "./schema";

export async function downloadFacilities(category: string) {
  const response = await fetch(
    `https://api.mapsindoors.com/ntuprod/api/locations?venue=NTU&categories=${category}&take=1000&skip=0&orderBy=relevance&extendedLocations=true&lr=en-US`
  );
  const data = await response.json();
  const locations = MapsindoorsLocationSchema.array().parse(data);
  return locations;
}

(async () => {
  // Create out directory if not exist.
  if (!fs.existsSync("./out")) {
    fs.mkdirSync("./out");
  }
  const categories = ALL_CATEGORIES;
  for (const category of categories) {
    const locations = await downloadFacilities(category);
    fs.writeFileSync(
      `./out/${category}.json`,
      JSON.stringify(locations, null, 2)
    );
  }
})();
