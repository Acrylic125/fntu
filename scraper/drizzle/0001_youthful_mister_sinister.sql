CREATE TABLE "venues" (
	"id" serial PRIMARY KEY NOT NULL,
	"venue" varchar(128) NOT NULL,
	"area" varchar(128) NOT NULL,
	"capacity" integer NOT NULL,
	"location" varchar(128) NOT NULL,
	"bookableByStaff" boolean DEFAULT false NOT NULL,
	"bookableByStudentOrganizations" boolean DEFAULT false NOT NULL,
	"remarks" varchar(128)
);
