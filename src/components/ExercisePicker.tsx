import { useMemo, useState } from 'react'
import { MUSCLE_COLORS } from '../data/seed'
import { saveExercise, useApp } from '../store'
import { MUSCLES, type Exercise, type Muscle } from '../types'
import { uid } from '../utils'
import { ExThumb } from './ExerciseMedia'
import { Icon } from './Icon'
import { Sheet } from './ui'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function useExerciseFilter(exercises: Exercise[]) {
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState<Muscle | null>(null)
  const list = useMemo(() => {
    const nq = norm(q)
    return exercises
      .filter((e) => (!muscle || e.muscle === muscle) && (!nq || norm(`${e.name} ${e.equipment} ${e.muscle}`).includes(nq)))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [exercises, q, muscle])
  return { q, setQ, muscle, setMuscle, list }
}

export function FilterBar({ q, setQ, muscle, setMuscle }: { q: string; setQ: (s: string) => void; muscle: Muscle | null; setMuscle: (m: Muscle | null) => void }) {
  return (
    <div className="filterbar">
      <div className="search">
        <Icon name="search" size={18} />
        <input placeholder="Buscar exercício" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && (
          <button onClick={() => setQ('')} aria-label="Limpar">
            <Icon name="x" size={16} />
          </button>
        )}
      </div>
      <div className="chips scroll-x">
        <button className={`chip${!muscle ? ' on' : ''}`} onClick={() => setMuscle(null)}>
          Todos
        </button>
        {MUSCLES.map((m) => (
          <button key={m} className={`chip${muscle === m ? ' on' : ''}`} onClick={() => setMuscle(muscle === m ? null : m)}>
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}

export function MuscleDot({ muscle }: { muscle: Muscle }) {
  return <i className="dot" style={{ background: MUSCLE_COLORS[muscle] }} />
}

export function ExercisePicker({ open, onClose, onPick, multi = true }: { open: boolean; onClose: () => void; onPick: (ids: string[]) => void; multi?: boolean }) {
  const { exercises } = useApp()
  const f = useExerciseFilter(exercises)
  const [sel, setSel] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  const close = () => {
    setSel([])
    onClose()
  }
  const toggle = (id: string) => {
    if (!multi) {
      onPick([id])
      close()
      return
    }
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  return (
    <>
      <Sheet
        open={open && !creating}
        onClose={close}
        title={multi ? 'Adicionar exercícios' : 'Escolher exercício'}
        footer={
          multi && (
            <button
              className="btn primary block"
              disabled={!sel.length}
              onClick={() => {
                onPick(sel)
                close()
              }}
            >
              Adicionar {sel.length ? `(${sel.length})` : ''}
            </button>
          )
        }
      >
        <FilterBar {...f} />
        <button className="list-row add-row" onClick={() => setCreating(true)}>
          <Icon name="plus" size={18} /> Criar exercício {f.q && `“${f.q}”`}
        </button>
        <div className="list">
          {f.list.map((e) => {
            const i = sel.indexOf(e.id)
            return (
              <button key={e.id} className={`list-row ex-row${i >= 0 ? ' selected' : ''}`} onClick={() => toggle(e.id)}>
                <ExThumb ex={e} size={52} />
                <span className="grow">
                  {e.name}
                  <small>
                    {e.muscle} · {e.equipment}
                  </small>
                </span>
                {i >= 0 && <span className="badge">{i + 1}</span>}
              </button>
            )
          })}
        </div>
      </Sheet>
      <ExerciseForm
        open={creating}
        initialName={f.q}
        onClose={() => setCreating(false)}
        onSaved={(ex) => {
          setCreating(false)
          if (multi) setSel((s) => [...s, ex.id])
          else {
            onPick([ex.id])
            close()
          }
        }}
      />
    </>
  )
}

export function ExerciseForm({ open, onClose, onSaved, initial, initialName = '' }: { open: boolean; onClose: () => void; onSaved?: (e: Exercise) => void; initial?: Exercise; initialName?: string }) {
  return open ? <ExerciseFormInner onClose={onClose} onSaved={onSaved} initial={initial} initialName={initialName} /> : null
}

function ExerciseFormInner({ onClose, onSaved, initial, initialName }: { onClose: () => void; onSaved?: (e: Exercise) => void; initial?: Exercise; initialName: string }) {
  const [name, setName] = useState(initial?.name ?? initialName)
  const [muscle, setMuscle] = useState<Muscle>(initial?.muscle ?? 'Peito')
  const [equipment, setEquipment] = useState(initial?.equipment ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const save = () => {
    const ex: Exercise = { id: initial?.id ?? `cx-${uid()}`, name: name.trim(), muscle, equipment: equipment.trim(), notes: notes.trim(), custom: initial ? initial.custom : true }
    saveExercise(ex)
    onSaved?.(ex)
    onClose()
  }
  return (
    <Sheet
      open
      onClose={onClose}
      title={initial ? 'Editar exercício' : 'Novo exercício'}
      footer={
        <button className="btn primary block" disabled={!name.trim()} onClick={save}>
          Salvar
        </button>
      }
    >
      <label className="field">
        <span>Nome</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Remada articulada" autoFocus />
      </label>
      <label className="field">
        <span>Equipamento</span>
        <input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Barra, halteres, máquina…" />
      </label>
      <div className="field">
        <span>Grupo muscular</span>
        <div className="chips wrap">
          {MUSCLES.map((m) => (
            <button key={m} className={`chip${muscle === m ? ' on' : ''}`} onClick={() => setMuscle(m)}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span>Dicas de execução</span>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ajuste do banco, pegada, cadência…" />
      </label>
    </Sheet>
  )
}
