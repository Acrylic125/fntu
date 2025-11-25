import { Command } from "commander";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import inquirer from "inquirer";
import { downloadDataSources } from "./download-courses/download-programs";
import { scrapePrograms } from "./download-courses/scrape-programs";
import { scrapeSchedules } from "./download-courses/scrape-schedules";
import { downloadCourseSchedules } from "./download-courses/download-schedules";
import {
  COURSE_INSERTION_OPTIONS,
  insertCourses,
} from "./download-courses/insert";
import dotenv from "dotenv";
import { getDb } from "./db";
import { parse } from "pg-connection-string";
import { downloadMapIndoors } from "./download-locations/download-mapindoors";
import { scrapeNSSSArcHiveFacilities } from "./download-locations/scrape-ns-ss-arc-hive-facilities";
import { scrapeSchoolsFacilitiesMappings } from "./download-locations/scrape-schools";
import { transformLocations } from "./download-locations/transofrm-locations";
import {
  insertLocations,
  LOCATIONS_INSERTION_OPTIONS,
} from "./download-locations/insert";
import { transformSchedules } from "./download-courses/transform-schedules";
dotenv.config();

type Db = ReturnType<typeof getDb>;

async function inquireInsertCourses(
  db: Db,
  options: {
    programsPath: string;
    allSchedulesPath: string;
    ay: { yearCode: string; sem: string };
  }
) {
  const courseInsertOptions = await inquirer.prompt([
    {
      type: "checkbox",
      name: "options",
      message: "What do you want to insert?",
      choices: COURSE_INSERTION_OPTIONS,
    },
  ]);

  await insertCourses(db, options.ay.yearCode, options.ay.sem, {
    programsPath: options.programsPath,
    allSchedulesPath: options.allSchedulesPath,
    options: courseInsertOptions.options,
  });
}

async function inquireInsertLocations(
  db: Db,
  options: {
    locationsTransformPath: string;
  }
) {
  const locationInsertOptions = await inquirer.prompt([
    {
      type: "checkbox",
      name: "options",
      message: "What do you want to insert?",
      choices: LOCATIONS_INSERTION_OPTIONS,
    },
  ]);

  await insertLocations(db, {
    locationsTransformPath: options.locationsTransformPath,
    options: locationInsertOptions.options,
  });
}

async function inquireDb() {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log(
      chalk.red(
        "DATABASE_URL is not set in the environment variables. Please add a .env file and set the DATABASE_URL variable to your PostgreSQL database URL."
      )
    );
    console.log("");
    console.log("Example .env file:");
    console.log(
      "DATABASE_URL=postgresql://username:password@host:port/database"
    );
    console.log("");
    console.log("TIP: You can use the -s flag to skip optional prompts.");
    return null;
  }
  const { user, host, port, database } = parse(dbUrl!);
  const db = getDb(dbUrl!);
  console.log(`Will insert data into database:`);
  console.log(`- User: ${user}`);
  console.log(`- Host: ${host}`);
  console.log(`- Port: ${port}`);
  console.log(`- Database: ${database}`);
  console.log("");
  console.log(
    chalk.red("PLEASE BE CAREFUL WITH THIS STEP, IT MAY CAUSE DUPLICATED DATA.")
  );
  console.log(
    " - If you run into issues, try running `pnpm drizzle-kit push` first."
  );
  console.log(
    " - If the insertion messes up, please delete the inserted data and run the insertion again."
  );
  console.log(
    " - Please only rerun those that were PREVIOUSLY NOT SUCCESSFUL."
  );
  return db;
}

async function inquirerAcadSemester() {
  return await inquirer.prompt([
    {
      type: "select",
      name: "acadSemester",
      message: "What acad semester are you downloading?.",
      choices: [
        {
          name: `AY 25/26 S2`,
          value: { year: "2025", yearCode: "25/26", sem: "2" },
        },
        {
          name: `AY 25/26 S1`,
          value: { year: "2025", yearCode: "25/26", sem: "1" },
        },
      ],
      default: `AY 25/26 S2`,
    },
  ]);
}

const program = new Command();

program.name("fntu").description("Download data from NTU");

program
  .command("courses")
  .description("Download, scrapes, and inserts courses from NTU")
  .option("-s, --skip-optional", "Skip optional prompts")
  .action(async ({ skipOptional }) => {
    const outDir = path.resolve("out");

    console.log(chalk.blue("FNTU"));
    console.log(`Artifacts will be saved in ${outDir}`);
    console.log("");
    console.log(`TIP: You can use the -s flag to skip optional prompts.`);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const { acadSemester: ay } = await inquirerAcadSemester();

    // Download program data sources.
    const sourcesBaseDir = path.resolve(outDir, "data-sources");
    const sourcesAcadYearDir = path.resolve(
      sourcesBaseDir,
      `${ay.year}-${ay.sem}`
    );
    const sourcesProgramFile = path.resolve(
      sourcesAcadYearDir,
      "programs.html"
    );

    const sourcesFolderExists = fs.existsSync(sourcesProgramFile);
    let confirmDownloadPrograms = !sourcesFolderExists;
    if (!skipOptional && sourcesFolderExists) {
      let response = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message:
            "Do you want to download data sources again? You already have this file.",
          default: true,
        },
      ]);
      confirmDownloadPrograms = response.confirm;
    }

    if (confirmDownloadPrograms) {
      if (!fs.existsSync(sourcesAcadYearDir)) {
        fs.mkdirSync(sourcesAcadYearDir, { recursive: true });
      }
      console.log("Downloading data sources from NTU");
      await downloadDataSources(`${ay.year};${ay.sem}`, sourcesProgramFile);

      console.log("Downloaded complete.");
    }

    // Scrape programs from downloaded data sources.
    const scrapeProgramsPath = path.resolve(
      sourcesAcadYearDir,
      "programs.json"
    );
    const scrapeProgramsFolderExists = fs.existsSync(scrapeProgramsPath);
    let confirmScrapePrograms = !scrapeProgramsFolderExists;
    if (!skipOptional && scrapeProgramsFolderExists) {
      let response = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message:
            "Do you want to scrape data sources again? You already have this file.",
          default: true,
        },
      ]);
      confirmScrapePrograms = response.confirm;
    }
    if (confirmScrapePrograms) {
      console.log("Scraping programs from NTU");
      await scrapePrograms(sourcesProgramFile, scrapeProgramsPath);
      console.log("Scraped complete.");
    }

    // Download course schedules from downloaded data sources.
    const downloadSchedulesPath = path.resolve(
      sourcesAcadYearDir,
      "raw-schedules"
    );
    const downloadSchedulesFolderExists = fs.existsSync(downloadSchedulesPath);
    const downloadSchedulesMetadataPath = path.resolve(
      sourcesAcadYearDir,
      "schedules-metadata.json"
    );
    const metadataExists = fs.existsSync(downloadSchedulesMetadataPath);
    let confirmDownloadSchedules =
      !downloadSchedulesFolderExists || !metadataExists;
    if (!skipOptional && downloadSchedulesFolderExists && metadataExists) {
      let response = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message:
            "Do you want to download course schedules again? You already have this file.",
          default: true,
        },
      ]);
      confirmDownloadSchedules = response.confirm;
    }
    if (confirmDownloadSchedules) {
      if (!fs.existsSync(downloadSchedulesPath)) {
        fs.mkdirSync(downloadSchedulesPath, { recursive: true });
      }
      console.log("Downloading course schedules from NTU");
      await downloadCourseSchedules(
        scrapeProgramsPath,
        downloadSchedulesPath,
        downloadSchedulesMetadataPath,
        `${ay.year};${ay.sem}`
      );
      console.log("Downloaded complete.");
    }

    // Scrape course schedules from downloaded data sources.
    const scrapeSchedulesPath = path.resolve(
      sourcesAcadYearDir,
      "all-schedules.json"
    );
    const scrapeSchedulesFolderExists = fs.existsSync(scrapeSchedulesPath);
    let confirmScrapeSchedules = !scrapeSchedulesFolderExists;
    if (
      !skipOptional &&
      scrapeSchedulesFolderExists &&
      fs.existsSync(downloadSchedulesMetadataPath)
    ) {
      let response = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message:
            "Do you want to scrape course schedules again? You already have this file.",
          default: true,
        },
      ]);
      confirmScrapeSchedules = response.confirm;
    }
    if (confirmScrapeSchedules) {
      console.log("Scraping course schedules from NTU");
      await scrapeSchedules(downloadSchedulesMetadataPath, scrapeSchedulesPath);
      console.log("Scraped complete.");
    }

    // Transform course schedules.
    const transformSchedulesPath = path.resolve(
      sourcesAcadYearDir,
      "all-schedules-transformed.json"
    );
    const transformSchedulesFolderExists = fs.existsSync(
      transformSchedulesPath
    );
    let confirmTransformSchedules = !transformSchedulesFolderExists;
    if (!skipOptional && transformSchedulesFolderExists) {
      let response = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message:
            "Do you want to transform course schedules again? You already have this file.",
        },
      ]);
      confirmTransformSchedules = response.confirm;
    }
    if (confirmTransformSchedules) {
      console.log("Transforming course schedules from NTU");
      transformSchedules(scrapeSchedulesPath, transformSchedulesPath);
      console.log("Transformed complete.");
    }

    // Insert data into database.
    console.log("Inserting data into database");
    console.log("");

    const db = await inquireDb();
    if (!db) {
      return;
    }

    await inquireInsertCourses(db, {
      programsPath: scrapeProgramsPath,
      allSchedulesPath: transformSchedulesPath,
      ay,
    });
    console.log("Completed! You may CTRL+C to exit.");
  });

program
  .command("locations")
  .description("Download, scrape, and insert locations from NTU")
  .option("-s, --skip-optional", "Skip optional prompts")
  .action(async ({ skipOptional }) => {
    const outDir = path.resolve("out");

    console.log(chalk.blue("FNTU"));
    console.log(`Artifacts will be saved in ${outDir}`);
    console.log("");
    console.log(`TIP: You can use the -s flag to skip optional prompts.`);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const locationsBaseDir = path.resolve(outDir, "data-sources/locations");

    // Download locations from Mapindoors.
    const locationsMapIndoorsDir = path.resolve(locationsBaseDir, "mapindoors");
    const locationsMetadataPath = path.resolve(
      locationsBaseDir,
      "metadata.json"
    );
    const locationsMetadataExists = fs.existsSync(locationsMetadataPath);
    const locationsMapIndoorsFolderExists = fs.existsSync(
      locationsMapIndoorsDir
    );
    let confirmDownloadLocations =
      !locationsMapIndoorsFolderExists || !locationsMetadataExists;
    if (
      !skipOptional &&
      locationsMapIndoorsFolderExists &&
      locationsMetadataExists
    ) {
      let response = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message:
            "Do you want to download locations from Mapindoors again? You already have this file.",
          default: true,
        },
      ]);
      confirmDownloadLocations = response.confirm;
    }
    if (confirmDownloadLocations) {
      if (!fs.existsSync(locationsMapIndoorsDir)) {
        fs.mkdirSync(locationsMapIndoorsDir, { recursive: true });
      }
      console.log("Downloading locations from NTU");
      await downloadMapIndoors(locationsMapIndoorsDir, locationsMetadataPath);
      console.log("Downloaded complete.");
    }

    // Scrape locations from NS/SS/Arc/Hive (mainFacilitiesMappings)
    const locationsMainFacilitiesMappingsDir = path.resolve(
      locationsBaseDir,
      "main-facilities-mappings"
    );
    const locationsMainFacilitiesMappingsPath = path.resolve(
      locationsBaseDir,
      "main-facilities-mappings.json"
    );
    const locationsMainFacilitiesMappingsFolderExists = fs.existsSync(
      locationsMainFacilitiesMappingsDir
    );
    let confirmScrapeMainFacilitiesMappings =
      !locationsMainFacilitiesMappingsFolderExists;
    if (!skipOptional && locationsMainFacilitiesMappingsFolderExists) {
      let response = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message:
            "Do you want to scrape main facilities mappings again? You already have this file.",
        },
      ]);
      confirmScrapeMainFacilitiesMappings = response.confirm;
    }
    if (confirmScrapeMainFacilitiesMappings) {
      if (!fs.existsSync(locationsMainFacilitiesMappingsDir)) {
        fs.mkdirSync(locationsMainFacilitiesMappingsDir, { recursive: true });
      }
      console.log("Scraping main facilities mappings from NTU");
      await scrapeNSSSArcHiveFacilities(
        locationsMainFacilitiesMappingsDir,
        locationsMainFacilitiesMappingsPath
      );
      console.log("Scraped complete.");
    }

    // Scrape locations from schools (schoolFacilitiesMappings)
    const locationsSchoolFacilitiesMappingsDir = path.resolve(
      locationsBaseDir,
      "school-facilities-mappings"
    );
    const locationsSchoolFacilitiesMappingsPath = path.resolve(
      locationsBaseDir,
      "school-facilities-mappings.json"
    );
    const locationsSchoolFacilitiesMappingsFolderExists = fs.existsSync(
      locationsSchoolFacilitiesMappingsDir
    );
    let confirmScrapeSchoolFacilitiesMappings =
      !locationsSchoolFacilitiesMappingsFolderExists;
    if (!skipOptional && locationsSchoolFacilitiesMappingsFolderExists) {
      let response = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message:
            "Do you want to scrape school facilities mappings again? You already have this file.",
        },
      ]);
      confirmScrapeSchoolFacilitiesMappings = response.confirm;
    }
    if (confirmScrapeSchoolFacilitiesMappings) {
      if (!fs.existsSync(locationsSchoolFacilitiesMappingsDir)) {
        fs.mkdirSync(locationsSchoolFacilitiesMappingsDir, { recursive: true });
      }
      console.log("Scraping school facilities mappings from NTU");
      await scrapeSchoolsFacilitiesMappings(
        locationsSchoolFacilitiesMappingsDir,
        locationsSchoolFacilitiesMappingsPath
      );
      console.log("Scraped complete.");
    }

    // Transform locations (mainFacilitiesMappings and schoolFacilitiesMappings)
    const locationsTransformPath = path.resolve(
      locationsBaseDir,
      "locations.json"
    );
    const locationsTransformExists = fs.existsSync(locationsTransformPath);
    let confirmTransformLocations = !locationsTransformExists;
    if (!skipOptional && locationsTransformExists) {
      let response = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message:
            "Do you want to transform locations again? You already have this file.",
        },
      ]);
      confirmTransformLocations = response.confirm;
    }
    if (confirmTransformLocations) {
      console.log("Transforming locations from NTU");
      await transformLocations(locationsMetadataPath, locationsTransformPath, {
        roomIdMappingsPath: locationsMainFacilitiesMappingsPath,
        nameMappingsPath: locationsSchoolFacilitiesMappingsPath,
      });
      console.log("Transformed complete.");
    }

    // Insert data into database.
    console.log("Inserting data into database");
    console.log("");

    const db = await inquireDb();
    if (!db) {
      return;
    }
    await inquireInsertLocations(db, {
      locationsTransformPath: locationsTransformPath,
    });

    console.log("Completed! You may CTRL+C to exit.");
  });

program
  .command("insert")
  .argument("downloadPath", "The path to the downloaded data")
  .description("Insert data into database")
  .action(async (_downloadPath) => {
    const downloadPath = path.resolve(_downloadPath);
    if (!fs.existsSync(downloadPath)) {
      console.log(chalk.red(`Download path ${downloadPath} does not exist.`));
      console.log(
        "Please download the data from https://github.com/Acrylic125/fntu/releases and pass in the path to the folder downloaded data folder."
      );
      return;
    }
    const db = await inquireDb();
    if (!db) {
      return;
    }

    const options = ["Courses", "Locations"] as const;
    const { options: selectedOptions } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "options",
        message: "What do you want to insert?",
        choices: options,
      },
    ]);
    if (selectedOptions.includes("Courses")) {
      const { acadSemester: ay } = await inquirerAcadSemester();
      const programsPath = path.resolve(downloadPath, "programs.json");
      const allSchedulesPath = path.resolve(downloadPath, "all-schedules.json");
      await inquireInsertCourses(db, {
        programsPath: programsPath,
        allSchedulesPath,
        ay,
      });
    }
    if (selectedOptions.includes("Locations")) {
      const locationsTransformPath = path.resolve(
        downloadPath,
        "locations.json"
      );
      await inquireInsertLocations(db, {
        locationsTransformPath,
      });
    }
    console.log("Completed! You may CTRL+C to exit.");
  });

program.parse(process.argv);
