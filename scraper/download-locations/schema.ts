import { z } from "zod";

const PointGeometrySchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([z.number(), z.number()]),
});

const PolygonGeometrySchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
});

const PoiInfoSchema = z.object({
  id: z.number(),
  poiId: z.number(),
  name: z.string(),
  priority: z.number(),
  lang: z.string().nullable(),
});

const PoiTypeSchema = z.object({
  poiTypeId: z.number(),
  name: z.string(),
  iconId: z.number(),
});

const PoiSchema = z.object({
  poiId: z.number(),
  kind: z.string(),
  nodeId: z.number().nullable(),
  geometry: z.discriminatedUnion("type", [
    PointGeometrySchema,
    PolygonGeometrySchema,
  ]),
  point: PointGeometrySchema,
  campusId: z.number(),
  floorId: z.number().nullable(),
  floorName: z.string().nullable(),
  buildingId: z.number().nullable(),
  buildingName: z.string().nullable(),
  identifierId: z.number().nullable(),
  identifier: z.string().nullable(),
  title: z.string().nullable(),
  deleted: z.boolean(),
  infos: z.array(PoiInfoSchema),
  types: z.array(PoiTypeSchema),
  z: z.number(),
  infoUrl: z.string().nullable(),
  infoUrlText: z.string().nullable(),
  description: z.string().nullable(),
  images: z.array(z.any()), // Empty in example, usually strings or objects
  peopleCapacity: z.number().nullable(),
});

export const MazeMapPOIsDataSchema = z.object({
  pois: z.array(PoiSchema),
});

export const LocationsRawDataSchema = z.array(
  z.object({
    ...PoiSchema.shape,
    campus: z.object({
      campusId: z.number(),
      name: z.string(),
    }),
  })
);

export const LocationsSchema = z.array(
  z.object({
    ...PoiSchema.shape,
    altNames: z.array(z.string()),
    campus: z.object({
      campusId: z.number(),
      name: z.string(),
    }),
  })
);

// To extract the TypeScript type from the schema:
export type MazeMapPOIsData = z.infer<typeof MazeMapPOIsDataSchema>;
export type LocationsRawData = z.infer<typeof LocationsRawDataSchema>;

// // Geometry schemas for different GeoJSON types
// export const PointGeometrySchema = z.object({
//   coordinates: z.tuple([z.number(), z.number()]),
//   type: z.literal("Point"),
// });

// export const PolygonGeometrySchema = z.object({
//   coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
//   type: z.literal("Polygon"),
//   bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
// });

// export const GeometrySchema = z.discriminatedUnion("type", [
//   PointGeometrySchema,
//   PolygonGeometrySchema,
// ]);

// export const MapsindoorsLocationSchema = z.object({
//   id: z.string(),
//   type: z.literal("Feature"),
//   geometry: GeometrySchema,
//   properties: z.object({
//     name: z.string(),
//     aliases: z.array(z.string()),
//     categories: z.record(z.string(), z.string()),
//     floor: z.string(),
//     floorName: z.string(),
//     building: z.string().nullable(),
//     venue: z.string(),
//     type: z.string(),
//     imageURL: z.string().nullable(),
//     locationType: z.string(),
//     mapElement: z.string(),
//     anchor: z.object({
//       coordinates: z.tuple([z.number(), z.number()]),
//       type: z.literal("Point"),
//     }),
//     status: z.number(),
//     locationSettings: z.unknown().nullable(), // Adjust this if you have a specific schema for locationSettings
//     roomId: z.string().nullable(),
//   }),
// });

// export const ALL_CATEGORIES = [
//   "AcademicFacilities",
//   "Accomodations",
//   "Art",
//   "BOH",
//   "BuildingsLandmarks",
//   "BusStop",
//   "Carparks",
//   "Clinics and Childcare",
//   "CollegesSchoolsInstitutes",
//   "Commercials",
//   "Emergency",
//   "Events and Activities",
//   "Food and Beverages",
//   "General",
//   "Handicapped Facilities",
//   "LabsStudioWorkshops",
//   "Libraries",
//   "MeetingRooms",
//   "OfficesDepartments",
//   "ResearchCentres",
//   "StudentsSportsRecreation",
//   "Toilet",
//   "Unknown",
// ] as const;

// export const LocationSchema = z.object({
//   category: z.enum(ALL_CATEGORIES),
//   name: z.string(),
//   altNames: z.string().array(),
//   building: z.string().nullable(),
//   type: z.string(),
//   imageUrl: z.string().nullable(),
//   floor: z.string(),
//   floorName: z.string(),
//   venue: z.string(),
//   geometry: GeometrySchema,
//   anchor: z.tuple([z.number(), z.number()]),
//   // Mapindoors sourcing.
//   mapIndoorsSource: z.object({
//     id: z.string(),
//     roomId: z.string().nullable(),
//   }),
// });

// export const CategoriesMetadataSchema = z
//   .object({
//     key: z.enum(ALL_CATEGORIES),
//     path: z.string(),
//   })
//   .array();
