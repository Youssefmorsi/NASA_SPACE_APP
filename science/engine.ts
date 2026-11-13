import * as A from "astronomy-engine";
import { z } from "zod";
const rad = Math.PI / 180,
  deg = 180 / Math.PI;
export const requestSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    startTime: z
      .string()
      .datetime()
      .refine(
        (s) =>
          Date.parse(s) >= Date.parse("2000-01-01") &&
          Date.parse(s) < Date.parse("2100-01-01"),
        "Supported starts: 2000–2099",
      ),
    durationHours: z.number().positive().max(744),
    stepMinutes: z.number().min(5).max(360),
    minimumSunElevation: z.number().min(0).max(30).default(0),
    minimumEarthElevation: z.number().min(0).max(30).default(5),
  })
  .refine(
    (x) => Math.ceil((x.durationHours * 60) / x.stepMinutes) <= 4500,
    "Maximum 4500 intervals",
  );
export type Request = z.infer<typeof requestSchema>;
type V = [number, number, number];
const dot = (a: V, b: V) => a.reduce((s, v, i) => s + v * b[i], 0);
export const wrap = (v: number) => ((((v + 180) % 360) + 360) % 360) - 180;
export function localDirection(v: V, lat: number, lon: number) {
  const p = lat * rad,
    l = lon * rad;
  const east: V = [-Math.sin(l), Math.cos(l), 0],
    north: V = [
      -Math.sin(p) * Math.cos(l),
      -Math.sin(p) * Math.sin(l),
      Math.cos(p),
    ],
    up: V = [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
  const e = dot(v, east),
    n = dot(v, north),
    u = dot(v, up);
  return {
    azimuth: (Math.atan2(e, n) * deg + 360) % 360,
    elevation: Math.atan2(u, Math.hypot(e, n)) * deg,
  };
}
export function positions(latitude: number, longitude: number, time: string) {
  const date = new Date(time),
    moon = A.GeoMoon(date),
    sun = A.GeoVector(A.Body.Sun, date, false),
    axis = A.RotationAxis(A.Body.Moon, date);
  const a = axis.ra * 15 * rad,
    d = axis.dec * rad,
    w = axis.spin * rad;
  const q: V = [-Math.sin(a), Math.cos(a), 0],
    r: V = [
      -Math.sin(d) * Math.cos(a),
      -Math.sin(d) * Math.sin(a),
      Math.cos(d),
    ],
    p: V = [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)];
  const x = q.map((v, i) => v * Math.cos(w) + r[i] * Math.sin(w)) as V,
    y = q.map((v, i) => -v * Math.sin(w) + r[i] * Math.cos(w)) as V;
  const lat = latitude * rad,
    lon = longitude * rad,
    observer: V = [
      Math.cos(lat) * Math.cos(lon) * 1737.4,
      Math.cos(lat) * Math.sin(lon) * 1737.4,
      Math.sin(lat) * 1737.4,
    ];
  function transform(v: V) {
    const b: V = [
      dot(v, x) * A.KM_PER_AU - observer[0],
      dot(v, y) * A.KM_PER_AU - observer[1],
      dot(v, p) * A.KM_PER_AU - observer[2],
    ];
    return localDirection(b, latitude, longitude);
  }
  return {
    time: new Date(time).toISOString(),
    sun: transform([sun.x - moon.x, sun.y - moon.y, sun.z - moon.z]),
    earth: transform([-moon.x, -moon.y, -moon.z]),
  };
}
export type Sample = ReturnType<typeof positions>;
export type Interval = { start: string; end: string; hours: number };
export function windows(
  samples: Sample[],
  value: (s: Sample) => number,
): Interval[] {
  const out: Interval[] = [];
  let start: number | null =
    value(samples[0]) > 0 ? Date.parse(samples[0].time) : null;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1],
      b = samples[i],
      va = value(a),
      vb = value(b);
    if (va > 0 !== vb > 0) {
      const crossing =
        Date.parse(a.time) +
        ((Date.parse(b.time) - Date.parse(a.time)) * -va) / (vb - va);
      if (vb > 0) start = crossing;
      else if (start !== null) {
        out.push({
          start: new Date(start).toISOString(),
          end: new Date(crossing).toISOString(),
          hours: (crossing - start) / 36e5,
        });
        start = null;
      }
    }
  }
  if (start !== null) {
    const end = Date.parse(samples.at(-1)!.time);
    out.push({
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      hours: (end - start) / 36e5,
    });
  }
  return out;
}
export function analyze(input: unknown) {
  const request = requestSchema.parse(input),
    start = Date.parse(request.startTime),
    end = start + request.durationHours * 36e5;
  const samples: Sample[] = [];
  for (let t = start; t < end; t += request.stepMinutes * 60000)
    samples.push(
      positions(request.latitude, request.longitude, new Date(t).toISOString()),
    );
  samples.push(
    positions(request.latitude, request.longitude, new Date(end).toISOString()),
  );
  const sunValue = (s: Sample) => s.sun.elevation - request.minimumSunElevation,
    earthValue = (s: Sample) =>
      s.earth.elevation - request.minimumEarthElevation;
  const sun = windows(samples, sunValue),
    earth = windows(samples, earthValue),
    overlap: Interval[] = [];
  for (const a of sun)
    for (const b of earth) {
      const st = Math.max(Date.parse(a.start), Date.parse(b.start)),
        en = Math.min(Date.parse(a.end), Date.parse(b.end));
      if (en > st)
        overlap.push({
          start: new Date(st).toISOString(),
          end: new Date(en).toISOString(),
          hours: (en - st) / 36e5,
        });
    }
  const metric = (xs: Interval[]) => ({
    hours: xs.reduce((s, x) => s + x.hours, 0),
    percent:
      (100 * xs.reduce((s, x) => s + x.hours, 0)) / request.durationHours,
    longestHours: Math.max(0, ...xs.map((x) => x.hours)),
  });
  const events = (xs: Interval[]) => ({
    rise: xs.find((x) => Date.parse(x.start) > start)?.start ?? null,
    set: xs.find((x) => Date.parse(x.end) < end)?.end ?? null,
  });
  return {
    request,
    samples,
    intervals: { sun, earth, overlap },
    summary: {
      sun: metric(sun),
      earth: metric(earth),
      overlap: metric(overlap),
      sunEvents: events(sun),
      earthEvents: events(earth),
    },
    provenance: {
      source: "Astronomy Engine 2.1.19 · analytic ephemerides",
      mode: "Offline geometric screening",
      frame:
        "IAU lunar principal-axis orientation; planetocentric latitude, east-positive longitude",
      timeReference: "UTC input; library TT conversion",
      terrain: "0° spherical geometric horizon · no terrain",
      coverage: `${samples[0].time} — ${samples.at(-1)!.time}`,
      stepMinutes: request.stepMinutes,
      limitations: [
        "No LOLA terrain or local shadowing.",
        "Body-center visibility; no limb, refraction, or link budget.",
        "IAU orientation is not a DE/SPICE lunar frame realization.",
        "Sun vector uses geocentric light-time treatment; not a lunar apparent-position solution.",
        "NASA SVS spot checks: 10 directions, max azimuth difference 0.0253°, elevation 0.0063°. Not a global accuracy bound; Horizons observer validation pending.",
      ],
    },
  };
}
export type Analysis = ReturnType<typeof analyze>;
export function feasibility(
  a: Analysis,
  r: { sun: number; earth: number; sunHours: number; earthHours: number },
) {
  return [
    {
      name: "Sun availability",
      actual: a.summary.sun.percent,
      required: r.sun,
      unit: "%",
    },
    {
      name: "Earth line of sight",
      actual: a.summary.earth.percent,
      required: r.earth,
      unit: "%",
    },
    {
      name: "Continuous sunlight",
      actual: a.summary.sun.longestHours,
      required: r.sunHours,
      unit: "h",
    },
    {
      name: "Continuous Earth visibility",
      actual: a.summary.earth.longestHours,
      required: r.earthHours,
      unit: "h",
    },
  ].map((x) => ({ ...x, pass: x.actual >= x.required }));
}
