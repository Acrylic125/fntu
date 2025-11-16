
# Algorithm
Playground to test algorithms and scrape data.

## Terminology
```
Program = Major/Minor/MLOAD/GLOAD/Scholar's program + year
MLOAD = Minor Load
GLOAD = Global Load (i.e. BDE)

Source = Which program an index came from
Course = Course (duh)
Index = Course Index (duh)
Class = Some class time slot
```

## How to scrape and compile classes? (As of July 28, 2025)
Before you start, make sure your working directory is this directory (i.e. `algorithm`). 
Additionally, make sure to create an `out` folder in this directory.

1. Go to OAS, under **Course Registration**, find **Class Schedule**. Click on the link.
2. Inspect element, under inspector, copy the __entire html page__. Make a file called `./out/scrape-sources.html`, and paste the contents in.
3. Run `npx ts-node ./scrape-sources.ts`. This will scrape `./out/scrape-sources.html` for all available programs, and upload it to `./out/program-sources.json`.
4. Run `npx ts-node ./download-raw-schedules.ts`. This will use `./out/program-sources.json` to download the indexes for each program, and upload it to `./out/raw-schedules`. **THIS MAY TAKE A WHILE DUE TO INTENTIONAL THROTTLING! DO NOT REMOVE!!!!!!!**
5. Run `npx ts-node ./scrape.ts`. This will use `./out/raw-schedules` to compile all classes, and upload it to `./out/classes.json`.

**Note:** 
- Please be respectful of NTU's dinosaur tech, don't remove any throttling.
- You can find the compiled classes in `./out/classes.json`.

## Misc
Other links:
- [Undergaduate Class Schedule](https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main)
- [Facilities](https://wis.ntu.edu.sg/pls/webexe88/FBSDOCU.FBSLOCATN)
- [Mapsindoors Categories](https://api.mapsindoors.com/ntuprod/api/categories)
- [Mapsindoors Academic Facilities](https://api.mapsindoors.com/ntuprod/api/locations?venue=NTU&categories=AcademicFacilities&take=1000&skip=0&orderBy=relevance&extendedLocations=true&lr=en-US)
- [Mapsindoors Labs](https://api.mapsindoors.com/ntuprod/api/locations?venue=NTU&categories=LabsStudioWorkshops&take=1000&skip=0&orderBy=relevance&extendedLocations=true&lr=en-US)