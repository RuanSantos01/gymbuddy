import { useEffect, useState } from 'react'
import type { Workout, WorkoutSet } from './types'

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5)

export const DAY = 86_400_000
export const WEEK = 7 * DAY

/** Estimated 1RM (Epley). */
export const e1rm = (w: number, r: number) => (r <= 0 || w <= 0 ? 0 : r === 1 ? w : w * (1 + r / 30))

export const fmt = (n: number, d = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: d })

export const fmtKg = (n: number | null | undefined) => (n == null ? '—' : `${fmt(n)} kg`)

export const fmtVolume = (n: number) => (n >= 10000 ? `${fmt(n / 1000, 1)} t` : `${fmt(Math.round(n), 0)} kg`)

export const fmtInput = (n: number) => String(n).replace('.', ',')

export const parseNum = (s: string): number | null => {
  if (!s.trim()) return null
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function fmtDuration(ms: number) {
  const min = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}min`
}

export function fmtClock(sec: number) {
  sec = Math.max(0, Math.round(sec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const mm = String(m).padStart(h ? 2 : 1, '0')
  return `${h ? h + ':' : ''}${mm}:${String(s).padStart(2, '0')}`
}

export const fmtRest = (sec: number) => (sec >= 60 ? `${Math.floor(sec / 60)}min${sec % 60 ? ` ${sec % 60}s` : ''}` : `${sec}s`)

export const fmtDate = (ts: number, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(ts).toLocaleDateString('pt-BR', opts).replace(/\./g, '')

export const fmtShortDate = (ts: number) => fmtDate(ts, { day: '2-digit', month: '2-digit' })

export function relDays(ts: number) {
  const d = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / DAY)
  if (d <= 0) return 'hoje'
  if (d === 1) return 'ontem'
  if (d < 7) return `há ${d} dias`
  if (d < 30) return `há ${Math.floor(d / 7)} sem`
  return `há ${Math.floor(d / 30)} mês${d >= 60 ? 'es' : ''}`
}

export function startOfDay(ts: number) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Monday 00:00 of the week containing ts. */
export function startOfWeek(ts: number) {
  const d = new Date(startOfDay(ts))
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

export const dayKey = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export const isWorking = (s: WorkoutSet) => s.type !== 'warmup'

export function setVolume(s: WorkoutSet) {
  return isWorking(s) ? (s.weight ?? 0) * (s.reps ?? 0) : 0
}

export function workoutVolume(w: Workout) {
  return w.exercises.reduce((a, e) => a + e.sets.reduce((b, s) => b + (s.done ? setVolume(s) : 0), 0), 0)
}

export function workoutSets(w: Workout) {
  return w.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done && isWorking(s)).length, 0)
}

export function useNow(interval = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}

let audio: AudioContext | null = null
export function unlockAudio() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audio ??= new Ctx()
    if (audio.state === 'suspended') void audio.resume()
  } catch {
    /* sem áudio */
  }
}

export function beep() {
  if (!audio) return
  const ctx = audio
  ;[0, 0.28, 0.56].forEach((t, i) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = i === 2 ? 1175 : 880
    const at = ctx.currentTime + t
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(0.35, at + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.2)
    o.connect(g).connect(ctx.destination)
    o.start(at)
    o.stop(at + 0.22)
  })
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* noop */
  }
}

export function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
