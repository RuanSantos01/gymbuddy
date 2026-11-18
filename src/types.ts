export const MUSCLES = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Quadríceps',
  'Posterior',
  'Glúteos',
  'Panturrilha',
  'Abdômen',
  'Antebraço',
] as const
export type Muscle = (typeof MUSCLES)[number]

export interface Exercise {
  id: string
  name: string
  muscle: Muscle
  equipment: string
  custom?: boolean
  notes?: string
}

export type Technique =
  | 'tradicional'
  | 'biset'
  | 'triset'
  | 'superserie'
  | 'dropset'
  | 'restpause'
  | 'piramide-cresc'
  | 'piramide-decresc'
  | 'cluster'
  | 'negativa'
  | 'isometria'
  | 'parciais'
  | 'fst7'
  | 'gvt'
  | 'metodo21'
  | 'unilateral'

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure'

export interface WorkoutSet {
  id: string
  weight: number | null
  reps: number | null
  rpe?: number | null
  type: SetType
  done: boolean
  /** quando a série foi concluída (ms) */
  doneAt?: number
  /** descanso cronometrado depois desta série (s) */
  rest?: number
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  sets: WorkoutSet[]
  restSec: number
  repMin?: number
  repMax?: number
  notes?: string
  technique?: Technique
  cadence?: string
}

export type PrKind = 'carga' | '1rm' | 'volume' | 'reps'

export interface Pr {
  exerciseId: string
  kind: PrKind
  value: number
  previous: number
}

export interface Workout {
  id: string
  name: string
  routineId?: string
  startedAt: number
  finishedAt?: number
  exercises: WorkoutExercise[]
  notes?: string
  prs?: Pr[]
}

export interface RoutineExercise {
  exerciseId: string
  sets: number
  repMin: number
  repMax: number
  restSec: number
  technique?: Technique
  cadence?: string
}

export interface Routine {
  id: string
  name: string
  color: string
  exercises: RoutineExercise[]
}

export const MEASURES = ['Braço', 'Antebraço', 'Peito', 'Cintura', 'Quadril', 'Coxa', 'Panturrilha', 'Pescoço'] as const
export type Measure = (typeof MEASURES)[number]

export interface BodyEntry {
  id: string
  date: number
  weight?: number | null
  bodyFat?: number | null
  measures: Partial<Record<Measure, number>>
  notes?: string
}

export interface Settings {
  name: string
  heightCm: number | null
  weeklyGoal: number
  restDefault: number
  increment: number
  barWeight: number
  sound: boolean
  vibrate: boolean
  keepAwake: boolean
  /** manual: cronômetro que você controla · auto: contagem regressiva ao concluir a série */
  restMode: 'manual' | 'auto'
  /** no modo manual, iniciar o cronômetro sozinho ao concluir uma série */
  watchAutoStart: boolean
}

export interface RestTimer {
  endsAt: number
  total: number
}

/** Cronômetro manual de descanso. running: startedAt definido */
export interface Stopwatch {
  startedAt: number | null
  /** tempo acumulado antes do último início (ms) */
  acc: number
  /** descanso alvo do exercício, para referência (s) */
  target: number
}

export interface State {
  version: 1
  exercises: Exercise[]
  routines: Routine[]
  workouts: Workout[]
  active: Workout | null
  body: BodyEntry[]
  settings: Settings
  rest: RestTimer | null
  watch: Stopwatch | null
  /** exercícios da biblioteca que a pessoa apagou (não voltam em atualizações) */
  removed: string[]
}
