# V3 verification — 13 November 2026

## Executed checks

- TypeScript and Vite production build: passed.
- Node suite: 40 passed (14 current API/Horizons tests plus 26 preserved legacy engine/reference tests). Legacy NASA SVS checks are not validation of the active Horizons adapter.
- Five desktop/mobile browser journeys passed: real WebGL globe and sourced observation, Horizons calculation/save/reload, comparison/rename/export/persistence, explicit service failure, mobile navigation/no horizontal overflow.
- Three additional browser journeys passed: real globe raycast and farside focus, unavailable WebGL/manual analysis, offline cached comparison and invalid mission requirements.
- Horizons consistency report: 18 directions at 3 locations × 3 timestamps × 2 targets, all under 0.000001° difference between separately requested fixed-width/TLIST outputs and app CSV/range parsing. Same ephemeris provider: not an independent accuracy bound or manual web-interface check.
- Source retrieval: actual Moon Trek WMTS capabilities, 32 image tiles, QuickMap observation GeoJSON and archive product page, six actual Horizons response tables for the three examples.
- Screenshots inspected: explorer, analysis, comparison, mobile. Camera transitions corrected to preserve orbital distance; Moon no longer clips during focus transitions.

## Browser runtime

The new Playwright browser download encountered DNS failure. Tests ran successfully with an already installed headless Chromium via `PLAYWRIGHT_EXECUTABLE_PATH`. On another machine run `npx playwright install chromium`; the config uses the normal managed browser unless that environment variable is explicitly set.

## Known limits

Numeric terrain, local obstruction/shadows, solar eclipse screening, hazard classification, power model, link budget and landing safety are not implemented. Landing-precision alignment of mapping products with Horizons MEAN_ME remains unverified. Named historical/candidate landing-site catalog verification remains future work; active locations are mathematical references plus one sourced observation center.

No hosted deployment. No manual comparison with the Horizons web UI was performed. Vite's large chart/Three.js chunk warning remains; the globe is lazy-loaded. Docker image was not tested.

## Latest interface and scrollbar verification

Added a visible right-side native scrollbar with a stable gutter and contrasting thumb. Production build, all 40 Node checks and mobile navigation/no-overflow test passed. The prior full nine-journey browser suite also passed during the interface refinement, followed by mobile/raycast rechecks after the final camera adjustment.
