# V3 architecture

- `frontend/src/App.tsx`: Explore / Analyze / Compare / Sources flow, saved full scenarios, error states and exports.
- `frontend/src/components/MoonGlobe.tsx`: lazy Three.js globe with Moon Trek texture, pins, QuickMap footprint, raycast selection and camera focus; WebGL fallback.
- `frontend/src/model.ts`: requirement checks, deterministic comparison and CSV.
- `backend/server.ts`: validated API, serialized Horizons access, original-response download and static/Vite serving.
- `science/horizons.ts`: parameters, checked CSV parser, disk caching and sourced results.
- `science/intervals.ts`: threshold intervals including equality and interpolated crossings.
- `data/catalog.ts`: four mathematical coordinates and one QuickMap observation center.
- `public/data/`: source manifest, genuine examples, original WMTS metadata and verification report.

Legacy engine/site/reference files are excluded from active paths and retained only for historical regression. Full scenario results/requirements are stored under a separate V3 browser key; old saved requests are not silently recalculated or relabelled as Horizons.
