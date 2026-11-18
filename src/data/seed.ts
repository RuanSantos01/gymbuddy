import type { Exercise, Muscle, Routine } from '../types'

const list: [string, string, Muscle, string][] = [
  // Peito
  ['supino-reto-barra', 'Supino reto', 'Peito', 'Barra'],
  ['supino-reto-halter', 'Supino reto', 'Peito', 'Halteres'],
  ['supino-incl-barra', 'Supino inclinado', 'Peito', 'Barra'],
  ['supino-incl-halter', 'Supino inclinado', 'Peito', 'Halteres'],
  ['supino-decl', 'Supino declinado', 'Peito', 'Barra'],
  ['supino-maquina', 'Supino máquina', 'Peito', 'Máquina'],
  ['crucifixo-halter', 'Crucifixo', 'Peito', 'Halteres'],
  ['crossover', 'Crossover', 'Peito', 'Polia'],
  ['peck-deck', 'Peck deck (voador)', 'Peito', 'Máquina'],
  ['flexao', 'Flexão de braço', 'Peito', 'Peso corporal'],
  // Costas
  ['puxada-frontal', 'Puxada frontal', 'Costas', 'Polia'],
  ['barra-fixa', 'Barra fixa', 'Costas', 'Peso corporal'],
  ['remada-curvada', 'Remada curvada', 'Costas', 'Barra'],
  ['remada-unilateral', 'Remada unilateral', 'Costas', 'Halter'],
  ['remada-baixa', 'Remada baixa', 'Costas', 'Polia'],
  ['remada-cavalinho', 'Remada cavalinho', 'Costas', 'Barra T'],
  ['pulldown', 'Pulldown braço estendido', 'Costas', 'Polia'],
  ['terra', 'Levantamento terra', 'Costas', 'Barra'],
  ['pullover', 'Pullover', 'Costas', 'Halter'],
  // Ombros
  ['desenv-halter', 'Desenvolvimento', 'Ombros', 'Halteres'],
  ['desenv-militar', 'Desenvolvimento militar', 'Ombros', 'Barra'],
  ['desenv-maquina', 'Desenvolvimento máquina', 'Ombros', 'Máquina'],
  ['elev-lateral', 'Elevação lateral', 'Ombros', 'Halteres'],
  ['elev-lateral-polia', 'Elevação lateral', 'Ombros', 'Polia'],
  ['elev-frontal', 'Elevação frontal', 'Ombros', 'Halteres'],
  ['crucifixo-inverso', 'Crucifixo inverso', 'Ombros', 'Máquina'],
  ['face-pull', 'Face pull', 'Ombros', 'Polia'],
  ['encolhimento', 'Encolhimento', 'Ombros', 'Halteres'],
  // Bíceps
  ['rosca-direta', 'Rosca direta', 'Bíceps', 'Barra'],
  ['rosca-alternada', 'Rosca alternada', 'Bíceps', 'Halteres'],
  ['rosca-martelo', 'Rosca martelo', 'Bíceps', 'Halteres'],
  ['rosca-scott', 'Rosca Scott', 'Bíceps', 'Barra W'],
  ['rosca-polia', 'Rosca na polia', 'Bíceps', 'Polia'],
  ['rosca-concentrada', 'Rosca concentrada', 'Bíceps', 'Halter'],
  // Tríceps
  ['triceps-corda', 'Tríceps pulley (corda)', 'Tríceps', 'Polia'],
  ['triceps-barra', 'Tríceps pulley (barra)', 'Tríceps', 'Polia'],
  ['triceps-testa', 'Tríceps testa', 'Tríceps', 'Barra W'],
  ['triceps-frances', 'Tríceps francês', 'Tríceps', 'Halter'],
  ['mergulho', 'Mergulho (paralelas)', 'Tríceps', 'Peso corporal'],
  ['triceps-coice', 'Tríceps coice', 'Tríceps', 'Halter'],
  ['supino-fechado', 'Supino fechado', 'Tríceps', 'Barra'],
  // Quadríceps
  ['agachamento', 'Agachamento livre', 'Quadríceps', 'Barra'],
  ['agachamento-frontal', 'Agachamento frontal', 'Quadríceps', 'Barra'],
  ['leg-press', 'Leg press 45°', 'Quadríceps', 'Máquina'],
  ['hack', 'Hack squat', 'Quadríceps', 'Máquina'],
  ['extensora', 'Cadeira extensora', 'Quadríceps', 'Máquina'],
  ['bulgaro', 'Agachamento búlgaro', 'Quadríceps', 'Halteres'],
  ['afundo', 'Afundo', 'Quadríceps', 'Halteres'],
  ['smith', 'Agachamento no Smith', 'Quadríceps', 'Smith'],
  // Posterior
  ['mesa-flexora', 'Mesa flexora', 'Posterior', 'Máquina'],
  ['cadeira-flexora', 'Cadeira flexora', 'Posterior', 'Máquina'],
  ['stiff', 'Stiff', 'Posterior', 'Barra'],
  ['terra-romeno', 'Terra romeno', 'Posterior', 'Halteres'],
  ['good-morning', 'Good morning', 'Posterior', 'Barra'],
  // Glúteos
  ['hip-thrust', 'Elevação pélvica', 'Glúteos', 'Barra'],
  ['abducao', 'Abdução de quadril', 'Glúteos', 'Máquina'],
  ['gluteo-polia', 'Glúteo na polia', 'Glúteos', 'Polia'],
  ['sumo', 'Agachamento sumô', 'Glúteos', 'Halter'],
  // Panturrilha
  ['pant-pe', 'Panturrilha em pé', 'Panturrilha', 'Máquina'],
  ['pant-sentado', 'Panturrilha sentado', 'Panturrilha', 'Máquina'],
  ['pant-leg', 'Panturrilha no leg press', 'Panturrilha', 'Máquina'],
  // Abdômen
  ['crunch', 'Abdominal crunch', 'Abdômen', 'Peso corporal'],
  ['abd-polia', 'Abdominal na polia', 'Abdômen', 'Polia'],
  ['elev-pernas', 'Elevação de pernas', 'Abdômen', 'Peso corporal'],
  ['prancha', 'Prancha (segundos)', 'Abdômen', 'Peso corporal'],
  ['russian-twist', 'Russian twist', 'Abdômen', 'Anilha'],
  ['roda', 'Roda abdominal', 'Abdômen', 'Roda'],
  // Antebraço
  ['rosca-punho', 'Rosca de punho', 'Antebraço', 'Barra'],
  ['farmer', 'Caminhada do fazendeiro', 'Antebraço', 'Halteres'],
]

export function seedExercises(): Exercise[] {
  return list.map(([id, name, muscle, equipment]) => ({ id, name, muscle, equipment }))
}

const r = (exerciseId: string, sets: number, repMin: number, repMax: number, restSec = 90) => ({
  exerciseId,
  sets,
  repMin,
  repMax,
  restSec,
})

export function seedRoutines(): Routine[] {
  return [
    {
      id: 'rt-a',
      name: 'A — Peito e Tríceps',
      color: '#b4f53c',
      exercises: [
        r('supino-reto-barra', 4, 6, 10, 120),
        r('supino-incl-halter', 3, 8, 12),
        r('crossover', 3, 10, 15, 60),
        r('triceps-corda', 3, 10, 12, 60),
        r('triceps-frances', 3, 10, 12, 60),
      ],
    },
    {
      id: 'rt-b',
      name: 'B — Costas e Bíceps',
      color: '#4da3ff',
      exercises: [
        r('puxada-frontal', 4, 8, 12),
        r('remada-curvada', 4, 6, 10, 120),
        r('remada-baixa', 3, 10, 12),
        r('rosca-direta', 3, 8, 12, 60),
        r('rosca-martelo', 3, 10, 12, 60),
      ],
    },
    {
      id: 'rt-c',
      name: 'C — Pernas e Ombros',
      color: '#ff8a3d',
      exercises: [
        r('agachamento', 4, 6, 10, 150),
        r('leg-press', 3, 10, 12, 120),
        r('mesa-flexora', 3, 10, 12),
        r('desenv-halter', 3, 8, 12),
        r('elev-lateral', 3, 12, 15, 60),
        r('pant-pe', 4, 10, 15, 60),
      ],
    },
  ]
}

export const ROUTINE_COLORS = ['#b4f53c', '#4da3ff', '#ff8a3d', '#c77dff', '#ff5d8f', '#2ee6c5', '#ffd23f', '#9aa4b2']

export const MUSCLE_COLORS: Record<Muscle, string> = {
  Peito: '#ff5d8f',
  Costas: '#4da3ff',
  Ombros: '#ffd23f',
  Bíceps: '#c77dff',
  Tríceps: '#a78bfa',
  Quadríceps: '#ff8a3d',
  Posterior: '#f97316',
  Glúteos: '#fb7185',
  Panturrilha: '#2ee6c5',
  Abdômen: '#b4f53c',
  Antebraço: '#9aa4b2',
}
