import { useMemo, useSyncExternalStore } from 'react'
import { seedExercises, seedRoutines } from './data/seed'
import type { BodyEntry, Exercise, Pr, Routine, Settings, State, Workout, WorkoutExercise, WorkoutSet } from './types'
import { e1rm, isWorking, setVolume, uid } from './utils'

const KEY = 'gymbuddy:v1'

export const defaultSettings: Settings = {
  name: '',
  heightCm: null,
  weeklyGoal: 4,
  restDefault: 90,
  increment: 2.5,
  barWeight: 20,
  sound: true,
  vibrate: true,
  keepAwake: true,
  restMode: 'manual',
  watchAutoStart: false,
}

function initial(): State {
  return {
    version: 1,
    exercises: seedExercises(),
    routines: seedRoutines(),
    workouts: [],
    active: null,
    body: [],
    settings: { ...defaultSettings },
    rest: null,
    watch: null,
    removed: [],
  }
}

function hydrate(p: Partial<State>): State {
  const base = initial()
  // exercícios novos da biblioteca entram para quem já usava o app
  const have = new Set([...(p.exercises ?? []).map((e) => e.id), ...(p.removed ?? [])])
  const exercises = p.exercises ? [...p.exercises, ...base.exercises.filter((e) => !have.has(e.id))] : base.exercises
  // paleta antiga -> nova identidade visual
  const OLD: Record<string, string> = { '#b4f53c': '#ff4d1f', '#4da3ff': '#e8e2d4', '#ff8a3d': '#7fa0a8', '#c77dff': '#9b8bb8', '#ff5d8f': '#c46a5a', '#2ee6c5': '#6f9a6a', '#ffd23f': '#d9a441', '#9aa4b2': '#8a8f98' }
  const routines = p.routines?.map((r) => (OLD[r.color] ? { ...r, color: OLD[r.color] } : r))
  return {
    ...base,
    ...p,
    ...(routines ? { routines } : {}),
    exercises,
    watch: p.watch ?? null,
    removed: p.removed ?? [],
    version: 1,
    settings: { ...defaultSettings, ...(p.settings ?? {}) },
    workouts: [...(p.workouts ?? [])].sort((a, b) => b.startedAt - a.startedAt),
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return hydrate(JSON.parse(raw))
  } catch {
    /* dados corrompidos: começa do zero */
  }
  return initial()
}

let state: State = load()
const listeners = new Set<() => void>()
let saveTimer: number | undefined

export function flush() {
  clearTimeout(saveTimer)
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage cheio ou bloqueado */
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => document.hidden && flush())
}

export const getState = () => state

export function set(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === 'function' ? patch(state) : patch
  state = { ...state, ...p }
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(flush, 250)
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useApp = () => useSyncExternalStore(subscribe, getState)

export function useExMap() {
  const { exercises } = useApp()
  return useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])
}

export const exName = (ex: Exercise | undefined) => (ex ? `${ex.name}${ex.equipment ? ` (${ex.equipment})` : ''}` : 'Exercício removido')

/* ---------------- Histórico / estatísticas ---------------- */

/** Séries concluídas da última vez que o exercício foi feito. */
export function lastSetsFor(workouts: Workout[], exerciseId: string): WorkoutSet[] {
  for (const w of workouts) {
    const e = w.exercises.find((x) => x.exerciseId === exerciseId)
    if (e) return e.sets.filter((s) => s.done)
  }
  return []
}

export interface ExSession {
  workoutId: string
  date: number
  sets: WorkoutSet[]
  maxWeight: number
  bestE1rm: number
  volume: number
  maxReps: number
}

export function sessionStats(sets: WorkoutSet[]) {
  const work = sets.filter((s) => s.done && isWorking(s))
  return {
    maxWeight: Math.max(0, ...work.map((s) => s.weight ?? 0)),
    bestE1rm: Math.max(0, ...work.map((s) => e1rm(s.weight ?? 0, s.reps ?? 0))),
    volume: work.reduce((a, s) => a + setVolume(s), 0),
    maxReps: Math.max(0, ...work.map((s) => s.reps ?? 0)),
  }
}

/** Sessões de um exercício, da mais antiga para a mais recente. */
export function exerciseHistory(workouts: Workout[], exerciseId: string): ExSession[] {
  const out: ExSession[] = []
  for (const w of workouts) {
    const sets = w.exercises.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets.filter((s) => s.done))
    if (!sets.length) continue
    out.push({ workoutId: w.id, date: w.startedAt, sets, ...sessionStats(sets) })
  }
  return out.reverse()
}

export interface Suggestion {
  weight: number
  up: boolean
  reason: string
}

/** Sobrecarga progressiva: se bateu o topo da faixa em todas as séries com a carga máxima, sobe a carga. */
export function suggest(prev: WorkoutSet[], repMax: number | undefined, increment: number): Suggestion | null {
  const work = prev.filter((s) => s.type === 'normal' && s.weight != null && s.reps != null)
  if (!work.length || !repMax) return null
  const top = Math.max(...work.map((s) => s.weight!))
  const atTop = work.filter((s) => s.weight === top)
  if (atTop.every((s) => (s.reps ?? 0) >= repMax)) {
    return { weight: +(top + increment).toFixed(2), up: true, reason: `bateu ${repMax} reps em todas as séries` }
  }
  return { weight: top, up: false, reason: `busque ${repMax} reps em todas as séries` }
}

function detectPRs(exercises: WorkoutExercise[], history: Workout[]): Pr[] {
  const prs: Pr[] = []
  const seen = new Set<string>()
  for (const e of exercises) {
    if (seen.has(e.exerciseId)) continue
    seen.add(e.exerciseId)
    const past = exerciseHistory(history, e.exerciseId)
    if (!past.length) continue
    const allSets = exercises.filter((x) => x.exerciseId === e.exerciseId).flatMap((x) => x.sets)
    const now = sessionStats(allSets)
    const best = (k: 'maxWeight' | 'bestE1rm' | 'volume' | 'maxReps') => Math.max(...past.map((p) => p[k]))
    const add = (kind: Pr['kind'], value: number, previous: number) => {
      if (value > previous + 0.001) prs.push({ exerciseId: e.exerciseId, kind, value, previous })
    }
    add('carga', now.maxWeight, best('maxWeight'))
    add('1rm', now.bestE1rm, best('bestE1rm'))
    add('volume', now.volume, best('volume'))
    if (now.maxWeight === 0) add('reps', now.maxReps, best('maxReps'))
  }
  return prs
}

/* ---------------- Ações ---------------- */

export const newSet = (type: WorkoutSet['type'] = 'normal'): WorkoutSet => ({ id: uid(), weight: null, reps: null, type, done: false })

export function startWorkout(opts: { routine?: Routine; from?: Workout } = {}) {
  const { routine, from } = opts
  let exercises: WorkoutExercise[] = []
  if (routine) {
    exercises = routine.exercises.map((re) => ({
      id: uid(),
      exerciseId: re.exerciseId,
      restSec: re.restSec,
      repMin: re.repMin,
      repMax: re.repMax,
      technique: re.technique,
      cadence: re.cadence,
      sets: Array.from({ length: re.sets }, () => newSet()),
    }))
  } else if (from) {
    exercises = from.exercises.map((e) => ({
      ...e,
      id: uid(),
      notes: '',
      sets: e.sets.map((s) => newSet(s.type)),
    }))
  }
  const now = new Date()
  const name = routine?.name ?? from?.name ?? (now.getHours() < 12 ? 'Treino da manhã' : now.getHours() < 18 ? 'Treino da tarde' : 'Treino da noite')
  set({
    active: { id: uid(), name, routineId: routine?.id ?? from?.routineId, startedAt: Date.now(), exercises },
    rest: null,
    watch: null,
  })
}

export function updateActive(fn: (w: Workout) => void) {
  if (!state.active) return
  const w = structuredClone(state.active)
  fn(w)
  set({ active: w })
}

export function finishWorkout(): Workout | null {
  const a = state.active
  if (!a) return null
  const exercises = a.exercises
    .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done && s.reps != null) }))
    .filter((e) => e.sets.length)
  if (!exercises.length) {
    set({ active: null, rest: null, watch: null })
    return null
  }
  const w: Workout = { ...a, exercises, finishedAt: Date.now(), prs: detectPRs(exercises, state.workouts) }
  set({ workouts: [w, ...state.workouts].sort((x, y) => y.startedAt - x.startedAt), active: null, rest: null, watch: null })
  return w
}

export const discardWorkout = () => set({ active: null, rest: null, watch: null })

export const deleteWorkout = (id: string) => set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) }))

export const updateWorkout = (id: string, patch: Partial<Workout>) =>
  set((s) => ({ workouts: s.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)) }))

export function saveRoutine(r: Routine) {
  set((s) => ({
    routines: s.routines.some((x) => x.id === r.id) ? s.routines.map((x) => (x.id === r.id ? r : x)) : [...s.routines, r],
  }))
}

export const deleteRoutine = (id: string) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) }))

export function routineFromWorkout(w: Workout): Routine {
  const r: Routine = {
    id: uid(),
    name: w.name,
    color: '#9b8bb8',
    exercises: w.exercises.map((e) => {
      const work = e.sets.filter(isWorking)
      const reps = work.map((s) => s.reps ?? 0)
      return {
        exerciseId: e.exerciseId,
        sets: Math.max(1, work.length),
        repMin: Math.max(1, Math.min(...reps, 8)),
        repMax: Math.max(...reps, 12),
        restSec: e.restSec,
        technique: e.technique,
        cadence: e.cadence,
      }
    }),
  }
  saveRoutine(r)
  return r
}

export function saveExercise(ex: Exercise) {
  set((s) => ({
    exercises: s.exercises.some((x) => x.id === ex.id) ? s.exercises.map((x) => (x.id === ex.id ? ex : x)) : [...s.exercises, ex],
  }))
}

export const deleteExercise = (id: string) =>
  set((s) => ({
    exercises: s.exercises.filter((e) => e.id !== id),
    removed: s.exercises.find((e) => e.id === id)?.custom ? s.removed : [...s.removed, id],
    routines: s.routines.map((r) => ({ ...r, exercises: r.exercises.filter((e) => e.exerciseId !== id) })),
  }))

export function saveBody(b: BodyEntry) {
  set((s) => ({
    body: (s.body.some((x) => x.id === b.id) ? s.body.map((x) => (x.id === b.id ? b : x)) : [...s.body, b]).sort((x, y) => y.date - x.date),
  }))
}

export const deleteBody = (id: string) => set((s) => ({ body: s.body.filter((b) => b.id !== id) }))

export const updateSettings = (p: Partial<Settings>) => set((s) => ({ settings: { ...s.settings, ...p } }))

export const startRest = (sec: number) => set({ rest: { endsAt: Date.now() + sec * 1000, total: sec } })

export function adjustRest(delta: number) {
  const r = state.rest
  if (!r) return
  const endsAt = Math.max(Date.now() + 1000, r.endsAt + delta * 1000)
  set({ rest: { endsAt, total: Math.max(r.total + delta, 1) } })
}

export const stopRest = () => set({ rest: null })

/* ---------------- Cronômetro manual ---------------- */

export const watchElapsed = (w: State['watch'], now = Date.now()) => (w ? w.acc + (w.startedAt ? now - w.startedAt : 0) : 0)

export const watchStart = (target?: number) =>
  set((s) => ({ watch: { startedAt: Date.now(), acc: s.watch && !s.watch.startedAt ? s.watch.acc : 0, target: target ?? s.watch?.target ?? s.settings.restDefault } }))

export const watchPause = () => set((s) => (s.watch?.startedAt ? { watch: { ...s.watch, acc: watchElapsed(s.watch), startedAt: null } } : {}))

export const watchReset = () => set({ watch: null })

/** Para o cronômetro e grava o tempo como descanso da última série concluída. Retorna os segundos gravados. */
export function watchMark(): number | null {
  const w = state.watch
  if (!w) return null
  const sec = Math.round(watchElapsed(w) / 1000)
  if (sec > 0) {
    updateActive((a) => {
      let last: WorkoutSet | null = null
      for (const e of a.exercises) for (const s of e.sets) if (s.done && s.doneAt && (!last || s.doneAt > (last.doneAt ?? 0))) last = s
      if (last) last.rest = sec
    })
  }
  set({ watch: null })
  return sec
}

export const exportData = () => JSON.stringify({ app: 'gymbuddy', exportedAt: new Date().toISOString(), ...state }, null, 2)

export function importData(json: string) {
  const p = JSON.parse(json)
  if (!p || !Array.isArray(p.exercises) || !Array.isArray(p.workouts)) throw new Error('Arquivo inválido')
  state = hydrate(p)
  flush()
  listeners.forEach((l) => l())
}

export function resetData() {
  state = initial()
  flush()
  listeners.forEach((l) => l())
}
