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
