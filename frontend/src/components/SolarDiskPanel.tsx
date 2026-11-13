import { useState } from "react";
import type { Mission } from "../../../science/horizons";
import type { DiskResult } from "../../../science/solar-disk";
export default function SolarDiskPanel({ mission }: { mission: Mission }) {
  const [result, setResult] = useState<DiskResult | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [index, setIndex] = useState(0);
  async function load(example = false) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        example ? "/data/solar-disk-example.json" : "/api/solar-disk",
        example
          ? {}
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(mission),
            },
      );
      const data = await response.json();
      if (!response.ok)
        throw Error(
          data.error?.message || "Horizons disk geometry unavailable",
        );
      setResult(data);
      setIndex(0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const sample = result?.samples[index];
  const dirty =
    !!result && JSON.stringify(mission) !== JSON.stringify(result.request);
  return (
    <details className="panel solar-disk-panel">
      <summary>Solar disk & eclipse screening</summary>
      <p className="fine">
        Add Horizons angular diameters and Earth range to screen for Earth
        crossing the Sun’s apparent disk. This is a geometric approximation,
        separate from the main availability calculation.
      </p>
      <div className="surface-buttons">
        <button className="secondary" disabled={busy} onClick={() => load()}>
          {busy ? "Retrieving disk geometry…" : "Check this mission window"}
        </button>
        <button
          className="text-link"
          disabled={busy}
          onClick={() => load(true)}
        >
          Open cached disk example ↗
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {result && sample && (
        <>
          {dirty && (
            <p className="fine">
              Displayed geometry uses {result.request.latitude}°N,{" "}
              {result.request.longitude}°E, {result.request.startTime}, for{" "}
              {result.request.durationHours} hours. It differs from the current
              mission.
            </p>
          )}
          <div className="disk-values">
            <div>
              <span>MAX SAMPLED SUN OCCULTATION</span>
              <strong>
                {result.summary.maximumOccultedPercent.toFixed(2)}%
              </strong>
            </div>
            <div>
              <span>SAMPLES WITH DISK OVERLAP</span>
              <strong>
                {result.summary.sampledOccultations} / {result.samples.length}
              </strong>
            </div>
          </div>
          <label>
            Inspect disk geometry
            <input
              type="range"
              value={index}
              min={0}
              max={result.samples.length - 1}
              onChange={(e) => setIndex(+e.target.value)}
            />
          </label>
          <p className="fine">
            {sample.time.slice(0, 16).replace("T", " ")} UTC · Sun diameter{" "}
            {(sample.sunDiameterArcsec / 60).toFixed(2)} arcmin · Sun upper-limb
            elevation {sample.sunUpperLimbElevation.toFixed(3)}° · Earth range{" "}
            {sample.earthRangeKm.toFixed(0)} km · disk overlap{" "}
            {sample.occultedPercent.toFixed(2)}%
          </p>
          <ul>
            {result.provenance.limitations.map((s) => (
              <li className="fine" key={s}>
                {s}
              </li>
            ))}
          </ul>
          <p className="fine">
            {result.provenance.source} · retrieved{" "}
            {result.provenance.retrievedAt.slice(0, 19)} UTC
          </p>
          <details>
            <summary>Source request parameters</summary>
            <pre>{JSON.stringify(result.provenance.requests, null, 2)}</pre>
          </details>
        </>
      )}
    </details>
  );
}
