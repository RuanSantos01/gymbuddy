import { useState } from 'react'
import { CADENCES, TECH, TECHNIQUES } from '../data/techniques'
import type { Technique } from '../types'
import { Sheet } from './ui'

/** Selo curto da técnica (não aparece para "tradicional"). */
export function TechBadge({ t, onClick }: { t?: Technique; onClick?: () => void }) {
  if (!t || t === 'tradicional') return null
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag className="tech-badge" onClick={onClick} title={TECH[t].label}>
      {TECH[t].code}
    </Tag>
  )
}

export function TechniquePicker({
  open,
  value,
  cadence,
  onClose,
  onChange,
}: {
  open: boolean
  value?: Technique
  cadence?: string
  onClose: () => void
  onChange: (t: Technique, cadence: string | undefined) => void
}) {
  const [t, setT] = useState<Technique>(value ?? 'tradicional')
  const [c, setC] = useState(cadence ?? '')
  if (!open) return null
  const info = TECH[t]
  return (
    <Sheet
      open
      onClose={onClose}
      title="Técnica de execução"
      footer={
        <button
          className="btn primary block"
          onClick={() => {
            onChange(t, c.trim() || undefined)
            onClose()
          }}
        >
          Aplicar {info.label}
        </button>
      }
    >
      <div className="tech-grid">
        {TECHNIQUES.map((x) => (
          <button key={x.id} className={`tech-opt${t === x.id ? ' on' : ''}`} onClick={() => setT(x.id)}>
            <b>{x.code}</b>
            <span>{x.label}</span>
          </button>
        ))}
      </div>
      <div className="tech-how">
        <span className="label">Como fazer</span>
        <p>{info.how}</p>
        {info.group && <p className="muted tiny">Liga este exercício aos {info.group - 1 === 1 ? 'próximo' : `${info.group - 1} próximos`} da lista. O descanso só começa ao fim do bloco.</p>}
      </div>
      <div className="field mt">
        <span>Cadência (excêntrica-pausa-concêntrica-pausa)</span>
        <div className="chips wrap">
          <button className={`chip${!c ? ' on' : ''}`} onClick={() => setC('')}>
            Livre
          </button>
          {CADENCES.map((x) => (
            <button key={x} className={`chip mono${c === x ? ' on' : ''}`} onClick={() => setC(x)}>
              {x}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}
