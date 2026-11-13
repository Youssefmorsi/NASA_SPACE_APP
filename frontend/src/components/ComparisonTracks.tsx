import type { Saved } from "../model";

export function ComparisonTracks({ scenarios, elapsed }: { scenarios: Saved[]; elapsed: boolean }) {
  const start = elapsed ? 0 : Math.min(...scenarios.map(s => Date.parse(s.result.request.startTime)));
  const end = Math.max(...scenarios.map(s => (elapsed ? 0 : Date.parse(s.result.request.startTime)) + s.result.request.durationHours * 3600000));
  const span = end - start;
  const label = (t: number) => elapsed ? `${(t / 3600000).toFixed(0)} h` : `${new Date(t).toISOString().slice(0, 16).replace("T", " ")} UTC`;
  return <div className="shared-tracks"><h4>Shared {elapsed ? "elapsed time" : "UTC"} visibility tracks</h4><div className="shared-axis"><span>{label(start)}</span><span>{label(end)}</span></div>
    {scenarios.map(s => <div className="shared-scenario" key={s.id}><strong>{s.name}</strong><small>Sun ≥ {s.result.request.minimumSunElevation}° · Earth ≥ {s.result.request.minimumEarthElevation}°</small>
      {(["sun", "earth", "overlap"] as const).map(body => {
        const siteStart = elapsed ? 0 : Date.parse(s.result.request.startTime);
        const ownStart = Date.parse(s.result.request.startTime);
        return <div className="shared-row" key={body}><span>{body === "overlap" ? "BOTH" : body.toUpperCase()}</span><div className="shared-track"><i className="shared-coverage" style={{ left: `${(siteStart - start) / span * 100}%`, width: `${s.result.request.durationHours * 3600000 / span * 100}%` }} />{s.result.intervals[body].map((w, i) => <i key={i} className={`shared-window ${body}`} title={`${w.start} – ${w.end}`} style={{ left: `${(siteStart + Date.parse(w.start) - ownStart - start) / span * 100}%`, width: `${w.hours * 3600000 / span * 100}%` }} />)}</div></div>;
      })}</div>)}
    <p className="fine">Dark grey marks each scenario’s sampled coverage; colored segments meet the stated thresholds. Empty space outside coverage is not a prediction.</p>
  </div>;
}
