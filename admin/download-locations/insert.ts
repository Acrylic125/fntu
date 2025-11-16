import path from "path";
import fs from "fs";
import { LocationSchema } from "./schema";
import { locationsTable } from "../db/schema";
import { db } from "../db";

function* batchIteration(batchSize: number, total: number) {
  for (let i = 0; i < total; i += batchSize) {
    const batch = i;
    const end = Math.min(i + batchSize, total);
    yield { batch, end };
  }
}

async function getLocations(dir: string) {
  const resultsPath = path.resolve(dir, "./out/facilities-transformed.json");
  const all = LocationSchema.array().parse(
    JSON.parse(fs.readFileSync(resultsPath, "utf8"))
  );
  return all;
}

async function doInsertLocations() {
  const all = await getLocations(__dirname);

  try {
    for (const { batch, end } of batchIteration(100, all.length)) {
      await db.insert(locationsTable).values(
        all.slice(batch, end).map((l) => ({
          category: l.category,
          name: l.name,
          altNames: l.altNames,
          building: l.building,
          floor: l.floor,
          floorName: l.floorName,
          venue: l.venue,
          type: l.type,
          imageUrl: l.imageUrl,
          mapIndoorsId: l.mapIndoorsSource.id,
          mapIndoorsRoomId: l.mapIndoorsSource.roomId,
        }))
      );
      console.log("Inserted batch");
    }
  } catch (error) {
    console.log(error);
    // console.error(`Error inserting locations: ${error}`);
  }
  console.log("Locations inserted");
}

(async () => {
  await doInsertLocations();
})();
