import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
let server: ChildProcess;
const base = "http://127.0.0.1:5178";
before(async () => {
  server = spawn(process.execPath, ["--import", "tsx", "backend/server.ts"], {
    env: { ...process.env, NODE_ENV: "production", PORT: "5178" },
    stdio: "pipe",
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    const timeout = setTimeout(
      () => reject(Error("Server did not start")),
      30000,
    );
    server.stdout!.on("data", (d) => {
      if (String(d).includes("ready")) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
});
after(() => server?.kill());
const request = {
  latitude: -89,
  longitude: 0,
  startTime: "2026-11-13T00:00:00Z",
  durationHours: 168,
  stepMinutes: 60,
  minimumSunElevation: 0,
  minimumEarthElevation: 5,
};
async function post(path: string, body: unknown) {
  return fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
test("health and documented lunar sites", async () => {
  assert.equal((await (await fetch(base + "/api/health")).json()).status, "ok");
  const sites = await (await fetch(base + "/api/sites")).json();
  assert.ok(sites.length >= 3);
});
test("analysis returns a complete typed scientific result", async () => {
  const res = await post("/api/analyze", request);
  assert.equal(res.status, 200);
  const a = await res.json();
  assert.equal(a.samples.length, 169);
  assert.equal(a.request.latitude, request.latitude);
  assert.ok(a.provenance.source.includes("Horizons"));
  assert.ok(a.summary.sun.hours >= 0);
});
test("changing location produces different ephemeris directions", async () => {
  const a = await (await post("/api/analyze", request)).json(),
    b = await (
      await post("/api/analyze", {
        ...request,
        latitude: -85,
        longitude: 45,
        startTime: "2026-11-13T00:00:00Z",
      })
    ).json();
  assert.notEqual(a.samples[0].sun.elevation, b.samples[0].sun.elevation);
  assert.notEqual(a.samples[0].earth.elevation, b.samples[0].earth.elevation);
});
test("compare matches individual analysis and accepts four scenarios", async () => {
  const a = await (await post("/api/analyze", request)).json();
  const res = await post("/api/compare", {
    scenarios: [request, { ...request, longitude: 0 }, request, request],
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.scenarios.length, 4);
  assert.deepEqual(data.scenarios[0].summary, a.summary);
});
test("unknown legacy ephemeris endpoint is not silently served by another engine", async () => {
  const res = await fetch(
    base + "/api/ephemeris?lat=0&lon=0&time=2026-11-13T00:00:00Z",
  );
  assert.equal(res.status, 404);
});
test("malformed requests fail with structured errors", async () => {
  for (const body of [
    { ...request, latitude: 999 },
    { ...request, durationHours: 744, stepMinutes: 5 },
    {},
  ]) {
    const res = await post("/api/analyze", body);
    assert.equal(res.status, 400);
    assert.ok((await res.json()).error.message);
  }
  assert.equal(
    (await post("/api/compare", { scenarios: [request] })).status,
    400,
  );
  const res = await fetch(base + "/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad",
  });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).error.code);
});
test("production frontend serves HTML and unknown APIs return 404", async () => {
  const res = await fetch(base);
  assert.equal(res.status, 200);
  assert.ok((await res.text()).includes("<title>LunarSight"));
  assert.equal((await fetch(base + "/api/nope")).status, 404);
});
test("missing comparison payload and oversized JSON return structured client errors", async () => {
  const missing = await post("/api/compare", {});
  assert.equal(missing.status, 400);
  assert.ok((await missing.json()).error.code);
  const huge = await post("/api/analyze", { padding: "x".repeat(110000) });
  assert.equal(huge.status, 413);
  assert.equal((await huge.json()).error.code, "REQUEST_TOO_LARGE");
});
