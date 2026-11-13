import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  parseTable,
  parameters,
  missionSchema,
  summarize,
  analyzeHorizons,
} from "../science/horizons.ts";
import {
  csv,
  checks,
  defaultNeeds,
  explanation,
} from "../frontend/src/model.ts";
const req = {
  latitude: -89,
  longitude: 0,
  observerHeightKm: 0,
  startTime: "2026-11-13T00:00:00Z",
  durationHours: 168,
  stepMinutes: 60,
  minimumSunElevation: 0,
  minimumEarthElevation: 5,
};
test("Horizons requests specify lunar observer, height, airless apparent elevation and UTC", () => {
  const p = parameters(req, "399");
  assert.equal(p.CENTER, "'coord@301'");
  assert.equal(p.SITE_COORD, "'0,-89,0'");
  assert.equal(p.QUANTITIES, "'4'");
  assert.equal(p.TIME_TYPE, "'UT'");
  assert.equal(p.APPARENT, "'AIRLESS'");
  assert.equal(p.COMMAND, "'399'");
});
test("parser reads actual saved Horizons tables and rejects incomplete data", () => {
  const file = readdirSync("data/horizons-cache")[0];
  const raw = JSON.parse(readFileSync("data/horizons-cache/" + file, "utf8"));
  const xs = parseTable(raw.sun);
  assert.equal(xs.length, 169);
  assert.equal(xs[0].time, req.startTime.replace("Z", ".000Z"));
  assert.ok(xs.every((x) => Math.abs(x.elevation) <= 90));
  assert.throws(() => parseTable(raw.sun.replace("$$EOE", "$$BROKEN")));
  assert.throws(() => parseTable(raw.sun.replace("MEAN_ME", "OTHER")));
  assert.throws(() =>
    parseTable(raw.sun.replace(/(\d+\.\d+),\n\$\$EOE/, "n.a.,\n$$EOE")),
  );
});
test("sample limits, non-divisible duration, exact poles and malformed coordinates reject", () => {
  for (const edit of [
    { latitude: 90 },
    { longitude: 181 },
    { durationHours: 744, stepMinutes: 5 },
    { durationHours: 1, stepMinutes: 180 },
    { observerHeightKm: -1 },
    { startTime: "2026-11-13T00:00:01Z" },
  ])
    assert.equal(missionSchema.safeParse({ ...req, ...edit }).success, false);
});
test("crossings interpolate and longest below-threshold interval includes end gaps", () => {
  const r = { ...req, durationHours: 4, stepMinutes: 60 };
  const samples = [-10, 10, 10, -10, -10].map((v, i) => ({
    time: new Date(Date.parse(req.startTime) + i * 36e5).toISOString(),
    sun: { azimuth: 0, elevation: v },
    earth: { azimuth: 0, elevation: 20 },
  }));
  const a = summarize(r, samples);
  assert.equal(a.summary.sun.hours, 2);
  assert.equal(a.summary.sun.longestBelowHours, 1.5);
  assert.equal(a.summary.overlap.hours, 2);
});
test("real cache analysis retains provenance and provides deterministic requirement checks", async () => {
  const r = await analyzeHorizons(req);
  assert.match(r.provenance.mode, /Cached/);
  assert.equal(r.samples.length, 169);
  assert.equal(checks(r, defaultNeeds).length, 4);
  assert.equal(r.provenance.requests.sun.CENTER, "'coord@301'");
  const s = { id: "a", name: '=unsafe,"name"', result: r, needs: defaultNeeds };
  const out = csv([s]);
  assert.ok(out.includes("'=unsafe,"));
  assert.ok(out.includes("NASA/JPL Horizons"));
  assert.match(
    explanation(s, { ...s, id: "b", needs: { ...defaultNeeds, sun: 90 } }),
    /different requirements/,
  );
});

test("equality with a threshold counts as meeting it", () => {
  const r = { ...req, durationHours: 1 };
  const samples = [0, 1].map((i) => ({
    time: new Date(Date.parse(req.startTime) + i * 36e5).toISOString(),
    sun: { azimuth: 0, elevation: 0 },
    earth: { azimuth: 0, elevation: 5 },
  }));
  const a = summarize(r, samples);
  assert.equal(a.summary.sun.percent, 100);
  assert.equal(a.summary.earth.percent, 100);
  assert.equal(a.summary.sun.longestBelowHours, 0);
});
