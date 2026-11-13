import { lazy, Suspense } from "react";
const CelestialBody = lazy(() => import("./CelestialBody"));
/** Decorative scene only; positions and sizes do not represent ephemerides. */
export default function SpaceBackdrop() {
  const stars = Array.from({ length: 155 }, (_, i) => ({
    x: (i * 73.137 + 11.4) % 100,
    y: (i * 37.719 + 3.8) % 100,
    size: i % 19 === 0 ? 2 : i % 5 === 0 ? 1.5 : 1,
    opacity: 0.18 + (i % 7) * 0.075,
  }));
  return (
    <div className="space-backdrop" aria-hidden="true">
      <div className="star-field">
        {stars.map((s, i) => (
          <span
            key={i}
            style={{
              left: s.x + "%",
              top: s.y + "%",
              width: s.size,
              height: s.size,
              opacity: s.opacity,
            }}
          />
        ))}
      </div>
      <div className="background-earth">
        <Suspense fallback={null}>
          <CelestialBody kind="earth" />
        </Suspense>
      </div>
      <div className="background-sun">
        <Suspense fallback={null}>
          <CelestialBody kind="sun" />
        </Suspense>
      </div>
    </div>
  );
}
