import express from "express";
import { analyzeHorizons, missionSchema } from "../science/horizons.ts";
import { catalog } from "../data/catalog.ts";
import { z, ZodError } from "zod";
import path from "node:path";
import { readFile } from "node:fs/promises";
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
        await readFile(`data/horizons-cache/${req.params.key}.json`, "utf8"),
      );
  } catch {
    res
      .status(404)
      .json({
        error: { message: "Original response is not available on this server" },
      });
  }
});
app.use("/api", (_req, res) =>
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Unknown API route" } }),
);
if (process.env.NODE_ENV === "production")
  app.use(express.static(path.resolve("dist")));
else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
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
    res
      .status(
        tooLarge ? 413 : validation || err instanceof SyntaxError ? 400 : 502,
      )
      .json({
        error: {
          code: tooLarge
            ? "REQUEST_TOO_LARGE"
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
const port = Number(process.env.PORT || 5173);
app.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(`LunarSight ready at http://127.0.0.1:${port}`),
);
