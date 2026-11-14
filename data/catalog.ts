export type Site = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  kind?: "historical" | "reference" | "observation";
  source?: string;
  frame?: string;
};
export const catalog: Site[] = [
  {
    id: "lroc-observation",
    name: "LROC observation center",
    kind: "observation",
    latitude: -58.45,
    longitude: 2.69,
    description:
      "Center of LROC NAC image M1463278603LC, acquired 22 February 2024. QuickMap observation metadata; not a landing site.",
  },
  {
    id: "south",
    name: "South polar reference",
    kind: "reference",
    latitude: -89,
    longitude: 0,
    description:
      "User-defined point at 89°S, 0°E. Not an assigned landing site.",
  },
  {
    id: "south-east",
    name: "Southern reference · 45°E",
    kind: "reference",
    latitude: -85,
    longitude: 45,
    description: "User-defined point at 85°S, 45°E. Compare polar conditions.",
  },
  {
    id: "nearside",
    name: "Nearside reference",
    kind: "reference",
    latitude: 0,
    longitude: 0,
    description: "Mathematical reference at the equator and prime meridian.",
  },
  {
    id: "farside",
    name: "Farside reference",
    kind: "reference",
    latitude: 0,
    longitude: 180,
    description: "Mathematical reference on the opposite lunar hemisphere.",
  },
  {
    id: "apollo11",
    name: "Apollo 11 · lunar module",
    latitude: 0.67416,
    longitude: 23.47314,
    description:
      "Historical lunar-module location measured by LROC. ME coordinate system (2016 study); longitude normalized to ±180°. Not a future landing recommendation.",
    kind: "historical",
    source: "https://lroc.im-ldi.com/images/938",
    frame:
      "Mean Earth/polar axis (ME); approximate compatibility with Horizons MEAN_ME, not a landing-precision transformation.",
  },
  {
    id: "apollo12",
    name: "Apollo 12 · lunar module",
    latitude: -3.0128,
    longitude: -23.4219,
    description:
      "Historical lunar-module location measured by LROC. ME coordinate system (2016 study); longitude normalized to ±180°. Not a future landing recommendation.",
    kind: "historical",
    source: "https://lroc.im-ldi.com/images/938",
    frame:
      "Mean Earth/polar axis (ME); approximate compatibility with Horizons MEAN_ME, not a landing-precision transformation.",
  },
  {
    id: "apollo14",
    name: "Apollo 14 · lunar module",
    latitude: -3.64589,
    longitude: -17.47194,
    description:
      "Historical lunar-module location measured by LROC. ME coordinate system (2016 study); longitude normalized to ±180°. Not a future landing recommendation.",
    kind: "historical",
    source: "https://lroc.im-ldi.com/images/938",
    frame:
      "Mean Earth/polar axis (ME); approximate compatibility with Horizons MEAN_ME, not a landing-precision transformation.",
  },
  {
    id: "apollo15",
    name: "Apollo 15 · lunar module",
    latitude: 26.13239,
    longitude: 3.6333,
    description:
      "Historical lunar-module location measured by LROC. ME coordinate system (2016 study); longitude normalized to ±180°. Not a future landing recommendation.",
    kind: "historical",
    source: "https://lroc.im-ldi.com/images/938",
    frame:
      "Mean Earth/polar axis (ME); approximate compatibility with Horizons MEAN_ME, not a landing-precision transformation.",
  },
  {
    id: "apollo16",
    name: "Apollo 16 · lunar module",
    latitude: -8.9734,
    longitude: 15.5011,
    description:
      "Historical lunar-module location measured by LROC. ME coordinate system (2016 study); longitude normalized to ±180°. Not a future landing recommendation.",
    kind: "historical",
    source: "https://lroc.im-ldi.com/images/938",
    frame:
      "Mean Earth/polar axis (ME); approximate compatibility with Horizons MEAN_ME, not a landing-precision transformation.",
  },
  {
    id: "apollo17",
    name: "Apollo 17 · lunar module",
    latitude: 20.1911,
    longitude: 30.7723,
    description:
      "Historical lunar-module location measured by LROC. ME coordinate system (2016 study); longitude normalized to ±180°. Not a future landing recommendation.",
    kind: "historical",
    source: "https://lroc.im-ldi.com/images/938",
    frame:
      "Mean Earth/polar axis (ME); approximate compatibility with Horizons MEAN_ME, not a landing-precision transformation.",
  },
];
