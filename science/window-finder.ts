import type { Result } from "./horizons.ts";
import type { Interval } from "./intervals.ts";

/** Rank fixed-duration windows inside an already sampled, sourced ephemeris. */
export function rankMissionStarts(
  source: Pick<Result, "request" | "intervals">,
  durationHours: number,
  startStepHours: number,
) {
  if (
    !Number.isInteger(durationHours) ||
    durationHours < 1 ||
    durationHours > source.request.durationHours
  )
    throw Error("Mission duration must fit inside the source coverage");
  if (
    !Number.isInteger(startStepHours) ||
    startStepHours < 1 ||
    startStepHours > 24
  )
    throw Error("Start spacing must be 1–24 whole hours");
  const coverageStart = Date.parse(source.request.startTime);
  const searchHours = source.request.durationHours - durationHours;
  if (searchHours % startStepHours !== 0)
    throw Error("Start spacing must divide the search range");
  const clip = (intervals: Interval[], start: number, end: number) => {
    const hours = intervals.map(
      (x) =>
        Math.max(
          0,
          Math.min(end, Date.parse(x.end)) -
            Math.max(start, Date.parse(x.start)),
        ) / 36e5,
    );
    return {
      hours: hours.reduce((a, b) => a + b, 0),
      longestHours: Math.max(0, ...hours),
    };
  };
  const candidates = [];
  for (let offset = 0; offset <= searchHours; offset += startStepHours) {
    const start = coverageStart + offset * 36e5,
      end = start + durationHours * 36e5;
    const sun = clip(source.intervals.sun, start, end),
      earth = clip(source.intervals.earth, start, end);
    const overlap = clip(source.intervals.overlap, start, end);
    candidates.push({
      startTime: new Date(start).toISOString(),
      endTime: new Date(end).toISOString(),
      sunPercent: (100 * sun.hours) / durationHours,
      earthPercent: (100 * earth.hours) / durationHours,
      overlapHours: overlap.hours,
      longestOverlapHours: overlap.longestHours,
    });
  }
  return candidates.sort(
    (a, b) =>
      b.longestOverlapHours - a.longestOverlapHours ||
      b.overlapHours - a.overlapHours ||
      a.startTime.localeCompare(b.startTime),
  );
}
