# Horizons web comparison and terrain source check

Checked 2026-11-13. Approved sources only.

## Horizons web spot check

Using the [JPL Horizons web application](https://ssd.jpl.nasa.gov/horizons/app.html#/), independently generated observer tables for the Sun (10) and Earth (399), centered on the Moon (301), at 0 degrees east longitude, -89 degrees geodetic latitude, and 0 km above its reference sphere. The Horizons output identifies the lunar frame as MEAN_ME, radius 1737.4 km, DE441 source, and airless apparent azimuth and elevation. Web table: 2026-11-13 00:00 through 2026-11-20 00:00 UT, hourly. For these modern dates Horizons says its UT output is UTC. The local reference files use a discrete time list and Gregorian calendar; the web table uses an hourly span and mixed calendar, which agrees for these dates.

| Target | At 2026-11-13 00:00 UTC | Local stored Horizons reference | Web result | Difference |
| --- | --- | --- | --- | --- |
| Sun | Azimuth, elevation (degrees) | 138.822434433, 0.803101685 | 138.822434433, 0.803101685 | 0 at nine displayed decimal places |
| Earth | Azimuth, elevation (degrees) | 0.125066332, -4.557710531 | 0.125066332, -4.557710531 | 0 at nine displayed decimal places |

Local reference outputs: `data/horizons-verification/-89-sun.json` and `data/horizons-verification/-89-earth.json`. This checks one epoch from stored Horizons responses against the same service's web interface. It is not an independent validation of Horizons, the complete application workflow, every time sample, terrain obstruction, or mission feasibility. The web output references a plane normal to the reference surface, not the local terrain skyline. Precision shown is output precision, not an accuracy claim.

## Approved-source terrain investigation

- [Moon Trek](https://trek.nasa.gov/home/) states its elevation-profile tool extracts numeric profiles from a DEM and exports CSV. Its [portal](https://trek.nasa.gov/moon/) says basic data and functionality are public, while certain advanced mission-planning tools require registration. A profile is a path sample, not by itself a complete south-polar elevation grid. This check has not established the profile's specific underlying product, frame, resolution, no-data handling, automated access or product-specific redistribution terms.
- [South-polar NAC mosaic metadata](https://trek.nasa.gov/moon/TrekWS/rest/cat/metadata/fgdc/html?label=LRO_NAC_AvgMosaic_SPole855_1mp) describes imagery orthorectified with a DEM; its imagery pixels are not numeric elevation measurements. The [LOLA/Kaguya colored hillshade](https://trek.nasa.gov/moon/TrekWS/rest/cat/metadata/fgdc/html?label=LRO_LOLAKaguya_ClrHillshade_60N60S_512ppd) covers only +/-60 degrees and is not a south-polar elevation grid.
- A suitable downloadable numeric south-polar DEM, its product-specific usage terms, and its registration against the Horizons MEAN_ME frame have not yet been verified through the approved resources. Therefore no terrain skyline or terrain-corrected visibility is claimed here.

Next: identify the exact south-polar numeric DEM or validate Moon Trek profile exports, document coverage, coordinate convention, vertical datum, units, sampling and no-data, then compare matched control points and frames before implementing a skyline. Test independent directions and terrain edge cases before presenting results.

## Further validation on 2026-11-13

The same Horizons web Sun table was also compared with the stored `-89-sun.json` at 2026-11-16 00:00 UTC (102.275782254, 1.342769277 degrees) and 2026-11-20 00:00 UTC (53.622767098, 2.137985685 degrees). Both azimuth and elevation matched at all nine displayed decimal places. This extends the previous spot check; it does not establish independent scientific accuracy or terrain visibility.

Project checks: 53 automated tests passed; production build passed with a warning for the Three.js chunk above 500 kB. All 18 browser tests passed using installed Microsoft Edge via `PLAYWRIGHT_EXECUTABLE_PATH`. Browser tests include selection, analysis, comparison, map, sky playback, time shift, sharing, backup, and mobile layout. Existing historical/reference fixtures in the test suite include material outside the four approved resources; these were existing local tests, not a new scientific data import. The approved-source restriction should be considered before using those fixtures as project evidence.
