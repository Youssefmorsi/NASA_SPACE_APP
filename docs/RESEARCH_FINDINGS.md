# Terrain and site-source investigation

Reviewed 13 November 2026. The project restricts scientific sources to LROC QuickMap, NASA Moon Trek, JPL Horizons, and CSA Moon Exploration. This note records research leads; it does not import new data, establish a landing-site catalog, or authorize use of additional sources.

## Numeric terrain leads

- The LROC archive lists a **32-bit numeric terrain model** for the Shackleton–de Gerlache Connecting Ridge at 3.5 m/pixel, with latitude coverage −89.63° to −89.37° and east longitude coverage 209.81° to 239.10°. Its [product page](https://data.lroc.im-ldi.com/lroc/view_rdr_product/NAC_DTM_SHACKRDGE02) lists a 9.61 MB GeoTIFF, while its [catalog record](https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_DTM_SHACKRDGE02) gives the coverage and reports a LOLA RMS of 1.06 m. That figure is not a demonstrated Horizons registration error. Confirm whether the exact archive product is accessible and permitted through the approved LROC QuickMap workflow before importing it. The product is a bounded local area; a skyline computed only within it cannot establish that more distant terrain does not obstruct a body.
- The catalog links a README and PDS label, but both redirected to an archive that the research tool could not access. The exact data values, georeferencing, vertical datum, longitude/frame convention, nodata behavior, and product-specific distribution terms remain unverified. Do not treat a shaded-relief or color-rendered image as a numeric elevation raster.
- [Moon Trek](https://trek.nasa.gov/moon/) states that basic functionality and data are publicly accessible, while some advanced mission-planning tools require registration. This does not establish the terms, numerical encoding, coverage, or frame of a specific DEM product. Verify the exact layer and download format before use.
- The [JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html) describes the lunar mean-Earth reference frame. A matching frame name alone does not demonstrate that a terrain product aligns with the app's Horizons observer coordinates at a useful precision. The product's datum, projection, epoch/frame realization, observer height convention, and a documented coordinate transformation must be checked with independent control points and residuals.
- NASA Goddard also describes polar LOLA DEM products at [PGDA product 90](https://pgda.gsfc.nasa.gov/products/90) and [product 81](https://pgda.gsfc.nasa.gov/products/81). These are useful research leads, but **PGDA is outside the project's four approved source services**. Do not import them unless the same product and its terms can be established through an approved source or the source policy is explicitly changed.

## LROC observation-center leads

The following are **centers of LROC image or terrain products**, rounded as published. They are possible map references only: they are not independently verified landing-site positions, approved landing sites, or safety recommendations. Check that each exact product is accessible and allowed through the approved QuickMap workflow before adding it to the application.

| Product | Published center latitude | Published center longitude, east-positive | Record |
|---|---:|---:|---|
| Shackleton–de Gerlache Connecting Ridge DTM | −89.5° | 224.81° (equivalent to −135.19°) | [LROC DTM record](https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_DTM_SHACKRDGE02) |
| Peak near Shackleton low-Sun mosaic | −88.8° | 124.7° | [LROC mosaic record](https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_ROI_SHKLTNPKLOA) |
| de Gerlache Rim low-Sun mosaic | −88.5° | 293.3° (equivalent to −66.7°) | [LROC mosaic record](https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_ROI_DEGERRIMLO1) |
| Malapert Massif low-Sun mosaic | −86.0° | 0.3° | [LROC mosaic record](https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_ROI_MALAPERTLO1) |

A future candidate catalog needs an authoritative source for each actual point and category, precise coordinate/frame metadata and uncertainty where available. Product-center coordinates above do not satisfy that requirement.

## Remaining prerequisite

Keep all current results labeled as geometric reference-plane calculations. Do not call them terrain-corrected or landing-safety results until a permitted numeric product is acquired, its metadata and registration are validated, missing coverage is handled, and skyline calculations are independently checked.
