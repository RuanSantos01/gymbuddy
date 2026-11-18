import { useMemo, useState } from 'react'
import { ExercisePicker } from '../components/ExercisePicker'
import { ExThumb } from '../components/ExerciseMedia'
import { Icon } from '../components/Icon'
import { TechniquePicker } from '../components/TechniquePicker'
import { TECH, groupInfo } from '../data/techniques'
import { NumInput, Stepper, TopBar, useNav } from '../components/ui'
import { ROUTINE_COLORS } from '../data/seed'
import { deleteRoutine, getState, saveRoutine, useApp, useExMap } from '../store'
import type { Routine } from '../types'
import { fmtRest, uid } from '../utils'

export const REST_OPTIONS = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300]

export function RoutineEditor({ id }: { id?: string }) {
  const nav = useNav()
  const { settings } = useApp()
  const exMap = useExMap()
  const [r, setR] = useState<Routine>(() => {
    const existing = id && getState().routines.find((x) => x.id === id)
    return existing ? structuredClone(existing) : { id: uid(), name: '', color: ROUTINE_COLORS[getState().routines.length % ROUTINE_COLORS.length], exercises: [] }
  })
  const [picking, setPicking] = useState(false)
  const [techIdx, setTechIdx] = useState<number | null>(null)
  const groups = useMemo(() => groupInfo(r.exercises), [r.exercises])
  const isNew = !id

  const upd = (i: number, patch: Partial<Routine['exercises'][number]>) =>
    setR((x) => ({ ...x, exercises: x.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) }))
  const move = (i: number, d: number) =>
    setR((x) => {
      const ex = [...x.exercises]
      const j = i + d
      if (j < 0 || j >= ex.length) return x
      ;[ex[i], ex[j]] = [ex[j], ex[i]]
      return { ...x, exercises: ex }
    })

  const save = () => {
    saveRoutine({ ...r, name: r.name.trim() || 'Rotina sem nome' })
    nav.pop()
  }

  return (
    <div className="page">
      <TopBar
        back
        title={isNew ? 'Nova rotina' : 'Editar rotina'}
        right={
          <button className="btn primary sm" onClick={save}>
            Salvar
          </button>
        }
      />
      <label className="field">
        <span>Nome</span>
        <input value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} placeholder="Ex.: A — Peito e Tríceps" />
      </label>
      <div className="field">
        <span>Cor</span>
        <div className="colors">
          {ROUTINE_COLORS.map((c) => (
            <button key={c} className={`color${r.color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => setR({ ...r, color: c })} aria-label={c} />
          ))}
        </div>
      </div>

      <h2 className="section-title">Exercícios ({r.exercises.length})</h2>
      <div className="stack">
        {r.exercises.map((e, i) => {
          const ex = exMap.get(e.exerciseId)
          const g = groups[i]
          return (
            <div key={`${e.exerciseId}-${i}`} className={`card tight${g ? ` grouped g-${g.pos === 1 ? 'first' : g.pos === g.size ? 'last' : 'mid'}` : ''}`}>
              {g?.pos === 1 && (
                <div className="group-tag">
                  <Icon name="link" size={13} /> {g.label} · {g.size} exercícios em sequência
                </div>
              )}
              <div className="row">
                <ExThumb ex={ex} size={44} />
                <strong className="grow">
                  {ex?.name ?? 'Removido'} <small className="muted">{ex?.equipment}</small>
                </strong>
                <button className="icon-btn sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir">
                  <Icon name="up" size={18} />
                </button>
                <button className="icon-btn sm" onClick={() => move(i, 1)} disabled={i === r.exercises.length - 1} aria-label="Descer">
                  <Icon name="down" size={18} />
                </button>
                <button className="icon-btn sm danger" onClick={() => setR({ ...r, exercises: r.exercises.filter((_, j) => j !== i) })} aria-label="Remover">
                  <Icon name="trash" size={18} />
                </button>
              </div>
              <div className="editor-grid">
                <div>
                  <span className="mini-label">Séries</span>
                  <Stepper value={e.sets} min={1} max={12} onChange={(v) => upd(i, { sets: v })} />
                </div>
                <div>
                  <span className="mini-label">Repetições</span>
                  <div className="range">
                    <NumInput decimal={false} value={e.repMin} onChange={(v) => upd(i, { repMin: v ?? 1 })} ariaLabel="Reps mínimas" />
                    <span>–</span>
                    <NumInput decimal={false} value={e.repMax} onChange={(v) => upd(i, { repMax: v ?? e.repMin })} ariaLabel="Reps máximas" />
                  </div>
                </div>
                <div>
                  <span className="mini-label">Descanso</span>
                  <select value={e.restSec} onChange={(ev) => upd(i, { restSec: +ev.target.value })}>
                    {REST_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {fmtRest(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="tech-row" onClick={() => setTechIdx(i)}>
                <Icon name="layers" size={16} />
                <span className="grow">
                  Técnica: <b>{TECH[e.technique ?? 'tradicional'].label}</b>
                  {e.cadence ? ` · cadência ${e.cadence}` : ''}
                </span>
                <Icon name="right" size={16} />
              </button>
            </div>
          )
        })}
      </div>
      <button className="btn block mt" onClick={() => setPicking(true)}>
        <Icon name="plus" size={18} /> Adicionar exercícios
      </button>

      {!isNew && (
        <button
          className="btn danger-ghost block mt-lg"
          onClick={() => {
            if (confirm('Excluir esta rotina?')) {
              deleteRoutine(r.id)
              nav.pop()
            }
          }}
        >
          <Icon name="trash" size={18} /> Excluir rotina
        </button>
      )}

      {techIdx != null && r.exercises[techIdx] && (
        <TechniquePicker
          open
          value={r.exercises[techIdx].technique}
          cadence={r.exercises[techIdx].cadence}
          onClose={() => setTechIdx(null)}
          onChange={(t, c) => upd(techIdx, { technique: t, cadence: c })}
        />
      )}

      <ExercisePicker
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(ids) =>
          setR((x) => ({
            ...x,
            exercises: [...x.exercises, ...ids.map((exerciseId) => ({ exerciseId, sets: 3, repMin: 8, repMax: 12, restSec: settings.restDefault }))],
          }))
        }
      />
    </div>
  )
}
