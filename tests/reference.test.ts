import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { positions, wrap } from "../science/engine.ts";
const report = JSON.parse(readFileSync("data/validation-results.json", "utf8"));
for (const row of report.rows)
  test(`NASA SVS reference: ${row.id} ${row.body} ${row.time}`, () => {
    const actual = positions(row.latitude, row.longitude, row.time)[
      row.body as "sun" | "earth"
    ];
    assert.ok(
      Math.abs(wrap(actual.azimuth - row.reference.azimuth)) <
        report.toleranceDegrees,
    );
    assert.ok(
      Math.abs(actual.elevation - row.reference.elevation) <
        report.toleranceDegrees,
    );
  });
