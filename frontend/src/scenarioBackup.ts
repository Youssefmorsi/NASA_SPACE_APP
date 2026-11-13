import { z } from "zod";
import { linkSchema } from "./scenarioLink";
import type { Saved } from "./model";

const date = z.string().datetime();
const direction = z.object({ azimuth: z.number().min(0).max(360), elevation: z.number().min(-90).max(90) });
const sample = z.object({ time: date, sun: direction, earth: direction });
const interval = z.object({ start: date, end: date, hours: z.number().nonnegative() });
const metric = z.object({ hours: z.number().nonnegative(), percent: z.number().min(0).max(100), longestHours: z.number().nonnegative(), longestBelowHours: z.number().nonnegative() });
const body = z.object({ sun: z.array(interval), earth: z.array(interval), overlap: z.array(interval) });
const metrics = z.object({ sun: metric, earth: metric, overlap: metric });
const provenance = z.object({
  source: z.literal("NASA/JPL Horizons"), mode: z.string(), retrievedAt: date,
  frame: z.string(), timeReference: z.string(), terrain: z.string(), coverage: z.string(),
  stepMinutes: z.number(), requests: z.object({ sun: z.record(z.string(), z.string()), earth: z.record(z.string(), z.string()) }),
  rawDownload: z.string().regex(/^\/api\/raw\/[a-f0-9]{64}$/), limitations: z.array(z.string()),
}).passthrough();
const scenario = z.object({
  id: z.string().min(1).max(128), name: z.string().max(80), needs: linkSchema.shape.needs,
  result: z.object({ request: linkSchema.shape.mission, samples: z.array(sample).min(2).max(1501), intervals: body, summary: metrics, provenance }).passthrough(),
}).refine(({ result }) => {
  const start = Date.parse(result.request.startTime), step = result.request.stepMinutes * 60000;
  const count = result.request.durationHours * 60 / result.request.stepMinutes + 1;
  return result.samples.length === count && result.samples.every((s, i) => Date.parse(s.time) === start + i * step) &&
    Object.values(result.intervals).every(windows => windows.every(w => Date.parse(w.start) >= start && Date.parse(w.end) <= start + result.request.durationHours * 3600000 && Date.parse(w.end) >= Date.parse(w.start)));
});
const backup = z.object({ format: z.literal("lunarsight-scenarios"), version: z.literal(1), scenarios: z.array(scenario).min(1).max(8) });
export function serializeBackup(scenarios: Saved[]) { return JSON.stringify({ format: "lunarsight-scenarios", version: 1, scenarios }, null, 2); }
export function parseBackup(text: string): Saved[] {
  const parsed = backup.safeParse(JSON.parse(text));
  if (!parsed.success) throw Error("This is not a valid LunarSight scenario backup.");
  return parsed.data.scenarios.map(s => ({ ...s, result: { ...s.result, provenance: { ...s.result.provenance, mode: "Imported backup (unverified)" } } })) as Saved[];
}
