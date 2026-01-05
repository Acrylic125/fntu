import fs from "fs";
import {
  LocationsRawData,
  LocationsRawDataSchema,
  LocationsSchema,
} from "./schema";
import {
  campusTable,
  locationsTable,
  locationTypesTable,
  locationTypeLocationsTable,
  locationAltNamesTable,
} from "../db/schema";
import { getDb } from "../db";
import z from "zod";

type Db = ReturnType<typeof getDb>;

function* batchIteration(batchSize: number, total: number) {
  for (let i = 0; i < total; i += batchSize) {
    const batch = i;
    const end = Math.min(i + batchSize, total);
    yield { batch, end };
  }
}

async function getLocationsData(filePath: string) {
  const all = LocationsSchema.parse(
    JSON.parse(fs.readFileSync(filePath, "utf8"))
  );
  return all;
}

async function doInsertCampuses(db: Db, all: LocationsRawData) {
  try {
    const campuses = new Set<string>();
    for (const l of all) {
      campuses.add(l.campus.name);
    }
    await db
      .insert(campusTable)
      .values(
        Array.from(campuses).map((c) => ({
          name: c,
          mazeMapId: c,
          mazeMapCampusId: 0,
        }))
      )
      .onConflictDoNothing();
    console.log("Campuses inserted");
  } catch (error) {
    console.log(error);
  }
}

function mercatorToLatLon(x: number, y: number): { lat: number; lon: number } {
  const R = 6378137; // Earth radius in meters

  const lon = (x / R) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);

  return { lat, lon };
}

async function doInsertLocationsTypes(db: Db, all: LocationsRawData) {
  try {
    const locationTypes = new Set(
      all.flatMap((l) => l.types.map((t) => t.name))
    );
    await db
      .insert(locationTypesTable)
      .values(Array.from(locationTypes).map((t) => ({ name: t })))
      .onConflictDoNothing();
    console.log("Locations Types inserted");
  } catch (error) {
    console.log(error);
  }
}

async function doInsertLocations(db: Db, all: LocationsRawData) {
  try {
    const campuses = await db.select().from(campusTable);
    const campusToIdMap = new Map<string, number>();
    for (const campus of campuses) {
      campusToIdMap.set(campus.name, campus.id);
    }
    const types = await db.select().from(locationTypesTable);
    const typeToIdMap = new Map<string, number>();
    for (const type of types) {
      typeToIdMap.set(type.name, type.id);
    }

    for (const { batch, end } of batchIteration(1000, all.length)) {
      await db
        .insert(locationsTable)
        .values(
          all.slice(batch, end).map((l) => {
            const campusId = campusToIdMap.get(l.campus.name);
            if (!campusId) {
              throw new Error(
                `Campus ${l.campus.name} not found. Please insert the campus first.`
              );
            }

            // Mazemap coordinates uses Web Mercator. Convert it accordingly.
            const { lat, lon } = mercatorToLatLon(
              l.point.coordinates[0],
              l.point.coordinates[1]
            );
            return {
              name: l.title,
              description: l.description,
              floorName: l.floorName,
              building: l.buildingName,
              campusId,
              mazeMapPoiId: l.poiId,
              mazeMapIdentifier: l.identifier,
              longitude: lon,
              latitude: lat,
              z: l.z,
            };
          })
        )
        .onConflictDoNothing();
      // .returning({
      //   id: locationsTable.id,
      //   mazeMapPoiId: locationsTable.mazeMapPoiId,
      // });
      // console.log(`Inserted ${ids.length} locations`);
      // for (const id of ids) {
      //   mazeMapPoiIdToLocationIdMap.set(id.mazeMapPoiId, id.id);
      // }
    }

    const mazeMapPoiIdToLocationIdMap = new Map<number, number>();
    const locations = await db.select().from(locationsTable);
    for (const location of locations) {
      mazeMapPoiIdToLocationIdMap.set(location.mazeMapPoiId, location.id);
    }

    const toInsertTypes: { typeId: number; locationId: number }[] = [];
    for (const l of all) {
      const locationId = mazeMapPoiIdToLocationIdMap.get(l.poiId);
      if (!locationId) {
        throw new Error(
          `Location ${l.poiId} not found. Please insert the location first. (This should not happen)`
        );
      }
      for (const type of l.types) {
        const typeId = typeToIdMap.get(type.name);
        if (!typeId) {
          throw new Error(
            `Type ${type.name} not found. Please insert the location types first.`
          );
        }
        toInsertTypes.push({ typeId, locationId });
      }
    }
    await db
      .insert(locationTypeLocationsTable)
      .values(toInsertTypes)
      .onConflictDoNothing();
    console.log("Locations inserted");
  } catch (error) {
    console.log(error);
  }
}

// async function getLocations(filePath: string) {
//   const all = LocationsRawDataSchema.array().parse(
//     JSON.parse(fs.readFileSync(filePath, "utf8"))
//   );
//   return all;
// }

// async function doInsertLocations(
//   db: Db,
//   all: Awaited<ReturnType<typeof getLocations>>
// ) {
//   try {
//     for (const { batch, end } of batchIteration(1000, all.length)) {
//       await db.insert(locationsTable).values(
//         all.slice(batch, end).map((l) => ({
//           category: l.category,
//           name: l.name,
//           building: l.building,
//           floor: l.floor,
//           floorName: l.floorName,
//           venue: l.venue,
//           type: l.type,
//           imageUrl: l.imageUrl,
//           mapIndoorsId: l.mapIndoorsSource.id,
//           mapIndoorsRoomId: l.mapIndoorsSource.roomId,
//         }))
//       );
//     }
//   } catch (error) {
//     console.log(error);
//   }
//   console.log("Locations inserted");
// }

async function doInsertLocationAltNames(
  db: Db,
  all: z.infer<typeof LocationsSchema>
) {
  // MazeMapPoiId to location id mapping
  const mazeMapPoiIdToLocationIdMap = new Map<number, number>();
  const locations = await db.select().from(locationsTable);
  for (const location of locations) {
    mazeMapPoiIdToLocationIdMap.set(location.mazeMapPoiId, location.id);
  }

  const toInsert = [];
  for (const location of all) {
    for (const altName of location.altNames) {
      const locationId = mazeMapPoiIdToLocationIdMap.get(location.poiId);
      if (!locationId) {
        throw new Error(
          `Location ${location.poiId} not found. Please insert the location first. (This should not happen)`
        );
      }
      toInsert.push({
        locationId,
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

// async function doInsertLocationGeometry(
//   db: Db,
//   all: Awaited<ReturnType<typeof getLocations>>
// ) {
//   const locations = await db.select().from(locationsTable);
//   const locationToIdMap = new Map<string, number>();
//   for (const location of locations) {
//     locationToIdMap.set(location.name, location.id);
//   }

//   const toInsert = [];
//   for (const location of all) {
//     if (location.geometry.type === "Point") {
//       const longitude = location.geometry.coordinates[0];
//       const latitude = location.geometry.coordinates[1];
//       toInsert.push({
//         locationId: locationToIdMap.get(location.name)!,
//         longitude,
//         latitude,
//         order: 0,
//       });
//     } else if (location.geometry.type === "Polygon") {
//       let order = 0;
//       for (let i = 0; i < location.geometry.coordinates.length; i++) {
//         const coordinate = location.geometry.coordinates[i];
//         for (let j = 0; j < coordinate.length; j++) {
//           const longitude = coordinate[j][0];
//           const latitude = coordinate[j][1];
//           toInsert.push({
//             locationId: locationToIdMap.get(location.name)!,
//             longitude,
//             latitude,
//             order,
//           });
//           order++;
//         }
//       }
//     }
//   }

//   try {
//     for (const { batch, end } of batchIteration(1000, toInsert.length)) {
//       await db.insert(locationGeometryTable).values(
//         toInsert.slice(batch, end).map((t) => ({
//           locationId: t.locationId,
//           order: t.order,
//           longitude: t.longitude,
//           latitude: t.latitude,
//         }))
//       );
//     }
//   } catch (error) {
//     console.log(error);
//   }
//   console.log("Locations Geometry inserted");
// }

export const LOCATIONS_INSERTION_OPTIONS = [
  "Locations Types",
  "Locations Campuses",
  "Locations",
  "Locations Alt Names",
  // "Locations Geometry",
] as const;

export async function insertLocations(
  db: Db,
  options: {
    locationsTransformPath: string;
    options: (typeof LOCATIONS_INSERTION_OPTIONS)[number][];
  }
) {
  const all = await getLocationsData(options.locationsTransformPath);
  if (options.options.includes("Locations Campuses")) {
    await doInsertCampuses(db, all);
  }
  if (options.options.includes("Locations Types")) {
    await doInsertLocationsTypes(db, all);
  }
  if (options.options.includes("Locations")) {
    await doInsertLocations(db, all);
  }
  if (options.options.includes("Locations Alt Names")) {
    await doInsertLocationAltNames(db, all);
  }
}
