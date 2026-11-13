import { searchNac } from "./surface.ts";
import { solarDisk } from "./solar-disk.ts";
import { writeFile } from "node:fs/promises";
const nac = await searchNac({
  latitude: 0.67416,
  longitude: 23.47314,
  radius: 0.5,
});
await writeFile("public/data/nac-example.json", JSON.stringify(nac));
const disk = await solarDisk({
  latitude: 0,
  longitude: 0,
  observerHeightKm: 0,
  startTime: "2026-03-03T00:00:00Z",
  durationHours: 24,
  stepMinutes: 5,
  minimumSunElevation: 0,
  minimumEarthElevation: 5,
});
await writeFile("public/data/solar-disk-example.json", JSON.stringify(disk));
console.log(
  `Archived ${nac.records.length} actual NAC records and ${disk.samples.length} actual Horizons disk samples. Original retrieval dates retained for cache hits.`,
);
