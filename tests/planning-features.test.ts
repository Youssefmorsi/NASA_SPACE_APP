import { test } from "node:test";
import assert from "node:assert/strict";
import type { Result } from "../science/horizons.ts";
import { nextDownCrossing } from "../frontend/src/components/SkyView.tsx";
import { linkSchema, readScenarioLink } from "../frontend/src/scenarioLink.ts";
import { parseBackup, serializeBackup } from "../frontend/src/scenarioBackup.ts";
import { defaultNeeds, explanation, mergeExampleScenarios, type Saved } from "../frontend/src/model.ts";
import { readFileSync } from "node:fs";

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
  assert.equal(linkSchema.safeParse({ ...value, mission: { ...value.mission, startTime: "2099-12-31T23:00:00Z" } }).success, false);
});

test("reloading examples selects the example IDs even after saving an unrelated scenario", () => {
  const examples = JSON.parse(readFileSync("public/data/examples.json", "utf8")).map((entry: Saved) => ({ ...entry, needs: defaultNeeds }));
  const unrelated = { ...examples[0], id: "unrelated", name: "Custom scenario" };
  const existing = [...examples, unrelated];
  const result = mergeExampleScenarios(existing, examples);
  assert.deepEqual(result.selected, examples.slice(0, 2).map((item: Saved) => item.id));
  assert.equal(result.all.length, 4);
});

test("scenario backup round trips and rejects malformed or unsafe data", () => {
  const examples: Saved[] = JSON.parse(readFileSync("public/data/examples.json", "utf8")).map((entry: Saved) => ({ ...entry, needs: defaultNeeds }));
  const restored = parseBackup(serializeBackup(examples));
  assert.equal(restored.length, examples.length);
  assert.equal(restored[0].result.provenance.mode, "Imported backup (unverified)");
  const tampered = structuredClone(examples);
  tampered[0].result.provenance.rawDownload = "javascript:alert(1)";
  assert.throws(() => parseBackup(serializeBackup(tampered)));
  assert.throws(() => parseBackup("{}"));
});

test("comparison warns when the scenario windows or sampling differ", () => {
  const examples: Saved[] = JSON.parse(readFileSync("public/data/examples.json", "utf8")).map((entry: Saved) => ({ ...entry, needs: defaultNeeds }));
  const first = examples[0];
  const same = structuredClone(first);
  same.id = "second";
  same.name = "Second location";
  assert.doesNotMatch(explanation(first, same), /different dates, durations or sample intervals/);
  assert.match(explanation(first, same), /Sun and .*Earth geometric availability/);
  for (const change of [{ startTime: "2026-11-14T00:00:00Z" }, { durationHours: 24 }, { stepMinutes: 30 }]) {
    const different = structuredClone(same);
    Object.assign(different.result.request, change);
    assert.match(explanation(first, different), /different dates, durations or sample intervals/);
    assert.doesNotMatch(explanation(first, different), /has the longer/);
  }
  const differentHeight = structuredClone(same);
  differentHeight.result.request.observerHeightKm = 1;
  assert.match(explanation(first, differentHeight), /different observer heights/);
  const sameInstant = structuredClone(same);
  sameInstant.result.request.startTime = new Date(first.result.request.startTime).toISOString();
  assert.doesNotMatch(explanation(first, sameInstant), /different dates/);
});
