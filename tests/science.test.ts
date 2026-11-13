import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyze,
  localDirection,
  positions,
  windows,
  requestSchema,
  wrap,
  feasibility,
  type Sample,
} from "../science/engine.ts";
const req = {
  latitude: 0,
  longitude: 0,
  startTime: "2026-10-30T00:00:00Z",
  durationHours: 168,
  stepMinutes: 60,
  minimumSunElevation: 0,
  minimumEarthElevation: 5,
};
const near = (a: number, b: number, t = 1e-9) =>
  assert.ok(Math.abs(a - b) < t, `${a} != ${b}`);
function sample(h: number, s: number, e = s): Sample {
  return {
    time: new Date(Date.parse(req.startTime) + h * 36e5).toISOString(),
    sun: { azimuth: 0, elevation: s },
    earth: { azimuth: 0, elevation: e },
  };
}
test("rejects invalid coordinates, nonfinite values and non-UTC dates", () => {
  for (const extra of [
    { latitude: 91 },
    { latitude: NaN },
    { longitude: 181 },
    { startTime: "2026-10-30T00:00" },
    { durationHours: 0 },
    { stepMinutes: 0 },
    { minimumEarthElevation: -1 },
    { startTime: "1999-12-31T00:00:00Z" },
  ])
    assert.equal(requestSchema.safeParse({ ...req, ...extra }).success, false);
});
test("rejects excessive samples", () =>
  assert.equal(
    requestSchema.safeParse({ ...req, durationHours: 744, stepMinutes: 5 })
      .success,
    false,
  ));
test("longitude wraps around the antimeridian", () => {
  near(wrap(181), -179);
  near(wrap(-181), 179);
  near(wrap(540), -180);
});
test("local frame at equator has expected zenith and cardinals", () => {
  near(localDirection([1, 0, 0], 0, 0).elevation, 90);
  near(localDirection([0, 1, 0], 0, 0).azimuth, 90);
  near(localDirection([0, 0, 1], 0, 0).azimuth, 0);
  near(localDirection([0, -1, 0], 0, 0).azimuth, 270);
  near(localDirection([-1, 0, 0], 0, 0).elevation, -90);
});
test("local frame follows longitude and poles", () => {
  near(localDirection([0, 1, 0], 0, 90).elevation, 90);
  near(localDirection([0, 0, -1], -90, 0).elevation, 90);
  near(localDirection([0, 0, 1], 90, 80).elevation, 90);
});
test("crossing times and visible durations are interpolated", () => {
  const w = windows(
    [sample(0, -10), sample(2, 10), sample(4, -10)],
    (s) => s.sun.elevation,
  );
  assert.equal(w.length, 1);
  near(w[0].hours, 2);
  assert.equal(w[0].start, sample(1, 0).time);
  assert.equal(w[0].end, sample(3, 0).time);
});
test("horizon equality is not visibility", () =>
  assert.deepEqual(
    windows([sample(0, 0), sample(1, 0)], (s) => s.sun.elevation),
    [],
  ));
test("continuous daylight spans entire interval and no light has no intervals", () => {
  near(
    windows([sample(0, 1), sample(4, 1)], (s) => s.sun.elevation)[0].hours,
    4,
  );
  assert.deepEqual(
    windows([sample(0, -1), sample(4, -1)], (s) => s.sun.elevation),
    [],
  );
});
test("Earth thresholds shift crossings separately from sunlight", () => {
  const ss = [sample(0, 10, -5), sample(4, 10, 15)];
  near(windows(ss, (s) => s.earth.elevation - 5)[0].hours, 2);
  near(windows(ss, (s) => s.sun.elevation)[0].hours, 4);
});
test("partial first and last windows are retained", () => {
  const w = windows(
    [sample(0, 2), sample(2, -2), sample(4, 2)],
    (s) => s.sun.elevation,
  );
  assert.equal(w.length, 2);
  near(w[0].hours, 1);
  near(w[1].hours, 1);
});
test("analysis includes exact fractional endpoint", () => {
  const a = analyze({ ...req, durationHours: 1.25 });
  assert.equal(a.samples.at(-1)!.time, "2026-10-30T01:15:00.000Z");
  assert.equal(a.samples.length, 3);
});
test("near/far-side Earth geometry and finite polar directions", () => {
  assert.ok(positions(0, 0, req.startTime).earth.elevation > 75);
  assert.ok(positions(0, 180, req.startTime).earth.elevation < -75);
  for (const lat of [-90, 90])
    for (const lon of [-180, 180])
      for (const body of ["sun", "earth"] as const) {
        const p = positions(lat, lon, req.startTime)[body];
        assert.ok(
          Number.isFinite(p.azimuth) && p.azimuth >= 0 && p.azimuth < 360,
        );
        assert.ok(Number.isFinite(p.elevation) && Math.abs(p.elevation) <= 90);
      }
});
test("date changes calculations and ±180 gives identical directions", () => {
  const a = positions(-85, 180, req.startTime),
    b = positions(-85, -180, req.startTime),
    c = positions(-85, 180, "2026-11-07T00:00:00Z");
  near(a.sun.elevation, b.sun.elevation);
  assert.ok(Math.abs(a.sun.azimuth - c.sun.azimuth) > 20);
});
test("percentages, overlap, rise/set and no-event semantics", () => {
  const a = analyze({ ...req, durationHours: 708.72 });
  for (const key of ["sun", "earth", "overlap"] as const) {
    const m = a.summary[key];
    assert.ok(m.percent >= 0 && m.percent <= 100.000001);
    near((m.hours / a.request.durationHours) * 100, m.percent);
    assert.ok(m.longestHours <= m.hours);
  }
  assert.ok(a.summary.overlap.hours <= a.summary.sun.hours + 1e-9);
  assert.ok(a.summary.overlap.hours <= a.summary.earth.hours + 1e-9);
  assert.ok(a.summary.sunEvents.rise);
  assert.ok(a.summary.sunEvents.set);
  assert.equal(a.summary.earthEvents.set, null);
  assert.equal(a.summary.earthEvents.rise, null);
});
test("operational thresholds cannot increase opportunity", () => {
  const low = analyze({ ...req, latitude: -86 }),
    high = analyze({
      ...req,
      latitude: -86,
      minimumSunElevation: 10,
      minimumEarthElevation: 10,
    });
  assert.ok(high.summary.sun.hours <= low.summary.sun.hours);
  assert.ok(high.summary.earth.hours <= low.summary.earth.hours);
});
test("feasibility gives traceable actuals and comparison thresholds", () => {
  const a = analyze(req),
    checks = feasibility(a, { sun: 0, earth: 0, sunHours: 0, earthHours: 0 });
  assert.ok(checks.every((c) => c.pass));
  assert.equal(checks[0].actual, a.summary.sun.percent);
  assert.equal(
    feasibility(a, { sun: 100, earth: 100, sunHours: 744, earthHours: 744 })[2]
      .pass,
    false,
  );
});
