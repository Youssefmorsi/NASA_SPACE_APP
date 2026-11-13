import { useEffect, useState } from "react";
import type { Footprint } from "../../../science/surface";
import layers from "../../../data/surface-layers.json";
type NacResult = {
  records: Footprint[];
  retrievedAt: string;
  requests: string[];
  cached?: boolean;
};
export default function SurfaceExplorer({
  latitude,
  longitude,
  onSelect,
  onFootprints,
}: {
  latitude: number;
  longitude: number;
  onSelect: (lat: number, lon: number) => void;
  onFootprints: (rings: { ring: number[][] }[]) => void;
}) {
  const [layer, setLayer] = useState("wac"),
    [zoom, setZoom] = useState(5),
    [opened, setOpened] = useState(false),
    [records, setRecords] = useState<NacResult | null>(null),
    [selected, setSelected] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [failed, setFailed] = useState(0),
    [radius, setRadius] = useState(0.5);
  const current = layers.find((l) => l.id === layer)!;
  const z = Math.min(zoom, current.maxZoom),
    width = 2 ** (z + 1),
    height = 2 ** z,
    step = 360 / width;
  const centerX = Math.min(
      width - 1,
      Math.max(0, Math.floor((longitude + 180) / step)),
    ),
    centerY = Math.min(
      height - 1,
      Math.max(0, Math.floor((90 - latitude) / step)),
    );
  const rowStart = Math.max(0, Math.min(height - 3, centerY - 1));
  const colStart = centerX - 1;
  const minLon = -180 + colStart * step,
    maxLat = 90 - rowStart * step;
  const left = ((longitude - minLon) / (3 * step)) * 100,
    top = ((maxLat - latitude) / (3 * step)) * 100;
  const covered = latitude >= current.bbox[1] && latitude <= current.bbox[3];
  useEffect(() => {
    setFailed(0);
  }, [layer, z, centerX, centerY]);
  async function find() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        "/api/nac?" +
          new URLSearchParams({
            latitude: String(latitude),
            longitude: String(longitude),
            radius: String(radius),
          }),
      );
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error?.message || "QuickMap search unavailable");
      setRecords(data);
      setSelected("");
      onFootprints(data.records);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function example() {
    setError("");
    try {
      const response = await fetch("/data/nac-example.json");
      if (!response.ok) throw Error("Archived footprint example unavailable");
      const data = await response.json();
      setRecords(data);
      setSelected("");
      onFootprints(data.records);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="surface-workspace">
      <div className="section-head">
        <div>
          <span className="kicker">SURFACE EVIDENCE</span>
          <h2>Look closer at your location.</h2>
        </div>
        <span className="fine">Moon Trek layers · QuickMap observations</span>
      </div>
      <div className="surface-columns">
        <details
          className="panel"
          onToggle={(e) => setOpened(e.currentTarget.open)}
        >
          <summary>Local imagery, hillshade & polar layers</summary>
          <div className="surface-controls">
            <label>
              Map layer
              <select value={layer} onChange={(e) => setLayer(e.target.value)}>
                {layers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Detail level
              <select
                value={Math.min(zoom, current.maxZoom)}
                onChange={(e) => setZoom(+e.target.value)}
              >
                {Array.from(
                  { length: current.maxZoom - 2 },
                  (_, i) => i + 3,
                ).map((n) => (
                  <option key={n} value={n}>
                    {n} · {(360 / 2 ** (n + 1)).toFixed(2)}° per tile
                  </option>
                ))}
              </select>
            </label>
          </div>
          {opened &&
            (covered ? (
              <div
                className="surface-map"
                key={`${layer}-${z}-${centerX}-${centerY}`}
                role="img"
                aria-label="Moon Trek regional map with selected coordinate"
              >
                <div className="tile-grid">
                  {Array.from({ length: 9 }, (_, i) => {
                    const y = rowStart + Math.floor(i / 3),
                      x = (((colStart + (i % 3)) % width) + width) % width;
                    return (
                      <div className="tile-cell" key={i}>
                        <img
                          src={`/api/tile/${layer}/${z}/${y}/${x}`}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.style.visibility = "hidden";
                            setFailed((n) => n + 1);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <span
                  className="map-crosshair"
                  style={{ left: left + "%", top: top + "%" }}
                >
                  +
                </span>
                <span className="map-north">N ↑</span>
              </div>
            ) : (
              <div className="map-unavailable">
                This layer has no coverage at the selected latitude. Choose a
                southern polar location or another layer.
              </div>
            ))}
          {failed > 0 && (
            <p role="status" className="fine">
              {failed} tile(s) unavailable or outside coverage. Blank areas do
              not indicate safe terrain or absence of shadow.
            </p>
          )}
          <p className="fine">
            Equirectangular display · longitude/latitude degrees · strongly
            distorted near the poles. The cross marks your selected point. Tiles
            load on demand from NASA Moon Trek.
          </p>
          <details className="layer-method">
            <summary>Layer meaning & source</summary>
            <p>{current.description}</p>
            <p className="fine">
              {layer === "psr"
                ? "Published permanent-shadow context, not sunlight for your selected mission dates. Zero and NoData are not separated by this display."
                : layer === "slope"
                  ? "Colourized slope context only. No numeric slope percentages are calculated from image colours. Source metadata describes varying slope baselines; do not use this display for landing clearance."
                  : layer === "hillshade"
                    ? "Synthetic hillshade, not illumination at your chosen time."
                    : "Image mosaic, not a live view of the mission date."}
            </p>
            <a
              className="text-link"
              href={current.source}
              target="_blank"
              rel="noreferrer"
            >
              Original layer capabilities ↗
            </a>
            <p>
              <a
                className="text-link"
                href="https://trek.nasa.gov/moon/"
                target="_blank"
                rel="noreferrer"
              >
                Open Moon Trek for original map legends ↗
              </a>
            </p>
          </details>
        </details>
        <details className="panel">
          <summary>Find LROC NAC image footprints</summary>
          <p className="fine">
            Search observations intersecting a box around your current
            coordinates. Footprints show image coverage, not landing zones.
          </p>
          <label>
            Search half-width (degrees)
            <select value={radius} onChange={(e) => setRadius(+e.target.value)}>
              {[0.1, 0.5, 1, 2].map((n) => (
                <option key={n} value={n}>
                  ±{n}° latitude / longitude
                </option>
              ))}
            </select>
          </label>
          <div className="surface-buttons">
            <button
              className="primary"
              disabled={
                busy ||
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
              }
              onClick={find}
            >
              {busy ? "Searching QuickMap…" : "Find nearby observations"}
            </button>
            <button className="secondary" onClick={example}>
              Load archived example
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
          {records && (
            <>
              <p className="fine">
                {records.records.length} returned observations ·{" "}
                {records.retrievedAt.slice(0, 10)} · results are limited to 12
                per search box, not a complete image inventory.
              </p>
              <div className="observation-list">
                {records.records.map((r) => (
                  <article
                    key={r.id}
                    className={
                      selected === r.id ? "observation selected" : "observation"
                    }
                  >
                    <button
                      className="text-link"
                      onClick={() => {
                        setSelected(r.id);
                        onFootprints([r]);
                        onSelect(r.latitude, r.longitude);
                      }}
                    >
                      {r.id} · Focus image centre ↗
                    </button>
                    <p className="fine">
                      Acquired {r.acquired.replace(" ", "T").slice(0, 19)} UTC
                      <br />
                      {r.latitude.toFixed(4)}°N / {r.longitude.toFixed(4)}°E
                    </p>
                    <a
                      className="text-link"
                      href={r.source}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Inspect original LROC product ↗
                    </a>
                  </article>
                ))}
              </div>
              {records.records.length === 0 && (
                <p>No observations were returned for this box.</p>
              )}
              <details>
                <summary>Exact source queries</summary>
                {records.requests.map((u) => (
                  <p className="fine" key={u}>
                    <a href={u} target="_blank" rel="noreferrer">
                      {u}
                    </a>
                  </p>
                ))}
              </details>
            </>
          )}
        </details>
      </div>
    </section>
  );
}
