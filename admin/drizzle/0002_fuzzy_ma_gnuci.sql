CREATE TABLE "location_geometry" (
	"id" serial PRIMARY KEY NOT NULL,
	"locationId" integer NOT NULL,
	"order" integer NOT NULL,
	"longitude" real NOT NULL,
	"latitude" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(64) NOT NULL,
	"name" varchar(64) NOT NULL,
	"altNames" varchar(64)[] NOT NULL,
	"building" varchar(64),
	"floor" varchar(32) NOT NULL,
	"floorName" varchar(64) NOT NULL,
	"venue" varchar(32) NOT NULL,
	"type" varchar(32) NOT NULL,
	"imageUrl" varchar(256),
	"mapIndoorsId" varchar(64) NOT NULL,
	"mapIndoorsRoomId" varchar(64),
	CONSTRAINT "idx_locations_mapIndoorsId_mapIndoorsRoomId" UNIQUE("mapIndoorsId","mapIndoorsRoomId"),
	CONSTRAINT "idx_locations_altNames" UNIQUE("altNames"),
	CONSTRAINT "idx_locations_name" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "location_geometry" ADD CONSTRAINT "location_geometry_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;