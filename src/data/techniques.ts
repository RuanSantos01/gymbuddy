import type { Technique } from '../types'

export interface TechniqueInfo {
  id: Technique
  label: string
  /** código curto exibido no selo do exercício */
  code: string
  how: string
  /** quantos exercícios seguidos formam o bloco (bi-set = 2) */
  group?: number
}

export const TECHNIQUES: TechniqueInfo[] = [
  { id: 'tradicional', label: 'Tradicional', code: 'TRAD', how: 'Séries retas com descanso completo entre elas.' },
  { id: 'biset', label: 'Bi-set', code: 'BI', group: 2, how: 'Este exercício e o próximo em sequência, sem descanso entre eles. Descanse só ao fim do par.' },
  { id: 'triset', label: 'Tri-set', code: 'TRI', group: 3, how: 'Três exercícios seguidos sem descanso. Descanse só ao fim do terceiro.' },
  { id: 'superserie', label: 'Super-série', code: 'SS', group: 2, how: 'Par de músculos antagonistas (ex.: bíceps e tríceps) feito em sequência, sem descanso entre eles.' },
  { id: 'dropset', label: 'Drop-set', code: 'DROP', how: 'Ao chegar na falha, reduza 20–30% da carga e continue sem descanso. Registre cada queda como série "Drop".' },
  { id: 'restpause', label: 'Rest-pause', code: 'R-P', how: 'Vá até a falha, pause 10–20 s e faça mais repetições com a mesma carga. Repita 2–3 vezes.' },
  { id: 'piramide-cresc', label: 'Pirâmide crescente', code: 'PIR+', how: 'Aumente a carga e reduza as repetições a cada série (ex.: 12-10-8-6).' },
  { id: 'piramide-decresc', label: 'Pirâmide decrescente', code: 'PIR−', how: 'Comece pela carga mais alta e reduza a cada série, subindo as repetições.' },
  { id: 'cluster', label: 'Cluster set', code: 'CLU', how: 'Divida a série em mini-blocos (ex.: 4×2 reps) com 15–30 s de pausa, carga alta.' },
  { id: 'negativa', label: 'Excêntrica / negativa', code: 'NEG', how: 'Desça a carga de forma controlada em 3–5 s. Foco total na fase excêntrica.' },
  { id: 'isometria', label: 'Isometria', code: 'ISO', how: 'Segure a contração no ponto de maior tensão por 2–5 s em cada repetição.' },
  { id: 'parciais', label: 'Parciais', code: 'PARC', how: 'Após a falha na amplitude completa, continue com repetições parciais.' },
  { id: 'fst7', label: 'FST-7', code: 'FST7', how: '7 séries de 8–12 reps com 30–45 s de descanso, buscando o máximo de congestão.' },
  { id: 'gvt', label: 'GVT (10×10)', code: '10×10', how: '10 séries de 10 repetições com ~60% do 1RM e descanso de 60–90 s.' },
  { id: 'metodo21', label: 'Método 21', code: '21', how: '7 reps na metade inferior, 7 na superior e 7 completas, sem pausa.' },
  { id: 'unilateral', label: 'Unilateral', code: 'UNI', how: 'Um lado de cada vez. Registre a carga de um lado e as reps por lado.' },
]

export const TECH: Record<Technique, TechniqueInfo> = Object.fromEntries(TECHNIQUES.map((t) => [t.id, t])) as Record<Technique, TechniqueInfo>

export const CADENCES = ['2-0-1-0', '3-0-1-0', '3-1-1-0', '4-0-1-0', '2-1-2-1', '3-0-X-0']

/**
 * Posição de cada exercício dentro de blocos (bi-set, tri-set, super-série).
 * Retorna, para cada índice, o rótulo do bloco, a posição (1..n) e o tamanho.
 */
export function groupInfo(list: { technique?: Technique }[]) {
  const out: ({ label: string; pos: number; size: number; code: string } | null)[] = list.map(() => null)
  let i = 0
  while (i < list.length) {
    const t = list[i].technique ? TECH[list[i].technique!] : undefined
    if (t?.group) {
      const size = Math.min(t.group, list.length - i)
      if (size > 1) {
        for (let k = 0; k < size; k++) out[i + k] = { label: t.label, pos: k + 1, size, code: t.code }
        i += size
        continue
      }
    }
    i++
  }
  return out
}
