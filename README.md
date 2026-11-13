# LunarSight

A lunar location and mission-window comparison tool using **LROC QuickMap, NASA Moon Trek and JPL Horizons**. The interface follows a dark, Moon-first editorial direction with restrained NASA-inspired blue/red accents.

## Run

Requires Node 22.12+.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. For a production build: `npm run build` then `npm start`.

The standalone project is `/Users/omarabdelazim/Documents/Lunar mission`. The original workspace copy was preserved. An empty file that previously occupied the standalone path was preserved as `Lunar mission.empty-placeholder`.

## Workflow

Explore → select a mathematical reference point, the sourced QuickMap observation center, or custom coordinates → set mission dates, observer height, elevation thresholds and requirements → calculate → save → compare two scenarios. Eight full results can be saved in local browser storage. CSV exports retain settings and provenance; complete JSON and original Horizons responses are also accessible.

`Load sourced examples` uses three genuine cached Horizons outputs for 13–20 November 2026, with 60-minute sampling. New requests require Horizons access. No scientific fallback engine is used on failure. Cached responses retain their original retrieval dates.

## Scientific sources

- **Moon Trek:** LRO WAC Mosaic Global 303ppd v02. The local 2048 × 1024 texture is assembled from 32 verified WMTS matrix-2 tiles, not an invented Moon illustration.
- **QuickMap:** archived NAC feature M1463278603LC, its center, footprint and acquisition metadata, plus original product access. The polygon is displayed in red on the globe.
- **Horizons:** targets 10 (Sun) and 399 (Earth), observer `coord@301`, geodetic coordinates, apparent airless azimuth/elevation (quantity 4), UT/UTC time. Exact requests and original response headers are retained.

See [source audit](docs/SOURCE_AUDIT.md), [dataset manifest](public/data/source-manifest.json), [methods](docs/SCIENCE.md), and [QA](docs/QA.md).

## Limits

This is an educational screening tool. Elevation above a local zenith plane does not account for terrain obstruction. No terrain shadows, numeric slopes, rock hazards, power model, radio link budget or landing safety score are implemented. Observer height is above the Horizons reference sphere, not local ground. Mapping-to-Horizons frame compatibility has not been established at landing precision. Globe points are approximate.

Threshold defaults are user assumptions, not NASA requirements. Reference points are not approved landing sites. Historic study-point coordinates from another source were removed from the active catalog.

## Verification

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
python science/verify-horizons.py
```

Eight desktop/mobile browser tests cover real selection, failure/fallback, comparison, offline examples and storage.

The Node suite includes 26 legacy tests for the excluded old engine, kept for historical regression, and 14 tests of the active API/Horizons pipeline. Legacy NASA SVS checks do **not** validate the new adapter.

`verify-horizons.py` checks 18 directions at three locations and three timestamps through independently formatted fixed-width/TLIST Horizons queries against the app’s CSV/range outputs. This checks query/parse consistency, not an independent ephemeris accuracy bound or a manual web-interface inspection.

`npm run demo:build` refreshes genuine cached examples (network required). Scientific raw responses live in `data/horizons-cache`; keep these when distributing the app. No external fonts or runtime imagery requests are needed for the examples.

## Architecture

React/TypeScript/Vite frontend; lazy Three.js/OrbitControls globe; Recharts; Express backend; Zod request validation. Horizons calls are serialized, timed out at 45 seconds per target, and cached on disk by exact ephemeris parameters. Changing only thresholds reuses raw ephemerides. All active temporal outputs come from Horizons.

The legacy `science/engine.ts`, SVS files and `data/sites.ts` are retained solely for historical tests; the active app does not import them. There is no hosted deployment. Vite reports large Three.js/chart chunks; the globe is lazy-loaded.
