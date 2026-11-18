import { useEffect, useMemo, useState } from 'react'
import { ExercisePicker, MuscleDot } from '../components/ExercisePicker'
import { Icon } from '../components/Icon'
import { MenuItem, NumInput, Sheet, useNav } from '../components/ui'
import { adjustRest, discardWorkout, exName, stopRest, finishWorkout, lastSetsFor, newSet, startRest, suggest, updateActive, useApp, useExMap } from '../store'
import type { SetType, Workout, WorkoutExercise, WorkoutSet } from '../types'
import { beep, fmt, fmtClock, fmtDuration, fmtKg, fmtRest, fmtVolume, unlockAudio, useNow, workoutSets, workoutVolume } from '../utils'
import { REST_OPTIONS } from './RoutineEditor'

const TYPE_LABEL: Record<SetType, string> = { normal: 'Normal', warmup: 'Aquecimento', drop: 'Drop set', failure: 'Até a falha' }
const TYPE_SHORT: Record<Exclude<SetType, 'normal'>, string> = { warmup: 'A', drop: 'D', failure: 'F' }

export function WorkoutScreen() {
  const { active, workouts, settings } = useApp()
  const nav = useNav()
  const now = useNow(1000)
  const [picking, setPicking] = useState<null | { replace?: number }>(null)
  const [exMenu, setExMenu] = useState<number | null>(null)
  const [setMenu, setSetMenu] = useState<{ e: number; s: number } | null>(null)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    if (!settings.keepAwake || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    const req = () => navigator.wakeLock.request('screen').then((l) => (lock = l)).catch(() => {})
    void req()
    const onVis = () => document.visibilityState === 'visible' && req()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      void lock?.release()
    }
  }, [settings.keepAwake])

  if (!active) return null
  const w = active
  const done = w.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0)
  const total = w.exercises.reduce((a, e) => a + e.sets.length, 0)

  const finish = () => {
    const pending = total - done
    if (done === 0) {
      if (confirm('Nenhuma série concluída. Descartar este treino?')) {
        discardWorkout()
        nav.closeWorkout()
      }
      return
    }
    if (pending > 0 && !finishing) {
      setFinishing(true)
      return
    }
    setFinishing(false)
    const saved = finishWorkout()
    nav.closeWorkout()
    if (saved) nav.showSummary(saved)
  }

  return (
    <div className="workout">
      <header className="topbar workout-bar">
        <button className="icon-btn" onClick={nav.closeWorkout} aria-label="Minimizar">
          <Icon name="down" />
        </button>
        <div className="topbar-title">
          <input className="title-input" value={w.name} onChange={(e) => updateActive((x) => void (x.name = e.target.value))} aria-label="Nome do treino" />
          <small>
            <Icon name="timer" size={13} /> {fmtClock((now - w.startedAt) / 1000)} · {done}/{total} séries · {fmtVolume(workoutVolume(w))}
          </small>
        </div>
        <button className="btn primary sm" onClick={finish}>
          Finalizar
        </button>
      </header>

      <div className="progress-line">
        <div style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      <div className="page workout-page">
        {w.exercises.length === 0 && (
          <div className="empty">
            <div className="empty-icon">
              <Icon name="dumbbell" size={30} />
            </div>
            <h3>Treino vazio</h3>
            <p>Adicione exercícios para começar a registrar.</p>
          </div>
        )}

        {w.exercises.map((e, i) => (
          <ExerciseBlock key={e.id} e={e} index={i} workouts={workouts} increment={settings.increment} onMenu={() => setExMenu(i)} onSetMenu={(s) => setSetMenu({ e: i, s })} />
        ))}

        <button className="btn block" onClick={() => setPicking({})}>
          <Icon name="plus" size={18} /> Adicionar exercício
        </button>

        <label className="field mt-lg">
          <span>Anotações do treino</span>
          <textarea rows={3} value={w.notes ?? ''} placeholder="Como você se sentiu, sono, energia…" onChange={(e) => updateActive((x) => void (x.notes = e.target.value))} />
        </label>

        <button
          className="btn danger-ghost block mt"
          onClick={() => {
            if (confirm('Descartar este treino? Nada será salvo.')) {
              discardWorkout()
              nav.closeWorkout()
            }
          }}
        >
          <Icon name="trash" size={18} /> Descartar treino
        </button>
      </div>

      <ExercisePicker
        open={!!picking}
        multi={picking?.replace == null}
        onClose={() => setPicking(null)}
        onPick={(ids) =>
          updateActive((x) => {
            if (picking?.replace != null) {
              const target = x.exercises[picking.replace]
              target.exerciseId = ids[0]
              target.sets = target.sets.map((s) => (s.done ? s : { ...s, weight: null, reps: null }))
              return
            }
            for (const exerciseId of ids) x.exercises.push({ id: crypto.randomUUID(), exerciseId, restSec: settings.restDefault, sets: [newSet(), newSet(), newSet()] })
          })
        }
      />

      <ExerciseMenu index={exMenu} w={w} onClose={() => setExMenu(null)} onReplace={(i) => (setExMenu(null), setPicking({ replace: i }))} />
      <SetMenu target={setMenu} w={w} onClose={() => setSetMenu(null)} />

      <Sheet
        open={finishing}
        onClose={() => setFinishing(false)}
        title="Finalizar treino?"
        footer={
          <div className="row gap">
            <button className="btn grow" onClick={() => setFinishing(false)}>
              Continuar treinando
            </button>
            <button className="btn primary grow" onClick={finish}>
              Finalizar
            </button>
          </div>
        }
      >
        <p className="muted">
          Há {total - done} série(s) não marcada(s) como concluída(s). Elas serão descartadas — só as séries com ✓ entram no histórico.
        </p>
      </Sheet>
    </div>
  )
}

function ExerciseBlock({ e, index, workouts, increment, onMenu, onSetMenu }: { e: WorkoutExercise; index: number; workouts: Workout[]; increment: number; onMenu: () => void; onSetMenu: (s: number) => void }) {
  const exMap = useExMap()
  const ex = exMap.get(e.exerciseId)
  const prev = useMemo(() => lastSetsFor(workouts, e.exerciseId), [workouts, e.exerciseId])
  const prevWork = prev.filter((s) => s.type !== 'warmup')
  const sug = useMemo(() => suggest(prev, e.repMax, increment), [prev, e.repMax, increment])
  const allDone = e.sets.length > 0 && e.sets.every((s) => s.done)

  let workIdx = 0
  const rows = e.sets.map((s, j) => {
    const label = s.type === 'normal' ? String(++workIdx) : TYPE_SHORT[s.type]
    const p = s.type === 'warmup' ? prev.filter((x) => x.type === 'warmup')[j] : prevWork[workIdx - 1] ?? prevWork[prevWork.length - 1]
    const before = e.sets.slice(0, j).reverse().find((x) => x.type === s.type && x.weight != null)
    const phW = before?.weight ?? (s.type === 'normal' && sug ? sug.weight : p?.weight) ?? null
    const phR = before?.reps ?? p?.reps ?? (s.type === 'normal' ? e.repMax : null) ?? null
    return { s, j, label, p, phW, phR }
  })

  const toggle = (j: number, phW: number | null, phR: number | null) => {
    unlockAudio()
    const s = e.sets[j]
    const willComplete = !s.done
    if (willComplete && s.reps == null && phR == null) return
    updateActive((x) => {
      const t = x.exercises[index].sets[j]
      if (!t.done) {
        if (t.weight == null) t.weight = phW
        if (t.reps == null) t.reps = phR
        t.done = true
      } else t.done = false
    })
    if (willComplete) startRest(s.type === 'warmup' ? Math.min(60, e.restSec) : e.restSec)
  }

  return (
    <section className={`card ex-block${allDone ? ' complete' : ''}`}>
      <div className="row">
        {ex && <MuscleDot muscle={ex.muscle} />}
        <div className="grow">
          <h3 className="ex-title">{ex?.name ?? 'Exercício removido'}</h3>
          <small className="muted">
            {ex?.equipment}
            {e.repMin && e.repMax ? ` · meta ${e.repMin}–${e.repMax} reps` : ''} · <Icon name="timer" size={12} /> {fmtRest(e.restSec)}
          </small>
        </div>
        <button className="icon-btn" onClick={onMenu} aria-label="Opções do exercício">
          <Icon name="dots" />
        </button>
      </div>

      {sug && (
        <div className={`hint${sug.up ? ' up' : ''}`}>
          <Icon name={sug.up ? 'arrowUp' : 'target'} size={14} />
          {sug.up ? (
            <span>
              Suba para <b>{fmtKg(sug.weight)}</b> — {sug.reason}
            </span>
          ) : (
            <span>
              Mantenha <b>{fmtKg(sug.weight)}</b> e {sug.reason}
            </span>
          )}
        </div>
      )}
      {e.notes ? <p className="ex-note">📝 {e.notes}</p> : null}
      {ex?.notes ? <p className="ex-note muted">💡 {ex.notes}</p> : null}

      <div className="set-head">
        <span>Série</span>
        <span>Anterior</span>
        <span>kg</span>
        <span>Reps</span>
        <span />
      </div>
      {rows.map(({ s, j, label, p, phW, phR }) => (
        <SetRow key={s.id} s={s} label={label} prev={p} phW={phW} phR={phR} index={index} j={j} onToggle={() => toggle(j, phW, phR)} onMenu={() => onSetMenu(j)} />
      ))}
      <button
        className="btn ghost block sm mt-sm"
        onClick={() =>
          updateActive((x) => {
            const sets = x.exercises[index].sets
            const last = sets[sets.length - 1]
            sets.push({ ...newSet(last?.type === 'warmup' ? 'normal' : last?.type ?? 'normal') })
          })
        }
      >
        <Icon name="plus" size={16} /> Série
      </button>
    </section>
  )
}

function SetRow({ s, label, prev, phW, phR, index, j, onToggle, onMenu }: { s: WorkoutSet; label: string; prev?: WorkoutSet; phW: number | null; phR: number | null; index: number; j: number; onToggle: () => void; onMenu: () => void }) {
  const set = (patch: Partial<WorkoutSet>) => updateActive((x) => Object.assign(x.exercises[index].sets[j], patch))
  return (
    <div className={`set-row${s.done ? ' done' : ''} t-${s.type}`}>
      <button className="set-num" onClick={onMenu} aria-label="Opções da série">
        {label}
      </button>
      <span className="set-prev">{prev ? `${prev.weight != null ? fmt(prev.weight) : 'PC'}×${prev.reps ?? '-'}` : '—'}</span>
      <NumInput value={s.weight} placeholder={phW != null ? fmt(phW) : 'kg'} onChange={(v) => set({ weight: v })} ariaLabel="Carga" />
      <NumInput decimal={false} value={s.reps} placeholder={phR != null ? String(phR) : 'reps'} onChange={(v) => set({ reps: v })} ariaLabel="Repetições" />
      <button className="set-check" onClick={onToggle} aria-label={s.done ? 'Desmarcar série' : 'Concluir série'}>
        <Icon name="check" size={20} stroke={3} />
      </button>
    </div>
  )
}

function ExerciseMenu({ index, w, onClose, onReplace }: { index: number | null; w: Workout; onClose: () => void; onReplace: (i: number) => void }) {
  const exMap = useExMap()
  const [notes, setNotes] = useState<string | null>(null)
  if (index == null) return null
  const e = w.exercises[index]
  if (!e) return null
  const move = (d: number) =>
    updateActive((x) => {
      const j = index + d
      if (j < 0 || j >= x.exercises.length) return
      ;[x.exercises[index], x.exercises[j]] = [x.exercises[j], x.exercises[index]]
    })
  return (
    <Sheet
      open
      onClose={() => {
        setNotes(null)
        onClose()
      }}
      title={exName(exMap.get(e.exerciseId))}
    >
      {notes != null ? (
        <>
          <textarea rows={4} autoFocus value={notes} onChange={(ev) => setNotes(ev.target.value)} placeholder="Ex.: banco na posição 4, pegada aberta" />
          <button
            className="btn primary block mt"
            onClick={() => {
              updateActive((x) => void (x.exercises[index].notes = notes))
              setNotes(null)
              onClose()
            }}
          >
            Salvar nota
          </button>
        </>
      ) : (
        <>
          <div className="field">
            <span>Descanso entre séries</span>
            <div className="chips wrap">
              {REST_OPTIONS.map((r) => (
                <button key={r} className={`chip${e.restSec === r ? ' on' : ''}`} onClick={() => updateActive((x) => void (x.exercises[index].restSec = r))}>
                  {fmtRest(r)}
                </button>
              ))}
            </div>
          </div>
          <MenuItem icon="note" label="Anotação" sub={e.notes || undefined} onClick={() => setNotes(e.notes ?? '')} />
          <MenuItem icon="plus" label="Adicionar série de aquecimento" onClick={() => (updateActive((x) => void x.exercises[index].sets.unshift(newSet('warmup'))), onClose())} />
          <MenuItem icon="swap" label="Substituir exercício" onClick={() => onReplace(index)} />
          <MenuItem icon="up" label="Mover para cima" onClick={() => (move(-1), onClose())} />
          <MenuItem icon="down" label="Mover para baixo" onClick={() => (move(1), onClose())} />
          <MenuItem
            icon="trash"
            danger
            label="Remover exercício"
            onClick={() => {
              updateActive((x) => void x.exercises.splice(index, 1))
              onClose()
            }}
          />
        </>
      )}
    </Sheet>
  )
}

function SetMenu({ target, w, onClose }: { target: { e: number; s: number } | null; w: Workout; onClose: () => void }) {
  if (!target) return null
  const s = w.exercises[target.e]?.sets[target.s]
  if (!s) return null
  const upd = (patch: Partial<WorkoutSet>) => updateActive((x) => Object.assign(x.exercises[target.e].sets[target.s], patch))
  return (
    <Sheet open onClose={onClose} title="Série">
      <div className="field">
        <span>Tipo</span>
        <div className="chips wrap">
          {(Object.keys(TYPE_LABEL) as SetType[]).map((t) => (
            <button key={t} className={`chip${s.type === t ? ' on' : ''}`} onClick={() => upd({ type: t })}>
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Esforço percebido (RPE)</span>
        <div className="chips wrap">
          {[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((r) => (
            <button key={r} className={`chip${s.rpe === r ? ' on' : ''}`} onClick={() => upd({ rpe: s.rpe === r ? null : r })}>
              {fmt(r)}
            </button>
          ))}
        </div>
        <small className="muted">10 = falha total · 8 = sobravam ~2 reps</small>
      </div>
      <MenuItem
        icon="copy"
        label="Duplicar série"
        onClick={() => {
          updateActive((x) => void x.exercises[target.e].sets.splice(target.s + 1, 0, { ...s, id: crypto.randomUUID(), done: false }))
          onClose()
        }}
      />
      <MenuItem
        icon="trash"
        danger
        label="Remover série"
        onClick={() => {
          updateActive((x) => void x.exercises[target.e].sets.splice(target.s, 1))
          onClose()
        }}
      />
    </Sheet>
  )
}

/* ---------------- Barra de descanso ---------------- */

export function RestBar({ raised }: { raised: boolean }) {
  const { rest, settings } = useApp()
  const now = useNow(250)
  const remaining = rest ? Math.ceil((rest.endsAt - now) / 1000) : 0

  useEffect(() => {
    if (rest && remaining <= 0) {
      if (settings.vibrate) navigator.vibrate?.([300, 120, 300, 120, 500])
      if (settings.sound) beep()
      stopRest()
    }
  }, [rest, remaining, settings.vibrate, settings.sound])

  if (!rest || remaining <= 0) return null
  const pct = Math.max(0, Math.min(1, (rest.endsAt - now) / (rest.total * 1000)))
  return (
    <div className={`restbar${raised ? ' raised' : ''}`}>
      <div className="restbar-fill" style={{ width: `${pct * 100}%` }} />
      <div className="restbar-content">
        <span className="restbar-label">Descanso</span>
        <strong>{fmtClock(remaining)}</strong>
        <div className="row gap-sm">
          <button onClick={() => adjustRest(-15)}>−15</button>
          <button onClick={() => adjustRest(15)}>+15</button>
          <button className="skip" onClick={stopRest}>
            Pular
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Mini barra (treino minimizado) ---------------- */

export function ActiveMini() {
  const { active } = useApp()
  const nav = useNav()
  const now = useNow(1000)
  if (!active) return null
  return (
    <button className="active-mini" onClick={nav.openWorkout}>
      <span className="pulse" />
      <span className="grow">
        <b>{active.name}</b>
        <small>Treino em andamento · toque para voltar</small>
      </span>
      <strong>{fmtClock((now - active.startedAt) / 1000)}</strong>
    </button>
  )
}

/* ---------------- Resumo ---------------- */

const PR_LABEL = { carga: 'Carga máxima', '1rm': '1RM estimado', volume: 'Volume', reps: 'Repetições' }

export function Summary({ w, onClose }: { w: Workout | null; onClose: () => void }) {
  const exMap = useExMap()
  const { workouts } = useApp()
  if (!w) return null
  const count = workouts.length
  return (
    <Sheet
      open
      onClose={onClose}
      footer={
        <button className="btn primary block" onClick={onClose}>
          Fechar
        </button>
      }
    >
      <div className="summary">
        <div className="summary-trophy">
          <Icon name="trophy" size={40} />
        </div>
        <h2>Treino concluído!</h2>
        <p className="muted">
          {w.name} · seu {count}º treino registrado
        </p>
        <div className="grid3 mt">
          <div className="stat">
            <span className="stat-label">Duração</span>
            <strong>{fmtDuration((w.finishedAt ?? Date.now()) - w.startedAt)}</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Volume</span>
            <strong>{fmtVolume(workoutVolume(w))}</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Séries</span>
            <strong>{workoutSets(w)}</strong>
          </div>
        </div>
        {w.prs && w.prs.length > 0 && (
          <div className="mt">
            <h3 className="section-title">🏆 Novos recordes ({w.prs.length})</h3>
            <div className="list">
              {w.prs.map((p, i) => (
                <div key={i} className="list-row static">
                  <span className="grow">
                    {exMap.get(p.exerciseId)?.name}
                    <small>{PR_LABEL[p.kind]}</small>
                  </span>
                  <span className="pr-val">
                    {p.kind === 'reps' ? p.value : p.kind === 'volume' ? fmtVolume(p.value) : fmtKg(+p.value.toFixed(1))}
                    <small> antes {p.kind === 'reps' ? p.previous : p.kind === 'volume' ? fmtVolume(p.previous) : fmtKg(+p.previous.toFixed(1))}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  )
}

export { PR_LABEL }
