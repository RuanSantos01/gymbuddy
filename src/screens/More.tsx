import { useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { MenuItem, NumInput, Segmented, Stepper, Toggle, TopBar, useNav } from '../components/ui'
import { exportData, importData, resetData, updateSettings, useApp } from '../store'
import { download, fmt, fmtRest, fmtVolume, workoutVolume } from '../utils'
import { REST_OPTIONS } from './RoutineEditor'

export function MoreTab() {
  const nav = useNav()
  const { workouts, exercises, routines, body } = useApp()
  const totalVol = workouts.reduce((a, w) => a + workoutVolume(w), 0)
  const totalMin = workouts.reduce((a, w) => a + ((w.finishedAt ?? w.startedAt) - w.startedAt) / 60000, 0)
  return (
    <div className="page">
      <TopBar title="Mais" />
      <div className="grid3">
        <div className="stat">
          <span className="stat-label">Treinos</span>
          <strong>{workouts.length}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">Volume total</span>
          <strong>{fmtVolume(totalVol)}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">Horas</span>
          <strong>{fmt(totalMin / 60, 1)}</strong>
        </div>
      </div>
      <div className="card flush mt">
        <MenuItem icon="scale" label="Corpo e medidas" sub={`${body.length} registros`} onClick={() => nav.push({ name: 'body' })} />
        <MenuItem icon="calc" label="Ferramentas" sub="1RM, anilhas, aquecimento, timer" onClick={() => nav.push({ name: 'tools' })} />
        <MenuItem icon="dumbbell" label="Rotinas e exercícios" sub={`${routines.length} rotinas · ${exercises.length} exercícios`} onClick={() => nav.setTab('routines')} />
        <MenuItem icon="settings" label="Ajustes e backup" onClick={() => nav.push({ name: 'settings' })} />
      </div>
      <div className="card mt tips">
        <h3>
          <Icon name="info" size={18} /> Dicas
        </h3>
        <ul>
          <li>Toque no número da série para marcar aquecimento, drop set, falha ou RPE.</li>
          <li>Deixe os campos vazios e conclua a série: o app usa os valores sugeridos (em cinza).</li>
          <li>Toque na foto do exercício para ver a execução animada e a técnica escolhida.</li>
          <li>No menu do exercício, escolha a técnica: bi-set, drop-set, rest-pause, pirâmide e outras.</li>
          <li>Use o cronômetro na parte de baixo do treino para marcar quanto você descansou.</li>
          <li>Ao bater o topo da faixa de reps em todas as séries, o app sugere subir a carga.</li>
          <li>Adicione à tela inicial (Compartilhar → Adicionar à Tela de Início) para usar como app, inclusive offline.</li>
          <li>Os dados ficam só neste aparelho — faça backup em Ajustes de vez em quando.</li>
        </ul>
      </div>
    </div>
  )
}

export function SettingsScreen() {
  const { settings: s } = useApp()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  return (
    <div className="page">
      <TopBar back title="Ajustes" />
      <section className="card">
        <label className="field">
          <span>Seu nome</span>
          <input value={s.name} onChange={(e) => updateSettings({ name: e.target.value })} placeholder="Como quer ser chamado?" />
        </label>
        <label className="field">
          <span>Altura (cm) — para o IMC</span>
          <NumInput value={s.heightCm} onChange={(v) => updateSettings({ heightCm: v })} placeholder="175" />
        </label>
      </section>

      <h2 className="section-title">Treino</h2>
      <section className="card">
        <div className="setting-row">
          <span>Meta de treinos por semana</span>
          <Stepper value={s.weeklyGoal} min={1} max={14} onChange={(v) => updateSettings({ weeklyGoal: v })} />
        </div>
        <div className="setting-row">
          <span>Incremento de carga sugerido</span>
          <Stepper value={s.increment} min={0.5} max={10} step={0.5} format={(v) => `${fmt(v)} kg`} onChange={(v) => updateSettings({ increment: v })} />
        </div>
        <div className="setting-row">
          <span>Peso da barra</span>
          <Stepper value={s.barWeight} min={0} max={30} step={1} format={(v) => `${fmt(v)} kg`} onChange={(v) => updateSettings({ barWeight: v })} />
        </div>
        <div className="setting-block">
          <span>Controle do descanso</span>
          <Segmented
            value={s.restMode}
            onChange={(v) => updateSettings({ restMode: v })}
            options={[
              { value: 'manual', label: 'Cronômetro manual' },
              { value: 'auto', label: 'Contagem automática' },
            ]}
          />
          <small className="muted">
            {s.restMode === 'manual'
              ? 'Você inicia e marca o descanso. O tempo fica gravado em cada série.'
              : 'Ao concluir uma série, uma contagem regressiva começa sozinha.'}
          </small>
        </div>
        {s.restMode === 'manual' && <Toggle label="Iniciar cronômetro ao concluir série" checked={s.watchAutoStart} onChange={(v) => updateSettings({ watchAutoStart: v })} />}
        <div className="setting-row">
          <span>Descanso padrão</span>
          <select value={s.restDefault} onChange={(e) => updateSettings({ restDefault: +e.target.value })}>
            {REST_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {fmtRest(r)}
              </option>
            ))}
          </select>
        </div>
        <Toggle label="Som ao atingir o descanso" checked={s.sound} onChange={(v) => updateSettings({ sound: v })} />
        <Toggle label="Vibrar ao atingir o descanso" checked={s.vibrate} onChange={(v) => updateSettings({ vibrate: v })} />
        <Toggle label="Manter tela ligada durante o treino" checked={s.keepAwake} onChange={(v) => updateSettings({ keepAwake: v })} />
      </section>

      <h2 className="section-title">Backup</h2>
      <section className="card flush">
        <MenuItem icon="download" label="Exportar dados (JSON)" sub="Salve o arquivo no iCloud/Drive" onClick={() => download(`gymbuddy-backup-${new Date().toISOString().slice(0, 10)}.json`, exportData())} />
        <MenuItem icon="upload" label="Importar backup" sub="Substitui todos os dados atuais" onClick={() => file.current?.click()} />
        <MenuItem
          icon="trash"
          danger
          label="Apagar todos os dados"
          onClick={() => {
            if (confirm('Apagar TODOS os treinos, rotinas e medidas? Isso não pode ser desfeito.') && confirm('Tem certeza mesmo?')) {
              resetData()
              setMsg('Dados apagados.')
            }
          }}
        />
      </section>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          if (!confirm('Importar este backup e substituir os dados atuais?')) return
          try {
            importData(await f.text())
            setMsg('Backup importado com sucesso.')
          } catch (err) {
            setMsg(`Erro ao importar: ${(err as Error).message}`)
          }
        }}
      />
      {msg && <p className="card mt note">{msg}</p>}
      <p className="muted tiny center mt-lg">GymBuddy v1.1 · dados salvos localmente neste aparelho · imagens: free-exercise-db (domínio público)</p>
    </div>
  )
}
