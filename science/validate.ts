import { readFileSync, writeFileSync } from "node:fs";
import { positions, localDirection, wrap } from "./engine.ts";
const source = JSON.parse(readFileSync("data/mooninfo_2026.json", "utf8"));
const cases = [
  { id: "Equator", latitude: 0, longitude: 0, time: "2026-10-30T00:00:00Z" },
  {
    id: "Shackleton",
    latitude: -89.7668,
    longitude: -171.87,
    time: "2026-10-30T00:00:00Z",
  },
  {
    id: "Malapert",
    latitude: -85.9948,
    longitude: -0.23578,
    time: "2026-11-06T00:00:00Z",
  },
  { id: "Farside", latitude: 10, longitude: 150, time: "2026-03-01T00:00:00Z" },
  { id: "North", latitude: 85, longitude: 80, time: "2026-01-01T00:00:00Z" },
];
const rows = [];
for (const c of cases) {
  const ref = source.find(
    (s: any) =>
      Date.parse(s.time.replace(" UT", " GMT")) === Date.parse(c.time),
  );
  if (!ref) throw Error("Missing reference");
  for (const body of ["sun", "earth"] as const) {
    const point = body === "sun" ? ref.subsolar : ref.subearth;
    const r = Math.PI / 180,
      distance = body === "earth" ? ref.distance : 149597870.7;
    const p = c.latitude * r,
      l = c.longitude * r,
      b = point.lat * r,
      a = point.lon * r;
    const vector: [number, number, number] = [
      distance * Math.cos(b) * Math.cos(a) - 1737.4 * Math.cos(p) * Math.cos(l),
      distance * Math.cos(b) * Math.sin(a) - 1737.4 * Math.cos(p) * Math.sin(l),
      distance * Math.sin(b) - 1737.4 * Math.sin(p),
    ];
    const expected = localDirection(vector, c.latitude, c.longitude),
      actual = positions(c.latitude, c.longitude, c.time)[body];
    rows.push({
      ...c,
      body,
      referenceSubpoint: point,
      reference: expected,
      actual,
      azimuthError: Math.abs(wrap(actual.azimuth - expected.azimuth)),
      elevationError: Math.abs(actual.elevation - expected.elevation),
    });
  }
}
const report = {
  source:
    "https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/mooninfo_2026.json",
  retrieved: "2026-10-30",
  method:
    "Reconstruct body directions from NASA SVS subpoints. Earth distance is the SVS distance; solar distance is fixed at 1 AU (parallax effect <0.001°). Same ENU transform is separately unit tested. Tests are independent ephemeris/orientation checks, not independent validation of every transform.",
  toleranceDegrees: 0.1,
  rows,
};
writeFileSync(
  "data/validation-results.json",
  JSON.stringify(report, null, 2) + "\n",
);
for (const x of rows)
  console.log(
    `${x.id.padEnd(12)} ${x.body.padEnd(5)} ref az/el ${x.reference.azimuth.toFixed(4)} / ${x.reference.elevation.toFixed(4)}; error ${x.azimuthError.toFixed(5)} / ${x.elevationError.toFixed(5)}°`,
  );
if (
  rows.some(
    (x) =>
      x.azimuthError > report.toleranceDegrees ||
      x.elevationError > report.toleranceDegrees,
  )
)
  process.exitCode = 1;
