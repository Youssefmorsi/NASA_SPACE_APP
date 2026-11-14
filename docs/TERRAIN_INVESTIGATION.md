# Terrain integration investigation

Status: blocked pending a numeric elevation product and documented frame validation. No terrain-derived calculation is enabled by this investigation.

Moon Trek's [south-polar NAC mosaic metadata](https://trek.nasa.gov/moon/TrekWS/rest/cat/metadata/fgdc/html?label=LRO_NAC_AvgMosaic_SPole855_1mp) describes an image mosaic covering 85.5°S–90°S that was orthorectified using a LOLA polar DEM. The mosaic is imagery, not a numeric DEM; its metadata is not evidence that its pixels can be used as elevations.

Moon Trek's [LOLA/Kaguya colored hillshade metadata](https://trek.nasa.gov/moon/TrekWS/rest/cat/metadata/fgdc/html?label=LRO_LOLAKaguya_ClrHillshade_60N60S_512ppd) describes coverage within ±60°, so that product does not cover the south pole. A colored hillshade is a visualization rather than a numeric DEM.

The [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html) describes the lunar mean-Earth coordinate frame. Before any horizon integration, identify a downloadable numeric south-polar DEM and record its specific frame, datum, units, resolution, coverage, license/distribution terms and nodata behavior. Establish a reproducible transformation to the Horizons frame and independently check control points and residuals against a stated tolerance. This review has not established that compatibility.

Moon Trek states on its [main page](https://trek.nasa.gov/moon/) that basic access is public, while certain advanced mission-planning tools require registration. This does not establish the license for a particular downloadable dataset; check product-specific terms before distribution.

## Global numeric DEM candidate identified

On 2026-11-13 Moon Trek search identified [LRO LOLA DEM, version 4](https://trek.nasa.gov/moon/TrekWS/rest/cat/metadata/fgdc/html?label=LRO_LOLA_DEM_Global_128ppd_v04), `LRO_LOLA_DEM_Global_128ppd_v04.tif`: a global numeric elevation raster including the south pole, 128 pixels per degree, with heights in metres relative to a 1,737,400 m radius. Its metadata states no access or use constraints and describes the source as planetocentric Mean-Earth/polar-axis coordinates. The metadata also identifies preliminary measurements and interpolation between ground tracks; it should not be treated as a high-resolution hazard map.

The product has not yet been downloaded, sampled, or validated against the Horizons observer frame at control points. No-data treatment, actual raster decoding, registration, observer height consistency, horizon sampling coverage and model uncertainty remain to be verified. Similar names and matching reference radii do not alone prove frame alignment. Terrain-aware results remain disabled pending these checks.
