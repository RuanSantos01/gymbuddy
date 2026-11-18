import { useEffect, useState } from 'react'
import { exerciseImages } from '../data/seed'
import type { Exercise } from '../types'

const monogram = (ex?: Exercise) =>
  (ex?.name ?? '?')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?'

/** Miniatura do exercício (posição inicial). Sem foto, mostra um monograma. */
export function ExThumb({ ex, size = 48, onClick }: { ex?: Exercise; size?: number; onClick?: () => void }) {
  const imgs = ex ? exerciseImages(ex.id) : null
  const [broken, setBroken] = useState(false)
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag className="ex-thumb" style={{ width: size, height: size }} onClick={onClick} aria-label={onClick ? 'Ver execução' : undefined}>
      {imgs && !broken ? <img src={imgs[1]} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} /> : <b>{monogram(ex)}</b>}
    </Tag>
  )
}

/** Execução animada: alterna início e fim do movimento. Toque para pausar. */
export function ExMotion({ ex }: { ex?: Exercise }) {
  const imgs = ex ? exerciseImages(ex.id) : null
  const [frame, setFrame] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (!imgs || paused) return
    const t = setInterval(() => setFrame((f) => 1 - f), 1100)
    return () => clearInterval(t)
  }, [imgs, paused])
  if (!imgs)
    return (
      <div className="ex-motion empty-motion">
        <b>{monogram(ex)}</b>
        <small>Sem imagem para exercícios criados por você</small>
      </div>
    )
  return (
    <button className="ex-motion" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Retomar animação' : 'Pausar animação'}>
      {imgs.map((src, i) => (
        <img key={src} src={src} alt="" className={i === frame ? 'on' : ''} />
      ))}
      <span className="motion-tag">
        <i className={frame === 0 ? 'on' : ''}>Início</i>
        <i className={frame === 1 ? 'on' : ''}>Fim</i>
        {paused && <em>pausado</em>}
      </span>
    </button>
  )
}
