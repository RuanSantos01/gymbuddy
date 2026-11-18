import { useMemo } from 'react'
import { BarChart, HBars } from '../components/Charts'
import { Icon } from '../components/Icon'
import { Ring, useNav } from '../components/ui'
import { MUSCLE_COLORS } from '../data/seed'
import { useApp, useExMap } from '../store'
import type { Muscle, Workout } from '../types'
import { DAY, WEEK, dayKey, fmt, fmtDate, fmtDuration, fmtVolume, isWorking, relDays, startOfDay, startOfWeek, workoutVolume } from '../utils'
import { PR_LABEL } from './Workout'

export function weekCounts(workouts: Workout[]) {
  const m = new Map<number, number>()
  for (const w of workouts) {
    const k = startOfWeek(w.startedAt)
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
}

export function Home() {
  const { workouts, routines, settings, active, body } = useApp()
  const exMap = useExMap()
  const nav = useNav()
  const now = Date.now()
  const thisWeek = startOfWeek(now)

  const stats = useMemo(() => {
    const wc = weekCounts(workouts)
    const doneThisWeek = wc.get(thisWeek) ?? 0
    // sequência de semanas batendo a meta (semana atual conta se já bateu)
    let streak = 0
    let wk = doneThisWeek >= settings.weeklyGoal ? thisWeek : thisWeek - WEEK
    while ((wc.get(wk) ?? 0) >= settings.weeklyGoal) {
      streak++
      wk = startOfWeek(wk - 3 * DAY)
    }
    const volWeek = (start: number) => workouts.filter((w) => w.startedAt >= start && w.startedAt < start + WEEK).reduce((a, w) => a + workoutVolume(w), 0)
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const s = startOfWeek(thisWeek - (7 - i) * WEEK + DAY)
      return { label: fmtDate(s, { day: '2-digit', month: '2-digit' }), value: volWeek(s), highlight: s === thisWeek }
    })
    const vThis = volWeek(thisWeek)
    const vPrev = volWeek(startOfWeek(thisWeek - DAY))
    const muscles = new Map<Muscle, number>()
    for (const w of workouts) {
      if (w.startedAt < now - 30 * DAY) break
      for (const e of w.exercises) {
        const m = exMap.get(e.exerciseId)?.muscle
        if (m) muscles.set(m, (muscles.get(m) ?? 0) + e.sets.filter(isWorking).length)
      }
    }
    const lastByRoutine = new Map<string, number>()
    for (const w of workouts) if (w.routineId && !lastByRoutine.has(w.routineId)) lastByRoutine.set(w.routineId, w.startedAt)
    const next = [...routines].sort((a, b) => (lastByRoutine.get(a.id) ?? 0) - (lastByRoutine.get(b.id) ?? 0))[0]
    const prs = workouts.flatMap((w) => (w.prs ?? []).filter((p) => p.kind !== 'volume').map((p) => ({ ...p, date: w.startedAt }))).slice(0, 5)
    return { doneThisWeek, streak, weeks, vThis, vPrev, muscles, next, lastByRoutine, prs }
  }, [workouts, routines, settings.weeklyGoal, exMap, thisWeek, now])

  const heat = useMemo(() => {
    const days = new Map<string, number>()
    for (const w of workouts) days.set(dayKey(w.startedAt), (days.get(dayKey(w.startedAt)) ?? 0) + 1)
    const start = thisWeek - 15 * WEEK
    return Array.from({ length: 16 }, (_, c) =>
      Array.from({ length: 7 }, (_, r) => {
        const ts = startOfDay(start + (c * 7 + r) * DAY + 3 * 3600_000)
        return { ts, n: days.get(dayKey(ts)) ?? 0, future: ts > now }
      }),
    )
  }, [workouts, thisWeek, now])

  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const last = workouts[0]
  const delta = stats.vPrev ? ((stats.vThis - stats.vPrev) / stats.vPrev) * 100 : null
  const latestWeight = body.find((b) => b.weight != null)

  return (
    <div className="page">
      <header className="home-head">
        <div>
          <small className="muted">{fmtDate(now, { weekday: 'long', day: 'numeric', month: 'long' })}</small>
          <h1>
            {hello}
            {settings.name ? `, ${settings.name}` : ''}
          </h1>
        </div>
        <button className="icon-btn" onClick={() => nav.push({ name: 'settings' })} aria-label="Configurações">
          <Icon name="settings" />
        </button>
      </header>

      {active && (
        <button className="card resume" onClick={nav.openWorkout}>
          <span className="pulse" />
          <span className="grow">
            <b>Continuar treino</b>
            <small>
              {active.name} · iniciado {fmtDuration(now - active.startedAt)} atrás
            </small>
          </span>
          <Icon name="right" />
        </button>
      )}

      <section className="card week-card">
        <Ring value={stats.doneThisWeek} max={settings.weeklyGoal}>
          <strong>{stats.doneThisWeek}</strong>
          <small>/{settings.weeklyGoal}</small>
        </Ring>
        <div className="grow">
          <h3>Meta da semana</h3>
          <p className="muted">
            {stats.doneThisWeek >= settings.weeklyGoal
              ? 'Meta da semana cumprida.'
              : `Faltam ${settings.weeklyGoal - stats.doneThisWeek} treino${settings.weeklyGoal - stats.doneThisWeek > 1 ? 's' : ''}`}
          </p>
          <div className="row gap-sm mt-sm wrap">
            <span className="pill flame">
              <Icon name="flame" size={14} /> {stats.streak} sem. seguidas
            </span>
            <span className="pill">
              {fmtVolume(stats.vThis)}
              {delta != null && <b className={delta >= 0 ? 'up' : 'down'}> {delta >= 0 ? '▲' : '▼'}{fmt(Math.abs(delta), 0)}%</b>}
            </span>
          </div>
        </div>
      </section>

      <h2 className="section-title">Começar treino</h2>
      {stats.next && (
        <button className="card next-card" style={{ ['--rc' as string]: stats.next.color }} onClick={() => nav.begin({ routine: stats.next })}>
          <span className="grow">
            <small className="muted">Sugestão de hoje</small>
            <b>{stats.next.name}</b>
            <small className="muted">
              {stats.next.exercises.length} exercícios ·{' '}
              {stats.lastByRoutine.has(stats.next.id) ? `último ${relDays(stats.lastByRoutine.get(stats.next.id)!)}` : 'ainda não feito'}
            </small>
          </span>
          <span className="play-btn">
            <Icon name="play" size={20} />
          </span>
        </button>
      )}
      <div className="chips scroll-x mt-sm">
        {routines
          .filter((r) => r.id !== stats.next?.id)
          .map((r) => (
            <button key={r.id} className="chip routine-chip" style={{ ['--rc' as string]: r.color }} onClick={() => nav.begin({ routine: r })}>
              <i className="dot" style={{ background: r.color }} /> {r.name}
            </button>
          ))}
        <button className="chip" onClick={() => nav.begin()}>
          <Icon name="bolt" size={14} /> Livre
        </button>
      </div>

      <h2 className="section-title">Frequência · 16 semanas</h2>
      <section className="card">
        <div className="heatmap">
          {heat.map((col, c) => (
            <div key={c} className="heat-col">
              {col.map((d) => (
                <i key={d.ts} className={`heat l${Math.min(d.n, 2)}${d.future ? ' future' : ''}${startOfDay(now) === d.ts ? ' today' : ''}`} title={fmtDate(d.ts)} />
              ))}
            </div>
          ))}
        </div>
        <div className="row muted tiny mt-sm">
          <span className="grow">{workouts.length} treinos no total</span>
          <span>{workouts.filter((w) => w.startedAt >= now - 30 * DAY).length} nos últimos 30 dias</span>
        </div>
      </section>

      {workouts.length > 0 && (
        <>
          <h2 className="section-title">Volume semanal</h2>
          <section className="card">
            <BarChart data={stats.weeks} format={(v) => (v >= 1000 ? `${fmt(v / 1000, 1)}t` : fmt(v, 0))} />
          </section>

          {stats.muscles.size > 0 && (
            <>
              <h2 className="section-title">Séries por músculo · 30 dias</h2>
              <section className="card">
                <HBars
                  data={[...stats.muscles.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([m, v]) => ({ label: m, value: v, color: MUSCLE_COLORS[m] }))}
                />
              </section>
            </>
          )}

          {stats.prs.length > 0 && (
            <>
              <h2 className="section-title">Recordes recentes</h2>
              <div className="list card flush">
                {stats.prs.map((p, i) => (
                  <button key={i} className="list-row" onClick={() => nav.push({ name: 'exercise', id: p.exerciseId })}>
                    <Icon name="trophy" size={18} className="gold" />
                    <span className="grow">
                      {exMap.get(p.exerciseId)?.name}
                      <small>
                        {PR_LABEL[p.kind]} · {relDays(p.date)}
                      </small>
                    </span>
                    <b>{p.kind === 'reps' ? `${p.value} reps` : `${fmt(p.value)} kg`}</b>
                  </button>
                ))}
              </div>
            </>
          )}

          {last && (
            <>
              <h2 className="section-title">Último treino</h2>
              <button className="card last-card" onClick={() => nav.push({ name: 'workout', id: last.id })}>
                <span className="grow">
                  <b>{last.name}</b>
                  <small className="muted">
                    {relDays(last.startedAt)} · {fmtDuration((last.finishedAt ?? last.startedAt) - last.startedAt)} · {fmtVolume(workoutVolume(last))}
                  </small>
                </span>
                <Icon name="right" />
              </button>
            </>
          )}
        </>
      )}

      <div className="grid2 mt">
        <button className="card tile" onClick={() => nav.push({ name: 'body' })}>
          <Icon name="scale" />
          <b>{latestWeight?.weight ? `${fmt(latestWeight.weight)} kg` : 'Peso'}</b>
          <small className="muted">{latestWeight ? relDays(latestWeight.date) : 'Registrar medidas'}</small>
        </button>
        <button className="card tile" onClick={() => nav.push({ name: 'tools' })}>
          <Icon name="calc" />
          <b>Ferramentas</b>
          <small className="muted">1RM, anilhas, timer</small>
        </button>
      </div>
    </div>
  )
}
