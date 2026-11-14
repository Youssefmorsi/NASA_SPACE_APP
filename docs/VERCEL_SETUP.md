# Deploying LunarSight to Vercel

The Vite frontend is built as static files. `/api/*` is served by a Node.js Vercel Function using the same Express API as the local server. In Vercel project settings, set Framework Preset to Vite, use Node.js 22.x or a Vercel-supported newer Node version, keep `npm run build` as the build command and `dist` as the output directory. Import the Git repository with its root directory set to the project root, then deploy. `vercel.json` provides these build settings and a 120-second function limit.

No API key is required. New analyses require the function to reach JPL Horizons; surface searches and map layers require access to their respective approved services. Cached example scenarios in `public/data/examples.json` are included in the frontend; the four tracked raw Horizons cache records are included in the function. If an upstream service is unavailable, the app reports an error rather than inventing results.

Vercel's filesystem is read-only except temporary `/tmp` storage. Newly fetched Horizons and disk-geometry records are cached there only: the cache is per function instance, temporary, not shared, and may disappear on cold starts. Consequently `/api/raw/<key>` can return 404 for a newly retrieved result on a subsequent invocation, even after successful analysis; the app's browser-saved scenario and JSON/CSV exports remain available. The bundled reference records can be downloaded when the corresponding cache key is present. For persistent, shared raw responses, configure an external persistent store and update the cache adapter; no such service is configured here. No NASA API responses are fabricated if unavailable.

After deploying, check `/api/health`, load the homepage and bundled example comparison, run a new Horizons analysis, open a map layer and try a scenario link. Verify with a real deployment: local tests do not prove routing, upstream connectivity, function size, timeouts, or platform behavior. Requests such as comparisons perform multiple sequential Horizons calls and can exceed the configured function timeout when upstream is slow.

The existing local commands (`npm run dev`, `npm run build`, `npm start`) continue to use the project's local disk cache. Terrain-aware results remain disabled.

The configured 120-second function duration assumes Fluid compute is enabled and the selected plan supports that duration. If it is disabled, check the plan's duration limit and adjust the setting or enable Fluid compute before deploying.
