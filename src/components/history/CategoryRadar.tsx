const CATEGORIES = [
  { key: 'work', label: 'Work', angle: 270 },      // left
  { key: 'personal', label: 'Personal', angle: 30 }, // top-right
  { key: 'health', label: 'Health', angle: 150 },    // bottom-right
];

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 80;

interface CategoryRadarProps {
  categoryCounts?: Record<string, number>;
}

function polarToXY(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

export default function CategoryRadar({ categoryCounts = {} }: CategoryRadarProps) {
  const total = Object.values(categoryCounts).reduce((s, v) => s + v, 0);
  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground/50 font-mono">
        No wins yet — categories will appear here
      </p>
    );
  }

  const max = Math.max(...Object.values(categoryCounts), 1);

  // Build polygon points for the filled shape
  const points = CATEGORIES.map(({ key, angle }) => {
    const count = categoryCounts[key] || 0;
    const ratio = count / max;
    const r = Math.max(ratio * RADIUS, 4); // minimum 4px so dot is visible
    return polarToXY(angle, r);
  });

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Grid circles */}
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <circle
            key={r}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS * r}
            fill="none"
            className="stroke-border"
            strokeWidth={0.5}
          />
        ))}

        {/* Axis lines + labels */}
        {CATEGORIES.map(({ key, label, angle }) => {
          const end = polarToXY(angle, RADIUS + 4);
          const labelPos = polarToXY(angle, RADIUS + 24);
          const count = categoryCounts[key] || 0;
          const pct = Math.round((count / total) * 100);

          return (
            <g key={key}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={end.x}
                y2={end.y}
                className="stroke-border"
                strokeWidth={0.5}
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)' }}
              >
                {label}
              </text>
              <text
                x={labelPos.x}
                y={labelPos.y + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground"
                style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}
              >
                {pct}%
              </text>
            </g>
          );
        })}

        {/* Filled shape */}
        <polygon
          points={polygonPoints}
          className="fill-foreground/10 stroke-foreground"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={CATEGORIES[i].key}
            cx={p.x}
            cy={p.y}
            r={3.5}
            className="fill-foreground"
          />
        ))}
      </svg>
    </div>
  );
}
