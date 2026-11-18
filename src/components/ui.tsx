import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Routine, Workout } from '../types'
import { fmtInput, parseNum } from '../utils'
import { Icon, type IconName } from './Icon'

/* ---------------- Navegação ---------------- */

export type Tab = 'home' | 'routines' | 'history' | 'progress' | 'more'

export type Screen =
  | { name: 'routine'; id?: string }
  | { name: 'exercise'; id: string }
  | { name: 'workout'; id: string }
  | { name: 'body' }
  | { name: 'tools' }
  | { name: 'settings' }

export interface Nav {
  push: (s: Screen) => void
  pop: () => void
  setTab: (t: Tab) => void
  begin: (opts?: { routine?: Routine; from?: Workout }) => void
  openWorkout: () => void
  closeWorkout: () => void
  showSummary: (w: Workout) => void
}

export const NavCtx = createContext<Nav>(null as unknown as Nav)
export const useNav = () => useContext(NavCtx)

/* ---------------- Primitivos ---------------- */

export function TopBar({ title, back, right, sub }: { title: ReactNode; back?: boolean; right?: ReactNode; sub?: ReactNode }) {
  const nav = useNav()
  return (
    <header className="topbar">
      {back && (
        <button className="icon-btn" onClick={nav.pop} aria-label="Voltar">
          <Icon name="left" />
        </button>
      )}
      <div className="topbar-title">
        <h1>{title}</h1>
        {sub && <small>{sub}</small>}
      </div>
      <div className="topbar-right">{right}</div>
    </header>
  )
}

export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])
  if (!open) return null
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="sheet-handle" />
        {title && (
          <div className="sheet-head">
            <h2>{title}</h2>
            <button className="icon-btn" onClick={onClose} aria-label="Fechar">
              <Icon name="x" />
            </button>
          </div>
        )}
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function MenuItem({ icon, label, onClick, danger, sub }: { icon: IconName; label: ReactNode; onClick: () => void; danger?: boolean; sub?: ReactNode }) {
  return (
    <button className={`menu-item${danger ? ' danger' : ''}`} onClick={onClick}>
      <Icon name={icon} size={20} />
      <span className="grow">
        {label}
        {sub && <small>{sub}</small>}
      </span>
    </button>
  )
}

export function NumInput({
  value,
  onChange,
  placeholder,
  decimal = true,
  className = '',
  ariaLabel,
}: {
  value: number | null | undefined
  onChange: (v: number | null) => void
  placeholder?: string
  decimal?: boolean
  className?: string
  ariaLabel?: string
}) {
  const [text, setText] = useState(value == null ? '' : fmtInput(value))
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setText(value == null ? '' : fmtInput(value))
  }, [value])
  return (
    <input
      className={`num-input ${className}`}
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={text}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onFocus={(e) => {
        focused.current = true
        e.target.select()
      }}
      onBlur={() => {
        focused.current = false
        setText(value == null ? '' : fmtInput(value))
      }}
      onChange={(e) => {
        const t = e.target.value.replace(decimal ? /[^0-9.,]/g : /[^0-9]/g, '')
        setText(t)
        onChange(parseNum(t))
      }}
    />
  )
}

export function Stepper({ value, onChange, min = 0, max = 999, step = 1, format }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; format?: (v: number) => ReactNode }) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))} aria-label="Diminuir">
        <Icon name="minus" size={18} />
      </button>
      <span>{format ? format(value) : value}</span>
      <button onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))} aria-label="Aumentar">
        <Icon name="plus" size={18} />
      </button>
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o.value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <button type="button" role="switch" aria-checked={checked} className={`toggle${checked ? ' on' : ''}`} onClick={() => onChange(!checked)}>
        <i />
      </button>
    </label>
  )
}

export function Empty({ icon, title, text, action }: { icon: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={30} />
      </div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

export function Stat({ label, value, sub, accent }: { label: ReactNode; value: ReactNode; sub?: ReactNode; accent?: boolean }) {
  return (
    <div className={`stat${accent ? ' accent' : ''}`}>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  )
}

export function Ring({ value, max, size = 76, children }: { value: number; max: number; size?: number; children?: ReactNode }) {
  const r = (size - 10) / 2
  const c = 2 * Math.PI * r
  const p = Math.min(1, max ? value / max : 0)
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-3)" strokeWidth={6} fill="none" strokeDasharray="2 4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--accent)"
          strokeWidth={6}
          fill="none"
          strokeLinecap="butt"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .5s' }}
        />
      </svg>
      <div className="ring-inner">{children}</div>
    </div>
  )
}
