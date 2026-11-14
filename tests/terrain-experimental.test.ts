import { test } from "node:test";
import assert from "node:assert/strict";
import { sampledTerrainHorizon, terrainElevationAngle } from "../science/terrain-experimental.ts";

test("flat spherical terrain lies below the local tangent plane", () => {
  assert.ok(Math.abs(terrainElevationAngle(10, 0, 0) + (10 / 1737.4) * 90 / Math.PI) < 1e-10);
});
test("a ridge raises the sampled horizon and maximum is selected", () => {
  const result = sampledTerrainHorizon([{azimuthDeg: 90, samples: [{distanceKm: 1, elevationKm: 0}, {distanceKm: 2, elevationKm: 0.1}]}], 0);
  assert.ok(result[0].elevationDeg > 2);
  assert.equal(result[0].elevationDeg, terrainElevationAngle(2, 0.1, 0));
});
test("missing, duplicate, nonfinite and unordered terrain are rejected", () => {
  assert.throws(() => sampledTerrainHorizon([], 0));
  assert.throws(() => sampledTerrainHorizon([{azimuthDeg: 1, samples: []}], 0));
  assert.throws(() => sampledTerrainHorizon([{azimuthDeg: 1, samples: [{distanceKm: 2, elevationKm: 0}, {distanceKm: 1, elevationKm: 0}]}], 0));
  assert.throws(() => sampledTerrainHorizon([{azimuthDeg: 1, samples: [{distanceKm: 1, elevationKm: NaN}]}], 0));
  assert.throws(() => sampledTerrainHorizon([{azimuthDeg: 1, samples: [{distanceKm: 1, elevationKm: 0}]}, {azimuthDeg: 1, samples: [{distanceKm: 2, elevationKm: 0}]}], 0));
});
