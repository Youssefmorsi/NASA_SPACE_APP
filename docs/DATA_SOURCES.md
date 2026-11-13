# Active data sources

The machine-readable source manifest is `public/data/source-manifest.json`. The pre-change audit is `docs/SOURCE_AUDIT.md`.

1. **Moon Trek**: documented RESTful WMTS, LRO_WAC_Mosaic_Global_303ppd_v02, default028mm matrix 2 (8 columns × 4 rows, 256 px tiles). Saved capabilities and tile URLs accompany the local mosaic. Longitude -180..180 / latitude 90..-90; no invented terrain values.
2. **QuickMap**: feature service endpoint discovered in QuickMap’s client, `https://features-api.quickmap.io/collections/nac.geojson?limit=1`. Archived GeoJSON for M1463278603LC includes observation center, acquisition time, source URL and footprint. Used as an observation reference and rendered footprint. No undocumented numeric analysis service is depended upon. Its rounded footprint is unsuitable for hazard detection.
3. **Horizons**: official API at `https://ssd.jpl.nasa.gov/api/horizons.api`. Raw response pair, retrieval time, signature and exact request parameters are archived per unique observer/time grid. Original response access uses `/api/raw/:hash`.

All recorded retrievals are 13 November 2026. Check individual Horizons records for exact timestamps. Excluded historical resources: Surface Data Book catalog, NASA SVS validation table, Astronomy Engine. They are not evidence behind V3 results.
