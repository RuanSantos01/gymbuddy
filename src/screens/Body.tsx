import { useState } from 'react'
import { LineChart } from '../components/Charts'
import { Icon } from '../components/Icon'
import { Empty, NumInput, Segmented, Sheet, Stat, TopBar } from '../components/ui'
import { deleteBody, saveBody, useApp } from '../store'
import { MEASURES, type BodyEntry, type Measure } from '../types'
import { fmt, fmtDate, uid } from '../utils'

const toInputDate = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function bmiLabel(b: number) {
  if (b < 18.5) return 'abaixo do peso'
  if (b < 25) return 'normal'
  if (b < 30) return 'sobrepeso'
  return 'obesidade'
}

export function BodyScreen() {
  const { body, settings } = useApp()
  const [editing, setEditing] = useState<BodyEntry | null>(null)
  const [metric, setMetric] = useState<string>('weight')

  const latest = (k: 'weight' | 'bodyFat') => body.find((b) => b[k] != null)?.[k] ?? null
  const weight = latest('weight')
  const bf = latest('bodyFat')
  const bmi = weight && settings.heightCm ? weight / (settings.heightCm / 100) ** 2 : null
  const lean = weight && bf ? weight * (1 - bf / 100) : null

  const series = body
    .slice()
    .reverse()
    .map((b) => ({ x: b.date, y: metric === 'weight' ? b.weight : metric === 'bodyFat' ? b.bodyFat : b.measures[metric as Measure] }))
    .filter((p): p is { x: number; y: number } => p.y != null)

  const available = MEASURES.filter((m) => body.some((b) => b.measures[m] != null))

  return (
    <div className="page">
      <TopBar
        back
        title="Corpo e medidas"
        right={
          <button className="btn primary sm" onClick={() => setEditing({ id: uid(), date: Date.now(), weight: weight, bodyFat: null, measures: {} })}>
            <Icon name="plus" size={16} /> Registrar
          </button>
        }
      />
      {body.length === 0 ? (
        <Empty icon="scale" title="Nenhum registro" text="Acompanhe peso, % de gordura e circunferências para ver sua recomposição corporal." />
      ) : (
        <>
          <div className="grid2">
            <Stat label="Peso atual" value={weight != null ? `${fmt(weight)} kg` : '—'} accent />
            <Stat label="% gordura" value={bf != null ? `${fmt(bf)}%` : '—'} sub={lean ? `massa magra ${fmt(lean)} kg` : undefined} />
            <Stat label="IMC" value={bmi ? fmt(bmi) : '—'} sub={bmi ? bmiLabel(bmi) : 'defina a altura em Ajustes'} />
            <Stat label="Registros" value={body.length} sub={`desde ${fmtDate(body[body.length - 1].date, { day: '2-digit', month: 'short', year: '2-digit' })}`} />
          </div>

          <div className="chips scroll-x mt">
            {[['weight', 'Peso'], ['bodyFat', '% gordura'], ...available.map((m) => [m, m])].map(([k, l]) => (
              <button key={k} className={`chip${metric === k ? ' on' : ''}`} onClick={() => setMetric(k)}>
                {l}
              </button>
            ))}
          </div>
          <section className="card mt-sm">
            <LineChart points={series} color="var(--text)" unit={metric === 'bodyFat' ? '%' : metric === 'weight' ? 'kg' : 'cm'} />
          </section>

          <h2 className="section-title">Registros</h2>
          <div className="list card flush">
            {body.map((b) => (
              <button key={b.id} className="list-row" onClick={() => setEditing(structuredClone(b))}>
                <span className="grow">
                  {fmtDate(b.date)}
                  <small>
                    {[b.weight != null && `${fmt(b.weight)} kg`, b.bodyFat != null && `${fmt(b.bodyFat)}%`, ...Object.entries(b.measures).map(([k, v]) => `${k} ${fmt(v!)}`)]
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                </span>
                <Icon name="right" size={18} className="muted" />
              </button>
            ))}
          </div>
        </>
      )}

      {editing && <BodyForm entry={editing} onClose={() => setEditing(null)} isNew={!body.some((b) => b.id === editing.id)} />}
    </div>
  )
}

function BodyForm({ entry, onClose, isNew }: { entry: BodyEntry; onClose: () => void; isNew: boolean }) {
  const [b, setB] = useState(entry)
  const [tab, setTab] = useState<'basic' | 'measures'>('basic')
  return (
    <Sheet
      open
      onClose={onClose}
      title={isNew ? 'Novo registro' : 'Editar registro'}
      footer={
        <div className="row gap">
          {!isNew && (
            <button
              className="btn danger-ghost"
              onClick={() => {
                if (confirm('Excluir registro?')) {
                  deleteBody(b.id)
                  onClose()
                }
              }}
            >
              <Icon name="trash" size={18} />
            </button>
          )}
          <button
            className="btn primary grow"
            onClick={() => {
              saveBody(b)
              onClose()
            }}
          >
            Salvar
          </button>
        </div>
      }
    >
      <label className="field">
        <span>Data</span>
        <input
          type="date"
          value={toInputDate(b.date)}
          onChange={(e) => {
            const [y, m, d] = e.target.value.split('-').map(Number)
            if (y) setB({ ...b, date: new Date(y, m - 1, d, 12).getTime() })
          }}
        />
      </label>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'basic', label: 'Peso e gordura' },
          { value: 'measures', label: 'Medidas (cm)' },
        ]}
      />
      {tab === 'basic' ? (
        <div className="grid2 mt">
          <label className="field">
            <span>Peso (kg)</span>
            <NumInput value={b.weight} onChange={(v) => setB({ ...b, weight: v })} placeholder="0,0" />
          </label>
          <label className="field">
            <span>% gordura</span>
            <NumInput value={b.bodyFat} onChange={(v) => setB({ ...b, bodyFat: v })} placeholder="opcional" />
          </label>
        </div>
      ) : (
        <div className="grid2 mt">
          {MEASURES.map((m) => (
            <label key={m} className="field">
              <span>{m}</span>
              <NumInput
                value={b.measures[m]}
                placeholder="cm"
                onChange={(v) => {
                  const measures = { ...b.measures }
                  if (v == null) delete measures[m]
                  else measures[m] = v
                  setB({ ...b, measures })
                }}
              />
            </label>
          ))}
        </div>
      )}
      <label className="field">
        <span>Observações</span>
        <input value={b.notes ?? ''} onChange={(e) => setB({ ...b, notes: e.target.value })} placeholder="Em jejum, pós-treino…" />
      </label>
    </Sheet>
  )
}
