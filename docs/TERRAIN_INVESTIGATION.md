# Terrain integration investigation

Status: blocked pending a numeric elevation product and documented frame validation. No terrain-derived calculation is enabled by this investigation.

Moon Trek's [south-polar NAC mosaic metadata](https://trek.nasa.gov/moon/TrekWS/rest/cat/metadata/fgdc/html?label=LRO_NAC_AvgMosaic_SPole855_1mp) describes an image mosaic covering 85.5°S–90°S that was orthorectified using a LOLA polar DEM. The mosaic is imagery, not a numeric DEM; its metadata is not evidence that its pixels can be used as elevations.

Moon Trek's [LOLA/Kaguya colored hillshade metadata](https://trek.nasa.gov/moon/TrekWS/rest/cat/metadata/fgdc/html?label=LRO_LOLAKaguya_ClrHillshade_60N60S_512ppd) describes coverage within ±60°, so that product does not cover the south pole. A colored hillshade is a visualization rather than a numeric DEM.

The [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html) describes the lunar mean-Earth coordinate frame. Before any horizon integration, identify a downloadable numeric south-polar DEM and record its specific frame, datum, units, resolution, coverage, license/distribution terms and nodata behavior. Establish a reproducible transformation to the Horizons frame and independently check control points and residuals against a stated tolerance. This review has not established that compatibility.

Moon Trek states on its [main page](https://trek.nasa.gov/moon/) that basic access is public, while certain advanced mission-planning tools require registration. This does not establish the license for a particular downloadable dataset; check product-specific terms before distribution.
