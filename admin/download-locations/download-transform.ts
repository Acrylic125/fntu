import fs from "fs";
import {
  ALL_CATEGORIES,
  LocationSchema,
  MapsindoorsLocationSchema,
} from "./schema";
import { z } from "zod";
import path from "path";
import { SCHOOLS_WITH_MAPPINGS } from "./scrape-schools";

const MapsindoorsLocationArraySchema = z.array(MapsindoorsLocationSchema);
const LocationsArraySchema = z.array(LocationSchema);

const MappingSchema = z.record(z.string(), z.string());

let ROOM_ID_MAPPINGS: Record<string, string> = {};
let NAME_MAPPINGS: Record<string, string> = {};

function loadMappings(workDir: string) {
  let roomIdMappings = MappingSchema.parse(
    JSON.parse(
      fs.readFileSync(
        path.resolve(workDir, "mappings_facilities-ns-ss-arc-hive.json"),
        "utf8"
      )
    )
  );
  const schools = SCHOOLS_WITH_MAPPINGS;
  for (const school of schools) {
    const mappings = MappingSchema.parse(
      JSON.parse(
        fs.readFileSync(
          path.resolve(workDir, `mappings_facilities-${school}.json`),
          "utf8"
        )
      )
    );
    for (const [roomId, venue] of Object.entries(mappings)) {
      if (
        roomIdMappings[roomId] !== undefined &&
        roomIdMappings[roomId] !== venue
      ) {
        throw new Error(
          `Room ID ${roomId} has multiple venues: ${roomIdMappings[roomId]} and ${venue}`
        );
      }
      roomIdMappings[roomId] = venue;
    }
  }

  // Name mappings.
  const nameMappings: Record<string, string> = {};
  for (let i = 1; i <= 3; i++) {
    nameMappings[`ICC CoILab ${i} (EMB)`] = `COLLAB ${i}`;
    nameMappings[`Software Lab ${i} (N4)`] = `SWLAB${i}`;
    nameMappings[`Hardware Lab ${i} (N4)`] = `HWLAB${i}`;
  }

  return { roomIdMappings, nameMappings };
}

function mapByRoomId(roomId: string) {
  const altNames: string[] = [];
  // ABS-0[1-3]-LT${i}$ -> ABS LT[1-10]
  for (let i = 1; i <= 20; i++) {
    const pattern = new RegExp(`ABS-0[1-3]-LT${i}$`);
    if (roomId.match(pattern)) {
      altNames.push(`ABS LT${i}`);
    }
  }
  // ABS-0[1-3]-SR${i}$ -> ABS-SR[1-14]
  for (let i = 1; i <= 20; i++) {
    const pattern = new RegExp(`ABS-0[1-3]-SR${i}$`);
    if (roomId.match(pattern)) {
      altNames.push(`ABS-SR${i}`);
    }
  }
  // ART-0[1-5]-${i}$ -> ART-0[1-5]-[1-50]
  if (roomId.match(new RegExp(`ART-(B|0)[1-5]-[0-9]*(A|B)*$`))) {
    const [_, floor, room] = roomId.split("-");
    const removePrefixRoom0 = room.replace(/^0+/, "");
    const removePrefixFloor0 = floor.replace(/^0+/, "");
    const temp = new Set<string>();
    temp.add(`ART-${floor}-${room}`);
    temp.add(`ART-${floor}-${removePrefixRoom0}`);
    temp.add(`ART-${removePrefixFloor0}-${removePrefixRoom0}`);
    temp.add(`ART-${removePrefixFloor0}-${room}`);
    altNames.push(...temp);
  }

  const roomIdMapping = ROOM_ID_MAPPINGS[roomId];
  if (roomIdMapping) {
    altNames.push(roomIdMapping);
  }

  return altNames;
}

function mapByName(name: string) {
  const altNames: string[] = [];
  // NS and SS TRs
  if (
    name.match(new RegExp(`Tutorial Room \\+ [0-9]+ \\((S|N)([0-9]|(S|N))\\)$`))
  ) {
    const [, , , room] = name.split(" ");
    altNames.push(`TR+${room}`);
  }

  const BUILDING_PREFIXES = [
    ["The Arc", "LHN"],
    ["The Hive", "LHS"],
    ["SPMS", "SPMS"],
    ["SBS", "SBS"],
    ["HSS", "HSS"],
    ["SHHK", "HSS"], // They are they same.
  ];

  for (const [building, prefix] of BUILDING_PREFIXES) {
    if (name.match(new RegExp(`Tutorial Room \\+ [0-9]+ \\(${building}\\)$`))) {
      const [, , , room] = name.split(" ");
      if (room.length === 1) {
        altNames.push(`${prefix}-TR+0${room}`);
        altNames.push(`${prefix} TR+0${room}`);
      }
      altNames.push(`${prefix}-TR+${room}`);
      altNames.push(`${prefix} TR+${room}`);
    }
  }

  // BIE
  if (
    name.match(
      new RegExp(`Tutorial Room \\+ [0-9]+ - BIE \\(([A-Z]|[0-9]|\\.)+\\)$`)
    )
  ) {
    const [, , , , room] = name.split(" ");
    if (name.length === 1) {
      altNames.push(`BIE-TR+0${room}`);
    }
    altNames.push(`BIE-TR+${room}`);
  }

  if (name.match(new RegExp(`LT[0-9]+(A|) \\((NS|SS|N2)\\)`))) {
    const [ltRoom] = name.split(" ");
    const room = ltRoom.replace("LT", "");

    altNames.push(`LT${room}`);
  }

  if (name.match(new RegExp(`LT[0-9]+(A|) \\(SPMS\\)`))) {
    const [ltRoom] = name.split(" ");
    const room = ltRoom.replace("LT", "");

    altNames.push(`SPMS-LT${room}`);
  }

  // CSKL
  if (
    name.match(
      new RegExp(`Communication Skills Lab [0-9]+[A-Za-z]* \\((SS|NS)\\)`)
    )
  ) {
    const [, , , room] = name.split(" ");
    altNames.push(`CSKL${room}`);
  }

  // CL
  if (name.match(new RegExp(`Communication Lab [0-9]+[A-Za-z]* \\((S4)\\)$`))) {
    const [, , room] = name.split(" ");
    altNames.push(`S4-CL${room}`);
  }

  // Seminar Rooms
  if (name.match(new RegExp(`Seminar Room [0-9]+ - NBS \\((S3|S4)\\)`))) {
    const [, , room, , , _building] = name.split(" ");
    const building = _building.replace("(", "").replace(")", "");
    altNames.push(`${building}-SR${room}`);
  }

  // Class Rooms
  if (name.match(new RegExp(`Class Room ([0-9]+|[A-Za-z])+ \\(SBS\\)`))) {
    const [, , room] = name.split(" ");
    altNames.push(`SBS-CR${room}`);
  }

  const nameMapping = NAME_MAPPINGS[name];
  if (nameMapping) {
    altNames.push(nameMapping);
  }

  return altNames;
}

export function mapAltNames(
  locations: z.infer<typeof MapsindoorsLocationArraySchema>,
  category: (typeof ALL_CATEGORIES)[number]
): z.infer<typeof LocationsArraySchema> {
  return locations.map((location) => {
    const altNames: string[] = [];
    if (location.properties.roomId) {
      altNames.push(location.properties.roomId);
      altNames.push(...mapByRoomId(location.properties.roomId));
    }
    altNames.push(...mapByName(location.properties.name));
    return {
      category: category,
      name: location.properties.name,
      altNames: Array.from(new Set(altNames)),
      building: location.properties.building,
      floor: location.properties.floor,
      floorName: location.properties.floorName,
      venue: location.properties.venue,
      type: location.properties.type,
      imageUrl: location.properties.imageURL,
      geometry: location.geometry,
      anchor: location.properties.anchor.coordinates,
      mapIndoorsSource: {
        id: location.id,
        roomId: location.properties.roomId,
      },
    };
  });
}

(async () => {
  const workDir = `${__dirname}/out`;
  // Create out directory if not exist.
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir);
  }
  // Load room id mappings.
  const { roomIdMappings, nameMappings } = loadMappings(workDir);
  ROOM_ID_MAPPINGS = roomIdMappings;
  NAME_MAPPINGS = nameMappings;

  const categories = ALL_CATEGORIES;
  const results: ReturnType<typeof mapAltNames> = [];
  for (const category of categories) {
    const locations = MapsindoorsLocationArraySchema.parse(
      JSON.parse(
        fs.readFileSync(path.resolve(workDir, `${category}.json`), "utf8")
      )
    );
    const mappedLocations = mapAltNames(locations, category);
    results.push(...mappedLocations);
  }

  results.sort((a, b) => a.name.localeCompare(b.name));

  let prevName = results[0].name;
  for (let i = 1; i < results.length; i++) {
    if (results[i].name === prevName) {
      // Check if the previous was set.
      if (results[i - 1].name === prevName) {
        if (
          results[i - 1].mapIndoorsSource.roomId !== null &&
          results[i - 1].mapIndoorsSource.roomId !== ""
        ) {
          const floorName = results[i - 1].floorName;
          results[i - 1].name =
            `${prevName} (${results[i - 1].mapIndoorsSource.roomId})`;
          if (floorName !== "") {
            results[i - 1].name = `${prevName} ${floorName}`;
          }
        }
      }

      // Update the current accordingly.
      if (
        results[i].mapIndoorsSource.roomId !== null &&
        results[i].mapIndoorsSource.roomId !== ""
      ) {
        const floorName = results[i].floorName;
        results[i].name =
          `${results[i].name} (${results[i].mapIndoorsSource.roomId})`;
        if (floorName !== "") {
          results[i].name = `${results[i].name} ${floorName}`;
        }
      }
    } else {
      prevName = results[i].name;
    }
  }

  results.sort((a, b) => a.name.localeCompare(b.name));

  // 1 More time, we will scan through all the results.
  // This time, if there are duplicates, we will append
  // the entries with "#1", "#2", etc.
  prevName = results[0].name;
  let prevCounter = 0;
  for (let i = 1; i < results.length; i++) {
    if (results[i].name === prevName) {
      // If previous has yet to be set, then we will set it.
      if (results[i - 1].name === prevName) {
        prevCounter++;
        results[i - 1].name = `${results[i - 1].name} #${prevCounter}`;
      }
      prevCounter++;
      results[i].name = `${results[i].name} #${prevCounter}`;
    } else {
      prevName = results[i].name;
      prevCounter = 0;
    }
  }

  fs.writeFileSync(
    path.resolve(workDir, "TRANSFORMED_LOCATIONS.json"),
    JSON.stringify(results, null, 2)
  );
})();
