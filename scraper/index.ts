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
  doInsert as doCourseInsert,
} from "./download-courses/insert";
import dotenv from "dotenv";
import { getDb } from "./db";
dotenv.config();

const program = new Command();

program.name("fntu").description("Download courses from NTU");

program
  .command("courses")
  .description("Download, scrapes, and inserts courses from NTU")
  .option("-s, --skip-optional", "Skip optional prompts")
  .action(async ({ skipOptional }) => {
    const dir = "out";
    const outDir = path.resolve(dir);

    console.log(chalk.blue("FNTU"));
    console.log(`Artifacts will be saved in ${outDir}`);
    console.log("");
    console.log(`TIP: You can use the -s flag to skip optional prompts.`);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const { acadSemester: ay } = await inquirer.prompt([
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

    // Insert data into database.
    console.log("Inserting data into database");
    console.log("");

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
      return;
    }
    const db = getDb(dbUrl!);
    console.log(
      chalk.red(
        "PLEASE BE CAREFUL WITH THIS STEP, IT MAY CAUSE DUPLICATED DATA."
      )
    );
    console.log(
      " - If the insertion messes up, please delete the inserted data and run the insertion again."
    );
    console.log(
      " - Please only rerun those that were PREVIOUSLY NOT SUCCESSFUL."
    );
    const courseInsertOptions = await inquirer.prompt([
      {
        type: "checkbox",
        name: "options",
        message: "What do you want to insert?",
        choices: COURSE_INSERTION_OPTIONS,
      },
    ]);
    await doCourseInsert(db, ay.yearCode, ay.sem, {
      schedulesMetadataPath: downloadSchedulesMetadataPath,
      allSchedulesPath: scrapeSchedulesPath,
      options: courseInsertOptions.options,
    });
    console.log("Success! You may CTRL+C to exit.");
  });

program.parse(process.argv);
