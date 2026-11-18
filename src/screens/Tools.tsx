import { useState } from 'react'
import { Icon } from '../components/Icon'
import { NumInput, Segmented, TopBar } from '../components/ui'
import { startRest, updateSettings, useApp } from '../store'
import { e1rm, fmt, fmtRest, unlockAudio } from '../utils'

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]
const PLATE_COLORS: Record<number, string> = { 25: '#ff5d5d', 20: '#4da3ff', 15: '#ffd23f', 10: '#2ee6c5', 5: '#e8eaed', 2.5: '#9aa4b2', 1.25: '#6b7280' }

function platesFor(target: number, bar: number) {
  let side = (target - bar) / 2
  const out: number[] = []
  if (side <= 0) return { out, rest: 0 }
  for (const p of PLATES) {
    while (side >= p - 1e-9) {
      out.push(p)
      side -= p
    }
  }
  return { out, rest: +(side * 2).toFixed(2) }
}

export function ToolsScreen() {
  const [tool, setTool] = useState<'1rm' | 'plates' | 'warmup' | 'timer'>('1rm')
  return (
    <div className="page">
      <TopBar back title="Ferramentas" />
      <Segmented
        value={tool}
        onChange={setTool}
        options={[
          { value: '1rm', label: '1RM' },
          { value: 'plates', label: 'Anilhas' },
          { value: 'warmup', label: 'Aquecer' },
          { value: 'timer', label: 'Timer' },
        ]}
      />
      <div className="mt">
        {tool === '1rm' && <OneRm />}
        {tool === 'plates' && <Plates />}
        {tool === 'warmup' && <Warmup />}
        {tool === 'timer' && <Timer />}
      </div>
    </div>
  )
}

function OneRm() {
  const [w, setW] = useState<number | null>(100)
  const [r, setR] = useState<number | null>(5)
  const max = e1rm(w ?? 0, r ?? 0)
  return (
    <>
      <div className="grid2">
        <label className="field">
          <span>Carga (kg)</span>
          <NumInput value={w} onChange={setW} />
        </label>
        <label className="field">
          <span>Repetições</span>
          <NumInput decimal={false} value={r} onChange={setR} />
        </label>
      </div>
      <div className="card big-number">
        <small className="muted">1RM estimado</small>
        <strong>{fmt(max)} kg</strong>
        <small className="muted">Fórmula de Epley — mais precisa até ~10 reps</small>
      </div>
      <h2 className="section-title">Tabela de percentuais</h2>
      <div className="card flush">
        <table className="pct-table">
          <thead>
            <tr>
              <th>%</th>
              <th>Carga</th>
              <th>Reps aprox.</th>
            </tr>
          </thead>
          <tbody>
            {[100, 95, 90, 85, 80, 75, 70, 65, 60, 50].map((p) => (
              <tr key={p}>
                <td>{p}%</td>
                <td>
                  <b>{fmt(Math.round(((max * p) / 100) * 2) / 2)} kg</b>
                </td>
                <td className="muted">{p === 100 ? 1 : Math.max(1, Math.round(30 * (100 / p - 1)))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Plates() {
  const { settings } = useApp()
  const [target, setTarget] = useState<number | null>(100)
  const { out, rest } = platesFor(target ?? 0, settings.barWeight)
  return (
    <>
      <div className="grid2">
        <label className="field">
          <span>Carga total (kg)</span>
          <NumInput value={target} onChange={setTarget} />
        </label>
        <label className="field">
          <span>Barra (kg)</span>
          <NumInput value={settings.barWeight} onChange={(v) => updateSettings({ barWeight: v ?? 20 })} />
        </label>
      </div>
      <div className="card">
        <small className="muted">Em cada lado da barra</small>
        <div className="barbell">
          <div className="bar-sleeve" />
          {out.map((p, i) => (
            <div key={i} className="plate" style={{ background: PLATE_COLORS[p], height: `${40 + (p / 25) * 60}%` }}>
              <span>{fmt(p)}</span>
            </div>
          ))}
          <div className="bar-end" />
        </div>
        <p className="center">
          {out.length ? (
            <b>{Object.entries(out.reduce<Record<string, number>>((a, p) => ((a[p] = (a[p] ?? 0) + 1), a), {})).sort((a, b) => +b[0] - +a[0]).map(([p, n]) => `${n}× ${fmt(+p)} kg`).join(' + ')}</b>
          ) : (
            <span className="muted">Só a barra</span>
          )}
        </p>
        {rest > 0 && <p className="center warn tiny">Faltam {fmt(rest)} kg que não fecham com as anilhas padrão.</p>}
      </div>
    </>
  )
}

function Warmup() {
  const { settings } = useApp()
  const [w, setW] = useState<number | null>(100)
  const round = (x: number) => Math.max(settings.barWeight, Math.round(x / 2.5) * 2.5)
  const scheme = [
    { pct: 0, reps: 10, label: 'Só a barra' },
    { pct: 40, reps: 8 },
    { pct: 60, reps: 5 },
    { pct: 75, reps: 3 },
    { pct: 85, reps: 2 },
    { pct: 92, reps: 1 },
  ]
  return (
    <>
      <label className="field">
        <span>Carga de trabalho (kg)</span>
        <NumInput value={w} onChange={setW} />
      </label>
      <div className="list card flush">
        {scheme.map((s, i) => (
          <div key={i} className="list-row static">
            <span className="badge">{i + 1}</span>
            <span className="grow">
              <b>{s.pct ? `${fmt(round(((w ?? 0) * s.pct) / 100))} kg` : `${fmt(settings.barWeight)} kg`}</b>
              <small>{s.label ?? `${s.pct}% da carga de trabalho`}</small>
            </span>
            <span className="pill">× {s.reps}</span>
          </div>
        ))}
      </div>
      <p className="muted tiny mt-sm">Descanse ~60s entre as séries de aquecimento. Sem chegar perto da falha.</p>
    </>
  )
}

function Timer() {
  const opts = [30, 45, 60, 90, 120, 150, 180, 240, 300]
  return (
    <>
      <p className="muted">Inicie um cronômetro de descanso. Ele aparece na parte de baixo da tela e avisa com som/vibração.</p>
      <div className="timer-grid">
        {opts.map((s) => (
          <button
            key={s}
            className="card timer-btn"
            onClick={() => {
              unlockAudio()
              startRest(s)
            }}
          >
            <Icon name="timer" />
            <b>{fmtRest(s)}</b>
          </button>
        ))}
      </div>
    </>
  )
}
