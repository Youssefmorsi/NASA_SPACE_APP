# South-polar source record check

Checked: 13 November 2026. This review is limited to the approved QuickMap and Moon Trek services. These records are **image observation centers**, not verified landing candidates and not safety assessments.

## QuickMap NAC observations

[Source query: QuickMap NAC feature service](https://features-api.quickmap.io/collections/nac.geojson?limit=5&bbox=-1%2C-89.9%2C1%2C-88). This query requests the first five image footprints intersecting a box around 88°–89.9°S and longitude −1°–1°. The returned image centers can lie outside that box because the search is for intersecting footprints.

| Product ID | Reported center latitude (°) | Reported center longitude (°, raw) | Acquisition (UTC) | Category |
|---|---:|---:|---|---|
| M130312216RC | −89.68 | 259.19 | 2010-06-04 17:35:49 | LROC image observation center |
| M131363910LC | −89.56 | 261.02 | 2010-06-16 21:44:02 | LROC image observation center |
| M131377479LC | −89.65 | 256.15 | 2010-06-17 01:30:12 | LROC image observation center |
| M131391048LC | −89.69 | 244.27 | 2010-06-17 05:16:20 | LROC image observation center |
| M131404614LC | −89.62 | 226.25 | 2010-06-17 09:02:27 | LROC image observation center |

The displayed center longitude is copied exactly from QuickMap's `center_longitude`; no conversion is asserted here. For these responses the fields `rdr_coordinate_system_name` and `rdr_positive_longitude_direction` were null. Coordinate frame, longitude convention, measurement uncertainty, and compatibility with Horizons therefore remain unverified from these records. Decimal places are not an uncertainty estimate. Product metadata links returned by QuickMap point to the LROC archive, which is outside the four explicitly approved resources and was not used as a separate scientific source in this review.

## Moon Trek

Moon Trek's Fly To search returned the named feature **Shackleton**. The resulting [Moon Trek map view](https://trek.nasa.gov/moon/#v=0.1&x=132.321845&y=-89.625776&z=6&p=urn%3Aogc%3Adef%3Acrs%3AEPSG%3A%3A104903&d=&locale=&b=moon) places the display near the south pole. Its URL coordinates are the **map-view center**, not a verified candidate landing point; this check did not establish the coordinates or uncertainty of an actual landing candidate. The [Moon Trek service documentation](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon) describes image tiles; it does not by itself establish numeric DEM values for terrain calculations.

## Decision

Do not add these observations to the landing-candidate catalog as verified candidates. To include an actual candidate, find an approved-resource record that identifies its category and position, documents the coordinate convention/frame, and states uncertainty if available. Before using any terrain source for a horizon calculation, verify its numeric encoding, datum, coverage, terms, and frame alignment with Horizons.
