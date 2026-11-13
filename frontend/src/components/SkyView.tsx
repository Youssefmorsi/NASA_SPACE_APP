import type { Result } from "../../../science/horizons";

type Props = { result: Result; index: number };

export function nextDownCrossing(result: Result, index: number, body: "sun" | "earth") {
  const samples = result.samples;
  const threshold = body === "sun" ? result.request.minimumSunElevation : result.request.minimumEarthElevation;
  const current = samples[index];
  if (!current) return "Sample unavailable";
  if (current[body].elevation < threshold) return `Already below ${threshold}° threshold`;
  for (let i = index; i < samples.length - 1; i++) {
    const a = samples[i], b = samples[i + 1];
    const aValue = a[body].elevation, bValue = b[body].elevation;
    if (aValue >= threshold && bValue < threshold) {
      const fraction = (aValue - threshold) / (aValue - bValue);
      const at = Date.parse(a.time) + fraction * (Date.parse(b.time) - Date.parse(a.time));
      const hours = (at - Date.parse(current.time)) / 3600000;
      return `~${hours.toFixed(1)} h · ${new Date(at).toISOString().slice(0, 16).replace("T", " ")} UTC`;
    }
  }
  return "No downward crossing within sampled coverage";
}

export function SkyView({ result, index }: Props) {
  const sample = result.samples[index];
  if (!sample) return null;
  const position = (azimuth: number, elevation: number) => ({
    x: 30 + (azimuth / 360) * 340,
    y: 150 - Math.max(-30, Math.min(90, elevation)) * (110 / 90),
  });
  const sun = position(sample.sun.azimuth, sample.sun.elevation);
  const earth = position(sample.earth.azimuth, sample.earth.elevation);
  return <section className="panel sky-panel" aria-labelledby="sky-title">
    <span className="kicker">SELECTED SAMPLE / LOCAL SKY</span>
    <h3 id="sky-title">Sun and Earth above the reference plane</h3>
    <p className="fine">Azimuth clockwise from north · elevation relative to the local zenith plane · no terrain obstruction. Positions below −30° are shown at the lower edge.</p>
    <svg viewBox="0 0 400 205" role="img" aria-label={`Sky plot. Sun ${sample.sun.azimuth.toFixed(1)} degrees azimuth, ${sample.sun.elevation.toFixed(1)} degrees elevation. Earth ${sample.earth.azimuth.toFixed(1)} degrees azimuth, ${sample.earth.elevation.toFixed(1)} degrees elevation.`}>
      <rect x="30" y="40" width="340" height="147" fill="#1D2B3A" />
      {[40, 95, 150, 187].map(y => <line key={y} x1="30" x2="370" y1={y} y2={y} stroke="#71859A" strokeOpacity=".35" strokeDasharray={y === 150 ? undefined : "3 4"} />)}
      {["N", "E", "S", "W", "N"].map((label, i) => <text key={i} x={30 + i * 85} y="201" textAnchor="middle" fill="#B8C4CF" fontSize="10">{label}</text>)}
      <text x="2" y="44" fill="#B8C4CF" fontSize="10">90°</text><text x="7" y="153" fill="#B8C4CF" fontSize="10">0°</text><text x="1" y="190" fill="#B8C4CF" fontSize="10">−30°</text>
      <circle cx={sun.x} cy={sun.y} r="6" fill="#F2F5F6" /><text x={sun.x + 8} y={sun.y - 7} fill="#F2F5F6" fontSize="11">Sun</text>
      <circle cx={earth.x} cy={earth.y} r="6" fill="#71859A" /><text x={earth.x + 8} y={earth.y + 14} fill="#71859A" fontSize="11">Earth</text>
    </svg>
    <div className="crossing-list"><p><strong>Sun threshold crossing</strong><br />{nextDownCrossing(result, index, "sun")}</p><p><strong>Earth threshold crossing</strong><br />{nextDownCrossing(result, index, "earth")}</p></div>
    <p className="fine">Crossings are linearly estimated between samples; timing is limited by the sample interval. These are threshold crossings, not terrain-aware sunset or Earthset.</p>
  </section>;
}
