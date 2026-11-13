import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Download,
  Trash2,
  Check,
  Info,
  ChevronLeft,
  ChevronRight,
  Sun,
  Globe2,
  LocateFixed,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { Mission, Result } from "../../science/horizons";
import { catalog } from "../../data/catalog";
import {
  checks,
  csv,
  defaultNeeds,
  explanation,
  validSaved,
  type Saved,
  type Needs,
} from "./model";
import SpaceBackdrop from "./components/SpaceBackdrop";
import { SkyView } from "./components/SkyView";
import { PolarMap } from "./components/PolarMap";
import { ComparisonTracks } from "./components/ComparisonTracks";
import { linkSchema, readScenarioLink } from "./scenarioLink";
import "./style.css";
const MoonGlobe = lazy(() => import("./components/MoonGlobe"));
const initial: Mission = {
  latitude: -89,
  longitude: 0,
  observerHeightKm: 0,
  startTime: "2026-11-13T00:00:00Z",
  durationHours: 168,
  stepMinutes: 60,
  minimumSunElevation: 0,
  minimumEarthElevation: 5,
};
const f = (n: number) => n.toFixed(1);
const timestamp = (s: string) =>
  new Date(s).toISOString().slice(0, 16).replace("T", " ") + " UTC";
const coord = (n: number, pos: string, neg: string) =>
  `${Math.abs(n).toFixed(3)}°${n < 0 ? neg : pos}`;
const download = (content: string, name: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
function readSaved(): Saved[] {
  try {
    const data = JSON.parse(
      localStorage.getItem("lunarsight-horizons-v3") || "[]",
    );
    return Array.isArray(data) ? data.filter(validSaved).slice(0, 8) : [];
  } catch {
    return [];
  }
}
export default function App() {
  const [page, setPage] = useState("Explore"),
    [form, setForm] = useState(initial),
    [needs, setNeeds] = useState<Needs>(defaultNeeds),
    [result, setResult] = useState<Result | null>(null),
    [resultNeeds, setResultNeeds] = useState(defaultNeeds),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState<Saved[]>(readSaved),
    [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [slipHours, setSlipHours] = useState(24),
    [shareUrl, setShareUrl] = useState(""),
    [expertMode, setExpertMode] = useState(false),
    [name, setName] = useState("South polar reference"),
    [selectedId, setSelectedId] = useState("south"),
    [search, setSearch] = useState(""),
    [notice, setNotice] = useState(""),
    [choice, setChoice] = useState<string[]>([]),
    [align, setAlign] = useState<"utc" | "elapsed">("utc");
  useEffect(() => {
    try {
      localStorage.setItem("lunarsight-horizons-v3", JSON.stringify(saved));
    } catch {
      setNotice(
        "Browser storage is full or unavailable. Export your scenarios before closing.",
      );
    }
  }, [saved]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setPlaying(false);
  }, [page]);
  useEffect(() => {
    const linked = readScenarioLink(window.location.search);
    if (!linked) return;
    if (!linked.success) { setError("The shared scenario link is invalid or unsupported."); return; }
    setForm(linked.data.mission);
    setNeeds(linked.data.needs);
    setName(linked.data.name || "Shared location");
    setSelectedId("custom");
    setPage("Analyze");
    setNotice("Shared inputs loaded. Calculate conditions to retrieve or reuse matching Horizons data.");
  }, []);
  useEffect(() => {
    if (!playing || !result) return;
    const timer = window.setInterval(() => {
      setIndex((current) => Math.min(current + 1, result.samples.length - 1));
    }, 500);
    return () => window.clearInterval(timer);
  }, [playing, result]);
  useEffect(() => {
    if (playing && result && index >= result.samples.length - 1) setPlaying(false);
  }, [index, playing, result]);
  const change = (key: keyof Mission, value: number | string) =>
    setForm((r) => ({ ...r, [key]: value }));
  const select = (
    lat: number,
    lon: number,
    id = "custom",
    label = "Custom location",
  ) => {
    setForm((r) => ({ ...r, latitude: lat, longitude: lon }));
    setSelectedId(id);
    setName(label);
  };
  const dirty =
    !!result && JSON.stringify(form) !== JSON.stringify(result.request);
  const validNeeds = () =>
    Object.values(needs).every(Number.isFinite) &&
    needs.sun >= 0 &&
    needs.sun <= 100 &&
    needs.earth >= 0 &&
    needs.earth <= 100 &&
    needs.darkness >= 0 &&
    needs.darkness <= 744 &&
    needs.overlap >= 0 &&
    needs.overlap <= 744;
  async function run() {
    if (!validNeeds()) {
      setError(
        "Enter valid mission requirements: percentages 0–100 and hours 0–744.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error?.message || "Horizons request failed");
      setResult(data);
      setResultNeeds({ ...needs });
      setIndex(0);
      setPlaying(false);
      setPage("Analyze");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function save() {
    if (!result || dirty) return;
    if (saved.length >= 8) {
      setError("Eight scenarios saved. Remove a scenario to save another.");
      return;
    }
    const scenario = {
      id: crypto.randomUUID(),
      name: name.trim() || "Untitled location",
      result,
      needs: { ...resultNeeds },
    };
    setSaved((xs) => [...xs, scenario]);
    setNotice("Scenario saved. Open Compare to review it.");
    setChoice((xs) => (xs.length < 2 ? [...xs, scenario.id] : xs));
  }
  async function examples() {
    setError("");
    try {
      const response = await fetch("/data/examples.json");
      if (!response.ok) throw Error("Cached examples unavailable");
      const data = await response.json();
      const incoming = data
        .map((s: Saved) => ({
          ...s,
          needs: defaultNeeds,
          result: {
            ...s.result,
            provenance: {
              ...s.result.provenance,
              mode: "Cached Horizons example",
            },
          },
        }))
        .filter(validSaved);
      if (!incoming.length) throw Error("No verified examples available");
      const extra = incoming.filter(
        (s: Saved) =>
          !saved.some(
            (x) =>
              x.name === s.name &&
              JSON.stringify(x.result.request) ===
                JSON.stringify(s.result.request),
          ),
      );
      if (saved.length + extra.length > 8)
        throw Error(
          "Make room for the three cached examples before loading them.",
        );
      const all = [...saved, ...extra];
      setSaved(all);
      setChoice(
        all
          .slice(-incoming.length)
          .slice(0, 2)
          .map((s: Saved) => s.id),
      );
      setPage("Compare");
      setNotice(
        "Genuine cached Horizons outputs · 13–20 November 2026 · 60-minute samples.",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const selected = catalog.find((s) => s.id === selectedId);
  const sample = result?.samples[index];
  const active = saved.filter((s) => choice.includes(s.id)).slice(0, 2);
  const sourceLinks = (
    <>
      <a
        href="https://quickmap.lroc.im-ldi.com/"
        target="_blank"
        rel="noreferrer"
      >
        LROC QuickMap <ArrowUpRight size={13} />
      </a>
      <a href="https://trek.nasa.gov/moon/" target="_blank" rel="noreferrer">
        NASA Moon Trek <ArrowUpRight size={13} />
      </a>
      <a
        href="https://ssd.jpl.nasa.gov/horizons/"
        target="_blank"
        rel="noreferrer"
      >
        JPL Horizons <ArrowUpRight size={13} />
      </a>
    </>
  );
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header>
        <nav aria-label="Main navigation">
          {["Explore", "Analyze", "Compare", "Sources"].map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={page === p ? "active" : ""}
              aria-current={page === p ? "page" : undefined}
            >
              {p}
              {p === "Compare" && saved.length > 0 && (
                <small>{saved.length}</small>
              )}
            </button>
          ))}
        </nav>
        <span className="header-note">
          <span className="signal" />
          LUNAR SURFACE PLANNING
        </span>
      </header>
      <main id="main">
        {error && (
          <div role="alert" className="message error">
            <Info size={18} />
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}
        {notice && (
          <div role="status" className="message">
            <Info size={18} />
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="Dismiss notice">
              ×
            </button>
          </div>
        )}
        {page === "Explore" && (
          <>
            <section className="explorer">
              <SpaceBackdrop />
              <div className="hero-heading">
                <span className="kicker">
                  <span className="red-line" /> LUNAR SURFACE EXPLORER
                </span>
                <h1>
                  BEYOND THE<br />HORIZON<span>.</span>
                </h1>
                <p>
                  Explore the surface. Find your window.
                  <span className="hero-description">
                    Compare sunlight and Earth visibility for the place and time
                    you choose.
                  </span>
                </p>
                <div className="hero-actions">
                  <button
                    className="primary"
                    onClick={() =>
                      document
                        .getElementById("mission-planner")
                        ?.scrollIntoView({
                          behavior: matchMedia(
                            "(prefers-reduced-motion: reduce)",
                          ).matches
                            ? "instant"
                            : "smooth",
                          block: "start",
                        })
                    }
                  >
                    Set mission window <ArrowRight size={17} />
                  </button>
                  <button className="text-link" onClick={examples}>
                    View example scenarios <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
              <div
                className="scene-readout"
                aria-label="Selected mission overview"
              >
                <div>
                  <span>SELECTED COORDINATES</span>
                  <strong>
                    {coord(form.latitude, "N", "S")} <i>/</i>{" "}
                    {coord(form.longitude, "E", "W")}
                  </strong>
                </div>
                <div>
                  <span>MISSION START · UTC</span>
                  <strong>
                    {form.startTime.slice(0, 10)} <i>/</i>{" "}
                    {form.startTime.slice(11, 16)}
                  </strong>
                </div>
              </div>
              <div className="moon-stage">
                <Suspense
                  fallback={
                    <div className="loading">Loading lunar explorer…</div>
                  }
                >
                  <MoonGlobe
                    latitude={form.latitude}
                    longitude={form.longitude}
                    onSelect={(lat, lon) => select(lat, lon)}
                  />
                </Suspense>
                <span className="moon-caption">
                  LROC WAC MOSAIC / NASA MOON TREK
                  <br />
                  ILLUSTRATIVE SPACE SCENE · DRAG TO ORBIT · CLICK TO SELECT
                </span>
              </div>
            </section>
            <section
              className="explore-panel"
              id="mission-planner"
              aria-label="Location and mission time"
            >
              <div className="planner-heading">
                <span className="kicker">01 / MISSION SETUP</span>
                <h2>A place. A time. A plan.</h2>
                <p>
                  Choose your location and start time, then review the
                  conditions.
                </p>
              </div>
              <div className="location-info">
                <span className="kicker">YOUR LOCATION</span>
                <div className="panel-title">
                  <h2>{name}</h2>
                  <LocateFixed size={22} />
                </div>
                <p className="coordinate">
                  {coord(form.latitude, "N", "S")} <span>/</span>{" "}
                  {coord(form.longitude, "E", "W")}
                </p>
                <p className="description">
                  {selected?.description ||
                    "User-selected coordinates. Terrain and landing suitability have not been assessed."}
                </p>
                {selectedId === "lroc-observation" && (
                  <a
                    className="observation-link text-link"
                    href="https://data.lroc.im-ldi.com/lroc/view_lroc/LRO-L-LROC-3-CDR-V1.0/M1463278603LC"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Inspect original image <ArrowUpRight size={14} />
                  </a>
                )}
                <div className="location-fields">
                  <NumberField
                    label="Latitude (°N)"
                    value={form.latitude}
                    min={-89.999}
                    max={89.999}
                    step={0.001}
                    onChange={(v) => select(v, form.longitude)}
                  />
                  <NumberField
                    label="Longitude (°E)"
                    value={form.longitude}
                    min={-180}
                    max={180}
                    step={0.001}
                    onChange={(v) => select(form.latitude, v)}
                  />
                </div>
                <div className="mission-time-fields">
                  <label>
                    Mission date (UTC)
                    <input
                      type="date"
                      min="2000-01-01"
                      max="2099-12-31"
                      value={form.startTime.slice(0, 10)}
                      onChange={(e) => {
                        if (e.target.value)
                          change(
                            "startTime",
                            `${e.target.value}T${form.startTime.slice(11, 16)}:00Z`,
                          );
                      }}
                    />
                  </label>
                  <label>
                    Mission time (UTC)
                    <input
                      type="time"
                      step="60"
                      value={form.startTime.slice(11, 16)}
                      onChange={(e) => {
                        if (e.target.value)
                          change(
                            "startTime",
                            `${form.startTime.slice(0, 10)}T${e.target.value.slice(0, 5)}:00Z`,
                          );
                      }}
                    />
                  </label>
                </div>
                <p className="fine">
                  Start of your mission window. These settings carry through to
                  the analysis.
                </p>
                <button
                  className="primary wide"
                  onClick={() => {
                    setPage("Analyze");
                  }}
                >
                  Plan this location <ArrowRight size={17} />
                </button>
              </div>
              <div className="site-list">
                <div className="list-header">
                  <span className="kicker">REFERENCE POINTS</span>
                  <span>{String(catalog.length).padStart(2, "0")}</span>
                </div>
                <input
                  aria-label="Search locations"
                  placeholder="Find a reference point…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {catalog
                  .filter((s) =>
                    s.name.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((s, i) => (
                    <button
                      key={s.id}
                      className={selectedId === s.id ? "site selected" : "site"}
                      onClick={() =>
                        select(s.latitude, s.longitude, s.id, s.name)
                      }
                    >
                      <span className="site-num">0{i + 1}</span>
                      <span>
                        {s.name}
                        <small>
                          {coord(s.latitude, "N", "S")} /{" "}
                          {coord(s.longitude, "E", "W")}
                        </small>
                      </span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
              </div>
            </section>
            <div className="explore-bottom">
              <div>
                <span className="kicker">READY TO COMPARE?</span>
                <p>See how different locations change your mission window.</p>
              </div>
              <button className="text-link" onClick={examples}>
                Open example comparison <ArrowUpRight size={18} />
              </button>
            </div>
            <div className="page-wrap"><PolarMap latitude={form.latitude} longitude={form.longitude} onSelect={select} /></div>
            <div className="source-ribbon">
              <span>BUILT WITH LUNAR DATA</span>
              {sourceLinks}
            </div>
            <section className="intro-grid">
              <div>
                <span className="kicker">HOW IT WORKS</span>
                <h2>
                  Plan around
                  <br />
                  what matters.
                </h2>
              </div>
              {[
                [
                  "01",
                  "Find your location",
                  "Select a reference point or enter your own lunar coordinates.",
                ],
                [
                  "02",
                  "Set your requirements",
                  "Choose dates, elevation thresholds and acceptable darkness.",
                ],
                [
                  "03",
                  "Compare the evidence",
                  "Review Horizons calculations and save scenarios side by side.",
                ],
              ].map(([n, t, d]) => (
                <article key={n}>
                  <span>{n}</span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </article>
              ))}
            </section>
          </>
        )}
        {page === "Analyze" && (
          <div className="page-wrap">
            <PageHeading
              number="02"
              title="MISSION CONDITIONS"
              description="Set the window. Test your requirements."
            />
            <div className="audience-controls" aria-label="Display detail">
              <button className="secondary" aria-pressed={!expertMode} onClick={() => setExpertMode(false)}>Beginner</button>
              <button className="secondary" aria-pressed={expertMode} onClick={() => setExpertMode(true)}>Expert</button>
            </div>
            <div className="analysis-layout">
              <section className="settings panel">
                <span className="kicker">MISSION PARAMETERS</span>
                <h2>{name}</h2>
                <label>
                  Location name
                  <input
                    value={name}
                    maxLength={80}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <div className="slip-controls">
                  <NumberField label="Shift start (hours)" value={slipHours} min={-744} max={744} onChange={setSlipHours} />
                  <button type="button" className="secondary" onClick={() => {
                    const shifted = Date.parse(form.startTime) + slipHours * 3600000;
                    if (!Number.isInteger(slipHours) || Math.abs(slipHours) > 744 || !Number.isFinite(shifted) || shifted < Date.UTC(2000, 0, 1) || shifted >= Date.UTC(2100, 0, 1)) {
                      setError("Choose a whole-hour shift between −744 and 744 that keeps the start within 2000–2099.");
                      return;
                    }
                    change("startTime", new Date(shifted).toISOString());
                    setNotice("Start shifted. Calculate conditions to request or reuse matching Horizons data.");
                  }}>Shift start</button>
                </div>
                <div className="field-grid">
                  <NumberField
                    label="Latitude (°N)"
                    value={form.latitude}
                    min={-89.999}
                    max={89.999}
                    step={0.001}
                    onChange={(v) => select(v, form.longitude)}
                  />
                  <NumberField
                    label="Longitude (°E)"
                    value={form.longitude}
                    min={-180}
                    max={180}
                    step={0.001}
                    onChange={(v) => select(form.latitude, v)}
                  />
                </div>
                <label>
                  Start date & time (UTC)
                  <input
                    type="datetime-local"
                    value={form.startTime.slice(0, 16)}
                    onChange={(e) => {
                      if (e.target.value)
                        change("startTime", e.target.value + ":00Z");
                    }}
                  />
                </label>
                <div className="field-grid">
                  <NumberField
                    label="Duration (hours)"
                    value={form.durationHours}
                    min={1}
                    max={744}
                    onChange={(v) => change("durationHours", v)}
                  />
                  <label>
                    Sample interval
                    <select
                      value={form.stepMinutes}
                      onChange={(e) => change("stepMinutes", +e.target.value)}
                    >
                      {[5, 15, 30, 60, 180, 360].map((n) => (
                        <option value={n} key={n}>
                          {n} minutes
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <NumberField
                  label="Observer height above reference sphere (km)"
                  value={form.observerHeightKm}
                  min={0}
                  max={10}
                  step={0.001}
                  onChange={(v) => change("observerHeightKm", v)}
                />
                <p className="fine">
                  Above Horizons’ reference sphere, not above the terrain.
                  Terrain elevation is not supplied.
                </p>
                <div className="field-grid">
                  <NumberField
                    label="Minimum Sun elevation (°)"
                    value={form.minimumSunElevation}
                    min={0}
                    max={30}
                    onChange={(v) => change("minimumSunElevation", v)}
                  />
                  <NumberField
                    label="Minimum Earth elevation (°)"
                    value={form.minimumEarthElevation}
                    min={0}
                    max={30}
                    onChange={(v) => change("minimumEarthElevation", v)}
                  />
                </div>
                <details className="requirements" open>
                  <summary>
                    Your requirements <span>User assumptions</span>
                  </summary>
                  <div className="field-grid">
                    <NumberField
                      label="Required Sun availability (%)"
                      value={needs.sun}
                      min={0}
                      max={100}
                      onChange={(v) => setNeeds((n) => ({ ...n, sun: v }))}
                    />
                    <NumberField
                      label="Required Earth visibility (%)"
                      value={needs.earth}
                      min={0}
                      max={100}
                      onChange={(v) => setNeeds((n) => ({ ...n, earth: v }))}
                    />
                    <NumberField
                      label="Max below-Sun-threshold time (h)"
                      value={needs.darkness}
                      min={0}
                      max={744}
                      onChange={(v) => setNeeds((n) => ({ ...n, darkness: v }))}
                    />
                    <NumberField
                      label="Required continuous overlap (h)"
                      value={needs.overlap}
                      min={0}
                      max={744}
                      onChange={(v) => setNeeds((n) => ({ ...n, overlap: v }))}
                    />
                  </div>
                </details>
                <button className="primary wide" disabled={busy} onClick={run}>
                  {busy ? "Retrieving Horizons data…" : "Calculate conditions"}
                  <ArrowRight size={18} />
                </button>
                <button className="secondary wide" type="button" onClick={() => {
                  const parsed = linkSchema.safeParse({ v: 1, name, mission: form, needs });
                  if (!parsed.success) { setError("Enter valid mission inputs before creating a share link."); return; }
                  const url = new URL(window.location.href);
                  url.search = "";
                  url.hash = "";
                  url.searchParams.set("scenario", JSON.stringify(parsed.data));
                  setShareUrl(url.toString());
                }}>Create scenario link</button>
                {shareUrl && <label>Copy scenario link<input aria-label="Scenario link" readOnly value={shareUrl} onFocus={e => e.currentTarget.select()} /><small>Contains scenario inputs. The recipient may need to calculate Horizons data.</small></label>}
                <p className="fine">
                  Actual Horizons data. No substitute calculations on service
                  failure.
                </p>
              </section>
              <div className="results">
                {result ? (
                  <>
                    {dirty && (
                      <div className="message">
                        Inputs changed. Results below belong to the previous
                        calculation.
                      </div>
                    )}
                    <div className="results-heading">
                      <div>
                        <span className="kicker">
                          {result.provenance.mode.toUpperCase()}
                        </span>
                        <p>
                          {timestamp(result.request.startTime)} /{" "}
                          {result.request.durationHours} h<br />
                          {coord(result.request.latitude, "N", "S")} ·{" "}
                          {coord(result.request.longitude, "E", "W")}
                        </p>
                      </div>
                      <button
                        className="secondary"
                        onClick={save}
                        disabled={dirty}
                      >
                        <Plus size={16} /> Save scenario
                      </button>
                    </div>
                    <div className="metrics">
                      <Metric
                        label="SUN AVAILABILITY"
                        value={f(result.summary.sun.percent)}
                        unit="%"
                        note={`Above ${result.request.minimumSunElevation}° threshold`}
                        solar
                      />
                      <Metric
                        label="EARTH VISIBILITY"
                        value={f(result.summary.earth.percent)}
                        unit="%"
                        note={`Above ${result.request.minimumEarthElevation}° threshold`}
                      />
                      <Metric
                        label="LONGEST OVERLAP"
                        value={f(result.summary.overlap.longestHours)}
                        unit="h"
                        note="Both elevation requirements met"
                      />
                    </div>
                    <p className="panel plain-summary">This scenario meets {checks(result, resultNeeds).filter(check => check.pass).length} of your 4 chosen requirements. These checks describe sampled geometric conditions; terrain and landing safety are not assessed.</p>
                    <section className="panel chart-panel">
                      <div className="section-head">
                        <div>
                          <span className="kicker">SUN & EARTH ELEVATION</span>
                          <h3>The mission window.</h3>
                        </div>
                        <span className="legend">
                          <i className="sun-key" />
                          Sun <i />
                          Earth
                        </span>
                      </div>
                      <ElevationChart
                        results={[{ name: "Sun", result }]}
                        thresholds
                      />
                      <Tracks result={result} />
                      <label className="scrub-label">
                        Inspect time{" "}
                        <span>{sample && timestamp(sample.time)}</span>
                        <input
                          type="range"
                          min={0}
                          max={result.samples.length - 1}
                          value={index}
                          onChange={(e) => setIndex(+e.target.value)}
                        />
                      </label>
                      <button type="button" className="secondary playback-button" onClick={() => {
                        if (!playing && index >= result.samples.length - 1) setIndex(0);
                        setPlaying(!playing);
                      }}>{playing ? "Pause playback" : "Play samples"}</button>
                      {sample && (
                        <div className="sample-values">
                          <span>
                            <Sun size={15} /> Sun {f(sample.sun.elevation)}°
                            elevation / {f(sample.sun.azimuth)}° azimuth
                          </span>
                          <span>
                            <Globe2 size={15} /> Earth{" "}
                            {f(sample.earth.elevation)}° elevation /{" "}
                            {f(sample.earth.azimuth)}° azimuth
                          </span>
                        </div>
                      )}
                      <p className="fine">
                        Body-center elevations above the local zenith plane. No
                        terrain shadows, obstruction or solar eclipse screening.
                      </p>
                    </section>
                    <SkyView result={result} index={index} />
                    <section className="panel">
                      <div className="section-head">
                        <h3>Requirement checks</h3>
                        <button
                          className="text-link"
                          onClick={() => {
                            if (validNeeds()) setResultNeeds({ ...needs });
                            else
                              setError(
                                "Enter valid mission requirements before applying them.",
                              );
                          }}
                        >
                          Apply current requirements <ArrowRight size={14} />
                        </button>
                      </div>
                      <Checks result={result} needs={resultNeeds} />
                      <p className="fine">
                        Longest below-Sun-threshold interval:{" "}
                        {f(result.summary.sun.longestBelowHours)} h. Terrain
                        suitability: not assessed.
                      </p>
                    </section>
                    {expertMode ? <Provenance result={result} /> : <p className="fine">Choose Expert to inspect source details, exact requests, and raw responses. Sources &amp; methods are also available in the navigation.</p>}
                  </>
                ) : (
                  <section className="empty-results">
                    <div className="empty-orbit">
                      <Sun size={36} />
                      <Globe2 size={32} />
                    </div>
                    <span className="kicker">EVIDENCE BEFORE DECISIONS</span>
                    <h2>
                      Your mission starts
                      <br />
                      with a window.
                    </h2>
                    <p>
                      Choose your dates and requirements, then calculate the Sun
                      and Earth positions for this location.
                    </p>
                    <button className="secondary" onClick={examples}>
                      Explore cached examples <ArrowUpRight size={16} />
                    </button>
                    <p className="fine">
                      Terrain hazards and radio link performance are not
                      assessed.
                    </p>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
        {page === "Compare" && (
          <div className="page-wrap">
            <PageHeading
              number="03"
              title="COMPARE THE OPTIONS"
              description="Two locations. The same questions. Clear trade-offs."
            />
            <div className="compare-toolbar">
              <p>{saved.length} / 8 saved scenarios</p>
              <div>
                <button className="secondary" onClick={examples}>
                  Load sourced examples <ArrowUpRight size={16} />
                </button>
                <button
                  className="secondary"
                  disabled={!saved.length}
                  onClick={() =>
                    download(
                      csv(saved),
                      "lunarsight-comparison.csv",
                      "text/csv",
                    )
                  }
                >
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>
            {saved.length ? (
              <>
                <div className="saved-list">
                  {saved.map((s) => (
                    <article
                      className={
                        choice.includes(s.id)
                          ? "saved-card chosen"
                          : "saved-card"
                      }
                      key={s.id}
                    >
                      <label className="choose">
                        <input
                          type="checkbox"
                          checked={choice.includes(s.id)}
                          disabled={
                            !choice.includes(s.id) && choice.length >= 2
                          }
                          onChange={(e) =>
                            setChoice((xs) =>
                              e.target.checked
                                ? [...xs, s.id]
                                : xs.filter((x) => x !== s.id),
                            )
                          }
                        />
                        <span>Select for comparison</span>
                      </label>
                      <input
                        aria-label={`Rename ${s.name}`}
                        className="scenario-name"
                        maxLength={80}
                        value={s.name}
                        onChange={(e) =>
                          setSaved((xs) =>
                            xs.map((x) =>
                              x.id === s.id
                                ? { ...x, name: e.target.value }
                                : x,
                            ),
                          )
                        }
                      />
                      <p>
                        {coord(s.result.request.latitude, "N", "S")} /{" "}
                        {coord(s.result.request.longitude, "E", "W")}
                      </p>
                      <p>
                        {timestamp(s.result.request.startTime)} ·{" "}
                        {s.result.request.durationHours} h
                      </p>
                      <div className="card-actions">
                        <button
                          className="text-link"
                          onClick={() => {
                            setForm(s.result.request);
                            setResult(s.result);
                            setName(s.name);
                            setSelectedId("custom");
                            setNeeds(s.needs);
                            setResultNeeds(s.needs);
                            setIndex(0);
                            setPage("Analyze");
                          }}
                        >
                          Open scenario <ArrowUpRight size={15} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Remove ${s.name}`}
                          onClick={() => {
                            setSaved((xs) => xs.filter((x) => x.id !== s.id));
                            setChoice((xs) => xs.filter((x) => x !== s.id));
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                {active.length === 2 ? (
                  <>
                    <section className="comparison-cards">
                      {active.map((s) => (
                        <article className="panel compare-column" key={s.id}>
                          <span className="kicker">
                            SCENARIO {active.indexOf(s) + 1}
                          </span>
                          <h2>{s.name}</h2>
                          <p>
                            {timestamp(s.result.request.startTime)} ·{" "}
                            {s.result.request.durationHours} hours
                          </p>
                          <dl>
                            {[
                              [
                                "Sun availability",
                                f(s.result.summary.sun.percent) + "%",
                              ],
                              [
                                "Earth visibility",
                                f(s.result.summary.earth.percent) + "%",
                              ],
                              [
                                "Longest below-Sun-threshold interval",
                                f(s.result.summary.sun.longestBelowHours) +
                                  " h",
                              ],
                              [
                                "Longest overlapping window",
                                f(s.result.summary.overlap.longestHours) + " h",
                              ],
                              [
                                "Sun / Earth elevation thresholds",
                                s.result.request.minimumSunElevation +
                                  "° / " +
                                  s.result.request.minimumEarthElevation +
                                  "°",
                              ],
                              [
                                "Observer reference height",
                                s.result.request.observerHeightKm + " km",
                              ],
                              ["Terrain suitability", "Not assessed"],
                            ].map(([k, v]) => (
                              <div key={k}>
                                <dt>{k}</dt>
                                <dd>{v}</dd>
                              </div>
                            ))}
                          </dl>
                          <Checks result={s.result} needs={s.needs} />
                        </article>
                      ))}
                    </section>
                    <section className="panel tradeoff">
                      <span className="kicker">WHAT THE RESULTS SAY</span>
                      <h3>Operational trade-offs.</h3>
                      <p>{explanation(active[0], active[1])}</p>
                      {active[0].result.request.startTime !==
                        active[1].result.request.startTime && (
                        <p className="fine">
                          Start dates differ. The default chart uses UTC;
                          elapsed mode compares time since each mission began.
                        </p>
                      )}
                    </section>
                    <section className="panel chart-panel">
                      <div className="section-head">
                        <h3>Aligned mission conditions</h3>
                        <label className="inline-label">
                          Time axis
                          <select
                            value={align}
                            onChange={(e) =>
                              setAlign(e.target.value as "utc" | "elapsed")
                            }
                          >
                            <option value="utc">UTC</option>
                            <option value="elapsed">
                              Elapsed mission hours
                            </option>
                          </select>
                        </label>
                      </div>
                      <ElevationChart
                        results={active.map((s) => ({
                          name: s.name,
                          result: s.result,
                        }))}
                        elapsed={align === "elapsed"}
                      />
                      <ComparisonTracks scenarios={active} elapsed={align === "elapsed"} />
                      {active.map((s) => (
                        <div className="comparison-track" key={s.id}>
                          <h4>{s.name}</h4>
                          <p className="fine">
                            Own mission window:{" "}
                            {timestamp(s.result.request.startTime)} ·{" "}
                            {s.result.request.durationHours} h
                          </p>
                          <Tracks result={s.result} />
                        </div>
                      ))}
                      <p className="fine">
                        Pale blue: scenario 1. Steel blue: scenario 2. Solid
                        lines: Sun; dashed lines: Earth. Missing coverage is
                        never extrapolated. Tracks each show their own mission
                        window.
                      </p>
                    </section>
                  </>
                ) : (
                  <div className="empty compact">
                    <h2>Select two scenarios.</h2>
                    <p>
                      Choose two cards above to compare matching metrics and
                      timelines.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="empty">
                <Layers size={36} />
                <h2>Give your decision some context.</h2>
                <p>
                  Save two analyses or load genuine Horizons examples to
                  compare.
                </p>
                <button className="primary" onClick={examples}>
                  Load example comparison <ArrowRight size={17} />
                </button>
              </div>
            )}
          </div>
        )}
        {page === "Sources" && (
          <div className="page-wrap">
            <PageHeading
              number="04"
              title="THE EVIDENCE"
              description="Know the source. Understand the limits."
            />
            <div className="source-cards">
              <article className="panel">
                <span className="kicker">01 / SURFACE CONTEXT</span>
                <h2>LROC QuickMap</h2>
                <p>
                  Inspect imagery and terrain products in the original lunar
                  mapping tool.
                </p>
                <a
                  className="text-link"
                  href="https://quickmap.lroc.im-ldi.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open QuickMap <ArrowUpRight size={17} />
                </a>
                <p className="fine">
                  Integrated observation M1463278603LC: acquisition metadata,
                  center coordinates and the red footprint on the globe. This
                  image footprint is not a hazard map.
                </p>
              </article>
              <article className="panel">
                <span className="kicker">02 / LUNAR IMAGERY</span>
                <h2>NASA Moon Trek</h2>
                <p>
                  The globe uses the LRO WAC Global Mosaic v2, assembled from 32
                  documented WMTS tiles.
                </p>
                <a
                  className="text-link"
                  href="https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon"
                  target="_blank"
                  rel="noreferrer"
                >
                  Map service documentation <ArrowUpRight size={17} />
                </a>
                <p className="fine">
                  2048 × 1024 display texture. It is imagery, not an elevation
                  model or date-specific lighting calculation.
                </p>
              </article>
              <article className="panel">
                <span className="kicker">03 / SUN & EARTH</span>
                <h2>JPL Horizons</h2>
                <p>
                  Actual apparent, airless body-center azimuth and elevation for
                  a user-defined lunar surface observer.
                </p>
                <a
                  className="text-link"
                  href="https://ssd.jpl.nasa.gov/horizons/manual.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  Calculation reference <ArrowUpRight size={17} />
                </a>
                <p className="fine">
                  Quantity 4 · CENTER coord@301 · MEAN_ME lunar frame · UT
                  timestamps.
                </p>
              </article>
            </div>
            <div className="method-grid">
              <section className="panel">
                <span className="kicker">METHOD</span>
                <h2>Derived, not invented.</h2>
                <p>
                  Sun and Earth availability measure the fraction of the
                  requested window above your chosen elevation thresholds.
                  Crossings are linearly interpolated between Horizons samples.
                  Overlap is the intersection of the two sets of intervals.
                </p>
                <p>
                  The below-Sun-threshold interval can include weak low-angle
                  sunlight. It is not always physical darkness. No overall
                  safety score is assigned.
                </p>
                <p>
                  Requirement checks are application calculations using your
                  assumptions. They are not NASA ratings.
                </p>
                <a
                  className="text-link"
                  href="/data/source-manifest.json"
                  target="_blank"
                >
                  Open dataset manifest <ArrowUpRight size={16} />
                </a>
              </section>
              <section className="panel">
                <span className="kicker">NOT YET ASSESSED</span>
                <h2>What these results cannot tell you.</h2>
                <ul>
                  <li>
                    Terrain shadows, solar eclipses and mountains blocking the
                    Sun or Earth.
                  </li>
                  <li>Surface slope, rocks, craters and landing clearance.</li>
                  <li>
                    Electrical power, antenna performance or radio link
                    availability.
                  </li>
                  <li>Whether a spacecraft can land safely.</li>
                </ul>
                <p>
                  Map-frame compatibility is not established at landing
                  precision. Globe-selected coordinates are approximate inputs,
                  not surveyed points. Check the mission’s required frame before
                  using imported map coordinates.
                </p>
              </section>
            </div>
            <section className="panel audit-panel">
              <span className="kicker">SOURCE AUDIT</span>
              <h2>What changed from the original app.</h2>
              <p>
                The old Astronomy Engine calculations and NASA SVS checks are
                not used in this version’s results. Named Surface Data Book
                study points were removed from the active catalog because they
                were outside your three required resources. Reference points are
                openly labelled as user-defined.
              </p>
              <p>
                No placeholder terrain statistics, invented communication alerts
                or unsupported landing ratings are displayed.
              </p>
            </section>
          </div>
        )}
      </main>
      <footer>
        <div className="footer-brand">
          <span className="text-wordmark" aria-label="LunarSight">
            <span className="wordmark-top">Lunar</span>
            <span className="wordmark-bottom">SIGHT</span>
          </span>
          <small>LUNAR SURFACE PLANNING</small>
        </div>
        <p>
          Educational planning estimates.
          <br />
          Terrain and landing safety are not assessed.
        </p>
        <button className="text-link" onClick={() => setPage("Sources")}>
          Sources & methods <ArrowUpRight size={16} />
        </button>
      </footer>
    </>
  );
}
function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        required
        value={Number.isNaN(value) ? "" : value}
        onChange={(e) =>
          onChange(e.target.value === "" ? NaN : Number(e.target.value))
        }
      />
    </label>
  );
}
function PageHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <span className="kicker">{number} / LUNARSIGHT</span>
      <h1>
        {title}
        <span>.</span>
      </h1>
      <p>{description}</p>
    </div>
  );
}
function Metric({
  label,
  value,
  unit,
  note,
  solar = false,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
  solar?: boolean;
}) {
  return (
    <article className={"metric " + (solar ? "solar" : "")}>
      <span className="kicker">{label}</span>
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
      <p>{note}</p>
    </article>
  );
}
function Checks({ result, needs }: { result: Result; needs: Needs }) {
  return (
    <div className="checks">
      {checks(result, needs).map((c) => (
        <div key={c.name}>
          <span className={c.pass ? "pass" : "fail"}>
            {c.pass ? <Check size={15} /> : <Info size={15} />}{" "}
            {c.pass ? "Meets requirement" : "Does not meet"}
          </span>
          <strong>{c.name}</strong>
          <small>
            {f(c.actual)}
            {c.unit} / {c.name.startsWith("Maximum") ? "maximum" : "required"}{" "}
            {c.required}
            {c.unit}
          </small>
        </div>
      ))}
    </div>
  );
}
function Tracks({ result }: { result: Result }) {
  return (
    <div className="tracks">
      {(["sun", "earth", "overlap"] as const).map((key) => (
        <div className={"track-row " + key} key={key}>
          <span>{key === "overlap" ? "BOTH" : key.toUpperCase()}</span>
          <div className="track" aria-label={`${key} threshold intervals`}>
            {result.intervals[key].map((w, i) => (
              <span
                title={`${timestamp(w.start)} — ${timestamp(w.end)} (${f(w.hours)} h)`}
                key={i}
                style={{
                  left:
                    ((Date.parse(w.start) -
                      Date.parse(result.request.startTime)) /
                      (result.request.durationHours * 36e5)) *
                      100 +
                    "%",
                  width: (w.hours / result.request.durationHours) * 100 + "%",
                }}
              />
            ))}
          </div>
          <small>{f(result.summary[key].percent)}%</small>
        </div>
      ))}
    </div>
  );
}
function ElevationChart({
  results,
  elapsed = false,
  thresholds = false,
}: {
  results: { name: string; result: Result }[];
  elapsed?: boolean;
  thresholds?: boolean;
}) {
  const times = [
    ...new Set(
      results.flatMap(({ result: r }) =>
        r.samples.map((s) =>
          elapsed
            ? (Date.parse(s.time) - Date.parse(r.request.startTime)) / 36e5
            : Date.parse(s.time),
        ),
      ),
    ),
  ].sort((a, b) => a - b);
  function at(r: Result, t: number, key: "sun" | "earth") {
    const target = elapsed ? Date.parse(r.request.startTime) + t * 36e5 : t;
    const xs = r.samples;
    if (target < Date.parse(xs[0].time) || target > Date.parse(xs.at(-1)!.time))
      return null;
    const i = Math.min(
      xs.length - 1,
      Math.floor(
        (target - Date.parse(xs[0].time)) / (r.request.stepMinutes * 60000),
      ),
    );
    if (i === xs.length - 1) return xs[i][key].elevation;
    const frac =
      (target - Date.parse(xs[i].time)) /
      (Date.parse(xs[i + 1].time) - Date.parse(xs[i].time));
    return (
      xs[i][key].elevation +
      (xs[i + 1][key].elevation - xs[i][key].elevation) * frac
    );
  }
  const data = times.map((t) => {
    const row: Record<string, number | null> = { time: t };
    results.forEach(({ result: r }, i) => {
      row[`sun${i}`] = at(r, t, "sun");
      row[`earth${i}`] = at(r, t, "earth");
    });
    return row;
  });
  return (
    <div
      className="elevation-chart"
      role="img"
      aria-label="Sun and Earth elevation over mission time"
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={data}
          margin={{ top: 12, right: 15, bottom: 5, left: -18 }}
        >
          <CartesianGrid
            stroke="#38506A"
            strokeDasharray="2 6"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t) =>
              elapsed
                ? `${t}h`
                : new Date(t).toISOString().slice(5, 16).replace("T", " ")
            }
            tick={{ fill: "#B8C4CF", fontSize: 10 }}
            minTickGap={60}
          />
          <YAxis unit="°" tick={{ fill: "#B8C4CF", fontSize: 10 }} />
          <Tooltip
            labelFormatter={(t) =>
              elapsed
                ? `${t} mission hours`
                : timestamp(new Date(Number(t)).toISOString())
            }
            formatter={(v) => [typeof v === "number" ? v.toFixed(2) + "°" : v]}
            contentStyle={{
              background: "#1D2B3A",
              border: "1px solid #71859A",
              color: "#F2F5F6",
            }}
          />
          <ReferenceLine y={0} stroke="#71859A" />
          {thresholds && (
            <>
              <ReferenceLine
                y={results[0].result.request.minimumSunElevation}
                stroke="#B8C4CF"
                strokeDasharray="3 4"
              />
              <ReferenceLine
                y={results[0].result.request.minimumEarthElevation}
                stroke="#B8C4CF"
                strokeDasharray="3 4"
              />
            </>
          )}
          {results.flatMap((r, i) => [
            <Line
              key={`s${i}`}
              type="linear"
              dataKey={`sun${i}`}
              name={`${r.name} · Sun`}
              stroke={i === 0 ? "#F2F5F6" : "#71859A"}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
              connectNulls={false}
            />,
            <Line
              key={`e${i}`}
              type="linear"
              dataKey={`earth${i}`}
              name={`${r.name} · Earth`}
              stroke={
                results.length === 1
                  ? "#B8C4CF"
                  : i === 0
                    ? "#F2F5F6"
                    : "#71859A"
              }
              dot={false}
              strokeWidth={2}
              strokeDasharray="5 4"
              isAnimationActive={false}
              connectNulls={false}
            />,
          ])}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
function Provenance({ result: r }: { result: Result }) {
  return (
    <details className="panel provenance">
      <summary>
        Source & calculation details <ArrowUpRight size={16} />
      </summary>
      <dl>
        <div>
          <dt>Source</dt>
          <dd>
            {r.provenance.source} · {r.provenance.mode}
          </dd>
        </div>
        <div>
          <dt>Retrieved</dt>
          <dd>{timestamp(r.provenance.retrievedAt)}</dd>
        </div>
        <div>
          <dt>Coordinates</dt>
          <dd>{r.provenance.frame}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{r.provenance.timeReference}</dd>
        </div>
        <div>
          <dt>Sampling</dt>
          <dd>
            {r.request.stepMinutes} minutes · linear crossing interpolation
          </dd>
        </div>
        <div>
          <dt>Terrain</dt>
          <dd>{r.provenance.terrain}</dd>
        </div>
      </dl>
      <ul>
        {r.provenance.limitations.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <button
        className="secondary"
        onClick={() =>
          download(
            JSON.stringify(r, null, 2),
            "lunarsight-analysis.json",
            "application/json",
          )
        }
      >
        <Download size={14} /> Export complete result
      </button>
      <a className="text-link" href={r.provenance.rawDownload} target="_blank">
        Original Horizons responses <ArrowUpRight size={14} />
      </a>
      <details>
        <summary>Exact request parameters</summary>
        <pre>{JSON.stringify(r.provenance.requests, null, 2)}</pre>
      </details>
    </details>
  );
}
