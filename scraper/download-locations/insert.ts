import path from "path";
import fs from "fs";
import { LocationSchema } from "./schema";
import {
  locationAltNamesTable,
  locationGeometryTable,
  locationsTable,
} from "../db/schema";
import { getDb } from "../db";

type Db = ReturnType<typeof getDb>;

function* batchIteration(batchSize: number, total: number) {
  for (let i = 0; i < total; i += batchSize) {
    const batch = i;
    const end = Math.min(i + batchSize, total);
    yield { batch, end };
  }
}

async function getLocations(filePath: string) {
  const all = LocationSchema.array().parse(
    JSON.parse(fs.readFileSync(filePath, "utf8"))
  );
  return all;
}

async function doInsertLocations(
  db: Db,
  all: Awaited<ReturnType<typeof getLocations>>
) {
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

async function doInsertLocationAltNames(
  db: Db,
  all: Awaited<ReturnType<typeof getLocations>>
) {
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

async function doInsertLocationGeometry(
  db: Db,
  all: Awaited<ReturnType<typeof getLocations>>
) {
  const locations = await db.select().from(locationsTable);
  const locationToIdMap = new Map<string, number>();
  for (const location of locations) {
    locationToIdMap.set(location.name, location.id);
  }

  const toInsert = [];
  for (const location of all) {
    if (location.geometry.type === "Point") {
      const longitude = location.geometry.coordinates[0];
      const latitude = location.geometry.coordinates[1];
      toInsert.push({
        locationId: locationToIdMap.get(location.name)!,
        longitude,
        latitude,
        order: 0,
      });
    } else if (location.geometry.type === "Polygon") {
      let order = 0;
      for (let i = 0; i < location.geometry.coordinates.length; i++) {
        const coordinate = location.geometry.coordinates[i];
        for (let j = 0; j < coordinate.length; j++) {
          const longitude = coordinate[j][0];
          const latitude = coordinate[j][1];
          toInsert.push({
            locationId: locationToIdMap.get(location.name)!,
            longitude,
            latitude,
            order,
          });
          order++;
        }
      }
    }
  }

  try {
    for (const { batch, end } of batchIteration(1000, toInsert.length)) {
      await db.insert(locationGeometryTable).values(
        toInsert.slice(batch, end).map((t) => ({
          locationId: t.locationId,
          order: t.order,
          longitude: t.longitude,
          latitude: t.latitude,
        }))
      );
    }
  } catch (error) {
    console.log(error);
  }
  console.log("Locations Geometry inserted");
}

export const LOCATIONS_INSERTION_OPTIONS = [
  "Locations",
  "Locations Alt Names",
  "Locations Geometry",
] as const;

export async function insertLocations(
  db: Db,
  options: {
    locationsTransformPath: string;
    options: (typeof LOCATIONS_INSERTION_OPTIONS)[number][];
  }
) {
  const all = await getLocations(options.locationsTransformPath);
  if (options.options.includes("Locations")) {
    await doInsertLocations(db, all);
  }
  if (options.options.includes("Locations Alt Names")) {
    await doInsertLocationAltNames(db, all);
  }
  if (options.options.includes("Locations Geometry")) {
    await doInsertLocationGeometry(db, all);
  }
}
