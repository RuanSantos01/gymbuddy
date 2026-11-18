import { useId, useState } from 'react'
import { fmt, fmtShortDate } from '../utils'

export interface Pt {
  x: number
  y: number
}

export function LineChart({ points, height = 180, color = 'var(--accent)', unit = '', digits = 1 }: { points: Pt[]; height?: number; color?: string; unit?: string; digits?: number }) {
  const id = useId().replace(/:/g, '')
  const [sel, setSel] = useState<number | null>(null)
  if (points.length === 0) return <div className="chart-empty">Sem dados ainda</div>
  const W = 340
  const H = height
  const pad = { l: 8, r: 8, t: 16, b: 22 }
  const ys = points.map((p) => p.y)
  let min = Math.min(...ys)
  let max = Math.max(...ys)
  if (min === max) {
    min -= 1
    max += 1
  }
  const span = max - min
  min -= span * 0.12
  max += span * 0.12
  const x0 = points[0].x
  const x1 = points[points.length - 1].x
  const sx = (x: number) => (x1 === x0 ? W / 2 : pad.l + ((x - x0) / (x1 - x0)) * (W - pad.l - pad.r))
  const sy = (y: number) => pad.t + (1 - (y - min) / (max - min)) * (H - pad.t - pad.b)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('')
  const area = `${line}L${sx(x1).toFixed(1)},${H - pad.b}L${sx(x0).toFixed(1)},${H - pad.b}Z`
  const active = sel != null ? points[sel] : points[points.length - 1]

  const pick = (clientX: number, el: SVGSVGElement) => {
    const rect = el.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * W
    let best = 0
    points.forEach((p, i) => {
      if (Math.abs(sx(p.x) - x) < Math.abs(sx(points[best].x) - x)) best = i
    })
    setSel(best)
  }

  return (
    <div className="chart">
      <div className="chart-readout">
        <strong>
          {fmt(active.y, digits)}
          {unit && <small> {unit}</small>}
        </strong>
        <span>{fmtShortDate(active.x)}</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        preserveAspectRatio="none"
        onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
        onPointerMove={(e) => e.buttons && pick(e.clientX, e.currentTarget)}
        onPointerLeave={() => setSel(null)}
        style={{ touchAction: 'pan-y' }}
      >
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.35" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={W} y1={pad.t + f * (H - pad.t - pad.b)} y2={pad.t + f * (H - pad.t - pad.b)} stroke="var(--border)" strokeDasharray="3 4" />
        ))}
        {points.length > 1 && <path d={area} fill={`url(#g${id})`} />}
        {points.length > 1 && <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
        {points.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={p === active ? 5 : points.length > 30 ? 0 : 3} fill={p === active ? color : 'var(--bg)'} stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        ))}
        <text x={pad.l} y={H - 6} className="chart-axis">
          {fmtShortDate(x0)}
        </text>
        {x1 !== x0 && (
          <text x={W - pad.r} y={H - 6} textAnchor="end" className="chart-axis">
            {fmtShortDate(x1)}
          </text>
        )}
      </svg>
    </div>
  )
}

export function BarChart({ data, height = 120, format = (v: number) => fmt(v, 0) }: { data: { label: string; value: number; highlight?: boolean }[]; height?: number; format?: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="bars" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className={`bar${d.highlight ? ' hi' : ''}`}>
          <span className="bar-val">{d.value ? format(d.value) : ''}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export function Sparkline({ values, color = 'var(--accent)', width = 72, height = 26 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length < 2) return <svg width={width} height={height} />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const d = values
    .map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * (width - 4) + 2).toFixed(1)},${(height - 3 - ((v - min) / (max - min || 1)) * (height - 6)).toFixed(1)}`)
    .join('')
  return (
    <svg width={width} height={height}>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function HBars({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="hbars">
      {data.map((d) => (
        <div key={d.label} className="hbar">
          <span className="hbar-label">{d.label}</span>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: `${(d.value / max) * 100}%`, background: d.color }} />
          </div>
          <span className="hbar-val">{d.value}</span>
        </div>
      ))}
    </div>
  )
}
