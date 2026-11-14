import { catalog } from "../../../data/catalog";

export function PolarMap({ latitude, longitude, onSelect }: { latitude: number; longitude: number; onSelect: (lat: number, lon: number, id?: string, name?: string) => void }) {
  const project = (lat: number, lon: number) => {
    const radius = ((lat + 90) / 15) * 110;
    const angle = lon * Math.PI / 180;
    return { x: 150 + radius * Math.sin(angle), y: 150 + radius * Math.cos(angle) };
  };
  const points = catalog.filter(site => site.latitude <= -75);
  const inRange = Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= -75 && longitude >= -180 && longitude <= 180;
  const selected = inRange ? project(latitude, longitude) : null;
  return <section className="panel polar-panel" aria-labelledby="polar-title">
    <span className="kicker">SOUTH POLAR COORDINATES</span><h3 id="polar-title">Reference map</h3>
    <p className="fine">Schematic projection of 75°S–90°S; markers are reference points, not terrain or approved landing sites. Use the location list to select a point.</p>
    <p className="fine" aria-live="polite">
      {selected
        ? `Selected location: ${Math.abs(latitude).toFixed(3)}°S / ${Math.abs(longitude).toFixed(3)}°${longitude < 0 ? "W" : "E"}. The white ring marks this location.`
        : "Location cannot be shown. Enter a latitude from 75°S to 90°S and a longitude from 180°W to 180°E."}
    </p>
    <svg viewBox="0 0 300 300" role="img" aria-label="Schematic south polar coordinate map with selectable reference points">
      {[110, 73.3, 36.7].map(r => <circle key={r} cx="150" cy="150" r={r} fill="none" stroke="#71859A" />)}
      <path d="M40 150H260M150 40V260" stroke="#71859A" />
      <text x="150" y="27" textAnchor="middle" fill="#B8C4CF" fontSize="10">180°</text><text x="150" y="282" textAnchor="middle" fill="#B8C4CF" fontSize="10">0°</text><text x="270" y="153" fill="#B8C4CF" fontSize="10">90°E</text><text x="6" y="153" fill="#B8C4CF" fontSize="10">90°W</text>
      {points.map(site => { const pos = project(site.latitude, site.longitude); return <g key={site.id} role="button" tabIndex={0} aria-label={`Select ${site.name}`} onClick={() => onSelect(site.latitude, site.longitude, site.id, site.name)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(site.latitude, site.longitude, site.id, site.name); } }}><circle cx={pos.x} cy={pos.y} r="7" fill="#71859A" stroke="#F2F5F6" /><title>{site.name}</title></g>; })}
      {selected && <circle cx={selected.x} cy={selected.y} r="12" fill="none" stroke="#F2F5F6" strokeWidth="2" pointerEvents="none" />}
    </svg>
  </section>;
}
