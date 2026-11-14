/** Experimental geometry only. Inputs are synthetic until a terrain provider is validated. */
export type TerrainSample = { distanceKm: number; elevationKm: number };
export type TerrainRay = { azimuthDeg: number; samples: TerrainSample[] };
export type HorizonPoint = { azimuthDeg: number; elevationDeg: number };

/** Elevation angle of a radial terrain sample above the observer's tangent plane.
 * distanceKm is surface arc distance on the stated reference sphere. Both heights
 * must be radial elevations above that same sphere, in the same coordinate frame.
 */
export function terrainElevationAngle(distanceKm: number, elevationKm: number, observerElevationKm: number, radiusKm = 1737.4): number {
  if (![distanceKm, elevationKm, observerElevationKm, radiusKm].every(Number.isFinite) || radiusKm <= 0 || distanceKm <= 0 || distanceKm >= Math.PI * radiusKm || radiusKm + elevationKm <= 0 || radiusKm + observerElevationKm <= 0) throw new Error("Invalid terrain geometry");
  const angle = distanceKm / radiusKm;
  const horizontal = (radiusKm + elevationKm) * Math.sin(angle);
  const vertical = (elevationKm - observerElevationKm) - 2 * (radiusKm + elevationKm) * Math.sin(angle / 2) ** 2;
  return Math.atan2(vertical, horizontal) * 180 / Math.PI;
}

/** Calculate the maximum sampled elevation on each ray. This is not evidence
 * of completeness: missing nearby terrain, distant terrain, and features between
 * rays or samples can make the real horizon higher than this sampled skyline. */
export function sampledTerrainHorizon(rays: TerrainRay[], observerElevationKm: number, radiusKm = 1737.4): HorizonPoint[] {
  if (!Number.isFinite(observerElevationKm) || !Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm + observerElevationKm <= 0 || !rays.length) throw new Error("Invalid observer or empty terrain");
  const seen = new Set<number>();
  return rays.map(({ azimuthDeg, samples }) => {
    if (!Number.isFinite(azimuthDeg) || azimuthDeg < 0 || azimuthDeg >= 360 || seen.has(azimuthDeg) || !samples.length) throw new Error("Invalid or duplicate terrain ray");
    seen.add(azimuthDeg);
    let previous = 0;
    let maximum = -Infinity;
    for (const sample of samples) {
      if (sample.distanceKm <= previous) throw new Error("Terrain distances must be strictly increasing");
      previous = sample.distanceKm;
      maximum = Math.max(maximum, terrainElevationAngle(sample.distanceKm, sample.elevationKm, observerElevationKm, radiusKm));
    }
    return { azimuthDeg, elevationDeg: maximum };
  }).sort((a, b) => a.azimuthDeg - b.azimuthDeg);
}
