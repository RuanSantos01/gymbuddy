import { useMemo, useState } from 'react'
import { ExThumb } from '../components/ExerciseMedia'
import { TechBadge } from '../components/TechniquePicker'
import { Icon } from '../components/Icon'
import { Empty, MenuItem, Sheet, TopBar, useNav } from '../components/ui'
import { deleteWorkout, routineFromWorkout, updateWorkout, useApp, useExMap } from '../store'
import { fmt, fmtClock, fmtDate, fmtDuration, fmtKg, fmtVolume, workoutSets, workoutVolume } from '../utils'
import { PR_LABEL } from './Workout'

export function HistoryTab() {
  const { workouts } = useApp()
  const exMap = useExMap()
  const nav = useNav()
  const groups = useMemo(() => {
    const g: { key: string; label: string; items: typeof workouts; vol: number }[] = []
    for (const w of workouts) {
      const d = new Date(w.startedAt)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      let grp = g[g.length - 1]
      if (!grp || grp.key !== key) {
        grp = { key, label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), items: [], vol: 0 }
        g.push(grp)
      }
      grp.items.push(w)
      grp.vol += workoutVolume(w)
    }
    return g
  }, [workouts])

  return (
    <div className="page">
      <TopBar title="Histórico" sub={`${workouts.length} treinos registrados`} />
      {workouts.length === 0 && <Empty icon="history" title="Nenhum treino ainda" text="Finalize seu primeiro treino e ele aparece aqui." action={<button className="btn primary mt" onClick={() => nav.setTab('routines')}>Ver rotinas</button>} />}
      {groups.map((g) => (
        <section key={g.key}>
          <h2 className="section-title cap">
            {g.label} <small className="muted">· {g.items.length} treinos · {fmtVolume(g.vol)}</small>
          </h2>
          <div className="stack">
            {g.items.map((w) => (
              <button key={w.id} className="card hist-card" onClick={() => nav.push({ name: 'workout', id: w.id })}>
                <div className="row">
                  <div className="date-badge">
                    <b>{new Date(w.startedAt).getDate()}</b>
                    <small>{fmtDate(w.startedAt, { weekday: 'short' })}</small>
                  </div>
                  <div className="grow">
                    <h3>{w.name}</h3>
                    <small className="muted">
                      {fmtDuration((w.finishedAt ?? w.startedAt) - w.startedAt)} · {fmtVolume(workoutVolume(w))} · {workoutSets(w)} séries
                    </small>
                  </div>
                  {!!w.prs?.length && (
                    <span className="pill gold">
                      <Icon name="trophy" size={13} /> {w.prs.length}
                    </span>
                  )}
                </div>
                <ul className="hist-ex">
                  {w.exercises.slice(0, 4).map((e) => {
                    const best = e.sets.reduce((a, s) => ((s.weight ?? 0) > (a?.weight ?? -1) ? s : a), e.sets[0])
                    return (
                      <li key={e.id}>
                        <span>
                          {e.sets.length}× {exMap.get(e.exerciseId)?.name ?? '?'}
                        </span>
                        <span className="muted">{best ? `${best.weight != null ? fmt(best.weight) + 'kg' : 'PC'} × ${best.reps}` : ''}</span>
                      </li>
                    )
                  })}
                  {w.exercises.length > 4 && <li className="muted">+{w.exercises.length - 4} exercícios</li>}
                </ul>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

const TYPE_TAG = { warmup: 'A', drop: 'D', failure: 'F', normal: '' }

export function WorkoutDetail({ id }: { id: string }) {
  const { workouts } = useApp()
  const exMap = useExMap()
  const nav = useNav()
  const [menu, setMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const w = workouts.find((x) => x.id === id)
  const [name, setName] = useState(w?.name ?? '')
  const [notes, setNotes] = useState(w?.notes ?? '')
  if (!w) return <div className="page"><TopBar back title="Treino" /><Empty icon="history" title="Treino não encontrado" /></div>

  return (
    <div className="page">
      <TopBar
        back
        title={w.name}
        sub={fmtDate(w.startedAt, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
        right={
          <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Opções">
            <Icon name="dots" />
          </button>
        }
      />
      <div className="grid3">
        <div className="stat">
          <span className="stat-label">Duração</span>
          <strong>{fmtDuration((w.finishedAt ?? w.startedAt) - w.startedAt)}</strong>
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

      {(() => {
        const rests = w.exercises.flatMap((e) => e.sets.map((s) => s.rest ?? 0)).filter(Boolean)
        return rests.length ? (
          <p className="muted tiny mt-sm rest-summary">
            Descanso médio {fmtClock(Math.round(rests.reduce((a, b) => a + b, 0) / rests.length))} · {rests.length} {rests.length > 1 ? 'descansos cronometrados' : 'descanso cronometrado'}
          </p>
        ) : null
      })()}

      {w.notes && (
        <p className="card note mt">
          <span className="label">Anotações</span>
          {w.notes}
        </p>
      )}

      {!!w.prs?.length && (
        <div className="card mt pr-box">
          {w.prs.map((p, i) => (
            <div key={i} className="row">
              <Icon name="trophy" size={16} className="gold" />
              <span className="grow">
                {exMap.get(p.exerciseId)?.name} <small className="muted">· {PR_LABEL[p.kind]}</small>
              </span>
              <b>{p.kind === 'reps' ? p.value : p.kind === 'volume' ? fmtVolume(p.value) : fmtKg(+p.value.toFixed(1))}</b>
            </div>
          ))}
        </div>
      )}

      <div className="stack mt">
        {w.exercises.map((e) => {
          const ex = exMap.get(e.exerciseId)
          let n = 0
          return (
            <section key={e.id} className="card">
              <button className="row plain" onClick={() => nav.push({ name: 'exercise', id: e.exerciseId })}>
                <ExThumb ex={ex} size={40} />
                <h3 className="grow">
                  {ex?.name ?? 'Exercício removido'} <TechBadge t={e.technique} />
                </h3>
                <Icon name="chart" size={18} className="muted" />
              </button>
              {e.notes && (
                <p className="ex-note">
                  <span className="label">Nota</span>
                  {e.notes}
                </p>
              )}
              <table className="sets-table">
                <tbody>
                  {e.sets.map((s) => (
                    <tr key={s.id} className={`t-${s.type}`}>
                      <td className="muted">{s.type === 'normal' ? ++n : TYPE_TAG[s.type]}</td>
                      <td>
                        <b>{s.weight != null ? `${fmt(s.weight)} kg` : 'Peso corporal'}</b> × {s.reps}
                      </td>
                      <td className="muted right">
                        {s.rpe ? `RPE ${fmt(s.rpe)}` : ''}
                        {s.rpe && s.rest ? ' · ' : ''}
                        {s.rest ? `desc. ${fmtClock(s.rest)}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )
        })}
      </div>

      <button className="btn primary block mt" onClick={() => nav.begin({ from: w })}>
        <Icon name="repeat" size={18} /> Repetir este treino
      </button>

      <Sheet open={menu} onClose={() => setMenu(false)} title="Opções">
        <MenuItem icon="edit" label="Editar nome e anotações" onClick={() => (setMenu(false), setEditing(true))} />
        <MenuItem icon="repeat" label="Repetir treino" onClick={() => (setMenu(false), nav.begin({ from: w }))} />
        <MenuItem
          icon="copy"
          label="Salvar como rotina"
          onClick={() => {
            const r = routineFromWorkout(w)
            setMenu(false)
            nav.push({ name: 'routine', id: r.id })
          }}
        />
        <MenuItem
          icon="trash"
          danger
          label="Excluir treino"
          onClick={() => {
            if (confirm('Excluir este treino do histórico? Não é possível desfazer.')) {
              deleteWorkout(w.id)
              setMenu(false)
              nav.pop()
            }
          }}
        />
      </Sheet>

      <Sheet
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar treino"
        footer={
          <button
            className="btn primary block"
            onClick={() => {
              updateWorkout(w.id, { name: name.trim() || w.name, notes })
              setEditing(false)
            }}
          >
            Salvar
          </button>
        }
      >
        <label className="field">
          <span>Nome</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>Anotações</span>
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </Sheet>
    </div>
  )
}
