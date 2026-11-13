export type Sample = {
  time: string;
  sun: { azimuth: number; elevation: number };
  earth: { azimuth: number; elevation: number };
};
export type Interval = { start: string; end: string; hours: number };
export function windows(
  samples: Sample[],
  value: (s: Sample) => number,
): Interval[] {
  if (samples.length < 2) return [];
  const out: Interval[] = [];
  let start: number | null =
    value(samples[0]) >= 0 ? Date.parse(samples[0].time) : null;
  const append = (a: number, b: number) => {
    if (b > a)
      out.push({
        start: new Date(a).toISOString(),
        end: new Date(b).toISOString(),
        hours: (b - a) / 36e5,
      });
  };
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1],
      b = samples[i],
      va = value(a),
      vb = value(b);
    if (va >= 0 !== vb >= 0) {
      const cross =
        Date.parse(a.time) +
        ((Date.parse(b.time) - Date.parse(a.time)) * -va) / (vb - va);
      if (vb >= 0) start = cross;
      else if (start !== null) {
        append(start, cross);
        start = null;
      }
    }
  }
  if (start !== null) append(start, Date.parse(samples.at(-1)!.time));
  return out;
}
