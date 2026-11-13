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
import type { Result } from "../../../science/horizons";
const timestamp = (s: string) => new Date(s).toISOString().slice(0, 16).replace("T", " ") + " UTC";
export default function ElevationChart({
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
