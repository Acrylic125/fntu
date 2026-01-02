import fs from "fs";
import { MazeMapPOIsDataSchema, LocationsRawDataSchema } from "./schema";
import { z } from "zod";
import path from "path";

export const CampusDataSchema = z.object({
  campusIds: z.array(z.number()),
  campuses: z.array(
    z.object({
      campusId: z.number(),
      center: z.object({
        type: z.literal("Point"),
        coordinates: z.tuple([z.number(), z.number()]),
      }),
      defaultZLevel: z.number(),
      distanceUnitsType: z.string(),
      externalId: z.string().nullable(),
      geometry: z.object({
        type: z.literal("Polygon"),
        coordinates: z.array(z.array(z.array(z.number()))),
      }),
      name: z.string(),
      poiTypesSelectableInApp: z.array(z.number()),
      routing: z.boolean(),
      routingStepByStep: z.boolean(),
      snapToCurrentRoute: z.boolean(),
      snapToCurrentRouteMaxMeters: z.number(),
      snapToPath: z.boolean(),
      snapToPathMaxMeters: z.number(),
      unsnappedTimeout: z.number(),
      updateFrequency: z.number(),
      useGeolocate: z.boolean(),
      versionTimestamp: z.string().datetime({ offset: true }),
      wheelchair: z.boolean(),
    })
  ),
  name: z.string().nullable(),
  tag: z.string(),
  versionTimestamp: z.string().datetime({ offset: true }),
});

export async function downloadCampuses() {
  const response = await fetch(
    "https://api.mazemap.com/api/campuscollection/ntu-sg/?withcampuses=true"
  );
  const data = await response.json();
  return CampusDataSchema.parse(data);
}

export async function downloadLocations(locationsPath: string) {
  const campuses = await downloadCampuses();
  const locationsData: z.infer<typeof LocationsRawDataSchema> = [];
  for (const campus of campuses.campuses) {
    let fromId = 0;
    while (true) {
      const response = await fetch(
        `https://api.mazemap.com/api/campus/${campus.campusId}/pois/?fromid=${fromId}`
      );
      const data = await response.json();
      const res = MazeMapPOIsDataSchema.parse(data);
      if (res.pois.length === 0) {
        break;
      }
      locationsData.push(
        ...res.pois.map((poi) => ({
          ...poi,
          campus: {
            campusId: campus.campusId,
            name: campus.name,
          },
        }))
      );
      fromId = res.pois[res.pois.length - 1].poiId + 1;
    }
  }
  fs.writeFileSync(locationsPath, JSON.stringify(locationsData, null, 2));
}
