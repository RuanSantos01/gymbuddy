import { useMemo, useState } from 'react'
import { ExerciseForm, FilterBar, MuscleDot, useExerciseFilter } from '../components/ExercisePicker'
import { Icon } from '../components/Icon'
import { Empty, MenuItem, Segmented, Sheet, TopBar, useNav } from '../components/ui'
import { deleteRoutine, saveRoutine, useApp, useExMap } from '../store'
import type { Routine } from '../types'
import { relDays, uid } from '../utils'

export function RoutinesTab() {
  const [view, setView] = useState<'routines' | 'library'>('routines')
  return (
    <div className="page">
      <TopBar title="Treinos" />
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'routines', label: 'Rotinas' },
          { value: 'library', label: 'Exercícios' },
        ]}
      />
      {view === 'routines' ? <RoutineList /> : <Library />}
    </div>
  )
}

function RoutineList() {
  const { routines, workouts } = useApp()
  const exMap = useExMap()
  const nav = useNav()
  const [menu, setMenu] = useState<Routine | null>(null)
  const lastDone = useMemo(() => {
    const m = new Map<string, number>()
    for (const w of workouts) if (w.routineId && !m.has(w.routineId)) m.set(w.routineId, w.startedAt)
    return m
  }, [workouts])

  return (
    <>
      <button className="btn ghost block mt" onClick={() => nav.begin()}>
        <Icon name="bolt" size={18} /> Treino livre (sem rotina)
      </button>
      {routines.length === 0 && <Empty icon="dumbbell" title="Nenhuma rotina" text="Monte seu treino A, B, C… e inicie com um toque." />}
      <div className="stack mt">
        {routines.map((r) => (
          <div key={r.id} className="card routine-card" style={{ ['--rc' as string]: r.color }}>
            <div className="row" onClick={() => nav.push({ name: 'routine', id: r.id })}>
              <div className="grow">
                <h3>{r.name}</h3>
                <small className="muted">
                  {r.exercises.length} exercícios · {r.exercises.reduce((a, e) => a + e.sets, 0)} séries
                  {lastDone.has(r.id) ? ` · ${relDays(lastDone.get(r.id)!)}` : ' · nunca feito'}
                </small>
              </div>
              <button
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenu(r)
                }}
                aria-label="Opções"
              >
                <Icon name="dots" />
              </button>
            </div>
            <p className="routine-ex" onClick={() => nav.push({ name: 'routine', id: r.id })}>
              {r.exercises.map((e) => exMap.get(e.exerciseId)?.name ?? '?').join(' · ')}
            </p>
            <button className="btn primary block" onClick={() => nav.begin({ routine: r })}>
              <Icon name="play" size={16} /> Iniciar
            </button>
          </div>
        ))}
      </div>
      <button className="btn block mt" onClick={() => nav.push({ name: 'routine' })}>
        <Icon name="plus" size={18} /> Nova rotina
      </button>

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu?.name}>
        {menu && (
          <>
            <MenuItem icon="edit" label="Editar" onClick={() => (setMenu(null), nav.push({ name: 'routine', id: menu.id }))} />
            <MenuItem
              icon="copy"
              label="Duplicar"
              onClick={() => {
                saveRoutine({ ...structuredClone(menu), id: uid(), name: `${menu.name} (cópia)` })
                setMenu(null)
              }}
            />
            <MenuItem
              icon="trash"
              danger
              label="Excluir rotina"
              onClick={() => {
                if (confirm(`Excluir “${menu.name}”? O histórico de treinos é mantido.`)) deleteRoutine(menu.id)
                setMenu(null)
              }}
            />
          </>
        )}
      </Sheet>
    </>
  )
}

function Library() {
  const { exercises, workouts } = useApp()
  const nav = useNav()
  const f = useExerciseFilter(exercises)
  const [creating, setCreating] = useState(false)
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const w of workouts) for (const e of w.exercises) m.set(e.exerciseId, (m.get(e.exerciseId) ?? 0) + 1)
    return m
  }, [workouts])

  return (
    <>
      <div className="mt">
        <FilterBar {...f} />
      </div>
      <button className="list-row add-row" onClick={() => setCreating(true)}>
        <Icon name="plus" size={18} /> Criar exercício personalizado
      </button>
      <div className="list">
        {f.list.map((e) => (
          <button key={e.id} className="list-row" onClick={() => nav.push({ name: 'exercise', id: e.id })}>
            <MuscleDot muscle={e.muscle} />
            <span className="grow">
              {e.name}
              <small>
                {e.muscle} · {e.equipment}
                {e.custom ? ' · personalizado' : ''}
              </small>
            </span>
            {counts.get(e.id) ? <span className="pill">{counts.get(e.id)}×</span> : null}
            <Icon name="right" size={18} className="muted" />
          </button>
        ))}
        {f.list.length === 0 && <p className="muted center pad">Nenhum exercício encontrado.</p>}
      </div>
      <ExerciseForm open={creating} initialName={f.q} onClose={() => setCreating(false)} />
    </>
  )
}
