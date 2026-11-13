# Active calculation methods

LunarSight V3 uses NASA/JPL Horizons observer tables, not the legacy Astronomy Engine model.

## Observer and targets

Sun 10 / Earth 399; observer `coord@301`; `COORD_TYPE=GEODETIC`; `SITE_COORD=longitude,latitude,height`. Longitude is east-positive. Height is kilometres above the Horizons lunar reference sphere (1737.4 km), **not** height above terrain. Response headers must identify Moon (301), MEAN_ME and AIRLESS before parsing.

Quantity 4 supplies apparent airless body-center azimuth and elevation. Azimuth is clockwise from north. Elevation is relative to the plane perpendicular to the local zenith. UT for the supported 2000–2099 date range represents UTC; Horizons assumes future leap seconds as documented in its response.

Exact poles are excluded because azimuth/interactive orientation is ambiguous there. Coordinates support ±89.999°. Whole-minute starts, integer-hour durations up to 744 hours, 5–360 minute sampling and at most 1500 intervals are accepted. Duration must be divisible by sampling interval. Exact endpoint coverage and Sun/Earth timestamp correspondence are verified.

## Availability and checks

A body meets its requirement when elevation ≥ the user threshold. Adjacent samples with different threshold states use linear interpolation to estimate the crossing. Positive-length intervals are summed; percentages divide by requested mission duration. Longest below-threshold periods include first/last gaps. Overlap is the intersection of the Sun and Earth interval sets.

A below-Sun-threshold interval is not necessarily darkness if a positive elevation threshold is used. Solar eclipse/occultation by Earth is not modelled by the threshold logic. Apparent upper-limb illumination is not assessed. Do not interpret Sun availability as usable electrical power.

Requirements use transparent individual checks. No NASA rating or weighted overall safety score exists. Comparison warns about differing requirements or elevation thresholds. UTC is the default comparison axis; elapsed mode is explicitly labelled. Samples interpolate only inside each scenario’s coverage, never beyond it.

## Surface sources

Moon Trek's WAC imagery is a display texture, not a DEM. The QuickMap NAC footprint and center are observation metadata, not a terrain suitability result. Their map coordinates are displayed approximately on the globe. No landing-precision map-to-MEAN_ME transformation is asserted. Do not use the globe for navigation or surveying.

## Validation

18 directions (Sun/Earth at 3 locations and 3 dates) are compared to independently formatted fixed-width/TLIST Horizons queries by `science/verify-horizons.py`. This checks input/output consistency using the same service, not independent model accuracy. Original requests/responses and the report are retained.

## Not modelled

Terrain horizons/shadows; eclipses in derived availability; slopes, boulders or landing hazards; spacecraft performance; electrical power; Earth station/antenna visibility or radio link budget. Results are educational planning estimates, not landing certification.

Reference: https://ssd.jpl.nasa.gov/horizons/manual.html and https://ssd-api.jpl.nasa.gov/doc/horizons.html
