CREATE TABLE "location_alt_names" (
	"id" serial PRIMARY KEY NOT NULL,
	"locationId" integer NOT NULL,
	"altName" varchar(255) NOT NULL,
	CONSTRAINT "idx_location_alt_names_altName" UNIQUE("altName")
);
--> statement-breakpoint
DROP INDEX "idx_locations_altNames";--> statement-breakpoint
ALTER TABLE "location_alt_names" ADD CONSTRAINT "location_alt_names_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "altNames";