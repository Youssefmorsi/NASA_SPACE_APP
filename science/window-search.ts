import { z } from "zod";
import { analyzeHorizons, missionSchema } from "./horizons.ts";
import { rankMissionStarts } from "./window-finder.ts";
export const windowSearchSchema = z
  .object({
    mission: missionSchema,
    searchHours: z.number().int().min(24).max(336),
    startStepHours: z
      .union([z.literal(1), z.literal(6), z.literal(12), z.literal(24)])
      .default(6),
  })
  .refine(
    (x) => x.searchHours % x.startStepHours === 0,
    "Start spacing must divide the search range",
  )
  .refine(
    (x) => x.mission.durationHours + x.searchHours <= 744,
    "Search range plus mission duration must be at most 744 hours",
  );
export async function findMissionWindows(input: unknown) {
  const settings = windowSearchSchema.parse(input);
  // One broad Sun/Earth request reuses the existing verified adapter and cache.
  const source = await analyzeHorizons({
    ...settings.mission,
    durationHours: settings.mission.durationHours + settings.searchHours,
    stepMinutes: 60,
  });
  const ranked = rankMissionStarts(
    source,
    settings.mission.durationHours,
    settings.startStepHours,
  );
  return {
    settings,
    candidateCount: ranked.length,
    candidates: ranked.slice(0, 5),
    source: { request: source.request, provenance: source.provenance },
  };
}
export type WindowSearchResult = Awaited<ReturnType<typeof findMissionWindows>>;
