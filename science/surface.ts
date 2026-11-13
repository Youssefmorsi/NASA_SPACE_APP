import { z } from "zod";
export const footprintQuery = z.object({
  latitude: z.coerce.number().finite().min(-89.999).max(89.999),
  longitude: z.coerce.number().finite().min(-180).max(180),
  radius: z.coerce.number().min(0.05).max(2).default(0.5),
});
export type Footprint = {
  id: string;
  latitude: number;
  longitude: number;
  acquired: string;
  source: string;
  ring: number[][];
};
export function cleanFootprints(raw: unknown): Footprint[] {
  const collection = z
    .object({
      type: z.literal("FeatureCollection"),
      features: z
        .array(
          z.object({
            geometry: z.object({
              type: z.literal("Polygon"),
              coordinates: z.array(
                z.array(z.tuple([z.number().finite(), z.number().finite()])),
              ),
            }),
            properties: z.object({
              product_id: z.string().regex(/^M[0-9]+[LR]C$/),
              center_latitude: z.number().finite().min(-90).max(90),
              center_longitude: z.number().finite().min(-360).max(360),
              start_time: z.string(),
              url: z.string().url(),
            }),
          }),
        )
        .max(50),
    })
    .parse(raw);
  return collection.features.map((f) => {
    if (!f.properties.url.startsWith("https://data.lroc.im-ldi.com/lroc/"))
      throw Error("Unexpected LROC product URL");
    const ring = f.geometry.coordinates[0];
    if (
      !ring ||
      ring.length < 4 ||
      ring.length > 500 ||
      ring.some(([x, y]) => Math.abs(x) > 360 || Math.abs(y) > 90)
    )
      throw Error("Invalid footprint polygon");
    return {
      id: f.properties.product_id,
      latitude: f.properties.center_latitude,
      longitude: Number(
        (
          ((((f.properties.center_longitude + 180) % 360) + 360) % 360) -
          180
        ).toFixed(10),
      ),
      acquired: f.properties.start_time,
      source: f.properties.url,
      ring: ring.map(([x, y]) => [((((x + 180) % 360) + 360) % 360) - 180, y]),
    };
  });
}
export function searchBounds(
  lat: number,
  lon: number,
  radius: number,
): number[][] {
  const s = Math.max(-90, lat - radius),
    n = Math.min(90, lat + radius),
    w = lon - radius,
    e = lon + radius;
  if (w < -180)
    return [
      [w + 360, s, 180, n],
      [-180, s, e, n],
    ];
  if (e > 180)
    return [
      [w, s, 180, n],
      [-180, s, e - 360, n],
    ];
  return [[w, s, e, n]];
}
const cache = new Map<
  string,
  { retrievedAt: string; records: Footprint[]; requests: string[] }
>();
export async function searchNac(input: unknown) {
  const q = footprintQuery.parse(input),
    key = JSON.stringify(q);
  const previous = cache.get(key);
  if (previous) return { ...previous, cached: true };
  const requests = searchBounds(q.latitude, q.longitude, q.radius).map(
    (box) =>
      "https://features-api.quickmap.io/collections/nac.geojson?" +
      new URLSearchParams({ limit: "12", bbox: box.join(",") }),
  );
  const records: Footprint[] = [];
  for (const url of requests) {
    const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
    if (!response.ok)
      throw Error(`QuickMap image search returned HTTP ${response.status}`);
    records.push(...cleanFootprints(await response.json()));
  }
  const result = {
    retrievedAt: new Date().toISOString(),
    records: [...new Map(records.map((r) => [r.id, r])).values()].slice(0, 24),
    requests,
  };
  if (cache.size >= 32) cache.delete(cache.keys().next().value!);
  cache.set(key, result);
  return { ...result, cached: false };
}
