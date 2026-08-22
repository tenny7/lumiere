import { formatCurrency, formatDate } from "@/lib/utils/format"

export type DonutDatum = {
  label: string
  value: number
  color: string
  display: string
}

/**
 * Dependency-free SVG donut chart with a legend. Server-renderable.
 */
export function DonutChart({
  data,
  size = 150,
  thickness = 20,
  centerLabel,
  centerValue,
}: {
  data: DonutDatum[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        role="img"
      >
        {/* track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          strokeWidth={thickness}
          className="stroke-muted"
          opacity={0.35}
        />
        {total > 0 &&
          data.map((d, i) => {
            const len = (d.value / total) * 100
            const el = (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                pathLength={100}
                strokeDasharray={`${len} ${100 - len}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            )
            offset += len
            return el
          })}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-foreground"
          style={{ fontSize: 22, fontWeight: 600 }}
        >
          {centerValue ?? (total > 0 ? total.toLocaleString() : "0")}
        </text>
        {centerLabel && (
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: 10, letterSpacing: 1 }}
          >
            {centerLabel}
          </text>
        )}
      </svg>

      <ul className="w-full space-y-2">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
          return (
            <li key={d.label} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="flex-1 truncate text-muted-foreground">
                {d.label}
              </span>
              <span className="tabular-nums text-muted-foreground">{pct}%</span>
              <span className="w-24 text-right font-medium tabular-nums">
                {d.display}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function compactAmount(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`
  return String(Math.round(v))
}

/**
 * Dependency-free HTML/CSS vertical bar chart for a daily time series. One
 * column per day (including zero-sales days), amount labels when sparse. Uses
 * flexbox so it's naturally responsive with crisp (non-distorted) text.
 */
export function BarChart({
  points,
  height = 180,
}: {
  points: { label: string; value: number }[]
  height?: number
}) {
  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No revenue data yet
      </p>
    )
  }

  const max = Math.max(...points.map((p) => p.value), 1)
  const nonZero = points.filter((p) => p.value > 0).length
  const showLabels = nonZero > 0 && nonZero <= 10

  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {points.map((p, i) => {
          const pct = p.value > 0 ? Math.max((p.value / max) * 100, 3) : 0
          return (
            <div
              key={i}
              className="group flex h-full flex-1 flex-col items-center justify-end"
              title={`${formatDate(p.label)} · ${formatCurrency(p.value)}`}
            >
              {showLabels && p.value > 0 && (
                <span className="mb-1 text-[0.65rem] font-semibold tabular-nums">
                  {compactAmount(p.value)}
                </span>
              )}
              <div
                className="w-full max-w-[34px] rounded-t bg-gradient-to-t from-amber-500/40 to-amber-500 transition-opacity group-hover:opacity-90"
                style={{ height: `${pct}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{formatDate(points[0].label)}</span>
        <span>{formatDate(points[points.length - 1].label)}</span>
      </div>
    </div>
  )
}

/**
 * Dependency-free SVG area chart for a time series. Server-renderable.
 */
export function AreaChart({
  points,
  height = 140,
}: {
  points: { label: string; value: number }[]
  height?: number
}) {
  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No revenue data yet
      </p>
    )
  }

  const W = 600
  const H = height
  const padX = 8
  const padY = 12
  const max = Math.max(...points.map((p) => p.value), 1)
  const n = points.length
  const x = (i: number) =>
    n === 1 ? W / 2 : padX + (i * (W - padX * 2)) / (n - 1)
  const y = (v: number) => H - padY - (v / max) * (H - padY * 2)

  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")
  const area = `${padX},${H - padY} ${line} ${x(n - 1)},${H - padY}`
  const last = points[points.length - 1]

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
      >
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#revFill)" />
        <polyline
          points={line}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={2.5} fill="#f59e0b" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{formatDate(points[0].label)}</span>
        <span className="font-medium text-foreground">
          Latest: {formatCurrency(last.value)}
        </span>
        <span>{formatDate(last.label)}</span>
      </div>
    </div>
  )
}
