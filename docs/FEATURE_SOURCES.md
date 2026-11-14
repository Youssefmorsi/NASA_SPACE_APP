# Sourced feature additions — 13 November 2026

## Implemented

- Six Apollo lunar-module locations from the LROC coordinate table, reached through the QuickMap/LROC archive context. Coordinates are ME; 0–360 longitudes are normalized to ±180. Each site links its source. Historical hardware, not approved future sites. Source: https://lroc.im-ldi.com/images/938
- QuickMap NAC spatial search: a bounded ±0.1–2° rectangle, split at the antimeridian, max 12 records per rectangle. Product URL and finite polygon validation precede display. Selected footprints attach to the globe; image centers can be selected. A genuine 12-record example query is archived for offline demonstration. Source: https://features-api.quickmap.io/collections/nac.geojson
- Regional on-demand Moon Trek tiles: WAC mosaic, LOLA synthetic hillshade, south-polar PSR map and colourized slope. Exact metadata and GetCapabilities XML are archived in `public/data/surface`. Only advertised matrix levels are accepted. Missing tiles are blank/flagged; no-data is never interpreted as safe terrain. Projection distortion is explicit near poles. Source: https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon
- Optional Horizons quantities 4, 13 and 20: apparent AZ/EL, angular diameter and kilometre range. Uses the same lunar observer as the main analysis. Derived Sun upper-limb elevation and apparent circular-disk overlap screen for possible Earth occultation at sampled timestamps. Original request parameters, retrieval metadata and limitations are visible. Source: https://ssd.jpl.nasa.gov/horizons/manual.html#obsquan

## Interpretation

The PSR map is a published binary product: 1 denotes permanent shadow; 0 is also used for NoDATA. The rendered tiles must not be read as a complete absence-of-shadow classification or the chosen week's solar availability. The colourized slope metadata describes variable baselines of 30–120 metres and inconsistent nominal resolution terminology; the app displays that source description and makes no numeric inference from its colours. Open Moon Trek for the original map legend.

Synthetic hillshade is not mission-time illumination. Regional high-zoom imagery is available in the local map viewer; the global 3D texture remains the original sourced WAC mosaic.

Sun upper-limb elevation is body-center elevation + half the angular diameter. Disk overlap is derived from angular separation and the analytic two-circle intersection area, checked only where Earth is closer than the Sun. This is approximate (equatorial apparent disks), not a full occultation solver. It is not a power estimate, and it does not alter the existing elevation-threshold Sun availability. Sampling can miss events; no exact eclipse contacts or eclipse durations are claimed.

## Not implemented after access/validation checks

The directly linked Apollo 11 numeric DTM and slope product download host (`pds.lroc.im-ldi.com`) failed DNS resolution during this session. The product pages and Moon Trek display services were accessible, but colourized tiles are not numeric DEMs. Therefore numeric slope/roughness percentages, terrain horizon calculation and terrain-corrected Earth/Sun visibility remain unassessed. Even when downloads work, datum/frame compatibility, observer elevation, DEM coverage and independent terrain validation are prerequisites. No substitute terrain was invented.

## Sampled mission-start search and request verification (14 November 2026)

The search uses only the existing JPL Horizons quantity-4 Sun/Earth pipeline and cache. `science/window-search.ts` requests one hourly ephemeris covering the start search plus a fixed mission duration. `science/window-finder.ts` clips its interpolated threshold intervals to each complete candidate mission. Candidates rank by longest continuous simultaneous overlap, total overlap, and earliest start. Only 1/6/12/24-hour start spacing and at most 744 hours of total source coverage are supported. No global optimum, terrain correction or eclipse correction is asserted. Source parameters and retrieval time accompany results.

The cached nearside example uses the original 13–20 November 2026 Horizons coverage. Its earliest 48-hour full-overlap candidate was re-requested from Horizons at 15-minute sampling on 14 November 2026 and retained in `data/horizons-cache/7196708147bb56741a3cb8a9fd81a4327ed86004675f4dbdc747b281b3545e69.json`. It contains 193 genuine samples, not synthetic replacements.

“Verify in Horizons” constructs fixed-origin JPL API links from the actual result's request parameters and links the official web interface. This allows request reproduction but is not independent ephemeris validation. Official documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html and https://ssd.jpl.nasa.gov/horizons/manual.html .

Two additional genuine responses support the default polar demonstration: `52f53dab3b9a00f4065460e065fd9cd22f4bfcdeddde3d431469427e67b117ee.json` covers the 336-hour hourly screening span, and `23187737fef021482ccb5834875cf912b562661bf82afcbdcfb36aa365d6e989.json` verifies the selected 20 November 2026 start at 15-minute spacing for 168 hours. Finer sampling gives 151.639521 hours of continuous overlap. These requests retain the same polar coordinates, height and elevation conventions. Both records were retrieved live on 14 November 2026.
