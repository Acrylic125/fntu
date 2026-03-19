# Scraper
Tool to scrape data and distill it.

For more details, go [Here](http://localhost:3000/docs/scraper).

## Prerequisites
- Have a [Clerk Application](https://clerk.com/).
- Clone this repository and `cd docs`.

## Setup
1. Copy `.env.example` and name it `.env`. Configure it accordingly.
1. Run `pnpm i`.

Once cloned, you can start scraping and inserting.
```bash
# Download, scrape, and insert courses.
pnpm run start courses
# Download, scrape, and insert locations.
pnpm run start locations

# Inserts downloaded data. (No need to run this if you ran scrape)
pnpm run start locations
```