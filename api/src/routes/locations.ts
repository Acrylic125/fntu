import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import {
  locationAltNamesTable,
  locationGeometryTable,
  locationsTable,
  programsTable,
} from "../db/schema";
import { and, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import { API_PARAMS } from "../open-api";
import { getDb } from "../db";

export const locationsRoute = new Hono();

locationsRoute.get(
  "/categories",
  describeRoute({
    parameters: API_PARAMS,
    responses: {
      200: {
        description: "Successful response",
      },
    },
  }),
  async (c) => {
    const categories = await getDb()
      .select({
        category: locationsTable.category,
      })
      .from(locationsTable)
      .groupBy(locationsTable.category);
    return c.json(categories.map((category) => category.category));
  }
);

locationsRoute.get(
  "/buildings",
  describeRoute({
    parameters: API_PARAMS,
    responses: {
      200: {
        description: "Successful response",
      },
    },
  }),
  async (c) => {
    const buildings = await getDb()
      .select({
        building: locationsTable.building,
      })
      .from(locationsTable)
      .groupBy(locationsTable.building);
    return c.json(buildings.map((building) => building.building));
  }
);

locationsRoute.get(
  "/",
  validator(
    "query",
    z.object({
      search: z.string().optional(),
      category: z
        .enum([
          "CollegesSchoolsInstitutes",
          "Art",
          "BOH",
          "AcademicFacilities",
          "Events and Activities",
          "ResearchCentres",
          "Accomodations",
          "BusStop",
          "Handicapped Facilities",
          "Unknown",
          "LabsStudioWorkshops",
          "Clinics and Childcare",
          "MeetingRooms",
          "Libraries",
          "BuildingsLandmarks",
          "Emergency",
          "StudentsSportsRecreation",
          "OfficesDepartments",
          "Food and Beverages",
          "Carparks",
          "General",
          "Commercials",
        ])
        .optional(),
      building: z
        .enum([
          "S4",
          "S3.2",
          "N4",
          "NMS",
          "SRC",
          "N4.1",
          "S3",
          "ADM",
          "N1.3",
          "SMS",
          "S2",
          "N2.1",
          "S3.1",
          "N3",
          "TheArc",
          "S1",
          "N2",
          "TheWave",
          "THE_HIVE",
          "SSC",
          "N3.1",
          "SPMS",
          "N1.2",
          "N1.1",
          "HSS",
          "RTP",
          "SBS",
          "ABS",
          "S2.1",
          "S2.2",
          "AdminBuilding",
          "N1",
          "WKWSCI",
          "N3.1A",
          "N3.2",
        ])
        .optional(),
      cursor: z.coerce.number().optional(),
      limit: z.coerce.number().min(1).max(20).default(20),
    })
  ),
  describeRoute({
    parameters: API_PARAMS,
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                locations: z.array(
                  z.object({
                    id: z.number(),
                    name: z.string(),
                    category: z.string(),
                    building: z.string().nullable(),
                    floor: z.string(),
                    floorName: z.string(),
                    venue: z.string(),
                    type: z.string(),
                    imageUrl: z.string().nullable(),
                    mapIndoorsId: z.string(),
                    mapIndoorsRoomId: z.string().nullable(),
                  })
                ),
                pagination: z.object({
                  nextCursor: z.string().nullable(),
                }),
              })
            ),
          },
        },
      },
    },
  }),
  async (c) => {
    const query = c.req.valid("query");
    const whereConditions = [];
    if (query.search) {
      whereConditions.push(ilike(locationsTable.name, `%${query.search}%`));
    }
    if (query.cursor) {
      whereConditions.push(gte(locationsTable.id, query.cursor));
    }
    if (query.category) {
      whereConditions.push(eq(locationsTable.category, query.category));
    }
    if (query.building) {
      whereConditions.push(eq(locationsTable.building, query.building));
    }
    const locations = await getDb()
      .select({
        id: locationsTable.id,
        name: locationsTable.name,
        category: locationsTable.category,
        building: locationsTable.building,
        floor: locationsTable.floor,
        floorName: locationsTable.floorName,
        venue: locationsTable.venue,
        type: locationsTable.type,
        imageUrl: locationsTable.imageUrl,
        mapIndoorsId: locationsTable.mapIndoorsId,
        mapIndoorsRoomId: locationsTable.mapIndoorsRoomId,
      })
      .from(locationsTable)
      .where(and(...whereConditions))
      .groupBy(locationsTable.id)
      .limit(query.limit + 1)
      .orderBy(locationsTable.id);
    const locationIds = locations.map((location) => location.id);
    const altNames = await getDb()
      .select({
        altName: locationAltNamesTable.altName,
        locationId: locationAltNamesTable.locationId,
      })
      .from(locationAltNamesTable)
      .where(inArray(locationAltNamesTable.locationId, locationIds));

    const altNamesMap = new Map<number, string[]>();
    for (const altName of altNames) {
      const existingAltNames = altNamesMap.get(altName.locationId) ?? [];
      existingAltNames.push(altName.altName);
      altNamesMap.set(altName.locationId, existingAltNames);
    }

    return c.json({
      locations: locations.map((location) => ({
        ...location,
        altNames: altNamesMap.get(location.id) ?? [],
      })),
      pagination: {
        nextCursor:
          locations.length > query.limit
            ? locations[locations.length - 1].id
            : null,
      },
    });
  }
);

locationsRoute.get(
  "/:id",
  validator(
    "param",
    z.object({
      id: z.coerce.number(),
    })
  ),
  describeRoute({
    parameters: API_PARAMS,
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                id: z.number(),
                name: z.string(),
                category: z.string(),
                building: z.string().nullable(),
                floor: z.string(),
                floorName: z.string(),
                venue: z.string(),
                type: z.string(),
                imageUrl: z.string().nullable(),
                mapIndoorsId: z.string(),
                mapIndoorsRoomId: z.string().nullable(),
              })
            ),
          },
        },
      },
      404: {
        description: "Location not found",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                error: z.literal("Location not found"),
              })
            ),
          },
        },
      },
    },
  }),
  async (c) => {
    const params = c.req.valid("param");

    const location = await getDb()
      .select()
      .from(locationsTable)
      .where(eq(locationsTable.id, params.id));
    if (location.length === 0) {
      return c.json({ error: "Location not found" }, 404);
    }
    const altNames = await getDb()
      .select({
        altName: locationAltNamesTable.altName,
        locationId: locationAltNamesTable.locationId,
      })
      .from(locationAltNamesTable)
      .where(eq(locationAltNamesTable.locationId, params.id));
    return c.json({
      ...location[0],
      altNames: altNames.map((altName) => altName.altName),
    });
  }
);

locationsRoute.get(
  "/:id/geometry",
  validator("param", z.object({ id: z.coerce.number() })),
  describeRoute({
    parameters: API_PARAMS,
    responses: {
      200: {
        description: "Successful response",
      },
    },
  }),
  async (c) => {
    const params = c.req.valid("param");
    const geometry = await getDb()
      .select({
        longitude: locationGeometryTable.longitude,
        latitude: locationGeometryTable.latitude,
        order: locationGeometryTable.order,
      })
      .from(locationGeometryTable)
      .where(eq(locationGeometryTable.locationId, params.id))
      .orderBy(locationGeometryTable.order);
    return c.json(geometry);
  }
);
