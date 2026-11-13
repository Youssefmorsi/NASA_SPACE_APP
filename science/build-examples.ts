import { analyzeHorizons } from "./horizons.ts";
import { writeFile, mkdir } from "node:fs/promises";
const common = {
  observerHeightKm: 0,
  startTime: "2026-11-13T00:00:00Z",
  durationHours: 168,
  stepMinutes: 60,
  minimumSunElevation: 0,
  minimumEarthElevation: 5,
};
const examples = [];
for (const site of [
  { name: "South polar reference", latitude: -89, longitude: 0 },
  { name: "Southern reference · 45°E", latitude: -85, longitude: 45 },
  { name: "Nearside reference", latitude: 0, longitude: 0 },
]) {
  console.log("Fetching " + site.name);
  const result = await analyzeHorizons({
    ...common,
    latitude: site.latitude,
    longitude: site.longitude,
  });
  examples.push({ id: crypto.randomUUID(), name: site.name, result });
}
await mkdir("public/data", { recursive: true });
await writeFile("public/data/examples.json", JSON.stringify(examples));
console.log("Saved three genuine Horizons examples");
