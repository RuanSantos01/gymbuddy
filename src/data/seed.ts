import type { Exercise, Muscle, Routine } from '../types'

// [id, nome, grupo, equipamento, id da imagem na free-exercise-db (domínio público)]
const list: [string, string, Muscle, string, string][] = [
  // Peito
  ['supino-reto-barra', 'Supino reto', 'Peito', 'Barra', 'Barbell_Bench_Press_-_Medium_Grip'],
  ['supino-reto-halter', 'Supino reto', 'Peito', 'Halteres', 'Dumbbell_Bench_Press'],
  ['supino-incl-barra', 'Supino inclinado', 'Peito', 'Barra', 'Barbell_Incline_Bench_Press_-_Medium_Grip'],
  ['supino-incl-halter', 'Supino inclinado', 'Peito', 'Halteres', 'Incline_Dumbbell_Press'],
  ['supino-decl', 'Supino declinado', 'Peito', 'Barra', 'Decline_Barbell_Bench_Press'],
  ['supino-decl-halter', 'Supino declinado', 'Peito', 'Halteres', 'Decline_Dumbbell_Bench_Press'],
  ['supino-maquina', 'Supino máquina', 'Peito', 'Máquina', 'Leverage_Chest_Press'],
  ['supino-incl-maquina', 'Supino inclinado máquina', 'Peito', 'Máquina', 'Leverage_Incline_Chest_Press'],
  ['supino-smith', 'Supino no Smith', 'Peito', 'Smith', 'Smith_Machine_Bench_Press'],
  ['crucifixo-halter', 'Crucifixo', 'Peito', 'Halteres', 'Dumbbell_Flyes'],
  ['crucifixo-incl', 'Crucifixo inclinado', 'Peito', 'Halteres', 'Incline_Dumbbell_Flyes'],
  ['crucifixo-polia', 'Crucifixo na polia', 'Peito', 'Polia', 'Flat_Bench_Cable_Flyes'],
  ['crossover', 'Crossover', 'Peito', 'Polia', 'Cable_Crossover'],
  ['crossover-baixo', 'Crossover de baixo', 'Peito', 'Polia', 'Low_Cable_Crossover'],
  ['peck-deck', 'Peck deck (voador)', 'Peito', 'Máquina', 'Butterfly'],
  ['flexao', 'Flexão de braço', 'Peito', 'Peso corporal', 'Pushups'],
  ['flexao-declinada', 'Flexão declinada', 'Peito', 'Peso corporal', 'Decline_Push-Up'],
  ['mergulho-peito', 'Mergulho (peito)', 'Peito', 'Peso corporal', 'Dips_-_Chest_Version'],
  // Costas
  ['puxada-frontal', 'Puxada frontal', 'Costas', 'Polia', 'Wide-Grip_Lat_Pulldown'],
  ['puxada-fechada', 'Puxada triângulo', 'Costas', 'Polia', 'V-Bar_Pulldown'],
  ['puxada-supinada', 'Puxada supinada', 'Costas', 'Polia', 'Underhand_Cable_Pulldowns'],
  ['puxada-unilateral', 'Puxada unilateral', 'Costas', 'Polia', 'One_Arm_Lat_Pulldown'],
  ['barra-fixa', 'Barra fixa', 'Costas', 'Peso corporal', 'Pullups'],
  ['barra-supinada', 'Barra fixa supinada', 'Costas', 'Peso corporal', 'Chin-Up'],
  ['remada-curvada', 'Remada curvada', 'Costas', 'Barra', 'Bent_Over_Barbell_Row'],
  ['remada-supinada', 'Remada curvada supinada', 'Costas', 'Barra', 'Reverse_Grip_Bent-Over_Rows'],
  ['remada-halteres', 'Remada curvada', 'Costas', 'Halteres', 'Bent_Over_Two-Dumbbell_Row'],
  ['remada-unilateral', 'Remada unilateral (serrote)', 'Costas', 'Halter', 'One-Arm_Dumbbell_Row'],
  ['remada-baixa', 'Remada baixa', 'Costas', 'Polia', 'Seated_Cable_Rows'],
  ['remada-cavalinho', 'Remada cavalinho', 'Costas', 'Barra T', 'T-Bar_Row_with_Handle'],
  ['remada-maquina', 'Remada máquina', 'Costas', 'Máquina', 'Leverage_Iso_Row'],
  ['remada-alta-maquina', 'Remada alta máquina', 'Costas', 'Máquina', 'Leverage_High_Row'],
  ['remada-invertida', 'Remada invertida', 'Costas', 'Peso corporal', 'Inverted_Row'],
  ['pulldown', 'Pulldown braço estendido', 'Costas', 'Polia', 'Straight-Arm_Pulldown'],
  ['pulldown-corda', 'Pulldown com corda', 'Costas', 'Polia', 'Rope_Straight-Arm_Pulldown'],
  ['pullover', 'Pullover', 'Costas', 'Halter', 'Bent-Arm_Dumbbell_Pullover'],
  ['terra', 'Levantamento terra', 'Costas', 'Barra', 'Barbell_Deadlift'],
  ['rack-pull', 'Terra parcial (rack pull)', 'Costas', 'Barra', 'Rack_Pulls'],
  ['hiperextensao', 'Hiperextensão lombar', 'Costas', 'Banco', 'Hyperextensions_Back_Extensions'],
  // Ombros
  ['desenv-halter', 'Desenvolvimento', 'Ombros', 'Halteres', 'Dumbbell_Shoulder_Press'],
  ['desenv-militar', 'Desenvolvimento militar', 'Ombros', 'Barra', 'Standing_Military_Press'],
  ['desenv-sentado-barra', 'Desenvolvimento sentado', 'Ombros', 'Barra', 'Seated_Barbell_Military_Press'],
  ['desenv-maquina', 'Desenvolvimento máquina', 'Ombros', 'Máquina', 'Leverage_Shoulder_Press'],
  ['arnold', 'Desenvolvimento Arnold', 'Ombros', 'Halteres', 'Arnold_Dumbbell_Press'],
  ['push-press', 'Push press', 'Ombros', 'Barra', 'Push_Press'],
  ['elev-lateral', 'Elevação lateral', 'Ombros', 'Halteres', 'Side_Lateral_Raise'],
  ['elev-lateral-polia', 'Elevação lateral', 'Ombros', 'Polia', 'Cable_Seated_Lateral_Raise'],
  ['elev-lateral-unilateral', 'Elevação lateral unilateral', 'Ombros', 'Halter', 'One-Arm_Side_Laterals'],
  ['elev-frontal', 'Elevação frontal', 'Ombros', 'Halteres', 'Front_Dumbbell_Raise'],
  ['crucifixo-inverso', 'Crucifixo inverso', 'Ombros', 'Máquina', 'Reverse_Machine_Flyes'],
  ['crucifixo-inverso-halter', 'Crucifixo inverso', 'Ombros', 'Halteres', 'Reverse_Flyes'],
  ['crucifixo-inverso-polia', 'Crucifixo inverso na polia', 'Ombros', 'Polia', 'Cable_Rear_Delt_Fly'],
  ['face-pull', 'Face pull', 'Ombros', 'Polia', 'Face_Pull'],
  ['remada-alta', 'Remada alta', 'Ombros', 'Barra', 'Smith_Machine_Upright_Row'],
  ['encolhimento', 'Encolhimento', 'Ombros', 'Halteres', 'Dumbbell_Shrug'],
  ['encolhimento-barra', 'Encolhimento', 'Ombros', 'Barra', 'Barbell_Shrug'],
  // Bíceps
  ['rosca-direta', 'Rosca direta', 'Bíceps', 'Barra', 'Barbell_Curl'],
  ['rosca-alternada', 'Rosca alternada', 'Bíceps', 'Halteres', 'Dumbbell_Alternate_Bicep_Curl'],
  ['rosca-inclinada', 'Rosca inclinada', 'Bíceps', 'Halteres', 'Incline_Dumbbell_Curl'],
  ['rosca-martelo', 'Rosca martelo', 'Bíceps', 'Halteres', 'Hammer_Curls'],
  ['rosca-martelo-corda', 'Rosca martelo na corda', 'Bíceps', 'Polia', 'Cable_Hammer_Curls_-_Rope_Attachment'],
  ['rosca-scott', 'Rosca Scott', 'Bíceps', 'Barra W', 'Preacher_Curl'],
  ['rosca-scott-maquina', 'Rosca Scott máquina', 'Bíceps', 'Máquina', 'Machine_Preacher_Curls'],
  ['rosca-polia', 'Rosca na polia', 'Bíceps', 'Polia', 'Standing_Biceps_Cable_Curl'],
  ['rosca-polia-alta', 'Rosca na polia alta', 'Bíceps', 'Polia', 'High_Cable_Curls'],
  ['rosca-concentrada', 'Rosca concentrada', 'Bíceps', 'Halter', 'Concentration_Curls'],
  ['rosca-spider', 'Rosca spider', 'Bíceps', 'Barra W', 'Spider_Curl'],
  ['rosca-inversa', 'Rosca inversa', 'Bíceps', 'Barra', 'Reverse_Barbell_Curl'],
  // Tríceps
  ['triceps-corda', 'Tríceps pulley (corda)', 'Tríceps', 'Polia', 'Triceps_Pushdown_-_Rope_Attachment'],
  ['triceps-barra', 'Tríceps pulley (barra)', 'Tríceps', 'Polia', 'Triceps_Pushdown'],
  ['triceps-v', 'Tríceps pulley (barra V)', 'Tríceps', 'Polia', 'Triceps_Pushdown_-_V-Bar_Attachment'],
  ['triceps-inverso', 'Tríceps pulley inverso', 'Tríceps', 'Polia', 'Reverse_Grip_Triceps_Pushdown'],
  ['triceps-testa', 'Tríceps testa', 'Tríceps', 'Barra W', 'EZ-Bar_Skullcrusher'],
  ['triceps-frances', 'Tríceps francês', 'Tríceps', 'Halter', 'Seated_Triceps_Press'],
  ['triceps-overhead-corda', 'Tríceps overhead na corda', 'Tríceps', 'Polia', 'Cable_Rope_Overhead_Triceps_Extension'],
  ['mergulho', 'Mergulho (paralelas)', 'Tríceps', 'Peso corporal', 'Dips_-_Triceps_Version'],
  ['mergulho-banco', 'Mergulho no banco', 'Tríceps', 'Peso corporal', 'Bench_Dips'],
  ['triceps-coice', 'Tríceps coice', 'Tríceps', 'Halter', 'Tricep_Dumbbell_Kickback'],
  ['supino-fechado', 'Supino fechado', 'Tríceps', 'Barra', 'Close-Grip_Barbell_Bench_Press'],
  // Quadríceps
  ['agachamento', 'Agachamento livre', 'Quadríceps', 'Barra', 'Barbell_Full_Squat'],
  ['agachamento-frontal', 'Agachamento frontal', 'Quadríceps', 'Barra', 'Front_Barbell_Squat'],
  ['agachamento-goblet', 'Agachamento goblet', 'Quadríceps', 'Halter', 'Goblet_Squat'],
  ['leg-press', 'Leg press 45°', 'Quadríceps', 'Máquina', 'Leg_Press'],
  ['leg-press-fechado', 'Leg press pés juntos', 'Quadríceps', 'Máquina', 'Narrow_Stance_Leg_Press'],
  ['hack', 'Hack squat', 'Quadríceps', 'Máquina', 'Hack_Squat'],
  ['extensora', 'Cadeira extensora', 'Quadríceps', 'Máquina', 'Leg_Extensions'],
  ['bulgaro', 'Agachamento búlgaro', 'Quadríceps', 'Halteres', 'Split_Squat_with_Dumbbells'],
  ['afundo', 'Afundo', 'Quadríceps', 'Halteres', 'Dumbbell_Lunges'],
  ['passada', 'Passada (avanço caminhando)', 'Quadríceps', 'Barra', 'Barbell_Walking_Lunge'],
  ['smith', 'Agachamento no Smith', 'Quadríceps', 'Smith', 'Smith_Machine_Squat'],
  ['agachamento-salto', 'Agachamento com salto', 'Quadríceps', 'Peso corporal', 'Freehand_Jump_Squat'],
  // Posterior
  ['mesa-flexora', 'Mesa flexora', 'Posterior', 'Máquina', 'Lying_Leg_Curls'],
  ['cadeira-flexora', 'Cadeira flexora', 'Posterior', 'Máquina', 'Seated_Leg_Curl'],
  ['stiff', 'Stiff', 'Posterior', 'Barra', 'Stiff-Legged_Barbell_Deadlift'],
  ['stiff-halter', 'Stiff', 'Posterior', 'Halteres', 'Stiff-Legged_Dumbbell_Deadlift'],
  ['terra-romeno', 'Terra romeno', 'Posterior', 'Barra', 'Romanian_Deadlift'],
  ['good-morning', 'Good morning', 'Posterior', 'Barra', 'Good_Morning'],
  ['flexao-nordica', 'Flexão nórdica', 'Posterior', 'Peso corporal', 'Natural_Glute_Ham_Raise'],
  // Glúteos
  ['hip-thrust', 'Elevação pélvica', 'Glúteos', 'Barra', 'Barbell_Hip_Thrust'],
  ['ponte-gluteo', 'Ponte de glúteo', 'Glúteos', 'Barra', 'Barbell_Glute_Bridge'],
  ['abducao', 'Cadeira abdutora', 'Glúteos', 'Máquina', 'Thigh_Abductor'],
  ['aducao', 'Cadeira adutora', 'Glúteos', 'Máquina', 'Thigh_Adductor'],
  ['gluteo-polia', 'Glúteo na polia (coice)', 'Glúteos', 'Polia', 'One-Legged_Cable_Kickback'],
  ['gluteo-quatro-apoios', 'Glúteo quatro apoios', 'Glúteos', 'Peso corporal', 'Glute_Kickback'],
  ['sumo', 'Agachamento sumô', 'Glúteos', 'Halter', 'Plie_Dumbbell_Squat'],
  ['agachamento-sumo', 'Agachamento sumô', 'Glúteos', 'Barra', 'Wide_Stance_Barbell_Squat'],
  ['terra-sumo', 'Levantamento terra sumô', 'Glúteos', 'Barra', 'Sumo_Deadlift'],
  ['afundo-reverso', 'Afundo reverso', 'Glúteos', 'Halteres', 'Dumbbell_Rear_Lunge'],
  // Panturrilha
  ['pant-pe', 'Panturrilha em pé', 'Panturrilha', 'Máquina', 'Standing_Calf_Raises'],
  ['pant-sentado', 'Panturrilha sentado', 'Panturrilha', 'Máquina', 'Seated_Calf_Raise'],
  ['pant-leg', 'Panturrilha no leg press', 'Panturrilha', 'Máquina', 'Calf_Press_On_The_Leg_Press_Machine'],
  ['pant-smith', 'Panturrilha no Smith', 'Panturrilha', 'Smith', 'Smith_Machine_Calf_Raise'],
  ['pant-burrinho', 'Panturrilha burrinho', 'Panturrilha', 'Máquina', 'Donkey_Calf_Raises'],
  // Abdômen
  ['crunch', 'Abdominal crunch', 'Abdômen', 'Peso corporal', 'Crunches'],
  ['abd-polia', 'Abdominal na polia', 'Abdômen', 'Polia', 'Cable_Crunch'],
  ['abd-maquina', 'Abdominal máquina', 'Abdômen', 'Máquina', 'Ab_Crunch_Machine'],
  ['abd-declinado', 'Abdominal declinado', 'Abdômen', 'Banco', 'Decline_Crunch'],
  ['abd-obliquo', 'Abdominal oblíquo', 'Abdômen', 'Peso corporal', 'Oblique_Crunches_-_On_The_Floor'],
  ['elev-pernas', 'Elevação de pernas', 'Abdômen', 'Peso corporal', 'Flat_Bench_Lying_Leg_Raise'],
  ['elev-pernas-barra', 'Elevação de pernas na barra', 'Abdômen', 'Peso corporal', 'Hanging_Leg_Raise'],
  ['prancha', 'Prancha (segundos)', 'Abdômen', 'Peso corporal', 'Plank'],
  ['prancha-lateral', 'Prancha lateral (segundos)', 'Abdômen', 'Peso corporal', 'Side_Bridge'],
  ['russian-twist', 'Russian twist', 'Abdômen', 'Anilha', 'Russian_Twist'],
  ['roda', 'Roda abdominal', 'Abdômen', 'Roda', 'Ab_Roller'],
  ['pallof', 'Pallof press', 'Abdômen', 'Polia', 'Pallof_Press'],
  ['dead-bug', 'Dead bug', 'Abdômen', 'Peso corporal', 'Dead_Bug'],
  ['escalador', 'Escalador (mountain climber)', 'Abdômen', 'Peso corporal', 'Mountain_Climbers'],
  // Antebraço
  ['rosca-punho', 'Rosca de punho', 'Antebraço', 'Barra', 'Seated_Palm-Up_Barbell_Wrist_Curl'],
  ['rosca-punho-inversa', 'Rosca de punho inversa', 'Antebraço', 'Barra', 'Seated_Palms-Down_Barbell_Wrist_Curl'],
  ['farmer', 'Caminhada do fazendeiro', 'Antebraço', 'Halteres', 'Farmers_Walk'],
]

const IMG: Record<string, string> = Object.fromEntries(list.map(([id, , , , img]) => [id, img]))

/** Caminhos das duas fotos (início e fim do movimento) ou null para exercícios sem imagem */
export function exerciseImages(id: string): [string, string] | null {
  const k = IMG[id]
  if (!k) return null
  const base = `${import.meta.env.BASE_URL}ex/${k}/`
  return [`${base}0.jpg`, `${base}1.jpg`]
}

export const IMAGE_SOURCES = list.map((l) => l[4])

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
      color: ROUTINE_COLORS[0],
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
      color: ROUTINE_COLORS[1],
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
      color: ROUTINE_COLORS[2],
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

export const ROUTINE_COLORS = ['#ff4d1f', '#e8e2d4', '#7fa0a8', '#d9a441', '#9b8bb8', '#6f9a6a', '#c46a5a', '#8a8f98']

// Tons sóbrios para não brigar com a cor de destaque
export const MUSCLE_COLORS: Record<Muscle, string> = {
  Peito: '#ff4d1f',
  Costas: '#7fa0a8',
  Ombros: '#d9a441',
  Bíceps: '#c46a5a',
  Tríceps: '#9b8bb8',
  Quadríceps: '#e8e2d4',
  Posterior: '#b08968',
  Glúteos: '#d08c7a',
  Panturrilha: '#6f9a6a',
  Abdômen: '#a3a89a',
  Antebraço: '#8a8f98',
}
