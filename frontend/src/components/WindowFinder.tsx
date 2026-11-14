import { useState } from "react";
import type { Mission } from "../../../science/horizons";
import type { WindowSearchResult } from "../../../science/window-search";
const utc = (s: string) =>
  new Date(s).toISOString().slice(0, 16).replace("T", " ") + " UTC";
export default function WindowFinder({
  mission,
  onApply,
}: {
  mission: Mission;
  onApply: (mission: Mission) => void;
}) {
  const [days, setDays] = useState(7),
    [spacing, setSpacing] = useState(6);
  const [result, setResult] = useState<WindowSearchResult | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function search(example = false) {
    setBusy(true);
    setError("");
    setResult(null);
    const input = example
      ? {
          mission: {
            latitude: 0,
            longitude: 0,
            observerHeightKm: 0,
            startTime: "2026-11-13T00:00:00Z",
            durationHours: 48,
            stepMinutes: 60,
            minimumSunElevation: 0,
            minimumEarthElevation: 5,
          },
          searchHours: 120,
          startStepHours: 6,
        }
      : { mission, searchHours: days * 24, startStepHours: spacing };
    try {
      const response = await fetch("/api/find-windows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error?.message || "Unable to search mission starts");
      setResult(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to search mission starts",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="panel window-finder">
      <summary>Find a mission start</summary>
      <p>
        Compare possible start times at the same location for a fixed mission
        duration. Ranked by longest continuous Sun/Earth overlap, then total
        overlap. Ties keep the earlier start.
      </p>
      <p className="fine">
        Uses the mission coordinates, height, UTC start and elevation thresholds
        above. Current duration: {mission.durationHours} hours. Search range
        plus duration must fit within 744 hours.
      </p>
      <div className="field-grid">
        <label>
          Search starts over
          <select
            value={days}
            onChange={(e) => setDays(+e.target.value)}
            disabled={busy}
          >
            <option value={1}>Next day</option>
            <option value={3}>Next 3 days</option>
            <option value={7}>Next 7 days</option>
            <option value={14}>Next 14 days</option>
          </select>
        </label>
        <label>
          Start spacing
          <select
            value={spacing}
            onChange={(e) => setSpacing(+e.target.value)}
            disabled={busy}
          >
            <option value={1}>Every hour</option>
            <option value={6}>Every 6 hours</option>
            <option value={12}>Every 12 hours</option>
            <option value={24}>Every day</option>
          </select>
        </label>
      </div>
      <div className="surface-buttons">
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={() => search()}
        >
          {busy ? "Searching Horizons…" : "Rank mission starts"}
        </button>
        <button
          type="button"
          className="text-link"
          disabled={busy}
          onClick={() => search(true)}
        >
          Try cached nearside example
        </button>
      </div>
      <p className="fine">
        The cached example uses its own 48-hour nearside mission and historical
        search dates, shown with the results below.
      </p>
      {busy && (
        <p role="status">
          Retrieving one shared hourly ephemeris. New requests may take up to
          two minutes.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {result && (
        <div className="window-search-results" aria-live="polite">
          <h3>Best sampled starts</h3>
          <p className="fine">
            {result.candidateCount} starts checked at{" "}
            {result.settings.startStepHours}-hour spacing. Mission duration:{" "}
            {result.settings.mission.durationHours} h. Location:{" "}
            {result.settings.mission.latitude}°N /{" "}
            {result.settings.mission.longitude}°E. Sun ≥{" "}
            {result.settings.mission.minimumSunElevation}°, Earth ≥{" "}
            {result.settings.mission.minimumEarthElevation}°. Search:{" "}
            {utc(result.settings.mission.startTime)} through{" "}
            {utc(
              new Date(
                Date.parse(result.settings.mission.startTime) +
                  result.settings.searchHours * 36e5,
              ).toISOString(),
            )}
            .
          </p>
          {result.candidates[0]?.longestOverlapHours === 0 && (
            <p>
              No simultaneous Sun/Earth interval was found in the sampled
              starts.
            </p>
          )}
          <ol className="window-candidates">
            {result.candidates.map((c) => (
              <li key={c.startTime}>
                <strong>{utc(c.startTime)}</strong>
                <p>
                  Continuous overlap {c.longestOverlapHours.toFixed(1)} h ·
                  Total overlap {c.overlapHours.toFixed(1)} h<br />
                  Sun {c.sunPercent.toFixed(1)}% · Earth{" "}
                  {c.earthPercent.toFixed(1)}%
                </p>
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    onApply({
                      ...result.settings.mission,
                      startTime: c.startTime,
                      stepMinutes:
                        result.settings.mission.durationHours <= 375 ? 15 : 30,
                    })
                  }
                >
                  Use this start
                </button>
              </li>
            ))}
          </ol>
          <p className="fine">
            {result.source.provenance.mode} · Retrieved{" "}
            {utc(result.source.provenance.retrievedAt)}. Hourly samples with
            linear threshold crossings. These are the best starts tested, not a
            guaranteed optimum. Short events may be missed. No terrain or
            eclipse correction. Use a start and calculate at a finer interval
            before comparing final scenarios.
          </p>
        </div>
      )}
    </details>
  );
}
