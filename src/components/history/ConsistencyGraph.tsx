import { useState } from 'react';
import { getLocalDateString } from '@/lib/utils/date';

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short' });
const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

interface CompletionEntry {
  completed: number;
  total: number;
}

interface TooltipState {
  x: number;
  y: number;
  text: string;
}

interface ConsistencyGraphProps {
  completionMap?: Record<string, CompletionEntry | boolean>;
  days?: number;
  dayStartHour?: number;
}

function getIntensity(entry: CompletionEntry | boolean | null): number {
  if (!entry) return 0;
  if (typeof entry === 'boolean') return entry ? 4 : 0;
  if (entry.total === 0) return 0;
  const ratio = entry.completed / entry.total;
  if (ratio === 0) return 0;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio < 1) return 3;
  return 4;
}

// SVG fill styles using CSS variables (bg-* doesn't work on SVG rect)
const INTENSITY_FILLS = [
  'color-mix(in srgb, var(--border) 100%, transparent)',          // 0 — no wins
  'color-mix(in srgb, var(--foreground) 15%, transparent)',       // 1 — low
  'color-mix(in srgb, var(--foreground) 30%, transparent)',       // 2 — medium-low
  'color-mix(in srgb, var(--foreground) 55%, transparent)',       // 3 — medium-high
  'var(--foreground)',                                             // 4 — all complete
];

// HTML div classes for the legend
const INTENSITY_CLASSES = [
  'bg-border',
  'bg-foreground/15',
  'bg-foreground/30',
  'bg-foreground/55',
  'bg-foreground',
];

const CELL = 14;
const GAP = 3;
const COL = CELL + GAP;
const LABEL_W = 32;

export default function ConsistencyGraph({ completionMap = {}, days = 84, dayStartHour = 0 }: ConsistencyGraphProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const today = new Date();
  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateString(d, dayStartHour);
    const entry = completionMap[dateStr];
    cells.push({ dateStr, date: new Date(d), entry: entry || null });
  }

  // Pad start so first day aligns to correct weekday row
  const firstDayOfWeek = cells[0].date.getDay();
  const paddedCells = [...Array(firstDayOfWeek).fill(null), ...cells];
  const weeks = [];
  for (let i = 0; i < paddedCells.length; i += 7) {
    weeks.push(paddedCells.slice(i, i + 7));
  }
  const lastWeek = weeks[weeks.length - 1];
  while (lastWeek.length < 7) lastWeek.push(null);

  // Month labels — find first week where a month starts
  const monthLabels: Array<{ weekIdx: number; label: string }> = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIdx) => {
    for (const cell of week) {
      if (!cell) continue;
      const m = cell.date.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ weekIdx, label: MONTH_FORMATTER.format(cell.date) });
        lastMonth = m;
        break;
      }
    }
  });

  // Total wins summary
  let totalCompleted = 0;
  for (const cell of cells) {
    if (cell.entry) {
      if (typeof cell.entry === 'boolean') {
        totalCompleted += cell.entry ? 1 : 0;
      } else {
        totalCompleted += Number(cell.entry.completed) || 0;
      }
    }
  }

  const gridW = weeks.length * COL - GAP;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {totalCompleted} win{totalCompleted !== 1 ? 's' : ''} completed in the last {days} days
      </p>

      <div className="relative">
        {/* SVG-like grid using absolute positioning for precise control */}
        <svg
          width={LABEL_W + gridW}
          height={7 * COL - GAP + 20}
          className="block"
          style={{ overflow: 'visible' }}
        >
          {/* Month labels */}
          {monthLabels.map(({ weekIdx, label }) => (
            <text
              key={`month-${weekIdx}`}
              x={LABEL_W + weekIdx * COL}
              y={10}
              className="fill-muted-foreground"
              style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)' }}
            >
              {label}
            </text>
          ))}

          {/* Day labels */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, i) => (
            i % 2 === 1 ? (
              <text
                key={label}
                x={0}
                y={20 + i * COL + CELL - 2}
                className="fill-muted-foreground"
                style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)' }}
              >
                {label}
              </text>
            ) : null
          ))}

          {/* Grid cells */}
          {weeks.map((week, weekIdx) =>
            week.map((cell, dayIdx) => {
              if (!cell) return null;
              const intensity = getIntensity(cell.entry);
              const x = LABEL_W + weekIdx * COL;
              const y = 20 + dayIdx * COL;
              return (
                <rect
                  key={cell.dateStr}
                  data-testid="heatmap-cell"
                  data-intensity={intensity}
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  style={{ fill: INTENSITY_FILLS[intensity] }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const completed = cell.entry?.completed ?? 0;
                    const total = cell.entry?.total ?? 0;
                    setTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                      text: total > 0
                        ? `${completed}/${total} wins on ${DATE_FORMATTER.format(cell.date)}`
                        : `No wins on ${DATE_FORMATTER.format(cell.date)}`,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })
          )}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 text-[11px] font-mono text-muted-foreground" style={{ paddingLeft: LABEL_W }}>
          <span>Less</span>
          {INTENSITY_CLASSES.map((cls, i) => (
            <div key={i} className={`w-[14px] h-[14px] rounded-sm ${cls}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 text-xs font-mono bg-foreground text-background rounded shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
