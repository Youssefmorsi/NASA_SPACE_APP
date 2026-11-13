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
      <svg className="background-earth" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="earth-ocean" cx="32%" cy="28%" r="75%">
            <stop stopColor="#347db1" />
            <stop offset=".58" stopColor="#124b79" />
            <stop offset="1" stopColor="#071527" />
          </radialGradient>
          <radialGradient id="earth-shade" cx="22%" cy="35%" r="80%">
            <stop offset=".35" stopColor="#020711" stopOpacity="0" />
            <stop offset=".73" stopColor="#020711" stopOpacity=".35" />
            <stop offset="1" stopColor="#020711" stopOpacity=".98" />
          </radialGradient>
          <clipPath id="earth-disc">
            <circle cx="100" cy="100" r="89" />
          </clipPath>
        </defs>
        <circle
          cx="100"
          cy="100"
          r="91"
          fill="none"
          stroke="#76bfff"
          strokeOpacity=".28"
          strokeWidth="2"
        />
        <circle cx="100" cy="100" r="89" fill="url(#earth-ocean)" />
        <g clipPath="url(#earth-disc)">
          <g fill="#729282">
            <path d="M21 42 43 28 65 29 77 39 69 49 77 57 64 65 57 78 44 83 39 99 29 91 23 69Z" />
            <path d="m45 97 17 1 14 12 8 18-6 15-4 17-10 18-5-12-2-20-9-16-2-18Z" />
            <path d="m92 41 17-9 14 6 10-2 16 9 27 1 15 19-17 14-18-5-11 10-11-4-9-13-16-2-9-12-11 1Z" />
            <path d="m108 76 18 0 17 14 6 17-10 13-8 26-11-4-5-20-11-17-5-19Z" />
            <path d="m159 132 14-7 18 10-3 16-20 3-12-10Z" />
            <path d="m64 17 21-5 10 9-5 11-15 4Z" />
          </g>
          <g fill="none" stroke="#e7f3fa" strokeLinecap="round" opacity=".38">
            <path d="M12 62Q47 39 77 51T139 48" strokeWidth="5" />
            <path d="M35 86Q64 72 86 83T153 91" strokeWidth="3" />
            <path
              d="M15 115Q35 107 59 116M78 142Q117 128 152 140"
              strokeWidth="5"
            />
            <path d="M47 168Q94 153 140 170" strokeWidth="7" />
          </g>
          <circle cx="100" cy="100" r="89" fill="url(#earth-shade)" />
        </g>
      </svg>
      <div className="background-sun">
        <span />
      </div>
    </div>
  );
}
