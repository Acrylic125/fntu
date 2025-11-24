import fs from "fs";
import {
  ALL_CATEGORIES,
  CategoriesMetadataSchema,
  MapsindoorsLocationSchema,
} from "./schema";
import { z } from "zod";
import path from "path";

const CategoriesPayload = z
  .object({
    key: z.string(),
    value: z.string(),
  })
  .array();

export async function downloadAllCategories() {
  // const response = await fetch(
  //   "https://api.mapsindoors.com/ntuprod/api/categories"
  // );
  // console.log(response.ok);
  // // Print out raw body
  // const body = await response.text();
  // console.log(body);

  // const data = await response.json();
  // console.log(data);
  // const categories = CategoriesPayload.parse(data);
  // return categories;

  // The above code may not work via fetch for some stupid reason.
  // Go to https://api.mapsindoors.com/ntuprod/api/categories and copy the raw body.
  return [
    {
      key: "AcademicFacilities",
      value: "Academic Facilities",
      childKeys: [],
      fields: {},
    },
    {
      key: "Accomodations",
      value: "Accommodations",
      childKeys: [],
      fields: {},
    },
    { key: "Art", value: "Art", childKeys: [], fields: {} },
    { key: "BOH", value: "BOH", childKeys: [], fields: {} },
    {
      key: "BuildingsLandmarks",
      value: "Buildings and Landmarks",
      childKeys: [],
      fields: {},
    },
    { key: "BusStop", value: "Bus Stops", childKeys: [], fields: {} },
    { key: "Carparks", value: "Carparks", childKeys: [], fields: {} },
    {
      key: "Clinics and Childcare",
      value: "Clinics and Childcare Centres",
      childKeys: [],
      fields: {},
    },
    {
      key: "CollegesSchoolsInstitutes",
      value: "Colleges, Schools and Institutes",
      childKeys: [],
      fields: {},
    },
    { key: "Commercials", value: "Retails", childKeys: [], fields: {} },
    { key: "Emergency", value: "Emergency", childKeys: [], fields: {} },
    {
      key: "Events and Activities",
      value: "Events and Activities",
      childKeys: [],
      fields: {},
    },
    {
      key: "Food and Beverages",
      value: "Food and Beverages",
      childKeys: [],
      fields: {},
    },
    { key: "General", value: "General", childKeys: [], fields: {} },
    {
      key: "Handicapped Facilities",
      value: "Handicapped Facilities",
      childKeys: [],
      fields: {},
    },
    {
      key: "LabsStudioWorkshops",
      value: "Labs, Studios and Workshops",
      childKeys: [],
      fields: {},
    },
    { key: "Libraries", value: "Libraries", childKeys: [], fields: {} },
    { key: "MeetingRooms", value: "Meeting Rooms", childKeys: [], fields: {} },
    {
      key: "OfficesDepartments",
      value: "Offices and Departments",
      childKeys: [],
      fields: {},
    },
    {
      key: "ResearchCentres",
      value: "Research Centres",
      childKeys: [],
      fields: {},
    },
    {
      key: "StudentsSportsRecreation",
      value: "Students, Sports and Recreation",
      childKeys: [],
      fields: {},
    },
    { key: "Toilet", value: "WC", childKeys: [], fields: {} },
    { key: "Unknown", value: "Unknown", childKeys: [], fields: {} },
  ];
}

export async function downloadFacilities(category: string) {
  const response = await fetch(
    `https://api.mapsindoors.com/ntuprod/api/locations?venue=NTU&categories=${category}&take=1000&skip=0&orderBy=relevance&extendedLocations=true&lr=en-US`
  );
  const data = await response.json();
  const locations = MapsindoorsLocationSchema.array().parse(data);
  return locations;
}

export async function downloadMapIndoors(
  outputDir: string,
  metadataPath: string
) {
  const categories = await downloadAllCategories();
  const categoriesArray = categories.map((category) => category.key);
  const categoriesMetadata: z.infer<typeof CategoriesMetadataSchema> = [];
  for (const category of categoriesArray) {
    if (!ALL_CATEGORIES.includes(category as (typeof ALL_CATEGORIES)[number])) {
      continue;
    }
    const locations = await downloadFacilities(category.replace(" ", "+"));
    const categoryPath = path.resolve(outputDir, `${category}.json`);
    fs.writeFileSync(categoryPath, JSON.stringify(locations, null, 2));
    categoriesMetadata.push({
      key: category as (typeof ALL_CATEGORIES)[number],
      path: categoryPath,
    });
  }
  fs.writeFileSync(metadataPath, JSON.stringify(categoriesMetadata, null, 2));
}
