# Locations
Anything related to NTU's locations.

## Getting the freshest data
1. Run `pnpm ts-node download.ts`. Downloads Mapindoors data. 
1. Run `pnpm ts-node download-transform.ts`. Transforms Mapindoors data, to clean up data and include alternate names.
1. (Optional) If you have Setup Drizzle, `pnpm ts-node insert.ts`. Inserts the transformed data to the database.

## Data Sources
How are we sourcing our data? 2 parts,
- Mapindoors to source all locations.
- NTU sites to source alternate name mappings for TRs/SRs/LTs/Workshops/Labs.

### Mapindoors
NTU uses Mapindoors to power the NTU Map. We can scrape the data by calling the API directly.
- [Mapsindoors Categories](https://api.mapsindoors.com/ntuprod/api/categories)

To scrape a particular category, we modify the query param, `categories=<Category>`. For example,
- [Mapsindoors Academic Facilities](https://api.mapsindoors.com/ntuprod/api/locations?venue=NTU&categories=AcademicFacilities&take=1000&skip=0&orderBy=relevance&extendedLocations=true&lr=en-US)
- [Mapsindoors Labs/Workshops](https://api.mapsindoors.com/ntuprod/api/locations?venue=NTU&categories=LabsStudioWorkshops&take=1000&skip=0&orderBy=relevance&extendedLocations=true&lr=en-US)

In this project, we scrape all categories.

### Alternative Name Mappings
The names provided by Mapindoors are not `1:1` to what's used by STARs / Booking systems (`Alternative Names`). 

Example, `Mapindoors` -> `Alternative Names`
- `LT1A (NS)` -> `LT1A` | `LT1A-01-01`
- `Tutorial Room + 2 (NS)` -> `TR+2` | `NS4-05-80`

**DO NOTE THAT ALT NAMES CAN RELATE TO MULTIPLE OF THE SAME LOCATIONS**. 

We employ Regex and direct mapping strategies sourced from NTU.
- [North Spine/South Spine/The Arc/The Hive Facilities](https://wis.ntu.edu.sg/pls/webexe88/FBSDOCU.FBSLOCATN)
- [HSS](https://wis.ntu.edu.sg/pls/webexe88/LADOCU.FBSLOCATN?w_sch=HSS)
- [NBS](https://www3.ntu.edu.sg/OAS2/regn/Loc_NBS_Subjects.pdf)

Unfortunately, this mappings are very tedious to do so due to inconsistent alternative name namings. This is only a "Best Effort", so no guarantees that a venue has a mapping!