import type { Result } from "../../science/horizons";
export type Needs = {
  sun: number;
  earth: number;
  darkness: number;
  overlap: number;
};
export type Saved = { id: string; name: string; result: Result; needs: Needs };
export const defaultNeeds: Needs = {
  sun: 50,
  earth: 50,
  darkness: 72,
  overlap: 12,
};
export const checks = (r: Result, n: Needs) => [
  {
    name: "Sun availability",
    actual: r.summary.sun.percent,
    required: n.sun,
    unit: "%",
    pass: r.summary.sun.percent >= n.sun,
  },
  {
    name: "Earth visibility",
    actual: r.summary.earth.percent,
    required: n.earth,
    unit: "%",
    pass: r.summary.earth.percent >= n.earth,
  },
  {
    name: "Maximum below-Sun-threshold interval",
    actual: r.summary.sun.longestBelowHours,
    required: n.darkness,
    unit: "h",
    pass: r.summary.sun.longestBelowHours <= n.darkness,
  },
  {
    name: "Continuous overlapping window",
    actual: r.summary.overlap.longestHours,
    required: n.overlap,
    unit: "h",
    pass: r.summary.overlap.longestHours >= n.overlap,
  },
];
export function explanation(a: Saved, b: Saved) {
  if (JSON.stringify(a.needs) !== JSON.stringify(b.needs))
    return "These scenarios use different requirements. Review the checks separately before comparing suitability.";
  const x = a.result,
    y = b.result;
  if (
    x.request.minimumSunElevation !== y.request.minimumSunElevation ||
    x.request.minimumEarthElevation !== y.request.minimumEarthElevation
  )
    return "Elevation thresholds differ. Rerun both scenarios with matching thresholds for a fair comparison.";
  const ac = checks(x, a.needs).filter((c) => c.pass).length,
    bc = checks(y, b.needs).filter((c) => c.pass).length;
  const longer =
    x.summary.overlap.longestHours > y.summary.overlap.longestHours ? a : b;
  return (
    `${a.name} meets ${ac} of 4 selected requirements; ${b.name} meets ${bc} of 4. ` +
    (Math.abs(x.summary.overlap.longestHours - y.summary.overlap.longestHours) <
    0.01
      ? "Both have the same longest overlapping window."
      : `${longer.name} has the longer continuous overlapping window (${longer.result.summary.overlap.longestHours.toFixed(1)} h).`) +
    " Terrain suitability is unassessed for both."
  );
}
export function csv(saved: Saved[]) {
  const cell = (v: unknown) =>
    '"' +
    String(v)
      .replace(/^[=+@]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return [
    [
      "Scenario",
      "Latitude deg",
      "Longitude E deg",
      "Observer height km above reference sphere",
      "Start UTC",
      "Duration h",
      "Step min",
      "Sun threshold deg",
      "Earth threshold deg",
      "Required Sun %",
      "Required Earth %",
      "Max darkness h",
      "Required overlap h",
      "Sun %",
      "Earth %",
      "Longest below Sun threshold h",
      "Longest overlap h",
      "Source",
      "Retrieved at",
      "Frame",
      "Terrain",
      "Requests",
    ],
    ...saved.map((s) => {
      const r = s.result;
      return [
        s.name,
        r.request.latitude,
        r.request.longitude,
        r.request.observerHeightKm,
        r.request.startTime,
        r.request.durationHours,
        r.request.stepMinutes,
        r.request.minimumSunElevation,
        r.request.minimumEarthElevation,
        s.needs.sun,
        s.needs.earth,
        s.needs.darkness,
        s.needs.overlap,
        r.summary.sun.percent,
        r.summary.earth.percent,
        r.summary.sun.longestBelowHours,
        r.summary.overlap.longestHours,
        r.provenance.source,
        r.provenance.retrievedAt,
        r.provenance.frame,
        r.provenance.terrain,
        JSON.stringify(r.provenance.requests),
      ];
    }),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
export function validSaved(x: unknown): x is Saved {
  const v = x as Saved;
  return (
    !!v &&
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    v.result?.provenance?.source === "NASA/JPL Horizons" &&
    Array.isArray(v.result?.samples) &&
    v.result.samples.length > 1 &&
    !!v.result.summary?.sun &&
    !!v.result.summary?.earth &&
    !!v.result.summary?.overlap &&
    !!v.result.intervals &&
    Object.values(v.needs || {}).length === 4 &&
    Object.values(v.needs).every(
      (n) => typeof n === "number" && Number.isFinite(n),
    )
  );
}
