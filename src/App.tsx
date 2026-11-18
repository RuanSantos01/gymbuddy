import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon, type IconName } from './components/Icon'
import { NavCtx, type Nav, type Screen, type Tab } from './components/ui'
import { getState, startWorkout, useApp } from './store'
import type { Workout } from './types'
import { BodyScreen } from './screens/Body'
import { HistoryTab, WorkoutDetail } from './screens/History'
import { Home } from './screens/Home'
import { MoreTab, SettingsScreen } from './screens/More'
import { ExerciseDetail, ProgressTab } from './screens/Progress'
import { RoutineEditor } from './screens/RoutineEditor'
import { RoutinesTab } from './screens/Routines'
import { ToolsScreen } from './screens/Tools'
import { ActiveMini, RestBar, Summary, WorkoutScreen } from './screens/Workout'

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Início', icon: 'home' },
  { id: 'routines', label: 'Treinos', icon: 'dumbbell' },
  { id: 'history', label: 'Histórico', icon: 'history' },
  { id: 'progress', label: 'Progresso', icon: 'chart' },
  { id: 'more', label: 'Mais', icon: 'more' },
]

function renderScreen(s: Screen) {
  switch (s.name) {
    case 'routine':
      return <RoutineEditor id={s.id} />
    case 'exercise':
      return <ExerciseDetail id={s.id} />
    case 'workout':
      return <WorkoutDetail id={s.id} />
    case 'body':
      return <BodyScreen />
    case 'tools':
      return <ToolsScreen />
    case 'settings':
      return <SettingsScreen />
  }
}

export default function App() {
  const { active } = useApp()
  const [tab, setTab] = useState<Tab>('home')
  const [stack, setStack] = useState<{ key: number; s: Screen }[]>([])
  const [workoutOpen, setWorkoutOpen] = useState(false)
  const [summary, setSummary] = useState<Workout | null>(null)
  const keyRef = useRef(0)
  const live = useRef({ stack, workoutOpen })
  live.current = { stack, workoutOpen }

  // Botão "voltar" do Android/navegador fecha telas em vez de sair do app
  useEffect(() => {
    history.pushState({ gb: 1 }, '')
    const onPop = () => {
      const { stack, workoutOpen } = live.current
      if (workoutOpen) setWorkoutOpen(false)
      else if (stack.length) setStack((st) => st.slice(0, -1))
      else return
      history.pushState({ gb: 1 }, '')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab, stack.length])

  const nav = useMemo<Nav>(
    () => ({
      push: (s) => setStack((st) => [...st, { key: ++keyRef.current, s }]),
      pop: () => setStack((st) => st.slice(0, -1)),
      setTab: (t) => {
        setStack([])
        setTab(t)
      },
      begin: (opts) => {
        if (getState().active && !confirm('Já existe um treino em andamento. Descartá-lo e começar outro?')) {
          setWorkoutOpen(true)
          return
        }
        startWorkout(opts)
        setWorkoutOpen(true)
      },
      openWorkout: () => setWorkoutOpen(true),
      closeWorkout: () => setWorkoutOpen(false),
      showSummary: setSummary,
    }),
    [],
  )

  const showWorkout = workoutOpen && !!active

  return (
    <NavCtx.Provider value={nav}>
      <div className="app" style={{ display: showWorkout || stack.length ? 'none' : undefined }}>
        {tab === 'home' && <Home />}
        {tab === 'routines' && <RoutinesTab />}
        {tab === 'history' && <HistoryTab />}
        {tab === 'progress' && <ProgressTab />}
        {tab === 'more' && <MoreTab />}
      </div>

      {stack.map(({ key, s }, i) => (
        <div key={key} className="app screen" style={{ display: !showWorkout && i === stack.length - 1 ? undefined : 'none' }}>
          {renderScreen(s)}
        </div>
      ))}

      {showWorkout && (
        <div className="app">
          <WorkoutScreen />
        </div>
      )}

      {!showWorkout && (
        <nav className="tabbar">
          {active && <ActiveMini />}
          <div className="tabbar-inner">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id && !stack.length ? 'on' : ''} onClick={() => nav.setTab(t.id)}>
                <Icon name={t.icon} size={22} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      <RestBar raised={!showWorkout} />
      <Summary w={summary} onClose={() => setSummary(null)} />
    </NavCtx.Provider>
  )
}
