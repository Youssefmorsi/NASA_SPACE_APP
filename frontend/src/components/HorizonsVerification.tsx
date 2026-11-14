import type { Result } from "../../../science/horizons";
export default function HorizonsVerification({ result }: { result: Result }) {
  return (
    <details className="panel horizons-verification">
      <summary>Verify in Horizons</summary>
      <p>
        Repeat the exact Sun and Earth API requests, or enter the same settings
        in the Horizons web interface.
      </p>
      <p className="fine">
        Moon observer (coord@301), longitude {result.request.longitude}° east,
        latitude {result.request.latitude}°, reference height{" "}
        {result.request.observerHeightKm} km. Airless body-centre
        azimuth/elevation, quantity 4. Start {result.request.startTime},
        duration {result.request.durationHours} h, spacing{" "}
        {result.request.stepMinutes} min. Thresholds are applied by LunarSight
        after retrieval.
      </p>
      <div className="surface-buttons">
        {(["sun", "earth"] as const).map((body) => (
          <a
            className="text-link"
            key={body}
            href={
              "https://ssd.jpl.nasa.gov/api/horizons.api?" +
              new URLSearchParams(result.provenance.requests[body])
            }
            target="_blank"
            rel="noreferrer"
          >
            Open exact {body === "sun" ? "Sun" : "Earth"} request ↗
          </a>
        ))}
        <a
          className="text-link"
          href="https://ssd.jpl.nasa.gov/horizons/app.html#/"
          target="_blank"
          rel="noreferrer"
        >
          Horizons web interface ↗
        </a>
      </div>
      <p className="fine">
        This supports checking inputs and parsing against the same source. It is
        not an independent validation of Horizons or terrain visibility.
      </p>
    </details>
  );
}
