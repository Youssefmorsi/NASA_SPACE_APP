import { test } from "node:test";
import assert from "node:assert/strict";
import type { Result } from "../science/horizons.ts";
import { nextDownCrossing } from "../frontend/src/components/SkyView.tsx";
import { linkSchema, readScenarioLink } from "../frontend/src/scenarioLink.ts";

const result = {
  request: { minimumSunElevation: 0, minimumEarthElevation: 5 },
  samples: [
    { time: "2026-11-13T00:00:00Z", sun: { elevation: 2 }, earth: { elevation: 4 } },
    { time: "2026-11-13T02:00:00Z", sun: { elevation: -2 }, earth: { elevation: 3 } },
  ],
} as unknown as Result;
test("countdowns interpolate crossings and report below or exhausted coverage", () => {
  assert.match(nextDownCrossing(result, 0, "sun"), /~1\.0 h · 2026-11-13 01:00 UTC/);
  assert.equal(nextDownCrossing(result, 0, "earth"), "Already below 5° threshold");
  assert.equal(nextDownCrossing(result, 1, "sun"), "Already below 0° threshold");
  const rising = { ...result, samples: [...result.samples].reverse() } as Result;
  assert.equal(nextDownCrossing(rising, 1, "sun"), "No downward crossing within sampled coverage");
});
test("shared inputs validate and round trip while malformed links are rejected", () => {
  const value = { v: 1, name: "Example", mission: { latitude: -89, longitude: 0, observerHeightKm: 0, startTime: "2026-11-13T00:00:00Z", durationHours: 24, stepMinutes: 60, minimumSunElevation: 0, minimumEarthElevation: 5 }, needs: { sun: 50, earth: 50, darkness: 72, overlap: 12 } };
  assert.equal(linkSchema.safeParse(value).success, true);
  const query = new URLSearchParams({ scenario: JSON.stringify(value) });
  assert.equal(readScenarioLink(`?${query}`)?.success, true);
  assert.equal(readScenarioLink("?scenario=not-json")?.success, false);
  assert.equal(linkSchema.safeParse({ ...value, mission: { ...value.mission, latitude: -91 } }).success, false);
  assert.equal(linkSchema.safeParse({ ...value, mission: { ...value.mission, stepMinutes: 35 } }).success, false);
});
