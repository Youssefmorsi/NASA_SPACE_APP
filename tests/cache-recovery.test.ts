import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { analyzeHorizons, missionSchema, parameters } from "../science/horizons.ts";

const request = { latitude: -89, longitude: 0, observerHeightKm: 0, startTime: "2026-11-13T00:00:00Z", durationHours: 168, stepMinutes: 60, minimumSunElevation: 0, minimumEarthElevation: 5 };
const key = createHash("sha256").update(JSON.stringify([parameters(request, "10"), parameters(request, "399")])).digest("hex");

test("invalid cache is refreshed and simultaneous requests report their actual source", async () => {
  const originalCwd = process.cwd();
  const fixture = JSON.parse(await readFile(path.join(originalCwd, "data", "horizons-cache", `${key}.json`), "utf8"));
  const temp = await mkdtemp(path.join(os.tmpdir(), "lunarsight-cache-"));
  const cacheDir = path.join(temp, "data", "horizons-cache");
  await mkdir(cacheDir, { recursive: true });
  await writeFile(path.join(cacheDir, `${key}.json`), JSON.stringify({ sun: "bad", earth: "bad", retrievedAt: new Date().toISOString() }));
  const originalFetch = globalThis.fetch;
  let fetches = 0;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    fetches++;
    const target = new URL(String(input)).searchParams.get("COMMAND");
    return new Response(JSON.stringify({ result: target === "'10'" ? fixture.sun : fixture.earth, signature: fixture.signature }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    process.chdir(temp);
    const [first, second] = await Promise.all([analyzeHorizons(request), analyzeHorizons(request)]);
    assert.deepEqual([first.provenance.mode, second.provenance.mode].sort(), ["Cached Horizons response", "Live Horizons response"]);
    assert.equal(fetches, 2);
    assert.equal(first.samples.length, 169);
    assert.equal(second.samples.length, 169);
    assert.match((await analyzeHorizons(request)).provenance.mode, /Cached/);
    assert.equal(fetches, 2);
  } finally {
    process.chdir(originalCwd);
    globalThis.fetch = originalFetch;
    await rm(temp, { recursive: true, force: true });
  }
});

test("mission end remains within the documented time range", () => {
  assert.equal(missionSchema.safeParse({ ...request, startTime: "2099-12-31T23:00:00Z", durationHours: 1 }).success, false);
  assert.equal(missionSchema.safeParse({ ...request, startTime: "2099-12-31T22:00:00Z", durationHours: 1 }).success, true);
});
