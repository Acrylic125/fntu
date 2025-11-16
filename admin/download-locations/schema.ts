import { z } from "zod";

// Geometry schemas for different GeoJSON types
export const PointGeometrySchema = z.object({
  coordinates: z.tuple([z.number(), z.number()]),
  type: z.literal("Point"),
});

export const PolygonGeometrySchema = z.object({
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
  type: z.literal("Polygon"),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
});

export const GeometrySchema = z.discriminatedUnion("type", [
  PointGeometrySchema,
  PolygonGeometrySchema,
]);

export const MapsindoorsLocationSchema = z.object({
  id: z.string(),
  type: z.literal("Feature"),
  geometry: GeometrySchema,
  properties: z.object({
    name: z.string(),
    aliases: z.array(z.string()),
    categories: z.record(z.string(), z.string()),
    floor: z.string(),
    floorName: z.string(),
    building: z.string().nullable(),
    venue: z.string(),
    type: z.string(),
    imageURL: z.string().nullable(),
    locationType: z.string(),
    mapElement: z.string(),
    anchor: z.object({
      coordinates: z.tuple([z.number(), z.number()]),
      type: z.literal("Point"),
    }),
    status: z.number(),
    locationSettings: z.unknown().nullable(), // Adjust this if you have a specific schema for locationSettings
    roomId: z.string().nullable(),
  }),
});

export const ALL_CATEGORIES = [
  "AcademicFacilities",
  "LabsStudioWorkshops",
  "General",
] as const;

export const LocationSchema = z.object({
  category: z.enum(ALL_CATEGORIES),
  name: z.string(),
  altNames: z.string().array(),
  building: z.string().nullable(),
  type: z.string(),
  imageUrl: z.string().nullable(),
  floor: z.string(),
  floorName: z.string(),
  venue: z.string(),
  geometry: GeometrySchema,
  anchor: z.tuple([z.number(), z.number()]),
  // Mapindoors sourcing.
  mapIndoorsSource: z.object({
    id: z.string(),
    roomId: z.string().nullable(),
  }),
});
