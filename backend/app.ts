import express from "express";
import { analyzeHorizons, missionSchema } from "../science/horizons.ts";
import { catalog } from "../data/catalog.ts";
import { z, ZodError } from "zod";
import { readCachedRecord } from "../science/cache.ts";
import { searchNac } from "../science/surface.ts";
import { solarDisk } from "../science/solar-disk.ts";
import layers from "../data/surface-layers.json" with { type: "json" };
const app = express();
app.use(express.json({ limit: "100kb" }));
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", mode: "horizons" }),
);
app.get("/api/sites", (_req, res) => res.json(catalog));
app.post("/api/analyze", async (req, res, next) => {
  try {
    res.json(await analyzeHorizons(req.body));
  } catch (e) {
    next(e);
  }
});
app.post("/api/compare", async (req, res, next) => {
  try {
    const { scenarios } = z
      .object({ scenarios: z.array(missionSchema).min(2).max(8) })
      .parse(req.body);
    const results = [];
    for (const r of scenarios) results.push(await analyzeHorizons(r));
    res.json({ scenarios: results });
  } catch (e) {
    next(e);
  }
});
app.get("/api/raw/:key", async (req, res, next) => {
  try {
    if (!/^[a-f0-9]{64}$/.test(req.params.key)) {
      res.status(400).json({ error: { message: "Invalid cache identifier" } });
      return;
    }
    res
      .type("json")
      .send(
        await readCachedRecord("horizons-cache", req.params.key),
      );
  } catch {
    res.status(404).json({
      error: { message: "Original response is not available on this server" },
    });
  }
});
app.get("/api/nac", async (req, res, next) => {
  try {
    res.json(await searchNac(req.query));
  } catch (e) {
    next(e);
  }
});
app.post("/api/solar-disk", async (req, res, next) => {
  try {
    res.json(await solarDisk(req.body));
  } catch (e) {
    next(e);
  }
});
const tileCache = new Map<string, { bytes: Buffer; type: string }>();
app.get("/api/tile/:layer/:z/:y/:x", async (req, res, next) => {
  try {
    const layer = layers.find((l) => l.id === req.params.layer);
    if (!layer) {
      res.status(404).end();
      return;
    }
    const coords = z
      .object({
        z: z.coerce.number().int().min(0).max(layer.maxZoom),
        x: z.coerce.number().int().min(0),
        y: z.coerce.number().int().min(0),
      })
      .parse(req.params);
    if (coords.x >= 2 ** (coords.z + 1) || coords.y >= 2 ** coords.z) {
      res.status(400).end();
      return;
    }
    const key = `${layer.id}/${coords.z}/${coords.y}/${coords.x}`;
    const hit = tileCache.get(key);
    if (hit) {
      res.type(hit.type).send(hit.bytes);
      return;
    }
    const url = `https://trek.nasa.gov/tiles/Moon/EQ/${layer.product}/1.0.0/default/default028mm/${coords.z}/${coords.y}/${coords.x}.${layer.extension}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) {
      res.status(404).end();
      return;
    }
    const type = response.headers.get("content-type") || "";
    if (!type.startsWith("image/")) {
      res.status(502).end();
      return;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 2000000) {
      res.status(502).end();
      return;
    }
    if (tileCache.size >= 128) tileCache.delete(tileCache.keys().next().value!);
    tileCache.set(key, { bytes, type });
    res.set("Cache-Control", "public, max-age=86400").type(type).send(bytes);
  } catch (e) {
    next(e);
  }
});
app.use("/api", (_req, res) =>
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Unknown API route" } }),
);
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const validation = err instanceof ZodError;
    const tooLarge =
      !!err && typeof err === "object" && "status" in err && err.status === 413;
    const busy =
      !!err && typeof err === "object" && "status" in err && err.status === 503;
    res
      .status(
        tooLarge ? 413 : busy ? 503 : validation || err instanceof SyntaxError ? 400 : 502,
      )
      .json({
        error: {
          code: tooLarge
            ? "REQUEST_TOO_LARGE"
            : busy
              ? "SERVICE_BUSY"
            : validation
              ? "VALIDATION_ERROR"
              : "SERVICE_ERROR",
          message: tooLarge
            ? "Request exceeds 100 kB"
            : validation
              ? err.issues.map((x) => x.message).join("; ")
              : err instanceof Error
                ? err.message
                : "Unable to retrieve Horizons data",
        },
      });
  },
);
export default app;
