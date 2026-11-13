import {
  missionSchema,
  parameters,
  parseTable,
  serialized,
} from "./horizons.ts";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
export function angularSeparation(
  a: { azimuth: number; elevation: number },
  b: { azimuth: number; elevation: number },
) {
  const rad = Math.PI / 180;
  const cos =
    Math.sin(a.elevation * rad) * Math.sin(b.elevation * rad) +
    Math.cos(a.elevation * rad) *
      Math.cos(b.elevation * rad) *
      Math.cos((a.azimuth - b.azimuth) * rad);
  return Math.acos(Math.max(-1, Math.min(1, cos))) / rad;
}
// Flat apparent-disk intersection; explicitly a screening approximation.
export function occultedFraction(
  sunRadius: number,
  earthRadius: number,
  d: number,
) {
  if (!(sunRadius > 0 && earthRadius > 0 && d >= 0))
    throw Error("Invalid apparent disks");
  if (d >= sunRadius + earthRadius) return 0;
  if (d <= Math.abs(earthRadius - sunRadius))
    return Math.min(1, (earthRadius * earthRadius) / (sunRadius * sunRadius));
  const acos = (x: number) => Math.acos(Math.max(-1, Math.min(1, x)));
  const area =
    sunRadius ** 2 *
      acos((d * d + sunRadius ** 2 - earthRadius ** 2) / (2 * d * sunRadius)) +
    earthRadius ** 2 *
      acos(
        (d * d + earthRadius ** 2 - sunRadius ** 2) / (2 * d * earthRadius),
      ) -
    0.5 *
      Math.sqrt(
        Math.max(
          0,
          (-d + sunRadius + earthRadius) *
            (d + sunRadius - earthRadius) *
            (d - sunRadius + earthRadius) *
            (d + sunRadius + earthRadius),
        ),
      );
  return Math.max(0, Math.min(1, area / (Math.PI * sunRadius ** 2)));
}
export function parseDiskTable(raw: string) {
  const positions = parseTable(raw);
  if (
    !raw.includes("Ang-diam") ||
    !raw.includes("delta") ||
    !raw.includes("Units: KM and KM/S")
  )
    throw Error("Missing angular diameter or kilometre range metadata");
  const rows = raw.split("$$SOE")[1].split("$$EOE")[0].trim().split("\n");
  return positions.map((s, i) => {
    const c = rows[i].split(",");
    const diameterArcsec = Number(c[5]),
      rangeKm = Number(c[6]);
    if (
      !c[5]?.trim() ||
      !c[6]?.trim() ||
      !Number.isFinite(diameterArcsec) ||
      !Number.isFinite(rangeKm) ||
      diameterArcsec <= 0 ||
      rangeKm <= 0
    )
      throw Error("Invalid apparent size or range");
    return { ...s, diameterArcsec, rangeKm };
  });
}
export async function solarDisk(input: unknown) {
  const request = missionSchema.parse(input);
  const requests = {
    sun: {
      ...parameters(request, "10"),
      QUANTITIES: "'4,13,20'",
      RANGE_UNITS: "'KM'",
    },
    earth: {
      ...parameters(request, "399"),
      QUANTITIES: "'4,13,20'",
      RANGE_UNITS: "'KM'",
    },
  };
  const key = createHash("sha256")
    .update(JSON.stringify(requests))
    .digest("hex");
  const file = `data/geometry-cache/${key}.json`;
  let record: { sun: string; earth: string; retrievedAt: string };
  let cached = true;
  try {
    record = JSON.parse(await readFile(file, "utf8"));
  } catch {
    cached = false;
    record = await serialized(async () => {
      const results: string[] = [];
      for (const p of [requests.sun, requests.earth]) {
        const response = await fetch(
          "https://ssd.jpl.nasa.gov/api/horizons.api?" + new URLSearchParams(p),
          { signal: AbortSignal.timeout(45000) },
        );
        if (!response.ok)
          throw Error(`Horizons returned HTTP ${response.status}`);
        const d = await response.json();
        if (d.error || !d.result)
          throw Error(d.error || "No Horizons geometry");
        parseDiskTable(d.result);
        results.push(d.result);
      }
      const r = {
        sun: results[0],
        earth: results[1],
        retrievedAt: new Date().toISOString(),
      };
      await mkdir("data/geometry-cache", { recursive: true });
      await writeFile(file, JSON.stringify(r));
      return r;
    });
  }
  const sun = parseDiskTable(record.sun),
    earth = parseDiskTable(record.earth);
  if (
    sun.length !== earth.length ||
    sun.length !== (request.durationHours * 60) / request.stepMinutes + 1
  )
    throw Error("Incomplete disk-geometry coverage");
  const samples = sun.map((s, i) => {
    const e = earth[i];
    if (
      s.time !== e.time ||
      Date.parse(s.time) !==
        Date.parse(request.startTime) + i * request.stepMinutes * 60000
    )
      throw Error("Mismatched geometry timestamps");
    const separationDeg = angularSeparation(s, e);
    const occultation =
      e.rangeKm < s.rangeKm
        ? occultedFraction(
            s.diameterArcsec / 7200,
            e.diameterArcsec / 7200,
            separationDeg,
          )
        : 0;
    return {
      time: s.time,
      sunDiameterArcsec: s.diameterArcsec,
      earthDiameterArcsec: e.diameterArcsec,
      sunUpperLimbElevation: s.elevation + s.diameterArcsec / 7200,
      earthRangeKm: e.rangeKm,
      separationDeg,
      occultedPercent: occultation * 100,
    };
  });
  return {
    request,
    samples,
    summary: {
      sampledOccultations: samples.filter((s) => s.occultedPercent > 0.001)
        .length,
      maximumOccultedPercent: Math.max(
        ...samples.map((s) => s.occultedPercent),
      ),
    },
    provenance: {
      source: "NASA/JPL Horizons quantities 4, 13, 20",
      retrievedAt: record.retrievedAt,
      cached,
      requests,
      limitations: [
        "Apparent circular-disk intersection is an approximation; Earth atmosphere and solar limb darkening are excluded.",
        "Sampling may miss an eclipse between timestamps. No eclipse contact times are asserted.",
        "Sun upper-limb elevation is relative to the local zenith plane, not terrain.",
        "These values do not estimate electrical power or radio link performance.",
        "This optional screening does not modify the existing elevation-threshold availability.",
      ],
    },
  };
}
export type DiskResult = Awaited<ReturnType<typeof solarDisk>>;
