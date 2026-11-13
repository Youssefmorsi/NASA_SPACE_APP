import { z } from "zod";
import { windows, type Sample, type Interval } from "./intervals.ts";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

export const missionSchema = z
  .object({
    latitude: z.number().min(-89.999).max(89.999),
    longitude: z.number().min(-180).max(180),
    observerHeightKm: z.number().min(0).max(10).default(0),
    startTime: z
      .string()
      .datetime()
      .refine(
        (s) =>
          Date.parse(s) >= Date.parse("2000-01-01") &&
          Date.parse(s) < Date.parse("2100-01-01"),
        "Supported starts: 2000–2099",
      )
      .refine(
        (s) => Date.parse(s) % 60000 === 0,
        "Start must use whole minutes",
      ),
    durationHours: z.number().int().min(1).max(744),
    stepMinutes: z.number().int().min(5).max(360),
    minimumSunElevation: z.number().min(0).max(30).default(0),
    minimumEarthElevation: z.number().min(0).max(30).default(5),
  })
  .refine(
    (r) => (r.durationHours * 60) % r.stepMinutes === 0,
    "Choose a sample interval that divides the mission duration",
  )
  .refine(
    (r) => (r.durationHours * 60) / r.stepMinutes <= 1500,
    "Maximum 1500 intervals",
  );
export type Mission = z.infer<typeof missionSchema>;
export function parameters(r: Mission, target: "10" | "399", csv = true) {
  const date = (s: number) =>
    new Date(s).toISOString().slice(0, 19).replace("T", " ");
  return {
    format: "json",
    COMMAND: `'${target}'`,
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    CENTER: "'coord@301'",
    COORD_TYPE: "'GEODETIC'",
    SITE_COORD: `'${r.longitude},${r.latitude},${r.observerHeightKm}'`,
    START_TIME: `'${date(Date.parse(r.startTime))}'`,
    STOP_TIME: `'${date(Date.parse(r.startTime) + r.durationHours * 36e5)}'`,
    STEP_SIZE: `'${r.stepMinutes} m'`,
    QUANTITIES: "'4'",
    CSV_FORMAT: csv ? "'YES'" : "'NO'",
    TIME_DIGITS: "'SECONDS'",
    EXTRA_PREC: "'YES'",
    APPARENT: "'AIRLESS'",
    CAL_TYPE: "'GREGORIAN'",
    TIME_TYPE: "'UT'",
  };
}
export function parseTable(raw: string) {
  if (
    !raw.includes("Center body name: Moon (301)") ||
    !raw.includes("MEAN_ME") ||
    !raw.includes("NO (AIRLESS)")
  )
    throw Error("Unexpected Horizons observer frame or atmosphere metadata");
  if (!raw.includes("$$EOE")) throw Error("Incomplete Horizons table");
  const section = raw.split("$$SOE")[1]?.split("$$EOE")[0];
  if (!section) throw Error("Horizons returned no ephemeris table");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return section
    .trim()
    .split("\n")
    .map((line) => {
      const cols = line.split(",");
      const match = cols[0]
        .trim()
        .match(/^(\d{4})-([A-Za-z]{3})-(\d{2}) (\d{2}:\d{2}:\d{2})$/);
      if (!match) throw Error("Unexpected Horizons date format");
      const month = months.indexOf(match[2]);
      const azimuth = Number(cols[3]),
        elevation = Number(cols[4]);
      if (
        month < 0 ||
        !cols[3]?.trim() ||
        !cols[4]?.trim() ||
        !Number.isFinite(azimuth) ||
        !Number.isFinite(elevation) ||
        azimuth < 0 ||
        azimuth > 360 ||
        Math.abs(elevation) > 90
      )
        throw Error("Incomplete Horizons direction");
      return {
        time: `${match[1]}-${String(month + 1).padStart(2, "0")}-${match[3]}T${match[4]}.000Z`,
        azimuth,
        elevation,
      };
    });
}
export function summarize(r: Mission, samples: Sample[]) {
  const sun = windows(samples, (s) => s.sun.elevation - r.minimumSunElevation),
    earth = windows(
      samples,
      (s) => s.earth.elevation - r.minimumEarthElevation,
    );
  const overlap: Interval[] = [];
  for (const a of sun)
    for (const b of earth) {
      const start = Math.max(Date.parse(a.start), Date.parse(b.start)),
        end = Math.min(Date.parse(a.end), Date.parse(b.end));
      if (end > start)
        overlap.push({
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
          hours: (end - start) / 36e5,
        });
    }
  const metric = (xs: Interval[]) => {
    const hours = xs.reduce((a, b) => a + b.hours, 0);
    let last = Date.parse(r.startTime),
      longestBelowHours = 0;
    for (const x of xs) {
      longestBelowHours = Math.max(
        longestBelowHours,
        (Date.parse(x.start) - last) / 36e5,
      );
      last = Date.parse(x.end);
    }
    longestBelowHours = Math.max(
      longestBelowHours,
      (Date.parse(r.startTime) + r.durationHours * 36e5 - last) / 36e5,
    );
    return {
      hours,
      percent: (hours / r.durationHours) * 100,
      longestHours: Math.max(0, ...xs.map((x) => x.hours)),
      longestBelowHours,
    };
  };
  return {
    intervals: { sun, earth, overlap },
    summary: {
      sun: metric(sun),
      earth: metric(earth),
      overlap: metric(overlap),
    },
  };
}
let queue = Promise.resolve();
export function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const p = queue.then(fn);
  queue = p.then(
    () => {},
    () => {},
  );
  return p;
}
const cacheDir = "data/horizons-cache";
export async function analyzeHorizons(input: unknown) {
  const request = missionSchema.parse(input);
  const sunParams = parameters(request, "10"),
    earthParams = parameters(request, "399");
  const key = createHash("sha256")
    .update(JSON.stringify([sunParams, earthParams]))
    .digest("hex");
  const file = `${cacheDir}/${key}.json`;
  let record: {
    sun: string;
    earth: string;
    retrievedAt: string;
    signature: unknown;
  };
  let cached = false;
  try {
    record = JSON.parse(await readFile(file, "utf8"));
    cached = true;
  } catch {
    record = await serialized(async () => {
      try {
        return JSON.parse(await readFile(file, "utf8"));
      } catch {}
      const fetchOne = async (p: Record<string, string>) => {
        const url =
          "https://ssd.jpl.nasa.gov/api/horizons.api?" + new URLSearchParams(p);
        const response = await fetch(url, {
          signal: AbortSignal.timeout(45000),
        });
        if (!response.ok)
          throw Error(
            `Horizons service returned HTTP ${response.status}. Try again or open a cached example.`,
          );
        const data = await response.json();
        if (data.error || !data.result)
          throw Error(data.error || "Horizons returned no result");
        parseTable(data.result);
        return data;
      };
      const sun = await fetchOne(sunParams),
        earth = await fetchOne(earthParams);
      const result = {
        sun: sun.result,
        earth: earth.result,
        retrievedAt: new Date().toISOString(),
        signature: sun.signature,
      };
      await mkdir(cacheDir, { recursive: true });
      await writeFile(file, JSON.stringify(result, null, 2));
      return result;
    });
  }
  const sun = parseTable(record.sun),
    earth = parseTable(record.earth);
  if (
    sun.length !== earth.length ||
    sun.length !== (request.durationHours * 60) / request.stepMinutes + 1
  )
    throw Error("Incomplete ephemeris coverage");
  const samples: Sample[] = sun.map((s, i) => {
    if (
      s.time !== earth[i].time ||
      Date.parse(s.time) !==
        Date.parse(request.startTime) + i * request.stepMinutes * 60000
    )
      throw Error("Mismatched ephemeris timestamps");
    return {
      time: s.time,
      sun: { azimuth: s.azimuth, elevation: s.elevation },
      earth: { azimuth: earth[i].azimuth, elevation: earth[i].elevation },
    };
  });
  return {
    request,
    samples,
    ...summarize(request, samples),
    provenance: {
      source: "NASA/JPL Horizons",
      mode: cached ? "Cached Horizons response" : "Live Horizons response",
      retrievedAt: record.retrievedAt,
      signature: record.signature,
      frame:
        "Horizons MEAN_ME lunar geodetic coordinates; east-positive longitude",
      timeReference:
        "Horizons UT (UTC for supported dates); future leap seconds assumed by Horizons",
      terrain: "Local zenith plane; no terrain obstruction",
      coverage: `${samples[0].time} — ${samples.at(-1)!.time}`,
      stepMinutes: request.stepMinutes,
      requests: { sun: sunParams, earth: earthParams },
      rawDownload: `/api/raw/${key}`,
      limitations: [
        "Apparent airless body-center azimuth/elevation (quantity 4).",
        "Threshold crossings use linear interpolation between samples; sampling limits event precision.",
        "No terrain shadows, solar eclipse screening, slope screening, electrical power or communication link budget.",
        "Observer height is above the Horizons 1737.4 km reference sphere, not above local ground.",
        "Geometric elevation thresholds are not landing safety assessments.",
      ],
    },
  };
}
export type Result = Awaited<ReturnType<typeof analyzeHorizons>>;
