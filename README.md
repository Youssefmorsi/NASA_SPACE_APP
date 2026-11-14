# LunarSight

**Live demo:** https://nasa-space-app-lyart.vercel.app/

A lunar location and mission-window comparison tool using **LROC QuickMap, NASA Moon Trek and JPL Horizons**. The interface follows a dark, Moon-first editorial direction with restrained NASA-inspired blue/red accents.

## Run

Requires Node 22.12+.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. For a production build: `npm run build` then `npm start`.

The development server listens on `127.0.0.1:5173` by default. Set `PORT` and `HOST` in the environment to change the bind address; keep the default local-only address for local development.

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

The browser suite covers desktop/mobile journeys as well as the polar map, sky view, playback, date shift, scenario links and backup import. Set `PLAYWRIGHT_EXECUTABLE_PATH` to a compatible installed Chromium-based browser if the managed browser is unavailable.

The Node suite includes 26 legacy tests for the excluded old engine, kept for historical regression, alongside tests for the active API/Horizons pipeline and scenario workflows. Legacy NASA SVS checks do **not** validate the new adapter.

`verify-horizons.py` checks 18 directions at three locations and three timestamps through independently formatted fixed-width/TLIST Horizons queries against the app’s CSV/range outputs. This checks query/parse consistency, not an independent ephemeris accuracy bound or a manual web-interface inspection.

`npm run demo:build` refreshes genuine cached examples (network required). Scientific raw responses live in `data/horizons-cache`; keep these when distributing the app. No external fonts or runtime imagery requests are needed for the examples.

## Architecture

React/TypeScript/Vite frontend; lazy Three.js/OrbitControls globe; Recharts; Express backend; Zod request validation. Horizons calls are serialized, timed out at 45 seconds per target, and cached on disk by exact ephemeris parameters. Changing only thresholds reuses raw ephemerides. All active temporal outputs come from Horizons.

The legacy `science/engine.ts`, SVS files and `data/sites.ts` are retained solely for historical tests; the active app does not import them. Deployment configuration is documented in `docs/VERCEL_SETUP.md`. The chart and globe load separately; Vite still warns about the Three.js chunk.

## Container setup

When Docker's Linux engine is running, build and start the application with:

```sh
docker build -t lunarsight .
docker run --rm -p 3000:3000 lunarsight
```

The container listens on port 3000. Its writable cache is ephemeral unless a persistent data volume is configured; preserve the supplied cached examples when setting up persistence. This container setup has not been verified on the current machine because its Docker engine was unavailable.

## Local planning updates

The Analyze page now offers a sampled azimuth/elevation sky view, estimated next downward threshold crossings, sample playback, a start-time shift control, beginner/expert display choices, and versioned scenario-input links. Links contain inputs only; a recipient must have access to this deployment and may need a Horizons request. Playback stops at the final sample. Threshold crossings are interpolated estimates, not terrain-aware sunset or Earthset.

Explore includes a schematic coordinate map of the south polar region. Compare includes common UTC/elapsed visibility tracks with shaded coverage. Neither represents a terrain elevation model.

Terrain data and frame registration, a sourced candidate-site catalog, manual Horizons web-interface spot checks, and hosted deployment remain outstanding. No terrain-corrected results should be presented until the documented data and validation prerequisites are met.

## Surface evidence tools

Explore now includes six verified historical Apollo locations, bounded QuickMap NAC observation searches and selectable footprints. Below mission setup, open **Surface evidence** for on-demand WAC detail, LOLA hillshade, polar PSR and colourized slope layers. These are contextual images, not numeric terrain screening. Analyze includes an optional **Solar disk & eclipse screening** tool using Horizons quantities 4, 13 and 20. It does not modify the main availability values.

See [feature sources and limitations](docs/FEATURE_SOURCES.md). Numeric terrain downloads were inaccessible during implementation; no terrain-corrected visibility or numeric slope percentages are claimed.

## Vercel deployment

The project includes Vercel configuration for the Vite frontend and a serverless Express API. See [Vercel setup](docs/VERCEL_SETUP.md) for setup instructions, temporary cache limitations, and post-deployment checks. A live deployment has not yet been verified.

## Mission start finder

Analyze → **Find a mission start** compares fixed-duration missions starting across the next 1, 3, 7 or 14 days relative to the entered UTC start. A single hourly Sun/Earth ephemeris is reused across candidate starts. Rank order is longest continuous overlap, total overlap, then earlier start. The complete search coverage, including mission duration, must fit within 744 hours. These are the best sampled candidates, not a guaranteed optimum, and they exclude terrain/eclipses.

**Try cached nearside example** scans 21 starts at six-hour spacing for a 48-hour mission at 0°N, 0°E. **Use this start** loads the candidate for a separate finer analysis. The first candidate, 17 November 2026 06:00 UTC, has a genuine cached 15-minute Horizons verification (193 samples). Open **Verify in Horizons** on any analysis to reproduce its exact Sun/Earth API requests or use the web interface.
