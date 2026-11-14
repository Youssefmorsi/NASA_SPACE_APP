import { test } from "node:test";
import assert from "node:assert/strict";
import { rankMissionStarts } from "../science/window-finder.ts";
import {
  findMissionWindows,
  windowSearchSchema,
} from "../science/window-search.ts";
import { summarize } from "../science/horizons.ts";
const at = (hours: number) =>
  new Date(Date.UTC(2026, 10, 13) + hours * 36e5).toISOString();
const interval = (start: number, end: number) => ({
  start: at(start),
  end: at(end),
  hours: end - start,
});
const mission = {
  latitude: 0,
  longitude: 0,
  observerHeightKm: 0,
  startTime: at(0),
  durationHours: 48,
  stepMinutes: 60,
  minimumSunElevation: 0,
  minimumEarthElevation: 5,
};
test("window ranking clips fractional intersections and prefers continuous overlap", () => {
  const source = {
    request: { ...mission, durationHours: 24 },
    intervals: {
      sun: [interval(0, 24)],
      earth: [interval(3.5, 15.5)],
      overlap: [interval(3.5, 15.5)],
    },
  };
  const ranked = rankMissionStarts(source, 6, 6);
  assert.equal(ranked.length, 4);
  assert.equal(ranked[0].startTime, at(6));
  assert.equal(ranked[0].longestOverlapHours, 6);
  assert.equal(ranked[0].earthPercent, 100);
  assert.equal(ranked.find((c) => c.startTime === at(0))!.overlapHours, 2.5);
  assert.equal(ranked.find((c) => c.startTime === at(18))!.earthPercent, 0);
});
test("ranking uses total overlap to break continuous ties, then earliest start", () => {
  const intervals = [interval(0, 2), interval(3, 5), interval(8, 10)];
  const source = {
    request: { ...mission, durationHours: 12 },
    intervals: { sun: intervals, earth: intervals, overlap: intervals },
  };
  const ranked = rankMissionStarts(source, 6, 6);
  assert.equal(ranked[0].startTime, at(0));
  assert.equal(ranked[0].longestOverlapHours, 2);
  assert.equal(ranked[0].overlapHours, 4);
  const empty = rankMissionStarts(
    { ...source, intervals: { sun: [], earth: [], overlap: [] } },
    6,
    6,
  );
  assert.deepEqual(
    empty.map((c) => c.startTime),
    [at(0), at(6)],
  );
  assert.ok(empty.every((c) => c.longestOverlapHours === 0));
});
test("source windows agree with recomputing individual sampled mission summaries", async () => {
  const result = await findMissionWindows({
    mission,
    searchHours: 120,
    startStepHours: 6,
  });
  assert.equal(result.candidateCount, 21);
  assert.equal(result.source.request.durationHours, 168);
  assert.match(result.source.provenance.mode, /Cached/);
  const { readFile } = await import("node:fs/promises");
  const examples = JSON.parse(
    await readFile("public/data/examples.json", "utf8"),
  );
  const source = examples.find(
    (x: { result: { request: { latitude: number } } }) =>
      x.result.request.latitude === 0,
  ).result;
  for (const candidate of result.candidates) {
    const request = { ...mission, startTime: candidate.startTime };
    const samples = source.samples.filter(
      (s: { time: string }) =>
        Date.parse(s.time) >= Date.parse(candidate.startTime) &&
        Date.parse(s.time) <= Date.parse(candidate.endTime),
    );
    const { summary } = summarize(request, samples);
    assert.ok(Math.abs(candidate.overlapHours - summary.overlap.hours) < 1e-8);
    assert.ok(
      Math.abs(candidate.longestOverlapHours - summary.overlap.longestHours) <
        1e-8,
    );
    assert.ok(candidate.sunPercent >= 0 && candidate.sunPercent <= 100);
  }
});
test("search rejects excessive coverage and invalid spacing before contacting Horizons", async () => {
  assert.equal(
    windowSearchSchema.safeParse({
      mission: { ...mission, durationHours: 744 },
      searchHours: 24,
    }).success,
    false,
  );
  assert.equal(
    windowSearchSchema.safeParse({
      mission,
      searchHours: 25,
      startStepHours: 6,
    }).success,
    false,
  );
  assert.throws(() =>
    rankMissionStarts(
      { request: mission, intervals: { sun: [], earth: [], overlap: [] } },
      49,
      6,
    ),
  );
  await assert.rejects(
    findMissionWindows({
      mission: {
        ...mission,
        startTime: "2099-12-30T00:00:00Z",
        durationHours: 24,
      },
      searchHours: 72,
    }),
    /Mission end/,
  );
});
