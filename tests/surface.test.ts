import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  searchBounds,
  cleanFootprints,
  footprintQuery,
} from "../science/surface.ts";
import {
  angularSeparation,
  occultedFraction,
  parseDiskTable,
} from "../science/solar-disk.ts";
import { catalog } from "../data/catalog.ts";
test("search boxes wrap across antimeridian and clip polar latitudes", () => {
  assert.deepEqual(searchBounds(89.9, 179.8, 0.5), [
    [179.3, 89.4, 180, 90],
    [-180, 89.4, -179.7, 90],
  ]);
  assert.equal(searchBounds(0, 0, 0.5).length, 1);
  assert.equal(
    footprintQuery.safeParse({ latitude: 0, longitude: 0, radius: 90 }).success,
    false,
  );
});
test("NAC product URLs and finite polygons are required", () => {
  const record = JSON.parse(
    readFileSync("public/data/quickmap-observation.json", "utf8"),
  );
  const clean = cleanFootprints(record);
  assert.equal(clean[0].id, "M1463278603LC");
  record.features[0].properties.url = "https://example.org/fake";
  assert.throws(() => cleanFootprints(record));
});
test("historical sites have a traceable LROC source and normalized longitudes", () => {
  const sites = catalog.filter((s) => s.kind === "historical");
  assert.equal(sites.length, 6);
  assert.ok(
    sites.every(
      (s) =>
        s.source === "https://lroc.im-ldi.com/images/938" &&
        Math.abs(s.longitude) <= 180,
    ),
  );
  assert.equal(sites.find((s) => s.id === "apollo11")!.latitude, 0.67416);
});
test("disk overlap handles disjoint, total, annular, tangent and partial geometry", () => {
  assert.equal(occultedFraction(1, 2, 4), 0);
  assert.equal(occultedFraction(1, 2, 0), 1);
  assert.equal(occultedFraction(2, 1, 0), 0.25);
  assert.equal(occultedFraction(1, 1, 2), 0);
  assert.ok(Math.abs(occultedFraction(1, 1, 1) - 0.3910022189) < 1e-9);
  assert.throws(() => occultedFraction(0, 1, 0));
});
test("apparent separation is stable at horizon, azimuth wrap and poles", () => {
  assert.ok(
    Math.abs(
      angularSeparation(
        { azimuth: 359, elevation: 0 },
        { azimuth: 1, elevation: 0 },
      ) - 2,
    ) < 1e-10,
  );
  assert.ok(
    angularSeparation(
      { azimuth: 0, elevation: 90 },
      { azimuth: 180, elevation: 90 },
    ) < 1e-6,
  );
  assert.ok(
    Math.abs(
      angularSeparation(
        { azimuth: 0, elevation: 0 },
        { azimuth: 180, elevation: 0 },
      ) - 180,
    ) < 1e-9,
  );
});
test("real Horizons disk table retains sizes, distances, time grid and rejects wrong units", () => {
  const raw = JSON.parse(
    readFileSync("tests/fixtures/solar-disk-raw.json", "utf8"),
  );
  const sun = parseDiskTable(raw.sun),
    earth = parseDiskTable(raw.earth);
  assert.equal(sun.length, 169);
  assert.equal(sun[0].time, earth[0].time);
  assert.ok(sun[0].rangeKm > 140e6 && sun[0].rangeKm < 160e6);
  assert.ok(earth[0].rangeKm > 300000 && earth[0].rangeKm < 450000);
  assert.throws(() =>
    parseDiskTable(raw.sun.replace("Units: KM and KM/S", "Units: AU and KM/S")),
  );
});
