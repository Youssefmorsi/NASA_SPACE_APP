import { z } from "zod";

const mission = z.object({
  latitude: z.number().min(-89.999).max(89.999), longitude: z.number().min(-180).max(180),
  observerHeightKm: z.number().min(0).max(10),
  startTime: z.string().datetime().refine(s => Date.parse(s) >= Date.UTC(2000, 0, 1) && Date.parse(s) < Date.UTC(2100, 0, 1) && Date.parse(s) % 60000 === 0),
  durationHours: z.number().int().min(1).max(744), stepMinutes: z.number().int().min(5).max(360),
  minimumSunElevation: z.number().min(0).max(30), minimumEarthElevation: z.number().min(0).max(30),
}).refine(m => m.durationHours * 60 % m.stepMinutes === 0 && m.durationHours * 60 / m.stepMinutes <= 1500);
const needs = z.object({ sun: z.number().min(0).max(100), earth: z.number().min(0).max(100), darkness: z.number().min(0).max(744), overlap: z.number().min(0).max(744) });
export const linkSchema = z.object({ v: z.literal(1), name: z.string().max(80), mission, needs });
export function readScenarioLink(search: string) {
  const raw = new URLSearchParams(search).get("scenario");
  if (!raw) return null;
  try { return linkSchema.safeParse(JSON.parse(raw)); } catch { return { success: false as const }; }
}
