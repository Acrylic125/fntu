import fs from "fs";
import {
  ALL_CATEGORIES,
  LocationSchema,
  MapsindoorsLocationSchema,
} from "./schema";
import { z } from "zod";

const MapsindoorsLocationArraySchema = z.array(MapsindoorsLocationSchema);
const LocationsArraySchema = z.array(LocationSchema);

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

  // Arc
  if (name.match(new RegExp(`Tutorial Room \\+ [0-9]+ \\(The Arc\\)$`))) {
    const [, , , room] = name.split(" ");
    if (room.length === 1) {
      altNames.push(`LHN-TR+0${room}`);
    }
    altNames.push(`LHN-TR+${room}`);
  }

  // Hive
  if (name.match(new RegExp(`Tutorial Room \\+ [0-9]+ \\(The Hive\\)$`))) {
    const [, , , room] = name.split(" ");
    if (room.length === 1) {
      altNames.push(`LHS-TR+0${room}`);
    }
    altNames.push(`LHS-TR+${room}`);
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
      altNames: altNames,
      building: location.properties.building,
      floor: location.properties.floor,
      floorName: location.properties.floorName,
      venue: location.properties.venue,
      type: location.properties.type,
      imageUrl: location.properties.imageURL,
      geometry: location.geometry,
      mapIndoorsSource: {
        id: location.id,
        roomId: location.properties.roomId,
      },
    };
  });
}

(async () => {
  // Create out directory if not exist.
  if (!fs.existsSync("./out")) {
    fs.mkdirSync("./out");
  }
  const categories = ALL_CATEGORIES;
  const results = [];
  for (const category of categories) {
    const locations = MapsindoorsLocationArraySchema.parse(
      JSON.parse(fs.readFileSync(`./out/${category}.json`, "utf8"))
    );
    const mappedLocations = mapAltNames(locations, category);
    results.push(...mappedLocations);
  }
  fs.writeFileSync(
    `./out/facilities-transformed.json`,
    JSON.stringify(results, null, 2)
  );
})();
