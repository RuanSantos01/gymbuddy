import { useMemo, useState } from 'react'
import { LineChart, Sparkline } from '../components/Charts'
import { ExerciseForm, MuscleDot } from '../components/ExercisePicker'
import { Icon } from '../components/Icon'
import { Empty, Segmented, Stat, TopBar, useNav } from '../components/ui'
import { deleteExercise, exerciseHistory, useApp, useExMap } from '../store'
import { fmt, fmtDate, fmtKg, fmtVolume, isWorking, relDays } from '../utils'

export function ProgressTab() {
  const { workouts, body } = useApp()
  const exMap = useExMap()
  const nav = useNav()
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const ids = new Map<string, number>()
    for (const w of workouts) for (const e of w.exercises) if (!ids.has(e.exerciseId)) ids.set(e.exerciseId, w.startedAt)
    return [...ids.entries()]
      .map(([id, last]) => {
        const h = exerciseHistory(workouts, id)
        const best = Math.max(...h.map((s) => s.bestE1rm))
        const first = h[0]?.bestE1rm ?? 0
        return { id, last, h, best, gain: first ? ((h[h.length - 1].bestE1rm - first) / first) * 100 : 0 }
      })
      .filter((r) => exMap.has(r.id) && (!q || exMap.get(r.id)!.name.toLowerCase().includes(q.toLowerCase())))
  }, [workouts, exMap, q])

  const weights = body.filter((b) => b.weight != null).slice().reverse()
  const lastW = weights[weights.length - 1]
  const firstW = weights[0]

  return (
    <div className="page">
      <TopBar title="Progresso" />

      <button className="card body-card" onClick={() => nav.push({ name: 'body' })}>
        <Icon name="scale" />
        <span className="grow">
          <b>Corpo e medidas</b>
          <small className="muted">
            {lastW
              ? `${fmt(lastW.weight!)} kg${firstW && firstW !== lastW ? ` · ${lastW.weight! - firstW.weight! >= 0 ? '+' : ''}${fmt(lastW.weight! - firstW.weight!)} kg desde ${fmtDate(firstW.date, { day: '2-digit', month: 'short' })}` : ''}`
              : 'Registre peso, % gordura e medidas'}
          </small>
        </span>
        <Sparkline values={weights.map((b) => b.weight!)} color="var(--blue)" />
      </button>

      <h2 className="section-title">Exercícios</h2>
      {rows.length === 0 && !q ? (
        <Empty icon="chart" title="Sem dados ainda" text="Seus gráficos de evolução de carga aparecem aqui depois dos primeiros treinos." />
      ) : (
        <>
          <div className="search">
            <Icon name="search" size={18} />
            <input placeholder="Filtrar exercícios" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="list card flush mt-sm">
            {rows.map((r) => {
              const ex = exMap.get(r.id)!
              return (
                <button key={r.id} className="list-row" onClick={() => nav.push({ name: 'exercise', id: r.id })}>
                  <MuscleDot muscle={ex.muscle} />
                  <span className="grow">
                    {ex.name}
                    <small>
                      1RM est. {fmtKg(+r.best.toFixed(1))} · {r.h.length} sessões · {relDays(r.last)}
                    </small>
                  </span>
                  <span className="spark-col">
                    <Sparkline values={r.h.slice(-12).map((s) => s.bestE1rm)} />
                    {r.h.length > 1 && <small className={r.gain >= 0 ? 'up' : 'down'}>{r.gain >= 0 ? '+' : ''}{fmt(r.gain, 0)}%</small>}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

type Metric = 'e1rm' | 'weight' | 'volume' | 'reps'

export function ExerciseDetail({ id }: { id: string }) {
  const { workouts } = useApp()
  const exMap = useExMap()
  const nav = useNav()
  const ex = exMap.get(id)
  const [metric, setMetric] = useState<Metric>('e1rm')
  const [editing, setEditing] = useState(false)
  const h = useMemo(() => exerciseHistory(workouts, id), [workouts, id])

  const records = useMemo(() => {
    const sets = h.flatMap((s) => s.sets.filter(isWorking).map((x) => ({ ...x, date: s.date })))
    const repMax = [1, 2, 3, 5, 8, 10, 12, 15].map((r) => {
      const c = sets.filter((s) => (s.reps ?? 0) >= r && s.weight != null).sort((a, b) => b.weight! - a.weight!)[0]
      return { r, w: c?.weight ?? null, date: c?.date }
    })
    return {
      maxWeight: Math.max(0, ...h.map((s) => s.maxWeight)),
      bestE1rm: Math.max(0, ...h.map((s) => s.bestE1rm)),
      bestVol: Math.max(0, ...h.map((s) => s.volume)),
      maxReps: Math.max(0, ...h.map((s) => s.maxReps)),
      totalSets: sets.length,
      repMax,
    }
  }, [h])

  if (!ex) return <div className="page"><TopBar back title="Exercício" /><Empty icon="dumbbell" title="Exercício não encontrado" /></div>

  const points = h.map((s) => ({
    x: s.date,
    y: metric === 'e1rm' ? s.bestE1rm : metric === 'weight' ? s.maxWeight : metric === 'volume' ? s.volume : s.maxReps,
  }))

  return (
    <div className="page">
      <TopBar
        back
        title={ex.name}
        sub={`${ex.muscle} · ${ex.equipment}`}
        right={
          <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Editar exercício">
            <Icon name="edit" />
          </button>
        }
      />
      {ex.notes && <p className="card note">💡 {ex.notes}</p>}

      {h.length === 0 ? (
        <Empty icon="chart" title="Ainda sem registros" text="Faça este exercício em um treino para ver sua evolução." />
      ) : (
        <>
          <Segmented
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'e1rm', label: '1RM est.' },
              { value: 'weight', label: 'Carga' },
              { value: 'volume', label: 'Volume' },
              { value: 'reps', label: 'Reps' },
            ]}
          />
          <section className="card mt-sm">
            <LineChart points={points} unit={metric === 'reps' ? 'reps' : 'kg'} digits={metric === 'volume' ? 0 : 1} />
          </section>

          <div className="grid2 mt">
            <Stat label="Carga máxima" value={fmtKg(records.maxWeight)} accent />
            <Stat label="1RM estimado" value={fmtKg(+records.bestE1rm.toFixed(1))} sub="fórmula de Epley" />
            <Stat label="Melhor volume" value={fmtVolume(records.bestVol)} sub="em uma sessão" />
            <Stat label="Máx. repetições" value={records.maxReps} sub={`${h.length} sessões · ${records.totalSets} séries`} />
          </div>

          <h2 className="section-title">Recordes por repetição</h2>
          <div className="card rm-grid">
            {records.repMax.map((r) => (
              <div key={r.r}>
                <small className="muted">{r.r}RM</small>
                <b>{r.w != null ? fmt(r.w) : '—'}</b>
                <small className="muted tiny">{r.date ? fmtDate(r.date, { day: '2-digit', month: '2-digit' }) : ''}</small>
              </div>
            ))}
          </div>

          <h2 className="section-title">Sessões</h2>
          <div className="stack">
            {h
              .slice()
              .reverse()
              .map((s) => (
                <button key={s.workoutId + s.date} className="card session" onClick={() => nav.push({ name: 'workout', id: s.workoutId })}>
                  <div className="row">
                    <b className="grow">{fmtDate(s.date)}</b>
                    <small className="muted">
                      1RM {fmt(s.bestE1rm)} · {fmtVolume(s.volume)}
                    </small>
                  </div>
                  <div className="set-chips">
                    {s.sets.map((x) => (
                      <span key={x.id} className={`set-chip t-${x.type}`}>
                        {x.weight != null ? fmt(x.weight) : 'PC'}×{x.reps}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
          </div>
        </>
      )}

      {ex.custom && (
        <button
          className="btn danger-ghost block mt-lg"
          onClick={() => {
            if (confirm('Excluir este exercício personalizado? Ele será removido das rotinas (o histórico continua).')) {
              deleteExercise(ex.id)
              nav.pop()
            }
          }}
        >
          <Icon name="trash" size={18} /> Excluir exercício
        </button>
      )}
      <ExerciseForm open={editing} initial={ex} onClose={() => setEditing(false)} />
    </div>
  )
}
