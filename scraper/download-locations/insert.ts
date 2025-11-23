import path from "path";
import fs from "fs";
import { LocationSchema } from "./schema";
import { locationAltNamesTable, locationsTable } from "../db/schema";
import { db } from "../db";

function* batchIteration(batchSize: number, total: number) {
  for (let i = 0; i < total; i += batchSize) {
    const batch = i;
    const end = Math.min(i + batchSize, total);
    yield { batch, end };
  }
}

async function getLocations(dir: string) {
  const resultsPath = path.resolve(dir, "./out/TRANSFORMED_LOCATIONS.json");
  const all = LocationSchema.array().parse(
    JSON.parse(fs.readFileSync(resultsPath, "utf8"))
  );
  return all;
}

async function doInsertLocations() {
  const all = await getLocations(__dirname);

  try {
    for (const { batch, end } of batchIteration(1000, all.length)) {
      await db.insert(locationsTable).values(
        all.slice(batch, end).map((l) => ({
          category: l.category,
          name: l.name,
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
    }
  } catch (error) {
    console.log(error);
  }
  console.log("Locations inserted");
}

async function doInsertLocationAltNames() {
  const all = await getLocations(__dirname);

  const locations = await db.select().from(locationsTable);
  // Name to id mapping
  const nameToIdMap = new Map<string, number>();
  for (const location of locations) {
    nameToIdMap.set(location.name, location.id);
  }

  const toInsert = [];
  for (const location of all) {
    for (const altName of location.altNames) {
      toInsert.push({
        locationId: nameToIdMap.get(location.name)!,
        altName: altName,
      });
    }
  }

  try {
    for (const { batch, end } of batchIteration(1000, toInsert.length)) {
      await db.insert(locationAltNamesTable).values(toInsert.slice(batch, end));
    }
  } catch (error) {
    console.log(error);
  }
  console.log("Locations Alt names inserted");
}

(async () => {
  await doInsertLocations();
  await doInsertLocationAltNames();
})();
